/**
 * 直接同步腳本 - 不依賴 Cloudflare Workers
 * 直接調用 Fxiaoke API 並將結果保存到本地文件
 * 用於測試和驗證混合搜尋架構
 */

async function getTokenAndUser() {
    const APP_ID = 'FSAID_1320691';
    const APP_SECRET = 'ec63ff237c5c4a759be36d3a8fb7a3b4';
    const PERMANENT_CODE = '899433A4A04A3B8CB1CC2183DA4B5B48';
    const MOBILE = '17675662629'; // 測試手機號
    
    let fetch;
    try {
        fetch = (await import('node-fetch')).default;
    } catch (e) {
        console.log('❌ 需要安裝 node-fetch: npm install node-fetch');
        return null;
    }
    
    try {
        // Step 1: 獲取 Token
        console.log('🔑 獲取 Fxiaoke Token...');
        
        const tokenResponse = await fetch('https://open.fxiaoke.com/cgi/corpAccessToken/get/V2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                appId: APP_ID,
                appSecret: APP_SECRET,
                permanentCode: PERMANENT_CODE
            })
        });
        
        const tokenData = await tokenResponse.json();
        
        if (tokenData.errorCode !== 0) {
            console.error('❌ Token 獲取失敗:', tokenData.errorMessage);
            return null;
        }
        
        const token = tokenData.corpAccessToken;
        const corpId = tokenData.corpId;
        console.log('✅ Token 獲取成功');
        
        // Step 2: 獲取用戶信息
        console.log('👤 獲取用戶信息...');
        
        const userResponse = await fetch('https://open.fxiaoke.com/cgi/user/getByMobile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                mobile: MOBILE
            })
        });
        
        const userData = await userResponse.json();
        
        if (userData.errorCode !== 0) {
            console.error('❌ 用戶信息獲取失敗:', userData.errorMessage);
            return null;
        }
        
        const userId = userData.empList[0].openUserId;
        console.log('✅ 用戶信息獲取成功');
        
        return {
            token,
            corpId,
            userId
        };
        
    } catch (error) {
        console.error('❌ API 請求錯誤:', error);
        return null;
    }
}

