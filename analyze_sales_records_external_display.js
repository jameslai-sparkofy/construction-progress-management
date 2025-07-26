// 分析銷售記錄中 external_form_display__c 欄位的分布
// 這個腳本將幫助我們了解需要同步的實際記錄數量

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function analyzeSalesRecordsExternalDisplay() {
    console.log('🔍 開始分析銷售記錄 external_form_display__c 欄位分布');
    console.log('='.repeat(60));
    
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
        
        // Step 3: 查詢所有銷售記錄來分析 external_form_display__c 分布
        console.log('3. 查詢銷售記錄數據進行分析...');
        
        let allRecords = [];
        let offset = 0;
        const limit = 100;
        let hasMoreData = true;
        
        while (hasMoreData) {
            console.log(`   查詢第 ${Math.floor(offset/limit) + 1} 批數據 (offset: ${offset})`);
            
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
                            limit: limit,
                            offset: offset,
                            orders: [{ fieldName: "create_time", isAsc: "false" }]
                        }
                    }
                })
            });
            
            const result = await response.json();
            if (result.errorCode !== 0) {
                throw new Error(`查詢失敗: ${result.errorMessage}`);
            }
            
            if (!result.data?.dataList || result.data.dataList.length === 0) {
                hasMoreData = false;
                break;
            }
            
            allRecords = allRecords.concat(result.data.dataList);
            offset += limit;
            
            // 如果返回的記錄數少於limit，表示沒有更多數據了
            if (result.data.dataList.length < limit) {
                hasMoreData = false;
            }
            
            // 防止無限循環，設置最大查詢次數
            if (offset > 5000) {
                console.log('   ⚠️  已查詢5000筆記錄，停止查詢以避免過多API調用');
                break;
            }
        }
        
        console.log(`✅ 總共查詢到 ${allRecords.length} 筆銷售記錄\n`);
        
        // Step 4: 分析 external_form_display__c 欄位分布
        console.log('4. 分析 external_form_display__c 欄位分布...');
        console.log('='.repeat(50));
        
        // 統計各種 external_form_display__c 值的數量
        const externalDisplayStats = {};
        const fieldVariations = [
            'external_form_display__c',
            'external_display',
            'field_external_display__c',
            'is_external_display'
        ];
        
        // 先檢查第一筆記錄的所有欄位，找出正確的欄位名稱
        if (allRecords.length > 0) {
            console.log('\n📋 第一筆記錄的所有欄位:');
            const firstRecord = allRecords[0];
            const fieldNames = Object.keys(firstRecord);
            console.log(fieldNames.join(', '));
            
            // 查找可能的外部顯示欄位
            const externalFields = fieldNames.filter(field => 
                field.toLowerCase().includes('external') || 
                field.toLowerCase().includes('display') ||
                field.toLowerCase().includes('form')
            );
            
            console.log('\n🔍 可能的外部顯示相關欄位:');
            externalFields.forEach(field => {
                console.log(`   - ${field}: ${firstRecord[field]}`);
            });
        }
        
        // 統計每個可能欄位的值分布
        for (const fieldName of fieldVariations) {
            const fieldStats = {};
            let hasFieldCount = 0;
            
            for (const record of allRecords) {
                if (record[fieldName] !== undefined) {
                    hasFieldCount++;
                    const value = record[fieldName] || '空值';
                    fieldStats[value] = (fieldStats[value] || 0) + 1;
                }
            }
            
            if (hasFieldCount > 0) {
                console.log(`\n📊 欄位 "${fieldName}" 的分布 (${hasFieldCount}/${allRecords.length} 筆記錄有此欄位):`);
                Object.entries(fieldStats)
                    .sort((a, b) => b[1] - a[1])
                    .forEach(([value, count]) => {
                        const percentage = ((count / hasFieldCount) * 100).toFixed(1);
                        console.log(`   "${value}": ${count} 筆 (${percentage}%)`);
                    });
            }
        }
        
        // Step 5: 分析與興安西項目相關的記錄
        console.log('\n5. 分析與興安西項目相關的記錄...');
        console.log('='.repeat(50));
        
        const xinganxiRecords = allRecords.filter(record => {
            return Object.values(record).some(value => 
                value && typeof value === 'string' && value.includes('興安西')
            );
        });
        
        console.log(`🏢 找到 ${xinganxiRecords.length} 筆與興安西相關的記錄`);
        
        if (xinganxiRecords.length > 0) {
            console.log('\n興安西相關記錄的外部顯示欄位分析:');
            
            for (const fieldName of fieldVariations) {
                const xinganxiFieldStats = {};
                let xinganxiHasFieldCount = 0;
                
                for (const record of xinganxiRecords) {
                    if (record[fieldName] !== undefined) {
                        xinganxiHasFieldCount++;
                        const value = record[fieldName] || '空值';
                        xinganxiFieldStats[value] = (xinganxiFieldStats[value] || 0) + 1;
                    }
                }
                
                if (xinganxiHasFieldCount > 0) {
                    console.log(`\n   欄位 "${fieldName}" 在興安西記錄中的分布:`);
                    Object.entries(xinganxiFieldStats)
                        .sort((a, b) => b[1] - a[1])
                        .forEach(([value, count]) => {
                            const percentage = ((count / xinganxiHasFieldCount) * 100).toFixed(1);
                            console.log(`     "${value}": ${count} 筆 (${percentage}%)`);
                        });
                }
            }
        }
        
        // Step 6: 生成遷移建議
        console.log('\n6. 生成遷移策略建議...');
        console.log('='.repeat(50));
        
        // 找出正確的外部顯示欄位名稱
        let correctFieldName = null;
        let displayRecordsCount = 0;
        
        for (const fieldName of fieldVariations) {
            let fieldHasDisplay = false;
            let fieldDisplayCount = 0;
            
            for (const record of allRecords) {
                if (record[fieldName] === '顯示') {
                    fieldHasDisplay = true;
                    fieldDisplayCount++;
                }
            }
            
            if (fieldHasDisplay) {
                correctFieldName = fieldName;
                displayRecordsCount = fieldDisplayCount;
                console.log(`✅ 找到正確的外部顯示欄位: ${fieldName}`);
                console.log(`📊 有 ${fieldDisplayCount} 筆記錄的值為 "顯示"`);
                break;
            }
        }
        
        if (correctFieldName) {
            console.log(`\n📋 遷移策略建議:`);
            console.log(`   1. 當前總記錄數: ${allRecords.length} 筆`);
            console.log(`   2. 需要同步的記錄數 (${correctFieldName} = "顯示"): ${displayRecordsCount} 筆`);
            console.log(`   3. 節省的數據量: ${allRecords.length - displayRecordsCount} 筆 (${((1 - displayRecordsCount/allRecords.length) * 100).toFixed(1)}%)`);
            console.log(`   4. 建議的過濾條件: ${correctFieldName} = "顯示"`);
        } else {
            console.log(`❌ 未找到有效的外部顯示欄位，建議手動檢查API響應`);
        }
        
        // Step 7: 輸出示例記錄
        console.log('\n7. 示例記錄分析...');
        console.log('='.repeat(50));
        
        if (allRecords.length > 0) {
            console.log('\n第一筆記錄完整資料:');
            console.log(JSON.stringify(allRecords[0], null, 2));
        }
        
        if (displayRecordsCount > 0 && correctFieldName) {
            const displayRecord = allRecords.find(record => record[correctFieldName] === '顯示');
            if (displayRecord) {
                console.log(`\n第一筆 ${correctFieldName} = "顯示" 的記錄:');
                console.log(JSON.stringify(displayRecord, null, 2));
            }
        }
        
    } catch (error) {
        console.error('❌ 分析失敗:', error.message);
        console.error(error.stack);
    }
}

// 執行分析
console.log('🚀 開始銷售記錄外部顯示欄位分析...\n');
analyzeSalesRecordsExternalDisplay().then(() => {
    console.log('\n✅ 分析完成！');
}).catch(error => {
    console.error('\n❌ 分析過程中發生錯誤:', error);
});