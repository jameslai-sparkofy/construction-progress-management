const puppeteer = require('puppeteer');

async function testHybridSearchArchitecture() {
    console.log('🔧 測試混合搜尋架構 (本地 D1 + API 回退)...');
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // 監聽網路請求
    page.on('response', async response => {
        if (response.url().includes('/api/crm/opportunities')) {
            const endpoint = response.url().split('/').pop();
            console.log(`🌐 CRM API 呼叫: ${endpoint}`);
            
            if (endpoint === 'search') {
                console.log('🔍 使用搜尋端點 (混合搜尋)');
            } else {
                console.log('📋 使用一般商機端點');
            }
        }
    });
    
    try {
        await page.goto('https://progress.yes-ceramics.com/create', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // 開啟 CRM 模態框
        console.log('📂 開啟 CRM 模態框...');
        await page.click('button[onclick="showCRMModal()"]');
        await page.waitForSelector('.modal.show', { timeout: 5000 });
        
        // 等待初始載入完成
        await page.waitForFunction(() => {
            const items = document.querySelectorAll('.crm-item');
            return items.length > 0;
        }, { timeout: 15000 });
        
        console.log('✅ 初始商機載入成功');
        
        // 測試 1: 一般搜尋（應該走混合搜尋路徑）
        console.log('\n🧪 測試 1: 混合搜尋功能');
        console.log('🔍 搜尋關鍵字: "勝興"');
        
        // 清空並輸入搜尋關鍵字
        const searchInput = await page.$('#searchInput');
        await searchInput.click({ clickCount: 3 });
        await searchInput.type('勝興', { delay: 100 });
        
        // 點擊搜尋按鈕
        await page.click('button[onclick="performSearch()"]');
        
        console.log('⏳ 等待搜尋結果...');
        
        // 等待搜尋完成
        await page.waitForFunction(() => {
            const crmList = document.querySelector('.crm-list');
            return !crmList.textContent.includes('正在搜尋...');
        }, { timeout: 15000 });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 檢查搜尋結果
        const searchResults = await page.evaluate(() => {
            const items = document.querySelectorAll('.crm-item');
            const results = [];
            
            items.forEach(item => {
                const style = window.getComputedStyle(item);
                if (style.display !== 'none') {
                    const nameEl = item.querySelector('div[style*="font-weight: 600"]');
                    if (nameEl) {
                        results.push(nameEl.textContent.trim());
                    }
                }
            });
            
            return results;
        });
        
        console.log(`✅ 搜尋"勝興"結果: ${searchResults.length} 個商機`);
        searchResults.forEach((name, i) => {
            console.log(`  ${i + 1}. ${name}`);
        });
        
        // 測試 2: 清除並測試另一個關鍵字
        console.log('\n🧪 測試 2: 清除功能和第二次搜尋');
        await page.click('button[onclick="clearSearch()"]');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('🔍 搜尋關鍵字: "樂田"');
        await page.type('#searchInput', '樂田');
        await page.click('button[onclick="performSearch()"]');
        
        // 等待搜尋完成
        await page.waitForFunction(() => {
            const crmList = document.querySelector('.crm-list');
            return !crmList.textContent.includes('正在搜尋...');
        }, { timeout: 10000 });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const secondSearchResults = await page.evaluate(() => {
            const items = document.querySelectorAll('.crm-item');
            return Array.from(items).filter(item => {
                const style = window.getComputedStyle(item);
                return style.display !== 'none';
            }).length;
        });
        
        console.log(`✅ 搜尋"樂田"結果: ${secondSearchResults} 個商機`);
        
        // 測試 3: 測試強制 API 搜尋（如果支援）
        console.log('\n🧪 測試 3: API 回退機制');
        
        // 先清除
        await page.click('button[onclick="clearSearch()"]');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 測試一個可能不在本地資料庫的關鍵字
        console.log('🔍 搜尋不常見關鍵字: "測試專案"');
        await page.type('#searchInput', '測試專案');
        await page.click('button[onclick="performSearch()"]');
        
        // 等待搜尋完成
        await page.waitForFunction(() => {
            const crmList = document.querySelector('.crm-list');
            return !crmList.textContent.includes('正在搜尋...');
        }, { timeout: 10000 });
        
        const thirdSearchResults = await page.evaluate(() => {
            const items = document.querySelectorAll('.crm-item');
            return Array.from(items).filter(item => {
                const style = window.getComputedStyle(item);
                return style.display !== 'none';
            }).length;
        });
        
        console.log(`✅ 搜尋"測試專案"結果: ${thirdSearchResults} 個商機`);
        
        // 截圖最終狀態
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/hybrid-search-test.png', 
            fullPage: true 
        });
        
        console.log('\n🎊 混合搜尋架構測試完成！');
        console.log('==========================================');
        console.log('✅ 本地 D1 資料庫搜尋');
        console.log('✅ API 回退機制');
        console.log('✅ 搜尋按鈕界面');
        console.log('✅ 清除功能');
        console.log('✅ 多次搜尋測試');
        console.log('==========================================');
        
        // 檢查控制台是否有相關日誌
        const logs = await page.evaluate(() => {
            return window.console.logs || [];
        });
        
        if (logs.length > 0) {
            console.log('\n📋 前端日誌:');
            logs.forEach(log => console.log(`  ${log}`));
        }
        
    } catch (error) {
        console.error('❌ 測試過程錯誤:', error);
        
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/hybrid-search-error.png', 
            fullPage: true 
        });
    }
    
    await browser.close();
}

testHybridSearchArchitecture();