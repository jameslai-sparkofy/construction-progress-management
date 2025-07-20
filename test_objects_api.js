// 測試案場和跟進記錄API - 區分預設對象和自定義對象
const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function testObjectsAPI() {
    console.log('=== 測試案場和跟進記錄API ===\n');
    
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
        
        // Step 3: 測試案場（自定義對象）
        console.log('3. 測試案場（自定義對象）- object_8W9cb__c');
        const siteResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    dataObjectApiName: "object_8W9cb__c",
                    search_query_info: {
                        limit: 10,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const siteResult = await siteResponse.json();
        console.log('案場查詢響應:', JSON.stringify(siteResult, null, 2));
        
        if (siteResult.errorCode === 0) {
            console.log(`\n✅ 案場查詢成功！獲取到 ${siteResult.data?.dataList?.length || 0} 條記錄`);
            
            if (siteResult.data?.dataList?.length > 0) {
                const firstSite = siteResult.data.dataList[0];
                console.log('\n第一個案場:');
                console.log('- ID:', firstSite._id);
                console.log('- 名稱:', firstSite.name || '未知');
                console.log('- 創建時間:', new Date(firstSite.create_time).toLocaleString());
                console.log('- 所有欄位:', Object.keys(firstSite).join(', '));
            }
        } else {
            console.log(`❌ 案場查詢失敗: ${siteResult.errorMessage}`);
        }
        
        // Step 4: 測試跟進記錄（預設對象）- 使用標準端點
        console.log('\n4. 測試跟進記錄（預設對象）- ActiveRecordObj');
        
        // 嘗試標準數據查詢端點
        const followupResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/data/query`, {
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
                        limit: 10,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const followupResult = await followupResponse.json();
        console.log('跟進記錄查詢響應（標準端點）:', JSON.stringify(followupResult, null, 2));
        
        if (followupResult.errorCode === 0) {
            console.log(`\n✅ 跟進記錄查詢成功！獲取到 ${followupResult.data?.dataList?.length || 0} 條記錄`);
            
            if (followupResult.data?.dataList?.length > 0) {
                const firstRecord = followupResult.data.dataList[0];
                console.log('\n第一條跟進記錄:');
                console.log('- ID:', firstRecord._id);
                console.log('- 創建時間:', new Date(firstRecord.create_time).toLocaleString());
                console.log('- 所有欄位:', Object.keys(firstRecord).join(', '));
                
                // 檢查外部顯示和商機關聯欄位
                const importantFields = [
                    'external_display', 'field_external_display', 'is_external_display',
                    'opportunity_id', 'opportunity', 'related_opportunity',
                    'content', 'follow_up_content', 'description'
                ];
                
                console.log('\n重要欄位:');
                importantFields.forEach(field => {
                    if (firstRecord[field] !== undefined) {
                        console.log(`- ${field}:`, firstRecord[field]);
                    }
                });
                
                // 顯示完整第一條記錄
                console.log('\n完整第一條記錄:');
                console.log(JSON.stringify(firstRecord, null, 2));
            }
        } else {
            console.log(`❌ 跟進記錄查詢失敗: ${followupResult.errorMessage}`);
            
            // 如果標準端點失敗，嘗試其他可能的端點
            console.log('\n嘗試其他跟進記錄端點...');
            
            const alternativeEndpoints = [
                '/cgi/crm/activerecord/query',
                '/cgi/crm/followup/query',
                '/cgi/crm/record/query'
            ];
            
            for (const endpoint of alternativeEndpoints) {
                console.log(`\n嘗試端點: ${endpoint}`);
                try {
                    const altResponse = await fetch(`${CONFIG.baseUrl}${endpoint}`, {
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
                                    limit: 5,
                                    offset: 0
                                }
                            }
                        })
                    });
                    
                    const altResult = await altResponse.json();
                    console.log(`${endpoint} 響應:`, JSON.stringify(altResult, null, 2));
                    
                    if (altResult.errorCode === 0) {
                        console.log(`\n✅ 找到正確的跟進記錄端點: ${endpoint}`);
                        break;
                    }
                } catch (error) {
                    console.log(`${endpoint} 錯誤:`, error.message);
                }
            }
        }
        
        // Step 5: 如果找到商機，嘗試查詢該商機的跟進記錄
        console.log('\n5. 查詢指定商機的跟進記錄...');
        
        // 使用已知的商機ID
        const opportunityId = "650fe201d184e50001102aee"; // 勝興-興安西-2024
        
        const specificFollowupResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/data/query`, {
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
                                field_values: [opportunityId],
                                operator: "EQ"
                            }
                        ],
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const specificFollowupResult = await specificFollowupResponse.json();
        console.log('特定商機跟進記錄響應:', JSON.stringify(specificFollowupResult, null, 2));
        
        if (specificFollowupResult.errorCode === 0 && specificFollowupResult.data?.dataList?.length > 0) {
            console.log(`\n✅ 找到興安西工程的跟進記錄！共 ${specificFollowupResult.data.dataList.length} 條`);
            
            // 檢查是否有外部顯示欄位
            specificFollowupResult.data.dataList.forEach((record, index) => {
                console.log(`\n--- 跟進記錄 ${index + 1} ---`);
                console.log('創建時間:', new Date(record.create_time).toLocaleString());
                
                // 檢查可能的外部顯示欄位
                const externalFields = Object.keys(record).filter(key => 
                    key.toLowerCase().includes('external') || 
                    key.toLowerCase().includes('display') ||
                    key.toLowerCase().includes('show') ||
                    key.toLowerCase().includes('public')
                );
                
                if (externalFields.length > 0) {
                    console.log('可能的外部顯示欄位:');
                    externalFields.forEach(field => {
                        console.log(`  ${field}:`, record[field]);
                    });
                }
            });
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

// 執行測試
testObjectsAPI();