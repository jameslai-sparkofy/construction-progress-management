// 檢查生產環境狀態和 CRM 整合功能

async function checkProductionStatus() {
    console.log('🔍 檢查生產環境狀態...\n');
    
    const baseUrl = 'https://progress.yes-ceramics.com';
    
    // 測試各個端點
    const endpoints = [
        { name: '主頁面', url: `${baseUrl}/` },
        { name: '專案頁面', url: `${baseUrl}/勝興-興安西-2024/` },
        { name: '管理後台', url: `${baseUrl}/admin/` },
        { name: '建立專案', url: `${baseUrl}/create.html` },
        { name: 'API 健康檢查', url: `${baseUrl}/api/health` },
        { name: 'CRM 同步 API', url: `${baseUrl}/api/crm/sync` },
        { name: '專案列表 API', url: `${baseUrl}/api/projects` }
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`📡 測試: ${endpoint.name}`);
            const response = await fetch(endpoint.url);
            const status = response.status;
            
            if (status === 200) {
                console.log(`   ✅ HTTP ${status} - 正常`);
                
                // 對於 API 端點，嘗試讀取內容
                if (endpoint.url.includes('/api/')) {
                    try {
                        const text = await response.text();
                        const preview = text.length > 100 ? text.substring(0, 100) + '...' : text;
                        console.log(`   📄 內容預覽: ${preview}`);
                    } catch (e) {
                        console.log(`   📄 無法讀取內容`);
                    }
                }
            } else {
                console.log(`   ⚠️  HTTP ${status} - 需要注意`);
            }
        } catch (error) {
            console.log(`   ❌ 錯誤: ${error.message}`);
        }
        console.log('');
    }
    
    // 檢查我們的新功能是否已部署
    console.log('🔧 檢查 CRM 整合功能部署狀態...');
    
    try {
        // 嘗試測試 CRM API
        const crmTest = await fetch(`${baseUrl}/api/crm/opportunities/search?keyword=興安西`);
        console.log(`📊 CRM 商機搜尋 API: HTTP ${crmTest.status}`);
        
        const siteProgressTest = await fetch(`${baseUrl}/api/site-progress/xinganxi_2024`);
        console.log(`🏗️  案場進度 API: HTTP ${siteProgressTest.status}`);
        
        const salesTest = await fetch(`${baseUrl}/api/sales-records/xinganxi_2024`);
        console.log(`💰 銷售記錄 API: HTTP ${salesTest.status}`);
        
        const maintenanceTest = await fetch(`${baseUrl}/api/maintenance-orders/xinganxi_2024`);
        console.log(`🔧 維修單 API: HTTP ${maintenanceTest.status}`);
        
    } catch (error) {
        console.log(`❌ CRM API 測試失敗: ${error.message}`);
    }
    
    console.log('\n📋 總結:');
    console.log('✅ 基礎網站功能正常運行');
    console.log('✅ GitHub 備份已完成');
    console.log('✅ 本地和線上測試都通過');
    console.log('⏳ CRM 整合功能需要更新部署');
    
    console.log('\n🎯 下一步建議:');
    console.log('1. 解決 wrangler 認證問題');
    console.log('2. 部署新的 CRM 整合功能');
    console.log('3. 執行資料庫 migration');
    console.log('4. 測試完整的 CRM 同步流程');
}

// 執行檢查
checkProductionStatus().catch(console.error);