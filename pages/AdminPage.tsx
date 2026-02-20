import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { supabase } from '../lib/supabaseClient';
import { Logo } from '../components/Logo';
import * as Icons from 'lucide-react';
import { Booking, StudentPortfolio, ContentBlock, ContentBlockType, SkillCategory, SkillItem } from '../types';
import imageCompression from 'browser-image-compression';

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.6,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg'
};

const CACHE_CONTROL_MAX_AGE = '31536000';
const AI_SETTINGS_KEY = 'SM_AI_CONFIG';

const AI_PROVIDERS = [
  { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o' },
  { name: 'Cerebras', baseUrl: 'https://api.cerebras.ai/v1', defaultModel: 'llama3.1-70b' },
  { name: 'SiliconFlow', baseUrl: 'https://api.siliconflow.cn/v1', defaultModel: 'deepseek-ai/DeepSeek-V3' },
  { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', defaultModel: 'deepseek-chat' },
];

type AdminTab = 'curriculum' | 'showcase' | 'social' | 'philosophy' | 'pages' | 'bookings' | 'students' | 'settings';
type AiGenerateMode = 'replace' | 'append';
type BlockImageField = 'hero_image_urls' | 'urls' | 'evidence_urls';

const STUDENT_AI_BLOCK_TYPES: ContentBlockType[] = [
  'profile_header',
  'skills_matrix',
  'section_heading',
  'timeline_node',
  'project_highlight',
  'info_list',
  'table',
  'text',
  'image_grid'
];

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
  const [draggedBlockImage, setDraggedBlockImage] = useState<{ blockId: string; field: BlockImageField; index: number } | null>(null);
  
  // AI States
  const [aiConfig, setAiConfig] = useState({
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o'
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGenerateMode, setAiGenerateMode] = useState<AiGenerateMode>('replace');
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false); // Collapsible AI panel
  
  // AI Polish State
  const [prePolishState, setPrePolishState] = useState<any | null>(null);
  const [polishingBlockId, setPolishingBlockId] = useState<string | null>(null);

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

  const sanitizeSkillsMatrixBlocks = (blocks: ContentBlock[] = []): ContentBlock[] =>
    blocks.map((block) => {
      if (block.type !== 'skills_matrix' || !block.data) return block;
      if (!Object.prototype.hasOwnProperty.call(block.data, 'title')) return block;

      const { title: _legacyTitle, ...restData } = block.data;
      return {
        ...block,
        data: restData
      };
    });

  const createBlockId = () => Math.random().toString(36).slice(2, 11);

  const extractJsonPayload = (rawContent: string): string => {
    const cleaned = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
    const objectStart = cleaned.indexOf('{');
    const arrayStart = cleaned.indexOf('[');
    const start =
      objectStart === -1 ? arrayStart : arrayStart === -1 ? objectStart : Math.min(objectStart, arrayStart);

    if (start < 0) return cleaned;

    const opening = cleaned[start];
    const closing = opening === '[' ? ']' : '}';
    const end = cleaned.lastIndexOf(closing);
    if (end < 0 || end <= start) return cleaned.slice(start);
    return cleaned.slice(start, end + 1);
  };

  const normalizeSkillsCategories = (rawCategories: any): SkillCategory[] => {
    if (!Array.isArray(rawCategories)) return [];
    return rawCategories
      .filter((cat) => cat && typeof cat === 'object')
      .map((cat: any) => ({
        name: typeof cat.name === 'string' ? cat.name : '能力分类',
        layout: ['bar', 'radar', 'circle', 'stat_grid'].includes(cat.layout) ? cat.layout : 'bar',
        items: Array.isArray(cat.items)
          ? cat.items
              .filter((item: any) => item && typeof item === 'object')
              .map((item: any) => ({
                name: typeof item.name === 'string' ? item.name : '能力项',
                value: Number.isFinite(Number(item.value)) ? Number(item.value) : 80,
                unit: typeof item.unit === 'string' ? item.unit : ''
              }))
          : []
      }));
  };

  const normalizeGeneratedBlock = (rawBlock: any): ContentBlock | null => {
    if (!rawBlock || typeof rawBlock !== 'object') return null;
    if (!STUDENT_AI_BLOCK_TYPES.includes(rawBlock.type)) return null;

    const type = rawBlock.type as ContentBlockType;
    const rawData = rawBlock.data && typeof rawBlock.data === 'object' ? rawBlock.data : {};
    let data: any = {};

    switch (type) {
      case 'profile_header':
        data = {
          student_title: typeof rawData.student_title === 'string' ? rawData.student_title : '',
          summary_bio: typeof rawData.summary_bio === 'string' ? rawData.summary_bio : '',
          avatar_url: typeof rawData.avatar_url === 'string' ? rawData.avatar_url : '',
          hero_image_urls: Array.isArray(rawData.hero_image_urls)
            ? rawData.hero_image_urls.filter((url: any) => typeof url === 'string')
            : []
        };
        break;
      case 'skills_matrix':
        data = {
          skills_categories: normalizeSkillsCategories(rawData.skills_categories)
        };
        break;
      case 'section_heading':
        data = {
          title: typeof rawData.title === 'string' ? rawData.title : ''
        };
        break;
      case 'timeline_node':
        data = {
          date: typeof rawData.date === 'string' ? rawData.date : '',
          title: typeof rawData.title === 'string' ? rawData.title : '',
          content: typeof rawData.content === 'string' ? rawData.content : '',
          urls: Array.isArray(rawData.urls) ? rawData.urls.filter((url: any) => typeof url === 'string') : []
        };
        break;
      case 'project_highlight':
        data = {
          title: typeof rawData.title === 'string' ? rawData.title : '',
          star_situation: typeof rawData.star_situation === 'string' ? rawData.star_situation : '',
          star_task: typeof rawData.star_task === 'string' ? rawData.star_task : '',
          star_action: typeof rawData.star_action === 'string' ? rawData.star_action : '',
          star_result: typeof rawData.star_result === 'string' ? rawData.star_result : '',
          evidence_urls: Array.isArray(rawData.evidence_urls)
            ? rawData.evidence_urls.filter((url: any) => typeof url === 'string')
            : []
        };
        break;
      case 'info_list':
        data = {
          title: typeof rawData.title === 'string' ? rawData.title : '',
          info_items: Array.isArray(rawData.info_items)
            ? rawData.info_items
                .filter((item: any) => item && typeof item === 'object')
                .map((item: any) => ({
                  icon: typeof item.icon === 'string' ? item.icon : 'Star',
                  label: typeof item.label === 'string' ? item.label : '',
                  value: typeof item.value === 'string' ? item.value : ''
                }))
            : []
        };
        break;
      case 'table': {
        const tableColumns = Array.isArray(rawData.table_columns)
          ? rawData.table_columns.map((col: any) => (typeof col === 'string' ? col : '')).filter(Boolean)
          : [];
        const colCount = Math.max(1, tableColumns.length);
        const tableRows = Array.isArray(rawData.table_rows)
          ? rawData.table_rows
              .filter((row: any) => Array.isArray(row))
              .map((row: any[]) => {
                const normalized = row.slice(0, colCount).map((cell: any) => (typeof cell === 'string' ? cell : ''));
                while (normalized.length < colCount) normalized.push('');
                return normalized;
              })
          : [];
        data = {
          title: typeof rawData.title === 'string' ? rawData.title : '',
          table_columns: tableColumns.length > 0 ? tableColumns : ['项目', '内容'],
          table_rows: tableRows
        };
        break;
      }
      case 'text':
        data = {
          title: typeof rawData.title === 'string' ? rawData.title : '',
          content: typeof rawData.content === 'string' ? rawData.content : ''
        };
        break;
      case 'image_grid':
        data = {
          title: typeof rawData.title === 'string' ? rawData.title : '',
          urls: Array.isArray(rawData.urls) ? rawData.urls.filter((url: any) => typeof url === 'string') : []
        };
        break;
      default:
        data = rawData;
    }

    if (type === 'profile_header') {
      data.hero_image_url = data.hero_image_urls[0] || '';
    }

    return {
      id: createBlockId(),
      type,
      data
    };
  };

  const normalizeGeneratedBlocks = (rawBlocks: any): ContentBlock[] => {
    if (!Array.isArray(rawBlocks)) return [];
    const normalized: ContentBlock[] = rawBlocks
      .map((rawBlock: any) => normalizeGeneratedBlock(rawBlock))
      .filter((block: ContentBlock | null): block is ContentBlock => block !== null);

    let profileSeen = false;
    return normalized.filter((block) => {
      if (block.type !== 'profile_header') return true;
      if (profileSeen) return false;
      profileSeen = true;
      return true;
    });
  };

  const mergeGeneratedBlocks = (existing: ContentBlock[] = [], generated: ContentBlock[] = [], mode: AiGenerateMode): ContentBlock[] => {
    if (mode === 'replace') {
      const profileIndex = generated.findIndex((block) => block.type === 'profile_header');
      if (profileIndex <= 0) return generated;
      const reordered = [...generated];
      const [profileBlock] = reordered.splice(profileIndex, 1);
      reordered.unshift(profileBlock);
      return reordered;
    }

    const merged = [...existing];
    const incomingProfile = generated.find((block) => block.type === 'profile_header');
    if (incomingProfile) {
      const profileIndex = merged.findIndex((block) => block.type === 'profile_header');
      if (profileIndex >= 0) {
        const originalProfile = merged[profileIndex];
        const nextHeroImages = incomingProfile.data.hero_image_urls?.length
          ? incomingProfile.data.hero_image_urls
          : originalProfile.data.hero_image_urls || [];
        merged[profileIndex] = {
          ...originalProfile,
          data: {
            ...originalProfile.data,
            ...incomingProfile.data,
            avatar_url: incomingProfile.data.avatar_url || originalProfile.data.avatar_url || '',
            hero_image_urls: nextHeroImages,
            hero_image_url: nextHeroImages[0] || ''
          }
        };
      } else {
        merged.unshift(incomingProfile);
      }
    }

    generated
      .filter((block) => block.type !== 'profile_header')
      .forEach((block) => {
        merged.push(block);
      });

    return merged;
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

  // --- Drag and Drop Logic --- 
  const handleDragStart = (index: number) => setDraggedItemIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); const current = getCurrentList(); if (!current || draggedItemIndex === null || draggedItemIndex === index) return; const newList = [...current.items]; const draggedItem = newList[draggedItemIndex]; newList.splice(draggedItemIndex, 1); newList.splice(index, 0, draggedItem); current.setter(newList); setDraggedItemIndex(index); };
  const handleDrop = async (e: React.DragEvent) => { e.preventDefault(); setDraggedItemIndex(null); const current = getCurrentList(); if (!current) return; const updates = current.items.map((item, index) => ({ ...item, sort_order: index + 1 })); try { await supabase.from(current.table).upsert(updates, { onConflict: 'id' }); } catch (err: any) { alert("排序保存失败"); fetchData(); } };

  // --- Student Editor Logic ---
  const addContentBlock = (type: ContentBlockType) => {
    // 1. Prevent duplicate Profile Header
    if (type === 'profile_header' && editingItem.content_blocks?.some((b: any) => b.type === 'profile_header')) {
        alert("每个档案只能有一个个人头图模块");
        return;
    }

    let initialData: any = { title: '', content: '', urls: [], layout: 'grid', star_situation: '', star_task: '', star_action: '', star_result: '', evidence_urls: [] };
    
    if (type === 'info_list') {
        initialData = {
            title: '个人信息',
            info_items: [
                { icon: 'School', label: '学校', value: '' },
                { icon: 'MapPin', label: '坐标', value: '' },
                { icon: 'Mail', label: '邮箱', value: '' }
            ]
        };
    } else if (type === 'table') {
        initialData = {
            title: '表格数据',
            table_columns: ['项目', '内容'],
            table_rows: [['示例1', '数据1'], ['示例2', '数据2']]
        };
    } else if (type === 'profile_header') {
        initialData = {
            student_title: 'Future Innovator',
            summary_bio: '在此输入个人简介...',
            avatar_url: '',
            hero_image_url: '', // Legacy init
            hero_image_urls: [] // New array init
        };
    } else if (type === 'skills_matrix') {
        initialData = {
            skills_categories: [
                { name: '核心能力', layout: 'radar', items: [{ name: '编程', value: 80, unit: '' }] }
            ]
        };
    }

    const newBlock: ContentBlock = {
      id: createBlockId(),
      type,
      data: initialData
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

  const getBlockImageUrls = (block: ContentBlock, field: BlockImageField): string[] => {
    if (field === 'hero_image_urls') {
      return block.data.hero_image_urls || (block.data.hero_image_url ? [block.data.hero_image_url] : []);
    }
    return block.data[field] || [];
  };

  const updateBlockImageUrls = (blockId: string, field: BlockImageField, nextUrls: string[]) => {
    setEditingItem((prev: any) => {
      if (!prev) return prev;
      const nextBlocks = (prev.content_blocks || []).map((block: ContentBlock) => {
        if (block.id !== blockId) return block;
        if (field === 'hero_image_urls') {
          return {
            ...block,
            data: {
              ...block.data,
              hero_image_urls: nextUrls,
              hero_image_url: nextUrls[0] || ''
            }
          };
        }
        return {
          ...block,
          data: {
            ...block.data,
            [field]: nextUrls
          }
        };
      });
      return { ...prev, content_blocks: nextBlocks };
    });
  };

  const handleBlockImageDragStart = (blockId: string, field: BlockImageField, index: number) => {
    setDraggedBlockImage({ blockId, field, index });
  };

  const handleBlockImageDragOver = (e: React.DragEvent, blockId: string, field: BlockImageField, targetIndex: number) => {
    e.preventDefault();
    if (!draggedBlockImage) return;
    if (draggedBlockImage.blockId !== blockId || draggedBlockImage.field !== field || draggedBlockImage.index === targetIndex) return;

    setEditingItem((prev: any) => {
      if (!prev) return prev;
      const nextBlocks = (prev.content_blocks || []).map((block: ContentBlock) => {
        if (block.id !== blockId) return block;
        const currentUrls = getBlockImageUrls(block, field);
        if (
          draggedBlockImage.index < 0 ||
          draggedBlockImage.index >= currentUrls.length ||
          targetIndex < 0 ||
          targetIndex >= currentUrls.length
        ) {
          return block;
        }

        const reordered = [...currentUrls];
        const [draggedUrl] = reordered.splice(draggedBlockImage.index, 1);
        reordered.splice(targetIndex, 0, draggedUrl);

        if (field === 'hero_image_urls') {
          return {
            ...block,
            data: {
              ...block.data,
              hero_image_urls: reordered,
              hero_image_url: reordered[0] || ''
            }
          };
        }

        return {
          ...block,
          data: {
            ...block.data,
            [field]: reordered
          }
        };
      });

      return { ...prev, content_blocks: nextBlocks };
    });

    setDraggedBlockImage((prev) => (prev ? { ...prev, index: targetIndex } : prev));
  };

  const handleBlockImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedBlockImage(null);
  };

  const handleBlockImageDragEnd = () => {
    setDraggedBlockImage(null);
  };

  // Helper for Info List / Table / Skills modification inside a block
  const updateBlockDataNested = (blockId: string, path: (string | number)[], value: any) => {
      const newBlocks = editingItem.content_blocks.map((b: ContentBlock) => {
          if (b.id === blockId) {
              const newData = { ...b.data };
              let current: any = newData;
              for (let i = 0; i < path.length - 1; i++) {
                  current = current[path[i]];
              }
              current[path[path.length - 1]] = value;
              return { ...b, data: newData };
          }
          return b;
      });
      setEditingItem({ ...editingItem, content_blocks: newBlocks });
  };

  // --- CRUD ---
  const handleCreateNew = () => {
    setIsNewRecord(true);
    setPrePolishState(null);
    setPolishingBlockId(null);
    let template: any = {};
    if (activeTab === 'curriculum') template = { id: 'New', level: '', age: '', title: '', description: '', skills: [], icon_name: 'Box', image_urls: [], sort_order: 99 };
    else if (activeTab === 'showcase') template = { title: '', category: '商业级产品', description: '', image_urls: [], sort_order: 99 };
    else if (activeTab === 'social') template = { title: '商业化案例', subtitle: '', quote: '', footer_note: '', image_urls: [], sort_order: 99 };
    else if (activeTab === 'philosophy') template = { title: '', content: '', icon_name: 'Star', sort_order: 99 };
    else if (activeTab === 'students') {
        template = { 
            slug: '', 
            student_name: '', 
            access_password: '', 
            content_blocks: [
                {
                    id: 'default-profile',
                    type: 'profile_header',
                    data: {
                        student_title: '',
                        summary_bio: '',
                        avatar_url: '',
                        hero_image_urls: []
                    }
                }
            ],
            theme_config: { theme: 'tech_dark' }
        };
    }
    
    setEditingItem(template);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setIsNewRecord(false);
    setPrePolishState(null);
    setPolishingBlockId(null);
    
    const preparedItem = JSON.parse(JSON.stringify(item));
    
    // MIGRATION LOGIC: If opening an old portfolio that has top-level skills/profile but no blocks
    if (activeTab === 'students') {
        if (!preparedItem.content_blocks) preparedItem.content_blocks = [];
        
        // 1. Check for Profile
        const hasProfileBlock = preparedItem.content_blocks.some((b: any) => b.type === 'profile_header');
        if (!hasProfileBlock && (preparedItem.student_title || preparedItem.summary_bio || preparedItem.avatar_url)) {
            preparedItem.content_blocks.unshift({
                id: 'migrated-profile',
                type: 'profile_header',
                data: {
                    student_title: preparedItem.student_title,
                    summary_bio: preparedItem.summary_bio,
                    avatar_url: preparedItem.avatar_url,
                    hero_image_url: preparedItem.hero_image_url,
                    hero_image_urls: preparedItem.hero_image_url ? [preparedItem.hero_image_url] : []
                }
            });
        }

        // 2. Check for Skills
        const hasSkillsBlock = preparedItem.content_blocks.some((b: any) => b.type === 'skills_matrix');
        if (!hasSkillsBlock && preparedItem.skills && preparedItem.skills.length > 0) {
            // Find insertion point (after profile)
            const insertIndex = preparedItem.content_blocks.length > 0 && preparedItem.content_blocks[0].type === 'profile_header' ? 1 : 0;
            preparedItem.content_blocks.splice(insertIndex, 0, {
                id: 'migrated-skills',
                type: 'skills_matrix',
                data: {
                    skills_categories: preparedItem.skills
                }
            });
        }

        preparedItem.content_blocks = sanitizeSkillsMatrixBlocks(preparedItem.content_blocks);
    }

    setEditingItem(preparedItem); 
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

      const dataToSave = { ...editingItem };

      if (activeTab === 'students') {
        if (!dataToSave.slug || !dataToSave.student_name) throw new Error("请填写基本信息");
        dataToSave.content_blocks = sanitizeSkillsMatrixBlocks(dataToSave.content_blocks || []);

        // SYNC LOGIC: Sync 'profile_header' block data to top-level legacy fields for metadata consistency (List view, Lock screen)
        const profileBlock = dataToSave.content_blocks?.find((b: any) => b.type === 'profile_header');
        if (profileBlock && profileBlock.data) {
            dataToSave.student_title = profileBlock.data.student_title;
            dataToSave.summary_bio = profileBlock.data.summary_bio;
            dataToSave.avatar_url = profileBlock.data.avatar_url;
            // Use the first image in array for legacy field or fallback to singular
            dataToSave.hero_image_url = (profileBlock.data.hero_image_urls && profileBlock.data.hero_image_urls.length > 0) 
                ? profileBlock.data.hero_image_urls[0] 
                : profileBlock.data.hero_image_url;
        }
      }

      if (isNewRecord) {
        const { error } = await supabase.from(table).insert([dataToSave]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).update(dataToSave).eq('id', dataToSave.id);
        if (error) throw error;
      }
      await fetchData(); 
      setIsModalOpen(false);
      setEditingItem(null);
      setPrePolishState(null);
      setPolishingBlockId(null);
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

    const selectedFiles = Array.from(event.target.files);
    const filesToUpload = targetType === 'evidence' ? selectedFiles : [selectedFiles[0]];
    const invalidFiles = filesToUpload.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      alert("仅支持上传图片格式文件");
      event.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
        const fileExt = COMPRESSION_OPTIONS.fileType?.split('/')[1] || compressedFile.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(fileName, compressedFile, { cacheControl: CACHE_CONTROL_MAX_AGE, upsert: false });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        uploadedUrls.push(data.publicUrl);
      }

      if (activeTab === 'students' && blockId) {
         // Specialized block image uploads
         const block = editingItem.content_blocks.find((b: any) => b.id === blockId);
         if (block) {
             if (targetType === 'avatar') {
                 updateContentBlock(blockId, 'avatar_url', uploadedUrls[0]);
             } else if (targetType === 'hero') {
                 // UPDATED: Support multiple hero images
                 // Init array from existing array OR legacy string
                 const currentUrls = block.data.hero_image_urls || (block.data.hero_image_url ? [block.data.hero_image_url] : []);
                 const newUrls = [...currentUrls, ...uploadedUrls];
                 updateBlockImageUrls(blockId, 'hero_image_urls', newUrls);

             } else {
                 // Array types
                 const field = targetType === 'evidence' ? 'evidence_urls' : 'urls';
                 updateContentBlock(blockId, field, [...(block.data[field] || []), ...uploadedUrls]);
             }
         }
      } else if (activeTab !== 'students') {
         if (['curriculum', 'showcase', 'social'].includes(activeTab)) {
            setEditingItem({ ...editingItem, image_urls: [...(editingItem.image_urls || []), ...uploadedUrls] });
         } else {
            setEditingItem({ ...editingItem, icon_name: uploadedUrls[0] });
         }
      }
    } catch (error: any) {
      alert('上传失败: ' + error.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleAddVideo = (blockId: string) => {
    const videoCode = prompt("请输入视频代码 (推荐使用 <iframe> 嵌入代码):");
    if (videoCode) {
      if (!videoCode.includes('<iframe') && !videoCode.startsWith('http')) { alert("无效的视频代码"); return; }
      const newBlocks = editingItem.content_blocks.map((b: ContentBlock) => b.id === blockId ? { ...b, data: { ...b.data, urls: [...(b.data.urls || []), videoCode] } } : b);
      setEditingItem({ ...editingItem, content_blocks: newBlocks });
    }
  };

  const requestAiJson = async (systemPrompt: string, userPrompt: string, temperature: number = 0.5) => {
    const response = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aiConfig.apiKey}` },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature
      })
    });

    const rawText = await response.text();
    let data: any = null;

    try {
      data = JSON.parse(rawText);
    } catch (error) {
      throw new Error(`AI 返回格式异常: ${rawText.slice(0, 180)}`);
    }

    if (!response.ok) {
      throw new Error(data?.error?.message || `请求失败 (${response.status})`);
    }

    if (data?.error) {
      throw new Error(data.error.message || 'AI 请求失败');
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('AI 未返回可解析内容');
    }

    const jsonPayload = extractJsonPayload(content);
    try {
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error(`AI 返回 JSON 解析失败: ${jsonPayload.slice(0, 180)}`);
    }
  };

  const getPolishPayloadData = (block: ContentBlock) => {
    switch (block.type) {
      case 'profile_header':
        return {
          student_title: block.data.student_title || '',
          summary_bio: block.data.summary_bio || ''
        };
      case 'skills_matrix':
        return {
          skills_categories: (block.data.skills_categories || []).map((cat) => ({
            name: cat.name,
            layout: cat.layout,
            items: (cat.items || []).map((item) => ({
              name: item.name,
              value: item.value,
              unit: item.unit || ''
            }))
          }))
        };
      case 'timeline_node':
        return {
          date: block.data.date || '',
          title: block.data.title || '',
          content: block.data.content || ''
        };
      case 'project_highlight':
        return {
          title: block.data.title || '',
          star_situation: block.data.star_situation || '',
          star_task: block.data.star_task || '',
          star_action: block.data.star_action || '',
          star_result: block.data.star_result || ''
        };
      case 'info_list':
        return {
          title: block.data.title || '',
          info_items: (block.data.info_items || []).map((item) => ({
            icon: item.icon || 'Star',
            label: item.label || '',
            value: item.value || ''
          }))
        };
      case 'section_heading':
      case 'text':
      case 'image_grid':
        return {
          title: block.data.title || '',
          content: block.type === 'text' ? block.data.content || '' : undefined
        };
      case 'table':
        return {
          title: block.data.title || '',
          table_columns: block.data.table_columns || [],
          table_rows: block.data.table_rows || []
        };
      default:
        return block.data;
    }
  };

  const hasTextContent = (value: any): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.some((item) => hasTextContent(item));
    if (value && typeof value === 'object') return Object.values(value).some((item) => hasTextContent(item));
    return false;
  };

  const canPolishBlock = (block: ContentBlock): boolean => hasTextContent(getPolishPayloadData(block));

  const mergePolishedBlockData = (originalBlock: ContentBlock, polishedData: any): ContentBlock => {
    if (!polishedData || typeof polishedData !== 'object') return originalBlock;

    const asString = (value: any, fallback: string = '') => (typeof value === 'string' ? value : fallback);

    if (originalBlock.type === 'profile_header') {
      return {
        ...originalBlock,
        data: {
          ...originalBlock.data,
          student_title: asString(polishedData.student_title, originalBlock.data.student_title || ''),
          summary_bio: asString(polishedData.summary_bio, originalBlock.data.summary_bio || '')
        }
      };
    }

    if (originalBlock.type === 'section_heading') {
      return {
        ...originalBlock,
        data: {
          ...originalBlock.data,
          title: asString(polishedData.title, originalBlock.data.title || '')
        }
      };
    }

    if (originalBlock.type === 'timeline_node') {
      return {
        ...originalBlock,
        data: {
          ...originalBlock.data,
          date: asString(polishedData.date, originalBlock.data.date || ''),
          title: asString(polishedData.title, originalBlock.data.title || ''),
          content: asString(polishedData.content, originalBlock.data.content || '')
        }
      };
    }

    if (originalBlock.type === 'project_highlight') {
      return {
        ...originalBlock,
        data: {
          ...originalBlock.data,
          title: asString(polishedData.title, originalBlock.data.title || ''),
          star_situation: asString(polishedData.star_situation, originalBlock.data.star_situation || ''),
          star_task: asString(polishedData.star_task, originalBlock.data.star_task || ''),
          star_action: asString(polishedData.star_action, originalBlock.data.star_action || ''),
          star_result: asString(polishedData.star_result, originalBlock.data.star_result || '')
        }
      };
    }

    if (originalBlock.type === 'info_list') {
      const polishedItems = Array.isArray(polishedData.info_items) ? polishedData.info_items : [];
      return {
        ...originalBlock,
        data: {
          ...originalBlock.data,
          title: asString(polishedData.title, originalBlock.data.title || ''),
          info_items: (originalBlock.data.info_items || []).map((item, index) => ({
            ...item,
            label: asString(polishedItems[index]?.label, item.label),
            value: asString(polishedItems[index]?.value, item.value)
          }))
        }
      };
    }

    if (originalBlock.type === 'table') {
      const polishedColumns = Array.isArray(polishedData.table_columns) ? polishedData.table_columns : [];
      const polishedRows = Array.isArray(polishedData.table_rows) ? polishedData.table_rows : [];
      return {
        ...originalBlock,
        data: {
          ...originalBlock.data,
          title: asString(polishedData.title, originalBlock.data.title || ''),
          table_columns: (originalBlock.data.table_columns || []).map((col, columnIndex) =>
            asString(polishedColumns[columnIndex], col)
          ),
          table_rows: (originalBlock.data.table_rows || []).map((row, rowIndex) =>
            row.map((cell, columnIndex) => asString(polishedRows[rowIndex]?.[columnIndex], cell))
          )
        }
      };
    }

    if (originalBlock.type === 'skills_matrix') {
      const polishedCategories = Array.isArray(polishedData.skills_categories) ? polishedData.skills_categories : [];
      return {
        ...originalBlock,
        data: {
          ...originalBlock.data,
          skills_categories: (originalBlock.data.skills_categories || []).map((category, categoryIndex) => {
            const polishedCategory = polishedCategories[categoryIndex] || {};
            const polishedItems = Array.isArray(polishedCategory.items) ? polishedCategory.items : [];
            return {
              ...category,
              name: asString(polishedCategory.name, category.name),
              items: (category.items || []).map((item, itemIndex) => ({
                ...item,
                name: asString(polishedItems[itemIndex]?.name, item.name),
                unit: asString(polishedItems[itemIndex]?.unit, item.unit || '')
              }))
            };
          })
        }
      };
    }

    if (originalBlock.type === 'text') {
      return {
        ...originalBlock,
        data: {
          ...originalBlock.data,
          title: asString(polishedData.title, originalBlock.data.title || ''),
          content: asString(polishedData.content, originalBlock.data.content || '')
        }
      };
    }

    if (originalBlock.type === 'image_grid') {
      return {
        ...originalBlock,
        data: {
          ...originalBlock.data,
          title: asString(polishedData.title, originalBlock.data.title || '')
        }
      };
    }

    return originalBlock;
  };

  // --- AI Gen ---
  const handleAIGenerate = async () => {
    if (!aiConfig.apiKey || !aiPrompt.trim()) return alert('请配置 API Key 并输入资料');
    if (!editingItem) return;
    setIsGenerating(true);

    try {
      const systemPrompt = `你是 SparkMinds 学生成长档案编辑助手。
请将用户输入整理为“学生成长档案页面内容流”，仅输出 JSON（不要 markdown，不要解释）。
允许的模块 type 仅限：${STUDENT_AI_BLOCK_TYPES.join(', ')}。
输出格式：
{
  "student_name": "可选",
  "content_blocks": [
    { "type": "profile_header", "data": { "student_title": "", "summary_bio": "" } },
    { "type": "skills_matrix", "data": { "skills_categories": [ { "name": "", "layout": "bar", "items": [ { "name": "", "value": 80, "unit": "" } ] } ] } },
    { "type": "section_heading", "data": { "title": "" } },
    { "type": "timeline_node", "data": { "date": "", "title": "", "content": "" } },
    { "type": "project_highlight", "data": { "title": "", "star_situation": "", "star_task": "", "star_action": "", "star_result": "" } },
    { "type": "info_list", "data": { "title": "", "info_items": [ { "icon": "Star", "label": "", "value": "" } ] } },
    { "type": "table", "data": { "title": "", "table_columns": ["项目", "内容"], "table_rows": [["", ""]] } },
    { "type": "text", "data": { "title": "", "content": "" } },
    { "type": "image_grid", "data": { "title": "" } }
  ]
}
规则：
1. 最多只返回一个 profile_header。
2. 文案用简体中文，适配成长档案语境，表达具体、有证据感。
3. 不要编造图片链接，不要输出无关字段。`;

      const aiResult = await requestAiJson(systemPrompt, aiPrompt, 0.55);
      const rawBlocks = Array.isArray(aiResult) ? aiResult : aiResult?.content_blocks;
      const generatedBlocks = normalizeGeneratedBlocks(rawBlocks);

      if (!generatedBlocks.length) {
        throw new Error('AI 未返回可用的内容模块');
      }

      setEditingItem((prev: any) => {
        const mergedBlocks = mergeGeneratedBlocks(prev?.content_blocks || [], generatedBlocks, aiGenerateMode);
        return {
          ...prev,
          student_name: !prev?.student_name && typeof aiResult?.student_name === 'string' ? aiResult.student_name : prev?.student_name,
          content_blocks: sanitizeSkillsMatrixBlocks(mergedBlocks)
        };
      });

      setAiPrompt('');
      alert(`AI 生成成功，已更新 ${generatedBlocks.length} 个模块`);
    } catch (e: any) {
      alert('AI 生成失败: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUndoPolish = () => {
    if (!prePolishState) return;
    setEditingItem(prePolishState);
    setPrePolishState(null);
    alert('已恢复到润色前版本');
  };

  const handleAIPolishBlock = async (blockId: string) => {
    if (!aiConfig.apiKey) return alert('请先在系统设置中配置 API Key');
    if (polishingBlockId || !editingItem) return;

    const targetBlock = (editingItem.content_blocks || []).find((block: ContentBlock) => block.id === blockId);
    if (!targetBlock) return;
    if (!canPolishBlock(targetBlock)) return alert('该模块暂无可润色的已输入文字');

    setPrePolishState(JSON.parse(JSON.stringify(editingItem)));
    setPolishingBlockId(blockId);

    try {
      const payload = {
        block: {
          id: targetBlock.id,
          type: targetBlock.type,
          data: getPolishPayloadData(targetBlock)
        }
      };

      const systemPrompt = `你是 SparkMinds 学生成长档案文字编辑。
任务：只润色单个内容模块里的已有文字，使表达更清晰、专业、有说服力（中文）。
硬性约束：
1. 只处理输入中的这个 block，必须保留 id、type 和整体字段结构。
2. 仅优化文字，不得新增/删除字段，不得修改数值、布局、图片链接、数组长度。
3. 输出必须是纯 JSON，格式为 { "block": { "id": "...", "type": "...", "data": { ... } } }。`;

      const polishedResult = await requestAiJson(systemPrompt, JSON.stringify(payload), 0.35);
      const polishedBlock = polishedResult?.block;
      if (!polishedBlock || polishedBlock.id !== targetBlock.id || polishedBlock.type !== targetBlock.type) {
        throw new Error('AI 返回结构不匹配，已取消应用');
      }

      setEditingItem((prev: any) => {
        const nextBlocks = (prev.content_blocks || []).map((oldBlock: ContentBlock) => {
          if (oldBlock.id !== blockId) return oldBlock;
          return mergePolishedBlockData(oldBlock, polishedBlock.data);
        });
        return {
          ...prev,
          content_blocks: sanitizeSkillsMatrixBlocks(nextBlocks)
        };
      });

      alert('AI 已润色当前模块');
    } catch (e: any) {
      alert('AI 润色失败: ' + e.message);
      setPrePolishState(null);
    } finally {
      setPolishingBlockId(null);
    }
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
                                   {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-2xl">{s.student_name[0]}</div>}
                                </div>
                                <div>
                                   <h3 className="font-bold text-lg text-slate-900">{s.student_name}</h3>
                                   <p className="text-xs text-slate-500 truncate max-w-[150px]">{s.student_title || s.slug}</p>
                                </div>
                             </div>
                          </div>
                       ))}
                       {students.length === 0 && <div className="col-span-full text-center py-12 text-slate-400">暂无学生档案，请点击右上角添加</div>}
                    </div>
                )}
                {activeTab === 'settings' && (
                   <div className="max-w-2xl bg-white p-8">
                      {/* ... settings content ... */}
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Icons.Sparkles className="text-blue-500" /> AI 助手配置</h3>
                      <div className="space-y-6">
                         <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">快速预设</label>
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
                         <div><label className="block text-sm font-bold text-slate-700 mb-1">Base URL</label><input type="text" value={aiConfig.baseUrl} onChange={e => setAiConfig({...aiConfig, baseUrl: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="https://api.openai.com/v1" /></div>
                         <div><label className="block text-sm font-bold text-slate-700 mb-1">API Key</label><input type="password" value={aiConfig.apiKey} onChange={e => setAiConfig({...aiConfig, apiKey: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="sk-..." /></div>
                         <div><label className="block text-sm font-bold text-slate-700 mb-1">Model Name</label><input type="text" value={aiConfig.model} onChange={e => setAiConfig({...aiConfig, model: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="gpt-4o" /></div>
                         <button onClick={handleSaveSettings} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-700">保存配置</button>
                      </div>
                   </div>
                )}
                {/* ... other tabs ... */}
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
             <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-lg">{isNewRecord ? '添加' : '编辑'} {getHeaderTitle()}</h3>
                 <div className="flex gap-4">
                    {activeTab === 'students' && (
                        <button 
                            onClick={() => setIsAiPanelOpen(!isAiPanelOpen)} 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${isAiPanelOpen ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            <Icons.Sparkles size={16} /> AI 助手
                        </button>
                    )}
                    <button onClick={() => setIsModalOpen(false)}><Icons.X className="text-slate-400 hover:text-slate-600" /></button>
                 </div>
             </div>
             
             {/* AI Panel */}
             {isAiPanelOpen && activeTab === 'students' && (
                 <div className="bg-indigo-50 border-b border-indigo-100 p-4 animate-slide-down space-y-3">
                     <div className="flex items-center justify-between gap-3">
                         <div className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                           <Icons.Bot size={16} />
                           AI 助手（当前页面框架）
                         </div>
                         {!aiConfig.apiKey && (
                           <div className="text-xs text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded">
                             未配置 API Key，请先到系统配置保存
                           </div>
                         )}
                     </div>
                     <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
                         <div className="space-y-2">
                             <textarea 
                                className="w-full h-28 p-3 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                                placeholder="输入原始资料（简历、笔记、活动记录、获奖信息），AI 将按当前档案模块结构生成内容..." 
                                value={aiPrompt} 
                                onChange={e => setAiPrompt(e.target.value)} 
                             />
                             <div className="text-xs text-indigo-700 bg-indigo-100/60 border border-indigo-200 rounded-lg px-3 py-2">
                               生成范围：个人头图、技能矩阵、章节标题、时间节点、STAR 项目、个人信息、表格、文本、图集。
                             </div>
                         </div>
                         <div className="flex flex-col gap-2">
                             <div className="bg-white border border-indigo-200 rounded-lg p-2">
                               <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">生成方式</div>
                               <div className="grid grid-cols-2 gap-2">
                                 <button
                                   onClick={() => setAiGenerateMode('replace')}
                                   className={`text-xs font-bold py-1.5 rounded border transition-colors ${
                                     aiGenerateMode === 'replace'
                                       ? 'bg-indigo-600 text-white border-indigo-600'
                                       : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                   }`}
                                 >
                                   覆盖
                                 </button>
                                 <button
                                   onClick={() => setAiGenerateMode('append')}
                                   className={`text-xs font-bold py-1.5 rounded border transition-colors ${
                                     aiGenerateMode === 'append'
                                       ? 'bg-indigo-600 text-white border-indigo-600'
                                       : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                   }`}
                                 >
                                   追加
                                 </button>
                               </div>
                             </div>
                             <button
                               onClick={handleAIGenerate}
                               disabled={isGenerating || Boolean(polishingBlockId) || !aiPrompt.trim()}
                               className="h-10 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                             >
                                 {isGenerating ? <Icons.Loader2 className="animate-spin" /> : <Icons.Wand2 />} 生成档案
                             </button>
                             <div className="h-10 bg-white border border-indigo-200 text-indigo-700 rounded-lg font-bold text-xs flex items-center justify-center px-2 text-center">
                               润色请在每个模块右上角点击羽毛按钮
                             </div>
                             {prePolishState && (
                               <button
                                 onClick={handleUndoPolish}
                                 disabled={Boolean(polishingBlockId)}
                                 className="h-9 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                               >
                                 <Icons.RotateCcw size={14} /> 撤销润色
                               </button>
                             )}
                         </div>
                     </div>
                 </div>
             )}

             <div className="flex-1 overflow-y-auto p-6 relative">
                
                {activeTab === 'students' ? (
                   <div className="space-y-8">
                      {/* 1. Basic Settings (Top Bar) */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-4 gap-4">
                          <div className="col-span-1"><label className="block text-xs font-bold text-slate-500 mb-1">学生姓名</label><input className="w-full border p-2 rounded text-sm font-bold" value={editingItem.student_name} onChange={e => setEditingItem({...editingItem, student_name: e.target.value})} /></div>
                          <div className="col-span-1"><label className="block text-xs font-bold text-slate-500 mb-1">URL Slug</label><input className="w-full border p-2 rounded text-sm font-mono text-slate-600" value={editingItem.slug} onChange={e => setEditingItem({...editingItem, slug: e.target.value})} /></div>
                          <div className="col-span-1"><label className="block text-xs font-bold text-slate-500 mb-1">访问密码</label><input className="w-full border p-2 rounded text-sm font-mono" value={editingItem.access_password} onChange={e => setEditingItem({...editingItem, access_password: e.target.value})} /></div>
                          <div className="col-span-1"><label className="block text-xs font-bold text-slate-500 mb-1">主题风格</label><select className="w-full border p-2 rounded text-sm" value={editingItem.theme_config?.theme || 'tech_dark'} onChange={e => setEditingItem({...editingItem, theme_config: { ...editingItem.theme_config, theme: e.target.value }})}><option value="tech_dark">科技深色</option><option value="academic_light">学术浅色</option><option value="creative_color">创意彩色</option></select></div>
                      </div>

                      {/* 2. Content Blocks Stream */}
                      <div className="space-y-4">
                          <div className="flex items-center justify-between">
                              <h4 className="font-bold text-slate-700 flex items-center gap-2"><Icons.Layers size={18}/> 页面内容流</h4>
                              <div className="flex gap-2">
                                  {/* Quick Add Buttons */}
                                  <button onClick={() => addContentBlock('profile_header')} className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-200 font-bold hover:bg-purple-200">+ 个人头图</button>
                                  <button onClick={() => addContentBlock('skills_matrix')} className="text-xs bg-pink-100 text-pink-700 px-3 py-1.5 rounded-lg border border-pink-200 font-bold hover:bg-pink-200">+ 技能矩阵</button>
                                  <button onClick={() => addContentBlock('timeline_node')} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 font-bold hover:bg-blue-200">+ 时间节点</button>
                                  <button onClick={() => addContentBlock('project_highlight')} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 font-bold hover:bg-blue-200">+ STAR项目</button>
                                  <button onClick={() => addContentBlock('section_heading')} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 font-bold hover:bg-blue-200">+ 章节标题</button>
                                  <button onClick={() => addContentBlock('image_grid')} className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg border hover:bg-slate-200">+ 图集</button>
                                  <button onClick={() => addContentBlock('info_list')} className="text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg border border-orange-200 font-bold hover:bg-orange-200">+ 个人信息</button>
                                  <button onClick={() => addContentBlock('table')} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 font-bold hover:bg-green-200">+ 表格</button>
                              </div>
                          </div>

                          <div className="space-y-4 pb-20">
                            {editingItem.content_blocks?.map((b: any, i: number) => {
                               const blockIsPolishing = polishingBlockId === b.id;
                               const blockCanPolish = canPolishBlock(b as ContentBlock);
                               return (
                               <div key={b.id} className={`border rounded-xl relative group transition-all ${b.type === 'profile_header' ? 'bg-purple-50 border-purple-200 ring-2 ring-purple-100' : b.type === 'skills_matrix' ? 'bg-pink-50 border-pink-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                                  {/* Block Controls */}
                                  <div className="absolute right-4 top-4 flex gap-1 opacity-20 group-hover:opacity-100 transition-opacity z-10">
                                      <button onClick={() => moveContentBlock(i, 'up')} className="p-1 hover:bg-slate-200 rounded"><Icons.ArrowUp size={14}/></button>
                                      <button onClick={() => moveContentBlock(i, 'down')} className="p-1 hover:bg-slate-200 rounded"><Icons.ArrowDown size={14}/></button>
                                      <button
                                        onClick={() => handleAIPolishBlock(b.id)}
                                        title="润色当前内容项"
                                        disabled={!blockCanPolish || Boolean(polishingBlockId)}
                                        className="p-1 text-indigo-600 hover:bg-indigo-100 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                                      >
                                        {blockIsPolishing ? <Icons.Loader2 size={14} className="animate-spin" /> : <Icons.Feather size={14}/>}
                                      </button>
                                      <button onClick={() => removeContentBlock(b.id)} className="p-1 text-red-500 hover:bg-red-100 rounded ml-2"><Icons.Trash2 size={14}/></button>
                                  </div>
                                  
                                  {/* Label */}
                                  <div className="absolute left-4 top-4 text-[10px] font-black uppercase tracking-widest opacity-30 select-none pointer-events-none">
                                      {b.type.replace('_', ' ')}
                                  </div>

                                  <div className="p-6 pt-10">
                                      {/* === PROFILE HEADER EDITOR === */}
                                      {b.type === 'profile_header' && (
                                          <div className="space-y-4">
                                              <div className="flex gap-6">
                                                  <div className="w-24 shrink-0">
                                                      <label className="block text-xs font-bold text-purple-700 mb-2 text-center">头像</label>
                                                      <div className="relative w-24 h-24 rounded-full bg-slate-200 overflow-hidden group/avatar cursor-pointer border-2 border-white shadow-md">
                                                          {b.data.avatar_url ? <img src={b.data.avatar_url} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-400"><Icons.User size={32}/></div>}
                                                          {/* Corrected: Input must be clickable. Overlay text should ignore events */}
                                                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 text-white text-xs font-bold pointer-events-none">更换</div>
                                                          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => handleImageUpload(e, 'avatar', b.id)} />
                                                      </div>
                                                  </div>
                                                  <div className="flex-1 space-y-3">
                                                      <input className="w-full text-xl font-bold bg-transparent border-b border-purple-200 focus:border-purple-500 outline-none px-1 py-1" placeholder="头衔 / Slogan (e.g. Future Innovator)" value={b.data.student_title || ''} onChange={e => updateContentBlock(b.id, 'student_title', e.target.value)} />
                                                      <textarea className="w-full h-20 text-sm bg-white/50 border border-purple-100 rounded-lg p-2 focus:ring-1 focus:ring-purple-500 outline-none resize-none" placeholder="个人简介 (Summary Bio)..." value={b.data.summary_bio || ''} onChange={e => updateContentBlock(b.id, 'summary_bio', e.target.value)} />
                                                  </div>
                                              </div>
                                              <div className="pt-2 border-t border-purple-100">
                                                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer hover:text-purple-600 transition-colors w-fit mb-3">
                                                      <Icons.Image size={14} /> 
                                                      点击添加头图 (Hero Images)
                                                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'hero', b.id)} />
                                                  </label>
                                                  {/* Hero Images Gallery */}
                                                  <div className="flex flex-wrap gap-2">
                                                      {/* Show existing array or legacy single url */}
                                                      {(b.data.hero_image_urls || (b.data.hero_image_url ? [b.data.hero_image_url] : [])).map((url: string, imgIdx: number) => (
                                                          <div
                                                              key={`${url}-${imgIdx}`}
                                                              draggable
                                                              onDragStart={() => handleBlockImageDragStart(b.id, 'hero_image_urls', imgIdx)}
                                                              onDragOver={(e) => handleBlockImageDragOver(e, b.id, 'hero_image_urls', imgIdx)}
                                                              onDrop={handleBlockImageDrop}
                                                              onDragEnd={handleBlockImageDragEnd}
                                                              className={`h-20 w-32 rounded-lg bg-slate-100 overflow-hidden relative group/heroimg border transition-colors cursor-move ${
                                                                  draggedBlockImage?.blockId === b.id && draggedBlockImage?.field === 'hero_image_urls' && draggedBlockImage?.index === imgIdx
                                                                      ? 'border-purple-500'
                                                                      : 'border-purple-200'
                                                              }`}
                                                          >
                                                              <img src={url} className="w-full h-full object-cover" />
                                                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/heroimg:opacity-100 flex items-center justify-center transition-opacity">
                                                                  <button 
                                                                    onClick={() => {
                                                                        const currentUrls = getBlockImageUrls(b, 'hero_image_urls');
                                                                        updateBlockImageUrls(
                                                                            b.id,
                                                                            'hero_image_urls',
                                                                            currentUrls.filter((_: string, idx: number) => idx !== imgIdx)
                                                                        );
                                                                    }}
                                                                    className="text-white hover:text-red-400"
                                                                  >
                                                                      <Icons.Trash2 size={16} />
                                                                  </button>
                                                              </div>
                                                          </div>
                                                      ))}
                                                      {(!b.data.hero_image_urls?.length && !b.data.hero_image_url) && (
                                                          <div className="text-xs text-slate-400 italic py-2">暂无背景头图</div>
                                                      )}
                                                  </div>
                                              </div>
                                          </div>
                                      )}

                                      {/* === SKILLS MATRIX EDITOR === */}
                                      {b.type === 'skills_matrix' && (
                                          <div className="space-y-4">
                                              {(b.data.skills_categories || []).map((cat: SkillCategory, catIdx: number) => (
                                                  <div key={catIdx} className="bg-white border border-pink-100 rounded-lg p-3">
                                                      <div className="flex justify-between items-center mb-3">
                                                          <div className="flex gap-2 items-center flex-1">
                                                              <input className="font-bold text-sm border-b border-transparent focus:border-pink-500 outline-none" value={cat.name} onChange={e => updateBlockDataNested(b.id, ['skills_categories', catIdx, 'name'], e.target.value)} placeholder="分类名称" />
                                                              <select className="text-xs bg-slate-50 border rounded px-1" value={cat.layout} onChange={e => updateBlockDataNested(b.id, ['skills_categories', catIdx, 'layout'], e.target.value)}>
                                                                  <option value="bar">条形图</option><option value="radar">雷达图</option><option value="circle">环形图</option><option value="stat_grid">数字卡片</option>
                                                              </select>
                                                          </div>
                                                          <button onClick={() => {
                                                              const newCats = [...b.data.skills_categories]; newCats.splice(catIdx, 1);
                                                              updateContentBlock(b.id, 'skills_categories', newCats);
                                                          }} className="text-slate-300 hover:text-red-500"><Icons.X size={14}/></button>
                                                      </div>
                                                      <div className="grid grid-cols-2 gap-2">
                                                          {cat.items.map((skill, skIdx) => (
                                                              <div key={skIdx} className="flex gap-1 items-center bg-slate-50 p-1 rounded">
                                                                  <input className="text-xs bg-transparent w-full outline-none" value={skill.name} onChange={e => {
                                                                      const newCats = [...b.data.skills_categories]; newCats[catIdx].items[skIdx].name = e.target.value;
                                                                      updateContentBlock(b.id, 'skills_categories', newCats);
                                                                  }} />
                                                                  <input className="text-xs bg-transparent w-8 text-right font-mono" type="number" value={skill.value} onChange={e => {
                                                                      const newCats = [...b.data.skills_categories]; newCats[catIdx].items[skIdx].value = parseFloat(e.target.value);
                                                                      updateContentBlock(b.id, 'skills_categories', newCats);
                                                                  }} />
                                                                  <input
                                                                      className="text-[10px] bg-transparent w-10 text-slate-400 outline-none"
                                                                      value={skill.unit ?? ''}
                                                                      onChange={e => {
                                                                          const newCats = [...b.data.skills_categories];
                                                                          newCats[catIdx].items[skIdx].unit = e.target.value;
                                                                          updateContentBlock(b.id, 'skills_categories', newCats);
                                                                      }}
                                                                      placeholder="%"
                                                                  />
                                                              </div>
                                                          ))}
                                                          <button onClick={() => {
                                                              const newCats = [...b.data.skills_categories]; newCats[catIdx].items.push({ name: '新技能', value: 80, unit: '' });
                                                              updateContentBlock(b.id, 'skills_categories', newCats);
                                                          }} className="text-xs text-pink-500 font-bold bg-pink-50 p-1 rounded hover:bg-pink-100">+ 加项</button>
                                                      </div>
                                                  </div>
                                              ))}
                                              <button onClick={() => updateContentBlock(b.id, 'skills_categories', [...(b.data.skills_categories || []), { name: '新分类', layout: 'bar', items: [] }])} className="w-full py-2 text-xs font-bold text-pink-600 border border-dashed border-pink-300 rounded hover:bg-pink-50">添加技能分类</button>
                                          </div>
                                      )}

                                      {/* === SECTION HEADING === */}
                                      {b.type === 'section_heading' && (
                                          <div className="text-center">
                                              <input className="w-full text-center text-xl font-bold bg-transparent border-b-2 border-blue-100 focus:border-blue-500 outline-none py-2 placeholder-slate-300" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} placeholder="输入章节标题" />
                                          </div>
                                      )}

                                      {/* === TIMELINE NODE === */}
                                      {b.type === 'timeline_node' && (
                                          <div className="space-y-3">
                                              <div className="flex gap-3">
                                                  <input className="w-32 text-sm font-mono border rounded p-2 bg-slate-50" value={b.data.date || ''} onChange={e => updateContentBlock(b.id, 'date', e.target.value)} placeholder="时间 (e.g. 2023)" />
                                                  <input className="flex-1 font-bold border rounded p-2" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} placeholder="事件标题" />
                                              </div>
                                              <textarea className="w-full h-20 text-sm border rounded p-2 resize-none" value={b.data.content || ''} onChange={e => updateContentBlock(b.id, 'content', e.target.value)} placeholder="详细描述..." />
                                              <div className="flex flex-wrap gap-2">
                                                  {b.data.urls?.map((url: string, i: number) => (
                                                      <div
                                                          key={`${url}-${i}`}
                                                          draggable
                                                          onDragStart={() => handleBlockImageDragStart(b.id, 'urls', i)}
                                                          onDragOver={(e) => handleBlockImageDragOver(e, b.id, 'urls', i)}
                                                          onDrop={handleBlockImageDrop}
                                                          onDragEnd={handleBlockImageDragEnd}
                                                          className={`w-12 h-12 bg-black rounded relative overflow-hidden group/img border transition-colors cursor-move ${
                                                              draggedBlockImage?.blockId === b.id && draggedBlockImage?.field === 'urls' && draggedBlockImage?.index === i
                                                                  ? 'border-blue-500'
                                                                  : 'border-transparent'
                                                          }`}
                                                      >
                                                          <img src={url} className="w-full h-full object-cover" />
                                                          <button onClick={() => { const u = [...b.data.urls]; u.splice(i, 1); updateContentBlock(b.id, 'urls', u); }} className="absolute inset-0 bg-red-500/50 hidden group-hover/img:flex items-center justify-center text-white"><Icons.X size={12}/></button>
                                                      </div>
                                                  ))}
                                                  <label className="w-12 h-12 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-blue-500 text-slate-400 hover:text-blue-500"><Icons.Image size={16} /><input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'standard', b.id)} /></label>
                                              </div>
                                          </div>
                                      )}

                                      {/* === STAR PROJECT === */}
                                      {b.type === 'project_highlight' && (
                                          <div className="space-y-3">
                                              <input className="w-full font-bold text-lg border-b p-1 mb-2" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} placeholder="项目名称" />
                                              <div className="grid grid-cols-2 gap-3">
                                                  <textarea className="text-xs border p-2 rounded h-20" placeholder="Situation (背景)" value={b.data.star_situation || ''} onChange={e => updateContentBlock(b.id, 'star_situation', e.target.value)} />
                                                  <textarea className="text-xs border p-2 rounded h-20" placeholder="Task (任务)" value={b.data.star_task || ''} onChange={e => updateContentBlock(b.id, 'star_task', e.target.value)} />
                                                  <textarea className="text-xs border p-2 rounded h-20" placeholder="Action (行动)" value={b.data.star_action || ''} onChange={e => updateContentBlock(b.id, 'star_action', e.target.value)} />
                                                  <textarea className="text-xs border p-2 rounded h-20" placeholder="Result (结果)" value={b.data.star_result || ''} onChange={e => updateContentBlock(b.id, 'star_result', e.target.value)} />
                                              </div>
                                              <div className="pt-2 border-t space-y-2">
                                                  <label className="inline-flex items-center shrink-0 px-3 py-1 bg-slate-100 rounded text-xs font-bold cursor-pointer hover:bg-slate-200 w-fit">
                                                      + 佐证图
                                                      <input type="file" className="hidden" accept="image/*" multiple onChange={e => handleImageUpload(e, 'evidence', b.id)} />
                                                  </label>
                                                  <div className="flex flex-wrap gap-2">
                                                      {b.data.evidence_urls?.map((url: string, i: number) => (
                                                          <div
                                                              key={`${url}-${i}`}
                                                              draggable
                                                              onDragStart={() => handleBlockImageDragStart(b.id, 'evidence_urls', i)}
                                                              onDragOver={(e) => handleBlockImageDragOver(e, b.id, 'evidence_urls', i)}
                                                              onDrop={handleBlockImageDrop}
                                                              onDragEnd={handleBlockImageDragEnd}
                                                              className={`h-12 w-12 rounded overflow-hidden relative group/evidence border bg-slate-100 transition-colors cursor-move ${
                                                                  draggedBlockImage?.blockId === b.id && draggedBlockImage?.field === 'evidence_urls' && draggedBlockImage?.index === i
                                                                      ? 'border-blue-500'
                                                                      : 'border-slate-200'
                                                              }`}
                                                          >
                                                              <img src={url} className="w-full h-full object-cover" />
                                                              <button
                                                                  onClick={() => {
                                                                      const nextEvidenceUrls = (b.data.evidence_urls || []).filter((_: string, idx: number) => idx !== i);
                                                                      updateContentBlock(b.id, 'evidence_urls', nextEvidenceUrls);
                                                                  }}
                                                                  className="absolute inset-0 bg-black/55 text-white hidden group-hover/evidence:flex items-center justify-center hover:text-red-300"
                                                              >
                                                                  <Icons.X size={12} />
                                                              </button>
                                                          </div>
                                                      ))}
                                                      {!b.data.evidence_urls?.length && (
                                                          <div className="text-xs text-slate-400 italic py-1">暂无佐证图</div>
                                                      )}
                                                  </div>
                                              </div>
                                          </div>
                                      )}

                                      {/* === INFO LIST (Detailed) === */}
                                      {b.type === 'info_list' && (
                                          <div>
                                              <input className="font-bold border-b mb-2 w-full" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} placeholder="信息栏标题" />
                                              <div className="mt-2 grid grid-cols-2 gap-2">
                                                  {b.data.info_items?.map((item: any, idx: number) => (
                                                      <div key={idx} className="flex gap-1 border p-1 rounded group/item relative">
                                                          <input className="w-1/3 font-bold text-xs bg-transparent outline-none" value={item.label} onChange={e => updateBlockDataNested(b.id, ['info_items', idx, 'label'], e.target.value)} placeholder="Label" />
                                                          <input className="w-2/3 text-xs bg-transparent outline-none" value={item.value} onChange={e => updateBlockDataNested(b.id, ['info_items', idx, 'value'], e.target.value)} placeholder="Value" />
                                                          <button onClick={() => {
                                                              const newItems = [...b.data.info_items]; newItems.splice(idx, 1);
                                                              updateContentBlock(b.id, 'info_items', newItems);
                                                          }} className="absolute top-0.5 right-0.5 text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100"><Icons.X size={10}/></button>
                                                      </div>
                                                  ))}
                                                  <button onClick={() => updateContentBlock(b.id, 'info_items', [...(b.data.info_items || []), { icon: 'Star', label: '', value: '' }])} className="text-xs bg-orange-50 text-orange-500 p-1 rounded font-bold hover:bg-orange-100">+ Add Info</button>
                                              </div>
                                          </div>
                                      )}

                                      {/* === TABLE (Full Editor) === */}
                                      {b.type === 'table' && (
                                          <div className="space-y-4">
                                              <input className="font-bold border-b w-full" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} placeholder="表格标题" />
                                              
                                              <div className="overflow-x-auto pb-2">
                                                  <table className="w-full text-xs border-collapse">
                                                      <thead>
                                                          <tr>
                                                              {(b.data.table_columns || []).map((col: string, colIdx: number) => (
                                                                  <th key={colIdx} className="border border-slate-200 bg-slate-50 p-2 min-w-[100px] relative group/col">
                                                                      <input className="w-full bg-transparent font-bold outline-none text-center" value={col} onChange={(e) => {
                                                                          const newCols = [...b.data.table_columns];
                                                                          newCols[colIdx] = e.target.value;
                                                                          updateContentBlock(b.id, 'table_columns', newCols);
                                                                      }} />
                                                                      <button onClick={() => {
                                                                          const newCols = [...b.data.table_columns];
                                                                          newCols.splice(colIdx, 1);
                                                                          // Also remove this index from all rows
                                                                          const newRows = (b.data.table_rows || []).map((row: string[]) => {
                                                                              const r = [...row]; r.splice(colIdx, 1); return r;
                                                                          });
                                                                          const newBlocks = editingItem.content_blocks.map((bl: ContentBlock) => bl.id === b.id ? { ...bl, data: { ...bl.data, table_columns: newCols, table_rows: newRows } } : bl);
                                                                          setEditingItem({ ...editingItem, content_blocks: newBlocks });
                                                                      }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/col:opacity-100 hover:bg-red-600 transition-opacity"><Icons.X size={8}/></button>
                                                                  </th>
                                                              ))}
                                                              <th className="border border-slate-200 bg-slate-50 p-2 w-10">
                                                                  <button onClick={() => {
                                                                      const newCols = [...(b.data.table_columns || []), "新列"];
                                                                      // Add empty cell to all rows
                                                                      const newRows = (b.data.table_rows || []).map((row: string[]) => [...row, ""]);
                                                                      const newBlocks = editingItem.content_blocks.map((bl: ContentBlock) => bl.id === b.id ? { ...bl, data: { ...bl.data, table_columns: newCols, table_rows: newRows } } : bl);
                                                                      setEditingItem({ ...editingItem, content_blocks: newBlocks });
                                                                  }} className="text-green-600 hover:text-green-800"><Icons.PlusCircle size={16}/></button>
                                                              </th>
                                                          </tr>
                                                      </thead>
                                                      <tbody>
                                                          {(b.data.table_rows || []).map((row: string[], rIdx: number) => (
                                                              <tr key={rIdx} className="group/row">
                                                                  {row.map((cell, cIdx) => (
                                                                      <td key={cIdx} className="border border-slate-200 p-2">
                                                                          <input className="w-full outline-none" value={cell} onChange={(e) => {
                                                                              const newRows = [...b.data.table_rows];
                                                                              newRows[rIdx][cIdx] = e.target.value;
                                                                              updateContentBlock(b.id, 'table_rows', newRows);
                                                                          }} />
                                                                      </td>
                                                                  ))}
                                                                  <td className="border border-slate-200 p-2 text-center">
                                                                      <button onClick={() => {
                                                                          const newRows = [...b.data.table_rows];
                                                                          newRows.splice(rIdx, 1);
                                                                          updateContentBlock(b.id, 'table_rows', newRows);
                                                                      }} className="text-red-300 hover:text-red-500"><Icons.Trash2 size={14}/></button>
                                                                  </td>
                                                              </tr>
                                                          ))}
                                                          <tr>
                                                              <td colSpan={(b.data.table_columns?.length || 0) + 1} className="p-2 text-center border border-dashed border-slate-200">
                                                                  <button onClick={() => {
                                                                      const colCount = b.data.table_columns?.length || 1;
                                                                      const newRow = new Array(colCount).fill("");
                                                                      updateContentBlock(b.id, 'table_rows', [...(b.data.table_rows || []), newRow]);
                                                                  }} className="text-xs font-bold text-slate-400 hover:text-green-600 flex items-center justify-center gap-1 w-full">+ 添加行</button>
                                                              </td>
                                                          </tr>
                                                      </tbody>
                                                  </table>
                                              </div>
                                          </div>
                                      )}

                                      {/* === TEXT / IMAGE GRID === */}
                                      {(b.type === 'text' || b.type === 'image_grid') && (
                                          <div className="space-y-2">
                                              <input className="font-bold border-b w-full" value={b.data.title || ''} onChange={e => updateContentBlock(b.id, 'title', e.target.value)} placeholder="标题" />
                                              {b.type === 'text' && <textarea className="w-full h-24 text-sm border p-2 rounded" value={b.data.content} onChange={e => updateContentBlock(b.id, 'content', e.target.value)} placeholder="文本内容..." />}
                                              {b.type === 'image_grid' && (
                                                  <div className="flex gap-2 flex-wrap">
                                                      {b.data.urls?.map((url: string, i: number) => (
                                                          <div
                                                              key={`${url}-${i}`}
                                                              draggable
                                                              onDragStart={() => handleBlockImageDragStart(b.id, 'urls', i)}
                                                              onDragOver={(e) => handleBlockImageDragOver(e, b.id, 'urls', i)}
                                                              onDrop={handleBlockImageDrop}
                                                              onDragEnd={handleBlockImageDragEnd}
                                                              className={`w-10 h-10 rounded overflow-hidden border cursor-move ${
                                                                  draggedBlockImage?.blockId === b.id && draggedBlockImage?.field === 'urls' && draggedBlockImage?.index === i
                                                                      ? 'border-blue-500'
                                                                      : 'border-slate-200'
                                                              }`}
                                                          >
                                                              <img src={url} className="w-full h-full object-cover" />
                                                          </div>
                                                      ))}
                                                      <label className="w-10 h-10 border border-dashed flex items-center justify-center cursor-pointer hover:bg-slate-100"><Icons.Plus size={16}/><input type="file" className="hidden" onChange={e => handleImageUpload(e, 'standard', b.id)} /></label>
                                                  </div>
                                              )}
                                          </div>
                                      )}
                                  </div>
                               </div>
                               );
                            })}
                          </div>
                      </div>
                   </div>
                ) : (
                   /* Fallback for other tabs (Curriculum etc) */
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
