-- 為銷售記錄表添加 external_form_display 欄位
-- 這個欄位用於存儲外部表單顯示狀態，只同步值為 "option_displayed__c" 的記錄

-- 1. 添加新欄位
ALTER TABLE sales_records ADD COLUMN external_form_display TEXT;

-- 2. 添加註釋和索引
CREATE INDEX IF NOT EXISTS idx_sales_records_external_form_display ON sales_records(external_form_display);

-- 3. 更新同步狀態，標記需要重新同步
UPDATE sync_status 
SET status = 'pending', 
    message = 'Added external_form_display filter, requires re-sync with filtered data',
    last_sync_count = 0
WHERE sync_type = 'sales_records';