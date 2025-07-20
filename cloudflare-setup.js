/**
 * Cloudflare 資源設定腳本
 * 使用 Cloudflare API 自動建立所需資源
 */

const fetch = require('node-fetch');

// 需要設定環境變數: CLOUDFLARE_API_TOKEN
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE_NAME = 'yes-ceramics.com';
const SUBDOMAIN = 'progress';

if (!CLOUDFLARE_API_TOKEN) {
    console.error('❌ 請設定環境變數 CLOUDFLARE_API_TOKEN');
    console.error('   export CLOUDFLARE_API_TOKEN="your_token_here"');
    process.exit(1);
}

const headers = {
    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json'
};

async function apiRequest(url, options = {}) {
    const fullUrl = `https://api.cloudflare.com/v4${url}`;
    console.log(`🔗 API 請求: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
        headers,
        ...options
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(`API 錯誤: ${data.errors.map(e => e.message).join(', ')}`);
    }
    
    return data.result;
}

async function getZoneId() {
    console.log(`🔍 查找網域 ${ZONE_NAME}...`);
    const zones = await apiRequest('/zones');
    const zone = zones.find(z => z.name === ZONE_NAME);
    
    if (!zone) {
        throw new Error(`找不到網域 ${ZONE_NAME}`);
    }
    
    console.log(`✅ 找到網域 ID: ${zone.id}`);
    return zone.id;
}

async function createDNSRecord(zoneId) {
    console.log(`📝 建立 DNS 記錄 ${SUBDOMAIN}.${ZONE_NAME}...`);
    
    try {
        const record = await apiRequest(`/zones/${zoneId}/dns_records`, {
            method: 'POST',
            body: JSON.stringify({
                type: 'CNAME',
                name: SUBDOMAIN,
                content: 'construction-progress-prod.workers.dev',
                proxied: true,
                comment: '工程進度管理系統 - 自動建立'
            })
        });
        
        console.log(`✅ DNS 記錄已建立: ${record.id}`);
        return record;
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log(`⚠️  DNS 記錄已存在，跳過建立`);
            return null;
        }
        throw error;
    }
}

async function createWorker() {
    console.log('🔧 建立 Cloudflare Worker...');
    
    // 讀取 Worker 腳本
    const fs = require('fs');
    const workerScript = fs.readFileSync('./src/index.js', 'utf8');
    
    try {
        const worker = await apiRequest('/accounts/{account_id}/workers/scripts/construction-progress-prod', {
            method: 'PUT',
            headers: {
                ...headers,
                'Content-Type': 'application/javascript'
            },
            body: workerScript
        });
        
        console.log('✅ Worker 已部署');
        return worker;
    } catch (error) {
        console.error('❌ Worker 部署失敗:', error.message);
        throw error;
    }
}

async function main() {
    try {
        console.log('🚀 開始 Cloudflare 資源設定...\n');
        
        // 1. 獲取 Zone ID
        const zoneId = await getZoneId();
        
        // 2. 建立 DNS 記錄
        await createDNSRecord(zoneId);
        
        // 3. 部署 Worker (需要帳號 ID)
        console.log('\n⚠️  Worker 部署需要帳號 ID，請使用 wrangler 手動部署:');
        console.log('   npx wrangler deploy --env production');
        
        console.log('\n✅ Cloudflare 設定完成！');
        console.log(`🌐 你的網站將在以下地址可用:`);
        console.log(`   https://${SUBDOMAIN}.${ZONE_NAME}/`);
        console.log('\n📌 DNS 傳播可能需要 5-10 分鐘');
        
    } catch (error) {
        console.error('❌ 設定失敗:', error.message);
        process.exit(1);
    }
}

// 如果直接執行此腳本
if (require.main === module) {
    main();
}

module.exports = { getZoneId, createDNSRecord, createWorker };