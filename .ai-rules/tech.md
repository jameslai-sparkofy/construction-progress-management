---
title: Technical Architecture
description: "定義項目的技術棧、架構設計和開發規範"
inclusion: always
---

# 技術架構規範

## 技術棧概覽

### 核心技術棧
- **前端**: HTML5 + Vanilla JavaScript + CSS3
- **後端**: Cloudflare Workers (Edge Computing)
- **資料庫**: Cloudflare D1 (SQLite-based)
- **CRM整合**: 紛享銷客(Fxiaoke) REST API
- **部署**: Cloudflare 全球網路
- **版本控制**: Git + GitHub

### 開發工具鏈
- **部署工具**: Wrangler CLI (`npx wrangler`)
- **資料庫管理**: D1 CLI operations
- **API測試**: curl + 自定義測試腳本
- **代碼編輯**: 支援ES2022+ JavaScript

## 架構設計原則

### 1. 無服務器優先 (Serverless-First)
- 利用Cloudflare Workers實現邊緣計算
- 自動擴展，按需付費
- 全球低延遲訪問

### 2. 混合搜尋架構
```
前端搜尋請求
    ↓
Cloudflare Workers API
    ↓
本地D1資料庫 (優先，<50ms)
    ↓ (如果無結果)
Fxiaoke CRM API (回退，<5s)
```

### 3. 多租戶架構
- URL路由: `/{projectSlug}/...`
- 資料隔離: tenant_id欄位
- 權限管理: 角色基礎存取控制

### 4. 數據一致性保證
- **定時同步**: Cron Trigger每小時執行
- **即時同步**: 表單提交時觸發
- **衝突解決**: 最後更新時間優先

## CRM API整合規範

### API端點分類

#### 標準v2 API (商機、銷售記錄)
```javascript
const endpoint = "https://open.fxiaoke.com/cgi/crm/v2/data/query";
const requestBody = {
  corpId: corpId,
  corpAccessToken: token,
  currentOpenUserId: userId,
  data: {
    apiName: "NewOpportunityObj" | "ActiveRecordObj",
    search_query_info: {
      limit: 100,
      offset: 0,
      orders: [{ fieldName: "create_time", isAsc: "false" }]
    }
  }
};
// 響應結構: result.data.dataList
```

#### 自定義API (案場、維修單)
```javascript
const endpoint = "https://open.fxiaoke.com/cgi/crm/custom/v2/data/query";
const requestBody = {
  corpId: corpId,
  corpAccessToken: token,
  currentOpenUserId: userId,
  data: {
    dataObjectApiName: "object_8W9cb__c" | "on_site_signature__c",
    search_query_info: {
      limit: 100,
      offset: 0,
      orders: [{ fieldName: "create_time", isAsc: "false" }]
    }
  }
};
// 響應結構: result.dataList
```

### 認證配置
```javascript
const AUTH_CONFIG = {
  corpId: "FSAID_1320691",
  baseURL: "https://open.fxiaoke.com",
  tokenEndpoint: "/cgi/token/get",
  refreshInterval: 7200000 // 2小時
};
```

## 資料庫架構設計

### 核心表結構

#### 1. 商機表 (opportunities)
```sql
CREATE TABLE opportunities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    customer TEXT,
    amount INTEGER DEFAULT 0,
    stage TEXT,
    create_time INTEGER,
    update_time INTEGER,
    synced_at INTEGER,
    raw_data TEXT,
    UNIQUE(id)
);
```

#### 2. 案場表 (sites)
```sql
CREATE TABLE sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    opportunity_id TEXT,
    building_type TEXT,
    floor_info INTEGER,
    room_info TEXT,
    construction_status TEXT,
    create_time INTEGER,
    update_time INTEGER,
    synced_at INTEGER,
    raw_data TEXT,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)
);
```

