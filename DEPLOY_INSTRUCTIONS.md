# 部署到正式網站的步驟

## 問題說明
正式網站 https://progress.yes-ceramics.com/create 仍然顯示演示模式警告，但實際上已經可以載入真實的 CRM 數據。這表示 Cloudflare Workers 的代碼版本不是最新的。

## 解決方案
需要部署最新的代碼到 Cloudflare Workers。

## 部署步驟

### 1. 登入 Cloudflare
```bash
npx wrangler login
```

### 2. 部署到生產環境
```bash
npx wrangler deploy --env production
```

### 3. 或者部署到預設環境（如果生產環境配置有問題）
```bash
npx wrangler deploy
```

## 預期結果
部署完成後，正式網站將：
- ✅ 不再顯示黃色的演示模式警告框
- ✅ 直接載入真實的 CRM 數據
- ✅ 與測試網站 construction-progress.lai-jameslai.workers.dev 功能一致

## 驗證步驟
部署完成後，請訪問：
1. https://progress.yes-ceramics.com/create
2. 點擊「🔍 從 CRM 選擇」按鈕
3. 確認沒有黃色警告框，直接顯示真實商機列表

## 備註
- 所有代碼已推送到 GitHub
- 本地代碼已是最新版本，移除了演示模式相關的警告
- 只需要重新部署到 Cloudflare 即可解決問題