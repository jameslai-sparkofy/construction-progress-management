// 精確查找勝興-興安西-2024商機的跟進記錄

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function findXinganxiFollowupRecords() {
    console.log('=== 查找勝興-興安西-2024的跟進記錄 ===\n');
    
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
        
        // Step 3: 查詢所有跟進記錄並分析
        console.log('3. 查詢所有跟進記錄並尋找興安西相關記錄...\n');
        
        let offset = 0;
        let hasMore = true;
        let allRecords = [];
        let xinganxiRecords = [];
        let shengxingRecords = [];
        
        while (hasMore && offset < 1000) {
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
                
                records.forEach(record => {
                    allRecords.push(record);
                    
                    // 標記變量
                    let isXinganxi = false;
                    let isShengxing = false;
                    let matchedIn = [];
                    
                    // 1. 檢查跟進內容
                    if (record.active_record_content) {
                        if (record.active_record_content.includes('興安西')) {
                            isXinganxi = true;
                            matchedIn.push('跟進內容');
                        }
                        if (record.active_record_content.includes('勝興')) {
                            isShengxing = true;
                            matchedIn.push('跟進內容(勝興)');
                        }
                    }
                    
                    // 2. 檢查 related_object_data
                    if (record.related_object_data && Array.isArray(record.related_object_data)) {
                        record.related_object_data.forEach(obj => {
                            if (obj.name) {
                                if (obj.name.includes('興安西')) {
                                    isXinganxi = true;
                                    matchedIn.push(`關聯對象(${obj.describe_api_name})`);
                                }
                                if (obj.name.includes('勝興')) {
                                    isShengxing = true;
                                    matchedIn.push(`關聯對象(${obj.describe_api_name})-勝興`);
                                }
                                if (obj.name === '勝興-興安西-2024') {
                                    isXinganxi = true;
                                    isShengxing = true;
                                    matchedIn.push('完全匹配商機名稱');
                                }
                            }
                        });
                    }
                    
                    // 3. 檢查所有字符串欄位
                    Object.entries(record).forEach(([key, value]) => {
                        if (value && typeof value === 'string') {
                            if (value.includes('興安西')) {
                                isXinganxi = true;
                                matchedIn.push(`${key}欄位`);
                            }
                            if (value.includes('勝興')) {
                                isShengxing = true;
                                matchedIn.push(`${key}欄位-勝興`);
                            }
                        }
                    });
                    
                    // 添加到相應的陣列
                    if (isXinganxi) {
                        xinganxiRecords.push({
                            record: record,
                            matchedIn: matchedIn
                        });
                    }
                    if (isShengxing) {
                        shengxingRecords.push({
                            record: record,
                            matchedIn: matchedIn
                        });
                    }
                });
                
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
        
        console.log(`\n總共查詢了 ${allRecords.length} 條跟進記錄`);
        console.log(`找到 ${xinganxiRecords.length} 條興安西相關記錄`);
        console.log(`找到 ${shengxingRecords.length} 條勝興相關記錄`);
        
        // 顯示興安西相關記錄
        if (xinganxiRecords.length > 0) {
            console.log('\n\n=== 興安西相關跟進記錄 ===');
            xinganxiRecords.slice(0, 10).forEach((item, idx) => {
                const record = item.record;
                console.log(`\n--- 記錄 ${idx + 1} ---`);
                console.log(`ID: ${record._id}`);
                console.log(`創建時間: ${new Date(record.create_time).toLocaleString()}`);
                console.log(`跟進內容: ${record.active_record_content || '無內容'}`);
                console.log(`匹配位置: ${item.matchedIn.join(', ')}`);
                
                if (record.related_object_data && Array.isArray(record.related_object_data)) {
                    console.log('關聯對象:');
                    record.related_object_data.forEach(obj => {
                        console.log(`  - ${obj.describe_api_name}: ${obj.name} (ID: ${obj.id})`);
                    });
                }
                
                if (record.created_by__r) {
                    console.log(`創建人: ${record.created_by__r.name}`);
                }
            });
        }
        
        // 分析商機分佈
        console.log('\n\n=== 跟進記錄關聯的商機統計 ===');
        const opportunityStats = {};
        
        allRecords.forEach(record => {
            if (record.related_object_data && Array.isArray(record.related_object_data)) {
                record.related_object_data.forEach(obj => {
                    if (obj.describe_api_name === 'NewOpportunityObj') {
                        const oppName = obj.name;
                        opportunityStats[oppName] = (opportunityStats[oppName] || 0) + 1;
                    }
                });
            }
        });
        
        // 顯示前20個商機
        const sortedOpportunities = Object.entries(opportunityStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);
        
        console.log('\n最多跟進記錄的商機（前20個）:');
        sortedOpportunities.forEach(([name, count], idx) => {
            console.log(`${idx + 1}. ${name}: ${count} 條跟進記錄`);
            if (name.includes('興安西') || name.includes('勝興')) {
                console.log(`   ⭐ 包含興安西或勝興關鍵字`);
            }
        });
        
        // 查找精確匹配
        const exactMatch = allRecords.filter(record => {
            if (record.related_object_data && Array.isArray(record.related_object_data)) {
                return record.related_object_data.some(obj => 
                    obj.name === '勝興-興安西-2024' && 
                    obj.describe_api_name === 'NewOpportunityObj'
                );
            }
            return false;
        });
        
        console.log(`\n\n=== 精確匹配"勝興-興安西-2024"商機的跟進記錄 ===`);
        console.log(`找到 ${exactMatch.length} 條記錄`);
        
        if (exactMatch.length > 0) {
            exactMatch.slice(0, 5).forEach((record, idx) => {
                console.log(`\n記錄 ${idx + 1}:`);
                console.log(`創建時間: ${new Date(record.create_time).toLocaleString()}`);
                console.log(`跟進內容: ${record.active_record_content || '無內容'}`);
                
                if (record.related_object_data) {
                    const oppObj = record.related_object_data.find(obj => 
                        obj.describe_api_name === 'NewOpportunityObj'
                    );
                    if (oppObj) {
                        console.log(`商機ID: ${oppObj.id}`);
                    }
                }
            });
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

// 執行測試
console.log('開始查找勝興-興安西-2024的跟進記錄...\n');
findXinganxiFollowupRecords().then(() => {
    console.log('\n查找完成！');
}).catch(error => {
    console.error('查找過程中發生錯誤:', error);
});