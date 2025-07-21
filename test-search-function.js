const puppeteer = require('puppeteer');

async function testSearchFunction() {
    console.log('🔍 測試商機搜尋功能...');
    
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
        
        // 等待商機載入
        await page.waitForFunction(() => {
            const items = document.querySelectorAll('.crm-item');
            return items.length > 0;
        }, { timeout: 15000 });
        
        const totalOpp = await page.evaluate(() => document.querySelectorAll('.crm-item').length);
        console.log(`📊 載入商機總數: ${totalOpp}`);
        
        // 測試搜尋功能
        console.log('🔎 測試搜尋"建功"...');
        
        // 找到搜尋框並輸入
        const searchBox = await page.$('input[placeholder*="搜尋"], input[type="text"]');
        if (searchBox) {
            await searchBox.click();
            await searchBox.type('建功');
            console.log('✅ 已在搜尋框輸入"建功"');
            
            // 等待一下看是否有自動篩選
            await page.waitForTimeout(1000);
            
            // 檢查篩選結果
            const filteredItems = await page.evaluate(() => {
                const items = document.querySelectorAll('.crm-item');
                const visibleItems = [];
                items.forEach(item => {
                    const style = window.getComputedStyle(item);
                    if (style.display !== 'none' && style.visibility !== 'hidden' && item.offsetParent !== null) {
                        const nameEl = item.querySelector('div[style*="font-weight: 600"]');
                        if (nameEl) {
                            visibleItems.push(nameEl.textContent.trim());
                        }
                    }
                });
                return visibleItems;
            });
            
            console.log(`🎯 搜尋"建功"後顯示的商機數量: ${filteredItems.length}`);
            
            if (filteredItems.length > 0) {
                console.log('📋 符合"建功"的商機:');
                filteredItems.forEach((item, i) => {
                    console.log(`  ${i + 1}. ${item}`);
                });
                
                // 檢查結果是否確實包含"建功"
                const containsKeyword = filteredItems.some(item => item.includes('建功'));
                if (containsKeyword) {
                    console.log('✅ 搜尋功能正常 - 找到包含"建功"的商機');
                } else {
                    console.log('❌ 搜尋結果不包含"建功"關鍵字');
                }
            } else {
                console.log('❌ 搜尋沒有結果，可能需要檢查搜尋功能');
                
                // 檢查是否有搜尋按鈕
                const searchButton = await page.$('button:contains("搜尋"), button:contains("搜索"), button[onclick*="search"]');
                if (searchButton) {
                    console.log('🔘 發現搜尋按鈕，嘗試點擊...');
                    await searchButton.click();
                    await page.waitForTimeout(2000);
                    
                    // 再次檢查結果
                    const afterClickItems = await page.evaluate(() => {
                        const items = document.querySelectorAll('.crm-item');
                        const visibleItems = [];
                        items.forEach(item => {
                            const style = window.getComputedStyle(item);
                            if (style.display !== 'none' && item.offsetParent !== null) {
                                const nameEl = item.querySelector('div[style*="font-weight: 600"]');
                                if (nameEl) visibleItems.push(nameEl.textContent.trim());
                            }
                        });
                        return visibleItems;
                    });
                    
                    console.log(`🎯 點擊搜尋按鈕後的結果數量: ${afterClickItems.length}`);
                    if (afterClickItems.length > 0) {
                        afterClickItems.slice(0, 5).forEach((item, i) => {
                            console.log(`  ${i + 1}. ${item}`);
                        });
                    }
                } else {
                    console.log('❌ 未找到搜尋按鈕');
                }
            }
            
        } else {
            console.log('❌ 未找到搜尋框');
        }
        
        // 截圖搜尋狀態
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/search-test.png', 
            fullPage: true 
        });
        
    } catch (error) {
        console.error('❌ 測試過程錯誤:', error);
    }
    
    await browser.close();
}

testSearchFunction();