import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const MyEnrollments = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/user/enrolled-courses');
      if (data.success) {
        const coursesWithProgress = await Promise.all(
          data.enrolledCourses.map(async (course) => {
            try {
              const progressRes = await api.post('/api/user/get-course-progress', { courseId: String(course.id) });
              const progressData = progressRes.data.progressData;
              const completedCount = progressData?.lectureCompleted?.length || 0;
              const totalLectures = course.courseContent?.reduce((acc, chap) => acc + (chap.chapterContent?.length || 0), 0) || 1;
              return {
                ...course,
                progress: Math.round((completedCount / totalLectures) * 100)
              };
            } catch (e) {
              return { ...course, progress: 0 };
            }
          })
        );
        setEnrolledCourses(coursesWithProgress);
      }
    } catch (error) {
      toast.error('Failed to load your enrollments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  return (
    <StudentLayout
      title="My Learning Library"
      subtitle="Pick up where you left off and master new skills."
    >
      <div className="flex flex-col gap-xl">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
            {enrolledCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => navigate(`/learn/${course.id}/lesson`)}
                className="group bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden flex flex-col hover:border-primary/50 hover:shadow-2xl transition-all duration-500 cursor-pointer active:scale-[0.98] max-w-full"
              >
                <div className="aspect-video w-full bg-surface-container relative overflow-hidden">
                  <img
                    src={course.courseThumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"}
                    alt={course.courseTitle}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 border border-white/40 flex items-center justify-center scale-75 group-hover:scale-100 transition-transform">
                      <span className="material-symbols-outlined text-white text-[40px] fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    </div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="bg-surface-container-lowest/80 backdrop-blur-md text-primary text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest border border-white/20 shadow-sm truncate max-w-[100px]">
                      {course.category || 'Module'}
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:p-lg flex flex-col gap-md">
                  <h3 className="text-base sm:text-lg lg:text-xl font-black text-on-surface line-clamp-2 break-words group-hover:text-primary transition-colors tracking-tight leading-tight">
                    {course.courseTitle}
                  </h3>

                  <div className="flex flex-col gap-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] sm:text-[11px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Completion</span>
                      <span className="text-[11px] sm:text-[12px] font-black text-primary">{course.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden p-[1px] border border-outline-variant/30">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 shadow-sm ${course.progress === 100 ? 'bg-success' : 'bg-primary'}`}
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between mt-xs pt-4 border-t border-outline-variant/30 gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-surface-container-lowest bg-surface-container-high overflow-hidden">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + course.id}`} alt="user" />
                        </div>
                      ))}
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-surface-container-lowest bg-primary text-[7px] sm:text-[8px] font-black flex items-center justify-center text-on-primary">
                        +12
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-black text-primary uppercase tracking-widest group-hover:translate-x-1 transition-transform truncate">
                      {course.progress === 100 ? 'Review track' : 'Resume learning'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center 
  py-16 sm:py-24 lg:py-32 
  px-4 sm:px-6 lg:px-8
  bg-surface-container-low/20 
  border-2 border-dashed border-outline-variant 
  rounded-2xl sm:rounded-3xl"
          >
            {/* Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 
    bg-surface-container 
    rounded-2xl sm:rounded-3xl 
    flex items-center justify-center 
    mb-4 sm:mb-6 
    text-outline rotate-12"
            >
              <span className="material-symbols-outlined text-3xl sm:text-4xl lg:text-[48px]">
                auto_stories
              </span>
            </div>

            {/* Heading */}
            <h3 className="text-xl sm:text-2xl lg:text-3xl 
    font-black text-on-surface 
    tracking-tight leading-snug"
            >
              Your learning journey starts here
            </h3>

            {/* Description */}
            <p className="text-sm sm:text-base lg:text-lg 
    text-on-surface-variant 
    mt-2 sm:mt-3 
    max-w-xs sm:max-w-md 
    font-semibold opacity-70"
            >
              Enroll in your first course to begin tracking your progress and earning certifications.
            </p>

            {/* Button */}
            <button
              onClick={() => navigate('/')}
              className="mt-6 sm:mt-8 
      w-full sm:w-auto
      bg-primary text-on-primary 
      px-6 sm:px-8 lg:px-10 
      py-3 sm:py-4 
      rounded-xl 
      font-bold sm:font-black 
      shadow-lg sm:shadow-xl 
      hover:shadow-primary/30 
      transition-all 
      hover:-translate-y-1 active:translate-y-0"
            >
              Browse Course Catalog
            </button>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default MyEnrollments;