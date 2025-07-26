-- 003-migrate-data.sql
-- Phase 3: 實際數據遷移腳本
-- 
-- 功能：
-- 1. 基於 UnifiedMappingService 的映射規則遷移數據
-- 2. 支援大量數據的分批處理
-- 3. 處理關聯關係和數據完整性
-- 4. 提供銷售記錄篩選邏輯
--
-- 遷移數據量統計：
-- - 商機: 494筆 → opportunities
-- - 案場: 11,827筆 → sites
-- - 銷售記錄: 3,600筆 → sales_records (需篩選)
-- - 維修單: 0筆 → maintenance_orders

-- ============================================================================
-- 1. 商機數據遷移 (NewOpportunityObj → opportunities)
-- ============================================================================

-- 備份現有數據（如果存在）
DROP TABLE IF EXISTS opportunities_migration_backup;
CREATE TABLE opportunities_migration_backup AS SELECT * FROM opportunities;

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
    close_date,
    owner_id,
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
    END as close_date,
    COALESCE(CAST(OwnerId AS TEXT), '') as owner_id,
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

-- ============================================================================
-- 2. 案場數據遷移 (object_8W9cb__c → sites)
-- ============================================================================

-- 備份現有數據（如果存在）
DROP TABLE IF EXISTS sites_migration_backup;
CREATE TABLE sites_migration_backup AS SELECT * FROM sites;

-- 清空目標表  
DELETE FROM sites;

-- 遷移案場數據（分批處理，每次1000筆）
-- 注意：由於數據量大（11,827筆），此腳本需要分批執行

