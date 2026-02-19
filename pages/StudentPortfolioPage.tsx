import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import * as Icons from 'lucide-react';
import { PortfolioPDF } from '../components/PortfolioPDF';
import { Logo } from '../components/Logo';
import { supabase } from '../lib/supabaseClient';
import { ContentBlock, PortfolioTheme, SkillItem, StudentPortfolio } from '../types';

interface PortfolioThemeStyles {
  bg: string;
  text: string;
  muted: string;
  accent: string;
  cardBg: string;
  cardSubtle: string;
  border: string;
  fontBody: string;
  fontHeading: string;
  button: string;
  input: string;
  navBg: string;
  navBadge: string;
  navLogo: string;
  selection: string;
  barTrack: string;
  barFill: string;
  barGlow: string;
  radarPolygon: string;
  radarGrid: string;
  statBg: string;
  sectionCardHover: string;
  timelineLine: string;
  timelineDotRing: string;
  timelineMediaBorder: string;
  timelineCardHover: string;
  tableHeader: string;
  tableBodyDivider: string;
  tableRowHover: string;
  prose: string;
  imageGridOverlay: string;
  projectBadge: string;
  projectTitle: string;
  projectCard: string;
  projectLetter: string;
  projectLabel: string;
  projectText: string;
  projectDivider: string;
  evidenceCard: string;
  evidenceHoverMask: string;
  accentBadge: string;
  ambienceClass: string;
  patternClass: string;
  orbA: string;
  orbB: string;
}

