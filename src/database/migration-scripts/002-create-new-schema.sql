-- 數據遷移階段 2: 創建新的架構
-- 版本: 2.0.0
-- 創建時間: 2025-07-26

-- =====================================================
-- 1. 商機表 (opportunities) - 基礎對象
-- =====================================================
CREATE TABLE IF NOT EXISTS opportunities (
    -- 主鍵與基本信息
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    customer TEXT,
    amount INTEGER DEFAULT 0,
    stage TEXT,
    
    -- 時間戳記
    create_time INTEGER NOT NULL,
    update_time INTEGER NOT NULL,
    synced_at INTEGER,
    
    -- 擴展字段
    description TEXT,
    probability INTEGER DEFAULT 0, -- 成交概率 (0-100)
    expected_close_date INTEGER,  -- 預期成交日期
    source TEXT,                  -- 商機來源
    priority TEXT CHECK(priority IN ('低', '中', '高', '緊急')) DEFAULT '中',
    
    -- 系統字段
    raw_data TEXT,               -- JSON 格式完整原始數據
    version INTEGER DEFAULT 1,   -- 記錄版本號
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by TEXT,             -- 創建人
    last_modified_by TEXT,       -- 最後修改人
    
    -- 索引字段（用於快速查詢）
    search_text TEXT,            -- 組合搜尋字段
    
    UNIQUE(id)
);

-- =====================================================
-- 2. 案場表 (sites) - 重新設計
-- =====================================================
CREATE TABLE IF NOT EXISTS sites (
    -- 主鍵與基本信息
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,           -- 案場編號（如：A01-3F-301）
    opportunity_id TEXT,          -- 關聯商機ID
    
    -- 位置信息
    building_type TEXT,           -- 棟別 (A棟/B棟/C棟)
    floor_info INTEGER,           -- 樓層
    room_info TEXT,               -- 戶別
    address TEXT,                 -- 詳細地址
    
    -- 工程信息
    construction_status TEXT,     -- 施工狀態
    contractor_team TEXT,         -- 工班師父
    construction_completed BOOLEAN DEFAULT FALSE,
    
    -- 面積信息
    site_area REAL,              -- 工地坪數
    floor_area REAL,             -- 舖設坪數
    protection_area REAL,        -- 保護板坪數
    
    -- 重要日期
    construction_date INTEGER,    -- 施工日期
    inspection_date1 INTEGER,     -- 驗收日期1
    inspection_date2 INTEGER,     -- 驗收日期2
    warranty_date INTEGER,        -- 保固日期
    
    -- 狀態標籤
    tags TEXT,                   -- JSON 陣列格式的標籤
    site_type TEXT CHECK(site_type IN ('工地', '樣品屋', '民宅', '其他')),
    current_phase TEXT CHECK(current_phase IN ('準備中', '施工前場勘', '施工', '驗收', '缺失維修', '其他')),
    
    -- 備註信息
    site_notes TEXT,             -- 工地備註
    pre_construction_notes TEXT,  -- 施工前備註
    team_notes TEXT,             -- 工班備註
    inspection_notes TEXT,       -- 驗收備註
    
    -- 維修相關
    defect_category1 TEXT,       -- 缺失分類1
    defect_notes1 TEXT,          -- 缺失備註1
    defect_category2 TEXT,       -- 缺失分類2
    defect_notes2 TEXT,          -- 缺失備註2
    repair_date1 INTEGER,        -- 維修日期1
    repair_date2 INTEGER,        -- 維修日期2
    repair_cost1 INTEGER,        -- 維修費用1
    repair_cost2 INTEGER,        -- 維修費用2
    
    -- 時間戳記
    create_time INTEGER NOT NULL,
    update_time INTEGER NOT NULL,
    synced_at INTEGER,
    
    -- 系統字段
    raw_data TEXT,
    version INTEGER DEFAULT 1,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by TEXT,
    last_modified_by TEXT,
    
    -- 索引字段
    search_text TEXT,
    
    -- 外鍵約束（暫時註解，待數據遷移後啟用）
    -- FOREIGN KEY (opportunity_id) REFERENCES opportunities(id),
    UNIQUE(id)
);

