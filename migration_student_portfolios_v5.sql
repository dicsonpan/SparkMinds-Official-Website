
-- =====================================================================
-- 数据库增量迁移脚本 V5：添加技能矩阵配置字段
-- 请直接在 Supabase SQL Editor 中执行此脚本
-- =====================================================================

-- 1. 添加技能配置字段 (JSONB)
-- 存储结构示例: {"layout": "radar"} 或 {"layout": "bar"}
ALTER TABLE public.student_portfolios 
ADD COLUMN IF NOT EXISTS skills_config jsonb DEFAULT '{"layout": "bar"}'::jsonb;

-- 2. 刷新 Schema 缓存
NOTIFY pgrst, 'reload schema';
