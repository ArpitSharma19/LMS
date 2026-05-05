import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EducatorLayout = ({ children, title, subtitle }) => {
  const { user, isDark, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface selection:bg-secondary/20 selection:text-secondary">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 fixed z-50`}>
        <Sidebar />
      </div>

      <main className="flex-1 ml-0 md:ml-64 bg-surface min-h-screen flex flex-col transition-all duration-300">
        {/* Educator Navbar */}
        <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-outline-variant px-md md:px-xl py-md flex items-center justify-between">
          <div className="flex items-center gap-md">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low text-on-surface"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <h2 className="text-lg md:text-xl font-black text-on-surface tracking-tight">{title || 'Educator Portal'}</h2>
              {subtitle && <p className="text-[11px] font-medium text-on-surface-variant mt-0.5 hidden sm:block uppercase tracking-wider opacity-70">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-sm md:gap-md">

            <div
              className="flex items-center gap-sm cursor-pointer group p-0.5 pr-md rounded-full hover:bg-surface-container-low transition-all"
              onClick={() => navigate('/profile')}
            >
              <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold overflow-hidden border border-outline-variant shadow-sm group-hover:scale-105 transition-transform">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined">account_circle</span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                 <span className="text-[12px] font-black text-on-surface leading-none">{user?.name?.split(' ')[0]}</span>
                 <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter opacity-70">Instructor</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-md md:p-xl flex-1 animate-in fade-in duration-700">
          {children}
        </div>
      </main>
    </div>
  );
};

export default EducatorLayout;
