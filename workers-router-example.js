// Cloudflare Workers 路由示例
// 處理路徑模式的多租戶架構

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 解析路徑獲取商機slug
    const pathParts = path.split('/').filter(Boolean);
    const opportunitySlug = pathParts[0]; // 第一個路徑段是商機slug
    
    console.log('Request path:', path);
    console.log('Opportunity slug:', opportunitySlug);
    
    // 路由處理
    if (!opportunitySlug) {
      // 根路徑，顯示商機列表或重定向到管理後台
      return handleHomePage(request, env);
    }
    
    if (opportunitySlug === 'admin') {
      // 超級管理後台
      return handleAdminDashboard(request, env);
    }
    
    // 商機路由
    return handleOpportunityRoute(request, env, opportunitySlug, pathParts.slice(1));
  }
};

async function handleOpportunityRoute(request, env, slug, subPaths) {
  try {
    // 1. 從KV獲取商機配置
    const opportunityId = await env.KV.get(`paths:${slug}`);
    if (!opportunityId) {
      return new Response('商機不存在', { status: 404 });
    }
    
    const opportunityConfig = await env.KV.get(`opportunities:${opportunityId}`);
    if (!opportunityConfig) {
      return new Response('商機配置不存在', { status: 404 });
    }
    
    const config = JSON.parse(opportunityConfig);
    console.log('Opportunity config:', config.name);
    
    // 2. 路由到不同功能
    const action = subPaths[0] || 'index';
    
    switch (action) {
      case 'admin':
        // 商機專屬後台
        return handleOpportunityAdmin(request, env, config);
      
      case 'api':
        // API路由
        return handleOpportunityAPI(request, env, config, subPaths.slice(1));
      
      case 'login':
        // 登入頁面
        return handleLogin(request, env, config);
      
      default:
        // 前台頁面
        return handleOpportunityFrontend(request, env, config);
    }
    
  } catch (error) {
    console.error('路由處理錯誤:', error);
    return new Response('系統錯誤', { status: 500 });
  }
}

