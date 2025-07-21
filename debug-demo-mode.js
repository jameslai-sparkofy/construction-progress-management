const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // 攔截網路請求來檢查 API 回應
  await page.setRequestInterception(true);
  let apiResponse = null;
  
  page.on('request', (request) => {
    request.continue();
  });
  
  page.on('response', async (response) => {
    if (response.url().includes('/api/crm/opportunities')) {
      const text = await response.text();
      apiResponse = JSON.parse(text);
      console.log('🔍 攔截到的 API 回應:', {
        status: response.status(),
        isDemo: apiResponse.isDemo,
        success: apiResponse.success,
        count: apiResponse.count,
        hasMessage: Boolean(apiResponse.message)
      });
    }
  });
  
  await page.goto('https://construction-progress.lai-jameslai.workers.dev/create.html');
  
  // 觸發 CRM 模態框
  await page.click('#selectOpportunityBtn');
  
  // 等待 API 請求完成
  await page.waitForFunction(() => {
    return document.querySelector('.crm-list .crm-item') !== null;
  }, { timeout: 10000 }).catch(() => console.log('等待商機列表超時'));
  
  // 檢查演示模式訊息
  const demoNotice = await page.$('.demo-notice');
  console.log('🎭 演示模式訊息存在:', demoNotice !== null);
  
  if (demoNotice) {
    const noticeText = await page.evaluate(el => el.textContent, demoNotice);
    console.log('📝 演示模式訊息內容:', noticeText);
    
    // 檢查該元素是何時被加入的
    const parentElement = await page.evaluate(() => {
      const notice = document.querySelector('.demo-notice');
      return notice ? notice.parentElement.tagName : null;
    });
    console.log('📦 演示模式訊息父元素:', parentElement);
  }
  
  // 檢查 JavaScript 執行狀況
  const jsConsoleMessages = [];
  page.on('console', (msg) => {
    if (msg.text().includes('演示') || msg.text().includes('demo') || msg.text().includes('isDemo')) {
      jsConsoleMessages.push(msg.text());
    }
  });
  
  // 重新觸發一次載入
  await page.evaluate(() => {
    if (window.loadCRMOpportunities) {
      window.loadCRMOpportunities();
    }
  });
  
  await page.waitForTimeout(3000);
  
  console.log('📊 相關的 Console 訊息:', jsConsoleMessages);
  
  await browser.close();
})();