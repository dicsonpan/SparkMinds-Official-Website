import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Logo } from '../components/Logo';
import * as Icons from 'lucide-react';
import { CURRICULUM, PHILOSOPHY, SHOWCASES, PAGE_SECTIONS_DEFAULT, SOCIAL_PROJECTS } from '../constants';
import { Booking } from '../types';
import imageCompression from 'browser-image-compression';

// Type definitions for raw DB data (snake_case)
interface DbCourse {
  id: string;
  level: string;
  age: string;
  title: string;
  description: string;
  skills: string[];
  icon_name: string;
  image_urls: string[];
  sort_order: number;
}

interface DbShowcase {
  id?: number;
  title: string;
  category: string;
  description: string;
  image_urls: string[];
  sort_order: number;
}

interface DbPhilosophy {
  id?: number;
  title: string;
  content: string;
  icon_name: string;
  sort_order: number;
}

interface DbPageSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  metadata: any;
  sort_order: number;
}

interface DbSocialProject {
  id?: number;
  title: string;
  subtitle: string;
  quote: string;
  footer_note: string;
  image_urls: string[];
  sort_order: number;
}

// === Schema Definitions for Backup/Restore ===
const ALLOWED_KEYS = {
  curriculum: ['id', 'level', 'age', 'title', 'description', 'skills', 'icon_name', 'image_urls', 'sort_order'],
  philosophy: ['title', 'content', 'icon_name', 'sort_order'], 
  showcases: ['title', 'category', 'description', 'image_urls', 'sort_order'], 
  social_projects: ['title', 'subtitle', 'quote', 'footer_note', 'image_urls', 'sort_order'], 
  page_sections: ['id', 'title', 'subtitle', 'description', 'metadata', 'sort_order'],
};

// Compression Config
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.8,          // Target size ~800KB
  maxWidthOrHeight: 1920,  // Max dimension 1920px (1080p standard)
  useWebWorker: true,      // Use multi-threading
  fileType: 'image/jpeg'   // Normalize to JPEG for better compression
};

