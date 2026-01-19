import React, { useState, useEffect } from 'react';
import { CourseLevel } from '../types';
import * as Icons from 'lucide-react';

interface CourseCardProps {
  course: CourseLevel;
  index: number;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, index }) => {
  const isEven = index % 2 === 0;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = course.imageUrls || [];

  // Carousel Logic
  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className={`relative flex items-center justify-between w-full mb-12 md:mb-20 ${isEven ? 'flex-row-reverse' : ''}`}>
      
      {/* Spacer for desktop layout to center the line */}
      <div className="hidden md:block w-5/12"></div>

      {/* Center Line Node */}
      <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 flex items-center justify-center w-12 h-12 rounded-full bg-white border-[5px] border-blue-600 z-10 shadow-lg">
        <span className="w-4 h-4 bg-orange-500 rounded-full"></span>
      </div>

      {/* Content Card */}
      <div className="w-full md:w-5/12 pl-14 md:pl-0">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
          
          {/* Card Image Header / Carousel */}
          <div className="h-48 w-full bg-slate-200 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
            {images.length > 0 ? (
              <>
                {images.map((url, idx) => (
                  <img 
                    key={`${url}-${idx}`}
                    src={url} 
                    alt={`${course.title} - ${idx + 1}`} 
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                  />
                ))}
                
                {/* Carousel Dots */}
                {images.length > 1 && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
                    {images.map((_, idx) => (
                      <button 
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-3' : 'bg-white/50 hover:bg-white/80'}`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-300">
                <Icons.Image size={40} />
              </div>
            )}
            
            {/* Level Badge Overlay */}
            <div className="absolute top-4 left-4 z-20">
              <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-md uppercase tracking-wide backdrop-blur-sm bg-opacity-90">
                {course.id}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
               <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">
                 {course.level.split('(')[0]}
               </span>
               <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded">{course.age}</span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
              {course.title}
            </h3>
            
            <p className="text-slate-600 text-sm mb-5 leading-relaxed">
              {course.description}
            </p>
            
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
              {course.skills.map((skill, i) => (
                <span key={i} className="text-[10px] bg-slate-50 text-slate-600 px-2 py-1 rounded-md font-medium border border-slate-100">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};