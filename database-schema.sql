-- Cloudflare D1 資料庫表結構

-- 商機數據表
CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    customer TEXT,
    amount INTEGER DEFAULT 0,
    stage TEXT,
    create_time INTEGER,
    update_time INTEGER,
    synced_at INTEGER,
    raw_data TEXT, -- JSON 格式儲存完整原始數據
    UNIQUE(id)
);

-- 建立搜尋索引
CREATE INDEX IF NOT EXISTS idx_opportunities_name ON opportunities(name);
CREATE INDEX IF NOT EXISTS idx_opportunities_customer ON opportunities(customer);
CREATE INDEX IF NOT EXISTS idx_opportunities_synced_at ON opportunities(synced_at);
CREATE INDEX IF NOT EXISTS idx_opportunities_update_time ON opportunities(update_time);

-- 同步狀態表
CREATE TABLE IF NOT EXISTS sync_status (
    sync_type TEXT PRIMARY KEY,
    last_sync_time INTEGER,
    last_sync_count INTEGER,
    status TEXT,
    message TEXT
);

-- 初始化同步狀態
INSERT OR REPLACE INTO sync_status (sync_type, last_sync_time, last_sync_count, status, message)
VALUES ('opportunities', 0, 0, 'pending', 'Initial setup');

-- 搜尋日誌表（可選，用於分析搜尋行為）
CREATE TABLE IF NOT EXISTS search_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    search_term TEXT,
    results_count INTEGER,
    search_source TEXT, -- 'local' 或 'api'
    search_time INTEGER,
    user_agent TEXT
);