// Cache Control Setting: 1 Year (31536000 seconds)
// This forces the browser to use local disk cache instead of asking Supabase CDN, saving Cached Egress.
const CACHE_CONTROL_MAX_AGE = '31536000';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'showcase' | 'social' | 'philosophy' | 'pages' | 'bookings'>('bookings');
  
  const [curriculum, setCurriculum] = useState<DbCourse[]>([]);
  const [philosophy, setPhilosophy] = useState<DbPhilosophy[]>([]);
  const [showcases, setShowcases] = useState<DbShowcase[]>([]);
  const [socialProjects, setSocialProjects] = useState<DbSocialProject[]>([]);
  const [pageSections, setPageSections] = useState<DbPageSection[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [optimizationStatus, setOptimizationStatus] = useState<string | null>(null);

  // Drag and Drop State
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

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
    
    // Ordered by sort_order
    const { data: cData } = await supabase.from('curriculum').select('*').order('sort_order', { ascending: true });
    if (cData) setCurriculum(cData);

    const { data: pData } = await supabase.from('philosophy').select('*').order('sort_order', { ascending: true });
    if (pData) setPhilosophy(pData);

    const { data: sData } = await supabase.from('showcases').select('*').order('sort_order', { ascending: true });
    if (sData) setShowcases(sData);

    const { data: spData } = await supabase.from('social_projects').select('*').order('sort_order', { ascending: true });
    if (spData) setSocialProjects(spData);

    // Page sections sorted
    const { data: pageData } = await supabase.from('page_sections').select('*').order('sort_order', { ascending: true });
    if (pageData) setPageSections(pageData);

    const { data: bData } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (bData) setBookings(bData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // --- Drag and Drop Handlers ---

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number, listSetter: Function, currentList: any[]) => {
    e.preventDefault(); // Necessary for drop to work
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    // Create a copy and reorder
    const newList = [...currentList];
    const draggedItem = newList[draggedItemIndex];
    
    // Remove from old position
    newList.splice(draggedItemIndex, 1);
    // Insert at new position
    newList.splice(index, 0, draggedItem);

    // Update state immediately for visual feedback
    listSetter(newList);
    setDraggedItemIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, tableName: string, currentList: any[]) => {
    e.preventDefault();
    setDraggedItemIndex(null);
    
    // Prepare Batch Update
    // We update all items with their new index as sort_order
    const updates = currentList.map((item, index) => ({
      ...item,
      sort_order: index + 1 
    }));

    try {
      const { error } = await supabase.from(tableName).upsert(updates, { onConflict: 'id' });
      if (error) throw error;
    } catch (err: any) {
      alert("排序保存失败: " + err.message);
      fetchData(); // Revert on error
    }
  };


  // --- Backup & Restore Logic ---

  // Helper: Filter object keys based on allowlist
  const sanitizeRecord = (record: any, allowList: string[]) => {
    const newRecord: any = {};
    allowList.forEach(key => {
      if (record[key] !== undefined) {
        newRecord[key] = record[key];
      }
    });
    return newRecord;
  };

  const handleExportBackup = async () => {
    setLoading(true);
    try {
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          curriculum,
          philosophy,
          showcases,
          social_projects: socialProjects,
          page_sections: pageSections,
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sparkminds_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('导出备份失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('警告：导入备份将尝试合并或覆盖当前数据。\n\n- 如果您刚刚重置了数据库，这是安全的。\n- 如果已有数据，相同ID的内容会被覆盖，新增内容会被添加。\n\n确定要继续吗？')) {
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json.data) throw new Error('无效的备份文件格式');

        const { data } = json;

        // 1. Curriculum
        if (data.curriculum?.length) {
          const cleanData = data.curriculum.map((item: any) => sanitizeRecord(item, ALLOWED_KEYS.curriculum));
          const { error } = await supabase.from('curriculum').upsert(cleanData);
          if (error) throw error;
        }

        // 2. Page Sections
        if (data.page_sections?.length) {
          const cleanData = data.page_sections.map((item: any) => sanitizeRecord(item, ALLOWED_KEYS.page_sections));
          const { error } = await supabase.from('page_sections').upsert(cleanData);
          if (error) throw error;
        }

        // 3. Showcases
        if (data.showcases?.length) {
          const cleanData = data.showcases.map((item: any) => sanitizeRecord(item, ALLOWED_KEYS.showcases));
          const { error } = await supabase.from('showcases').insert(cleanData);
          if (error) throw error;
        }

        // 4. Philosophy
        if (data.philosophy?.length) {
          const cleanData = data.philosophy.map((item: any) => sanitizeRecord(item, ALLOWED_KEYS.philosophy));
          const { error } = await supabase.from('philosophy').insert(cleanData);
          if (error) throw error;
        }

        // 5. Social Projects
        if (data.social_projects?.length) {
          const cleanData = data.social_projects.map((item: any) => sanitizeRecord(item, ALLOWED_KEYS.social_projects));
          const { error } = await supabase.from('social_projects').insert(cleanData);
          if (error) throw error;
        }

        alert('数据还原成功！');
        fetchData();

      } catch (err: any) {
        console.error(err);
        alert('导入失败: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  // --- Image Optimization Logic ---

  const handleBatchOptimize = async () => {
    if (!confirm('确定要优化所有存量图片吗？\n\n这将自动：\n1. 下载存储桶中所有图片\n2. 在本地压缩 (最大1920px, 800KB)\n3. 覆盖上传原文件并设置1年缓存\n\n注意：此操作能显著降低流量消耗。过程可能需要几分钟，请勿关闭页面。')) {
      return;
    }

    setOptimizationStatus('准备开始...');
    setLoading(true);

    try {
      // 1. List all files in 'images' bucket
      const { data: files, error: listError } = await supabase
        .storage
        .from('images')
        .list('', { limit: 1000, offset: 0 });

      if (listError) throw listError;
      if (!files || files.length === 0) {
        alert('没有找到图片文件');
        return;
      }

      let successCount = 0;
      let failCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const fileMeta = files[i];
        if (fileMeta.name === '.emptyFolderPlaceholder' || !fileMeta.metadata) {
          skippedCount++;
          continue;
        }

        setOptimizationStatus(`正在处理 (${i + 1}/${files.length}): ${fileMeta.name}`);

        try {
          // 2. Download original
          const { data: blob, error: downloadError } = await supabase
            .storage
            .from('images')
            .download(fileMeta.name);

          if (downloadError) throw downloadError;
          if (!blob) throw new Error('Blob is null');

          // Check if it's an image
          if (!blob.type.startsWith('image/')) {
            skippedCount++;
            continue;
          }

          // 3. Compress
          // Convert Blob to File to satisfy library TS requirement (though it handles blobs too usually)
          const originalFile = new File([blob], fileMeta.name, { type: blob.type });
          const compressedFile = await imageCompression(originalFile, COMPRESSION_OPTIONS);

          // 4. Update (Overwrite) with LONG CACHE CONTROL
          const { error: updateError } = await supabase
            .storage
            .from('images')
            .update(fileMeta.name, compressedFile, {
              cacheControl: CACHE_CONTROL_MAX_AGE, // Set to 1 year
              upsert: true
            });

          if (updateError) throw updateError;
          successCount++;

        } catch (err) {
          console.error(`Failed to optimize ${fileMeta.name}:`, err);
          failCount++;
        }
      }

      alert(`优化完成！\n成功: ${successCount}\n失败: ${failCount}\n跳过: ${skippedCount}\n\n所有图片缓存已更新为1年。`);

    } catch (err: any) {
      alert('批量优化失败: ' + err.message);
    } finally {
      setLoading(false);
      setOptimizationStatus(null);
    }
  };


  // --- Data Seeding Logic ---
  const handleSeedData = async () => {
    if (!confirm('确定要初始化数据吗？这将把 constants.ts 中的默认数据导入数据库。')) return;
    setLoading(true);
    
    try {
      if (curriculum.length === 0) {
        const dbCurriculum = CURRICULUM.map((c, i) => ({
          id: c.id,
          level: c.level,
          age: c.age,
          title: c.title,
          description: c.description,
          skills: c.skills,
          icon_name: c.iconName,
          image_urls: c.imageUrls || [],
          sort_order: i + 1
        }));
        await supabase.from('curriculum').insert(dbCurriculum);
      }

      if (philosophy.length === 0) {
        const dbPhilosophy = PHILOSOPHY.map((p, i) => ({
          title: p.title,
          content: p.content,
          icon_name: p.iconName,
          sort_order: i + 1
        }));
        await supabase.from('philosophy').insert(dbPhilosophy);
      }

      if (showcases.length === 0) {
        const dbShowcases = SHOWCASES.map((s, i) => ({
          title: s.title,
          category: s.category,
          description: s.description,
          image_urls: s.imageUrls || [],
          sort_order: i + 1
        }));
        await supabase.from('showcases').insert(dbShowcases);
      }

      if (socialProjects.length === 0) {
        const dbSocial = SOCIAL_PROJECTS.map((s, i) => ({
            title: s.title,
            subtitle: s.subtitle,
            quote: s.quote,
            footer_note: s.footerNote,
            image_urls: s.imageUrls || [],
            sort_order: i + 1
        }));
        await supabase.from('social_projects').insert(dbSocial);
      }

      if (pageSections.length === 0) {
        const dbPageSections = PAGE_SECTIONS_DEFAULT.map((ps, i) => ({
            ...ps,
            sort_order: i + 1
        }));
        await supabase.from('page_sections').insert(dbPageSections);
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
  
  const handleCreateNew = () => {
    setIsNewRecord(true);
    let template: any = {};
    
    // Default sort_order to current length + 1
    if (activeTab === 'curriculum') {
      template = { id: 'NewLevel', level: '', age: '', title: '', description: '', skills: [], icon_name: 'Box', image_urls: [], sort_order: curriculum.length + 1 };
    } else if (activeTab === 'showcase') {
      template = { title: '', category: '商业级产品', description: '', image_urls: [], sort_order: showcases.length + 1 };
    } else if (activeTab === 'social') {
      template = { title: '商业化案例', subtitle: '', quote: '', footer_note: '', image_urls: [], sort_order: socialProjects.length + 1 };
    } else if (activeTab === 'philosophy') {
      template = { title: '', content: '', icon_name: 'Star', sort_order: philosophy.length + 1 };
    }
    
    setEditingItem(template);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setIsNewRecord(false);
    setEditingItem({ ...item }); 
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
      if (activeTab === 'social') table = 'social_projects';
      if (activeTab === 'pages') table = 'page_sections';

      if (isNewRecord) {
        // INSERT Logic
        const { error } = await supabase.from(table).insert([editingItem]);
        if (error) throw error;
      } else {
        // UPDATE Logic
        const { error } = await supabase
          .from(table)
          .update(editingItem)
          .eq('id', editingItem.id);
        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingItem(null);
      await fetchData(); 
    } catch (error: any) {
      alert('保存失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: any) => {
    if (!confirm('确定要删除吗？此操作不可恢复。')) return;
    setLoading(true);
    try {
        let table = '';
        if (activeTab === 'social') table = 'social_projects';
        if (activeTab === 'showcase') table = 'showcases';
        if (activeTab === 'curriculum') table = 'curriculum';
        if (activeTab === 'philosophy') table = 'philosophy';
        
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        await fetchData();
    } catch (error: any) {
        alert('删除失败: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    setUploading(true);

    try {
      // 1. Compress image before upload
      console.log(`Original size: ${file.size / 1024 / 1024} MB`);
      const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
      console.log(`Compressed size: ${compressedFile.size / 1024 / 1024} MB`);

      const fileExt = compressedFile.name.split('.').pop();
      // Ensure unique name but keep extension
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt || 'jpg'}`;
      const filePath = `${fileName}`;

      // 2. Upload to Supabase with Cache Control set to 1 Year
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, compressedFile, {
        cacheControl: CACHE_CONTROL_MAX_AGE,
        upsert: false
      });
      
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // Logic for Array based image fields
      if (activeTab === 'curriculum' || activeTab === 'showcase' || activeTab === 'social') {
        const currentUrls = editingItem.image_urls || [];
        setEditingItem({ ...editingItem, image_urls: [...currentUrls, publicUrl] });
      } else {
        // Single field (Philosophy, etc)
        setEditingItem({ ...editingItem, icon_name: publicUrl });
      }

    } catch (error: any) {
      console.error(error);
      alert('图片处理或上传失败: ' + error.message);
    } finally {
      setUploading(false);
    }
  };
  
  const removeImageFromArray = (indexToRemove: number) => {
    const currentUrls = editingItem.image_urls || [];
    const newUrls = currentUrls.filter((_: any, idx: number) => idx !== indexToRemove);
    setEditingItem({ ...editingItem, image_urls: newUrls });
  };

  // Toggle Booking Status
  const toggleBookingStatus = async (booking: Booking) => {
    const newStatus = booking.status === 'contacted' ? 'pending' : 'contacted';
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', booking.id);
    
    if (error) {
      alert('状态更新失败');
    } else {
      fetchData(); 
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
            { id: 'bookings', label: '预约管理', icon: Icons.PhoneCall },
            { id: 'curriculum', label: '课程体系', icon: Icons.BookOpen },
            { id: 'showcase', label: '学员成果', icon: Icons.Trophy },
            { id: 'social', label: '社会实践', icon: Icons.TrendingUp },
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
              {tab.id === 'bookings' && bookings.filter(b => b.status === 'pending').length > 0 && (
                 <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                   {bookings.filter(b => b.status === 'pending').length}
                 </span>
              )}
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
            {activeTab === 'social' && '社会实践案例管理'}
            {activeTab === 'philosophy' && '核心理念管理'}
            {activeTab === 'pages' && '页面内容设置 (拖拽可排序)'}
            {activeTab === 'bookings' && '试听预约管理'}
          </h1>
          
          <div className="flex items-center gap-3">
             {/* Batch Optimization Button */}
             {!loading && (
               <button
                  onClick={handleBatchOptimize}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors border border-orange-200"
                  title="自动压缩所有存量图片，节省带宽"
               >
                 <Icons.Wand2 size={16} />
                 一键优化图片
               </button>
             )}
             
             {/* Import/Export Buttons */}
             {!loading && (
               <>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleFileChange} 
                   accept=".json" 
                   className="hidden" 
                 />
                 <button 
                   onClick={handleImportClick}
                   className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                   title="从备份文件恢复数据"
                 >
                   <Icons.Upload size={16} />
                   还原备份
                 </button>
                 <button 
                   onClick={handleExportBackup}
                   className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                   title="下载当前所有数据的JSON备份"
                 >
                   <Icons.Download size={16} />
                   导出备份
                 </button>
                 <div className="h-6 w-px bg-slate-300 mx-1"></div>
               </>
             )}

             {/* Add New Button */}
             {(activeTab !== 'pages' && activeTab !== 'bookings') && (
                <button 
                  onClick={handleCreateNew}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm font-bold"
                >
                  <Icons.Plus size={18} />
                  添加记录
                </button>
             )}

             {/* Seed Data Button */}
             {((activeTab === 'curriculum' && curriculum.length === 0) || 
               (activeTab === 'showcase' && showcases.length === 0) ||
               (activeTab === 'social' && socialProjects.length === 0) ||
               (activeTab === 'philosophy' && philosophy.length === 0) ||
               (activeTab === 'pages' && pageSections.length === 0)) && !loading && (
                <button 
                  onClick={handleSeedData}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm font-bold"
                >
                  <Icons.Database size={16} />
                  初始化数据
                </button>
             )}
          </div>
        </header>

        <main className="p-8">
           {/* Optimization Progress Bar */}
           {optimizationStatus && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 text-blue-800 animate-pulse">
              <Icons.Loader2 className="animate-spin" />
              <span className="font-bold">{optimizationStatus}</span>
            </div>
          )}

          {loading && !isModalOpen && !optimizationStatus ? (
            <div className="flex justify-center items-center h-64 text-slate-400">
              <Icons.Loader2 className="animate-spin mr-2" /> 加载中...
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              
              {/* ... (Other Tabs omitted for brevity, they are unchanged or already updated in previous turn) ... */}
              
              {/* Page Sections List - DRAGGABLE */}
              {activeTab === 'pages' && (
                   <div className="divide-y divide-slate-100">
                      {pageSections.map((ps, index) => (
                           <div 
                              key={ps.id} 
                              draggable
                              onDragStart={() => handleDragStart(index)}
                              onDragOver={(e) => handleDragOver(e, index, setPageSections, pageSections)}
                              onDrop={(e) => handleDrop(e, 'page_sections', pageSections)}
                              className={`p-6 flex items-start gap-6 hover:bg-slate-50 transition-colors group cursor-move ${draggedItemIndex === index ? 'opacity-40 bg-slate-100' : ''}`}
                            >
                               {/* Drag Handle */}
                               <div className="text-slate-300 hover:text-slate-500 mt-2 cursor-move">
                                  <Icons.GripVertical size={20} />
                               </div>

                               <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
                                   {ps.id === 'booking' ? <Icons.CalendarClock size={24} /> : 
                                    ps.id === 'footer' ? <Icons.Footprints size={24} /> : 
                                    ps.id === 'social_practice' ? <Icons.TrendingUp size={24} /> :
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
              
              {/* ... (Rest of component) ... */}
              
              {/* ... Same render code for other tabs (Bookings, Curriculum, etc.) as in previous step ... */}
              {activeTab === 'bookings' && (
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm text-slate-600">
                     <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                       <tr>
                         <th className="px-6 py-4">状态</th>
                         <th className="px-6 py-4">家长姓名</th>
                         <th className="px-6 py-4">联系电话</th>
                         <th className="px-6 py-4">孩子年龄</th>
                         <th className="px-6 py-4">提交时间</th>
                         <th className="px-6 py-4 text-right">操作</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {bookings.map((b) => (
                         <tr key={b.id} className={`hover:bg-slate-50 transition-colors ${b.status === 'pending' ? 'bg-white' : 'bg-slate-50/50'}`}>
                           <td className="px-6 py-4">
                              {b.status === 'pending' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                  待处理
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  <Icons.CheckCircle size={12} />
                                  已联系
                                </span>
                              )}
                           </td>
                           <td className="px-6 py-4 font-bold text-slate-900">{b.parent_name}</td>
                           <td className="px-6 py-4 font-mono">{b.phone}</td>
                           <td className="px-6 py-4">{b.child_age}</td>
                           <td className="px-6 py-4 text-slate-400">
                             {new Date(b.created_at).toLocaleString('zh-CN', {month:'numeric', day:'numeric', hour:'numeric', minute:'numeric'})}
                           </td>
                           <td className="px-6 py-4 text-right">
                             <button 
                               onClick={() => toggleBookingStatus(b)}
                               className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                                 b.status === 'pending' 
                                  ? 'border-blue-200 text-blue-600 hover:bg-blue-50' 
                                  : 'border-slate-200 text-slate-400 hover:bg-slate-100'
                               }`}
                             >
                               {b.status === 'pending' ? '标记为已联系' : '标为未处理'}
                             </button>
                           </td>
                         </tr>
                       ))}
                       {bookings.length === 0 && (
                         <tr>
                           <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                             暂无预约数据
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                </div>
              )}
              {activeTab === 'social' && (
                   <div className="divide-y divide-slate-100">
                      {socialProjects.map((s, index) => (
                           <div 
                              key={s.id} 
                              draggable
                              onDragStart={() => handleDragStart(index)}
                              onDragOver={(e) => handleDragOver(e, index, setSocialProjects, socialProjects)}
                              onDrop={(e) => handleDrop(e, 'social_projects', socialProjects)}
                              className={`p-6 flex items-start gap-6 hover:bg-slate-50 transition-colors group cursor-move ${draggedItemIndex === index ? 'opacity-40 bg-slate-100' : ''}`}
                           >
                               <div className="text-slate-300 hover:text-slate-500 mt-6 cursor-move">
                                  <Icons.GripVertical size={20} />
                               </div>
                               <div className="w-24 h-16 bg-slate-200 rounded overflow-hidden shrink-0 border border-slate-100 relative">
                                 {s.image_urls && s.image_urls.length > 0 ? (
                                   <img src={s.image_urls[0]} alt={s.title} className="w-full h-full object-cover" />
                                 ) : (
                                   <div className="w-full h-full flex items-center justify-center text-slate-400"><Icons.Image size={16} /></div>
                                 )}
                                 {s.image_urls && s.image_urls.length > 1 && (
                                     <span className="absolute bottom-0 right-0 bg-black/50 text-white text-[10px] px-1">{s.image_urls.length}</span>
                                 )}
                               </div>
                               <div className="flex-1">
                                   <div className="flex items-center gap-3 mb-1">
                                      <h3 className="font-bold text-slate-900">{s.title}</h3>
                                      {s.subtitle && <span className="text-xs bg-slate-100 text-slate-500 px-2 rounded-full">{s.subtitle}</span>}
                                   </div>
                                   <p className="text-slate-500 text-sm mb-1 italic">"{s.quote}"</p>
                                   <p className="text-xs text-slate-400">{s.footer_note}</p>
                               </div>
                               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => openEditModal(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                     <Icons.Edit2 size={18} />
                                   </button>
                                   <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                                     <Icons.Trash2 size={18} />
                                   </button>
                               </div>
                           </div>
                      ))}
                   </div>
              )}
              {activeTab === 'curriculum' && (
                 <div className="divide-y divide-slate-100">
                    {curriculum.map((c, index) => (
                        <div 
                          key={c.id} 
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index, setCurriculum, curriculum)}
                          onDrop={(e) => handleDrop(e, 'curriculum', curriculum)}
                          className={`p-6 flex items-start gap-6 hover:bg-slate-50 transition-colors group cursor-move ${draggedItemIndex === index ? 'opacity-40 bg-slate-100' : ''}`}
                        >
                           <div className="text-slate-300 hover:text-slate-500 mt-4 cursor-move">
                              <Icons.GripVertical size={20} />
                           </div>
                           <div className="w-16 h-12 bg-slate-200 rounded overflow-hidden shrink-0 border border-slate-100">
                             {c.image_urls && c.image_urls.length > 0 ? (
                               <img src={c.image_urls[0]} alt={c.title} className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-slate-400"><Icons.Image size={16} /></div>
                             )}
                           </div>
                           <div className="flex-1">
                             <div className="flex items-center gap-3 mb-1">
                               <span className="font-mono text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{c.id}</span>
                               <h3 className="font-bold text-slate-900">{c.title}</h3>
                               {c.image_urls && c.image_urls.length > 1 && (
                                 <span className="text-xs bg-slate-100 text-slate-500 px-2 rounded-full">{c.image_urls.length} 图</span>
                               )}
                             </div>
                             <p className="text-slate-500 text-sm mb-3 line-clamp-2">{c.description}</p>
                           </div>
                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => openEditModal(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-all">
                               <Icons.Edit2 size={18} />
                             </button>
                             <button onClick={() => handleDelete(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition-all">
                               <Icons.Trash2 size={18} />
                             </button>
                           </div>
                        </div>
                    ))}
                 </div>
              )}
              {activeTab === 'showcase' && (
                   <div className="grid grid-cols-1 divide-y divide-slate-100">
                      {showcases.map((s, index) => (
                           <div 
                              key={s.id} 
                              draggable
                              onDragStart={() => handleDragStart(index)}
                              onDragOver={(e) => handleDragOver(e, index, setShowcases, showcases)}
                              onDrop={(e) => handleDrop(e, 'showcases', showcases)}
                              className={`p-6 flex gap-6 hover:bg-slate-50 transition-colors group cursor-move ${draggedItemIndex === index ? 'opacity-40 bg-slate-100' : ''}`}
                            >
                               <div className="text-slate-300 hover:text-slate-500 mt-8 cursor-move">
                                  <Icons.GripVertical size={20} />
                               </div>
                               <div className="w-32 h-24 bg-slate-200 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                                  {s.image_urls && s.image_urls.length > 0 ? (
                                    s.image_urls[0].startsWith('<iframe') ? 
                                    <div className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full" dangerouslySetInnerHTML={{__html: s.image_urls[0]}} /> :
                                    <img src={s.image_urls[0]} alt={s.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 bg-slate-100 p-2 text-center break-all">暂无图片</div>
                                  )}
                               </div>
                               <div className="flex-1">
                                   <div className="flex justify-between items-start">
                                     <div>
                                       <h3 className="font-bold text-slate-900 mb-1">{s.title}</h3>
                                       <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded">{s.category}</span>
                                       {s.image_urls && s.image_urls.length > 1 && (
                                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded ml-2">{s.image_urls.length} 图</span>
                                       )}
                                     </div>
                                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button onClick={() => openEditModal(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                         <Icons.Edit2 size={18} />
                                       </button>
                                       <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                                         <Icons.Trash2 size={18} />
                                       </button>
                                     </div>
                                   </div>
                                   <p className="text-slate-500 text-sm mt-2 line-clamp-2">{s.description}</p>
                               </div>
                           </div>
                      ))}
                   </div>
              )}
              {activeTab === 'philosophy' && (
                   <div className="divide-y divide-slate-100">
                      {philosophy.map((p, index) => (
                           <div 
                              key={p.id} 
                              draggable
                              onDragStart={() => handleDragStart(index)}
                              onDragOver={(e) => handleDragOver(e, index, setPhilosophy, philosophy)}
                              onDrop={(e) => handleDrop(e, 'philosophy', philosophy)}
                              className={`p-6 flex items-start gap-6 hover:bg-slate-50 transition-colors group cursor-move ${draggedItemIndex === index ? 'opacity-40 bg-slate-100' : ''}`}
                            >
                               <div className="text-slate-300 hover:text-slate-500 mt-2 cursor-move">
                                  <Icons.GripVertical size={20} />
                               </div>
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

              {/* Empty States */}
              {((activeTab === 'curriculum' && curriculum.length === 0) || 
                (activeTab === 'showcase' && showcases.length === 0) ||
                (activeTab === 'social' && socialProjects.length === 0) ||
                (activeTab === 'philosophy' && philosophy.length === 0)) && (
                <div className="p-12 text-center text-slate-400">
                  <Icons.Database className="mx-auto mb-4 opacity-50" size={48} />
                  <p>暂无数据，请点击上方“初始化数据”或手动添加。</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Edit Modal (unchanged structure) */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">{isNewRecord ? '添加新记录' : '编辑内容'}</h3>
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

              {/* ... (rest of form fields, unchanged) ... */}
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

              {/* ... (rest of the form fields for various tabs are implicitly here, I am not removing them, just omitting for brevity in response) ... */}
              {/* Please assume all previous form fields logic remains exactly the same as in the original file, I am just ensuring the drag-drop logic is inserted */}
               
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
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">按钮1文字</label>
                        <input type="text" value={editingItem.metadata?.cta1 || ''} onChange={e => setEditingItem({...editingItem, metadata: {...editingItem.metadata, cta1: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">按钮2文字</label>
                        <input type="text" value={editingItem.metadata?.cta2 || ''} onChange={e => setEditingItem({...editingItem, metadata: {...editingItem.metadata, cta2: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Pages: Social Practice Specifics */}
              {activeTab === 'pages' && editingItem.id === 'social_practice' && (
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-700 text-sm border-b border-slate-200 pb-2">社会实践详情配置</h4>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">实践亮点列表 (每行一项)</label>
                        <textarea
                            rows={3}
                            value={Array.isArray(editingItem.metadata?.list_items) ? editingItem.metadata.list_items.join('\n') : ''}
                            onChange={e => setEditingItem({
                                ...editingItem,
                                metadata: { ...editingItem.metadata, list_items: e.target.value.split('\n').filter((x: string) => x.trim()) }
                            })}
                            placeholder="从Idea到产品的全流程体验..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                 </div>
              )}
              
              {/* Pages: Booking Specifics */}
               {activeTab === 'pages' && editingItem.id === 'booking' && (
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-700 text-sm border-b border-slate-200 pb-2">预约文案配置</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">导航按钮文字</label>
                            <input type="text" value={editingItem.metadata?.nav_button_text || ''} onChange={e => setEditingItem({...editingItem, metadata: {...editingItem.metadata, nav_button_text: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">手机端按钮文字</label>
                            <input type="text" value={editingItem.metadata?.mobile_button_text || ''} onChange={e => setEditingItem({...editingItem, metadata: {...editingItem.metadata, mobile_button_text: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">提交按钮文字</label>
                            <input type="text" value={editingItem.metadata?.submit_button_text || ''} onChange={e => setEditingItem({...editingItem, metadata: {...editingItem.metadata, submit_button_text: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">成功提示消息</label>
                            <input type="text" value={editingItem.metadata?.success_message || ''} onChange={e => setEditingItem({...editingItem, metadata: {...editingItem.metadata, success_message: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                        </div>
                    </div>
                 </div>
               )}

              {/* Pages: Footer Specifics */}
               {activeTab === 'pages' && editingItem.id === 'footer' && (
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-700 text-sm border-b border-slate-200 pb-2">联系信息配置</h4>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">地址</label>
                        <input type="text" value={editingItem.metadata?.address || ''} onChange={e => setEditingItem({...editingItem, metadata: {...editingItem.metadata, address: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">电话</label>
                            <input type="text" value={editingItem.metadata?.phone || ''} onChange={e => setEditingItem({...editingItem, metadata: {...editingItem.metadata, phone: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">邮箱</label>
                            <input type="text" value={editingItem.metadata?.email || ''} onChange={e => setEditingItem({...editingItem, metadata: {...editingItem.metadata, email: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">版权信息</label>
                        <input type="text" value={editingItem.metadata?.copyright || ''} onChange={e => setEditingItem({...editingItem, metadata: {...editingItem.metadata, copyright: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                    </div>
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
               {/* Social: Quote */}
              {activeTab === 'social' && (
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">引用语 (Quote)</label>
                  <textarea 
                    rows={3}
                    value={editingItem.quote || ''} 
                    onChange={e => setEditingItem({...editingItem, quote: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              {/* Social: Footer Note */}
              {activeTab === 'social' && (
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">底部备注</label>
                  <input 
                    type="text" 
                    value={editingItem.footer_note || ''} 
                    onChange={e => setEditingItem({...editingItem, footer_note: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

               {/* Social: Subtitle */}
              {activeTab === 'social' && (
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">副标题</label>
                  <input 
                    type="text" 
                    value={editingItem.subtitle || ''} 
                    onChange={e => setEditingItem({...editingItem, subtitle: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              {/* Curriculum specific */}
              {activeTab === 'curriculum' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Level ID</label>
                      <input 
                         type="text" 
                         disabled={!isNewRecord} // ID is editable only on create
                         value={editingItem.id || ''} 
                         onChange={e => isNewRecord && setEditingItem({...editingItem, id: e.target.value})}
                         className={`w-full px-3 py-2 border border-slate-300 rounded-lg outline-none ${!isNewRecord ? 'bg-slate-100 text-slate-500' : 'focus:ring-2 focus:ring-blue-500'}`} 
                      />
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
                    {(activeTab === 'showcase' || activeTab === 'social') ? '图片/视频 (支持多张，视频可填B站iframe)' : 
                     activeTab === 'curriculum' ? '课程封面图集' : 
                     '图标名称 (Lucide Icon)'}
                 </label>
                 
                 {/* Single Input for Philosophy only */}
                 {(activeTab === 'philosophy') && (
                    <input 
                        type="text" 
                        value={editingItem.icon_name || ''} 
                        onChange={e => setEditingItem({...editingItem, icon_name: e.target.value})}
                        placeholder="Box, Zap, etc."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm mb-2"
                    />
                 )}

                 {/* For Showcases/Curriculum/Social, show simple input for adding manual URLs (like iframes) */}
                 {(activeTab === 'showcase' || activeTab === 'curriculum' || activeTab === 'social') && (
                    <div className="flex gap-2 mb-2">
                        <input 
                            type="text" 
                            id="manual-url-input"
                            placeholder="输入图片URL或<iframe>代码"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                        />
                        <button 
                            onClick={() => {
                                const input = document.getElementById('manual-url-input') as HTMLInputElement;
                                if (input.value) {
                                    const currentUrls = editingItem.image_urls || [];
                                    setEditingItem({ ...editingItem, image_urls: [...currentUrls, input.value] });
                                    input.value = '';
                                }
                            }}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium"
                        >
                            添加
                        </button>
                    </div>
                 )}
                  
                  {/* Image List for Curriculum/Showcase/Social (Multi-image) */}
                  {(activeTab === 'curriculum' || activeTab === 'showcase' || activeTab === 'social') && (
                     <div className="grid grid-cols-4 gap-2 mb-2">
                        {(editingItem.image_urls || []).map((url: string, idx: number) => (
                           <div key={idx} className="relative aspect-square rounded overflow-hidden border border-slate-200 group bg-slate-50">
                              {url.startsWith('<iframe') ? (
                                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 p-1 text-center bg-slate-100">视频/Frame</div>
                              ) : (
                                <img src={url} alt="" className="w-full h-full object-cover" />
                              )}
                              <button 
                                onClick={() => removeImageFromArray(idx)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              >
                                <Icons.X size={12} />
                              </button>
                           </div>
                        ))}
                     </div>
                  )}

                  {/* Upload Button */}
                  {(activeTab === 'showcase' || activeTab === 'curriculum' || activeTab === 'social') && (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                      {uploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <Icons.Loader2 className="animate-spin text-blue-600" size={20} />
                          <span className="ml-2 text-sm text-blue-600 font-medium">上传中...</span>
                        </div>
                      )}
                    </div>
                  )}
                  {(activeTab === 'curriculum' || activeTab === 'showcase' || activeTab === 'social') && (
                    <p className="text-xs text-slate-500 mt-1">
                      提示: 可上传多张图片或添加多个视频链接。第一张将作为封面。
                    </p>
                  )}
              </div>
              )}

            </div>
            
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors">取消</button>
              <button onClick={handleSave} disabled={loading || uploading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
                {loading ? <Icons.Loader2 className="animate-spin" size={16} /> : <Icons.Save size={16} />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};