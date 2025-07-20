# Cloudflare部署架構規劃

## 系統架構概述

基於興安西工程管理系統的需求，設計一個完整的Cloudflare部署架構，支援多租戶系統和路徑式路由。

### 核心架構組件

```
用戶請求 → Cloudflare Workers → KV存儲 → 紛享銷客API → 返回結果
```

## 1. Workers路由架構

### 主要Workers
- **main-router.js** - 主路由器
- **auth-worker.js** - 認證服務
- **api-worker.js** - API代理服務
- **data-sync-worker.js** - 資料同步服務

### 路由配置
```javascript
// wrangler.toml
[[routes]]
pattern = "progress.yourcompany.com/*"
zone_name = "yourcompany.com"
```

### URL路徑結構
```
progress.yourcompany.com/xinganxi-A8B9C/          # 興安西工程入口
progress.yourcompany.com/xinganxi-A8B9C/login     # 登入頁面
progress.yourcompany.com/xinganxi-A8B9C/dashboard # 主控台
progress.yourcompany.com/xinganxi-A8B9C/api/*     # API接口
```

## 2. KV儲存架構

### KV Namespace規劃
- **projects-config** - 項目配置
- **user-sessions** - 用戶會話
- **site-data** - 案場資料快取
- **sms-codes** - 短信驗證碼

### 資料結構設計

#### 項目配置 (projects-config)
```javascript
// Key: xinganxi-A8B9C
{
  "projectId": "xinganxi-A8B9C",
  "name": "勝興-興安西-2024",
  "opportunity": "勝興-興安西-2024",
  "status": "active",
  "createdAt": "2024-07-18T00:00:00Z",
  "buildings": ["B棟", "C棟"],
  "contractors": ["王大誠", "築愛家有限公司", "塔塔家建材有限公司"],
  "apiConfig": {
    "lastSync": "2024-07-18T12:00:00Z",
    "syncInterval": 300000
  }
}
```

#### 用戶會話 (user-sessions)
```javascript
// Key: session-{sessionId}
{
  "userId": "user123",
  "projectId": "xinganxi-A8B9C",
  "role": "contractor",
  "permissions": ["view_progress", "edit_own_data"],
  "contractor": "王大誠",
  "buildings": ["B棟"],
  "expiresAt": "2024-07-18T18:00:00Z"
}
```

#### 案場資料快取 (site-data)
```javascript
// Key: sites-xinganxi-A8B9C
{
  "projectId": "xinganxi-A8B9C",
  "totalSites": 224,
  "lastUpdate": "2024-07-18T12:00:00Z",
  "buildings": {
    "B棟": {
      "floors": [2, 4, 12],
      "units": ["B1", "B5"],
      "contractor": "王大誠",
      "progress": {
        "2F": {"B1": "completed", "B5": "completed"},
        "4F": {"B1": "issue", "B5": "in_progress"},
        "12F": {"B1": "completed", "B5": "completed"}
      }
    }
  }
}
```

## 3. Workers實作範例

### 主路由器 (main-router.js)
```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // 提取項目ID
    const projectId = pathSegments[0];
    const action = pathSegments[1] || 'dashboard';
    
    // 驗證項目存在
    const projectConfig = await env.PROJECTS_CONFIG.get(projectId);
    if (!projectConfig) {
      return new Response('Project not found', { status: 404 });
    }
    
    // 路由分發
    switch (action) {
      case 'login':
        return handleLogin(request, env, projectId);
      case 'api':
        return handleAPI(request, env, projectId);
      case 'dashboard':
      default:
        return handleDashboard(request, env, projectId);
    }
  }
}
```

### API代理服務 (api-worker.js)
```javascript
async function handleFxiaokeAPI(request, env, projectConfig) {
  const { appId, appSecret, permanentCode } = env;
  
  // 獲取Token
  const token = await getFxiaokeToken(appId, appSecret, permanentCode);
  
  // 根據請求類型處理
  const apiPath = new URL(request.url).pathname.split('/').slice(3).join('/');
  
  switch (apiPath) {
    case 'sites':
      return await getSites(token, projectConfig.opportunity);
    case 'repair-orders':
      return await getRepairOrders(token, projectConfig.opportunity);
    case 'progress':
      return await getProgress(token, projectConfig.opportunity);
    default:
      return new Response('API endpoint not found', { status: 404 });
  }
}
```

