const puppeteer = require('puppeteer');

async function testSearchFixed() {
    console.log('🔍 測試搜尋功能...');
    
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
        
        // 尋找包含相關關鍵字的商機
        const keywords = ['建功', '勝興', '興安西', '樂田'];
        for (const keyword of keywords) {
            const matches = allOpportunities.filter(name => name.includes(keyword));
            if (matches.length > 0) {
                console.log(`✅ 找到包含"${keyword}"的商機 (${matches.length}個):`);
                matches.forEach((name, i) => {
                    console.log(`  ${i + 1}. ${name}`);
                });
            }
        }
        
        // 測試搜尋功能 - 使用第一個實際存在的商機關鍵字
        const testKeyword = '勝興';  // 我們知道有這個關鍵字的商機
        
        console.log(`\n🔎 測試搜尋功能 - 搜尋"${testKeyword}"...`);
        
        // 輸入搜尋關鍵字
        await page.evaluate((keyword) => {
            const searchInput = document.querySelector('#crmModal input[type="text"]');
            if (searchInput) {
                searchInput.value = keyword;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                console.log('已輸入搜尋關鍵字:', keyword);
                return true;
            }
            return false;
        }, testKeyword);
        
        // 等待篩選完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 檢查篩選結果
        const filteredResults = await page.evaluate(() => {
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
        
        console.log(`🎯 搜尋"${testKeyword}"後顯示的商機數量: ${filteredResults.length}`);
        
        if (filteredResults.length > 0) {
            console.log('📋 搜尋結果:');
            filteredResults.slice(0, 5).forEach((name, i) => {
                console.log(`  ${i + 1}. ${name}`);
            });
            
            const containsKeyword = filteredResults.some(name => name.includes(testKeyword));
            if (containsKeyword) {
                console.log('✅ 搜尋功能正常運作！');
            } else {
                console.log('❌ 搜尋結果不包含關鍵字，可能有問題');
            }
        } else {
            console.log('❌ 搜尋沒有結果，檢查功能是否正常');
        }
        
        // 清除搜尋並驗證
        console.log('\n🔄 清除搜尋並驗證還原功能...');
        await page.evaluate(() => {
            const searchInput = document.querySelector('#crmModal input[type="text"]');
            if (searchInput) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const restoredCount = await page.evaluate(() => {
            const items = document.querySelectorAll('.crm-item');
            return Array.from(items).filter(item => {
                const style = window.getComputedStyle(item);
                return style.display !== 'none' && style.visibility !== 'hidden';
            }).length;
        });
        
        console.log(`🔄 清除搜尋後顯示的商機數量: ${restoredCount}`);
        
        if (restoredCount === allOpportunities.length) {
            console.log('✅ 搜尋清除功能正常');
        } else {
            console.log('❌ 搜尋清除後數量不符');
        }
        
        // 最終截圖
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/search-function-test.png', 
            fullPage: true 
        });
        
        console.log('\n📊 搜尋功能測試總結:');
        console.log('==========================================');
        console.log(`✅ 商機總數: ${allOpportunities.length}`);
        console.log(`✅ 搜尋功能: ${filteredResults.length > 0 ? '正常' : '異常'}`);
        console.log(`✅ 清除功能: ${restoredCount === allOpportunities.length ? '正常' : '異常'}`);
        console.log('==========================================');
        
    } catch (error) {
        console.error('❌ 測試過程錯誤:', error);
    }
    
    await browser.close();
}

testSearchFixed();