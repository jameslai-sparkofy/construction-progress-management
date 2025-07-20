// 查詢所有與興安西相關的案場
const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function searchXinganxiSites() {
    console.log('=== 查詢所有興安西相關案場 ===\n');
    
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
        
        // Step 3: 查詢案場資料（分批查詢以獲取所有資料）
        console.log('3. 查詢所有案場資料...');
        let allSites = [];
        let offset = 0;
        const limit = 100;
        let hasMore = true;
        
        while (hasMore) {
            const siteResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    corpId: corpId,
                    corpAccessToken: token,
                    currentOpenUserId: userId,
                    data: {
                        dataObjectApiName: "object_8W9cb__c",
                        search_query_info: {
                            limit: limit,
                            offset: offset,
                            orders: [{fieldName: "create_time", isAsc: "false"}]
                        }
                    }
                })
            });
            
            const siteResult = await siteResponse.json();
            
            if (siteResult.errorCode !== 0) {
                throw new Error(`案場查詢失敗: ${siteResult.errorMessage}`);
            }
            
            const batchSites = siteResult.data.dataList || [];
            allSites = allSites.concat(batchSites);
            
            if (batchSites.length < limit) {
                hasMore = false;
            } else {
                offset += limit;
                console.log(`  已查詢 ${allSites.length} 條記錄...`);
            }
        }
        
        console.log(`✅ 案場資料查詢成功！總共獲取到 ${allSites.length} 條記錄\n`);
        
        // Step 4: 篩選興安西相關案場
        console.log('4. 篩選興安西相關案場...');
        const xinganxiSites = allSites.filter(site => {
            // 檢查所有字符串類型的欄位
            for (const [key, value] of Object.entries(site)) {
                if (value && typeof value === 'string') {
                    if (value.includes('興安西')) {
                        return true;
                    }
                }
            }
            return false;
        });
        
        console.log(`\n找到 ${xinganxiSites.length} 個興安西相關案場\n`);
        
        if (xinganxiSites.length > 0) {
            console.log('=== 興安西相關案場列表 ===');
            
            // 分析案場
            const siteAnalysis = {};
            
            xinganxiSites.forEach((site, index) => {
                console.log(`\n案場 ${index + 1}:`);
                console.log(`  ID: ${site._id}`);
                console.log(`  名稱: ${site.name}`);
                console.log(`  商機: ${site.field_1P96q__c || '未知'}`);
                console.log(`  工班: ${site.shift_time__c || '未知'}`);
                console.log(`  創建時間: ${new Date(site.create_time).toLocaleDateString()}`);
                
                // 找出包含興安西的欄位
                console.log('  包含"興安西"的欄位:');
                for (const [key, value] of Object.entries(site)) {
                    if (value && typeof value === 'string' && value.includes('興安西')) {
                        console.log(`    ${key}: ${value}`);
                    }
                }
                
                // 統計商機
                const opportunity = site.field_1P96q__c || '未知商機';
                if (!siteAnalysis[opportunity]) {
                    siteAnalysis[opportunity] = {
                        count: 0,
                        sites: []
                    };
                }
                siteAnalysis[opportunity].count++;
                siteAnalysis[opportunity].sites.push({
                    id: site._id,
                    name: site.name,
                    contractor: site.shift_time__c
                });
            });
            
            // 輸出統計
            console.log('\n=== 按商機分組統計 ===');
            for (const [opportunity, data] of Object.entries(siteAnalysis)) {
                console.log(`\n商機: ${opportunity}`);
                console.log(`  案場數量: ${data.count}`);
                console.log('  案場列表:');
                data.sites.forEach((site, idx) => {
                    console.log(`    ${idx + 1}. ${site.name} (工班: ${site.contractor || '未指定'})`);
                });
            }
            
            // 總結
            console.log('\n=== 總結 ===');
            console.log(`總共找到 ${xinganxiSites.length} 個興安西相關案場`);
            console.log(`涉及 ${Object.keys(siteAnalysis).length} 個不同的商機`);
            
            // 列出所有不同的商機
            console.log('\n所有相關商機:');
            Object.keys(siteAnalysis).forEach((opp, idx) => {
                console.log(`  ${idx + 1}. ${opp} (${siteAnalysis[opp].count} 個案場)`);
            });
        }
        
    } catch (error) {
        console.error('❌ 查詢失敗:', error.message);
    }
}

// 執行查詢
searchXinganxiSites();