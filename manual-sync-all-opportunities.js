/**
 * 手動同步所有 CRM 商機到 D1 資料庫
 * 一次性執行腳本，將完整的商機數據匯入到本地資料庫
 */

async function manualSyncAllOpportunities() {
    console.log('🚀 開始手動同步所有 CRM 商機到 D1 資料庫...');
    
    try {
        // 調用 Cloudflare Workers API 的同步端點
        const syncURL = 'https://progress.yes-ceramics.com/api/sync/opportunities';
        
        console.log('🔗 調用同步 API:', syncURL);
        
        const response = await fetch(syncURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API 呼叫失敗: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ 同步成功！');
            console.log('📊 同步統計:');
            console.log(`  - 同步數量: ${result.syncedCount}`);
            console.log(`  - 總商機數: ${result.totalCount}`);
            console.log(`  - 插入新商機: ${result.insertedCount || 0}`);
            console.log(`  - 更新商機: ${result.updatedCount || 0}`);
            console.log(`  - 執行時間: ${result.executionTime || 'N/A'}ms`);
            
            if (result.lastSyncTime) {
                console.log(`  - 上次同步: ${new Date(result.lastSyncTime).toLocaleString()}`);
            }
        } else {
            console.error('❌ 同步失敗:', result.error);
        }
        
    } catch (error) {
        console.error('❌ 手動同步過程錯誤:', error.message);
        
        // 如果是網路錯誤，建議檢查事項
        if (error.message.includes('fetch')) {
            console.log('\n🔧 建議檢查事項:');
            console.log('  1. 確保 Cloudflare Workers 已部署');
            console.log('  2. 確保 D1 資料庫已建立並綁定');
            console.log('  3. 確保 Fxiaoke API 憑證已設定');
            console.log('  4. 檢查網路連線');
        }
    }
}

// 執行 Node.js 環境下的同步（使用 node-fetch）
async function manualSyncWithNodeFetch() {
    console.log('🚀 使用 Node.js 環境手動同步...');
    
    try {
        // 如果在 Node.js 環境中執行，需要引入 node-fetch
        let fetch;
        try {
            fetch = (await import('node-fetch')).default;
        } catch (e) {
            console.log('❌ 需要安裝 node-fetch: npm install node-fetch');
            return;
        }
        
        const syncURL = 'https://progress.yes-ceramics.com/api/sync/opportunities';
        
        console.log('🔗 調用同步 API:', syncURL);
        
        const response = await fetch(syncURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Manual-Sync-Script/1.0'
            }
        });
        
        const responseText = await response.text();
        
        if (!response.ok) {
            console.error('❌ API 回應錯誤:');
            console.error(`狀態碼: ${response.status} ${response.statusText}`);
            console.error(`回應內容: ${responseText}`);
            return;
        }
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ 無法解析 API 回應:', responseText);
            return;
        }
        
        if (result.success) {
            console.log('✅ 同步成功！');
            console.log('📊 同步統計:');
            console.log(`  - 同步數量: ${result.syncedCount}`);
            console.log(`  - 總商機數: ${result.totalCount}`);
            console.log(`  - 插入新商機: ${result.insertedCount || 0}`);
            console.log(`  - 更新商機: ${result.updatedCount || 0}`);
            console.log(`  - 執行時間: ${result.executionTime || 'N/A'}ms`);
        } else {
            console.error('❌ 同步失敗:', result.error);
        }
        
    } catch (error) {
        console.error('❌ 手動同步過程錯誤:', error.message);
    }
}

// 檢查同步狀態的函數
async function checkSyncStatus() {
    console.log('📊 檢查同步狀態...');
    
    try {
        let fetch;
        try {
            fetch = (await import('node-fetch')).default;
        } catch (e) {
            console.log('❌ 需要安裝 node-fetch: npm install node-fetch');
            return;
        }
        
        const statusURL = 'https://progress.yes-ceramics.com/api/sync/status';
        
        const response = await fetch(statusURL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const status = await response.json();
            
            console.log('📈 同步狀態:');
            console.log(`  - 狀態: ${status.status}`);
            console.log(`  - 上次同步: ${status.lastSyncTime ? new Date(status.lastSyncTime).toLocaleString() : '從未同步'}`);
            console.log(`  - 上次同步數量: ${status.lastSyncCount || 0}`);
            console.log(`  - 訊息: ${status.message || 'N/A'}`);
        } else {
            console.error('❌ 無法獲取同步狀態');
        }
        
    } catch (error) {
        console.error('❌ 檢查狀態錯誤:', error.message);
    }
}

// 主執行函數
async function main() {
    console.log('🏗️ 興安西工程進度管理系統 - 商機數據同步工具');
    console.log('================================================');
    
    // 1. 檢查當前同步狀態
    await checkSyncStatus();
    
    console.log('\n💾 開始執行完整同步...');
    
    // 2. 執行完整同步
    await manualSyncWithNodeFetch();
    
    console.log('\n🔍 同步完成後再次檢查狀態...');
    
    // 3. 再次檢查狀態確認
    await checkSyncStatus();
    
    console.log('\n🎉 手動同步流程完成！');
    console.log('現在可以測試混合搜尋功能了。');
}

// 如果直接執行此腳本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    manualSyncAllOpportunities,
    manualSyncWithNodeFetch,
    checkSyncStatus
};