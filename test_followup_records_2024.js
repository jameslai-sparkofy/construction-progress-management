// 測試跟進記錄API - 2024版本
// 基於之前的經驗，嘗試不同的API端點和參數組合

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function testFollowupRecords() {
    console.log('=== 測試跟進記錄API - 2024年版本 ===\n');
    
    try {
        // Step 1: 獲取Token
        console.log('1. 獲取企業訪問令牌...');
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
        console.log('✅ Token獲取成功\n');
        
        // Step 2: 獲取用戶信息
        console.log('2. 獲取用戶信息...');
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
        console.log('✅ 用戶信息獲取成功\n');
        
        // Step 3: 測試多種跟進記錄API端點
        console.log('3. 測試不同的跟進記錄API端點...\n');
        
        // 測試1: 標準對象API - 使用預設的跟進記錄對象
        console.log('測試1: 標準對象API - ActiveRecord');
        await testFollowupAPI1(token, corpId, userId);
        
        // 測試2: 標準對象API - 使用不同的參數格式
        console.log('\n測試2: 標準對象API - 不同參數格式');
        await testFollowupAPI2(token, corpId, userId);
        
        // 測試3: 自定義對象API - 看看是否有自定義的跟進記錄
        console.log('\n測試3: 自定義對象API');
        await testFollowupAPI3(token, corpId, userId);
        
        // 測試4: 嘗試查詢與興安西相關的跟進記錄
        console.log('\n測試4: 查詢興安西相關跟進記錄');
        await testFollowupAPI4(token, corpId, userId);
        
        // 測試5: 嘗試不同的數據查詢方式
        console.log('\n測試5: 不同的數據查詢方式');
        await testFollowupAPI5(token, corpId, userId);
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

// 測試1: 標準對象API - ActiveRecord
async function testFollowupAPI1(token, corpId, userId) {
    try {
        const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    apiName: "ActiveRecord",
                    search_query_info: {
                        limit: 10,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const result = await response.json();
        console.log('  端點: /cgi/crm/v2/data/query');
        console.log('  對象: ActiveRecord');
        console.log('  結果:', result.errorCode === 0 ? '✅ 成功' : `❌ 失敗: ${result.errorMessage}`);
        
        if (result.errorCode === 0 && result.data && result.data.dataList) {
            console.log(`  找到 ${result.data.dataList.length} 條記錄`);
            if (result.data.dataList.length > 0) {
                console.log('  第一條記錄結構:');
                const firstRecord = result.data.dataList[0];
                Object.keys(firstRecord).slice(0, 5).forEach(key => {
                    console.log(`    ${key}: ${firstRecord[key]}`);
                });
            }
        }
    } catch (error) {
        console.log('  結果: ❌ 請求失敗:', error.message);
    }
}

// 測試2: 標準對象API - 不同參數格式
async function testFollowupAPI2(token, corpId, userId) {
    try {
        const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    dataObjectApiName: "ActiveRecord",
                    search_query_info: {
                        limit: 10,
                        offset: 0
                    }
                }
            })
        });
        
        const result = await response.json();
        console.log('  端點: /cgi/crm/v2/data/query');
        console.log('  對象: ActiveRecord (使用 dataObjectApiName)');
        console.log('  結果:', result.errorCode === 0 ? '✅ 成功' : `❌ 失敗: ${result.errorMessage}`);
        
        if (result.errorCode === 0 && result.data && result.data.dataList) {
            console.log(`  找到 ${result.data.dataList.length} 條記錄`);
        }
    } catch (error) {
        console.log('  結果: ❌ 請求失敗:', error.message);
    }
}