#### 3. 維修單表 (maintenance_orders)
```sql
CREATE TABLE maintenance_orders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    opportunity_id TEXT,
    site_id TEXT,
    status TEXT,
    issue_type TEXT,
    create_time INTEGER,
    update_time INTEGER,
    synced_at INTEGER,
    raw_data TEXT,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id),
    FOREIGN KEY (site_id) REFERENCES sites(id)
);
```

#### 4. 銷售記錄表 (sales_records)
```sql
CREATE TABLE sales_records (
    id TEXT PRIMARY KEY,
    name TEXT,
    opportunity_id TEXT, -- 可為空
    record_type TEXT,
    content TEXT,
    interactive_type TEXT,
    create_time INTEGER,
    update_time INTEGER,
    synced_at INTEGER,
    raw_data TEXT,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)
);
```

### 索引策略
```sql
-- 搜尋效能索引
CREATE INDEX idx_opportunities_name ON opportunities(name);
CREATE INDEX idx_opportunities_customer ON opportunities(customer);
CREATE INDEX idx_sites_opportunity_id ON sites(opportunity_id);
CREATE INDEX idx_maintenance_orders_site_id ON maintenance_orders(site_id);

-- 同步效能索引
CREATE INDEX idx_opportunities_synced_at ON opportunities(synced_at);
CREATE INDEX idx_sites_synced_at ON sites(synced_at);
```

## API設計規範

### RESTful API結構
```
/api/
  ├── crm/
  │   ├── opportunities/
  │   │   ├── GET /search?q={query}
  │   │   └── GET /?offset={n}&limit={m}
  │   ├── sites/
  │   ├── maintenance-orders/
  │   └── sales-records/
  ├── sync/
  │   ├── POST /opportunities
  │   ├── POST /sites
  │   ├── POST /maintenance-orders
  │   ├── POST /sales-records
  │   └── GET /status
  └── progress/
      ├── POST /save
      ├── GET /load/{projectId}/{building}/{floor}/{unit}
      └── POST /sync-to-crm
```

### 錯誤處理規範
```javascript
// 統一錯誤響應格式
{
  "success": false,
  "error": "error_code",
  "message": "人類可讀的錯誤訊息",
  "details": {
    "field": "specific_error_info"
  },
  "timestamp": "2025-07-26T10:00:00Z"
}
```

## 部署和維運規範

### 部署指令
```bash
# 正確的生產環境部署
npx wrangler deploy --env production

# ❌ 錯誤：會導致自訂域名失效
npx wrangler deploy
```

### 環境配置
```toml
# wrangler.toml
[env.production]
name = "construction-progress"
route = "progress.yes-ceramics.com/*"

[[env.production.d1_databases]]
binding = "DB"
database_name = "construction_progress"
database_id = "your-d1-database-id"

[triggers]
crons = ["0 * * * *"]  # 每小時執行同步
```

### 監控和日志
```javascript
// 同步狀態監控
GET /api/sync/status

// 系統健康檢查
GET /api/health

// 性能指標
- 響應時間 < 3秒
- API成功率 > 99%
- 數據同步準確率 > 99.9%
```

## 開發規範

### 代碼風格
- 使用ES2022+語法
- 優先使用async/await
- 錯誤處理使用try-catch
- 變數命名使用駝峰式

### 測試策略
```bash
# API功能測試
curl -X POST "https://progress.yes-ceramics.com/api/sync/opportunities"

# 搜尋功能測試
curl "https://progress.yes-ceramics.com/api/crm/opportunities/search?q=樂田"

# 資料庫查詢測試
npx wrangler d1 execute construction_progress --env production --remote
```

### 性能最佳化
1. **快取策略**: 本地D1優先，API回退
2. **索引優化**: 搜尋欄位建立複合索引
3. **批量處理**: 同步時使用分批處理
4. **壓縮傳輸**: 啟用gzip壓縮

## 安全規範

### 資料保護
- CRM API Token安全存儲
- CORS設定限制來源
- 輸入資料驗證和清理
- SQL注入防護

### 存取控制
- 基於角色的權限管理
- Session管理和逾時
- API請求頻率限制
- 審計日誌記錄