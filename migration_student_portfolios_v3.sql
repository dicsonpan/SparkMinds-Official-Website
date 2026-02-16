-- =====================================================================
-- 数据库增量迁移脚本 V3：增强学生档案 (AI策展与技能雷达支持)
-- 请直接在 Supabase SQL Editor 中执行此脚本
-- =====================================================================

-- 1. 添加 Hero 背景大图字段
ALTER TABLE public.student_portfolios 
ADD COLUMN IF NOT EXISTS hero_image_url text;

-- 2. 添加个人简介/摘要字段
ALTER TABLE public.student_portfolios 
ADD COLUMN IF NOT EXISTS summary_bio text;

-- 3. 添加技能矩阵字段 (JSONB)
-- 存储结构示例: [{"category": "Hardware", "name": "Arduino", "value": 85}, ...]
ALTER TABLE public.student_portfolios 
ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb;

-- 4. 刷新 Schema 缓存
NOTIFY pgrst, 'reload schema';
