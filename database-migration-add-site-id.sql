-- 添加 site_id 欄位到 site_progress 表
-- 這個腳本需要在 D1 資料庫中執行

ALTER TABLE site_progress ADD COLUMN site_id TEXT;

-- 創建索引來提高查詢性能
CREATE INDEX IF NOT EXISTS idx_site_progress_site_id ON site_progress(site_id);

-- 為現有記錄添加註釋
UPDATE site_progress SET site_id = NULL WHERE site_id IS NULL;