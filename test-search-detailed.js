const puppeteer = require('puppeteer');

async function testSearchDetailed() {
    console.log('🔍 詳細測試搜尋功能...');
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://progress.yes-ceramics.com/create', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // 開啟 CRM 模態框
        console.log('📂 開啟 CRM 模態框...');
        await page.click('button[onclick="showCRMModal()"]');
        await page.waitForSelector('.modal.show', { timeout: 5000 });
        
        // 等待商機載入完成
        await page.waitForFunction(() => {
            const items = document.querySelectorAll('.crm-item');
            return items.length > 0;
        }, { timeout: 15000 });
        
        // 獲取所有商機名稱
        const allOpportunities = await page.evaluate(() => {
            const items = document.querySelectorAll('.crm-item');
            return Array.from(items).map(item => {
                const nameEl = item.querySelector('div[style*="font-weight: 600"]');
                return nameEl ? nameEl.textContent.trim() : '';
            });
        });
        
        console.log(`📊 載入商機總數: ${allOpportunities.length}`);
        console.log('🔍 檢查是否有包含"建功"的商機:');
        
        const matchingOpp = allOpportunities.filter(name => name.includes('建功'));
        if (matchingOpp.length > 0) {
            console.log('✅ 找到包含"建功"的商機:');
            matchingOpp.forEach((name, i) => {
                console.log(`  ${i + 1}. ${name}`);
            });
        } else {
            console.log('❌ 沒有找到包含"建功"的商機');
            console.log('📋 顯示前10個商機供參考:');
            allOpportunities.slice(0, 10).forEach((name, i) => {
                console.log(`  ${i + 1}. ${name}`);
            });
        }
        
        // 測試搜尋功能
        console.log('\n🔎 測試搜尋功能...');
        
        // 直接操作搜尋框
        await page.evaluate(() => {
            const searchInput = document.querySelector('#crmModal input[type="text"]');
            if (searchInput) {
                // 模擬輸入事件
                searchInput.value = '建功';
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                return true;
            }
            return false;
        });
        
        await page.waitForTimeout(1000);
        
        // 檢查搜尋結果
        const filteredItems = await page.evaluate(() => {
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
        
        console.log(`🎯 搜尋"建功"後的結果數量: ${filteredItems.length}`);
        
        if (filteredItems.length > 0) {
            console.log('📋 搜尋結果:');
            filteredItems.forEach((name, i) => {
                console.log(`  ${i + 1}. ${name}`);
            });
            
            const containsKeyword = filteredItems.some(name => name.includes('建功'));
            if (containsKeyword) {
                console.log('✅ 搜尋功能正常運作');
            } else {
                console.log('⚠️ 搜尋結果不包含關鍵字');
            }
        } else {
            console.log('❌ 搜尋沒有結果');
            
            // 檢查搜尋功能是否有設置
            const searchSetup = await page.evaluate(() => {
                const searchInput = document.querySelector('#crmModal input[type="text"]');
                return {
                    hasInput: !!searchInput,
                    hasEventListener: searchInput && typeof searchInput.oninput === 'function',
                    value: searchInput ? searchInput.value : 'N/A'
                };
            });
            
            console.log('🔧 搜尋功能狀態:', searchSetup);
        }
        
        // 清除搜尋，測試其他關鍵字
        console.log('\n🔄 測試其他搜尋關鍵字...');
        
        const testKeywords = ['勝興', '興安西', '2024', '2025'];
        
        for (const keyword of testKeywords) {
            console.log(`\n🔎 測試搜尋"${keyword}"...`);
            
            await page.evaluate((kw) => {
                const searchInput = document.querySelector('#crmModal input[type="text"]');
                if (searchInput) {
                    searchInput.value = kw;
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }, keyword);
            
            await page.waitForTimeout(500);
            
            const results = await page.evaluate(() => {
                const items = document.querySelectorAll('.crm-item');
                return Array.from(items).filter(item => {
                    const style = window.getComputedStyle(item);
                    return style.display !== 'none' && style.visibility !== 'hidden';
                }).length;
            });
            
            console.log(`📊 "${keyword}" 的搜尋結果: ${results} 個商機`);
        }
        
        // 截圖搜尋狀態
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/search-detailed-test.png', 
            fullPage: true 
        });
        
    } catch (error) {
        console.error('❌ 測試過程錯誤:', error);
    }
    
    await browser.close();
}

testSearchDetailed();