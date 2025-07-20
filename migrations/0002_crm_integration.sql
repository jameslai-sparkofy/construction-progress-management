-- CRM 整合資料表結構
-- 基於商機(Opportunity)建立三個核心資料表

-- 1. 案場進度表 (建築施工進度) - 對應可視化進度圖
CREATE TABLE IF NOT EXISTS site_progress (
    id TEXT PRIMARY KEY,
    crm_opportunity_id TEXT NOT NULL, -- 關聯商機ID
    project_id TEXT NOT NULL, -- 關聯本地專案
    building_name TEXT NOT NULL, -- 棟別 (A棟、B棟、C棟)
    floor_number INTEGER NOT NULL, -- 樓層
    construction_item TEXT NOT NULL, -- 施工項目
    progress_percentage INTEGER DEFAULT 0, -- 進度百分比
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, verified
    contractor_name TEXT, -- 負責工班
    start_date DATE,
    end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    notes TEXT,
    
    -- CRM 同步資料
    crm_record_id TEXT, -- CRM 中的記錄ID
    crm_last_sync TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id),
    UNIQUE (crm_opportunity_id, building_name, floor_number, construction_item)
);

-- 2. 銷售記錄表 (外部顯示用) - 從 CRM 銷售記錄同步
CREATE TABLE IF NOT EXISTS sales_records (
    id TEXT PRIMARY KEY,
    crm_opportunity_id TEXT NOT NULL, -- 關聯商機ID
    crm_record_id TEXT UNIQUE NOT NULL, -- CRM 銷售記錄ID
    
    -- 銷售資訊 (外部可顯示)
    customer_name TEXT, -- 客戶名稱
    property_info TEXT, -- 房產資訊
    sale_amount DECIMAL(15,2), -- 銷售金額
    sale_date DATE, -- 銷售日期
    payment_status TEXT, -- 付款狀態
    handover_status TEXT, -- 交屋狀態
    
    -- 顯示控制
    is_external_visible BOOLEAN DEFAULT true, -- 是否對外顯示
    display_order INTEGER DEFAULT 0, -- 顯示順序
    
    -- CRM 同步資料
    crm_data JSON, -- 完整 CRM 資料 (JSON格式)
    crm_last_sync TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 維修單表 - 從 CRM 維修記錄同步
CREATE TABLE IF NOT EXISTS maintenance_orders (
    id TEXT PRIMARY KEY,
    crm_opportunity_id TEXT NOT NULL, -- 關聯商機ID
    crm_record_id TEXT UNIQUE NOT NULL, -- CRM 維修單ID
    
    -- 維修資訊
    order_number TEXT UNIQUE NOT NULL, -- 維修單號
    customer_name TEXT, -- 客戶名稱
    property_location TEXT, -- 維修地點
    issue_description TEXT, -- 問題描述
    issue_category TEXT, -- 問題分類
    priority_level TEXT DEFAULT 'normal', -- 優先級: urgent, high, normal, low
    
    -- 狀態管理
    status TEXT DEFAULT 'pending', -- pending, assigned, in_progress, completed, closed
    assigned_to TEXT, -- 指派給誰
    estimated_date DATE, -- 預計處理日期
    actual_date DATE, -- 實際處理日期
    completion_notes TEXT, -- 完成備註
    
    -- 費用資訊
    estimated_cost DECIMAL(10,2), -- 預估費用
    actual_cost DECIMAL(10,2), -- 實際費用
    
    -- CRM 同步資料
    crm_data JSON, -- 完整 CRM 資料
    crm_last_sync TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CRM 同步狀態表 - 追蹤同步狀態
CREATE TABLE IF NOT EXISTS crm_sync_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL, -- 'site_progress', 'sales_records', 'maintenance_orders'
    crm_opportunity_id TEXT NOT NULL,
    last_sync_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'success', -- success, error, partial
    error_message TEXT,
    records_synced INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0
);

-- 商機基本資料表 - 從 CRM 商機同步
CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY, -- CRM 商機ID
    name TEXT NOT NULL, -- 商機名稱
    stage TEXT, -- 銷售階段
    probability DECIMAL(5,2), -- 成交機率
    amount DECIMAL(15,2), -- 商機金額
    close_date DATE, -- 預計成交日期
    
    -- 專案相關
    project_type TEXT, -- 專案類型
    building_info JSON, -- 建築資訊 (棟數、樓層等)
    
    -- CRM 同步資料
    crm_data JSON, -- 完整商機資料
    crm_last_sync TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立索引
CREATE INDEX idx_site_progress_opportunity ON site_progress(crm_opportunity_id);
CREATE INDEX idx_site_progress_building ON site_progress(building_name, floor_number);
CREATE INDEX idx_sales_records_opportunity ON sales_records(crm_opportunity_id);
CREATE INDEX idx_sales_records_visible ON sales_records(is_external_visible);
CREATE INDEX idx_maintenance_orders_opportunity ON maintenance_orders(crm_opportunity_id);
CREATE INDEX idx_maintenance_orders_status ON maintenance_orders(status);
CREATE INDEX idx_crm_sync_status_entity ON crm_sync_status(entity_type, crm_opportunity_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);