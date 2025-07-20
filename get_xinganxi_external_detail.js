// 獲取勝興-興安西-2024標記為外部顯示的跟進記錄詳情

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function getXinganxiExternalDetail() {
    console.log('=== 獲取勝興-興安西-2024外部顯示跟進記錄的詳細資訊 ===\n');
    
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
        
        // Step 3: 查詢勝興-興安西-2024的跟進記錄
        console.log('3. 查詢勝興-興安西-2024的跟進記錄...\n');
        
        const XINGANXI_OPPORTUNITY_ID = "650fe201d184e50001102aee";
        let offset = 0;
        let hasMore = true;
        let externalDisplayRecords = [];
        
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
                    // 檢查是否關聯到勝興-興安西-2024
                    let isXinganxi = false;
                    
                    if (record.related_object_data && Array.isArray(record.related_object_data)) {
                        isXinganxi = record.related_object_data.some(obj => 
                            obj.id === XINGANXI_OPPORTUNITY_ID && 
                            obj.describe_api_name === 'NewOpportunityObj'
                        );
                    }
                    
                    if (isXinganxi) {
                        // 檢查外部顯示欄位（使用更寬鬆的條件）
                        const externalDisplayValue = record.external_form_display__c;
                        const externalDisplayRef = record.external_form_display__c__r;
                        
                        // 如果 external_form_display__c__r 是 "顯示" 或類似值
                        if (externalDisplayRef === '顯示' || 
                            externalDisplayRef === 'display' || 
                            externalDisplayRef === 'show' ||
                            externalDisplayValue === '顯示' ||
                            externalDisplayValue === 'display' ||
                            externalDisplayValue === 'show' ||
                            externalDisplayValue === 'option_displayed__c') {
                            
                            externalDisplayRecords.push(record);
                        }
                    }
                });
                
                if (records.length < 100) {
                    hasMore = false;
                } else {
                    offset += 100;
                }
            } else {
                hasMore = false;
            }
        }
        
        console.log(`找到 ${externalDisplayRecords.length} 條外部顯示的跟進記錄\n`);
        
        // 顯示外部顯示記錄的完整詳情
        if (externalDisplayRecords.length > 0) {
            externalDisplayRecords.forEach((record, idx) => {
                console.log(`\n==================== 記錄 ${idx + 1} ====================`);
                console.log(`記錄ID: ${record._id}`);
                console.log(`創建時間: ${new Date(record.create_time).toLocaleString()}`);
                console.log(`創建人: ${record.created_by__r?.name || '未知'}`);
                console.log(`外部顯示欄位: ${record.external_form_display__c || '空'}`);
                console.log(`外部顯示參考: ${record.external_form_display__c__r || '空'}`);
                
                console.log(`\n跟進內容:`);
                console.log(record.active_record_content || '無內容');
                
                console.log(`\n=== 完整記錄結構 ===`);
                
                // 顯示所有欄位和值
                Object.keys(record).sort().forEach(key => {
                    const value = record[key];
                    
                    if (value === null || value === undefined) {
                        // 跳過空值
                        return;
                    }
                    
                    console.log(`\n${key}:`);
                    
                    if (typeof value === 'object') {
                        if (Array.isArray(value)) {
                            console.log(`  [陣列 - ${value.length} 個元素]`);
                            value.forEach((item, i) => {
                                console.log(`  [${i}]: ${JSON.stringify(item, null, 2)}`);
                            });
                        } else {
                            console.log(`  ${JSON.stringify(value, null, 2)}`);
                        }
                    } else if (typeof value === 'string') {
                        // 檢查是否包含圖片URL或路徑
                        if (value.match(/\.(jpg|jpeg|png|gif|bmp|pdf|doc|docx|xls|xlsx)/i) ||
                            value.includes('http') ||
                            value.includes('attachment') ||
                            value.includes('file') ||
                            value.includes('image')) {
                            console.log(`  📎 ${value}`);
                        } else if (value.length > 200) {
                            console.log(`  ${value.substring(0, 200)}...`);
                        } else {
                            console.log(`  ${value}`);
                        }
                    } else {
                        console.log(`  ${value}`);
                    }
                });
                
                console.log(`\n================================================`);
            });
        } else {
            console.log('未找到標記為外部顯示的跟進記錄');
        }
        
        // 額外嘗試：查詢特定ID的記錄
        console.log('\n=== 嘗試查詢特定的TEST記錄 ===');
        try {
            const testRecordId = "687907732a14650001438a66"; // 從之前的查詢結果得知
            
            // 嘗試直接通過ID查詢單條記錄
            const singleRecordResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    corpId: corpId,
                    corpAccessToken: token,
                    currentOpenUserId: userId,
                    data: {
                        apiName: "ActiveRecordObj",
                        search_query_info: {
                            limit: 1,
                            offset: 0,
                            filters: [{
                                field: "_id",
                                operator: "EQ",
                                value: testRecordId
                            }]
                        }
                    }
                })
            });
            
            const singleResult = await singleRecordResponse.json();
            
            if (singleResult.errorCode === 0 && singleResult.data?.dataList?.length > 0) {
                const testRecord = singleResult.data.dataList[0];
                console.log('\n找到TEST記錄:');
                console.log(`跟進內容: ${testRecord.active_record_content}`);
                console.log(`外部顯示欄位: ${testRecord.external_form_display__c}`);
                console.log(`外部顯示參考: ${testRecord.external_form_display__c__r}`);
                
                // 搜索所有可能的圖片或附件欄位
                console.log('\n檢查所有可能的圖片/附件欄位:');
                Object.keys(testRecord).forEach(key => {
                    const value = testRecord[key];
                    if (value && (
                        key.toLowerCase().includes('attach') ||
                        key.toLowerCase().includes('image') ||
                        key.toLowerCase().includes('photo') ||
                        key.toLowerCase().includes('file') ||
                        key.toLowerCase().includes('media') ||
                        key.toLowerCase().includes('doc') ||
                        (typeof value === 'string' && (
                            value.includes('http') ||
                            value.includes('attachment') ||
                            value.includes('image') ||
                            value.includes('photo') ||
                            value.match(/\.(jpg|jpeg|png|gif|bmp|pdf|doc|docx|xls|xlsx)/i)
                        ))
                    )) {
                        console.log(`  ${key}: ${JSON.stringify(value)}`);
                    }
                });
            }
        } catch (error) {
            console.log('查詢特定記錄失敗:', error.message);
        }
        
    } catch (error) {
        console.error('❌ 查詢失敗:', error.message);
    }
}

// 執行查詢
console.log('開始獲取外部顯示跟進記錄的詳細資訊...\n');
getXinganxiExternalDetail().then(() => {
    console.log('\n查詢完成！');
}).catch(error => {
    console.error('查詢過程中發生錯誤:', error);
});