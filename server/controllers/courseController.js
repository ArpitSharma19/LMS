import { Course, Chapter, Lecture, User, CourseRating, sequelize } from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";

export const getAllCourses = catchAsync(async (req, res) => {
    const { sort, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let order = [['createdAt', 'DESC']];
    if (sort === 'price_low') order = [['coursePrice', 'ASC']];
    if (sort === 'price_high') order = [['coursePrice', 'DESC']];
    if (sort === 'popular') order = [[sequelize.literal('purchaseCount'), 'DESC']];

    const { count, rows: courses } = await Course.findAndCountAll({
        where: { isPublished: true },
        limit: parseInt(limit),
        offset,
        attributes: { include: [[sequelize.literal(`(SELECT COUNT(*) FROM Purchases AS p WHERE p.courseId = Course.id AND p.status = 'completed')`), 'purchaseCount']] },
        include: [{ model: User, as: "educatorDetails", attributes: ["id", "name", "imageUrl"] }],
        order,
        distinct: true
    });

    res.json({ success: true, courses, totalCourses: count, page: parseInt(page), totalPages: Math.ceil(count / parseInt(limit)) });
});

export const getCourseCategories = catchAsync(async (req, res) => {
    const categories = await Course.findAll({ attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']], where: { isPublished: true }, raw: true });
    res.json({ success: true, categories: categories.map(c => c.category).filter(Boolean) });
});

export const getCourseId = catchAsync(async (req, res) => {
    const course = await Course.findByPk(req.params.id, {
        include: [
            { model: User, as: "educatorDetails", attributes: ["id", "name", "imageUrl"] },
            { model: Chapter, as: "courseContent", include: [{ model: Lecture, as: "chapterContent" }] },
            { model: CourseRating, as: "courseRatings", attributes: ["userId", "rating"] }
        ]
    });
    if (!course) throw new ApiError(404, "Course not found");
    res.json({ success: true, courseData: course });
});