import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
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

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) throw new ApiError(409, 'Email already registered');

  const hashed = await bcrypt.hash(password, 10);

  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert([{
      name,
      email,
      password: hashed,
      role: role === 'educator' ? 'student' : role,
      is_verified: false,
    }])
    .select()
    .single();

  if (userError) throw userError;

  if (role === 'educator') {
    const { error: educatorError } = await supabase
      .from('educators')
      .insert([{ user_id: newUser.id, status: 'pending' }]);
    
    if (educatorError) throw educatorError;
  }

  sendEmail(email, 'Welcome to LMS Platform', getRegistrationEmailTemplate(name, email)).catch(() => {});
  res.status(201).json({ success: true, message: 'Account created successfully. Please login.' });
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  // Admin Check
  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('email', String(email))
    .single();

  if (admin && await bcrypt.compare(password, admin.password)) {
    const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.json({ success: true, role: 'admin', token, message: 'Admin logged in' });
  }

  // User Check
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', String(email))
    .single();

  if (!user || !(await bcrypt.compare(password, user.password || ''))) {
    throw new ApiError(401, 'Invalid credentials');
  }

  if (user.status === 'blocked') throw new ApiError(403, 'Your account has been blocked.');

  let educatorStatus = null;
  const { data: profile } = await supabase
    .from('educators')
    .select('status')
    .eq('user_id', user.id)
    .single();

  if (profile) {
    educatorStatus = profile.status;
    if (profile.status === 'active' && user.role !== 'educator') {
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'educator' })
        .eq('id', user.id);
      if (updateError) throw updateError;
      user.role = 'educator';
    }
  }

  res.json({
    success: true,
    token: signToken(user),
    role: user.role,
    educatorStatus,
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      imageUrl: user.image_url, 
      isVerified: user.is_verified 
    },
    message: 'Login successful',
  });
});

export const logout = (req, res) => res.json({ success: true, message: 'Logged out successfully' });

export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required');

  const { data: user } = await supabase
    .from('users')
    .select('id, name')
    .eq('email', String(email))
    .single();

  if (user) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    await supabase
      .from('users')
      .update({ otp, otp_expiry: otpExpiry })
      .eq('id', user.id);

    sendEmail(email, 'Password Reset OTP', getOtpEmailTemplate(user.name, otp)).catch(() => {});
  }
  res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
});

export const verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const { data: user } = await supabase
    .from('users')
    .select('otp, otp_expiry')
    .eq('email', String(email))
    .eq('otp', String(otp))
    .single();

  if (!user || !user.otp_expiry || new Date(user.otp_expiry) < new Date()) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }
  res.json({ success: true, message: 'OTP verified successfully. You can now reset your password.' });
});

export const resetPassword = catchAsync(async (req, res) => {
  const { email, otp, password } = req.body;
  if (!email || !otp || !password) throw new ApiError(400, 'All fields are required');

  const { data: user } = await supabase
    .from('users')
    .select('id, otp_expiry')
    .eq('email', String(email))
    .eq('otp', String(otp))
    .single();

  if (!user || !user.otp_expiry || new Date(user.otp_expiry) < new Date()) {
    throw new ApiError(400, 'Session expired. Please request a new OTP.');
  }

  const hashed = await bcrypt.hash(password, 10);
  await supabase
    .from('users')
    .update({ 
      password: hashed, 
      otp: null, 
      otp_expiry: null 
    })
    .eq('id', user.id);

  res.json({ success: true, message: 'Password reset successfully. You can now login.' });
});

export const changePassword = catchAsync(async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('id, password')
    .eq('id', req.auth.userId)
    .single();

  if (!user || !(await bcrypt.compare(req.body.currentPassword, user.password))) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  const hashed = await bcrypt.hash(req.body.newPassword, 10);
  await supabase
    .from('users')
    .update({ password: hashed })
    .eq('id', user.id);

  res.json({ success: true, message: 'Password changed successfully' });
});

export const applyAsEducator = catchAsync(async (req, res) => {
  const { qualification, experience, subjects, bio, portfolioLinks } = req.body;
  const { data: user } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('id', req.auth.userId)
    .single();

  if (!user) throw new ApiError(404, 'User not found');

  const { data: profile } = await supabase
    .from('educators')
    .select('status')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    await supabase
      .from('educators')
      .insert([{
        user_id: user.id,
        qualification,
        experience,
        subjects,
        bio,
        portfolio_links: portfolioLinks,
        status: 'pending'
      }]);
  } else {
    if (profile.status === 'active') throw new ApiError(400, 'Your educator account is already active.');
    if (profile.status === 'pending') {
      await supabase
        .from('educators')
        .update({ qualification, experience, subjects, bio, portfolio_links: portfolioLinks })
        .eq('user_id', user.id);
    }
  }

  sendEmail(user.email, 'Educator Application Received', getEducatorPendingEmailTemplate(user.name)).catch(() => {});
  res.json({ success: true, message: 'Your educator account is under review.' });
});

export const getMe = catchAsync(async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('id, name, email, role, image_url, is_verified, created_at')
    .eq('id', req.auth.userId)
    .single();

  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, user });
});

export const getEducatorStatus = catchAsync(async (req, res) => {
  const { data: profile } = await supabase
    .from('educators')
    .select('status')
    .eq('user_id', req.auth.userId)
    .single();

  res.json({ success: true, status: profile?.status || null });
});
