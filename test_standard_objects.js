// 測試標準對象API - 跟進記錄、商機等
const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function testStandardObjects() {
    console.log('=== 測試標準對象API ===\n');
    
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
        
        // Step 3: 測試不同的標準對象端點
        console.log('3. 測試標準對象端點...\n');
        
        const standardEndpoints = [
            {
                name: '標準數據查詢端點V1',
                url: '/cgi/crm/data/query',
                bodyFormat: 'dataType'
            },
            {
                name: '標準數據查詢端點V2',
                url: '/cgi/crm/v2/data/query',
                bodyFormat: 'dataType'
            },
            {
                name: '通用數據查詢端點',
                url: '/cgi/data/query',
                bodyFormat: 'dataType'
            }
        ];
        
        for (const endpoint of standardEndpoints) {
            console.log(`\n=== 測試 ${endpoint.name} ===`);
            console.log(`端點: ${endpoint.url}`);
            
            try {
                // 構建請求體
                const requestBody = {
                    corpId: corpId,
                    corpAccessToken: token,
                    currentOpenUserId: userId
                };
                
                if (endpoint.bodyFormat === 'dataType') {
                    requestBody.data = {
                        dataType: "ActiveRecordObj",
                        search_query_info: {
                            limit: 5,
                            offset: 0,
                            orders: [{fieldName: "create_time", isAsc: "false"}]
                        }
                    };
                }
                
                const response = await fetch(`${CONFIG.baseUrl}${endpoint.url}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });
                
                const result = await response.json();
                console.log(`響應:`, JSON.stringify(result, null, 2));
                
                if (result.errorCode === 0) {
                    console.log(`\\n✅ ${endpoint.name} 成功！`);
                    
                    if (result.data?.dataList?.length > 0) {
                        const firstRecord = result.data.dataList[0];
                        console.log('\\n第一條記錄:');
                        console.log('- ID:', firstRecord._id);
                        console.log('- 創建時間:', new Date(firstRecord.create_time).toLocaleString());
                        console.log('- 所有欄位:', Object.keys(firstRecord).join(', '));
                        
                        // 檢查商機關聯欄位
                        const opportunityFields = Object.keys(firstRecord).filter(key => 
                            key.toLowerCase().includes('opportunity') ||
                            key.toLowerCase().includes('shangji') ||
                            key.includes('_id')
                        );
                        
                        if (opportunityFields.length > 0) {
                            console.log('\\n商機相關欄位:');
                            opportunityFields.forEach(field => {
                                console.log(`  ${field}:`, firstRecord[field]);
                            });
                        }
                        
                        // 成功找到端點，進行進一步測試
                        console.log('\\n=== 嘗試查詢特定商機的跟進記錄 ===');
                        const opportunityId = "650fe201d184e50001102aee"; // 勝興-興安西-2024
                        
                        // 嘗試不同的商機關聯欄位名稱
                        const opportunityFieldNames = ['opportunity_id', 'related_opportunity', 'opportunity', 'relatedOpportunity'];
                        
                        for (const fieldName of opportunityFieldNames) {
                            console.log(`\\n嘗試使用商機欄位: ${fieldName}`);
                            
                            const filteredBody = {
                                corpId: corpId,
                                corpAccessToken: token,
                                currentOpenUserId: userId,
                                data: {
                                    dataType: "ActiveRecordObj",
                                    search_query_info: {
                                        limit: 10,
                                        offset: 0,
                                        filters: [
                                            {
                                                field_name: fieldName,
                                                field_values: [opportunityId],
                                                operator: "EQ"
                                            }
                                        ],
                                        orders: [{fieldName: "create_time", isAsc: "false"}]
                                    }
                                }
                            };
                            
                            const filteredResponse = await fetch(`${CONFIG.baseUrl}${endpoint.url}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(filteredBody)
                            });
                            
                            const filteredResult = await filteredResponse.json();
                            console.log(`${fieldName} 過濾結果:`, JSON.stringify(filteredResult, null, 2));
                            
                            if (filteredResult.errorCode === 0 && filteredResult.data?.dataList?.length > 0) {
                                console.log(`\\n✅ 找到正確的商機關聯欄位: ${fieldName}`);
                                console.log(`獲取到 ${filteredResult.data.dataList.length} 條關聯記錄`);
                                break;
                            }
                        }
                        
                        break; // 成功找到工作的端點，跳出循環
                    }
                } else {
                    console.log(`❌ ${endpoint.name} 失敗: ${result.errorMessage}`);
                }
                
            } catch (error) {
                console.log(`❌ ${endpoint.name} 錯誤:`, error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

// 執行測試
testStandardObjects();