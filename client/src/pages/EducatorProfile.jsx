import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentLayout from '../layouts/StudentLayout';
import CourseCard from '../components/CourseCard';

const EducatorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [educator, setEducator] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(false);
        console.log("Fetching educator profile for ID:", id);
        const { data } = await api.get(`/api/educator/${id}`);
        if (data.success) {
          setEducator(data.data);
          setCourses(data.data.courses || []);
        }
      } catch (err) {
        console.error('Failed to fetch educator profile', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (error) {
    return (
      <StudentLayout title="Error">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mb-md text-error">
            <span className="material-symbols-outlined text-[40px]">person_off</span>
          </div>
          <h3 className="text-2xl font-black text-on-surface">Educator not found</h3>
          <p className="text-on-surface-variant font-bold mt-sm">The profile you are looking for does not exist or has been removed.</p>
          <button onClick={() => navigate('/')} className="mt-lg bg-primary text-on-primary px-xl py-md rounded-xl font-black">Browse Courses</button>
        </div>
      </StudentLayout>
    );
  }

  if (loading) {
    return (
      <StudentLayout title="Loading Profile...">
        <div className="flex flex-col gap-xl animate-pulse">
          <div className="flex flex-col md:flex-row gap-xl items-center bg-surface-container-low p-xl rounded-[32px]">
            <div className="w-32 h-32 rounded-full bg-surface-container-high" />
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-surface-container-high w-1/3 rounded" />
              <div className="h-4 bg-surface-container-high w-1/2 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-surface-container-low rounded-2xl" />)}
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!educator && courses.length === 0) {
    return (
      <StudentLayout title="Profile Not Found">
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-[64px] text-outline/30 mb-4">person_off</span>
          <h2 className="text-2xl font-black text-on-surface">Educator profile not found</h2>
          <p className="text-on-surface-variant mt-2">This user might not have any published courses yet.</p>
          <Link to="/" className="inline-block mt-6 text-primary font-black hover:underline">Return to Course Catalog</Link>
        </div>
      </StudentLayout>
    );
  }

  // Calculate Stats
  const totalStudents = courses.reduce((sum, c) => sum + (c.enrolledStudentsCount || 120), 0); // Mocked count if missing
  const avgRating = 4.8; // Simulated as we don't have aggregated educator rating API

  return (
    <StudentLayout title={`${educator?.name || 'Educator'}'s Profile`}>
      <div className="flex flex-col gap-xxl pb-20">
        {/* Profile Header */}
        <div className="relative group">
          {/* Background Decoration */}
          <div className="absolute inset-0 bg-primary/5 rounded-[40px] -z-10 blur-xl group-hover:bg-primary/10 transition-colors" />
          
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[40px] p-xl md:p-xxl shadow-2xl flex flex-col md:flex-row gap-xl items-center md:items-start relative overflow-hidden">
            {/* Animated accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] -mr-16 -mt-16" />
            
            <img 
              src={educator?.imageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80"} 
              alt={educator?.name || "Educator"} 
              className="w-32 h-32 md:w-48 md:h-48 rounded-[32px] object-cover shadow-xl border-4 border-surface shadow-primary/20"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80";
                e.target.onerror = null;
              }}
            />
            
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full mb-4">
                <span className="material-symbols-outlined text-[16px] fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Verified Educator</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tight mb-2">
                {educator?.name}
              </h1>
              
              <p className="text-xl text-on-surface-variant font-bold opacity-70 mb-6 max-w-2xl">
                Expert in Digital Innovation & Specialized Curriculum Design. Dedicated to transforming students into industry-ready professionals.
              </p>

              {/* Stats Bar */}
              <div className="flex flex-wrap justify-center md:justify-start gap-xl">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-primary">{courses.length}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Courses</span>
                </div>
                <div className="w-[1px] h-10 bg-outline-variant/30 self-center hidden md:block" />
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-on-surface">{totalStudents.toLocaleString()}+</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Learners</span>
                </div>
                <div className="w-[1px] h-10 bg-outline-variant/30 self-center hidden md:block" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-black text-on-surface">{avgRating}</span>
                    <span className="material-symbols-outlined text-primary text-[20px] fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Avg Rating</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Courses Section */}
        <section>
          <div className="flex items-center justify-between mb-xl">
            <div className="flex flex-col">
               <h2 className="text-2xl font-black text-on-surface tracking-tight">Courses by {educator?.name}</h2>
               <p className="text-on-surface-variant font-bold opacity-60 text-sm">Browse high-impact learning paths crafted for excellence.</p>
            </div>
            <div className="hidden md:flex gap-xs">
              <button className="p-2 rounded-xl bg-surface-container border border-outline-variant hover:bg-surface-container-high">
                <span className="material-symbols-outlined">grid_view</span>
              </button>
              <button className="p-2 rounded-xl text-outline-variant hover:text-on-surface">
                <span className="material-symbols-outlined">view_list</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">
            {courses.map((course) => (
              <div key={course.id} className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        </section>

        {/* Credentials / Bio Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
          <div className="lg:col-span-2 space-y-lg">
             <div className="bg-surface-container-low/50 border border-outline-variant/30 rounded-[32px] p-xl">
               <h3 className="text-xl font-black text-on-surface mb-4">Professional Bio</h3>
               <p className="text-on-surface-variant leading-relaxed font-medium">
                 {educator?.name} is a renowned expert with over 12 years of experience in the technology sector. Having worked with Fortune 500 companies and Silicon Valley startups, they bring a wealth of practical, real-world knowledge to BrainLyft. Their teaching methodology focuses on project-based learning, ensuring students don't just learn theory but master the application of concepts.
               </p>
             </div>
             <div className="bg-surface-container-low/50 border border-outline-variant/30 rounded-[32px] p-xl">
               <h3 className="text-xl font-black text-on-surface mb-4">Teaching Philosophy</h3>
               <blockquote className="border-l-4 border-primary pl-4 italic text-on-surface-variant font-bold">
                 "I believe that anyone can master complex technical concepts if they are broken down into intuitive, manageable pieces. My goal is to bridge the gap between academic theory and industry requirements."
               </blockquote>
             </div>
          </div>
          
          <div className="flex flex-col gap-lg">
            <div className="bg-surface-container-low/50 border border-outline-variant/30 rounded-[32px] p-xl">
              <h3 className="text-xl font-black text-on-surface mb-4">Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {['Curriculum Design', 'Instructional Excellence', 'Mentorship', 'Course Production'].map(tag => (
                  <span key={tag} className="bg-surface-container-high px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-on-surface-variant">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-surface-container-low/50 border border-outline-variant/30 rounded-[32px] p-xl">
              <h3 className="text-xl font-black text-on-surface mb-4">Qualifications</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">school</span>
                  <span className="text-sm font-bold text-on-surface-variant">Master of Science in Education</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">workspace_premium</span>
                  <span className="text-sm font-bold text-on-surface-variant">Senior Industry Consultant (10+ Years)</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">history_edu</span>
                  <span className="text-sm font-bold text-on-surface-variant">Published Author in Digital Learning</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default EducatorProfile;
