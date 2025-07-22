# Fxiaoke CRM 四大對象 API 連接指南
*最後更新：2025-07-22*

## 概述
本文檔記錄興安西工程進度管理系統中四個核心對象的 Fxiaoke CRM API 連接方式，包括 API 端點、參數結構和欄位對應關係。

## 🔑 認證資訊
- **Corp ID**: `FSAID_1320691`
- **Base URL**: `https://open.fxiaoke.com`
- **認證方式**: corpAccessToken + currentOpenUserId

---

## 📋 四大對象總覽

| 對象名稱 | API 類型 | API 端點 | 對象名稱 | 記錄數 | 狀態 |
|---------|---------|----------|----------|--------|------|
| 商機 | 標準 v2 | `/cgi/crm/v2/data/query` | `NewOpportunityObj` | 489 | ✅ |
| 案場 | 自定義 | `/cgi/crm/custom/v2/data/query` | `object_8W9cb__c` | 3,943 | ✅ |
| 維修單 | 自定義 | `/cgi/crm/custom/v2/data/query` | `on_site_signature__c` | 5 | ✅ |
| 銷售記錄 | 標準 v2 | `/cgi/crm/v2/data/query` | `ActiveRecordObj` | 3,600 | ✅ |

---

## 1. 商機 (Opportunities) - 標準 v2 API

### API 連接資訊
```javascript
// API 端點
const endpoint = "https://open.fxiaoke.com/cgi/crm/v2/data/query";

// 請求結構
const requestBody = {
  corpId: corpId,
  corpAccessToken: token,
  currentOpenUserId: userId,
  data: {
    apiName: "NewOpportunityObj",
    search_query_info: {
      limit: 100,
      offset: 0,
      orders: [{ fieldName: "create_time", isAsc: "false" }]
    }
  }
};
```

### 同步 API
```bash
curl -X POST "https://progress.yes-ceramics.com/api/sync/opportunities"
```

### 關鍵欄位對應
- `_id` → `id`
- `name` → `name`
- `customer` → `customer`
- `create_time` → `create_time`
- `last_modified_time` → `update_time`

---

## 2. 案場 (Sites) - 自定義 API

### API 連接資訊
```javascript
// API 端點
const endpoint = "https://open.fxiaoke.com/cgi/crm/custom/v2/data/query";

// 請求結構
const requestBody = {
  corpId: corpId,
  corpAccessToken: token,
  currentOpenUserId: userId,
  data: {
    dataObjectApiName: "object_8W9cb__c",
    search_query_info: {
      limit: 100,
      offset: 0,
      orders: [{ fieldName: "create_time", isAsc: "false" }]
    }
  }
};
```

### 同步 API
```bash
curl -X POST "https://progress.yes-ceramics.com/api/sync/sites"
```

### 關鍵欄位對應
- `_id` → `id`
- `name` → `name`
- `field_1P96q__c` → `opportunity_id` (商機關聯)
- `field_WD7k1__c` → `building_type` (棟別)
- `field_Q6Svh__c` → `floor_info` (樓層)
- `field_XuJP2__c` → `room_info` (房間)
- `create_time` → `create_time`
- `last_modified_time` → `update_time`

### 參考文檔
- **Excel 檔案**: `/案場對象及欄位.xlsx`
- **API 名稱**: `object_8W9cb__c`
- **商機關聯欄位**: `field_1P96q__c`

---

## 3. 維修單 (Maintenance Orders) - 自定義 API

### API 連接資訊
```javascript
// API 端點
const endpoint = "https://open.fxiaoke.com/cgi/crm/custom/v2/data/query";

// 請求結構
const requestBody = {
  corpId: corpId,
  corpAccessToken: token,
  currentOpenUserId: userId,
  data: {
    dataObjectApiName: "on_site_signature__c",
    search_query_info: {
      limit: 100,
      offset: 0,
      orders: [{ fieldName: "create_time", isAsc: "false" }]
    }
  }
};
```

### 同步 API
```bash
curl -X POST "https://progress.yes-ceramics.com/api/sync/maintenance-orders"
```

