import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { StudentPortfolio, ContentBlock, PortfolioTheme, SkillCategory, SkillItem, SkillsLayout } from '../types';
import { Logo } from '../components/Logo';
import { ImageCarousel } from '../components/ImageCarousel';
import * as Icons from 'lucide-react';
import html2canvas from 'html2canvas';

const AI_SETTINGS_KEY = 'SM_AI_CONFIG';

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

const LABELS = {
  zh: {
    skills: "技能矩阵",
    featured: "精选项目",
    situation: "背景 (Situation)",
    task: "任务 (Task)",
    action: "行动 (Action)",
    result: "结果 (Result)",
    loading: "数据加载中...",
    error: "无法访问档案",
    unlock: "解锁访问",
    passwordPlaceholder: "在此输入密码",
    passwordError: "密码错误",
    footerTitle: "SparkMinds 创智实验室",
    footerSubtitle: "青少年硬核科技创新教育",
    generating: "生成中...",
    saveImage: "保存长图",
    mobileMode: "手机模式",
    webMode: "网页模式",
    translateBtn: "English",
    translating: "AI翻译中..."
  },
  en: {
    skills: "Skills Matrix",
    featured: "Featured Project",
    situation: "Situation",
    task: "Task",
    action: "Action & Challenges",
    result: "Result",
    loading: "Loading data...",
    error: "Access Denied",
    unlock: "Unlock Access",
    passwordPlaceholder: "Enter Password",
    passwordError: "Incorrect Password",
    footerTitle: "SparkMinds Lab",
    footerSubtitle: "Hardcore Tech Education for Youth",
    generating: "Rendering...",
    saveImage: "Save Image",
    mobileMode: "Mobile View",
    webMode: "Web View",
    translateBtn: "中文",
    translating: "Translating..."
  }
};

