-- 執行案場數據去重遷移 (使用 GROUP BY 去重)
INSERT INTO sites (
    id, name, opportunity_id, building_type, address, 
    construction_status, site_type, current_phase, 
    create_time, update_time, synced_at, raw_data
)
SELECT 
    id, 
    MAX(name) as name, 
    MAX(opportunity_id) as opportunity_id, 
    MAX(building_type) as building_type, 
    MAX(address) as address,
    MAX(status) as construction_status, 
    '其他' as site_type, 
    '其他' as current_phase,
    MAX(COALESCE(create_time, strftime('%s', 'now'))) as create_time,
    MAX(COALESCE(update_time, strftime('%s', 'now'))) as update_time,
    strftime('%s', 'now') as synced_at,
    MAX(COALESCE(raw_data, '{}')) as raw_data
FROM object_8W9cb__c 
WHERE id IS NOT NULL AND id != ''
GROUP BY id;

-- 檢查結果
SELECT COUNT(*) as migrated_count FROM sites;