### 關鍵欄位對應
- `_id` → `id`
- `name` → `name`
- `opportunity_id` → `opportunity_id` (商機關聯)
- `site_id` → `site_id` (案場關聯)
- `status` → `status` (狀態)
- `issue_type` → `issue_type` (問題類型)
- `create_time` → `create_time`
- `last_modified_time` → `update_time`

---

## 4. 銷售記錄 (Sales Records) - 標準 v2 API

### API 連接資訊
```javascript
// API 端點
const endpoint = "https://open.fxiaoke.com/cgi/crm/v2/data/query";

// 請求結構
const requestBody = {
  corpId: corpId,
  corpAccessToken: token,
  currentOpenUserId: userId,
  data: {
    apiName: "ActiveRecordObj",
    search_query_info: {
      limit: 100,
      offset: 0,
      orders: [{ fieldName: "create_time", isAsc: "false" }]
    }
  }
};
```

### 同步 API
```bash
curl -X POST "https://progress.yes-ceramics.com/api/sync/sales-records"
```

### 關鍵欄位對應
- `_id` → `id`
- `name` → `name`
- `active_record_type` → `record_type` (記錄類型)
- `active_record_content` → `content` (記錄內容)
- `interactive_types` → `interactive_type` (互動類型)
- `field_aN2iY__c` → `location` (定位)
- `related_opportunity_id` → `opportunity_id` (商機關聯，可為空)
- `create_time` → `create_time`
- `last_modified_time` → `update_time`

### 參考文檔
- **Excel 檔案**: `/銷售記錄對象及欄位API.xlsx`

---

## 🔄 API 結構差異重點

### 標準 v2 API (商機、銷售記錄)
- **端點**: `/cgi/crm/v2/data/query`
- **對象參數**: `apiName`
- **響應結構**: `result.data.dataList`

### 自定義 API (案場、維修單)
- **端點**: `/cgi/crm/custom/v2/data/query`
- **對象參數**: `dataObjectApiName`
- **響應結構**: `result.dataList`

---

## 📊 定時同步設定

### Cron Trigger 配置
```toml
# wrangler.toml
[triggers]
crons = ["0 * * * *"]  # 每小時執行
```

### 定時任務順序
1. 商機同步 (基礎資料)
2. 案場同步 (關聯商機)
3. 維修單同步 (關聯商機和案場)
4. 銷售記錄同步 (部分關聯商機)

---

## 🛠 故障排除

### 常見問題
1. **searchQueryInfo is empty**: 
   - 確認使用 `search_query_info` 結構
   - 檢查 API 類型 (v2 vs custom)

2. **API 名稱錯誤**:
   - 標準對象用 `apiName`
   - 自定義對象用 `dataObjectApiName`

3. **響應結構不同**:
   - 標準 API: `result.data.dataList`
   - 自定義 API: `result.dataList`

### 測試指令
```bash
# 檢查所有對象數量
npx wrangler d1 execute construction_progress --env production --remote --command "
SELECT 'opportunities' as type, COUNT(*) as total FROM opportunities 
UNION ALL SELECT 'sites' as type, COUNT(*) as total FROM sites 
UNION ALL SELECT 'maintenance_orders' as type, COUNT(*) as total FROM maintenance_orders 
UNION ALL SELECT 'sales_records' as type, COUNT(*) as total FROM sales_records"

# 檢查同步狀態
curl "https://progress.yes-ceramics.com/api/sync/status"

# 手動觸發各類同步
curl -X POST "https://progress.yes-ceramics.com/api/sync/opportunities"
curl -X POST "https://progress.yes-ceramics.com/api/sync/sites"
curl -X POST "https://progress.yes-ceramics.com/api/sync/maintenance-orders"
curl -X POST "https://progress.yes-ceramics.com/api/sync/sales-records"
```

---

## 📚 相關文檔
- `API_USAGE_GUIDE.md` - 完整 API 使用指南
- `database-schema.sql` - 資料庫結構
- `migrations/0005_maintenance_sales_tables.sql` - 維修單和銷售記錄資料表結構