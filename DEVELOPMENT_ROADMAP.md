# 開發路線圖 - 工程進度管理系統

## 總體開發階段

### 第一階段：前端原型開發 ✅ (已完成)
- 基礎 HTML/CSS/JS 架構
- 用戶權限系統
- 施工進度網格
- 工班管理功能

### 第二階段：Cloudflare Workers 後端 (進行中)
- API 路由設計
- 數據庫架構
- 用戶認證系統

### 第三階段：Fxiaoke CRM 整合
- API 連接和測試
- 數據同步機制
- 錯誤處理

### 第四階段：部署和優化
- 多租戶部署
- 性能優化
- 安全加固

---

## 詳細技術節點規劃

## 🎯 第二階段：Cloudflare Workers 後端實現

### 節點 2.1：項目初始化和基礎架構
**預計時間**：1-2 天  
**負責人**：開發團隊

#### 任務清單
- [ ] 初始化 Cloudflare Workers 項目
- [ ] 配置 `wrangler.toml`
- [ ] 設置 KV 命名空間
- [ ] 建立基礎路由結構
- [ ] 配置環境變數

#### 技術要點
```javascript
// wrangler.toml 配置
name = "construction-progress"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "USERS_KV"
id = "user-data-namespace"

[[kv_namespaces]]  
binding = "CONSTRUCTION_KV"
id = "construction-data-namespace"

[[kv_namespaces]]
binding = "SESSIONS_KV" 
id = "session-data-namespace"
```

#### 測試項目
- [ ] Workers 腳本成功部署
- [ ] KV 存儲讀寫正常
- [ ] 路由解析正確
- [ ] 環境變數可正常訪問

#### 完成標準
- Workers 可以正常響應 HTTP 請求
- KV 數據庫連接成功
- 基礎路由 `/api/health` 返回狀態

---

### 節點 2.2：多租戶路由系統
**預計時間**：2-3 天  
**負責人**：後端開發

#### 任務清單
- [ ] 實現 URL 路徑解析 `/project-token/`
- [ ] 建立專案隔離機制
- [ ] 實現專案配置管理
- [ ] 錯誤處理和 404 頁面

#### 技術要點
```javascript
// 路由解析邏輯
async function handleRequest(request) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  
  if (pathSegments.length === 0) {
    return new Response('Project list', { status: 200 });
  }
  
  const projectToken = pathSegments[0];
  const projectConfig = await getProjectConfig(projectToken);
  
  if (!projectConfig) {
    return new Response('Project not found', { status: 404 });
  }
  
  // 處理專案特定請求
  return handleProjectRequest(request, projectConfig);
}
```

#### 測試項目
- [ ] `/xinganxi-2024-abc123/` 正確路由到興安西專案
- [ ] 無效專案代碼返回 404
- [ ] 專案數據隔離有效
- [ ] 跨專案訪問被阻止

#### 完成標準
- 多個專案可以同時運行
- 專案間數據完全隔離
- URL 路由解析正確

---

### 節點 2.3：用戶認證和會話管理
**預計時間**：3-4 天  
**負責人**：後端開發

#### 任務清單
- [ ] 實現登入 API (`POST /api/auth/login`)
- [ ] 實現登出 API (`POST /api/auth/logout`)
- [ ] JWT Token 生成和驗證
- [ ] 會話存儲和過期管理
- [ ] 密碼驗證邏輯

#### 技術要點
```javascript
// 登入 API
async function handleLogin(request, projectId) {
  const { phone, password } = await request.json();
  
  // 從 KV 獲取用戶資料
  const userKey = `users:${projectId}:${phone}`;
  const userData = await USERS_KV.get(userKey, { type: 'json' });
  
  if (!userData || userData.password !== password) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 生成會話
  const sessionId = generateSessionId();
  const sessionData = {
    phone,
    projectId,
    role: userData.role,
    expiry: Date.now() + (24 * 60 * 60 * 1000) // 24小時
  };
  
  await SESSIONS_KV.put(`session:${sessionId}`, JSON.stringify(sessionData), {
    expirationTtl: 24 * 60 * 60 // 24小時
  });
  
  return new Response(JSON.stringify({ 
    success: true, 
    sessionId,
    user: userData 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

#### 測試項目
- [ ] 正確憑證登入成功
- [ ] 錯誤憑證登入失敗
- [ ] 會話 Token 有效性驗證
- [ ] 會話過期自動清理
- [ ] 多設備登入支持

#### 完成標準
- 用戶可以成功登入和登出
- 會話管理穩定可靠
- 安全性驗證通過

---

### 節點 2.4：權限中間件系統
**預計時間**：2-3 天  
**負責人**：後端開發

#### 任務清單
- [ ] 實現權限驗證中間件
- [ ] 角色權限檢查邏輯
- [ ] API 端點權限配置
- [ ] 建築權限驗證

#### 技術要點
```javascript
// 權限中間件
async function requireAuth(request, requiredRole = null, requiredBuilding = null) {
  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const sessionData = await SESSIONS_KV.get(`session:${sessionId}`, { type: 'json' });
  if (!sessionData || sessionData.expiry < Date.now()) {
    return new Response('Session expired', { status: 401 });
  }
  
  // 角色權限檢查
  if (requiredRole && !hasRole(sessionData.role, requiredRole)) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // 建築權限檢查
  if (requiredBuilding && !hasBuildinAccess(sessionData, requiredBuilding)) {
    return new Response('Forbidden', { status: 403 });
  }
  
  return sessionData;
}

