import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import { supabase } from '../config/supabase.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

export const updateRoleToEducator = catchAsync(async (req, res) => {
    const userId = req.auth.userId;
    
    // Check user and educator profile
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!user) throw new ApiError(404, 'User not found');

    let { data: profile } = await supabase.from('educators').select('*').eq('user_id', userId).single();
    
    if (!profile) {
        const { data: newProfile, error } = await supabase
            .from('educators')
            .insert([{ user_id: userId, status: 'pending' }])
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
        const result = await cloudinary.uploader.upload(thumb.path);
        parsed.course_thumbnail = result.secure_url;
        if (fs.existsSync(thumb.path)) fs.unlinkSync(thumb.path);
    }

    try {
        const { courseContent, ...fields } = parsed;
        // Fix field names for snake_case
        const courseFields = {
            course_title: fields.courseTitle,
            course_description: fields.courseDescription,
            course_price: fields.coursePrice,
            discount: fields.discount,
            course_thumbnail: fields.course_thumbnail || fields.courseThumbnail,
            is_published: fields.isPublished,
            category: fields.category,
            educator: userId,
            level: fields.level,
            language: fields.language
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
                    course_id: newCourse.id, 
                    chapter_title: ch.chapterTitle,
                    chapter_order: ch.chapterOrder || cIdx
                }])
                .select()
                .single();
            
            if (chapterError) throw chapterError;

            for (const [lIdx, lec] of (ch.chapterContent || []).entries()) {
                const lecFile = files.find(f => f.fieldname === `lectureFile_${cIdx}_${lIdx}`);
                let url = lec.lectureUrl;
                if (lecFile) {
                    const result = await cloudinary.uploader.upload(lecFile.path, { resource_type: 'auto' });
                    url = result.secure_url;
                    if (fs.existsSync(lecFile.path)) fs.unlinkSync(lecFile.path);
                }
                
                await supabase
                    .from('lectures')
                    .insert([{ 
                        chapter_id: chapter.id, 
                        lecture_title: lec.lectureTitle,
                        lecture_duration: lec.lectureDuration,
                        lecture_url: url,
                        is_preview: lec.isPreview,
                        lecture_order: lec.lectureOrder || lIdx
                    }]);
            }
        }
        res.status(201).json({ success: true, data: newCourse });
    } catch (error) {
        files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
        throw error;
    }
});

export const updateCourse = catchAsync(async (req, res) => {
    const userId = req.auth.userId;
    const { data: course } = await supabase
        .from('courses')
        .select('*')
        .eq('id', req.params.id)
        .eq('educator', userId)
        .single();

    if (!course) throw new ApiError(404, 'Course not found');

    const files = req.files || [];
    const parsed = req.body.courseData ? JSON.parse(req.body.courseData) : {};
    
    const thumb = files.find(f => f.fieldname === 'courseThumbnail' || f.fieldname === 'image');
    if (thumb) {
        const result = await cloudinary.uploader.upload(thumb.path);
        parsed.course_thumbnail = result.secure_url;
        if (fs.existsSync(thumb.path)) fs.unlinkSync(thumb.path);
    }

    try {
        const { courseContent, ...fields } = parsed;
        const updateFields = {};
        if (fields.courseTitle) updateFields.course_title = fields.courseTitle;
        if (fields.courseDescription) updateFields.course_description = fields.courseDescription;
        if (fields.coursePrice !== undefined) updateFields.course_price = fields.coursePrice;
        if (fields.discount !== undefined) updateFields.discount = fields.discount;
        if (parsed.course_thumbnail) updateFields.course_thumbnail = parsed.course_thumbnail;
        if (fields.isPublished !== undefined) updateFields.is_published = fields.isPublished;
        if (fields.category) updateFields.category = fields.category;
        if (fields.level) updateFields.level = fields.level;
        if (fields.language) updateFields.language = fields.language;

        await supabase.from('courses').update(updateFields).eq('id', course.id);

        if (courseContent) {
            // Delete old content
            const { data: chapters } = await supabase.from('chapters').select('id').eq('course_id', course.id);
            if (chapters && chapters.length) {
                const chapterIds = chapters.map(c => c.id);
                await supabase.from('lectures').delete().in('chapter_id', chapterIds);
                await supabase.from('chapters').delete().eq('course_id', course.id);
            }

            for (const [cIdx, ch] of courseContent.entries()) {
                const { data: chapter } = await supabase
                    .from('chapters')
                    .insert([{ 
                        course_id: course.id, 
                        chapter_title: ch.chapterTitle,
                        chapter_order: ch.chapterOrder || cIdx
                    }])
                    .select()
                    .single();
                
                for (const [lIdx, lec] of (ch.chapterContent || []).entries()) {
                    await supabase
                        .from('lectures')
                        .insert([{ 
                            chapter_id: chapter.id, 
                            lecture_title: lec.lectureTitle,
                            lecture_duration: lec.lectureDuration,
                            lecture_url: lec.lectureUrl,
                            is_preview: lec.isPreview,
                            lecture_order: lec.lectureOrder || lIdx
                        }]);
                }
            }
        }

        res.json({ success: true, data: { ...course, ...updateFields } });
    } catch (error) {
        throw error;
    }
});

