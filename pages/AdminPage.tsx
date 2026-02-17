import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { supabase } from '../lib/supabaseClient';
import { Logo } from '../components/Logo';
import * as Icons from 'lucide-react';
import { Booking, StudentPortfolio, ContentBlock, ContentBlockType, SkillCategory, SkillItem, SkillsLayout } from '../types';
import imageCompression from 'browser-image-compression';

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.6, // Slightly more aggressive compression for "slimming"
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg'
};

const CACHE_CONTROL_MAX_AGE = '31536000';
const AI_SETTINGS_KEY = 'SM_AI_CONFIG';

type AdminTab = 'curriculum' | 'showcase' | 'social' | 'philosophy' | 'pages' | 'bookings' | 'students' | 'settings';

interface AdminPageProps {
  defaultTab?: AdminTab;
}

export const AdminPage: React.FC<AdminPageProps> = ({ defaultTab = 'bookings' }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>(defaultTab);
  
  // Data States
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [philosophy, setPhilosophy] = useState<any[]>([]);
  const [showcases, setShowcases] = useState<any[]>([]);
  const [socialProjects, setSocialProjects] = useState<any[]>([]);
  const [pageSections, setPageSections] = useState<any[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [students, setStudents] = useState<StudentPortfolio[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  
  // AI States
  const [aiConfig, setAiConfig] = useState({
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: '',
    model: 'deepseek-ai/DeepSeek-V3'
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [studentEditorTab, setStudentEditorTab] = useState<'profile' | 'skills' | 'content' | 'ai'>('profile');
  
  // AI Polish State
  const [prePolishState, setPrePolishState] = useState<any | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);

  // Check auth & Load AI Config
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/login');
    });
    
    const savedAiConfig = localStorage.getItem(AI_SETTINGS_KEY);
    if (savedAiConfig) {
      setAiConfig(JSON.parse(savedAiConfig));
    }
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [c, p, s, sp, ps, b, st] = await Promise.all([
            supabase.from('curriculum').select('*').order('sort_order', { ascending: true }),
            supabase.from('philosophy').select('*').order('sort_order', { ascending: true }),
            supabase.from('showcases').select('*').order('sort_order', { ascending: true }),
            supabase.from('social_projects').select('*').order('sort_order', { ascending: true }),
            supabase.from('page_sections').select('*').order('sort_order', { ascending: true }),
            supabase.from('bookings').select('*').order('created_at', { ascending: false }),
            supabase.from('student_portfolios').select('*').order('created_at', { ascending: false })
        ]);

        if (c.data) setCurriculum(c.data);
        if (p.data) setPhilosophy(p.data);
        if (s.data) setShowcases(s.data);
        if (sp.data) setSocialProjects(sp.data);
        if (ps.data) setPageSections(ps.data);
        if (b.data) setBookings(b.data);
        if (st.data) setStudents(st.data);

    } catch (error) {
        console.error("Data fetch error:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleSaveSettings = () => {
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(aiConfig));
    alert('AI配置已保存');
  };

  // --- Logic Helpers ---
  const getCurrentList = () => {
      switch (activeTab) {
          case 'curriculum': return { items: curriculum, setter: setCurriculum, table: 'curriculum' };
          case 'showcase': return { items: showcases, setter: setShowcases, table: 'showcases' };
          case 'social': return { items: socialProjects, setter: setSocialProjects, table: 'social_projects' };
          case 'philosophy': return { items: philosophy, setter: setPhilosophy, table: 'philosophy' };
          case 'pages': return { items: pageSections, setter: setPageSections, table: 'page_sections' };
          default: return null;
      }
  };

  // --- Drag and Drop Logic --- (Omitted for brevity, kept same)
  const handleDragStart = (index: number) => setDraggedItemIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); const current = getCurrentList(); if (!current || draggedItemIndex === null || draggedItemIndex === index) return; const newList = [...current.items]; const draggedItem = newList[draggedItemIndex]; newList.splice(draggedItemIndex, 1); newList.splice(index, 0, draggedItem); current.setter(newList); setDraggedItemIndex(index); };
  const handleDrop = async (e: React.DragEvent) => { e.preventDefault(); setDraggedItemIndex(null); const current = getCurrentList(); if (!current) return; const updates = current.items.map((item, index) => ({ ...item, sort_order: index + 1 })); try { await supabase.from(current.table).upsert(updates, { onConflict: 'id' }); } catch (err: any) { alert("排序保存失败"); fetchData(); } };

  // --- Editor Logic ---
  const addContentBlock = (type: ContentBlockType) => {
    const newBlock: ContentBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      data: { title: '', content: '', urls: [], layout: 'grid', star_situation: '', star_task: '', star_action: '', star_result: '', evidence_urls: [] }
    };
    setEditingItem({ ...editingItem, content_blocks: [...(editingItem.content_blocks || []), newBlock] });
  };

  const updateContentBlock = (id: string, field: string, value: any) => {
    const newBlocks = editingItem.content_blocks.map((b: ContentBlock) => b.id === id ? { ...b, data: { ...b.data, [field]: value } } : b);
    setEditingItem({ ...editingItem, content_blocks: newBlocks });
  };

  const removeContentBlock = (id: string) => {
    setEditingItem({ ...editingItem, content_blocks: editingItem.content_blocks.filter((b: ContentBlock) => b.id !== id) });
  };
  
  const moveContentBlock = (index: number, direction: 'up' | 'down') => {
    const blocks = [...editingItem.content_blocks];
    if (direction === 'up' && index > 0) { [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]]; } 
    else if (direction === 'down' && index < blocks.length - 1) { [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]]; }
    setEditingItem({ ...editingItem, content_blocks: blocks });
  };

  // --- SKILLS LOGIC (Refactored) ---
  const addSkillCategory = () => {
    const newCategory: SkillCategory = { name: '新分类', layout: 'bar', items: [] };
    setEditingItem({ ...editingItem, skills: [...(editingItem.skills || []), newCategory] });
  };

  const updateCategory = (index: number, field: keyof SkillCategory, value: any) => {
    const newSkills = [...(editingItem.skills || [])];
    newSkills[index] = { ...newSkills[index], [field]: value };
    setEditingItem({ ...editingItem, skills: newSkills });
  };

  const removeCategory = (index: number) => {
    if (!confirm('确定删除整个分类及其技能吗？')) return;
    const newSkills = [...(editingItem.skills || [])];
    newSkills.splice(index, 1);
    setEditingItem({ ...editingItem, skills: newSkills });
  };

  const addSkillToCategory = (catIndex: number) => {
    const newSkills = [...(editingItem.skills || [])];
    const category = newSkills[catIndex];
    category.items.push({ name: '新技能', value: 80, unit: '分' });
    setEditingItem({ ...editingItem, skills: newSkills });
  };

  const updateSkillItem = (catIndex: number, itemIndex: number, field: keyof SkillItem, value: any) => {
    const newSkills = [...(editingItem.skills || [])];
    const item = newSkills[catIndex].items[itemIndex];
    (item as any)[field] = value;
    setEditingItem({ ...editingItem, skills: newSkills });
  };

  const removeSkillItem = (catIndex: number, itemIndex: number) => {
    const newSkills = [...(editingItem.skills || [])];
    newSkills[catIndex].items.splice(itemIndex, 1);
    setEditingItem({ ...editingItem, skills: newSkills });
  };

  // Helper to migrate legacy flat skills to new category structure
  const migrateSkillsData = (item: any) => {
    if (!item.skills || !Array.isArray(item.skills)) return [];
    
    // Check if it's legacy flat structure (has 'category' prop on items)
    const isLegacy = item.skills.length > 0 && 'category' in item.skills[0];
    
    if (isLegacy) {
      // Group by category
      const groups: Record<string, SkillItem[]> = {};
      item.skills.forEach((s: any) => {
        const cat = s.category || '默认';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push({ name: s.name, value: s.value, unit: s.unit });
      });
      
      return Object.entries(groups).map(([name, items]) => ({
        name,
        layout: 'bar', // Default layout
        items
      }));
    }
    
    return item.skills; // Already grouped or empty
  };

  // --- CRUD ---
  const handleCreateNew = () => {
    setIsNewRecord(true);
    setPrePolishState(null); // Clear polish state
    let template: any = {};
    if (activeTab === 'curriculum') template = { id: 'New', level: '', age: '', title: '', description: '', skills: [], icon_name: 'Box', image_urls: [], sort_order: 99 };
    else if (activeTab === 'showcase') template = { title: '', category: '商业级产品', description: '', image_urls: [], sort_order: 99 };
    else if (activeTab === 'social') template = { title: '商业化案例', subtitle: '', quote: '', footer_note: '', image_urls: [], sort_order: 99 };
    else if (activeTab === 'philosophy') template = { title: '', content: '', icon_name: 'Star', sort_order: 99 };
    else if (activeTab === 'students') template = { slug: '', student_name: '', student_title: '', summary_bio: '', access_password: '', content_blocks: [], skills: [], theme_config: { theme: 'tech_dark' }, avatar_url: '' };
    
    setEditingItem(template);
    setStudentEditorTab('profile'); 
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setIsNewRecord(false);
    setPrePolishState(null); // Clear polish state
    
    // Special handling for Student Portfolio migration
    let editableItem = { ...item };
    if (activeTab === 'students') {
        editableItem.skills = migrateSkillsData(item);
    }

    setEditingItem(editableItem); 
    setStudentEditorTab('profile');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setLoading(true);
    try {
      let table = '';
      if (activeTab === 'students') table = 'student_portfolios';
      else if (activeTab === 'bookings') table = 'bookings';
      else { const cur = getCurrentList(); if (cur) table = cur.table; }

      if (!table) return;

      if (activeTab === 'students' && (!editingItem.slug || !editingItem.student_name)) throw new Error("请填写基本信息");

      if (isNewRecord) {
        const { error } = await supabase.from(table).insert([editingItem]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).update(editingItem).eq('id', editingItem.id);
        if (error) throw error;
      }
      await fetchData(); 
      setIsModalOpen(false);
      setEditingItem(null);
      setPrePolishState(null);
    } catch (error: any) { alert('保存失败: ' + error.message); } finally { setLoading(false); }
  };

  const handleDelete = async (id: any) => {
    if (!confirm('确定要删除吗？')) return;
    setLoading(true);
    try {
        const cur = getCurrentList();
        const table = activeTab === 'students' ? 'student_portfolios' : cur?.table;
        if (table) {
            await supabase.from(table).delete().eq('id', id);
            await fetchData();
        }
    } catch (error: any) { alert('删除失败'); } finally { setLoading(false); }
  };

  // --- Image Upload ---
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, targetType: string = 'standard', blockId?: string) => {
    if (!event.target.files?.length) return;
    const file = event.target.files[0];
    
    // Strict image check
    if (!file.type.startsWith('image/')) {
      alert("仅支持上传图片格式文件 (jpg, png, webp 等)");
      return;
    }

    setUploading(true);
    try {
      // Compression
      const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
      
      const fileName = `${Math.random().toString(36).substr(2)}.${compressedFile.name.split('.').pop() || 'jpg'}`;
      await supabase.storage.from('images').upload(fileName, compressedFile, { cacheControl: CACHE_CONTROL_MAX_AGE, upsert: false });
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      if (activeTab === 'students') {
         if (targetType === 'hero') setEditingItem({ ...editingItem, hero_image_url: publicUrl });
         else if (targetType === 'avatar') setEditingItem({ ...editingItem, avatar_url: publicUrl });
         else if (blockId) {
            const field = targetType === 'evidence' ? 'evidence_urls' : 'urls';
            const newBlocks = editingItem.content_blocks.map((b: ContentBlock) => b.id === blockId ? { ...b, data: { ...b.data, [field]: [...(b.data[field] || []), publicUrl] } } : b);
            setEditingItem({ ...editingItem, content_blocks: newBlocks });
         }
      } else {
         if (['curriculum', 'showcase', 'social'].includes(activeTab)) {
            setEditingItem({ ...editingItem, image_urls: [...(editingItem.image_urls || []), publicUrl] });
         } else {
            setEditingItem({ ...editingItem, icon_name: publicUrl });
         }
      }
    } catch (error: any) { alert('上传失败: ' + error.message); } finally { setUploading(false); }
  };

  // --- Add Video Embed ---
  const handleAddVideo = (blockId: string) => {
    const videoCode = prompt("请输入视频代码 (推荐使用 <iframe> 嵌入代码，支持 Bilibili / YouTube):");
    if (videoCode) {
      if (!videoCode.includes('<iframe') && !videoCode.startsWith('http')) {
        alert("无效的视频代码。请粘贴 iframe 代码或有效的视频链接。");
        return;
      }
      const newBlocks = editingItem.content_blocks.map((b: ContentBlock) => 
        b.id === blockId ? { ...b, data: { ...b.data, urls: [...(b.data.urls || []), videoCode] } } : b
      );
      setEditingItem({ ...editingItem, content_blocks: newBlocks });
    }
  };

  // --- AI Gen ---
  const handleAIGenerate = async () => {
    if (!aiConfig.apiKey || !aiPrompt.trim()) return alert("请在系统设置中配置 API Key 并输入提示词");
    setIsGenerating(true);
    try {
      const systemPrompt = `
        You are a Student Portfolio Architect for SparkMinds.
        Your task is to analyze the raw unstructured notes provided by the user and convert them into a structured JSON portfolio matching the specific schema below.

        LANGUAGE RULE:
        1. All text values MUST BE IN SIMPLIFIED CHINESE (简体中文).
        2. Do NOT output English content unless it is a specific technical term or proper noun.
        3. Only JSON keys should be in English.

        OUTPUT JSON SCHEMA:
        {
          "student_title": "A short, catchy slogan (e.g., '全栈少年工程师', '未来的AI科学家')",
          "summary_bio": "A concise biography summarizing the student's interests and journey (100-200 words)",
          "skills": [
             {
               "name": "Category Name (e.g. '编程能力', '硬件创造', '综合素养')",
               "layout": "radar" | "bar" | "circle" | "stat_grid" (Choose the best visualization),
               "items": [
                 { "name": "Skill Name", "value": 0-100, "unit": "%" or "分" }
               ]
             }
          ],
          "content_blocks": [
            // Use 'section_heading' to divide sections (e.g., '竞赛荣誉', '项目经历')
            {
              "type": "section_heading",
              "data": { "title": "Section Title" }
            },
            // Use 'project_highlight' for major projects using the STAR method
            {
              "type": "project_highlight",
              "data": {
                "title": "Project Name",
                "date": "Date/Period",
                "star_situation": "Situation (Background)",
                "star_task": "Task (Goal)",
                "star_action": "Action (What they did, technical details)",
                "star_result": "Result (Outcome, awards, impact)"
              }
            },
            // Use 'timeline_node' for milestones, awards, or smaller events
            {
              "type": "timeline_node",
              "data": {
                "date": "Date string",
                "title": "Event Title",
                "content": "Description of the event"
              }
            }
          ]
        }

        INSTRUCTIONS:
        - Organize the content logically. Group skills into meaningful categories.
        - Identify STAR components (Situation, Task, Action, Result) for projects if possible. If not explicit, infer them.
        - If input mentions awards, create timeline nodes or project highlights.
        - Return ONLY the raw JSON. No markdown formatting.
      `;
      const response = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiConfig.apiKey}` },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: aiPrompt }],
          temperature: 0.7
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      let content = data.choices[0].message.content;
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(content);
      
      // Ensure IDs and structure
      const processedBlocks = (parsed.content_blocks || []).map((b: any) => ({
        ...b,
        id: Math.random().toString(36).substr(2, 9),
        data: {
            ...b.data,
            urls: [], // Initialize arrays to prevent errors
            evidence_urls: []
        }
      }));

      setEditingItem((prev: any) => ({
        ...prev,
        student_title: parsed.student_title || prev.student_title,
        summary_bio: parsed.summary_bio || prev.summary_bio,
        skills: parsed.skills || prev.skills || [],
        content_blocks: [...(prev.content_blocks || []), ...processedBlocks]
      }));
      setAiPrompt('');
      alert("AI 生成成功！请检查生成的内容。");
      setStudentEditorTab('content'); 
    } catch (e: any) {
      console.error(e);
      alert("AI 生成失败: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- AI Polish (New Feature) ---
  const handleAIPolish = async () => {
    if (!aiConfig.apiKey) return alert("请先在系统设置中配置 API Key");
    if (isPolishing) return;

    // 1. Backup current state
    setPrePolishState(JSON.parse(JSON.stringify(editingItem)));
    setIsPolishing(true);

    try {
        const payload = {
            student_title: editingItem.student_title,
            summary_bio: editingItem.summary_bio,
            content_blocks: editingItem.content_blocks.map((b: any) => ({
                id: b.id, // Keep ID to match later if needed (though we replace whole object)
                type: b.type,
                data: {
                    ...b.data,
                    // Send text fields, strip large arrays of URLs to save tokens if needed, 
                    // but keeping them is safer to avoid losing them in AI hallucination.
                    // Let's send everything relevant to text.
                }
            }))
        };

        const systemPrompt = `
            You are a professional editor for Ivy League admissions. 
            Your task is to POLISH the text content of this Student Portfolio to be more academic, professional, and impressive.
            
            RULES:
            1. Keep the language in SIMPLIFIED CHINESE (简体中文).
            2. Do NOT change the data structure, IDs, or URLs.
            3. Only improve the phrasing, vocabulary, and flow of:
               - 'student_title' (Make it catchy/professional)
               - 'summary_bio' (Make it a compelling narrative)
               - 'content_blocks' (Especially project_highlight STAR sections: Situation, Task, Action, Result)
            4. Use strong action verbs and quantitative descriptions where possible.
            5. Return the JSON object with the exact same keys as input.
            6. Return ONLY the raw JSON.
        `;

        const response = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiConfig.apiKey}` },
            body: JSON.stringify({
              model: aiConfig.model,
              messages: [
                  { role: "system", content: systemPrompt }, 
                  { role: "user", content: JSON.stringify(payload) }
              ],
              temperature: 0.4
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        let content = data.choices[0].message.content;
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const polishedData = JSON.parse(content);

        // Merge polished data back into editingItem
        // We preserve skills and other fields that might not have been sent or modified
        setEditingItem((prev: any) => ({
            ...prev,
            student_title: polishedData.student_title || prev.student_title,
            summary_bio: polishedData.summary_bio || prev.summary_bio,
            content_blocks: polishedData.content_blocks || prev.content_blocks
        }));

        alert("AI 润色完成！请预览效果，不满意可点击“放弃回滚”。");

    } catch (e: any) {
        console.error(e);
        alert("AI 润色失败: " + e.message);
        setPrePolishState(null); // Clear backup if failed
    } finally {
        setIsPolishing(false);
    }
  };

  const handleRollbackPolish = () => {
      if (prePolishState) {
          setEditingItem(prePolishState);
          setPrePolishState(null);
          alert("已恢复到润色前的内容。");
      }
  };

  const handleConfirmPolish = () => {
      setPrePolishState(null);
      alert("已保留润色内容。请记得点击下方的“保存”按钮写入数据库。");
  };

  const getHeaderTitle = () => {
      if (activeTab === 'students') return '学生成长档案管理';
      if (activeTab === 'bookings') return '试听预约管理';
      if (activeTab === 'settings') return '系统配置';
      return '内容管理';
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      <div className="w-64 bg-slate-900 text-white p-6 flex flex-col shrink-0">
        <div className="mb-8"><Logo className="h-8 w-auto grayscale brightness-200" /></div>
        <nav className="flex-1 space-y-2">
          {[{ id: 'bookings', label: '预约管理', icon: Icons.PhoneCall }, { id: 'students', label: '学生档案', icon: Icons.Users }, { id: 'curriculum', label: '课程体系', icon: Icons.BookOpen }, { id: 'showcase', label: '学员成果', icon: Icons.Trophy }, { id: 'social', label: '社会实践', icon: Icons.TrendingUp }, { id: 'philosophy', label: '核心理念', icon: Icons.Lightbulb }, { id: 'pages', label: '页面设置', icon: Icons.Layout }].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as AdminTab)} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === tab.id ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
              <tab.icon size={18} /><span className="font-medium">{tab.label}</span>
              {tab.id === 'bookings' && bookings.filter(b => b.status === 'pending').length > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{bookings.filter(b => b.status === 'pending').length}</span>}
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-slate-800">
             <button onClick={() => setActiveTab('settings')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'settings' ? 'bg-blue-600' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
                <Icons.Settings size={18} /><span className="font-medium">系统配置</span>
             </button>
          </div>
        </nav>
        <button onClick={handleLogout} className="text-slate-400 hover:text-white mt-auto flex items-center gap-2 px-4 py-2"><Icons.LogOut size={16} /> 退出登录</button>
      </div>

      <div className="flex-1 h-screen overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-800">{getHeaderTitle()}</h1>
          <div className="flex items-center gap-3">
             {!['pages', 'bookings', 'settings'].includes(activeTab) && (
                <button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm font-bold">
                  <Icons.Plus size={18} /> 添加记录
                </button>
             )}
          </div>
        </header>

        <main className="p-8">
           {/* ... (Table and List Views remain unchanged) ... */}
           {loading ? <div className="flex justify-center items-center h-64 text-slate-400"><Icons.Loader2 className="animate-spin mr-2" /> 加载中...</div> : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[200px]">
                {activeTab === 'bookings' && (
                  <div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-600"><thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200"><tr><th className="px-6 py-4">状态</th><th className="px-6 py-4">家长姓名</th><th className="px-6 py-4">联系电话</th><th className="px-6 py-4">孩子年龄</th><th className="px-6 py-4 text-right">操作</th></tr></thead><tbody>{bookings.length > 0 ? bookings.map((b) => (<tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50"><td className="px-6 py-4">{b.status === 'pending' ? <span className="text-red-500 font-bold bg-red-50 px-2 py-1 rounded">待处理</span> : <span className="text-green-600 bg-green-50 px-2 py-1 rounded">已联系</span>}</td><td className="px-6 py-4 font-medium text-slate-900">{b.parent_name}</td><td className="px-6 py-4">{b.phone}</td><td className="px-6 py-4">{b.child_age}</td><td className="px-6 py-4 text-right"><button onClick={async () => { await supabase.from('bookings').update({ status: b.status === 'contacted' ? 'pending' : 'contacted' }).eq('id', b.id); fetchData(); }} className="text-blue-600 hover:underline">切换状态</button></td></tr>)) : <tr><td colSpan={5} className="text-center py-12 text-slate-400 bg-slate-50/50">暂无预约数据</td></tr>}</tbody></table></div>
                )}
                {activeTab === 'students' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
                       {students.map((s) => (
                          <div key={s.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative group">
                             <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(s)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Icons.Edit2 size={16}/></button>
                                <button onClick={() => handleDelete(s.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Icons.Trash2 size={16}/></button>
                             </div>
                             <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden border-2 border-slate-50 shadow-sm flex-shrink-0">
                                   {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full object-cover" /> : s.hero_image_url ? <img src={s.hero_image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-2xl">{s.student_name[0]}</div>}
                                </div>
                                <div>
                                   <h3 className="font-bold text-lg text-slate-900">{s.student_name}</h3>
                                   <p className="text-xs text-slate-500 truncate max-w-[150px]">{s.student_title || '未设置头衔'}</p>
                                </div>
                             </div>
                          </div>
                       ))}
                       {students.length === 0 && <div className="col-span-full text-center py-12 text-slate-400">暂无学生档案，请点击右上角添加</div>}
                    </div>
                )}
                {activeTab === 'settings' && (
                   <div className="max-w-2xl bg-white p-8">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Icons.Sparkles className="text-blue-500" /> AI 助手配置</h3>
                      <div className="space-y-4">
                         <div><label className="block text-sm font-bold text-slate-700 mb-1">Base URL</label><input type="text" value={aiConfig.baseUrl} onChange={e => setAiConfig({...aiConfig, baseUrl: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="https://api.siliconflow.cn/v1" /></div>
                         <div><label className="block text-sm font-bold text-slate-700 mb-1">API Key</label><input type="password" value={aiConfig.apiKey} onChange={e => setAiConfig({...aiConfig, apiKey: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="sk-..." /></div>
                         <div><label className="block text-sm font-bold text-slate-700 mb-1">Model Name</label><input type="text" value={aiConfig.model} onChange={e => setAiConfig({...aiConfig, model: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="deepseek-ai/DeepSeek-V3" /></div>
                         <button onClick={handleSaveSettings} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-700">保存配置</button>
                      </div>
                   </div>
                )}
                {['curriculum', 'showcase', 'social', 'philosophy', 'pages'].includes(activeTab) && (
                   <div className="p-6 space-y-4">
                      {(() => {
                         const current = getCurrentList();
                         if (!current) return null;
                         const { items } = current;
                         if (!items || items.length === 0) return <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl"><Icons.Inbox size={48} className="mb-4 opacity-50" /><p>暂无数据</p>{activeTab !== 'pages' && <p className="text-xs mt-2">点击右上角“添加记录”开始创建</p>}</div>;
                         return items.map((item, index) => (
                            <div key={item.id || index} draggable={activeTab !== 'pages'} onDragStart={() => handleDragStart(index)} onDragOver={(e) => handleDragOver(e, index)} onDrop={handleDrop} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between group cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors">
                               <div className="flex items-center gap-4 overflow-hidden"><div className="w-12 h-12 bg-slate-100 rounded-lg shrink-0 flex items-center justify-center overflow-hidden text-slate-400">{item.image_urls && item.image_urls[0] ? <img src={item.image_urls[0]} className="w-full h-full object-cover" /> : item.icon_name && !item.icon_name.includes('/') ? <Icons.Box size={20} /> : item.icon_name ? <img src={item.icon_name} className="w-full h-full object-contain" /> : <Icons.Image size={20} />}</div><div className="min-w-0"><h3 className="font-bold text-slate-800 truncate">{item.title}</h3><p className="text-sm text-slate-500 truncate">{item.description || item.content || item.subtitle || item.level}</p></div></div>
                               <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => openEditModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Icons.Edit2 size={18}/></button>{activeTab !== 'pages' && <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Icons.Trash2 size={18}/></button>}</div>
                            </div>
                         ));
                      })()}
                   </div>
                )}
            </div>
          )}
        </main>
      </div>

      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white rounded-2xl shadow-2xl w-full ${activeTab === 'students' ? 'max-w-6xl h-[90vh]' : 'max-w-lg'} flex flex-col overflow-hidden`}>
             <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50"><h3 className="font-bold text-lg">{isNewRecord ? '添加' : '编辑'} {getHeaderTitle()}</h3><button onClick={() => setIsModalOpen(false)}><Icons.X className="text-slate-400 hover:text-slate-600" /></button></div>
             <div className="flex-1 overflow-y-auto p-6 relative">
                {prePolishState && (
                    <div className="sticky top-0 z-20 mb-4 bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-lg flex items-center justify-between shadow-sm animate-fade-in-down">
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <Icons.Sparkles className="w-4 h-4 animate-pulse" />
                            <span>AI 润色预览模式</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleRollbackPolish} className="px-3 py-1 bg-white border border-orange-300 rounded text-xs font-bold hover:bg-orange-100 flex items-center gap-1">
                                <Icons.RotateCcw size={12} /> 放弃回滚
                            </button>
                            <button onClick={handleConfirmPolish} className="px-3 py-1 bg-orange-600 text-white rounded text-xs font-bold hover:bg-orange-700 flex items-center gap-1">
                                <Icons.Check size={12} /> 确认采用
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'students' ? (
                   <div className="space-y-4">
                      <div className="flex gap-4 border-b pb-4">{['profile', 'skills', 'content', 'ai'].map(t => (<button key={t} onClick={() => setStudentEditorTab(t as any)} className={`px-4 py-2 rounded-lg font-bold text-sm ${studentEditorTab === t ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}>{t.toUpperCase()}</button>))}</div>
                      {studentEditorTab === 'profile' && (
                         <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4"><input className="border p-2 rounded" placeholder="姓名" value={editingItem.student_name} onChange={e => setEditingItem({...editingItem, student_name: e.target.value})} /><input className="border p-2 rounded" placeholder="Slug (URL后缀)" value={editingItem.slug} onChange={e => setEditingItem({...editingItem, slug: e.target.value})} /><input className="border p-2 rounded" placeholder="访问密码" value={editingItem.access_password} onChange={e => setEditingItem({...editingItem, access_password: e.target.value})} /><input className="border p-2 rounded" placeholder="头衔/Slogan" value={editingItem.student_title || ''} onChange={e => setEditingItem({...editingItem, student_title: e.target.value})} /></div>
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl"><div><label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Hero 背景大图 (建议横屏 16:9)</label><div className="flex items-center gap-2"><input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'hero')} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>{editingItem.hero_image_url && <div className="w-10 h-10 rounded overflow-hidden bg-slate-200"><img src={editingItem.hero_image_url} className="w-full h-full object-cover"/></div>}</div></div><div><label className="block text-xs font-bold text-slate-500 mb-2 uppercase">学生头像 (建议正方形 1:1)</label><div className="flex items-center gap-2"><input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'avatar')} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>{editingItem.avatar_url && <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200"><img src={editingItem.avatar_url} className="w-full h-full object-cover"/></div>}</div></div></div>
                            <div><label className="block text-sm font-bold text-slate-700 mb-1">个人简介 (Summary Bio)</label><textarea className="w-full border p-2 rounded h-20 text-sm" value={editingItem.summary_bio || ''} onChange={e => setEditingItem({...editingItem, summary_bio: e.target.value})} placeholder="一句话介绍..." /></div>
                         </div>
                      )}
                      {studentEditorTab === 'skills' && (
                         <div>
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-bold text-slate-800">技能矩阵配置</h4>
                                <button onClick={addSkillCategory} className="text-xs bg-slate-900 text-white px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-slate-700">
                                    <Icons.Plus size={14} /> 添加新分类
                                </button>
                            </div>
                            
                            <div className="space-y-6">
                                {(editingItem.skills || []).map((category: SkillCategory, catIdx: number) => (
                                    <div key={catIdx} className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                                        <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-white">
                                            <div className="flex items-center gap-3 flex-1">
                                                <input 
                                                    className="font-bold text-sm border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none px-1"
                                                    value={category.name}
                                                    onChange={e => updateCategory(catIdx, 'name', e.target.value)}
                                                    placeholder="分类名称 (如: 编程能力)"
                                                />
                                                <select 
                                                    className="text-xs border rounded p-1 bg-slate-50 text-slate-600"
                                                    value={category.layout}
                                                    onChange={e => updateCategory(catIdx, 'layout', e.target.value)}
                                                >
                                                    <option value="bar">条形图 (Bar)</option>
                                                    <option value="radar">雷达图 (Radar)</option>
                                                    <option value="circle">环形图 (Circle)</option>
                                                    <option value="stat_grid">数值卡片 (Grid)</option>
                                                </select>
                                            </div>
                                            <button onClick={() => removeCategory(catIdx)} className="text-red-400 hover:text-red-600 p-1">
                                                <Icons.Trash2 size={16} />
                                            </button>
                                        </div>
                                        
                                        <div className="p-3 space-y-2">
                                            {category.items.map((skill, itemIdx) => (
                                                <div key={itemIdx} className="flex gap-2 items-center">
                                                    <input 
                                                        className="border p-1.5 rounded text-sm flex-1"
                                                        placeholder="技能名称"
                                                        value={skill.name}
                                                        onChange={e => updateSkillItem(catIdx, itemIdx, 'name', e.target.value)}
                                                    />
                                                    <input 
                                                        className="border p-1.5 rounded text-sm w-20"
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="数值"
                                                        value={skill.value}
                                                        onChange={e => updateSkillItem(catIdx, itemIdx, 'value', parseFloat(e.target.value))}
                                                    />
                                                    <input 
                                                        className="border p-1.5 rounded text-sm w-16"
                                                        placeholder="单位"
                                                        value={skill.unit || ''}
                                                        onChange={e => updateSkillItem(catIdx, itemIdx, 'unit', e.target.value)}
                                                    />
                                                    <button onClick={() => removeSkillItem(catIdx, itemIdx)} className="text-slate-400 hover:text-red-500">
                                                        <Icons.X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => addSkillToCategory(catIdx)} className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2 flex items-center gap-1 px-1">
                                                <Icons.Plus size={12} /> 添加技能项
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(editingItem.skills || []).length === 0 && (
                                    <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed rounded-xl">
                                        点击上方按钮添加技能分类
                                    </div>
                                )}
                            </div>
                         </div>
                      )}
                      {studentEditorTab === 'content' && (
                         <div className="space-y-2">
                            <div className="flex gap-2 sticky top-0 bg-white p-2 z-10 border-b">
                                <button onClick={() => addContentBlock('timeline_node')} className="text-xs bg-blue-100 text-blue-700 p-2 rounded border border-blue-200 font-bold">+ 时间节点</button>
                                <button onClick={() => addContentBlock('project_highlight')} className="text-xs bg-blue-100 text-blue-700 p-2 rounded border border-blue-200 font-bold">+ STAR项目</button>
                                <button onClick={() => addContentBlock('section_heading')} className="text-xs bg-blue-100 text-blue-700 p-2 rounded border border-blue-200 font-bold">+ 章节标题</button>
                                <button onClick={() => addContentBlock('image_grid')} className="text-xs bg-slate-100 p-2 rounded border">+ 图集</button>
                            </div>
                            {editingItem.content_blocks?.map((b: any, i: number) => (
                               <div key={b.id} className="border p-4 rounded bg-slate-50 relative group">
                                  <div className="absolute right-2 top-2 flex gap-1 opacity-50 group-hover:opacity-100"><button onClick={() => moveContentBlock(i, 'up')}><Icons.ArrowUp size={14}/></button><button onClick={() => moveContentBlock(i, 'down')}><Icons.ArrowDown size={14}/></button><button onClick={() => removeContentBlock(b.id)} className="text-red-500"><Icons.Trash2 size={14}/></button></div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">{b.type}</span>
                                  {b.type === 'project_highlight' ? (
                                     <div className="space-y-2"><input className="w-full border p-2 rounded font-bold" placeholder="项目名称" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} /><textarea className="w-full border p-2 rounded text-sm h-16" placeholder="Situation (背景)" value={b.data.star_situation || ''} onChange={e => updateContentBlock(b.id, 'star_situation', e.target.value)} /><textarea className="w-full border p-2 rounded text-sm h-16" placeholder="Task (任务)" value={b.data.star_task || ''} onChange={e => updateContentBlock(b.id, 'star_task', e.target.value)} /><textarea className="w-full border p-2 rounded text-sm h-24" placeholder="Action (行动)" value={b.data.star_action || ''} onChange={e => updateContentBlock(b.id, 'star_action', e.target.value)} /><textarea className="w-full border p-2 rounded text-sm h-16" placeholder="Result (结果)" value={b.data.star_result || ''} onChange={e => updateContentBlock(b.id, 'star_result', e.target.value)} /></div>
                                  ) : b.type === 'timeline_node' ? (
                                     <div className="space-y-2">
                                        <div className="flex gap-2"><input className="w-1/3 border p-2 rounded text-sm font-mono text-slate-600 bg-slate-50" value={b.data.date || ''} onChange={e => updateContentBlock(b.id, 'date', e.target.value)} placeholder="时间点 (2023年5月)" /><input className="w-2/3 border p-2 rounded font-bold" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} placeholder="事件标题" /></div>
                                        <textarea className="w-full border p-2 rounded h-20 text-sm" value={b.data.content || ''} onChange={e => updateContentBlock(b.id, 'content', e.target.value)} placeholder="成果详细描述..." />
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">佐证素材</label>
                                            <div className="flex flex-wrap gap-2">
                                                {b.data.urls?.map((url: string, imgIdx: number) => (
                                                    <div key={imgIdx} className="w-16 h-16 relative group bg-black rounded overflow-hidden border border-slate-200">
                                                        {url.trim().startsWith('<iframe') || url.startsWith('http') && !url.includes('supabase') ? (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-100"><Icons.Film size={20}/></div>
                                                        ) : (
                                                            <img src={url} className="w-full h-full object-cover" />
                                                        )}
                                                        <button onClick={() => { const newUrls = b.data.urls.filter((_: any, idx: number) => idx !== imgIdx); updateContentBlock(b.id, 'urls', newUrls); }} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100"><Icons.X size={12}/></button>
                                                    </div>
                                                ))}
                                                <label className="w-16 h-16 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 text-slate-400 hover:text-blue-400 bg-white" title="上传照片">
                                                    <Icons.Image size={20} /><span className="text-[10px] mt-1">照片</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'standard', b.id)} />
                                                </label>
                                                <button onClick={() => handleAddVideo(b.id)} className="w-16 h-16 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 text-slate-400 hover:text-purple-400 bg-white" title="添加视频链接">
                                                    <Icons.Film size={20} /><span className="text-[10px] mt-1">视频</span>
                                                </button>
                                            </div>
                                        </div>
                                     </div>
                                  ) : b.type === 'section_heading' ? (
                                     <div className="space-y-2 text-center py-4">
                                        <label className="block text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">章节大标题</label>
                                        <input className="w-full border-b-2 border-blue-100 p-2 text-center text-xl font-bold focus:border-blue-500 outline-none bg-transparent" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} placeholder="输入标题 (例如: 个人荣誉)" />
                                     </div>
                                  ) : (
                                     <div className="space-y-2">{b.type !== 'text' && <input className="w-full border p-2 rounded" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} placeholder="标题" />}<textarea className="w-full border p-2 rounded h-24" value={b.data.content || ''} onChange={e => updateContentBlock(b.id, 'content', e.target.value)} placeholder="内容..." /></div>
                                  )}
                               </div>
                            ))}
                         </div>
                      )}
                      {studentEditorTab === 'ai' && (
                         <div className="space-y-6">
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                <h3 className="font-bold text-blue-900 text-lg mb-4 flex items-center gap-2"><Icons.Wand2 className="text-blue-500" /> 从零生成</h3>
                                <p className="text-sm text-blue-600/80 mb-4">将原始资料（如简历、笔记）粘贴在下方，AI 自动整理成结构化档案。</p>
                                <textarea className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 bg-white" placeholder="在此粘贴原始资料..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
                                <button onClick={handleAIGenerate} disabled={isGenerating || isPolishing} className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isGenerating ? <Icons.Loader2 className="animate-spin" /> : <Icons.Sparkles />}
                                    {isGenerating ? '正在分析生成...' : '开始生成结构化档案'}
                                </button>
                            </div>

                            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                                <h3 className="font-bold text-orange-900 text-lg mb-4 flex items-center gap-2"><Icons.PenTool className="text-orange-500" /> 润色现有内容</h3>
                                <p className="text-sm text-orange-600/80 mb-4">对当前已编辑的内容进行文字润色，使其更具学术感和专业度，保持事实不变。</p>
                                {prePolishState ? (
                                    <div className="text-center p-4 bg-white rounded-xl border border-orange-200">
                                        <p className="font-bold text-orange-600 mb-2">正在预览润色效果</p>
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={handleRollbackPolish} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-2 font-bold"><Icons.Undo size={16}/> 撤销回滚</button>
                                            <button onClick={handleConfirmPolish} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 font-bold"><Icons.Check size={16}/> 确认采用</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={handleAIPolish} disabled={isGenerating || isPolishing} className="w-full bg-white border-2 border-orange-200 text-orange-700 py-3 rounded-xl font-bold hover:bg-orange-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isPolishing ? <Icons.Loader2 className="animate-spin" /> : <Icons.Feather />}
                                        {isPolishing ? 'AI 正在润色中...' : '一键润色 (提升专业度)'}
                                    </button>
                                )}
                            </div>
                         </div>
                      )}
                   </div>
                ) : (
                   <div className="space-y-4"><div><label className="block text-sm font-bold text-slate-700">标题</label><input className="w-full border p-2 rounded" value={editingItem.title || ''} onChange={e => setEditingItem({...editingItem, title: e.target.value})} /></div>{(editingItem.description !== undefined || editingItem.content !== undefined) && <div><label className="block text-sm font-bold text-slate-700">内容</label><textarea className="w-full border p-2 rounded h-24" value={editingItem.description || editingItem.content || ''} onChange={e => { if(editingItem.description!==undefined) setEditingItem({...editingItem, description: e.target.value}); else setEditingItem({...editingItem, content: e.target.value}) }} /></div>}{activeTab !== 'pages' && <div><label className="block text-sm font-bold text-slate-700">图片</label><input type="file" accept="image/*" onChange={e => handleImageUpload(e)} /></div>}</div>
                )}
             </div>
             <div className="p-4 border-t bg-slate-50 flex justify-end gap-3"><button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500">取消</button><button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">保存</button></div>
          </div>
        </div>
      )}
    </div>
  );
};