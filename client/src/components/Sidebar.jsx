import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout, isEducator, isAdmin, isStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const studentItems = [
    { name: 'Learn Dashboard', icon: 'dashboard', path: '/student/dashboard', show: user?.role === 'student' },
    { name: 'Course Catalog', icon: 'explore', path: '/', show: user?.role === 'student' || user?.role === 'educator' },
    { name: 'My Learning', icon: 'auto_stories', path: '/my-enrollments', show: user?.role === 'student' || user?.role === 'educator' },
  ];

  const educatorItems = [
    { name: 'Teach Hub', icon: 'analytics', path: '/educator/dashboard', show: user?.role === 'educator' },
    { name: 'My Courses', icon: 'library_books', path: '/educator/my-courses', show: user?.role === 'educator' },
    { name: 'Create Course', icon: 'add_circle', path: '/educator/add-course', show: user?.role === 'educator' },
  ];

  const adminItems = [
    { name: 'Admin Console', icon: 'admin_panel_settings', path: '/admin/dashboard', show: user?.role === 'admin' },
    { name: 'Educator Approvals', icon: 'how_to_reg', path: '/admin/approvals', show: user?.role === 'admin' },
    { name: 'Platform Controls', icon: 'settings_applications', path: '/admin/settings', show: user?.role === 'admin' },
  ];

  const renderNavGroup = (title, items) => {
    const visibleItems = items.filter(item => item.show);
    if (visibleItems.length === 0) return null;
    
    return (
      <div className="flex flex-col gap-1 mb-lg">
        {title && <p className="px-md mb-xs text-[10px] font-black text-on-surface-variant/50 uppercase tracking-[0.2em]">{title}</p>}
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-md px-md py-sm rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 scale-[1.02]' 
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`
            }
          >
            <span className={`material-symbols-outlined text-[22px] transition-transform group-hover:scale-110 ${location.pathname === item.path ? 'fill-1' : ''}`} style={location.pathname === item.path ? { fontVariationSettings: "'FILL' 1" } : {}}>
              {item.icon}
            </span>
            <span className="text-body-sm font-bold">{item.name}</span>
          </NavLink>
        ))}
      </div>
    );
  };

  return (
    <nav className="bg-surface-container-lowest h-screen w-64 border-r border-outline-variant hidden md:flex flex-col fixed left-0 top-0 py-lg z-40 shadow-xl overflow-hidden">
      {/* Brand Header */}
      <div className="px-lg mb-xl flex items-center gap-md cursor-pointer group" onClick={() => navigate('/')}>
        <div className="w-11 h-11 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-black text-2xl shadow-lg group-hover:rotate-6 transition-transform">
          B
        </div>
        <div>
          <h1 className="text-xl font-black text-on-surface leading-tight tracking-tighter">BrainLyft</h1>
          <div className="flex items-center gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
             <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">LMS Engine</p>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 px-md overflow-y-auto custom-scrollbar">
        {(user?.role === 'student' || user?.role === 'educator') && renderNavGroup('Learn', studentItems)}
        {user?.role === 'educator' && renderNavGroup('Teach', educatorItems)}
        {user?.role === 'admin' && renderNavGroup('Manage', adminItems)}
        {!user && renderNavGroup('Explore', [{ name: 'Course Catalog', icon: 'explore', path: '/', show: true }])}
      </div>

      {/* Bottom Actions */}
      <div className="px-md mt-auto pt-lg border-t border-outline-variant/30 flex flex-col gap-sm">
        {!user ? (
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-primary text-on-primary font-black py-3 rounded-xl hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all mt-md shadow-md"
          >
            Sign In
          </button>
        ) : (
          <div className="flex flex-col gap-sm">
             <NavLink
               to="/profile"
               className={({ isActive }) => 
                 `flex items-center gap-md px-md py-sm rounded-xl transition-all ${
                   isActive ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
                 }`
               }
             >
               <span className="material-symbols-outlined text-[22px]">account_circle</span>
               <span className="text-body-sm font-bold">My Profile</span>
             </NavLink>
             <button 
               onClick={logout}
               className="flex items-center gap-md px-md py-sm rounded-xl text-on-surface-variant hover:bg-error/10 hover:text-error transition-all group"
             >
               <span className="material-symbols-outlined text-[22px] group-hover:translate-x-1 transition-transform">logout</span>
               <span className="text-body-sm font-bold">Sign Out</span>
             </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Sidebar;
