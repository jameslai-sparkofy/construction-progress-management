# 興安西工程進度管理系統 - Cloudflare部署指南

## 部署前準備

### 1. 環境要求
- Node.js 16+ 
- npm 或 yarn
- Cloudflare 帳戶
- 域名並託管在 Cloudflare

### 2. 安裝工具
```bash
# 安裝 Cloudflare Wrangler CLI
npm install -g wrangler

# 登入 Cloudflare
wrangler login
```

### 3. 紛享銷客API配置
確保您有以下資訊：
- App ID: `FSAID_1320691`
- App Secret: (需要保密)
- Permanent Code: (需要保密)
- IP白名單已設置

## 部署步驟

### 步驟1：項目設置
```bash
# 克隆或創建項目目錄
mkdir construction-progress
cd construction-progress

# 初始化項目
npm init -y
npm install wrangler

# 複製配置文件
cp wrangler.toml ./
cp cloudflare-workers-main-router.js ./src/main-router.js
cp cloudflare-workers-api-service.js ./src/api-service.js
```

### 步驟2：創建KV命名空間
```bash
# 創建所有必要的KV命名空間
wrangler kv:namespace create "PROJECTS_CONFIG" --preview=false
wrangler kv:namespace create "USER_SESSIONS" --preview=false
wrangler kv:namespace create "SITE_DATA" --preview=false
wrangler kv:namespace create "SMS_CODES" --preview=false
wrangler kv:namespace create "PROGRESS_DATA" --preview=false
wrangler kv:namespace create "USER_PERMISSIONS" --preview=false

# 創建預覽版本
wrangler kv:namespace create "PROJECTS_CONFIG" --preview=true
wrangler kv:namespace create "USER_SESSIONS" --preview=true
wrangler kv:namespace create "SITE_DATA" --preview=true
wrangler kv:namespace create "SMS_CODES" --preview=true
wrangler kv:namespace create "PROGRESS_DATA" --preview=true
wrangler kv:namespace create "USER_PERMISSIONS" --preview=true
```

### 步驟3：更新配置文件
將步驟2獲得的KV命名空間ID更新到 `wrangler.toml` 中：

```toml
[[kv_namespaces]]
binding = "PROJECTS_CONFIG"
id = "your-actual-id-here"
preview_id = "your-actual-preview-id-here"
```

### 步驟4：設置敏感環境變數
```bash
# 設置紛享銷客API密鑰
wrangler secret put FXIAOKE_APP_SECRET
# 輸入您的App Secret

wrangler secret put FXIAOKE_PERMANENT_CODE
# 輸入您的Permanent Code

# 設置短信服務（選擇Twilio或三竹）
wrangler secret put TWILIO_ACCOUNT_SID
wrangler secret put TWILIO_AUTH_TOKEN
wrangler secret put TWILIO_PHONE_NUMBER

# 設置加密密鑰
wrangler secret put ENCRYPTION_KEY
# 輸入一個強密鑰，用於數據加密
```

### 步驟5：初始化項目資料
```bash
# 使用項目設置腳本初始化KV資料
node cloudflare-project-setup.js

# 或手動設置項目配置
wrangler kv:key put --namespace-id=YOUR_PROJECTS_CONFIG_ID "xinganxi-A8B9C" --path=project-config.json
```

### 步驟6：部署Workers
```bash
# 部署主要Worker
wrangler deploy --name construction-progress-main

# 部署API服務Worker
wrangler deploy --name construction-progress-api

# 部署資料同步Worker
wrangler deploy --name construction-progress-sync
```

### 步驟7：設置自定義域名
```bash
# 添加路由規則
wrangler route add "progress.yourcompany.com/*" construction-progress-main

# 或在Cloudflare Dashboard中設置
```

## 項目配置

### 興安西項目設置
項目ID: `xinganxi-A8B9C`
項目配置已在 `cloudflare-project-setup.js` 中定義，包含：

- 6個測試用戶（工班、業主、管理員）
- 3個承包商（王大誠、築愛家、塔塔家）
- 3棟建築（A棟、B棟、C棟）
- 完整的權限配置

