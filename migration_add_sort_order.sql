-- =====================================================================
-- 数据库增量迁移脚本：添加拖拽排序支持
-- =====================================================================

-- 1. Curriculum (课程)
ALTER TABLE public.curriculum ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- 初始化排序：按 ID 排序 (L1, L2...)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id ASC) as rn
  FROM public.curriculum
)
UPDATE public.curriculum
SET sort_order = ranked.rn
FROM ranked
WHERE public.curriculum.id = ranked.id;


-- 2. Showcases (学员作品)
ALTER TABLE public.showcases ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- 初始化排序：按创建时间
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM public.showcases
)
UPDATE public.showcases
SET sort_order = ranked.rn
FROM ranked
WHERE public.showcases.id = ranked.id;


-- 3. Social Projects (社会实践)
ALTER TABLE public.social_projects ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- 初始化排序：按创建时间
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM public.social_projects
)
UPDATE public.social_projects
SET sort_order = ranked.rn
FROM ranked
WHERE public.social_projects.id = ranked.id;


-- 4. Philosophy (核心理念)
ALTER TABLE public.philosophy ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- 初始化排序：按创建时间
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM public.philosophy
)
UPDATE public.philosophy
SET sort_order = ranked.rn
FROM ranked
WHERE public.philosophy.id = ranked.id;

-- 刷新缓存
NOTIFY pgrst, 'reload schema';
