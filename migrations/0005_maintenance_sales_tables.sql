-- 維修單資料表 (Maintenance Orders)
-- 基於 on_site_signature__c 對象

CREATE TABLE IF NOT EXISTS maintenance_orders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    opportunity_id TEXT,
    site_id TEXT,
    status TEXT,
    issue_type TEXT,
    description TEXT,
    maintenance_date TEXT,
    technician TEXT,
    contractor TEXT,
    cost REAL DEFAULT 0,
    completion_status INTEGER DEFAULT 0,
    priority TEXT,
    notes TEXT,
    create_time INTEGER,
    update_time INTEGER,
    synced_at INTEGER,
    raw_data TEXT,
    UNIQUE(id)
);

-- 銷售跟進記錄資料表 (Sales Records / Active Records)
-- 基於 ActiveRecordObj 對象

CREATE TABLE IF NOT EXISTS sales_records (
    id TEXT PRIMARY KEY,
    name TEXT,
    opportunity_id TEXT, -- 可能為空，因為不見得每一筆都關聯商機
    record_type TEXT, -- 跟進類別 (active_record_type)
    content TEXT, -- 記錄內容 (active_record_content)
    interactive_type TEXT, -- 互動類型 (interactive_types)
    follow_date TEXT,
    sales_person TEXT,
    customer_name TEXT,
    amount REAL DEFAULT 0,
    stage TEXT,
    notes TEXT,
    location TEXT, -- 定位 (field_aN2iY__c)
    external_form_display TEXT, -- 外部表單顯示 (external_form_display__c)
    create_time INTEGER,
    update_time INTEGER,
    synced_at INTEGER,
    raw_data TEXT,
    UNIQUE(id)
);

-- 建立索引提升查詢效能

-- 維修單索引
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_opportunity_id ON maintenance_orders(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_site_id ON maintenance_orders(site_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_status ON maintenance_orders(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_create_time ON maintenance_orders(create_time);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_synced_at ON maintenance_orders(synced_at);

-- 銷售記錄索引  
CREATE INDEX IF NOT EXISTS idx_sales_records_opportunity_id ON sales_records(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sales_records_record_type ON sales_records(record_type);
CREATE INDEX IF NOT EXISTS idx_sales_records_create_time ON sales_records(create_time);
CREATE INDEX IF NOT EXISTS idx_sales_records_synced_at ON sales_records(synced_at);

-- 更新同步狀態表
INSERT OR REPLACE INTO sync_status (sync_type, last_sync_time, last_sync_count, status, message)
VALUES 
  ('maintenance_orders', 0, 0, 'pending', 'Maintenance orders table created, ready for sync'),
  ('sales_records', 0, 0, 'pending', 'Sales records table created, ready for sync');