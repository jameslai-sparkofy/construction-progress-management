-- 清理已遷移的數據，重新開始
DELETE FROM sites;

-- 執行案場數據去重遷移 (只取每個ID的最新記錄)
INSERT INTO sites (
    id, name, opportunity_id, building_type, address, 
    construction_status, site_type, current_phase, 
    create_time, update_time, synced_at, raw_data
)
SELECT 
    s.id, 
    s.name, 
    s.opportunity_id, 
    s.building_type, 
    s.address,
    s.status as construction_status, 
    '其他' as site_type, 
    '其他' as current_phase,
    COALESCE(s.create_time, strftime('%s', 'now')) as create_time,
    COALESCE(s.update_time, strftime('%s', 'now')) as update_time,
    strftime('%s', 'now') as synced_at,
    COALESCE(s.raw_data, '{}') as raw_data
FROM object_8W9cb__c s
INNER JOIN (
    SELECT id, MAX(update_time) as max_update_time
    FROM object_8W9cb__c 
    WHERE id IS NOT NULL AND id != ''
    GROUP BY id
) latest ON s.id = latest.id AND s.update_time = latest.max_update_time;

-- 檢查去重後的結果
SELECT 
    '去重遷移完成' as status,
    COUNT(*) as unique_migrated_count,
    (SELECT COUNT(DISTINCT id) FROM object_8W9cb__c) as expected_unique_count
FROM sites;