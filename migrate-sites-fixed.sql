-- 執行案場數據遷移 (object_8W9cb__c → sites)

-- 先檢查源數據
SELECT 'Sites source count:', COUNT(*) FROM object_8W9cb__c;

-- 分批遷移，每次1000筆，避免超時
DELETE FROM sites;

-- 第一批 (1-1000筆)
INSERT INTO sites (
    id,
    name,
    opportunity_id,
    building_type,
    floor_info,
    room_info,
    address,
    construction_status,
    contractor_team,
    construction_completed,
    site_area,
    floor_area,
    protection_area,
    construction_date,
    inspection_date1,
    inspection_date2,
    warranty_date,
    tags,
    site_type,
    current_phase,
    site_notes,
    pre_construction_notes,
    team_notes,
    inspection_notes,
    defect_category1,
    defect_notes1,
    defect_category2,
    defect_notes2,
    repair_date1,
    repair_date2,
    repair_cost1,
    repair_cost2,
    create_time,
    update_time,
    synced_at,
    raw_data
)
SELECT 
    COALESCE(id, '') as id,
    COALESCE(name, '') as name,
    COALESCE(opportunity_id, '') as opportunity_id,
    COALESCE(building_type, '') as building_type,
    CASE WHEN floor_info IS NOT NULL AND floor_info != '' 
         THEN CAST(floor_info AS INTEGER) 
         ELSE NULL END as floor_info,
    COALESCE(room_info, '') as room_info,
    COALESCE(address, '') as address,
    COALESCE(status, '') as construction_status,
    '' as contractor_team, -- 預設值
    FALSE as construction_completed, -- 預設值
    NULL as site_area, -- 預設值
    NULL as floor_area, -- 預設值
    NULL as protection_area, -- 預設值
    NULL as construction_date, -- 預設值
    NULL as inspection_date1, -- 預設值
    NULL as inspection_date2, -- 預設值
    NULL as warranty_date, -- 預設值
    '' as tags, -- 預設值
    '其他' as site_type, -- 使用約束允許的值
    '其他' as current_phase, -- 使用約束允許的值
    '' as site_notes, -- 預設值
    '' as pre_construction_notes, -- 預設值
    '' as team_notes, -- 預設值
    '' as inspection_notes, -- 預設值
    '' as defect_category1, -- 預設值
    '' as defect_notes1, -- 預設值
    '' as defect_category2, -- 預設值
    '' as defect_notes2, -- 預設值
    NULL as repair_date1, -- 預設值
    NULL as repair_date2, -- 預設值
    NULL as repair_cost1, -- 預設值
    NULL as repair_cost2, -- 預設值
    COALESCE(create_time, strftime('%s', 'now')) as create_time,
    COALESCE(update_time, strftime('%s', 'now')) as update_time,
    CAST(strftime('%s', 'now') AS INTEGER) as synced_at,
    COALESCE(raw_data, '{}') as raw_data
FROM object_8W9cb__c
WHERE id IS NOT NULL AND id != ''
LIMIT 1000;

-- 檢查第一批結果
SELECT 'First batch migrated:', COUNT(*) FROM sites;