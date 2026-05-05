import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/currency';

const CourseCard = ({ course, isStudent = true }) => {
  const navigate = useNavigate();
  
  const rating = Number(course.ratingAverage) || 4.8;

  const handleNavigate = () => {
    navigate(`/course/${course.id}`);
    window.scrollTo(0, 0);
  };

  return (
    <article 
      onClick={handleNavigate}
      className="group bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden flex flex-col hover:border-primary/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 cursor-pointer active:scale-[0.98] h-full"
    >
      <div className="aspect-[16/10] w-full bg-surface-container-highest relative overflow-hidden">
        <img 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          src={course.courseThumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"} 
          alt={course.courseTitle} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="absolute top-4 left-4 flex flex-col gap-2">
           <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm text-primary font-black text-[10px] uppercase tracking-widest border border-white/20">
              {course.category || 'Expertise'}
           </div>
           {Number(course.discount) > 0 && (
             <div className="bg-error text-on-error px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg">
                -{course.discount}%
             </div>
           )}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1 gap-3">
        <h3 className="text-lg font-black text-on-surface line-clamp-2 group-hover:text-primary transition-colors leading-tight tracking-tight min-h-[3rem]">
          {course.courseTitle}
        </h3>
        
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center overflow-hidden">
              <img 
                src={course.educatorDetails?.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${course.educatorDetails?.name || 'Instructor'}`} 
                className="w-full h-full object-cover"
                alt="Instructor"
              />
           </div>
           <span className="text-xs font-bold text-on-surface-variant">{course.educatorDetails?.name || 'Academic Team'}</span>
        </div>

        <div className="mt-auto pt-4 border-t border-outline-variant/30 flex items-center justify-between">
           <div className="flex items-center gap-1.5">
               <div className="flex items-center bg-primary/5 px-2 py-0.5 rounded-lg">
                  <span className="text-xs font-black text-primary mr-1">{rating}</span>
                  <div className="flex">
                     {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: `'FILL' ${rating >= star ? 1 : 0}` }}>
                           {rating >= star ? 'star' : (rating >= star - 0.5 ? 'star_half' : 'star')}
                        </span>
                     ))}
                  </div>
               </div>
              <span className="text-[10px] font-bold text-on-surface-variant">({course.ratingCount || 0})</span>
           </div>

           <div className="flex flex-col items-end">
              {Number(course.discount) > 0 && (
                 <span className="text-[10px] font-black text-outline-variant line-through">
                    {formatCurrency(course.coursePrice)}
                 </span>
              )}
              <span className="text-lg font-black text-on-surface">
                 {Number(course.coursePrice) === 0 ? (
                   <span className="text-success uppercase tracking-widest text-sm">Free</span>
                 ) : (
                   formatCurrency(Number(course.coursePrice) * (1 - (Number(course.discount || 0) / 100)))
                 )}
              </span>
           </div>
        </div>
      </div>
    </article>
  );
};

export default CourseCard;
