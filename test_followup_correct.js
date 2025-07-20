// 測試跟進記錄API - 使用正確的標準對象格式
const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function testCorrectFollowup() {
    console.log('=== 測試跟進記錄API (正確格式) ===\n');
    
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
        
        // Step 3: 直接查詢跟進記錄 (標準對象)
        console.log('3. 查詢跟進記錄（標準對象）...');
        
        // 商機ID
        const opportunityId = "650fe201d184e50001102aee"; // 勝興-興安西-2024
        
        // 嘗試標準對象查詢端點 - 不使用dataObjectApiName
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
        
        const followupResult = await followupResponse.json();
        console.log('跟進記錄查詢響應:', JSON.stringify(followupResult, null, 2));
        
        if (followupResult.errorCode === 0) {
            console.log(`\n✅ 跟進記錄查詢成功！獲取到 ${followupResult.data?.dataList?.length || 0} 條記錄`);
            
            if (followupResult.data?.dataList?.length > 0) {
                const firstRecord = followupResult.data.dataList[0];
                console.log('\n第一條跟進記錄:');
                console.log('- ID:', firstRecord._id);
                console.log('- 創建時間:', new Date(firstRecord.create_time).toLocaleString());
                console.log('- 所有欄位:', Object.keys(firstRecord).join(', '));
                
                // 檢查外部顯示相關欄位
                const possibleExternalFields = [
                    'external_display', 
                    'field_external_display', 
                    'is_external_display',
                    'external_show',
                    'show_external',
                    'public_display',
                    'visible_external',
                    'field_waibu_xianshi', // 中文字段可能的API名稱
                    'field_external_show',
                    'field_show_external'
                ];
                
                console.log('\n外部顯示相關欄位:');
                possibleExternalFields.forEach(field => {
                    if (firstRecord[field] !== undefined) {
                        console.log(`- ${field}:`, firstRecord[field]);
                    }
                });
                
                // 顯示完整的前2條記錄
                console.log('\n完整前2條記錄:');
                followupResult.data.dataList.slice(0, 2).forEach((record, index) => {
                    console.log(`\n=== 記錄 ${index + 1} ===`);
                    console.log(JSON.stringify(record, null, 2));
                });
            }
        } else {
            console.log(`❌ 跟進記錄查詢失敗: ${followupResult.errorMessage}`);
            
            // 如果失敗，嘗試先查詢所有跟進記錄
            console.log('\n4. 嘗試查詢所有跟進記錄（不過濾商機）...');
            const allFollowupResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/data/query`, {
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
                            offset: 0,
                            orders: [{fieldName: "create_time", isAsc: "false"}]
                        }
                    }
                })
            });
            
            const allFollowupResult = await allFollowupResponse.json();
            console.log('所有跟進記錄查詢響應:', JSON.stringify(allFollowupResult, null, 2));
            
            if (allFollowupResult.errorCode === 0 && allFollowupResult.data?.dataList?.length > 0) {
                console.log(`\n✅ 查詢所有跟進記錄成功！獲取到 ${allFollowupResult.data.dataList.length} 條記錄`);
                
                // 檢查第一條記錄的欄位
                const firstRecord = allFollowupResult.data.dataList[0];
                console.log('\n第一條記錄的所有欄位:');
                Object.keys(firstRecord).forEach(key => {
                    console.log(`- ${key}:`, firstRecord[key]);
                });
                
                // 查找關聯該商機的記錄
                console.log('\n查找關聯商機的記錄:');
                allFollowupResult.data.dataList.forEach((record, index) => {
                    if (record.opportunity_id === opportunityId || 
                        record.related_opportunity === opportunityId ||
                        record.opportunity === opportunityId) {
                        console.log(`找到關聯記錄 ${index + 1}:`, record);
                    }
                });
            }
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

// 執行測試
testCorrectFollowup();