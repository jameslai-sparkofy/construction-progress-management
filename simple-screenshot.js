const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 檢查是否有可用的截圖工具
async function checkAvailableTools() {
  const tools = ['wkhtmltoimage', 'chromium-browser', 'google-chrome', 'firefox'];
  
  for (const tool of tools) {
    try {
      const result = await new Promise((resolve, reject) => {
        exec(`which ${tool}`, (error, stdout, stderr) => {
          if (error) {
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
      
      if (result) {
        console.log(`找到可用工具: ${tool}`);
        return tool;
      }
    } catch (err) {
      continue;
    }
  }
  
  return null;
}

// 使用 wkhtmltoimage 生成截圖
async function generateWithWkhtmltoimage() {
  const files = [
    { name: 'ui-prototype.html', title: 'main-page' },
    { name: 'admin-ui-prototype.html', title: 'admin-page' },
    { name: 'login-ui-prototype.html', title: 'login-page' }
  ];

  const viewports = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];

  for (const file of files) {
    const filePath = path.join(__dirname, file.name);
    
    if (!fs.existsSync(filePath)) {
      console.log(`文件不存在: ${filePath}`);
      continue;
    }

    for (const viewport of viewports) {
      const outputPath = path.join(__dirname, `${file.title}-${viewport.name}.png`);
      const command = `wkhtmltoimage --width ${viewport.width} --height ${viewport.height} --quality 100 "file://${filePath}" "${outputPath}"`;
      
      try {
        await new Promise((resolve, reject) => {
          exec(command, (error, stdout, stderr) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
        
        console.log(`已生成截圖: ${outputPath}`);
      } catch (error) {
        console.error(`生成截圖失敗: ${error.message}`);
      }
    }
  }
}

// 使用瀏覽器命令行生成截圖
async function generateWithBrowser(browserCommand) {
  const files = [
    { name: 'ui-prototype.html', title: 'main-page' },
    { name: 'admin-ui-prototype.html', title: 'admin-page' },
    { name: 'login-ui-prototype.html', title: 'login-page' }
  ];

  const viewports = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];

  for (const file of files) {
    const filePath = path.join(__dirname, file.name);
    
    if (!fs.existsSync(filePath)) {
      console.log(`文件不存在: ${filePath}`);
      continue;
    }

    for (const viewport of viewports) {
      const outputPath = path.join(__dirname, `${file.title}-${viewport.name}.png`);
      const command = `${browserCommand} --headless --disable-gpu --window-size=${viewport.width},${viewport.height} --screenshot="${outputPath}" "file://${filePath}"`;
      
      try {
        await new Promise((resolve, reject) => {
          exec(command, (error, stdout, stderr) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
        
        console.log(`已生成截圖: ${outputPath}`);
      } catch (error) {
        console.error(`生成截圖失敗: ${error.message}`);
      }
    }
  }
}

async function main() {
  console.log('檢查可用的截圖工具...');
  const availableTool = await checkAvailableTools();
  
  if (!availableTool) {
    console.log('未找到可用的截圖工具，嘗試直接使用HTML內容生成...');
    
    // 創建一個簡單的HTML預覽
    const files = [
      { name: 'ui-prototype.html', title: 'main-page' },
      { name: 'admin-ui-prototype.html', title: 'admin-page' },
      { name: 'login-ui-prototype.html', title: 'login-page' }
    ];
    
    console.log('可用的HTML文件:');
    files.forEach(file => {
      const filePath = path.join(__dirname, file.name);
      if (fs.existsSync(filePath)) {
        console.log(`✓ ${file.title}: ${filePath}`);
      } else {
        console.log(`✗ ${file.title}: 文件不存在`);
      }
    });
    
    return;
  }
  
  if (availableTool === 'wkhtmltoimage') {
    await generateWithWkhtmltoimage();
  } else {
    await generateWithBrowser(availableTool);
  }
}

main().catch(console.error);