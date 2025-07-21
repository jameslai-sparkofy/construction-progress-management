# Wrangler OAuth 手動認證指南

## 🔐 重新設置 OAuth 認證

### 步驟 1: 打開瀏覽器
請在瀏覽器中打開以下連結：
```
https://dash.cloudflare.com/oauth2/auth?response_type=code&client_id=54d11594-84e4-41aa-b438-e81b8fa78ee7&redirect_uri=http%3A%2F%2Flocalhost%3A8976%2Foauth%2Fcallback&scope=account%3Aread%20user%3Aread%20workers%3Awrite%20workers_kv%3Awrite%20workers_routes%3Awrite%20workers_scripts%3Awrite%20workers_tail%3Aread%20d1%3Awrite%20pages%3Awrite%20zone%3Aread%20ssl_certs%3Awrite%20ai%3Awrite%20queues%3Awrite%20pipelines%3Awrite%20secrets_store%3Awrite%20containers%3Awrite%20cloudchamber%3Awrite%20offline_access&state=m_uZ7mUUrfi-f7jNsrnUe-EPYB3DcBcV&code_challenge=mXZCXHUY1V0XI1NLVrNHSrNh9deB4H9Qn9PH6-IaSN0&code_challenge_method=S256
```

### 步驟 2: 完成授權
1. 在瀏覽器中登入 Cloudflare 帳號
2. 授權 wrangler 存取權限
3. 完成後會重導向到 localhost (會顯示錯誤，這是正常的)

### 步驟 3: 或者使用 API Token 方式

如果 OAuth 有問題，可以改用 API Token：

1. 前往: https://dash.cloudflare.com/profile/api-tokens
2. 點擊 "Create Token"
3. 選擇 "Custom token"
4. 設置權限：
   - **Account**: Cloudflare Tunnel:Edit
   - **Zone**: Zone:Read
   - **Zone**: Zone Settings:Edit  
   - **Zone**: DNS:Edit
   - **Account**: Workers Scripts:Edit
   - **Account**: D1:Edit
   - **Account**: Workers KV Storage:Edit

5. 設置 Zone Resources: Include All zones
6. 設置 Account Resources: Include All accounts

7. 複製生成的 token，然後：
```bash
export CLOUDFLARE_API_TOKEN='your_token_here'
wrangler deploy --env=production
```

## 🚀 部署指令

認證完成後，執行：
```bash
# 檢查認證狀態
wrangler whoami

# 部署到生產環境
wrangler deploy --env=production

# 執行資料庫 migration
wrangler d1 migrations apply construction_progress --env=production

# 設置機密變數
echo "ec63ff237c5c4a759be36d3a8fb7a3b4" | wrangler secret put FXIAOKE_APP_SECRET --env=production
echo "$(openssl rand -base64 32)" | wrangler secret put JWT_SECRET --env=production
```

## 📊 驗證部署

部署完成後測試：
```bash
curl https://progress.yes-ceramics.com/api/health
curl https://progress.yes-ceramics.com/api/crm/opportunities/search?keyword=興安西
```

## 🎯 目標

完成這些步驟後，我們將有：
- ✅ 完整的 CRM 整合功能
- ✅ 三個資料庫 (案場進度、銷售記錄、維修單)
- ✅ Fxiaoke API 同步功能
- ✅ 完整的工班管理系統