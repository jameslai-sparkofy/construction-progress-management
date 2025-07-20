// 總結勝興-興安西-2024的跟進記錄資訊

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function summarizeXinganxiFollowup() {
    console.log('=== 勝興-興安西-2024 跟進記錄總結 ===\n');
    
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
        
        // Step 3: 查詢所有勝興-興安西-2024的跟進記錄
        console.log('3. 查詢所有勝興-興安西-2024的跟進記錄...\n');
        
        const XINGANXI_OPPORTUNITY_ID = "650fe201d184e50001102aee";
        let allRecords = [];
        let externalRecords = [];
        
        // 分批查詢
        let offset = 0;
        let hasMore = true;
        
        while (hasMore && offset < 2000) {
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
                    // 檢查是否關聯到興安西
                    if (record.related_object_data && Array.isArray(record.related_object_data)) {
                        const isXinganxi = record.related_object_data.some(obj => 
                            obj.id === XINGANXI_OPPORTUNITY_ID && 
                            obj.describe_api_name === 'NewOpportunityObj'
                        );
                        
                        if (isXinganxi) {
                            allRecords.push(record);
                            
                            // 檢查是否為外部顯示
                            if (record.external_form_display__c__r === '顯示') {
                                externalRecords.push(record);
                            }
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
        
        console.log(`✅ 查詢完成，找到 ${allRecords.length} 條跟進記錄\n`);
        
        // 生成詳細的跟進記錄報告
        console.log('=== 📋 跟進記錄詳細報告 ===\n');
        
        // 按時間排序
        allRecords.sort((a, b) => b.create_time - a.create_time);
        
        console.log(`📊 總統計：`);
        console.log(`- 總跟進記錄數：${allRecords.length} 條`);
        console.log(`- 外部顯示記錄：${externalRecords.length} 條`);
        console.log(`- 時間範圍：${new Date(allRecords[allRecords.length - 1].create_time).toLocaleDateString()} 到 ${new Date(allRecords[0].create_time).toLocaleDateString()}`);
        
        // 創建人統計
        const createdByStats = {};
        allRecords.forEach(record => {
            const creator = record.created_by__r?.name || '未知';
            createdByStats[creator] = (createdByStats[creator] || 0) + 1;
        });
        
        console.log(`\n👥 創建人統計：`);
        Object.entries(createdByStats)
            .sort((a, b) => b[1] - a[1])
            .forEach(([name, count]) => {
                console.log(`- ${name}：${count} 條`);
            });
        
        // 跟進類型統計
        const typeStats = {};
        allRecords.forEach(record => {
            const type = record.active_record_type__r || '未知';
            typeStats[type] = (typeStats[type] || 0) + 1;
        });
        
        console.log(`\n📝 跟進類型統計：`);
        Object.entries(typeStats)
            .sort((a, b) => b[1] - a[1])
            .forEach(([type, count]) => {
                console.log(`- ${type}：${count} 條`);
            });
        
        // 外部顯示記錄詳情
        if (externalRecords.length > 0) {
            console.log(`\n🌐 外部顯示記錄詳情：`);
            externalRecords.forEach((record, idx) => {
                console.log(`\n${idx + 1}. ${record.name || '無標題'}`);
                console.log(`   時間：${new Date(record.create_time).toLocaleString()}`);
                console.log(`   創建人：${record.created_by__r?.name || '未知'}`);
                console.log(`   類型：${record.active_record_type__r || '未知'}`);
                console.log(`   重要程度：${record.field_36Zg0__c__r || '未知'}`);
                console.log(`   內容：${record.active_record_content || '無內容'}`);
                console.log(`   擴展資料ID：${record.extend_obj_data_id || '無'}`);
            });
        }
        
        // 最近的跟進記錄（前10條）
        console.log(`\n📅 最近10條跟進記錄：`);
        allRecords.slice(0, 10).forEach((record, idx) => {
            const isExternal = record.external_form_display__c__r === '顯示';
            const externalMark = isExternal ? '🌐' : '';
            
            console.log(`\n${idx + 1}. ${externalMark}${record.name || '無標題'}`);
            console.log(`   時間：${new Date(record.create_time).toLocaleString()}`);
            console.log(`   創建人：${record.created_by__r?.name || '未知'}`);
            console.log(`   類型：${record.active_record_type__r || '未知'}`);
            console.log(`   重要程度：${record.field_36Zg0__c__r || '未知'}`);
            console.log(`   外部顯示：${isExternal ? '是' : '否'}`);
            
            // 顯示內容摘要
            const content = record.active_record_content || '無內容';
            const summary = content.length > 100 ? content.substring(0, 100) + '...' : content;
            console.log(`   內容摘要：${summary}`);
        });
        
        // 包含工班資訊的記錄
        console.log(`\n👷 包含工班資訊的記錄：`);
        const contractorRecords = allRecords.filter(record => {
            const content = record.active_record_content || '';
            return content.includes('王大誠') || 
                   content.includes('工班') || 
                   content.includes('阿銘') || 
                   content.includes('阿彬') ||
                   content.includes('築愛家') ||
                   content.includes('塔塔家');
        });
        
        console.log(`找到 ${contractorRecords.length} 條包含工班資訊的記錄`);
        
        contractorRecords.slice(0, 5).forEach((record, idx) => {
            console.log(`\n${idx + 1}. ${new Date(record.create_time).toLocaleDateString()}`);
            console.log(`   創建人：${record.created_by__r?.name || '未知'}`);
            
            // 提取工班相關內容
            const content = record.active_record_content || '';
            const lines = content.split('\n');
            const contractorLines = lines.filter(line => 
                line.includes('王大誠') || 
                line.includes('工班') || 
                line.includes('阿銘') || 
                line.includes('阿彬') ||
                line.includes('築愛家') ||
                line.includes('塔塔家')
            );
            
            contractorLines.forEach(line => {
                console.log(`   - ${line.trim()}`);
            });
        });
        
        // API查詢總結
        console.log(`\n\n=== 🔧 API查詢總結 ===`);
        console.log(`\n✅ 已成功實現：`);
        console.log(`1. 跟進記錄查詢`);
        console.log(`   - 對象名稱：ActiveRecordObj`);
        console.log(`   - API端點：/cgi/crm/v2/data/query`);
        console.log(`   - 關聯欄位：related_object_data`);
        console.log(`   - 外部顯示：external_form_display__c__r`);
        
        console.log(`\n2. 關聯商機查詢`);
        console.log(`   - 商機ID：${XINGANXI_OPPORTUNITY_ID}`);
        console.log(`   - 商機名稱：勝興-興安西-2024`);
        console.log(`   - 關聯方式：related_object_data陣列`);
        
        console.log(`\n3. 跟進記錄欄位`);
        console.log(`   - 內容：active_record_content`);
        console.log(`   - 創建人：created_by__r`);
        console.log(`   - 創建時間：create_time`);
        console.log(`   - 類型：active_record_type__r`);
        console.log(`   - 重要程度：field_36Zg0__c__r`);
        console.log(`   - 擴展資料ID：extend_obj_data_id`);
        
        console.log(`\n❌ 尚未找到的功能：`);
        console.log(`1. 附件/圖片查詢API`);
        console.log(`2. 擴展資料詳情API`);
        console.log(`3. 文件下載API`);
        
        console.log(`\n💡 建議：`);
        console.log(`1. 跟進記錄內容中提到"如附件"，表示確實有附件`);
        console.log(`2. extend_obj_data_id 可能是查詢附件的關鍵`);
        console.log(`3. 可能需要額外的API文檔或權限來查詢附件`);
        console.log(`4. 建議聯繫紛享銷客技術支援獲取附件查詢的正確API`);
        
    } catch (error) {
        console.error('❌ 查詢失敗:', error.message);
    }
}

// 執行總結
console.log('開始生成跟進記錄總結報告...\n');
summarizeXinganxiFollowup().then(() => {
    console.log('\n📋 總結報告生成完成！');
}).catch(error => {
    console.error('總結過程中發生錯誤:', error);
});