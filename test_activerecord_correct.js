// 測試銷售記錄API - 使用正確的紛享銷客格式
const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function testActiveRecordAPI() {
    console.log('=== 測試銷售記錄API (ActiveRecordObj) ===\n');
    
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
        
        // Step 3: 查詢銷售記錄 - 使用正確的格式
        console.log('3. 查詢銷售記錄 (ActiveRecordObj)...');
        
        // 先獲取商機ID
        const opportunityId = "650fe201d184e50001102aee"; // 勝興-興安西-2024
        
        // 方法1: 使用 /cgi/crm/data/query 端點
        console.log('\n=== 方法1: 使用標準數據查詢端點 ===');
        const method1Response = await fetch(`${CONFIG.baseUrl}/cgi/crm/data/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                apiName: "crm.data.query",
                data: {
                    dataType: "ActiveRecordObj",
                    search_query_info: {
                        limit: 10,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const method1Result = await method1Response.json();
        console.log('方法1響應:', JSON.stringify(method1Result, null, 2));
        
        // 方法2: 使用 /cgi/crm/v2/data/query 端點
        console.log('\n=== 方法2: 使用V2數據查詢端點 ===');
        const method2Response = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                apiName: "crm.v2.data.query",
                data: {
                    dataType: "ActiveRecordObj",
                    search_query_info: {
                        limit: 10,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const method2Result = await method2Response.json();
        console.log('方法2響應:', JSON.stringify(method2Result, null, 2));
        
        // 方法3: 使用對象查詢API
        console.log('\n=== 方法3: 使用對象查詢API ===');
        const method3Response = await fetch(`${CONFIG.baseUrl}/cgi/crm/object/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                apiName: "crm.object.query",
                data: {
                    objectApiName: "ActiveRecordObj",
                    search_query_info: {
                        limit: 10,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const method3Result = await method3Response.json();
        console.log('方法3響應:', JSON.stringify(method3Result, null, 2));
        
        // 方法4: 使用find API (類似文檔中的示例)
        console.log('\n=== 方法4: 使用find API ===');
        const method4Response = await fetch(`${CONFIG.baseUrl}/cgi/crm/object/find`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                apiName: "crm.object.find",
                data: {
                    objectApiName: "ActiveRecordObj",
                    columns: ["_id", "name", "create_time", "opportunity_id", "related_object", "external_display"],
                    queryTemplate: {
                        logic: "AND",
                        filters: [
                            {
                                field_name: "create_time",
                                operator: "GTE",
                                field_values: ["2024-01-01"]
                            }
                        ]
                    },
                    limit: 10,
                    offset: 0
                }
            })
        });
        
        const method4Result = await method4Response.json();
        console.log('方法4響應:', JSON.stringify(method4Result, null, 2));
        
        // 檢查哪個方法成功
        const methods = [
            { name: '方法1', result: method1Result },
            { name: '方法2', result: method2Result },
            { name: '方法3', result: method3Result },
            { name: '方法4', result: method4Result }
        ];
        
        for (const method of methods) {
            if (method.result.errorCode === 0) {
                console.log(`\n✅ ${method.name} 成功！`);
                
                if (method.result.data && method.result.data.dataList && method.result.data.dataList.length > 0) {
                    console.log(`獲取到 ${method.result.data.dataList.length} 條銷售記錄`);
                    
                    const firstRecord = method.result.data.dataList[0];
                    console.log('\n第一條記錄的欄位:');
                    Object.keys(firstRecord).forEach(key => {
                        console.log(`- ${key}:`, firstRecord[key]);
                    });
                    
                    // 檢查是否有商機關聯欄位
                    console.log('\n商機關聯欄位檢查:');
                    const opportunityFields = ['opportunity_id', 'related_object', 'related_object_data', 'opportunity'];
                    opportunityFields.forEach(field => {
                        if (firstRecord[field] !== undefined) {
                            console.log(`✓ ${field}:`, firstRecord[field]);
                        }
                    });
                    
                    // 檢查外部顯示欄位
                    console.log('\n外部顯示欄位檢查:');
                    const externalFields = ['external_display', 'field_external_display', 'is_external_display', 'show_external'];
                    externalFields.forEach(field => {
                        if (firstRecord[field] !== undefined) {
                            console.log(`✓ ${field}:`, firstRecord[field]);
                        }
                    });
                    
                    // 如果找到了正確的格式，嘗試查詢特定商機的記錄
                    console.log('\n=== 嘗試查詢特定商機的銷售記錄 ===');
                    await testSpecificOpportunityRecords(method.name, corpId, token, userId, opportunityId);
                }
                
                break;
            } else {
                console.log(`❌ ${method.name} 失敗: ${method.result.errorMessage}`);
            }
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

// 測試特定商機的銷售記錄
async function testSpecificOpportunityRecords(successMethod, corpId, token, userId, opportunityId) {
    console.log(`使用 ${successMethod} 的格式查詢特定商機記錄...`);
    
    try {
        // 根據成功的方法確定端點和格式
        let endpoint = '';
        let requestBody = {};
        
        if (successMethod === '方法1') {
            endpoint = '/cgi/crm/data/query';
            requestBody = {
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                apiName: "crm.data.query",
                data: {
                    dataType: "ActiveRecordObj",
                    search_query_info: {
                        limit: 20,
                        offset: 0,
                        filters: [
                            {
                                field_name: "opportunity_id",
                                field_values: [opportunityId],
                                operator: "EQ"
                            }
                        ],
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            };
        } else if (successMethod === '方法4') {
            endpoint = '/cgi/crm/object/find';
            requestBody = {
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                apiName: "crm.object.find",
                data: {
                    objectApiName: "ActiveRecordObj",
                    columns: ["_id", "name", "create_time", "opportunity_id", "related_object", "external_display"],
                    queryTemplate: {
                        logic: "AND",
                        filters: [
                            {
                                field_name: "opportunity_id",
                                operator: "EQ",
                                field_values: [opportunityId]
                            }
                        ]
                    },
                    limit: 20,
                    offset: 0
                }
            };
        }
        
        const response = await fetch(`${CONFIG.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        const result = await response.json();
        console.log('特定商機記錄查詢結果:', JSON.stringify(result, null, 2));
        
        if (result.errorCode === 0 && result.data && result.data.dataList) {
            console.log(`✅ 找到 ${result.data.dataList.length} 條關聯記錄`);
            
            // 進一步測試外部顯示過濾
            console.log('\n=== 測試外部顯示過濾 ===');
            const externalDisplayFields = ['external_display', 'field_external_display', 'is_external_display'];
            
            for (const field of externalDisplayFields) {
                await testExternalDisplayFilter(endpoint, requestBody, field, '顯示');
            }
        }
        
    } catch (error) {
        console.error('特定商機記錄查詢失敗:', error.message);
    }
}

// 測試外部顯示過濾
async function testExternalDisplayFilter(endpoint, baseRequestBody, fieldName, fieldValue) {
    console.log(`測試外部顯示欄位: ${fieldName} = ${fieldValue}`);
    
    try {
        const requestBody = JSON.parse(JSON.stringify(baseRequestBody));
        
        // 添加外部顯示過濾條件
        if (requestBody.data.search_query_info) {
            requestBody.data.search_query_info.filters.push({
                field_name: fieldName,
                field_values: [fieldValue],
                operator: "EQ"
            });
        } else if (requestBody.data.queryTemplate) {
            requestBody.data.queryTemplate.filters.push({
                field_name: fieldName,
                operator: "EQ",
                field_values: [fieldValue]
            });
        }
        
        const response = await fetch(`${CONFIG.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        const result = await response.json();
        console.log(`${fieldName} 過濾結果:`, JSON.stringify(result, null, 2));
        
        if (result.errorCode === 0 && result.data && result.data.dataList) {
            console.log(`✅ 外部顯示過濾成功！找到 ${result.data.dataList.length} 條記錄`);
        }
        
    } catch (error) {
        console.error(`外部顯示過濾失敗 (${fieldName}):`, error.message);
    }
}

// 執行測試
testActiveRecordAPI();