import express from 'express'
import {
    addCourse,
    updateCourse,
    deleteCourse,
    educatorDashboardData,
    getEducatorCourses,
    getEnrolledStudentsData,
    updateRoleToEducator,
    getPublicEducatorProfile
} from '../controllers/educatorController.js';
import upload from '../config/multer.js';
import { protect, protectEducator } from '../middleware/authMiddleware.js';

const educatorRouter = express.Router()

educatorRouter.post('/add-course', upload.any(), protectEducator, addCourse)
educatorRouter.put('/course/:id', upload.any(), protectEducator, updateCourse)
educatorRouter.delete('/course/:id', protectEducator, deleteCourse)
educatorRouter.get('/courses', protectEducator, getEducatorCourses)
educatorRouter.get('/dashboard', protectEducator, educatorDashboardData)
educatorRouter.get('/enrolled-students', protectEducator, getEnrolledStudentsData)
educatorRouter.get('/update-role', protect, updateRoleToEducator)

// Public educator routes - must be last
educatorRouter.get('/:id', getPublicEducatorProfile)

export default educatorRouter;