async function queryOpportunities(authData, offset = 0, limit = 100) {
    let fetch;
    try {
        fetch = (await import('node-fetch')).default;
    } catch (e) {
        return [];
    }
    
    try {
        console.log(`📋 查詢商機 (偏移: ${offset}, 限制: ${limit})`);
        
        const response = await fetch('https://open.fxiaoke.com/cgi/crm/v2/data/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: authData.corpId,
                corpAccessToken: authData.token,
                currentOpenUserId: authData.userId,
                data: {
                    apiName: "NewOpportunityObj",
                    search_query_info: {
                        limit: limit,
                        offset: offset,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const data = await response.json();
        
        console.log('📄 API 響應:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
        
        if (data.errorCode === 0) {
            const opportunities = data.dataList || [];
            console.log(`✅ 成功獲取 ${opportunities.length} 個商機`);
            return {
                opportunities: opportunities,
                totalCount: data.totalCount || opportunities.length
            };
        } else {
            console.error('❌ 商機查詢失敗:', data.errorMessage);
            return { opportunities: [], totalCount: 0 };
        }
        
    } catch (error) {
        console.error('❌ 商機查詢錯誤:', error);
        return { opportunities: [], totalCount: 0 };
    }
}

async function getAllOpportunities(authData) {
    const allOpportunities = [];
    const limit = 100;
    let offset = 0;
    let hasMore = true;
    
    console.log('🔄 開始獲取所有商機...');
    
    while (hasMore) {
        const result = await queryOpportunities(authData, offset, limit);
        
        if (result.opportunities.length === 0) {
            hasMore = false;
        } else {
            allOpportunities.push(...result.opportunities);
            offset += limit;
            
            console.log(`📊 已獲取 ${allOpportunities.length} / ${result.totalCount || '未知'} 個商機`);
            
            // 如果獲取的數量少於限制，說明已經是最後一批
            if (result.opportunities.length < limit) {
                hasMore = false;
            }
            
            // 避免請求太頻繁
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    console.log(`✅ 總共獲取了 ${allOpportunities.length} 個商機`);
    return allOpportunities;
}

function formatOpportunities(opportunities) {
    return opportunities.map(opp => ({
        id: opp.id || opp._id,
        name: opp.name || opp.object_data?.name || '未知名稱',
        customer: opp.account_name || opp.object_data?.account_name || '未知客戶',
        amount: opp.amount || opp.object_data?.amount || 0,
        stage: opp.stage || opp.object_data?.stage || '未知階段',
        createTime: opp.create_time,
        updateTime: opp.update_time
    }));
}

async function saveOpportunitiesToFile(opportunities, filename = 'opportunities-sync.json') {
    const fs = require('fs');
    const path = '/mnt/c/claude code/工程進度網頁/' + filename;
    
    try {
        const data = {
            syncTime: new Date().toISOString(),
            totalCount: opportunities.length,
            opportunities: opportunities
        };
        
        fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
        console.log(`💾 商機數據已保存到: ${path}`);
        console.log(`📊 保存了 ${opportunities.length} 個商機`);
        
        return true;
    } catch (error) {
        console.error('❌ 保存文件錯誤:', error);
        return false;
    }
}

async function createSearchableData(opportunities) {
    // 創建可搜尋的數據結構
    const searchData = {
        syncTime: new Date().toISOString(),
        totalCount: opportunities.length,
        searchIndex: {},
        opportunities: {}
    };
    
    opportunities.forEach(opp => {
        // 添加到商機映射
        searchData.opportunities[opp.id] = opp;
        
        // 創建搜尋索引
        const searchTerms = [
            opp.name.toLowerCase(),
            opp.customer.toLowerCase()
        ].filter(term => term && term !== '未知名稱' && term !== '未知客戶');
        
        searchTerms.forEach(term => {
            const words = term.split(/[\s\-\u4e00-\u9fff]+/).filter(word => word.length > 0);
            words.forEach(word => {
                if (!searchData.searchIndex[word]) {
                    searchData.searchIndex[word] = [];
                }
                if (!searchData.searchIndex[word].includes(opp.id)) {
                    searchData.searchIndex[word].push(opp.id);
                }
            });
        });
    });
    
    // 保存搜尋數據
    const fs = require('fs');
    const path = '/mnt/c/claude code/工程進度網頁/opportunities-search-data.json';
    
    try {
        fs.writeFileSync(path, JSON.stringify(searchData, null, 2), 'utf8');
        console.log(`🔍 搜尋索引已保存到: ${path}`);
        console.log(`📊 索引包含 ${Object.keys(searchData.searchIndex).length} 個搜尋詞彙`);
        return true;
    } catch (error) {
        console.error('❌ 保存搜尋數據錯誤:', error);
        return false;
    }
}

async function testSearch(searchTerm = '勝興') {
    const fs = require('fs');
    const path = '/mnt/c/claude code/工程進度網頁/opportunities-search-data.json';
    
    try {
        const data = JSON.parse(fs.readFileSync(path, 'utf8'));
        
        console.log(`🔍 測試搜尋: "${searchTerm}"`);
        
        const lowerTerm = searchTerm.toLowerCase();
        const matchingIds = new Set();
        
        // 搜尋索引
        Object.keys(data.searchIndex).forEach(word => {
            if (word.includes(lowerTerm)) {
                data.searchIndex[word].forEach(id => matchingIds.add(id));
            }
        });
        
        // 獲取匹配的商機
        const results = Array.from(matchingIds).map(id => data.opportunities[id]);
        
        console.log(`✅ 找到 ${results.length} 個匹配結果:`);
        results.slice(0, 10).forEach((opp, i) => {
            console.log(`  ${i + 1}. ${opp.name} (${opp.customer})`);
        });
        
        return results;
        
    } catch (error) {
        console.error('❌ 搜尋測試錯誤:', error);
        return [];
    }
}

async function main() {
    console.log('🚀 直接同步 Fxiaoke CRM 商機');
    console.log('================================');
    
    // 1. 獲取 Token 和用戶信息
    const authData = await getTokenAndUser();
    if (!authData) {
        console.error('❌ 無法獲取認證信息，停止執行');
        return;
    }
    
    // 2. 獲取所有商機
    const rawOpportunities = await getAllOpportunities(authData);
    if (rawOpportunities.length === 0) {
        console.error('❌ 沒有獲取到商機數據');
        return;
    }
    
    // 3. 格式化數據
    const formattedOpportunities = formatOpportunities(rawOpportunities);
    
    // 4. 保存到文件
    await saveOpportunitiesToFile(formattedOpportunities);
    
    // 5. 創建搜尋索引
    await createSearchableData(formattedOpportunities);
    
    // 6. 測試搜尋功能
    console.log('\n🧪 測試搜尋功能:');
    await testSearch('勝興');
    await testSearch('樂田');
    await testSearch('坎城');
    
    console.log('\n🎉 直接同步完成！');
    console.log('💡 現在可以用這些數據測試混合搜尋架構了。');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    getTokenAndUser,
    getAllOpportunities,
    formatOpportunities,
    saveOpportunitiesToFile,
    testSearch
};