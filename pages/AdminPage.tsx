import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import * as Icons from 'lucide-react';
import { Logo } from '../components/Logo';
import { 
  StudentPortfolio, 
  ContentBlock, 
  Booking,
  CourseLevel,
  Showcase,
  PhilosophyPoint,
  SocialProject
} from '../types';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'bookings' | 'portfolios' | 'curriculum' | 'showcases' | 'philosophy' | 'social_projects'>('bookings');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
  
  // Data States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [portfolios, setPortfolios] = useState<StudentPortfolio[]>([]);
  const [curriculum, setCurriculum] = useState<CourseLevel[]>([]);
  const [showcases, setShowcases] = useState<Showcase[]>([]);
  const [philosophy, setPhilosophy] = useState<PhilosophyPoint[]>([]);
  const [socialProjects, setSocialProjects] = useState<SocialProject[]>([]);

  // Edit State
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // --- Auth & Init ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) navigate('/login');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) navigate('/login');
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session) fetchData();
  }, [session, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'bookings') {
        const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
        if (data) setBookings(data);
      } else if (activeTab === 'portfolios') {
        const { data } = await supabase.from('student_portfolios').select('*').order('created_at', { ascending: false });
        if (data) setPortfolios(data);
      } else if (activeTab === 'curriculum') {
        const { data } = await supabase.from('curriculum').select('*').order('sort_order', { ascending: true });
        if (data) {
           setCurriculum(data.map((item: any) => ({
             ...item,
             iconName: item.icon_name,
             imageUrls: item.image_urls
           })));
        }
      } else if (activeTab === 'showcases') {
        const { data } = await supabase.from('showcases').select('*').order('sort_order', { ascending: true });
        if (data) {
            setShowcases(data.map((item: any) => ({
                ...item,
                imageUrls: item.image_urls
            })));
        }
      }
      // Add other fetches if needed
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleDelete = async (id: number | string, table: string) => {
    if (!window.confirm('确定要删除吗？此操作不可恢复。')) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert('删除失败: ' + (err as any).message);
    }
  };

  const handleSave = async () => {
    try {
      let table = '';
      let payload = { ...editingItem };

      if (activeTab === 'curriculum') {
        table = 'curriculum';
        payload = { ...payload, icon_name: payload.iconName,Tbimage_urls: payload.imageUrls };
        delete payload.iconName; delete payload.imageUrls;
      } else if (activeTab === 'showcases') {
        table = 'showcases';
        payload = { ...payload, image_urls: payload.imageUrls };
        delete payload.imageUrls;
      } else if (activeTab === 'portfolios') {
        table = 'student_portfolios';
      }

      if (modalMode === 'create') {
        delete payload.id;
        delete payload.created_at;
      }

      let error;
      if (modalMode === 'create') {
        const { error: err } = await supabase.from(table).insert([payload]);
        error = err;
      } else {
        const { error: err } = await supabase.from(table).update(payload).eq('id', editingItem.id);
        error = err;
      }

      if (error) throw error;
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('保存失败: ' + (err as any).message);
    }
  };

  const openModal = (item: any = null) => {
    if (item) {
      setModalMode('edit');
      setEditingItem(JSON.parse(JSON.stringify(item)));
    } else {
      setModalMode('create');
      if (activeTab === 'portfolios') {
          setEditingItem({
              student_name: '新学生',
              slug: `student-${Date.now()}`,
              access_password: '123',
              content_blocks: [],
              theme_config: { theme: 'tech_dark' }
          });
      } else {
          setEditingItem({});
      }
    }
    setIsModalOpen(true);
  };

  // --- Portfolio Logic ---
  const addContentBlock = (type: string) => {
      const newBlock: ContentBlock = {
          id: `block-${Date.now()}`,
          type: type as any,
          data: {}
      };
      if (type === 'table') {
          newBlock.data = { table_columns: ['列1', '列2'], table_rows: [['数据1', '数据2']] };
      } else if (type === 'info_list') {
          newBlock.data = { info_items: [{ label: '标签', value: '内容', icon: 'Star' }] };
      }
      setEditingItem({ ...editingItem, content_blocks: [...(editingItem.content_blocks || []), newBlock] });
  };

  const removeContentBlock = (blockId: string) => {
      setEditingItem({ ...editingItem, content_blocks: editingItem.content_blocks.filter((b: any) => b.id !== blockId) });
  };

  const updateContentBlock = (blockId: string, field: string, value: any) => {
      setEditingItem({
          ...editingItem,
          content_blocks: editingItem.content_blocks.map((b: any) => {
              if (b.id === blockId) return { ...b, data: { ...b.data, [field]: value } };
              return b;
          })
      });
  };
  
  const updateBlockDataNested = (blockId: string, path: (string | number)[], value: any) => {
    setEditingItem((prev: any) => {
        const newBlocks = prev.content_blocks.map((b: any) => {
            if (b.id === blockId) {
                const newData = JSON.parse(JSON.stringify(b.data));
                let current = newData;
                for (let i = 0; i < path.length - 1; i++) current = current[path[i]];
                current[path[path.length - 1]] = value;
                return { ...b, data: newData };
            }
            return b;
        });
        return { ...prev, content_blocks: newBlocks };
    });
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
      const blocks = [...editingItem.content_blocks];
      if (direction === 'up' && index > 0) [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
      else if (direction === 'down' && index < blocks.length - 1) [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
      setEditingItem({ ...editingItem, content_blocks: blocks });
  };

  // --- Renderers ---
  const renderSidebar = () => (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      
      {/* Sidebar Content */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <Logo className="h-8 w-auto invert brightness-0" />
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400"><Icons.X size={20}/></button>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <button onClick={() => { setActiveTab('bookings'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'bookings' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
            <Icons.CalendarCheck size={18} /> 预约管理
          </button>
          <button onClick={() => { setActiveTab('portfolios'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'portfolios' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
            <Icons.Users size={18} /> 学生档案
          </button>
          <div className="pt-4 pb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">内容管理</div>
          <button onClick={() => { setActiveTab('curriculum'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'curriculum' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
            <Icons.BookOpen size={18} /> 课程体系
          </button>
          <button onClick={() => { setActiveTab('showcases'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'showcases' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
            <Icons.Trophy size={18} /> 学员作品
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-slate-800 rounded-lg">
            <Icons.LogOut size={18} /> 退出登录
          </button>
        </div>
      </div>
    </>
  );

  const renderBookingsTable = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 whitespace-nowrap">家长姓名</th>
              <th className="px-6 py-4 whitespace-nowrap">电话</th>
              <th className="px-6 py-4 whitespace-nowrap">孩子年龄</th>
              <th className="px-6 py-4 whitespace-nowrap">状态</th>
              <th className="px-6 py-4 whitespace-nowrap">提交时间</th>
              <th className="px-6 py-4 whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium">{booking.parent_name}</td>
                <td className="px-6 py-4">{booking.phone}</td>
                <td className="px-6 py-4">{booking.child_age}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === 'contacted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {booking.status === 'contacted' ? '已联系' : '待处理'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm">{new Date(booking.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                   {booking.status !== 'contacted' && (
                     <button 
                       onClick={async () => {
                         await supabase.from('bookings').update({ status: 'contacted' }).eq('id', booking.id);
                         fetchData();
                       }}
                       className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-4"
                     >
                       标记为已联系
                     </button>
                   )}
                   <button onClick={() => handleDelete(booking.id, 'bookings')} className="text-red-500 hover:text-red-700">
                     <Icons.Trash2 size={16} />
                   </button>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
               <tr>
                 <td colSpan={6} className="px-6 py-8 text-center text-slate-400">暂无预约数据</td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPortfoliosTable = () => (
      <div>
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">学生档案管理</h2>
              <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Icons.Plus size={18} /> 新建档案
              </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolios.map(item => (
                  <div key={item.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl font-bold text-slate-500">
                              {item.student_name[0]}
                          </div>
                          <div>
                              <h3 className="font-bold text-lg">{item.student_name}</h3>
                              <p className="text-xs text-slate-500">/{item.slug}</p>
                          </div>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
                          <a href={`#/s/${item.slug}`} target="_blank" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                              <Icons.ExternalLink size={14} /> 查看页面
                          </a>
                          <div className="flex gap-2">
                              <button onClick={() => openModal(item)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                                  <Icons.Edit size={16} />
                              </button>
                              <button onClick={() => handleDelete(item.id!, 'student_portfolios')} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                                  <Icons.Trash2 size={16} />
                              </button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderPortfolioEditor = () => {
    if (!editingItem) return null;
    return (
        <div className="space-y-8">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">学生姓名</label>
                    <input className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={editingItem.student_name} onChange={e => setEditingItem({...editingItem, student_name: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">URL Slug (唯一标识)</label>
                    <input className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={editingItem.slug} onChange={e => setEditingItem({...editingItem, slug: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">访问密码</label>
                    <input className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={editingItem.access_password} onChange={e => setEditingItem({...editingItem, access_password: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">主题风格</label>
                    <select className="w-full border rounded-lg px-3 py-2 outline-none" value={editingItem.theme_config?.theme} onChange={e => setEditingItem({...editingItem, theme_config: { ...editingItem.theme_config, theme: e.target.value }})}>
                        <option value="tech_dark">科技黑 (Tech Dark)</option>
                        <option value="academic_light">学术白 (Academic Light)</option>
                        <option value="creative_color">多彩创意 (Creative)</option>
                    </select>
                </div>
            </div>

            <hr className="border-slate-200" />

            {/* Content Blocks */}
            <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <h3 className="font-bold text-lg">页面内容区块</h3>
                    <div className="flex flex-wrap gap-2">
                        {['profile_header', 'text', 'project_highlight', 'skills_matrix', 'image_grid', 'info_list', 'table'].map(type => (
                            <button key={type} onClick={() => addContentBlock(type)} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded border border-slate-300">
                                + {type.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {editingItem.content_blocks?.map((b: any, index: number) => (
                        <div key={b.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative group">
                            <div className="absolute right-4 top-4 flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="p-1 hover:text-blue-600 disabled:opacity-30"><Icons.ArrowUp size={16}/></button>
                                <button onClick={() => moveBlock(index, 'down')} disabled={index === editingItem.content_blocks.length - 1} className="p-1 hover:text-blue-600 disabled:opacity-30"><Icons.ArrowDown size={16}/></button>
                                <button onClick={() => removeContentBlock(b.id)} className="p-1 hover:text-red-600"><Icons.Trash2 size={16}/></button>
                            </div>
                            
                            <div className="mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-white px-2 py-1 rounded border">{b.type}</span>
                            </div>

                            <div className="space-y-3">
                                {b.type === 'profile_header' && (
                                    <>
                                        <input className="w-full border p-2 rounded text-sm" placeholder="Title / Slogan" value={b.data.student_title || ''} onChange={e => updateContentBlock(b.id, 'student_title', e.target.value)} />
                                        <textarea className="w-full border p-2 rounded text-sm" placeholder="Summary Bio" rows={3} value={b.data.summary_bio || ''} onChange={e => updateContentBlock(b.id, 'summary_bio', e.target.value)} />
                                        <input className="w-full border p-2 rounded text-sm" placeholder="Avatar URL" value={b.data.avatar_url || ''} onChange={e => updateContentBlock(b.id, 'avatar_url', e.target.value)} />
                                        <input className="w-full border p-2 rounded text-sm" placeholder="Hero Image URL (Optional)" value={b.data.hero_image_url || ''} onChange={e => updateContentBlock(b.id, 'hero_image_url', e.target.value)} />
                                    </>
                                )}

                                {b.type === 'text' && (
                                    <>
                                        <input className="w-full border p-2 rounded text-sm" placeholder="Section Title (Optional)" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} />
                                        <textarea className="w-full border p-2 rounded text-sm font-mono" placeholder="Content (Markdown supported)" rows={5} value={b.data.content || ''} onChange={e => updateContentBlock(b.id, 'content', e.target.value)} />
                                    </>
                                )}

                                {b.type === 'project_highlight' && (
                                    <>
                                        <input className="w-full border p-2 rounded text-sm font-bold" placeholder="Project Title" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <textarea className="border p-2 rounded text-xs" placeholder="Situation" rows={3} value={b.data.star_situation || ''} onChange={e => updateContentBlock(b.id, 'star_situation', e.target.value)} />
                                            <textarea className="border p-2 rounded text-xs" placeholder="Task" rows={3} value={b.data.star_task || ''} onChange={e => updateContentBlock(b.id, 'star_task', e.target.value)} />
                                            <textarea className="border p-2 rounded text-xs" placeholder="Action" rows={3} value={b.data.star_action || ''} onChange={e => updateContentBlock(b.id, 'star_action', e.target.value)} />
                                            <textarea className="border p-2 rounded text-xs" placeholder="Result" rows={3} value={b.data.star_result || ''} onChange={e => updateContentBlock(b.id, 'star_result', e.target.value)} />
                                        </div>
                                    </>
                                )}

                                {(b.type === 'info_list' || b.type === 'table') && (
                                    <div>
                                        <input className="font-bold border-b mb-4 w-full py-1 focus:border-blue-500 outline-none bg-transparent" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} placeholder={b.type === 'table' ? '表格标题' : '信息栏标题'} />
                                        {b.type === 'info_list' && (
                                            <div className="space-y-3">
                                                {b.data.info_items?.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex gap-3 items-end bg-white p-3 rounded-lg border border-slate-200 group/item">
                                                        <div className="w-24 shrink-0"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Icon</label><div className="flex items-center gap-2 bg-white border rounded px-2 py-1.5"><Icons.Smile size={14} className="text-slate-300" /><input className="w-full text-xs outline-none font-mono text-slate-600" value={item.icon || ''} onChange={e => updateBlockDataNested(b.id, ['info_items', idx, 'icon'], e.target.value)} placeholder="Star" /></div></div>
                                                        <div className="w-1/3 shrink-0"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Label</label><input className="w-full text-xs font-bold border rounded px-2 py-1.5 outline-none" value={item.label} onChange={e => updateBlockDataNested(b.id, ['info_items', idx, 'label'], e.target.value)} placeholder="标签" /></div>
                                                        <div className="flex-1 min-w-0"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Value</label><input className="w-full text-xs border rounded px-2 py-1.5 outline-none" value={item.value} onChange={e => updateBlockDataNested(b.id, ['info_items', idx, 'value'], e.target.value)} placeholder="内容" /></div>
                                                        <button onClick={() => { const newItems = [...(b.data.info_items || [])]; newItems.splice(idx, 1); updateContentBlock(b.id, 'info_items', newItems); }} className="text-slate-300 hover:text-red-500 p-1.5"><Icons.Trash2 size={16} /></button>
                                                    </div>
                                                ))}
                                                <button onClick={() => updateContentBlock(b.id, 'info_items', [...(b.data.info_items || []), { icon: 'Star', label: '', value: '' }])} className="w-full py-2.5 text-xs font-bold text-orange-600 border border-dashed border-orange-300 rounded-lg hover:bg-orange-50">+ 添加信息项</button>
                                            </div>
                                        )}
                                        {b.type === 'table' && (
                                            <div className="space-y-2">
                                                <div className="flex gap-1 overflow-x-auto pb-2">
                                                    {b.data.table_columns?.map((col: string, cIdx: number) => (
                                                        <div key={cIdx} className="relative group min-w-[100px] flex-1">
                                                            <input 
                                                                className="w-full text-xs font-bold bg-slate-100 border border-slate-200 rounded px-2 py-1 focus:border-green-400 outline-none pr-6" 
                                                                value={col} 
                                                                onChange={e => { 
                                                                    const newCols = [...(b.data.table_columns || [])]; 
                                                                    newCols[cIdx] = e.target.value; 
                                                                    updateContentBlock(b.id, 'table_columns', newCols); 
                                                                }} 
                                                            />
                                                            <button 
                                                                onClick={() => {
                                                                    if (!confirm('确定删除此列吗？')) return;
                                                                    const newCols = [...(b.data.table_columns || [])];
                                                                    newCols.splice(cIdx, 1);
                                                                    const newRows = (b.data.table_rows || []).map((r: string[]) => {
                                                                        const nr = [...r];
                                                                        nr.splice(cIdx, 1);
                                                                        return nr;
                                                                    });
                                                                    updateContentBlock(b.id, 'table_columns', newCols);
                                                                    updateContentBlock(b.id, 'table_rows', newRows);
                                                                }}
                                                                className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                                title="删除此列"
                                                            >
                                                                <Icons.X size={12}/>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                                    {b.data.table_rows?.map((row: string[], rIdx: number) => (
                                                        <div key={rIdx} className="flex gap-1 items-center">
                                                            {row.map((cell: string, cIdx: number) => (
                                                                <input key={cIdx} className="min-w-[100px] flex-1 text-xs border rounded px-2 py-1 focus:border-green-400 outline-none" value={cell} onChange={e => updateBlockDataNested(b.id, ['table_rows', rIdx, cIdx], e.target.value)} />
                                                            ))}
                                                            <button onClick={() => { const newRows = [...(b.data.table_rows || [])]; newRows.splice(rIdx, 1); updateContentBlock(b.id, 'table_rows', newRows); }} className="text-red-300 hover:text-red-500 px-1"><Icons.X size={12}/></button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2 mt-2">
                                                    <button onClick={() => updateContentBlock(b.id, 'table_rows', [...(b.data.table_rows || []), new Array((b.data.table_columns || []).length).fill('')])} className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded border border-green-200 hover:bg-green-100 font-bold">+ 添加行</button>
                                                    <button 
                                                        onClick={() => { 
                                                            const newCols = [...(b.data.table_columns || []), '新列']; 
                                                            const newRows = (b.data.table_rows || []).map((r: string[]) => [...r, '']); 
                                                            updateContentBlock(b.id, 'table_columns', newCols);
                                                            updateContentBlock(b.id, 'table_rows', newRows);
                                                        }} 
                                                        className="text-xs text-slate-500 px-3 py-1.5 rounded border hover:bg-slate-50"
                                                    >
                                                        + 添加列
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
  };

  const renderGenericEditor = () => {
      return (
          <div className="space-y-4">
              <div className="p-4 bg-yellow-50 text-yellow-800 rounded text-sm mb-4">
                  暂未为 {activeTab} 提供可视化编辑器，请直接修改 JSON 数据。
              </div>
              {Object.keys(editingItem).map(key => {
                  if (key === 'id' || key === 'created_at') return null;
                  const val = editingItem[key];
                  return (
                      <div key={key}>
                          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{key}</label>
                          {typeof val === 'string' && val.length > 50 ? (
                              <textarea className="w-full border p-2 rounded text-sm" rows={4} value={val} onChange={e => setEditingItem({...editingItem, [key]: e.target.value})} />
                          ) : typeof val === 'object' ? (
                               <textarea className="w-full border p-2 rounded text-sm font-mono text-xs bg-slate-50" rows={4} value={JSON.stringify(val, null, 2)} onChange={e => {
                                   try {
                                       setEditingItem({...editingItem, [key]: JSON.parse(e.target.value)})
                                   } catch(err) { /* ignore invalid json while typing */ }
                               }} />
                          ) : (
                              <input className="w-full border p-2 rounded text-sm" value={val || ''} onChange={e => setEditingItem({...editingItem, [key]: e.target.value})} />
                          )}
                      </div>
                  );
              })}
          </div>
      );
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {renderSidebar()}
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen w-full">
         <header className="mb-8 flex justify-between items-center sticky top-0 bg-slate-50/90 backdrop-blur-sm z-30 py-4 border-b border-transparent">
            <div className="flex items-center gap-4">
                <button className="md:hidden text-slate-600 p-1" onClick={() => setIsSidebarOpen(true)}>
                    <Icons.Menu size={24} />
                </button>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                    {activeTab === 'bookings' && '预约管理'}
                    {activeTab === 'portfolios' && '学生档案'}
                    {activeTab === 'curriculum' && '课程体系'}
                    {activeTab === 'showcases' && '学员作品'}
                </h1>
            </div>
            <div className="flex items-center gap-4 text-xs md:text-sm text-slate-500 bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-fullHS border shadow-sm">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="hidden md:inline">管理员:</span> {session?.user?.email?.split('@')[0]}
            </div>
         </header>

         {loading ? (
             <div className="flex justify-center py-20"><Icons.Loader2 className="animate-spin text-blue-600" size={32} /></div>
         ) : (
             <>
                {activeTab === 'bookings' && renderBookingsTable()}
                {activeTab === 'portfolios' && renderPortfoliosTable()}
                
                {(activeTab === 'curriculum' || activeTab === 'showcases') && (
                    <div>
                         <div className="flex justify-end mb-4">
                            <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                <Icons.Plus size={16}/> 添加条目
                            </button>
                         </div>
                         <div className="grid gap-4">
                             {(activeTab === 'curriculum' ? curriculum : showcases).map((item: any) => (
                                 <div key={item.id} className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center">
                                     <div className="flex-1 min-w-0 pr-4">
                                         <div className="font-bold truncate">{item.title}</div>
                                         <div className="text-xs text-slate-500 line-clamp-1">{item.description}</div>
                                     </div>
                                     <div className="flex gap-2 shrink-0">
                                         <button onClick={() => openModal(item)} className="p-2 hover:bg-slate-100 rounded text-blue-600"><Icons.Edit size={16}/></button>
                                         <button onClick={() => handleDelete(item.id, activeTab)} className="p-2 hover:bg-slate-100 rounded text-red-600"><Icons.Trash2 size={16}/></button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                    </div>
                )}
             </>
         )}
      </main>

      {/* Main Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                 <h2 className="text-xl font-bold">{modalMode === 'create' ? '新建' : '编辑'} - {activeTab}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Icons.X size={24}/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6">
                 {activeTab === 'portfolios' ? renderPortfolioEditor() : renderGenericEditor()}
             </div>

             <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                 <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-white transition-colors">取消</button>
                 <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                     保存更改
                 </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};