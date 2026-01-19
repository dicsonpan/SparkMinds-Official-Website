import React, { useState, useEffect, useMemo } from 'react';
import { Logo } from '../components/Logo';
import { SectionHeading } from '../components/SectionHeading';
import { CourseCard } from '../components/CourseCard';
import * as Icons from 'lucide-react';
import { useContent } from '../hooks/useContent';
import { PageSection } from '../types';

export const LandingPage: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Showcase Logic State
  const { curriculum, philosophy, showcases, pageSections } = useContent();
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [visibleCount, setVisibleCount] = useState<number>(8); // Initial display count

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navHeight = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
    setMobileMenuOpen(false);
  };

  // Helper to safely get section data
  const getSection = (id: string): PageSection => {
    return pageSections[id] || { 
      id: 'loading',
      title: 'Loading...', 
      description: '', 
      subtitle: '',
      metadata: {}
    };
  };

  const hero = getSection('hero');
  const philosophySec = getSection('philosophy');
  const curriculumSec = getSection('curriculum');
  const showcasesSec = getSection('showcases');

  // --- Showcase Filtering Logic ---
  // 1. Extract unique categories from data
  const categories = useMemo(() => {
    const cats = new Set(showcases.map(s => s.category));
    return ['全部', ...Array.from(cats)];
  }, [showcases]);

  // 2. Filter showcases based on selection
  const filteredShowcases = useMemo(() => {
    if (selectedCategory === '全部') return showcases;
    return showcases.filter(s => s.category === selectedCategory);
  }, [showcases, selectedCategory]);

  // 3. Slice for pagination
  const visibleShowcases = filteredShowcases.slice(0, visibleCount);
  const hasMore = visibleCount < filteredShowcases.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 8);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setVisibleCount(8); // Reset pagination when filter changes
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
          <Logo scrolled={isScrolled} />
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 items-center">
            {['核心理念', '成长路径', '学员作品', '社会实践'].map((item) => (
              <button 
                key={item} 
                onClick={() => scrollToSection(item)}
                className={`font-medium hover:text-[#E1964B] transition-colors cursor-pointer bg-transparent border-none ${isScrolled ? 'text-slate-700' : 'text-slate-800'}`}
              >
                {item}
              </button>
            ))}
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors shadow-lg shadow-blue-600/20">
              预约试听
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-slate-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <Icons.X /> : <Icons.Menu />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-slate-100 p-4 flex flex-col space-y-4">
             {['核心理念', '成长路径', '学员作品', '社会实践'].map((item) => (
              <button 
                key={item} 
                onClick={() => scrollToSection(item)}
                className="text-left text-slate-700 font-medium py-2 border-b border-slate-100 bg-transparent"
              >
                {item}
              </button>
            ))}
             <button className="bg-[#E1964B] text-white w-full py-3 rounded-lg font-bold">
              预约体验课
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-50/50 skew-x-12 transform translate-x-20 -z-10"></div>
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-20 right-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
              {hero.title}<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E1964B] to-blue-600">
                {hero.metadata?.highlighted_text || '硬核科技创造力'}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              {hero.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => scrollToSection('成长路径')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-xl font-bold shadow-xl shadow-blue-600/20 transition-transform hover:-translate-y-1"
              >
                {hero.metadata?.cta1 || '查看孩子的成长规划'}
              </button>
              <button 
                 onClick={() => scrollToSection('学员作品')}
                 className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-lg px-8 py-4 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Icons.PlayCircle className="w-5 h-5 text-[#E1964B]" />
                {hero.metadata?.cta2 || '看看学员们做出了什么'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Philosophy Section */}
      <section id="核心理念" className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeading 
            subtitle={philosophySec.subtitle || 'OUR MISSION'} 
            title={philosophySec.title}
            description={philosophySec.description}
          />
          
          <div className="grid md:grid-cols-3 gap-8">
            {philosophy.map((item, idx) => {
              const Icon = (Icons as any)[item.iconName] || Icons.Star;
              return (
                <div key={idx} className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-orange-200 transition-colors">
                  <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-[#E1964B]">
                    <Icon size={32} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {item.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Curriculum Path Section (The Circuit) */}
      <section id="成长路径" className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="circuit-pattern absolute inset-0 opacity-50 pointer-events-none"></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <SectionHeading 
            subtitle={curriculumSec.subtitle || 'GROWTH PATH'} 
            title={curriculumSec.title} 
            description={curriculumSec.description}
          />

          <div className="relative max-w-5xl mx-auto mt-16">
            {/* The Vertical Circuit Line */}
            <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 via-blue-500 to-blue-800 rounded-full"></div>

            {/* Course Cards */}
            {curriculum.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} />
            ))}

            {/* The Summit Marker */}
            <div className="relative flex justify-center mt-12">
               <div className="bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 border-4 border-white z-20">
                 <Icons.GraduationCap className="text-[#E1964B]" />
                 <span className="font-bold tracking-wide">顶尖名校 / 科技领袖</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showcases Section */}
      <section id="学员作品" className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeading 
            subtitle={showcasesSec.subtitle || 'SUCCESS STORIES'} 
            title={showcasesSec.title} 
            description={showcasesSec.description}
          />

          {/* Category Filter Bar */}
          {categories.length > 2 && (
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 
                    ${selectedCategory === cat 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200 transform scale-105' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleShowcases.map((showcase, idx) => (
              <div key={`${showcase.title}-${idx}`} className="group cursor-pointer animate-fade-in-up">
                <div className="relative overflow-hidden rounded-xl aspect-[4/3] mb-4 bg-slate-200">
                  {/* Intelligent rendering for Video iframe or Image */}
                  {showcase.imageAlt.trim().startsWith('<iframe') ? (
                    <div 
                      className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0" 
                      dangerouslySetInnerHTML={{__html: showcase.imageAlt}} 
                    />
                  ) : (
                    <img 
                      src={showcase.imageAlt.startsWith('http') ? showcase.imageAlt : `https://picsum.photos/seed/${idx + 15}/600/400`} 
                      alt={showcase.title}
                      className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-md text-xs font-bold text-blue-800 uppercase z-10 shadow-sm">
                    {showcase.category}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {showcase.title}
                </h3>
                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                  {showcase.description}
                </p>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-12 text-center">
              <button 
                onClick={handleLoadMore}
                className="group relative inline-flex items-center justify-center px-8 py-3 font-semibold text-blue-600 transition-all duration-200 bg-white border-2 border-blue-100 rounded-full hover:bg-blue-50 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
              >
                <span>查看更多作品 ({filteredShowcases.length - visibleCount})</span>
                <Icons.ChevronDown className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-y-1" />
              </button>
            </div>
          )}
          
          {visibleShowcases.length === 0 && (
             <div className="text-center py-10 text-slate-500">
                暂无该分类下的作品
             </div>
          )}
        </div>
      </section>

      {/* Business Loop / Social Practice */}
      <section id="社会实践" className="py-20 bg-blue-900 text-white relative overflow-hidden">
        {/* Static content for now, can be moved to DB if needed later */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-600 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block py-1 px-3 rounded-full bg-blue-800 border border-blue-700 text-orange-400 text-sm font-semibold tracking-wider mb-6">
                社会实践与财商启蒙
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                让创意的价值<br/>在真实市场中得到验证
              </h2>
              <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                我们鼓励孩子将作品产品化。通过将创意转化为开源硬件套件或服务，孩子不仅能获得人生“第一桶金”，
                更重要的是在这一过程中理解经济运行的规律，培养极其宝贵的企业家精神。
              </p>
              <ul className="space-y-4">
                {[
                  '从Idea到产品的全流程体验',
                  '理解成本、定价与市场需求',
                  '提前积累真实的社会实践履历'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#E1964B] flex items-center justify-center flex-shrink-0">
                      <Icons.Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-blue-50">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
               <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 bg-[#E1964B] rounded-lg">
                   <Icons.TrendingUp className="w-6 h-6 text-white" />
                 </div>
                 <div>
                   <h4 className="font-bold text-xl">学员项目商业化案例</h4>
                   <p className="text-blue-200 text-sm">市场验证与价值回馈</p>
                 </div>
               </div>
               <div className="h-48 bg-blue-950/50 rounded-lg flex items-center justify-center border border-white/5 p-4 text-center">
                  <p className="text-blue-200 italic">
                    “这不仅仅是一次售卖，更是孩子建立自信、理解社会价值的最好一课。”
                  </p>
               </div>
               <p className="mt-4 text-sm text-blue-200">
                 * 部分优秀学员作品已成功上线创客市场
               </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <Logo className="h-8 w-auto mb-4 grayscale brightness-200 opacity-80" />
              <p className="max-w-xs text-sm leading-relaxed">
                创智实验室 (SparkMinds) 专注于青少年硬核科技素养教育。
                <br/><br/>
                我们致力于为中国家庭提供一条科学、扎实、具有国际视野的科技创新成长路径。
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">探索</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => scrollToSection('成长路径')} className="hover:text-[#E1964B] transition-colors bg-transparent border-none p-0 cursor-pointer">
                    课程体系
                  </button>
                </li>
                <li><a href="#" className="hover:text-[#E1964B] transition-colors">寒暑假集训</a></li>
                <li>
                  <button onClick={() => scrollToSection('学员作品')} className="hover:text-[#E1964B] transition-colors bg-transparent border-none p-0 cursor-pointer">
                    学员荣誉
                  </button>
                </li>
                <li><a href="#" className="hover:text-[#E1964B] transition-colors">关于我们</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">联系我们</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Icons.MapPin size={16}/> 广州/深圳 线下创新中心</li>
                <li className="flex items-center gap-2"><Icons.Mail size={16}/> contact@sparkminds.edu</li>
                <li className="flex items-center gap-2"><Icons.Phone size={16}/> 400-123-4567</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
            <p>© 2024 SparkMinds 创智实验室. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white">隐私政策</a>
              <a href="#" className="hover:text-white">用户协议</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};