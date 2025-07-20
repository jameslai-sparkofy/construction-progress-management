// Cloudflare Workers 主路由器
// 處理多租戶系統的路由分發和認證

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      
      // 如果是根路徑，返回項目列表或重定向
      if (pathSegments.length === 0) {
        return handleRootPath(request, env);
      }
      
      // 提取項目ID和動作
      const projectId = pathSegments[0];
      const action = pathSegments[1] || 'dashboard';
      
      // 驗證項目存在
      const projectConfig = await getProjectConfig(env, projectId);
      if (!projectConfig) {
        return new Response('Project not found', { 
          status: 404,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      // 根據動作分發路由
      switch (action) {
        case 'login':
          return handleLogin(request, env, projectId, projectConfig);
        case 'api':
          return handleAPI(request, env, projectId, projectConfig);
        case 'assets':
          return handleAssets(request, env, projectId);
        case 'dashboard':
        default:
          return handleDashboard(request, env, projectId, projectConfig);
      }
      
    } catch (error) {
      return handleError(error);
    }
  }
};

// 處理根路徑請求
async function handleRootPath(request, env) {
  const html = `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>工程進度管理系統</title>
      <style>
        body { font-family: 'Microsoft JhengHei', sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        .logo { font-size: 2em; margin-bottom: 30px; }
        .description { margin-bottom: 40px; color: #666; }
        .contact { margin-top: 40px; font-size: 0.9em; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🏗️ 工程進度管理系統</div>
        <div class="description">
          <p>歡迎使用工程進度管理系統</p>
          <p>請聯絡管理員獲取您的專案連結</p>
        </div>
        <div class="contact">
          <p>如需技術支援，請聯絡系統管理員</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// 獲取項目配置
async function getProjectConfig(env, projectId) {
  try {
    const configData = await env.PROJECTS_CONFIG.get(projectId);
    return configData ? JSON.parse(configData) : null;
  } catch (error) {
    console.error('Failed to get project config:', error);
    return null;
  }
}

// 處理登入頁面
async function handleLogin(request, env, projectId, projectConfig) {
  if (request.method === 'GET') {
    return generateLoginPage(projectId, projectConfig);
  } else if (request.method === 'POST') {
    return processLogin(request, env, projectId, projectConfig);
  }
  
  return new Response('Method not allowed', { status: 405 });
}

// 生成登入頁面
function generateLoginPage(projectId, projectConfig) {
  const html = `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${projectConfig.name} - 登入</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Microsoft JhengHei', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          padding: 40px;
          width: 100%;
          max-width: 400px;
        }
        .logo {
          text-align: center;
          font-size: 1.5em;
          margin-bottom: 10px;
          color: #1976D2;
        }
        .project-name {
          text-align: center;
          font-size: 1.1em;
          color: #666;
          margin-bottom: 30px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
        }
        input[type="tel"], input[type="text"] {
          width: 100%;
          padding: 12px;
          border: 2px solid #E0E0E0;
          border-radius: 6px;
          font-size: 16px;
          transition: border-color 0.3s;
        }
        input[type="tel"]:focus, input[type="text"]:focus {
          outline: none;
          border-color: #1976D2;
        }
        .sms-group {
          display: flex;
          gap: 10px;
        }
        .sms-group input {
          flex: 1;
        }
        button {
          background: #1976D2;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.3s;
        }
        button:hover {
          background: #1565C0;
        }
        button:disabled {
          background: #CCCCCC;
          cursor: not-allowed;
        }
        .send-code-btn {
          background: #4CAF50;
          white-space: nowrap;
          padding: 12px 16px;
        }
        .send-code-btn:hover {
          background: #45a049;
        }
        .login-btn {
          width: 100%;
          margin-top: 20px;
        }
        .error {
          color: #f44336;
          font-size: 14px;
          margin-top: 10px;
        }
        .success {
          color: #4CAF50;
          font-size: 14px;
          margin-top: 10px;
        }
        @media (max-width: 480px) {
          .login-container {
            margin: 20px;
            padding: 30px 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="login-container">
        <div class="logo">🏗️ 工程進度管理系統</div>
        <div class="project-name">${projectConfig.name}</div>
        
        <form id="loginForm">
          <div class="form-group">
            <label for="phone">手機號碼</label>
            <input type="tel" id="phone" name="phone" placeholder="請輸入手機號碼" required>
          </div>
          
          <div class="form-group">
            <label for="code">驗證碼</label>
            <div class="sms-group">
              <input type="text" id="code" name="code" placeholder="請輸入驗證碼" required>
              <button type="button" class="send-code-btn" id="sendCodeBtn">發送驗證碼</button>
            </div>
          </div>
          
          <button type="submit" class="login-btn">登入</button>
          
          <div id="message"></div>
        </form>
      </div>
      
      <script>
        document.getElementById('sendCodeBtn').addEventListener('click', async function() {
          const phone = document.getElementById('phone').value;
          const btn = this;
          
          if (!phone) {
            showMessage('請輸入手機號碼', 'error');
            return;
          }
          
          btn.disabled = true;
          btn.textContent = '發送中...';
          
          try {
            const response = await fetch('/${projectId}/api/send-sms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone })
            });
            
            const result = await response.json();
            
            if (result.success) {
              showMessage('驗證碼已發送', 'success');
              startCountdown(btn);
            } else {
              showMessage(result.message || '發送失敗', 'error');
              btn.disabled = false;
              btn.textContent = '發送驗證碼';
            }
          } catch (error) {
            showMessage('網路錯誤，請稍後再試', 'error');
            btn.disabled = false;
            btn.textContent = '發送驗證碼';
          }
        });
        
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const phone = document.getElementById('phone').value;
          const code = document.getElementById('code').value;
          
          try {
            const response = await fetch('/${projectId}/api/verify-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone, code })
            });
            
            const result = await response.json();
            
            if (result.success) {
              showMessage('登入成功，正在跳轉...', 'success');
              setTimeout(() => {
                window.location.href = '/${projectId}/dashboard';
              }, 1000);
            } else {
              showMessage(result.message || '登入失敗', 'error');
            }
          } catch (error) {
            showMessage('網路錯誤，請稍後再試', 'error');
          }
        });
        
        function showMessage(message, type) {
          const messageDiv = document.getElementById('message');
          messageDiv.textContent = message;
          messageDiv.className = type;
        }
        
        function startCountdown(btn) {
          let countdown = 60;
          const timer = setInterval(() => {
            btn.textContent = countdown + 's後重新發送';
            countdown--;
            
            if (countdown < 0) {
              clearInterval(timer);
              btn.disabled = false;
              btn.textContent = '發送驗證碼';
            }
          }, 1000);
        }
      </script>
    </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// 處理API請求
