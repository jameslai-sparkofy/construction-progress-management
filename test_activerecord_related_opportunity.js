// 測試跟進記錄的關聯對象 - 查找與勝興-興安西-2024商機相關的記錄

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function testRelatedOpportunity() {
    console.log('=== 測試跟進記錄關聯商機 ===\n');
    
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
        
        // Step 3: 先找到勝興-興安西-2024商機的ID
        console.log('3. 查找勝興-興安西-2024商機...');
        const opportunityResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    apiName: "OpportunityObj",
                    search_query_info: {
                        limit: 100,
                        offset: 0
                    }
                }
            })
        });
        
        const opportunityResult = await opportunityResponse.json();
        let targetOpportunityId = null;
        
        if (opportunityResult.errorCode === 0 && opportunityResult.data) {
            const opportunities = opportunityResult.data.dataList || [];
            const targetOpp = opportunities.find(opp => 
                opp.name && opp.name.includes('勝興') && 
                opp.name.includes('興安西') && 
                opp.name.includes('2024')
            );
            
            if (targetOpp) {
                targetOpportunityId = targetOpp._id;
                console.log(`✅ 找到商機: ${targetOpp.name}`);
                console.log(`   商機ID: ${targetOpportunityId}\n`);
            } else {
                console.log('❌ 未找到勝興-興安西-2024商機\n');
            }
        }
        
        // Step 4: 查詢跟進記錄，分析關聯對象
        console.log('4. 查詢跟進記錄並分析關聯對象...\n');
        
        let offset = 0;
        let hasMore = true;
        let allRecords = [];
        let relatedToXinganxi = [];
        
        while (hasMore && offset < 500) {
            const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    corpId: corpId,
                    corpAccessToken: token,
                    currentOpenUserId: userId,
                    data: {
                        apiName: "ActiveRecordObj",
                        search_query_info: {
                            limit: 100,
                            offset: offset,
                            orders: [{fieldName: "create_time", isAsc: "false"}]
                        }
                    }
                })
            });
            
            const result = await response.json();
            
            if (result.errorCode === 0 && result.data) {
                const records = result.data.dataList || [];
                allRecords = allRecords.concat(records);
                
                if (records.length < 100) {
                    hasMore = false;
                } else {
                    offset += 100;
                }
                
                console.log(`已查詢 ${allRecords.length} 條跟進記錄...`);
            } else {
                hasMore = false;
            }
        }
        
        console.log(`\n總共獲取 ${allRecords.length} 條跟進記錄\n`);
        
        // 分析關聯對象
        console.log('=== 關聯對象分析 ===');
        const relatedObjectTypes = {};
        const relatedApiNames = {};
        
        allRecords.forEach(record => {
            // 檢查 related_object 欄位
            if (record.related_object) {
                const objType = typeof record.related_object === 'object' ? 
                    (record.related_object.api_name || record.related_object.type || 'object') : 
                    record.related_object;
                relatedObjectTypes[objType] = (relatedObjectTypes[objType] || 0) + 1;
                
                // 如果是對象，檢查是否包含興安西
                if (typeof record.related_object === 'object' && record.related_object.name) {
                    if (record.related_object.name.includes('興安西')) {
                        relatedToXinganxi.push(record);
                    }
                }
            }
            
            // 檢查 related_api_names 欄位
            if (record.related_api_names) {
                const apiName = Array.isArray(record.related_api_names) ? 
                    record.related_api_names.join(',') : 
                    record.related_api_names;
                relatedApiNames[apiName] = (relatedApiNames[apiName] || 0) + 1;
            }
            
            // 檢查 related_object_data 欄位
            if (record.related_object_data) {
                try {
                    const relatedData = typeof record.related_object_data === 'string' ? 
                        JSON.parse(record.related_object_data) : 
                        record.related_object_data;
                    
                    if (relatedData) {
                        // 檢查是否有商機相關資料
                        if (relatedData.opportunity || relatedData.OpportunityObj) {
                            const oppData = relatedData.opportunity || relatedData.OpportunityObj;
                            if (oppData.name && oppData.name.includes('興安西')) {
                                relatedToXinganxi.push(record);
                            }
                        }
                        
                        // 檢查是否直接關聯到目標商機ID
                        if (targetOpportunityId) {
                            const dataStr = JSON.stringify(relatedData);
                            if (dataStr.includes(targetOpportunityId)) {
                                relatedToXinganxi.push(record);
                            }
                        }
                    }
                } catch (e) {
                    // 忽略解析錯誤
                }
            }
            
            // 檢查其他可能包含商機資訊的欄位
            const checkFields = ['related_item__r', 'extend_obj_data_id', 'external_form_display__c'];
            checkFields.forEach(field => {
                if (record[field]) {
                    const fieldValue = typeof record[field] === 'object' ? 
                        JSON.stringify(record[field]) : 
                        String(record[field]);
                    
                    if (fieldValue.includes('興安西') || 
                        (targetOpportunityId && fieldValue.includes(targetOpportunityId))) {
                        relatedToXinganxi.push(record);
                    }
                }
            });
        });
        
        console.log('\n關聯對象類型分佈:');
        Object.entries(relatedObjectTypes)
            .sort((a, b) => b[1] - a[1])
            .forEach(([type, count]) => {
                console.log(`  ${type}: ${count} 條`);
            });
        
        console.log('\n關聯API名稱分佈:');
        Object.entries(relatedApiNames)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .forEach(([apiName, count]) => {
                console.log(`  ${apiName}: ${count} 條`);
            });
        
        // 去重
        const uniqueRelatedRecords = Array.from(
            new Map(relatedToXinganxi.map(r => [r._id, r])).values()
        );
        
        console.log(`\n\n=== 找到 ${uniqueRelatedRecords.length} 條可能與興安西相關的跟進記錄 ===`);
        
        if (uniqueRelatedRecords.length > 0) {
            uniqueRelatedRecords.slice(0, 5).forEach((record, idx) => {
                console.log(`\n記錄 ${idx + 1}:`);
                console.log(`創建時間: ${new Date(record.create_time).toLocaleDateString()}`);
                console.log(`跟進內容: ${record.active_record_content || '無內容'}`);
                
                if (record.related_object) {
                    console.log(`關聯對象: ${JSON.stringify(record.related_object)}`);
                }
                
                if (record.related_api_names) {
                    console.log(`關聯API: ${record.related_api_names}`);
                }
                
                if (record.related_object_data) {
                    console.log(`關聯數據: ${typeof record.related_object_data === 'string' ? 
                        record.related_object_data.substring(0, 100) + '...' : 
                        JSON.stringify(record.related_object_data).substring(0, 100) + '...'}`);
                }
            });
        }
        
        // Step 5: 分析一個完整的跟進記錄結構
        console.log('\n\n=== 完整的跟進記錄結構示例 ===');
        const sampleRecord = allRecords.find(r => r.related_object || r.related_object_data) || allRecords[0];
        
        if (sampleRecord) {
            console.log('重要欄位:');
            const importantFields = [
                '_id', 'name', 'active_record_content', 'related_object', 
                'related_api_names', 'related_object_data', 'related_item__r',
                'extend_obj_data_id', 'create_time', 'created_by__r'
            ];
            
            importantFields.forEach(field => {
                if (sampleRecord[field] !== undefined && sampleRecord[field] !== null) {
                    const value = sampleRecord[field];
                    if (typeof value === 'object') {
                        console.log(`\n${field}:`);
                        console.log(JSON.stringify(value, null, 2));
                    } else if (typeof value === 'string' && value.length > 200) {
                        console.log(`\n${field}: ${value.substring(0, 200)}...`);
                    } else {
                        console.log(`\n${field}: ${value}`);
                    }
                }
            });
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

// 執行測試
console.log('開始測試跟進記錄與商機的關聯...\n');
testRelatedOpportunity().then(() => {
    console.log('\n測試完成！');
}).catch(error => {
    console.error('測試過程中發生錯誤:', error);
});