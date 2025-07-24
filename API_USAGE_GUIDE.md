# API 使用指南和憑證記錄

## Cloudflare Workers 部署

### 1. OAuth 登入方式
```bash
# 使用 OAuth 登入 Cloudflare (推薦方式)
npx wrangler login

# 檢查登入狀態
npx wrangler whoami

# 部署到生產環境
npx wrangler deploy --env production
```

### 2. API Token 方式 (備用)
```bash
# 設定 API Token 環境變數
export CLOUDFLARE_API_TOKEN="TFIO-JBbCjkDVHcqGlxSNEvRvFAQiC9Y1XG9UmyKRcJz"

# 部署
npx wrangler deploy --env production
```

## 紛享銷客 CRM API 使用方法

### 完整的 API 調用流程

#### 1. 獲取企業訪問令牌
```javascript
const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4", 
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

const tokenResponse = await fetch(`${CONFIG.baseUrl}/cgi/corpAccessToken/get/V2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        appId: CONFIG.appId,
        appSecret: CONFIG.appSecret,
        permanentCode: CONFIG.permanentCode
    })
});

const tokenResult = await tokenResponse.json();
const { corpAccessToken: token, corpId } = tokenResult;
```

#### 2. 獲取用戶信息 
```javascript
const userResponse = await fetch(`${CONFIG.baseUrl}/cgi/user/getByMobile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        corpId: corpId,
        corpAccessToken: token,
        mobile: "17675662629"  // 測試手機號
    })
});

const userResult = await userResponse.json();
const userId = userResult.empList[0].openUserId;
```

#### 3. 查詢商機對象 (NewOpportunityObj)
```javascript
const opportunityResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        corpId: corpId,
        corpAccessToken: token,
        currentOpenUserId: userId,
        data: {
            apiName: "NewOpportunityObj",  // 商機對象
            search_query_info: {
                limit: 100,        // 每次查詢數量
                offset: 0,         // 偏移量
                orders: [{fieldName: "create_time", isAsc: "false"}]
            }
        }
    })
});
```

#### 4. 分頁查詢所有商機 (480個)
```javascript
async function queryAllOpportunities(token, corpId, userId) {
    const allOpportunities = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    
    while (hasMore) {
        const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    apiName: "NewOpportunityObj",
                    search_query_info: {
                        limit: limit,
                        offset: offset,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const result = await response.json();
        
        if (result.errorCode === 0 && result.dataList) {
            allOpportunities.push(...result.dataList);
            
            if (result.dataList.length < limit) {
                hasMore = false; // 最後一批
            } else {
                offset += limit;
            }
        } else {
            hasMore = false;
        }
    }
    
    return allOpportunities;
}
```

## Cloudflare Workers 配置

### 環境變數設定
```bash
# 設定機密變數
wrangler secret put FXIAOKE_APP_SECRET --env production
# 值: ec63ff237c5c4a759be36d3a8fb7a3b4

wrangler secret put FXIAOKE_PERMANENT_CODE --env production  
# 值: 899433A4A04A3B8CB1CC2183DA4B5B48

wrangler secret put MOBILE --env production
# 值: 17675662629
```

### D1 資料庫操作
```sql
-- 創建商機表
CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    customer TEXT,
    amount INTEGER DEFAULT 0,
    stage TEXT,
    create_time INTEGER,
    update_time INTEGER,
    synced_at INTEGER,
    raw_data TEXT
);

-- 搜尋商機
SELECT id, name, customer, amount, stage 
FROM opportunities 
WHERE LOWER(name) LIKE '%關鍵字%' OR LOWER(customer) LIKE '%關鍵字%'
ORDER BY update_time DESC
LIMIT 100;
```

## 混合搜尋架構

### API 端點
- `/api/crm/opportunities` - 獲取商機列表 (支援分頁)
- `/api/crm/opportunities/search?q=關鍵字` - 搜尋商機
- `/api/sync/opportunities` - 手動同步商機到 D1
- `/api/sync/status` - 查看同步狀態

### 搜尋邏輯
1. 優先搜尋本地 D1 資料庫
2. 如果本地無結果，回退到 CRM API 搜尋
3. 支援強制 API 搜尋: `?force_api=true`

## CRM 數據寫入功能

### 案場對象更新 (自定義對象)
案場對象 API Name: `object_8W9cb__c`

#### 完整更新流程
```javascript
// 1. 獲取企業訪問令牌
const tokenResponse = await fetch(`${CONFIG.baseUrl}/cgi/corpAccessToken/get/V2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        appId: CONFIG.appId,
        appSecret: CONFIG.appSecret,
        permanentCode: CONFIG.permanentCode
    })
});

// 2. 獲取用戶信息
const userResponse = await fetch(`${CONFIG.baseUrl}/cgi/user/getByMobile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        corpId: corpId,
        corpAccessToken: token,
        mobile: "17675662629"
    })
});

// 3. 更新案場自定義欄位
const updateResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        corpAccessToken: token,
        corpId: corpId,
        currentOpenUserId: userId,
        data: {
            object_data: {
                dataObjectApiName: "object_8W9cb__c",  // 案場對象
                _id: "案場ID",
                field_u1wpv__c: "更新的值"  // 自定義欄位
            }
        },
        triggerWorkFlow: false  // 不觸發工作流
    })
});
```

#### 測試記錄 (2025-07-24)
- **測試案場ID**: `6621c7a2eb4c7f0001817f67`
- **更新欄位**: `field_u1wpv__c`
- **更新值**: `TEST`
- **結果**: ✅ 成功 (`errorCode: 0, errorMessage: "OK"`)

#### 測試腳本
完整測試腳本已保存為 `test_crm_update.js`，包含：
- Token 獲取
- 用戶驗證
- 案場欄位更新
- 錯誤處理

### API 端點說明
- **自定義對象更新**: `POST /cgi/crm/custom/v2/data/update`
- **標準對象更新**: `POST /cgi/crm/v2/data/update`
- **頻次限制**: 100次/20秒

## 常用指令記錄

```bash
# Cloudflare 登入
npx wrangler login

# 部署
npx wrangler deploy --env production

# 查看日誌
npx wrangler tail --env production

# D1 資料庫操作
npx wrangler d1 execute construction_progress --env production --command "SELECT COUNT(*) FROM opportunities"

# 觸發定時同步 (測試用)
curl -X POST "https://progress.yes-ceramics.com/api/sync/opportunities"

# 測試 CRM 寫入功能
node test_crm_update.js
```

## 注意事項

1. **紛享銷客 API**
   - 需要先獲取 corpAccessToken
   - 需要通過手機號獲取 currentOpenUserId
   - 商機對象名稱是 "NewOpportunityObj"
   - 支援分頁查詢，預期總數約480個商機

2. **Cloudflare Workers**
   - 使用 OAuth 登入比 API Token 更穩定
   - D1 資料庫需要綁定到環境
   - 定時任務使用 Cron Triggers
   - Workers 有執行時間限制

3. **混合搜尋**
   - 本地搜尋更快但需要定期同步
   - API 搜尋較慢但數據最新
   - 建議每小時自動同步一次