import { uploadBuffer } from '../utils/uploadToCloudinary.js';
import { supabase } from '../config/supabase.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

export const updateRoleToEducator = catchAsync(async (req, res) => {
    const userId = req.auth.userId;

    const { data: user } = await supabase.from('users').select('id, role').eq('id', userId).single();
    if (!user) throw new ApiError(404, 'User not found');

    let { data: profile } = await supabase.from('educators').select('*').eq('userid', userId).maybeSingle();

    if (!profile) {
        const { data: newProfile, error } = await supabase
            .from('educators')
            .insert([{ userid: userId, status: 'pending' }])
            .select()
            .single();
        if (error) throw error;
        profile = newProfile;
    }

    if (profile.status === 'active') {
        if (user.role !== 'educator') {
            await supabase.from('users').update({ role: 'educator' }).eq('id', userId);
        }
        return res.json({ success: true, message: 'Active' });
    }
    if (profile.status === 'pending') throw new ApiError(403, 'Under review');
    if (profile.status === 'rejected') throw new ApiError(403, 'Rejected');

    res.json({ success: true, message: 'Awaiting approval' });
});

export const addCourse = catchAsync(async (req, res) => {
    const { courseData } = req.body;
    const files = req.files || [];
    const parsed = JSON.parse(courseData);
    const userId = req.auth.userId;

    const thumb = files.find(f => f.fieldname === 'courseThumbnail' || f.fieldname === 'image');
    if (thumb) {
        const result = await uploadBuffer(thumb.buffer);
        parsed.coursethumbnail = result.secure_url;
    }

    const { courseContent, ...fields } = parsed;
    const courseFields = {
        coursetitle: fields.courseTitle,
        coursedescription: fields.courseDescription,
        courseprice: fields.coursePrice,
        discount: fields.discount ?? 0,
        coursethumbnail: parsed.coursethumbnail || fields.courseThumbnail || null,
        ispublished: fields.isPublished ?? false,
        category: fields.category,
        educator_id: userId,
        // level and language kept as-is; add to schema if needed
    };

    const { data: newCourse, error: courseError } = await supabase
        .from('courses')
        .insert([courseFields])
        .select()
        .single();

    if (courseError) throw courseError;

    for (const [cIdx, ch] of (courseContent || []).entries()) {
        const { data: chapter, error: chapterError } = await supabase
            .from('chapters')
            .insert([{
                courseid: newCourse.id,
                chaptertitle: ch.chapterTitle,
                chapterorder: ch.chapterOrder ?? cIdx,
            }])
            .select()
            .single();

        if (chapterError) throw chapterError;

        for (const [lIdx, lec] of (ch.chapterContent || []).entries()) {
            const lecFile = files.find(f => f.fieldname === `lectureFile_${cIdx}_${lIdx}`);
            let url = lec.lectureUrl ?? null;
            if (lecFile) {
                const result = await uploadBuffer(lecFile.buffer, { resource_type: 'auto' });
                url = result.secure_url;
            }

            await supabase.from('lectures').insert([{
                chapterid: chapter.id,
                lecturetitle: lec.lectureTitle,
                lectureduration: lec.lectureDuration ?? null,
                lectureurl: url,
                ispreviewfree: lec.isPreview ?? false,
                lectureorder: lec.lectureOrder ?? lIdx,
            }]);
        }
    }

    res.status(201).json({ success: true, data: newCourse });
});

export const updateCourse = catchAsync(async (req, res) => {
    const userId = req.auth.userId;
    const { data: course } = await supabase
        .from('courses')
        .select('*')
        .eq('id', req.params.id)
        .eq('educator_id', userId)
        .single();

    if (!course) throw new ApiError(404, 'Course not found');

    const files = req.files || [];
    const parsed = req.body.courseData ? JSON.parse(req.body.courseData) : {};

    const thumb = files.find(f => f.fieldname === 'courseThumbnail' || f.fieldname === 'image');
    if (thumb) {
        const result = await uploadBuffer(thumb.buffer);
        parsed.coursethumbnail = result.secure_url;
    }

    const { courseContent, ...fields } = parsed;
    const updateFields = {};
    if (fields.courseTitle) updateFields.coursetitle = fields.courseTitle;
    if (fields.courseDescription) updateFields.coursedescription = fields.courseDescription;
    if (fields.coursePrice !== undefined) updateFields.courseprice = fields.coursePrice;
    if (fields.discount !== undefined) updateFields.discount = fields.discount;
    if (parsed.coursethumbnail) updateFields.coursethumbnail = parsed.coursethumbnail;
    if (fields.isPublished !== undefined) updateFields.ispublished = fields.isPublished;
    if (fields.category) updateFields.category = fields.category;

    await supabase.from('courses').update(updateFields).eq('id', course.id);

    if (courseContent) {
        const { data: chapters } = await supabase.from('chapters').select('id').eq('courseid', course.id);
        if (chapters && chapters.length) {
            const chapterIds = chapters.map(c => c.id);
            await supabase.from('lectures').delete().in('chapterid', chapterIds);
            await supabase.from('chapters').delete().eq('courseid', course.id);
        }

        for (const [cIdx, ch] of courseContent.entries()) {
            const { data: chapter } = await supabase
                .from('chapters')
                .insert([{
                    courseid: course.id,
                    chaptertitle: ch.chapterTitle,
                    chapterorder: ch.chapterOrder ?? cIdx,
                }])
                .select()
                .single();

            for (const [lIdx, lec] of (ch.chapterContent || []).entries()) {
                await supabase.from('lectures').insert([{
                    chapterid: chapter.id,
                    lecturetitle: lec.lectureTitle,
                    lectureduration: lec.lectureDuration ?? null,
                    lectureurl: lec.lectureUrl ?? null,
                    ispreviewfree: lec.isPreview ?? false,
                    lectureorder: lec.lectureOrder ?? lIdx,
                }]);
            }
        }
    }

    res.json({ success: true, data: { ...course, ...updateFields } });
});

