import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { StudentPortfolio, ContentBlock, SkillItem } from '../types';
import * as Icons from 'lucide-react';
import { Logo } from '../components/Logo';

// Theme Configuration
const THEMES: Record<string, any> = {
  tech_dark: {
    bg: 'bg-[#020617]', // Slate 950
    text: 'text-slate-100',
    muted: 'text-slate-400',
    accent: 'text-blue-400',
    cardBg: 'bg-[#0f172a]', // Slate 900
    border: 'border-slate-800',
    font: 'font-sans',
    button: 'bg-blue-600 hover:bg-blue-500 text-white',
    gradient: 'from-blue-900/20 to-[#020617]',
    barTrack: 'bg-slate-800',
    barFill: 'bg-blue-500',
    radarPolygon: 'fill-blue-500/20 stroke-blue-500',
    radarGrid: 'stroke-slate-700'
  },
  academic_light: {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    muted: 'text-slate-500',
    accent: 'text-blue-700',
    cardBg: 'bg-white',
    border: 'border-slate-200',
    font: 'font-serif',
    button: 'bg-slate-800 hover:bg-slate-700 text-white',
    gradient: 'from-slate-100 to-slate-50',
    barTrack: 'bg-slate-100',
    barFill: 'bg-slate-800',
    radarPolygon: 'fill-slate-800/20 stroke-slate-800',
    radarGrid: 'stroke-slate-200'
  },
  creative_color: {
    bg: 'bg-[#FFF8F0]',
    text: 'text-slate-900',
    muted: 'text-slate-600',
    accent: 'text-purple-600',
    cardBg: 'bg-white',
    border: 'border-purple-100',
    font: 'font-sans',
    button: 'bg-purple-600 hover:bg-purple-500 text-white',
    gradient: 'from-purple-100/50 to-orange-100/30',
    barTrack: 'bg-orange-100',
    barFill: 'bg-purple-500',
    radarPolygon: 'fill-purple-500/20 stroke-purple-500',
    radarGrid: 'stroke-purple-200'
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Icons.Loader2 className="animate-spin text-blue-500" /></div>;
  if (!portfolio) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-500">未找到该学生的档案</div>;

  // Theme Resolution
  const themeKey = portfolio.theme_config?.theme || 'tech_dark';
  const styles = THEMES[themeKey] || THEMES['tech_dark'];

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${styles.bg} ${styles.text}`}>
        <div className={`w-full max-w-md p-8 rounded-2xl ${styles.cardBg} border ${styles.border} shadow-2xl backdrop-blur-sm text-center`}>
          <div className="mb-6 flex justify-center">
             <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-4 border-slate-700 shadow-lg">
                {portfolio.avatar_url ? <img src={portfolio.avatar_url} className="w-full h-full object-cover" /> : <Icons.Lock className="text-slate-500" size={32} />}
             </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">{portfolio.student_name}</h2>
          <p className={`text-sm mb-6 ${styles.muted}`}>此档案受密码保护</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-white bg-slate-950 placeholder-slate-600"
              placeholder="输入访问密码"
              autoFocus
            />
            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
            <button 
              type="submit" 
              className={`w-full py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-blue-500/20 ${styles.button}`}
            >
              解锁档案
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Skill Render Helpers ---
  
  // 1. Bar Chart
  const renderBarSkill = (skill: SkillItem, idx: number) => (
    <div key={idx}>
        <div className="flex justify-between text-sm mb-1.5 font-medium">
            <span>{skill.name}</span>
            <span className={styles.accent}>{skill.value}{skill.unit || '%'}</span>
        </div>
        <div className={`h-2.5 w-full rounded-full ${styles.barTrack} overflow-hidden`}>
            <div 
            className={`h-full rounded-full ${styles.barFill} shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out`} 
            style={{ width: `${Math.min(100, Math.max(0, skill.value))}%` }}
            ></div>
        </div>
    </div>
  );

  // 2. Circle Chart
  const renderCircleSkill = (skill: SkillItem, idx: number) => {
      const r = 36;
      const c = 2 * Math.PI * r;
      const offset = c - (Math.min(100, Math.max(0, skill.value)) / 100) * c;
      return (
          <div key={idx} className="flex flex-col items-center justify-center p-2">
              <div className="relative w-24 h-24 mb-2">
                  <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r={r} stroke="currentColor" strokeWidth="8" fill="transparent" className={`${styles.muted} opacity-20`} />
                      <circle cx="48" cy="48" r={r} stroke="currentColor" strokeWidth="8" fill="transparent" 
                          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
                          className={`${styles.accent} transition-all duration-1000 ease-out`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-sm">
                      {skill.value}{skill.unit || '%'}
                  </div>
              </div>
              <span className="text-xs font-bold text-center">{skill.name}</span>
          </div>
      );
  };

  // 3. Stat Grid (Digital Card)
  const renderStatSkill = (skill: SkillItem, idx: number) => (
      <div key={idx} className={`p-4 rounded-xl border ${styles.border} ${styles.bg} bg-opacity-50 flex flex-col items-center justify-center text-center`}>
          <div className={`text-3xl font-black ${styles.accent} mb-1`}>
              {skill.value}<span className="text-xs ml-0.5 opacity-60 font-normal">{skill.unit}</span>
          </div>
          <div className={`text-xs font-bold uppercase tracking-wider ${styles.muted}`}>{skill.name}</div>
      </div>
  );

  // 4. Radar Chart (SVG)
  const renderRadarChart = (items: SkillItem[]) => {
      if (!items.length) return null;
      const size = 240;
      const center = size / 2;
      const radius = 80;
      const angleStep = (Math.PI * 2) / items.length;

      const getPoint = (value: number, index: number, rScale = radius) => {
          const angle = index * angleStep - Math.PI / 2; 
          const r = (value / 100) * rScale;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
      };

      const points = items.map((item, i) => getPoint(item.value, i)).join(' ');
      
      return (
          <div className="flex flex-col items-center justify-center py-2">
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                  {/* Grid Levels */}
                  {[25, 50, 75, 100].map(level => (
                      <polygon key={level} 
                          points={items.map((_, i) => getPoint(level, i)).join(' ')}
                          fill="none" stroke="currentColor" strokeWidth="1" className={`${styles.radarGrid} opacity-20`}
                      />
                  ))}
                  {/* Axes */}
                  {items.map((_, i) => {
                      const p = getPoint(100, i);
                      return <line key={i} x1={center} y1={center} x2={p.split(',')[0]} y2={p.split(',')[1]} stroke="currentColor" strokeWidth="1" className={`${styles.radarGrid} opacity-20`} />
                  })}
                  {/* Data Shape */}
                  <polygon points={points} className={`${styles.radarPolygon} stroke-2`} />
                  {/* Labels */}
                  {items.map((item, i) => {
                      const [x, y] = getPoint(100, i, radius + 20).split(',').map(Number);
                      return (
                          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className={`text-[10px] font-bold fill-current ${styles.text}`}>
                              {item.name}
                          </text>
                      );
                  })}
              </svg>
          </div>
      );
  };


  // --- Block Renderers ---
  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'profile_header':
         return (
            <header key={block.id} className="relative w-full pt-16 pb-12 px-4 md:px-12 max-w-6xl mx-auto mb-12">
                <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
                    <div className={`w-40 h-40 md:w-72 md:h-72 rounded-full ${styles.cardBg} border-4 ${styles.border} flex items-center justify-center text-6xl md:text-8xl font-bold shadow-2xl overflow-hidden relative backdrop-blur-md shrink-0`}>
                        {block.data.avatar_url ? <img src={block.data.avatar_url} className="w-full h-full object-cover" /> : portfolio.student_name[0]}
                    </div>
                    <div className="flex-1 mb-2">
                        <div className={`inline-block px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest mb-3 md:mb-4 ${styles.cardBg} ${styles.accent} border ${styles.border}`}>SparkMinds Portfolio</div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 opacity-80">{portfolio.student_name}</h1>
                        <p className={`text-2xl md:text-6xl font-extrabold leading-tight ${styles.font} max-w-4xl mb-4 md:mb-6 drop-shadow-sm`}>{block.data.student_title || 'Future Innovator & Builder'}</p>
                        {block.data.summary_bio && (
                        <div className={`mt-2 md:mt-4 text-sm md:text-lg opacity-80 max-w-3xl leading-relaxed whitespace-pre-wrap ${styles.muted}`}>
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
            <section key={block.id} className="max-w-6xl mx-auto px-4 mb-20">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {block.data.skills_categories?.map((cat, idx) => {
                      const isRadar = cat.layout === 'radar';
                      return (
                        <div key={idx} className={`p-8 rounded-3xl ${styles.cardBg} border ${styles.border} shadow-lg backdrop-blur-sm hover:border-blue-500/30 transition-colors ${isRadar ? 'md:col-span-2 lg:col-span-1' : ''}`}>
                            <h3 className={`font-bold text-lg mb-6 flex items-center gap-2 ${styles.accent}`}>
                                <Icons.Zap size={20} className="fill-current" /> {cat.name}
                            </h3>
                            
                            {cat.layout === 'radar' ? (
                                renderRadarChart(cat.items)
                            ) : cat.layout === 'circle' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 place-items-center">
                                    {cat.items.map((skill, sIdx) => renderCircleSkill(skill, sIdx))}
                                </div>
                            ) : cat.layout === 'stat_grid' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {cat.items.map((skill, sIdx) => renderStatSkill(skill, sIdx))}
                                </div>
                            ) : (
                                // Default Bar
                                <div className="space-y-6">
                                    {cat.items.map((skill, sIdx) => renderBarSkill(skill, sIdx))}
                                </div>
                            )}
                        </div>
                      );
                  })}
               </div>
            </section>
        );
      
      case 'project_highlight':
         return (
             <section key={block.id} className="max-w-6xl mx-auto px-4 mb-20">
                 <div className={`rounded-3xl overflow-hidden ${styles.cardBg} border ${styles.border} shadow-2xl`}>
                     <div className="grid md:grid-cols-5">
                         <div className="p-8 md:p-12 md:col-span-3 flex flex-col">
                             <div className={`inline-block w-fit px-3 py-1 rounded-full text-[10px] font-bold mb-6 tracking-widest bg-blue-900/30 text-blue-300 border border-blue-800/50`}>
                                 PROJECT HIGHLIGHT
                             </div>
                             <h3 className={`text-2xl md:text-3xl font-bold mb-10 text-white`}>{block.data.title}</h3>
                             
                             <div className="space-y-8 flex-1">
                                 {/* First Row: Situation & Task */}
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-800 pb-8">
                                     <div className="relative pl-4 border-l-2 border-slate-700">
                                         <h4 className={`text-[10px] font-bold ${styles.muted} uppercase tracking-[0.2em] mb-2`}>SITUATION</h4>
                                         <p className="text-sm md:text-base leading-relaxed text-slate-300">{block.data.star_situation}</p>
                                     </div>
                                     <div className="relative pl-4 border-l-2 border-slate-700">
                                         <h4 className={`text-[10px] font-bold ${styles.muted} uppercase tracking-[0.2em] mb-2`}>TASK</h4>
                                         <p className="text-sm md:text-base leading-relaxed text-slate-300">{block.data.star_task}</p>
                                     </div>
                                 </div>

                                 {/* Second Row: Action & Result */}
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                     <div className="relative pl-4 border-l-2 border-slate-700">
                                         <h4 className={`text-[10px] font-bold ${styles.muted} uppercase tracking-[0.2em] mb-2`}>ACTION</h4>
                                         <p className="text-sm md:text-base leading-relaxed text-slate-300">{block.data.star_action}</p>
                                     </div>
                                     <div className="relative pl-4 border-l-2 border-slate-700">
                                         <h4 className={`text-[10px] font-bold ${styles.muted} uppercase tracking-[0.2em] mb-2`}>RESULT</h4>
                                         <p className="text-sm md:text-base leading-relaxed text-slate-300">{block.data.star_result}</p>
                                     </div>
                                 </div>
                             </div>
                         </div>
                         <div className={`md:col-span-2 bg-black/40 min-h-[300px] relative border-l ${styles.border}`}>
                             {block.data.evidence_urls && block.data.evidence_urls.length > 0 ? (
                                 <img src={block.data.evidence_urls[0]} className="w-full h-full object-cover absolute inset-0" />
                             ) : (
                                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-4 p-8 text-center">
                                     <Icons.Image size={64} strokeWidth={1} />
                                     <span className="text-xs uppercase tracking-widest">Project Evidence</span>
                                 </div>
                             )}
                             {/* Overlay Gradient */}
                             <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
                         </div>
                     </div>
                 </div>
             </section>
         );
      
      case 'info_list':
         return (
             <section key={block.id} className="max-w-6xl mx-auto px-4 mb-20">
                <div className={`p-8 md:p-10 rounded-3xl ${styles.cardBg} border ${styles.border}`}>
                    {block.data.title && <h3 className="text-xl font-bold mb-8 pb-4 border-b border-slate-800">{block.data.title}</h3>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-12">
                        {block.data.info_items?.map((item, idx) => {
                            const Icon = (Icons as any)[item.icon || 'Star'] || Icons.Star;
                            return (
                                <div key={idx} className="flex items-start gap-4 group">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${styles.bg} ${styles.accent} border ${styles.border} shadow-sm group-hover:scale-110 transition-transform`}>
                                        <Icon size={24} />
                                    </div>
                                    <div>
                                        <div className={`text-[10px] uppercase tracking-widest font-bold ${styles.muted} mb-1`}>{item.label}</div>
                                        <div className="font-bold text-lg">{item.value}</div>
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
             <div key={block.id} className="max-w-4xl mx-auto px-4 mb-10 mt-24 text-center">
                 <div className="flex items-center justify-center gap-4 mb-4 opacity-50">
                    <div className={`h-px w-12 ${styles.muted} bg-current`}></div>
                    <Icons.Hash size={16} className={styles.accent} />
                    <div className={`h-px w-12 ${styles.muted} bg-current`}></div>
                 </div>
                 <h2 className={`text-3xl md:text-4xl font-bold ${styles.text}`}>{block.data.title}</h2>
             </div>
         );
      
      case 'timeline_node':
         return (
            <div key={block.id} className="max-w-4xl mx-auto px-4 mb-8 flex gap-6 md:gap-10 group">
               <div className="flex flex-col items-center shrink-0">
                  <div className={`w-4 h-4 rounded-full ${styles.barFill} mt-2 ring-4 ${styles.bg} shadow-[0_0_15px_rgba(59,130,246,0.6)]`}></div>
                  <div className={`w-0.5 flex-1 ${styles.border} bg-slate-800 my-2 group-last:hidden`}></div>
               </div>
               <div className={`flex-1 pb-10 ${styles.cardBg} p-8 rounded-2xl border ${styles.border} relative hover:border-blue-500/30 transition-colors`}>
                  <div className={`absolute top-6 -left-3 w-6 h-6 ${styles.cardBg} border-l border-b ${styles.border} transform rotate-45 md:block hidden rounded-bl-md`}></div>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className={`inline-block px-3 py-1 rounded-md text-xs font-mono font-bold ${styles.bg} ${styles.accent} border ${styles.border}`}>{block.data.date}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{block.data.title}</h3>
                  <p className={`${styles.muted} text-sm leading-relaxed whitespace-pre-wrap`}>{block.data.content}</p>
                  {block.data.urls && block.data.urls.length > 0 && (
                      <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                          {block.data.urls.map((url, i) => (
                              <img key={i} src={url} className="h-24 w-32 object-cover rounded-lg border border-slate-700/50 cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(url, '_blank')} />
                          ))}
                      </div>
                  )}
               </div>
            </div>
         );

      case 'table':
          return (
              <section key={block.id} className="max-w-6xl mx-auto px-4 mb-20">
                  {block.data.title && <h3 className="text-xl font-bold mb-6 px-2">{block.data.title}</h3>}
                  <div className={`overflow-hidden rounded-2xl border ${styles.border} ${styles.cardBg}`}>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className={`border-b ${styles.border} bg-black/20`}>
                                    {block.data.table_columns?.map((col, i) => (
                                        <th key={i} className={`p-5 font-bold ${styles.text} uppercase tracking-wider text-xs`}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${styles.border} divide-slate-800`}>
                                {block.data.table_rows?.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                                        {row.map((cell, cIdx) => (
                                            <td key={cIdx} className={`p-5 ${styles.muted} font-mono`}>{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                  </div>
              </section>
          );

      case 'text':
         return (
             <section key={block.id} className="max-w-4xl mx-auto px-4 mb-16">
                 {block.data.title && <h3 className="text-2xl font-bold mb-6">{block.data.title}</h3>}
                 <div className={`prose ${themeKey === 'tech_dark' ? 'prose-invert' : ''} max-w-none prose-lg leading-loose text-slate-300`}>
                     <p className="whitespace-pre-wrap">{block.data.content}</p>
                 </div>
             </section>
         );
      
      case 'image_grid':
         return (
             <section key={block.id} className="max-w-6xl mx-auto px-4 mb-20">
                 {block.data.title && <h3 className="text-xl font-bold mb-6 px-2">{block.data.title}</h3>}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {block.data.urls?.map((url, i) => (
                         <div key={i} className="aspect-square rounded-2xl overflow-hidden cursor-pointer group relative border border-slate-800">
                             <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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
    <div className={`min-h-screen ${styles.bg} ${styles.text} transition-colors duration-500 font-sans selection:bg-blue-500/30 pb-20`}>
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center backdrop-blur-xl border-b ${styles.border} bg-slate-950/80 supports-[backdrop-filter]:bg-slate-950/50`}>
         <div className="flex items-center gap-2">
             <Logo className={`h-8 w-auto ${themeKey === 'tech_dark' ? 'brightness-0 invert' : ''}`} />
         </div>
         <div className="text-[10px] font-mono opacity-50 uppercase tracking-widest border px-2 py-1 rounded border-slate-800">
             Student Portfolio
         </div>
      </nav>
      
      <div className="pt-10">
         {portfolio.content_blocks?.map(block => renderBlock(block))}
      </div>

      <footer className={`py-12 text-center text-xs ${styles.muted} border-t ${styles.border} mt-20`}>
          <p>© 2024 SparkMinds Lab. All rights reserved.</p>
          <p className="mt-2 opacity-50">Generated by SparkMinds Portfolio System</p>
      </footer>
    </div>
  );
};