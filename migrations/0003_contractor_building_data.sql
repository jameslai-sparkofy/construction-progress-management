-- 完整工班和建築資料結構
-- 基於實際興安西專案的工班配置

-- 更新 contractors 表結構
DROP TABLE IF EXISTS contractors;
CREATE TABLE contractors (
    id TEXT PRIMARY KEY,
    crm_opportunity_id TEXT NOT NULL, -- 關聯商機ID
    name TEXT NOT NULL, -- 工班名稱
    type TEXT NOT NULL, -- individual 個人, company 公司
    phone TEXT,
    email TEXT,
    
    -- 負責區域
    buildings JSON NOT NULL, -- ["A棟", "B棟"] 負責的棟別
    floors JSON, -- {"A棟": ["8F", "10F-14F"], "B棟": ["2F", "4F", "12F"]}
    
    -- 權限和角色
    role TEXT DEFAULT 'contractor_leader', -- contractor_leader, contractor_member
    permissions JSON, -- ["view_progress", "edit_own_data", "view_sites"]
    
    -- CRM 同步資料
    crm_record_id TEXT, -- CRM 中的工班記錄ID
    crm_last_sync TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (crm_opportunity_id, name)
);

-- 更新 building_units 表，加入工班資訊
DROP TABLE IF EXISTS building_units;
CREATE TABLE building_units (
    id TEXT PRIMARY KEY,
    crm_opportunity_id TEXT NOT NULL, -- 關聯商機ID
    project_id TEXT NOT NULL,
    
    -- 建築資訊
    building_name TEXT NOT NULL, -- A棟, B棟, C棟
    floor_number INTEGER NOT NULL, -- 2, 4, 8, 10-15
    floor_label TEXT NOT NULL, -- 2F, 4F, 8F, 10F-15F
    unit_codes JSON, -- ["A1", "A2", "A3", "A4", "A5", "A6"] 戶別
    
    -- 工班分配
    contractor_id TEXT, -- 負責工班ID
    contractor_name TEXT, -- 工班名稱 (冗餘，方便查詢)
    
    -- 進度統計
    total_items INTEGER DEFAULT 20, -- 總施工項目數
    completed_items INTEGER DEFAULT 0, -- 已完成項目數
    progress_percentage INTEGER DEFAULT 0, -- 整體進度
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (contractor_id) REFERENCES contractors(id),
    UNIQUE (crm_opportunity_id, building_name, floor_number)
);

-- 先建立興安西專案記錄
INSERT INTO projects (
    id, crm_opportunity_id, name, slug, token, description, building_count, floor_count, status
) VALUES (
    'xinganxi_project', 
    'xinganxi_2024', 
    '勝興-興安西-2024', 
    'xinganxi-2024', 
    'xinganxi2024token',
    '興安西建設案工程進度管理', 
    3, 
    15, 
    'active'
);

-- 插入興安西專案的實際工班資料
INSERT INTO contractors (
    id, crm_opportunity_id, name, type, phone, buildings, floors, role, permissions
) VALUES
-- 王大誠 - B棟個人工班
('contractor_001', 'xinganxi_2024', '王大誠', 'individual', '0912345678', 
 '["B棟"]', 
 '{"B棟": ["2F", "4F", "12F"]}',
 'contractor_leader',
 '["view_progress", "edit_own_data", "view_sites", "view_repair_orders"]'
),

-- 築愛家有限公司 - A棟工班
('contractor_002', 'xinganxi_2024', '築愛家有限公司', 'company', '0221234567',
 '["A棟"]',
 '{"A棟": ["8F", "10F", "11F", "12F", "13F", "14F"]}', 
 'contractor_leader',
 '["view_progress", "edit_own_data", "view_sites", "view_repair_orders"]'
),

-- 塔塔家建材有限公司 - C棟工班
('contractor_003', 'xinganxi_2024', '塔塔家建材有限公司', 'company', '0287654321',
 '["C棟"]',
 '{"C棟": ["3F", "4F", "5F", "6F", "7F", "8F", "9F", "10F", "11F", "12F", "13F", "14F", "15F"]}',
 'contractor_leader', 
 '["view_progress", "edit_own_data", "view_sites", "view_repair_orders"]'
);

-- 插入建築單元資料 - A棟 (築愛家負責)
INSERT INTO building_units (
    id, crm_opportunity_id, project_id, building_name, floor_number, floor_label, 
    unit_codes, contractor_id, contractor_name, progress_percentage
) VALUES
('unit_A_8F', 'xinganxi_2024', 'xinganxi_project', 'A棟', 8, '8F', 
 '["A1", "A2", "A3", "A4", "A5", "A6"]', 'contractor_002', '築愛家有限公司', 65),
('unit_A_10F', 'xinganxi_2024', 'xinganxi_project', 'A棟', 10, '10F',
 '["A1", "A2", "A3", "A4", "A5", "A6"]', 'contractor_002', '築愛家有限公司', 70),
('unit_A_11F', 'xinganxi_2024', 'xinganxi_project', 'A棟', 11, '11F',
 '["A1", "A2", "A3", "A4", "A5", "A6"]', 'contractor_002', '築愛家有限公司', 68),
('unit_A_12F', 'xinganxi_2024', 'xinganxi_project', 'A棟', 12, '12F', 
 '["A1", "A2", "A3", "A4", "A5", "A6"]', 'contractor_002', '築愛家有限公司', 72),
