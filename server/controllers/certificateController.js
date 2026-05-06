import { supabase } from '../config/supabase.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

export const requestCertificate = catchAsync(async (req, res) => {
  const { courseId } = req.body;
  const userId = req.auth.userId;

  if (!courseId) {
    throw new ApiError(400, "Course ID is required");
  }

  // Check if course completed/enrolled
  const { data: purchase } = await supabase
    .from('purchases')
    .select('*')
    .eq('userid', userId)
    .eq('courseid', courseId)
    .eq('status', 'completed')
    .single();

  if (!purchase) {
    throw new ApiError(403, 'You must be enrolled in the course to request a certificate');
  }

  const { data: settings } = await supabase.from('commission_settings').select('*').limit(1).single();
  const fee = settings ? parseFloat(settings.certificate_fee) : 50.00;

  // Simulate payment success
  const { data: revenue } = await supabase.from('revenue_tracking').select('*').limit(1).single();
  
  if (revenue) {
    await supabase
        .from('revenue_tracking')
        .update({
            total_revenue: parseFloat((parseFloat(revenue.total_revenue) + fee).toFixed(2)),
            total_commission: parseFloat((parseFloat(revenue.total_commission) + fee).toFixed(2))
        })
        .eq('id', revenue.id);
  } else {
    await supabase
        .from('revenue_tracking')
        .insert([{
            total_revenue: fee.toFixed(2),
            total_commission: fee.toFixed(2),
            total_educator_earnings: 0
        }]);
  }

  res.status(200).json({ 
      success: true, 
      message: `Certificate requested successfully. Platform fee: ₹${fee.toFixed(2)}` 
  });
});
