-- 003-migrate-sites-batch.sql
-- 案場數據分批遷移腳本
-- 
-- 由於案場數據量大（11,827筆），需要分批執行避免超時
-- 批次大小：1000筆
-- 預計需要：12批

-- ============================================================================
-- 批次 1: 記錄 1-1000
-- ============================================================================
INSERT INTO sites (
    id, name, opportunity_id, address, area, building_type, 
    construction_status, progress_percentage, owner_id, 
    create_time, update_time, synced_at, raw_data
)
SELECT 
    CAST(DataId AS TEXT) as id,
    COALESCE(CAST(field_8kz7n__c AS TEXT), '') as name,
    COALESCE(CAST(field_YIprv__c AS TEXT), '') as opportunity_id,
    COALESCE(CAST(field_9N59v__c AS TEXT), '') as address,
    COALESCE(CAST(field_u1wpv__c AS REAL), 0.0) as area,
    COALESCE(CAST(field_zPH5v__c AS TEXT), '') as building_type,
    COALESCE(CAST(field_s4T5p__c AS TEXT), '') as construction_status,
    COALESCE(CAST(field_xNJ5v__c AS REAL), 0.0) as progress_percentage,
    COALESCE(CAST(OwnerId AS TEXT), '') as owner_id,
    COALESCE(CAST(CreateTime AS INTEGER), strftime('%s', 'now')) as create_time,
    COALESCE(CAST(UpdateTime AS INTEGER), strftime('%s', 'now')) as update_time,
    CAST(strftime('%s', 'now') AS INTEGER) as synced_at,
    json_object(
        'DataId', DataId,
        'field_8kz7n__c', field_8kz7n__c,
        'field_YIprv__c', field_YIprv__c,
        'field_9N59v__c', field_9N59v__c,
        'field_u1wpv__c', field_u1wpv__c,
        'field_zPH5v__c', field_zPH5v__c,
        'field_s4T5p__c', field_s4T5p__c,
        'field_xNJ5v__c', field_xNJ5v__c,
        'OwnerId', OwnerId,
        'CreateTime', CreateTime,
        'UpdateTime', UpdateTime
    ) as raw_data
FROM object_8W9cb__c
WHERE DataId IS NOT NULL
ORDER BY ROWID
LIMIT 1000 OFFSET 0;

-- ============================================================================
-- 批次 2: 記錄 1001-2000
-- ============================================================================
INSERT INTO sites (
    id, name, opportunity_id, address, area, building_type, 
    construction_status, progress_percentage, owner_id, 
    create_time, update_time, synced_at, raw_data
)
SELECT 
    CAST(DataId AS TEXT) as id,
    COALESCE(CAST(field_8kz7n__c AS TEXT), '') as name,
    COALESCE(CAST(field_YIprv__c AS TEXT), '') as opportunity_id,
    COALESCE(CAST(field_9N59v__c AS TEXT), '') as address,
    COALESCE(CAST(field_u1wpv__c AS REAL), 0.0) as area,
    COALESCE(CAST(field_zPH5v__c AS TEXT), '') as building_type,
    COALESCE(CAST(field_s4T5p__c AS TEXT), '') as construction_status,
    COALESCE(CAST(field_xNJ5v__c AS REAL), 0.0) as progress_percentage,
    COALESCE(CAST(OwnerId AS TEXT), '') as owner_id,
    COALESCE(CAST(CreateTime AS INTEGER), strftime('%s', 'now')) as create_time,
    COALESCE(CAST(UpdateTime AS INTEGER), strftime('%s', 'now')) as update_time,
    CAST(strftime('%s', 'now') AS INTEGER) as synced_at,
    json_object(
        'DataId', DataId,
        'field_8kz7n__c', field_8kz7n__c,
        'field_YIprv__c', field_YIprv__c,
        'field_9N59v__c', field_9N59v__c,
        'field_u1wpv__c', field_u1wpv__c,
        'field_zPH5v__c', field_zPH5v__c,
        'field_s4T5p__c', field_s4T5p__c,
        'field_xNJ5v__c', field_xNJ5v__c,
        'OwnerId', OwnerId,
        'CreateTime', CreateTime,
        'UpdateTime', UpdateTime
    ) as raw_data
FROM object_8W9cb__c
WHERE DataId IS NOT NULL
ORDER BY ROWID
LIMIT 1000 OFFSET 1000;

-- ============================================================================
-- 批次 3: 記錄 2001-3000
-- ============================================================================
INSERT INTO sites (
    id, name, opportunity_id, address, area, building_type, 
    construction_status, progress_percentage, owner_id, 
    create_time, update_time, synced_at, raw_data
)
SELECT 
    CAST(DataId AS TEXT) as id,
    COALESCE(CAST(field_8kz7n__c AS TEXT), '') as name,
    COALESCE(CAST(field_YIprv__c AS TEXT), '') as opportunity_id,
    COALESCE(CAST(field_9N59v__c AS TEXT), '') as address,
    COALESCE(CAST(field_u1wpv__c AS REAL), 0.0) as area,
    COALESCE(CAST(field_zPH5v__c AS TEXT), '') as building_type,
    COALESCE(CAST(field_s4T5p__c AS TEXT), '') as construction_status,
    COALESCE(CAST(field_xNJ5v__c AS REAL), 0.0) as progress_percentage,
    COALESCE(CAST(OwnerId AS TEXT), '') as owner_id,
    COALESCE(CAST(CreateTime AS INTEGER), strftime('%s', 'now')) as create_time,
    COALESCE(CAST(UpdateTime AS INTEGER), strftime('%s', 'now')) as update_time,
    CAST(strftime('%s', 'now') AS INTEGER) as synced_at,
    json_object(
        'DataId', DataId,
        'field_8kz7n__c', field_8kz7n__c,
        'field_YIprv__c', field_YIprv__c,
        'field_9N59v__c', field_9N59v__c,
        'field_u1wpv__c', field_u1wpv__c,
        'field_zPH5v__c', field_zPH5v__c,
        'field_s4T5p__c', field_s4T5p__c,
        'field_xNJ5v__c', field_xNJ5v__c,
        'OwnerId', OwnerId,
        'CreateTime', CreateTime,
        'UpdateTime', UpdateTime
    ) as raw_data
FROM object_8W9cb__c
WHERE DataId IS NOT NULL
ORDER BY ROWID
LIMIT 1000 OFFSET 2000;

-- ============================================================================
-- 驗證當前批次結果
-- ============================================================================
SELECT 
    'Batch Progress' as report_type,
    COUNT(*) as current_migrated,
    (SELECT COUNT(*) FROM object_8W9cb__c) as total_original,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM object_8W9cb__c)), 2) as progress_percentage
FROM sites;

-- ============================================================================
-- 使用說明：
-- 
-- 1. 執行前請確保已執行主遷移腳本（003-migrate-data.sql）
-- 2. 分批執行避免超時，每批處理1000筆記錄
-- 3. 每批執行後檢查進度和錯誤
-- 4. 如果某批失敗，可以調整OFFSET重新執行該批
-- 5. 建議執行順序：
--    - 批次1-3（前3000筆）
--    - 檢查結果和性能
--    - 繼續執行後續批次
-- 
-- 總批次數：約12批（11,827 ÷ 1000 = 11.8）
-- ============================================================================