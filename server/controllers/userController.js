import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import { supabase } from '../config/supabase.js';
import ApiError from "../utils/ApiError.js"
import catchAsync from "../utils/catchAsync.js"

export const getUserData = catchAsync(async (req, res) => {
    const userId = String(req.auth?.userId);
    
    // Try getting user with educator profile
    const { data: user, error } = await supabase
        .from('users')
        .select('*, educators(*)')
        .eq('id', userId)
        .single();

    if (error || !user) {
        // Try getting admin
        const { data: admin } = await supabase
            .from('admins')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (admin) {
            return res.json({ 
                success: true, 
                user: { ...admin, role: 'admin', is_verified: true } 
            });
        }
        throw new ApiError(404, 'User Not Found');
    }

    res.json({ success: true, user });
});

export const purchaseCourse = catchAsync(async (req, res) => {
    const { courseId } = req.body;
    const userId = req.auth.userId;

    // Check course, user and existing enrollment
    const { data: course } = await supabase.from('courses').select('*').eq('id', courseId).single();
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    const { data: existing } = await supabase.from('enrollments').select('*').eq('user_id', userId).eq('course_id', courseId).single();

    if (!user || !course) throw new ApiError(404, 'User or Course not found');
    if (existing) throw new ApiError(409, 'Already enrolled');

    const price = Math.max(0, parseFloat((course.course_price * (1 - course.discount / 100)).toFixed(2)));
    const commission = parseFloat((price * 0.15).toFixed(2));
    const educatorAmount = parseFloat((price - commission).toFixed(2));

    // Insert purchase
    const { error: purchaseError } = await supabase
        .from('purchases')
        .insert([{ 
            course_id: course.id, 
            user_id: userId, 
            amount: price, 
            commission_amount: commission, 
            educator_amount: educatorAmount, 
            status: "completed" 
        }]);
    
    if (purchaseError) throw purchaseError;

    // Update revenue
    const { data: revenue } = await supabase.from('revenue_tracking').select('*').limit(1).single();
    if (revenue) {
        await supabase
            .from('revenue_tracking')
            .update({
                total_revenue: (parseFloat(revenue.total_revenue) + price).toFixed(2),
                total_commission: (parseFloat(revenue.total_commission) + commission).toFixed(2),
                total_educator_earnings: (parseFloat(revenue.total_educator_earnings) + educatorAmount).toFixed(2)
            })
            .eq('id', revenue.id);
    } else {
        await supabase
            .from('revenue_tracking')
            .insert([{
                total_revenue: price.toFixed(2),
                total_commission: commission.toFixed(2),
                total_educator_earnings: educatorAmount.toFixed(2)
            }]);
    }

    // Create Enrollment
    const { error: enrollError } = await supabase
        .from('enrollments')
        .insert([{ user_id: userId, course_id: courseId }]);

    if (enrollError) throw enrollError;

    res.status(201).json({ success: true, message: 'Enrollment Successful' });
});

