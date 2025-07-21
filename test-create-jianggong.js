const puppeteer = require('puppeteer');

async function testCreateProject() {
    console.log('🏗️ 測試建立「建功段」專案管理系統...\n');
    
    const browser = await puppeteer.launch({
        headless: false, // 設為 false 以便觀察過程
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        console.log('📂 1. 訪問建立專案頁面...');
        await page.goto('https://construction-progress.lai-jameslai.workers.dev/create.html', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // 截圖初始頁面
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/test-step1-initial.png',
            fullPage: true
        });
        
        console.log('🔍 2. 點擊選擇商機按鈕...');
        await page.click('button[onclick="showCRMModal()"]');
        
        // 等待模態框出現
        await page.waitForSelector('.modal.show', { timeout: 10000 });
        console.log('✅ 模態框已出現');
        
        // 等待商機數據載入
        await page.waitForSelector('.crm-item', { timeout: 15000 });
        console.log('✅ 商機數據已載入');
        
        // 截圖商機列表
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/test-step2-crm-list.png',
            fullPage: true
        });
        
        console.log('🔎 3. 搜尋「建功段」...');
        
        // 在搜尋框中輸入「建功段」
        const searchInput = await page.$('#crmModal input[type="text"]');
        if (searchInput) {
            await searchInput.type('建功段');
            await page.waitForTimeout(1000); // 等待搜尋結果更新
            
            // 截圖搜尋結果
            await page.screenshot({ 
                path: '/mnt/c/claude code/工程進度網頁/test-step3-search-results.png',
                fullPage: true
            });
            
            // 檢查搜尋結果
            const searchResults = await page.evaluate(() => {
                const items = document.querySelectorAll('.crm-item');
                return Array.from(items).map(item => {
                    const nameEl = item.querySelector('div[style*="font-weight: 600"]');
                    return nameEl ? nameEl.textContent.trim() : '';
                }).filter(name => name.includes('建功段') || name.includes('建功'));
            });
            
            console.log('🎯 找到包含「建功段」的商機:', searchResults);
            
            if (searchResults.length > 0) {
                console.log(`✅ 找到 ${searchResults.length} 個相關商機`);
                
                // 點擊第一個建功段相關的商機
                await page.evaluate(() => {
                    const items = document.querySelectorAll('.crm-item');
                    for (const item of items) {
                        const nameEl = item.querySelector('div[style*="font-weight: 600"]');
                        if (nameEl && (nameEl.textContent.includes('建功段') || nameEl.textContent.includes('建功'))) {
                            item.click();
                            return;
                        }
                    }
                });
                
                console.log('✅ 已選擇建功段相關商機');
                
            } else {
                console.log('⚠️ 未找到「建功段」相關商機，選擇第一個商機進行測試');
                
                // 選擇第一個商機
                await page.click('.crm-item:first-child');
            }
            
        } else {
            console.log('⚠️ 未找到搜尋框，選擇第一個商機');
            await page.click('.crm-item:first-child');
        }
        
        // 等待一下讓選擇生效
        await page.waitForTimeout(1000);
        
        // 截圖選擇結果
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/test-step4-selected.png',
            fullPage: true
        });
        
        console.log('📋 4. 填寫專案基本資訊...');
        
        // 填寫專案簡稱
        const projectSlugInput = await page.$('input[placeholder*="專案簡稱"]');
        if (projectSlugInput) {
            await projectSlugInput.clear();
            await projectSlugInput.type('jianggong-project');
            console.log('✅ 已填寫專案簡稱: jianggong-project');
        }
        
        // 填寫專案顯示名稱
        const projectNameInput = await page.$('input[placeholder*="專案顯示名稱"]');
        if (projectNameInput) {
            await projectNameInput.clear();
            await projectNameInput.type('建功段工程專案');
            console.log('✅ 已填寫專案名稱: 建功段工程專案');
        }
        
        // 選擇建築棟數（保持預設的3棟）
        console.log('✅ 使用預設建築配置: 3棟');
        
        // 填寫總樓層數
        const floorsInput = await page.$('input[placeholder*="總樓層數"]');
        if (floorsInput) {
            await floorsInput.clear();
            await floorsInput.type('12');
            console.log('✅ 已填寫總樓層數: 12層');
        }
        
        // 截圖填寫完成的表單
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/test-step5-form-filled.png',
            fullPage: true
        });
        
        console.log('🎯 5. 檢查專案 URL 預覽...');
        
        // 檢查生成的 URL
        const urlPreview = await page.evaluate(() => {
            const preview = document.querySelector('.url-preview');
            return preview ? preview.textContent.trim() : '';
        });
        
        if (urlPreview) {
            console.log('🔗 專案 URL 預覽:', urlPreview);
        }
        
        console.log('🎨 6. 提交建立專案...');
        
        // 尋找建立專案按鈕
        const createButton = await page.$('button:contains("建立專案"), button[onclick*="create"], .btn-success');
        if (createButton) {
            await createButton.click();
            console.log('✅ 已點擊建立專案按鈕');
            
            // 等待建立完成（可能有成功訊息或跳轉）
            await page.waitForTimeout(3000);
            
            // 截圖最終結果
            await page.screenshot({ 
                path: '/mnt/c/claude code/工程進度網頁/test-step6-final.png',
                fullPage: true
            });
            
            // 檢查是否有成功訊息
            const successMessage = await page.evaluate(() => {
                const success = document.querySelector('.success-message.show, .success-message[style*="display: block"]');
                return success ? success.textContent.trim() : null;
            });
            
            if (successMessage) {
                console.log('🎉 專案建立成功!', successMessage);
            } else {
                console.log('⚠️ 未檢測到明確的成功訊息，請檢查截圖');
            }
            
        } else {
            console.log('❌ 未找到建立專案按鈕');
        }
        
        // 檢查是否有演示模式通知（實際可見的）
        const visibleDemoNotice = await page.evaluate(() => {
            const notices = document.querySelectorAll('.demo-notice');
            for (const notice of notices) {
                const style = window.getComputedStyle(notice);
                if (style.display !== 'none' && style.visibility !== 'hidden') {
                    return notice.textContent.trim();
                }
            }
            return null;
        });
        
        if (visibleDemoNotice) {
            console.log('⚠️ 發現可見的演示模式通知:', visibleDemoNotice);
        } else {
            console.log('✅ 未發現可見的演示模式通知');
        }
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error);
        
        // 錯誤時也截圖
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/test-error.png',
            fullPage: true
        });
    }
    
    console.log('\n📸 截圖文件已保存:');
    console.log('  - test-step1-initial.png (初始頁面)');
    console.log('  - test-step2-crm-list.png (商機列表)');
    console.log('  - test-step3-search-results.png (搜尋結果)');
    console.log('  - test-step4-selected.png (選擇結果)');
    console.log('  - test-step5-form-filled.png (表單填寫)');
    console.log('  - test-step6-final.png (最終結果)');
    
    await browser.close();
}

// 執行測試
testCreateProject().catch(console.error);