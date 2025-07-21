/**
 * 調試同步 API 的詳細腳本
 * 檢查具體的錯誤信息和響應內容
 */

async function debugSyncAPI() {
    console.log('🔍 調試同步 API...');
    
    try {
        let fetch;
        try {
            fetch = (await import('node-fetch')).default;
        } catch (e) {
            console.log('❌ 需要安裝 node-fetch: npm install node-fetch');
            return;
        }
        
        const syncURL = 'https://progress.yes-ceramics.com/api/sync/opportunities';
        
        console.log('🔗 調用同步 API:', syncURL);
        console.log('📋 請求方法: POST');
        console.log('📋 請求標頭: Content-Type: application/json');
        
        const response = await fetch(syncURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Debug-Sync-Script/1.0'
            }
        });
        
        console.log(`\n📊 HTTP 響應狀態: ${response.status} ${response.statusText}`);
        console.log('📋 響應標頭:');
        for (const [key, value] of response.headers.entries()) {
            console.log(`  ${key}: ${value}`);
        }
        
        const responseText = await response.text();
        console.log(`\n📄 響應內容 (${responseText.length} 字元):`);
        console.log(responseText);
        
        if (response.ok) {
            try {
                const result = JSON.parse(responseText);
                console.log('\n✅ JSON 解析成功:');
                console.log('🔧 結構分析:');
                console.log(`  - success: ${result.success}`);
                console.log(`  - error: ${result.error || 'N/A'}`);
                console.log(`  - syncedCount: ${result.syncedCount || 'N/A'}`);
                console.log(`  - insertedCount: ${result.insertedCount || 'N/A'}`);
                console.log(`  - updatedCount: ${result.updatedCount || 'N/A'}`);
                console.log(`  - duration: ${result.duration || 'N/A'}ms`);
                console.log(`  - syncTime: ${result.syncTime || 'N/A'}`);
                
                // 檢查是否是 undefined 錯誤
                if (result.success === false && result.error === 'undefined') {
                    console.log('\n⚠️  發現問題: API 返回 "undefined" 錯誤');
                    console.log('💡 可能原因:');
                    console.log('  1. syncOpportunitiesToDB 函數拋出了異常');
                    console.log('  2. Fxiaoke API 憑證配置問題');
                    console.log('  3. D1 資料庫連接問題');
                    console.log('  4. 代碼部署版本不一致');
                }
                
            } catch (parseError) {
                console.log('❌ JSON 解析失敗:', parseError.message);
                console.log('🔧 原始響應可能不是 JSON 格式');
            }
        } else {
            console.log('❌ API 請求失敗');
        }
        
    } catch (error) {
        console.error('❌ 調試過程錯誤:', error.message);
        console.error('❌ 完整錯誤:', error);
    }
}

// 測試不同的 API 端點
async function testAPIEndpoints() {
    console.log('\n🧪 測試多個 API 端點...');
    
    const endpoints = [
        {
            name: '同步狀態',
            url: 'https://progress.yes-ceramics.com/api/sync/status',
            method: 'GET'
        },
        {
            name: '同步商機',
            url: 'https://progress.yes-ceramics.com/api/sync/opportunities',
            method: 'POST'
        },
        {
            name: 'CRM 商機列表',
            url: 'https://progress.yes-ceramics.com/api/crm/opportunities',
            method: 'GET'
        }
    ];
    
    let fetch;
    try {
        fetch = (await import('node-fetch')).default;
    } catch (e) {
        console.log('❌ 需要安裝 node-fetch: npm install node-fetch');
        return;
    }
    
    for (const endpoint of endpoints) {
        console.log(`\n📍 測試端點: ${endpoint.name}`);
        console.log(`🔗 URL: ${endpoint.url}`);
        console.log(`📋 方法: ${endpoint.method}`);
        
        try {
            const response = await fetch(endpoint.url, {
                method: endpoint.method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'API-Test-Script/1.0'
                }
            });
            
            console.log(`📊 狀態: ${response.status} ${response.statusText}`);
            
            const text = await response.text();
            if (text.length > 500) {
                console.log(`📄 響應: ${text.substring(0, 200)}...（已截短）`);
            } else {
                console.log(`📄 響應: ${text}`);
            }
            
            if (response.status === 404) {
                console.log('⚠️  端點不存在或路由配置有問題');
            } else if (response.status >= 500) {
                console.log('⚠️  服務器內部錯誤');
            }
            
        } catch (error) {
            console.log(`❌ 請求失敗: ${error.message}`);
        }
        
        // 避免請求太頻繁
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function main() {
    console.log('🔧 Cloudflare Workers API 調試工具');
    console.log('=====================================');
    
    await debugSyncAPI();
    await testAPIEndpoints();
    
    console.log('\n🎯 調試完成！');
}

main().catch(console.error);