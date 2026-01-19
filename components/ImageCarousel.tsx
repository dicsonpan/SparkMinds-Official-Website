import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  autoPlayInterval?: number;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ 
  images = [], 
  alt, 
  className = "h-48",
  autoPlayInterval = 5000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (images.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [images.length, isHovered, autoPlayInterval]);

  const nextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) {
     return (
         <div className={`w-full bg-slate-100 flex items-center justify-center text-slate-300 ${className}`}>
            <Icons.Image size={32} />
         </div>
     )
  }

  return (
    <div 
      className={`relative overflow-hidden group bg-slate-200 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
       {images.map((url, idx) => (
         <div
           key={`${url}-${idx}`}
           className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
         >
            {url.trim().startsWith('<iframe') ? (
               <div className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0 pointer-events-auto" dangerouslySetInnerHTML={{__html: url}} />
            ) : (
               <img src={url} alt={`${alt} - ${idx + 1}`} className="w-full h-full object-cover" />
            )}
         </div>
       ))}

       {images.length > 1 && (
         <>
           {/* Navigation Arrows - Visible on hover */}
           <button 
             onClick={prevSlide} 
             className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
           >
             <Icons.ChevronLeft size={20} />
           </button>
           <button 
             onClick={nextSlide} 
             className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
           >
             <Icons.ChevronRight size={20} />
           </button>

           {/* Dots Indicator */}
           <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 pointer-events-auto shadow-sm ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
           </div>
         </>
       )}
    </div>
  );
};