### 資料同步服務 (data-sync-worker.js)
```javascript
export default {
  async scheduled(event, env, ctx) {
    // 定期同步所有項目資料
    const projects = await env.PROJECTS_CONFIG.list();
    
    for (const project of projects.keys) {
      const projectConfig = await env.PROJECTS_CONFIG.get(project.name);
      
      // 同步案場資料
      await syncSiteData(env, projectConfig);
      
      // 同步維修單
      await syncRepairOrders(env, projectConfig);
      
      // 更新同步時間
      projectConfig.apiConfig.lastSync = new Date().toISOString();
      await env.PROJECTS_CONFIG.put(project.name, JSON.stringify(projectConfig));
    }
  }
}
```

## 4. 認證系統

### SMS驗證流程
```javascript
// 1. 發送驗證碼
async function sendSMSCode(phone, projectId, env) {
  const code = generateSMSCode();
  const key = `sms-${projectId}-${phone}`;
  
  // 存儲驗證碼（5分鐘有效）
  await env.SMS_CODES.put(key, JSON.stringify({
    code,
    expiresAt: Date.now() + 300000
  }), { expirationTtl: 300 });
  
  // 發送短信（整合Twilio或三竹）
  await sendSMS(phone, `您的驗證碼是：${code}`);
}

// 2. 驗證碼確認
async function verifySMSCode(phone, code, projectId, env) {
  const key = `sms-${projectId}-${phone}`;
  const storedData = await env.SMS_CODES.get(key);
  
  if (!storedData) return false;
  
  const { code: storedCode, expiresAt } = JSON.parse(storedData);
  
  if (Date.now() > expiresAt || code !== storedCode) {
    return false;
  }
  
  // 驗證成功，刪除驗證碼
  await env.SMS_CODES.delete(key);
  return true;
}
```

## 5. 部署配置

### wrangler.toml
```toml
name = "construction-progress-main"
main = "src/main-router.js"
compatibility_date = "2024-07-18"

[env.production]
name = "construction-progress-prod"
routes = [
  { pattern = "progress.yourcompany.com/*", zone_name = "yourcompany.com" }
]

[[kv_namespaces]]
binding = "PROJECTS_CONFIG"
id = "your-projects-config-id"
preview_id = "your-projects-config-preview-id"

[[kv_namespaces]]
binding = "USER_SESSIONS"
id = "your-user-sessions-id"
preview_id = "your-user-sessions-preview-id"

[[kv_namespaces]]
binding = "SITE_DATA"
id = "your-site-data-id"
preview_id = "your-site-data-preview-id"

[[kv_namespaces]]
binding = "SMS_CODES"
id = "your-sms-codes-id"
preview_id = "your-sms-codes-preview-id"

[vars]
FXIAOKE_APP_ID = "FSAID_1320691"
FXIAOKE_BASE_URL = "https://open.fxiaoke.com"

[env.production.vars]
FXIAOKE_APP_SECRET = "your-app-secret"
FXIAOKE_PERMANENT_CODE = "your-permanent-code"
TWILIO_ACCOUNT_SID = "your-twilio-sid"
TWILIO_AUTH_TOKEN = "your-twilio-token"
```

### 部署腳本
```bash
#!/bin/bash
# deploy.sh

echo "部署Cloudflare Workers..."

# 部署主路由器
wrangler deploy --name construction-progress-main

# 部署API服務
wrangler deploy --name construction-progress-api

# 部署資料同步服務
wrangler deploy --name construction-progress-sync

# 設定定時任務
wrangler cron trigger --name construction-progress-sync

echo "部署完成！"
```

## 6. 安全性考量

### API金鑰保護
- 使用Cloudflare Workers環境變數存儲敏感資訊
- 實施IP白名單機制
- 定期輪換API金鑰

### 用戶認證
- 實施JWT會話管理
- 短信驗證碼限制頻率
- 會話自動過期機制

### 資料保護
- 敏感資料加密存儲
- 實施CORS政策
- 定期備份KV資料

## 7. 監控與日誌

### 日誌記錄
```javascript
// 結構化日誌
function log(level, message, data = {}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    projectId: data.projectId,
    userId: data.userId,
    ...data
  }));
}
```

### 效能監控
- 使用Cloudflare Analytics
- 設定告警機制
- 監控API回應時間

## 8. 開發與測試流程

### 本地開發
```bash
# 啟動本地開發環境
wrangler dev --local

# 測試API端點
curl http://localhost:8787/xinganxi-A8B9C/api/sites
```

### 測試環境部署
```bash
# 部署到測試環境
wrangler deploy --env staging

# 運行測試
npm run test
```

這個架構設計支援多租戶系統，可以輕鬆為每個工程項目創建獨立的管理網站，同時確保資料隔離和安全性。