export const deleteCourse = catchAsync(async (req, res) => {
    const userId = req.auth.userId;
    const { data: course } = await supabase
        .from('courses')
        .select('id')
        .eq('id', req.params.id)
        .eq('educator_id', userId)
        .single();

    if (!course) throw new ApiError(404, 'Course not found');

    const { data: chapters } = await supabase.from('chapters').select('id').eq('courseid', course.id);
    if (chapters && chapters.length) {
        const chapterIds = chapters.map(c => c.id);
        await supabase.from('lectures').delete().in('chapterid', chapterIds);
        await supabase.from('chapters').delete().eq('courseid', course.id);
    }
    await supabase.from('courses').delete().eq('id', course.id);

    res.json({ success: true, message: 'Course deleted successfully' });
});

export const getEducatorCourses = catchAsync(async (req, res) => {
    const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .eq('educator_id', req.auth.userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, courses });
});

export const educatorDashboardData = catchAsync(async (req, res) => {
    const educatorId = req.auth.userId;
    const { data: courses } = await supabase.from('courses').select('id').eq('educator_id', educatorId);

    if (!courses || !courses.length) {
        return res.json({
            success: true,
            dashboardData: { totalEarnings: 0, enrolledStudentsData: [], totalCourses: 0, totalStudents: 0, totalFollowers: 0 },
        });
    }

    const ids = courses.map(c => c.id);

    const { data: purchases } = await supabase
        .from('purchases')
        .select('educatoramount')
        .in('courseid', ids)
        .eq('status', 'completed');

    const { data: studentDetails } = await supabase
        .from('purchases')
        .select(`
            courseid,
            courses (coursetitle),
            users (id, name, imageUrl)
        `)
        .in('courseid', ids)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

    const { data: profile } = await supabase
        .from('educators')
        .select('id')
        .eq('userid', educatorId)
        .maybeSingle();

    const totalEarnings = parseFloat(
        (purchases || []).reduce((s, p) => s + parseFloat(p.educatoramount ?? 0), 0).toFixed(2)
    );

    res.json({
        success: true,
        dashboardData: {
            totalEarnings,
            enrolledStudentsData: (studentDetails || []).map(p => ({
                courseTitle: p.courses?.coursetitle ?? 'N/A',
                student: p.users,
            })),
            totalCourses: courses.length,
            totalStudents: (purchases || []).length,
            totalFollowers: 0,
        },
    });
});

export const getEnrolledStudentsData = catchAsync(async (req, res) => {
    const educatorId = req.auth.userId;
    const { data: courses } = await supabase.from('courses').select('id').eq('educator_id', educatorId);

    if (!courses || !courses.length) {
        return res.json({ success: true, enrolledStudents: [] });
    }

    const { data: purchases } = await supabase
        .from('purchases')
        .select(`
            created_at,
            courses (coursetitle),
            users (id, name, imageUrl)
        `)
        .in('courseid', courses.map(c => c.id))
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

    res.json({
        success: true,
        enrolledStudents: (purchases || []).map(p => ({
            student: p.users,
            courseTitle: p.courses?.coursetitle ?? 'N/A',
            purchaseDate: p.created_at,
        })),
    });
});

export const getPublicEducatorProfile = catchAsync(async (req, res) => {
    const id = req.params.id;

    const { data: user } = await supabase
        .from('users')
        .select('id, name, imageUrl')
        .eq('id', id)
        .single();

    if (!user) throw new ApiError(404, 'Educator not found');

    const { data: profile } = await supabase
        .from('educators')
        .select('bio, experience, qualification, status')
        .eq('userid', id)
        .maybeSingle();

    const { data: courses } = await supabase
        .from('courses')
        .select(`
            id, coursetitle, courseprice, discount, coursethumbnail, category,
            educatorDetails:users (id, name, imageUrl)
        `)
        .eq('educator_id', id)
        .eq('ispublished', true)
        .order('created_at', { ascending: false });

    res.json({
        success: true,
        data: {
            id: user.id,
            name: user.name,
            imageUrl: user.imageUrl ?? null,
            bio: profile?.bio ?? 'Experienced educator.',
            experience: profile?.experience ?? 0,
            qualification: profile?.qualification ?? '',
            courses: courses ?? [],
            educator: profile ?? {},
        },
    });
});
