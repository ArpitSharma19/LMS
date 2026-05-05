import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const { data } = await api.post('/api/auth/login', { email, password });

      if (data.success) {
        login(data.token, data.role, { ...data.user, educatorStatus: data.educatorStatus });

        // Redirect based on role
        if (data.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (data.role === 'educator') {
          navigate('/educator/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex items-center justify-center p-md overflow-y-auto relative">
      {/* Premium Abstract Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-30">
        <img
          aria-hidden="true"
          className="min-w-full min-h-full object-cover blur-3xl opacity-60"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoitNWatEe-xg5vdIzS3q89MZlavGSyCnuzZ6XwOrd2XVLZ_s7BjD0UDnQUtHiywHm_nZ-H9rElhihB_nLRAtCNoRUOjCKg-6K2LlSwI6uUAjX8_ed3DfeMzxctNTknr5YD-WJZAFcFkGDTj5mfbUP3sfFZg8Z-VQ0GidFoooXXXvd4TqeYeNwUF-0GssTbDaW2m4GtVXO4G40fe3D8xk3h0s50vtuCea60RgUm84nEaFVhc96dYnOtaZLhHJCiFCrF94bEgp2iR0"
          alt=""
        />
      </div>

      {/* Main Card Container */}
      <main className="relative z-10 w-full max-w-[420px] bg-surface-container-lowest rounded-xl border border-outline-variant p-xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05),0_4px_6px_-2px_rgba(0,0,0,0.025)] flex flex-col gap-xl">
        {/* Header / Brand */}
        <header className="flex flex-col items-center text-center">
          <div className="flex items-center gap-sm mb-md cursor-pointer" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
            <span className="text-h4 font-semibold text-on-surface tracking-tight">BrainLyft</span>
          </div>
          <h1 className="text-xl font-semibold font-semibold text-on-surface mb-sm">Welcome back</h1>
          <p className="text-body-md text-on-surface-variant">Log in to your account to continue learning.</p>
        </header>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
          {/* Email Input Group */}
          <div className="flex flex-col gap-sm">
            <label className="text-label-caps text-on-surface" htmlFor="email">Email Address</label>
            <div className="relative">
              <span aria-hidden="true" className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">
                mail
              </span>
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-[44px] pr-md py-[12px] text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary-fixed transition-shadow"
                id="email"
                type="email"
                placeholder="name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input Group */}
          <div className="flex flex-col gap-sm">
            <div className="flex justify-between items-center">
              <label className="text-label-caps text-on-surface" htmlFor="password">Password</label>
              <Link to="/forgot-password" size="sm" className="text-body-sm text-primary hover:text-on-primary-fixed-variant transition-colors font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span aria-hidden="true" className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">
                lock
              </span>
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-[44px] pr-md py-[12px] text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary-fixed transition-shadow"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-md top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors outline-none"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            disabled={isSubmitting}
            className="w-full bg-primary text-on-primary rounded-lg py-[12px] px-md text-body-md font-medium flex items-center justify-center gap-sm hover:bg-on-primary-fixed-variant transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] mt-sm group disabled:opacity-70 disabled:cursor-not-allowed"
            type="submit"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                Logging in...
              </>
            ) : (
              <>
                Log in
                <span aria-hidden="true" className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </form>

        {/* Registration Link */}
        <div className="mt-xs text-center border-t border-surface-variant pt-lg">
          <p className="text-body-md text-on-surface-variant">
            Don't have an account?
            <Link to="/register" className="text-primary font-medium hover:text-on-primary-fixed-variant transition-colors ml-1">
              Register here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
