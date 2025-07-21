#!/bin/bash
# Oracle Cloud 部署腳本
# 用於在 Oracle Cloud VM 上設置工程進度管理系統

echo "🚀 開始部署興安西工程進度管理系統到 Oracle Cloud"

# 更新系統
echo "📦 更新系統套件..."
sudo apt update && sudo apt upgrade -y

# 安裝必要軟體
echo "🔧 安裝必要軟體..."
sudo apt install -y nodejs npm nginx postgresql postgresql-contrib redis-server git

# 設置 PostgreSQL
echo "🗄️ 設置 PostgreSQL..."
sudo -u postgres psql << EOF
CREATE DATABASE construction_progress;
CREATE USER appuser WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE construction_progress TO appuser;
EOF

# 創建應用目錄
echo "📁 創建應用目錄..."
sudo mkdir -p /var/www/construction-progress
sudo chown ubuntu:ubuntu /var/www/construction-progress

# 克隆專案（請替換為您的 GitHub repo）
echo "📥 克隆專案..."
cd /var/www/construction-progress
git clone https://github.com/your-username/construction-progress.git .

# 安裝 Node.js 依賴
echo "📦 安裝 Node.js 依賴..."
npm install

# 創建環境變數檔案
echo "🔐 創建環境變數..."
cat > .env << 'EOL'
# 應用設定
NODE_ENV=production
PORT=3000

# 資料庫設定
DATABASE_URL=postgresql://appuser:your-secure-password@localhost:5432/construction_progress

# Fxiaoke API 設定
FXIAOKE_APP_ID=FSAID_1320691
FXIAOKE_APP_SECRET=ec63ff237c5c4a759be36d3a8fb7a3b4
FXIAOKE_PERMANENT_CODE=899433A4A04A3B8CB1CC2183DA4B5B48
FXIAOKE_BASE_URL=https://open.fxiaoke.com

# 代理伺服器密鑰
PROXY_API_KEY=your-proxy-secret-key
EOL

# 創建 PM2 ecosystem 檔案
echo "⚙️ 創建 PM2 設定..."
cat > ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'construction-progress',
    script: './src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }, {
    name: 'fxiaoke-proxy',
    script: './proxy-server.js',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
EOL

# 創建 Fxiaoke 代理伺服器
echo "🔀 創建代理伺服器..."
cat > proxy-server.js << 'EOL'
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// 安全驗證中間件
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.PROXY_API_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
};

// 代理配置
const proxyOptions = {
  target: 'https://open.fxiaoke.com',
  changeOrigin: true,
  pathRewrite: {
    '^/proxy': '' // 移除 /proxy 前綴
  },
  onProxyReq: (proxyReq, req, res) => {
    // 記錄請求
    console.log(`Proxying: ${req.method} ${req.path}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error' });
  }
};

// 應用中間件
app.use(authenticate);
app.use('/proxy', createProxyMiddleware(proxyOptions));

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ip: req.ip });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Fxiaoke proxy server running on port ${PORT}`);
});
EOL

# 安裝 PM2
echo "📦 安裝 PM2..."
sudo npm install -g pm2

# 設置 Nginx
echo "🌐 設置 Nginx..."
sudo tee /etc/nginx/sites-available/construction-progress << 'EOL'
server {
    listen 80;
    server_name _;

    # 主應用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Fxiaoke 代理
    location /fxiaoke-proxy {
        proxy_pass http://localhost:3001/proxy;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 靜態檔案
    location /static {
        alias /var/www/construction-progress/public;
        expires 30d;
        add_header Cache-Control "public";
    }
}
EOL

# 啟用網站
sudo ln -s /etc/nginx/sites-available/construction-progress /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# 設置防火牆
echo "🔒 設置防火牆..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

# 啟動應用
echo "🚀 啟動應用..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "✅ 部署完成！"
echo ""
echo "📌 重要資訊："
echo "1. 您的固定 IP 地址將在 Oracle Cloud Console 中顯示"
echo "2. 請將此 IP 加入 Fxiaoke 白名單"
echo "3. 主應用運行在: http://your-ip/"
echo "4. 代理 API 端點: http://your-ip/fxiaoke-proxy/*"
echo ""
echo "🔐 安全提醒："
echo "1. 請修改 .env 中的所有密碼"
echo "2. 設置 SSL 證書 (使用 Let's Encrypt)"
echo "3. 定期備份資料庫"