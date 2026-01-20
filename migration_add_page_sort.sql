-- =====================================================================
-- 数据库增量迁移脚本：页面板块排序
-- =====================================================================

-- 1. 为 page_sections 添加排序字段
ALTER TABLE public.page_sections ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- 2. 初始化默认顺序 (Hero -> Philosophy -> Curriculum -> Showcases -> Social -> Booking -> Footer)
UPDATE public.page_sections SET sort_order = 1 WHERE id = 'hero';
UPDATE public.page_sections SET sort_order = 2 WHERE id = 'philosophy';
UPDATE public.page_sections SET sort_order = 3 WHERE id = 'curriculum';
UPDATE public.page_sections SET sort_order = 4 WHERE id = 'showcases';
UPDATE public.page_sections SET sort_order = 5 WHERE id = 'social_practice';
UPDATE public.page_sections SET sort_order = 6 WHERE id = 'booking';
UPDATE public.page_sections SET sort_order = 7 WHERE id = 'footer';

-- 刷新缓存
NOTIFY pgrst, 'reload schema';
