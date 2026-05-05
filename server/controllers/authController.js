import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Educator, Admin, sequelize } from '../models/index.js';
import {
  sendEmail,
  getRegistrationEmailTemplate,
  getEducatorPendingEmailTemplate,
  getOtpEmailTemplate,
} from '../services/mailService.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

export const register = catchAsync(async (req, res) => {
  const { name, email, password, role = 'student' } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'Name, email and password are required');

  const existing = await User.findOne({ where: { email } });
  if (existing) throw new ApiError(409, 'Email already registered');

  const hashed = await bcrypt.hash(password, 10);
  const t = await sequelize.transaction();

  try {
    const newUser = await User.create({
      name,
      email,
      password: hashed,
      role: role === 'educator' ? 'student' : role,
      isVerified: false,
    }, { transaction: t });

    if (role === 'educator') {
      await Educator.create({ userId: newUser.id, status: 'pending' }, { transaction: t });
    }

    await t.commit();
    sendEmail(email, 'Welcome to LMS Platform', getRegistrationEmailTemplate(name, email)).catch(() => {});
    res.status(201).json({ success: true, message: 'Account created successfully. Please login.' });
  } catch (error) {
    await t.rollback();
    throw error;
  }
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  // Admin Check
  const admin = await Admin.findOne({ where: { email: String(email) } });
  if (admin && await bcrypt.compare(password, admin.password)) {
    const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.json({ success: true, role: 'admin', token, message: 'Admin logged in' });
  }

  // User Check
  const user = await User.findOne({ where: { email: String(email) } });
  if (!user || !(await bcrypt.compare(password, user.password || ''))) {
    throw new ApiError(401, 'Invalid credentials');
  }

  if (user.status === 'blocked') throw new ApiError(403, 'Your account has been blocked.');

  let educatorStatus = null;
  const profile = await Educator.findOne({ where: { userId: user.id } });
  if (profile) {
    educatorStatus = profile.status;
    if (profile.status === 'active' && user.role !== 'educator') {
      user.role = 'educator';
      await user.save();
    }
  }

  res.json({
    success: true,
    token: signToken(user),
    role: user.role,
    educatorStatus,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, imageUrl: user.imageUrl, isVerified: user.isVerified },
    message: 'Login successful',
  });
});

export const logout = (req, res) => res.json({ success: true, message: 'Logged out successfully' });

export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required');

  const user = await User.findOne({ where: { email: String(email) } });
  if (user) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    sendEmail(email, 'Password Reset OTP', getOtpEmailTemplate(user.name, otp)).catch(() => {});
  }
  res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
});

export const verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ where: { email: String(email), otp: String(otp) } });
  if (!user || !user.otpExpiry || user.otpExpiry < new Date()) throw new ApiError(400, 'Invalid or expired OTP');
  res.json({ success: true, message: 'OTP verified successfully. You can now reset your password.' });
});

export const resetPassword = catchAsync(async (req, res) => {
  const { email, otp, password } = req.body;
  if (!email || !otp || !password) throw new ApiError(400, 'All fields are required');

  const user = await User.findOne({ where: { email: String(email), otp: String(otp) } });
  if (!user || !user.otpExpiry || user.otpExpiry < new Date()) throw new ApiError(400, 'Session expired. Please request a new OTP.');

  user.password = await bcrypt.hash(password, 10);
  user.otp = null;
  user.otpExpiry = null;
  await user.save();
  res.json({ success: true, message: 'Password reset successfully. You can now login.' });
});

export const changePassword = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.auth.userId);
  if (!user || !(await bcrypt.compare(req.body.currentPassword, user.password))) {
    throw new ApiError(401, 'Current password is incorrect');
  }
  user.password = await bcrypt.hash(req.body.newPassword, 10);
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
});

export const applyAsEducator = catchAsync(async (req, res) => {
  const { qualification, experience, subjects, bio, portfolioLinks } = req.body;
  const user = await User.findByPk(req.auth.userId);
  if (!user) throw new ApiError(404, 'User not found');

  const [profile] = await Educator.findOrCreate({
    where: { userId: user.id },
    defaults: { qualification, experience, subjects, bio, portfolioLinks, status: 'pending' },
  });

  if (profile.status === 'active') throw new ApiError(400, 'Your educator account is already active.');
  if (profile.status === 'pending') await profile.update({ qualification, experience, subjects, bio, portfolioLinks });

  sendEmail(user.email, 'Educator Application Received', getEducatorPendingEmailTemplate(user.name)).catch(() => {});
  res.json({ success: true, message: 'Your educator account is under review.' });
});

export const getMe = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.auth.userId, { attributes: { exclude: ['password', 'otp', 'otpExpiry'] } });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, user });
});

export const getEducatorStatus = catchAsync(async (req, res) => {
  const profile = await Educator.findOne({ where: { userId: req.auth.userId } });
  res.json({ success: true, status: profile?.status || null });
});