async function handleOpportunityFrontend(request, env, config) {
  // 返回前台HTML
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${config.name} - 工程進度</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <h1>${config.name}</h1>
    <p>工程進度查詢系統</p>
    <div id="app"></div>
    <script>
        // 前端應用初始化
        window.OPPORTUNITY_CONFIG = ${JSON.stringify(config)};
    </script>
</body>
</html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

async function handleOpportunityAdmin(request, env, config) {
  // 檢查管理員權限
  const authResult = await checkAdminAuth(request, env, config);
  if (!authResult.success) {
    return new Response('需要管理員權限', { status: 401 });
  }
  
  // 返回管理後台HTML
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${config.name} - 管理後台</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <h1>${config.name} - 管理後台</h1>
    <nav>
        <a href="./admin/permissions">權限管理</a>
        <a href="./admin/users">用戶管理</a>
        <a href="./admin/reports">報表統計</a>
    </nav>
    <div id="admin-app"></div>
    <script>
        window.OPPORTUNITY_CONFIG = ${JSON.stringify(config)};
        window.USER_INFO = ${JSON.stringify(authResult.user)};
    </script>
</body>
</html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

async function handleOpportunityAPI(request, env, config, apiPaths) {
  const method = request.method;
  const apiEndpoint = apiPaths[0];
  
  // 驗證用戶身份
  const authResult = await checkUserAuth(request, env, config);
  if (!authResult.success) {
    return new Response(JSON.stringify({ error: '需要登入' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // API路由
  switch (apiEndpoint) {
    case 'repair-orders':
      return handleRepairOrdersAPI(request, env, config, authResult.user);
    
    case 'upload':
      return handleUploadAPI(request, env, config, authResult.user);
    
    case 'permissions':
      return handlePermissionsAPI(request, env, config, authResult.user);
    
    default:
      return new Response(JSON.stringify({ error: '未知API端點' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

async function handleRepairOrdersAPI(request, env, config, user) {
  // 根據用戶權限查詢維修單
  const userPermissions = config.field_permissions;
  
  try {
    // 從紛享銷客獲取數據
    const fxResponse = await fetchFromFxiaoke(env, {
      endpoint: '/cgi/crm/custom/v2/data/query',
      data: {
        dataObjectApiName: 'on_site_signature__c',
        search_query_info: {
          filters: [
            {
              field_name: 'opportunity__c',
              field_values: [config.opportunity_id],
              operator: 'EQ'
            }
          ]
        }
      }
    });
    
    const result = await fxResponse.json();
    
    if (result.errorCode === 0) {
      // 根據用戶權限過濾數據
      const filteredData = result.data.dataList.map(item => {
        const filteredItem = {};
        
        Object.keys(item).forEach(fieldName => {
          const permission = userPermissions[fieldName]?.[user.role];
          if (permission === 'view' || permission === 'edit') {
            filteredItem[fieldName] = item[fieldName];
          }
        });
        
        return filteredItem;
      });
      
      return new Response(JSON.stringify({
        success: true,
        data: filteredData,
        total: result.data.total
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error(result.errorMessage);
    }
  } catch (error) {
    console.error('API錯誤:', error);
    return new Response(JSON.stringify({ error: '數據查詢失敗' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function fetchFromFxiaoke(env, { endpoint, data }) {
  // 從紛享銷客API獲取數據
  const response = await fetch(`https://open.fxiaoke.com${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      corpId: env.FX_CORP_ID,
      corpAccessToken: env.FX_ACCESS_TOKEN,
      currentOpenUserId: env.FX_USER_ID,
      data: data
    })
  });
  
  return response;
}

async function checkUserAuth(request, env, config) {
  // 驗證用戶身份
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return { success: false };
  }
  
  const token = authHeader.replace('Bearer ', '');
  const sessionData = await env.KV.get(`sessions:${token}`);
  
  if (!sessionData) {
    return { success: false };
  }
  
  const session = JSON.parse(sessionData);
  
  // 檢查session是否過期
  if (Date.now() > session.expires) {
    await env.KV.delete(`sessions:${token}`);
    return { success: false };
  }
  
  return {
    success: true,
    user: session
  };
}

async function checkAdminAuth(request, env, config) {
  const authResult = await checkUserAuth(request, env, config);
  
  if (!authResult.success) {
    return { success: false };
  }
  
  if (authResult.user.role !== '管理員') {
    return { success: false };
  }
  
  return authResult;
}

async function handleHomePage(request, env) {
  // 顯示可用商機列表
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>工程進度管理系統</title>
    <meta charset="UTF-8">
</head>
<body>
    <h1>工程進度管理系統</h1>
    <p>請選擇要查看的工程：</p>
    <ul>
        <li><a href="/xinganxi">興安西工程</a></li>
        <li><a href="/shizhennan">市鎮南工程</a></li>
    </ul>
    <p><a href="/admin">系統管理</a></p>
</body>
</html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

async function handleAdminDashboard(request, env) {
  // 超級管理後台
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>超級管理後台</title>
    <meta charset="UTF-8">
</head>
<body>
    <h1>超級管理後台</h1>
    <nav>
        <a href="/admin/opportunities">商機管理</a>
        <a href="/admin/global-settings">全局設定</a>
        <a href="/admin/system-monitor">系統監控</a>
    </nav>
    <div id="super-admin-app"></div>
</body>
</html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

async function handleLogin(request, env, config) {
  if (request.method === 'GET') {
    // 顯示登入頁面
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>登入 - ${config.name}</title>
    <meta charset="UTF-8">
</head>
<body>
    <h1>登入 - ${config.name}</h1>
    <form id="login-form">
        <label>手機號碼:</label>
        <input type="tel" id="phone" required>
        <button type="submit">發送驗證碼</button>
    </form>
    <script>
        // 登入邏輯
    </script>
</body>
</html>
    `;
    
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  // 處理登入請求
  // TODO: 實作OTP驗證邏輯
  return new Response('登入功能開發中', { status: 501 });
}