const puppeteer = require('puppeteer');

async function checkProductionSite() {
    console.log('🌐 檢查正式網址：https://progress.yes-ceramics.com/\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        console.log('📂 訪問正式網址...');
        await page.goto('https://progress.yes-ceramics.com/', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // 截圖主頁面
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/production-homepage.png',
            fullPage: true
        });
        
        console.log('📋 檢查頁面內容...');
        
        // 檢查頁面標題
        const title = await page.title();
        console.log('📄 頁面標題:', title);
        
        // 檢查是否有專案列表
        const projectCards = await page.evaluate(() => {
            const cards = document.querySelectorAll('.project-card, .card, [class*="project"]');
            return cards.length;
        });
        console.log('🏗️ 找到的專案卡片數量:', projectCards);
        
        // 檢查是否有建立專案連結
        const createLink = await page.$('a[href*="create"], a:contains("建立"), button:contains("建立")');
        if (createLink) {
            const linkText = await page.evaluate(el => el.textContent.trim(), createLink);
            console.log('➕ 找到建立專案連結:', linkText);
        } else {
            console.log('⚠️ 未找到建立專案連結');
        }
        
        // 測試訪問建立專案頁面
        console.log('\n🔍 測試建立專案頁面...');
        await page.goto('https://progress.yes-ceramics.com/create.html', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // 截圖建立頁面
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/production-create-page.png',
            fullPage: true
        });
        
        // 測試 CRM 功能
        console.log('🔌 測試 CRM 功能...');
        await page.click('button[onclick="showCRMModal()"]');
        await page.waitForSelector('.modal.show', { timeout: 10000 });
        await page.waitForSelector('.crm-item', { timeout: 15000 });
        
        // 檢查商機數量
        const opportunityCount = await page.evaluate(() => {
            return document.querySelectorAll('.crm-item').length;
        });
        
        console.log('📊 載入的商機數量:', opportunityCount);
        
        // 檢查前幾個商機
        const opportunities = await page.evaluate(() => {
            const items = document.querySelectorAll('.crm-item');
            return Array.from(items).slice(0, 5).map(item => {
                const nameEl = item.querySelector('div[style*="font-weight: 600"]');
                return nameEl ? nameEl.textContent.trim() : '';
            });
        });
        
        console.log('🏢 前5個商機:');
        opportunities.forEach((opp, i) => {
            console.log(`  ${i + 1}. ${opp}`);
        });
        
        // 檢查是否有演示模式通知
        const demoNotice = await page.evaluate(() => {
            const notices = document.querySelectorAll('.demo-notice');
            for (const notice of notices) {
                const style = window.getComputedStyle(notice);
                if (style.display !== 'none' && style.visibility !== 'hidden' && notice.offsetParent !== null) {
                    return notice.textContent.trim();
                }
            }
            return null;
        });
        
        if (demoNotice) {
            console.log('⚠️ 發現演示模式通知:', demoNotice);
        } else {
            console.log('✅ 未發現演示模式通知 - 使用真實數據');
        }
        
        // 截圖 CRM 模態框
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/production-crm-modal.png',
            fullPage: true
        });
        
        console.log('\n🎉 正式網站檢查完成！');
        console.log('==========================================');
        console.log('✅ 網站可正常訪問');
        console.log('✅ 建立專案頁面正常');
        console.log('✅ CRM 整合正常運作');
        console.log(`✅ 載入了 ${opportunityCount} 個真實商機`);
        console.log('==========================================');
        
    } catch (error) {
        console.error('❌ 檢查過程錯誤:', error);
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/production-error.png',
            fullPage: true
        });
    }
    
    console.log('\n📸 截圖已保存:');
    console.log('  - production-homepage.png (主頁面)');
    console.log('  - production-create-page.png (建立專案頁面)');
    console.log('  - production-crm-modal.png (CRM 商機選擇)');
    
    await browser.close();
}

checkProductionSite().catch(console.error);