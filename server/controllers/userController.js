import { uploadBuffer } from '../utils/uploadToCloudinary.js';
import { supabase } from '../config/supabase.js';
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";

export const getUserData = catchAsync(async (req, res) => {
    const userId = String(req.auth?.userId);

    const { data: user, error } = await supabase
        .from('users')
        .select('*, educators(*)')
        .eq('id', userId)
        .maybeSingle();

    if (error || !user) {
        const { data: admin } = await supabase
            .from('admins')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (admin) {
            return res.json({
                success: true,
                user: { ...admin, role: 'admin', isverified: true },
            });
        }
        throw new ApiError(404, 'User Not Found');
    }

    res.json({ success: true, user });
});

export const purchaseCourse = catchAsync(async (req, res) => {
    const { courseId } = req.body;
    const userId = req.auth.userId;

    const { data: course } = await supabase.from('courses').select('*').eq('id', courseId).single();
    const { data: user } = await supabase.from('users').select('id').eq('id', userId).single();
    const { data: existing } = await supabase
        .from('enrollments')
        .select('id')
        .eq('userid', userId)
        .eq('courseid', courseId)
        .maybeSingle();

    if (!user || !course) throw new ApiError(404, 'User or Course not found');
    if (existing) throw new ApiError(409, 'Already enrolled');

    const price = Math.max(0, parseFloat(((course.courseprice ?? 0) * (1 - (course.discount ?? 0) / 100)).toFixed(2)));
    const commission = parseFloat((price * 0.15).toFixed(2));
    const educatorAmount = parseFloat((price - commission).toFixed(2));

    const { error: purchaseError } = await supabase
        .from('purchases')
        .insert([{
            courseid: course.id,
            userid: userId,
            amount: price,
            commissionamount: commission,
            educatoramount: educatorAmount,
            status: 'completed',
        }]);

    if (purchaseError) throw purchaseError;

    // Update revenue
    const { data: revenue } = await supabase.from('revenue_tracking').select('*').limit(1).maybeSingle();
    if (revenue) {
        await supabase
            .from('revenue_tracking')
            .update({
                total_revenue: (parseFloat(revenue.total_revenue) + price).toFixed(2),
                total_commission: (parseFloat(revenue.total_commission) + commission).toFixed(2),
                total_educator_earnings: (parseFloat(revenue.total_educator_earnings) + educatorAmount).toFixed(2),
            })
            .eq('id', revenue.id);
    } else {
        await supabase
            .from('revenue_tracking')
            .insert([{
                total_revenue: price.toFixed(2),
                total_commission: commission.toFixed(2),
                total_educator_earnings: educatorAmount.toFixed(2),
            }]);
    }

    const { error: enrollError } = await supabase
        .from('enrollments')
        .insert([{ userid: userId, courseid: courseId }]);

    if (enrollError) throw enrollError;

    res.status(201).json({ success: true, message: 'Enrollment Successful' });
});

