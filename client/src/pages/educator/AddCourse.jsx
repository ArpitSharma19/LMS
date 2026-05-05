import React, { useState } from 'react';
import EducatorLayout from '../../layouts/EducatorLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { COURSE_CATEGORIES } from '../../constants/categories';

const AddCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCourseData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    }));
  };

  const addChapter = () => {
    const newChapter = {
      chapterId: Math.random().toString(36).substr(2, 9),
      chapterOrder: courseData.courseContent.length + 1,
      chapterTitle: '',
      chapterContent: []
    };
    setCourseData(prev => ({
      ...prev,
      courseContent: [...prev.courseContent, newChapter]
    }));
  };

  const addLecture = (chapterId) => {
    setCourseData(prev => ({
      ...prev,
      courseContent: prev.courseContent.map(chapter => {
        if (chapter.chapterId === chapterId) {
          return {
            ...chapter,
            chapterContent: [...chapter.chapterContent, {
              lectureId: Math.random().toString(36).substr(2, 9),
              lectureTitle: '',
              lectureDuration: 0,
              lectureUrl: '',
              description: '',
              notes: '',
              isPreviewFree: false,
              lectureOrder: chapter.chapterContent.length + 1
            }]
          };
        }
        return chapter;
      })
    }));
  };

  const handleChapterTitleChange = (chapterId, title) => {
    setCourseData(prev => ({
      ...prev,
      courseContent: prev.courseContent.map(ch => 
        ch.chapterId === chapterId ? { ...ch, chapterTitle: title } : ch
      )
    }));
  };

  const handleLectureChange = (chapterId, lectureId, field, value) => {
    setCourseData(prev => ({
      ...prev,
      courseContent: prev.courseContent.map(ch => {
        if (ch.chapterId === chapterId) {
          return {
            ...ch,
            chapterContent: ch.chapterContent.map(lec => 
              lec.lectureId === lectureId ? { ...lec, [field]: value } : lec
            )
          };
        }
        return ch;
      })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!thumbnail) return toast.error('Please upload a course thumbnail');
    
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('courseThumbnail', thumbnail);
      
      const preparedCourseData = { ...courseData };
      preparedCourseData.courseContent = courseData.courseContent.map((chapter, cIdx) => ({
        ...chapter,
        chapterContent: chapter.chapterContent.map((lecture, lIdx) => {
          if (lecture.lectureFile) {
            formData.append(`lectureFile_${cIdx}_${lIdx}`, lecture.lectureFile);
          }
          const { lectureFile, ...rest } = lecture;
          return rest;
        })
      }));

      formData.append('courseData', JSON.stringify(preparedCourseData));

      const { data } = await api.post('/api/educator/add-course', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success) {
        toast.success('Course created successfully!');
        navigate('/educator/my-courses');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EducatorLayout 
      title="Create New Course" 
      subtitle="Design your curriculum and reach thousands of students worldwide."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-xl max-w-5xl mx-auto pb-xxl animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Basic Info */}
        <section className="bg-surface-container-lowest border border-outline-variant p-lg md:p-xl rounded-2xl shadow-sm space-y-lg">
          <h3 className="text-h4 font-bold text-on-surface flex items-center gap-sm border-b border-outline-variant pb-md">
            <span className="material-symbols-outlined text-primary">info</span>
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div className="flex flex-col gap-sm col-span-2">
              <label className="text-body-sm font-bold text-on-surface uppercase tracking-wider">Course Title</label>
              <input 
                required
                name="courseTitle"
                value={courseData.courseTitle}
                onChange={handleInputChange}
                className="w-full bg-surface border border-outline-variant px-md py-sm rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="e.g. Advanced Systems Architecture"
              />
            </div>

            <div className="flex flex-col gap-sm col-span-2">
              <label className="text-body-sm font-bold text-on-surface uppercase tracking-wider">Course Description</label>
              <textarea 
                required
                name="courseDescription"
                value={courseData.courseDescription}
                onChange={handleInputChange}
                rows={4}
                className="w-full bg-surface border border-outline-variant px-md py-sm rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                placeholder="Tell students what they'll learn in this course..."
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
              <label className="text-body-sm font-bold text-on-surface uppercase tracking-wider">Base Price (₹)</label>
              <input 
                type="number"
                name="coursePrice"
                value={courseData.coursePrice}
                onChange={handleInputChange}
                className="w-full bg-surface border border-outline-variant px-md py-sm rounded-lg focus:border-primary outline-none"
                placeholder="0 for free courses"
              />
            </div>

            <div className="flex flex-col gap-sm">
              <label className="text-body-sm font-bold text-on-surface uppercase tracking-wider">Discount (%)</label>
              <input 
                type="number"
                name="discount"
                value={courseData.discount}
                onChange={handleInputChange}
                className="w-full bg-surface border border-outline-variant px-md py-sm rounded-lg focus:border-primary outline-none"
                placeholder="e.g. 20"
              />
            </div>

            <div className="flex flex-col gap-sm">
              <label className="text-body-sm font-bold text-on-surface uppercase tracking-wider">Thumbnail Image</label>
              <div className="relative border-2 border-dashed border-outline-variant rounded-xl p-md text-center hover:bg-surface-container-low transition-colors cursor-pointer group">
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnail(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-xs">
                  <span className="material-symbols-outlined text-[32px] text-outline group-hover:text-primary transition-colors">cloud_upload</span>
                  <p className="text-body-sm font-medium">{thumbnail ? thumbnail.name : 'Upload course thumbnail'}</p>
                  <p className="text-[11px] text-on-surface-variant font-medium">PNG, JPG up to 5MB</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Curriculum */}
        <section className="bg-surface-container-lowest border border-outline-variant p-lg md:p-xl rounded-2xl shadow-sm space-y-lg">
          <div className="flex items-center justify-between border-b border-outline-variant pb-md">
            <h3 className="text-h4 font-bold text-on-surface flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">menu_book</span>
              Course Curriculum
            </h3>
            <button 
              type="button"
              onClick={addChapter}
              className="text-primary font-bold text-body-sm flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Add Chapter
            </button>
          </div>

          <div className="flex flex-col gap-lg">
            {courseData.courseContent.map((chapter, cIdx) => (
              <div key={chapter.chapterId} className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                <div className="p-md bg-surface-container-low flex items-center justify-between border-b border-outline-variant">
                  <div className="flex items-center gap-md flex-1">
                    <span className="bg-on-surface text-surface w-8 h-8 rounded-lg flex items-center justify-center font-bold">
                      {cIdx + 1}
                    </span>
                    <input 
                      className="bg-transparent border-b border-transparent focus:border-primary outline-none font-bold text-body-md w-full"
                      placeholder="Chapter Title"
                      value={chapter.chapterTitle}
                      onChange={(e) => handleChapterTitleChange(chapter.chapterId, e.target.value)}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => addLecture(chapter.chapterId)}
                    className="ml-md text-secondary font-bold text-body-sm flex items-center gap-1 hover:underline whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Add Lesson
                  </button>
                </div>

                <div className="p-md flex flex-col gap-sm">
                  {chapter.chapterContent.map((lecture, lIdx) => (
                    <div key={lecture.lectureId} className="bg-surface-container-lowest p-md rounded-lg border border-outline-variant/50 grid grid-cols-1 md:grid-cols-12 gap-md items-center group">
                      <div className="md:col-span-4 flex items-center gap-md">
                        <span className="text-on-surface-variant font-bold text-body-sm">{lIdx + 1}.</span>
                        <input 
                          className="bg-transparent border-b border-transparent focus:border-primary outline-none text-body-sm font-medium w-full"
                          placeholder="Lesson Title"
                          value={lecture.lectureTitle}
                          onChange={(e) => handleLectureChange(chapter.chapterId, lecture.lectureId, 'lectureTitle', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <input 
                          className="bg-surface-container-low border border-outline-variant px-sm py-[6px] rounded text-[12px] w-full outline-none focus:border-primary"
                          placeholder="YouTube Video URL"
                          value={lecture.lectureUrl}
                          onChange={(e) => handleLectureChange(chapter.chapterId, lecture.lectureId, 'lectureUrl', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input 
                          type="number"
                          className="bg-surface-container-low border border-outline-variant px-sm py-[6px] rounded text-[12px] w-full outline-none focus:border-primary"
                          placeholder="Sec"
                          value={lecture.lectureDuration || ''}
                          onChange={(e) => handleLectureChange(chapter.chapterId, lecture.lectureId, 'lectureDuration', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <div className="relative bg-surface-container-low border border-outline-variant px-sm py-[6px] rounded flex items-center justify-between group/file">
                           <span className="text-[10px] font-bold text-on-surface-variant truncate pr-4">
                              {lecture.lectureFile ? lecture.lectureFile.name : 'Upload File'}
                           </span>
                           <span className="material-symbols-outlined text-[16px] text-outline group-hover/file:text-primary">upload_file</span>
                           <input 
                              type="file"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => handleLectureChange(chapter.chapterId, lecture.lectureId, 'lectureFile', e.target.files[0])}
                           />
                        </div>
                      </div>
                      <div className="md:col-span-12 mt-sm">
                        <textarea 
                          className="bg-surface-container-low border border-outline-variant px-sm py-[6px] rounded text-[12px] w-full outline-none focus:border-primary resize-none"
                          placeholder="Lesson Content (Description & Detailed Info)..."
                          rows={4}
                          value={lecture.description || ''}
                          onChange={(e) => handleLectureChange(chapter.chapterId, lecture.lectureId, 'description', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-1 flex items-center justify-end">
                         <label className="flex items-center gap-xs cursor-pointer select-none">
                           <input 
                            type="checkbox" 
                            checked={lecture.isPreviewFree}
                            onChange={(e) => handleLectureChange(chapter.chapterId, lecture.lectureId, 'isPreviewFree', e.target.checked)}
                            className="w-4 h-4 rounded text-primary border-outline-variant" 
                           />
                           <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Free</span>
                         </label>
                      </div>
                    </div>
                  ))}
                  {chapter.chapterContent.length === 0 && (
                    <div className="text-center py-xl text-on-surface-variant italic text-body-sm opacity-50">
                      No lessons added yet. Click "Add Lesson" to start.
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {courseData.courseContent.length === 0 && (
              <div className="flex flex-col items-center justify-center py-huge border-2 border-dashed border-outline-variant rounded-2xl bg-surface-container-low/30">
                <span className="material-symbols-outlined text-[48px] text-outline mb-md">post_add</span>
                <p className="text-body-md font-bold text-on-surface">No modules found</p>
                <p className="text-body-sm text-on-surface-variant mt-xs mb-lg">Start by adding your first chapter to the curriculum.</p>
                <button 
                  type="button" 
                  onClick={addChapter}
                  className="bg-primary text-on-primary px-lg py-sm rounded-lg font-bold shadow-md hover:shadow-xl transition-all"
                >
                  Create Chapter
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-md mt-lg">
          <button 
            type="button"
            onClick={() => navigate('/educator/dashboard')}
            className="px-xl py-md text-on-surface-variant font-bold hover:bg-surface-container-high rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={loading}
            type="submit"
            className="bg-primary text-on-primary px-huge py-md rounded-xl font-bold shadow-xl hover:bg-primary/90 transition-all flex items-center gap-md disabled:opacity-70"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Creating Course...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">publish</span>
                Publish Course
              </>
            )}
          </button>
        </div>
      </form>
    </EducatorLayout>
  );
};

export default AddCourse;