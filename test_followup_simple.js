// 測試跟進記錄API - 使用成功的維修單API格式
const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function testSimpleFollowup() {
    console.log('=== 測試跟進記錄API (簡化版) ===\n');
    
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
        
        // Step 3: 使用和維修單相同的API格式查詢商機
        console.log('3. 查詢商機數據...');
        const opportunityResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/data/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    dataType: "OpportunityObj",
                    search_query_info: {
                        limit: 10,
                        offset: 0,
                        filters: [
                            {
                                field_name: "name",
                                field_values: ["勝興-興安西-2024"],
                                operator: "EQ"
                            }
                        ]
                    }
                }
            })
        });
        
        const opportunityResult = await opportunityResponse.json();
        console.log('商機查詢響應:', JSON.stringify(opportunityResult, null, 2));
        
        if (opportunityResult.errorCode === 0 && opportunityResult.data?.dataList?.length > 0) {
            const opportunity = opportunityResult.data.dataList[0];
            console.log(`\n✅ 找到商機: ${opportunity.name}, ID: ${opportunity._id}`);
            
            // Step 4: 查詢跟進記錄 (使用和維修單相同的格式)
            console.log('\n4. 查詢跟進記錄...');
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
                                    field_values: [opportunity._id],
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
                    
                    // 顯示完整的前3條記錄
                    console.log('\n完整前3條記錄:');
                    followupResult.data.dataList.slice(0, 3).forEach((record, index) => {
                        console.log(`\n=== 記錄 ${index + 1} ===`);
                        console.log(JSON.stringify(record, null, 2));
                    });
                    
                    // 嘗試查詢有外部顯示=顯示的記錄
                    console.log('\n5. 查詢外部顯示=顯示的記錄...');
                    
                    // 嘗試不同的外部顯示字段名稱
                    const externalFieldsToTry = ['external_display', 'field_external_display', 'is_external_display'];
                    
                    for (const externalField of externalFieldsToTry) {
                        console.log(`\n嘗試外部顯示字段: ${externalField}`);
                        
                        const externalFollowupResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/data/query`, {
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
                                                field_values: [opportunity._id],
                                                operator: "EQ"
                                            },
                                            {
                                                field_name: externalField,
                                                field_values: ["顯示"],
                                                operator: "EQ"
                                            }
                                        ],
                                        orders: [{fieldName: "create_time", isAsc: "false"}]
                                    }
                                }
                            })
                        });
                        
                        const externalFollowupResult = await externalFollowupResponse.json();
                        console.log(`${externalField} 查詢響應:`, JSON.stringify(externalFollowupResult, null, 2));
                        
                        if (externalFollowupResult.errorCode === 0 && externalFollowupResult.data?.dataList?.length > 0) {
                            console.log(`\n✅ 找到外部顯示字段: ${externalField}`);
                            console.log(`獲取到 ${externalFollowupResult.data.dataList.length} 條外部顯示記錄`);
                            break;
                        }
                    }
                }
            } else {
                console.log(`❌ 跟進記錄查詢失敗: ${followupResult.errorMessage}`);
            }
        } else {
            console.log('❌ 找不到商機 "勝興-興安西-2024"');
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

// 執行測試
testSimpleFollowup();