const THEMES: Record<PortfolioTheme, PortfolioThemeStyles> = {
  tech_dark: {
    bg: 'bg-slate-950',
    text: 'text-slate-100',
    muted: 'text-slate-400',
    accent: 'text-cyan-300',
    cardBg: 'bg-slate-900/75 backdrop-blur-xl',
    cardSubtle: 'bg-slate-900/60',
    border: 'border-cyan-400/20',
    fontBody: 'font-portfolioSans',
    fontHeading: 'font-portfolioTech tracking-tight',
    button: 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-[0_16px_30px_-18px_rgba(34,211,238,0.95)]',
    input: 'border-cyan-400/30 focus:ring-cyan-300 text-slate-100 bg-slate-950/80 placeholder:text-slate-500',
    navBg: 'bg-slate-950/75 supports-[backdrop-filter]:bg-slate-950/45',
    navBadge: 'border-cyan-400/25 text-cyan-200/70 bg-cyan-500/5',
    navLogo: 'brightness-0 invert',
    selection: 'selection:bg-cyan-400/30',
    barTrack: 'bg-slate-800',
    barFill: 'bg-gradient-to-r from-cyan-400 to-sky-500',
    barGlow: 'shadow-[0_0_15px_rgba(56,189,248,0.45)]',
    radarPolygon: 'fill-cyan-300/20 stroke-cyan-300',
    radarGrid: 'stroke-cyan-100/40',
    statBg: 'bg-slate-950/55',
    sectionCardHover: 'hover:border-cyan-300/45 hover:-translate-y-0.5',
    timelineLine: 'bg-cyan-900/60',
    timelineDotRing: 'ring-slate-950/85',
    timelineMediaBorder: 'border-cyan-400/30',
    timelineCardHover: 'hover:border-cyan-300/45',
    tableHeader: 'bg-cyan-500/10',
    tableBodyDivider: 'divide-cyan-500/10',
    tableRowHover: 'hover:bg-cyan-500/5',
    prose: 'prose prose-sm sm:prose-base md:prose-lg prose-invert prose-slate max-w-none leading-loose prose-p:text-slate-300 prose-headings:text-slate-100',
    imageGridOverlay: 'group-hover:bg-cyan-500/10',
    projectBadge: 'bg-cyan-500/12 text-cyan-200 border border-cyan-300/25',
    projectTitle: 'text-slate-100',
    projectCard: 'border-cyan-300/20 bg-slate-900/65 hover:border-cyan-200/45',
    projectLetter: 'text-cyan-300/10 group-hover:text-cyan-200/20',
    projectLabel: 'text-cyan-200',
    projectText: 'text-slate-300',
    projectDivider: 'border-cyan-400/20',
    evidenceCard: 'border-cyan-300/20 bg-slate-900/65',
    evidenceHoverMask: 'group-hover:bg-cyan-300/10',
    accentBadge: 'bg-cyan-500/10 text-cyan-200 border border-cyan-300/25',
    ambienceClass: 'portfolio-backdrop-tech',
    patternClass: 'portfolio-pattern-tech',
    orbA: '-top-28 -left-16 h-80 w-80 bg-cyan-400/30',
    orbB: 'top-[26%] -right-24 h-[26rem] w-[26rem] bg-blue-500/25',
  },
  academic_light: {
    bg: 'bg-[#f4f1ea]',
    text: 'text-slate-800',
    muted: 'text-stone-500',
    accent: 'text-indigo-700',
    cardBg: 'bg-white/85 backdrop-blur-md',
    cardSubtle: 'bg-stone-100/70',
    border: 'border-stone-300/80',
    fontBody: 'font-portfolioSans',
    fontHeading: 'font-portfolioAcademic tracking-tight',
    button: 'bg-indigo-700 hover:bg-indigo-600 text-white shadow-[0_15px_28px_-18px_rgba(67,56,202,0.8)]',
    input: 'border-stone-300 focus:ring-indigo-300 text-slate-800 bg-white placeholder:text-stone-400',
    navBg: 'bg-[#f8f5ef]/85 supports-[backdrop-filter]:bg-[#f8f5ef]/70',
    navBadge: 'border-stone-300 text-stone-500 bg-white/80',
    navLogo: '',
    selection: 'selection:bg-indigo-200/60',
    barTrack: 'bg-stone-200',
    barFill: 'bg-gradient-to-r from-indigo-700 to-slate-700',
    barGlow: 'shadow-[0_0_12px_rgba(79,70,229,0.25)]',
    radarPolygon: 'fill-indigo-700/15 stroke-indigo-700',
    radarGrid: 'stroke-stone-400',
    statBg: 'bg-white/75',
    sectionCardHover: 'hover:border-indigo-300/60 hover:shadow-lg hover:shadow-indigo-100/50',
    timelineLine: 'bg-stone-300/80',
    timelineDotRing: 'ring-[#f4f1ea]',
    timelineMediaBorder: 'border-stone-300',
    timelineCardHover: 'hover:border-indigo-300/60',
    tableHeader: 'bg-stone-100/85',
    tableBodyDivider: 'divide-stone-200',
    tableRowHover: 'hover:bg-indigo-50/60',
    prose: 'prose prose-sm sm:prose-base md:prose-lg max-w-none leading-loose prose-p:text-stone-700 prose-headings:text-slate-800',
    imageGridOverlay: 'group-hover:bg-indigo-100/25',
    projectBadge: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    projectTitle: 'text-slate-800',
    projectCard: 'border-stone-300 bg-white/90 hover:border-indigo-300/60',
    projectLetter: 'text-indigo-200/30 group-hover:text-indigo-300/40',
    projectLabel: 'text-indigo-700',
    projectText: 'text-stone-700',
    projectDivider: 'border-stone-300/80',
    evidenceCard: 'border-stone-300 bg-white/90',
    evidenceHoverMask: 'group-hover:bg-indigo-100/25',
    accentBadge: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    ambienceClass: 'portfolio-backdrop-academic',
    patternClass: 'portfolio-pattern-academic',
    orbA: 'top-8 -left-20 h-72 w-72 bg-amber-300/25',
    orbB: 'top-[34%] -right-24 h-[24rem] w-[24rem] bg-indigo-200/25',
  },
  creative_color: {
    bg: 'bg-[#fff7e8]',
    text: 'text-slate-900',
    muted: 'text-amber-900/70',
    accent: 'text-teal-700',
    cardBg: 'bg-white/75 backdrop-blur-md',
    cardSubtle: 'bg-orange-50/70',
    border: 'border-orange-300/60',
    fontBody: 'font-portfolioSans',
    fontHeading: 'font-portfolioCreative tracking-tight',
    button: 'bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-400 hover:to-cyan-500 text-white shadow-[0_16px_32px_-18px_rgba(13,148,136,0.85)]',
    input: 'border-orange-300 focus:ring-orange-300 text-slate-800 bg-white placeholder:text-orange-400',
    navBg: 'bg-[#fff8ee]/85 supports-[backdrop-filter]:bg-[#fff8ee]/70',
    navBadge: 'border-orange-300/70 text-orange-700 bg-white/75',
    navLogo: '',
    selection: 'selection:bg-orange-300/45',
    barTrack: 'bg-orange-200/70',
    barFill: 'bg-gradient-to-r from-orange-500 via-rose-500 to-teal-500',
    barGlow: 'shadow-[0_0_14px_rgba(249,115,22,0.35)]',
    radarPolygon: 'fill-teal-500/18 stroke-teal-600',
    radarGrid: 'stroke-orange-300',
    statBg: 'bg-white/75',
    sectionCardHover: 'hover:border-teal-400/60 hover:shadow-lg hover:shadow-orange-200/60',
    timelineLine: 'bg-orange-300/80',
    timelineDotRing: 'ring-[#fff7e8]',
    timelineMediaBorder: 'border-orange-300/70',
    timelineCardHover: 'hover:border-teal-400/60',
    tableHeader: 'bg-orange-100/80',
    tableBodyDivider: 'divide-orange-200/70',
    tableRowHover: 'hover:bg-orange-50/70',
    prose: 'prose prose-sm sm:prose-base md:prose-lg max-w-none leading-loose prose-p:text-amber-900/80 prose-headings:text-slate-900',
    imageGridOverlay: 'group-hover:bg-orange-300/20',
    projectBadge: 'bg-orange-100 text-orange-700 border border-orange-300/70',
    projectTitle: 'text-slate-900',
    projectCard: 'border-orange-300/70 bg-white/90 hover:border-teal-400/60',
    projectLetter: 'text-orange-300/35 group-hover:text-teal-300/40',
    projectLabel: 'text-teal-700',
    projectText: 'text-amber-900/80',
    projectDivider: 'border-orange-300/80',
    evidenceCard: 'border-orange-300/70 bg-white/85',
    evidenceHoverMask: 'group-hover:bg-orange-300/15',
    accentBadge: 'bg-teal-50 text-teal-700 border border-teal-200',
    ambienceClass: 'portfolio-backdrop-creative',
    patternClass: 'portfolio-pattern-creative',
    orbA: '-top-24 -left-16 h-80 w-80 bg-orange-300/35',
    orbB: 'top-[30%] -right-20 h-[25rem] w-[25rem] bg-teal-300/30',
  },
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

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

      const { data, error: fetchError } = await supabase
        .from('student_portfolios')
        .select('*')
        .eq('slug', slug)
        .single();

      if (fetchError) {
        console.error('Error fetching portfolio:', fetchError);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        <Icons.Loader2 className="animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-500">
        未找到该学生的档案
      </div>
    );
  }

  const themeKey: PortfolioTheme = portfolio.theme_config?.theme || 'tech_dark';
  const styles = THEMES[themeKey] || THEMES.tech_dark;

  const renderAmbientLayers = () => (
    <>
      <div className={`portfolio-layer ${styles.ambienceClass}`} />
      <div className={`portfolio-layer ${styles.patternClass}`} />
      <div className={`portfolio-orb ${styles.orbA}`} />
      <div className={`portfolio-orb portfolio-orb--slow ${styles.orbB}`} />
    </>
  );

  if (!isAuthenticated) {
    return (
      <div className={`portfolio-theme min-h-screen ${styles.bg} ${styles.text} ${styles.fontBody}`}>
        {renderAmbientLayers()}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 sm:p-8 rounded-3xl ${styles.cardBg} border ${styles.border} shadow-2xl text-center`}>
            <div className="mb-6 flex justify-center">
              <div className={`w-20 h-20 rounded-full ${styles.cardSubtle} flex items-center justify-center overflow-hidden border-4 ${styles.border} shadow-lg`}>
                {portfolio.avatar_url ? (
                  <img src={portfolio.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <Icons.Lock className={styles.muted} size={32} />
                )}
              </div>
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${styles.fontHeading}`}>{portfolio.student_name}</h2>
            <p className={`text-sm mb-6 ${styles.muted}`}>此档案受密码保护</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-colors ${styles.input}`}
                placeholder="输入访问密码"
                autoFocus
              />
              {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
              <button type="submit" className={`w-full py-3 rounded-xl font-bold transition-all active:scale-[0.99] ${styles.button}`}>
                解锁档案
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const renderBarSkill = (skill: SkillItem, idx: number) => (
    <div key={idx}>
      <div className="flex justify-between text-sm mb-1.5 font-medium">
        <span>{skill.name}</span>
        <span className={styles.accent}>
          {skill.value}
          {skill.unit || '%'}
        </span>
      </div>
      <div className={`h-2.5 w-full rounded-full ${styles.barTrack} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${styles.barFill} ${styles.barGlow} transition-all duration-1000 ease-out`}
          style={{ width: `${clampPercent(skill.value)}%` }}
        />
      </div>
    </div>
  );

  const renderCircleSkill = (skill: SkillItem, idx: number) => {
    const r = 36;
    const c = 2 * Math.PI * r;
    const offset = c - (clampPercent(skill.value) / 100) * c;

    return (
      <div key={idx} className="flex flex-col items-center justify-center p-2">
        <div className="relative w-24 h-24 mb-2">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r={r}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className={`${styles.muted} opacity-20`}
            />
            <circle
              cx="48"
              cy="48"
              r={r}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={c}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={`${styles.accent} transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-bold text-sm">
            {skill.value}
            {skill.unit || '%'}
          </div>
        </div>
        <span className="text-xs font-bold text-center">{skill.name}</span>
      </div>
    );
  };

  const renderStatSkill = (skill: SkillItem, idx: number) => (
    <div key={idx} className={`p-4 rounded-xl border ${styles.border} ${styles.statBg} flex flex-col items-center justify-center text-center`}>
      <div className={`text-3xl font-black ${styles.accent} mb-1`}>
        {skill.value}
        <span className="text-xs ml-0.5 opacity-60 font-normal">{skill.unit}</span>
      </div>
      <div className={`text-xs font-bold uppercase tracking-wider ${styles.muted}`}>{skill.name}</div>
    </div>
  );

  const renderRadarChart = (items: SkillItem[]) => {
    if (!items.length) return null;

    const size = 220;
    const center = size / 2;
    const radius = 66;
    const angleStep = (Math.PI * 2) / items.length;

    const getPoint = (value: number, index: number, rScale = radius) => {
      const angle = index * angleStep - Math.PI / 2;
      const r = (value / 100) * rScale;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    };

    const points = items.map((item, i) => getPoint(item.value, i)).join(' ');

    return (
      <div className="flex flex-col items-center justify-center py-2">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible w-[208px] h-[208px] sm:w-[220px] sm:h-[220px] md:w-[240px] md:h-[240px]"
        >
          {[25, 50, 75, 100].map((level) => (
            <polygon
              key={level}
              points={items.map((_, i) => getPoint(level, i)).join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className={`${styles.radarGrid} opacity-25`}
            />
          ))}
          {items.map((_, i) => {
            const p = getPoint(100, i);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={p.split(',')[0]}
                y2={p.split(',')[1]}
                stroke="currentColor"
                strokeWidth="1"
                className={`${styles.radarGrid} opacity-25`}
              />
            );
          })}
          <polygon points={points} className={`${styles.radarPolygon} stroke-2`} />
          {items.map((item, i) => {
            const [x, y] = getPoint(100, i, radius + 22).split(',').map(Number);
            return (
              <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className={`text-[10px] font-bold fill-current ${styles.text}`}>
                {item.name} <tspan className="fill-current opacity-60 font-mono" dx="2" fontSize="9">{item.value}</tspan>
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'profile_header': {
        const heroImages =
          block.data.hero_image_urls && block.data.hero_image_urls.length > 0
            ? block.data.hero_image_urls
            : block.data.hero_image_url
              ? [block.data.hero_image_url]
              : [];

        return (
          <header className="relative w-full pt-20 sm:pt-24 md:pt-32 pb-6 sm:pb-8 md:pb-12 px-4 sm:px-6 md:px-12 max-w-6xl mx-auto mb-8 sm:mb-10 md:mb-16">
            <div className="flex flex-col md:flex-row items-start gap-6 sm:gap-8 md:gap-12 text-center md:text-left">
              <div className="flex flex-col gap-4 sm:gap-6 w-full md:w-auto md:min-w-[280px] md:max-w-[320px] shrink-0 items-center">
                <div className={`w-32 h-32 sm:w-40 sm:h-40 md:w-64 md:h-64 rounded-full ${styles.cardBg} border-4 ${styles.border} flex items-center justify-center text-4xl sm:text-5xl md:text-8xl font-bold shadow-2xl overflow-hidden relative z-10`}>
                  {block.data.avatar_url ? <img src={block.data.avatar_url} className="w-full h-full object-cover" /> : portfolio.student_name[0]}
                </div>

                {heroImages.map((url, idx) => (
                  <div
                    key={idx}
                    className={`w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border-2 ${styles.border} relative group ${idx % 2 === 0 ? 'md:rotate-2' : 'md:-rotate-2'} hover:rotate-0 transition-all duration-500 ${styles.cardSubtle}`}
                  >
                    <img src={url} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  </div>
                ))}
              </div>

              <div className="flex-1 pt-4 md:pt-8">
                <div className={`inline-block px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2 sm:mb-3 md:mb-4 ${styles.accentBadge}`}>
                  SparkMinds Portfolio
                </div>
                <h1 className={`text-2xl sm:text-3xl md:text-4xl font-semibold mb-2 opacity-90 ${styles.fontHeading}`}>{portfolio.student_name}</h1>
                <p className={`text-lg sm:text-2xl md:text-5xl font-extrabold leading-tight max-w-4xl mb-3 sm:mb-4 md:mb-6 drop-shadow-sm ${styles.fontHeading}`}>
                  {block.data.student_title || 'Future Innovator & Builder'}
                </p>
                {block.data.summary_bio && (
                  <div className={`mt-2 md:mt-4 text-sm sm:text-base md:text-lg opacity-90 max-w-3xl leading-relaxed whitespace-pre-wrap ${styles.muted}`}>
                    {block.data.summary_bio}
                  </div>
                )}
              </div>
            </div>
          </header>
        );
      }

      case 'skills_matrix':
        return (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-14 sm:mb-16 md:mb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {block.data.skills_categories?.map((cat, idx) => {
                const isRadar = cat.layout === 'radar';
                return (
                  <div
                    key={idx}
                    className={`p-5 sm:p-6 md:p-8 rounded-3xl ${styles.cardBg} border ${styles.border} shadow-lg transition-all duration-300 ${styles.sectionCardHover} ${isRadar ? 'md:col-span-2 lg:col-span-1' : ''}`}
                  >
                    <h3 className={`font-bold text-base sm:text-lg mb-5 sm:mb-6 flex items-center gap-2 ${styles.accent} ${styles.fontHeading}`}>
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
          <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-14 sm:mb-16 md:mb-24">
            <div className="mb-6 sm:mb-8 md:mb-12">
              <div className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-bold mb-6 tracking-widest uppercase ${styles.projectBadge}`}>
                Project Highlight
              </div>
              <h3 className={`text-xl sm:text-3xl md:text-5xl font-bold leading-tight mb-4 ${styles.projectTitle} ${styles.fontHeading}`}>{block.data.title}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
              {[
                { letter: 'S', title: '背景 (SITUATION)', text: block.data.star_situation },
                { letter: 'T', title: '任务 (TASK)', text: block.data.star_task },
                { letter: 'A', title: '行动 (ACTION)', text: block.data.star_action },
                { letter: 'R', title: '结果 (RESULT)', text: block.data.star_result },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`relative p-5 sm:p-6 md:p-8 rounded-3xl border overflow-hidden group transition-all duration-300 min-h-[160px] sm:min-h-[180px] ${styles.projectCard}`}
                >
                  <div className={`absolute -right-2 -bottom-5 sm:-bottom-6 md:-bottom-10 text-[4.8rem] sm:text-[6rem] md:text-[10rem] font-black select-none pointer-events-none transition-colors font-sans leading-none ${styles.projectLetter}`}>
                    {item.letter}
                  </div>

                  <div className="relative z-10">
                    <h4 className={`font-bold text-xs md:text-sm tracking-widest uppercase mb-3 md:mb-4 ${styles.projectLabel}`}>{item.title}</h4>
                    <p className={`leading-relaxed text-sm md:text-base whitespace-pre-wrap ${styles.projectText}`}>{item.text || '暂无描述'}</p>
                  </div>
                </div>
              ))}
            </div>

            {block.data.evidence_urls && block.data.evidence_urls.length > 0 && (
              <div className={`mt-8 pt-8 border-t ${styles.projectDivider}`}>
                <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 ${styles.muted}`}>Project Evidence</h4>

                <div
                  className={`grid gap-4 ${
                    block.data.evidence_urls.length === 1
                      ? 'grid-cols-1'
                      : block.data.evidence_urls.length === 2
                        ? 'grid-cols-1 md:grid-cols-2'
                        : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                  }`}
                >
                  {block.data.evidence_urls.map((url, i) => {
                    const isSingle = block.data.evidence_urls?.length === 1;
                    return (
                      <div
                        key={i}
                        className={`relative rounded-xl overflow-hidden border group cursor-pointer ${styles.evidenceCard} ${isSingle ? 'w-full' : 'aspect-[4/3]'}`}
                        onClick={() => window.open(url, '_blank')}
                      >
                        <img
                          src={url}
                          className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${
                            isSingle ? 'object-contain max-h-[420px] sm:max-h-[600px] bg-black/5' : 'object-cover'
                          }`}
                        />
                        <div className={`absolute inset-0 bg-transparent transition-colors ${styles.evidenceHoverMask}`} />
                        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm p-1.5 rounded-full text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Icons.Maximize2 size={16} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        );

      case 'info_list':
        return (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-14 sm:mb-16 md:mb-20">
            <div className={`p-6 md:p-10 rounded-3xl ${styles.cardBg} border ${styles.border}`}>
              {block.data.title && <h3 className={`text-xl font-bold mb-8 pb-4 border-b ${styles.border} ${styles.fontHeading}`}>{block.data.title}</h3>}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-7 sm:gap-y-8 gap-x-8 sm:gap-x-12">
                {block.data.info_items?.map((item, idx) => {
                  const Icon = (Icons as any)[item.icon || 'Star'] || Icons.Star;
                  return (
                    <div key={idx} className="flex items-start gap-4 group">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${styles.cardSubtle} ${styles.accent} border ${styles.border} shadow-sm group-hover:scale-110 transition-transform`}>
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-7 sm:mb-8 md:mb-10 mt-14 sm:mt-16 md:mt-24 text-center">
            <h2 className={`text-2xl md:text-4xl font-bold ${styles.text} ${styles.fontHeading}`}>{block.data.title}</h2>
          </div>
        );

      case 'timeline_node':
        return (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-5 sm:mb-6 md:mb-8 flex gap-3 sm:gap-4 md:gap-10 group">
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${styles.barFill} mt-2 ring-4 ${styles.timelineDotRing} ${styles.barGlow}`} />
              <div className={`w-0.5 flex-1 my-2 group-last:hidden ${styles.timelineLine}`} />
            </div>
            <div className={`flex-1 pb-6 sm:pb-8 ${styles.cardBg} p-4 sm:p-6 md:p-8 rounded-2xl border ${styles.border} relative transition-colors ${styles.timelineCardHover}`}>
              <div className={`absolute top-6 -left-3 w-6 h-6 ${styles.cardBg} border-l border-b ${styles.border} transform rotate-45 md:block hidden rounded-bl-md`} />
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`inline-block px-3 py-1 rounded-md text-[11px] sm:text-xs font-mono font-bold ${styles.cardSubtle} ${styles.accent} border ${styles.border}`}>{block.data.date}</span>
              </div>
              <h3 className={`text-lg sm:text-xl font-bold mb-3 ${styles.fontHeading}`}>{block.data.title}</h3>
              <p className={`${styles.muted} text-sm leading-relaxed whitespace-pre-wrap`}>{block.data.content}</p>
              {block.data.urls && block.data.urls.length > 0 && (
                <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {block.data.urls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      className={`h-20 w-28 sm:h-24 sm:w-32 object-cover rounded-lg border cursor-pointer hover:scale-105 transition-transform ${styles.timelineMediaBorder}`}
                      onClick={() => window.open(url, '_blank')}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'table':
        return (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-14 sm:mb-16 md:mb-20">
            {block.data.title && <h3 className={`text-xl font-bold mb-6 px-2 ${styles.fontHeading}`}>{block.data.title}</h3>}
            <div className={`overflow-hidden rounded-2xl border ${styles.border} ${styles.cardBg}`}>
              <div className="overflow-x-auto">
                <table className="min-w-[560px] w-full text-left text-xs sm:text-sm whitespace-nowrap">
                  <thead>
                    <tr className={`border-b ${styles.border} ${styles.tableHeader}`}>
                      {block.data.table_columns?.map((col, i) => (
                        <th key={i} className={`p-3 sm:p-4 md:p-5 font-bold ${styles.text} uppercase tracking-wider text-[11px] sm:text-xs`}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${styles.border} ${styles.tableBodyDivider}`}>
                    {block.data.table_rows?.map((row, rIdx) => (
                      <tr key={rIdx} className={`transition-colors ${styles.tableRowHover}`}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className={`p-3 sm:p-4 md:p-5 ${styles.muted} font-mono`}>{cell}</td>
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
          <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-10 sm:mb-12 md:mb-16">
            {block.data.title && <h3 className={`text-2xl font-bold mb-6 ${styles.fontHeading}`}>{block.data.title}</h3>}
            <div className={styles.prose}>
              <p className="whitespace-pre-wrap">{block.data.content}</p>
            </div>
          </section>
        );

      case 'image_grid':
        return (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-14 sm:mb-16 md:mb-20">
            {block.data.title && <h3 className={`text-xl font-bold mb-6 px-2 ${styles.fontHeading}`}>{block.data.title}</h3>}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {block.data.urls?.map((url, i) => (
                <div key={i} className={`aspect-square rounded-2xl overflow-hidden cursor-pointer group relative border ${styles.border}`}>
                  <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className={`absolute inset-0 bg-transparent transition-colors ${styles.imageGridOverlay}`} />
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
    <div className={`portfolio-theme min-h-screen relative overflow-hidden ${styles.bg} ${styles.text} ${styles.fontBody} ${styles.selection} pb-20`}>
      {renderAmbientLayers()}

      <div className="relative z-10">
        <nav className={`fixed top-0 w-full z-50 px-3 sm:px-5 md:px-6 py-3 sm:py-4 flex justify-between items-center backdrop-blur-xl border-b portfolio-safe-top ${styles.border} ${styles.navBg}`}>
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Logo className={`h-7 sm:h-8 w-auto ${styles.navLogo}`} />
            <div className={`text-[10px] font-mono uppercase tracking-widest border px-2 py-1 rounded hidden md:block ${styles.navBadge}`}>
              Student Portfolio
            </div>
          </div>

          <div>
            <PDFDownloadLink document={<PortfolioPDF portfolio={portfolio} />} fileName={`${portfolio.student_name}_Portfolio.pdf`}>
              {({ loading: pdfLoading }: { loading: boolean }) => (
                <button
                  disabled={pdfLoading}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all ${pdfLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'} ${styles.button}`}
                >
                  {pdfLoading ? <Icons.Loader2 size={14} className="animate-spin" /> : <Icons.Download size={14} />}
                  <span className="hidden sm:inline">{pdfLoading ? 'Generating...' : 'Export PDF'}</span>
                  <span className="sm:hidden">{pdfLoading ? '生成中' : 'PDF'}</span>
                </button>
              )}
            </PDFDownloadLink>
          </div>
        </nav>

        <div className="pt-16 sm:pt-20">
          {portfolio.content_blocks?.map((block, index) => (
            <div key={block.id || `${block.type}-${index}`} className="portfolio-reveal" style={{ animationDelay: `${Math.min(index * 90, 540)}ms` }}>
              {renderBlock(block)}
            </div>
          ))}
        </div>

        <footer className={`py-10 sm:py-12 px-4 text-center text-xs ${styles.muted} border-t ${styles.border} mt-16 sm:mt-20 bg-black/5 portfolio-safe-bottom`}>
          <p>© 2024 SparkMinds Lab. All rights reserved.</p>
          <p className="mt-2 opacity-60">Generated by SparkMinds Portfolio System</p>
        </footer>
      </div>
    </div>
  );
};
