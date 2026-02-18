import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { StudentPortfolio, ContentBlock } from '../types';
import * as Icons from 'lucide-react';
import { Logo } from '../components/Logo';

// Theme Configuration
const THEMES: Record<string, any> = {
  tech_dark: {
    bg: 'bg-slate-950',
    text: 'text-slate-200',
    muted: 'text-slate-400',
    accent: 'text-blue-400',
    cardBg: 'bg-slate-900/80',
    border: 'border-slate-800',
    font: 'font-mono',
    button: 'bg-blue-600 hover:bg-blue-500 text-white',
    gradient: 'from-blue-900/20 to-slate-950'
  },
  academic_light: {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    muted: 'text-slate-500',
    accent: 'text-blue-800',
    cardBg: 'bg-white',
    border: 'border-slate-200',
    font: 'font-serif',
    button: 'bg-slate-800 hover:bg-slate-700 text-white',
    gradient: 'from-slate-100 to-slate-50'
  },
  creative_color: {
    bg: 'bg-[#FFF8F0]',
    text: 'text-slate-900',
    muted: 'text-slate-600',
    accent: 'text-purple-600',
    cardBg: 'bg-white/90',
    border: 'border-purple-100',
    font: 'font-sans',
    button: 'bg-purple-600 hover:bg-purple-500 text-white',
    gradient: 'from-purple-100/50 to-orange-100/30'
  }
};