async function handleAPI(request, env, projectId, projectConfig) {
  const url = new URL(request.url);
  const apiPath = url.pathname.split('/').slice(3).join('/');
  
  switch (apiPath) {
    case 'send-sms':
      return handleSendSMS(request, env, projectId);
    case 'verify-login':
      return handleVerifyLogin(request, env, projectId, projectConfig);
    case 'sites':
      return handleSitesAPI(request, env, projectId, projectConfig);
    case 'repair-orders':
      return handleRepairOrdersAPI(request, env, projectId, projectConfig);
    case 'progress':
      return handleProgressAPI(request, env, projectId, projectConfig);
    default:
      return new Response('API endpoint not found', { status: 404 });
  }
}

// 處理儀表板頁面
async function handleDashboard(request, env, projectId, projectConfig) {
  // 檢查用戶是否已登入
  const session = await validateSession(request, env, projectId);
  if (!session) {
    return Response.redirect(`/${projectId}/login`, 302);
  }
  
  // 從快取讀取或API獲取資料
  const siteData = await getSiteData(env, projectId, projectConfig);
  
  // 生成儀表板HTML
  return generateDashboardHTML(projectId, projectConfig, session, siteData);
}

// 驗證用戶會話
async function validateSession(request, env, projectId) {
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  const sessionId = cookies[`session-${projectId}`];
  
  if (!sessionId) {
    return null;
  }
  
  try {
    const sessionData = await env.USER_SESSIONS.get(`session-${sessionId}`);
    if (!sessionData) {
      return null;
    }
    
    const session = JSON.parse(sessionData);
    if (session.expiresAt < Date.now()) {
      await env.USER_SESSIONS.delete(`session-${sessionId}`);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

// 獲取案場資料
async function getSiteData(env, projectId, projectConfig) {
  try {
    const cacheKey = `sites-${projectId}`;
    const cachedData = await env.SITE_DATA.get(cacheKey);
    
    if (cachedData) {
      const data = JSON.parse(cachedData);
      // 檢查資料是否過期（5分鐘）
      if (Date.now() - new Date(data.lastUpdate).getTime() < 300000) {
        return data;
      }
    }
    
    // 從API獲取最新資料
    const freshData = await fetchFreshSiteData(env, projectConfig);
    
    // 更新快取
    await env.SITE_DATA.put(cacheKey, JSON.stringify(freshData));
    
    return freshData;
  } catch (error) {
    console.error('Failed to get site data:', error);
    return null;
  }
}

// 解析Cookie
function parseCookies(cookieHeader) {
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}

// 錯誤處理
function handleError(error) {
  console.error('Worker error:', error);
  return new Response('Internal server error', { 
    status: 500,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// 生成儀表板HTML（簡化版，實際應該從模板生成）
function generateDashboardHTML(projectId, projectConfig, session, siteData) {
  const html = `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${projectConfig.name} - 工程進度管理</title>
      <style>
        /* 基本樣式 */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Microsoft JhengHei', Arial, sans-serif; background: #F5F5F5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #1976D2; color: white; padding: 20px; margin-bottom: 30px; }
        .user-info { float: right; }
        .logout { color: white; text-decoration: none; }
        .content { background: white; padding: 30px; border-radius: 8px; }
        .loading { text-align: center; padding: 50px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏗️ ${projectConfig.name}</h1>
        <div class="user-info">
          ${session.role} | ${session.contractor || '系統管理員'} | 
          <a href="/${projectId}/api/logout" class="logout">登出</a>
        </div>
        <div style="clear: both;"></div>
      </div>
      
      <div class="container">
        <div class="content">
          <div class="loading">正在載入工程資料...</div>
        </div>
      </div>
      
      <script>
        // 這裡應該載入實際的儀表板JavaScript
        // 可以動態載入興安西工程管理網站的前端代碼
        console.log('Dashboard loaded for project:', '${projectId}');
      </script>
    </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}