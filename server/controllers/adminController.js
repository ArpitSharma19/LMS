import { User, Educator, Course, Purchase, Admin, CommissionSettings, RevenueTracking, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import { sendEmail, getEducatorApprovedEmailTemplate, getEducatorRejectedEmailTemplate } from '../services/mailService.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

export const getDashboardStats = catchAsync(async (req, res) => {
  const [totalUsers, totalEducators, totalStudents, totalCourses, totalPurchases, revenueData] = await Promise.all([
    User.count(),
    Educator.count({ where: { status: 'active' } }),
    User.count({ where: { role: 'student' } }),
    Course.count(),
    Purchase.count({ where: { status: 'completed' } }),
    RevenueTracking.findOne()
  ]);

  res.json({
    success: true,
    stats: { totalUsers, totalStudents, totalEducators, totalCourses, totalPurchases, totalRevenue: revenueData ? parseFloat(revenueData.totalRevenue) : 0 },
  });
});

export const getAllUsers = catchAsync(async (req, res) => {
  const { role, search } = req.query;
  const where = search ? { [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }] } : {};

  let users = await User.findAll({
    where,
    attributes: { exclude: ['password'] },
    include: [{ model: Educator, as: 'educatorProfile', required: role === 'educator' }]
  });

  if (role === 'student') users = users.filter(u => !u.educatorProfile);
  res.json({ success: true, users });
});

export const updateUserStatus = catchAsync(async (req, res) => {
  const { userId, status, isVerified } = req.body;
  const user = await User.findByPk(userId);
  if (!user) throw new ApiError(404, "User not found");

  if (status) user.status = status;
  if (typeof isVerified === 'boolean') user.isVerified = isVerified;
  await user.save();
  res.json({ success: true, message: 'User updated successfully' });
});

export const deleteUser = catchAsync(async (req, res) => {
  const deleted = await User.destroy({ where: { id: req.params.userId } });
  if (!deleted) throw new ApiError(404, "User not found");
  res.json({ success: true, message: 'User deleted successfully' });
});

export const getPendingEducators = catchAsync(async (req, res) => {
  const educators = await Educator.findAll({
    where: { status: req.query.status || 'pending' },
    include: [{ model: User, attributes: ['id', 'name', 'email', 'imageUrl', 'createdAt'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, data: educators });
});

export const approveEducator = catchAsync(async (req, res) => {
  const { educatorId } = { ...req.body, ...req.params };
  const t = await sequelize.transaction();
  try {
    const profile = await Educator.findByPk(educatorId, { include: [{ model: User }], transaction: t });
    if (!profile) throw new ApiError(404, 'Educator profile not found');
    if (profile.status === 'active') throw new ApiError(400, 'Educator is already active');

    profile.status = 'active';
    profile.approvedAt = new Date();
    await profile.save({ transaction: t });
    await User.update({ role: 'educator' }, { where: { id: profile.userId }, transaction: t });
    await t.commit();

    if (profile.User) sendEmail(profile.User.email, '🎉 Educator Account Approved!', getEducatorApprovedEmailTemplate(profile.User.name)).catch(() => {});
    res.json({ success: true, message: 'Educator approved successfully' });
  } catch (error) {
    await t.rollback();
    throw error;
  }
});

export const rejectEducator = catchAsync(async (req, res) => {
  const { educatorId, reason } = req.body;
  const profile = await Educator.findByPk(educatorId, { include: [{ model: User }] });
  if (!profile) throw new ApiError(404, 'Educator profile not found');

  profile.status = 'rejected';
  await profile.save();

  if (profile.User) sendEmail(profile.User.email, 'Educator Application Update', getEducatorRejectedEmailTemplate(profile.User.name, reason)).catch(() => {});
  res.json({ success: true, message: 'Educator rejected successfully' });
});

export const getCommissionSettings = catchAsync(async (req, res) => {
  const settings = await CommissionSettings.findOne() || await CommissionSettings.create({ platformPercentage: 15, certificateFee: 50 });
  res.json({ success: true, settings });
});

export const updateCommissionSettings = catchAsync(async (req, res) => {
  const { percentage, certificateFee } = req.body;
  let settings = await CommissionSettings.findOne();
  if (settings) {
    if (percentage !== undefined) settings.platformPercentage = percentage;
    if (certificateFee !== undefined) settings.certificateFee = certificateFee;
    await settings.save();
  } else {
    settings = await CommissionSettings.create({ platformPercentage: percentage || 15, certificateFee: certificateFee || 50 });
  }
  res.json({ success: true, data: settings });
});

export const getRevenueAnalytics = catchAsync(async (req, res) => {
  const [revenue, monthlyData] = await Promise.all([
    RevenueTracking.findOne(),
    Purchase.findAll({
      attributes: [[sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'], [sequelize.fn('SUM', sequelize.col('amount')), 'revenue']],
      where: { status: 'completed' },
      group: [sequelize.fn('MONTH', sequelize.col('createdAt'))]
    })
  ]);
  res.json({ success: true, revenue, monthlyData });
});
