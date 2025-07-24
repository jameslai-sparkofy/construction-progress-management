-- 案場資料表 - 簡化版本
CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    building TEXT,
    floor INTEGER,
    unit TEXT,
    site_type TEXT,
    stage TEXT,
    shift_team TEXT,
    team_master TEXT,
    construction_date TEXT,
    construction_completed INTEGER DEFAULT 0,
    site_area REAL,
    paving_area REAL,
    opportunity_id TEXT,
    owner TEXT,
    create_time INTEGER,
    last_modified_time INTEGER,
    life_status TEXT,
    synced_at INTEGER,
    raw_data TEXT,
    UNIQUE(id)
);

CREATE INDEX IF NOT EXISTS idx_sites_name ON sites(name);
CREATE INDEX IF NOT EXISTS idx_sites_opportunity_id ON sites(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sites_building ON sites(building);
CREATE INDEX IF NOT EXISTS idx_sites_construction_completed ON sites(construction_completed);