// 權限等級定義
const ROLE_HIERARCHY = {
  'admin': 4,
  'owner': 3, 
  'contractor_leader': 2,
  'member': 1
};
```

#### 測試項目
- [ ] 未登入用戶被正確阻止
- [ ] 不同角色權限驗證正確
- [ ] 建築權限檢查有效
- [ ] 權限不足返回 403

#### 完成標準
- 所有 API 端點都有適當的權限保護
- 權限檢查邏輯正確無誤
- 安全性測試通過

---

### 節點 2.5：用戶管理 API
**預計時間**：3-4 天  
**負責人**：後端開發

#### 任務清單
- [ ] 用戶資料 CRUD API
- [ ] 工班管理 API  
- [ ] 成員管理 API
- [ ] 用戶資料驗證

#### API 端點設計
```javascript
// 用戶管理 API
GET    /api/users           // 獲取用戶列表 (admin)
POST   /api/users           // 新增用戶 (admin/contractor_leader)
PUT    /api/users/:phone    // 更新用戶 (admin/self)
DELETE /api/users/:phone    // 刪除用戶 (admin)

// 工班管理 API  
GET    /api/contractors     // 獲取工班列表
POST   /api/contractors     // 新增工班 (admin)
PUT    /api/contractors/:id // 更新工班 (admin)
DELETE /api/contractors/:id // 刪除工班 (admin)

// 成員管理 API
POST   /api/contractors/:id/members      // 新增成員
PUT    /api/contractors/:id/members/:mid // 更新成員  
DELETE /api/contractors/:id/members/:mid // 刪除成員
```

#### 測試項目
- [ ] 所有 CRUD 操作正常
- [ ] 權限檢查正確
- [ ] 數據驗證有效
- [ ] 錯誤處理完善

#### 完成標準
- API 響應格式一致
- 數據完整性保證
- 性能符合要求

---

### 節點 2.6：施工記錄 API
**預計時間**：4-5 天  
**負責人**：後端開發

#### 任務清單
- [ ] 施工記錄 CRUD API
- [ ] 進度狀態管理
- [ ] 權限過濾邏輯
- [ ] 數據聚合和統計

#### API 端點設計
```javascript
// 施工記錄 API
GET    /api/construction              // 獲取施工記錄 (支持篩選)
POST   /api/construction              // 新增施工記錄
PUT    /api/construction/:id          // 更新施工記錄
DELETE /api/construction/:id          // 刪除施工記錄

// 進度查詢 API
GET    /api/progress/:building        // 獲取建築進度
GET    /api/progress/stats            // 獲取統計數據
```

#### 數據結構
```javascript
// 施工記錄
{
  id: "B_4F_B1_20250719",
  building: "B",
  floor: "4F", 
  unit: "B1",
  area: 22.1,
  date: "2025-07-19",
  contractor: "王大誠",
  contractorShortName: "誠",
  note: "客廳臥一、臥二更換",
  status: "completed",
  createdAt: "2025-07-19T10:30:00Z",
  updatedAt: "2025-07-19T10:30:00Z"
}
```

#### 測試項目
- [ ] 施工記錄新增/更新/刪除
- [ ] 進度計算正確
- [ ] 權限篩選有效
- [ ] 統計數據準確

#### 完成標準
- 施工數據完整可靠
- 進度計算邏輯正確
- API 性能滿足需求

---

## 🎯 第三階段：Fxiaoke CRM 整合

### 節點 3.1：Fxiaoke API 連接
**預計時間**：3-4 天  
**負責人**：後端開發

#### 任務清單
- [ ] Fxiaoke API 認證實現
- [ ] API 請求封裝
- [ ] 錯誤處理和重試邏輯
- [ ] API 限流處理

#### 技術要點
```javascript
class FxiaokeAPI {
  constructor(appId, appSecret) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.baseURL = 'https://open.fxiaoke.com';
  }
  
  async authenticate() {
    // 實現認證邏輯
  }
  
  async queryRepairOrders(opportunity) {
    // 查詢維修單
  }
  
  async queryFollowupRecords(opportunity) {
    // 查詢跟進記錄
  }
  
  async createConstructionRecord(data) {
    // 創建施工記錄
  }
}
```

#### 測試項目
- [ ] API 認證成功
- [ ] 數據查詢正常
- [ ] 錯誤處理正確
- [ ] 限流機制有效

#### 完成標準
- 穩定連接 Fxiaoke API
- 數據同步可靠
- 錯誤恢復機制完善

---

### 節點 3.2：數據同步機制
**預計時間**：4-5 天  
**負責人**：後端開發

#### 任務清單
- [ ] 增量數據同步
- [ ] 衝突解決策略
- [ ] 同步狀態管理
- [ ] 定時同步任務

#### 同步策略
```javascript
// 數據同步邏輯
async function syncProjectData(projectId) {
  const lastSync = await getLastSyncTime(projectId);
  
  // 同步維修單
  const repairOrders = await fxiaokeAPI.queryRepairOrders({
    opportunity: projectConfig.opportunity,
    modifiedAfter: lastSync
  });
  
  // 同步跟進記錄
  const followupRecords = await fxiaokeAPI.queryFollowupRecords({
    opportunity: projectConfig.opportunity, 
    modifiedAfter: lastSync
  });
  
  // 更新本地數據
  await updateLocalData(projectId, { repairOrders, followupRecords });
  await setLastSyncTime(projectId, Date.now());
}
```

#### 測試項目
- [ ] 初始數據同步
- [ ] 增量數據更新
- [ ] 衝突解決測試
- [ ] 同步失敗恢復

#### 完成標準
- 數據同步穩定可靠
- 衝突處理邏輯正確
- 性能滿足要求

---

## 🎯 第四階段：部署和優化

### 節點 4.1：生產環境部署
**預計時間**：2-3 天  
**負責人**：DevOps

#### 任務清單
- [ ] 生產環境配置
- [ ] 域名和 SSL 設置
- [ ] 監控和日誌配置
- [ ] 備份策略實施

#### 部署配置
```toml
# wrangler.toml (production)
[env.production]
name = "construction-progress-prod"
route = "progress.yourcompany.com/*"

