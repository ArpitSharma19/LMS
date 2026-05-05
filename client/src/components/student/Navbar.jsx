import React, { useState, useRef, useEffect } from 'react';
import { assets } from '../../assets/assets';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api';

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isCoursesListPage = pathname.includes('/course-list');

  const { user, logout, isEducator, isDark } = useStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const becomeEducator = async () => {
    if (isEducator) return navigate('/educator/dashboard');
    try {
      const { data } = await api.get('/api/educator/update-role');
      if (data.success) {
        toast.success(data.message);
        window.location.reload(); // Refresh to update role in token/context
      } else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    toast.success('Logged out successfully');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const navBg = isCoursesListPage ? 'bg-white dark:bg-slate-800' : 'bg-cyan-50 dark:bg-slate-900';

  return (
    <nav className={`sticky top-0 z-50 flex items-center justify-between px-4 sm:px-10 lg:px-36 border-b py-3 shadow-sm transition-colors duration-200 ${navBg} border-gray-200 dark:border-slate-700`}>
      <img onClick={() => navigate('/')} src={assets.logo} alt="Logo" className="w-28 lg:w-32 cursor-pointer" />

      <div className="flex items-center gap-4 text-gray-600 dark:text-slate-300">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <button onClick={becomeEducator} className="text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {isEducator ? 'Educator Dashboard' : 'Become Educator'}
              </button>
              <span className="text-gray-300 dark:text-slate-600">|</span>
              <Link to="/my-enrollments" className="text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors">My Enrollments</Link>
              <span className="text-gray-300 dark:text-slate-600">|</span>
            </div>

            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center bg-blue-600 text-white rounded-full w-9 h-9 justify-center font-bold text-sm hover:bg-blue-700 transition-all overflow-hidden">
                {user.imageUrl ? <img src={user.imageUrl} alt="avatar" className="w-full h-full object-cover" /> : initials}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-2xl z-50 py-1 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <p className="font-semibold text-gray-800 dark:text-slate-100 text-sm truncate">{user.name}</p>
                    <p className="text-gray-400 dark:text-slate-400 text-xs truncate">{user.email}</p>
                  </div>
                  <Link to="/my-enrollments" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">📚 My Enrollments</Link>
                  {isEducator && <Link to="/educator/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">🎓 Educator Dashboard</Link>}
                  <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-slate-700">🚪 Logout</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-600 px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">Login</button>
            <button onClick={() => navigate('/register')} className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-all shadow-sm">Get Started</button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
