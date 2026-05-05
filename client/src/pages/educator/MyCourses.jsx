import React, { useState, useEffect } from 'react';
import EducatorLayout from '../../layouts/EducatorLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/educator/courses');
      if (data.success) {
        setCourses(data.courses);
      }
    } catch (error) {
      toast.error('Failed to load your courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCourses();
  }, []);

  return (
    <EducatorLayout 
      title="Course Management" 
      subtitle="Optimize your curriculum and track student engagement across your portfolio."
    >
      <div className="flex flex-col gap-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {/* Add New Card - Premium Style */}
          <div 
            onClick={() => navigate('/educator/add-course')}
            className="group relative border-2 border-dashed border-primary/30 rounded-3xl flex flex-col items-center justify-center p-xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer min-h-[340px] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center mb-md group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all shadow-xl">
              <span className="material-symbols-outlined text-[40px]">add_circle</span>
            </div>
            <h3 className="text-xl font-black text-on-surface group-hover:text-primary transition-colors tracking-tight">Create New Track</h3>
            <p className="text-[12px] font-bold text-on-surface-variant mt-sm text-center max-w-[200px] uppercase tracking-tighter opacity-70">Design a new high-impact learning experience</p>
          </div>

          {loading ? (
            [...Array(2)].map((_, i) => (
              <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-3xl h-[340px] animate-pulse" />
            ))
          ) : (
            courses.map((course) => (
              <div 
                key={course.id}
                className="group bg-surface-container-lowest border border-outline-variant rounded-3xl overflow-hidden flex flex-col hover:border-primary/50 hover:shadow-2xl transition-all duration-500 shadow-sm relative"
              >
                <div className="aspect-video w-full bg-surface-container relative overflow-hidden">
                  <img 
                    src={course.courseThumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"} 
                    alt={course.courseTitle}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-md left-md">
                     <span className="bg-surface-container-lowest/80 backdrop-blur-md text-primary text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest border border-white/20 shadow-sm">
                        {course.category}
                     </span>
                  </div>
                </div>
                
                <div className="p-lg flex flex-col gap-lg flex-1">
                  <div>
                    <h3 className="text-lg font-black text-on-surface line-clamp-1 group-hover:text-primary transition-colors tracking-tight">{course.courseTitle}</h3>
                    <div className="flex items-center gap-sm mt-sm">
                       <div className="flex -space-x-2">
                          {[1,2,3].map(i => (
                             <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+course.id}`} className="w-6 h-6 rounded-full border-2 border-surface-container-lowest" alt="" />
                          ))}
                       </div>
                       <span className="text-[11px] font-black text-on-surface-variant uppercase tracking-tighter">
                          {course.enrolledCount || 0} Learners enrolled
                       </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-sm">
                     <div className="bg-surface-container-low p-md rounded-2xl border border-outline-variant/30">
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Revenue</p>
                        <p className="text-lg font-black text-on-surface">
                           {Number(course.coursePrice) === 0 ? 'Free' : `$${(course.enrolledCount || 0) * course.coursePrice}`}
                        </p>
                     </div>
                     <div className="bg-surface-container-low p-md rounded-2xl border border-outline-variant/30">
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Avg Rating</p>
                        <div className="flex items-center gap-1">
                           <p className="text-lg font-black text-on-surface">4.8</p>
                           <span className="material-symbols-outlined text-amber-500 text-[18px] fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </div>
                     </div>
                  </div>

                  <div className="mt-auto pt-lg border-t border-outline-variant/30 flex items-center gap-sm">
                    <button 
                      onClick={() => navigate(`/educator/edit-course/${course.id}`)}
                      className="flex-1 py-3 bg-primary/10 text-primary font-black rounded-xl hover:bg-primary hover:text-on-primary transition-all text-[12px] uppercase tracking-widest shadow-sm active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      Edit
                    </button>
                    <button 
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
                          try {
                            const { data } = await api.delete(`/api/educator/course/${course.id}`);
                            if (data.success) {
                              toast.success('Course deleted');
                              fetchMyCourses();
                            }
                          } catch (e) {
                            toast.error('Failed to delete course');
                          }
                        }
                      }}
                      className="p-3 bg-error/10 text-error rounded-xl hover:bg-error hover:text-on-error transition-all active:scale-95 shadow-sm"
                      title="Delete Track"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </EducatorLayout>
  );
};

export default MyCourses;