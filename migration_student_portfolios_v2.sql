-- =====================================================================
-- 数据库增量迁移脚本 V2：增强学生档案的视觉定制能力
-- 请直接在 Supabase SQL Editor 中执行此脚本
-- =====================================================================

-- 1. 添加学生头衔/Slogan字段
ALTER TABLE public.student_portfolios 
ADD COLUMN IF NOT EXISTS student_title text;

-- 2. 添加主题配置字段 (JSONB)
ALTER TABLE public.student_portfolios 
ADD COLUMN IF NOT EXISTS theme_config jsonb DEFAULT '{"theme": "tech_dark"}'::jsonb;

-- 3. 刷新 Schema 缓存
NOTIFY pgrst, 'reload schema';
