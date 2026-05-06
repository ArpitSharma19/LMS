import { supabase } from '../config/supabase.js';
import { sendEmail, getEducatorApprovedEmailTemplate, getEducatorRejectedEmailTemplate } from '../services/mailService.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

export const getDashboardStats = catchAsync(async (req, res) => {
  const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: totalEducators } = await supabase.from('educators').select('*', { count: 'exact', head: true }).eq('status', 'active');
  const { count: totalStudents } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student');
  const { count: totalCourses } = await supabase.from('courses').select('*', { count: 'exact', head: true });
  const { count: totalPurchases } = await supabase.from('purchases').select('*', { count: 'exact', head: true }).eq('status', 'completed');
  const { data: revenueData } = await supabase.from('revenue_tracking').select('*').limit(1).maybeSingle();

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalStudents,
      totalEducators,
      totalCourses,
      totalPurchases,
      totalRevenue: revenueData ? parseFloat(revenueData.total_revenue) : 0,
    },
  });
});

export const getAllUsers = catchAsync(async (req, res) => {
  const { role, search } = req.query;

  let query = supabase.from('users').select('*, educatorProfile:educators(*)');

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: users, error } = await query;
  if (error) throw error;

  let filteredUsers = users ?? [];
  if (role === 'educator') {
    filteredUsers = filteredUsers.filter(u => u.educatorProfile);
  } else if (role === 'student') {
    filteredUsers = filteredUsers.filter(u => !u.educatorProfile);
  }

  res.json({ success: true, users: filteredUsers });
});

export const updateUserStatus = catchAsync(async (req, res) => {
  const { userId, status, isVerified } = req.body;
  const updateData = {};
  if (status) updateData.status = status;
  if (typeof isVerified === 'boolean') updateData.isverified = isVerified;

  const { error } = await supabase.from('users').update(updateData).eq('id', userId);
  if (error) throw error;

  res.json({ success: true, message: 'User updated successfully' });
});

export const deleteUser = catchAsync(async (req, res) => {
  const { error } = await supabase.from('users').delete().eq('id', req.params.userId);
  if (error) throw new ApiError(404, 'User not found');
  res.json({ success: true, message: 'User deleted successfully' });
});

export const getPendingEducators = catchAsync(async (req, res) => {
  const { data: educators, error } = await supabase
    .from('educators')
    .select('*, users(id, name, email, imageUrl, created_at)')
    .eq('status', req.query.status || 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  res.json({ success: true, data: educators });
});

export const approveEducator = catchAsync(async (req, res) => {
  const { educatorId } = { ...req.body, ...req.params };

  const { data: profile } = await supabase
    .from('educators')
    .select('*, users(*)')
    .eq('id', educatorId)
    .single();

  if (!profile) throw new ApiError(404, 'Educator profile not found');
  if (profile.status === 'active') throw new ApiError(400, 'Educator is already active');

  // Only update columns that exist in the educators schema
  await supabase
    .from('educators')
    .update({ status: 'active' })
    .eq('id', educatorId);

  await supabase
    .from('users')
    .update({ role: 'educator' })
    .eq('id', profile.userid);

  if (profile.users) {
    sendEmail(
      profile.users.email,
      '🎉 Educator Account Approved!',
      getEducatorApprovedEmailTemplate(profile.users.name)
    ).catch(() => {});
  }
  res.json({ success: true, message: 'Educator approved successfully' });
});

export const rejectEducator = catchAsync(async (req, res) => {
  const { educatorId, reason } = req.body;
  const { data: profile } = await supabase
    .from('educators')
    .select('*, users(*)')
    .eq('id', educatorId)
    .single();

  if (!profile) throw new ApiError(404, 'Educator profile not found');

  await supabase.from('educators').update({ status: 'rejected' }).eq('id', educatorId);

  if (profile.users) {
    sendEmail(
      profile.users.email,
      'Educator Application Update',
      getEducatorRejectedEmailTemplate(profile.users.name, reason)
    ).catch(() => {});
  }
  res.json({ success: true, message: 'Educator rejected successfully' });
});

export const getCommissionSettings = catchAsync(async (req, res) => {
  const { data: settings } = await supabase.from('commission_settings').select('*').limit(1).maybeSingle();

  if (!settings) {
    const { data: newSettings } = await supabase
      .from('commission_settings')
      .insert([{ platform_percentage: 15, certificate_fee: 50 }])
      .select()
      .single();
    return res.json({ success: true, settings: newSettings });
  }

  res.json({ success: true, settings });
});

export const updateCommissionSettings = catchAsync(async (req, res) => {
  const { percentage, certificateFee } = req.body;
  const { data: settings } = await supabase.from('commission_settings').select('*').limit(1).maybeSingle();

  const updateData = {};
  if (percentage !== undefined) updateData.platform_percentage = percentage;
  if (certificateFee !== undefined) updateData.certificate_fee = certificateFee;

  if (settings) {
    const { data: updated } = await supabase
      .from('commission_settings')
      .update(updateData)
      .eq('id', settings.id)
      .select()
      .single();
    res.json({ success: true, data: updated });
  } else {
    const { data: created } = await supabase
      .from('commission_settings')
      .insert([updateData])
      .select()
      .single();
    res.json({ success: true, data: created });
  }
});

export const getRevenueAnalytics = catchAsync(async (req, res) => {
  const { data: revenue } = await supabase.from('revenue_tracking').select('*').limit(1).maybeSingle();
  const { data: purchases } = await supabase
    .from('purchases')
    .select('amount, created_at')
    .eq('status', 'completed');

  const monthlyData = (purchases ?? []).reduce((acc, p) => {
    const month = new Date(p.created_at).getMonth() + 1;
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.revenue += parseFloat(p.amount);
    } else {
      acc.push({ month, revenue: parseFloat(p.amount) });
    }
    return acc;
  }, []);

  res.json({ success: true, revenue, monthlyData });
});
