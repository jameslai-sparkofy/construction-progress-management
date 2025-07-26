-- 執行商機數據遷移 (NewOpportunityObj → opportunities)

-- 清空目標表
DELETE FROM opportunities;

-- 遷移商機數據
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
    CAST(DataId AS TEXT) as id,
    COALESCE(CAST(Name AS TEXT), '') as name,
    COALESCE(CAST(CustomerName AS TEXT), '') as customer,
    COALESCE(CAST(Amount AS REAL), 0.0) as amount,
    COALESCE(CAST(Stage AS TEXT), '') as stage,
    COALESCE(CAST(Probability AS REAL), 0.0) as probability,
    CASE 
        WHEN CloseDate IS NOT NULL AND CloseDate != '' 
        THEN CAST(CloseDate AS INTEGER)
        ELSE NULL 
    END as expected_close_date,
    COALESCE(CAST(Description AS TEXT), '') as description,
    COALESCE(CAST(CreateTime AS INTEGER), strftime('%s', 'now')) as create_time,
    COALESCE(CAST(UpdateTime AS INTEGER), strftime('%s', 'now')) as update_time,
    CAST(strftime('%s', 'now') AS INTEGER) as synced_at,
    json_object(
        'DataId', DataId,
        'Name', Name,
        'CustomerName', CustomerName,
        'Amount', Amount,  
        'Stage', Stage,
        'Probability', Probability,
        'CloseDate', CloseDate,
        'OwnerId', OwnerId,
        'Description', Description,
        'CreateTime', CreateTime,
        'UpdateTime', UpdateTime
    ) as raw_data
FROM NewOpportunityObj
WHERE DataId IS NOT NULL;

-- 驗證遷移結果
SELECT 
    'opportunities' as table_name,
    COUNT(*) as migrated_count,
    (SELECT COUNT(*) FROM NewOpportunityObj) as original_count
FROM opportunities;