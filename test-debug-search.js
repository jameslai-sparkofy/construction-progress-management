const puppeteer = require('puppeteer');

async function testDebugSearch() {
    console.log('🔍 測試除錯版搜尋功能...');
    
    const browser = await puppeteer.launch({ headless: false, devtools: true });
    const page = await browser.newPage();
    
    // 監聽 console 日誌
    page.on('console', msg => {
        console.log('🖥️ ', msg.text());
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
        
        // 等待載入完成
        await page.waitForFunction(() => {
            const items = document.querySelectorAll('.crm-item');
            return items.length > 0;
        }, { timeout: 15000 });
        
        console.log('⏳ 等待 3 秒讓搜尋功能完全設置...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 測試搜尋功能
        console.log('🔎 開始測試搜尋...');
        
        // 在搜尋框輸入 "樂田"
        await page.focus('#crmModal input[type="text"]');
        await page.type('#crmModal input[type="text"]', '樂田', { delay: 100 });
        
        console.log('⏳ 等待搜尋結果...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 檢查搜尋結果
        const searchResults = await page.evaluate(() => {
            const items = document.querySelectorAll('.crm-item');
            const visibleItems = [];
            items.forEach(item => {
                const style = window.getComputedStyle(item);
                if (style.display !== 'none' && style.visibility !== 'hidden') {
                    const nameEl = item.querySelector('div[style*="font-weight: 600"]');
                    if (nameEl) {
                        visibleItems.push(nameEl.textContent.trim());
                    }
                }
            });
            return visibleItems;
        });
        
        console.log(`🎯 搜尋"樂田"的結果數量: ${searchResults.length}`);
        if (searchResults.length > 0) {
            console.log('📋 搜尋結果:');
            searchResults.forEach((name, i) => {
                console.log(`  ${i + 1}. ${name}`);
            });
        }
        
        // 清除搜尋框
        await page.evaluate(() => {
            const searchInput = document.querySelector('#crmModal input[type="text"]');
            if (searchInput) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 測試另一個關鍵字
        console.log('\n🔎 測試搜尋"坎城"...');
        await page.focus('#crmModal input[type="text"]');
        await page.type('#crmModal input[type="text"]', '坎城', { delay: 100 });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const searchResults2 = await page.evaluate(() => {
            const items = document.querySelectorAll('.crm-item');
            const visibleItems = [];
            items.forEach(item => {
                const style = window.getComputedStyle(item);
                if (style.display !== 'none' && style.visibility !== 'hidden') {
                    const nameEl = item.querySelector('div[style*="font-weight: 600"]');
                    if (nameEl) {
                        visibleItems.push(nameEl.textContent.trim());
                    }
                }
            });
            return visibleItems;
        });
        
        console.log(`🎯 搜尋"坎城"的結果數量: ${searchResults2.length}`);
        if (searchResults2.length > 0) {
            console.log('📋 搜尋結果:');
            searchResults2.forEach((name, i) => {
                console.log(`  ${i + 1}. ${name}`);
            });
        }
        
        // 截圖
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/debug-search-test.png', 
            fullPage: true 
        });
        
    } catch (error) {
        console.error('❌ 測試過程錯誤:', error);
    }
    
    await browser.close();
}

testDebugSearch();