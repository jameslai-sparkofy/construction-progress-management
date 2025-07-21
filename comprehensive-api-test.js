// 全面測試興安西工程進度管理系統的 API 端點
const puppeteer = require('puppeteer');

async function testAllAPIEndpoints() {
    console.log('🧪 ===== API 端點全面測試 =====\n');
    
    const baseUrl = 'https://construction-progress.lai-jameslai.workers.dev';
    
    // 要測試的 API 端點清單
    const apiEndpoints = [
        '/api/projects',
        '/api/auth',
        '/api/sync', 
        '/api/crm',
        '/api/test-ip',
        '/api/objects',
        '/api/test-crm-connection'
    ];
    
    let browser = null;
    const results = [];
    
    try {
        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        
        const page = await browser.newPage();
        
        console.log('🔍 測試 API 端點...\n');
        
        for (const endpoint of apiEndpoints) {
            const fullUrl = baseUrl + endpoint;
            console.log(`📡 測試: ${endpoint}`);
            console.log(`   URL: ${fullUrl}`);
            
            try {
                const response = await page.goto(fullUrl, { 
                    waitUntil: 'networkidle2',
                    timeout: 10000 
                });
                
                const status = response.status();
                const contentType = response.headers()['content-type'] || '';
                
                console.log(`   📊 HTTP 狀態: ${status}`);
                console.log(`   📄 Content-Type: ${contentType}`);
                
                // 獲取回應內容
                const bodyText = await page.$eval('body', el => el.textContent).catch(() => '');
                
                let responseData = null;
                let isJSON = false;
                
                if (contentType.includes('application/json') || bodyText.trim().startsWith('{') || bodyText.trim().startsWith('[')) {
                    try {
                        responseData = JSON.parse(bodyText);
                        isJSON = true;
                        console.log('   ✅ 回應格式: JSON');
                    } catch (e) {
                        console.log('   ⚠️  回應格式: 疑似 JSON 但解析失敗');
                    }
                } else {
                    console.log('   📝 回應格式: 文本/HTML');
                }
                
                // 分析回應內容
                if (status === 200) {
                    if (isJSON && responseData) {
                        console.log('   ✅ API 端點正常運作');
                        if (Array.isArray(responseData)) {
                            console.log(`   📦 回應: 陣列 (${responseData.length} 項目)`);
                        } else if (typeof responseData === 'object') {
                            const keys = Object.keys(responseData);
                            console.log(`   📦 回應: 物件 (${keys.length} 屬性: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''})`);
                        }
                    } else {
                        console.log('   ✅ 端點可存取但回應非 JSON');
                    }
                    results.push({ endpoint, status: 'success', httpStatus: status, isJSON, responseType: typeof responseData });
                } else if (status === 404) {
                    console.log('   ❌ API 端點不存在');
                    results.push({ endpoint, status: 'not_found', httpStatus: status });
                } else if (status === 401 || status === 403) {
                    console.log('   🔒 需要認證或權限不足');
                    results.push({ endpoint, status: 'auth_required', httpStatus: status });
                } else {
                    console.log(`   ⚠️  端點存在但回應異常 (${status})`);
                    results.push({ endpoint, status: 'error', httpStatus: status });
                }
                
            } catch (error) {
                console.log(`   ❌ 測試失敗: ${error.message}`);
                results.push({ endpoint, status: 'error', error: error.message });
            }
            
            console.log(''); // 空行分隔
        }
        
    } catch (error) {
        console.error('💥 測試過程發生錯誤:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
    
    // 生成詳細報告
    console.log('📊 ===== API 測試報告 =====\n');
    
    const categorized = {
        working: results.filter(r => r.status === 'success'),
        notFound: results.filter(r => r.status === 'not_found'),
        authRequired: results.filter(r => r.status === 'auth_required'),
        errors: results.filter(r => r.status === 'error' && r.httpStatus !== 404)
    };
    
    console.log('✅ 正常運作的 API:');
    categorized.working.forEach(r => {
        console.log(`   ${r.endpoint} (HTTP ${r.httpStatus})${r.isJSON ? ' - JSON' : ''}`);
    });
    
    console.log('\n❌ 不存在的 API:');
    categorized.notFound.forEach(r => {
        console.log(`   ${r.endpoint} (HTTP ${r.httpStatus})`);
    });
    
    if (categorized.authRequired.length > 0) {
        console.log('\n🔒 需要認證的 API:');
        categorized.authRequired.forEach(r => {
            console.log(`   ${r.endpoint} (HTTP ${r.httpStatus})`);
        });
    }
    
    if (categorized.errors.length > 0) {
        console.log('\n⚠️  有問題的 API:');
        categorized.errors.forEach(r => {
            console.log(`   ${r.endpoint} - ${r.error || 'HTTP ' + r.httpStatus}`);
        });
    }
    
    const workingCount = categorized.working.length;
    const totalCount = results.length;
    
    console.log(`\n📈 總結: ${workingCount}/${totalCount} API 端點正常運作`);
    
    if (workingCount === totalCount) {
        console.log('🎉 所有 API 端點都正常運作！');
    } else if (workingCount > 0) {
        console.log('✨ 部分 API 端點正常運作，系統基本功能可用。');
    } else {
        console.log('⚠️  沒有 API 端點正常運作，需要檢查系統配置。');
    }
    
    return results;
}

// 執行測試
if (require.main === module) {
    testAllAPIEndpoints().catch(console.error);
}

module.exports = { testAllAPIEndpoints };