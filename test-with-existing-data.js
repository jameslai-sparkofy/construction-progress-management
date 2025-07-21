/**
 * 使用現有生產環境的 CRM API 來測試混合搜尋架構
 * 直接從 Cloudflare Workers 的 CRM API 端點獲取數據
 */

async function fetchOpportunitiesFromProduction() {
    console.log('🔍 從生產環境獲取所有商機數據...');
    
    try {
        let fetch;
        try {
            fetch = (await import('node-fetch')).default;
        } catch (e) {
            console.log('❌ 需要安裝 node-fetch: npm install node-fetch');
            return [];
        }
        
        const allOpportunities = [];
        let offset = 0;
        const limit = 100; // 每次獲取100個
        let hasMore = true;
        
        console.log('📊 預計總數：480 個商機');
        
        while (hasMore) {
            const apiURL = `https://progress.yes-ceramics.com/api/crm/opportunities?offset=${offset}&limit=${limit}`;
            
            console.log(`🔗 調用 CRM API (第 ${Math.floor(offset/limit) + 1} 批): ${apiURL}`);
            
            const response = await fetch(apiURL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Batch-Sync-Script/1.0'
                }
            });
            
            if (!response.ok) {
                console.error('❌ API 請求失敗:', response.status, response.statusText);
                break;
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                const batchSize = result.data.length;
                allOpportunities.push(...result.data);
                
                console.log(`✅ 第 ${Math.floor(offset/limit) + 1} 批獲取成功：${batchSize} 個商機 (累計: ${allOpportunities.length}/480)`);
                
                // 如果這批數據少於限制數量，說明已經是最後一批
                if (batchSize < limit) {
                    hasMore = false;
                    console.log('🎯 已到達數據末尾');
                } else {
                    offset += limit;
                    // 避免請求過於頻繁
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } else {
                console.error('❌ API 返回錯誤:', result.error || 'Unknown error');
                hasMore = false;
            }
        }
        
        console.log(`🎉 完成！總共獲取 ${allOpportunities.length} 個商機`);
        
        return allOpportunities;
        
    } catch (error) {
        console.error('❌ 獲取數據錯誤:', error.message);
        return [];
    }
}

function saveOpportunitiesToFile(opportunities, filename = 'production-opportunities.json') {
    const fs = require('fs');
    const path = `/mnt/c/claude code/工程進度網頁/${filename}`;
    
    try {
        const data = {
            syncTime: new Date().toISOString(),
            totalCount: opportunities.length,
            source: 'production-api',
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

function createSearchIndex(opportunities) {
    console.log('🔍 創建搜尋索引...');
    
    const searchIndex = {};
    const opportunityMap = {};
    
    opportunities.forEach(opp => {
        // 儲存商機映射
        opportunityMap[opp.id] = opp;
        
        // 創建搜尋關鍵字
        const searchTerms = [
            opp.name || '',
            opp.customer || ''
        ].filter(term => term && term !== '未知名稱' && term !== '未知客戶');
        
        searchTerms.forEach(term => {
            const lowerTerm = term.toLowerCase();
            
            // 按字符拆分（支援中文）
            for (let i = 0; i < lowerTerm.length; i++) {
                for (let j = i + 1; j <= lowerTerm.length; j++) {
                    const substring = lowerTerm.substring(i, j);
                    if (substring.length >= 1) {
                        if (!searchIndex[substring]) {
                            searchIndex[substring] = new Set();
                        }
                        searchIndex[substring].add(opp.id);
                    }
                }
            }
            
            // 按分隔符拆分
            const words = lowerTerm.split(/[\s\-\u4e00-\u9fff_]+/).filter(word => word.length > 0);
            words.forEach(word => {
                if (word.length > 0) {
                    if (!searchIndex[word]) {
                        searchIndex[word] = new Set();
                    }
                    searchIndex[word].add(opp.id);
                }
            });
        });
    });
    
    // 轉換 Set 為 Array 以便序列化
    const finalIndex = {};
    Object.keys(searchIndex).forEach(key => {
        finalIndex[key] = Array.from(searchIndex[key]);
    });
    
    console.log(`✅ 搜尋索引創建完成，包含 ${Object.keys(finalIndex).length} 個關鍵字`);
    
    return {
        index: finalIndex,
        opportunities: opportunityMap
    };
}

function saveSearchIndex(searchData, filename = 'search-index.json') {
    const fs = require('fs');
    const path = `/mnt/c/claude code/工程進度網頁/${filename}`;
    
    try {
        const data = {
            syncTime: new Date().toISOString(),
            totalOpportunities: Object.keys(searchData.opportunities).length,
            totalKeywords: Object.keys(searchData.index).length,
            source: 'production-api',
            searchIndex: searchData.index,
            opportunities: searchData.opportunities
        };
        
        fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
        console.log(`🔍 搜尋索引已保存到: ${path}`);
        console.log(`📊 索引包含 ${Object.keys(searchData.index).length} 個關鍵字`);
        
        return true;
    } catch (error) {
        console.error('❌ 保存搜尋索引錯誤:', error);
        return false;
    }
}

function performLocalSearch(searchTerm, searchData) {
    console.log(`🔍 搜尋: "${searchTerm}"`);
    
    const lowerTerm = searchTerm.toLowerCase();
    const matchingIds = new Set();
    
    // 搜尋索引中包含關鍵字的項目
    Object.keys(searchData.index).forEach(key => {
        if (key.includes(lowerTerm)) {
            searchData.index[key].forEach(id => matchingIds.add(id));
        }
    });
    
    // 獲取匹配的商機
    const results = Array.from(matchingIds).map(id => searchData.opportunities[id]).filter(opp => opp);
    
    console.log(`✅ 找到 ${results.length} 個匹配結果:`);
    results.slice(0, 10).forEach((opp, i) => {
        console.log(`  ${i + 1}. ${opp.name} (${opp.customer})`);
    });
    
    return results;
}

async function testMultipleSearches(searchData) {
    console.log('\n🧪 測試多個搜尋關鍵字...');
    
    const testKeywords = ['勝興', '樂田', '坎城', '建功', '興安西', '2024', '2025'];
    
    for (const keyword of testKeywords) {
        console.log(`\n--- 測試關鍵字: "${keyword}" ---`);
        const results = performLocalSearch(keyword, searchData);
        
        if (results.length > 0) {
            console.log(`🎯 找到 ${results.length} 個結果`);
        } else {
            console.log('❌ 未找到匹配結果');
        }
        
        // 間隔一下
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

async function main() {
    console.log('🚀 使用生產環境數據測試混合搜尋架構');
    console.log('==========================================');
    
    // 1. 從生產環境獲取商機數據
    const opportunities = await fetchOpportunitiesFromProduction();
    if (opportunities.length === 0) {
        console.error('❌ 無法獲取商機數據，停止測試');
        return;
    }
    
    // 2. 保存原始數據
    await saveOpportunitiesToFile(opportunities);
    
    // 3. 創建搜尋索引
    const searchData = createSearchIndex(opportunities);
    
    // 4. 保存搜尋索引
    await saveSearchIndex(searchData);
    
    // 5. 測試搜尋功能
    await testMultipleSearches(searchData);
    
    console.log('\n🎉 測試完成！');
    console.log('💡 現在可以用這些數據模擬混合搜尋架構了。');
    console.log('💡 生產環境有 D1 資料庫後，可以直接導入這些數據進行測試。');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    fetchOpportunitiesFromProduction,
    createSearchIndex,
    performLocalSearch,
    testMultipleSearches
};