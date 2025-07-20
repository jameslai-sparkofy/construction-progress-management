#!/bin/bash

echo "=== MCP OAuth 設置助手 ==="
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

# 檢查 Resend (如果需要)
echo ""
echo "3. Resend Email API Key (可選)"
read -p "   需要設置 Resend 嗎? (y/N): " setup_resend
if [[ $setup_resend =~ ^[Yy]$ ]]; then
    echo "   前往: https://resend.com/api-keys"
    read -p "   請輸入 Resend API key: " RESEND_KEY
else
    RESEND_KEY=""
fi

# 更新 MCP 配置文件
echo ""
echo "4. 更新 MCP 配置..."

cat > claude-desktop-config.json << EOF
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["./node_modules/@modelcontextprotocol/server-github/dist/index.js"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "$GITHUB_TOKEN"
      }
    },
    "filesystem": {
      "command": "node",
      "args": ["./node_modules/@modelcontextprotocol/server-filesystem/dist/index.js", "/mnt/c/claude code/工程進度網頁"]
    },
    "puppeteer": {
      "command": "node",
      "args": ["./node_modules/puppeteer-mcp-server/dist/index.js"]
    }
  }
}
EOF

# 複製到系統配置目錄
echo ""
echo "5. 複製配置到系統目錄..."

# Windows WSL
if [[ "$OSTYPE" == "linux-gnu"* ]] && [[ -n "$WSLENV" ]]; then
    WINDOWS_APPDATA="/mnt/c/Users/$USER/AppData/Roaming"
    if [ -d "$WINDOWS_APPDATA" ]; then
        CLAUDE_CONFIG_DIR="$WINDOWS_APPDATA/Claude"
        mkdir -p "$CLAUDE_CONFIG_DIR"
        cp claude-desktop-config.json "$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
        echo "   ✅ 已複製到 Windows: $CLAUDE_CONFIG_DIR"
    fi
fi

# Mac
if [[ "$OSTYPE" == "darwin"* ]]; then
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
    mkdir -p "$CLAUDE_CONFIG_DIR"
    cp claude-desktop-config.json "$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
    echo "   ✅ 已複製到 Mac: $CLAUDE_CONFIG_DIR"
fi

echo ""
echo "🎉 OAuth MCP 設置完成！"
echo ""
echo "✅ 已設置的服務:"
echo "   • GitHub (OAuth via gh CLI)"
echo "   • Filesystem (本地)"
echo "   • Puppeteer (本地)"
if [ -n "$RESEND_KEY" ]; then
    echo "   • Resend Email (API Key)"
fi
echo ""
echo "🔄 下一步:"
echo "   1. 重啟 Claude Desktop"
echo "   2. 測試 MCP 連接"