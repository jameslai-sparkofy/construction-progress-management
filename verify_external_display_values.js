// 驗證 external_form_display__c 的值對應關係
const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function verifyExternalDisplayValues() {
    console.log('驗證 external_form_display__c 值對應關係...');
    
    try {
        // 獲取Token
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
        const token = tokenResult.corpAccessToken;
        const corpId = tokenResult.corpId;
        
        // 獲取用戶信息
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
        const userId = userResult.empList[0].openUserId;
        
        // 查詢更多記錄來找到各種值
        console.log('查詢500筆記錄來分析值分布...');
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
                        offset: 0,
                        orders: [{ fieldName: "create_time", isAsc: "false" }]
                    }
                }
            })
        });
        
        const result = await response.json();
        console.log(`成功查詢到 ${result.data.dataList.length} 筆記錄`);
        
        // 收集所有不同的值和其對應的顯示名稱
        const valueMapping = {};
        
        result.data.dataList.forEach(record => {
            const value = record.external_form_display__c;
            const displayName = record.external_form_display__c__r;
            
            if (value && displayName) {
                if (!valueMapping[value]) {
                    valueMapping[value] = {
                        displayName: displayName,
                        count: 0
                    };
                }
                valueMapping[value].count++;
            }
        });
        
        console.log('\nexternal_form_display__c 值對應關係:');
        console.log('='.repeat(50));
        Object.entries(valueMapping).forEach(([value, info]) => {
            console.log(`"${value}" → "${info.displayName}" (${info.count} 筆)`);
        });
        
        // 找到對應"顯示"的值
        const displayedValue = Object.keys(valueMapping).find(key => 
            valueMapping[key].displayName === '顯示'
        );
        
        if (displayedValue) {
            console.log(`\n✅ 找到對應"顯示"的值: ${displayedValue}`);
            console.log(`   數量: ${valueMapping[displayedValue].count} 筆`);
        } else {
            console.log('\n⚠️  未找到對應"顯示"的值，可能需要查詢更多記錄');
            
            // 嘗試查詢使用 filter 的方式
            console.log('\n嘗試使用過濾條件查詢"顯示"記錄...');
            
            const filterResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
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
                            filters: [
                                {
                                    field_name: "external_form_display__c",
                                    field_values: ["option_displayed__c"],
                                    operator: "EQ"
                                }
                            ]
                        }
                    }
                })
            });
            
            const filterResult = await filterResponse.json();
            console.log('過濾查詢結果:', JSON.stringify(filterResult, null, 2));
            
            if (filterResult.errorCode === 0 && filterResult.data?.dataList?.length > 0) {
                console.log(`✅ 使用過濾條件找到 ${filterResult.data.dataList.length} 筆記錄`);
                const firstFiltered = filterResult.data.dataList[0];
                console.log('第一筆過濾記錄的外部顯示欄位:');
                console.log(`  external_form_display__c: ${firstFiltered.external_form_display__c}`);
                console.log(`  external_form_display__c__r: ${firstFiltered.external_form_display__c__r}`);
            }
        }
        
        // 生成總結報告
        console.log('\n總結報告:');
        console.log('='.repeat(50));
        
        const totalRecords = result.data.dataList.length;
        const displayRecords = valueMapping[displayedValue]?.count || 0;
        
        console.log(`總記錄數: ${totalRecords}`);
        console.log(`需要同步的記錄數: ${displayRecords}`);
        console.log(`節省的數據量: ${totalRecords - displayRecords} 筆`);
        console.log(`節省比例: ${((1 - displayRecords/totalRecords) * 100).toFixed(1)}%`);
        
        // 估算全部記錄的情況
        const estimatedTotal = 3600; // 根據系統統計
        const estimatedDisplayRecords = Math.round((displayRecords / totalRecords) * estimatedTotal);
        
        console.log(`\n預估全部記錄情況:`);
        console.log(`預估總記錄數: ${estimatedTotal}`);
        console.log(`預估需要同步記錄數: ${estimatedDisplayRecords}`);
        console.log(`預估節省數據量: ${estimatedTotal - estimatedDisplayRecords} 筆`);
        console.log(`預估節省比例: ${((1 - estimatedDisplayRecords/estimatedTotal) * 100).toFixed(1)}%`);
        
    } catch (error) {
        console.error('❌ 驗證失敗:', error.message);
    }
}

verifyExternalDisplayValues();