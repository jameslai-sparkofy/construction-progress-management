// 測試最簡單的商機 API 調用
const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function testSimpleOpportunity() {
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
        
        // 測試不同的商機 API 格式
        const testCases = [
            {
                name: "格式1: 使用 v2 API",
                url: `${CONFIG.baseUrl}/cgi/crm/v2/data/query`,
                body: {
                    corpId, corpAccessToken: token, currentOpenUserId: userId,
                    data: {
                        apiName: "OpportunityObj",
                        search_query_info: { limit: 5, offset: 0 }
                    }
                }
            },
            {
                name: "格式2: 使用舊版 API",
                url: `${CONFIG.baseUrl}/cgi/crm/data/query`,
                body: {
                    corpId, corpAccessToken: token, currentOpenUserId: userId,
                    apiName: "crm.data.query",
                    data: {
                        dataType: "OpportunityObj"
                    }
                }
            },
            {
                name: "格式3: 簡化參數",
                url: `${CONFIG.baseUrl}/cgi/crm/data/query`,
                body: {
                    corpId, corpAccessToken: token, currentOpenUserId: userId,
                    apiName: "crm.data.query",
                    data: {
                        dataType: "OpportunityObj",
                        search_query_info: { limit: 5 }
                    }
                }
            }
        ];
        
        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            console.log(`📝 ${testCase.name}...`);
            
            try {
                const response = await fetch(testCase.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testCase.body)
                });
                
                const result = await response.json();
                
                if (result.errorCode === 0) {
                    console.log(`   ✅ 成功！獲取到 ${result.data?.dataList?.length || 0} 個商機`);
                    
                    if (result.data?.dataList?.length > 0) {
                        console.log('   商機示例:');
                        result.data.dataList.slice(0, 2).forEach((opp, idx) => {
                            console.log(`     ${idx + 1}. ${opp.name || '未命名'} (${opp._id})`);
                        });
                    }
                    break; // 找到成功的格式就停止
                } else {
                    console.log(`   ❌ 失敗: ${result.errorMessage}`);
                }
                
            } catch (error) {
                console.log(`   ❌ 請求錯誤: ${error.message}`);
            }
            
            console.log('');
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error);
    }
}

testSimpleOpportunity();