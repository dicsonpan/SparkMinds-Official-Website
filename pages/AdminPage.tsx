import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { StudentPortfolio, ContentBlock, ContentBlockType, PortfolioTheme } from '../types';
import { Logo } from '../components/Logo';
import * as Icons from 'lucide-react';

// Default empty portfolio template
const DEFAULT_PORTFOLIO: Partial<StudentPortfolio> = {
  student_name: '新学生',
  slug: '',
  access_password: '123',
  content_blocks: [
    {
      id: 'profile-1',
      type: 'profile_header',
      data: {
        student_title: 'Student Title',
        summary_bio: 'Short bio...',
      }
    }
  ],
  theme_config: {
    theme: 'tech_dark'
  }
};

const BLOCK_TYPES: { type: ContentBlockType; label: string; icon: keyof typeof Icons }[] = [
  { type: 'text', label: '文本段落', icon: 'Type' },
  { type: 'image_grid', label: '图片墙/Bento', icon: 'Image' },
  { type: 'video', label: '视频嵌入', icon: 'Video' },
  { type: 'timeline_node', label: '时间轴节点', icon: 'GitCommit' },
  { type: 'project_highlight', label: 'STAR项目亮点', icon: 'Star' },
  { type: 'skills_matrix', label: '技能矩阵', icon: 'BarChart2' },
  { type: 'section_heading', label: '章节标题', icon: 'Heading' },
  { type: 'info_list', label: '信息列表', icon: 'List' },
  { type: 'table', label: '数据表格', icon: 'Table' },
];

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<StudentPortfolio[]>([]);
  const [editingPortfolio, setEditingPortfolio] = useState<StudentPortfolio | null>(null);
  const [showJsonEditor, setShowJsonEditor] = useState(false);

  // Authentication Check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        fetchPortfolios();
      }
    };
    checkAuth();
  }, [navigate]);

  const fetchPortfolios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('student_portfolios')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching portfolios:', error);
    } else {
      setPortfolios(data || []);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleCreate = async () => {
    const slug = prompt("请输入唯一的 URL Slug (例如: alex-2024):");
    if (!slug) return;

    const newPortfolio = {
      ...DEFAULT_PORTFOLIO,
      slug,
      student_name: '新学生',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('student_portfolios')
      .insert([newPortfolio])
      .select()
      .single();

    if (error) {
      alert('创建失败: ' + error.message);
    } else if (data) {
      setPortfolios([data, ...portfolios]);
      setEditingPortfolio(data);
    }
  };

  const handleSave = async () => {
    if (!editingPortfolio || !editingPortfolio.id) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('student_portfolios')
      .update({
        student_name: editingPortfolio.student_name,
        slug: editingPortfolio.slug,
        access_password: editingPortfolio.access_password,
        content_blocks: editingPortfolio.content_blocks,
        theme_config: editingPortfolio.theme_config,
        // Legacy fields for compatibility if needed, though we primarily use content_blocks now
        student_title: editingPortfolio.content_blocks.find(b => b.type === 'profile_header')?.data.student_title,
        summary_bio: editingPortfolio.content_blocks.find(b => b.type === 'profile_header')?.data.summary_bio,
        avatar_url: editingPortfolio.content_blocks.find(b => b.type === 'profile_header')?.data.avatar_url,
        hero_image_url: editingPortfolio.content_blocks.find(b => b.type === 'profile_header')?.data.hero_image_url,
      })
      .eq('id', editingPortfolio.id);

    setLoading(false);
    if (error) {
      alert('保存失败: ' + error.message);
    } else {
      alert('保存成功');
      fetchPortfolios(); // Refresh list
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这个档案吗？此操作无法撤销。')) return;
    
    const { error } = await supabase.from('student_portfolios').delete().eq('id', id);
    if (error) {
      alert('删除失败');
    } else {
      setPortfolios(portfolios.filter(p => p.id !== id));
      if (editingPortfolio?.id === id) setEditingPortfolio(null);
    }
  };

  // --- Content Block Management ---

  const addContentBlock = (type: ContentBlockType) => {
    if (!editingPortfolio) return;
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      data: type === 'table' ? { table_columns: ['列1', '列2'], table_rows: [['数据1', '数据2']] } : {}
    };
    setEditingPortfolio({
      ...editingPortfolio,
      content_blocks: [...editingPortfolio.content_blocks, newBlock]
    });
  };

  const removeContentBlock = (id: string) => {
    if (!editingPortfolio) return;
    if (!window.confirm('确定删除此模块？')) return;
    setEditingPortfolio({
      ...editingPortfolio,
      content_blocks: editingPortfolio.content_blocks.filter(b => b.id !== id)
    });
  };

  const moveContentBlock = (index: number, direction: -1 | 1) => {
    if (!editingPortfolio) return;
    const newBlocks = [...editingPortfolio.content_blocks];
    if (index + direction < 0 || index + direction >= newBlocks.length) return;
    
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + direction];
    newBlocks[index + direction] = temp;
    
    setEditingPortfolio({
      ...editingPortfolio,
      content_blocks: newBlocks
    });
  };

  const updateContentBlock = (id: string, field: string, value: any) => {
    if (!editingPortfolio) return;
    setEditingPortfolio({
      ...editingPortfolio,
      content_blocks: editingPortfolio.content_blocks.map(b => 
        b.id === id ? { ...b, data: { ...b.data, [field]: value } } : b
      )
    });
  };

  // Helper to update deeply nested data within a block
  const updateBlockDataNested = (id: string, path: (string | number)[], value: any) => {
    if (!editingPortfolio) return;
    setEditingPortfolio({
      ...editingPortfolio,
      content_blocks: editingPortfolio.content_blocks.map(b => {
        if (b.id !== id) return b;
        
        // Deep clone data
        const newData = JSON.parse(JSON.stringify(b.data));
        let current = newData;
        
        // Traverse to the parent of the target property
        for (let i = 0; i < path.length - 1; i++) {
          const key = path[i];
          if (current[key] === undefined) {
             // Basic inference: if next key is number, create array, else object
             current[key] = typeof path[i+1] === 'number' ? [] : {};
          }
          current = current[key];
        }
        
        // Set value
        current[path[path.length - 1]] = value;
        return { ...b, data: newData };
      })
    });
  };

  // --- RENDERERS ---

  if (!editingPortfolio) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
               <Logo className="h-8 w-auto" />
               <span className="text-slate-400">|</span>
               <h1 className="text-2xl font-bold text-slate-800">后台管理系统</h1>
            </div>
            <div className="flex gap-4">
              <button onClick={handleLogout} className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium">退出登录</button>
              <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                <Icons.Plus size={18} /> 新建档案
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{p.student_name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-1">/s/{p.slug}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded font-bold ${p.theme_config?.theme === 'tech_dark' ? 'bg-slate-800 text-white' : 'bg-orange-100 text-orange-800'}`}>
                      {p.theme_config?.theme || 'Default'}
                    </span>
                 </div>
                 <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-4">
                    <button onClick={() => window.open(`/#/s/${p.slug}`, '_blank')} className="text-slate-400 hover:text-blue-500" title="预览">
                       <Icons.ExternalLink size={18} />
                    </button>
                    <div className="flex gap-3">
                       <button onClick={() => handleDelete(p.id!)} className="text-red-400 hover:text-red-600 font-medium text-sm">删除</button>
                       <button onClick={() => setEditingPortfolio(p)} className="bg-slate-900 text-white px-4 py-1.5 rounded-md text-sm font-bold hover:bg-slate-700">编辑</button>
                    </div>
                 </div>
              </div>
            ))}
          </div>
          {loading && <div className="text-center py-12 text-slate-400">加载中...</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {/* Editor Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-4">
            <button onClick={() => setEditingPortfolio(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
               <Icons.ArrowLeft size={20} />
            </button>
            <h2 className="font-bold text-lg text-slate-800">编辑: {editingPortfolio.student_name}</h2>
         </div>
         <div className="flex gap-3">
            <button onClick={() => setShowJsonEditor(!showJsonEditor)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg font-mono text-xs flex items-center gap-2">
               <Icons.Code size={16} /> JSON
            </button>
            <button onClick={() => window.open(`/#/s/${editingPortfolio.slug}`, '_blank')} className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-bold text-sm">
               预览
            </button>
            <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center gap-2">
               {loading ? <Icons.Loader2 className="animate-spin" size={16}/> : <Icons.Save size={16}/>} 保存
            </button>
         </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
         
         {/* Sidebar: Settings */}
         <div className="md:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Icons.Settings size={18}/> 基础设置</h3>
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">学生姓名</label>
                     <input 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={editingPortfolio.student_name}
                        onChange={e => setEditingPortfolio({...editingPortfolio, student_name: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">URL Slug (唯一)</label>
                     <input 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={editingPortfolio.slug}
                        onChange={e => setEditingPortfolio({...editingPortfolio, slug: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">访问密码</label>
                     <input 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                        value={editingPortfolio.access_password}
                        onChange={e => setEditingPortfolio({...editingPortfolio, access_password: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">主题风格</label>
                     <select 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={editingPortfolio.theme_config?.theme}
                        onChange={e => setEditingPortfolio({
                           ...editingPortfolio, 
                           theme_config: { ...editingPortfolio.theme_config, theme: e.target.value as PortfolioTheme }
                        })}
                     >
                        <option value="tech_dark">科技黑 (Tech Dark)</option>
                        <option value="academic_light">学术白 (Academic Light)</option>
                        <option value="creative_color">活力橙 (Creative Color)</option>
                     </select>
                  </div>
               </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-24">
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Icons.PlusSquare size={18}/> 添加模块</h3>
               <div className="grid grid-cols-2 gap-2">
                  {BLOCK_TYPES.map(type => (
                     <button
                        key={type.type}
                        onClick={() => addContentBlock(type.type)}
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all text-xs font-medium text-slate-600 gap-2"
                     >
                        {React.createElement(Icons[type.icon] as React.ElementType, { size: 20 })}
                        {type.label}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         {/* Main Content: Blocks */}
         <div className="md:col-span-8 space-y-6">
            {editingPortfolio.content_blocks.map((b, idx) => (
               <div key={b.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group">
                  {/* Block Header */}
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{b.type}</span>
                        <span className="text-xs text-slate-400 font-mono">#{idx + 1}</span>
                     </div>
                     <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveContentBlock(idx, -1)} className="p-1.5 hover:bg-slate-200 rounded text-slate-500" disabled={idx === 0}><Icons.ArrowUp size={16}/></button>
                        <button onClick={() => moveContentBlock(idx, 1)} className="p-1.5 hover:bg-slate-200 rounded text-slate-500" disabled={idx === editingPortfolio.content_blocks.length - 1}><Icons.ArrowDown size={16}/></button>
                        <div className="w-px h-4 bg-slate-300 mx-1"></div>
                        <button onClick={() => removeContentBlock(b.id)} className="p-1.5 hover:bg-red-100 hover:text-red-500 rounded text-slate-400"><Icons.Trash2 size={16}/></button>
                     </div>
                  </div>

                  {/* Block Content Editor */}
                  <div className="p-4 md:p-6 space-y-4">
                     {/* JSON Fallback for complex types or if toggle is on */}
                     {showJsonEditor ? (
                        <textarea 
                           className="w-full h-40 font-mono text-xs bg-slate-900 text-green-400 p-4 rounded-lg outline-none"
                           value={JSON.stringify(b.data, null, 2)}
                           onChange={(e) => {
                              try {
                                 const parsed = JSON.parse(e.target.value);
                                 setEditingPortfolio({
                                    ...editingPortfolio,
                                    content_blocks: editingPortfolio.content_blocks.map(block => block.id === b.id ? { ...block, data: parsed } : block)
                                 });
                              } catch(err) { /* ignore invalid json while typing */ }
                           }}
                        />
                     ) : (
                        <>
                           {/* === PROFILE HEADER === */}
                           {b.type === 'profile_header' && (
                              <div className="space-y-4">
                                 <div>
                                    <label className="label-sm">Avatar URL</label>
                                    <input className="input-std" value={b.data.avatar_url || ''} onChange={e => updateContentBlock(b.id, 'avatar_url', e.target.value)} placeholder="https://..." />
                                 </div>
                                 <div>
                                    <label className="label-sm">Student Title / Role</label>
                                    <input className="input-std font-bold" value={b.data.student_title || ''} onChange={e => updateContentBlock(b.id, 'student_title', e.target.value)} placeholder="e.g. Future AI Scientist" />
                                 </div>
                                 <div>
                                    <label className="label-sm">Summary / Bio</label>
                                    <textarea className="input-std h-24" value={b.data.summary_bio || ''} onChange={e => updateContentBlock(b.id, 'summary_bio', e.target.value)} placeholder="Introduction..." />
                                 </div>
                              </div>
                           )}

                           {/* === TEXT / SECTION HEADING === */}
                           {(b.type === 'text' || b.type === 'section_heading' || b.type === 'timeline_node') && (
                              <div className="space-y-4">
                                 <div>
                                    <label className="label-sm">Title</label>
                                    <input className="input-std font-bold" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} placeholder="Title" />
                                 </div>
                                 {b.type === 'timeline_node' && (
                                    <div>
                                        <label className="label-sm">Date / Year</label>
                                        <input className="input-std" value={b.data.date || ''} onChange={e => updateContentBlock(b.id, 'date', e.target.value)} placeholder="e.g. 2023 Dec" />
                                    </div>
                                 )}
                                 {b.type !== 'section_heading' && (
                                    <div>
                                       <label className="label-sm">Content</label>
                                       <textarea className="input-std h-32" value={b.data.content || ''} onChange={e => updateContentBlock(b.id, 'content', e.target.value)} placeholder="Markdown supported..." />
                                    </div>
                                 )}
                              </div>
                           )}

                           {/* === IMAGE GRID / VIDEO / TIMELINE (URLs) === */}
                           {(b.type === 'image_grid' || b.type === 'video' || b.type === 'timeline_node') && (
                              <div className="mt-4">
                                 <label className="label-sm">Media URLs (One per line)</label>
                                 <textarea 
                                    className="input-std h-24 font-mono text-xs" 
                                    value={b.data.urls?.join('\n') || ''} 
                                    onChange={e => updateContentBlock(b.id, 'urls', e.target.value.split('\n'))} 
                                    placeholder="https://image1.jpg&#10;https://image2.jpg" 
                                 />
                                 <p className="text-[10px] text-slate-400 mt-1">Supports image URLs or &lt;iframe&gt; codes for videos.</p>
                              </div>
                           )}

                           {/* === INFO LIST & TABLE (Simplified View) === */}
                           {(b.type === 'info_list' || b.type === 'table') && (
                                          <div>
                                              <input className="font-bold border-b mb-4 w-full py-1 focus:border-blue-500 outline-none" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} placeholder={b.type === 'table' ? '表格标题' : '信息栏标题'} />
                                              
                                              {/* === INFO LIST EDITOR === */}
                                              {b.type === 'info_list' && (
                                                  <div className="space-y-3">
                                                      {b.data.info_items?.map((item: any, idx: number) => (
                                                          <div key={idx} className="flex gap-3 items-end bg-slate-50 p-3 rounded-lg border border-slate-200 group/item">
                                                              {/* Icon Input */}
                                                              <div className="w-24 shrink-0">
                                                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Icon (Lucide)</label>
                                                                  <div className="flex items-center gap-2 bg-white border rounded px-2 py-1.5 focus-within:ring-1 focus-within:ring-orange-200">
                                                                      <Icons.Smile size={14} className="text-slate-300" />
                                                                      <input 
                                                                          className="w-full text-xs outline-none font-mono text-slate-600" 
                                                                          value={item.icon || ''} 
                                                                          onChange={e => updateBlockDataNested(b.id, ['info_items', idx, 'icon'], e.target.value)} 
                                                                          placeholder="Star" 
                                                                      />
                                                                  </div>
                                                              </div>
                                                              
                                                              {/* Label Input */}
                                                              <div className="w-1/3 shrink-0">
                                                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Label (Key)</label>
                                                                  <input 
                                                                      className="w-full text-xs font-bold border rounded px-2 py-1.5 focus:border-orange-300 outline-none" 
                                                                      value={item.label} 
                                                                      onChange={e => updateBlockDataNested(b.id, ['info_items', idx, 'label'], e.target.value)} 
                                                                      placeholder="标签 (e.g. 学校)" 
                                                                  />
                                                              </div>

                                                              {/* Value Input */}
                                                              <div className="flex-1 min-w-0">
                                                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Value</label>
                                                                  <input 
                                                                      className="w-full text-xs border rounded px-2 py-1.5 focus:border-orange-300 outline-none" 
                                                                      value={item.value} 
                                                                      onChange={e => updateBlockDataNested(b.id, ['info_items', idx, 'value'], e.target.value)} 
                                                                      placeholder="内容" 
                                                                  />
                                                              </div>

                                                              {/* Delete Button */}
                                                              <button 
                                                                  onClick={() => {
                                                                      const newItems = [...(b.data.info_items || [])];
                                                                      newItems.splice(idx, 1);
                                                                      updateContentBlock(b.id, 'info_items', newItems);
                                                                  }} 
                                                                  className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors self-end mb-[1px]"
                                                                  title="删除此项"
                                                              >
                                                                  <Icons.Trash2 size={16} />
                                                              </button>
                                                          </div>
                                                      ))}
                                                      
                                                      <button 
                                                          onClick={() => updateContentBlock(b.id, 'info_items', [...(b.data.info_items || []), { icon: 'Star', label: '', value: '' }])} 
                                                          className="w-full py-2.5 text-xs font-bold text-orange-600 border border-dashed border-orange-300 rounded-lg hover:bg-orange-50 flex items-center justify-center gap-2 transition-colors"
                                                      >
                                                          <Icons.Plus size={14} /> 添加信息项 (Key-Value)
                                                      </button>
                                                  </div>
                                              )}

                                              {/* === TABLE EDITOR === */}
                                              {b.type === 'table' && (
                                                  <div className="space-y-2">
                                                      <div className="text-xs text-slate-400 italic mb-2">简单编辑模式：点击单元格直接修改。如需调整列结构，建议删除重建或确保数据对应。</div>
                                                      {/* Table Columns Editor */}
                                                      <div className="flex gap-1 overflow-x-auto pb-2">
                                                          {b.data.table_columns?.map((col: string, cIdx: number) => (
                                                              <input 
                                                                  key={cIdx}
                                                                  className="min-w-[80px] w-full text-xs font-bold bg-slate-100 border border-slate-200 rounded px-2 py-1 focus:border-green-400 outline-none"
                                                                  value={col}
                                                                  onChange={e => {
                                                                      const newCols = [...(b.data.table_columns || [])];
                                                                      newCols[cIdx] = e.target.value;
                                                                      updateContentBlock(b.id, 'table_columns', newCols);
                                                                  }}
                                                              />
                                                          ))}
                                                      </div>
                                                      {/* Table Rows Editor */}
                                                      <div className="space-y-1 max-h-40 overflow-y-auto">
                                                          {b.data.table_rows?.map((row: string[], rIdx: number) => (
                                                              <div key={rIdx} className="flex gap-1 items-center">
                                                                  {row.map((cell: string, cIdx: number) => (
                                                                      <input 
                                                                          key={cIdx}
                                                                          className="min-w-[80px] w-full text-xs border rounded px-2 py-1 focus:border-green-400 outline-none"
                                                                          value={cell}
                                                                          onChange={e => updateBlockDataNested(b.id, ['table_rows', rIdx, cIdx], e.target.value)}
                                                                      />
                                                                  ))}
                                                                  <button 
                                                                      onClick={() => {
                                                                          const newRows = [...(b.data.table_rows || [])];
                                                                          newRows.splice(rIdx, 1);
                                                                          updateContentBlock(b.id, 'table_rows', newRows);
                                                                      }}
                                                                      className="text-red-300 hover:text-red-500 px-1"
                                                                  >
                                                                      <Icons.X size={12}/>
                                                                  </button>
                                                              </div>
                                                          ))}
                                                      </div>
                                                      <div className="flex gap-2 mt-2">
                                                          <button 
                                                              onClick={() => updateContentBlock(b.id, 'table_rows', [...(b.data.table_rows || []), new Array((b.data.table_columns || []).length).fill('')])}
                                                              className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded border border-green-200 hover:bg-green-100 font-bold"
                                                          >
                                                              + 添加行
                                                          </button>
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

                           {/* === STAR PROJECT HIGHLIGHT === */}
                           {b.type === 'project_highlight' && (
                              <div className="space-y-4">
                                 <input className="input-std font-bold text-lg" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} placeholder="Project Name" />
                                 <div className="grid grid-cols-2 gap-4">
                                    <div>
                                       <label className="label-sm text-blue-500">Situation</label>
                                       <textarea className="input-std h-24" value={b.data.star_situation || ''} onChange={e => updateContentBlock(b.id, 'star_situation', e.target.value)} />
                                    </div>
                                    <div>
                                       <label className="label-sm text-purple-500">Task</label>
                                       <textarea className="input-std h-24" value={b.data.star_task || ''} onChange={e => updateContentBlock(b.id, 'star_task', e.target.value)} />
                                    </div>
                                    <div>
                                       <label className="label-sm text-orange-500">Action</label>
                                       <textarea className="input-std h-24" value={b.data.star_action || ''} onChange={e => updateContentBlock(b.id, 'star_action', e.target.value)} />
                                    </div>
                                    <div>
                                       <label className="label-sm text-green-500">Result</label>
                                       <textarea className="input-std h-24" value={b.data.star_result || ''} onChange={e => updateContentBlock(b.id, 'star_result', e.target.value)} />
                                    </div>
                                 </div>
                                 <div>
                                    <label className="label-sm">Evidence Image URLs</label>
                                    <textarea className="input-std h-16 font-mono text-xs" value={b.data.evidence_urls?.join('\n') || ''} onChange={e => updateContentBlock(b.id, 'evidence_urls', e.target.value.split('\n'))} placeholder="One URL per line" />
                                 </div>
                              </div>
                           )}

                           {/* === SKILLS MATRIX === */}
                           {b.type === 'skills_matrix' && (
                              <div className="p-4 bg-slate-50 rounded border border-dashed border-slate-300 text-center">
                                 <p className="text-sm text-slate-500 mb-2">Skill Matrix editor is complex.</p>
                                 <button onClick={() => setShowJsonEditor(true)} className="text-blue-600 hover:underline text-xs font-bold">Switch to JSON Editor to modify skills</button>
                              </div>
                           )}
                        </>
                     )}
                  </div>
               </div>
            ))}
            
            {editingPortfolio.content_blocks.length === 0 && (
               <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-slate-400">还没有内容模块，从左侧添加一个吧！</p>
               </div>
            )}
         </div>
      </div>

      <style>{`
         .input-std {
            width: 100%;
            border: 1px solid #cbd5e1;
            border-radius: 0.5rem;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            outline: none;
            transition: all 0.2s;
         }
         .input-std:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
         }
         .label-sm {
            display: block;
            font-size: 0.75rem;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 0.25rem;
         }
      `}</style>
    </div>
  );
};
