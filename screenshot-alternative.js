const fs = require('fs');
const path = require('path');

// 創建一個 HTML 文件，使用 html2canvas 來生成截圖
async function createScreenshotHTML() {
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

  const screenshotHTML = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>截圖生成器</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .screenshot-section {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .viewport-controls {
            margin-bottom: 20px;
        }
        .viewport-controls button {
            background: #2196F3;
            color: white;
            border: none;
            padding: 10px 20px;
            margin: 5px;
            border-radius: 4px;
            cursor: pointer;
        }
        .viewport-controls button:hover {
            background: #1976D2;
        }
        .preview-frame {
            border: 1px solid #ddd;
            background: white;
            overflow: hidden;
            margin: 20px 0;
        }
        .mobile-viewport {
            width: 390px;
            height: 844px;
        }
        .desktop-viewport {
            width: 1920px;
            height: 1080px;
            transform: scale(0.5);
            transform-origin: top left;
        }
        .iframe-container {
            width: 100%;
            height: 100%;
        }
        .iframe-container iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        .status {
            margin-top: 10px;
            padding: 10px;
            border-radius: 4px;
            background: #e8f5e8;
            border: 1px solid #4caf50;
        }
        .error {
            background: #ffebee;
            border: 1px solid #f44336;
        }
        .instructions {
            background: #fff3e0;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .instructions h3 {
            color: #f57c00;
            margin-top: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>UI 原型截圖生成器</h1>
        
        <div class="instructions">
            <h3>📸 使用說明</h3>
            <ol>
                <li>點擊下方的"生成截圖"按鈕</li>
                <li>選擇適當的視窗大小（手機版或桌面版）</li>
                <li>等待截圖生成完成</li>
                <li>右鍵點擊生成的圖片保存到本地</li>
            </ol>
        </div>

        ${files.map(file => `
        <div class="screenshot-section">
            <h2>${file.description}</h2>
            <div class="viewport-controls">
                <button onclick="generateScreenshot('${file.name}', '${file.title}', 'mobile')">
                    📱 生成手機版截圖 (390x844)
                </button>
                <button onclick="generateScreenshot('${file.name}', '${file.title}', 'desktop')">
                    💻 生成桌面版截圖 (1920x1080)
                </button>
            </div>
            <div id="preview-${file.title}" class="preview-frame"></div>
            <div id="status-${file.title}" class="status" style="display: none;"></div>
        </div>
        `).join('')}
    </div>

    <script>
        async function generateScreenshot(filename, title, viewport) {
            const previewDiv = document.getElementById('preview-' + title);
            const statusDiv = document.getElementById('status-' + title);
            
            statusDiv.style.display = 'block';
            statusDiv.className = 'status';
            statusDiv.innerHTML = '正在生成截圖...';
            
            try {
                // 設定視窗大小
                const isDesktop = viewport === 'desktop';
                const width = isDesktop ? 1920 : 390;
                const height = isDesktop ? 1080 : 844;
                
                // 創建 iframe 載入目標頁面
                const iframe = document.createElement('iframe');
                iframe.src = filename;
                iframe.style.width = width + 'px';
                iframe.style.height = height + 'px';
                iframe.style.border = 'none';
                
                if (isDesktop) {
                    iframe.style.transform = 'scale(0.5)';
                    iframe.style.transformOrigin = 'top left';
                }
                
                previewDiv.innerHTML = '';
                previewDiv.appendChild(iframe);
                
                // 等待 iframe 載入完成
                await new Promise(resolve => {
                    iframe.onload = resolve;
                });
                
                // 等待額外時間確保頁面完全渲染
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // 使用 html2canvas 生成截圖
                const canvas = await html2canvas(iframe.contentDocument.body, {
                    width: width,
                    height: height,
                    useCORS: true,
                    allowTaint: true,
                    scale: 1
                });
                
                // 創建下載連結
                const link = document.createElement('a');
                link.download = title + '-' + viewport + '.png';
                link.href = canvas.toDataURL('image/png');
                
                // 顯示圖片預覽
                const img = document.createElement('img');
                img.src = canvas.toDataURL('image/png');
                img.style.maxWidth = '100%';
                img.style.border = '1px solid #ddd';
                img.style.marginTop = '10px';
                
                previewDiv.innerHTML = '';
                previewDiv.appendChild(img);
                
                // 自動下載
                link.click();
                
                statusDiv.innerHTML = '✅ 截圖生成完成！圖片已自動下載。';
                
            } catch (error) {
                console.error('截圖生成失敗:', error);
                statusDiv.className = 'status error';
                statusDiv.innerHTML = '❌ 截圖生成失敗: ' + error.message;
            }
        }
    </script>
</body>
</html>
`;

  const outputPath = path.join(__dirname, 'screenshot-generator.html');
  fs.writeFileSync(outputPath, screenshotHTML);
  
  console.log(`✅ 截圖生成器已創建: ${outputPath}`);
  console.log('\n📋 使用方法：');
  console.log('1. 在瀏覽器中打開 screenshot-generator.html');
  console.log('2. 點擊相應的按鈕生成截圖');
  console.log('3. 截圖會自動下載到您的下載資料夾');
  
  return outputPath;
}

// 創建一個簡單的指令說明
function createInstructions() {
  const instructions = `
# UI 原型截圖生成指南

## 方法一：使用截圖生成器（推薦）
1. 打開瀏覽器，訪問 screenshot-generator.html
2. 點擊對應的按鈕生成截圖
3. 截圖將自動下載

## 方法二：手動截圖
1. 在瀏覽器中分別打開以下文件：
   - ui-prototype.html（主要維修單列表頁面）
   - admin-ui-prototype.html（權限管理後台）
   - login-ui-prototype.html（登入頁面）

2. 使用瀏覽器開發者工具（F12）：
   - 手機版：設定視窗大小為 390x844
   - 桌面版：設定視窗大小為 1920x1080

3. 使用瀏覽器或系統截圖功能保存圖片

## 方法三：使用預覽頁面
1. 打開 preview-all.html 查看所有原型
2. 使用瀏覽器截圖工具或擴展功能截圖

## 生成的截圖文件命名規則：
- main-page-mobile.png（主頁面手機版）
- main-page-desktop.png（主頁面桌面版）
- admin-page-mobile.png（管理頁面手機版）
- admin-page-desktop.png（管理頁面桌面版）
- login-page-mobile.png（登入頁面手機版）
- login-page-desktop.png（登入頁面桌面版）
`;

  const instructionPath = path.join(__dirname, 'SCREENSHOT_INSTRUCTIONS.md');
  fs.writeFileSync(instructionPath, instructions);
  
  console.log(`📝 使用說明已創建: ${instructionPath}`);
}

async function main() {
  console.log('🚀 創建截圖生成工具...\n');
  
  await createScreenshotHTML();
  createInstructions();
  
  console.log('\n🎉 所有工具已創建完成！');
  console.log('\n📁 相關文件：');
  console.log('   - screenshot-generator.html（截圖生成器）');
  console.log('   - preview-all.html（預覽頁面）');
  console.log('   - SCREENSHOT_INSTRUCTIONS.md（使用說明）');
  console.log('   - ui-prototype.html（主要維修單列表頁面）');
  console.log('   - admin-ui-prototype.html（權限管理後台）');
  console.log('   - login-ui-prototype.html（登入頁面）');
}

main().catch(console.error);