export const StudentPortfolioPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [portfolio, setPortfolio] = useState<StudentPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!slug) return;
      
      const { data, error } = await supabase
        .from('student_portfolios')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching portfolio:', error);
        setError('Portfolio not found');
      } else {
        setPortfolio(data);
      }
      setLoading(false);
    };

    fetchPortfolio();
  }, [slug]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (portfolio && passwordInput === portfolio.access_password) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('访问密码错误');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Icons.Loader2 className="animate-spin text-slate-400" /></div>;
  if (!portfolio) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">未找到该学生的档案</div>;

  // Theme Resolution
  const themeKey = portfolio.theme_config?.theme || 'tech_dark';
  const styles = THEMES[themeKey] || THEMES['tech_dark'];

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${styles.bg} ${styles.text}`}>
        <div className={`w-full max-w-md p-8 rounded-2xl ${styles.cardBg} border ${styles.border} shadow-xl backdrop-blur-sm text-center`}>
          <div className="mb-6 flex justify-center">
             <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {portfolio.avatar_url ? <img src={portfolio.avatar_url} className="w-full h-full object-cover" /> : <Icons.Lock className="text-slate-400" />}
             </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">{portfolio.student_name} 的成长档案</h2>
          <p className={`text-sm mb-6 ${styles.muted}`}>此页面受密码保护，请输入访问密码。</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white"
              placeholder="输入访问密码"
              autoFocus
            />
            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
            <button 
              type="submit" 
              className={`w-full py-3 rounded-lg font-bold transition-all shadow-lg ${styles.button}`}
            >
              解锁档案
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Block Renderers ---
  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'profile_header':
        return (
            <header key={block.id} className="relative w-full pt-12 pb-12 px-4 md:px-12 max-w-6xl mx-auto mb-12">
                <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
                    <div className={`w-40 h-40 md:w-64 md:h-64 rounded-full ${styles.cardBg} border-4 ${styles.border} flex items-center justify-center text-6xl md:text-8xl font-bold shadow-2xl overflow-hidden relative backdrop-blur-md shrink-0`}>
                        {block.data.avatar_url ? <img src={block.data.avatar_url} className="w-full h-full object-cover" /> : portfolio.student_name[0]}
                    </div>
                    <div className="flex-1">
                        <div className={`inline-block px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest mb-3 ${styles.cardBg} ${styles.accent} border ${styles.border}`}>SparkMinds Portfolio</div>
                        <h1 className={`text-4xl md:text-6xl font-extrabold leading-tight ${styles.font} mb-4 tracking-tight`}>
                           {block.data.student_title || 'Future Innovator'}
                        </h1>
                        {block.data.summary_bio && (
                        <div className={`text-sm md:text-lg ${styles.muted} max-w-3xl leading-relaxed whitespace-pre-wrap`}>
                            {block.data.summary_bio}
                        </div>
                        )}
                    </div>
                </div>
                {/* Hero Background Image if available */}
                {block.data.hero_image_url && (
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20 mask-image-gradient">
                         <img src={block.data.hero_image_url} className="w-full h-full object-cover blur-sm" />
                         <div className={`absolute inset-0 bg-gradient-to-b ${styles.gradient}`}></div>
                    </div>
                )}
            </header>
        );

      case 'skills_matrix':
        return (
            <section key={block.id} className="max-w-6xl mx-auto px-4 mb-16">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {block.data.skills_categories?.map((cat, idx) => (
                      <div key={idx} className={`p-6 rounded-2xl ${styles.cardBg} border ${styles.border} shadow-sm backdrop-blur-sm`}>
                          <h3 className={`font-bold mb-4 flex items-center gap-2 ${styles.accent}`}>
                             <Icons.Zap size={18} /> {cat.name}
                          </h3>
                          <div className="space-y-4">
                              {cat.items.map((skill, sIdx) => (
                                  <div key={sIdx}>
                                      <div className="flex justify-between text-xs mb-1 font-medium">
                                          <span>{skill.name}</span>
                                          <span className={styles.muted}>{skill.value}{skill.unit || '%'}</span>
                                      </div>
                                      <div className={`h-2 w-full rounded-full bg-slate-200/20 overflow-hidden`}>
                                          <div 
                                            className={`h-full rounded-full ${styles.accent.replace('text-', 'bg-')}`} 
                                            style={{ width: `${Math.min(100, Math.max(0, skill.value))}%` }}
                                          ></div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
               </div>
            </section>
        );
      
      case 'info_list':
         return (
             <section key={block.id} className="max-w-6xl mx-auto px-4 mb-16">
                <div className={`p-8 rounded-2xl ${styles.cardBg} border ${styles.border}`}>
                    {block.data.title && <h3 className="text-xl font-bold mb-6 border-b border-slate-700/50 pb-2">{block.data.title}</h3>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {block.data.info_items?.map((item, idx) => {
                            const Icon = (Icons as any)[item.icon || 'Star'] || Icons.Star;
                            return (
                                <div key={idx} className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styles.bg} ${styles.accent} border ${styles.border}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div>
                                        <div className={`text-xs uppercase tracking-wider font-bold ${styles.muted} mb-0.5`}>{item.label}</div>
                                        <div className="font-medium">{item.value}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
             </section>
         );

      case 'section_heading':
         return (
             <div key={block.id} className="max-w-6xl mx-auto px-4 mb-8 mt-16 text-center">
                 <h2 className={`text-3xl font-bold inline-block border-b-4 ${styles.border} pb-2 ${styles.font}`}>{block.data.title}</h2>
             </div>
         );

      case 'project_highlight':
         return (
             <section key={block.id} className="max-w-6xl mx-auto px-4 mb-16">
                 <div className={`rounded-3xl overflow-hidden ${styles.cardBg} border ${styles.border} shadow-lg`}>
                     <div className="grid md:grid-cols-2">
                         <div className="p-8 md:p-12">
                             <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${styles.bg} ${styles.accent}`}>PROJECT HIGHLIGHT</div>
                             <h3 className="text-2xl md:text-3xl font-bold mb-6">{block.data.title}</h3>
                             
                             <div className="space-y-6">
                                 {[
                                     { label: 'SITUATION', text: block.data.star_situation },
                                     { label: 'TASK', text: block.data.star_task },
                                     { label: 'ACTION', text: block.data.star_action },
                                     { label: 'RESULT', text: block.data.star_result },
                                 ].map((item, i) => item.text && (
                                     <div key={i}>
                                         <h4 className={`text-xs font-bold ${styles.muted} tracking-widest mb-1`}>{item.label}</h4>
                                         <p className="text-sm md:text-base leading-relaxed">{item.text}</p>
                                     </div>
                                 ))}
                             </div>
                         </div>
                         <div className={`bg-slate-900/50 min-h-[300px] relative`}>
                             {block.data.evidence_urls && block.data.evidence_urls.length > 0 ? (
                                 <img src={block.data.evidence_urls[0]} className="w-full h-full object-cover absolute inset-0" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center text-slate-500">
                                     <Icons.Image size={48} />
                                 </div>
                             )}
                         </div>
                     </div>
                 </div>
             </section>
         );
      
      case 'timeline_node':
         return (
            <div key={block.id} className="max-w-4xl mx-auto px-4 mb-8 flex gap-4 md:gap-8 group">
               <div className="flex flex-col items-center shrink-0">
                  <div className={`w-3 h-3 rounded-full ${styles.accent.replace('text-', 'bg-')} mt-2 ring-4 ${styles.bg}`}></div>
                  <div className={`w-0.5 flex-1 bg-slate-700/20 my-2 group-last:hidden`}></div>
               </div>
               <div className={`flex-1 pb-8 ${styles.cardBg} p-6 rounded-xl border ${styles.border} relative`}>
                  <div className={`absolute top-6 -left-2 w-4 h-4 ${styles.cardBg} border-l border-b ${styles.border} transform rotate-45 md:block hidden`}></div>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-mono font-bold mb-2 ${styles.bg} ${styles.accent}`}>{block.data.date}</span>
                  <h3 className="text-xl font-bold mb-2">{block.data.title}</h3>
                  <p className={`${styles.muted} text-sm leading-relaxed whitespace-pre-wrap`}>{block.data.content}</p>
                  {block.data.urls && block.data.urls.length > 0 && (
                      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                          {block.data.urls.map((url, i) => (
                              <img key={i} src={url} className="h-24 rounded-lg border border-slate-700/20 cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(url, '_blank')} />
                          ))}
                      </div>
                  )}
               </div>
            </div>
         );

      case 'table':
          return (
              <section key={block.id} className="max-w-6xl mx-auto px-4 mb-16">
                  {block.data.title && <h3 className="text-xl font-bold mb-4 px-2">{block.data.title}</h3>}
                  <div className={`overflow-x-auto rounded-xl border ${styles.border} ${styles.cardBg}`}>
                      <table className="w-full text-left text-sm">
                          <thead>
                              <tr className={`border-b ${styles.border} bg-slate-900/5`}>
                                  {block.data.table_columns?.map((col, i) => (
                                      <th key={i} className={`p-4 font-bold ${styles.text}`}>{col}</th>
                                  ))}
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/10">
                              {block.data.table_rows?.map((row, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-slate-500/5 transition-colors">
                                      {row.map((cell, cIdx) => (
                                          <td key={cIdx} className={`p-4 ${styles.muted}`}>{cell}</td>
                                      ))}
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </section>
          );

      case 'text':
         return (
             <section key={block.id} className="max-w-4xl mx-auto px-4 mb-12">
                 {block.data.title && <h3 className="text-2xl font-bold mb-4">{block.data.title}</h3>}
                 <div className={`prose ${themeKey === 'tech_dark' ? 'prose-invert' : ''} max-w-none`}>
                     <p className="whitespace-pre-wrap leading-relaxed opacity-90">{block.data.content}</p>
                 </div>
             </section>
         );
      
      case 'image_grid':
         return (
             <section key={block.id} className="max-w-6xl mx-auto px-4 mb-16">
                 {block.data.title && <h3 className="text-xl font-bold mb-6 px-2">{block.data.title}</h3>}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {block.data.urls?.map((url, i) => (
                         <div key={i} className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative">
                             <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                         </div>
                     ))}
                 </div>
             </section>
         );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${styles.bg} ${styles.text} transition-colors duration-500 font-sans selection:bg-blue-500/30`}>
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center backdrop-blur-md border-b ${styles.border} bg-opacity-80`}>
         <div className="flex items-center gap-2">
             <Logo className={`h-8 w-auto ${themeKey === 'tech_dark' ? 'brightness-0 invert' : ''}`} />
         </div>
         <div className="text-xs font-mono opacity-50">
             sparkminds.edu / portfolio
         </div>
      </nav>
      
      <div className="pt-20">
         {portfolio.content_blocks?.map(block => renderBlock(block))}
      </div>

      <footer className={`py-12 text-center text-xs ${styles.muted} border-t ${styles.border} mt-20`}>
          <p>© 2024 SparkMinds Lab. All rights reserved.</p>
          <p className="mt-2 opacity-50">Generated by SparkMinds Portfolio System</p>
      </footer>
    </div>
  );
};