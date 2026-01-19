import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Logo } from '../components/Logo';
import * as Icons from 'lucide-react';
import { CURRICULUM, PHILOSOPHY, SHOWCASES, PAGE_SECTIONS_DEFAULT } from '../constants';

// Type definitions for raw DB data (snake_case)
interface DbCourse {
  id: string;
  level: string;
  age: string;
  title: string;
  description: string;
  skills: string[];
  icon_name: string;
  image_url?: string;
}

interface DbShowcase {
  id: number;
  title: string;
  category: string;
  description: string;
  image_alt: string;
}

interface DbPhilosophy {
  id: number;
  title: string;
  content: string;
  icon_name: string;
}

interface DbPageSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  metadata: any;
}

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'curriculum' | 'showcase' | 'philosophy' | 'pages'>('curriculum');
  
  const [curriculum, setCurriculum] = useState<DbCourse[]>([]);
  const [philosophy, setPhilosophy] = useState<DbPhilosophy[]>([]);
  const [showcases, setShowcases] = useState<DbShowcase[]>([]);
  const [pageSections, setPageSections] = useState<DbPageSection[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [uploading, setUploading] = useState(false);

  // Check auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
      }
    });
  }, [navigate]);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    
    const { data: cData } = await supabase.from('curriculum').select('*').order('id');
    if (cData) setCurriculum(cData);

    const { data: pData } = await supabase.from('philosophy').select('*').order('id');
    if (pData) setPhilosophy(pData);

    const { data: sData } = await supabase.from('showcases').select('*').order('id');
    if (sData) setShowcases(sData);

    const { data: pageData } = await supabase.from('page_sections').select('*');
    if (pageData) setPageSections(pageData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // --- Data Seeding Logic ---
  const handleSeedData = async () => {
    if (!confirm('确定要初始化数据吗？这将把 constants.ts 中的默认数据导入数据库。')) return;
    setLoading(true);
    
    try {
      if (curriculum.length === 0) {
        const dbCurriculum = CURRICULUM.map(c => ({
          id: c.id,
          level: c.level,
          age: c.age,
          title: c.title,
          description: c.description,
          skills: c.skills,
          icon_name: c.iconName,
          image_url: c.imageUrl
        }));
        await supabase.from('curriculum').insert(dbCurriculum);
      }

      if (philosophy.length === 0) {
        const dbPhilosophy = PHILOSOPHY.map(p => ({
          title: p.title,
          content: p.content,
          icon_name: p.iconName
        }));
        await supabase.from('philosophy').insert(dbPhilosophy);
      }

      if (showcases.length === 0) {
        const dbShowcases = SHOWCASES.map(s => ({
          title: s.title,
          category: s.category,
          description: s.description,
          image_alt: s.imageAlt
        }));
        await supabase.from('showcases').insert(dbShowcases);
      }

      if (pageSections.length === 0) {
        await supabase.from('page_sections').insert(PAGE_SECTIONS_DEFAULT);
      }
      
      alert('数据初始化成功！');
      fetchData();
    } catch (error: any) {
      alert('初始化失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD Logic ---
  const openEditModal = (item: any) => {
    setEditingItem({ ...item }); // Clone to avoid direct mutation
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setLoading(true);

    try {
      let table = '';
      if (activeTab === 'curriculum') table = 'curriculum';
      if (activeTab === 'showcase') table = 'showcases';
      if (activeTab === 'philosophy') table = 'philosophy';
      if (activeTab === 'pages') table = 'page_sections';

      // Update in Supabase
      const { error } = await supabase
        .from(table)
        .update(editingItem)
        .eq('id', editingItem.id);

      if (error) throw error;

      setIsModalOpen(false);
      setEditingItem(null);
      await fetchData(); // Refresh data
    } catch (error: any) {
      alert('保存失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Image Upload Logic ---
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    setUploading(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      if (activeTab === 'showcase') {
        setEditingItem({ ...editingItem, image_alt: data.publicUrl });
      } else if (activeTab === 'curriculum') {
        setEditingItem({ ...editingItem, image_url: data.publicUrl });
      } else {
        setEditingItem({ ...editingItem, icon_name: data.publicUrl });
      }

    } catch (error: any) {
      alert('图片上传失败: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-6 flex flex-col shrink-0">
        <div className="mb-8">
           <Logo className="h-8 w-auto grayscale brightness-200" />
        </div>
        <nav className="flex-1 space-y-2">
          {[
            { id: 'curriculum', label: '课程体系', icon: Icons.BookOpen },
            { id: 'showcase', label: '学员成果', icon: Icons.Trophy },
            { id: 'philosophy', label: '核心理念', icon: Icons.Lightbulb },
            { id: 'pages', label: '页面设置', icon: Icons.Layout },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === tab.id ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <tab.icon size={18} />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="text-slate-400 hover:text-white mt-auto flex items-center gap-2 px-4 py-2">
          <Icons.LogOut size={16} /> 退出登录
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-screen overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-slate-800">
            {activeTab === 'curriculum' && '课程体系管理'}
            {activeTab === 'showcase' && '学员成果管理'}
            {activeTab === 'philosophy' && '核心理念管理'}
            {activeTab === 'pages' && '页面内容设置'}
          </h1>
          {/* Seed Data Button */}
          {((activeTab === 'curriculum' && curriculum.length === 0) || 
            (activeTab === 'showcase' && showcases.length === 0) ||
            (activeTab === 'philosophy' && philosophy.length === 0) ||
            (activeTab === 'pages' && pageSections.length === 0)) && !loading && (
             <button 
               onClick={handleSeedData}
               className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm font-bold"
             >
               <Icons.Database size={16} />
               初始化默认数据
             </button>
          )}
        </header>

        <main className="p-8">
          {loading && !isModalOpen ? (
            <div className="flex justify-center items-center h-64 text-slate-400">
              <Icons.Loader2 className="animate-spin mr-2" /> 加载中...
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Curriculum List */}
              {activeTab === 'curriculum' && (
                 <div className="divide-y divide-slate-100">
                    {curriculum.map(c => (
                        <div key={c.id} className="p-6 flex items-start gap-6 hover:bg-slate-50 transition-colors group">
                           <div className="w-16 h-12 bg-slate-200 rounded overflow-hidden shrink-0 border border-slate-100">
                             {c.image_url ? (
                               <img src={c.image_url} alt={c.title} className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-slate-400"><Icons.Image size={16} /></div>
                             )}
                           </div>
                           <div className="flex-1">
                             <div className="flex items-center gap-3 mb-1">
                               <span className="font-mono text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{c.id}</span>
                               <h3 className="font-bold text-slate-900">{c.title}</h3>
                             </div>
                             <p className="text-slate-500 text-sm mb-3 line-clamp-2">{c.description}</p>
                           </div>
                           <button onClick={() => openEditModal(c)} className="opacity-0 group-hover:opacity-100 p-2 text-blue-600 hover:bg-blue-50 rounded transition-all">
                             <Icons.Edit2 size={18} />
                           </button>
                        </div>
                    ))}
                 </div>
              )}
              
              {/* Showcase List */}
              {activeTab === 'showcase' && (
                   <div className="grid grid-cols-1 divide-y divide-slate-100">
                      {showcases.map((s) => (
                           <div key={s.id} className="p-6 flex gap-6 hover:bg-slate-50 transition-colors group">
                               <div className="w-32 h-24 bg-slate-200 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                                  {s.image_alt.startsWith('http') || s.image_alt.startsWith('<iframe') ? (
                                    s.image_alt.startsWith('<iframe') ? 
                                    <div className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full" dangerouslySetInnerHTML={{__html: s.image_alt}} /> :
                                    <img src={s.image_alt} alt={s.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 bg-slate-100 p-2 text-center break-all">{s.image_alt}</div>
                                  )}
                               </div>
                               <div className="flex-1">
                                   <div className="flex justify-between items-start">
                                     <div>
                                       <h3 className="font-bold text-slate-900 mb-1">{s.title}</h3>
                                       <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded">{s.category}</span>
                                     </div>
                                     <button onClick={() => openEditModal(s)} className="opacity-0 group-hover:opacity-100 p-2 text-blue-600 hover:bg-blue-50 rounded transition-all">
                                       <Icons.Edit2 size={18} />
                                     </button>
                                   </div>
                                   <p className="text-slate-500 text-sm mt-2 line-clamp-2">{s.description}</p>
                               </div>
                           </div>
                      ))}
                   </div>
              )}

              {/* Philosophy List */}
              {activeTab === 'philosophy' && (
                   <div className="divide-y divide-slate-100">
                      {philosophy.map((p) => (
                           <div key={p.id} className="p-6 flex items-start gap-6 hover:bg-slate-50 transition-colors group">
                               <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500 shrink-0">
                                   {(Icons as any)[p.icon_name] ? React.createElement((Icons as any)[p.icon_name], {size: 24}) : <Icons.Star />}
                               </div>
                               <div className="flex-1">
                                   <h3 className="font-bold text-slate-900 mb-1">{p.title}</h3>
                                   <p className="text-slate-500 text-sm">{p.content}</p>
                               </div>
                               <button onClick={() => openEditModal(p)} className="opacity-0 group-hover:opacity-100 p-2 text-blue-600 hover:bg-blue-50 rounded transition-all">
                                 <Icons.Edit2 size={18} />
                               </button>
                           </div>
                      ))}
                   </div>
              )}

              {/* Page Sections List */}
              {activeTab === 'pages' && (
                   <div className="divide-y divide-slate-100">
                      {pageSections.map((ps) => (
                           <div key={ps.id} className="p-6 flex items-start gap-6 hover:bg-slate-50 transition-colors group">
                               <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
                                   {ps.id === 'booking' ? <Icons.CalendarClock size={24} /> : 
                                    ps.id === 'footer' ? <Icons.Footprints size={24} /> : 
                                    <Icons.LayoutTemplate size={24} />}
                               </div>
                               <div className="flex-1">
                                   <div className="flex items-center gap-3 mb-1">
                                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">{ps.id}</span>
                                      <h3 className="font-bold text-slate-900">{ps.title}</h3>
                                   </div>
                                   <p className="text-slate-500 text-sm line-clamp-2">{ps.description}</p>
                               </div>
                               <button onClick={() => openEditModal(ps)} className="opacity-0 group-hover:opacity-100 p-2 text-blue-600 hover:bg-blue-50 rounded transition-all">
                                 <Icons.Edit2 size={18} />
                               </button>
                           </div>
                      ))}
                   </div>
              )}
              
              {/* Empty States */}
              {((activeTab === 'curriculum' && curriculum.length === 0) || 
                (activeTab === 'showcase' && showcases.length === 0) ||
                (activeTab === 'philosophy' && philosophy.length === 0)) && (
                <div className="p-12 text-center text-slate-400">
                  <Icons.Database className="mx-auto mb-4 opacity-50" size={48} />
                  <p>暂无数据，请点击上方“初始化默认数据”或手动添加。</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">编辑内容</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Icons.X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              
              {/* Common: Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">标题</label>
                <input 
                  type="text" 
                  value={editingItem.title || ''} 
                  onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Pages: Subtitle */}
              {activeTab === 'pages' && editingItem.id !== 'hero' && editingItem.id !== 'footer' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">副标题 (小标签)</label>
                  <input 
                    type="text" 
                    value={editingItem.subtitle || ''} 
                    onChange={e => setEditingItem({...editingItem, subtitle: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              {/* Pages: Hero Highlight Text */}
              {activeTab === 'pages' && editingItem.id === 'hero' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">渐变色强调文字</label>
                  <input 
                    type="text" 
                    value={editingItem.metadata?.highlighted_text || ''} 
                    onChange={e => setEditingItem({
                      ...editingItem, 
                      metadata: { ...editingItem.metadata, highlighted_text: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              {/* Description / Content */}
              {(editingItem.description !== undefined || editingItem.content !== undefined) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {editingItem.description !== undefined ? '描述 / 正文内容' : '内容'}
                  </label>
                  <textarea 
                    rows={4}
                    value={editingItem.description || editingItem.content || ''} 
                    onChange={e => {
                      if (editingItem.description !== undefined) setEditingItem({...editingItem, description: e.target.value});
                      else setEditingItem({...editingItem, content: e.target.value});
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              {/* Pages: Hero Buttons */}
              {activeTab === 'pages' && editingItem.id === 'hero' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">按钮1文案</label>
                    <input 
                      type="text" 
                      value={editingItem.metadata?.cta1 || ''} 
                      onChange={e => setEditingItem({
                        ...editingItem, 
                        metadata: { ...editingItem.metadata, cta1: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">按钮2文案</label>
                    <input 
                      type="text" 
                      value={editingItem.metadata?.cta2 || ''} 
                      onChange={e => setEditingItem({
                        ...editingItem, 
                        metadata: { ...editingItem.metadata, cta2: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Pages: Footer Specific Fields */}
              {activeTab === 'pages' && editingItem.id === 'footer' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">页脚联系信息</h4>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">地址</label>
                    <input 
                      type="text" 
                      value={editingItem.metadata?.address || ''} 
                      onChange={e => setEditingItem({
                        ...editingItem, 
                        metadata: { ...editingItem.metadata, address: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">邮箱</label>
                        <input 
                          type="text" 
                          value={editingItem.metadata?.email || ''} 
                          onChange={e => setEditingItem({
                            ...editingItem, 
                            metadata: { ...editingItem.metadata, email: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">电话</label>
                        <input 
                          type="text" 
                          value={editingItem.metadata?.phone || ''} 
                          onChange={e => setEditingItem({
                            ...editingItem, 
                            metadata: { ...editingItem.metadata, phone: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none"
                        />
                     </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">版权信息</label>
                    <input 
                      type="text" 
                      value={editingItem.metadata?.copyright || ''} 
                      onChange={e => setEditingItem({
                        ...editingItem, 
                        metadata: { ...editingItem.metadata, copyright: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Pages: Booking Specific Fields */}
              {activeTab === 'pages' && editingItem.id === 'booking' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">预约按钮与反馈</h4>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">导航栏按钮文案</label>
                        <input 
                          type="text" 
                          value={editingItem.metadata?.nav_button_text || ''} 
                          onChange={e => setEditingItem({
                            ...editingItem, 
                            metadata: { ...editingItem.metadata, nav_button_text: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">弹窗提交按钮文案</label>
                        <input 
                          type="text" 
                          value={editingItem.metadata?.submit_button_text || ''} 
                          onChange={e => setEditingItem({
                            ...editingItem, 
                            metadata: { ...editingItem.metadata, submit_button_text: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none"
                        />
                     </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">成功提交后的提示语</label>
                    <input 
                      type="text" 
                      value={editingItem.metadata?.success_message || ''} 
                      onChange={e => setEditingItem({
                        ...editingItem, 
                        metadata: { ...editingItem.metadata, success_message: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Curriculum specific */}
              {activeTab === 'curriculum' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Level ID</label>
                      <input type="text" disabled value={editingItem.id || ''} className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">年龄段</label>
                      <input type="text" value={editingItem.age || ''} onChange={e => setEditingItem({...editingItem, age: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">技能点 (逗号分隔)</label>
                    <input type="text" value={editingItem.skills ? editingItem.skills.join(', ') : ''} onChange={e => setEditingItem({...editingItem, skills: e.target.value.split(',').map((s: string) => s.trim())})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </>
              )}

              {/* Showcase specific */}
              {activeTab === 'showcase' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">分类</label>
                  <input type="text" value={editingItem.category || ''} onChange={e => setEditingItem({...editingItem, category: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              )}
              
              {/* Media Upload / Icon */}
              {activeTab !== 'pages' && (
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">
                    {activeTab === 'showcase' ? '图片 (上传或输入链接/视频可填B站iframe)' : 
                     activeTab === 'curriculum' ? '课程封面图' : '图标名称 (Lucide Icon)'}
                 </label>
                 
                 <input 
                    type="text" 
                    value={editingItem.icon_name || editingItem.image_alt || editingItem.image_url || ''} 
                    onChange={e => {
                        if (activeTab === 'showcase') setEditingItem({...editingItem, image_alt: e.target.value});
                        else if (activeTab === 'curriculum') setEditingItem({...editingItem, image_url: e.target.value});
                        else setEditingItem({...editingItem, icon_name: e.target.value});
                    }}
                    placeholder={activeTab === 'showcase' || activeTab === 'curriculum' ? "https://... 或上传图片" : "Box, Zap, etc."}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm mb-2"
                  />
                  
                  {(activeTab === 'showcase' || activeTab === 'curriculum') && (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {uploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <Icons.Loader2 className="animate-spin text-blue-600" size={20} />
                          <span className="ml-2 text-sm text-blue-600 font-medium">上传中...</span>
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === 'showcase' && (
                    <p className="text-xs text-slate-500 mt-1">
                      提示: 视频请将B站的iframe代码填入上方文本框。
                    </p>
                  )}
              </div>
              )}

            </div>
            
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors">取消</button>
              <button onClick={handleSave} disabled={loading || uploading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
                {loading ? <Icons.Loader2 className="animate-spin" size={16} /> : <Icons.Save size={16} />}
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};