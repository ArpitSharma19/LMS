import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets';

const Certificate = () => {
  const navigate = useNavigate();
  const { enrolledCourses } = useStore();
  const [requesting, setRequesting] = useState(null);

  const handleRequest = async (courseId) => {
    setRequesting(courseId);
    try {
      const { data } = await api.post('/api/certificate/request', { courseId });
      if (data.success) {
        toast.success(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setRequesting(null);
    }
  };

  return (
    <div className="min-h-screen px-4 sm:px-10 md:px-14 lg:px-36 py-10 bg-gray-50 dark:bg-slate-900 transition-colors">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Certificates</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Request and download certificates for your completed courses.</p>
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <p className="text-gray-500 dark:text-slate-400">You haven't enrolled in any courses yet.</p>
            <button
              onClick={() => navigate('/course-list')}
              className="mt-4 text-blue-600 font-medium hover:underline"
            >
              Explore Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrolledCourses.map((course) => (
              <div key={course.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm flex gap-4">
                <img 
                  src={course.courseThumbnail} 
                  alt="" 
                  className="w-24 h-24 rounded-xl object-cover border border-gray-100 dark:border-slate-700" 
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight mb-1">{course.courseTitle}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Purchased on {new Date(course.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">Completed</span>
                    </div>
                    <button
                      disabled={requesting === course.id}
                      onClick={() => handleRequest(course.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                    >
                      {requesting === course.id ? 'Processing...' : 'Request Certificate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 p-8 bg-gradient-to-br from-gray-900 to-slate-800 rounded-3xl text-white relative overflow-hidden">
          <div className="relative z-10 max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Why get a certificate?</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Certificates prove your hard work and expertise. Use them to enhance your resume, LinkedIn profile, or portfolio to stand out to employers.
            </p>
            <div className="flex gap-8">
              <div>
                <p className="text-2xl font-bold text-blue-400">100%</p>
                <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Verifiable</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">Global</p>
                <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Recognition</p>
              </div>
            </div>
          </div>
          <div className="absolute right-[-5%] top-[-10%] opacity-10">
            <img src={assets.logo} className="w-96 grayscale invert" alt="" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