// 測試3: 自定義對象API
async function testFollowupAPI3(token, corpId, userId) {
    try {
        const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    dataObjectApiName: "ActiveRecord",
                    search_query_info: {
                        limit: 10,
                        offset: 0
                    }
                }
            })
        });
        
        const result = await response.json();
        console.log('  端點: /cgi/crm/custom/v2/data/query');
        console.log('  對象: ActiveRecord');
        console.log('  結果:', result.errorCode === 0 ? '✅ 成功' : `❌ 失敗: ${result.errorMessage}`);
        
        if (result.errorCode === 0 && result.data && result.data.dataList) {
            console.log(`  找到 ${result.data.dataList.length} 條記錄`);
        }
    } catch (error) {
        console.log('  結果: ❌ 請求失敗:', error.message);
    }
}

// 測試4: 查詢興安西相關跟進記錄
async function testFollowupAPI4(token, corpId, userId) {
    try {
        const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    apiName: "ActiveRecord",
                    search_query_info: {
                        limit: 20,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}],
                        filters: [{
                            field: "description",
                            operator: "CONTAINS",
                            value: "興安西"
                        }]
                    }
                }
            })
        });
        
        const result = await response.json();
        console.log('  端點: /cgi/crm/v2/data/query');
        console.log('  對象: ActiveRecord (搜索興安西)');
        console.log('  結果:', result.errorCode === 0 ? '✅ 成功' : `❌ 失敗: ${result.errorMessage}`);
        
        if (result.errorCode === 0 && result.data && result.data.dataList) {
            console.log(`  找到 ${result.data.dataList.length} 條記錄`);
            
            // 檢查是否有包含興安西的記錄
            const xinganxiRecords = result.data.dataList.filter(record => {
                return Object.values(record).some(value => 
                    value && typeof value === 'string' && value.includes('興安西')
                );
            });
            console.log(`  其中包含"興安西"的記錄: ${xinganxiRecords.length} 條`);
        }
    } catch (error) {
        console.log('  結果: ❌ 請求失敗:', error.message);
    }
}

// 測試5: 不同的數據查詢方式
async function testFollowupAPI5(token, corpId, userId) {
    // 嘗試不同的對象名稱
    const objectNames = [
        "ActiveRecordObj",
        "FollowRecord",
        "FollowUp",
        "ActivityRecord",
        "CommunicationRecord"
    ];
    
    for (const objectName of objectNames) {
        try {
            const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    corpId: corpId,
                    corpAccessToken: token,
                    currentOpenUserId: userId,
                    data: {
                        apiName: objectName,
                        search_query_info: {
                            limit: 5,
                            offset: 0
                        }
                    }
                })
            });
            
            const result = await response.json();
            console.log(`  對象 ${objectName}:`, result.errorCode === 0 ? '✅ 成功' : `❌ ${result.errorMessage}`);
            
            if (result.errorCode === 0 && result.data && result.data.dataList) {
                console.log(`    找到 ${result.data.dataList.length} 條記錄`);
                if (result.data.dataList.length > 0) {
                    console.log(`    第一條記錄的欄位: ${Object.keys(result.data.dataList[0]).slice(0, 3).join(', ')}`);
                }
            }
        } catch (error) {
            console.log(`  對象 ${objectName}: ❌ 請求失敗`);
        }
    }
}

// 額外測試：嘗試獲取所有可用的數據對象
async function testAvailableObjects(token, corpId, userId) {
    console.log('\n=== 額外測試：獲取可用的數據對象 ===');
    
    try {
        // 嘗試獲取對象列表的API
        const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/describe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId
            })
        });
        
        const result = await response.json();
        console.log('獲取對象列表結果:', result.errorCode === 0 ? '✅ 成功' : `❌ 失敗: ${result.errorMessage}`);
        
        if (result.errorCode === 0 && result.data) {
            console.log('可用的對象:', result.data);
        }
    } catch (error) {
        console.log('獲取對象列表失敗:', error.message);
    }
}

// 執行測試
console.log('開始測試跟進記錄API...\n');
testFollowupRecords().then(() => {
    console.log('\n測試完成！');
}).catch(error => {
    console.error('測試過程中發生錯誤:', error);
});