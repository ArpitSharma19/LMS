import React, { useState, useEffect, useMemo } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import CourseCard from '../../components/CourseCard';
import { useStore } from '../../context/AuthContext';
import api from '../../services/api';
import { COURSE_CATEGORIES } from '../../constants/categories';

const Home = () => {
  const { courses, loadingCourses, fetchCourses } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('latest');
  const [availableCategories, setAvailableCategories] = useState(['All Categories']);

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchCategory = selectedCategory === 'All Categories' || course.category === selectedCategory;
      const matchSearch = course.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.educatorDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [courses, selectedCategory, searchTerm]);

  useEffect(() => {
    let isMounted = true;
    const getCategories = async () => {
      try {
        const { data } = await api.get('/api/course/categories');
        if (isMounted && data.success) {
          setAvailableCategories(['All Categories', ...data.categories]);
        }
      } catch (e) {
        console.error("Failed to fetch categories");
      }
    };
    getCategories();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    fetchCourses(sortBy);
  }, [sortBy, fetchCourses]);

  return (
    <StudentLayout
      title="Explore Courses"
      subtitle="Expand your skill set with high-performance learning tracks."
    >
      <div className="flex flex-col gap-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-outline-variant pb-md gap-md">
          <h2 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight uppercase">Featured Tracks</h2>
          <p className="text-on-surface-variant font-bold text-[11px] sm:text-sm uppercase tracking-widest opacity-60">Showing {filteredCourses.length} results</p>
        </div>
        
        {/* Filters & Search Bar */}
        <section className="flex flex-col lg:flex-row gap-md items-start lg:items-center justify-between bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm animate-in fade-in zoom-in-95 duration-500">
          {/* Search */}
          <div className="relative w-full lg:w-96">
            <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              className="w-full bg-surface pl-[48px] pr-md py-sm rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-body-sm text-on-surface placeholder:text-outline"
              placeholder="Search courses, skills, or instructors..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-sm w-full lg:w-auto">
            <div className="relative">
              <select
                className="appearance-none bg-surface border border-outline-variant px-md pr-10 py-sm rounded-lg hover:bg-surface-container-highest transition-colors text-body-sm text-on-surface outline-none focus:border-primary cursor-pointer"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {['All Categories', ...COURSE_CATEGORIES].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
            </div>

            <div className="relative">
              <select
                className="appearance-none bg-surface border border-outline-variant px-md pr-10 py-sm rounded-lg hover:bg-surface-container-highest transition-colors text-body-sm text-on-surface outline-none focus:border-primary cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="latest">Latest</option>
                <option value="popular">Most Popular</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline">sort</span>
            </div>
          </div>
        </section>

        {/* Course Grid */}
        {loadingCourses ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl h-[350px] animate-pulse">
                <div className="aspect-video bg-surface-container-highest w-full rounded-t-xl" />
                <div className="p-md space-y-4">
                  <div className="h-4 bg-surface-container-highest w-1/3 rounded" />
                  <div className="h-6 bg-surface-container-highest w-full rounded" />
                  <div className="h-4 bg-surface-container-highest w-1/2 rounded" />
                  <div className="pt-4 border-t border-outline-variant flex justify-between items-center">
                    <div className="h-6 bg-surface-container-highest w-1/4 rounded" />
                    <div className="h-10 bg-surface-container-highest w-1/3 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </section>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-md text-on-surface-variant">
              <span className="material-symbols-outlined text-[40px]">search_off</span>
            </div>
            <h3 className="text-h4 font-semibold text-on-surface">No courses found</h3>
            <p className="text-body-md text-on-surface-variant mt-sm">Try adjusting your search or filters to find what you're looking for.</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('All Categories'); }}
              className="mt-lg text-primary font-semibold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default Home;
