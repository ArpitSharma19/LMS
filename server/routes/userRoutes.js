import express from 'express'
import {
    addUserRating,
    getUserCourseProgress,
    getUserData,
    purchaseCourse,
    updateUserCourseProgress,
    userEnrolledCourses,
    markLectureComplete,
    updateProfileImage
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../config/multer.js';
import { purchaseLimiter } from '../middleware/rateLimiter.js';
import validate from '../middleware/validate.js';
import { purchaseCourseSchema, addUserRatingSchema } from '../validations/user.validation.js';

const userRouter = express.Router()

userRouter.use(protect);

userRouter.get('/data', getUserData)
userRouter.post('/purchase', purchaseLimiter, validate(purchaseCourseSchema), purchaseCourse)
userRouter.get('/enrolled-courses', userEnrolledCourses)
userRouter.post('/update-course-progress', updateUserCourseProgress)
userRouter.post('/get-course-progress',    getUserCourseProgress)
userRouter.post('/add-rating', validate(addUserRatingSchema), addUserRating)
userRouter.put('/mark-complete/:lectureId', markLectureComplete)
userRouter.post('/update-image', upload.single('image'), updateProfileImage)

export default userRouter;
