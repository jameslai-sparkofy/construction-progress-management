-- 執行銷售記錄過濾遷移 (只遷移 external_form_display__c = "顯示" 的記錄)

-- 先檢查源數據過濾結果
SELECT 
    'Filtered count' as status,
    COUNT(*) as display_count
FROM ActiveRecordObj 
WHERE json_extract(raw_data, '$.external_form_display__c') = 'option_displayed__c';

-- 執行過濾遷移 (只同步 "顯示" 的記錄)
INSERT INTO sales_records (
    id, name, opportunity_id, record_type, content,
    interactive_type, follow_date, sales_person, 
    customer_name, amount, stage, notes, location,
    external_form_display, create_time, update_time, 
    synced_at, raw_data
)
SELECT 
    id,
    name,
    opportunity_id,
    record_type,
    content,
    interactive_type,
    follow_date,
    sales_person,
    customer_name,
    amount,
    stage,
    notes,
    location,
    '顯示' as external_form_display, -- 硬編碼為 "顯示"
    COALESCE(create_time, strftime('%s', 'now')) as create_time,
    COALESCE(update_time, strftime('%s', 'now')) as update_time,
    strftime('%s', 'now') as synced_at,
    COALESCE(raw_data, '{}') as raw_data
FROM ActiveRecordObj
WHERE json_extract(raw_data, '$.external_form_display__c') = 'option_displayed__c'
AND id IS NOT NULL AND id != '';

-- 檢查遷移結果
SELECT 
    'Filtered migration completed' as status,
    COUNT(*) as migrated_count
FROM sales_records;