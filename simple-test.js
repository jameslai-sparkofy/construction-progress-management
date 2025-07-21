const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 開始簡化測試...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // 直接訪問 create.html
    await page.goto('https://construction-progress.lai-jameslai.workers.dev/create.html', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ 頁面載入完成');
    
    // 直接在頁面中執行 API 調用來檢查
    const directApiTest = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/crm/opportunities');
        const result = await response.json();
        return {
          status: response.status,
          success: result.success,
          isDemo: result.isDemo,
          count: result.count,
          message: result.message || null,
          hasData: Array.isArray(result.data) && result.data.length > 0
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('🔌 直接 API 測試結果:', directApiTest);
    
    // 查找選擇商機按鈕
    const button = await page.$('button[onclick="showCRMModal()"]');
    if (!button) {
      console.log('❌ 找不到選擇商機按鈕');
      await browser.close();
      return;
    }
    
    console.log('✅ 找到選擇商機按鈕，點擊...');
    await button.click();
    
    // 等待模態框出現
    await page.waitForSelector('.modal.show', { timeout: 5000 });
    console.log('✅ 模態框已出現');
    
    // 等待 API 數據載入
    await page.waitForSelector('.crm-item', { timeout: 15000 });
    console.log('✅ 商機數據已載入');
    
    // 檢查演示模式通知
    const demoNotice = await page.$('.demo-notice');
    
    if (demoNotice) {
      const noticeText = await page.evaluate(el => el.textContent, demoNotice);
      console.log('❌ 發現演示模式通知:', noticeText);
      
      // 檢查通知何時被添加
      const isDisplayed = await page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }, demoNotice);
      
      console.log('👁️ 通知是否可見:', isDisplayed);
      
    } else {
      console.log('✅ 未發現演示模式通知');
    }
    
    // 檢查載入的商機數量
    const opportunityCount = await page.evaluate(() => {
      return document.querySelectorAll('.crm-item').length;
    });
    
    console.log('📊 載入的商機數量:', opportunityCount);
    
    // 檢查前幾個商機的名稱
    const firstOpportunities = await page.evaluate(() => {
      const items = document.querySelectorAll('.crm-item');
      return Array.from(items).slice(0, 3).map(item => {
        const nameEl = item.querySelector('div[style*="font-weight: 600"]');
        return nameEl ? nameEl.textContent.trim() : 'No name found';
      });
    });
    
    console.log('📋 前3個商機名稱:', firstOpportunities);
    
  } catch (error) {
    console.error('❌ 測試過程錯誤:', error.message);
  }
  
  await browser.close();
  console.log('🔚 測試完成');
})();