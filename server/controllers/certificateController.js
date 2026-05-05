import { User, Course, Purchase, CommissionSettings, RevenueTracking, sequelize } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

export const requestCertificate = catchAsync(async (req, res) => {
  const { courseId } = req.body;
  const userId = req.auth.userId;

  if (!courseId) {
    throw new ApiError(400, "Course ID is required");
  }

  const t = await sequelize.transaction();
  try {
    // Check if course completed/enrolled
    const purchase = await Purchase.findOne({ 
      where: { userId, courseId, status: 'completed' },
      transaction: t
    });

    if (!purchase) {
      throw new ApiError(403, 'You must be enrolled in the course to request a certificate');
    }

    const settings = await CommissionSettings.findOne({ transaction: t });
    const fee = settings ? parseFloat(settings.certificateFee) : 50.00;

    // Simulate payment success
    let revenue = await RevenueTracking.findOne({ transaction: t });
    if (!revenue) {
        revenue = await RevenueTracking.create({
            totalRevenue: 0,
            totalCommission: 0,
            totalEducatorEarnings: 0
        }, { transaction: t });
    }
    
    revenue.totalRevenue = parseFloat((parseFloat(revenue.totalRevenue) + fee).toFixed(2));
    revenue.totalCommission = parseFloat((parseFloat(revenue.totalCommission) + fee).toFixed(2));
    await revenue.save({ transaction: t });

    await t.commit();
    res.status(200).json({ 
        success: true, 
        message: `Certificate requested successfully. Platform fee: ₹${fee.toFixed(2)}` 
    });
  } catch (error) {
    await t.rollback();
    throw error;
  }
});
