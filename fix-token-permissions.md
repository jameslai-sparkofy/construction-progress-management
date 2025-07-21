# 🔧 修復 API Token 權限

## ❌ 當前問題
API Token 缺少必要的權限，需要添加以下權限：

## ✅ 需要的完整權限列表

### User Permissions (用戶權限)
- **User Details:Read** - 讀取用戶資訊
- **User Memberships:Read** - 讀取會員資格

### Account Permissions (帳戶權限)  
- **Cloudflare Workers:Edit** - 編輯 Workers
- **D1:Edit** - 編輯 D1 資料庫
- **Workers KV Storage:Edit** - 編輯 KV 存儲

### Zone Permissions (域名權限)
- **Zone:Read** - 讀取域名設置

### Account Resources
- **Include: All accounts**

### Zone Resources  
- **Include: All zones**

## 🔄 修復步驟

1. **前往**: https://dash.cloudflare.com/profile/api-tokens
2. **找到剛建立的 Token**，點擊 "Edit"
3. **添加缺少的權限**：
   - User Details:Read
   - User Memberships:Read
4. **確認其他權限都已設置**
5. **保存 Token**

## 🚀 或者建立新的 Token

如果編輯有問題，可以刪除舊 Token 並建立新的：

### Custom Token 設置：
```
Token name: Construction Progress Management

Permissions:
- User Details:Read
- User Memberships:Read  
- Cloudflare Workers:Edit
- D1:Edit
- Workers KV Storage:Edit
- Zone:Read

Account resources:
- Include: All accounts

Zone resources:
- Include: All zones
```

## 📋 完成後重新部署

```bash
export CLOUDFLARE_API_TOKEN='new_token_here'
./deploy-with-token.sh
```