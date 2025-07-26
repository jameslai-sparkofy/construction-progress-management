// 簡化版銷售記錄分析 - 檢查 external_form_display__c 欄位
const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function analyzeSalesRecords() {
    console.log('開始分析銷售記錄...');
    
    try {
        // 獲取Token
        const tokenResponse = await fetch(`${CONFIG.baseUrl}/cgi/corpAccessToken/get/V2`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                appId: CONFIG.appId,
                appSecret: CONFIG.appSecret,
                permanentCode: CONFIG.permanentCode
            })
        });
        
        const tokenResult = await tokenResponse.json();
        if (tokenResult.errorCode !== 0) {
            throw new Error(`Token獲取失敗: ${tokenResult.errorMessage}`);
        }
        
        const token = tokenResult.corpAccessToken;
        const corpId = tokenResult.corpId;
        console.log('✅ Token獲取成功');
        
        // 獲取用戶信息
        const userResponse = await fetch(`${CONFIG.baseUrl}/cgi/user/getByMobile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                mobile: "17675662629"
            })
        });
        
        const userResult = await userResponse.json();
        if (userResult.errorCode !== 0) {
            throw new Error(`用戶獲取失敗: ${userResult.errorMessage}`);
        }
        
        const userId = userResult.empList[0].openUserId;
        console.log('✅ 用戶信息獲取成功');
        
        // 查詢前100筆銷售記錄
        console.log('查詢銷售記錄...');
        const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    apiName: "ActiveRecordObj",
                    search_query_info: {
                        limit: 100,
                        offset: 0,
                        orders: [{ fieldName: "create_time", isAsc: "false" }]
                    }
                }
            })
        });
        
        const result = await response.json();
        if (result.errorCode !== 0) {
            throw new Error(`查詢失敗: ${result.errorMessage}`);
        }
        
        console.log(`✅ 成功查詢到 ${result.data.dataList.length} 筆記錄`);
        
        // 分析第一筆記錄的欄位
        if (result.data.dataList.length > 0) {
            const firstRecord = result.data.dataList[0];
            console.log('\n第一筆記錄的所有欄位:');
            Object.keys(firstRecord).forEach(key => {
                console.log(`  ${key}: ${firstRecord[key]}`);
            });
            
            // 尋找外部顯示相關欄位
            console.log('\n外部顯示相關欄位:');
            Object.keys(firstRecord).forEach(key => {
                if (key.toLowerCase().includes('external') || 
                    key.toLowerCase().includes('display') ||
                    key.toLowerCase().includes('form')) {
                    console.log(`  ⭐ ${key}: ${firstRecord[key]}`);
                }
            });
        }
        
        // 統計各種 external_form_display__c 值
        const externalDisplayStats = {};
        result.data.dataList.forEach(record => {
            if (record.external_form_display__c !== undefined) {
                const value = record.external_form_display__c || '空值';
                externalDisplayStats[value] = (externalDisplayStats[value] || 0) + 1;
            }
        });
        
        console.log('\nexternal_form_display__c 欄位分布:');
        Object.entries(externalDisplayStats).forEach(([value, count]) => {
            console.log(`  "${value}": ${count} 筆`);
        });
        
        const displayCount = externalDisplayStats['顯示'] || 0;
        console.log(`\n需要同步的記錄數 (值為"顯示"): ${displayCount} 筆`);
        console.log(`總記錄數: ${result.data.dataList.length} 筆`);
        console.log(`節省比例: ${((1 - displayCount/result.data.dataList.length) * 100).toFixed(1)}%`);
        
    } catch (error) {
        console.error('❌ 分析失敗:', error.message);
    }
}

analyzeSalesRecords();