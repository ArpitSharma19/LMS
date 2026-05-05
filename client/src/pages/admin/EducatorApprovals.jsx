import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';

const EducatorApprovals = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/admin/pending-educators');
      if (data.success) {
        setPending(data.data);
      }
    } catch (error) {
      toast.error('Failed to load pending educators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (educatorId, action) => {
    try {
      const endpoint = action === 'approve' ? '/api/admin/approve-educator' : '/api/admin/reject-educator';
      const { data } = await api.post(endpoint, { educatorId });
      if (data.success) {
        toast.success(`Educator ${action}d successfully`);
        setPending(prev => prev.filter(p => p.id !== educatorId));
      }
    } catch (error) {
      toast.error(`Action failed: ${error.response?.data?.message}`);
    }
  };

  return (
    <AdminLayout 
      title="Educator Verification" 
      subtitle="Review and moderate educator applications to maintain platform quality."
    >
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="p-lg border-b border-outline-variant bg-surface flex items-center justify-between">
          <h3 className="text-h6 font-bold text-on-surface">Pending Applications ({pending.length})</h3>
          <button 
            onClick={fetchPending}
            className="w-10 h-10 rounded-lg hover:bg-surface-container-low flex items-center justify-center transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low/50 text-label-caps text-on-surface-variant border-b border-outline-variant">
              <tr>
                <th className="px-lg py-md font-semibold">Applicant</th>
                <th className="px-lg py-md font-semibold">Qualification</th>
                <th className="px-lg py-md font-semibold">Exp</th>
                <th className="px-lg py-md font-semibold">Field</th>
                <th className="px-lg py-md font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-body-sm">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-lg py-md"><div className="h-4 bg-surface-container w-32 rounded" /></td>
                    <td className="px-lg py-md"><div className="h-4 bg-surface-container w-24 rounded" /></td>
                    <td className="px-lg py-md"><div className="h-4 bg-surface-container w-10 rounded" /></td>
                    <td className="px-lg py-md"><div className="h-4 bg-surface-container w-24 rounded" /></td>
                    <td className="px-lg py-md flex justify-end gap-sm"><div className="h-8 bg-surface-container w-20 rounded" /></td>
                  </tr>
                ))
              ) : pending.length > 0 ? (
                pending.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="px-lg py-md flex items-center gap-sm">
                      <img 
                        src={item.User?.imageUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&auto=format&fit=crop&q=60"} 
                        className="w-10 h-10 rounded-full border border-outline-variant"
                        alt={item.User?.name}
                      />
                      <div>
                        <p className="font-bold text-on-surface">{item.User?.name}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase font-black tracking-widest">{item.User?.email}</p>
                      </div>
                    </td>
                    <td className="px-lg py-md text-on-surface font-bold italic">{item.qualification || 'N/A'}</td>
                    <td className="px-lg py-md text-on-surface font-black text-primary">{item.experience ? `${item.experience} yrs` : 'N/A'}</td>
                    <td className="px-lg py-md">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                            {item.specialty || 'N/A'}
                        </span>
                    </td>
                    <td className="px-lg py-md">
                      <div className="flex items-center justify-end gap-sm">
                        <button 
                          onClick={() => handleAction(item.id, 'reject')}
                          className="px-md py-sm border border-error/30 text-error rounded-lg font-bold hover:bg-error/5 transition-all text-[12px]"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleAction(item.id, 'approve')}
                          className="px-md py-sm bg-primary text-on-primary rounded-lg font-bold hover:bg-primary/90 transition-all shadow-md text-[12px]"
                        >
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-lg py-24 text-center">
                    <div className="flex flex-col items-center gap-sm opacity-50">
                      <span className="material-symbols-outlined text-[48px]">check_circle</span>
                      <p className="text-body-md font-medium text-on-surface-variant italic">All caught up! No pending applications.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EducatorApprovals;
