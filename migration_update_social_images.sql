-- =====================================================================
-- 数据库增量迁移脚本
-- 目标：将 social_projects 表的 image_url (单文本) 升级为 image_urls (数组)
-- 操作建议：请在 Supabase 后台的 SQL Editor 中依次运行以下步骤
-- =====================================================================

-- 第一步：添加新的数组字段
-- 我们先添加这个字段，默认为空数组，防止报错
ALTER TABLE public.social_projects 
ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';

-- 第二步：迁移旧数据
-- 将原有的 image_url 数据转移到新字段中
-- 只有当旧字段有值时才迁移
UPDATE public.social_projects
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url != '';

-- 第三步：删除旧字段
-- 确认数据迁移无误后，删除旧的 image_url 字段
-- 警告：此操作不可逆，建议先在前端确认数据正常显示后再执行此步
ALTER TABLE public.social_projects 
DROP COLUMN IF EXISTS image_url;

-- 第四步：刷新 Schema 缓存 (可选，Supabase有时需要)
NOTIFY pgrst, 'reload schema';