-- =====================================================
-- 3. 維修單表 (maintenance_orders) - 新增
-- =====================================================
CREATE TABLE IF NOT EXISTS maintenance_orders (
    -- 主鍵與基本信息
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    opportunity_id TEXT,
    site_id TEXT,
    
    -- 維修信息
    issue_type TEXT,             -- 問題類型
    issue_description TEXT,       -- 問題描述
    status TEXT CHECK(status IN ('待處理', '處理中', '已完成', '已取消')) DEFAULT '待處理',
    priority TEXT CHECK(priority IN ('低', '中', '高', '緊急')) DEFAULT '中',
    
    -- 人員分配
    assigned_to TEXT,            -- 指派給
    reported_by TEXT,            -- 回報人
    
    -- 成本信息
    estimated_cost INTEGER DEFAULT 0,
    actual_cost INTEGER DEFAULT 0,
    
    -- 時間信息
    reported_date INTEGER,       -- 回報日期
    scheduled_date INTEGER,      -- 計劃日期
    completed_date INTEGER,      -- 完成日期
    
    -- 進度追蹤
    progress INTEGER DEFAULT 0,  -- 進度百分比 (0-100)
    
    -- 附件信息
    photos TEXT,                 -- JSON 陣列格式的照片路徑
    documents TEXT,              -- JSON 陣列格式的文檔路徑
    
    -- 時間戳記
    create_time INTEGER NOT NULL,
    update_time INTEGER NOT NULL,
    synced_at INTEGER,
    
    -- 系統字段
    raw_data TEXT,
    version INTEGER DEFAULT 1,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by TEXT,
    last_modified_by TEXT,
    
    -- 索引字段
    search_text TEXT,
    
    -- 外鍵約束（暫時註解，待數據遷移後啟用）
    -- FOREIGN KEY (opportunity_id) REFERENCES opportunities(id),
    -- FOREIGN KEY (site_id) REFERENCES sites(id),
    UNIQUE(id)
);

-- =====================================================
-- 4. 銷售記錄表 (sales_records) - 新增
-- =====================================================
CREATE TABLE IF NOT EXISTS sales_records (
    -- 主鍵與基本信息
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    opportunity_id TEXT NOT NULL, -- 必須關聯商機
    
    -- 記錄信息
    record_type TEXT,            -- 記錄類型
    content TEXT,                -- 記錄內容
    interactive_type TEXT,        -- 互動類型
    location TEXT,               -- 地點
    
    -- 可見性控制
    is_external_visible BOOLEAN DEFAULT FALSE, -- 外部顯示控制
    visibility_level TEXT CHECK(visibility_level IN ('公開', '內部', '私密')) DEFAULT '內部',
    
    -- 分類標籤
    category TEXT,               -- 記錄分類
    tags TEXT,                   -- JSON 陣列格式的標籤
    
    -- 關聯人員
    participants TEXT,           -- JSON 陣列格式的參與人員
    contact_person TEXT,         -- 聯絡人
    
    -- 附件信息
    attachments TEXT,            -- JSON 陣列格式的附件
    
    -- 統計信息
    view_count INTEGER DEFAULT 0,
    interaction_count INTEGER DEFAULT 0,
    
    -- 時間戳記
    create_time INTEGER NOT NULL,
    update_time INTEGER NOT NULL,
    synced_at INTEGER,
    
    -- 系統字段
    raw_data TEXT,
    version INTEGER DEFAULT 1,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by TEXT,
    last_modified_by TEXT,
    
    -- 索引字段
    search_text TEXT,
    
    -- 外鍵約束（暫時註解，待數據遷移後啟用）
    -- FOREIGN KEY (opportunity_id) REFERENCES opportunities(id),
    UNIQUE(id)
);

