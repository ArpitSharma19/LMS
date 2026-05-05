import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { Course, CourseProgress, Purchase, User, Enrollment, LectureCompletion, CourseRating, Chapter, Lecture, RevenueTracking, Educator, Admin, sequelize } from "../models/index.js"
import ApiError from "../utils/ApiError.js"
import catchAsync from "../utils/catchAsync.js"

export const getUserData = catchAsync(async (req, res) => {
    const userId = String(req.auth?.userId);
    let user = await User.findByPk(userId, { attributes: { exclude: ['password'] }, include: [{ model: Educator, as: 'educatorProfile' }] });

    if (!user) {
        const admin = await Admin.findByPk(userId);
        if (admin) user = { ...admin.toJSON(), role: 'admin', isVerified: true };
    }
    if (!user) throw new ApiError(404, 'User Not Found');

    res.json({ success: true, user });
});

export const purchaseCourse = catchAsync(async (req, res) => {
    const { courseId } = req.body;
    const userId = req.auth.userId;

    const t = await sequelize.transaction();
    try {
        const [course, user, existing] = await Promise.all([
            Course.findByPk(courseId, { transaction: t }),
            User.findByPk(userId, { transaction: t }),
            Enrollment.findOne({ where: { userId, courseId }, transaction: t })
        ]);

        if (!user || !course) throw new ApiError(404, 'User or Course not found');
        if (existing) throw new ApiError(409, 'Already enrolled');

        const price = Math.max(0, parseFloat((course.coursePrice * (1 - course.discount / 100)).toFixed(2)));
        const commission = parseFloat((price * 0.15).toFixed(2));
        const educatorAmount = parseFloat((price - commission).toFixed(2));

        await Purchase.create({ courseId: course.id, userId, amount: price, commissionAmount: commission, educatorAmount, status: "completed" }, { transaction: t });
        
        let revenue = await RevenueTracking.findOne({ transaction: t }) || await RevenueTracking.create({ totalRevenue: 0, totalCommission: 0, totalEducatorEarnings: 0 }, { transaction: t });
        revenue.totalRevenue = (parseFloat(revenue.totalRevenue) + price).toFixed(2);
        revenue.totalCommission = (parseFloat(revenue.totalCommission) + commission).toFixed(2);
        revenue.totalEducatorEarnings = (parseFloat(revenue.totalEducatorEarnings) + educatorAmount).toFixed(2);
        
        await Promise.all([revenue.save({ transaction: t }), Enrollment.create({ userId, courseId }, { transaction: t })]);
        await t.commit();
        res.status(201).json({ success: true, message: 'Enrollment Successful' });
    } catch (error) {
        await t.rollback();
        throw error;
    }
});

export const userEnrolledCourses = catchAsync(async (req, res) => {
    const user = await User.findByPk(req.auth.userId, {
        include: [{
            model: Course,
            as: 'enrolledCourses',
            include: [{ model: Chapter, as: 'courseContent', include: [{ model: Lecture, as: 'chapterContent' }] }],
            through: { attributes: [] }
        }]
    });
    if (!user) throw new ApiError(404, 'User not found');
    res.json({ success: true, enrolledCourses: user.enrolledCourses || [] });
});

export const updateUserCourseProgress = catchAsync(async (req, res) => {
    const { courseId, lectureId } = req.body;
    const userId = req.auth.userId;

    if (!courseId || !lectureId) throw new ApiError(400, 'CourseId and LectureId are required');

    const [progress] = await CourseProgress.findOrCreate({ where: { userId, courseId } });
    
    // Check if already completed
    const existing = await LectureCompletion.findOne({ where: { progressId: progress.id, lectureId } });
    if (existing) {
        return res.json({ success: true, message: 'Already Completed', alreadyDone: true });
    }

    const today = new Date().toISOString().split('T')[0];
    await LectureCompletion.create({ 
        progressId: progress.id, 
        lectureId, 
        status: 'completed',
        completionDate: today
    });

    // Update global user activity for streak
    const user = await User.findByPk(userId);
    if (user) {
        const completedDates = user.completedDates || [];
        if (!completedDates.includes(today)) {
            const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).toISOString().split('T')[0] : null;
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            user.streak = lastActive === yesterday ? (user.streak || 0) + 1 : 1;
            user.completedDates = [...completedDates, today];
            user.lastActiveDate = new Date();
            await user.save();
        }
    }
    
    res.json({ success: true, message: 'Progress Updated', completedLectures: [...new Set([...(progress.lectureCompleted || []).map(l => l.lectureId), lectureId])] });
});

export const getUserCourseProgress = catchAsync(async (req, res) => {
    const progress = await CourseProgress.findOne({ 
        where: { userId: String(req.auth.userId), courseId: String(req.body.courseId) },
        include: [{ model: LectureCompletion, as: 'lectureCompleted' }]
    });

    res.json({ 
        success: true, 
        progressData: progress ? { ...progress.toJSON(), lectureCompleted: progress.lectureCompleted.map(l => l.lectureId) } : null 
    });
});

export const addUserRating = catchAsync(async (req, res) => {
    const { courseId, rating } = req.body;
    const userId = req.auth.userId;

    console.log(`⭐ Processing rating for course ${courseId} by user ${userId}: ${rating}`);

    if (!rating || rating < 1 || rating > 5) throw new ApiError(400, 'Invalid rating (1-5 only)');
    
    // Validate Enrollment
    const enrollment = await Enrollment.findOne({ where: { userId, courseId } });
    if (!enrollment) {
        console.warn(`🚫 User ${userId} attempted to rate course ${courseId} without enrollment`);
        throw new ApiError(403, 'Must purchase before rating');
    }

    const [userRating, created] = await CourseRating.findOrCreate({ 
        where: { userId, courseId }, 
        defaults: { rating } 
    });

    if (!created) {
        userRating.rating = rating;
        await userRating.save();
    }

    // Atomic update of Course average rating
    const ratings = await CourseRating.findAll({ where: { courseId } });
    const count = ratings.length;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = parseFloat((sum / count).toFixed(1));

    await Course.update({ ratingAverage: average, ratingCount: count }, { where: { id: courseId } });

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
    const user = await User.findByPk(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const completedDates = user.completedDates || [];
    if (!completedDates.includes(today)) {
        const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).toISOString().split('T')[0] : null;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        user.streak = lastActive === yesterday ? (user.streak || 0) + 1 : 1;
        user.completedDates = [...completedDates, today];
        user.lastActiveDate = new Date();
        await user.save();
    }
    res.json({ success: true, streak: user.streak, completedDates: user.completedDates });
});

export const updateProfileImage = catchAsync(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'Please upload an image');
    const user = await User.findByPk(req.auth.userId);
    if (!user) throw new ApiError(404, 'User not found');

    try {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'lms_profiles', width: 500, crop: "scale" });
        user.imageUrl = result.secure_url;
        await user.save();
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.json({ success: true, message: 'Image updated', imageUrl: user.imageUrl });
    } catch (error) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        throw new ApiError(500, 'Upload failed');
    }
});
