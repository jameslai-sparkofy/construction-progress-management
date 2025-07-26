-- 統一欄位映射 - D1資料庫結構升級腳本
-- 建立時間：2025-07-25
-- 目的：統一前端、D1、CRM三方欄位映射

-- 開始事務
BEGIN TRANSACTION;

-- 1. 新增基本資訊欄位
ALTER TABLE site_progress ADD COLUMN unit_name TEXT;
ALTER TABLE site_progress ADD COLUMN site_area DECIMAL;

-- 2. 新增備註欄位（統一化）
ALTER TABLE site_progress ADD COLUMN pre_construction_note TEXT;
ALTER TABLE site_progress ADD COLUMN contractor_note TEXT;
ALTER TABLE site_progress ADD COLUMN site_note TEXT;
ALTER TABLE site_progress ADD COLUMN acceptance_note TEXT;

-- 3. 新增照片欄位（JSON格式儲存）
ALTER TABLE site_progress ADD COLUMN pre_photos TEXT; -- JSON格式存儲照片數據
ALTER TABLE site_progress ADD COLUMN completion_photos TEXT; -- JSON格式存儲照片數據
ALTER TABLE site_progress ADD COLUMN site_condition_photos TEXT;
ALTER TABLE site_progress ADD COLUMN acceptance_photos TEXT;

-- 4. 新增維修相關欄位
ALTER TABLE site_progress ADD COLUMN defect_category_1 TEXT;
ALTER TABLE site_progress ADD COLUMN defect_category_2 TEXT;
ALTER TABLE site_progress ADD COLUMN defect_note_1 TEXT;
ALTER TABLE site_progress ADD COLUMN defect_note_2 TEXT;
ALTER TABLE site_progress ADD COLUMN defect_photos_1 TEXT; -- JSON格式
ALTER TABLE site_progress ADD COLUMN defect_photos_2 TEXT; -- JSON格式
ALTER TABLE site_progress ADD COLUMN repair_date_1 DATE;
ALTER TABLE site_progress ADD COLUMN repair_date_2 DATE;
ALTER TABLE site_progress ADD COLUMN repair_cost_1 DECIMAL;
ALTER TABLE site_progress ADD COLUMN repair_cost_2 DECIMAL;
ALTER TABLE site_progress ADD COLUMN repair_completion_photos_1 TEXT; -- JSON格式
ALTER TABLE site_progress ADD COLUMN repair_completion_photos_2 TEXT; -- JSON格式

-- 5. 新增狀態管理欄位
ALTER TABLE site_progress ADD COLUMN stage TEXT; -- 階段：準備中/施工前場勘/施工/驗收/缺失維修/其他
ALTER TABLE site_progress ADD COLUMN tags TEXT; -- 標籤：多選，JSON格式儲存
ALTER TABLE site_progress ADD COLUMN site_type TEXT; -- 案場類型：工地/樣品屋/民宅/其他
ALTER TABLE site_progress ADD COLUMN construction_completed BOOLEAN DEFAULT FALSE;

-- 6. 新增系統追蹤欄位
ALTER TABLE site_progress ADD COLUMN area DECIMAL; -- 統一的面積欄位名稱

-- 7. 建立索引以提升查詢性能
CREATE INDEX IF NOT EXISTS idx_site_progress_unit_name ON site_progress(unit_name);
CREATE INDEX IF NOT EXISTS idx_site_progress_stage ON site_progress(stage);
CREATE INDEX IF NOT EXISTS idx_site_progress_construction_completed ON site_progress(construction_completed);
CREATE INDEX IF NOT EXISTS idx_site_progress_site_type ON site_progress(site_type);

-- 8. 資料遷移：將現有的 notes JSON 數據解析到新欄位
-- 這個部分需要根據現有數據結構進行調整
UPDATE site_progress 
SET pre_construction_note = JSON_EXTRACT(notes, '$.preConstructionNote')
WHERE notes IS NOT NULL AND JSON_EXTRACT(notes, '$.preConstructionNote') IS NOT NULL;

UPDATE site_progress 
SET unit_name = JSON_EXTRACT(notes, '$.unit')
WHERE notes IS NOT NULL AND JSON_EXTRACT(notes, '$.unit') IS NOT NULL;

-- 9. 建立觸發器確保數據一致性
CREATE TRIGGER IF NOT EXISTS update_site_progress_timestamp 
AFTER UPDATE ON site_progress
FOR EACH ROW
BEGIN
    UPDATE site_progress SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 10. 建立視圖以便於查詢統一格式的數據
CREATE VIEW IF NOT EXISTS site_progress_unified AS
SELECT 
    id,
    crm_opportunity_id,
    project_id,
    site_id,
    building_name,
    floor_number,
    unit_name,
    construction_item,
    area,
    site_area,
    actual_start_date as construction_date,
    contractor_name,
    construction_completed,
    pre_construction_note,
    contractor_note,
    site_note,
    acceptance_note,
    pre_photos,
    completion_photos,
    site_condition_photos,
    acceptance_photos,
    defect_category_1,
    defect_category_2,
    defect_note_1,
    defect_note_2,
    defect_photos_1,
    defect_photos_2,
    repair_date_1,
    repair_date_2,
    repair_cost_1,
    repair_cost_2,
    stage,
    tags,
    site_type,
    progress_percentage,
    status,
    created_at,
    updated_at,
    crm_record_id,
    crm_last_sync
FROM site_progress;

-- 提交事務
COMMIT;

-- 驗證腳本執行結果
SELECT 'Migration completed successfully' as result;

-- 檢查新欄位是否正確添加
PRAGMA table_info(site_progress);