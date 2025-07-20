# MCP 工具安裝指南

## 安裝步驟

### 1. 安裝 MCP 服務器
在命令列中執行以下命令：

```bash
# Cloudflare MCP (必要)
npm install -g @modelcontextprotocol/server-cloudflare

# Email 服務 MCP (選一個)
npm install -g @modelcontextprotocol/server-resend

# Playwright 測試 MCP (必要)
npm install -g @modelcontextprotocol/server-playwright
```

### 2. 找到 Claude 配置檔案
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`

### 3. 更新配置檔案
將以下內容加入到 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "你的_GitHub_Token"
      }
    },
    "cloudflare": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-cloudflare"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "你的_Cloudflare_Token"
      }
    },
    "resend": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-resend"],
      "env": {
        "RESEND_API_KEY": "你的_Resend_API_Key"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"]
    }
  }
}
```

### 4. 獲取 API Token

#### GitHub Token
1. 前往 https://github.com/settings/tokens
2. 生成新的 Personal Access Token
3. 權限選擇：`repo`, `workflow`, `write:packages`

#### Cloudflare Token
1. 前往 https://dash.cloudflare.com/profile/api-tokens
2. 創建自定義 Token
3. 權限選擇：
   - Zone:Zone:Read
   - Zone:DNS:Edit
   - Account:Cloudflare Workers:Edit
   - Account:D1:Edit

#### Resend API Key
1. 前往 https://resend.com/api-keys
2. 創建新的 API Key
3. 權限選擇：`Send access`

### 5. 重啟 Claude Code
安裝和配置完成後，重啟 Claude Code 以載入新的 MCP 服務器。

### 6. 驗證安裝
重新開啟 Claude Code 後，告訴 Claude：
```
請列出所有可用的 MCP 工具
```

## 故障排除

### 如果 MCP 工具沒有載入
1. 檢查 `claude_desktop_config.json` 語法是否正確
2. 確認 npm 包已正確安裝
3. 檢查 API Token 是否有效
4. 重啟 Claude Code

### 檢查安裝狀態
```bash
# 檢查已安裝的 npm 包
npm list -g | grep modelcontextprotocol

# 測試 npx 命令
npx @modelcontextprotocol/server-github --help
```

## 安裝完成後的下一步
1. 建立 GitHub 倉庫
2. 設置 Cloudflare Workers 專案
3. 配置 Email 服務
4. 開始開發和部署