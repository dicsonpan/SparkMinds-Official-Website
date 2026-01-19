import React from 'react';
import { CourseLevel } from '../types';
import * as Icons from 'lucide-react';

interface CourseCardProps {
  course: CourseLevel;
  index: number;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, index }) => {
  // Dynamic icon rendering
  const IconComponent = (Icons as any)[course.iconName] || Icons.BookOpen;
  const isEven = index % 2 === 0;

  return (
    <div className={`relative flex items-center justify-between w-full mb-8 md:mb-16 ${isEven ? 'flex-row-reverse' : ''}`}>
      
      {/* Spacer for desktop layout to center the line */}
      <div className="hidden md:block w-5/12"></div>

      {/* Center Line Node */}
      <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-white border-4 border-blue-600 z-10 shadow-lg">
        <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
      </div>

      {/* Content Card */}
      <div className="w-full md:w-5/12 pl-12 md:pl-0">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500 hover:shadow-xl transition-shadow duration-300 group">
          <div className="flex items-center justify-between mb-2">
             <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
               {course.level}
             </span>
             <span className="text-sm font-semibold text-slate-500">{course.age}</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
            {course.title}
          </h3>
          <p className="text-slate-600 text-sm mb-4 leading-relaxed">
            {course.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {course.skills.map((skill, i) => (
              <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-medium border border-slate-200">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};