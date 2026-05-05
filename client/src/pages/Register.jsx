import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const Register = () => {
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [experience, setExperience] = useState('');
  const [qualification, setQualification] = useState('');
  const [field, setField] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // Basic Registration
      const payload = {
        name,
        email,
        password,
        role
      };

      // Note: Backend register ignores these, but we keep them for UI requirement
      // In a real flow, these would be sent to /api/auth/educator/apply after login
      if (role === 'educator') {
        payload.experience = experience;
        payload.qualification = qualification;
        payload.subjects = [field];
      }

      const { data } = await api.post('/api/auth/register', payload);

      if (data.success) {
        toast.success(data.message || 'Account created! Welcome to BrainLyft.');
        if (role === 'educator') {
          toast.info('Your educator profile is pending review. Please login to track status.');
        }
        navigate('/login');
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex items-center justify-center p-md overflow-y-auto relative">
      {/* Premium Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse duration-[5s]" />
      </div>

      <main className="w-full max-w-[520px] relative z-10">
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[32px] shadow-2xl p-xl flex flex-col gap-xl backdrop-blur-sm">
          {/* Header */}
          <header className="text-center flex flex-col gap-sm">
            <div
              className="inline-flex items-center justify-center w-16 h-16 bg-primary text-on-primary rounded-2xl mx-auto mb-sm cursor-pointer shadow-lg hover:rotate-6 transition-transform"
              onClick={() => navigate('/')}
            >
              <span className="material-symbols-outlined text-[32px] fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
            <h1 className="text-3xl font-black text-on-surface tracking-tight">Create your account</h1>
            <p className="text-body-md text-on-surface-variant font-bold opacity-70">Empowering the next generation of digital learners.</p>
          </header>

          {/* Role Selection Toggle - Premium Segmented Control */}
          <div className="bg-surface-container-low p-1.5 rounded-2xl flex relative border border-outline-variant/30">
            <div
              className={`absolute inset-y-1.5 w-[calc(50%-6px)] bg-surface-container-lowest shadow-xl rounded-xl transition-all duration-500 ease-out ${
                role === 'student' ? 'left-1.5' : 'left-[calc(50%+3px)]'
              }`}
            />
            <button
              className={`flex-1 font-black z-10 py-3 text-center relative transition-colors duration-300 uppercase tracking-widest text-[11px] ${
                role === 'student' ? 'text-primary' : 'text-on-surface-variant opacity-60'
              }`}
              type="button"
              onClick={() => setRole('student')}
            >
              Student Portal
            </button>
            <button
              className={`flex-1 font-black z-10 py-3 text-center relative transition-colors duration-300 uppercase tracking-widest text-[11px] ${
                role === 'educator' ? 'text-primary' : 'text-on-surface-variant opacity-60'
              }`}
              type="button"
              onClick={() => setRole('educator')}
            >
              Educator Hub
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
            <div className="grid grid-cols-1 gap-lg">
               {/* Full Name */}
               <div className="flex flex-col gap-xs">
                  <label className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Identity</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">person</span>
                    <input
                      className="w-full bg-surface-container-low/50 border border-outline-variant/50 text-on-surface text-body-md rounded-2xl py-4 pl-[48px] pr-md outline-none focus:border-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline/50 font-bold"
                      type="text"
                      placeholder="Enter your full name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
               </div>

               {/* Email */}
               <div className="flex flex-col gap-xs">
                  <label className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Digital Mail</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">alternate_email</span>
                    <input
                      className="w-full bg-surface-container-low/50 border border-outline-variant/50 text-on-surface text-body-md rounded-2xl py-4 pl-[48px] pr-md outline-none focus:border-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline/50 font-bold"
                      type="email"
                      placeholder="name@company.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
               </div>

               {/* Password */}
               <div className="flex flex-col gap-xs">
                  <label className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Security Key</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
                    <input
                      className="w-full bg-surface-container-low/50 border border-outline-variant/50 text-on-surface text-body-md rounded-2xl py-4 pl-[48px] pr-md outline-none focus:border-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline/50 font-bold"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      className="absolute right-md top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors outline-none"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
               </div>
            </div>

            {/* Educator Specific Fields - Animated In */}
            {role === 'educator' && (
              <div className="flex flex-col gap-lg p-lg bg-primary/5 rounded-[24px] border border-primary/10 animate-in zoom-in-95 duration-500">
                <div className="flex flex-col gap-xs">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Professional Qualification</label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 text-on-surface text-body-sm rounded-xl py-3 px-md outline-none focus:border-primary transition-all font-bold shadow-sm"
                    type="text"
                    placeholder="e.g. PhD in Neural Networks"
                    required
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-md">
                  <div className="flex flex-col gap-xs">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Experience (Yrs)</label>
                    <input
                      className="w-full bg-surface-container-lowest border border-outline-variant/50 text-on-surface text-body-sm rounded-xl py-3 px-md outline-none focus:border-primary transition-all font-bold shadow-sm"
                      type="number"
                      placeholder="8"
                      required
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Core Field</label>
                    <input
                      className="w-full bg-surface-container-lowest border border-outline-variant/50 text-on-surface text-body-sm rounded-xl py-3 px-md outline-none focus:border-primary transition-all font-bold shadow-sm"
                      type="text"
                      placeholder="e.g. Data Science"
                      required
                      value={field}
                      onChange={(e) => setField(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-[10px] font-bold text-primary/60 italic leading-tight">
                  Verification usually takes 24-48 hours. Our team will review your credentials manually.
                </p>
              </div>
            )}

            <button
              disabled={isSubmitting}
              className="w-full bg-inverse-surface text-inverse-on-surface font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-sm shadow-xl hover:bg-primary hover:text-on-primary hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 group"
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  Processing identity...
                </>
              ) : (
                <>
                  <span>Begin Journey</span>
                  <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-md border-t border-outline-variant/30">
            <p className="text-body-sm text-on-surface-variant font-bold opacity-60">
              Already a member?
              <Link to="/login" className="text-primary hover:underline underline-offset-4 ml-2">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;
