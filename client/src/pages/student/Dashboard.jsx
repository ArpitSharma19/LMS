import React, { useState, useEffect } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date());
  const [streak, setStreak] = useState(0);
  const [activityMap, setActivityMap] = useState({});

  const fetchDashboardData = async () => {
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
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const streakValue = user?.streak || 0;
  const completedDates = user?.completedDates || [];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const days = [];

  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getDayStatus = (day) => {
    if (!day) return '';
    
    // Create date in local time
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    // Format to YYYY-MM-DD in local time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    
    const now = new Date();
    const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const isToday = dateString === todayString;
    const isFuture = date > now && !isToday;
    const isSunday = date.getDay() === 0;
    const isSaturday = date.getDay() === 6;

    if (isSunday) return 'bg-surface-container-high/30 text-on-surface-variant opacity-40'; // Sunday: Idle/Grey
    if (isFuture) return 'bg-surface text-on-surface opacity-10';
    
    if (completedDates.includes(dateString)) {
      return 'bg-success text-on-success shadow-md shadow-success/20 ring-2 ring-success/30'; 
    }

    if (isToday) return 'border-2 border-primary text-primary font-black scale-105 shadow-lg';
    
    // If it's a past weekday and not completed, it's MISSED
    if (date < now && !isToday && !isSunday) {
        return 'bg-error/20 text-error border border-error/20';
    }
    
    return 'bg-surface text-on-surface-variant opacity-30';
  };

  const totalProgress = enrolledCourses.length > 0 
    ? Math.round(enrolledCourses.reduce((acc, c) => acc + (c.progress || 0), 0) / enrolledCourses.length) 
    : 0;

  // Simple SVG Charts
  const BarChart = ({ data }) => (
    <div className="flex items-end gap-2 h-24 w-full px-2">
      {data.map((val, i) => (
        <div key={i} className="flex-1 bg-primary/20 rounded-t-md relative group">
          <div 
            className="absolute bottom-0 w-full bg-primary rounded-t-md transition-all duration-1000 group-hover:brightness-110" 
            style={{ height: `${val}%` }} 
          />
        </div>
      ))}
    </div>
  );

  const PieChart = ({ percent }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    return (
      <svg className="w-24 h-24 transform -rotate-90">
        <circle cx="48" cy="48" r={radius} className="text-surface-container stroke-current" strokeWidth="10" fill="transparent" />
        <circle 
          cx="48" cy="48" r={radius} 
          className="text-primary stroke-current transition-all duration-1000" 
          strokeWidth="10" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          strokeLinecap="round" 
          fill="transparent" 
        />
      </svg>
    );
  };

  return (
    <StudentLayout 
      title="Learning Dashboard" 
      subtitle={`Welcome back, ${user?.name || 'Scholar'}! Keep your momentum going.`}
    >
      <div className="flex flex-col gap-xl pb-xxl">
        {/* Analytics & Streak Header */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          <div className="lg:col-span-2 bg-gradient-to-br from-primary to-primary-container text-on-primary p-lg sm:p-xl rounded-3xl shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between group gap-lg">
             <div className="relative z-10">
                <h2 className="text-xl sm:text-2xl font-black mb-xs tracking-tight">Your Learning Streak</h2>
                <div className="flex items-center gap-md">
                   <span className="text-7xl font-black drop-shadow-2xl animate-in zoom-in duration-700">{streakValue}</span>
                   <div className="flex flex-col">
                      <span className="font-black uppercase tracking-[0.2em] text-[12px] opacity-80">Days Fire Streak</span>
                      <span className="text-sm font-bold opacity-90">
                        {streakValue > 0 ? "You're on fire! Don't let it go out." : "Start a new streak today!"}
                      </span>
                   </div>
                </div>
             </div>
             <div className="absolute -right-6 -bottom-6 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
             <span className="material-symbols-outlined text-[160px] absolute -right-4 -bottom-4 opacity-20 rotate-12 select-none group-hover:rotate-0 transition-transform duration-700">local_fire_department</span>
          </div>
          
          <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-3xl shadow-sm flex items-center gap-lg relative overflow-hidden group">
             <div className="flex-1 flex flex-col gap-sm">
                <span className="text-[12px] font-black uppercase tracking-widest text-on-surface-variant">Overall Mastery</span>
                <h3 className="text-3xl font-black text-on-surface">{totalProgress}%</h3>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-tighter opacity-70">
                  {enrolledCourses.filter(c => c.progress === 100).length} of {enrolledCourses.length} Tracks Finished
                </p>
             </div>
             <div className="relative flex items-center justify-center">
                <PieChart percent={totalProgress} />
                <span className="absolute text-[10px] font-black text-primary uppercase">Total</span>
             </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
          {/* Main Content: Active Courses */}
          <div className="lg:col-span-2 flex flex-col gap-lg">
            <section className="bg-surface-container-lowest border border-outline-variant p-lg rounded-3xl shadow-sm">
               <div className="flex items-center justify-between mb-lg">
                  <h3 className="text-sm font-black text-on-surface tracking-widest uppercase">Weekly Engagement</h3>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase">Activity</span>
                     </div>
                  </div>
               </div>
               <BarChart data={[40, 70, 45, 90, 65, 80, 55]} />
               <div className="flex justify-between mt-4 px-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, idx) => (
                    <span key={`${d}-${idx}`} className="text-[10px] font-black text-on-surface-variant/40 uppercase">{d}</span>
                  ))}
               </div>
            </section>

            <div className="flex items-center justify-between border-b border-outline-variant pb-md mt-lg">
                <h3 className="text-lg font-black text-on-surface tracking-tight uppercase">In-Progress Tracks</h3>
                <button onClick={() => navigate('/my-enrollments')} className="text-primary font-black text-[12px] uppercase tracking-widest hover:bg-primary/5 px-md py-sm rounded-lg transition-all">View All</button>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-2xl h-[320px] animate-pulse" />
                ))}
              </div>
            ) : enrolledCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
                {enrolledCourses
                  .filter(c => (c.progress || 0) < 100)
                  .sort((a, b) => b.progress - a.progress)
                  .slice(0, 2)
                  .map(course => (
                  <div key={course.id} 
                    onClick={() => navigate(`/learn/${course.id}/lesson`)}
                    className="group bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:border-primary/30 transition-all duration-500 cursor-pointer"
                  >
                     <div className="aspect-video relative overflow-hidden">
                        <img src={course.courseThumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                        <span className="absolute top-md right-md bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest border border-white/20">
                           {course.category || 'General'}
                        </span>
                     </div>
                     <div className="p-lg">
                        <h4 className="text-lg font-black text-on-surface line-clamp-1 mb-md group-hover:text-primary transition-colors">{course.courseTitle}</h4>
                        <div className="space-y-sm bg-surface-container-low p-md rounded-xl border border-outline-variant/30">
                           <div className="flex justify-between text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                              <span>Track Progress</span>
                              <span className="text-primary">{course.progress}%</span>
                           </div>
                           <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${course.progress}%` }} />
                           </div>
                        </div>
                        <button 
                           onClick={() => navigate(`/player/${course.id}`)}
                           className="w-full mt-lg bg-inverse-surface text-inverse-on-surface font-black py-md rounded-xl hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/30 active:scale-95"
                        >
                           <span className="material-symbols-outlined text-[20px]">play_circle</span>
                           Resume track
                        </button>
                     </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface-container-low/20 border-2 border-dashed border-outline-variant rounded-3xl py-24 flex flex-col items-center justify-center text-center px-lg">
                 <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-md text-outline">
                    <span className="material-symbols-outlined text-[40px]">import_contacts</span>
                 </div>
                 <h4 className="text-xl font-black text-on-surface mb-xs">Your library is empty</h4>
                 <p className="text-on-surface-variant font-bold text-sm max-w-xs mb-lg opacity-70">Expand your horizons by enrolling in our expert-led courses.</p>
                 <button onClick={() => navigate('/')} className="bg-primary text-on-primary px-xl py-md rounded-xl font-black shadow-lg hover:shadow-primary/30 transition-all">Find a Course</button>
              </div>
            )}
          </div>

          {/* Sidebar: Calendar & Activity */}
          <div className="flex flex-col gap-lg">
             <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-lg shadow-sm">
                <div className="flex items-center justify-between mb-xl">
                   <h4 className="font-black text-on-surface tracking-tight uppercase text-sm">Study Calendar</h4>
                   <div className="flex items-center gap-2 bg-surface-container px-3 py-1 rounded-full border border-outline-variant">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                        {currentDate.toLocaleString('default', { month: 'short' })}
                      </span>
                   </div>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-on-surface-variant uppercase mb-md opacity-30">
                   {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => <div key={`${d}-${idx}`}>{d}</div>)}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                   {days.map((day, i) => (
                      <div 
                         key={i} 
                         className={`aspect-square flex items-center justify-center rounded-xl text-[11px] font-black transition-all border border-transparent ${getDayStatus(day)}`}
                      >
                         {day}
                      </div>
                   ))}
                </div>
                
                <div className="mt-xl grid grid-cols-3 gap-2 border-t border-outline-variant pt-lg">
                   <div className="flex flex-col items-center gap-1">
                      <div className="w-full h-1 rounded-full bg-success shadow-[0_0_8px_rgba(var(--success-rgb),0.5)]" />
                      <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-tighter">Active</span>
                   </div>
                   <div className="flex flex-col items-center gap-1">
                      <div className="w-full h-1 rounded-full bg-error opacity-20" />
                      <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-tighter">Missed</span>
                   </div>
                   <div className="flex flex-col items-center gap-1">
                      <div className="w-full h-1 rounded-full bg-surface-container-high" />
                      <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-tighter">Idle</span>
                   </div>
                </div>
             </section>
             
             <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-lg shadow-sm">
                <h4 className="font-black text-on-surface mb-lg tracking-tight uppercase text-sm">Knowledge Milestones</h4>
                <div className="flex flex-col gap-md">
                   {[
                      { title: 'Path to Enlightenment', date: 'Just Now', icon: 'verified', color: 'text-success' },
                      { title: 'Streak Master I', date: '3 days ago', icon: 'military_tech', color: 'text-primary' },
                      { title: 'Knowledge Seeker', date: '1 week ago', icon: 'stars', color: 'text-secondary' }
                   ].map((milestone, i) => (
                      <div key={i} className="flex items-center gap-md p-md bg-surface-container-low/30 hover:bg-surface-container-low rounded-2xl border border-outline-variant/30 transition-all cursor-pointer group">
                         <div className={`w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center ${milestone.color} group-hover:scale-110 transition-transform shadow-sm`}>
                            <span className="material-symbols-outlined text-[24px]">{milestone.icon}</span>
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-black text-on-surface truncate tracking-tight">{milestone.title}</p>
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">{milestone.date}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </section>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
