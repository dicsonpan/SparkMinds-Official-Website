import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { StudentPortfolio, ContentBlock, SkillCategory } from '../types';
import * as Icons from 'lucide-react';

// Helper for theme styles
const getThemeStyles = (theme: string) => {
  switch (theme) {
    case 'academic_light':
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-800',
        cardBg: 'bg-white',
        border: 'border-slate-200',
        accent: 'text-blue-600',
        primary: 'bg-blue-600'
      };
    case 'creative_color':
      return {
        bg: 'bg-yellow-50',
        text: 'text-slate-900',
        cardBg: 'bg-white',
        border: 'border-orange-100',
        accent: 'text-orange-500',
        primary: 'bg-orange-500'
      };
    case 'tech_dark':
    default:
      return {
        bg: 'bg-slate-900',
        text: 'text-slate-100',
        cardBg: 'bg-slate-800',
        border: 'border-slate-700',
        accent: 'text-blue-400',
        primary: 'bg-blue-500'
      };
  }
};

const t = {
  situation: "Situation 背景",
  task: "Task 任务",
  action: "Action 行动",
  result: "Result 结果"
};

const ProjectHighlight = ({ block, styles }: { block: ContentBlock, styles: any }) => {
  const { title, date, star_situation, star_task, star_action, star_result, evidence_urls } = block.data;
  
  return (
    <div className={`mb-24 animate-fade-in-up`}>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-slate-800/50 pb-4">
           <div>
              <h3 className={`text-3xl md:text-4xl font-bold ${styles.text}`}>{title}</h3>
           </div>
           {date && <span className="text-slate-500 font-mono text-sm border border-slate-700 px-3 py-1 rounded-full">{date}</span>}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
           {/* S: Situation */}
           <div className={`p-6 rounded-2xl ${styles.cardBg} border ${styles.border} relative overflow-hidden group`}>
              <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl select-none group-hover:opacity-20 transition-opacity">S</div>
              <h4 className="text-blue-400 font-bold mb-2 uppercase text-sm">{t.situation}</h4>
              <p className={`${styles.text} opacity-90 whitespace-pre-wrap leading-relaxed`}>{star_situation}</p>
           </div>

           {/* T: Task */}
           <div className={`p-6 rounded-2xl ${styles.cardBg} border ${styles.border} relative overflow-hidden group`}>
              <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl select-none group-hover:opacity-20 transition-opacity">T</div>
              <h4 className="text-purple-400 font-bold mb-2 uppercase text-sm">{t.task}</h4>
              <p className={`${styles.text} opacity-90 whitespace-pre-wrap leading-relaxed`}>{star_task}</p>
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
               <p className={`${styles.text} opacity-90 whitespace-pre-wrap leading-relaxed`}>{star_result}</p>
           </div>
        </div>

        {/* Evidence */}
        {evidence_urls && evidence_urls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {(evidence_urls).map((url: string, i: number) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-700/50 group shadow-lg">
                     <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
               ))}
            </div>
        )}
    </div>
  );
};

