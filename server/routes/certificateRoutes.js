import express from 'express';
import { requestCertificate } from '../controllers/certificateController.js';
import { protect } from '../middleware/authMiddleware.js';

const certificateRouter = express.Router();

certificateRouter.post('/request', protect, requestCertificate);

export default certificateRouter;
