import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import YouTube from 'react-youtube';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const Player = () => {
  const { id, lectureId } = useParams();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [completedLectures, setCompletedLectures] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: courseRes } = await api.get(`/api/course/${id}`);
      if (courseRes.success) setCourse(courseRes.courseData);
      const { data: progressRes } = await api.post('/api/user/get-course-progress', { courseId: id });
      if (progressRes.success && progressRes.progressData) {
        setCompletedLectures(progressRes.progressData.lectureCompleted || []);
      }
    } catch (error) {
      toast.error('Failed to load course or progress');
      navigate('/my-enrollments');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Update current lecture when course content or lectureId param changes
  useEffect(() => {
    if (course) {
      let selectedLecture = null;
      if (lectureId) {
        course.courseContent?.forEach(chapter => {
          const found = chapter.chapterContent?.find(l => String(l.id) === String(lectureId));
          if (found) selectedLecture = found;
        });
      }
      if (!selectedLecture) {
        selectedLecture = course.courseContent?.[0]?.chapterContent?.[0];
      }
      setCurrentLecture(selectedLecture);
    }
  }, [course, lectureId]);

  const handleMarkComplete = async (lectureId) => {
    try {
      const { data } = await api.post('/api/user/update-course-progress', { courseId: id, lectureId });
      if (data.success) {
        setCompletedLectures(prev => [...new Set([...prev, lectureId])]);
        toast.success('Lesson marked as complete!');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const [player, setPlayer] = useState(null);

  const onPlayerReady = (event) => {
    setPlayer(event.target);
    console.log("▶️ YouTube Player Ready");
  };

  const getVideoId = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden text-on-surface">
      {/* Player Topbar */}
      <header className="h-16 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-lg z-50">
        <div className="flex items-center gap-md">
          <button
            onClick={() => navigate('/my-enrollments')}
            className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base font-black text-on-surface truncate">{course.courseTitle}</h1>
            <p className="text-[10px] sm:text-xs text-on-surface-variant font-bold truncate opacity-70">
              {currentLecture?.lectureTitle || 'Selecting Lesson...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-md">
          <div className="hidden sm:flex flex-col items-end gap-1 mr-md">
            <div className="text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">
              Your Progress: {Math.round((completedLectures.length / (course.courseContent?.reduce((a, c) => a + (c.chapterContent?.length || 0), 0) || 1)) * 100)}%
            </div>
            <div className="w-32 h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(completedLectures.length / (course.courseContent?.reduce((a, c) => a + (c.chapterContent?.length || 0), 0) || 1)) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isSidebarOpen ? 'bg-primary-container text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined">menu_open</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Content: Video & Details */}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isSidebarOpen ? 'mr-0' : ''}`}>
          <div className="bg-black/90 shadow-2xl border-b border-outline-variant">
            <div className="aspect-video max-w-5xl mx-auto relative group">
              {currentLecture ? (
                <YouTube
                  videoId={getVideoId(currentLecture.lectureUrl)}
                  className="w-full h-full"
                  containerClassName="w-full h-full"
                  opts={{
                    width: '100%',
                    height: '100%',
                    playerVars: {
                      autoplay: 1,
                      modestbranding: 1,
                      rel: 0,
                      origin: window.location.origin,
                      enablejsapi: 1
                    },
                  }}
                  onReady={onPlayerReady}
                  onEnd={() => handleMarkComplete(currentLecture.id)}
                  onError={(e) => {
                    console.error("YouTube Player Error:", e);
                    toast.error("Failed to load video. It might be private or deleted.");
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/50 bg-slate-900">
                  <span className="material-symbols-outlined text-[64px] mb-md">play_lesson</span>
                  <p className="text-h5 font-semibold">Select a lesson to start learning</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-xl max-w-4xl mx-auto flex flex-col gap-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-outline-variant pb-lg">
              <div>
                <h2 className="text-2xl font-black text-on-surface tracking-tight">{currentLecture?.lectureTitle}</h2>
                <div className="flex items-center gap-md mt-sm">
                  <span className="text-body-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">
                    {currentLecture?.isPreviewFree ? 'Preview Lesson' : 'Premium Lesson'}
                  </span>
                  <span className="text-body-sm text-on-surface-variant font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    {Math.floor(currentLecture?.lectureDuration / 60)}:{(currentLecture?.lectureDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (completedLectures.includes(currentLecture?.id)) return;
                  handleMarkComplete(currentLecture?.id);
                }}
                disabled={completedLectures.includes(currentLecture?.id)}
                className={`flex items-center gap-sm px-xl py-md rounded-xl font-bold transition-all shadow-md active:scale-95 ${completedLectures.includes(currentLecture?.id)
                    ? 'bg-success/10 text-success border border-success/20 cursor-default'
                    : 'bg-primary text-on-primary hover:bg-primary/90'
                  }`}
              >
                <span className="material-symbols-outlined">
                   {completedLectures.includes(currentLecture?.id) ? 'check_circle' : 'task_alt'}
                </span>
                {completedLectures.includes(currentLecture?.id) ? 'Completed ✓' : 'Mark as Complete'}
              </button>
            </div>

            {/* Lecture Description */}
            {currentLecture?.description && (
              <div className="space-y-lg animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-sm">
                  <h3 className="text-h5 font-bold text-on-surface flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary">notes</span>
                    Lesson Content
                  </h3>
                  <div className="text-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap bg-surface-container-low/30 p-lg rounded-2xl border border-outline-variant/50">
                    {currentLecture.description}
                  </div>
                </div>
              </div>
            )}

            {/* Course Rating - Show if course is completed */}
            {Math.round((completedLectures.length / (course.courseContent?.reduce((a, c) => a + (c.chapterContent?.length || 0), 0) || 1)) * 100) === 100 && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-lg space-y-md animate-in zoom-in-95 duration-500">
                <div className="flex items-center gap-md">
                  <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined">workspace_premium</span>
                  </div>
                  <div>
                    <h3 className="text-h5 font-bold text-on-surface">Congratulations!</h3>
                    <p className="text-body-sm text-on-surface-variant">You've completed this course. How was your experience?</p>
                  </div>
                </div>
                <div className="flex items-center gap-sm">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="transition-all hover:scale-110 active:scale-95"
                      onClick={async () => {
                        try {
                          const { data } = await api.post('/api/user/add-rating', { courseId: id, rating: star });
                          if (data.success) {
                            toast.success('Thank you for your rating!');
                            // Real-time update: refetch course to get new averages
                            fetchData();
                          }
                        } catch (e) {
                          toast.error(e.response?.data?.message || 'Failed to submit rating');
                        }
                      }}
                    >
                      <span className="material-symbols-outlined text-[32px] text-[#f59e0b]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conditional Resources Section */}
            {currentLecture?.resources?.length > 0 && (
              <div className="flex flex-col gap-md">
                <h3 className="text-h5 font-semibold text-on-surface">Lesson Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  {currentLecture.resources.map((resource, index) => (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-lg bg-surface-container-low rounded-xl border border-outline-variant flex items-center gap-md hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary-container text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined">description</span>
                      </div>
                      <div>
                        <h4 className="text-body-md font-bold truncate max-w-[200px]">{resource.title || 'Attached Resource'}</h4>
                        <p className="text-body-sm text-on-surface-variant uppercase tracking-widest text-[10px] font-bold">Download File</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Sidebar: Curriculum */}
        <aside className={`fixed md:relative top-0 right-0 h-full w-80 bg-surface-container-lowest border-l border-outline-variant transition-all duration-300 z-40 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:w-0 overflow-hidden'}`}>
          <div className="flex flex-col h-full">
            <div className="p-md border-b border-outline-variant bg-surface flex items-center justify-between">
              <h3 className="text-h6 font-bold text-on-surface uppercase tracking-wider">Curriculum</h3>
              <div className="flex items-center gap-2">
                <span className="text-body-sm font-bold text-on-surface-variant hidden sm:inline">{course.courseContent?.length || 0} Modules</span>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="md:hidden w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {course.courseContent?.map((chapter, cIndex) => (
                <div key={chapter.id} className="border-b border-outline-variant/30 last:border-0">
                  <div className="p-md bg-surface-container-low/50 font-bold text-[13px] text-on-surface-variant flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-outline-variant text-[12px] flex items-center justify-center text-white">
                      {cIndex + 1}
                    </span>
                    {chapter.chapterTitle}
                  </div>
                  <div className="flex flex-col">
                    {chapter.chapterContent?.map((lecture, lIndex) => (
                      <button
                        key={lecture.id}
                        onClick={() => {
                          setCurrentLecture(lecture);
                          navigate(`/learn/${id}/lesson/${lecture.id}`, { replace: true });
                          if (window.innerWidth < 768) setIsSidebarOpen(false);
                        }}
                        className={`flex items-start gap-md p-md hover:bg-surface-container-low transition-colors text-left relative ${currentLecture?.id === lecture.id ? 'bg-primary-container/30 border-l-4 border-primary' : ''}`}
                      >
                        <div className="mt-0.5">
                          {completedLectures.includes(lecture.id) ? (
                            <span className="material-symbols-outlined text-success text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          ) : (
                            <span className={`material-symbols-outlined text-[20px] ${currentLecture?.id === lecture.id ? 'text-primary' : 'text-outline'}`}>
                              {currentLecture?.id === lecture.id ? 'play_circle' : 'radio_button_unchecked'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-body-sm font-semibold truncate ${currentLecture?.id === lecture.id ? 'text-primary' : 'text-on-surface'}`}>
                            {lIndex + 1}. {lecture.lectureTitle}
                          </h4>
                          <div className="flex items-center gap-md mt-xs">
                            <span className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              {Math.floor(lecture.lectureDuration / 60)}:{(lecture.lectureDuration % 60).toString().padStart(2, '0')}
                            </span>
                            {lecture.lectureIsPreview && (
                              <span className="text-[10px] font-black bg-primary/10 text-primary px-1.5 rounded uppercase tracking-tighter">Preview</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Player;