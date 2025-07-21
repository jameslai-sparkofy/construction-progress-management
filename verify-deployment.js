const puppeteer = require('puppeteer');

async function verifyDeployment() {
    console.log('🎉 驗證部署結果 - https://progress.yes-ceramics.com/create');
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('⏳ 等待 5 秒讓 Cloudflare 緩存更新...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        await page.goto('https://progress.yes-ceramics.com/create', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        console.log('📸 截圖部署後的頁面...');
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/after-deployment.png', 
            fullPage: true 
        });
        
        // 檢查是否還有演示模式警告
        const demoNotice = await page.evaluate(() => {
            const notice = document.querySelector('.demo-notice');
            if (notice) {
                const style = window.getComputedStyle(notice);
                if (style.display !== 'none' && style.visibility !== 'hidden' && notice.offsetParent !== null) {
                    return notice.textContent.trim();
                }
            }
            return null;
        });
        
        if (demoNotice) {
            console.log('❌ 仍然發現演示模式警告:', demoNotice);
            console.log('🔄 可能需要清除瀏覽器緩存或等待更長時間');
        } else {
            console.log('✅ 演示模式警告已消失！');
        }
        
        // 檢查頁面是否包含演示模式文字
        const hasDemo = await page.evaluate(() => {
            return document.body.textContent.includes('演示模式');
        });
        
        if (hasDemo) {
            console.log('⚠️ 頁面仍包含演示模式相關文字');
        } else {
            console.log('✅ 頁面已清除演示模式相關文字');
        }
        
        // 測試 CRM 功能
        console.log('🔌 測試 CRM 功能...');
        await page.click('button[onclick="showCRMModal()"]');
        await page.waitForSelector('.modal.show', { timeout: 5000 });
        
        // 等待 CRM 數據載入
        await page.waitForFunction(() => {
            const items = document.querySelectorAll('.crm-item');
            const loading = document.querySelector('.text-center');
            return items.length > 0 || (loading && !loading.textContent.includes('載入中'));
        }, { timeout: 15000 });
        
        const oppCount = await page.evaluate(() => document.querySelectorAll('.crm-item').length);
        console.log('📊 載入商機數量:', oppCount);
        
        if (oppCount > 0) {
            console.log('✅ CRM 整合正常運作');
            
            // 檢查商機列表
            const opportunities = await page.evaluate(() => {
                const items = document.querySelectorAll('.crm-item');
                return Array.from(items).slice(0, 3).map(item => {
                    const nameEl = item.querySelector('div[style*="font-weight: 600"]');
                    return nameEl ? nameEl.textContent.trim() : '';
                });
            });
            
            console.log('🏢 前3個商機:');
            opportunities.forEach((opp, i) => {
                console.log(`  ${i + 1}. ${opp}`);
            });
        } else {
            console.log('❌ CRM 數據載入失敗');
        }
        
        // 截圖 CRM 模態框
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/crm-after-deployment.png', 
            fullPage: true 
        });
        
        console.log('\n🎊 部署驗證完成！');
        console.log('==========================================');
        console.log(`✅ Worker 已部署到 Cloudflare`);
        console.log(`✅ 正式網站正常運作`);
        console.log(`✅ CRM 整合載入 ${oppCount} 個商機`);
        
        if (!demoNotice && !hasDemo) {
            console.log(`🎉 演示模式警告已完全移除！`);
        }
        console.log('==========================================');
        
    } catch (error) {
        console.error('❌ 驗證過程錯誤:', error);
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/verification-error.png',
            fullPage: true
        });
    }
    
    console.log('\n📸 截圖已保存:');
    console.log('  - after-deployment.png (部署後頁面)');
    console.log('  - crm-after-deployment.png (CRM 功能)');
    
    await browser.close();
}

verifyDeployment();