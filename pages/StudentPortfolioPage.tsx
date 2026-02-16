import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { StudentPortfolio, ContentBlock, PortfolioTheme } from '../types';
import { Logo } from '../components/Logo';
import { ImageCarousel } from '../components/ImageCarousel';
import * as Icons from 'lucide-react';
import html2canvas from 'html2canvas';

// --- Theme Configurations ---
const THEMES: Record<PortfolioTheme, any> = {
  tech_dark: {
    bg: 'bg-slate-950',
    text: 'text-slate-200',
    cardBg: 'bg-slate-900/50',
    accent: 'text-blue-400',
    border: 'border-slate-800',
    font: 'font-sans',
    navBg: 'bg-slate-950/80',
    button: 'bg-blue-600 hover:bg-blue-500 text-white',
    blobColor1: 'bg-blue-500',
    blobColor2: 'bg-purple-500',
  },
  academic_light: {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    cardBg: 'bg-white',
    accent: 'text-blue-900',
    border: 'border-slate-200',
    font: 'font-serif',
    navBg: 'bg-white/80',
    button: 'bg-slate-900 hover:bg-slate-700 text-white',
    blobColor1: 'bg-blue-200',
    blobColor2: 'bg-slate-300',
  },
  creative_color: {
    bg: 'bg-yellow-50',
    text: 'text-slate-900',
    cardBg: 'bg-white',
    accent: 'text-[#E1964B]',
    border: 'border-orange-100',
    font: 'font-sans',
    navBg: 'bg-yellow-50/80',
    button: 'bg-[#E1964B] hover:bg-orange-600 text-white',
    blobColor1: 'bg-orange-300',
    blobColor2: 'bg-yellow-300',
  }
};

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
    }
  };

  const handleSnapshot = async () => {
    if (!contentRef.current) return;
    setIsSnapshotting(true);
    
    try {
      const theme = portfolio?.theme_config?.theme || 'tech_dark';
      const bgColor = theme === 'tech_dark' ? '#020617' : '#f8fafc';

      const canvas = await html2canvas(contentRef.current, {
        useCORS: true, 
        scale: 2, 
        backgroundColor: bgColor,
        ignoreElements: (element) => element.classList.contains('no-snapshot'),
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `SparkMinds_${portfolio?.student_name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Snapshot failed', err);
      alert('生成长图失败，请稍后重试');
    } finally {
      setIsSnapshotting(false);
    }
  };

  // --- Components ---

  const BentoGrid = ({ images }: { images: string[] }) => {
    if (!images.length) return null;
    
    // Pattern logic for bento grid based on number of images
    // 1 img: Full
    // 2 img: Split
    // 3 img: 1 Big Left, 2 Small Right
    // 4 img: Grid
    // 5+: Grid
    
    if (images.length === 1) {
      return (
        <div className="rounded-2xl overflow-hidden shadow-2xl aspect-video relative group">
           <img src={images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Work" />
        </div>
      );
    }

    if (images.length === 3) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 aspect-[4/3] md:aspect-[2/1]">
           <div className="md:col-span-2 rounded-2xl overflow-hidden relative group">
              <img src={images[0]} className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-700" alt="Work Main" />
           </div>
           <div className="grid grid-rows-2 gap-4">
              <div className="rounded-2xl overflow-hidden relative group">
                 <img src={images[1]} className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-700" alt="Work Sub 1" />
              </div>
              <div className="rounded-2xl overflow-hidden relative group">
                 <img src={images[2]} className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-700" alt="Work Sub 2" />
              </div>
           </div>
        </div>
      )
    }

    // Default Grid
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((url, idx) => (
          <div key={idx} className="rounded-2xl overflow-hidden aspect-square relative group shadow-lg">
             <img src={url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={`Work ${idx}`} />
          </div>
        ))}
      </div>
    );
  };

  const renderBlock = (block: ContentBlock, styles: any) => {
    switch (block.type) {
      case 'header':
        return (
          <div key={block.id} className="mb-12 relative pl-6 border-l-4 border-blue-500/50 animate-fade-in-up">
            {block.data.date && (
               <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 uppercase tracking-widest ${styles.accent} bg-blue-500/10`}>
                 {block.data.date}
               </span>
            )}
            <h2 className={`text-2xl md:text-3xl font-bold mb-3 ${styles.text}`}>{block.data.title}</h2>
            {block.data.content && <p className={`text-lg opacity-80 leading-relaxed ${styles.text}`}>{block.data.content}</p>}
          </div>
        );

      case 'text':
        return (
          <div key={block.id} className={`mb-16 p-8 rounded-3xl ${styles.cardBg} border ${styles.border} backdrop-blur-sm animate-fade-in-up`}>
             {block.data.title && <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${styles.text}`}>
               <Icons.Terminal className="w-5 h-5 opacity-50" />
               {block.data.title}
             </h3>}
             <div className={`prose prose-lg ${styles.text === 'text-slate-200' ? 'prose-invert' : ''} max-w-none opacity-90 whitespace-pre-wrap`}>
               {block.data.content}
             </div>
          </div>
        );

      case 'image_grid':
        const images = block.data.urls || [];
        if (images.length === 0) return null;
        return (
          <div key={block.id} className="mb-16 animate-fade-in-up">
             {block.data.title && <h3 className={`text-xl font-bold mb-6 px-2 ${styles.text}`}>{block.data.title}</h3>}
             <BentoGrid images={images} />
             {block.data.content && <p className={`text-center text-sm mt-4 opacity-60 italic ${styles.text}`}>{block.data.content}</p>}
          </div>
        );

      case 'video':
        const videoUrl = block.data.urls?.[0];
        if (!videoUrl) return null;
        return (
           <div key={block.id} className="mb-16 animate-fade-in-up">
              {block.data.title && <h3 className={`text-xl font-bold mb-6 px-2 ${styles.text}`}>{block.data.title}</h3>}
              <div className={`aspect-video rounded-3xl overflow-hidden shadow-2xl ${styles.border} border-4`}>
                 {videoUrl.startsWith('<iframe') ? (
                    <div className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0" dangerouslySetInnerHTML={{__html: videoUrl}} />
                 ) : (
                    <video controls className="w-full h-full bg-black" src={videoUrl} />
                 )}
              </div>
              {block.data.content && <p className={`text-sm mt-4 opacity-60 ${styles.text}`}>{block.data.content}</p>}
           </div>
        );

      default:
        return null;
    }
  };


  // --- View States ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Icons.Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
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

  // 1. Password Protection (Standard Clean Style)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Tech BG */}
        <div className="absolute inset-0 overflow-hidden">
           <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[100px]"></div>
           <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md relative z-10">
          <div className="flex justify-center mb-8">
             <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
               <Icons.Lock size={32} className="text-white" />
             </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-white mb-2">
            受保护的成长档案
          </h2>
          <p className="text-center text-slate-400 text-sm mb-8">
            请输入访问密码以查看 {portfolio.student_name} 的作品集
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="在此输入密码"
                className={`w-full px-4 py-4 text-center text-xl tracking-[0.5em] bg-slate-950 border rounded-xl focus:ring-2 outline-none transition-all text-white placeholder-slate-600 ${authError ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-700 focus:ring-blue-500/50 focus:border-blue-500'}`}
                autoFocus
              />
              {authError && <p className="text-red-400 text-xs text-center mt-2 font-medium">密码错误</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-white text-slate-950 hover:bg-blue-50 font-bold py-4 rounded-xl transition-all shadow-lg mt-2"
            >
              解锁访问
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-800 flex justify-center opacity-50">
            <Logo className="h-6 w-auto brightness-200 grayscale contrast-0" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Main Portfolio Content
  const themeName = portfolio.theme_config?.theme || 'tech_dark';
  const styles = THEMES[themeName];

  return (
    <div className={`min-h-screen ${styles.bg} ${styles.text} ${styles.font} selection:bg-blue-500/30 selection:text-white`}>
      
      {/* Scroll Progress Bar (Optional, can be added later) */}
      
      {/* Main Content Area */}
      <div ref={contentRef} className={`${styles.bg} min-h-screen relative pb-32`}>
        
        {/* Dynamic Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className={`absolute top-0 right-0 w-[800px] h-[800px] ${styles.blobColor1} rounded-full mix-blend-screen filter blur-[120px] opacity-10 translate-x-1/3 -translate-y-1/3`}></div>
           <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] ${styles.blobColor2} rounded-full mix-blend-screen filter blur-[100px] opacity-10 -translate-x-1/3 translate-y-1/3`}></div>
        </div>

        {/* --- Hero Section --- */}
        <header className="relative pt-32 pb-20 px-6 md:px-12 max-w-6xl mx-auto">
           <div className="flex flex-col md:flex-row items-end gap-8 mb-12">
              <div className="relative group">
                 {/* Initials Avatar if no image, or a placeholder */}
                 <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full ${styles.cardBg} border-2 ${styles.border} flex items-center justify-center text-5xl font-bold shadow-2xl overflow-hidden relative z-10`}>
                    {portfolio.student_name[0]}
                 </div>
                 {/* Decorative Ring */}
                 <div className={`absolute -inset-2 rounded-full border border-dashed ${styles.border} animate-[spin_10s_linear_infinite] opacity-50`}></div>
              </div>
              
              <div className="flex-1 pb-4">
                 <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 ${styles.cardBg} ${styles.accent} border ${styles.border}`}>
                    SparkMinds Portfolio
                 </div>
                 <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-2">
                   {portfolio.student_name}
                 </h1>
                 <p className={`text-xl md:text-2xl opacity-60 font-light ${styles.font}`}>
                   {portfolio.student_title || 'Tech Enthusiast & Creator'}
                 </p>
              </div>
           </div>

           <div className={`h-px w-full bg-gradient-to-r from-transparent ${themeName === 'tech_dark' ? 'via-slate-700' : 'via-slate-300'} to-transparent`}></div>
        </header>

        {/* --- Dynamic Content Stream --- */}
        <main className="px-6 md:px-12 max-w-5xl mx-auto relative z-10">
           {portfolio.content_blocks && portfolio.content_blocks.length > 0 ? (
             <div className="flex flex-col gap-8">
                {portfolio.content_blocks.map(block => renderBlock(block, styles))}
             </div>
           ) : (
             <div className="text-center py-32 opacity-30">
               <p className="text-xl">Waiting for data signal...</p>
             </div>
           )}

           {/* Footer in Snapshot */}
           <div className={`mt-32 pt-12 border-t ${styles.border} text-center opacity-60`}>
              <div className="flex justify-center mb-6">
                 <div className={`w-16 h-16 ${styles.cardBg} rounded-2xl flex items-center justify-center`}>
                    <Icons.QrCode size={32} />
                 </div>
              </div>
              <p className="font-bold text-lg mb-1">SparkMinds 创智实验室</p>
              <p className="text-sm">青少年硬核科技创新教育</p>
              <p className="text-xs mt-4 font-mono">sparkminds.cn</p>
           </div>
        </main>

      </div>

      {/* --- UI Controls (No Snapshot) --- */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4 no-snapshot">
         <button
            onClick={handleSnapshot}
            disabled={isSnapshotting}
            className={`${styles.button} w-14 h-14 rounded-full shadow-2xl flex items-center justify-center group relative hover:scale-110 transition-transform`}
            title="Export Image"
         >
            {isSnapshotting ? <Icons.Loader2 className="animate-spin" /> : <Icons.Share2 />}
            <span className="absolute right-full mr-4 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold">
              生成长图
            </span>
         </button>
      </div>

      {/* Snapshot Overlay */}
      {isSnapshotting && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center text-white no-snapshot backdrop-blur-md">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <Icons.Aperture size={24} className="text-blue-500 animate-pulse" />
             </div>
          </div>
          <p className="text-xl font-bold mt-8 tracking-widest uppercase">Rendering High-Res Image</p>
          <p className="text-sm text-slate-400 mt-2">Please wait while we capture your portfolio...</p>
        </div>
      )}

    </div>
  );
};
