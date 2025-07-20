const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function generateScreenshots() {
  console.log('啟動瀏覽器...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const files = [
    {
      name: 'ui-prototype.html',
      title: 'main-page'
    },
    {
      name: 'admin-ui-prototype.html',
      title: 'admin-page'
    },
    {
      name: 'login-ui-prototype.html',
      title: 'login-page'
    }
  ];

  const viewports = [
    {
      name: 'mobile',
      width: 390,
      height: 844
    },
    {
      name: 'desktop',
      width: 1920,
      height: 1080
    }
  ];

  for (const file of files) {
    const filePath = path.join(__dirname, file.name);
    
    if (!fs.existsSync(filePath)) {
      console.log(`文件不存在: ${filePath}`);
      continue;
    }

    console.log(`處理檔案: ${file.name}`);

    for (const viewport of viewports) {
      const page = await browser.newPage();
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });

      // 載入本地HTML文件
      const fileUrl = `file://${filePath}`;
      console.log(`載入頁面: ${fileUrl}`);
      await page.goto(fileUrl, { waitUntil: 'networkidle' });

      // 等待頁面完全載入
      await page.waitForTimeout(3000);

      // 截圖
      const screenshotPath = path.join(__dirname, `${file.title}-${viewport.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      console.log(`已生成截圖: ${screenshotPath}`);
      await page.close();
    }
  }

  await browser.close();
  console.log('所有截圖生成完成！');
}

generateScreenshots().catch(console.error);