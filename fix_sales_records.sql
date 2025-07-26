-- 修复 sales_records 表结构
-- 步骤 1: 备份现有数据（如果存在）
CREATE TABLE IF NOT EXISTS sales_records_backup AS SELECT * FROM sales_records;

-- 步骤 2: 删除现有表
DROP TABLE IF EXISTS sales_records;

-- 步骤 3: 重新创建表，确保 opportunity_id 允许为 NULL
CREATE TABLE sales_records (
    id TEXT PRIMARY KEY,
    name TEXT,
    opportunity_id TEXT NULL, -- 明确标记为可以为 NULL
    record_type TEXT,
    content TEXT,
    interactive_type TEXT,
    follow_date TEXT,
    sales_person TEXT,
    customer_name TEXT,
    amount REAL DEFAULT 0,
    stage TEXT,
    notes TEXT,
    location TEXT,
    external_form_display TEXT,
    create_time INTEGER,
    update_time INTEGER,
    synced_at INTEGER,
    raw_data TEXT,
    UNIQUE(id)
);

-- 步骤 4: 恢复数据（如果备份表存在）
INSERT OR IGNORE INTO sales_records 
SELECT * FROM sales_records_backup 
WHERE EXISTS (SELECT name FROM sqlite_master WHERE type='table' AND name='sales_records_backup');

-- 步骤 5: 清理备份表
DROP TABLE IF EXISTS sales_records_backup;

-- 步骤 6: 创建索引
CREATE INDEX IF NOT EXISTS idx_sales_records_opportunity_id ON sales_records(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sales_records_record_type ON sales_records(record_type);
CREATE INDEX IF NOT EXISTS idx_sales_records_create_time ON sales_records(create_time);
CREATE INDEX IF NOT EXISTS idx_sales_records_synced_at ON sales_records(synced_at);
CREATE INDEX IF NOT EXISTS idx_sales_records_external_form_display ON sales_records(external_form_display);

-- 步骤 7: 更新或创建同步状态记录
INSERT OR REPLACE INTO sync_status (sync_type, last_sync_time, last_sync_count, status, message)
VALUES ('sales_records', 0, 0, 'pending', 'Table recreated, ready for sync with NULL-safe opportunity_id');