// 測試銷售記錄API - 基於Excel文件中的資訊
// 根據文件名判斷，這應該是關於銷售記錄(SalesRecord)的API文檔

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function testSalesRecordAPI() {
    console.log('=== 測試銷售記錄API ===\n');
    
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
        
        // Step 3: 測試銷售記錄相關API
        console.log('3. 測試銷售記錄API...\n');
        
        // 測試可能的對象名稱
        const possibleObjectNames = [
            'SalesRecord',         // 銷售記錄
            'SalesRecordObj',      // 銷售記錄對象
            'SaleRecord',          // 銷售記錄（單數）
            'ActiveRecord',        // 活動記錄
            'ActiveRecordObj',     // 活動記錄對象
            'FollowRecord',        // 跟進記錄
            'FollowRecordObj',     // 跟進記錄對象
            'CommunicationRecord', // 溝通記錄
            'ActivityRecord',      // 活動記錄
            'VisitRecord',         // 拜訪記錄
            'CallRecord'           // 通話記錄
        ];
        
        // 測試標準對象API
        console.log('--- 測試標準對象API ---');
        for (const objectName of possibleObjectNames) {
            await testStandardAPI(token, corpId, userId, objectName);
        }
        
        // 測試自定義對象API
        console.log('\n--- 測試自定義對象API ---');
        for (const objectName of possibleObjectNames) {
            await testCustomAPI(token, corpId, userId, objectName);
        }
        
        // 測試不同的查詢方式
        console.log('\n--- 測試不同的查詢參數 ---');
        await testDifferentQueryParams(token, corpId, userId);
        
        // 嘗試獲取對象描述
        console.log('\n--- 嘗試獲取對象描述 ---');
        await testObjectDescribe(token, corpId, userId);
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

// 測試標準對象API
async function testStandardAPI(token, corpId, userId, objectName) {
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
                        limit: 2,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const result = await response.json();
        if (result.errorCode === 0) {
            console.log(`✅ ${objectName}: 成功 - 找到 ${result.data?.dataList?.length || 0} 條記錄`);
            if (result.data?.dataList?.length > 0) {
                const fields = Object.keys(result.data.dataList[0]);
                console.log(`   欄位: ${fields.slice(0, 5).join(', ')}...`);
            }
        } else {
            console.log(`❌ ${objectName}: ${result.errorMessage}`);
        }
    } catch (error) {
        console.log(`❌ ${objectName}: 請求失敗`);
    }
}

// 測試自定義對象API
async function testCustomAPI(token, corpId, userId, objectName) {
    try {
        const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    dataObjectApiName: objectName,
                    search_query_info: {
                        limit: 2,
                        offset: 0
                    }
                }
            })
        });
        
        const result = await response.json();
        if (result.errorCode === 0) {
            console.log(`✅ ${objectName}: 成功 - 找到 ${result.data?.dataList?.length || 0} 條記錄`);
        } else if (result.errorCode !== 10002) { // 10002 通常表示對象不存在
            console.log(`❌ ${objectName}: ${result.errorMessage}`);
        }
    } catch (error) {
        // 靜默處理，避免太多錯誤輸出
    }
}

// 測試不同的查詢參數
async function testDifferentQueryParams(token, corpId, userId) {
    // 測試使用 dataObjectApiName 替代 apiName
    console.log('\n測試1: 使用 dataObjectApiName 參數');
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
                        limit: 5,
                        offset: 0
                    }
                }
            })
        });
        
        const result = await response.json();
        console.log('結果:', result.errorCode === 0 ? '✅ 成功' : `❌ ${result.errorMessage}`);
    } catch (error) {
        console.log('結果: ❌ 請求失敗');
    }
    
    // 測試不帶 data 包裝的參數
    console.log('\n測試2: 不使用 data 包裝');
    try {
        const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                apiName: "ActiveRecord",
                search_query_info: {
                    limit: 5,
                    offset: 0
                }
            })
        });
        
        const result = await response.json();
        console.log('結果:', result.errorCode === 0 ? '✅ 成功' : `❌ ${result.errorMessage}`);
    } catch (error) {
        console.log('結果: ❌ 請求失敗');
    }
    
    // 測試查詢與興安西相關的記錄
    console.log('\n測試3: 查詢興安西相關記錄');
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
                        limit: 50,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const result = await response.json();
        if (result.errorCode === 0 && result.data?.dataList) {
            console.log(`✅ 成功 - 找到 ${result.data.dataList.length} 條記錄`);
            
            // 搜索包含興安西的記錄
            const xinganxiRecords = result.data.dataList.filter(record => {
                return Object.values(record).some(value => 
                    value && typeof value === 'string' && value.includes('興安西')
                );
            });
            
            console.log(`   其中包含"興安西"的記錄: ${xinganxiRecords.length} 條`);
            
            if (xinganxiRecords.length > 0) {
                console.log('\n   興安西相關記錄示例:');
                xinganxiRecords.slice(0, 2).forEach((record, idx) => {
                    console.log(`   記錄${idx + 1}:`);
                    Object.entries(record).forEach(([key, value]) => {
                        if (value && typeof value === 'string' && value.includes('興安西')) {
                            console.log(`     ${key}: ${value}`);
                        }
                    });
                });
            }
        } else {
            console.log(`❌ ${result.errorMessage}`);
        }
    } catch (error) {
        console.log('結果: ❌ 請求失敗');
    }
}

// 嘗試獲取對象描述
async function testObjectDescribe(token, corpId, userId) {
    const endpoints = [
        '/cgi/crm/v2/data/describe',
        '/cgi/crm/v2/metadata/describe',
        '/cgi/crm/custom/v2/metadata/describe'
    ];
    
    for (const endpoint of endpoints) {
        console.log(`\n測試端點: ${endpoint}`);
        try {
            const response = await fetch(`${CONFIG.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    corpId: corpId,
                    corpAccessToken: token,
                    currentOpenUserId: userId
                })
            });
            
            const result = await response.json();
            console.log('結果:', result.errorCode === 0 ? '✅ 成功' : `❌ ${result.errorMessage}`);
            
            if (result.errorCode === 0 && result.data) {
                console.log('返回的數據結構:', Object.keys(result.data).slice(0, 5));
            }
        } catch (error) {
            console.log('結果: ❌ 請求失敗');
        }
    }
}

// 執行測試
console.log('開始測試銷售記錄API...\n');
console.log('提示：由於Excel文件名為"銷售記錄對象及欄位API.xlsx"，');
console.log('我們將測試各種可能的銷售記錄和活動記錄相關的API對象。\n');

testSalesRecordAPI().then(() => {
    console.log('\n測試完成！');
}).catch(error => {
    console.error('測試過程中發生錯誤:', error);
});