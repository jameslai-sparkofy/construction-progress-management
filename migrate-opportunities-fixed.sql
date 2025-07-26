-- 執行商機數據遷移 (NewOpportunityObj → opportunities)

-- 先檢查源數據
SELECT 'Source table count:', COUNT(*) FROM NewOpportunityObj;

-- 清空目標表
DELETE FROM opportunities;

-- 遷移商機數據（使用正確的欄位名稱）
INSERT INTO opportunities (
    id,
    name,
    customer,
    amount,
    stage,
    probability,
    expected_close_date,
    description,
    create_time,
    update_time,
    synced_at,
    raw_data
)
SELECT 
    COALESCE(id, '') as id,
    COALESCE(name, '') as name,
    COALESCE(customer, '') as customer,
    COALESCE(amount, 0) as amount,
    COALESCE(stage, '') as stage,
    0 as probability, -- 源表沒有此欄位，設為預設值
    NULL as expected_close_date, -- 源表沒有此欄位
    '' as description, -- 源表沒有此欄位，設為空字串
    COALESCE(create_time, strftime('%s', 'now')) as create_time,
    COALESCE(update_time, strftime('%s', 'now')) as update_time,
    CAST(strftime('%s', 'now') AS INTEGER) as synced_at,
    COALESCE(raw_data, '{}') as raw_data
FROM NewOpportunityObj
WHERE id IS NOT NULL AND id != '';

-- 驗證遷移結果
SELECT 
    'Migration completed' as status,
    COUNT(*) as migrated_count,
    (SELECT COUNT(*) FROM NewOpportunityObj) as original_count
FROM opportunities;