import React from 'react';

interface SectionHeadingProps {
  subtitle: string;
  title: string;
  description?: string;
  alignment?: 'left' | 'center';
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ 
  subtitle, 
  title, 
  description,
  alignment = 'center' 
}) => {
  return (
    <div className={`mb-12 ${alignment === 'center' ? 'text-center' : 'text-left'}`}>
      <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold tracking-wider mb-4">
        {subtitle}
      </span>
      <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          {description}
        </p>
      )}
      <div className={`h-1 w-20 bg-orange-500 mt-6 ${alignment === 'center' ? 'mx-auto' : ''}`}></div>
    </div>
  );
};