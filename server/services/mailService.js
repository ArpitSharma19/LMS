import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({ from: `"LMS Support" <${process.env.SMTP_USER}>`, to, subject, html });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const baseTemplate = (title, content, color = '#2563eb') => `
  <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
    <div style="background:${color};padding:20px;text-align:center"><h2 style="color:#fff;margin:0">${title}</h2></div>
    <div style="padding:30px;color:#444;line-height:1.5">${content}</div>
    <div style="background:#f9f9f9;padding:15px;text-align:center;color:#999;font-size:12px">&copy; 2026 LMS Platform</div>
  </div>
`;

export const getRegistrationEmailTemplate = (name, email) => baseTemplate('Welcome!', `
  <p>Hello <b>${name}</b>,</p><p>Your account (<b>${email}</b>) is ready. Start learning today!</p>
  <div style="text-align:center;margin-top:20px"><a href="${process.env.FRONTEND_URL}/login" style="background:#2563eb;color:#fff;padding:10px 25px;text-decoration:none;border-radius:5px">Login Now</a></div>
`);

export const getEducatorPendingEmailTemplate = (name) => baseTemplate('Application Received', `
  <p>Hello <b>${name}</b>,</p><p>Your educator application is under review. Expect an update within 24 hours.</p>
`, '#f59e0b');

export const getEducatorApprovedEmailTemplate = (name) => baseTemplate('Approved! 🎉', `
  <p>Hello <b>${name}</b>,</p><p>Your educator account is active. You can now create courses!</p>
  <div style="text-align:center;margin-top:20px"><a href="${process.env.FRONTEND_URL}/educator" style="background:#16a34a;color:#fff;padding:10px 25px;text-decoration:none;border-radius:5px">Dashboard</a></div>
`, '#16a34a');

export const getEducatorRejectedEmailTemplate = (name, reason) => baseTemplate('Application Update', `
  <p>Hello <b>${name}</b>,</p><p>We couldn't approve your application at this time.</p>
  ${reason ? `<p><b>Reason:</b> ${reason}</p>` : ''}
`, '#dc2626');

export const getOtpEmailTemplate = (name, otp) => baseTemplate('Verify Identity', `
  <p>Hello <b>${name}</b>,</p><p>Use this code to reset your password:</p>
  <div style="background:#f3f4f6;padding:15px;text-align:center;font-size:24px;font-weight:bold;letter-spacing:5px;color:#2563eb">${otp}</div>
  <p style="font-size:12px;color:#888">Expires in 10 minutes.</p>
`);
