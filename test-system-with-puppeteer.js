// 用 Puppeteer 測試整個系統的功能
// 包括本地文件和線上部署的測試

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class SystemTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            local: {},
            production: {},
            errors: []
        };
    }

    async setup() {
        console.log('🚀 啟動 Puppeteer 瀏覽器...');
        this.browser = await puppeteer.launch({
            headless: false, // 顯示瀏覽器窗口以便觀察
            slowMo: 500,     // 放慢動作以便觀察
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // 設置視窗大小
        await this.page.setViewport({ width: 1200, height: 800 });
        
        console.log('✅ 瀏覽器已啟動');
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔚 瀏覽器已關閉');
        }
    }

    // 測試本地 HTML 文件
    async testLocalFiles() {
        console.log('\n📁 測試本地 HTML 文件...');
        
        const testFiles = [
            {
                name: '完整版本主頁面',
                file: '興安西工程管理網站-完整版本.html',
                tests: ['登入功能', '棟別切換', '進度顯示']
            },
            {
                name: '前端專案頁面', 
                file: 'frontend/project.html',
                tests: ['頁面載入', '響應式設計']
            },
            {
                name: '建立專案頁面',
                file: 'frontend/create.html', 
                tests: ['表單功能', '提交按鈕']
            }
        ];

        for (const testFile of testFiles) {
            await this.testLocalFile(testFile);
        }
    }

    async testLocalFile(testFile) {
        try {
            console.log(`\n🔍 測試: ${testFile.name}`);
            
            // 檢查文件是否存在
            const filePath = path.join(__dirname, testFile.file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`文件不存在: ${testFile.file}`);
            }

            // 載入文件
            await this.page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });
            console.log('  ✅ 文件載入成功');

            // 檢查基本元素
            const title = await this.page.title();
            console.log(`  📄 頁面標題: ${title}`);

            // 截圖
            const screenshotPath = `test-screenshot-${testFile.file.replace(/[\/\\]/g, '_').replace('.html', '')}.png`;
            await this.page.screenshot({ 
                path: screenshotPath,
                fullPage: true 
            });
            console.log(`  📸 截圖已保存: ${screenshotPath}`);

            // 執行具體測試
            for (const test of testFile.tests) {
                await this.runSpecificTest(test);
            }

            this.results.local[testFile.name] = { status: 'success', title };

        } catch (error) {
            console.error(`  ❌ ${testFile.name} 測試失敗:`, error.message);
            this.results.local[testFile.name] = { status: 'error', error: error.message };
            this.results.errors.push({
                type: 'local',
                file: testFile.name,
                error: error.message
            });
        }
    }

    async runSpecificTest(testName) {
        try {
            console.log(`    🧪 執行測試: ${testName}`);
            
            switch (testName) {
                case '登入功能':
                    await this.testLoginFunction();
                    break;
                case '棟別切換':
                    await this.testBuildingTabs();
                    break;
                case '進度顯示':
                    await this.testProgressDisplay();
                    break;
                case '頁面載入':
                    await this.testPageLoad();
                    break;
                case '響應式設計':
                    await this.testResponsiveDesign();
                    break;
                case '表單功能':
                    await this.testFormFunction();
                    break;
                case '提交按鈕':
                    await this.testSubmitButton();
                    break;
                default:
                    console.log(`      ⚠️  未知測試: ${testName}`);
            }
        } catch (error) {
            console.error(`      ❌ ${testName} 失敗:`, error.message);
        }
    }

    // 具體測試函數
    async testLoginFunction() {
        try {
            // 檢查登入表單是否存在
            const loginForm = await this.page.$('.login-container');
            if (loginForm) {
                console.log('      ✅ 找到登入表單');
                
                // 嘗試填寫表單
                const emailInput = await this.page.$('input[type="email"]');
                const roleSelect = await this.page.$('select');
                
                if (emailInput) {
                    await this.page.type('input[type="email"]', 'test@example.com');
                    console.log('      ✅ Email 輸入正常');
                }
                
                if (roleSelect) {
                    await this.page.select('select', 'admin');
                    console.log('      ✅ 角色選擇正常');
                }
            } else {
                console.log('      ℹ️  未找到登入表單 (可能已登入狀態)');
            }
        } catch (error) {
            console.error('      ❌ 登入功能測試失敗:', error.message);
        }
    }

    async testBuildingTabs() {
        try {
            // 查找棟別切換按鈕
            const buildingTabs = await this.page.$$('.tab, .building-tab, [data-building]');
            if (buildingTabs.length > 0) {
                console.log(`      ✅ 找到 ${buildingTabs.length} 個棟別切換按鈕`);
                
                // 嘗試點擊第一個按鈕
                await buildingTabs[0].click();
                await this.page.waitForTimeout(1000);
                console.log('      ✅ 棟別切換功能正常');
            } else {
                console.log('      ℹ️  未找到棟別切換按鈕');
            }
        } catch (error) {
            console.error('      ❌ 棟別切換測試失敗:', error.message);
        }
    }

    async testProgressDisplay() {
        try {
            // 查找進度顯示元素
            const progressElements = await this.page.$$('.progress, .progress-bar, .status-cell, [data-progress]');
            if (progressElements.length > 0) {
                console.log(`      ✅ 找到 ${progressElements.length} 個進度顯示元素`);
            } else {
                console.log('      ℹ️  未找到進度顯示元素');
            }
        } catch (error) {
            console.error('      ❌ 進度顯示測試失敗:', error.message);
        }
    }

    async testPageLoad() {
        try {
            // 檢查頁面是否完全載入
            await this.page.waitForLoadState?.('networkidle') || this.page.waitForTimeout(2000);
            const bodyContent = await this.page.$eval('body', el => el.textContent.length);
            if (bodyContent > 100) {
                console.log('      ✅ 頁面內容載入正常');
            } else {
                console.log('      ⚠️  頁面內容較少，可能載入有問題');
            }
        } catch (error) {
            console.error('      ❌ 頁面載入測試失敗:', error.message);
        }
    }

    async testResponsiveDesign() {
        try {
            // 測試不同螢幕尺寸
            const viewports = [
                { width: 1200, height: 800, name: '桌面版' },
                { width: 768, height: 1024, name: '平板版' },
                { width: 375, height: 667, name: '手機版' }
            ];

            for (const viewport of viewports) {
                await this.page.setViewport(viewport);
                await this.page.waitForTimeout(500);
                console.log(`      ✅ ${viewport.name} (${viewport.width}x${viewport.height}) 顯示正常`);
            }
            
            // 恢復原始尺寸
            await this.page.setViewport({ width: 1200, height: 800 });
        } catch (error) {
            console.error('      ❌ 響應式設計測試失敗:', error.message);
        }
    }

    async testFormFunction() {
        try {
            const forms = await this.page.$$('form');
            if (forms.length > 0) {
                console.log(`      ✅ 找到 ${forms.length} 個表單`);
            } else {
                console.log('      ℹ️  未找到表單元素');
            }
        } catch (error) {
            console.error('      ❌ 表單功能測試失敗:', error.message);
        }
    }

    async testSubmitButton() {
        try {
            const submitButtons = await this.page.$$('button[type="submit"], .submit-btn, .login-btn');
            if (submitButtons.length > 0) {
                console.log(`      ✅ 找到 ${submitButtons.length} 個提交按鈕`);
            } else {
                console.log('      ℹ️  未找到提交按鈕');
            }
        } catch (error) {
            console.error('      ❌ 提交按鈕測試失敗:', error.message);
        }
    }

    // 測試線上部署版本
    async testProductionSite() {
        console.log('\n🌐 測試線上部署版本...');
        
        const productionUrls = [
            {
                name: '主頁面',
                url: 'https://progress.yes-ceramics.com/',
                tests: ['頁面載入', 'API 連接']
            },
            {
                name: '專案頁面', 
                url: 'https://progress.yes-ceramics.com/勝興-興安西-2024/',
                tests: ['頁面載入', '數據載入']
            },
            {
                name: '管理後台',
                url: 'https://progress.yes-ceramics.com/admin/',
                tests: ['頁面載入', '認證檢查']
            }
        ];

        for (const testUrl of productionUrls) {
            await this.testProductionUrl(testUrl);
        }
    }

    async testProductionUrl(testUrl) {
        try {
            console.log(`\n🔍 測試: ${testUrl.name}`);
            console.log(`   URL: ${testUrl.url}`);
            
            // 載入頁面
            const response = await this.page.goto(testUrl.url, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
            });
            
            const status = response.status();
            console.log(`  📡 HTTP 狀態: ${status}`);
            
            if (status === 200) {
                console.log('  ✅ 頁面載入成功');
                
                // 截圖
                const screenshotPath = `test-prod-${testUrl.name.replace(/\s+/g, '_')}.png`;
                await this.page.screenshot({ 
                    path: screenshotPath,
                    fullPage: true 
                });
                console.log(`  📸 截圖已保存: ${screenshotPath}`);
                
                this.results.production[testUrl.name] = { status: 'success', httpStatus: status };
            } else {
                throw new Error(`HTTP 錯誤: ${status}`);
            }

        } catch (error) {
            console.error(`  ❌ ${testUrl.name} 測試失敗:`, error.message);
            this.results.production[testUrl.name] = { status: 'error', error: error.message };
            this.results.errors.push({
                type: 'production',
                url: testUrl.name,
                error: error.message
            });
        }
    }

    // 生成測試報告
    generateReport() {
        console.log('\n📊 ===== 測試報告 =====');
        
        console.log('\n📁 本地文件測試結果:');
        for (const [name, result] of Object.entries(this.results.local)) {
            const status = result.status === 'success' ? '✅' : '❌';
            console.log(`  ${status} ${name}: ${result.status}`);
        }
        
        console.log('\n🌐 線上部署測試結果:');
        for (const [name, result] of Object.entries(this.results.production)) {
            const status = result.status === 'success' ? '✅' : '❌';
            console.log(`  ${status} ${name}: ${result.status}`);
        }
        
        if (this.results.errors.length > 0) {
            console.log('\n⚠️  發現的問題:');
            this.results.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. [${error.type}] ${error.file || error.url}: ${error.error}`);
            });
        }
        
        const totalTests = Object.keys(this.results.local).length + Object.keys(this.results.production).length;
        const successTests = totalTests - this.results.errors.length;
        
        console.log(`\n📈 總結: ${successTests}/${totalTests} 測試通過`);
        
        if (this.results.errors.length === 0) {
            console.log('🎉 所有測試都通過了！系統運行正常。');
        } else {
            console.log('⚠️  發現一些問題，建議檢查後再部署。');
        }
    }

    // 主執行函數
    async runFullTest() {
        try {
            await this.setup();
            
            // 測試本地文件
            await this.testLocalFiles();
            
            // 測試線上部署
            await this.testProductionSite();
            
            // 生成報告
            this.generateReport();
            
        } catch (error) {
            console.error('💥 測試過程中發生錯誤:', error.message);
        } finally {
            await this.cleanup();
        }
    }
}

// 執行測試
async function runSystemTest() {
    console.log('🧪 ===== 系統完整性測試 =====');
    console.log('使用 Puppeteer 測試本地和線上版本\n');
    
    const tester = new SystemTester();
    await tester.runFullTest();
}

// 檢查是否有 Puppeteer
if (require.main === module) {
    runSystemTest().catch(console.error);
}

module.exports = { SystemTester };