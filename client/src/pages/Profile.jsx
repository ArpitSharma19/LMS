import React, { useState } from 'react';
import StudentLayout from '../layouts/StudentLayout';
import EducatorLayout from '../layouts/EducatorLayout';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';

const Profile = () => {
  const { user, isEducator, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        return toast.error('Please upload an image file');
    }

    if (file.size > 5 * 1024 * 1024) {
        return toast.error('File size should be less than 5MB');
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      const { data } = await api.post('/api/user/update-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success) {
        setUser({ ...user, imageUrl: data.imageUrl });
        toast.success('Profile image updated');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const Layout = isEducator ? EducatorLayout : StudentLayout;

  const personalInfo = [
    { label: 'Display Name', value: user?.name, icon: 'person' },
    { label: 'Email Address', value: user?.email, icon: 'mail' },
    { label: 'Account Role', value: user?.role, icon: 'badge' },
    { label: 'Status', value: user?.status || 'Active', icon: 'verified' },
  ];

  const educatorInfo = [
    { label: 'Experience', value: user?.experience || '5+ Years', icon: 'history_edu' },
    { label: 'Qualifications', value: user?.qualification || 'PhD in Computer Science', icon: 'workspace_premium' },
    { label: 'Field of Expertise', value: user?.field || 'Web Development', icon: 'code' },
  ];

  return (
    <Layout 
      title="Account Settings" 
      subtitle="Manage your professional presence and personal information."
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-xl shadow-sm flex flex-col md:flex-row items-center gap-xl">
           <div className="relative group">
              <div className={`w-32 h-32 rounded-full bg-primary-container text-primary flex items-center justify-center text-4xl font-black border-4 border-surface shadow-xl overflow-hidden group-hover:scale-105 transition-all ${uploading ? 'opacity-50' : ''}`}>
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0) || 'U'
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <span className="material-symbols-outlined animate-spin text-white">sync</span>
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-on-primary rounded-full border-4 border-surface flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all cursor-pointer">
                 <span className="material-symbols-outlined text-[18px]">edit</span>
                 <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </label>
           </div>
           
           <div className="flex flex-col text-center md:text-left gap-xs">
              <h2 className="text-2xl font-black text-on-surface">{user?.name}</h2>
              <p className="text-body-md text-on-surface-variant flex items-center justify-center md:justify-start gap-sm">
                 <span className="material-symbols-outlined text-[18px]">mail</span>
                 {user?.email}
              </p>
              <div className="flex items-center justify-center md:justify-start gap-sm mt-sm">
                 <span className="bg-primary/10 text-primary text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-primary/20">
                    {user?.role}
                 </span>
                 <span className="bg-success/10 text-success text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-success/20">
                    Verified
                 </span>
              </div>
           </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
           <div className="flex border-b border-outline-variant px-lg">
              <button 
                onClick={() => setActiveTab('personal')}
                className={`px-lg py-md text-body-sm font-bold border-b-2 transition-all ${activeTab === 'personal' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
              >
                 Personal Information
              </button>
              {isEducator && (
                <button 
                   onClick={() => setActiveTab('professional')}
                   className={`px-lg py-md text-body-sm font-bold border-b-2 transition-all ${activeTab === 'professional' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
                >
                   Professional Profile
                </button>
              )}
           </div>

           <div className="p-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                 {(activeTab === 'personal' ? personalInfo : educatorInfo).map((item, i) => (
                    <div key={i} className="flex flex-col gap-sm">
                       <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-sm">
                          <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                          {item.label}
                       </label>
                       <div className="bg-surface-container-low border border-outline-variant rounded-xl px-md py-sm text-body-md text-on-surface font-medium flex items-center justify-between">
                          <span>{item.value}</span>
                          <span className="material-symbols-outlined text-[18px] text-outline opacity-50">lock</span>
                       </div>
                    </div>
                 ))}
                 {activeTab === 'professional' && (
                    <div className="md:col-span-2 flex flex-col gap-sm">
                       <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-sm">
                          <span className="material-symbols-outlined text-[16px]">description</span>
                          Professional Bio
                       </label>
                       <textarea 
                          className="bg-surface-container-low border border-outline-variant rounded-xl px-md py-sm text-body-md text-on-surface font-medium min-h-[120px] focus:outline-none focus:border-primary transition-all"
                          defaultValue={user?.bio || "Highly experienced educator dedicated to empowering students through practical, project-based learning. Passionate about web technologies and modern architectural patterns."}
                       />
                    </div>
                 )}
              </div>
              
              <div className="mt-xl pt-lg border-t border-outline-variant flex justify-end gap-md">
                 <button className="px-lg py-sm rounded-xl border border-outline text-on-surface font-bold hover:bg-surface-container-low transition-all">
                    Reset Changes
                 </button>
                 <button className="px-lg py-sm rounded-xl bg-primary text-on-primary font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    Update Profile
                 </button>
              </div>
           </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
