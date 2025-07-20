// 根據 extend_obj_data_id 查詢跟進記錄的附件和圖片

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function getFollowupAttachments() {
    console.log('=== 查詢跟進記錄的附件和圖片 ===\n');
    
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
        
        // Step 3: 使用 extend_obj_data_id 查詢附件
        console.log('3. 查詢跟進記錄的擴展資料...\n');
        
        const extendDataId = "687907732a14650001438b38"; // 從之前的查詢結果得知
        const recordId = "687907732a14650001438a66"; // 記錄ID
        
        // 嘗試多種可能的API端點來查詢附件
        const attachmentEndpoints = [
            '/cgi/crm/v2/attachment/query',
            '/cgi/crm/v2/file/query',
            '/cgi/crm/v2/data/attachment',
            '/cgi/crm/custom/v2/attachment/query',
            '/cgi/attachment/query',
            '/cgi/file/query'
        ];
        
        for (const endpoint of attachmentEndpoints) {
            console.log(`\n--- 測試端點: ${endpoint} ---`);
            
            try {
                const response = await fetch(`${CONFIG.baseUrl}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        corpId: corpId,
                        corpAccessToken: token,
                        currentOpenUserId: userId,
                        data: {
                            recordId: recordId,
                            extendDataId: extendDataId,
                            objectApiName: "ActiveRecordObj"
                        }
                    })
                });
                
                const result = await response.json();
                console.log(`結果: ${result.errorCode === 0 ? '✅ 成功' : `❌ ${result.errorMessage}`}`);
                
                if (result.errorCode === 0 && result.data) {
                    console.log('返回的附件資料:');
                    console.log(JSON.stringify(result.data, null, 2));
                }
            } catch (error) {
                console.log(`請求失敗: ${error.message}`);
            }
            
            // 嘗試不同的參數組合
            try {
                const response2 = await fetch(`${CONFIG.baseUrl}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        corpId: corpId,
                        corpAccessToken: token,
                        currentOpenUserId: userId,
                        recordId: recordId,
                        extendDataId: extendDataId
                    })
                });
                
                const result2 = await response2.json();
                if (result2.errorCode === 0 && result2.data) {
                    console.log('附件資料（參數組合2）:');
                    console.log(JSON.stringify(result2.data, null, 2));
                }
            } catch (error) {
                // 忽略錯誤
            }
        }
        
        // Step 4: 嘗試查詢附件表或文件表
        console.log('\n\n=== 嘗試查詢附件相關的對象 ===');
        
        const attachmentObjects = [
            'AttachmentObj',
            'FileObj',
            'DocumentObj',
            'ImageObj',
            'MediaObj',
            'object_attachment__c',
            'object_file__c'
        ];
        
        for (const objectName of attachmentObjects) {
            console.log(`\n--- 測試對象: ${objectName} ---`);
            
            try {
                // 使用標準API查詢
                const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        corpId: corpId,
                        corpAccessToken: token,
                        currentOpenUserId: userId,
                        data: {
                            apiName: objectName,
                            search_query_info: {
                                limit: 10,
                                offset: 0,
                                filters: [{
                                    field: "related_record_id",
                                    operator: "EQ",
                                    value: recordId
                                }]
                            }
                        }
                    })
                });
                
                const result = await response.json();
                console.log(`結果: ${result.errorCode === 0 ? '✅ 成功' : `❌ ${result.errorMessage}`}`);
                
                if (result.errorCode === 0 && result.data?.dataList?.length > 0) {
                    console.log(`找到 ${result.data.dataList.length} 個附件`);
                    result.data.dataList.forEach((attachment, idx) => {
                        console.log(`\n附件 ${idx + 1}:`);
                        console.log(JSON.stringify(attachment, null, 2));
                    });
                }
            } catch (error) {
                console.log(`查詢失敗: ${error.message}`);
            }
            
            // 嘗試自定義對象API
            try {
                const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        corpId: corpId,
                        corpAccessToken: token,
                        currentOpenUserId: userId,
                        data: {
                            dataObjectApiName: objectName,
                            search_query_info: {
                                limit: 10,
                                offset: 0,
                                filters: [{
                                    field: "related_record_id",
                                    operator: "EQ",
                                    value: recordId
                                }]
                            }
                        }
                    })
                });
                
                const result = await response.json();
                if (result.errorCode === 0 && result.data?.dataList?.length > 0) {
                    console.log(`自定義對象找到 ${result.data.dataList.length} 個附件`);
                    result.data.dataList.forEach((attachment, idx) => {
                        console.log(`\n附件 ${idx + 1}:`);
                        console.log(JSON.stringify(attachment, null, 2));
                    });
                }
            } catch (error) {
                // 忽略錯誤
            }
        }
        
        // Step 5: 嘗試查詢擴展資料
        console.log('\n\n=== 嘗試查詢擴展資料 ===');
        
        const extendEndpoints = [
            '/cgi/crm/v2/data/extend',
            '/cgi/crm/v2/extend/query',
            '/cgi/crm/extend/query'
        ];
        
        for (const endpoint of extendEndpoints) {
            console.log(`\n--- 測試端點: ${endpoint} ---`);
            
            try {
                const response = await fetch(`${CONFIG.baseUrl}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        corpId: corpId,
                        corpAccessToken: token,
                        currentOpenUserId: userId,
                        data: {
                            extendDataId: extendDataId,
                            recordId: recordId,
                            objectApiName: "ActiveRecordObj"
                        }
                    })
                });
                
                const result = await response.json();
                console.log(`結果: ${result.errorCode === 0 ? '✅ 成功' : `❌ ${result.errorMessage}`}`);
                
                if (result.errorCode === 0 && result.data) {
                    console.log('擴展資料:');
                    console.log(JSON.stringify(result.data, null, 2));
                }
            } catch (error) {
                console.log(`請求失敗: ${error.message}`);
            }
        }
        
        // Step 6: 分析跟進記錄的詳細欄位
        console.log('\n\n=== 重新分析跟進記錄的所有欄位 ===');
        
        const recordResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
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
                            value: recordId
                        }]
                    }
                }
            })
        });
        
        const recordResult = await recordResponse.json();
        
        if (recordResult.errorCode === 0 && recordResult.data?.dataList?.length > 0) {
            const record = recordResult.data.dataList[0];
            
            console.log('\n尋找可能包含圖片/附件的欄位:');
            
            Object.keys(record).forEach(key => {
                const value = record[key];
                const lowerKey = key.toLowerCase();
                
                // 檢查欄位名稱是否包含附件相關關鍵字
                if (lowerKey.includes('attach') || 
                    lowerKey.includes('file') || 
                    lowerKey.includes('image') || 
                    lowerKey.includes('photo') || 
                    lowerKey.includes('media') || 
                    lowerKey.includes('doc') ||
                    lowerKey.includes('pic') ||
                    lowerKey.includes('url') ||
                    lowerKey.includes('link') ||
                    lowerKey.includes('path')) {
                    
                    console.log(`\n可疑欄位: ${key}`);
                    console.log(`值: ${JSON.stringify(value)}`);
                }
                
                // 檢查值是否包含URL、路徑或文件名
                if (value && typeof value === 'string') {
                    if (value.includes('http') || 
                        value.includes('www') ||
                        value.includes('attachment') ||
                        value.includes('file') ||
                        value.includes('image') ||
                        value.includes('photo') ||
                        value.match(/\.(jpg|jpeg|png|gif|bmp|pdf|doc|docx|xls|xlsx|txt)/i)) {
                        
                        console.log(`\n可疑值 (${key}): ${value}`);
                    }
                }
            });
        }
        
    } catch (error) {
        console.error('❌ 查詢失敗:', error.message);
    }
}

// 執行查詢
console.log('開始查詢跟進記錄的附件和圖片...\n');
getFollowupAttachments().then(() => {
    console.log('\n查詢完成！');
}).catch(error => {
    console.error('查詢過程中發生錯誤:', error);
});