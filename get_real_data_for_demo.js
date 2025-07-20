// 獲取真實的維修單和跟進記錄數據用於示意網頁

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function getRealDataForDemo() {
    console.log('=== 獲取真實數據用於示意網頁 ===\n');
    
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
        
        // Step 3: 獲取維修單數據
        console.log('3. 獲取維修單數據...');
        const repairOrderResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    dataObjectApiName: "object_8W9cb__c",
                    search_query_info: {
                        limit: 100,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const repairResult = await repairOrderResponse.json();
        let repairOrders = [];
        
        if (repairResult.errorCode === 0 && repairResult.data) {
            const allRepairs = repairResult.data.dataList || [];
            
            // 篩選與興安西相關的維修單
            repairOrders = allRepairs.filter(repair => {
                const opportunity = repair.field_1P96q__c;
                return opportunity && opportunity.includes('興安西') && opportunity.includes('2024');
            });
            
            console.log(`✅ 找到 ${repairOrders.length} 條興安西相關維修單`);
        }
        
        // Step 4: 獲取跟進記錄數據
        console.log('4. 獲取跟進記錄數據...');
        const XINGANXI_OPPORTUNITY_ID = "650fe201d184e50001102aee";
        
        const followupResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
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
        
        const followupResult = await followupResponse.json();
        let followupRecords = [];
        
        if (followupResult.errorCode === 0 && followupResult.data) {
            const allFollowups = followupResult.data.dataList || [];
            
            // 篩選與興安西相關且外部顯示的記錄
            followupRecords = allFollowups.filter(record => {
                // 檢查是否關聯到興安西
                const isXinganxi = record.related_object_data && 
                    Array.isArray(record.related_object_data) &&
                    record.related_object_data.some(obj => 
                        obj.id === XINGANXI_OPPORTUNITY_ID && 
                        obj.describe_api_name === 'NewOpportunityObj'
                    );
                
                // 檢查是否外部顯示
                const isExternal = record.external_form_display__c__r === '顯示';
                
                return isXinganxi && isExternal;
            });
            
            console.log(`✅ 找到 ${followupRecords.length} 條外部顯示的跟進記錄`);
        }
        
        // Step 5: 格式化數據
        const formattedData = {
            timestamp: new Date().toISOString(),
            repairOrders: repairOrders.map(repair => ({
                id: repair._id,
                name: repair.name,
                date: new Date(repair.create_time).toLocaleDateString(),
                building: repair.building_type__c ? repair.building_type__c + '棟' : '未知',
                floor: repair.floor__c || '未知',
                unit: repair.unit__c || '未知',
                contractor: repair.shift_time__c || '未知',
                description: repair.description || '無描述',
                status: repair.status__c || '未知',
                opportunity: repair.field_1P96q__c || '未知'
            })),
            followupRecords: followupRecords.map(record => ({
                id: record._id,
                name: record.name,
                date: new Date(record.create_time).toLocaleDateString(),
                time: new Date(record.create_time).toLocaleTimeString(),
                creator: record.created_by__r?.name || '未知',
                type: record.active_record_type__r || '未知',
                importance: record.field_36Zg0__c__r || '一般',
                content: record.active_record_content || '無內容',
                isExternal: record.external_form_display__c__r === '顯示'
            }))
        };
        
        console.log('\n=== 數據格式化完成 ===');
        console.log(`維修單: ${formattedData.repairOrders.length} 條`);
        console.log(`跟進記錄: ${formattedData.followupRecords.length} 條`);
        
        // 顯示維修單摘要
        console.log('\n維修單摘要:');
        formattedData.repairOrders.forEach((repair, idx) => {
            console.log(`${idx + 1}. ${repair.name} - ${repair.building} ${repair.floor}樓 ${repair.unit}戶 (${repair.contractor})`);
        });
        
        // 顯示跟進記錄摘要
        console.log('\n跟進記錄摘要:');
        formattedData.followupRecords.forEach((record, idx) => {
            console.log(`${idx + 1}. ${record.date} - ${record.creator} - ${record.type}`);
            console.log(`   ${record.content.substring(0, 100)}...`);
        });
        
        // 保存到JSON文件
        const fs = require('fs');
        fs.writeFileSync('/mnt/c/claude code/工程進度網頁/real_data_for_demo.json', JSON.stringify(formattedData, null, 2));
        console.log('\n✅ 數據已保存到 real_data_for_demo.json');
        
        return formattedData;
        
    } catch (error) {
        console.error('❌ 獲取數據失敗:', error.message);
        return null;
    }
}

// 執行數據獲取
getRealDataForDemo().then(data => {
    if (data) {
        console.log('\n🎉 真實數據獲取完成！');
        console.log('可以開始更新示意網頁了。');
    }
}).catch(error => {
    console.error('數據獲取過程中發生錯誤:', error);
});