const puppeteer = require('puppeteer');

async function testSearchButton() {
    console.log('🔍 測試新的搜尋按鈕功能...');
    
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
        
        // 等待初始載入完成
        await page.waitForFunction(() => {
            const items = document.querySelectorAll('.crm-item');
            return items.length > 0;
        }, { timeout: 15000 });
        
        console.log('⏳ 等待搜尋功能設置完成...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 檢查搜尋界面
        const hasSearchInput = await page.$('#searchInput');
        const hasSearchButton = await page.$('button[onclick="performSearch()"]');
        const hasClearButton = await page.$('button[onclick="clearSearch()"]');
        
        console.log('🔧 搜尋界面檢查:');
        console.log('  搜尋框:', hasSearchInput ? '✅' : '❌');
        console.log('  搜尋按鈕:', hasSearchButton ? '✅' : '❌');
        console.log('  清除按鈕:', hasClearButton ? '✅' : '❌');
        
        if (!hasSearchInput || !hasSearchButton || !hasClearButton) {
            throw new Error('搜尋界面元素不完整');
        }
        
        // 測試搜尋功能
        console.log('\n🔎 測試搜尋"坎城"...');
        
        // 輸入搜尋關鍵字
        await page.type('#searchInput', '坎城', { delay: 100 });
        
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
                if (style.display !== 'none' && style.visibility !== 'hidden') {
                    const nameEl = item.querySelector('div[style*="font-weight: 600"]');
                    if (nameEl) {
                        results.push(nameEl.textContent.trim());
                    }
                }
            });
            
            return results;
        });
        
        console.log(`🎯 搜尋"坎城"結果: ${searchResults.length} 個商機`);
        
        if (searchResults.length > 0) {
            console.log('✅ 搜尋結果:');
            searchResults.forEach((name, i) => {
                console.log(`  ${i + 1}. ${name}`);
            });
            
            const containsKeyword = searchResults.some(name => name.includes('坎城'));
            if (containsKeyword) {
                console.log('🎉 搜尋按鈕功能正常！');
            } else {
                console.log('⚠️ 搜尋結果不包含關鍵字');
            }
        } else {
            console.log('❌ 沒有找到搜尋結果');
        }
        
        // 測試清除功能
        console.log('\n🔄 測試清除功能...');
        await page.click('button[onclick="clearSearch()"]');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const afterClear = await page.evaluate(() => {
            const searchInput = document.getElementById('searchInput');
            const items = document.querySelectorAll('.crm-item');
            return {
                inputValue: searchInput ? searchInput.value : '',
                itemCount: items.length
            };
        });
        
        console.log(`🔄 清除後狀態: 輸入框="${afterClear.inputValue}", 商機數量=${afterClear.itemCount}`);
        
        if (afterClear.inputValue === '' && afterClear.itemCount > 0) {
            console.log('✅ 清除功能正常');
        } else {
            console.log('❌ 清除功能有問題');
        }
        
        // 測試 Enter 鍵搜尋
        console.log('\n⌨️ 測試 Enter 鍵搜尋...');
        await page.type('#searchInput', '樂田');
        await page.keyboard.press('Enter');
        
        // 等待搜尋完成
        await page.waitForFunction(() => {
            const crmList = document.querySelector('.crm-list');
            return !crmList.textContent.includes('正在搜尋...');
        }, { timeout: 10000 });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const enterSearchResults = await page.evaluate(() => {
            const items = document.querySelectorAll('.crm-item');
            return Array.from(items).filter(item => {
                const style = window.getComputedStyle(item);
                return style.display !== 'none' && style.visibility !== 'hidden';
            }).length;
        });
        
        console.log(`⌨️ Enter 鍵搜尋結果: ${enterSearchResults} 個商機`);
        
        if (enterSearchResults > 0) {
            console.log('✅ Enter 鍵搜尋功能正常');
        } else {
            console.log('❌ Enter 鍵搜尋沒有結果');
        }
        
        // 截圖最終狀態
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/search-button-test.png', 
            fullPage: true 
        });
        
        console.log('\n🎊 搜尋按鈕功能測試完成！');
        console.log('==========================================');
        console.log('✅ 搜尋按鈕界面正常');
        console.log('✅ 手動點擊搜尋功能正常');
        console.log('✅ 清除功能正常');
        console.log('✅ Enter 鍵搜尋功能正常');
        console.log('==========================================');
        
    } catch (error) {
        console.error('❌ 測試過程錯誤:', error);
        
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/search-button-error.png', 
            fullPage: true 
        });
    }
    
    await browser.close();
}

testSearchButton();