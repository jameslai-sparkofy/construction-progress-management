-- 修复 sales_records 表结构 - 添加缺失字段
-- Migration: Add external_form_display column to sales_records

-- 检查表是否存在，如果不存在则创建
CREATE TABLE IF NOT EXISTS sales_records (
    id TEXT PRIMARY KEY,
    name TEXT,
    opportunity_id TEXT,
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

-- 如果表已存在但缺少字段，则添加字段
ALTER TABLE sales_records ADD COLUMN external_form_display TEXT;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sales_records_opportunity_id ON sales_records(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sales_records_record_type ON sales_records(record_type);
CREATE INDEX IF NOT EXISTS idx_sales_records_create_time ON sales_records(create_time);
CREATE INDEX IF NOT EXISTS idx_sales_records_synced_at ON sales_records(synced_at);
CREATE INDEX IF NOT EXISTS idx_sales_records_external_form_display ON sales_records(external_form_display);

-- 更新同步状态
INSERT OR REPLACE INTO sync_status (sync_type, last_sync_time, last_sync_count, status, message)
VALUES ('sales_records', 0, 0, 'pending', 'Table structure fixed, ready for sync');