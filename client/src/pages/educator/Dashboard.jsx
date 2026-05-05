import React, { useState, useEffect } from 'react';
import EducatorLayout from '../../layouts/EducatorLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { formatCurrency } from '../../utils/currency';

import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalCourses: 0,
    enrolledStudentsData: []
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (user?.status === 'pending') {
        setLoading(false);
        return;
    }
    try {
      setLoading(true);
      const { data } = await api.get('/api/educator/dashboard');
      if (data.success) {
        setStats(data.dashboardData);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const cards = [
    { title: 'Total Revenue', value: formatCurrency(stats.totalEarnings), icon: 'payments', color: 'bg-primary-container text-primary' },
    { title: 'Active Courses', value: stats.totalCourses, icon: 'book', color: 'bg-secondary-container text-secondary' },
    { title: 'Total Students', value: stats.totalStudents || 0, icon: 'group', color: 'bg-tertiary-container text-tertiary' },
  ];

  if (user?.status === 'pending') {
    return (
      <EducatorLayout 
        title="Account Pending Approval" 
        subtitle="Your educator application is being reviewed by our administration team."
      >
        <div className="flex flex-col items-center justify-center py-24 text-center bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm">
          <div className="w-24 h-24 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mb-lg animate-pulse">
            <span className="material-symbols-outlined text-[48px]">pending_actions</span>
          </div>
          <h2 className="text-h4 font-bold text-on-surface">Application Under Review</h2>
          <p className="text-body-md text-on-surface-variant max-w-md mx-auto mt-sm">
            We've received your application and are currently verifying your credentials. This process typically takes 24-48 hours. You will be notified via email once approved.
          </p>
          <div className="mt-xl flex flex-col gap-sm">
             <div className="flex items-center gap-sm text-body-sm font-medium text-amber-600 bg-amber-500/10 px-md py-sm rounded-lg border border-amber-500/20">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                Status: Pending Verification
             </div>
          </div>
        </div>
      </EducatorLayout>
    );
  }

  return (
    <EducatorLayout 
      title="Educator Dashboard" 
      subtitle="Overview of your course performance and student engagement."
    >
      <div className="flex flex-col gap-xl">
        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
          {cards.map((card, i) => (
            <div 
              key={i} 
              className="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl flex items-center gap-md shadow-sm hover:shadow-md transition-shadow animate-in fade-in zoom-in-95 duration-500"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.color}`}>
                <span className="material-symbols-outlined text-[28px]">{card.icon}</span>
              </div>
              <div>
                <p className="text-body-sm font-medium text-on-surface-variant uppercase tracking-wider">{card.title}</p>
                <h3 className="text-h4 font-bold text-on-surface">{loading ? '...' : card.value}</h3>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
          {/* Recent Enrollments */}
          <section className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
            <div className="p-lg border-b border-outline-variant flex items-center justify-between bg-surface">
              <h3 className="text-h6 font-bold text-on-surface">Recent Student Enrollments</h3>
              <button className="text-primary font-bold text-body-sm hover:underline">View All</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low/50 text-label-caps text-on-surface-variant border-b border-outline-variant">
                  <tr>
                    <th className="px-lg py-md font-semibold">Student</th>
                    <th className="px-lg py-md font-semibold">Course</th>
                    <th className="px-lg py-md font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-body-sm">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-lg py-md"><div className="h-4 bg-surface-container w-32 rounded" /></td>
                        <td className="px-lg py-md"><div className="h-4 bg-surface-container w-48 rounded" /></td>
                        <td className="px-lg py-md"><div className="h-6 bg-surface-container w-20 rounded-full" /></td>
                      </tr>
                    ))
                  ) : stats.enrolledStudentsData.length > 0 ? (
                    stats.enrolledStudentsData.slice(0, 5).map((item, i) => (
                      <tr key={i} className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="px-lg py-md flex items-center gap-sm">
                          <img 
                            src={item.student?.imageUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&auto=format&fit=crop&q=60"} 
                            className="w-8 h-8 rounded-full border border-outline-variant"
                            alt={item.student?.name}
                          />
                          <span className="font-semibold text-on-surface">{item.student?.name}</span>
                        </td>
                        <td className="px-lg py-md text-on-surface-variant font-medium">{item.courseTitle}</td>
                        <td className="px-lg py-md">
                          <span className="bg-success/10 text-success px-sm py-[2px] rounded-full font-bold text-[11px] uppercase tracking-wider">Active</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-lg py-xl text-center text-on-surface-variant italic">No recent enrollments found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Quick Actions / Revenue Chart Placeholder */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col gap-lg shadow-sm">
            <h3 className="text-h6 font-bold text-on-surface">Revenue Growth</h3>
            <div className="h-48 w-full bg-surface-container-low rounded-lg flex items-end justify-between p-md gap-2">
              {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                <div 
                  key={i} 
                  className="w-full bg-primary rounded-t-sm transition-all duration-1000" 
                  style={{ height: `${h}%`, opacity: 0.3 + (i * 0.1) }}
                />
              ))}
            </div>
            <div className="flex flex-col gap-sm">
               <button 
                onClick={() => navigate('/educator/add-course')}
                className="w-full bg-primary text-on-primary py-md rounded-xl font-bold shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2"
               >
                 <span className="material-symbols-outlined">add_box</span>
                 Create New Course
               </button>
               <button className="w-full border border-outline text-on-surface py-md rounded-xl font-bold hover:bg-surface-container-low transition-all">
                 Download Report
               </button>
            </div>
          </section>
        </div>
      </div>
    </EducatorLayout>
  );
};

export default Dashboard;