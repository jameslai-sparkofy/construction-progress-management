// 使用正確的 v2 API 路徑測試預設對象
const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function testCorrectV2API() {
    try {
        console.log('🔐 獲取認證...');
        
        // 獲取 Token
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
        const { corpAccessToken: token, corpId } = tokenResult;
        
        // 獲取用戶
        const userResponse = await fetch(`${CONFIG.baseUrl}/cgi/user/getByMobile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId, corpAccessToken: token, mobile: "17675662629"
            })
        });
        
        const userResult = await userResponse.json();
        const userId = userResult.empList[0].openUserId;
        
        console.log('✅ 認證成功\n');
        
        // 測試商機 API (預設對象)
        console.log('1️⃣ 測試商機 API (預設對象)...');
        const opportunityResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    apiName: "NewOpportunityObj",
                    search_query_info: {
                        limit: 10,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const oppResult = await opportunityResponse.json();
        console.log(`   商機 API 響應: ${oppResult.errorCode === 0 ? '✅ 成功' : '❌ ' + oppResult.errorMessage}`);
        
        if (oppResult.errorCode === 0) {
            console.log(`   獲取到 ${oppResult.data?.dataList?.length || 0} 個商機`);
            if (oppResult.data?.dataList?.length > 0) {
                oppResult.data.dataList.slice(0, 3).forEach((opp, idx) => {
                    console.log(`     ${idx + 1}. ${opp.name || '未命名'} (${opp._id})`);
                });
            }
        }
        
        console.log('');
        
        // 測試銷售記錄 API (預設對象)
        console.log('2️⃣ 測試銷售記錄 API (預設對象)...');
        const salesResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    apiName: "ActiveRecordObj",
                    search_query_info: {
                        limit: 10,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const salesResult = await salesResponse.json();
        console.log(`   銷售記錄 API 響應: ${salesResult.errorCode === 0 ? '✅ 成功' : '❌ ' + salesResult.errorMessage}`);
        
        if (salesResult.errorCode === 0) {
            console.log(`   獲取到 ${salesResult.data?.dataList?.length || 0} 條銷售記錄`);
            if (salesResult.data?.dataList?.length > 0) {
                salesResult.data.dataList.slice(0, 3).forEach((record, idx) => {
                    console.log(`     ${idx + 1}. ${record.content || record.description || '無內容'}`);
                });
            }
        }
        
        console.log('');
        
        // 保存結果
        const allData = {
            timestamp: new Date().toISOString(),
            opportunities: oppResult.errorCode === 0 ? oppResult.data?.dataList || [] : [],
            salesRecords: salesResult.errorCode === 0 ? salesResult.data?.dataList || [] : []
        };
        
        require('fs').writeFileSync('correct-v2-data.json', JSON.stringify(allData, null, 2));
        console.log('💾 數據已保存到 correct-v2-data.json');
        
    } catch (error) {
        console.error('❌ 測試失敗:', error);
    }
}

testCorrectV2API();