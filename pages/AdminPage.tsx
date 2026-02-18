import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Logo } from '../components/Logo';
import { StudentPortfolio, ContentBlock, ContentBlockType } from '../types';

const BLOCK_TYPES: { type: ContentBlockType; label: string; icon: any }[] = [
  { type: 'profile_header', label: '个人简介头图', icon: Icons.UserCircle },
  { type: 'skills_matrix', label: '技能矩阵', icon: Icons.BarChart2 },
  { type: 'text', label: '富文本段落', icon: Icons.AlignLeft },
  { type: 'image_grid', label: '图片/Bento网格', icon: Icons.Grid },
  { type: 'project_highlight', label: 'STAR项目亮点', icon: Icons.Star },
  { type: 'timeline_node', label: '时间轴节点', icon: Icons.GitCommit },
  { type: 'video', label: '视频展示', icon: Icons.Video },
  { type: 'section_heading', label: '分节标题', icon: Icons.Heading },
  { type: 'info_list', label: '信息卡片组', icon: Icons.List },
  { type: 'table', label: '数据表格', icon: Icons.Table },
];

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<StudentPortfolio[]>([]);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [formData, setFormData] = useState<Partial<StudentPortfolio>>({});
  const [aiConfigOpen, setAiConfigOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState({ apiKey: '', baseUrl: '', model: '' });

  // Auth & Init
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate('/login');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) navigate('/login');
    });

    const savedAi = localStorage.getItem('SM_AI_CONFIG');
    if (savedAi) setAiConfig(JSON.parse(savedAi));

    fetchPortfolios();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchPortfolios = async () => {
    const { data } = await supabase.from('student_portfolios').select('*').order('created_at', { ascending: false });
    if (data) setPortfolios(data);
  };

  const saveAiConfig = () => {
    localStorage.setItem('SM_AI_CONFIG', JSON.stringify(aiConfig));
    setAiConfigOpen(false);
  };

  const handleEdit = (p: StudentPortfolio) => {
    setEditingId(p.id!);
    setFormData(JSON.parse(JSON.stringify(p))); // Deep copy
  };

  const handleCreate = () => {
    setEditingId('new');
    setFormData({
      student_name: '新学员',
      slug: `student-${Date.now()}`,
      access_password: '123',
      content_blocks: [],
      theme_config: { theme: 'tech_dark' }
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这个档案吗？')) return;
    await supabase.from('student_portfolios').delete().eq('id', id);
    fetchPortfolios();
  };

  const handleSave = async () => {
    if (!formData.student_name || !formData.slug) return alert('请填写姓名和Slug');
    
    // Clean up data before save if needed
    const payload = { ...formData };
    
    try {
      if (editingId === 'new') {
        const { error } = await supabase.from('student_portfolios').insert([payload]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('student_portfolios').update(payload).eq('id', editingId);
        if (error) throw error;
      }
      setEditingId(null);
      fetchPortfolios();
    } catch (e: any) {
      alert('保存失败: ' + e.message);
    }
  };

  // Block Helpers
  const addBlock = (type: ContentBlockType) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      data: {}
    };
    // Init default data structures
    if (type === 'skills_matrix') newBlock.data.skills_categories = [{ name: 'Core Skills', layout: 'bar', items: [] }];
    
    setFormData(prev => ({
      ...prev,
      content_blocks: [...(prev.content_blocks || []), newBlock]
    }));
  };

  const updateContentBlock = (id: string, key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      content_blocks: prev.content_blocks?.map(b => 
        b.id === id ? { ...b, data: { ...b.data, [key]: value } } : b
      )
    }));
  };
  
  const moveBlock = (index: number, direction: -1 | 1) => {
    if (!formData.content_blocks) return;
    const newBlocks = [...formData.content_blocks];
    if (index + direction < 0 || index + direction >= newBlocks.length) return;
    
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + direction];
    newBlocks[index + direction] = temp;
    
    setFormData(prev => ({ ...prev, content_blocks: newBlocks }));
  };

  const removeBlock = (index: number) => {
    if (!window.confirm('Remove this block?')) return;
    setFormData(prev => ({
      ...prev,
      content_blocks: prev.content_blocks?.filter((_, i) => i !== index)
    }));
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  if (editingId) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        {/* Editor Header */}
        <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-4">
             <button onClick={() => setEditingId(null)} className="p-2 hover:bg-slate-100 rounded-full"><Icons.ArrowLeft /></button>
             <h2 className="font-bold text-lg">{editingId === 'new' ? '新建档案' : '编辑档案'}</h2>
           </div>
           <div className="flex gap-2">
             <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">保存</button>
           </div>
        </div>

        <div className="max-w-5xl mx-auto p-6 space-y-8">
           {/* Basic Info */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                 <label className="block text-xs font-bold text-slate-500 mb-1">学生姓名</label>
                 <input className="w-full border p-2 rounded" value={formData.student_name} onChange={e => setFormData({...formData, student_name: e.target.value})} />
              </div>
              <div className="col-span-2">
                 <label className="block text-xs font-bold text-slate-500 mb-1">URL Slug (唯一)</label>
                 <input className="w-full border p-2 rounded" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1">访问密码</label>
                 <input className="w-full border p-2 rounded" value={formData.access_password} onChange={e => setFormData({...formData, access_password: e.target.value})} />
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1">主题风格</label>
                 <select className="w-full border p-2 rounded" value={formData.theme_config?.theme} onChange={e => setFormData({...formData, theme_config: { ...formData.theme_config, theme: e.target.value as any }})}>
                    <option value="tech_dark">科技黑 (Tech Dark)</option>
                    <option value="academic_light">学术白 (Academic)</option>
                    <option value="creative_color">活力橙 (Creative)</option>
                 </select>
              </div>
           </div>

           {/* Content Blocks */}
           <div className="space-y-4">
              {formData.content_blocks?.map((block, idx) => (
                 <div key={block.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center handle cursor-move">
                       <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                          <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs">{idx + 1}</span>
                          {(BLOCK_TYPES.find(t => t.type === block.type) || { label: block.type }).label}
                       </div>
                       <div className="flex items-center gap-1">
                          <button onClick={() => moveBlock(idx, -1)} disabled={idx === 0} className="p-1.5 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-30"><Icons.ArrowUp size={16}/></button>
                          <button onClick={() => moveBlock(idx, 1)} disabled={idx === (formData.content_blocks?.length || 0) - 1} className="p-1.5 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-30"><Icons.ArrowDown size={16}/></button>
                          <button onClick={() => removeBlock(idx)} className="p-1.5 hover:bg-red-100 hover:text-red-500 rounded text-slate-500 ml-2"><Icons.Trash2 size={16}/></button>
                       </div>
                    </div>
                    
                    <div className="p-4">
                        <BlockEditor block={block} updateContentBlock={updateContentBlock} />
                    </div>
                 </div>
              ))}
           </div>

           {/* Add Block */}
           <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
              <p className="text-slate-500 mb-4 font-bold">添加内容模块</p>
              <div className="flex flex-wrap justify-center gap-3">
                 {BLOCK_TYPES.map(t => (
                    <button key={t.type} onClick={() => addBlock(t.type)} className="flex items-center gap-2 px-4 py-2 bg-white border hover:border-blue-500 hover:text-blue-600 rounded-lg shadow-sm transition-colors text-sm font-medium">
                       <t.icon size={16} /> {t.label}
                    </button>
                 ))}
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
         <Logo />
         <div className="flex gap-4">
            <button onClick={() => setAiConfigOpen(true)} className="flex items-center gap-2 text-slate-600 hover:text-blue-600"><Icons.Bot size={18} /> AI设置</button>
            <button onClick={() => supabase.auth.signOut()} className="text-slate-600 hover:text-red-600">退出</button>
         </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
         <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">档案管理</h1>
            <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
               <Icons.Plus size={18} /> 新建档案
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map(p => (
               <div key={p.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <h3 className="font-bold text-lg text-slate-900">{p.student_name}</h3>
                        <p className="text-xs text-slate-500 font-mono mt-1">/s/{p.slug}</p>
                     </div>
                     <span className={`px-2 py-1 rounded text-xs font-bold ${p.theme_config?.theme === 'tech_dark' ? 'bg-slate-900 text-white' : p.theme_config?.theme === 'creative_color' ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                        {p.theme_config?.theme || 'Default'}
                     </span>
                  </div>
                  
                  <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
                     <button onClick={() => handleEdit(p)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded font-medium text-sm">编辑</button>
                     <button onClick={() => window.open(`/#/s/${p.slug}`, '_blank')} className="px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded"><Icons.ExternalLink size={16} /></button>
                     <button onClick={() => handleDelete(p.id!)} className="px-3 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded"><Icons.Trash2 size={16} /></button>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* AI Config Modal */}
      {aiConfigOpen && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white p-6 rounded-xl w-full max-w-md">
               <h3 className="font-bold text-lg mb-4">AI 翻译配置</h3>
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">API Base URL</label>
                     <input className="w-full border p-2 rounded" placeholder="https://api.openai.com/v1" value={aiConfig.baseUrl} onChange={e => setAiConfig({...aiConfig, baseUrl: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">API Key</label>
                     <input className="w-full border p-2 rounded" type="password" value={aiConfig.apiKey} onChange={e => setAiConfig({...aiConfig, apiKey: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Model</label>
                     <input className="w-full border p-2 rounded" placeholder="gpt-3.5-turbo" value={aiConfig.model} onChange={e => setAiConfig({...aiConfig, model: e.target.value})} />
                  </div>
               </div>
               <div className="mt-6 flex justify-end gap-2">
                  <button onClick={() => setAiConfigOpen(false)} className="px-4 py-2 text-slate-600">取消</button>
                  <button onClick={saveAiConfig} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">保存</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

// Sub-component for editing specific block data
const BlockEditor: React.FC<{ block: ContentBlock; updateContentBlock: (id: string, key: string, val: any) => void }> = ({ block, updateContentBlock }) => {
  const b = block;
  
  // Generic URL List Editor
  const UrlsEditor = ({ label = "URL列表 (一行一个)" }) => (
    <div className="mb-2">
      <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label>
      <textarea 
         className="w-full border p-2 rounded text-sm font-mono h-20"
         value={b.data.urls?.join('\n') || ''}
         onChange={e => updateContentBlock(b.id, 'urls', e.target.value.split('\n').filter(s => s.trim()))}
         placeholder="https://image.com/1.png&#10;https://image.com/2.png"
      />
    </div>
  );

  switch (block.type) {
    case 'profile_header':
       return (
          <div className="grid gap-4">
             <input className="border p-2 rounded w-full" placeholder="主标题/Title (e.g. Future Innovator)" value={b.data.student_title || ''} onChange={e => updateContentBlock(b.id, 'student_title', e.target.value)} />
             <textarea className="border p-2 rounded w-full h-24" placeholder="个人简介/Bio" value={b.data.summary_bio || ''} onChange={e => updateContentBlock(b.id, 'summary_bio', e.target.value)} />
             <input className="border p-2 rounded w-full" placeholder="头像 URL" value={b.data.avatar_url || ''} onChange={e => updateContentBlock(b.id, 'avatar_url', e.target.value)} />
          </div>
       );
    case 'text':
       return (
          <div className="grid gap-4">
             <input className="border p-2 rounded w-full font-bold" placeholder="段落标题 (可选)" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} />
             <textarea className="border p-2 rounded w-full h-32" placeholder="Markdown 内容" value={b.data.content || ''} onChange={e => updateContentBlock(b.id, 'content', e.target.value)} />
          </div>
       );
    case 'image_grid':
        return (
           <div className="grid gap-4">
              <input className="border p-2 rounded w-full font-bold" placeholder="网格标题 (可选)" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} />
              <UrlsEditor />
           </div>
        );
    case 'video':
        return (
           <div className="grid gap-4">
              <input className="border p-2 rounded w-full font-bold" placeholder="视频标题 (可选)" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} />
              <UrlsEditor label="视频链接/Iframe (支持多个)" />
           </div>
        );
    case 'timeline_node':
       return (
          <div className="grid gap-4">
             <div className="flex gap-2">
                <input className="border p-2 rounded w-32" placeholder="时间/Date" value={b.data.date || ''} onChange={e => updateContentBlock(b.id, 'date', e.target.value)} />
                <input className="border p-2 rounded flex-1 font-bold" placeholder="节点标题" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} />
             </div>
             <textarea className="border p-2 rounded w-full h-24" placeholder="详细内容" value={b.data.content || ''} onChange={e => updateContentBlock(b.id, 'content', e.target.value)} />
             <UrlsEditor label="相关图片/视频链接" />
          </div>
       );
    case 'section_heading':
       return <input className="border p-2 rounded w-full font-bold text-lg" placeholder="分节标题内容" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} />;
    case 'project_highlight':
       return (
          <div className="space-y-4">
             <div className="flex gap-2">
                <input className="border p-2 rounded w-32" placeholder="Date" value={b.data.date || ''} onChange={e => updateContentBlock(b.id, 'date', e.target.value)} />
                <input className="border p-2 rounded flex-1 font-bold" placeholder="项目标题" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <textarea className="border p-2 rounded h-20" placeholder="Situation (背景)" value={b.data.star_situation || ''} onChange={e => updateContentBlock(b.id, 'star_situation', e.target.value)} />
                <textarea className="border p-2 rounded h-20" placeholder="Task (任务)" value={b.data.star_task || ''} onChange={e => updateContentBlock(b.id, 'star_task', e.target.value)} />
                <textarea className="border p-2 rounded h-20" placeholder="Action (行动)" value={b.data.star_action || ''} onChange={e => updateContentBlock(b.id, 'star_action', e.target.value)} />
                <textarea className="border p-2 rounded h-20" placeholder="Result (结果)" value={b.data.star_result || ''} onChange={e => updateContentBlock(b.id, 'star_result', e.target.value)} />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">证据链接 (图片/视频)</label>
                <textarea 
                   className="w-full border p-2 rounded text-sm font-mono h-20"
                   value={b.data.evidence_urls?.join('\n') || ''}
                   onChange={e => updateContentBlock(b.id, 'evidence_urls', e.target.value.split('\n').filter(s => s.trim()))}
                />
             </div>
          </div>
       );
    case 'skills_matrix':
       return (
          <div className="space-y-6">
             {b.data.skills_categories?.map((cat, catIdx) => (
                <div key={catIdx} className="bg-slate-100 p-4 rounded-lg relative">
                    <button 
                       className="absolute top-2 right-2 text-slate-400 hover:text-red-500" 
                       onClick={() => {
                          const newCats = [...(b.data.skills_categories || [])];
                          newCats.splice(catIdx, 1);
                          updateContentBlock(b.id, 'skills_categories', newCats);
                       }}
                    ><Icons.X size={16} /></button>
                    
                    <div className="flex gap-4 mb-4">
                       <input 
                         className="border p-1 rounded font-bold text-sm bg-white" 
                         placeholder="Category Name" 
                         value={cat.name} 
                         onChange={e => {
                             const newCats = [...(b.data.skills_categories || [])];
                             newCats[catIdx].name = e.target.value;
                             updateContentBlock(b.id, 'skills_categories', newCats);
                         }} 
                       />
                       <select 
                          className="border p-1 rounded text-sm bg-white"
                          value={cat.layout}
                          onChange={e => {
                             const newCats = [...(b.data.skills_categories || [])];
                             newCats[catIdx].layout = e.target.value as any;
                             updateContentBlock(b.id, 'skills_categories', newCats);
                          }}
                       >
                          <option value="bar">Progress Bar</option>
                          <option value="radar">Radar Chart</option>
                          <option value="circle">Circular Gauge</option>
                          <option value="stat_grid">Stat Cards</option>
                       </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {cat.items.map((skill, skIdx) => (
                            <div key={skIdx} className="flex gap-1 items-center bg-white p-1 rounded group/skill border border-slate-200 shadow-sm">
                                <input className="text-xs bg-transparent w-full outline-none px-1" value={skill.name} onChange={e => {
                                    const newCats = [...(b.data.skills_categories || [])]; 
                                    newCats[catIdx].items[skIdx].name = e.target.value;
                                    updateContentBlock(b.id, 'skills_categories', newCats);
                                }} />
                                <input className="text-xs bg-slate-50 border rounded w-12 text-center font-mono" type="number" value={skill.value} onChange={e => {
                                    const newCats = [...(b.data.skills_categories || [])]; 
                                    newCats[catIdx].items[skIdx].value = parseFloat(e.target.value);
                                    updateContentBlock(b.id, 'skills_categories', newCats);
                                }} />
                                <input className="text-[10px] w-8 bg-transparent text-slate-400 text-center outline-none" placeholder="%" value={skill.unit || ''} onChange={e => {
                                    const newCats = [...(b.data.skills_categories || [])]; 
                                    newCats[catIdx].items[skIdx].unit = e.target.value;
                                    updateContentBlock(b.id, 'skills_categories', newCats);
                                }} />
                                <button 
                                  onClick={() => {
                                      const newCats = [...(b.data.skills_categories || [])];
                                      newCats[catIdx].items.splice(skIdx, 1);
                                      updateContentBlock(b.id, 'skills_categories', newCats);
                                  }}
                                  className="text-slate-300 hover:text-red-500 p-0.5 opacity-0 group-hover/skill:opacity-100 transition-opacity"
                                >
                                    <Icons.X size={12} />
                                </button>
                            </div>
                        ))}
                        <button onClick={() => {
                           const newCats = [...(b.data.skills_categories || [])];
                           newCats[catIdx].items.push({ name: 'Skill', value: 80, unit: '%' });
                           updateContentBlock(b.id, 'skills_categories', newCats);
                        }} className="text-xs bg-white border border-dashed border-slate-300 text-slate-500 rounded py-1 hover:bg-slate-50 flex items-center justify-center gap-1">
                           <Icons.Plus size={12} /> Add Item
                        </button>
                    </div>
                </div>
             ))}
             <button onClick={() => {
                const newCats = [...(b.data.skills_categories || []), { name: 'New Category', layout: 'bar', items: [] }];
                updateContentBlock(b.id, 'skills_categories', newCats);
             }} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-bold border border-slate-200">
                + Add Category
             </button>
          </div>
       );
    default: return <div className="text-slate-400 text-xs italic">Generic Editor Active</div>;
  }
};
