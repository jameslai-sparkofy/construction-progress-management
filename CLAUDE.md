# Claude Code 工作狀態記錄
*最後更新：2025-07-19*

## 專案概述
- **專案名稱**：興安西工程進度管理系統
- **技術棧**：HTML/JS 前端 + Cloudflare Workers 後端 + Fxiaoke CRM API
- **架構**：多租戶系統，每個專案獨立 URL

## 目前進度狀況 (約70%完成)

### ✅ 已完成
1. **UI 原型設計** - 完整的前端界面
   - 主界面：`興安西工程管理網站-完整版本.html`
   - 進度視覺化：`construction-progress-v2.html`
   - 管理後台：`admin-ui-prototype.html`
   - 登入頁面：`login-ui-prototype.html`

2. **Cloudflare Workers 後端架構**
   - 主路由器：`cloudflare-workers-main-router.js`
   - API 服務：`cloudflare-workers-api-service.js`
   - 配置檔案：`wrangler.toml`

3. **API 整合測試**
   - 12個測試腳本驗證 Fxiaoke API 連接
   - 真實數據獲取腳本完成

4. **系統設計文檔**
   - 完整需求規格、權限設計、架構文檔

### ❌ 待完成工作
1. **前後端串接** - 最關鍵步驟
   - HTML 原型需要改為動態數據
   - API 調用集成到前端

2. **Email 認證系統實作**
   - 登入功能
   - Email 驗證服務 (改為 Email，不用短信)
   - Session 管理

3. **Cloudflare 完整部署**
   - Workers 腳本部署
   - D1 資料庫建立和同步 CRM 資料
   - KV 命名空間建立
   - 環境變數設定

4. **數據同步系統**
   - Fxiaoke CRM 到 Cloudflare D1 同步
   - 定時任務和即時同步

5. **GitHub 程式碼管理**
   - 建立 GitHub 倉庫
   - 版本控制和備份

6. **自動化測試和驗證**
   - 功能測試
   - 部署驗證

## 用戶權限架構
- **admin**：完整系統控制
- **owner**：查看權限，無編輯權
- **contractor_leader**：管理自己工班
- **member**：施工操作權限

## 重要配置信息
- **Fxiaoke API**：
  - App ID: FSAID_1320691
  - 基礎 URL: https://open.fxiaoke.com
- **測試用戶**：多個角色測試帳號已設定
- **建築結構**：A/B/C三棟，不同工班負責

## MCP 工具需求和狀態
- **GitHub MCP** ✅：已安裝可用
- **Filesystem MCP** ✅：已安裝 (@modelcontextprotocol/server-filesystem@2025.7.1)
- **Puppeteer MCP** ✅：已安裝 (puppeteer-mcp-server@0.7.2)
- **Wrangler CLI** ⚠️：需要 Node.js v20+ (目前 v18.19.1)

### 實際可用的 MCP 工具清單

#### 1. Filesystem MCP Server (已有基礎功能)
```bash
npm install -g @modelcontextprotocol/server-filesystem
```
**功能**：檔案系統操作、程式碼管理

#### 2. Puppeteer MCP Server (用於測試)
```bash
npm install -g puppeteer-mcp-server
```
**功能**：網頁自動化測試、截圖、功能驗證

#### 3. 手動配置 Cloudflare 和 Email
由於官方 MCP 服務器尚未完全可用，我們將：
- 使用 Wrangler CLI 管理 Cloudflare
- 使用現有工具集成 Email 服務

### Claude 配置檔案位置
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`

### 安裝後需要在 claude_desktop_config.json 中加入：
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token"
      }
    },
    "cloudflare": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-cloudflare"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "your_token"
      }
    },
    "resend": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-resend"],
      "env": {
        "RESEND_API_KEY": "your_key"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"]
    }
  }
}
```

## 下次工作建議
1. 優先處理前後端串接
2. 實作登入認證系統
3. 準備 Cloudflare 部署

## 注意事項
- API 憑證已在測試腳本中
- 多租戶 URL 格式：`progress.yourcompany.com/projectname-token/`
- 使用 KV 存儲用戶數據和施工記錄

---
**使用說明**：
- 每次重啟 Claude Code 後，請先閱讀此檔案了解專案狀態
- 完成新工作後，請更新此檔案記錄進度
- 重要決策和技術細節請記錄在此