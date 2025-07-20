const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateScreenshots() {
  let browser;
  
  try {
    console.log('正在啟動瀏覽器...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      executablePath: '/usr/bin/chromium-browser' // 嘗試使用系統 chromium
    });
    
    console.log('瀏覽器已啟動');
  } catch (error) {
    console.error('無法啟動瀏覽器:', error.message);
    console.log('嘗試使用默認設置...');
    
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      console.log('瀏覽器已啟動（默認設置）');
    } catch (error2) {
      console.error('無法啟動瀏覽器（默認設置）:', error2.message);
      return;
    }
  }

  const files = [
    {
      name: 'ui-prototype.html',
      title: 'main-page',
      description: '主要維修單列表頁面'
    },
    {
      name: 'admin-ui-prototype.html',
      title: 'admin-page',
      description: '權限管理後台'
    },
    {
      name: 'login-ui-prototype.html',
      title: 'login-page',
      description: '登入頁面'
    }
  ];

  const viewports = [
    {
      name: 'mobile',
      width: 390,
      height: 844,
      description: '手機版 (iPhone 12 Pro)'
    },
    {
      name: 'desktop',
      width: 1920,
      height: 1080,
      description: '桌面版'
    }
  ];

  for (const file of files) {
    const filePath = path.join(__dirname, file.name);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ 文件不存在: ${filePath}`);
      continue;
    }

    console.log(`\n📄 處理檔案: ${file.description} (${file.name})`);

    for (const viewport of viewports) {
      try {
        const page = await browser.newPage();
        
        // 設定視窗大小
        await page.setViewport({
          width: viewport.width,
          height: viewport.height
        });

        // 載入本地HTML文件
        const fileUrl = `file://${filePath}`;
        console.log(`   📱 生成${viewport.description}截圖...`);
        
        await page.goto(fileUrl, { 
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        // 等待頁面完全載入
        await page.waitForTimeout(2000);

        // 截圖
        const screenshotPath = path.join(__dirname, `${file.title}-${viewport.name}.png`);
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
          quality: 100
        });

        console.log(`   ✅ 已生成: ${screenshotPath}`);
        await page.close();
        
      } catch (error) {
        console.error(`   ❌ 生成${viewport.description}截圖失敗:`, error.message);
      }
    }
  }

  await browser.close();
  console.log('\n🎉 截圖生成完成！');
  
  // 列出生成的文件
  console.log('\n📋 生成的截圖文件：');
  files.forEach(file => {
    viewports.forEach(viewport => {
      const screenshotPath = path.join(__dirname, `${file.title}-${viewport.name}.png`);
      if (fs.existsSync(screenshotPath)) {
        const stats = fs.statSync(screenshotPath);
        console.log(`   ✅ ${file.title}-${viewport.name}.png (${(stats.size / 1024).toFixed(2)} KB)`);
      }
    });
  });
}

generateScreenshots().catch(console.error);