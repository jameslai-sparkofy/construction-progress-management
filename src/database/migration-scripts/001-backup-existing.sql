-- 數據遷移階段 1: 備份現有數據
-- 版本: 2.0.0
-- 創建時間: 2025-07-26

-- =====================================================
-- 步驟 1: 創建備份表
-- =====================================================

-- 備份商機表 (NewOpportunityObj -> opportunities_backup)
CREATE TABLE IF NOT EXISTS opportunities_backup AS 
SELECT * FROM NewOpportunityObj;

-- 備份案場表 (object_8W9cb__c -> sites_backup)
CREATE TABLE IF NOT EXISTS sites_backup AS 
SELECT * FROM object_8W9cb__c;

-- 備份銷售記錄表 (ActiveRecordObj -> sales_records_backup)
CREATE TABLE IF NOT EXISTS sales_records_backup AS 
SELECT * FROM ActiveRecordObj;

-- 備份維修單表 (field_V3d91__c -> maintenance_orders_backup)
CREATE TABLE IF NOT EXISTS maintenance_orders_backup AS 
SELECT * FROM field_V3d91__c;

-- =====================================================
-- 步驟 2: 記錄備份統計
-- =====================================================

-- 創建遷移歷史表（如果不存在）
CREATE TABLE IF NOT EXISTS migration_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_name TEXT NOT NULL,
    migration_version TEXT NOT NULL,
    
    -- 遷移狀態
    status TEXT CHECK(status IN ('pending', 'running', 'completed', 'failed', 'rolled_back')) DEFAULT 'pending',
    
    -- 統計信息
    records_migrated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    
    -- 時間信息
    started_at INTEGER,
    completed_at INTEGER,
    rollback_at INTEGER,
    
    -- 錯誤信息
    error_message TEXT,
    rollback_reason TEXT,
    
    -- 備份信息
    backup_location TEXT,
    
    -- 創建時間
    created_at INTEGER DEFAULT (unixepoch())
);

-- 記錄備份操作
INSERT INTO migration_history (
    migration_name, 
    migration_version, 
    status, 
    started_at,
    backup_location
) VALUES (
    '001-backup-existing', 
    '2.0.0', 
    'completed', 
    unixepoch(),
    'opportunities_backup,sites_backup,sales_records_backup,maintenance_orders_backup'
);

-- =====================================================
-- 步驟 3: 驗證備份完整性
-- =====================================================

-- 檢查備份表數量
SELECT 'Backup Verification' as operation;
SELECT 
    'opportunities_backup' as table_name, 
    COUNT(*) as record_count 
FROM opportunities_backup
UNION ALL
SELECT 
    'sites_backup' as table_name, 
    COUNT(*) as record_count 
FROM sites_backup
UNION ALL
SELECT 
    'sales_records_backup' as table_name, 
    COUNT(*) as record_count 
FROM sales_records_backup
UNION ALL
SELECT 
    'maintenance_orders_backup' as table_name, 
    COUNT(*) as record_count 
FROM maintenance_orders_backup;