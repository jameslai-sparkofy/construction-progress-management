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
      } else if (projectSlug === 'create.html') {
        // 建立專案頁面
        return await serveStaticAsset(env, 'create.html');
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
  // 返回靜態的專案管理頁面
  return await serveStaticAsset(env, 'index.html');
}

/**
 * 從 frontend 目錄提供靜態資源
 */
async function serveStaticAsset(env, filename) {
  try {
    if (env && env.ASSETS) {
      const response = await env.ASSETS.fetch(new Request(`https://fake-host/${filename}`));
      if (response && response.ok) {
        return new Response(await response.text(), {
          headers: { 
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300'
          }
        });
      }
    }
  } catch (error) {
    console.error(`Failed to load ${filename} from assets:`, error);
  }
  
  // 如果從ASSETS獲取失敗，嘗試使用內建版本
  return await serveStaticFile(filename);
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
  
  // 根據子路徑決定顯示內容
  if (subPaths.length === 0) {
    // 主專案頁面 - 返回完整的興安西工程管理頁面
    return await serveProjectHTML(env);
  } else {
    // 專案子頁面 (例如：報表、設定等)
    const subPage = subPaths[0];
    if (subPage === 'login') {
      return await serveStaticFile('login.html');
    } else {
      return new Response('頁面不存在', { status: 404 });
    }
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
 * 建立新專案
 */
async function createNewProject(env, projectData) {
  try {
    // 驗證必要欄位
    const requiredFields = ['projectName', 'projectSlug', 'buildingCount', 'floorCount'];
    for (const field of requiredFields) {
      if (!projectData[field]) {
        return {
          success: false,
          error: `缺少必要欄位: ${field}`
        };
      }
    }

    // 生成安全令牌 (12位隨機字符)
    const token = generateSecureToken();
    const projectId = `${projectData.projectSlug}-${token}`;
    
    // 檢查專案是否已存在
    const existingProject = await getProjectBySlug(env, projectId);
    if (existingProject) {
      return {
        success: false,
        error: '專案已存在，請使用不同的專案簡稱'
      };
    }

    // 建立專案資料結構
    const project = {
      id: projectId,
      name: projectData.projectName,
      slug: projectData.projectSlug,
      description: projectData.projectDescription || '',
      buildingCount: parseInt(projectData.buildingCount),
      floorCount: parseInt(projectData.floorCount),
      crmInfo: projectData.crmInfo || {},
      permissions: projectData.permissions || getDefaultPermissions(),
      status: 'construction',
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      url: `progress.yes-ceramics.com/${projectId}/`
    };

    // 儲存專案到 KV
    await env.PROJECTS.put(`project:${projectId}`, JSON.stringify(project));
    
    // 更新專案列表
    await updateProjectsList(env, project);
    
    // 初始化專案相關資料
    await initializeProjectData(env, project);

    console.log('專案建立成功:', projectId);
    
    return {
      success: true,
      project: project,
      url: `https://${project.url}`
    };

  } catch (error) {
    console.error('建立專案錯誤:', error);
    return {
      success: false,
      error: '建立專案時發生內部錯誤'
    };
  }
}

/**
 * 生成安全令牌
 */
function generateSecureToken(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 取得預設權限設定
 */
function getDefaultPermissions() {
  return {
    owner: {
      viewProgress: true,
      viewPhotos: false,
      viewFinance: false
    },
    contractorLeader: {
      updateProgress: true,
      uploadPhotos: true,
      manageMembers: true
    },
    member: {
      updatePersonalProgress: true,
      uploadPhotos: true,
      viewOtherProgress: false
    },
    emailAuth: 'required'
  };
}

/**
 * 更新專案列表
 */
async function updateProjectsList(env, newProject) {
  try {
    const existingProjects = await getAllProjects(env);
    const updatedProjects = [...existingProjects, {
      id: newProject.id,
      name: newProject.name,
      status: newProject.status,
      created: newProject.created,
      url: newProject.url,
      buildingCount: newProject.buildingCount,
      floorCount: newProject.floorCount
    }];
    
    await env.PROJECTS.put('all_projects', JSON.stringify(updatedProjects));
  } catch (error) {
    console.error('更新專案列表失敗:', error);
  }
}

/**
 * 初始化專案相關資料
 */
async function initializeProjectData(env, project) {
  try {
    // 初始化建築結構資料
    const buildings = ['A', 'B', 'C', 'D'].slice(0, project.buildingCount);
    
    for (const building of buildings) {
      // 為每棟建築建立樓層結構
      const buildingData = {
        name: `${building}棟`,
        floors: project.floorCount,
        units: 6, // 預設每層6戶
        contractor: null,
        status: 'pending'
      };
      
      await env.PROJECTS.put(
        `project:${project.id}:building:${building}`, 
        JSON.stringify(buildingData)
      );
      
      // 初始化每個案場的施工狀態
      for (let floor = 1; floor <= project.floorCount; floor++) {
        for (let unit = 1; unit <= 6; unit++) {
          const caseData = {
            building: building,
            floor: floor,
            unit: unit,
            status: 'pending', // pending, in_progress, completed, problem
            area: null,
            date: null,
            contractor: null,
            contractorShortName: null,
            note: null,
            photos: []
          };
          
          await env.PROJECTS.put(
            `project:${project.id}:case:${building}_${floor}_${unit}`,
            JSON.stringify(caseData)
          );
        }
      }
    }
    
    console.log('專案資料初始化完成:', project.id);
  } catch (error) {
    console.error('初始化專案資料失敗:', error);
  }
}

/**
 * 服務完整的專案HTML頁面
 */
async function serveProjectHTML(env) {
  // 直接從環境中的ASSETS獲取完整的project.html
  try {
    if (env && env.ASSETS) {
      const response = await env.ASSETS.fetch(new Request('https://fake-host/project.html'));
      if (response && response.ok) {
        return new Response(await response.text(), {
          headers: { 
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300'
          }
        });
      }
    }
  } catch (error) {
    console.error('Failed to load project.html from assets:', error);
  }
  
  // 如果從ASSETS獲取失敗，返回錯誤頁面
  return new Response(`
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <title>載入錯誤</title>
    </head>
    <body>
        <h1>專案頁面載入失敗</h1>
        <p>無法載入完整的專案管理頁面，請稍後再試。</p>
        <a href="/">返回首頁</a>
    </body>
    </html>
  `, {
    headers: { 
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}

/**
 * 處理靜態檔案
 */
async function serveStaticFile(filename) {
  const fileMap = {
    'index.html': `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>專案管理總覽 - 興安建設管理系統</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft JhengHei", sans-serif;
            background-color: #f5f7fa;
            color: #333;
        }

        /* Header */
        .header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 1.5rem 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header-content {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header h1 {
            font-size: 1.8rem;
            font-weight: 500;
        }

        .header-actions {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
        }

        /* Main Container */
        .container {
            max-width: 1400px;
            margin: 2rem auto;
            padding: 0 2rem;
        }

        /* Stats Cards */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }

        .stat-icon.blue {
            background: #e0e7ff;
            color: #4f46e5;
        }

        .stat-icon.green {
            background: #d1fae5;
            color: #10b981;
        }

        .stat-icon.yellow {
            background: #fef3c7;
            color: #f59e0b;
        }

        .stat-icon.purple {
            background: #ede9fe;
            color: #8b5cf6;
        }

        .stat-content h3 {
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .stat-content p {
            color: #6b7280;
            font-size: 0.9rem;
        }

        /* Tabs */
        .tabs-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            overflow: hidden;
        }

        .tabs {
            display: flex;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
        }

        .tab {
            flex: 1;
            padding: 1rem 2rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
            color: #6b7280;
            border-bottom: 3px solid transparent;
            position: relative;
        }

        .tab:hover {
            background: #f3f4f6;
        }

        .tab.active {
            color: #4f46e5;
            background: white;
            border-bottom-color: #4f46e5;
        }

        .tab-count {
            display: inline-block;
            margin-left: 0.5rem;
            padding: 0.125rem 0.5rem;
            background: #e5e7eb;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 600;
        }

        .tab.active .tab-count {
            background: #e0e7ff;
            color: #4f46e5;
        }

        /* Table */
        .table-container {
            overflow-x: auto;
        }

        .projects-table {
            width: 100%;
            border-collapse: collapse;
        }

        .projects-table th {
            background: #f9fafb;
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
            position: sticky;
            top: 0;
            z-index: 10;
        }

        .projects-table td {
            padding: 1rem;
            border-bottom: 1px solid #f3f4f6;
        }

        .projects-table tr:hover {
            background: #f9fafb;
        }

        .project-name {
            font-weight: 600;
            color: #1f2937;
            text-decoration: none;
            cursor: pointer;
        }

        .project-name:hover {
            color: #4f46e5;
            text-decoration: underline;
        }

        .project-url {
            font-size: 0.875rem;
            color: #6b7280;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 0.25rem;
        }

        .copy-btn {
            padding: 0.5rem;
            background: #f3f4f6;
            border: none;
            border-radius: 6px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .copy-btn:hover {
            background: #e5e7eb;
            transform: scale(1.1);
        }

        /* Progress Bar */
        .progress-container {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .progress-bar {
            flex: 1;
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4f46e5, #7c3aed);
            border-radius: 4px;
            transition: width 0.3s ease;
        }

        .progress-fill.high {
            background: linear-gradient(90deg, #10b981, #059669);
        }

        .progress-fill.medium {
            background: linear-gradient(90deg, #f59e0b, #d97706);
        }

        .progress-text {
            font-weight: 600;
            color: #1f2937;
            min-width: 45px;
            text-align: right;
        }

        /* Status Badge */
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.375rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 500;
        }

        .status-badge.construction {
            background: #d1fae5;
            color: #065f46;
        }

        .status-badge.maintenance {
            background: #fef3c7;
            color: #92400e;
        }

        .status-badge.completed {
            background: #dbeafe;
            color: #1e40af;
        }

        /* Actions */
        .actions {
            display: flex;
            gap: 0.5rem;
        }

        .action-btn {
            padding: 0.5rem 0.75rem;
            background: transparent;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.875rem;
        }

        .action-btn:hover {
            background: #f3f4f6;
            border-color: #d1d5db;
        }

        /* Button */
        .btn-new-project {
            background: #4f46e5;
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s;
        }

        .btn-new-project:hover {
            background: #4338ca;
            transform: translateY(-1px);
        }

        /* Search and Filter */
        .search-filter-bar {
            padding: 1.5rem;
            display: flex;
            gap: 1rem;
            align-items: center;
            border-bottom: 1px solid #e5e7eb;
        }

        .search-box {
            position: relative;
            flex: 1;
            max-width: 400px;
        }

        .search-input {
            width: 100%;
            padding: 0.75rem 1rem 0.75rem 2.5rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 0.95rem;
        }

        .search-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: #6b7280;
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            color: #6b7280;
        }

        .empty-state-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.3;
        }

        /* Tab Content */
        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                gap: 1rem;
            }

            .tabs {
                overflow-x: auto;
            }

            .tab {
                white-space: nowrap;
            }

            .search-filter-bar {
                flex-direction: column;
            }

            .search-box {
                max-width: 100%;
            }

            .actions {
                flex-direction: column;
            }

            .action-btn {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="header-content">
            <h1>專案管理總覽</h1>
            <div class="header-actions">
                <div class="user-info">
                    <span>👤</span>
                    <span>管理員</span>
                </div>
                <button class="btn-new-project" onclick="window.location.href='create.html'">
                    <span>➕</span>
                    <span>新增專案</span>
                </button>
            </div>
        </div>
    </header>

    <!-- Main Container -->
    <div class="container">
        <!-- Statistics Cards -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue">🏢</div>
                <div class="stat-content">
                    <h3>12</h3>
                    <p>總專案數</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">🚧</div>
                <div class="stat-content">
                    <h3>7</h3>
                    <p>施工中</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon yellow">🔧</div>
                <div class="stat-content">
                    <h3>2</h3>
                    <p>維修中</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple">✅</div>
                <div class="stat-content">
                    <h3>3</h3>
                    <p>已完成</p>
                </div>
            </div>
        </div>

        <!-- Tabs Container -->
        <div class="tabs-container">
            <!-- Tabs -->
            <div class="tabs">
                <div class="tab active" onclick="switchTab('construction')">
                    施工中
                    <span class="tab-count">7</span>
                </div>
                <div class="tab" onclick="switchTab('maintenance')">
                    維修中
                    <span class="tab-count">2</span>
                </div>
                <div class="tab" onclick="switchTab('completed')">
                    已完成
                    <span class="tab-count">3</span>
                </div>
            </div>

            <!-- Search and Filter Bar -->
            <div class="search-filter-bar">
                <div class="search-box">
                    <span class="search-icon">🔍</span>
                    <input type="text" class="search-input" placeholder="搜尋專案名稱...">
                </div>
            </div>

            <!-- Tab Content - Construction -->
            <div class="tab-content active" id="construction-content">
                <div class="table-container">
                    <table class="projects-table">
                        <thead>
                            <tr>
                                <th style="width: 30%">專案名稱</th>
                                <th style="width: 15%">開工日期</th>
                                <th style="width: 15%">建築規模</th>
                                <th style="width: 20%">進度</th>
                                <th style="width: 10%">狀態</th>
                                <th style="width: 10%">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <a href="xinganxi-abc123def456/" class="project-name" target="_blank">興安西工程</a>
                                        <button class="copy-btn" onclick="copyURL('https://progress.yes-ceramics.com/xinganxi-abc123def456/')" title="複製專案連結">🔗</button>
                                    </div>
                                </td>
                                <td>2024/01/15</td>
                                <td>3棟15層</td>
                                <td>
                                    <div class="progress-container">
                                        <div class="progress-bar">
                                            <div class="progress-fill high" style="width: 72%"></div>
                                        </div>
                                        <div class="progress-text">72%</div>
                                    </div>
                                </td>
                                <td>
                                    <span class="status-badge construction">
                                        <span>●</span>
                                        施工中
                                    </span>
                                </td>
                                <td>
                                    <div class="actions">
                                        <button class="action-btn" onclick="editProject('興安西工程')">編輯</button>
                                        <button class="action-btn" onclick="viewReport('興安西工程')">報表</button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <a href="shizhennan-xyz789uvw012/" class="project-name" target="_blank">市鎮南住宅大樓</a>
                                        <button class="copy-btn" onclick="copyURL('https://progress.yes-ceramics.com/shizhennan-xyz789uvw012/')" title="複製專案連結">🔗</button>
                                    </div>
                                </td>
                                <td>2024/02/01</td>
                                <td>2棟20層</td>
                                <td>
                                    <div class="progress-container">
                                        <div class="progress-bar">
                                            <div class="progress-fill medium" style="width: 45%"></div>
                                        </div>
                                        <div class="progress-text">45%</div>
                                    </div>
                                </td>
                                <td>
                                    <span class="status-badge construction">
                                        <span>●</span>
                                        施工中
                                    </span>
                                </td>
                                <td>
                                    <div class="actions">
                                        <button class="action-btn" onclick="editProject('市鎮南住宅大樓')">編輯</button>
                                        <button class="action-btn" onclick="viewReport('市鎮南住宅大樓')">報表</button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <a href="riverside-pqr678stu901/" class="project-name" target="_blank">河岸景觀宅</a>
                                        <button class="copy-btn" onclick="copyURL('https://progress.yes-ceramics.com/riverside-pqr678stu901/')" title="複製專案連結">🔗</button>
                                    </div>
                                </td>
                                <td>2023/11/20</td>
                                <td>2棟18層</td>
                                <td>
                                    <div class="progress-container">
                                        <div class="progress-bar">
                                            <div class="progress-fill high" style="width: 88%"></div>
                                        </div>
                                        <div class="progress-text">88%</div>
                                    </div>
                                </td>
                                <td>
                                    <span class="status-badge construction">
                                        <span>●</span>
                                        施工中
                                    </span>
                                </td>
                                <td>
                                    <div class="actions">
                                        <button class="action-btn" onclick="editProject('河岸景觀宅')">編輯</button>
                                        <button class="action-btn" onclick="viewReport('河岸景觀宅')">報表</button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <a href="citycenter-vwx234yz567/" class="project-name" target="_blank">都心豪宅</a>
                                        <button class="copy-btn" onclick="copyURL('https://progress.yes-ceramics.com/citycenter-vwx234yz567/')" title="複製專案連結">🔗</button>
                                    </div>
                                </td>
                                <td>2024/03/10</td>
                                <td>1棟28層</td>
                                <td>
                                    <div class="progress-container">
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: 15%"></div>
                                        </div>
                                        <div class="progress-text">15%</div>
                                    </div>
                                </td>
                                <td>
                                    <span class="status-badge construction">
                                        <span>●</span>
                                        施工中
                                    </span>
                                </td>
                                <td>
                                    <div class="actions">
                                        <button class="action-btn" onclick="editProject('都心豪宅')">編輯</button>
                                        <button class="action-btn" onclick="viewReport('都心豪宅')">報表</button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <a href="techpark-jkl012mno345/" class="project-name" target="_blank">科技園區辦公大樓</a>
                                        <button class="copy-btn" onclick="copyURL('https://progress.yes-ceramics.com/techpark-jkl012mno345/')" title="複製專案連結">🔗</button>
                                    </div>
                                </td>
                                <td>2024/04/01</td>
                                <td>1棟25層</td>
                                <td>
                                    <div class="progress-container">
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: 5%"></div>
                                        </div>
                                        <div class="progress-text">5%</div>
                                    </div>
                                </td>
                                <td>
                                    <span class="status-badge construction">
                                        <span>●</span>
                                        施工中
                                    </span>
                                </td>
                                <td>
                                    <div class="actions">
                                        <button class="action-btn" onclick="editProject('科技園區辦公大樓')">編輯</button>
                                        <button class="action-btn" onclick="viewReport('科技園區辦公大樓')">報表</button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <a href="lakeside-mno456pqr789/" class="project-name" target="_blank">湖畔別墅</a>
                                        <button class="copy-btn" onclick="copyURL('https://progress.yes-ceramics.com/lakeside-mno456pqr789/')" title="複製專案連結">🔗</button>
                                    </div>
                                </td>
                                <td>2024/05/20</td>
                                <td>12戶透天</td>
                                <td>
                                    <div class="progress-container">
                                        <div class="progress-bar">
                                            <div class="progress-fill medium" style="width: 32%"></div>
                                        </div>
                                        <div class="progress-text">32%</div>
                                    </div>
                                </td>
                                <td>
                                    <span class="status-badge construction">
                                        <span>●</span>
                                        施工中
                                    </span>
                                </td>
                                <td>
                                    <div class="actions">
                                        <button class="action-btn" onclick="editProject('湖畔別墅')">編輯</button>
                                        <button class="action-btn" onclick="viewReport('湖畔別墅')">報表</button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <a href="station-stu012vwx345/" class="project-name" target="_blank">站前廣場大樓</a>
                                        <button class="copy-btn" onclick="copyURL('https://progress.yes-ceramics.com/station-stu012vwx345/')" title="複製專案連結">🔗</button>
                                    </div>
                                </td>
                                <td>2023/08/15</td>
                                <td>2棟22層</td>
                                <td>
                                    <div class="progress-container">
                                        <div class="progress-bar">
                                            <div class="progress-fill high" style="width: 93%"></div>
                                        </div>
                                        <div class="progress-text">93%</div>
                                    </div>
                                </td>
                                <td>
                                    <span class="status-badge construction">
                                        <span>●</span>
                                        施工中
                                    </span>
                                </td>
                                <td>
                                    <div class="actions">
                                        <button class="action-btn" onclick="editProject('站前廣場大樓')">編輯</button>
                                        <button class="action-btn" onclick="viewReport('站前廣場大樓')">報表</button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Tab Content - Maintenance -->
            <div class="tab-content" id="maintenance-content">
                <div class="table-container">
                    <table class="projects-table">
                        <thead>
                            <tr>
                                <th style="width: 30%">專案名稱</th>
                                <th style="width: 15%">完工日期</th>
                                <th style="width: 15%">建築規模</th>
                                <th style="width: 20%">維修項目</th>
                                <th style="width: 10%">狀態</th>
                                <th style="width: 10%">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <a href="xinyi-abc789def012/" class="project-name" target="_blank">信義商辦大樓</a>
                                        <button class="copy-btn" onclick="copyURL('https://progress.yes-ceramics.com/xinyi-abc789def012/')" title="複製專案連結">🔗</button>
                                    </div>
                                </td>
                                <td>2022/12/20</td>
                                <td>1棟35層</td>
                                <td>外牆修繕、電梯更新</td>
                                <td>
                                    <span class="status-badge maintenance">
                                        <span>🔧</span>
                                        維修中
                                    </span>
                                </td>
                                <td>
                                    <div class="actions">
                                        <button class="action-btn" onclick="editProject('信義商辦大樓')">編輯</button>
                                        <button class="action-btn" onclick="viewReport('信義商辦大樓')">報表</button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <a href="qingpu-ghi345jkl678/" class="project-name" target="_blank">青埔住宅</a>
                                        <button class="copy-btn" onclick="copyURL('https://progress.yes-ceramics.com/qingpu-ghi345jkl678/')" title="複製專案連結">🔗</button>
                                    </div>
                                </td>
                                <td>2021/08/15</td>
                                <td>3棟25層</td>
                                <td>防水工程、管線更新</td>
                                <td>
                                    <span class="status-badge maintenance">
                                        <span>🔧</span>
                                        維修中
                                    </span>
                                </td>
                                <td>
                                    <div class="actions">
                                        <button class="action-btn" onclick="editProject('青埔住宅')">編輯</button>
                                        <button class="action-btn" onclick="viewReport('青埔住宅')">報表</button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Tab Content - Completed -->
            <div class="tab-content" id="completed-content">
                <div class="table-container">
                    <table class="projects-table">
                        <thead>
                            <tr>
                                <th style="width: 30%">專案名稱</th>
                                <th style="width: 15%">完工日期</th>
                                <th style="width: 15%">建築規模</th>
                                <th style="width: 20%">工期</th>
                                <th style="width: 10%">狀態</th>
                                <th style="width: 10%">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <a href="cuihu-def456ghi789/" class="project-name" target="_blank">翠湖天地</a>
                                        <button class="copy-btn" onclick="copyURL('https://progress.yes-ceramics.com/cuihu-def456ghi789/')" title="複製專案連結">🔗</button>
                                    </div>
                                </td>
                                <td>2023/12/15</td>
                                <td>1棟12層</td>
                                <td>280天</td>
                                <td>
                                    <span class="status-badge completed">
                                        <span>✓</span>
                                        已完成
                                    </span>
                                </td>
                                <td>
                                    <div class="actions">
                                        <button class="action-btn" onclick="viewArchive('翠湖天地')">歸檔</button>
                                        <button class="action-btn" onclick="viewReport('翠湖天地')">報表</button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <a href="neihu-mno789pqr012/" class="project-name" target="_blank">內湖科技園</a>
                                        <button class="copy-btn" onclick="copyURL('https://progress.yes-ceramics.com/neihu-mno789pqr012/')" title="複製專案連結">🔗</button>
                                    </div>
                                </td>
                                <td>2023/06/30</td>
                                <td>2棟20層</td>
                                <td>450天</td>
                                <td>
                                    <span class="status-badge completed">
                                        <span>✓</span>
                                        已完成
                                    </span>
                                </td>
                                <td>
                                    <div class="actions">
                                        <button class="action-btn" onclick="viewArchive('內湖科技園')">歸檔</button>
                                        <button class="action-btn" onclick="viewReport('內湖科技園')">報表</button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <a href="nangang-stu345vwx678/" class="project-name" target="_blank">南港車站共構宅</a>
                                        <button class="copy-btn" onclick="copyURL('https://progress.yes-ceramics.com/nangang-stu345vwx678/')" title="複製專案連結">🔗</button>
                                    </div>
                                </td>
                                <td>2022/11/10</td>
                                <td>1棟40層</td>
                                <td>720天</td>
                                <td>
                                    <span class="status-badge completed">
                                        <span>✓</span>
                                        已完成
                                    </span>
                                </td>
                                <td>
                                    <div class="actions">
                                        <button class="action-btn" onclick="viewArchive('南港車站共構宅')">歸檔</button>
                                        <button class="action-btn" onclick="viewReport('南港車站共構宅')">報表</button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Empty State (for no results) -->
            <div class="empty-state" style="display: none;">
                <div class="empty-state-icon">🔍</div>
                <h3>找不到符合的專案</h3>
                <p>請嘗試其他搜尋關鍵字</p>
            </div>
        </div>
    </div>

    <script>
        // Switch tabs
        function switchTab(tabName) {
            // Update tab active state
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.closest('.tab').classList.add('active');

            // Update content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabName + '-content').classList.add('active');
        }

        // Copy URL
        function copyURL(url) {
            navigator.clipboard.writeText(url).then(() => {
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = '✓';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 1000);
            });
        }

        // Edit project
        function editProject(projectName) {
            alert(\`編輯專案: \${projectName}\`);
        }

        // View report
        function viewReport(projectName) {
            alert(\`查看報表: \${projectName}\`);
        }

        // View archive
        function viewArchive(projectName) {
            alert(\`查看歸檔: \${projectName}\`);
        }

        // Search functionality
        document.querySelector('.search-input').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const activeContent = document.querySelector('.tab-content.active');
            const rows = activeContent.querySelectorAll('tbody tr');
            let hasResults = false;

            rows.forEach(row => {
                const projectName = row.querySelector('.project-name').textContent.toLowerCase();
                if (projectName.includes(searchTerm)) {
                    row.style.display = '';
                    hasResults = true;
                } else {
                    row.style.display = 'none';
                }
            });

            // Show/hide empty state
            const emptyState = document.querySelector('.empty-state');
            if (!hasResults && searchTerm) {
                emptyState.style.display = 'block';
                activeContent.querySelector('.table-container').style.display = 'none';
            } else {
                emptyState.style.display = 'none';
                activeContent.querySelector('.table-container').style.display = 'block';
            }
        });
    </script>
</body>
</html>`,
    'project.html': '', // Will be loaded from frontend/project.html
  };
  
  // Set project.html content directly  
  fileMap['project.html'] = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>興安西工程進度管理系統</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Microsoft JhengHei', Arial, sans-serif; 
            background: #f5f7fa; 
            color: #333; 
            line-height: 1.6;
        }
        .header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 2rem;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 2rem;
        }
        .welcome-card {
            background: white;
            border-radius: 12px;
            padding: 3rem;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }
        .feature-card {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            transition: transform 0.2s;
        }
        .feature-card:hover {
            transform: translateY(-2px);
        }
        .feature-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        .btn-primary {
            background: #4f46e5;
            color: white;
            padding: 1rem 2rem;
            border: none;
            border-radius: 8px;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-block;
            margin: 1rem 0.5rem;
        }
        .btn-primary:hover {
            background: #4338ca;
            transform: translateY(-1px);
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        .stat-item {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1.5rem;
            border-radius: 12px;
            text-align: center;
        }
        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            display: block;
        }
    </style>
</head>
<body>
    <header class="header">
        <h1>🏗️ 興安西工程進度管理系統</h1>
        <p>即時監控建築進度，提升施工效率</p>
    </header>

    <div class="container">
        <div class="welcome-card">
            <h2>歡迎使用工程進度管理系統</h2>
            <p style="color: #6b7280; margin: 1rem 0;">這是興安西建案的專屬進度管理平台，提供即時進度追蹤、施工照片管理等功能。</p>
            
            <div class="stats">
                <div class="stat-item">
                    <span class="stat-number">3</span>
                    <span>建築棟數</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">15</span>
                    <span>樓層數</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">72%</span>
                    <span>整體進度</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">24</span>
                    <span>施工班組</span>
                </div>
            </div>

            <div style="margin-top: 2rem;">
                <a href="#" class="btn-primary" onclick="alert('登入功能開發中...')">🔐 登入系統</a>
                <a href="#" class="btn-primary" onclick="alert('訪客模式開發中...')">👁️ 訪客瀏覽</a>
            </div>
        </div>

        <div class="feature-grid">
            <div class="feature-card">
                <div class="feature-icon">📊</div>
                <h3>即時進度追蹤</h3>
                <p>各樓層施工進度即時更新，一目了然掌握整體狀況</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">📸</div>
                <h3>施工照片管理</h3>
                <p>工班上傳施工現場照片，記錄每個重要施工節點</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">📈</div>
                <h3>進度報表分析</h3>
                <p>自動生成進度報表，支援多種格式匯出</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">👥</div>
                <h3>多角色權限</h3>
                <p>業主、工班負責人、成員等不同角色權限管理</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">🔔</div>
                <h3>即時通知</h3>
                <p>重要進度更新即時推送，確保溝通無誤</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">📱</div>
                <h3>行動裝置支援</h3>
                <p>手機、平板完美適配，隨時隨地掌握進度</p>
            </div>
        </div>

        <div style="text-align: center; margin: 3rem 0; padding: 2rem; background: white; border-radius: 12px;">
            <h3>🚧 系統正在開發中</h3>
            <p style="color: #6b7280; margin: 1rem 0;">
                完整的工程進度管理功能正在開發中，包括詳細的進度圖表、施工日誌、
                材料管理、質量檢查等功能即將上線。
            </p>
            <p style="color: #6b7280;">
                <strong>預計完成時間：</strong>2025年8月
            </p>
        </div>
    </div>
</body>
</html>`;
  
  const content = fileMap[filename];
  if (!content) {
    return new Response('檔案不存在', { status: 404 });
  }
  
  return new Response(content, {
    headers: { 
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    }
  });
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
        <style>
          body { font-family: 'Microsoft JhengHei', sans-serif; margin: 0; padding: 20px; }
          .container { max-width: 800px; margin: 0 auto; }
          .header { background: #1e3c72; color: white; padding: 20px; margin: -20px -20px 20px -20px; }
          .content { background: white; padding: 30px; border-radius: 8px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🏗️ ${project.name}</h1>
            <p>${project.description}</p>
        </div>
        <div class="container">
            <div class="content">
                <h2>專案資訊</h2>
                <p><strong>建築規模：</strong>${project.buildings}棟${project.floors}層</p>
                <p><strong>專案狀態：</strong>${project.status === 'construction' ? '施工中' : project.status}</p>
                <p><strong>建立日期：</strong>${project.created}</p>
                
                <div style="margin-top: 30px;">
                    <h3>系統功能</h3>
                    <ul>
                        <li>即時進度追蹤</li>
                        <li>施工照片管理</li>
                        <li>進度報表分析</li>
                        <li>多角色權限控制</li>
                    </ul>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * 生成登入頁面 HTML
 */
async function generateLoginHTML(project) {
  return `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${project.name} - 登入</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Microsoft JhengHei', sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .login-container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            padding: 50px;
            width: 100%;
            max-width: 420px;
            margin: 20px;
          }
          .logo { text-align: center; font-size: 2.5em; margin-bottom: 15px; }
          .project-name {
            text-align: center;
            font-size: 1.3em;
            color: #1e3c72;
            margin-bottom: 35px;
            font-weight: 600;
          }
          .form-group { margin-bottom: 25px; }
          label { display: block; margin-bottom: 8px; font-weight: 500; color: #333; }
          input[type="email"] {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            transition: all 0.3s;
            background: #fafbfc;
          }
          input[type="email"]:focus {
            outline: none;
            border-color: #1e3c72;
            background: white;
            box-shadow: 0 0 0 3px rgba(30, 60, 114, 0.1);
          }
          .login-btn {
            width: 100%;
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            color: white;
            border: none;
            padding: 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s;
          }
          .info {
            background: #e3f2fd;
            color: #1976d2;
            border: 1px solid #2196f3;
            margin-bottom: 25px;
            padding: 12px;
            border-radius: 6px;
            text-align: center;
            font-size: 14px;
          }
        </style>
    </head>
    <body>
        <div class="login-container">
            <div class="logo">🏗️</div>
            <div class="project-name">${project.name}</div>
            
            <div class="info">
                請使用您的 Email 地址登入系統
            </div>
            
            <form>
                <div class="form-group">
                    <label for="email">Email 地址</label>
                    <input type="email" id="email" name="email" placeholder="請輸入您的 Email" required>
                </div>
                
                <button type="submit" class="login-btn">登入</button>
            </form>
        </div>
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
      try {
        const projectData = await request.json();
        const result = await createNewProject(env, projectData);
        
        if (result.success) {
          return new Response(JSON.stringify({
            success: true,
            message: '專案建立成功',
            project: result.project,
            url: result.url
          }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: result.error
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        console.error('建立專案失敗:', error);
        return new Response(JSON.stringify({
          success: false,
          error: '建立專案時發生錯誤'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    
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