-- 執行案場數據遷移第一批 (100筆)
INSERT INTO sites (
    id, name, opportunity_id, building_type, address, 
    construction_status, site_type, current_phase, 
    create_time, update_time, synced_at, raw_data
)
SELECT 
    id, name, opportunity_id, building_type, address,
    status, '其他', '其他',
    COALESCE(create_time, strftime('%s', 'now')),
    COALESCE(update_time, strftime('%s', 'now')),
    strftime('%s', 'now'),
    COALESCE(raw_data, '{}')
FROM object_8W9cb__c 
WHERE id IS NOT NULL AND id != ''
LIMIT 100;

-- 檢查結果
SELECT COUNT(*) as migrated_count FROM sites;