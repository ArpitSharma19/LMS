import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

const StoreProvider = ({ children }) => {
  // Auth State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken'));
  const [loading, setLoading] = useState(true);

  // App State
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  const toggleTheme = () => setIsDark(prev => !prev);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/user/data');
      if (data.success) setUser(data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourses = useCallback(async (sort = '') => {
    try {
      setLoadingCourses(true);
      const { data } = await api.get(`/api/course/all${sort ? `?sort=${sort}` : ''}`);
      if (data.success) setCourses(data.courses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const fetchEnrolledCourses = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await api.get('/api/user/enrolled-courses');
      if (data.success) setEnrolledCourses(data.enrolledCourses);
    } catch (error) {
      console.error('Failed to fetch enrolled courses:', error);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchUserData();
      fetchEnrolledCourses();
    }
    else if (adminToken) { setUser({ role: 'admin', name: 'Administrator' }); setLoading(false); }
    else setLoading(false);
  }, [token, adminToken, fetchUserData, fetchEnrolledCourses]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const login = (token, role, userData = null) => {
    const key = role === 'admin' ? 'adminToken' : 'token';
    localStorage.setItem(key, token);
    if (role === 'admin') { setAdminToken(token); setUser({ role: 'admin', name: 'Administrator' }); }
    else { setToken(token); setUser(userData); }
    toast.success('Logged in successfully');
  };

  const logout = () => {
    ['token', 'adminToken'].forEach(k => localStorage.removeItem(k));
    setToken(null); setAdminToken(null); setUser(null);
  };

  const value = {
    user, token, adminToken, loading, login, logout,
    courses, loadingCourses, fetchCourses, enrolledCourses, fetchEnrolledCourses,
    isDark, toggleTheme,
    isAdmin: user?.role === 'admin' || !!adminToken,
    isEducator: user?.role === 'educator',
    isStudent: user?.role === 'student' || (!user?.role && !!token),
    calculateRating: (c) => {
      if (!c.courseRatings?.length) return 0;
      return (c.courseRatings.reduce((acc, r) => acc + Number(r.rating), 0) / c.courseRatings.length).toFixed(1);
    },
    currency: import.meta.env.VITE_CURRENCY || '₹',
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export default StoreProvider;
export { StoreContext as AuthContext };
export const useAuth = useStore;
export const useAppContext = useStore;
