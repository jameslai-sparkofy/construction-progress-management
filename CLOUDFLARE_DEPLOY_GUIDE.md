# Cloudflare 部署指南

由於 Wrangler OAuth 登入可能遇到 localhost 連接問題，我們使用 API Token 方式進行部署。

## 步驟 1: 建立 Cloudflare API Token

1. 前往 [Cloudflare API Tokens 頁面](https://dash.cloudflare.com/profile/api-tokens)
2. 點擊 "Create Token" 
3. 選擇 "Custom token" 
4. 設定以下權限：
   - **Account**: `Cloudflare Tunnel:Edit`
   - **Zone**: `Zone:Edit`, `DNS:Edit` 
   - **Zone Resources**: `Include - Specific zone - yes-ceramics.com`
   - **Account Resources**: `Include - All accounts`

5. 點擊 "Continue to summary" 然後 "Create Token"
6. 複製產生的 Token（只會顯示一次）

## 步驟 2: 設定環境變數

```bash
export CLOUDFLARE_API_TOKEN="你的_API_Token"
```

## 步驟 3: 建立 DNS 記錄

執行我們的 DNS 設定腳本：

```bash
cd "/mnt/c/claude code/工程進度網頁"
node cloudflare-setup.js
```

## 步驟 4: 建立 Cloudflare 資源

### 4.1 建立 D1 資料庫

```bash
npx wrangler d1 create construction_progress
```

執行後會返回類似以下的資訊：
```
[[d1_databases]]
binding = "DB"
database_name = "construction_progress"
database_id = "你的資料庫ID"
```

將 `database_id` 複製到 `wrangler.toml` 檔案中。

### 4.2 建立 KV 命名空間

```bash
# 建立 PROJECTS 命名空間
npx wrangler kv:namespace create PROJECTS

# 建立 SESSIONS 命名空間  
npx wrangler kv:namespace create SESSIONS
```

將返回的 ID 更新到 `wrangler.toml` 中並取消註釋 KV 配置。

### 4.3 執行資料庫遷移

```bash
npx wrangler d1 execute construction_progress --file=./migrations/0001_initial.sql
```

### 4.4 設定機密變數

```bash
# 設定 Fxiaoke App Secret
npx wrangler secret put FXIAOKE_APP_SECRET

# 設定 JWT Secret（可以用 openssl 生成）
openssl rand -hex 32 | npx wrangler secret put JWT_SECRET

# 設定 Email API Key  
npx wrangler secret put EMAIL_API_KEY
```

## 步驟 5: 部署 Workers

```bash
npx wrangler deploy --env production
```

## 步驟 6: 部署前端到 Pages

```bash
# 建立 Pages 專案
npx wrangler pages project create construction-progress --production-branch main

# 部署前端
npx wrangler pages deploy frontend --project-name construction-progress
```

## 步驟 7: 驗證部署

1. 檢查 DNS 記錄是否正確指向 Workers
2. 訪問 `https://progress.yes-ceramics.com/` 測試
3. 測試多租戶 URL：`https://progress.yes-ceramics.com/xinganxi-abc123def456/`

## 手動替代方案

如果 Wrangler 仍有問題，可以：

1. **手動建立 DNS 記錄**：
   - 登入 Cloudflare Dashboard
   - 選擇 yes-ceramics.com 域名
   - 添加 CNAME 記錄：
     - Type: CNAME
     - Name: progress  
     - Target: construction-progress-prod.workers.dev
     - Proxy status: Proxied (橘色雲朵)

2. **使用 Cloudflare Dashboard 建立資源**：
   - D1 資料庫：在 Workers & Pages > D1 中建立
   - KV 命名空間：在 Workers & Pages > KV 中建立
   - Workers：直接在 Dashboard 中上傳程式碼

## 故障排除

1. **API Token 權限不足**：確保 Token 有所有必要權限
2. **DNS 傳播延遲**：等待 5-10 分鐘讓 DNS 生效
3. **CORS 問題**：檢查 Workers 中的 CORS 設定
4. **資料庫連接**：確保 D1 綁定正確配置

## 下一步

部署完成後，需要：
1. 測試所有 API 端點
2. 驗證多租戶功能
3. 測試前端界面
4. 檢查日誌和監控