# 興安西工程進度管理系統 - 設定指南

## 🔧 Claude Code MCP 設定

### 1. 複製 MCP 配置到 Claude Code

將 `claude-mcp-config.json` 的內容複製到你的 Claude Code 配置檔案：

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

### 2. 設定 GitHub Token

1. 前往 https://github.com/settings/tokens
2. 建立新的 Classic Token
3. 勾選權限：`repo`, `workflow`, `write:packages`, `admin:repo_hook`, `user`, `delete_repo`
4. 複製 token 並替換配置檔案中的 `your_github_token_here`

### 3. 重啟 Claude Code

配置完成後重啟 Claude Code CLI 讓設定生效。

## 🌐 Cloudflare 設定步驟

### Phase 1: DNS 設定
1. 登入 Cloudflare Dashboard
2. 選擇 `yes-ceramics.com` 網域
3. 進入 DNS 頁面
4. 新增記錄：
   - Type: `CNAME`
   - Name: `progress`
   - Target: `construction-progress-prod.workers.dev` (Worker subdomain)
   - Proxy status: 🟠 Proxied

### Phase 2: Workers 部署
使用以下指令部署：
```bash
cd "/mnt/c/claude code/工程進度網頁"
npm install
npx wrangler login
npx wrangler deploy --env production
```

### Phase 3: D1 資料庫建立
```bash
npx wrangler d1 create construction_progress
# 複製返回的 database_id 到 wrangler.toml
```

### Phase 4: KV 命名空間建立
```bash
npx wrangler kv:namespace create PROJECTS
npx wrangler kv:namespace create SESSIONS
# 複製返回的 id 到 wrangler.toml
```

### Phase 5: 機密變數設定
```bash
npx wrangler secret put FXIAOKE_APP_SECRET
npx wrangler secret put JWT_SECRET
npx wrangler secret put EMAIL_API_KEY
```

## 🚀 自動化部署腳本

執行以下腳本完成所有設定：

```bash
# 安裝依賴
npm install

# 建立所有 Cloudflare 資源
npm run setup:cloudflare

# 部署到生產環境
npm run deploy:prod

# 測試部署
curl https://progress.yes-ceramics.com/api/projects
```

## 📁 專案結構

```
工程進度網頁/
├── src/
│   └── index.js              # Workers 主路由
├── frontend/
│   ├── index.html            # 專案管理總覽
│   └── create.html           # 新增專案頁面
├── migrations/
│   └── 0001_initial.sql      # D1 資料庫結構
├── wrangler.toml             # Cloudflare 配置
├── package.json              # 專案配置
└── SETUP.md                  # 此設定指南
```

## 🔗 重要連結

- **專案管理**: https://progress.yes-ceramics.com/
- **管理後台**: https://progress.yes-ceramics.com/admin/
- **API 文檔**: https://progress.yes-ceramics.com/api/docs
- **範例專案**: https://progress.yes-ceramics.com/xinganxi-abc123def456/

## 🛠️ 故障排除

### 常見問題

1. **DNS 記錄未生效**
   - 等待 DNS 傳播 (通常 5-10 分鐘)
   - 檢查 Cloudflare Proxy 狀態

2. **Workers 部署失敗**
   - 確認 wrangler 已登入
   - 檢查 wrangler.toml 配置

3. **MCP 連接問題**
   - 重啟 Claude Code
   - 檢查配置檔案語法

## 📞 支援

如有問題，請檢查：
1. Cloudflare Dashboard 的錯誤日誌
2. Workers 的即時日誌
3. 瀏覽器開發者工具的網路請求