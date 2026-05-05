import { sequelize } from '../config/database.js';
import User from './User.js';
import Course from './Course.js';
import Chapter from './Chapter.js';
import Lecture from './Lecture.js';
import CourseRating from './CourseRating.js';
import Enrollment from './Enrollment.js';
import Purchase from './Purchase.js';
import CourseProgress from './CourseProgress.js';
import LectureCompletion from './LectureCompletion.js';
import ChatHistory from './ChatHistory.js';
import Educator from './Educator.js';
import Admin from './Admin.js';
import CommissionSettings from './CommissionSettings.js';
import RevenueTracking from './RevenueTracking.js';

// User <-> Educator
User.hasOne(Educator, { foreignKey: 'userId', as: 'educatorProfile', onDelete: 'CASCADE' });
Educator.belongsTo(User, { foreignKey: 'userId' });

// Enrollment
User.belongsToMany(Course, { through: Enrollment, foreignKey: 'userId', otherKey: 'courseId', as: 'enrolledCourses', onDelete: 'CASCADE' });
Course.belongsToMany(User, { through: Enrollment, foreignKey: 'courseId', otherKey: 'userId', as: 'enrolledStudents', onDelete: 'CASCADE' });

// Educator -> Course
User.hasMany(Course, { foreignKey: 'educator', as: 'createdCourses' });
Course.belongsTo(User, { foreignKey: 'educator', as: 'educatorDetails' });

// Course Structure
Course.hasMany(Chapter, { foreignKey: 'courseId', as: 'courseContent', onDelete: 'CASCADE' });
Chapter.belongsTo(Course, { foreignKey: 'courseId' });
Chapter.hasMany(Lecture, { foreignKey: 'chapterId', as: 'chapterContent', onDelete: 'CASCADE' });
Lecture.belongsTo(Chapter, { foreignKey: 'chapterId' });

// Rating
Course.hasMany(CourseRating, { foreignKey: 'courseId', as: 'courseRatings', onDelete: 'CASCADE' });
CourseRating.belongsTo(Course, { foreignKey: 'courseId' });
User.hasMany(CourseRating, { foreignKey: 'userId', as: 'userRatings', onDelete: 'CASCADE' });
CourseRating.belongsTo(User, { foreignKey: 'userId' });

// Purchase
User.hasMany(Purchase, { foreignKey: 'userId', onDelete: 'CASCADE' });
Purchase.belongsTo(User, { foreignKey: 'userId' });
Course.hasMany(Purchase, { foreignKey: 'courseId', onDelete: 'CASCADE' });
Purchase.belongsTo(Course, { foreignKey: 'courseId' });

// Progress
User.hasMany(CourseProgress, { foreignKey: 'userId', onDelete: 'CASCADE' });
CourseProgress.belongsTo(User, { foreignKey: 'userId' });
Course.hasMany(CourseProgress, { foreignKey: 'courseId', onDelete: 'CASCADE' });
CourseProgress.belongsTo(Course, { foreignKey: 'courseId' });
CourseProgress.hasMany(LectureCompletion, { foreignKey: 'progressId', as: 'lectureCompleted', onDelete: 'CASCADE' });
LectureCompletion.belongsTo(CourseProgress, { foreignKey: 'progressId' });

// Chat History
User.hasMany(ChatHistory, { foreignKey: 'userId', onDelete: 'CASCADE' });
ChatHistory.belongsTo(User, { foreignKey: 'userId' });

export {
  sequelize, User, Course, Chapter, Lecture, CourseRating, Enrollment, Purchase, CourseProgress, LectureCompletion, ChatHistory, Educator, Admin, CommissionSettings, RevenueTracking
};
