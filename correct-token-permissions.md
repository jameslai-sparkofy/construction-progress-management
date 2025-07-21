# 🎯 正確的 API Token 權限設置

## ❌ 當前問題
Token 中設置了 `Workers AI:Edit`，但我們需要的是 `Workers Scripts:Edit`

## ✅ 正確的權限配置

### Account Permissions (帳戶權限)
- **Cloudflare Workers:Edit** ⭐ 這個是關鍵！
- **D1:Edit** 
- **Workers KV Storage:Edit**

### Zone Permissions (域名權限)  
- **Zone:Read**

### User Permissions (用戶權限)
- **User Details:Read**
- **Memberships:Read**

## 🔄 權限修正步驟

1. **前往**: https://dash.cloudflare.com/profile/api-tokens
2. **編輯 Token**
3. **修改權限**：
   - 移除：~~Workers AI:Edit~~
   - 添加：**Cloudflare Workers:Edit** ⭐
   - 保留：D1:Edit, Workers KV Storage:Edit
4. **保存更改**

## 📋 完整權限清單應該是：

```
Account permissions:
✅ Cloudflare Workers:Edit
✅ D1:Edit  
✅ Workers KV Storage:Edit

Zone permissions:
✅ Zone:Read (for yes-ceramics.com)

User permissions:
✅ User Details:Read
✅ Memberships:Read

Resources:
✅ Include all accounts
✅ Include all zones
```

## 🚀 修正後的 Token 效果

修正後應該會看到：
```
Lai.jameslai@gmail.com's Account - Cloudflare Workers:Edit, D1:Edit, Workers KV Storage:Edit
yes-ceramics.com - Zone:Read  
All users - User Details:Read, Memberships:Read
```