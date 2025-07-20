// 快速 Puppeteer 測試 - 重點測試核心功能
const puppeteer = require('puppeteer');
const path = require('path');

async function quickTest() {
    console.log('🚀 快速系統測試...');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // 測試 1: 本地完整版本
        console.log('\n📄 測試本地完整版本...');
        const localFile = path.join(__dirname, '興安西工程管理網站-完整版本.html');
        await page.goto(`file://${localFile}`);
        
        const title = await page.title();
        console.log(`✅ 標題: ${title}`);
        
        // 檢查關鍵元素
        const loginForm = await page.$('.login-container');
        const buildingTabs = await page.$$('.tab');
        
        console.log(`✅ 登入表單: ${loginForm ? '存在' : '不存在'}`);
        console.log(`✅ 棟別切換: ${buildingTabs.length} 個按鈕`);
        
        // 測試 2: 線上版本連通性
        console.log('\n🌐 測試線上版本連通性...');
        try {
            const response = await page.goto('https://progress.yes-ceramics.com/', { 
                timeout: 10000 
            });
            console.log(`✅ 線上版本: HTTP ${response.status()}`);
        } catch (error) {
            console.log(`❌ 線上版本: ${error.message}`);
        }
        
        // 測試 3: 前端頁面
        console.log('\n📱 測試前端頁面...');
        const frontendFile = path.join(__dirname, 'frontend/project.html');
        await page.goto(`file://${frontendFile}`);
        
        const frontendTitle = await page.title();
        console.log(`✅ 前端標題: ${frontendTitle}`);
        
        console.log('\n🎉 快速測試完成！');
        
    } catch (error) {
        console.error('❌ 測試錯誤:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

quickTest();