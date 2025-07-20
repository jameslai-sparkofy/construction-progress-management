#!/bin/bash

echo "=== 興安西工程進度管理系統 - 完整設置 ==="
echo ""

# 檢查必要工具
echo "🔧 檢查環境..."
if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler 未安裝"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安裝"
    exit 1
fi

echo "✅ 環境檢查完成"

# 檢查 Cloudflare API Token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo ""
    echo "⚠️  需要設置 Cloudflare API Token"
    echo "請前往: https://dash.cloudflare.com/profile/api-tokens"
    echo "建立具有以下權限的 token:"
    echo "  - D1:Edit"
    echo "  - Workers:Edit"
    echo "  - KV:Edit"
    echo "  - Zone:Read"
    echo ""
    read -p "請輸入 Cloudflare API Token: " token
    export CLOUDFLARE_API_TOKEN="$token"
    
    # 儲存到 .env
    if [ ! -f ".env" ]; then
        touch .env
    fi
    
    if grep -q "CLOUDFLARE_API_TOKEN" .env; then
        sed -i "s/CLOUDFLARE_API_TOKEN=.*/CLOUDFLARE_API_TOKEN=$token/" .env
    else
        echo "CLOUDFLARE_API_TOKEN=$token" >> .env
    fi
    
    echo "✅ API Token 已設置並儲存到 .env"
fi

echo ""
echo "🚀 開始部署..."

# 1. 部署 Workers 到生產環境
echo ""
echo "1. 部署 Cloudflare Workers..."
if wrangler deploy --env=production; then
    echo "✅ Workers 部署成功"
else
    echo "❌ Workers 部署失敗"
    exit 1
fi

# 2. 建立資料庫結構
echo ""
echo "2. 建立 D1 資料庫結構..."
if wrangler d1 migrations apply construction_progress --env=production; then
    echo "✅ 資料庫結構建立成功"
else
    echo "❌ 資料庫結構建立失敗"
    exit 1
fi

# 3. 設置機密變數
echo ""
echo "3. 設置機密變數..."

# Fxiaoke API Secret
echo "設置 Fxiaoke API Secret..."
echo "ec63ff237c5c4a759be36d3a8fb7a3b4" | wrangler secret put FXIAOKE_APP_SECRET --env=production

# JWT Secret (隨機生成)
echo "設置 JWT Secret..."
JWT_SECRET=$(openssl rand -base64 32)
echo "$JWT_SECRET" | wrangler secret put JWT_SECRET --env=production

echo "✅ 機密變數設置完成"

# 4. 測試部署
echo ""
echo "4. 測試部署..."
echo "正在測試 API 端點..."

# 測試根路徑
if curl -s "https://progress.yes-ceramics.com/" > /dev/null; then
    echo "✅ 主頁面正常"
else
    echo "⚠️  主頁面可能有問題"
fi

# 測試 API
if curl -s "https://progress.yes-ceramics.com/api/health" > /dev/null; then
    echo "✅ API 端點正常"
else
    echo "⚠️  API 端點可能有問題"
fi

echo ""
echo "🎉 設置完成！"
echo ""
echo "📋 下一步工作:"
echo "   1. 實作 Email 認證系統"
echo "   2. 設置 Fxiaoke 數據同步"
echo "   3. 建立 GitHub 倉庫進行版本控制"
echo ""
echo "🔗 可用連結:"
echo "   • 主站: https://progress.yes-ceramics.com/"
echo "   • 專案頁面: https://progress.yes-ceramics.com/勝興-興安西-2024/"
echo "   • 管理後台: https://progress.yes-ceramics.com/admin/"
echo ""
echo "💡 如需協助，請查看 CLAUDE.md 檔案"