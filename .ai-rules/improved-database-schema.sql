-- 改进的 D1 数据库架构
-- 支持完整的 CRM 字段映射和数据同步

-- 1. 案场基本信息表（改进版）
CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,                    -- CRM _id
    name TEXT NOT NULL,                     -- CRM name (编号)
    opportunity_id TEXT,                    -- CRM field_1P96q__c (关联商机)
    building_type TEXT,                     -- CRM field_WD7k1__c (栋别)
    floor_info INTEGER,                     -- CRM field_Q6Svh__c (楼层)
    room_info TEXT,                         -- CRM field_XuJP2__c (户别)
    status TEXT,                            -- CRM field_z9H6O__c (阶段)
    site_type TEXT,                         -- CRM field_dxr31__c (案场类型)
    
    -- 面积信息
    construction_area REAL,                 -- CRM field_B2gh1__c (铺设坪数)
    site_area REAL,                         -- CRM field_tXAko__c (工地坪数)
    protection_area REAL,                   -- CRM field_27g6n__c (保护板坪数)
    
    -- 日期信息
    construction_date DATE,                 -- CRM field_23pFq__c (施工日期)
    warranty_date DATE,                     -- CRM field_f0mz3__c (保固日期)
    inspection_date1 DATE,                  -- CRM field_xxa7B__c (验屋日期1)
    inspection_date2 DATE,                  -- CRM field_qEaXB__c (验屋日期2)
    
    -- 人员信息
    contractor_name TEXT,                   -- CRM field_u1wpv__c (工班师父)
    owner TEXT,                             -- CRM owner (负责人)
    
    -- 备注信息
    pre_construction_note TEXT,             -- CRM field_sF6fn__c (施工前备注)
    site_note TEXT,                         -- CRM field_g18hX__c (工地备注)
    team_note TEXT,                         -- CRM field_V32Xl__c (工班备注)
    acceptance_note TEXT,                   -- CRM field_n37jC__c (验收备注)
    
    -- 状态标签（JSON格式存储多选）
    tags TEXT,                              -- CRM field_23Z5i__c (标签，JSON数组)
    
    -- 系统字段
    construction_completed BOOLEAN DEFAULT FALSE,  -- CRM construction_completed__c
    create_time INTEGER,                    -- CRM create_time
    update_time INTEGER,                    -- CRM last_modified_time
    synced_at INTEGER,                      -- 同步时间戳
    
    -- 原始数据备份
    raw_data TEXT,                          -- 完整 CRM 原始数据 (JSON)
    
    UNIQUE(id)
);

-- 2. 施工进度详细表（改进版）
CREATE TABLE IF NOT EXISTS site_progress (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,                  -- 关联 sites.id
    crm_record_id TEXT NOT NULL,            -- CRM 记录 ID
    
    -- 项目信息
    project_id TEXT NOT NULL,
    building_name TEXT NOT NULL,
    floor_number INTEGER NOT NULL,
    unit_name TEXT NOT NULL,
    construction_item TEXT NOT NULL,
    
    -- 进度信息
    progress_percentage INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',          -- pending, in_progress, completed, maintenance
    
    -- 人员信息
    contractor_name TEXT,                   -- 承包商/工班师父
    team_id TEXT,                           -- 工班ID
    
    -- 时间信息
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- 面积和费用
    construction_area REAL,                 -- 施工面积
    unit_price REAL,                        -- 单价
    total_amount REAL,                      -- 总金额
    
    -- 备注信息
    notes TEXT,                             -- 施工备注
    pre_construction_issues TEXT,           -- 施工前发现问题
    completion_notes TEXT,                  -- 完工备注
    
    -- 同步信息
    crm_last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- 3. 图片资源表（新增）
CREATE TABLE IF NOT EXISTS site_media (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    media_type TEXT NOT NULL,               -- 'pre_construction', 'completion', 'site_condition', 'floor_plan'
    crm_field_name TEXT,                    -- 对应的CRM字段名
    file_name TEXT,
    file_url TEXT,                          -- Cloudflare Images URL
    file_size INTEGER,
    mime_type TEXT,
    upload_time INTEGER,
    
    FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- 4. 维修记录表（新增）
CREATE TABLE IF NOT EXISTS maintenance_records (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    
    -- 缺失信息
    defect_category1 TEXT,                  -- CRM field_OmPo8__c
    defect_category2 TEXT,                  -- CRM field_32Hxs__c
    defect_note1 TEXT,                      -- CRM field_nht8k__c
    defect_note2 TEXT,                      -- CRM field_dXrfQ__c
    
    -- 维修信息
    maintenance_date1 DATE,                 -- CRM field_r1mp8__c
    maintenance_date2 TEXT,                 -- CRM field_2io60__c
    maintenance_worker1 TEXT,               -- CRM field_xFCKf__c
    maintenance_worker2 TEXT,               -- CRM field_3dhaY__c
    maintenance_note1 TEXT,                 -- CRM field_sijGR__c
    maintenance_note2 TEXT,                 -- CRM field_lZaAp__c
    maintenance_cost1 REAL,                 -- CRM field_7ndUg__c
    maintenance_cost2 REAL,                 -- CRM field_2jM31__c
    
    -- 系统字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- 5. 改进的同步状态表
CREATE TABLE IF NOT EXISTS sync_status (
    sync_type TEXT PRIMARY KEY,
    last_sync_time INTEGER,
    last_sync_count INTEGER,
    total_records INTEGER,                  -- 总记录数
    failed_records INTEGER DEFAULT 0,      -- 失败记录数
    status TEXT,                           -- 'running', 'completed', 'failed'
    message TEXT,
    error_details TEXT,                    -- JSON格式的错误详情
    next_sync_time INTEGER                 -- 下次同步时间
);

-- 6. 字段映射日志表（新增）
CREATE TABLE IF NOT EXISTS field_mapping_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_type TEXT NOT NULL,
    record_id TEXT NOT NULL,
    crm_field TEXT NOT NULL,
    d1_field TEXT NOT NULL,
    original_value TEXT,
    transformed_value TEXT,
    transformation_type TEXT,              -- 'direct', 'converted', 'failed'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_sites_opportunity ON sites(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sites_building_floor ON sites(building_type, floor_info);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);
CREATE INDEX IF NOT EXISTS idx_sites_contractor ON sites(contractor_name);
CREATE INDEX IF NOT EXISTS idx_sites_sync ON sites(synced_at);

CREATE INDEX IF NOT EXISTS idx_progress_site ON site_progress(site_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON site_progress(status);
CREATE INDEX IF NOT EXISTS idx_progress_contractor ON site_progress(contractor_name);
CREATE INDEX IF NOT EXISTS idx_progress_dates ON site_progress(actual_start_date, actual_end_date);

CREATE INDEX IF NOT EXISTS idx_media_site_type ON site_media(site_id, media_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_site ON maintenance_records(site_id);

-- 初始化同步状态
INSERT OR REPLACE INTO sync_status (sync_type, last_sync_time, last_sync_count, total_records, status, message)
VALUES 
  ('opportunities', 0, 0, 0, 'pending', 'Initial setup'),
  ('sites', 0, 0, 0, 'pending', 'Initial setup'),
  ('maintenance_orders', 0, 0, 0, 'pending', 'Initial setup'),
  ('sales_records', 0, 0, 0, 'pending', 'Initial setup');