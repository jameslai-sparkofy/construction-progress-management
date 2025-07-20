const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateScreenshots() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
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

    for (const viewport of viewports) {
      const page = await browser.newPage();
      await page.setViewport({
        width: viewport.width,
        height: viewport.height
      });

      // 載入本地HTML文件
      await page.goto(`file://${filePath}`, { waitUntil: 'networkidle2' });

      // 等待頁面完全載入
      await page.waitForTimeout(2000);

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