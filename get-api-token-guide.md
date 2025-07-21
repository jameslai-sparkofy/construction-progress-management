# 🔑 Cloudflare API Token 快速設置指南

## WSL OAuth 問題解決方案

由於 WSL 環境下 localhost 重導向問題，我們改用 API Token 方式。

## 📋 步驟一：建立 API Token

1. **前往**: https://dash.cloudflare.com/profile/api-tokens
2. **點擊**: "Create Token"
3. **選擇**: "Custom token"

## ⚙️ 步驟二：設置權限

**Zone permissions:**
- Zone:Read

**Account permissions:**
- Cloudflare Workers:Edit
- D1:Edit
- Workers KV Storage:Edit

**Zone Resources:**
- Include: All zones

**Account Resources:**  
- Include: All accounts

## 🎯 步驟三：複製 Token 並設置

建立完成後會得到類似這樣的 token：
```
1234567890abcdef1234567890abcdef12345678
```

## 🚀 步驟四：立即部署

```bash
# 設置 token
export CLOUDFLARE_API_TOKEN='你的_token_這裡'

# 驗證認證
wrangler whoami

# 部署到生產環境
wrangler deploy --env=production

# 執行資料庫 migration
wrangler d1 migrations apply construction_progress --env=production

# 設置機密變數
echo "ec63ff237c5c4a759be36d3a8fb7a3b4" | wrangler secret put FXIAOKE_APP_SECRET --env=production
echo "$(openssl rand -base64 32)" | wrangler secret put JWT_SECRET --env=production
```

## ✅ 驗證部署成功

```bash
# 測試新的 API 端點
curl https://progress.yes-ceramics.com/api/health
curl https://progress.yes-ceramics.com/api/crm/opportunities/search?keyword=興安西
```

完成這些步驟後，系統就會有完整的 CRM 整合功能了！