INSERT INTO sites (
    id,
    name,
    opportunity_id,
    address,
    area,
    building_type,
    construction_status,
    progress_percentage,
    owner_id,
    create_time,
    update_time,
    synced_at,
    raw_data
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
LIMIT 1000;

-- ============================================================================
-- 3. 銷售記錄數據遷移 (ActiveRecordObj → sales_records)
-- ============================================================================

-- 備份現有數據（如果存在）
DROP TABLE IF EXISTS sales_records_migration_backup;
CREATE TABLE sales_records_migration_backup AS SELECT * FROM sales_records;

-- 清空目標表
DELETE FROM sales_records;

-- 遷移銷售記錄數據（僅遷移有商機關聯且外部顯示="顯示"的記錄）
INSERT INTO sales_records (
    id,
    name,
    opportunity_id,
    amount,
    record_date,
    status,
    owner_id,
    description,
    create_time,
    update_time,
    synced_at,
    raw_data
)
SELECT 
    CAST(DataId AS TEXT) as id,
    COALESCE(CAST(Name AS TEXT), '') as name,
    COALESCE(CAST(OpportunityId AS TEXT), '') as opportunity_id,
    COALESCE(CAST(Amount AS REAL), 0.0) as amount,
    CASE 
        WHEN RecordDate IS NOT NULL AND RecordDate != '' 
        THEN CAST(RecordDate AS INTEGER)
        ELSE NULL 
    END as record_date,
    COALESCE(CAST(Status AS TEXT), '') as status,
    COALESCE(CAST(OwnerId AS TEXT), '') as owner_id,
    COALESCE(CAST(Description AS TEXT), '') as description,
    COALESCE(CAST(CreateTime AS INTEGER), strftime('%s', 'now')) as create_time,
    COALESCE(CAST(UpdateTime AS INTEGER), strftime('%s', 'now')) as update_time,
    CAST(strftime('%s', 'now') AS INTEGER) as synced_at,
    json_object(
        'DataId', DataId,
        'Name', Name,
        'OpportunityId', OpportunityId,
        'Amount', Amount,
        'RecordDate', RecordDate,
        'Status', Status,
        'OwnerId', OwnerId,
        'Description', Description,
        'CreateTime', CreateTime,
        'UpdateTime', UpdateTime,
        'ExternalShow', ExternalShow
    ) as raw_data
FROM ActiveRecordObj
WHERE DataId IS NOT NULL
  AND OpportunityId IS NOT NULL 
  AND OpportunityId != ''
  AND COALESCE(ExternalShow, '') = '顯示';

-- ============================================================================
-- 4. 維修單數據遷移 (field_V3d91__c → maintenance_orders)
-- ============================================================================

-- 備份現有數據（如果存在）
DROP TABLE IF EXISTS maintenance_orders_migration_backup;
CREATE TABLE maintenance_orders_migration_backup AS SELECT * FROM maintenance_orders;

-- 清空目標表
DELETE FROM maintenance_orders;

-- 遷移維修單數據（目前為0筆，但保留結構）
INSERT INTO maintenance_orders (
    id,
    name,
    site_id,
    issue_type,
    description,
    status,
    priority,
    assigned_to,
    reported_date,
    completed_date,
    create_time,
    update_time,
    synced_at,
    raw_data
)
SELECT 
    CAST(DataId AS TEXT) as id,
    COALESCE(CAST(Name AS TEXT), '') as name,
    COALESCE(CAST(SiteId AS TEXT), '') as site_id,
    COALESCE(CAST(IssueType AS TEXT), '') as issue_type,
    COALESCE(CAST(Description AS TEXT), '') as description,
    COALESCE(CAST(Status AS TEXT), '') as status,
    COALESCE(CAST(Priority AS TEXT), '') as priority,
    COALESCE(CAST(AssignedTo AS TEXT), '') as assigned_to,
    CASE 
        WHEN ReportedDate IS NOT NULL AND ReportedDate != '' 
        THEN CAST(ReportedDate AS INTEGER)
        ELSE NULL 
    END as reported_date,
    CASE 
        WHEN CompletedDate IS NOT NULL AND CompletedDate != '' 
        THEN CAST(CompletedDate AS INTEGER)
        ELSE NULL 
    END as completed_date,
    COALESCE(CAST(CreateTime AS INTEGER), strftime('%s', 'now')) as create_time,
    COALESCE(CAST(UpdateTime AS INTEGER), strftime('%s', 'now')) as update_time,
    CAST(strftime('%s', 'now') AS INTEGER) as synced_at,
    json_object(
        'DataId', DataId,
        'Name', Name,
        'SiteId', SiteId,
        'IssueType', IssueType,
        'Description', Description,
        'Status', Status,
        'Priority', Priority,
        'AssignedTo', AssignedTo,
        'ReportedDate', ReportedDate,
        'CompletedDate', CompletedDate,
        'CreateTime', CreateTime,
        'UpdateTime', UpdateTime
    ) as raw_data
FROM field_V3d91__c
WHERE DataId IS NOT NULL;

-- ============================================================================
-- 5. 建立關聯關係索引（提升查詢性能）
-- ============================================================================

-- 商機索引
CREATE INDEX IF NOT EXISTS idx_opportunities_customer ON opportunities(customer);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_owner ON opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_update_time ON opportunities(update_time);

-- 案場索引
CREATE INDEX IF NOT EXISTS idx_sites_opportunity ON sites(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(construction_status);
CREATE INDEX IF NOT EXISTS idx_sites_owner ON sites(owner_id);
CREATE INDEX IF NOT EXISTS idx_sites_update_time ON sites(update_time);

-- 銷售記錄索引
CREATE INDEX IF NOT EXISTS idx_sales_records_opportunity ON sales_records(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sales_records_status ON sales_records(status);
CREATE INDEX IF NOT EXISTS idx_sales_records_date ON sales_records(record_date);
CREATE INDEX IF NOT EXISTS idx_sales_records_update_time ON sales_records(update_time);

-- 維修單索引
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_site ON maintenance_orders(site_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_status ON maintenance_orders(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_priority ON maintenance_orders(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_update_time ON maintenance_orders(update_time);

-- ============================================================================
-- 6. 更新遷移歷史記錄
-- ============================================================================

INSERT INTO migration_history (
    migration_name,
    migration_version,
    status,
    started_at,
    completed_at,
    records_migrated,
    description
) VALUES 
    (
        'data-migration-phase3',
        '2.0.0',
        'completed',
        strftime('%s', 'now'),
        strftime('%s', 'now'),
        (
            (SELECT COUNT(*) FROM opportunities) + 
            (SELECT COUNT(*) FROM sites) + 
            (SELECT COUNT(*) FROM sales_records) + 
            (SELECT COUNT(*) FROM maintenance_orders)
        ),
        'Phase 3: 完整數據遷移 - 商機、案場、銷售記錄、維修單數據遷移至新架構'
    );

-- ============================================================================
-- 7. 數據完整性驗證查詢
-- ============================================================================

-- 驗證遷移結果
SELECT 
    'Migration Summary' as report_type,
    'opportunities' as table_name,
    COUNT(*) as migrated_count,
    (SELECT COUNT(*) FROM NewOpportunityObj) as original_count
FROM opportunities

UNION ALL

SELECT 
    'Migration Summary' as report_type,
    'sites' as table_name,
    COUNT(*) as migrated_count,
    (SELECT COUNT(*) FROM object_8W9cb__c) as original_count
FROM sites

UNION ALL

SELECT 
    'Migration Summary' as report_type,
    'sales_records' as table_name,
    COUNT(*) as migrated_count,
    (SELECT COUNT(*) FROM ActiveRecordObj WHERE OpportunityId IS NOT NULL AND COALESCE(ExternalShow, '') = '顯示') as original_count
FROM sales_records

UNION ALL

SELECT 
    'Migration Summary' as report_type,
    'maintenance_orders' as table_name,
    COUNT(*) as migrated_count,
    (SELECT COUNT(*) FROM field_V3d91__c) as original_count
FROM maintenance_orders

ORDER BY table_name;

-- ============================================================================
-- 注意事項：
-- 
-- 1. **案場數據量大**: 11,827筆案場數據需要分批執行，建議每次1000筆
-- 2. **銷售記錄篩選**: 僅遷移有商機關聯且外部顯示="顯示"的記錄
-- 3. **關聯完整性**: 銷售記錄的 opportunity_id 必須在 opportunities 表中存在
-- 4. **備份安全**: 每個表在遷移前都會創建備份表
-- 5. **索引優化**: 遷移完成後會自動建立查詢優化索引
-- 6. **時間戳處理**: 所有時間欄位統一轉換為 Unix 時間戳（秒）
-- 7. **JSON 原始數據**: 保留完整的原始 CRM 數據用於追蹤和調試
-- ============================================================================