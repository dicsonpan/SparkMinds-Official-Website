import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { StudentPortfolio, ContentBlock, PortfolioTheme, SkillCategory, SkillItem } from '../types';
import * as Icons from 'lucide-react';
import { Logo } from '../components/Logo';

// Types
type PolishScope = 'profile' | 'skills' | 'content';

interface AIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

const AI_SETTINGS_KEY = 'SM_AI_CONFIG';

const AI_PROVIDERS = [
  { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o' },
  { name: 'Cerebras', baseUrl: 'https://api.cerebras.ai/v1', defaultModel: 'llama3.1-70b' },
  { name: 'SiliconFlow', baseUrl: 'https://api.siliconflow.cn/v1', defaultModel: 'deepseek-ai/DeepSeek-V3' },
  { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', defaultModel: 'deepseek-chat' },
];

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<StudentPortfolio[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<StudentPortfolio>>({});
  
  // AI Config State
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o' // Default to a capable model
  });
  const [showAiSettings, setShowAiSettings] = useState(false);
  
  // Polish State
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishScope, setPolishScope] = useState<PolishScope | null>(null);
  const [prePolishState, setPrePolishState] = useState<any>(null);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    const { data, error } = await supabase
      .from('student_portfolios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setPortfolios(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const savedConfig = localStorage.getItem(AI_SETTINGS_KEY);
    if (savedConfig) {
      setAiConfig(JSON.parse(savedConfig));
    }
  }, []);

  const saveAiConfig = () => {
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(aiConfig));
    setShowAiSettings(false);
  };

  const applyAiPreset = (providerName: string) => {
    const provider = AI_PROVIDERS.find(p => p.name === providerName);
    if (provider) {
      setAiConfig(prev => ({
        ...prev,
        baseUrl: provider.baseUrl,
        model: provider.defaultModel
      }));
    }
  };

  const handleEdit = (item: StudentPortfolio) => {
    setEditingItem(JSON.parse(JSON.stringify(item))); // Deep copy
    setIsEditing(true);
  };

  const handleCreate = () => {
    setEditingItem({
        slug: '',
        student_name: '',
        student_title: '',
        summary_bio: '',
        access_password: '',
        content_blocks: [],
        skills: [],
        theme_config: { theme: 'tech_dark' }
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
      try {
          if (editingItem.id) {
              const { error } = await supabase.from('student_portfolios').update(editingItem).eq('id', editingItem.id);
              if (error) throw error;
          } else {
              const { error } = await supabase.from('student_portfolios').insert([editingItem]);
              if (error) throw error;
          }
          setIsEditing(false);
          fetchData();
      } catch (e: any) {
          alert('Error saving: ' + e.message);
      }
  };
  
  const handleDelete = async (id: number) => {
      if(!confirm('Are you sure you want to delete this portfolio?')) return;
      await supabase.from('student_portfolios').delete().eq('id', id);
      fetchData();
  };

  // --- AI Polish Logic ---
  const handleAIPolish = async (scope: PolishScope) => {
    if (!aiConfig.apiKey) return alert("请先在系统设置中配置 API Key");
    if (isPolishing) return;
    if (!editingItem) return;

    // 1. Backup
    setPrePolishState(JSON.parse(JSON.stringify(editingItem)));
    setPolishScope(scope);
    setIsPolishing(true);

    try {
        let payload = {};
        let specificPrompt = "";

        if (scope === 'profile') {
            payload = { student_title: editingItem.student_title, summary_bio: editingItem.summary_bio };
            specificPrompt = "Focus on 'student_title' (make it catchy/professional) and 'summary_bio' (compelling narrative). Output only these fields in JSON.";
        } else if (scope === 'skills') {
            payload = { skills: editingItem.skills };
            specificPrompt = "Focus on 'skills'. Standardize skill names, ensure categories are logical. Output only the 'skills' array in JSON.";
        } else if (scope === 'content') {
            // Strip URLs to save tokens, but send all text fields including dates for context
            payload = {
                content_blocks: (editingItem.content_blocks || []).map((b: any) => ({
                    id: b.id, 
                    type: b.type, 
                    data: { 
                        title: b.data.title,
                        content: b.data.content,
                        date: b.data.date,
                        star_situation: b.data.star_situation,
                        star_task: b.data.star_task,
                        star_action: b.data.star_action,
                        star_result: b.data.star_result
                    }
                }))
            };
            specificPrompt = `
                Focus on the 'content_blocks' array. 
                For each block, you MUST REWRITE the text fields inside 'data' to be academic, professional, and impressive.
                
                Specific targets per block type:
                - For 'project_highlight' (STAR): Rewrite 'title', 'star_situation', 'star_task', 'star_action', 'star_result'. Use strong action verbs and quantitative metrics.
                - For 'timeline_node': Rewrite 'title' and 'content'. Make the title concise (e.g., "Technology Initiation" -> "科创启蒙") and the content descriptive.
                - For 'section_heading': Upgrade the 'title' if it's too casual.
                
                CRITICAL RULES:
                1. You MUST return the exact same 'id' for each block. This is used to merge the changes.
                2. Do NOT change the 'type' of the blocks.
                3. Keep the language in Simplified Chinese (简体中文).
                4. Output the full JSON object containing the 'content_blocks' array.
            `;
        }

        const systemPrompt = `You are a professional Ivy League admissions editor.
            TASK: Polish the text content to be more academic and professional.
            LANGUAGE: Simplified Chinese (简体中文).
            INSTRUCTION: ${specificPrompt}
            RETURN: Raw JSON only.`;

        const response = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiConfig.apiKey}` },
            body: JSON.stringify({
              model: aiConfig.model,
              messages: [{ role: "system", content: systemPrompt }, { role: "user", content: JSON.stringify(payload) }],
              temperature: 0.4
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        let content = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
        const polishedData = JSON.parse(content);

        // Merge logic
        setEditingItem((prev: any) => {
            const newItem = { ...prev };
            if (scope === 'profile') {
                newItem.student_title = polishedData.student_title || prev.student_title;
                newItem.summary_bio = polishedData.summary_bio || prev.summary_bio;
            } else if (scope === 'skills') {
                newItem.skills = polishedData.skills || prev.skills;
            } else if (scope === 'content' && polishedData.content_blocks) {
                // Merge text back into blocks, preserving URLs from previous state
                newItem.content_blocks = (prev.content_blocks || []).map((oldBlock: ContentBlock) => {
                    const polishedBlock = polishedData.content_blocks.find((pb: any) => pb.id === oldBlock.id);
                    if (polishedBlock && polishedBlock.data) {
                        return {
                            ...oldBlock,
                            data: {
                                ...oldBlock.data,
                                // Explicitly overwrite text fields if they exist in polished data
                                title: polishedBlock.data.title !== undefined ? polishedBlock.data.title : oldBlock.data.title,
                                content: polishedBlock.data.content !== undefined ? polishedBlock.data.content : oldBlock.data.content,
                                star_situation: polishedBlock.data.star_situation !== undefined ? polishedBlock.data.star_situation : oldBlock.data.star_situation,
                                star_task: polishedBlock.data.star_task !== undefined ? polishedBlock.data.star_task : oldBlock.data.star_task,
                                star_action: polishedBlock.data.star_action !== undefined ? polishedBlock.data.star_action : oldBlock.data.star_action,
                                star_result: polishedBlock.data.star_result !== undefined ? polishedBlock.data.star_result : oldBlock.data.star_result,
                                // Preserve media and layout fields
                                urls: oldBlock.data.urls, 
                                evidence_urls: oldBlock.data.evidence_urls,
                                layout: oldBlock.data.layout
                            }
                        };
                    }
                    return oldBlock;
                });
            }
            return newItem;
        });

        alert("AI 润色完成！请预览效果。");

    } catch (e: any) {
        console.error(e);
        alert("AI 润色失败: " + e.message);
        setPrePolishState(null);
        setPolishScope(null);
    } finally {
        setIsPolishing(false);
    }
  };
  
  const handleUndoPolish = () => {
      if (prePolishState) {
          setEditingItem(prePolishState);
          setPrePolishState(null);
          setPolishScope(null);
      }
  };

  const handleAcceptPolish = () => {
      setPrePolishState(null);
      setPolishScope(null);
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <Logo className="h-8" />
                    <h1 className="text-2xl font-bold text-slate-800">Portfolio Admin</h1>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowAiSettings(true)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium text-slate-700 flex items-center gap-2">
                        <Icons.Settings size={18} /> AI Settings
                    </button>
                    <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2">
                        <Icons.Plus size={18} /> New Student
                    </button>
                    <button onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium">
                        Logout
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center p-12"><Icons.Loader2 className="animate-spin text-blue-600" size={32} /></div>
            ) : isEditing ? (
                <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h2 className="text-xl font-bold">Editing: {editingItem.student_name || 'New Student'}</h2>
                        <div className="flex gap-2">
                            {prePolishState && (
                                <>
                                    <button onClick={handleUndoPolish} className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-bold text-sm">Undo AI Polish</button>
                                    <button onClick={handleAcceptPolish} className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-bold text-sm">Accept AI Polish</button>
                                </>
                            )}
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">Save Changes</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                         {/* Left Column: Basic Info & Profile */}
                         <div className="space-y-6">
                             <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                 <h3 className="font-bold text-slate-700 mb-4 flex justify-between items-center">
                                     Basic Info
                                     <button 
                                       onClick={() => handleAIPolish('profile')} 
                                       disabled={isPolishing}
                                       className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-purple-200"
                                     >
                                         <Icons.Sparkles size={12} /> AI Polish
                                     </button>
                                 </h3>
                                 <div className="space-y-4">
                                     <div>
                                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Student Name</label>
                                         <input type="text" className="w-full p-2 border rounded" value={editingItem.student_name || ''} onChange={e => setEditingItem({...editingItem, student_name: e.target.value})} />
                                     </div>
                                     <div>
                                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Slug (URL)</label>
                                         <input type="text" className="w-full p-2 border rounded" value={editingItem.slug || ''} onChange={e => setEditingItem({...editingItem, slug: e.target.value})} />
                                     </div>
                                     <div>
                                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                                         <input type="text" className="w-full p-2 border rounded" value={editingItem.access_password || ''} onChange={e => setEditingItem({...editingItem, access_password: e.target.value})} />
                                     </div>
                                     <div>
                                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                                         <input type="text" className="w-full p-2 border rounded" value={editingItem.student_title || ''} onChange={e => setEditingItem({...editingItem, student_title: e.target.value})} />
                                     </div>
                                     <div>
                                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bio</label>
                                         <textarea className="w-full p-2 border rounded h-32 text-sm" value={editingItem.summary_bio || ''} onChange={e => setEditingItem({...editingItem, summary_bio: e.target.value})} />
                                     </div>
                                 </div>
                             </div>

                             <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                 <h3 className="font-bold text-slate-700 mb-4">Theme Config</h3>
                                 <select 
                                    className="w-full p-2 border rounded mb-4" 
                                    value={editingItem.theme_config?.theme || 'tech_dark'}
                                    onChange={e => setEditingItem({...editingItem, theme_config: {...(editingItem.theme_config || {}), theme: e.target.value as any}})}
                                 >
                                     <option value="tech_dark">Tech Dark</option>
                                     <option value="academic_light">Academic Light</option>
                                     <option value="creative_color">Creative Color</option>
                                 </select>
                                 <div className="text-xs text-slate-500">
                                     Avatar URL:
                                     <input type="text" className="w-full p-2 border rounded mt-1 mb-2" value={editingItem.avatar_url || ''} onChange={e => setEditingItem({...editingItem, avatar_url: e.target.value})} />
                                 </div>
                                 <div className="text-xs text-slate-500">
                                     Hero Image URL:
                                     <input type="text" className="w-full p-2 border rounded mt-1" value={editingItem.hero_image_url || ''} onChange={e => setEditingItem({...editingItem, hero_image_url: e.target.value})} />
                                 </div>
                             </div>
                         </div>

                         {/* Middle & Right: Content Editors */}
                         <div className="lg:col-span-2 space-y-6">
                             {/* Skills JSON Editor */}
                             <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                 <h3 className="font-bold text-slate-700 mb-2 flex justify-between items-center">
                                     Skills Data (JSON)
                                     <button 
                                       onClick={() => handleAIPolish('skills')} 
                                       disabled={isPolishing}
                                       className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-purple-200"
                                     >
                                         <Icons.Sparkles size={12} /> AI Polish
                                     </button>
                                 </h3>
                                 <textarea 
                                    className="w-full h-48 font-mono text-xs p-3 border rounded bg-slate-900 text-slate-200"
                                    value={JSON.stringify(editingItem.skills || [], null, 2)}
                                    onChange={e => {
                                        try {
                                            setEditingItem({...editingItem, skills: JSON.parse(e.target.value)});
                                        } catch(err) {}
                                    }}
                                 />
                                 <p className="text-xs text-slate-500 mt-1">Format: Array of Category objects with items.</p>
                             </div>

                             {/* Content Blocks JSON Editor */}
                             <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex-1">
                                 <h3 className="font-bold text-slate-700 mb-2 flex justify-between items-center">
                                     Content Blocks (JSON)
                                     <button 
                                       onClick={() => handleAIPolish('content')} 
                                       disabled={isPolishing}
                                       className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-purple-200"
                                     >
                                         <Icons.Sparkles size={12} /> AI Polish
                                     </button>
                                 </h3>
                                 <textarea 
                                    className="w-full h-[500px] font-mono text-xs p-3 border rounded bg-slate-900 text-slate-200"
                                    value={JSON.stringify(editingItem.content_blocks || [], null, 2)}
                                    onChange={e => {
                                        try {
                                            setEditingItem({...editingItem, content_blocks: JSON.parse(e.target.value)});
                                        } catch(err) {}
                                    }}
                                 />
                                 <p className="text-xs text-slate-500 mt-1">Directly edit the JSON structure for Timeline, Projects, etc.</p>
                             </div>
                         </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {portfolios.map(item => (
                        <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{item.student_name}</h3>
                                    <p className="text-xs text-slate-500 font-mono">/s/{item.slug}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${item.theme_config?.theme === 'tech_dark' ? 'bg-slate-800 text-white' : 'bg-orange-100 text-orange-800'}`}>
                                    {item.theme_config?.theme || 'default'}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2 mb-6">{item.summary_bio || 'No bio provided.'}</p>
                            <div className="flex gap-2 border-t pt-4">
                                <button onClick={() => navigate(`/s/${item.slug}`)} className="flex-1 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded flex items-center justify-center gap-2">
                                    <Icons.Eye size={16} /> View
                                </button>
                                <button onClick={() => handleEdit(item)} className="flex-1 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center gap-2">
                                    <Icons.Edit size={16} /> Edit
                                </button>
                                <button onClick={() => item.id && handleDelete(item.id)} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded">
                                    <Icons.Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {portfolios.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-400">
                            No portfolios found. Create one to get started.
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* AI Settings Modal */}
        {showAiSettings && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Icons.Sparkles className="text-purple-500" /> AI Configuration
                    </h3>
                    
                    <div className="space-y-4 mb-6">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quick Presets</label>
                            <div className="flex flex-wrap gap-2">
                                {AI_PROVIDERS.map(p => (
                                    <button 
                                        key={p.name}
                                        onClick={() => applyAiPreset(p.name)}
                                        className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors shadow-sm"
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">API Key</label>
                            <input type="password" value={aiConfig.apiKey} onChange={e => setAiConfig({...aiConfig, apiKey: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none" placeholder="sk-..." />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Base URL</label>
                            <input type="text" value={aiConfig.baseUrl} onChange={e => setAiConfig({...aiConfig, baseUrl: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none" placeholder="https://api.openai.com/v1" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Model Name</label>
                            <input type="text" value={aiConfig.model} onChange={e => setAiConfig({...aiConfig, model: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none" placeholder="gpt-4o" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 border-t pt-4">
                        <button onClick={() => setShowAiSettings(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                        <button onClick={saveAiConfig} className="px-6 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700 shadow-md">Save Config</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};