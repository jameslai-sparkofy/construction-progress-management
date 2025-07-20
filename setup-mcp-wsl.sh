#!/bin/bash

echo "=== Claude Code WSL MCP 設置 ==="
echo ""
echo "🐧 檢測到 WSL 環境: $WSL_DISTRO_NAME"
echo "📂 工作目錄: $(pwd)"
echo ""

# 檢查 GitHub CLI 登入狀態
echo "1. 檢查 GitHub CLI 認證..."
if gh auth status > /dev/null 2>&1; then
    echo "   ✅ GitHub CLI 已登入"
    GITHUB_TOKEN=$(gh auth token)
    echo "   📝 Token: ${GITHUB_TOKEN:0:12}..."
else
    echo "   ❌ GitHub CLI 未登入"
    echo "   執行: gh auth login"
    exit 1
fi

# 檢查 Cloudflare Wrangler 登入狀態  
echo ""
echo "2. 檢查 Cloudflare Wrangler 認證..."
if wrangler whoami > /dev/null 2>&1; then
    echo "   ✅ Wrangler 已登入"
    WRANGLER_EMAIL=$(wrangler whoami | grep "email" | cut -d' ' -f8 | tr -d '.')
    echo "   📧 Email: $WRANGLER_EMAIL"
else
    echo "   ❌ Wrangler 未登入"
    echo "   執行: wrangler login"
    exit 1
fi

# 確保 node_modules 已安裝
echo ""
echo "3. 檢查 MCP 依賴..."
if [ ! -d "node_modules" ]; then
    echo "   📦 安裝 MCP 依賴..."
    npm install
fi

# 檢查 MCP 服務器是否存在
GITHUB_MCP="./node_modules/@modelcontextprotocol/server-github/dist/index.js"
FILESYSTEM_MCP="./node_modules/@modelcontextprotocol/server-filesystem/dist/index.js" 
PUPPETEER_MCP="./node_modules/puppeteer-mcp-server/dist/index.js"

if [ ! -f "$GITHUB_MCP" ]; then
    echo "   ❌ GitHub MCP 未找到: $GITHUB_MCP"
    exit 1
fi

if [ ! -f "$FILESYSTEM_MCP" ]; then
    echo "   ❌ Filesystem MCP 未找到: $FILESYSTEM_MCP"
    exit 1
fi

echo "   ✅ MCP 依賴檢查完成"

# WSL 路徑轉換
WSL_PROJECT_PATH=$(pwd)
WINDOWS_PROJECT_PATH=$(wslpath -w "$WSL_PROJECT_PATH")

echo ""
echo "4. 建立 Claude Code MCP 配置..."
echo "   🔧 WSL 專案路徑: $WSL_PROJECT_PATH"
echo "   🔧 Windows 專案路徑: $WINDOWS_PROJECT_PATH"

# 在專案目錄建立 Claude Code 配置
cat > claude-code-config.json << EOF
{
  "mcpServers": {
    "github-wsl": {
      "command": "node",
      "args": ["$WSL_PROJECT_PATH/node_modules/@modelcontextprotocol/server-github/dist/index.js"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "$GITHUB_TOKEN"
      },
      "cwd": "$WSL_PROJECT_PATH"
    },
    "filesystem-wsl": {
      "command": "node",
      "args": ["$WSL_PROJECT_PATH/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js", "$WSL_PROJECT_PATH"],
      "cwd": "$WSL_PROJECT_PATH"
    },
    "puppeteer-wsl": {
      "command": "node", 
      "args": ["$WSL_PROJECT_PATH/node_modules/puppeteer-mcp-server/dist/index.js"],
      "cwd": "$WSL_PROJECT_PATH"
    }
  }
}
EOF

# 也建立傳統配置供參考
cat > claude-desktop-config.json << EOF
{
  "mcpServers": {
    "github": {
      "command": "wsl",
      "args": ["-e", "node", "$WSL_PROJECT_PATH/node_modules/@modelcontextprotocol/server-github/dist/index.js"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "$GITHUB_TOKEN"
      }
    },
    "filesystem": {
      "command": "wsl",
      "args": ["-e", "node", "$WSL_PROJECT_PATH/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js", "$WSL_PROJECT_PATH"]
    },
    "puppeteer": {
      "command": "wsl",
      "args": ["-e", "node", "$WSL_PROJECT_PATH/node_modules/puppeteer-mcp-server/dist/index.js"]
    }
  }
}
EOF

echo ""
echo "5. 測試 MCP 服務器..."

# 測試 GitHub MCP
echo "   🧪 測試 GitHub MCP..."
if timeout 5 node "$GITHUB_MCP" --help > /dev/null 2>&1; then
    echo "   ✅ GitHub MCP 正常"
else
    echo "   ⚠️  GitHub MCP 測試超時（可能正常）"
fi

# 測試 Filesystem MCP  
echo "   🧪 測試 Filesystem MCP..."
if timeout 5 node "$FILESYSTEM_MCP" --help > /dev/null 2>&1; then
    echo "   ✅ Filesystem MCP 正常"
else
    echo "   ⚠️  Filesystem MCP 測試超時（可能正常）"
fi

echo ""
echo "🎉 Claude Code WSL MCP 設置完成！"
echo ""
echo "📋 建立的配置文件:"
echo "   • claude-code-config.json (Claude Code 專用)"
echo "   • claude-desktop-config.json (Claude Desktop 兼容)"
echo ""
echo "🔧 Claude Code 使用方式:"
echo "   claude-code --mcp-config ./claude-code-config.json"
echo ""
echo "💡 如果 MCP 仍有問題，可嘗試："
echo "   • 檢查 Node.js 版本 (需要 v18+): node -v"
echo "   • 重新安裝依賴: npm install"
echo "   • 使用絕對路徑配置"