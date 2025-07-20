// 測試紛享銷客API連接
const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

// 測試跟進記錄API
async function testFollowupRecords() {
    console.log('=== 測試跟進記錄API ===\n');
    
    try {
        // Step 1: 獲取Token
        console.log('1. 獲取企業訪問令牌...');
        const tokenResponse = await fetch(`${CONFIG.baseUrl}/cgi/corpAccessToken/get/V2`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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
            headers: {
                'Content-Type': 'application/json',
            },
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
        
        // Step 3: 查詢跟進記錄 - 嘗試不同的端點
        console.log('3. 查詢跟進記錄...');
        
        // 先嘗試標準API端點
        let followupResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/data/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    dataType: "ActiveRecordObj",
                    search_query_info: {
                        limit: 20,
                        offset: 0,
                        filters: [
                            {
                                field_name: "opportunity_id",
                                field_values: ["650fe201d184e50001102aee"], // 勝興-興安西-2024的ID
                                operator: "EQ"
                            }
                        ],
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        let followupResult = await followupResponse.json();
        console.log('跟進記錄查詢響應 (標準端點):', JSON.stringify(followupResult, null, 2));
        
        // 如果標準端點失敗，嘗試其他端點
        if (followupResult.errorCode !== 0) {
            console.log('\n嘗試其他端點...');
            
            // 嘗試用客戶端點查詢
            followupResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    corpId: corpId,
                    corpAccessToken: token,
                    currentOpenUserId: userId,
                    data: {
                        dataType: "Account",
                        search_query_info: {
                            limit: 5,
                            offset: 0,
                            orders: [{fieldName: "create_time", isAsc: "false"}]
                        }
                    }
                })
            });
            
            followupResult = await followupResponse.json();
            console.log('客戶查詢響應:', JSON.stringify(followupResult, null, 2));
        }
        
        if (followupResult.errorCode === 0) {
            console.log(`\n✅ 跟進記錄查詢成功！獲取到 ${followupResult.data?.dataList?.length || 0} 條記錄`);
            
            if (followupResult.data?.dataList?.length > 0) {
                const firstRecord = followupResult.data.dataList[0];
                console.log('\n第一條跟進記錄關鍵欄位:');
                console.log('- ID:', firstRecord._id);
                console.log('- 創建時間:', new Date(firstRecord.create_time).toLocaleString());
                console.log('- 所有欄位:', Object.keys(firstRecord).join(', '));
                
                // 顯示可能的外部顯示欄位
                const externalFields = ['external_display', 'field_external_display', 'is_external_display'];
                externalFields.forEach(field => {
                    if (firstRecord[field] !== undefined) {
                        console.log(`- ${field}:`, firstRecord[field]);
                    }
                });
            }
        } else {
            throw new Error(`跟進記錄查詢失敗: ${followupResult.errorMessage}`);
        }
        
    } catch (error) {
        console.error('❌ 跟進記錄API測試失敗:', error.message);
        
        // 嘗試查詢所有跟進記錄看看結構
        console.log('\n=== 嘗試查詢所有跟進記錄 ===');
        await testAllFollowupRecords();
    }
}

// 測試查詢所有跟進記錄
async function testAllFollowupRecords() {
    try {
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
        const token = tokenResult.corpAccessToken;
        const corpId = tokenResult.corpId;
        
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
        const userId = userResult.empList[0].openUserId;
        
        // 查詢所有跟進記錄
        const allFollowupResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    dataType: "ActiveRecordObj",
                    search_query_info: {
                        limit: 5,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const allFollowupResult = await allFollowupResponse.json();
        console.log('所有跟進記錄查詢響應:', JSON.stringify(allFollowupResult, null, 2));
        
    } catch (error) {
        console.error('查詢所有跟進記錄失敗:', error.message);
    }
}

async function testAPIConnection() {
    console.log('開始測試API連接...\n');
    
    try {
        // Step 1: 獲取Token
        console.log('1. 獲取企業訪問令牌...');
        const tokenResponse = await fetch(`${CONFIG.baseUrl}/cgi/corpAccessToken/get/V2`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                appId: CONFIG.appId,
                appSecret: CONFIG.appSecret,
                permanentCode: CONFIG.permanentCode
            })
        });
        
        const tokenResult = await tokenResponse.json();
        console.log('Token響應:', tokenResult);
        
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                mobile: "17675662629"
            })
        });
        
        const userResult = await userResponse.json();
        console.log('用戶響應:', userResult);
        
        if (userResult.errorCode !== 0) {
            throw new Error(`用戶獲取失敗: ${userResult.errorMessage}`);
        }
        
        const userId = userResult.empList[0].openUserId;
        console.log('✅ 用戶信息獲取成功\n');
        
        // Step 3: 查詢維修單數據
        console.log('3. 查詢維修單數據...');
        const queryResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    dataObjectApiName: "on_site_signature__c",
                    search_query_info: {
                        limit: 5,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const queryResult = await queryResponse.json();
        console.log('查詢響應:', JSON.stringify(queryResult, null, 2));
        
        if (queryResult.errorCode === 0 && queryResult.data.dataList) {
            console.log(`\n✅ API測試成功！獲取到 ${queryResult.data.dataList.length} 條維修單記錄`);
            
            // 顯示第一條記錄的關鍵欄位
            if (queryResult.data.dataList.length > 0) {
                const firstRecord = queryResult.data.dataList[0];
                console.log('\n第一條記錄關鍵欄位:');
                console.log('- 編號:', firstRecord.name);
                console.log('- 狀態:', firstRecord.life_status__r || firstRecord.life_status);
                console.log('- 創建時間:', new Date(firstRecord.create_time).toLocaleString());
                console.log('- 所有欄位:', Object.keys(firstRecord).join(', '));
            }
        }
        
    } catch (error) {
        console.error('❌ API測試失敗:', error.message);
    }
}

// 執行測試
// testAPIConnection();

// 執行跟進記錄測試
testFollowupRecords();