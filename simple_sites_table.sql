-- 簡化的 sites 表
CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    building TEXT,
    floor INTEGER,
    unit TEXT,
    opportunity_id TEXT,
    construction_completed INTEGER DEFAULT 0,
    create_time INTEGER,
    last_modified_time INTEGER,
    synced_at INTEGER,
    raw_data TEXT
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_sites_opportunity_id ON sites(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sites_building_floor_unit ON sites(building, floor, unit);
CREATE INDEX IF NOT EXISTS idx_sites_synced_at ON sites(synced_at);

-- 更新同步狀態表
INSERT OR REPLACE INTO sync_status (sync_type, last_sync_time, last_sync_count, status, message)
VALUES ('sites', 0, 0, 'pending', 'Sites table created, ready for sync');