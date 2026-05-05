import React, { useState, useEffect } from 'react';
import EducatorLayout from '../../layouts/EducatorLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import { COURSE_CATEGORIES } from '../../constants/categories';

const EditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [thumbnail, setThumbnail] = useState(null);
  
  const [courseData, setCourseData] = useState({
    courseTitle: '',
    courseDescription: '',
    coursePrice: 0,
    discount: 0,
    category: 'Engineering & Technology',
    isPublished: true,
    courseContent: []
  });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await api.get(`/api/course/${id}`);
        if (data.success) {
          const c = data.courseData;
          setCourseData({
            courseTitle: c.courseTitle,
            courseDescription: c.courseDescription,
            coursePrice: c.coursePrice,
            discount: c.discount,
            category: c.category || 'Engineering & Technology',
            isPublished: c.isPublished,
            courseContent: c.courseContent || []
          });
        }
      } catch (error) {
        toast.error('Failed to load course data');
        navigate('/educator/my-courses');
      } finally {
        setFetching(false);
      }
    };
    fetchCourse();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCourseData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    }));
  };

  const handleChapterChange = (chapterId, field, value) => {
    setCourseData(prev => ({
      ...prev,
      courseContent: prev.courseContent.map(ch => ch.id === chapterId ? { ...ch, [field]: value } : ch)
    }));
  };

  const addChapter = () => {
    const newChapter = {
      id: Date.now(),
      chapterTitle: '',
      chapterOrder: courseData.courseContent.length + 1,
      chapterContent: []
    };
    setCourseData(prev => ({ ...prev, courseContent: [...prev.courseContent, newChapter] }));
  };

  const removeChapter = (chapterId) => {
    setCourseData(prev => ({
      ...prev,
      courseContent: prev.courseContent.filter(ch => ch.id !== chapterId)
    }));
  };

  const addLecture = (chapterId) => {
    setCourseData(prev => ({
      ...prev,
      courseContent: prev.courseContent.map(ch => {
        if (ch.id === chapterId) {
          return {
            ...ch,
            chapterContent: [...ch.chapterContent, {
              id: Date.now(),
              lectureTitle: '',
              lectureDuration: 0,
              lectureUrl: '',
              description: '',
              isPreviewFree: false,
              lectureOrder: ch.chapterContent.length + 1
            }]
          };
        }
        return ch;
      })
    }));
  };

  const removeLecture = (chapterId, lectureId) => {
    setCourseData(prev => ({
      ...prev,
      courseContent: prev.courseContent.map(ch => {
        if (ch.id === chapterId) {
          return { ...ch, chapterContent: ch.chapterContent.filter(l => l.id !== lectureId) };
        }
        return ch;
      })
    }));
  };

  const handleLectureChange = (chapterId, lectureId, field, value) => {
    setCourseData(prev => ({
      ...prev,
      courseContent: prev.courseContent.map(ch => {
        if (ch.id === chapterId) {
          return {
            ...ch,
            chapterContent: ch.chapterContent.map(l => l.id === lectureId ? { ...l, [field]: value } : l)
          };
        }
        return ch;
      })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      if (thumbnail) formData.append('courseThumbnail', thumbnail);
      
      // Clean up temp IDs before sending
      const cleanContent = courseData.courseContent.map(ch => ({
        ...ch,
        chapterContent: ch.chapterContent.map(l => {
          const { id, ...rest } = l;
          return typeof id === 'number' ? rest : l; // Only remove numeric temp IDs
        })
      }));

      formData.append('courseData', JSON.stringify({ ...courseData, courseContent: cleanContent }));

      const { data } = await api.put(`/api/educator/course/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success) {
        toast.success('Track updated successfully!');
        navigate('/educator/my-courses');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update track');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <EducatorLayout title="Loading Track..." subtitle="Retrieving track information.">
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-[48px] text-primary">progress_activity</span>
        </div>
      </EducatorLayout>
    );
  }

  return (
    <EducatorLayout 
      title="Edit Track" 
      subtitle="Refine your curriculum and update track details."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-xl max-w-5xl mx-auto pb-xxl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <section className="bg-surface-container-lowest border border-outline-variant p-lg md:p-xl rounded-2xl shadow-sm space-y-lg">
          <h3 className="text-h4 font-bold text-on-surface flex items-center gap-sm border-b border-outline-variant pb-md">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            Track Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div className="flex flex-col gap-sm col-span-2">
              <label className="text-body-sm font-bold text-on-surface uppercase tracking-wider">Track Title</label>
              <input 
                required
                name="courseTitle"
                value={courseData.courseTitle}
                onChange={handleInputChange}
                className="w-full bg-surface border border-outline-variant px-md py-sm rounded-lg focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-sm col-span-2">
              <label className="text-body-sm font-bold text-on-surface uppercase tracking-wider">Description</label>
              <textarea 
                required
                name="courseDescription"
                value={courseData.courseDescription}
                onChange={handleInputChange}
                rows={4}
                className="w-full bg-surface border border-outline-variant px-md py-sm rounded-lg focus:border-primary outline-none transition-all resize-none"
              />
            </div>

            <div className="flex flex-col gap-sm">
              <label className="text-body-sm font-bold text-on-surface uppercase tracking-wider">Category</label>
              <select 
                name="category"
                value={courseData.category}
                onChange={handleInputChange}
                className="w-full bg-surface border border-outline-variant px-md py-sm rounded-lg focus:border-primary outline-none cursor-pointer"
              >
                {COURSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-sm">
              <label className="text-body-sm font-bold text-on-surface uppercase tracking-wider">Price (₹)</label>
              <input 
                type="number"
                name="coursePrice"
                value={courseData.coursePrice}
                onChange={handleInputChange}
                className="w-full bg-surface border border-outline-variant px-md py-sm rounded-lg focus:border-primary outline-none"
              />
            </div>

            <div className="flex flex-col gap-sm">
               <label className="text-body-sm font-bold text-on-surface uppercase tracking-wider">Thumbnail</label>
               <input 
                 type="file"
                 accept="image/*"
                 onChange={(e) => setThumbnail(e.target.files[0])}
                 className="w-full bg-surface border border-outline-variant px-md py-sm rounded-lg outline-none"
               />
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest border border-outline-variant p-lg md:p-xl rounded-2xl shadow-sm space-y-lg">
          <div className="flex items-center justify-between border-b border-outline-variant pb-md">
            <h3 className="text-h4 font-bold text-on-surface flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">menu_book</span>
              Curriculum
            </h3>
            <button 
              type="button" 
              onClick={addChapter}
              className="flex items-center gap-sm bg-primary/10 text-primary px-lg py-sm rounded-xl font-bold hover:bg-primary hover:text-on-primary transition-all active:scale-95"
            >
              <span className="material-symbols-outlined">add</span>
              Add Module
            </button>
          </div>

          <div className="space-y-xl">
            {courseData.courseContent.map((chapter, cIndex) => (
              <div key={chapter.id} className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
                <div className="bg-surface-container-high p-md flex items-center gap-md">
                  <div className="bg-primary text-on-primary w-8 h-8 rounded-lg flex items-center justify-center font-black">
                    {cIndex + 1}
                  </div>
                  <input 
                    className="flex-1 bg-transparent border-b border-transparent focus:border-primary outline-none font-bold text-on-surface placeholder:text-outline"
                    placeholder="Module Title (e.g. Getting Started)"
                    value={chapter.chapterTitle}
                    onChange={(e) => handleChapterChange(chapter.id, 'chapterTitle', e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => removeChapter(chapter.id)}
                    className="text-error hover:bg-error/10 p-sm rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>

                <div className="p-md space-y-md">
                  {chapter.chapterContent.map((lecture, lIndex) => (
                    <div key={lecture.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md grid grid-cols-1 md:grid-cols-12 gap-md relative">
                       <div className="md:col-span-1 flex items-center justify-center font-bold text-outline-variant">
                          {lIndex + 1}
                       </div>
                       <div className="md:col-span-5 flex flex-col gap-xs">
                          <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Lesson Title</label>
                          <input 
                            className="bg-surface-container-low border border-outline-variant px-sm py-[6px] rounded text-sm w-full outline-none focus:border-primary"
                            placeholder="Lesson Title"
                            value={lecture.lectureTitle}
                            onChange={(e) => handleLectureChange(chapter.id, lecture.id, 'lectureTitle', e.target.value)}
                          />
                       </div>
                       <div className="md:col-span-5 flex flex-col gap-xs">
                          <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Video URL</label>
                          <input 
                            className="bg-surface-container-low border border-outline-variant px-sm py-[6px] rounded text-sm w-full outline-none focus:border-primary"
                            placeholder="YouTube / Video URL"
                            value={lecture.lectureUrl}
                            onChange={(e) => handleLectureChange(chapter.id, lecture.id, 'lectureUrl', e.target.value)}
                          />
                       </div>
                       <div className="md:col-span-1 flex items-center justify-center">
                          <button 
                            type="button"
                            onClick={() => removeLecture(chapter.id, lecture.id)}
                            className="text-outline-variant hover:text-error transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                          </button>
                       </div>
                       
                       <div className="md:col-span-12 mt-sm">
                          <textarea 
                            className="bg-surface-container-low border border-outline-variant px-sm py-[6px] rounded text-[12px] w-full outline-none focus:border-primary resize-none"
                            placeholder="Lesson Content (Description & Detailed Info)..."
                            rows={3}
                            value={lecture.description || ''}
                            onChange={(e) => handleLectureChange(chapter.id, lecture.id, 'description', e.target.value)}
                          />
                       </div>
                    </div>
                  ))}
                  
                  <button 
                    type="button"
                    onClick={() => addLecture(chapter.id)}
                    className="w-full py-md border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant font-bold text-sm hover:bg-surface-container-high hover:border-primary/50 transition-all flex items-center justify-center gap-sm"
                  >
                    <span className="material-symbols-outlined">add</span>
                    Add Lesson
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {courseData.courseContent.length === 0 && (
            <div className="text-center py-xl border-2 border-dashed border-outline-variant rounded-2xl bg-surface-container-low/30">
              <span className="material-symbols-outlined text-[48px] text-outline mb-md">post_add</span>
              <p className="font-bold text-on-surface-variant">Your track has no modules yet.</p>
              <p className="text-body-sm text-on-surface-variant opacity-60">Start building your curriculum to share your knowledge.</p>
            </div>
          )}
        </section>

        <div className="flex items-center justify-end gap-md">
          <button 
            type="button"
            onClick={() => navigate('/educator/my-courses')}
            className="px-xl py-md text-on-surface-variant font-bold hover:bg-surface-container-high rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={loading}
            type="submit"
            className="bg-primary text-on-primary px-huge py-md rounded-xl font-bold shadow-xl hover:bg-primary/90 transition-all flex items-center gap-md disabled:opacity-70"
          >
            {loading ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </EducatorLayout>
  );
};

export default EditCourse;
