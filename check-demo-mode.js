const puppeteer = require('puppeteer');

async function checkDemoMode() {
    console.log('🕵️ 使用 Puppeteer 檢查演示模式狀況...\n');
    
    const browser = await puppeteer.launch({
        headless: false, // 設為 false 以便我們看到瀏覽器
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        console.log('📂 訪問主頁面...');
        await page.goto('https://construction-progress.lai-jameslai.workers.dev', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // 截圖主頁面
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/demo-check-main.png',
            fullPage: true
        });
        
        console.log('📋 尋找建立專案按鈕...');
        
        // 直接訪問建立專案頁面
        console.log('📋 訪問建立專案頁面...');
        await page.goto('https://construction-progress.lai-jameslai.workers.dev/create.html', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // 截圖建立專案頁面
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/demo-check-create.png',
            fullPage: true
        });
        
        console.log('🔍 尋找 CRM 商機選擇按鈕...');
        
        // 尋找並點擊 CRM 商機選擇按鈕
        const crmButton = await page.$('#selectOpportunityBtn, button[onclick*="crm"], button[onclick*="CRM"]');
        if (crmButton) {
            console.log('✅ 找到 CRM 按鈕，點擊...');
            await crmButton.click();
            await page.waitForFunction(() => {
                return document.querySelector('#crmOpportunityList') !== null;
            }, { timeout: 10000 }).catch(() => console.log('等待 CRM 列表載入超時')); // 等待 API 呼叫完成
            
            // 檢查是否出現演示模式訊息
            console.log('🔍 檢查演示模式訊息...');
            
            const demoMessages = await page.evaluate(() => {
                const messages = [];
                
                // 搜尋各種可能的演示模式文字
                const texts = [
                    '演示模式',
                    '演示數據',
                    '無法連接 CRM',
                    '顯示演示數據',
                    '目前使用演示數據'
                ];
                
                texts.forEach(text => {
                    const elements = Array.from(document.querySelectorAll('*')).filter(el => 
                        el.textContent && el.textContent.includes(text)
                    );
                    if (elements.length > 0) {
                        elements.forEach(el => {
                            messages.push({
                                text: text,
                                fullContent: el.textContent.trim(),
                                tagName: el.tagName,
                                className: el.className
                            });
                        });
                    }
                });
                
                return messages;
            });
            
            // 檢查載入的商機數據
            const crmData = await page.evaluate(() => {
                const crmList = document.querySelector('#crmOpportunityList, .crm-list, .opportunity-list');
                if (crmList) {
                    const items = crmList.querySelectorAll('li, .item, .opportunity-item');
                    return {
                        found: true,
                        count: items.length,
                        firstFew: Array.from(items).slice(0, 3).map(item => item.textContent.trim())
                    };
                }
                return { found: false };
            });
            
            console.log('\n📊 檢查結果:');
            console.log('='.repeat(50));
            
            if (demoMessages.length > 0) {
                console.log('❌ 發現演示模式訊息:');
                demoMessages.forEach((msg, i) => {
                    console.log(`  ${i + 1}. "${msg.text}" 在 ${msg.tagName} 元素中`);
                    console.log(`     完整內容: "${msg.fullContent}"`);
                });
            } else {
                console.log('✅ 未發現演示模式訊息');
            }
            
            if (crmData.found) {
                console.log(`\n📋 CRM 數據載入: ${crmData.count} 個商機`);
                if (crmData.firstFew.length > 0) {
                    console.log('   前幾個商機:');
                    crmData.firstFew.forEach((item, i) => {
                        console.log(`     ${i + 1}. ${item.substring(0, 50)}...`);
                    });
                }
            } else {
                console.log('❌ 未找到 CRM 數據列表');
            }
            
            // 檢查網路請求
            console.log('\n🌐 檢查 API 請求狀況...');
            
            const apiResponse = await page.evaluate(async () => {
                try {
                    const response = await fetch('/api/crm/opportunities');
                    const data = await response.json();
                    return {
                        status: response.status,
                        success: data.success,
                        count: data.count,
                        isDemo: data.isDemo,
                        message: data.message,
                        firstOpportunity: data.data?.[0]?.name
                    };
                } catch (error) {
                    return { error: error.message };
                }
            });
            
            console.log('API 回應:', apiResponse);
            
        } else {
            console.log('❌ 未找到 CRM 商機選擇按鈕');
        }
        
        // 最終截圖
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/demo-check-final.png',
            fullPage: true
        });
        
    } catch (error) {
        console.error('❌ 檢查過程中發生錯誤:', error);
        
        // 錯誤時也截圖
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/demo-check-error.png',
            fullPage: true
        });
    }
    
    console.log('\n📸 截圖已保存:');
    console.log('  - demo-check-main.png (主頁面)');
    console.log('  - demo-check-create.png (建立專案頁面)');
    console.log('  - demo-check-final.png (最終狀態)');
    
    await browser.close();
}

// 執行檢查
checkDemoMode().catch(console.error);