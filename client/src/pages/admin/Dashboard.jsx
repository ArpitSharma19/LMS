import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { formatCurrency } from '../../utils/currency';


const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalEducators: 0,
    totalCourses: 0,
    totalRevenue: 0,
    dailyActive: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/admin/stats');
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      toast.error('Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const metricCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: 'group', color: 'bg-primary-container text-primary', trend: '+12%' },
    { title: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: 'account_balance_wallet', color: 'bg-secondary-container text-secondary', trend: '+8%' },
    { title: 'Active Courses', value: stats.totalCourses, icon: 'local_library', color: 'bg-tertiary-container text-tertiary', trend: '+5%' },
    { title: 'Daily Active', value: stats.dailyActive, icon: 'bolt', color: 'bg-error-container text-error', trend: '+15%' },
  ];

  return (
    <AdminLayout
      title="System Overview"
      subtitle="Real-time monitoring of BrainLyft platform health and growth."
    >
      <div className="flex flex-col gap-xl">
        {/* Metric Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
          {metricCards.map((card, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest border border-outline-variant p-lg rounded-2xl flex flex-col gap-md shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                  <span className="material-symbols-outlined text-[24px]">{card.icon}</span>
                </div>
                <span className="text-[11px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">{card.trend}</span>
              </div>
              <div>
                <p className="text-body-sm font-semibold text-on-surface-variant uppercase tracking-widest">{card.title}</p>
                <h3 className="text-2xl font-black text-on-surface">{loading ? '...' : card.value}</h3>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
          {/* User Distribution */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-lg shadow-sm">
            <div className="flex items-center justify-between mb-lg">
                <h3 className="text-h6 font-bold text-on-surface">User Distribution</h3>
                <span className="material-symbols-outlined text-on-surface-variant">analytics</span>
            </div>
            <div className="flex flex-col gap-md">
              <div className="space-y-sm">
                <div className="flex justify-between text-body-sm font-bold">
                  <span className="text-on-surface">Students</span>
                  <span className="text-on-surface-variant">{stats?.totalStudents || 0}</span>
                </div>
                <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-1000" style={{ width: (stats?.totalUsers || 0) > 0 ? `${((stats?.totalStudents || 0) / stats.totalUsers) * 100}%` : '0%' }} />
                </div>
              </div>
              <div className="space-y-sm">
                <div className="flex justify-between text-body-sm font-bold">
                  <span className="text-on-surface">Educators</span>
                  <span className="text-on-surface-variant">{stats?.totalEducators || 0}</span>
                </div>
                <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-secondary transition-all duration-1000" style={{ width: (stats?.totalUsers || 0) > 0 ? `${((stats?.totalEducators || 0) / stats.totalUsers) * 100}%` : '0%' }} />
                </div>
              </div>
              <div className="space-y-sm">
                <div className="flex justify-between text-body-sm font-bold">
                  <span className="text-on-surface">System Admins</span>
                  <span className="text-on-surface-variant">{(stats?.totalUsers || 0) - (stats?.totalStudents || 0) - (stats?.totalEducators || 0)}</span>
                </div>
                <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary transition-all duration-1000" style={{ width: (stats?.totalUsers || 0) > 0 ? `${(((stats?.totalUsers || 0) - (stats?.totalStudents || 0) - (stats?.totalEducators || 0)) / stats.totalUsers) * 100}%` : '0%' }} />
                </div>
              </div>
            </div>
          </section>

          {/* Quick Controls */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-lg shadow-sm flex flex-col gap-lg">
            <h3 className="text-h6 font-bold text-on-surface">Platform Controls</h3>
            <div className="grid grid-cols-2 gap-md">
              <button 
                onClick={() => navigate('/admin/approvals')}
                className="flex flex-col items-center justify-center gap-sm p-lg bg-surface-container-low rounded-xl border border-outline-variant hover:bg-primary-container/20 hover:border-primary transition-all group"
              >
                <span className="material-symbols-outlined text-[32px] text-primary group-hover:scale-110 transition-transform">verified_user</span>
                <span className="text-body-sm font-bold text-on-surface">Educator Requests</span>
              </button>
              <button 
                onClick={() => navigate('/admin/settings')}
                className="flex flex-col items-center justify-center gap-sm p-lg bg-surface-container-low rounded-xl border border-outline-variant hover:bg-secondary-container/20 hover:border-secondary transition-all group"
              >
                <span className="material-symbols-outlined text-[32px] text-secondary group-hover:scale-110 transition-transform">account_balance</span>
                <span className="text-body-sm font-bold text-on-surface">Financials</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-sm p-lg bg-surface-container-low rounded-xl border border-outline-variant hover:bg-tertiary-container/20 hover:border-tertiary transition-all group">
                <span className="material-symbols-outlined text-[32px] text-tertiary group-hover:scale-110 transition-transform">monitoring</span>
                <span className="text-body-sm font-bold text-on-surface">System Logs</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-sm p-lg bg-surface-container-low rounded-xl border border-outline-variant hover:bg-error-container/20 hover:border-error transition-all group">
                <span className="material-symbols-outlined text-[32px] text-error group-hover:scale-110 transition-transform">settings</span>
                <span className="text-body-sm font-bold text-on-surface">Maintenance</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
