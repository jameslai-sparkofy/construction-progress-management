-- 興安西工程進度管理系統 D1 資料庫結構
-- 多租戶建築工程管理平台

-- 專案表 (從 CRM 同步)
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    crm_opportunity_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    token TEXT NOT NULL,
    description TEXT,
    building_count INTEGER DEFAULT 1,
    floor_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active', -- active, maintenance, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 使用者表 (從 CRM 同步)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    crm_user_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL, -- admin, owner, contractor_leader, member
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 專案使用者關聯表
CREATE TABLE IF NOT EXISTS project_users (
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL, -- admin, owner, contractor_leader, member
    permissions TEXT, -- JSON 權限設定
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 工班表
CREATE TABLE IF NOT EXISTS contractors (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 泥作, 水電, 鋼筋, 模板, etc.
    leader_user_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (leader_user_id) REFERENCES users(id)
);

-- 建築單元表 (棟/樓層)
CREATE TABLE IF NOT EXISTS building_units (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    building_name TEXT NOT NULL, -- A棟, B棟, C棟
    floor_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    UNIQUE (project_id, building_name, floor_number)
);

-- 施工項目表
CREATE TABLE IF NOT EXISTS construction_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 結構, 裝修, 機電, etc.
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 進度記錄表
CREATE TABLE IF NOT EXISTS progress_records (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    building_unit_id TEXT NOT NULL,
    construction_item_id TEXT NOT NULL,
    contractor_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    progress_percentage INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, verified
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (building_unit_id) REFERENCES building_units(id),
    FOREIGN KEY (construction_item_id) REFERENCES construction_items(id),
    FOREIGN KEY (contractor_id) REFERENCES contractors(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 施工照片表
CREATE TABLE IF NOT EXISTS construction_photos (
    id TEXT PRIMARY KEY,
    progress_record_id TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    uploaded_by TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (progress_record_id) REFERENCES progress_records(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 稽核日誌表
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 索引
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_progress_records_project ON progress_records(project_id);
CREATE INDEX idx_progress_records_building ON progress_records(building_unit_id);
CREATE INDEX idx_audit_logs_project ON audit_logs(project_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- 初始資料：施工項目
INSERT INTO construction_items (id, name, category, display_order) VALUES
('item_001', '基礎開挖', '基礎工程', 1),
('item_002', '基礎鋼筋', '基礎工程', 2),
('item_003', '基礎混凝土', '基礎工程', 3),
('item_004', '柱鋼筋', '結構工程', 4),
('item_005', '柱模板', '結構工程', 5),
('item_006', '柱混凝土', '結構工程', 6),
('item_007', '梁鋼筋', '結構工程', 7),
('item_008', '梁模板', '結構工程', 8),
('item_009', '梁混凝土', '結構工程', 9),
('item_010', '樓板鋼筋', '結構工程', 10),
('item_011', '樓板模板', '結構工程', 11),
('item_012', '樓板混凝土', '結構工程', 12),
('item_013', '外牆砌築', '外牆工程', 13),
('item_014', '內牆砌築', '內牆工程', 14),
('item_015', '水電配管', '機電工程', 15),
('item_016', '消防配管', '機電工程', 16),
('item_017', '外牆粉刷', '裝修工程', 17),
('item_018', '內牆粉刷', '裝修工程', 18),
('item_019', '地坪工程', '裝修工程', 19),
('item_020', '防水工程', '防水工程', 20);