export const userEnrolledCourses = catchAsync(async (req, res) => {
    const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
            courseid,
            courses (
                *,
                chapters (
                    *,
                    lectures (*)
                )
            )
        `)
        .eq('userid', req.auth.userId);

    if (error) throw error;

    const enrolledCourses = enrollments.map(e => e.courses).filter(Boolean);
    res.json({ success: true, enrolledCourses });
});

export const updateUserCourseProgress = catchAsync(async (req, res) => {
    const { courseId, lectureId } = req.body;
    const userId = req.auth.userId;

    if (!courseId || !lectureId) throw new ApiError(400, 'CourseId and LectureId are required');

    let { data: progress } = await supabase
        .from('course_progresses')
        .select('*')
        .eq('userid', userId)
        .eq('courseid', courseId)
        .maybeSingle();

    if (!progress) {
        const { data: newProgress, error: createError } = await supabase
            .from('course_progresses')
            .insert([{ userid: userId, courseid: courseId }])
            .select()
            .single();
        if (createError) throw createError;
        progress = newProgress;
    }

    const { data: existing } = await supabase
        .from('lecture_completions')
        .select('id')
        .eq('progressid', progress.id)
        .eq('lectureid', lectureId)
        .maybeSingle();

    if (existing) {
        return res.json({ success: true, message: 'Already Completed', alreadyDone: true });
    }

    const today = new Date().toISOString().split('T')[0];
    await supabase
        .from('lecture_completions')
        .insert([{
            progressid: progress.id,
            lectureid: lectureId,
            status: 'completed',
            completiondate: today,
        }]);

    // Update global user activity for streak
    const { data: user } = await supabase.from('users').select('streak, completeddates, lastactivedate').eq('id', userId).single();
    if (user) {
        const completedDates = user.completeddates ?? [];
        if (!completedDates.includes(today)) {
            const lastActive = user.lastactivedate
                ? new Date(user.lastactivedate).toISOString().split('T')[0]
                : null;
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const newStreak = lastActive === yesterday ? (user.streak ?? 0) + 1 : 1;

            await supabase
                .from('users')
                .update({
                    streak: newStreak,
                    completeddates: [...completedDates, today],
                    lastactivedate: new Date().toISOString(),
                })
                .eq('id', userId);
        }
    }

    const { data: allCompleted } = await supabase
        .from('lecture_completions')
        .select('lectureid')
        .eq('progressid', progress.id);

    res.json({
        success: true,
        message: 'Progress Updated',
        completedLectures: (allCompleted ?? []).map(l => l.lectureid),
    });
});

export const getUserCourseProgress = catchAsync(async (req, res) => {
    const { data: progress } = await supabase
        .from('course_progresses')
        .select('*, lecture_completions(*)')
        .eq('userid', String(req.auth.userId))
        .eq('courseid', String(req.body.courseId))
        .maybeSingle();

    res.json({
        success: true,
        progressData: progress
            ? {
                  ...progress,
                  lectureCompleted: (progress.lecture_completions ?? []).map(l => l.lectureid),
              }
            : null,
    });
});

export const addUserRating = catchAsync(async (req, res) => {
    const { courseId, rating } = req.body;
    const userId = req.auth.userId;

    if (!rating || rating < 1 || rating > 5) throw new ApiError(400, 'Invalid rating (1-5 only)');

    const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('userid', userId)
        .eq('courseid', courseId)
        .maybeSingle();

    if (!enrollment) throw new ApiError(403, 'Must purchase before rating');

    const { data: existingRating } = await supabase
        .from('ratings')
        .select('id')
        .eq('userid', userId)
        .eq('courseid', courseId)
        .maybeSingle();

    if (existingRating) {
        await supabase.from('ratings').update({ rating }).eq('id', existingRating.id);
    } else {
        await supabase.from('ratings').insert([{ userid: userId, courseid: courseId, rating }]);
    }

    const { data: allRatings } = await supabase
        .from('ratings')
        .select('rating')
        .eq('courseid', courseId);

    const count = (allRatings ?? []).length;
    const sum = (allRatings ?? []).reduce((acc, r) => acc + r.rating, 0);
    const average = count > 0 ? parseFloat((sum / count).toFixed(1)) : 0;

    await supabase
        .from('courses')
        .update({ ratingaverage: average, ratingcount: count })
        .eq('id', courseId);

    res.json({
        success: true,
        message: 'Rating processed successfully',
        ratingAverage: average,
        ratingCount: count,
        userRating: rating,
    });
});

export const markLectureComplete = catchAsync(async (req, res) => {
    const userId = req.auth.userId;
    const today = new Date().toISOString().split('T')[0];
    const { data: user } = await supabase
        .from('users')
        .select('streak, completeddates, lastactivedate')
        .eq('id', userId)
        .single();
    if (!user) throw new ApiError(404, 'User not found');

    const completedDates = user.completeddates ?? [];
    if (!completedDates.includes(today)) {
        const lastActive = user.lastactivedate
            ? new Date(user.lastactivedate).toISOString().split('T')[0]
            : null;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const newStreak = lastActive === yesterday ? (user.streak ?? 0) + 1 : 1;
        const newCompletedDates = [...completedDates, today];

        await supabase
            .from('users')
            .update({
                streak: newStreak,
                completeddates: newCompletedDates,
                lastactivedate: new Date().toISOString(),
            })
            .eq('id', userId);

        return res.json({ success: true, streak: newStreak, completedDates: newCompletedDates });
    }
    res.json({ success: true, streak: user.streak ?? 0, completedDates: user.completeddates ?? [] });
});

export const updateProfileImage = catchAsync(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'Please upload an image');

    const result = await uploadBuffer(req.file.buffer, {
        folder: 'lms_profiles',
        width: 500,
        crop: 'scale',
    });

    await supabase
        .from('users')
        .update({ imageUrl: result.secure_url })
        .eq('id', req.auth.userId);

    res.json({ success: true, message: 'Image updated', imageUrl: result.secure_url });
});