### 測試用戶帳戶
| 姓名 | 手機號碼 | 角色 | 權限 |
|------|----------|------|------|
| 王大誠 | 0912345678 | 工班 | B棟 2F/4F/12F |
| 築愛家負責人 | 0921234567 | 工班 | A棟 8F/10F-14F |
| 塔塔家負責人 | 0987654321 | 工班 | C棟 3F-15F |
| 業主代表1 | 0911111111 | 業主 | 全部建築 |
| 業主代表2 | 0922222222 | 業主 | 全部建築 |
| 系統管理員 | 0900000000 | 管理員 | 全部功能 |

## 域名配置

### DNS設置
在Cloudflare DNS中添加：
```
Type: CNAME
Name: progress
Content: yourcompany.com
Proxy: ✅ (橘色雲朵)
```

### SSL/TLS配置
- 加密模式：完全（嚴格）
- 邊緣憑證：自動
- 最低TLS版本：1.2

## 監控和維護

### 檢查部署狀態
```bash
# 查看Worker狀態
wrangler tail

# 查看KV資料
wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID

# 查看日誌
wrangler tail --format=pretty
```

### 定期維護
```bash
# 同步最新資料
wrangler cron trigger --name construction-progress-sync

# 備份KV資料
wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID > backup.json

# 更新Worker
wrangler deploy
```

## 故障排除

### 常見問題

**1. 401 Unauthorized 錯誤**
- 檢查紛享銷客API密鑰是否正確
- 確認IP白名單設置
- 驗證Token是否過期

**2. 項目未找到錯誤**
- 確認KV命名空間ID是否正確
- 檢查項目配置是否已設置
- 驗證項目ID是否匹配

**3. 短信發送失敗**
- 檢查短信服務商配置
- 確認手機號碼格式
- 驗證API密鑰和餘額

**4. 資料同步問題**
- 檢查Cron觸發器設置
- 確認API調用限制
- 查看Worker日誌

### 調試指令
```bash
# 本地開發
wrangler dev --local

# 查看實時日誌
wrangler tail --format=pretty

# 測試API端點
curl https://progress.yourcompany.com/xinganxi-A8B9C/api/sites

# 檢查KV資料
wrangler kv:key get --namespace-id=YOUR_ID "xinganxi-A8B9C"
```

## 安全考量

### 資料保護
- 所有敏感資料存儲在KV中並加密
- 使用HTTPS傳輸
- 實施會話超時機制
- 定期輪換API密鑰

### 存取控制
- 短信驗證登入
- 基於角色的權限控制
- 請求頻率限制
- IP白名單（如需要）

### 監控
- 啟用Cloudflare Analytics
- 設置異常告警
- 定期檢查日誌
- 監控API調用量

## 成本估算

### Cloudflare Workers 費用
- 免費方案：100,000 請求/天
- 付費方案：$5/月 + $0.50/百萬請求

### KV 儲存費用
- 免費方案：1GB 儲存 + 100,000 讀取/天
- 付費方案：$0.50/GB/月 + $0.50/百萬操作

### 短信服務費用
- Twilio：約 $0.0075/條
- 三竹：約 $0.8-1.5/條

## 部署後驗證

### 功能測試清單
- [ ] 主頁面載入正常
- [ ] 項目頁面可正常訪問
- [ ] 短信驗證碼發送成功
- [ ] 用戶登入功能正常
- [ ] 資料同步功能正常
- [ ] 響應式設計在移動設備上正常
- [ ] 不同角色權限控制正常
- [ ] API端點響應正常

### 性能測試
- [ ] 頁面載入時間 < 3秒
- [ ] API響應時間 < 1秒
- [ ] 大量用戶同時訪問穩定
- [ ] 資料快取機制有效

### 訪問網址
部署完成後，可以通過以下網址訪問：
- 主頁：https://progress.yourcompany.com/
- 興安西項目：https://progress.yourcompany.com/xinganxi-A8B9C/
- 登入頁面：https://progress.yourcompany.com/xinganxi-A8B9C/login

## 技術支援

如有問題，請檢查：
1. [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
2. [Wrangler CLI 文檔](https://developers.cloudflare.com/workers/wrangler/)
3. [KV 儲存文檔](https://developers.cloudflare.com/workers/runtime-apis/kv/)

或聯繫系統管理員獲取技術支援。