-- =====================================================
-- 5. 優化後的同步狀態表
-- =====================================================
CREATE TABLE IF NOT EXISTS sync_status_new (
    object_type TEXT PRIMARY KEY,
    
    -- 同步統計
    last_sync_time INTEGER,
    last_sync_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    
    -- 同步狀態
    status TEXT CHECK(status IN ('idle', 'syncing', 'completed', 'failed', 'paused')) DEFAULT 'idle',
    sync_type TEXT CHECK(sync_type IN ('full', 'incremental', 'manual')) DEFAULT 'full',
    
    -- 效能指標
    sync_duration INTEGER DEFAULT 0,    -- 同步耗時（毫秒）
    average_duration INTEGER DEFAULT 0, -- 平均耗時
    records_per_second REAL DEFAULT 0,  -- 處理速度
    
    -- 錯誤信息
    error_message TEXT,
    error_count INTEGER DEFAULT 0,
    last_error_time INTEGER,
    
    -- 配置信息
    batch_size INTEGER DEFAULT 100,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- 時間戳記
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    
    -- 下次預定同步時間
    next_sync_time INTEGER,
    
    -- 同步模式配置
    auto_sync_enabled BOOLEAN DEFAULT TRUE,
    sync_priority INTEGER DEFAULT 1     -- 同步優先級 (1-10)
);

-- =====================================================
-- 6. 同步日誌表 (sync_logs) - 優化版本
-- =====================================================
CREATE TABLE IF NOT EXISTS sync_logs_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 基本信息
    object_type TEXT NOT NULL,
    operation_type TEXT NOT NULL, -- 'full_sync', 'incremental_sync', 'manual_sync', 'batch_sync'
    trigger_source TEXT NOT NULL, -- 'cron', 'manual', 'api', 'form_submit'
    
    -- 請求信息
    user_agent TEXT,
    ip_address TEXT,
    request_id TEXT,
    
    -- 時間信息
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    duration INTEGER,            -- 耗時（毫秒）
    
    -- 狀態信息
    status TEXT CHECK(status IN ('started', 'running', 'completed', 'failed', 'cancelled')) DEFAULT 'started',
    
    -- 處理統計
    processed_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,
    
    -- 效能指標
    memory_usage INTEGER,        -- 記憶體使用（KB）
    cpu_usage REAL,             -- CPU 使用率
    api_calls_count INTEGER DEFAULT 0,
    
    -- 錯誤詳情
    error_details TEXT,          -- JSON 格式錯誤詳情
    warnings TEXT,               -- JSON 格式警告信息
    
    -- 同步範圍
    sync_from_time INTEGER,      -- 增量同步起始時間
    sync_to_time INTEGER,        -- 增量同步結束時間
    batch_info TEXT,             -- JSON 格式批量信息
    
    -- 創建時間
    created_at INTEGER DEFAULT (unixepoch())
);

-- =====================================================
-- 7. 系統配置表 (system_config) - 新增
-- =====================================================
CREATE TABLE IF NOT EXISTS system_config (
    config_key TEXT PRIMARY KEY,
    config_value TEXT NOT NULL,
    config_type TEXT CHECK(config_type IN ('string', 'number', 'boolean', 'json')) DEFAULT 'string',
    description TEXT,
    category TEXT,               -- 配置分類
    is_sensitive BOOLEAN DEFAULT FALSE, -- 是否為敏感配置
    
    -- 版本控制
    version INTEGER DEFAULT 1,
    
    -- 時間戳記
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    created_by TEXT,
    updated_by TEXT
);

-- =====================================================
-- 記錄創建新架構的歷史
-- =====================================================
INSERT INTO migration_history (
    migration_name, 
    migration_version, 
    status, 
    started_at
) VALUES (
    '002-create-new-schema', 
    '2.0.0', 
    'completed', 
    unixepoch()
);

-- =====================================================
-- 驗證新表結構
-- =====================================================
SELECT 'New Schema Created' as operation;
SELECT name FROM sqlite_master WHERE type='table' AND name IN (
    'opportunities', 
    'sites', 
    'maintenance_orders', 
    'sales_records',
    'sync_status_new',
    'sync_logs_new',
    'system_config'
) ORDER BY name;