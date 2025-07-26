-- 同步LOG表結構
-- 記錄所有同步操作的詳細日誌

CREATE TABLE IF NOT EXISTS sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_type TEXT NOT NULL,           -- 同步類型: 'opportunities', 'sites', 'maintenance', 'sales'
    operation TEXT NOT NULL,           -- 操作類型: 'sync', 'manual_trigger', 'cron_trigger'
    status TEXT NOT NULL,              -- 狀態: 'started', 'success', 'error', 'completed'
    start_time INTEGER NOT NULL,       -- 開始時間戳
    end_time INTEGER,                  -- 結束時間戳
    duration INTEGER,                  -- 持續時間(毫秒)
    records_processed INTEGER DEFAULT 0, -- 處理的記錄數
    records_success INTEGER DEFAULT 0,   -- 成功的記錄數
    records_error INTEGER DEFAULT 0,     -- 失敗的記錄數
    error_message TEXT,                -- 錯誤訊息
    details TEXT,                      -- 詳細信息(JSON格式)
    user_agent TEXT,                   -- 用戶代理
    ip_address TEXT,                   -- IP地址
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- 建立索引以提高查詢效能
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type ON sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_start_time ON sync_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at);

-- 清理舊日誌的觸發器（可選，保留最近30天的日誌）
-- CREATE TRIGGER IF NOT EXISTS cleanup_old_sync_logs
-- AFTER INSERT ON sync_logs
-- BEGIN
--     DELETE FROM sync_logs 
--     WHERE created_at < (strftime('%s', 'now') - 30*24*60*60) * 1000;
-- END;