[env.production.vars]
ENVIRONMENT = "production"
FXIAOKE_APP_ID = "prod-app-id"

[[env.production.kv_namespaces]]
binding = "USERS_KV"
id = "prod-users-namespace"
```

#### 測試項目
- [ ] 生產環境部署成功
- [ ] SSL 證書正常
- [ ] 域名解析正確
- [ ] 監控指標收集

#### 完成標準
- 系統在生產環境穩定運行
- 監控和警報正常
- 備份機制有效

---

### 節點 4.2：性能優化
**預計時間**：3-4 天  
**負責人**：全端開發

#### 任務清單
- [ ] 前端資源優化
- [ ] API 響應優化
- [ ] 緩存策略實施
- [ ] 數據庫查詢優化

#### 優化重點
- 前端資源壓縮和緩存
- API 響應時間優化
- KV 存儲查詢優化
- 圖片和靜態資源 CDN

#### 測試項目
- [ ] 頁面載入時間 < 3 秒
- [ ] API 響應時間 < 500ms
- [ ] 緩存命中率 > 80%
- [ ] 移動端性能測試

#### 完成標準
- 性能指標達到目標
- 用戶體驗流暢
- 資源利用率合理

---

### 節點 4.3：安全加固
**預計時間**：2-3 天  
**負責人**：安全工程師

#### 任務清單
- [ ] 安全頭設置
- [ ] XSS 和 CSRF 防護
- [ ] 輸入驗證加強
- [ ] 敏感數據加密

#### 安全檢查清單
- [ ] HTTPS 強制跳轉
- [ ] 安全響應頭配置
- [ ] API 限流和防 DDoS
- [ ] 敏感數據遮罩
- [ ] 審計日誌記錄

#### 測試項目
- [ ] 滲透測試
- [ ] 安全掃描
- [ ] 權限測試
- [ ] 數據洩露測試

#### 完成標準
- 安全評估通過
- 無重大安全漏洞
- 合規要求滿足

---

## 測試策略

### 單元測試
- API 函數測試
- 權限邏輯測試
- 數據驗證測試
- 業務邏輯測試

### 整合測試
- API 端點測試
- 數據庫操作測試
- 第三方 API 測試
- 前後端整合測試

### 端到端測試
- 用戶登入流程
- 施工記錄操作
- 權限驗證流程
- 數據同步流程

### 性能測試
- 負載測試
- 壓力測試
- 併發測試
- 響應時間測試

---

## 里程碑和交付物

### 第二階段交付物
- [ ] Cloudflare Workers 後端 API
- [ ] 用戶認證系統
- [ ] 權限管理系統
- [ ] 基礎數據 CRUD API

### 第三階段交付物
- [ ] Fxiaoke CRM 整合
- [ ] 數據同步機制
- [ ] 完整功能 API

### 第四階段交付物
- [ ] 生產環境部署
- [ ] 性能優化報告
- [ ] 安全評估報告
- [ ] 用戶操作手冊

---

## 風險管理

### 技術風險
- **API 限流**：Fxiaoke API 可能有調用限制
- **數據一致性**：多用戶併發操作可能導致數據衝突
- **緩存策略**：數據更新和緩存同步

### 業務風險
- **需求變更**：業務需求可能在開發過程中變化
- **用戶接受度**：新系統的用戶培訓和接受
- **數據遷移**：現有數據的遷移和驗證

### 應對策略
- 預留 20% 緩衝時間
- 定期需求確認
- 分階段部署和驗證
- 完整的回滾機制

---

**總預計時間**：15-20 工作日  
**關鍵路徑**：節點 2.3 → 2.4 → 2.6 → 3.1 → 3.2  
**並行開發**：前端優化可與後端開發並行進行