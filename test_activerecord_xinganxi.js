// 測試ActiveRecordObj - 查詢興安西相關的跟進記錄

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function testActiveRecordObj() {
    console.log('=== 測試ActiveRecordObj (跟進記錄) ===\n');
    
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
        
        // Step 3: 查詢所有跟進記錄
        console.log('3. 查詢跟進記錄...\n');
        
        // 先查詢最近的記錄，了解資料結構
        console.log('--- 查詢最近10條記錄 ---');
        const recentResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    apiName: "ActiveRecordObj",
                    search_query_info: {
                        limit: 10,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const recentResult = await recentResponse.json();
        
        if (recentResult.errorCode !== 0) {
            throw new Error(`查詢失敗: ${recentResult.errorMessage}`);
        }
        
        console.log(`✅ 成功獲取 ${recentResult.data.dataList.length} 條記錄\n`);
        
        // 分析欄位結構
        if (recentResult.data.dataList.length > 0) {
            const firstRecord = recentResult.data.dataList[0];
            console.log('=== 跟進記錄欄位結構 ===');
            
            const importantFields = [
                'active_record_content',  // 跟進內容
                'field_36Zg0__c__r',     // 相關對象
                'created_by__r',         // 創建人
                'create_time',           // 創建時間
                'owner_department_id',   // 部門ID
                'related_item__r'        // 關聯項目
            ];
            
            importantFields.forEach(field => {
                if (firstRecord[field] !== undefined) {
                    console.log(`${field}: ${JSON.stringify(firstRecord[field])}`);
                }
            });
            
            console.log('\n所有欄位列表:');
            console.log(Object.keys(firstRecord).join(', '));
        }
        
        // Step 4: 查詢包含興安西的跟進記錄
        console.log('\n\n--- 查詢興安西相關跟進記錄 ---');
        
        // 查詢更多記錄以尋找興安西
        const allRecordsResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
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
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const allRecordsResult = await allRecordsResponse.json();
        
        if (allRecordsResult.errorCode === 0) {
            const allRecords = allRecordsResult.data.dataList;
            console.log(`總共獲取 ${allRecords.length} 條跟進記錄`);
            
            // 搜索包含興安西的記錄
            const xinganxiRecords = allRecords.filter(record => {
                // 檢查所有字符串欄位
                for (const [key, value] of Object.entries(record)) {
                    if (value && typeof value === 'string' && value.includes('興安西')) {
                        return true;
                    }
                    // 檢查對象類型的欄位
                    if (value && typeof value === 'object' && value.name && value.name.includes('興安西')) {
                        return true;
                    }
                }
                return false;
            });
            
            console.log(`\n找到 ${xinganxiRecords.length} 條興安西相關的跟進記錄`);
            
            if (xinganxiRecords.length > 0) {
                console.log('\n=== 興安西跟進記錄詳情 ===');
                xinganxiRecords.forEach((record, idx) => {
                    console.log(`\n記錄 ${idx + 1}:`);
                    console.log(`創建時間: ${new Date(record.create_time).toLocaleDateString()}`);
                    console.log(`跟進內容: ${record.active_record_content || '無內容'}`);
                    
                    // 顯示所有包含興安西的欄位
                    Object.entries(record).forEach(([key, value]) => {
                        if (value && typeof value === 'string' && value.includes('興安西')) {
                            console.log(`${key}: ${value}`);
                        } else if (value && typeof value === 'object' && value.name && value.name.includes('興安西')) {
                            console.log(`${key}: ${value.name} (ID: ${value.api_name || value.id})`);
                        }
                    });
                });
            }
            
            // 統計分析
            console.log('\n=== 跟進記錄統計 ===');
            const contentTypes = {};
            allRecords.forEach(record => {
                const content = record.active_record_content || '無內容';
                const type = content.substring(0, 20) + '...';
                contentTypes[type] = (contentTypes[type] || 0) + 1;
            });
            
            console.log('跟進內容類型分佈:');
            Object.entries(contentTypes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .forEach(([type, count]) => {
                    console.log(`  ${type}: ${count} 條`);
                });
        }
        
        // Step 5: 嘗試使用篩選條件查詢
        console.log('\n\n--- 使用篩選條件查詢興安西 ---');
        try {
            const filteredResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    corpId: corpId,
                    corpAccessToken: token,
                    currentOpenUserId: userId,
                    data: {
                        apiName: "ActiveRecordObj",
                        search_query_info: {
                            limit: 50,
                            offset: 0,
                            orders: [{fieldName: "create_time", isAsc: "false"}],
                            filters: [{
                                field: "active_record_content",
                                operator: "CONTAINS",
                                value: "興安西"
                            }]
                        }
                    }
                })
            });
            
            const filteredResult = await filteredResponse.json();
            
            if (filteredResult.errorCode === 0) {
                console.log(`✅ 使用篩選條件找到 ${filteredResult.data.dataList.length} 條記錄`);
            } else {
                console.log(`❌ 篩選查詢失敗: ${filteredResult.errorMessage}`);
            }
        } catch (error) {
            console.log('❌ 篩選查詢出錯:', error.message);
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

// 執行測試
console.log('開始測試ActiveRecordObj (跟進記錄)...\n');
testActiveRecordObj().then(() => {
    console.log('\n測試完成！');
    console.log('\n提示：ActiveRecordObj 是跟進記錄的正確對象名稱。');
    console.log('可以使用標準對象API端點 /cgi/crm/v2/data/query 來查詢。');
}).catch(error => {
    console.error('測試過程中發生錯誤:', error);
});