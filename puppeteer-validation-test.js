// 驗證興安西工程進度管理系統運作狀況
const puppeteer = require('puppeteer');

async function validateSystem() {
    console.log('🧪 ===== 興安西工程進度管理系統驗證 =====\n');
    
    let browser = null;
    const results = [];
    
    try {
        // 啟動瀏覽器 (無頭模式以避免 GUI 問題)
        console.log('🚀 啟動 Puppeteer 瀏覽器...');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        console.log('✅ 瀏覽器已啟動\n');

        // 測試 1: 訪問主頁面
        console.log('📡 測試 1: 訪問主頁面');
        console.log('   URL: https://construction-progress.lai-jameslai.workers.dev');
        
        try {
            const response = await page.goto('https://construction-progress.lai-jameslai.workers.dev', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            const status = response.status();
            const title = await page.title();
            
            console.log(`   📡 HTTP 狀態: ${status}`);
            console.log(`   📄 頁面標題: ${title}`);
            
            if (status === 200) {
                console.log('   ✅ 主頁面載入成功');
                
                // 截圖主頁面
                await page.screenshot({ 
                    path: 'validation-screenshot-main-page.png',
                    fullPage: true 
                });
                console.log('   📸 主頁面截圖已保存: validation-screenshot-main-page.png');
                
                results.push({ test: '主頁面訪問', status: 'success', httpStatus: status, title });
            } else {
                throw new Error(`HTTP 錯誤: ${status}`);
            }
        } catch (error) {
            console.log(`   ❌ 主頁面載入失敗: ${error.message}`);
            results.push({ test: '主頁面訪問', status: 'error', error: error.message });
        }

        // 測試 2: 測試 CRM API 端點
        console.log('\n📡 測試 2: CRM API 端點測試');
        
        const apiEndpoints = [
            '/api/objects',
            '/api/projects',
            '/api/test-crm-connection'
        ];
        
        for (const endpoint of apiEndpoints) {
            const fullUrl = `https://construction-progress.lai-jameslai.workers.dev${endpoint}`;
            console.log(`   測試端點: ${fullUrl}`);
            
            try {
                const response = await page.goto(fullUrl, { 
                    waitUntil: 'networkidle2',
                    timeout: 15000 
                });
                
                const status = response.status();
                console.log(`   📡 HTTP 狀態: ${status}`);
                
                if (status === 200) {
                    // 嘗試獲取 JSON 數據
                    const content = await page.content();
                    const bodyText = await page.$eval('body', el => el.textContent);
                    
                    if (bodyText.includes('{') || bodyText.includes('success') || bodyText.includes('data')) {
                        console.log('   ✅ API 端點回應正常，返回數據');
                        results.push({ test: `API ${endpoint}`, status: 'success', httpStatus: status });
                    } else {
                        console.log('   ⚠️  API 端點回應但數據格式可能有問題');
                        results.push({ test: `API ${endpoint}`, status: 'warning', httpStatus: status });
                    }
                } else {
                    throw new Error(`HTTP 錯誤: ${status}`);
                }
            } catch (error) {
                console.log(`   ❌ API 端點測試失敗: ${error.message}`);
                results.push({ test: `API ${endpoint}`, status: 'error', error: error.message });
            }
        }

        // 測試 3: 專案詳細頁面測試
        console.log('\n📡 測試 3: 專案詳細頁面');
        const projectUrl = 'https://construction-progress.lai-jameslai.workers.dev/勝興-興安西-2024/';
        console.log(`   URL: ${projectUrl}`);
        
        try {
            const response = await page.goto(projectUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            const status = response.status();
            const title = await page.title();
            
            console.log(`   📡 HTTP 狀態: ${status}`);
            console.log(`   📄 頁面標題: ${title}`);
            
            if (status === 200) {
                console.log('   ✅ 專案頁面載入成功');
                
                // 截圖專案頁面
                await page.screenshot({ 
                    path: 'validation-screenshot-project-page.png',
                    fullPage: true 
                });
                console.log('   📸 專案頁面截圖已保存: validation-screenshot-project-page.png');
                
                // 檢查頁面內容
                const bodyContent = await page.$eval('body', el => el.textContent);
                if (bodyContent.includes('興安西') || bodyContent.includes('工程進度') || bodyContent.includes('勝興')) {
                    console.log('   ✅ 頁面內容包含預期的專案信息');
                } else {
                    console.log('   ⚠️  頁面內容可能不完整');
                }
                
                results.push({ test: '專案詳細頁面', status: 'success', httpStatus: status, title });
            } else {
                throw new Error(`HTTP 錯誤: ${status}`);
            }
        } catch (error) {
            console.log(`   ❌ 專案頁面載入失敗: ${error.message}`);
            results.push({ test: '專案詳細頁面', status: 'error', error: error.message });
        }

        // 測試 4: 頁面載入性能檢查
        console.log('\n⚡ 測試 4: 頁面載入性能');
        
        try {
            const startTime = Date.now();
            await page.goto('https://construction-progress.lai-jameslai.workers.dev', { 
                waitUntil: 'networkidle2' 
            });
            const loadTime = Date.now() - startTime;
            
            console.log(`   ⏱️  頁面載入時間: ${loadTime}ms`);
            
            if (loadTime < 5000) {
                console.log('   ✅ 載入速度良好');
                results.push({ test: '頁面載入性能', status: 'success', loadTime: `${loadTime}ms` });
            } else if (loadTime < 10000) {
                console.log('   ⚠️  載入速度稍慢');
                results.push({ test: '頁面載入性能', status: 'warning', loadTime: `${loadTime}ms` });
            } else {
                console.log('   ❌ 載入速度過慢');
                results.push({ test: '頁面載入性能', status: 'error', loadTime: `${loadTime}ms` });
            }
        } catch (error) {
            console.log(`   ❌ 性能測試失敗: ${error.message}`);
            results.push({ test: '頁面載入性能', status: 'error', error: error.message });
        }

    } catch (error) {
        console.error('💥 測試過程中發生嚴重錯誤:', error.message);
    } finally {
        if (browser) {
            await browser.close();
            console.log('\n🔚 瀏覽器已關閉');
        }
    }

    // 生成測試報告
    console.log('\n📊 ===== 測試報告 =====');
    
    let successCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    
    results.forEach((result, index) => {
        let statusIcon = '';
        if (result.status === 'success') {
            statusIcon = '✅';
            successCount++;
        } else if (result.status === 'warning') {
            statusIcon = '⚠️ ';
            warningCount++;
        } else {
            statusIcon = '❌';
            errorCount++;
        }
        
        console.log(`${index + 1}. ${statusIcon} ${result.test}: ${result.status}`);
        if (result.httpStatus) console.log(`   HTTP狀態: ${result.httpStatus}`);
        if (result.title) console.log(`   頁面標題: ${result.title}`);
        if (result.loadTime) console.log(`   載入時間: ${result.loadTime}`);
        if (result.error) console.log(`   錯誤: ${result.error}`);
        console.log('');
    });
    
    const totalTests = results.length;
    console.log(`📈 測試總結: ${totalTests} 項測試`);
    console.log(`✅ 成功: ${successCount}`);
    console.log(`⚠️  警告: ${warningCount}`);
    console.log(`❌ 失敗: ${errorCount}`);
    
    if (errorCount === 0) {
        if (warningCount === 0) {
            console.log('\n🎉 所有測試都完美通過！系統運行狀況良好。');
        } else {
            console.log('\n✨ 主要功能正常，有一些小問題需要注意。');
        }
    } else {
        console.log('\n⚠️  發現一些問題，建議進一步檢查。');
    }
    
    return results;
}

// 執行驗證
if (require.main === module) {
    validateSystem().catch(console.error);
}

module.exports = { validateSystem };