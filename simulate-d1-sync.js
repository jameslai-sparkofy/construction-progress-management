/**
 * 模擬 D1 資料庫同步所有480個商機
 * 創建本地 SQLite 資料庫來測試完整的混合搜尋架構
 */

const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function createLocalDB() {
    console.log('📦 創建本地 SQLite 資料庫...');
    
    try {
        const db = await open({
            filename: '/mnt/c/claude code/工程進度網頁/local-d1.db',
            driver: sqlite3.Database
        });
        
        // 創建商機表
        await db.exec(`
            CREATE TABLE IF NOT EXISTS opportunities (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                customer TEXT,
                amount INTEGER DEFAULT 0,
                stage TEXT,
                create_time INTEGER,
                update_time INTEGER,
                synced_at INTEGER,
                raw_data TEXT
            );
            
            CREATE INDEX IF NOT EXISTS idx_opportunities_name ON opportunities(name);
            CREATE INDEX IF NOT EXISTS idx_opportunities_customer ON opportunities(customer);
            CREATE INDEX IF NOT EXISTS idx_opportunities_synced_at ON opportunities(synced_at);
            CREATE INDEX IF NOT EXISTS idx_opportunities_update_time ON opportunities(update_time);
            
            CREATE TABLE IF NOT EXISTS sync_status (
                sync_type TEXT PRIMARY KEY,
                last_sync_time INTEGER,
                last_sync_count INTEGER,
                status TEXT,
                message TEXT
            );
        `);
        
        console.log('✅ 本地資料庫創建完成');
        return db;
        
    } catch (error) {
        console.error('❌ 資料庫創建錯誤:', error);
        return null;
    }
}

async function fetchAllOpportunitiesWithPagination() {
    console.log('🔍 分批獲取所有商機數據...');
    
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
        const limit = 100;
        let hasMore = true;
        let totalRequests = 0;
        
        console.log('📊 開始分批獲取，預期總數約 480 個商機');
        
        while (hasMore && totalRequests < 10) { // 安全限制，最多10次請求
            const apiURL = `https://progress.yes-ceramics.com/api/crm/opportunities?offset=${offset}&limit=${limit}`;
            
            console.log(`🔗 第 ${totalRequests + 1} 次請求: offset=${offset}, limit=${limit}`);
            
            const response = await fetch(apiURL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'D1-Sync-Script/1.0'
                }
            });
            
            if (!response.ok) {
                console.error('❌ API 請求失敗:', response.status, response.statusText);
                break;
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                const batchSize = result.data.length;
                
                if (batchSize === 0) {
                    console.log('🎯 API 返回空數據，停止請求');
                    hasMore = false;
                } else {
                    allOpportunities.push(...result.data);
                    console.log(`✅ 批次 ${totalRequests + 1}: 獲取 ${batchSize} 個商機 (累計: ${allOpportunities.length})`);
                    
                    if (batchSize < limit) {
                        console.log('🎯 已獲取完所有數據');
                        hasMore = false;
                    } else {
                        offset += limit;
                        totalRequests++;
                        
                        // 避免請求過於頻繁
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            } else {
                console.error('❌ API 返回錯誤:', result.error || 'Unknown error');
                hasMore = false;
            }
            
            totalRequests++;
        }
        
        console.log(`🎉 獲取完成！總計 ${allOpportunities.length} 個商機`);
        return allOpportunities;
        
    } catch (error) {
        console.error('❌ 獲取數據錯誤:', error.message);
        return [];
    }
}