export const StudentPortfolioPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [originalPortfolio, setOriginalPortfolio] = useState<StudentPortfolio | null>(null);
  const [translatedPortfolio, setTranslatedPortfolio] = useState<StudentPortfolio | null>(null);
  
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPortfolio();
  }, [slug]);

  const fetchPortfolio = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('student_portfolios').select('*').eq('slug', slug).single();
      if (error) throw error;
      
      // Legacy Data Migration Logic (Frontend Side)
      // Ensures old data format (flat list) works with new grouped structure
      if (data.skills && data.skills.length > 0 && 'category' in data.skills[0]) {
         const groups: Record<string, SkillItem[]> = {};
         data.skills.forEach((s: any) => {
            const cat = s.category || 'General';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push({ name: s.name, value: s.value, unit: s.unit });
         });
         
         // Use the old global layout config if available, otherwise default to bar
         const globalLayout = data.skills_config?.layout || 'bar';
         
         data.skills = Object.entries(groups).map(([name, items]) => ({
            name,
            layout: globalLayout,
            items
         }));
      }

      setOriginalPortfolio(data);
    } catch (err: any) {
      console.error(err);
      setError('未找到该学生的成长档案，请检查链接是否正确。');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (originalPortfolio && passwordInput === originalPortfolio.access_password) {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleTranslate = async () => {
    if (language === 'en') {
      setLanguage('zh');
      return;
    }

    if (translatedPortfolio) {
      setLanguage('en');
      return;
    }

    setIsTranslating(true);
    try {
      const aiConfigStr = localStorage.getItem(AI_SETTINGS_KEY);
      if (!aiConfigStr) throw new Error("AI未配置");
      const aiConfig = JSON.parse(aiConfigStr);

      if (!aiConfig.apiKey || !originalPortfolio) throw new Error("Missing config");

      // Prepare payload - only translate text fields
      const payload = {
        student_title: originalPortfolio.student_title,
        summary_bio: originalPortfolio.summary_bio,
        skills: originalPortfolio.skills, // Skills names might need translation
        content_blocks: originalPortfolio.content_blocks
      };

      const systemPrompt = `You are a professional translator. Translate the following Student Portfolio JSON content from Chinese to English. 
      Ensure that all value fields (title, content, descriptions, bio, skills) are translated into English. Do not leave Chinese characters in the output.
      Keep the JSON structure exactly the same. Only translate the values.
      Return ONLY the raw JSON.`;

      const response = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(payload) }
          ],
          temperature: 0.3
        })
      });

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Translation failed");
      
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const translatedData = JSON.parse(content);

      setTranslatedPortfolio({
        ...originalPortfolio,
        ...translatedData
      });
      setLanguage('en');

    } catch (err) {
      console.error(err);
      alert("AI 翻译服务不可用，仅切换界面语言。请在后台配置 AI Key。");
      setLanguage('en'); // Fallback to just label switch
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSnapshot = async () => {
    if (!contentRef.current) return;
    setIsSnapshotting(true);
    try {
      const theme = originalPortfolio?.theme_config?.theme || 'tech_dark';
      const bgColor = theme === 'tech_dark' ? '#020617' : '#f8fafc';
      
      // Force scroll to top to ensure clean capture
      window.scrollTo(0,0);
      await new Promise(r => setTimeout(r, 500)); // Wait for any layouts

      const canvas = await html2canvas(contentRef.current, {
        useCORS: true, 
        scale: 2, 
        backgroundColor: bgColor,
        ignoreElements: (element) => element.classList.contains('no-snapshot'),
        logging: false,
        windowWidth: isMobileMode ? 420 : document.body.scrollWidth, // Simulate mobile width context if needed
      });
      
      const link = document.createElement('a');
      link.download = `SparkMinds_${originalPortfolio?.student_name}_${isMobileMode ? 'Mobile' : 'Web'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) { alert('生成长图失败'); } finally { setIsSnapshotting(false); }
  };

  const currentPortfolio = language === 'en' && translatedPortfolio ? translatedPortfolio : originalPortfolio;
  const t = LABELS[language];

  // --- Components ---

  const BentoGrid = ({ images }: { images: string[] }) => {
    if (!images.length) return null;
    if (images.length === 1) return <div className="rounded-2xl overflow-hidden shadow-2xl aspect-video relative group"><img src={images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/></div>;
    if (images.length === 3) return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 aspect-[4/3] md:aspect-[2/1]"><div className="md:col-span-2 rounded-2xl overflow-hidden relative group"><img src={images[0]} className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-700"/></div><div className="grid grid-rows-2 gap-4"><div className="rounded-2xl overflow-hidden relative group"><img src={images[1]} className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-700"/></div><div className="rounded-2xl overflow-hidden relative group"><img src={images[2]} className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-700"/></div></div></div>
    );
    return <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{images.map((url, idx) => <div key={idx} className="rounded-2xl overflow-hidden aspect-square relative group shadow-lg"><img src={url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/></div>)}</div>;
  };

  // --- Charts Components ---

  // 1. Radar Chart (SVG Implementation)
  const RadarChart = ({ data, styles }: { data: { label: string, value: number }[], styles: any }) => {
    const size = 300;
    const center = size / 2;
    const radius = 100;
    const angleStep = (Math.PI * 2) / data.length;

    const points = data.map((d, i) => {
      const value = Math.min(Math.max(d.value, 0), 100);
      const r = (value / 100) * radius;
      const x = center + r * Math.sin(i * angleStep);
      const y = center - r * Math.cos(i * angleStep);
      return `${x},${y}`;
    }).join(' ');

    const axisLines = data.map((_, i) => {
      const x = center + radius * Math.sin(i * angleStep);
      const y = center - radius * Math.cos(i * angleStep);
      return <line key={i} x1={center} y1={center} x2={x} y2={y} className="stroke-slate-700/30" strokeWidth="1" />;
    });

    const labels = data.map((d, i) => {
      const x = center + (radius + 25) * Math.sin(i * angleStep);
      const y = center - (radius + 25) * Math.cos(i * angleStep);
      return (
        <text 
          key={i} x={x} y={y} 
          textAnchor="middle" 
          dominantBaseline="middle" 
          className={`text-[10px] font-bold fill-current opacity-80 ${styles.text}`}
        >
          {d.label}
        </text>
      );
    });

    // Background polygons (grids)
    const grids = [0.25, 0.5, 0.75, 1].map((scale, idx) => {
        const gridPoints = data.map((_, i) => {
            const r = radius * scale;
            const x = center + r * Math.sin(i * angleStep);
            const y = center - r * Math.cos(i * angleStep);
            return `${x},${y}`;
        }).join(' ');
        return <polygon key={idx} points={gridPoints} fill="none" className="stroke-slate-700/20" strokeWidth="1" />;
    });

    return (
      <div className="flex justify-center my-8">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {grids}
          {axisLines}
          <polygon points={points} className="fill-blue-500/20 stroke-blue-500" strokeWidth="2" />
          {labels}
        </svg>
      </div>
    );
  };

  // 2. Circular Gauge
  const CircularGauge = ({ skill, styles }: { skill: SkillItem, styles: any }) => {
    const size = 120;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(skill.value, 100) / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative flex items-center justify-center">
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-slate-700/20" />
                    <circle 
                        cx={size/2} cy={size/2} r={radius} 
                        stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={offset} 
                        strokeLinecap="round"
                        className="text-blue-500 transition-all duration-1000 ease-out" 
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className={`text-xl font-bold ${styles.text}`}>{skill.value}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{skill.unit || '%'}</span>
                </div>
            </div>
            <span className={`mt-3 font-medium text-sm ${styles.text}`}>{skill.name}</span>
        </div>
    );
  };

  // 3. Stat Card
  const StatCard = ({ skill, styles }: { skill: SkillItem, styles: any }) => (
      <div className={`${styles.cardBg} border ${styles.border} p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-sm h-full`}>
          <h4 className={`font-bold text-md mb-2 ${styles.text}`}>{skill.name}</h4>
          <div className="mt-auto pt-2 border-t border-slate-700/10 w-full">
             <span className={`text-2xl font-black text-blue-500`}>{skill.value}</span>
             <span className="text-xs text-slate-400 ml-1">{skill.unit}</span>
          </div>
      </div>
  );

  const SkillsMatrix = ({ skills, styles }: { skills: SkillCategory[], styles: any }) => {
     if (!skills || skills.length === 0) return null;

     return (
       <div className={`mb-20 animate-fade-in-up`}>
          <div className="flex items-center gap-4 mb-8">
             <div className="h-px flex-1 bg-gradient-to-r from-transparent to-blue-500/50"></div>
             <h3 className={`text-xl font-bold uppercase tracking-widest ${styles.text}`}>{t.skills}</h3>
             <div className="h-px flex-1 bg-gradient-to-l from-transparent to-blue-500/50"></div>
          </div>
          
          <div className="space-y-16">
             {skills.map((category, idx) => (
                <div key={idx} className="w-full">
                    {/* Category Header */}
                    <h4 className={`font-bold text-sm uppercase tracking-wider opacity-60 border-b border-dashed border-slate-700/50 pb-2 mb-8 ${styles.text} flex justify-between`}>
                        <span>{category.name}</span>
                        <span className="text-[10px] opacity-50">{category.layout} VIEW</span>
                    </h4>

                    {/* Visualization Switch */}
                    {category.layout === 'radar' && category.items.length >= 3 ? (
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <RadarChart data={category.items.map(i => ({ label: i.name, value: i.value }))} styles={styles} />
                            <div className="grid grid-cols-2 gap-4">
                                {category.items.map((skill, sIdx) => (
                                    <div key={sIdx} className={`flex justify-between items-center p-3 rounded-lg ${styles.cardBg} border ${styles.border}`}>
                                        <div className={`font-bold ${styles.text}`}>{skill.name}</div>
                                        <div className="font-mono text-blue-500 font-bold">{skill.value}{skill.unit}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : category.layout === 'circle' ? (
                        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                            {category.items.map((skill, sIdx) => <CircularGauge key={sIdx} skill={skill} styles={styles} />)}
                        </div>
                    ) : category.layout === 'stat_grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {category.items.map((skill, sIdx) => <StatCard key={sIdx} skill={skill} styles={styles} />)}
                        </div>
                    ) : (
                        // Default: Bar
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                            {category.items.map((skill, sIdx) => (
                                <div key={sIdx} className="group">
                                    <div className="flex justify-between mb-2 text-sm font-medium items-end">
                                        <span className={`${styles.text} group-hover:text-blue-400 transition-colors`}>{skill.name}</span>
                                        <span className="text-slate-500 font-mono text-xs">
                                            {skill.value}{skill.unit || ''}
                                        </span>
                                    </div>
                                    <div className={`w-full h-2 rounded-full ${styles.cardBg} overflow-hidden bg-opacity-30`}>
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-600 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: skill.unit === '%' || !skill.unit ? `${Math.min(skill.value, 100)}%` : '100%' }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
             ))}
          </div>
       </div>
     )
  };

  const TimelineNode = ({ block, styles }: { block: ContentBlock, styles: any }) => {
    const { date, title, content, urls } = block.data;
    const [activeVideos, setActiveVideos] = useState<Record<number, boolean>>({});

    const toggleVideo = (index: number) => {
        setActiveVideos(prev => ({...prev, [index]: !prev[index]}));
    };
    
    return (
      <div className="relative pl-8 md:pl-12 pb-16 last:pb-0 animate-fade-in-up group">
         <div className="absolute left-0 top-2 bottom-0 w-px bg-slate-800 group-last:bottom-auto group-last:h-full"></div>
         <div className="absolute left-[-4px] top-2 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] z-10"></div>
         
         <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
            <div className="md:w-32 flex-shrink-0">
               <span className={`inline-block py-1 px-3 rounded-full text-sm font-bold font-mono tracking-wider ${styles.accent} bg-blue-500/10 border border-blue-500/20`}>
                  {date}
               </span>
            </div>

            <div className={`flex-1 ${styles.cardBg} border ${styles.border} rounded-2xl p-6 hover:border-blue-500/30 transition-colors`}>
               {title && <h3 className={`text-xl font-bold mb-3 ${styles.text}`}>{title}</h3>}
               {content && <div className={`prose prose-sm ${styles.text === 'text-slate-200' ? 'prose-invert' : ''} max-w-none opacity-80 whitespace-pre-wrap mb-4`}>{content}</div>}
               
               {/* Media Grid: Direct Display */}
               {urls && urls.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                     {urls.map((url, i) => {
                        // Heuristic: If it contains HTML tag (iframe) or looks like a video link, treat as video. 
                        // Note: Our Admin upload ensures photos are proper Supabase URLs (http...)
                        // We check for '<' for iframe.
                        const isIframe = url.trim().startsWith('<');
                        
                        if (isIframe) {
                            return (
                                <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-black shadow-sm">
                                    {activeVideos[i] ? (
                                        <div className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0 animate-fade-in" dangerouslySetInnerHTML={{__html: url}} />
                                    ) : (
                                        <div 
                                            onClick={() => toggleVideo(i)}
                                            className="w-full h-full flex items-center justify-center cursor-pointer group/video"
                                        >
                                            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                                                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover/video:bg-white/20 transition-all group-hover/video:scale-110 border border-white/10">
                                                    <Icons.Play className="text-white fill-current translate-x-0.5" size={24} />
                                                </div>
                                                <span className="absolute bottom-3 right-3 text-[10px] font-bold text-white/50 tracking-widest bg-black/50 px-2 py-1 rounded">VIDEO</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        // Image: Direct Display (No Lightbox)
                        return (
                            <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-slate-700/50 shadow-sm bg-slate-900/50">
                                <img 
                                    src={url} 
                                    alt="Evidence" 
                                    loading="lazy"
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" 
                                />
                            </div>
                        );
                     })}
                  </div>
               )}
            </div>
         </div>
      </div>
    );
  };

  const ProjectHighlight = ({ block, styles }: { block: ContentBlock, styles: any }) => {
    const { title, date, star_situation, star_task, star_action, star_result, evidence_urls } = block.data;
    
    return (
      <div className={`mb-24 animate-fade-in-up`}>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-slate-800/50 pb-4">
             <div>
                {/* Removed 'Featured Project' label as requested */}
                <h3 className={`text-3xl md:text-4xl font-bold ${styles.text}`}>{title}</h3>
             </div>
             {date && <span className="text-slate-500 font-mono text-sm border border-slate-700 px-3 py-1 rounded-full">{date}</span>}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
             {/* S: Situation */}
             <div className={`p-6 rounded-2xl ${styles.cardBg} border ${styles.border} relative overflow-hidden group`}>
                <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl select-none group-hover:opacity-20 transition-opacity">S</div>
                <h4 className="text-blue-400 font-bold mb-2 uppercase text-sm">{t.situation}</h4>
                <p className={`${styles.text} opacity-90`}>{star_situation}</p>
             </div>

             {/* T: Task */}
             <div className={`p-6 rounded-2xl ${styles.cardBg} border ${styles.border} relative overflow-hidden group`}>
                <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl select-none group-hover:opacity-20 transition-opacity">T</div>
                <h4 className="text-purple-400 font-bold mb-2 uppercase text-sm">{t.task}</h4>
                <p className={`${styles.text} opacity-90`}>{star_task}</p>
             </div>

             {/* A: Action */}
             <div className={`p-6 rounded-2xl ${styles.cardBg} border ${styles.border} relative overflow-hidden group`}>
                 <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl select-none group-hover:opacity-20 transition-opacity">A</div>
                 <h4 className="text-orange-400 font-bold mb-2 uppercase text-sm">{t.action}</h4>
                 <p className={`${styles.text} opacity-90 whitespace-pre-wrap leading-relaxed`}>{star_action}</p>
             </div>

             {/* R: Result */}
             <div className={`p-6 rounded-2xl ${styles.cardBg} border ${styles.border} relative overflow-hidden group`}>
                 <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl select-none group-hover:opacity-20 transition-opacity">R</div>
                 <h4 className="text-green-400 font-bold mb-2 uppercase text-sm">{t.result}</h4>
                 <p className={`${styles.text} opacity-90`}>{star_result}</p>
             </div>
          </div>

          {/* Evidence */}
          {evidence_urls && evidence_urls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {(evidence_urls).map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-700/50 group shadow-lg">
                       <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                 ))}
              </div>
          )}
      </div>
    );
  };

  const renderBlock = (block: ContentBlock, styles: any) => {
    switch (block.type) {
      case 'timeline_node':
      case 'header': // Support legacy header as timeline node if it has date
         return <TimelineNode key={block.id} block={block} styles={styles} />;
      case 'text':
        return (
          <div key={block.id} className={`mb-16 p-8 rounded-3xl ${styles.cardBg} border ${styles.border} backdrop-blur-sm animate-fade-in-up`}>
             {block.data.title && <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${styles.text}`}><Icons.Terminal className="w-5 h-5 opacity-50" />{block.data.title}</h3>}
             <div className={`prose prose-lg ${styles.text === 'text-slate-200' ? 'prose-invert' : ''} max-w-none opacity-90 whitespace-pre-wrap`}>{block.data.content}</div>
          </div>
        );
      case 'image_grid':
        return (
          <div key={block.id} className="mb-16 animate-fade-in-up">
             {block.data.title && <h3 className={`text-xl font-bold mb-6 px-2 ${styles.text}`}>{block.data.title}</h3>}
             <BentoGrid images={block.data.urls || []} />
             {block.data.content && <p className={`text-center text-sm mt-4 opacity-60 italic ${styles.text}`}>{block.data.content}</p>}
          </div>
        );
      case 'section_heading':
         return (
           <div key={block.id} className="flex items-center gap-4 mb-12 mt-16 animate-fade-in-up">
             <div className="h-px flex-1 bg-gradient-to-r from-transparent to-blue-500/50"></div>
             <h3 className={`text-2xl font-bold uppercase tracking-widest ${styles.text}`}>{block.data.title}</h3>
             <div className="h-px flex-1 bg-gradient-to-l from-transparent to-blue-500/50"></div>
           </div>
         );
      case 'video':
         const videoUrl = block.data.urls?.[0];
         if (!videoUrl) return null;
         return (
            <div key={block.id} className="mb-16 animate-fade-in-up">
               {block.data.title && <h3 className={`text-xl font-bold mb-6 px-2 ${styles.text}`}>{block.data.title}</h3>}
               <div className={`aspect-video rounded-3xl overflow-hidden shadow-2xl ${styles.border} border-4`}>
                  {videoUrl.startsWith('<iframe') ? <div className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0" dangerouslySetInnerHTML={{__html: videoUrl}} /> : <video controls className="w-full h-full bg-black" src={videoUrl} />}
               </div>
               {block.data.content && <p className={`text-sm mt-4 opacity-60 ${styles.text}`}>{block.data.content}</p>}
            </div>
         );
      case 'project_highlight':
         return <ProjectHighlight key={block.id} block={block} styles={styles} />;
      default: return null;
    }
  };

  // ... (Rest of the component remains the same: loading, error, auth, footer render)
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Icons.Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  if (error || !originalPortfolio) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4"><div className="text-slate-300 mb-4"><Icons.FileQuestion size={64} /></div><h1 className="text-2xl font-bold text-slate-800 mb-2">无法访问档案</h1><p className="text-slate-500">{error}</p><a href="/" className="mt-8 text-blue-600 hover:underline">返回首页</a></div>;
  if (!isAuthenticated) return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden"><div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[100px]"></div><div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[100px]"></div></div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md relative z-10">
          <div className="flex justify-center mb-8"><div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3"><Icons.Lock size={32} className="text-white" /></div></div>
          <h2 className="text-2xl font-bold text-center text-white mb-2">{LABELS['zh'].error}</h2>
          <p className="text-center text-slate-400 text-sm mb-8">请输入访问密码以查看 {originalPortfolio.student_name} 的作品集</p>
          <form onSubmit={handleLogin} className="space-y-4"><div><input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder={LABELS['zh'].passwordPlaceholder} className={`w-full px-4 py-4 text-center text-xl tracking-[0.5em] bg-slate-950 border rounded-xl focus:ring-2 outline-none transition-all text-white placeholder-slate-600 ${authError ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-700 focus:ring-blue-500/50 focus:border-blue-500'}`} autoFocus />{authError && <p className="text-red-400 text-xs text-center mt-2 font-medium">{LABELS['zh'].passwordError}</p>}</div><button type="submit" className="w-full bg-white text-slate-950 hover:bg-blue-50 font-bold py-4 rounded-xl transition-all shadow-lg mt-2">{LABELS['zh'].unlock}</button></form>
          <div className="mt-8 pt-6 border-t border-slate-800 flex justify-center opacity-50"><Logo className="h-6 w-auto brightness-200 grayscale contrast-0" /></div>
        </div>
      </div>
  );

  const themeName = currentPortfolio?.theme_config?.theme || 'tech_dark';
  const styles = THEMES[themeName];

  return (
    <div className={`min-h-screen ${styles.bg} ${styles.text} ${styles.font} selection:bg-blue-500/30 selection:text-white`}>
      <div ref={contentRef} className={`${styles.bg} min-h-screen relative pb-32 transition-all duration-500 ease-in-out ${isMobileMode ? 'max-w-[390px] mx-auto border-x border-slate-800 shadow-2xl my-8 overflow-hidden rounded-3xl' : 'w-full'}`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className={`absolute top-0 right-0 w-[800px] h-[800px] ${styles.blobColor1} rounded-full mix-blend-screen filter blur-[120px] opacity-10 translate-x-1/3 -translate-y-1/3`}></div>
           <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] ${styles.blobColor2} rounded-full mix-blend-screen filter blur-[100px] opacity-10 -translate-x-1/3 translate-y-1/3`}></div>
        </div>

        <header className="relative w-full h-[60vh] md:h-[70vh] flex items-end">
           {currentPortfolio?.hero_image_url ? (
             <div className="absolute inset-0 z-0">
               <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${currentPortfolio.hero_image_url})` }} />
               <div className={`absolute inset-0 bg-gradient-to-t ${themeName === 'tech_dark' ? 'from-slate-950 via-slate-950/50' : 'from-slate-50 via-slate-50/50'} to-transparent z-10`}></div>
             </div>
           ) : null}
           <div className="relative z-20 px-6 md:px-12 max-w-6xl mx-auto w-full pb-12">
              <div className="flex flex-col md:flex-row md:items-end gap-8">
                  <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full ${styles.cardBg} border-4 ${styles.border} flex items-center justify-center text-5xl font-bold shadow-2xl overflow-hidden relative backdrop-blur-md shrink-0`}>
                      {currentPortfolio?.avatar_url ? <img src={currentPortfolio.avatar_url} className="w-full h-full object-cover" /> : currentPortfolio?.student_name[0]}
                  </div>
                  <div className="flex-1 mb-2">
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 ${styles.cardBg} ${styles.accent} border ${styles.border}`}>SparkMinds Portfolio</div>
                      {/* Swapped Hierarchy: Name smaller, Title larger */}
                      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 opacity-80">{currentPortfolio?.student_name}</h1>
                      <p className={`text-4xl md:text-6xl font-extrabold leading-tight ${styles.font} max-w-4xl mb-6 drop-shadow-sm`}>{currentPortfolio?.student_title || 'Future Innovator & Builder'}</p>
                      {/* Expanded Bio Width and Added whitespace-pre-wrap */}
                      {currentPortfolio?.summary_bio && (
                        <div className="mt-4 text-sm md:text-base opacity-80 max-w-4xl leading-relaxed whitespace-pre-wrap">
                            {currentPortfolio.summary_bio}
                        </div>
                      )}
                  </div>
              </div>
           </div>
        </header>

        <main className="px-6 md:px-12 max-w-5xl mx-auto relative z-10 pt-12">
           {currentPortfolio?.skills && currentPortfolio.skills.length > 0 && <SkillsMatrix skills={currentPortfolio.skills as any} styles={styles} />}
           {currentPortfolio?.content_blocks && currentPortfolio.content_blocks.length > 0 ? (
             <div className="flex flex-col gap-0">
                {currentPortfolio.content_blocks.map(block => renderBlock(block, styles))}
             </div>
           ) : (
             <div className="text-center py-32 opacity-30"><p className="text-xl">Waiting for data signal...</p></div>
           )}
           <div className={`mt-32 pt-12 border-t ${styles.border} text-center opacity-60`}>
              <div className="flex justify-center mb-6"><div className={`w-16 h-16 ${styles.cardBg} rounded-2xl flex items-center justify-center`}><Icons.QrCode size={32} /></div></div>
              <p className="font-bold text-lg mb-1">{t.footerTitle}</p>
              <p className="text-sm">{t.footerSubtitle}</p>
              <p className="text-xs mt-4 font-mono">sparkminds.cn</p>
           </div>
        </main>
      </div>

      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4 no-snapshot items-end">
         <button onClick={handleTranslate} disabled={isTranslating} className={`${styles.button} h-12 px-6 rounded-full shadow-xl flex items-center gap-2 font-bold backdrop-blur-md bg-opacity-90 transition-all hover:scale-105 active:scale-95`}>{isTranslating ? <Icons.Loader2 className="animate-spin w-4 h-4" /> : <Icons.Languages className="w-4 h-4" />}{isTranslating ? t.translating : t.translateBtn}</button>
         <button onClick={() => setIsMobileMode(!isMobileMode)} className={`${isMobileMode ? 'bg-white text-slate-900' : 'bg-slate-800 text-white'} h-12 px-6 rounded-full shadow-xl flex items-center gap-2 font-bold transition-all hover:scale-105 active:scale-95 border border-slate-700`}>{isMobileMode ? <Icons.Monitor className="w-4 h-4" /> : <Icons.Smartphone className="w-4 h-4" />}{isMobileMode ? t.webMode : t.mobileMode}</button>
         <button onClick={handleSnapshot} disabled={isSnapshotting} className={`${styles.button} w-14 h-14 rounded-full shadow-2xl flex items-center justify-center group relative hover:scale-110 transition-transform`} title={t.saveImage}>{isSnapshotting ? <Icons.Loader2 className="animate-spin" /> : <Icons.Download />}</button>
      </div>

      {isSnapshotting && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center text-white no-snapshot backdrop-blur-md">
          <div className="relative"><div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div><div className="absolute inset-0 flex items-center justify-center"><Icons.Aperture size={24} className="text-blue-500 animate-pulse" /></div></div>
          <p className="text-xl font-bold mt-8 tracking-widest uppercase">{t.generating}</p>
        </div>
      )}
    </div>
  );
};