export const StudentPortfolioPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [student, setStudent] = useState<StudentPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudent = async () => {
      if (!slug) return;
      const { data, error } = await supabase
        .from('student_portfolios')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching student:', error);
        setError('找不到该学生档案');
      } else {
        setStudent(data);
        if (!data.access_password) setIsAuthenticated(true);
      }
      setLoading(false);
    };

    fetchStudent();
  }, [slug]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (student && student.access_password === passwordInput) {
      setIsAuthenticated(true);
    } else {
      alert('密码错误');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">加载中...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">{error}</div>;
  if (!student) return null;

  const styles = getThemeStyles(student.theme_config?.theme || 'tech_dark');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="bg-slate-800 p-8 rounded-2xl max-w-md w-full border border-slate-700">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Icons.Lock className="text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">访问受限</h2>
            <p className="text-slate-400 text-sm mt-2">请输入访问密码查看 {student.student_name} 的成长档案</p>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none mb-4"
              placeholder="输入密码"
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors">
              解锁档案
            </button>
          </form>
        </div>
      </div>
    );
  }

  const TimelineNode = ({ block }: { block: ContentBlock }) => (
    <div className="relative pl-8 md:pl-0 md:grid md:grid-cols-12 gap-8 mb-12 group">
       <div className={`absolute left-0 top-0 bottom-0 w-px ${styles.border} md:left-auto md:right-0 md:col-start-4 md:-ml-px`}></div>
       <div className={`absolute left-[-4px] top-6 w-2 h-2 rounded-full ${styles.primary} md:left-auto md:right-[-4px] md:col-start-4`}></div>
       
       <div className="md:col-span-4 md:text-right md:pr-12 mb-2 md:mb-0 pt-4">
          <span className={`inline-block font-mono text-sm opacity-60 ${styles.text}`}>{block.data.date}</span>
       </div>
       
       <div className="md:col-span-8 pl-6 md:pl-12 pt-3">
          <h3 className={`text-xl font-bold mb-3 ${styles.text}`}>{block.data.title}</h3>
          <p className={`${styles.text} opacity-80 leading-relaxed mb-4 whitespace-pre-wrap`}>
            {block.data.content}
          </p>
          {block.data.urls && block.data.urls.length > 0 && (
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
               {block.data.urls.map((url, i) => (
                 <div key={i} className="rounded-lg overflow-hidden h-32 bg-black border border-white/10 relative group">
                    {url.includes('<iframe') ? (
                       <div className="w-full h-full flex items-center justify-center text-white/50"><Icons.Play size={24} /></div>
                    ) : (
                       <img src={url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    )}
                 </div>
               ))}
             </div>
          )}
       </div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans ${styles.bg} ${styles.text}`}>
       <header className="relative h-[60vh] md:h-[70vh] flex items-end">
          <div className="absolute inset-0">
             {student.hero_image_url ? (
               <img src={student.hero_image_url} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full bg-gradient-to-br from-slate-900 to-blue-900"></div>
             )}
             <div className={`absolute inset-0 bg-gradient-to-t ${student.theme_config?.theme === 'academic_light' ? 'from-slate-50 via-slate-50/80 to-transparent' : 'from-slate-900 via-slate-900/80 to-transparent'}`}></div>
          </div>
          
          <div className="container mx-auto px-6 pb-12 relative z-10 flex flex-col md:flex-row items-end gap-8">
             <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white/20 shadow-2xl overflow-hidden bg-slate-200 shrink-0">
               {student.avatar_url ? (
                 <img src={student.avatar_url} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-400 bg-slate-800">{student.student_name[0]}</div>
               )}
             </div>
             <div className="mb-4">
                <div className={`inline-block px-3 py-1 rounded-full border ${styles.border} text-xs font-bold tracking-widest uppercase mb-3 opacity-80`}>
                  Student Portfolio
                </div>
                <h1 className="text-4xl md:text-6xl font-black mb-2">{student.student_name}</h1>
                <p className="text-xl opacity-80 font-light max-w-2xl">{student.student_title || 'SparkMinds Innovator'}</p>
                {student.summary_bio && (
                  <p className="mt-4 opacity-70 max-w-xl leading-relaxed text-sm md:text-base">{student.summary_bio}</p>
                )}
             </div>
          </div>
       </header>

       <main className="container mx-auto px-6 py-20">
          {student.skills && student.skills.length > 0 && (
             <section className="mb-24">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {student.skills.map((cat: SkillCategory, i: number) => (
                      <div key={i} className={`p-6 rounded-2xl ${styles.cardBg} border ${styles.border}`}>
                         <h3 className="font-bold mb-6 flex items-center gap-2">
                           <Icons.Cpu size={18} className={styles.accent} />
                           {cat.name}
                         </h3>
                         <div className="space-y-4">
                            {cat.items.map((skill, j) => (
                               <div key={j}>
                                  <div className="flex justify-between text-sm mb-1">
                                     <span className="opacity-80">{skill.name}</span>
                                     <span className="font-mono font-bold">{skill.value}{skill.unit}</span>
                                  </div>
                                  <div className={`h-2 rounded-full ${styles.bg === 'bg-slate-900' ? 'bg-slate-700' : 'bg-slate-200'} overflow-hidden`}>
                                     <div className={`h-full ${styles.primary}`} style={{width: `${Math.min(100, Math.max(0, skill.value))}%`}}></div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   ))}
                </div>
             </section>
          )}

          <div className="max-w-4xl mx-auto">
             {student.content_blocks?.map((block) => {
                switch (block.type) {
                   case 'project_highlight':
                      return <ProjectHighlight key={block.id} block={block} styles={styles} />;
                   case 'timeline_node':
                      return <TimelineNode key={block.id} block={block} />;
                   case 'section_heading':
                      return (
                        <div key={block.id} className="text-center py-12 mb-8">
                           <h2 className="text-3xl font-bold">{block.data.title}</h2>
                           <div className={`w-20 h-1 ${styles.primary} mx-auto mt-4 rounded-full`}></div>
                        </div>
                      );
                   case 'text':
                      return (
                        <div key={block.id} className="mb-12 prose prose-lg max-w-none dark:prose-invert">
                           {block.data.title && <h3>{block.data.title}</h3>}
                           <p className="whitespace-pre-wrap opacity-90">{block.data.content}</p>
                        </div>
                      );
                   case 'image_grid':
                      return (
                         <div key={block.id} className="mb-12">
                            {block.data.title && <h3 className="text-2xl font-bold mb-6">{block.data.title}</h3>}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {block.data.urls?.map((url, k) => (
                                  <div key={k} className="rounded-xl overflow-hidden shadow-lg">
                                     <img src={url} className="w-full h-auto" />
                                  </div>
                               ))}
                            </div>
                         </div>
                      );
                   default:
                      return null;
                }
             })}
          </div>
       </main>
    </div>
  );
};