#!/bin/bash

# 興安西工程進度管理系統 - Cloudflare 部署腳本
echo "🚀 開始部署工程進度管理系統到 Cloudflare..."

# 檢查 Node.js 版本
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="20.0.0"

echo "📌 當前 Node.js 版本: v$NODE_VERSION"

# 安裝依賴
echo "📦 安裝專案依賴..."
npm install

# 建立 D1 資料庫
echo "🗄️ 建立 D1 資料庫..."
npx wrangler d1 create construction_progress --experimental-backend
echo "⚠️  請將返回的 database_id 複製到 wrangler.toml"
read -p "按 Enter 繼續..."

# 建立 KV 命名空間
echo "📁 建立 KV 命名空間..."
echo "建立 PROJECTS 命名空間..."
npx wrangler kv:namespace create PROJECTS
echo "⚠️  請將返回的 id 複製到 wrangler.toml 的 PROJECTS binding"
read -p "按 Enter 繼續..."

echo "建立 SESSIONS 命名空間..."
npx wrangler kv:namespace create SESSIONS
echo "⚠️  請將返回的 id 複製到 wrangler.toml 的 SESSIONS binding"
read -p "按 Enter 繼續..."

# 執行資料庫遷移
echo "🔄 執行資料庫遷移..."
npx wrangler d1 execute construction_progress --file=./migrations/0001_initial.sql

# 設定機密變數
echo "🔐 設定機密變數..."
echo "設定 FXIAOKE_APP_SECRET..."
read -s -p "請輸入 FXIAOKE_APP_SECRET: " FXIAOKE_SECRET
echo
npx wrangler secret put FXIAOKE_APP_SECRET --env production <<< "$FXIAOKE_SECRET"

echo "設定 JWT_SECRET..."
read -s -p "請輸入 JWT_SECRET (或按 Enter 自動生成): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    echo "已自動生成 JWT_SECRET"
fi
echo
npx wrangler secret put JWT_SECRET --env production <<< "$JWT_SECRET"

echo "設定 EMAIL_API_KEY..."
read -s -p "請輸入 EMAIL_API_KEY: " EMAIL_KEY
echo
npx wrangler secret put EMAIL_API_KEY --env production <<< "$EMAIL_KEY"

# 部署 Workers
echo "☁️ 部署 Workers..."
npx wrangler deploy --env production

# 部署 Pages (前端)
echo "📄 部署前端到 Cloudflare Pages..."
npx wrangler pages project create construction-progress --production-branch main
npx wrangler pages deploy frontend --project-name construction-progress

echo "✅ 部署完成！"
echo ""
echo "📌 請完成以下手動步驟："
echo "1. 在 Cloudflare Dashboard 設定 DNS 記錄："
echo "   - Type: CNAME"
echo "   - Name: progress"
echo "   - Target: construction-progress-prod.workers.dev"
echo "   - Proxy status: Proxied"
echo ""
echo "2. 等待 DNS 傳播 (約 5-10 分鐘)"
echo ""
echo "3. 訪問你的網站："
echo "   https://progress.yes-ceramics.com/"
echo ""
echo "🎉 恭喜！多租戶工程管理系統部署成功！"