-- 验证修复结果
SELECT 'Table exists' as status, COUNT(*) as record_count FROM sales_records;
SELECT 'Schema check' as status, sql FROM sqlite_master WHERE type='table' AND name='sales_records';
SELECT 'Sync status' as status, * FROM sync_status WHERE sync_type = 'sales_records';