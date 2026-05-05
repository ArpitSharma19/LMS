import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getCommissionSettings,
  updateCommissionSettings,
  getRevenueAnalytics,
  getPendingEducators,
  approveEducator,
  rejectEducator,
} from '../controllers/adminController.js';
import adminAuth from '../middleware/adminAuth.js';

const adminRouter = express.Router();

adminRouter.use(adminAuth);

adminRouter.get('/stats', getDashboardStats);
adminRouter.get('/dashboard', getDashboardStats); // Alias
adminRouter.get('/users', getAllUsers);
adminRouter.post('/update-user-status', updateUserStatus);
adminRouter.delete('/user/:userId', deleteUser);
adminRouter.get('/commission', getCommissionSettings);
adminRouter.post('/update-commission', updateCommissionSettings);
adminRouter.get('/revenue', getRevenueAnalytics);

// Educator management
adminRouter.get('/educators', getPendingEducators);
adminRouter.get('/pending-educators', getPendingEducators); // Alias
adminRouter.post('/educators/approve', approveEducator);
adminRouter.put('/approve-educator/:educatorId', approveEducator); // New PUT route
adminRouter.post('/educators/reject', rejectEducator);

export default adminRouter;
