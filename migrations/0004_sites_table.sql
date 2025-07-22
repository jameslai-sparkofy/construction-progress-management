-- 案場資料表 (Sites Table)
-- 基於 object_8W9cb__c 對象的73個欄位

CREATE TABLE IF NOT EXISTS sites (
    -- 主鍵和基本識別
    _id TEXT PRIMARY KEY,
    name TEXT NOT NULL, -- 編號 (自增編號) - 必填
    tenant_id TEXT NOT NULL, -- 租戶ID - 必填
    object_describe_api_name TEXT NOT NULL, -- 對象API名稱 - 必填
    
    -- 基本資訊欄位
    building TEXT, -- 棟別 (field_WD7k1__c)
    floor INTEGER, -- 樓層 (field_Q6Svh__c)  
    unit TEXT, -- 戶別 (field_XuJP2__c)
    site_type TEXT, -- 案場類型 (field_dxr31__c)
    stage TEXT, -- 階段 (field_z9H6O__c)
    
    -- 工班和人員
    shift_team TEXT, -- 工班 (shift_time__c)
    team_master TEXT, -- 工班師父 (field_u1wpv__c)
    team_notes TEXT, -- 工班備註 (field_V32Xl__c)
    
    -- 施工相關
    construction_date TEXT, -- 施工日期 (field_23pFq__c)
    construction_completed INTEGER DEFAULT 0, -- 施工完成 (construction_completed__c)
    construction_notes_before TEXT, -- 施工前備註 (field_sF6fn__c)
    site_notes TEXT, -- 工地備註 (field_g18hX__c)
    
    -- 面積相關
    site_area REAL, -- 工地坪數 (field_tXAko__c)
    paving_area REAL, -- 舖設坪數 (field_B2gh1__c)
    protection_area REAL, -- 保護板坪數 (field_27g6n__c)
    missing_area REAL, -- 少請坪數 (field_i2Q1g__c) - 計算欄位
    
    -- 驗收相關
    inspection_date1 TEXT, -- 驗屋日期1 (field_xxa7B__c)
    inspection_date2 TEXT, -- 驗屋日期2 (field_qEaXB__c)
    inspection_notes TEXT, -- 驗收備註 (field_n37jC__c)
    warranty_date TEXT, -- 保固日期 (field_f0mz3__c)
    
    -- 維修相關
    repair_date1 TEXT, -- 維修日期1 (field_r1mp8__c)
    repair_date2 TEXT, -- 維修日期2 (field_2io60__c)
    repair_master1 TEXT, -- 維修師父1 (field_xFCKf__c)
    repair_master2 TEXT, -- 維修師父2 (field_3dhaY__c)
    repair_cost1 REAL, -- 維修費用1 (field_7ndUg__c)
    repair_cost2 REAL, -- 維修費用2 (field_2jM31__c)
    repair_notes1 TEXT, -- 維修備註1 (field_sijGR__c)
    repair_notes2 TEXT, -- 維修備註2 (field_lZaAp__c)
    
    -- 缺失相關
    defect_category1 TEXT, -- 缺失分類1 (field_OmPo8__c)
    defect_category2 TEXT, -- 缺失分類2 (field_32Hxs__c)
    defect_notes1 TEXT, -- 缺失備註1 (field_nht8k__c)
    defect_notes2 TEXT, -- 缺失備註2 (field_dXrfQ__c)
    
    -- 關聯對象
    opportunity_id TEXT, -- 商機 (field_1P96q__c) - 查找關聯
    work_order_id TEXT, -- 工單 (field_k7e6q__c)
    maintenance_orders TEXT, -- 維修單 (field_t2GYf__c)
    invoice_id TEXT, -- 請款單 (field_npLvn__c)
    
    -- 標籤和分類
    tags TEXT, -- 標籤 (field_23Z5i__c) - 多選，JSON格式存儲
    
    -- 系統欄位
    create_time INTEGER, -- 創建時間
    last_modified_time INTEGER, -- 最後修改時間
    created_by TEXT, -- 創建人
    last_modified_by TEXT, -- 最後修改人
    owner TEXT, -- 負責人
    out_owner TEXT, -- 外部負責人
    owner_department TEXT, -- 負責人主屬部門
    data_own_department TEXT, -- 歸屬部門
    
    -- 狀態管理
    life_status TEXT, -- 生命狀態
    life_status_before_invalid TEXT, -- 作廢前生命狀態
    lock_status TEXT, -- 鎖定狀態
    lock_user TEXT, -- 加鎖人
    lock_rule TEXT, -- 鎖定規則
    record_type TEXT, -- 業務類型
    origin_source TEXT, -- 數據來源
    
    -- 版本控制
    version INTEGER DEFAULT 1,
    is_deleted INTEGER DEFAULT 0,
    package TEXT,
    order_by INTEGER,
    
    -- 外部系統
    out_tenant_id TEXT, -- 外部企業
    relevant_team TEXT, -- 相關團隊 (JSON格式)
    
    -- 同步相關
    synced_at INTEGER, -- 同步時間
    raw_data TEXT, -- 原始JSON數據
    
    UNIQUE(_id)
);

-- 建立索引提升查詢效能
CREATE INDEX IF NOT EXISTS idx_sites_name ON sites(name);
CREATE INDEX IF NOT EXISTS idx_sites_opportunity_id ON sites(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sites_building_floor_unit ON sites(building, floor, unit);
CREATE INDEX IF NOT EXISTS idx_sites_construction_completed ON sites(construction_completed);
CREATE INDEX IF NOT EXISTS idx_sites_stage ON sites(stage);
CREATE INDEX IF NOT EXISTS idx_sites_synced_at ON sites(synced_at);
CREATE INDEX IF NOT EXISTS idx_sites_create_time ON sites(create_time);
CREATE INDEX IF NOT EXISTS idx_sites_owner ON sites(owner);

-- 更新同步狀態表
INSERT OR REPLACE INTO sync_status (sync_type, last_sync_time, last_sync_count, status, message)
VALUES ('sites', 0, 0, 'pending', 'Sites table created, ready for sync');