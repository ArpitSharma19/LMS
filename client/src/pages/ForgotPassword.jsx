import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { toast } from 'react-toastify'

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/forgot-password', { email });
      if (data.success) {
        toast.success('OTP sent to your email');
        setStep(2);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/verify-otp', { email, otp });
      if (data.success) {
        toast.success('OTP Verified');
        setStep(3);
      } else {
        toast.error(data.message || 'Invalid OTP');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/reset-password', { email, otp, newPassword: password });
      if (data.success) {
        toast.success('Password reset successful! Please login.');
        navigate('/login');
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex items-center justify-center p-md overflow-y-auto relative">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-30">
        <div className="w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 w-full max-w-[420px] bg-surface-container-lowest rounded-xl border border-outline-variant p-xl shadow-xl flex flex-col gap-xl">
        <header className="flex flex-col items-center text-center">
          <div className="flex items-center gap-sm mb-md cursor-pointer" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
            <span className="text-h4 font-semibold text-on-surface tracking-tight">BrainLyft</span>
          </div>
          <h1 className="text-xl font-semibold text-on-surface mb-sm">
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Verify OTP'}
            {step === 3 && 'Reset Password'}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {step === 1 && "Enter your email to receive a verification code."}
            {step === 2 && `We've sent a 6-digit code to ${email}`}
            {step === 3 && "Create a new secure password for your account."}
          </p>
        </header>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-lg">
            <div className="flex flex-col gap-sm">
              <label className="text-label-caps text-on-surface">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">mail</span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-[44px] pr-md py-[12px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <button
              disabled={loading}
              className="w-full bg-primary text-on-primary rounded-lg py-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              type="submit"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-lg">
            <div className="flex flex-col gap-sm">
              <label className="text-label-caps text-on-surface">Verification Code</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">password</span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-[44px] pr-md py-[12px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-center tracking-[0.5em] font-bold text-lg"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
            </div>
            <button
              disabled={loading}
              className="w-full bg-primary text-on-primary rounded-lg py-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              type="submit"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button 
              type="button" 
              onClick={() => setStep(1)}
              className="text-body-sm text-primary font-medium hover:underline"
            >
              Change Email
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-lg">
            <div className="flex flex-col gap-sm">
              <label className="text-label-caps text-on-surface">New Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-[44px] pr-md py-[12px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-md top-1/2 -translate-y-1/2 text-outline"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-sm">
              <label className="text-label-caps text-on-surface">Confirm Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">lock_reset</span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-[44px] pr-md py-[12px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-primary text-on-primary rounded-lg py-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              type="submit"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-xs text-center border-t border-outline-variant pt-lg">
          <Link to="/login" className="text-body-md text-primary font-medium hover:underline">
            Back to Login
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
