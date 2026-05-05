import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../services/api';
import { useStore } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { formatCurrency } from '../../utils/currency';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, calculateRating } = useStore();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [{ data: cData }, { data: eData }] = await Promise.all([
        api.get(`/api/course/${id}`),
        token ? api.get('/api/user/enrolled-courses') : Promise.resolve({ data: { enrolledCourses: [] } })
      ]);
      
      if (cData.success) setCourse(cData.courseData);
      if (eData.success) setIsEnrolled(eData.enrolledCourses.some(c => String(c.id) === String(id)));
    } catch (error) {
      toast.error('Failed to load course details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEnroll = async () => {
    if (!token) return navigate('/login', { state: { from: `/course/${id}` } });
    try {
      setIsEnrolling(true);
      const { data } = await api.post('/api/payment/create-checkout-session', { courseId: id });
      if (data.success) {
        if (data.isFree) {
          toast.success('Enrolled successfully!');
          setIsEnrolled(true);
          navigate(`/player/${id}`);
        } else if (data.url) {
          window.location.href = data.url; // Redirect to Stripe
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Enrollment failed');
    } finally {
      setIsEnrolling(false);
    }
  };

  if (loading) return <StudentLayout title="Loading Course..."><div className="animate-pulse flex flex-col gap-xl"><div className="h-10 bg-surface-container w-3/4 rounded" /><div className="grid grid-cols-1 lg:grid-cols-12 gap-xxl"><div className="lg:col-span-8 space-y-6"><div className="aspect-video bg-surface-container rounded-xl" /><div className="h-40 bg-surface-container rounded-xl" /></div><div className="lg:col-span-4"><div className="h-80 bg-surface-container rounded-xl" /></div></div></div></StudentLayout>;
  if (!course) return null;

  const rating = Number(course.ratingAverage) || 4.8;
  const discountedPrice = Number(course.coursePrice) - (Number(course.discount || 0) * Number(course.coursePrice) / 100);

  return (
    <StudentLayout title={course.courseTitle} subtitle={`Created by ${course.educatorDetails?.name}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xxl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="lg:col-span-8 flex flex-col gap-xl">
          <div className="flex flex-col gap-md">
            <h1 className="text-2xl font-bold text-on-surface">{course.courseTitle}</h1>
            <p className="text-body-lg text-on-surface-variant line-clamp-3" dangerouslySetInnerHTML={{ __html: course.courseDescription }} />
            <div className="flex flex-wrap items-center gap-md mt-sm">
              <div className="flex items-center gap-xs bg-surface-container-high px-3 py-1.5 rounded-full">
                <div className="flex mr-1">
                   {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="material-symbols-outlined text-[18px] text-[#f59e0b]" style={{ fontVariationSettings: `'FILL' ${rating >= star ? 1 : 0}` }}>
                         {rating >= star ? 'star' : (rating >= star - 0.5 ? 'star_half' : 'star')}
                      </span>
                   ))}
                </div>
                <span className="text-label-caps text-on-surface font-bold">{rating}</span>
                <span className="text-body-sm text-on-surface-variant">({course.ratingCount || 0} reviews)</span>
              </div>
              <div className="flex items-center gap-xs text-on-surface-variant"><span className="material-symbols-outlined text-[18px]">group</span><span className="text-body-sm">Enrolled Students</span></div>
            </div>
          </div>

          <div className="relative aspect-video rounded-xl overflow-hidden border border-outline-variant/30 shadow-md bg-surface-container group">
            <img alt={course.courseTitle} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={course.courseThumbnail} />
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-sm">
            <h2 className="text-xl font-semibold text-on-surface mb-md">About this course</h2>
            <div className="text-body-md text-on-surface-variant space-y-4 rich-text" dangerouslySetInnerHTML={{ __html: course.courseDescription }} />
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-sm flex flex-col md:flex-row gap-lg items-start">
            <img src={course.educatorDetails?.imageUrl} alt={course.educatorDetails?.name} className="w-20 h-20 rounded-full object-cover border border-outline-variant" />
            <div className="flex-1">
              <h3 className="text-h4 font-semibold text-on-surface mb-xs">{course.educatorDetails?.name}</h3>
              <p className="text-body-sm text-on-surface-variant mb-md">Instructor in {course.category}</p>
              <button onClick={() => navigate(`/educator/${course.educatorDetails?.id || course.educator}`)} className="text-primary font-bold uppercase tracking-widest text-[11px] hover:underline">View Full Profile</button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-on-surface mb-lg">Course Curriculum</h2>
            <div className="flex flex-col gap-sm">
              {course.courseContent?.map((chapter, i) => (
                <details key={chapter.id} className="group bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden" open={i === 0}>
                  <summary className="flex items-center justify-between p-md cursor-pointer hover:bg-surface-container-low transition-colors outline-none">
                    <div className="flex items-center gap-md"><span className="material-symbols-outlined text-on-surface-variant group-open:rotate-180 transition-transform">expand_more</span><span className="text-h6 font-semibold text-on-surface">{chapter.chapterTitle}</span></div>
                    <span className="text-body-sm text-on-surface-variant hidden md:block">{chapter.chapterContent?.length || 0} Lessons</span>
                  </summary>
                  <div className="px-md pb-md pt-2 border-t border-outline-variant/30 flex flex-col gap-xs">
                    {chapter.chapterContent?.map((lecture) => (
                      <button 
                        key={lecture.id} 
                        onClick={() => navigate(`/player/${id}/${lecture.id}`)}
                        className="w-full flex items-center justify-between py-2 px-3 hover:bg-surface-container-low rounded transition-colors group/lesson text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                          <span className="text-body-sm text-on-surface font-medium">{lecture.lectureTitle}</span>
                        </div>
                        <span className="text-body-sm text-on-surface-variant font-bold">
                          {Math.floor(lecture.lectureDuration / 60)}:{(lecture.lectureDuration % 60).toString().padStart(2, '0')}
                        </span>
                      </button>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-[100px] bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xl overflow-hidden flex flex-col">
            <div className="p-lg border-b border-outline-variant/50">
              <div className="flex items-end gap-sm mb-sm">
                <span className="text-2xl font-bold text-on-surface">{discountedPrice === 0 ? 'Free' : formatCurrency(discountedPrice)}</span>
                {course.discount > 0 && <span className="text-body-md text-on-surface-variant line-through mb-1">{formatCurrency(course.coursePrice)}</span>}
              </div>
              {course.discount > 0 && <div className="text-label-caps text-error bg-error-container inline-block px-2 py-1 rounded mb-md font-bold">{course.discount}% OFF</div>}
              
              <button disabled={isEnrolling} onClick={isEnrolled ? () => navigate(`/player/${id}`) : handleEnroll} className={`w-full py-3 px-6 rounded-lg text-h6 font-semibold transition-all shadow-md flex items-center justify-center gap-2 group ${isEnrolled ? 'bg-secondary text-on-secondary hover:bg-secondary/90' : 'bg-primary text-on-primary hover:bg-primary/90'}`}>
                {isEnrolling ? 'Enrolling...' : (isEnrolled ? 'Go to Player' : (course.coursePrice === 0 ? 'Enroll for Free' : 'Enroll Now'))}
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
              <p className="text-center text-body-sm text-on-surface-variant mt-sm">30-day money-back guarantee</p>
            </div>
            <div className="p-lg bg-surface flex flex-col gap-sm">
              <h4 className="text-h6 font-semibold text-on-surface mb-xs">This course includes:</h4>
              {[ {i: 'ondemand_video', t: 'Video content'}, {i: 'article', t: 'Resources'}, {i: 'all_inclusive', t: 'Lifetime access'}, {i: 'military_tech', t: 'Certificate'} ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">{item.i}</span><span className="text-body-md">{item.t}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};


export default CourseDetails;