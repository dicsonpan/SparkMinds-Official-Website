import React from 'react';
import { CourseLevel } from '../types';
import * as Icons from 'lucide-react';

interface CourseCardProps {
  course: CourseLevel;
  index: number;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, index }) => {
  // Dynamic icon rendering if needed, though mostly using image now
  const isEven = index % 2 === 0;

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
          
          {/* Card Image Header */}
          <div className="h-40 w-full bg-slate-200 relative overflow-hidden">
            {course.imageUrl ? (
              <img 
                src={course.imageUrl} 
                alt={course.title} 
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-300">
                <Icons.Image size={40} />
              </div>
            )}
            
            {/* Level Badge Overlay */}
            <div className="absolute top-4 left-4">
              <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-md uppercase tracking-wide">
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