('unit_A_13F', 'xinganxi_2024', 'xinganxi_project', 'A棟', 13, '13F',
 '["A1", "A2", "A3", "A4", "A5", "A6"]', 'contractor_002', '築愛家有限公司', 60),
('unit_A_14F', 'xinganxi_2024', 'xinganxi_project', 'A棟', 14, '14F',
 '["A1", "A2", "A3", "A4", "A5", "A6"]', 'contractor_002', '築愛家有限公司', 58);

-- 插入建築單元資料 - B棟 (王大誠負責)  
INSERT INTO building_units (
    id, crm_opportunity_id, project_id, building_name, floor_number, floor_label,
    unit_codes, contractor_id, contractor_name, progress_percentage
) VALUES
('unit_B_2F', 'xinganxi_2024', 'xinganxi_project', 'B棟', 2, '2F',
 '["B1", "B2", "B3", "B4", "B5", "B6"]', 'contractor_001', '王大誠', 85),
('unit_B_4F', 'xinganxi_2024', 'xinganxi_project', 'B棟', 4, '4F', 
 '["B1", "B2", "B3", "B4", "B5", "B6"]', 'contractor_001', '王大誠', 78),
('unit_B_12F', 'xinganxi_2024', 'xinganxi_project', 'B棟', 12, '12F',
 '["B1", "B2", "B3", "B4", "B5", "B6"]', 'contractor_001', '王大誠', 72);

-- 插入建築單元資料 - C棟 (塔塔家建材負責)
INSERT INTO building_units (
    id, crm_opportunity_id, project_id, building_name, floor_number, floor_label,
    unit_codes, contractor_id, contractor_name, progress_percentage  
) VALUES
('unit_C_3F', 'xinganxi_2024', 'xinganxi_project', 'C棟', 3, '3F',
 '["C1", "C2", "C3", "C4", "C5", "C6", "C7"]', 'contractor_003', '塔塔家建材有限公司', 70),
('unit_C_4F', 'xinganxi_2024', 'xinganxi_project', 'C棟', 4, '4F',
 '["C1", "C2", "C3", "C4", "C5", "C6", "C7"]', 'contractor_003', '塔塔家建材有限公司', 68),
('unit_C_5F', 'xinganxi_2024', 'xinganxi_project', 'C棟', 5, '5F',
 '["C1", "C2", "C3", "C4", "C5", "C6", "C7"]', 'contractor_003', '塔塔家建材有限公司', 65),
('unit_C_6F', 'xinganxi_2024', 'xinganxi_project', 'C棟', 6, '6F',
 '["C1", "C2", "C3", "C4", "C5", "C6", "C7"]', 'contractor_003', '塔塔家建材有限公司', 72),
('unit_C_7F', 'xinganxi_2024', 'xinganxi_project', 'C棟', 7, '7F',
 '["C1", "C2", "C3", "C4", "C5", "C6", "C7"]', 'contractor_003', '塔塔家建材有限公司', 75),
('unit_C_8F', 'xinganxi_2024', 'xinganxi_project', 'C棟', 8, '8F',
 '["C1", "C2", "C3", "C4", "C5", "C6", "C7"]', 'contractor_003', '塔塔家建材有限公司', 68),
('unit_C_9F', 'xinganxi_2024', 'xinganxi_project', 'C棟', 9, '9F',
 '["C1", "C2", "C3", "C4", "C5", "C6", "C7"]', 'contractor_003', '塔塔家建材有限公司', 63),
('unit_C_10F', 'xinganxi_2024', 'xinganxi_project', 'C棟', 10, '10F',
 '["C1", "C2", "C3", "C4", "C5", "C6", "C7"]', 'contractor_003', '塔塔家建材有限公司', 70),
('unit_C_11F', 'xinganxi_2024', 'xinganxi_project', 'C棟', 11, '11F',
 '["C1", "C2", "C3", "C4", "C5", "C6", "C7"]', 'contractor_003', '塔塔家建材有限公司', 67),
('unit_C_12F', 'xinganxi_2024', 'xinganxi_project', 'C棟', 12, '12F',
 '["C1", "C2", "C3", "C4", "C5", "C6", "C7"]', 'contractor_003', '塔塔家建材有限公司', 65),
('unit_C_13F', 'xinganxi_2024', 'xinganxi_project', 'C棟', 13, '13F',
 '["C1", "C2", "C3", "C4", "C5", "C6", "C7"]', 'contractor_003', '塔塔家建材有限公司', 62),
('unit_C_14F', 'xinganxi_2024', 'xinganxi_project', 'C棟', 14, '14F',
 '["C1", "C2", "C3", "C4", "C5", "C6", "C7"]', 'contractor_003', '塔塔家建材有限公司', 58),
('unit_C_15F', 'xinganxi_2024', 'xinganxi_project', 'C棟', 15, '15F',
 '["C1", "C2", "C3", "C4", "C5", "C6", "C7"]', 'contractor_003', '塔塔家建材有限公司', 55);

-- 建立索引
CREATE INDEX idx_contractors_opportunity ON contractors(crm_opportunity_id);
CREATE INDEX idx_contractors_buildings ON contractors(buildings);
CREATE INDEX idx_building_units_opportunity ON building_units(crm_opportunity_id);
CREATE INDEX idx_building_units_building ON building_units(building_name);
CREATE INDEX idx_building_units_contractor ON building_units(contractor_id);