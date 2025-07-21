const puppeteer = require('puppeteer');

async function testJiangong() {
    console.log('🔍 測試是否有"建功"相關商機...');
    
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
        
        // 等待載入完成
        await page.waitForFunction(() => {
            const items = document.querySelectorAll('.crm-item');
            return items.length > 0;
        }, { timeout: 15000 });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 獲取所有商機名稱
        const allOpportunities = await page.evaluate(() => {
            const items = document.querySelectorAll('.crm-item');
            return Array.from(items).map(item => {
                const nameEl = item.querySelector('div[style*="font-weight: 600"]');
                const customerEl = item.querySelector('div[style*="color: #666"]');
                return {
                    name: nameEl ? nameEl.textContent.trim() : '',
                    customer: customerEl ? customerEl.textContent.split('|')[0].replace('客戶：', '').trim() : ''
                };
            });
        });
        
        console.log(`📊 載入商機總數: ${allOpportunities.length}`);
        
        // 搜尋包含各種關鍵字的商機
        const keywords = ['建功', '建', '功', '段', '竹北', '勝利', '新竹'];
        
        for (const keyword of keywords) {
            const matches = allOpportunities.filter(opp => 
                opp.name.includes(keyword) || opp.customer.includes(keyword)
            );
            
            if (matches.length > 0) {
                console.log(`✅ 找到包含"${keyword}"的商機 (${matches.length}個):`);
                matches.slice(0, 3).forEach((opp, i) => {
                    console.log(`  ${i + 1}. ${opp.name} (客戶: ${opp.customer})`);
                });
            } else {
                console.log(`❌ 沒有找到包含"${keyword}"的商機`);
            }
        }
        
        // 特別尋找可能與"建功段"相關的商機
        console.log('\n🎯 尋找可能與"建功段"相關的商機:');
        const relatedTerms = ['建功段', '建功', '新竹', '竹北'];
        
        for (const term of relatedTerms) {
            console.log(`\n🔎 測試搜尋"${term}"...`);
            
            // 清空搜尋框
            await page.evaluate(() => {
                const searchInput = document.querySelector('#crmModal input[type="text"]');
                if (searchInput) {
                    searchInput.value = '';
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 輸入搜尋關鍵字
            await page.focus('#crmModal input[type="text"]');
            await page.type('#crmModal input[type="text"]', term, { delay: 50 });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const results = await page.evaluate(() => {
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
            
            console.log(`📊 搜尋"${term}"結果: ${results.length} 個商機`);
            if (results.length > 0) {
                results.slice(0, 3).forEach((name, i) => {
                    console.log(`  ${i + 1}. ${name}`);
                });
            }
        }
        
        // 顯示一些商機作為參考
        console.log('\n📋 商機列表參考 (前15個):');
        allOpportunities.slice(0, 15).forEach((opp, i) => {
            console.log(`${i + 1}. ${opp.name}`);
        });
        
    } catch (error) {
        console.error('❌ 測試過程錯誤:', error);
    }
    
    await browser.close();
}

testJiangong();