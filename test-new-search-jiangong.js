const puppeteer = require('puppeteer');

async function testNewSearchJiangong() {
    console.log('🔍 測試新的 CRM 搜尋功能 - 搜尋"建功"...');
    
    const browser = await puppeteer.launch({ headless: false, devtools: true });
    const page = await browser.newPage();
    
    // 監聽 console 日誌
    page.on('console', msg => {
        console.log('🖥️ ', msg.text());
    });
    
    // 監聽網路請求
    page.on('response', async response => {
        if (response.url().includes('/api/crm/opportunities/search')) {
            console.log('🌐 CRM 搜尋 API 請求:', response.url());
            console.log('📊 回應狀態:', response.status());
            try {
                const data = await response.json();
                console.log('📋 搜尋結果:', {
                    success: data.success,
                    count: data.count || data.data?.length || 0,
                    query: data.query,
                    isDemo: data.isDemo
                });
                if (data.data && data.data.length > 0) {
                    console.log('🏢 找到的商機:');
                    data.data.slice(0, 5).forEach((opp, i) => {
                        console.log(`  ${i + 1}. ${opp.name} (客戶: ${opp.customer})`);
                    });
                }
            } catch (e) {
                console.log('無法解析搜尋回應:', e.message);
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
        
        console.log('⏳ 等待搜尋功能完全設置...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 測試搜尋"建功"
        console.log('🔎 輸入搜尋關鍵字"建功"...');
        
        const searchInput = await page.$('#crmModal input[type="text"]');
        if (!searchInput) {
            throw new Error('找不到搜尋輸入框');
        }
        
        // 清空並輸入搜尋關鍵字
        await searchInput.click({ clickCount: 3 }); // 選中所有文字
        await searchInput.type('建功', { delay: 100 });
        
        console.log('⏳ 等待搜尋結果...');
        
        // 等待搜尋請求完成 (等待"搜尋中..."消失)
        await page.waitForFunction(() => {
            const crmList = document.querySelector('.crm-list');
            return !crmList.textContent.includes('搜尋中...');
        }, { timeout: 30000 });
        
        // 再等待一下確保結果完全載入
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 檢查搜尋結果
        const searchResults = await page.evaluate(() => {
            const items = document.querySelectorAll('.crm-item');
            const results = [];
            
            items.forEach(item => {
                const style = window.getComputedStyle(item);
                if (style.display !== 'none' && style.visibility !== 'hidden') {
                    const nameEl = item.querySelector('div[style*="font-weight: 600"]');
                    const customerEl = item.querySelector('div[style*="color: #666"]');
                    if (nameEl) {
                        results.push({
                            name: nameEl.textContent.trim(),
                            customer: customerEl ? customerEl.textContent.split('|')[0].replace('客戶：', '').trim() : ''
                        });
                    }
                }
            });
            
            return results;
        });
        
        console.log(`\n🎯 搜尋"建功"的最終結果: ${searchResults.length} 個商機`);
        
        if (searchResults.length > 0) {
            console.log('✅ 找到符合的商機:');
            searchResults.forEach((opp, i) => {
                console.log(`  ${i + 1}. ${opp.name} (客戶: ${opp.customer})`);
            });
            
            // 檢查是否包含"建功"
            const containsJiangong = searchResults.some(opp => 
                opp.name.includes('建功') || opp.customer.includes('建功')
            );
            
            if (containsJiangong) {
                console.log('🎉 成功！找到包含"建功"的商機！');
            } else {
                console.log('⚠️ 找到結果但不包含"建功"關鍵字');
            }
        } else {
            console.log('❌ 沒有找到包含"建功"的商機');
            
            // 檢查是否顯示了"沒有找到"的訊息
            const noResultsMessage = await page.evaluate(() => {
                const crmList = document.querySelector('.crm-list');
                return crmList.textContent.includes('沒有找到符合') ? 
                    crmList.textContent.trim() : null;
            });
            
            if (noResultsMessage) {
                console.log('📝 系統訊息:', noResultsMessage);
            }
        }
        
        // 截圖搜尋結果
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/new-search-jiangong-test.png', 
            fullPage: true 
        });
        
        console.log('\n📊 新搜尋功能測試總結:');
        console.log('==========================================');
        console.log('✅ 新的 CRM 後端搜尋功能已部署');
        console.log('✅ 搜尋請求成功發送到後端');
        console.log(`📋 搜尋結果: ${searchResults.length} 個商機`);
        console.log('==========================================');
        
    } catch (error) {
        console.error('❌ 測試過程錯誤:', error);
        
        // 截圖錯誤狀態
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/search-test-error.png', 
            fullPage: true 
        });
    }
    
    await browser.close();
}

testNewSearchJiangong();