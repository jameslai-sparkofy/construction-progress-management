// 測試線上 CRM 功能的腳本
async function testLiveCRM() {
    console.log('🔍 測試線上 CRM 功能...');
    
    try {
        // 測試商機 API
        const response = await fetch('https://construction-progress.lai-jameslai.workers.dev/api/crm/opportunities');
        const result = await response.json();
        
        console.log('API 回應狀態:', response.status);
        console.log('API 回應數據:', {
            success: result.success,
            count: result.count,
            isDemo: result.isDemo,
            message: result.message,
            firstOpportunity: result.data?.[0]?.name || 'N/A'
        });
        
        // 檢查是否為真實數據
        if (result.success && !result.isDemo && result.count > 0) {
            console.log('✅ CRM 功能正常！獲取到', result.count, '個真實商機');
            console.log('📋 部分商機名稱:');
            result.data.slice(0, 5).forEach((opp, index) => {
                console.log(`  ${index + 1}. ${opp.name}`);
            });
        } else if (result.isDemo) {
            console.log('⚠️  仍在演示模式');
        } else {
            console.log('❌ API 回應異常');
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error);
    }
}

// 直接執行測試
testLiveCRM();