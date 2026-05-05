import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import { Course, Purchase, User, Chapter, Lecture, Educator, sequelize } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

export const updateRoleToEducator = catchAsync(async (req, res) => {
    const userId = req.auth.userId;
    const [user, [profile]] = await Promise.all([User.findByPk(userId), Educator.findOrCreate({ where: { userId } })]);
    if (!user) throw new ApiError(404, 'User not found');

    if (profile.status === 'active') {
        if (user.role !== 'educator') { user.role = 'educator'; await user.save(); }
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
    parsed.educator = req.auth.userId;

    const thumb = files.find(f => f.fieldname === 'courseThumbnail' || f.fieldname === 'image');
    if (thumb) {
        const result = await cloudinary.uploader.upload(thumb.path);
        parsed.courseThumbnail = result.secure_url;
        if (fs.existsSync(thumb.path)) fs.unlinkSync(thumb.path);
    }

    const t = await sequelize.transaction();
    try {
        const { courseContent, ...fields } = parsed;
        const newCourse = await Course.create(fields, { transaction: t });

        for (const [cIdx, ch] of (courseContent || []).entries()) {
            const chapter = await Chapter.create({ courseId: newCourse.id, ...ch }, { transaction: t });
            for (const [lIdx, lec] of (ch.chapterContent || []).entries()) {
                const lecFile = files.find(f => f.fieldname === `lectureFile_${cIdx}_${lIdx}`);
                let url = lec.lectureUrl;
                if (lecFile) {
                    const result = await cloudinary.uploader.upload(lecFile.path, { resource_type: 'auto' });
                    url = result.secure_url;
                    if (fs.existsSync(lecFile.path)) fs.unlinkSync(lecFile.path);
                }
                await Lecture.create({ chapterId: chapter.id, ...lec, lectureUrl: url }, { transaction: t });
            }
        }
        await t.commit();
        res.status(201).json({ success: true, data: newCourse });
    } catch (error) {
        await t.rollback();
        files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
        throw error;
    }
});

export const updateCourse = catchAsync(async (req, res) => {
    const course = await Course.findOne({ where: { id: req.params.id, educator: req.auth.userId } });
    if (!course) throw new ApiError(404, 'Course not found');

    const files = req.files || [];
    const parsed = req.body.courseData ? JSON.parse(req.body.courseData) : {};
    
    const thumb = files.find(f => f.fieldname === 'courseThumbnail' || f.fieldname === 'image');
    if (thumb) {
        const result = await cloudinary.uploader.upload(thumb.path);
        parsed.courseThumbnail = result.secure_url;
        if (fs.existsSync(thumb.path)) fs.unlinkSync(thumb.path);
    }

    const t = await sequelize.transaction();
    try {
        const { courseContent, ...fields } = parsed;
        await course.update(fields, { transaction: t });

        if (courseContent) {
            // Very simplified: delete and recreate content (better for this LMS scale)
            const oldChapters = await Chapter.findAll({ where: { courseId: course.id } });
            for (const ch of oldChapters) {
                await Lecture.destroy({ where: { chapterId: ch.id }, transaction: t });
            }
            await Chapter.destroy({ where: { courseId: course.id }, transaction: t });

            for (const [cIdx, ch] of courseContent.entries()) {
                const chapter = await Chapter.create({ courseId: course.id, ...ch }, { transaction: t });
                for (const [lIdx, lec] of (ch.chapterContent || []).entries()) {
                    await Lecture.create({ chapterId: chapter.id, ...lec }, { transaction: t });
                }
            }
        }

        await t.commit();
        res.json({ success: true, data: course });
    } catch (error) {
        await t.rollback();
        throw error;
    }
});

export const deleteCourse = catchAsync(async (req, res) => {
    const course = await Course.findOne({ where: { id: req.params.id, educator: req.auth.userId } });
    if (!course) throw new ApiError(404, 'Course not found');

    const t = await sequelize.transaction();
    try {
        const chapters = await Chapter.findAll({ where: { courseId: course.id } });
        for (const ch of chapters) {
            await Lecture.destroy({ where: { chapterId: ch.id }, transaction: t });
        }
        await Chapter.destroy({ where: { courseId: course.id }, transaction: t });
        await course.destroy({ transaction: t });
        
        await t.commit();
        res.json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        await t.rollback();
        throw error;
    }
});

export const getEducatorCourses = catchAsync(async (req, res) => {
    const courses = await Course.findAll({ where: { educator: req.auth.userId }, order: [['createdAt', 'DESC']] });
    res.json({ success: true, courses });
});

export const educatorDashboardData = catchAsync(async (req, res) => {
    const educatorId = req.auth.userId;
    const courses = await Course.findAll({ where: { educator: educatorId } });
    const ids = courses.map(c => c.id);

    if (!ids.length) return res.json({ success: true, data: { totalEarnings: 0, enrolledStudentsData: [], totalCourses: 0 } });

    const [purchases, students, profile] = await Promise.all([
        Purchase.findAll({ where: { courseId: ids, status: 'completed' } }),
        Purchase.findAll({ where: { courseId: ids, status: 'completed' }, include: [{ model: User, attributes: ['id', 'name', 'imageUrl'] }, { model: Course, attributes: ['courseTitle'] }], limit: 10, order: [['createdAt', 'DESC']] }),
        Educator.findOne({ where: { userId: educatorId } })
    ]);

    const totalEarnings = parseFloat(purchases.reduce((s, p) => s + parseFloat(p.educatorAmount || 0), 0).toFixed(2));
    res.json({ success: true, dashboardData: { totalEarnings, enrolledStudentsData: students.map(p => ({ courseTitle: p.Course?.courseTitle, student: p.User })), totalCourses: courses.length, totalStudents: purchases.length, totalFollowers: profile?.followersCount || 0 } });
});

export const getEnrolledStudentsData = catchAsync(async (req, res) => {
    const courses = await Course.findAll({ where: { educator: req.auth.userId } });
    const purchases = await Purchase.findAll({ where: { courseId: courses.map(c => c.id), status: 'completed' }, include: [{ model: User, attributes: ['id', 'name', 'imageUrl'] }, { model: Course, attributes: ['courseTitle'] }], order: [['createdAt', 'DESC']] });
    res.json({ success: true, enrolledStudents: purchases.map(p => ({ student: p.User, courseTitle: p.Course?.courseTitle || 'N/A', purchaseDate: p.createdAt })) });
});

export const getPublicEducatorProfile = catchAsync(async (req, res) => {
    const id = req.params.id;
    const [user, profile, courses] = await Promise.all([
        User.findByPk(id, { attributes: ['id', 'name', 'imageUrl'] }),
        Educator.findOne({ where: { userId: id }, attributes: ['bio', 'specialty', 'experience', 'qualification', 'subjects'] }),
        Course.findAll({ where: { educator: id, isPublished: true }, attributes: ['id', 'courseTitle', 'coursePrice', 'discount', 'courseThumbnail', 'category'], include: [{ model: User, as: 'educatorDetails', attributes: ['id', 'name', 'imageUrl'] }], order: [['createdAt', 'DESC']] })
    ]);

    if (!user) throw new ApiError(404, "Educator not found");
    res.json({ success: true, data: { id: user.id, name: user.name, imageUrl: user.imageUrl, bio: profile?.bio || 'Experienced educator.', specialty: profile?.specialty || 'General Studies', experience: profile?.experience || 0, qualification: profile?.qualification || '', subjects: profile?.subjects || [], courses: courses || [], user, educator: profile || {} } });
});
