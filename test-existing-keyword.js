const puppeteer = require('puppeteer');

async function testExistingKeyword() {
    console.log('🔍 測試已知存在的關鍵字搜尋...');
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // 監聽所有網路請求和響應
    page.on('response', async response => {
        if (response.url().includes('/api/crm/opportunities')) {
            console.log('\n🌐 CRM API 響應:', response.url());
            try {
                const data = await response.json();
                console.log('回應資料:', JSON.stringify(data, null, 2));
            } catch (e) {
                console.log('無法解析回應');
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
        
        // 等待初始商機載入
        await page.waitForFunction(() => {
            const items = document.querySelectorAll('.crm-item');
            return items.length > 0;
        }, { timeout: 15000 });
        
        // 獲取第一個商機的名稱來測試搜尋
        const firstOpportunityName = await page.evaluate(() => {
            const firstItem = document.querySelector('.crm-item');
            if (firstItem) {
                const nameEl = firstItem.querySelector('div[style*="font-weight: 600"]');
                return nameEl ? nameEl.textContent.trim() : '';
            }
            return '';
        });
        
        console.log('📋 第一個商機名稱:', firstOpportunityName);
        
        if (!firstOpportunityName) {
            throw new Error('無法獲取第一個商機名稱');
        }
        
        // 取商機名稱的一部分作為搜尋關鍵字
        const searchKeyword = firstOpportunityName.split('-')[0] || firstOpportunityName.substring(0, 2);
        console.log('🔍 將搜尋關鍵字:', searchKeyword);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 搜尋這個關鍵字
        const searchInput = await page.$('#crmModal input[type="text"]');
        await searchInput.click({ clickCount: 3 });
        await searchInput.type(searchKeyword, { delay: 100 });
        
        console.log('⏳ 等待搜尋結果...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
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
        
        console.log(`\n🎯 搜尋"${searchKeyword}"的結果: ${searchResults.length} 個商機`);
        
        if (searchResults.length > 0) {
            console.log('✅ 找到結果:');
            searchResults.slice(0, 5).forEach((name, i) => {
                console.log(`  ${i + 1}. ${name}`);
            });
            
            const containsKeyword = searchResults.some(name => 
                name.toLowerCase().includes(searchKeyword.toLowerCase())
            );
            
            if (containsKeyword) {
                console.log('🎉 搜尋功能正常 - 找到包含關鍵字的商機！');
            } else {
                console.log('⚠️ 搜尋結果不包含搜尋關鍵字，可能有問題');
            }
        } else {
            console.log('❌ 沒有找到任何結果，後端搜尋有問題');
        }
        
    } catch (error) {
        console.error('❌ 測試過程錯誤:', error);
    }
    
    await browser.close();
}

testExistingKeyword();