// 獲取勝興-興安西-2024的外部顯示跟進記錄（包含圖片和文字）

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function getXinganxiExternalFollowup() {
    console.log('=== 獲取勝興-興安西-2024的外部顯示跟進記錄 ===\n');
    
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
        console.log('3. 查詢勝興-興安西-2024的外部顯示跟進記錄...\n');
        
        const XINGANXI_OPPORTUNITY_ID = "650fe201d184e50001102aee"; // 勝興-興安西-2024的ID
        let offset = 0;
        let hasMore = true;
        let allXinganxiRecords = [];
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
                        allXinganxiRecords.push(record);
                        
                        // 檢查外部顯示欄位
                        // external_form_display__c 或 external_form_display__c__r
                        const externalDisplay = record.external_form_display__c || record.external_form_display__c__r;
                        
                        if (externalDisplay === '顯示' || externalDisplay === true || externalDisplay === 'true' || externalDisplay === 1 || externalDisplay === '1') {
                            externalDisplayRecords.push(record);
                        }
                    }
                });
                
                if (records.length < 100) {
                    hasMore = false;
                } else {
                    offset += 100;
                }
                
                console.log(`已查詢 ${offset} 條記錄，找到 ${allXinganxiRecords.length} 條興安西記錄，其中 ${externalDisplayRecords.length} 條為外部顯示`);
            } else {
                hasMore = false;
            }
        }
        
        console.log(`\n查詢完成！`);
        console.log(`總共找到 ${allXinganxiRecords.length} 條勝興-興安西-2024的跟進記錄`);
        console.log(`其中 ${externalDisplayRecords.length} 條標記為外部顯示\n`);
        
        // 分析外部顯示欄位的值
        console.log('=== 外部顯示欄位分析 ===');
        const displayValues = {};
        allXinganxiRecords.forEach(record => {
            const value = record.external_form_display__c || record.external_form_display__c__r || '空值';
            displayValues[value] = (displayValues[value] || 0) + 1;
        });
        
        console.log('external_form_display__c 欄位值分佈:');
        Object.entries(displayValues).forEach(([value, count]) => {
            console.log(`  ${value}: ${count} 條`);
        });
        
        // 顯示外部顯示的跟進記錄詳情
        if (externalDisplayRecords.length > 0) {
            console.log('\n\n=== 外部顯示的跟進記錄詳情 ===');
            
            externalDisplayRecords.forEach((record, idx) => {
                console.log(`\n--- 記錄 ${idx + 1} ---`);
                console.log(`ID: ${record._id}`);
                console.log(`創建時間: ${new Date(record.create_time).toLocaleString()}`);
                console.log(`創建人: ${record.created_by__r?.name || '未知'}`);
                console.log(`外部顯示: ${record.external_form_display__c || record.external_form_display__c__r}`);
                
                // 跟進內容
                console.log(`\n跟進內容:`);
                console.log(record.active_record_content || '無內容');
                
                // 檢查是否有圖片或附件相關欄位
                console.log(`\n檢查圖片/附件欄位:`);
                const imageFields = [
                    'attachment', 'attachments', 'image', 'images', 'photo', 'photos',
                    'file', 'files', 'document', 'documents', 'media',
                    'attachment__c', 'image__c', 'file__c', 'photo__c'
                ];
                
                let hasAttachment = false;
                Object.keys(record).forEach(key => {
                    // 檢查欄位名是否包含圖片相關關鍵字
                    const lowerKey = key.toLowerCase();
                    if (imageFields.some(field => lowerKey.includes(field))) {
                        if (record[key]) {
                            console.log(`  ${key}: ${JSON.stringify(record[key])}`);
                            hasAttachment = true;
                        }
                    }
                    
                    // 檢查值是否包含圖片URL或文件路徑
                    if (record[key] && typeof record[key] === 'string') {
                        if (record[key].match(/\.(jpg|jpeg|png|gif|bmp|pdf|doc|docx|xls|xlsx)/i) ||
                            record[key].includes('http') ||
                            record[key].includes('file') ||
                            record[key].includes('image')) {
                            console.log(`  ${key}: ${record[key]}`);
                            hasAttachment = true;
                        }
                    }
                });
                
                if (!hasAttachment) {
                    console.log(`  未找到明顯的圖片或附件欄位`);
                }
                
                // 顯示所有非空欄位（用於分析）
                console.log(`\n其他非空欄位:`);
                const importantFields = Object.keys(record).filter(key => {
                    const value = record[key];
                    return value && 
                           value !== '0' && 
                           value !== 0 && 
                           value !== false &&
                           !['_id', 'create_time', 'last_modified_time', 'version'].includes(key);
                });
                
                importantFields.slice(0, 20).forEach(key => {
                    const value = record[key];
                    if (typeof value === 'object') {
                        console.log(`  ${key}: [對象]`);
                    } else if (typeof value === 'string' && value.length > 100) {
                        console.log(`  ${key}: ${value.substring(0, 100)}...`);
                    } else {
                        console.log(`  ${key}: ${value}`);
                    }
                });
            });
        } else {
            console.log('\n未找到標記為外部顯示的跟進記錄');
            
            // 顯示一些興安西記錄作為參考
            if (allXinganxiRecords.length > 0) {
                console.log('\n=== 部分興安西跟進記錄示例（前3條）===');
                allXinganxiRecords.slice(0, 3).forEach((record, idx) => {
                    console.log(`\n記錄 ${idx + 1}:`);
                    console.log(`創建時間: ${new Date(record.create_time).toLocaleString()}`);
                    console.log(`external_form_display__c: ${record.external_form_display__c || '空'}`);
                    console.log(`external_form_display__c__r: ${record.external_form_display__c__r || '空'}`);
                    console.log(`跟進內容: ${(record.active_record_content || '無內容').substring(0, 100)}...`);
                });
            }
        }
        
        // 分析記錄結構，找出所有可能包含圖片的欄位
        console.log('\n\n=== 分析所有欄位尋找圖片相關資訊 ===');
        if (allXinganxiRecords.length > 0) {
            const allFields = new Set();
            const suspiciousFields = new Set();
            
            allXinganxiRecords.forEach(record => {
                Object.keys(record).forEach(key => {
                    allFields.add(key);
                    
                    // 檢查欄位名或值是否可能包含圖片
                    const value = record[key];
                    if (key.toLowerCase().includes('attach') ||
                        key.toLowerCase().includes('image') ||
                        key.toLowerCase().includes('photo') ||
                        key.toLowerCase().includes('file') ||
                        key.toLowerCase().includes('media') ||
                        key.toLowerCase().includes('doc') ||
                        (value && typeof value === 'string' && 
                         (value.includes('.jpg') || value.includes('.png') || 
                          value.includes('http') || value.includes('file')))) {
                        suspiciousFields.add(key);
                    }
                });
            });
            
            console.log(`\n所有欄位總數: ${allFields.size}`);
            console.log('\n可能包含圖片/附件的欄位:');
            Array.from(suspiciousFields).forEach(field => {
                console.log(`  - ${field}`);
                
                // 顯示該欄位的示例值
                const sampleRecord = allXinganxiRecords.find(r => r[field]);
                if (sampleRecord) {
                    const value = sampleRecord[field];
                    if (typeof value === 'string' && value.length > 100) {
                        console.log(`    示例: ${value.substring(0, 100)}...`);
                    } else {
                        console.log(`    示例: ${JSON.stringify(value)}`);
                    }
                }
            });
        }
        
    } catch (error) {
        console.error('❌ 查詢失敗:', error.message);
    }
}

// 執行查詢
console.log('開始查詢勝興-興安西-2024的外部顯示跟進記錄...\n');
getXinganxiExternalFollowup().then(() => {
    console.log('\n查詢完成！');
}).catch(error => {
    console.error('查詢過程中發生錯誤:', error);
});