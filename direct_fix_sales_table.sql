-- 直接修复脚本 - 可以在Cloudflare Dashboard中执行
-- 第一步：尝试添加字段（可能会失败，如果字段已存在）
ALTER TABLE sales_records ADD COLUMN external_form_display TEXT;

-- 第二步：验证表结构
PRAGMA table_info(sales_records);

-- 第三步：检查字段是否添加成功
SELECT COUNT(*) as column_count 
FROM pragma_table_info('sales_records') 
WHERE name = 'external_form_display';