import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { StudentPortfolio, ContentBlock } from '../types';
import { Logo } from '../components/Logo';
import { ImageCarousel } from '../components/ImageCarousel';
import * as Icons from 'lucide-react';
import html2canvas from 'html2canvas';

export const StudentPortfolioPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [portfolio, setPortfolio] = useState<StudentPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Snapshot State
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPortfolio();
  }, [slug]);

  const fetchPortfolio = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_portfolios')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      setPortfolio(data);
    } catch (err: any) {
      console.error(err);
      setError('未找到该学生的成长档案，请检查链接是否正确。');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (portfolio && passwordInput === portfolio.access_password) {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      // Shake animation effect could be added here
    }
  };

  const handleSnapshot = async () => {
    if (!contentRef.current) return;
    setIsSnapshotting(true);
    
    try {
      // Use html2canvas to capture the element
      const canvas = await html2canvas(contentRef.current, {
        useCORS: true, // Important for external images
        scale: 2, // Better resolution
        backgroundColor: '#f8fafc', // match bg-slate-50
        ignoreElements: (element) => element.classList.contains('no-snapshot'),
      });

      const link = document.createElement('a');
      link.download = `SparkMinds_成长档案_${portfolio?.student_name}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Snapshot failed', err);
      alert('生成长图失败，请稍后重试');
    } finally {
      setIsSnapshotting(false);
    }
  };

  // --- Render Content Blocks ---

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'header':
        return (
          <div key={block.id} className="mb-8 text-center">
            {block.data.date && (
               <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold mb-4">
                 {block.data.date}
               </span>
            )}
            <h2 className="text-3xl font-bold text-slate-800 mb-2">{block.data.title}</h2>
            {block.data.content && <p className="text-slate-500 max-w-2xl mx-auto">{block.data.content}</p>}
            <div className="w-16 h-1 bg-orange-500 mx-auto mt-6 rounded-full"></div>
          </div>
        );

      case 'text':
        return (
          <div key={block.id} className="mb-10 max-w-3xl mx-auto">
             {block.data.title && <h3 className="text-xl font-bold text-slate-800 mb-4 border-l-4 border-blue-500 pl-3">{block.data.title}</h3>}
             <div className="prose prose-slate prose-lg text-slate-600 whitespace-pre-wrap leading-relaxed">
               {block.data.content}
             </div>
          </div>
        );

      case 'image_grid':
        const images = block.data.urls || [];
        if (images.length === 0) return null;
        
        // Simple Layout logic
        const isSingle = images.length === 1 || block.data.layout === 'single';
        const isCarousel = block.data.layout === 'carousel';

        return (
          <div key={block.id} className="mb-12">
             {block.data.title && <h3 className="text-xl font-bold text-slate-800 mb-4 px-4 md:px-0 max-w-4xl mx-auto">{block.data.title}</h3>}
             
             {isCarousel ? (
                <div className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-lg">
                   <ImageCarousel images={images} alt="Portfolio" className="aspect-video" />
                </div>
             ) : (
                <div className={`grid gap-4 ${isSingle ? 'max-w-4xl mx-auto' : 'grid-cols-2 md:grid-cols-3 max-w-5xl mx-auto'}`}>
                  {images.map((url, idx) => (
                    <div key={idx} className={`relative rounded-xl overflow-hidden shadow-md bg-slate-200 border border-slate-100 ${isSingle ? 'aspect-video' : 'aspect-square'}`}>
                       <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
             )}
             
             {block.data.content && <p className="text-center text-sm text-slate-500 mt-3 italic">{block.data.content}</p>}
          </div>
        );

      case 'video':
        const videoUrl = block.data.urls?.[0];
        if (!videoUrl) return null;
        return (
           <div key={block.id} className="mb-12 max-w-4xl mx-auto">
              {block.data.title && <h3 className="text-xl font-bold text-slate-800 mb-4">{block.data.title}</h3>}
              <div className="aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
                 {videoUrl.startsWith('<iframe') ? (
                    <div className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0" dangerouslySetInnerHTML={{__html: videoUrl}} />
                 ) : (
                    <video controls className="w-full h-full" src={videoUrl} />
                 )}
              </div>
              {block.data.content && <p className="text-sm text-slate-500 mt-3">{block.data.content}</p>}
           </div>
        );

      default:
        return null;
    }
  };


  // --- View States ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Icons.Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="text-slate-300 mb-4"><Icons.FileQuestion size={64} /></div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">无法访问档案</h1>
        <p className="text-slate-500">{error}</p>
        <a href="/" className="mt-8 text-blue-600 hover:underline">返回首页</a>
      </div>
    );
  }

  // 1. Password Protection Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative BG */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-600 rounded-b-[50%] scale-150 -translate-y-1/2 opacity-10"></div>
        
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md relative z-10">
          <div className="flex justify-center mb-6">
             <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
               <Icons.Lock size={32} />
             </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
            访问 {portfolio.student_name} 的成长档案
          </h2>
          <p className="text-center text-slate-500 text-sm mb-8">
            为了保护学生隐私，请输入访问密码
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="请输入密码"
                className={`w-full px-4 py-3 text-center text-lg tracking-widest border rounded-xl focus:ring-2 outline-none transition-all ${authError ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-slate-300 focus:ring-blue-500'}`}
                autoFocus
              />
              {authError && <p className="text-red-500 text-xs text-center mt-2">密码错误，请重试</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20"
            >
              解锁档案
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
            <Logo className="h-6 w-auto opacity-50 grayscale" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Main Portfolio Content
  return (
    <div className="min-h-screen bg-slate-50 relative">
      
      {/* Content Area to Snapshot */}
      <div ref={contentRef} className="bg-white min-h-screen shadow-2xl max-w-5xl mx-auto relative pb-20">
        
        {/* Header Banner */}
        <header className="bg-slate-900 text-white pt-20 pb-16 px-6 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -translate-x-1/2 translate-y-1/2"></div>
           
           <div className="relative z-10">
              <div className="inline-block mb-4 opacity-80">
                 <Logo className="h-8 w-auto brightness-200 grayscale contrast-200" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                {portfolio.student_name}
              </h1>
              <p className="text-blue-200 text-lg uppercase tracking-widest font-semibold">
                SparkMinds Innovation Portfolio
              </p>
           </div>
        </header>

        {/* Dynamic Blocks */}
        <main className="p-6 md:p-12">
           {portfolio.content_blocks && portfolio.content_blocks.length > 0 ? (
             portfolio.content_blocks.map(block => renderBlock(block))
           ) : (
             <div className="text-center py-20 text-slate-400">
               <p>暂无内容记录</p>
             </div>
           )}

           {/* Footer in Snapshot */}
           <div className="mt-20 pt-10 border-t border-slate-100 text-center">
              <div className="flex justify-center mb-4">
                 <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                    <Icons.QrCode size={24} />
                 </div>
              </div>
              <p className="text-slate-800 font-bold mb-1">SparkMinds 创智实验室</p>
              <p className="text-slate-400 text-xs">青少年硬核科技创新教育</p>
           </div>
        </main>

      </div>

      {/* Floating Action Button (Excluded from Snapshot) */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3 no-snapshot">
         <button
            onClick={handleSnapshot}
            disabled={isSnapshotting}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl shadow-blue-600/40 transition-transform hover:-translate-y-1 flex items-center justify-center group relative"
            title="生成长图"
         >
            {isSnapshotting ? <Icons.Loader2 className="animate-spin" /> : <Icons.Share2 />}
            <span className="absolute right-full mr-3 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              生成长图分享
            </span>
         </button>
      </div>

      {/* Snapshot Overlay */}
      {isSnapshotting && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center text-white no-snapshot backdrop-blur-sm">
          <Icons.Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-400" />
          <p className="text-xl font-bold">正在生成长图...</p>
          <p className="text-sm text-white/60 mt-2">图片生成后将自动下载</p>
        </div>
      )}

    </div>
  );
};
