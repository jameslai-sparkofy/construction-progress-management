#\!/bin/bash
# Cloudflare Workers 部署腳本

echo "🚀 準備部署到 Cloudflare Workers..."

# 檢查是否設置了 API Token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ 錯誤：未設置 CLOUDFLARE_API_TOKEN"
    echo ""
    echo "請先設置 Cloudflare API Token："
    echo "1. 訪問 https://dash.cloudflare.com/profile/api-tokens"
    echo "2. 創建一個新的 API Token，選擇 'Edit Cloudflare Workers' 模板"
    echo "3. 運行以下命令設置 Token："
    echo "   export CLOUDFLARE_API_TOKEN='your-api-token-here'"
    echo ""
    exit 1
fi

# 部署
echo "📦 開始部署..."
npx wrangler deploy

if [ $? -eq 0 ]; then
    echo "✅ 部署成功！"
    echo ""
    echo "您的應用已部署到："
    echo "https://construction-progress.yes-ceramics.workers.dev"
    echo ""
    echo "測試 CRM API："
    echo "curl https://construction-progress.yes-ceramics.workers.dev/api/crm/opportunities"
else
    echo "❌ 部署失敗"
    exit 1
fi
EOF < /dev/null
