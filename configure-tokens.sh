#!/bin/bash

echo "=== MCP Token 配置助手 ==="
echo ""

# 建立 .env 文件
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "已建立 .env 文件"
fi

echo "請依序輸入以下 API tokens:"
echo ""

# GitHub Token
echo "1. GitHub Personal Access Token"
echo "   前往: https://github.com/settings/personal-access-tokens/tokens"
echo "   權限: repo, workflow, read:org, user:email"
read -p "   請輸入 GitHub token: " GITHUB_TOKEN

# Cloudflare Token  
echo ""
echo "2. Cloudflare API Token"
echo "   前往: https://dash.cloudflare.com/profile/api-tokens"
echo "   權限: Workers:Edit, Zone:Read, D1:Edit, KV:Edit"
read -p "   請輸入 Cloudflare token: " CLOUDFLARE_TOKEN

# Resend Key
echo ""
echo "3. Resend API Key (Email 服務)"
echo "   前往: https://resend.com/api-keys"
echo "   權限: Sending access"
read -p "   請輸入 Resend API key: " RESEND_KEY

# 更新 .env 文件
sed -i "s/GITHUB_PERSONAL_ACCESS_TOKEN=.*/GITHUB_PERSONAL_ACCESS_TOKEN=$GITHUB_TOKEN/" .env
sed -i "s/CLOUDFLARE_API_TOKEN=.*/CLOUDFLARE_API_TOKEN=$CLOUDFLARE_TOKEN/" .env
sed -i "s/RESEND_API_KEY=.*/RESEND_API_KEY=$RESEND_KEY/" .env

# 更新 MCP 配置文件
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

echo ""
echo "✅ 配置完成！"
echo ""
echo "下一步:"
echo "1. 執行 ./setup-mcp.sh 複製配置到系統目錄"
echo "2. 重啟 Claude Desktop 應用程式"
echo "3. 測試 MCP 連接"