const puppeteer = require('puppeteer');

async function debugSearchData() {
    console.log('🔍 除錯搜尋資料結構...');
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://progress.yes-ceramics.com/create', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // 監聽網路請求，查看 API 回應
        page.on('response', async response => {
            if (response.url().includes('/api/crm/opportunities')) {
                try {
                    const data = await response.json();
                    console.log('📊 CRM API 回應資料:');
                    console.log('總數量:', data.length || 'N/A');
                    if (data && data.length > 0) {
                        console.log('第一筆資料結構:', JSON.stringify(data[0], null, 2));
                        console.log('第二筆資料結構:', JSON.stringify(data[1], null, 2));
                    }
                } catch (e) {
                    console.log('無法解析 API 回應:', e.message);
                }
            }
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
        
        // 檢查 JavaScript 中的 opportunities 變數
        const debugInfo = await page.evaluate(() => {
            // 檢查全域變數
            const searchInput = document.querySelector('#crmModal input[type="text"]');
            
            return {
                hasSearchInput: !!searchInput,
                hasOnInput: searchInput && typeof searchInput.oninput === 'function',
                searchInputValue: searchInput ? searchInput.value : null,
                
                // 嘗試從 DOM 中找到商機資料
                crmItemsCount: document.querySelectorAll('.crm-item').length,
                
                // 檢查第一個商機的文字內容
                firstItemText: (() => {
                    const firstItem = document.querySelector('.crm-item');
                    if (firstItem) {
                        return {
                            fullText: firstItem.textContent.trim(),
                            nameEl: firstItem.querySelector('div[style*="font-weight: 600"]')?.textContent.trim(),
                            customerEl: firstItem.querySelector('div[style*="color: #666"]')?.textContent.trim()
                        };
                    }
                    return null;
                })()
            };
        });
        
        console.log('🔧 搜尋功能狀態檢查:');
        console.log(JSON.stringify(debugInfo, null, 2));
        
        // 測試手動觸發搜尋事件
        console.log('\n🧪 測試手動觸發搜尋...');
        
        const searchResult = await page.evaluate(() => {
            const searchInput = document.querySelector('#crmModal input[type="text"]');
            if (!searchInput) return 'No search input found';
            
            // 設置值並觸發事件
            searchInput.value = '樂田';
            
            // 手動觸發 input 事件
            const inputEvent = new Event('input', { bubbles: true, cancelable: true });
            searchInput.dispatchEvent(inputEvent);
            
            // 檢查是否有 oninput 函數
            if (typeof searchInput.oninput === 'function') {
                // 手動調用 oninput 函數
                searchInput.oninput({ target: searchInput });
            }
            
            return 'Search triggered';
        });
        
        console.log('🎯 手動觸發結果:', searchResult);
        
        // 等待一下後檢查結果
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const afterSearch = await page.evaluate(() => {
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
        
        console.log(`📋 手動觸發搜尋後可見項目數量: ${afterSearch.length}`);
        if (afterSearch.length > 0) {
            afterSearch.slice(0, 3).forEach((item, i) => {
                console.log(`  ${i + 1}. ${item}`);
            });
        }
        
    } catch (error) {
        console.error('❌ 除錯過程錯誤:', error);
    }
    
    await browser.close();
}

debugSearchData();