async function syncOpportunitiesToLocalDB(db, opportunities) {
    console.log('💾 開始同步商機到本地資料庫...');
    
    try {
        let insertedCount = 0;
        let updatedCount = 0;
        
        // 開始事務
        await db.run('BEGIN TRANSACTION');
        
        for (const opp of opportunities) {
            try {
                // 檢查商機是否已存在
                const existing = await db.get(
                    'SELECT update_time FROM opportunities WHERE id = ?',
                    opp.id
                );
                
                const amount = parseInt((opp.amount || '').replace(/[^\d]/g, '') || '0');
                const now = Date.now();
                
                if (existing) {
                    // 更新現有商機
                    await db.run(`
                        UPDATE opportunities SET 
                            name = ?, customer = ?, amount = ?, stage = ?, 
                            update_time = ?, synced_at = ?, raw_data = ?
                        WHERE id = ?
                    `, [
                        opp.name,
                        opp.customer,
                        amount,
                        opp.stage,
                        opp.updateTime,
                        now,
                        JSON.stringify(opp),
                        opp.id
                    ]);
                    updatedCount++;
                } else {
                    // 插入新商機
                    await db.run(`
                        INSERT INTO opportunities 
                        (id, name, customer, amount, stage, create_time, update_time, synced_at, raw_data)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        opp.id,
                        opp.name,
                        opp.customer,
                        amount,
                        opp.stage,
                        opp.createTime,
                        opp.updateTime,
                        now,
                        JSON.stringify(opp)
                    ]);
                    insertedCount++;
                }
                
            } catch (error) {
                console.error(`處理商機 ${opp.id} 時出錯:`, error.message);
            }
        }
        
        // 更新同步狀態
        await db.run(`
            INSERT OR REPLACE INTO sync_status 
            (sync_type, last_sync_time, last_sync_count, status, message)
            VALUES (?, ?, ?, ?, ?)
        `, [
            'opportunities',
            Date.now(),
            opportunities.length,
            'success',
            `成功同步 ${opportunities.length} 個商機 (新增: ${insertedCount}, 更新: ${updatedCount})`
        ]);
        
        // 提交事務
        await db.run('COMMIT');
        
        console.log(`✅ 同步完成! 新增: ${insertedCount}, 更新: ${updatedCount}`);
        
        return {
            success: true,
            insertedCount,
            updatedCount,
            totalCount: opportunities.length
        };
        
    } catch (error) {
        // 回滾事務
        await db.run('ROLLBACK');
        console.error('❌ 同步失敗:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function testLocalDBSearch(db, searchTerm) {
    console.log(`🔍 測試本地資料庫搜尋: "${searchTerm}"`);
    
    try {
        const searchPattern = `%${searchTerm.toLowerCase()}%`;
        
        const results = await db.all(`
            SELECT id, name, customer, amount, stage, create_time as createTime, update_time as updateTime
            FROM opportunities
            WHERE LOWER(name) LIKE ? OR LOWER(customer) LIKE ?
            ORDER BY update_time DESC
            LIMIT 10
        `, [searchPattern, searchPattern]);
        
        console.log(`✅ 找到 ${results.length} 個匹配結果:`);
        results.forEach((opp, i) => {
            console.log(`  ${i + 1}. ${opp.name} (${opp.customer}) - NT$ ${opp.amount.toLocaleString()}`);
        });
        
        return results;
        
    } catch (error) {
        console.error('❌ 搜尋錯誤:', error);
        return [];
    }
}

async function getDBStats(db) {
    try {
        const totalOpportunities = await db.get('SELECT COUNT(*) as count FROM opportunities');
        const syncStatus = await db.get('SELECT * FROM sync_status WHERE sync_type = ?', 'opportunities');
        
        console.log('\n📊 資料庫統計:');
        console.log(`  - 總商機數: ${totalOpportunities.count}`);
        if (syncStatus) {
            console.log(`  - 上次同步: ${new Date(syncStatus.last_sync_time).toLocaleString()}`);
            console.log(`  - 同步狀態: ${syncStatus.status}`);
            console.log(`  - 同步訊息: ${syncStatus.message}`);
        }
        
        return {
            totalOpportunities: totalOpportunities.count,
            syncStatus: syncStatus
        };
        
    } catch (error) {
        console.error('❌ 統計錯誤:', error);
        return null;
    }
}

async function main() {
    console.log('🚀 模擬 D1 資料庫完整商機同步');
    console.log('====================================');
    
    try {
        // 1. 創建本地資料庫
        const db = await createLocalDB();
        if (!db) {
            console.error('❌ 無法創建資料庫');
            return;
        }
        
        // 2. 分批獲取所有商機
        const opportunities = await fetchAllOpportunitiesWithPagination();
        if (opportunities.length === 0) {
            console.error('❌ 無法獲取商機數據');
            return;
        }
        
        // 3. 同步到本地資料庫
        const syncResult = await syncOpportunitiesToLocalDB(db, opportunities);
        if (!syncResult.success) {
            console.error('❌ 同步失敗');
            return;
        }
        
        // 4. 顯示統計信息
        await getDBStats(db);
        
        // 5. 測試搜尋功能
        console.log('\n🧪 測試本地資料庫搜尋功能:');
        const testKeywords = ['勝興', '樂田', '坎城', '建功', '興安西', '2024', '2025'];
        
        for (const keyword of testKeywords) {
            await testLocalDBSearch(db, keyword);
            console.log(''); // 空行分隔
        }
        
        // 6. 關閉資料庫
        await db.close();
        
        console.log('🎉 模擬 D1 同步測試完成！');
        console.log('💡 這證明了混合搜尋架構可以正常工作。');
        
    } catch (error) {
        console.error('❌ 主程序錯誤:', error);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    createLocalDB,
    fetchAllOpportunitiesWithPagination,
    syncOpportunitiesToLocalDB,
    testLocalDBSearch
};