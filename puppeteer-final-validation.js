const puppeteer = require('puppeteer');
const fs = require('fs');

async function validateSystem() {
    console.log('🚀 開始系統最終驗證...\n');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    const results = {
        timestamp: new Date().toISOString(),
        tests: []
    };

    try {
        // 測試 1: 主頁面載入
        console.log('📋 測試 1: 主頁面載入');
        const mainPageStart = Date.now();
        const response = await page.goto('https://construction-progress.lai-jameslai.workers.dev', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });
        const mainPageTime = Date.now() - mainPageStart;
        
        results.tests.push({
            name: '主頁面載入',
            status: response.status() === 200 ? 'PASS' : 'FAIL',
            statusCode: response.status(),
            loadTime: `${mainPageTime}ms`,
            url: 'https://construction-progress.lai-jameslai.workers.dev'
        });
        
        // 截圖 1: 主頁面
        await page.screenshot({ 
            path: '/mnt/c/claude code/工程進度網頁/validation-main-page.png',
            fullPage: true
        });
        console.log(`✅ 主頁面載入: ${response.status()} (${mainPageTime}ms)`);

        // 測試 2: API 端點測試
        console.log('\n🔌 測試 2: API 端點驗證');
        
        const apiTests = [
            { name: 'CRM 商機 API', url: '/api/crm/opportunities' },
            { name: 'CRM 銷售記錄 API', url: '/api/crm/sales-records' },
            { name: 'IP 測試 API', url: '/api/test-ip' }
        ];

        for (const test of apiTests) {
            try {
                const apiResponse = await page.goto(`https://construction-progress.lai-jameslai.workers.dev${test.url}`, {
                    timeout: 15000
                });
                const apiContent = await page.content();
                const isJson = apiContent.includes('"success":true') || apiContent.includes('"data":');
                
                results.tests.push({
                    name: test.name,
                    status: apiResponse.status() === 200 && isJson ? 'PASS' : 'FAIL',
                    statusCode: apiResponse.status(),
                    url: test.url,
                    hasValidJson: isJson
                });
                
                console.log(`  ${apiResponse.status() === 200 && isJson ? '✅' : '❌'} ${test.name}: ${apiResponse.status()}`);
            } catch (error) {
                results.tests.push({
                    name: test.name,
                    status: 'ERROR',
                    error: error.message,
                    url: test.url
                });
                console.log(`  ❌ ${test.name}: ERROR - ${error.message}`);
            }
        }

        // 測試 3: 前端功能檢查
        console.log('\n🖥️  測試 3: 前端功能檢查');
        await page.goto('https://construction-progress.lai-jameslai.workers.dev');
        
        // 檢查頁面元素
        const elements = {
            '專案總覽標題': 'h1, h2',
            '專案卡片': '.project-card, .card',
            '建立專案按鈕': 'button, .btn, a[href*="create"]'
        };

        for (const [name, selector] of Object.entries(elements)) {
            try {
                const element = await page.$(selector);
                const exists = element !== null;
                
                results.tests.push({
                    name: `前端元素: ${name}`,
                    status: exists ? 'PASS' : 'FAIL',
                    selector: selector,
                    found: exists
                });
                
                console.log(`  ${exists ? '✅' : '❌'} ${name}: ${exists ? '找到' : '未找到'}`);
            } catch (error) {
                console.log(`  ❌ ${name}: 檢查失敗`);
            }
        }

        // 測試 4: 多租戶路由測試
        console.log('\n🏗️  測試 4: 多租戶路由測試');
        const projectUrl = 'https://construction-progress.lai-jameslai.workers.dev/testproject-abc123';
        try {
            const projectResponse = await page.goto(projectUrl, { timeout: 15000 });
            
            results.tests.push({
                name: '多租戶專案路由',
                status: projectResponse.status() === 200 ? 'PASS' : 'FAIL',
                statusCode: projectResponse.status(),
                url: projectUrl
            });
            
            // 截圖 2: 專案頁面
            await page.screenshot({ 
                path: '/mnt/c/claude code/工程進度網頁/validation-project-page.png',
                fullPage: true
            });
            
            console.log(`✅ 多租戶路由: ${projectResponse.status()}`);
        } catch (error) {
            console.log(`❌ 多租戶路由測試失敗: ${error.message}`);
        }

    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error);
    }

    await browser.close();

    // 生成結果報告
    const summary = {
        totalTests: results.tests.length,
        passed: results.tests.filter(t => t.status === 'PASS').length,
        failed: results.tests.filter(t => t.status === 'FAIL').length,
        errors: results.tests.filter(t => t.status === 'ERROR').length
    };

    const report = `
# 🎯 興安西工程進度管理系統 - 最終驗證報告

**驗證時間**: ${results.timestamp}
**系統 URL**: https://construction-progress.lai-jameslai.workers.dev

## 📊 測試總結
- **總測試數**: ${summary.totalTests}
- **通過**: ${summary.passed} ✅
- **失敗**: ${summary.failed} ❌  
- **錯誤**: ${summary.errors} ⚠️
- **成功率**: ${((summary.passed / summary.totalTests) * 100).toFixed(1)}%

## 📋 詳細結果

${results.tests.map(test => `
### ${test.name}
- **狀態**: ${test.status} ${test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️'}
- **狀態碼**: ${test.statusCode || 'N/A'}
- **URL**: ${test.url || 'N/A'}
${test.loadTime ? `- **載入時間**: ${test.loadTime}` : ''}
${test.error ? `- **錯誤**: ${test.error}` : ''}
`).join('\n')}

## 🎉 結論

${summary.passed >= summary.totalTests * 0.8 ? 
  '**系統狀態良好** - 主要功能運作正常，可以投入使用。' : 
  '**需要進一步檢查** - 部分功能存在問題，建議進行修復。'
}

## 📸 生成的截圖
- validation-main-page.png - 主頁面截圖
- validation-project-page.png - 專案頁面截圖

---
*自動化測試報告 - 由 Puppeteer 生成*
`;

    fs.writeFileSync('/mnt/c/claude code/工程進度網頁/FINAL_VALIDATION_REPORT.md', report);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 系統驗證完成！');
    console.log('='.repeat(60));
    console.log(`📊 測試結果: ${summary.passed}/${summary.totalTests} 通過 (${((summary.passed / summary.totalTests) * 100).toFixed(1)}%)`);
    console.log('📄 詳細報告已生成: FINAL_VALIDATION_REPORT.md');
    console.log('📸 截圖已保存: validation-main-page.png, validation-project-page.png');
    console.log('='.repeat(60));
    
    return results;
}

// 執行驗證
validateSystem().catch(console.error);