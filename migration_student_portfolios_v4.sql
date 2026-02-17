-- =====================================================================
-- 数据库增量迁移脚本 V4：添加学生头像字段
-- 请直接在 Supabase SQL Editor 中执行此脚本
-- =====================================================================

-- 1. 添加学生头像字段
ALTER TABLE public.student_portfolios 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. 刷新 Schema 缓存
NOTIFY pgrst, 'reload schema';
