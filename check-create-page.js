const puppeteer = require('puppeteer');

async function checkCreatePage() {
    console.log('🔍 檢查正式網站建立頁面 - https://progress.yes-ceramics.com/create');
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://progress.yes-ceramics.com/create', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // 截圖
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/production-create-check.png', 
            fullPage: true 
        });
        
        // 檢查演示模式通知
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
            console.log('❌ 發現演示模式通知:', demoNotice);
        } else {
            console.log('✅ 未發現可見的演示模式通知');
        }
        
        // 檢查頁面中是否有 "演示模式" 文字
        const demoText = await page.evaluate(() => {
            return document.body.textContent.includes('演示模式');
        });
        
        if (demoText) {
            console.log('❌ 頁面包含 "演示模式" 文字');
        } else {
            console.log('✅ 頁面不包含 "演示模式" 文字');
        }
        
        // 測試 CRM 載入
        console.log('🔌 測試 CRM 功能...');
        try {
            await page.click('button[onclick="showCRMModal()"]');
            await page.waitForSelector('.modal.show', { timeout: 5000 });
            
            // 等待載入中文字消失或商機出現
            await page.waitForFunction(() => {
                const loadingText = document.querySelector('.text-center');
                const items = document.querySelectorAll('.crm-item');
                return items.length > 0 || (loadingText && !loadingText.textContent.includes('載入中'));
            }, { timeout: 15000 });
            
            const oppCount = await page.evaluate(() => document.querySelectorAll('.crm-item').length);
            console.log('📊 載入商機數量:', oppCount);
            
            if (oppCount > 0) {
                console.log('✅ CRM 數據載入成功');
                
                // 檢查前幾個商機名稱
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
                console.log('❌ 沒有載入到 CRM 數據');
                
                // 檢查是否有錯誤訊息
                const errorMsg = await page.evaluate(() => {
                    const textCenter = document.querySelector('.text-center');
                    return textCenter ? textCenter.textContent.trim() : '';
                });
                
                if (errorMsg) {
                    console.log('📝 顯示訊息:', errorMsg);
                }
            }
            
            // 再次截圖顯示 CRM 模態框
            await page.screenshot({ 
                path: '/mnt/c/claude code/工程進度網頁/production-crm-check.png', 
                fullPage: true 
            });
            
        } catch (error) {
            console.log('❌ CRM 載入失敗:', error.message);
        }
        
    } catch (error) {
        console.error('❌ 檢查過程錯誤:', error);
    }
    
    await browser.close();
}

checkCreatePage();