/**
 * 興安西工程進度管理系統 - 主路由器
 * 多租戶建築工程管理平台
 */

// 主要路由處理函數
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 解析路徑，提取專案識別碼
    const pathParts = url.pathname.split('/').filter(Boolean);
    const projectSlug = pathParts[0];
    
    // CORS 設定
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // 處理 OPTIONS 預檢請求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // 路由分發
      if (!projectSlug) {
        // 根路徑 - 顯示專案管理總覽
        return await handleProjectDashboard(request, env);
      } else if (projectSlug === 'admin') {
        // 管理後台
        return await handleAdminDashboard(request, env);
      } else if (projectSlug === 'api') {
        // API 端點
        return await handleAPI(request, env, pathParts.slice(1));
      } else {
        // 專案頁面
        return await handleProjectPage(request, env, projectSlug, pathParts.slice(1));
      }
    } catch (error) {
      console.error('路由錯誤:', error);
      return new Response(JSON.stringify({ 
        error: '伺服器錯誤', 
        message: error.message 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
  }
};

/**
 * 處理專案管理總覽頁面
 */
async function handleProjectDashboard(request, env) {
  // 從 KV 獲取所有專案列表
  const projects = await getAllProjects(env);
  
  // 返回專案管理頁面
  const html = await generateProjectDashboardHTML(projects);
  
  return new Response(html, {
    headers: { 
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300' // 5分鐘快取
    }
  });
}

/**
 * 處理管理後台
 */
async function handleAdminDashboard(request, env) {
  // TODO: 實作管理員認證
  
  const html = `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>管理後台 - 興安建設管理系統</title>
    </head>
    <body>
        <h1>管理後台</h1>
        <p>此功能正在開發中...</p>
        <a href="/">返回專案列表</a>
    </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

/**
 * 處理 API 請求
 */
async function handleAPI(request, env, pathParts) {
  const endpoint = pathParts[0];
  
  switch (endpoint) {
    case 'projects':
      return await handleProjectsAPI(request, env, pathParts.slice(1));
    case 'auth':
      return await handleAuthAPI(request, env, pathParts.slice(1));
    case 'sync':
      return await handleSyncAPI(request, env, pathParts.slice(1));
    default:
      return new Response(JSON.stringify({ error: 'API 端點不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

/**
 * 處理專案頁面
 */
async function handleProjectPage(request, env, projectSlug, subPaths) {
  // 從專案 slug 中解析專案名稱和令牌
  const [projectName, token] = projectSlug.split('-');
  
  if (!projectName || !token) {
    return new Response('專案 URL 格式錯誤', { status: 400 });
  }
  
  // 驗證專案存在
  const project = await getProjectBySlug(env, projectSlug);
  if (!project) {
    return new Response('專案不存在', { status: 404 });
  }
  
  // 根據子路徑決定顯示內容
  if (subPaths.length === 0) {
    // 主專案頁面
    return await generateProjectHTML(project);
  } else {
    // 專案子頁面 (例如：報表、設定等)
    return await handleProjectSubPage(request, env, project, subPaths);
  }
}

/**
 * 從 KV 獲取所有專案
 */
async function getAllProjects(env) {
  try {
    const projectsData = await env.PROJECTS.get('all_projects');
    return projectsData ? JSON.parse(projectsData) : [];
  } catch (error) {
    console.error('獲取專案列表失敗:', error);
    return [];
  }
}

/**
 * 根據 slug 獲取專案
 */
async function getProjectBySlug(env, slug) {
  try {
    const projectData = await env.PROJECTS.get(`project:${slug}`);
    return projectData ? JSON.parse(projectData) : null;
  } catch (error) {
    console.error('獲取專案失敗:', error);
    return null;
  }
}

/**
 * 生成專案管理總覽 HTML
 */
async function generateProjectDashboardHTML(projects) {
  return `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>專案管理總覽 - 興安建設管理系統</title>
        <link rel="stylesheet" href="/static/dashboard.css">
    </head>
    <body>
        <header class="header">
            <div class="header-content">
                <h1>專案管理總覽</h1>
                <div class="header-actions">
                    <div class="user-info">
                        <span>👤</span>
                        <span>管理員</span>
                    </div>
                    <button class="btn-new-project" onclick="window.location.href='/admin/create'">
                        <span>➕</span>
                        <span>新增專案</span>
                    </button>
                </div>
            </div>
        </header>
        
        <main class="container">
            <div class="loading" id="loading">載入中...</div>
            <div id="content" style="display: none;">
                <!-- 動態載入專案列表 -->
            </div>
        </main>
        
        <script src="/static/dashboard.js"></script>
    </body>
    </html>
  `;
}

/**
 * 生成專案頁面 HTML
 */
async function generateProjectHTML(project) {
  return `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${project.name} - 工程進度</title>
        <link rel="stylesheet" href="/static/project.css">
    </head>
    <body>
        <div id="app">
            <!-- React 應用程式將在此載入 -->
        </div>
        <script src="/static/project.js"></script>
        <script>
            window.PROJECT_CONFIG = ${JSON.stringify(project)};
        </script>
    </body>
    </html>
  `;
}

/**
 * 處理專案 API
 */
async function handleProjectsAPI(request, env, pathParts) {
  const method = request.method;
  
  switch (method) {
    case 'GET':
      if (pathParts.length === 0) {
        // 獲取所有專案
        const projects = await getAllProjects(env);
        return new Response(JSON.stringify(projects), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // 獲取特定專案
        const projectSlug = pathParts[0];
        const project = await getProjectBySlug(env, projectSlug);
        if (!project) {
          return new Response(JSON.stringify({ error: '專案不存在' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify(project), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    
    case 'POST':
      // 建立新專案
      const newProject = await request.json();
      // TODO: 實作專案建立邏輯
      return new Response(JSON.stringify({ message: '專案建立成功' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    
    default:
      return new Response(JSON.stringify({ error: '不支援的方法' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

/**
 * 處理認證 API
 */
async function handleAuthAPI(request, env, pathParts) {
  // TODO: 實作 Email 認證系統
  return new Response(JSON.stringify({ message: '認證功能開發中' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * 處理同步 API (與 Fxiaoke CRM 同步)
 */
async function handleSyncAPI(request, env, pathParts) {
  // TODO: 實作 CRM 同步功能
  return new Response(JSON.stringify({ message: '同步功能開發中' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}