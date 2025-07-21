const puppeteer = require('puppeteer');

async function debugSearchAPI() {
    console.log('🔍 除錯搜尋 API 響應...');
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // 詳細監聽網路請求
    page.on('response', async response => {
        if (response.url().includes('/api/crm/opportunities/search')) {
            console.log('\n🌐 CRM 搜尋 API 請求詳情:');
            console.log('URL:', response.url());
            console.log('狀態:', response.status());
            console.log('狀態文字:', response.statusText());
            
            try {
                const responseText = await response.text();
                console.log('原始響應:', responseText);
                
                const data = JSON.parse(responseText);
                console.log('解析後的資料:', JSON.stringify(data, null, 2));
                
            } catch (e) {
                console.log('響應解析錯誤:', e.message);
            }
        }
    });
    
    // 監聽請求
    page.on('request', request => {
        if (request.url().includes('/api/crm/opportunities/search')) {
            console.log('\n📤 發送搜尋請求:', request.url());
            console.log('方法:', request.method());
            console.log('標頭:', request.headers());
        }
    });
    
    try {
        await page.goto('https://progress.yes-ceramics.com/create', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // 開啟 CRM 模態框
        await page.click('button[onclick="showCRMModal()"]');
        await page.waitForSelector('.modal.show', { timeout: 5000 });
        
        // 等待初始載入完成
        await page.waitForFunction(() => {
            const items = document.querySelectorAll('.crm-item');
            return items.length > 0;
        }, { timeout: 15000 });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 測試搜尋"建功"
        console.log('🔎 測試搜尋"建功"...');
        
        const searchInput = await page.$('#crmModal input[type="text"]');
        await searchInput.click({ clickCount: 3 });
        await searchInput.type('建功', { delay: 100 });
        
        // 等待搜尋完成
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 也測試其他搜尋詞
        console.log('\n🔎 測試搜尋"勝美"...');
        await searchInput.click({ clickCount: 3 });
        await searchInput.type('勝美', { delay: 100 });
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 測試搜尋"2023"
        console.log('\n🔎 測試搜尋"2023"...');
        await searchInput.click({ clickCount: 3 });
        await searchInput.type('2023', { delay: 100 });
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
    } catch (error) {
        console.error('❌ 除錯過程錯誤:', error);
    }
    
    await browser.close();
}

debugSearchAPI();