export const deleteCourse = catchAsync(async (req, res) => {
    const userId = req.auth.userId;
    const { data: course } = await supabase
        .from('courses')
        .select('id')
        .eq('id', req.params.id)
        .eq('educator', userId)
        .single();

    if (!course) throw new ApiError(404, 'Course not found');

    // Supabase usually handles cascaded deletes if configured, but let's be explicit if not.
    const { data: chapters } = await supabase.from('chapters').select('id').eq('course_id', course.id);
    if (chapters && chapters.length) {
        const chapterIds = chapters.map(c => c.id);
        await supabase.from('lectures').delete().in('chapter_id', chapterIds);
        await supabase.from('chapters').delete().eq('course_id', course.id);
    }
    await supabase.from('courses').delete().eq('id', course.id);
    
    res.json({ success: true, message: 'Course deleted successfully' });
});

export const getEducatorCourses = catchAsync(async (req, res) => {
    const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .eq('educator', req.auth.userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, courses });
});

export const educatorDashboardData = catchAsync(async (req, res) => {
    const educatorId = req.auth.userId;
    const { data: courses } = await supabase.from('courses').select('id').eq('educator', educatorId);
    
    if (!courses || !courses.length) {
        return res.json({ success: true, dashboardData: { totalEarnings: 0, enrolledStudentsData: [], totalCourses: 0, totalStudents: 0, totalFollowers: 0 } });
    }

    const ids = courses.map(c => c.id);

    const { data: purchases } = await supabase
        .from('purchases')
        .select('*')
        .in('course_id', ids)
        .eq('status', 'completed');

    const { data: studentDetails } = await supabase
        .from('purchases')
        .select(`
            course_id,
            courses (course_title),
            users (id, name, image_url)
        `)
        .in('course_id', ids)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

    const { data: profile } = await supabase.from('educators').select('followers_count').eq('user_id', educatorId).single();

    const totalEarnings = parseFloat((purchases || []).reduce((s, p) => s + parseFloat(p.educator_amount || 0), 0).toFixed(2));
    
    res.json({ 
        success: true, 
        dashboardData: { 
            totalEarnings, 
            enrolledStudentsData: (studentDetails || []).map(p => ({ 
                courseTitle: p.courses?.course_title, 
                student: p.users 
            })), 
            totalCourses: courses.length, 
            totalStudents: (purchases || []).length, 
            totalFollowers: profile?.followers_count || 0 
        } 
    });
});

export const getEnrolledStudentsData = catchAsync(async (req, res) => {
    const educatorId = req.auth.userId;
    const { data: courses } = await supabase.from('courses').select('id').eq('educator', educatorId);
    
    if (!courses || !courses.length) {
        return res.json({ success: true, enrolledStudents: [] });
    }

    const { data: purchases } = await supabase
        .from('purchases')
        .select(`
            created_at,
            courses (course_title),
            users (id, name, image_url)
        `)
        .in('course_id', courses.map(c => c.id))
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

    res.json({ 
        success: true, 
        enrolledStudents: (purchases || []).map(p => ({ 
            student: p.users, 
            courseTitle: p.courses?.course_title || 'N/A', 
            purchaseDate: p.created_at 
        })) 
    });
});

export const getPublicEducatorProfile = catchAsync(async (req, res) => {
    const id = req.params.id;
    
    const { data: user } = await supabase
        .from('users')
        .select('id, name, image_url')
        .eq('id', id)
        .single();

    if (!user) throw new ApiError(404, "Educator not found");

    const { data: profile } = await supabase
        .from('educators')
        .select('bio, specialty, experience, qualification, subjects')
        .eq('user_id', id)
        .single();

    const { data: courses } = await supabase
        .from('courses')
        .select(`
            id, course_title, course_price, discount, course_thumbnail, category,
            educatorDetails:users (id, name, image_url)
        `)
        .eq('educator', id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    res.json({ 
        success: true, 
        data: { 
            id: user.id, 
            name: user.name, 
            imageUrl: user.image_url, 
            bio: profile?.bio || 'Experienced educator.', 
            specialty: profile?.specialty || 'General Studies', 
            experience: profile?.experience || 0, 
            qualification: profile?.qualification || '', 
            subjects: profile?.subjects || [], 
            courses: courses || [], 
            user, 
            educator: profile || {} 
        } 
    });
});