export const userEnrolledCourses = catchAsync(async (req, res) => {
    const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
            course_id,
            courses (
                *,
                chapters (
                    *,
                    lectures (*)
                )
            )
        `)
        .eq('user_id', req.auth.userId);

    if (error) throw error;

    const enrolledCourses = enrollments.map(e => e.courses).filter(Boolean);
    res.json({ success: true, enrolledCourses });
});

export const updateUserCourseProgress = catchAsync(async (req, res) => {
    const { courseId, lectureId } = req.body;
    const userId = req.auth.userId;

    if (!courseId || !lectureId) throw new ApiError(400, 'CourseId and LectureId are required');

    // findOrCreate progress
    let { data: progress } = await supabase
        .from('course_progresses')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

    if (!progress) {
        const { data: newProgress, error: createError } = await supabase
            .from('course_progresses')
            .insert([{ user_id: userId, course_id: courseId }])
            .select()
            .single();
        if (createError) throw createError;
        progress = newProgress;
    }
    
    // Check if already completed
    const { data: existing } = await supabase
        .from('lecture_completions')
        .select('*')
        .eq('progress_id', progress.id)
        .eq('lecture_id', lectureId)
        .single();

    if (existing) {
        return res.json({ success: true, message: 'Already Completed', alreadyDone: true });
    }

    const today = new Date().toISOString().split('T')[0];
    await supabase
        .from('lecture_completions')
        .insert([{ 
            progress_id: progress.id, 
            lecture_id: lectureId, 
            status: 'completed',
            completion_date: today
        }]);

    // Update global user activity for streak
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    if (user) {
        const completedDates = user.completed_dates || [];
        if (!completedDates.includes(today)) {
            const lastActive = user.last_active_date ? new Date(user.last_active_date).toISOString().split('T')[0] : null;
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const newStreak = lastActive === yesterday ? (user.streak || 0) + 1 : 1;
            
            await supabase
                .from('users')
                .update({
                    streak: newStreak,
                    completed_dates: [...completedDates, today],
                    last_active_date: new Date().toISOString()
                })
                .eq('id', userId);
        }
    }
    
    // Get all completed lectures for response
    const { data: allCompleted } = await supabase
        .from('lecture_completions')
        .select('lecture_id')
        .eq('progress_id', progress.id);

    res.json({ 
        success: true, 
        message: 'Progress Updated', 
        completedLectures: allCompleted.map(l => l.lecture_id) 
    });
});

export const getUserCourseProgress = catchAsync(async (req, res) => {
    const { data: progress } = await supabase
        .from('course_progresses')
        .select('*, lecture_completions(*)')
        .eq('user_id', String(req.auth.userId))
        .eq('course_id', String(req.body.courseId))
        .single();

    res.json({ 
        success: true, 
        progressData: progress ? { 
            ...progress, 
            lectureCompleted: progress.lecture_completions.map(l => l.lecture_id) 
        } : null 
    });
});

export const addUserRating = catchAsync(async (req, res) => {
    const { courseId, rating } = req.body;
    const userId = req.auth.userId;

    if (!rating || rating < 1 || rating > 5) throw new ApiError(400, 'Invalid rating (1-5 only)');
    
    // Validate Enrollment
    const { data: enrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

    if (!enrollment) {
        throw new ApiError(403, 'Must purchase before rating');
    }

    const { data: existingRating } = await supabase
        .from('ratings')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

    if (existingRating) {
        await supabase
            .from('ratings')
            .update({ rating })
            .eq('id', existingRating.id);
    } else {
        await supabase
            .from('ratings')
            .insert([{ user_id: userId, course_id: courseId, rating }]);
    }

    // Atomic update of Course average rating
    const { data: allRatings } = await supabase
        .from('ratings')
        .select('rating')
        .eq('course_id', courseId);

    const count = allRatings.length;
    const sum = allRatings.reduce((acc, r) => acc + r.rating, 0);
    const average = parseFloat((sum / count).toFixed(1));

    await supabase
        .from('courses')
        .update({ rating_average: average, rating_count: count })
        .eq('id', courseId);

    res.json({ 
        success: true, 
        message: 'Rating processed successfully', 
        ratingAverage: average, 
        ratingCount: count,
        userRating: rating
    });
});

export const markLectureComplete = catchAsync(async (req, res) => {
    const userId = req.auth.userId;
    const today = new Date().toISOString().split('T')[0];
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!user) throw new ApiError(404, 'User not found');

    const completedDates = user.completed_dates || [];
    if (!completedDates.includes(today)) {
        const lastActive = user.last_active_date ? new Date(user.last_active_date).toISOString().split('T')[0] : null;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const newStreak = lastActive === yesterday ? (user.streak || 0) + 1 : 1;
        const newCompletedDates = [...completedDates, today];
        
        await supabase
            .from('users')
            .update({
                streak: newStreak,
                completed_dates: newCompletedDates,
                last_active_date: new Date().toISOString()
            })
            .eq('id', userId);

        return res.json({ success: true, streak: newStreak, completedDates: newCompletedDates });
    }
    res.json({ success: true, streak: user.streak, completedDates: user.completed_dates });
});

export const updateProfileImage = catchAsync(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'Please upload an image');
    
    try {

        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'lms_profiles', width: 500, crop: "scale" });
        
        await supabase
            .from('users')
            .update({ image_url: result.secure_url })
            .eq('id', req.auth.userId);

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.json({ success: true, message: 'Image updated', imageUrl: result.secure_url });
    } catch (error) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        throw new ApiError(500, 'Upload failed');
    }
});
