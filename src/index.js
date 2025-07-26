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
  },

  /**
   * Cloudflare Cron Trigger 定時任務
   * 每小時同步 CRM 商機到 D1 資料庫
   */
  async scheduled(event, env, ctx) {
    console.log('🕐 開始執行定時同步任務...');
    
    try {
      // 記錄商機同步開始
      const opportunityLogId = await logSyncStart(env, 'opportunities', 'cron_trigger', 'Cloudflare-Cron', 'scheduled');
      const opportunitySync = await syncOpportunitiesToDB(env, opportunityLogId);
      
      // 記錄案場同步開始
      const siteLogId = await logSyncStart(env, 'sites', 'cron_trigger', 'Cloudflare-Cron', 'scheduled');
      const siteSync = await syncSitesToDB(env, siteLogId);
      
      // 記錄維修單同步開始
      const maintenanceLogId = await logSyncStart(env, 'maintenance', 'cron_trigger', 'Cloudflare-Cron', 'scheduled');
      const maintenanceSync = await syncMaintenanceOrdersToDB(env, maintenanceLogId);
      
      // 記錄銷售記錄同步開始
      const salesLogId = await logSyncStart(env, 'sales', 'cron_trigger', 'Cloudflare-Cron', 'scheduled');
      const salesSync = await syncSalesRecordsToDB(env, salesLogId);
      
      console.log('✅ 定時同步完成:', {
        opportunities: {
          syncedCount: opportunitySync.syncedCount,
          totalCount: opportunitySync.totalCount
        },
        sites: {
          syncedCount: siteSync.syncedCount,
          totalCount: siteSync.totalCount
        },
        maintenance_orders: {
          syncedCount: maintenanceSync.syncedCount,
          totalCount: maintenanceSync.totalCount
        },
        sales_records: {
          syncedCount: salesSync.syncedCount,
          totalCount: salesSync.totalCount
        },
        timestamp: new Date().toISOString()
      });
      
      // 可選：記錄到其他系統或通知
      
    } catch (error) {
      console.error('❌ 定時同步失敗:', error);
      
      // 可選：發送警報通知
      // await sendAlert(env, '定時同步失敗', error.message);
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
  
  // 調試日誌 - 檢查部署狀態
  console.log('🔧 handleAPI 調試:', { endpoint, pathParts, timestamp: new Date().toISOString() });
  
  switch (endpoint) {
    case 'projects':
      return await handleProjectsAPI(request, env, pathParts.slice(1));
    case 'auth':
      return await handleAuthAPI(request, env, pathParts.slice(1));
    case 'sync':
      return await handleSyncAPI(request, env, pathParts.slice(1));
    case 'crm':
      return await handleCRMAPI(request, env, pathParts.slice(1));
    case 'progress':
      return await handleProgressAPI(request, env, pathParts.slice(1));
    case 'test-progress':
      return new Response(JSON.stringify({ 
        message: 'Progress API route is working',
        pathParts: pathParts,
        endpoint: endpoint,
        method: request.method 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      break;
    case 'test-ip':
      return await handleTestIP(request, env);
    case 'test-crm-write':
      return await handleTestCRMWrite(request, env);
    case 'test-token':
      return await handleTestToken(request, env);
    case 'database':
      return await handleDatabaseAPI(request, env, pathParts.slice(1));
    case 'migration':
      return await handleMigrationAPI(request, env, pathParts);
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
  // 直接使用專案ID，不需要解析格式
  const projectId = projectSlug;
  
  if (!projectId) {
    return new Response('專案ID不能為空', { status: 400 });
  }
  
  // 根據子路徑決定顯示內容
  if (subPaths.length === 0) {
    // 主專案頁面 - 返回完整的興安西工程管理頁面
    return await serveProjectHTML(env, projectId);
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
 * 從 D1 資料庫獲取所有專案
 */
async function getAllProjects(env) {
  try {
    const result = await env.DB.prepare(`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.building_count as buildingCount,
        p.floor_count as floorCount,
        p.status,
        p.created_at as createdAt,
        NULL as startDate,
        NULL as completionDate,
        COALESCE(
          ROUND(
            (SELECT AVG(pr.progress_percentage) 
             FROM progress_records pr 
             WHERE pr.project_id = p.id), 0
          ), 0
        ) as progress,
        (p.building_count || '棟' || p.floor_count || '層') as buildingInfo
      FROM projects p
      ORDER BY p.created_at DESC
    `).all();
    
    return result.results || [];
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
    const result = await env.DB.prepare(`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.building_count as buildingCount,
        p.floor_count as floorCount,
        p.status,
        p.created_at as createdAt,
        NULL as startDate,
        NULL as completionDate,
        COALESCE(
          ROUND(
            (SELECT AVG(pr.progress_percentage) 
             FROM progress_records pr 
             WHERE pr.project_id = p.id), 0
          ), 0
        ) as progress,
        (p.building_count || '棟' || p.floor_count || '層') as buildingInfo
      FROM projects p
      WHERE p.slug = ? OR p.id = ?
    `).bind(slug, slug).first();
    
    return result;
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
    
    // 儲存專案到 D1 資料庫
    await env.DB.prepare(`
      INSERT INTO projects (
        id, crm_opportunity_id, name, slug, token, description, 
        building_count, floor_count, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      projectId,
      projectData.crmOpportunityId || '',
      project.name,
      project.slug,
      token,
      project.description,
      project.buildingCount,
      project.floorCount,
      project.status,
      project.created,
      project.lastUpdated
    ).run();
    
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
async function serveProjectHTML(env, projectId = null) {
  // 直接從環境中的ASSETS獲取完整的project.html
  try {
    if (env && env.ASSETS) {
      const response = await env.ASSETS.fetch(new Request('https://fake-host/project.html'));
      if (response && response.ok) {
        let html = await response.text();
        
        // 如果提供了專案ID，將其注入到HTML中
        if (projectId) {
          // 在HTML中注入專案ID，供前端JavaScript使用
          html = html.replace(
            '<head>',
            `<head>
            <script>
              window.PROJECT_ID = '${projectId}';
            </script>`
          );
        }
        
        return new Response(html, {
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
    
    case 'DELETE':
      // 刪除專案
      if (pathParts.length === 0) {
        return new Response(JSON.stringify({ error: '需要指定專案 ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const projectIdToDelete = pathParts[0];
      try {
        // 檢查專案是否存在
        const project = await getProjectBySlug(env, projectIdToDelete);
        if (!project) {
          return new Response(JSON.stringify({ 
            success: false,
            error: '專案不存在' 
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // 從 D1 資料庫刪除專案（CASCADE 會自動刪除相關記錄）
        await env.DB.prepare(`
          DELETE FROM projects WHERE id = ? OR slug = ?
        `).bind(projectIdToDelete, projectIdToDelete).run();
        
        return new Response(JSON.stringify({
          success: true,
          message: '專案已成功刪除'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('刪除專案失敗:', error);
        return new Response(JSON.stringify({
          success: false,
          error: '刪除專案時發生錯誤'
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
  const endpoint = pathParts[0];
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  switch (endpoint) {
    case 'opportunities':
      return await handleOpportunitiesSync(request, env, corsHeaders);
    case 'status':
      return await handleSyncStatus(request, env, corsHeaders);
    case 'force':
      return await handleForceSync(request, env, corsHeaders);
    case 'sites':
      return await handleSitesSync(request, env, corsHeaders);
    case 'maintenance-orders':
      return await handleMaintenanceOrdersSync(request, env, corsHeaders);
    case 'sales-records':
      return await handleSalesRecordsSync(request, env, corsHeaders);
    default:
      return new Response(JSON.stringify({ 
        error: '同步 API 端點不存在',
        available: ['opportunities', 'status', 'force', 'sites', 'maintenance-orders', 'sales-records']
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
  }
}

/**
 * 處理商機同步
 */
async function handleOpportunitiesSync(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '僅支援 POST 請求' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const userAgent = request.headers.get('User-Agent') || '';
  const ipAddress = request.headers.get('CF-Connecting-IP') || '';
  let logId = null;
  
  try {
    console.log('🔄 開始同步 Fxiaoke CRM 商機到 D1 資料庫');
    
    // 記錄同步開始
    logId = await logSyncStart(env, 'opportunities', 'manual_trigger', userAgent, ipAddress);
    
    // 檢查上次同步時間，避免頻繁同步
    const lastSync = await env.DB.prepare(
      'SELECT last_sync_time FROM sync_status WHERE sync_type = ?'
    ).bind('opportunities').first();
    
    const now = Date.now();
    const minInterval = 5 * 60 * 1000; // 5 分鐘最小間隔
    
    if (lastSync && (now - lastSync.last_sync_time) < minInterval) {
      await logSyncComplete(env, logId, 'error', 0, 0, 0, '同步間隔過短，請稍後再試');
      return new Response(JSON.stringify({
        success: false,
        message: '同步間隔過短，請稍後再試',
        nextSyncAvailable: new Date(lastSync.last_sync_time + minInterval).toISOString()
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // 執行同步
    const syncResult = await syncOpportunitiesToDB(env, logId);
    
    return new Response(JSON.stringify(syncResult), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('同步失敗:', error);
    await logSyncComplete(env, logId, 'error', 0, 0, 0, error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * 查詢同步狀態
 */
async function handleSyncStatus(request, env, corsHeaders) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: '僅支援 GET 請求' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    const status = await env.DB.prepare(
      'SELECT * FROM sync_status WHERE sync_type = ?'
    ).bind('opportunities').first();
    
    const opportunityCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM opportunities'
    ).first();
    
    return new Response(JSON.stringify({
      success: true,
      syncStatus: status,
      localOpportunityCount: opportunityCount?.count || 0,
      lastSyncAgo: status?.last_sync_time ? 
        Math.floor((Date.now() - status.last_sync_time) / 1000 / 60) + ' 分鐘前' : 
        '從未同步'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * 強制同步（忽略時間間隔限制）
 */
async function handleForceSync(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '僅支援 POST 請求' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    console.log('🔄 強制同步 Fxiaoke CRM 商機');
    const syncResult = await syncOpportunitiesToDB(env);
    
    return new Response(JSON.stringify({
      ...syncResult,
      forced: true
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('強制同步失敗:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      forced: true
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * 同步商機到 D1 資料庫
 */
async function syncOpportunitiesToDB(env, logId = null) {
  const startTime = Date.now();
  
  try {
    // 1. 獲取 Fxiaoke Token
    const tokenResult = await getFxiaokeToken();
    if (!tokenResult.success) {
      throw new Error(tokenResult.error);
    }
    
    const { token, corpId, userId } = tokenResult;
    console.log('✅ 獲取 Fxiaoke Token 成功');
    
    // 2. 獲取所有商機（可能需要分頁）
    const opportunities = await queryAllOpportunities(token, corpId, userId);
    console.log(`📊 從 CRM 獲取到 ${opportunities.length} 個商機`);
    
    // 3. 批量插入/更新到 D1
    let insertedCount = 0;
    let updatedCount = 0;
    
    for (const opp of opportunities) {
      try {
        // 檢查是否已存在
        const existing = await env.DB.prepare(
          'SELECT update_time FROM opportunities WHERE id = ?'
        ).bind(opp.id).first();
        
        const oppData = {
          id: opp.id,
          name: opp.name,
          customer: opp.customer,
          amount: parseInt(opp.amount?.replace(/[^\d]/g, '') || '0'),
          stage: opp.stage,
          create_time: opp.createTime,
          update_time: opp.updateTime,
          synced_at: Date.now(),
          raw_data: JSON.stringify(opp)
        };
        
        if (existing) {
          // 只有在數據有更新時才更新
          if (existing.update_time !== opp.updateTime) {
            await env.DB.prepare(`
              UPDATE opportunities SET 
                name = ?, customer = ?, amount = ?, stage = ?, 
                update_time = ?, synced_at = ?, raw_data = ?
              WHERE id = ?
            `).bind(
              oppData.name, oppData.customer, oppData.amount, oppData.stage,
              oppData.update_time, oppData.synced_at, oppData.raw_data, oppData.id
            ).run();
            updatedCount++;
          }
        } else {
          // 新增記錄
          await env.DB.prepare(`
            INSERT INTO opportunities 
            (id, name, customer, amount, stage, create_time, update_time, synced_at, raw_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            oppData.id, oppData.name, oppData.customer, oppData.amount, oppData.stage,
            oppData.create_time, oppData.update_time, oppData.synced_at, oppData.raw_data
          ).run();
          insertedCount++;
        }
        
      } catch (error) {
        console.error(`處理商機 ${opp.id} 時出錯:`, error);
      }
    }
    
    // 4. 更新同步狀態
    await env.DB.prepare(`
      INSERT OR REPLACE INTO sync_status 
      (sync_type, last_sync_time, last_sync_count, status, message)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      'opportunities',
      Date.now(),
      opportunities.length,
      'success',
      `成功同步 ${opportunities.length} 個商機 (新增: ${insertedCount}, 更新: ${updatedCount})`
    ).run();
    
    const duration = Date.now() - startTime;
    console.log(`✅ 同步完成，耗時 ${duration}ms`);
    
    // 記錄同步完成LOG
    await logSyncComplete(
      env, 
      logId, 
      'success', 
      opportunities.length,
      insertedCount + updatedCount,
      0,
      '',
      JSON.stringify({
        insertedCount,
        updatedCount,
        totalCount: opportunities.length,
        syncedTable: 'opportunities'
      })
    );
    
    return {
      success: true,
      syncedCount: opportunities.length,
      insertedCount,
      updatedCount,
      duration,
      syncTime: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('同步失敗:', error);
    
    // 記錄同步失敗LOG
    await logSyncComplete(
      env, 
      logId, 
      'error', 
      0,
      0,
      1,
      error.message,
      JSON.stringify({
        errorDetails: error.stack || error.message,
        syncedTable: 'opportunities'
      })
    );
    
    try {
      // 記錄失敗狀態
      await env.DB.prepare(`
        INSERT OR REPLACE INTO sync_status 
        (sync_type, last_sync_time, last_sync_count, status, message)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'opportunities',
        Date.now(),
        0,
        'failed',
        error.message
      ).run();
    } catch (dbError) {
      console.error('記錄同步失敗狀態時出錯:', dbError);
    }
    
    // 返回錯誤結果而不是拋出異常
    return {
      success: false,
      error: error.message,
      syncedCount: 0,
      insertedCount: 0,
      updatedCount: 0,
      duration: Date.now() - startTime,
      syncTime: new Date().toISOString()
    };
  }
}

/**
 * 查詢所有商機（支援分頁）
 */
async function queryAllOpportunities(token, corpId, userId) {
  const CONFIG = {
    baseUrl: "https://open.fxiaoke.com"
  };
  
  const allOpportunities = [];
  let offset = 0;
  const limit = 100; // 每次查詢 100 筆
  let hasMore = true;
  
  while (hasMore) {
    try {
      console.log(`🔄 查詢商機，offset: ${offset}, limit: ${limit}`);
      
      const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          corpId: corpId,
          corpAccessToken: token,
          currentOpenUserId: userId,
          data: {
            apiName: "NewOpportunityObj",
            search_query_info: {
              limit: limit,
              offset: offset,
              orders: [{fieldName: "create_time", isAsc: "false"}]
            }
          }
        })
      });
      
      const result = await response.json();
      
      if (result.errorCode !== 0) {
        throw new Error(`商機查詢失敗: ${result.errorMessage}`);
      }
      
      const opportunities = result.data?.dataList || [];
      
      if (opportunities.length === 0) {
        hasMore = false;
        break;
      }
      
      // 轉換格式並添加到總列表
      const formattedOpportunities = opportunities.map(opp => ({
        id: opp._id,
        name: opp.name || '未命名商機',
        customer: opp.customer_name || opp.account_name || '未知客戶',
        amount: formatAmount(opp.amount || opp.estimated_amount || 0),
        stage: opp.stage || '未知階段',
        createTime: opp.create_time,
        updateTime: opp.update_time || opp.last_modified_time
      }));
      
      allOpportunities.push(...formattedOpportunities);
      
      // 如果返回的數量少於 limit，表示沒有更多數據了
      if (opportunities.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
      
    } catch (error) {
      console.error(`查詢第 ${offset} 頁商機時出錯:`, error);
      hasMore = false;
      throw error;
    }
  }
  
  console.log(`✅ 總共獲取到 ${allOpportunities.length} 個商機`);
  return allOpportunities;
}

/**
 * 處理 CRM API 請求
 */
async function handleCRMAPI(request, env, pathParts) {
  const endpoint = pathParts[0];
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  // Handle OPTIONS preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  switch (endpoint) {
    case 'opportunities':
      // 檢查是否為搜尋請求
      if (pathParts[1] === 'search') {
        return await handleOpportunitiesSearchAPI(request, env, corsHeaders);
      } else {
        return await handleOpportunitiesAPI(request, env, corsHeaders);
      }
    case 'sales-records':
      return await handleSalesRecordsAPI(request, env, corsHeaders);
    case 'sites':
      // 檢查是否為從D1查詢案場
      if (pathParts[1] === 'db') {
        return await handleSitesFromDBAPI(request, env, corsHeaders);
      } else {
        return await handleSitesAPI(request, env, corsHeaders);
      }
    case 'maintenance-orders':
      return await handleMaintenanceOrdersAPI(request, env, corsHeaders);
    default:
      return new Response(JSON.stringify({ error: 'CRM API 端點不存在' }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
  }
}

/**
 * 處理商機 API 請求
 */
async function handleOpportunitiesAPI(request, env, corsHeaders) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: '僅支援 GET 請求' }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });
  }
  
  try {
    console.log('開始查詢 Fxiaoke CRM 商機...');
    
    // 獲取分頁參數
    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    console.log(`分頁參數: offset=${offset}, limit=${limit}`);
    
    // Step 1: 獲取 Fxiaoke API Token
    const tokenResult = await getFxiaokeToken();
    if (!tokenResult.success) {
      throw new Error(tokenResult.error);
    }
    
    const { token, corpId, userId } = tokenResult;
    console.log('✅ Fxiaoke Token 獲取成功');
    
    // Step 2: 查詢商機列表
    const opportunities = await queryOpportunities(token, corpId, userId, offset, limit);
    console.log(`✅ 查詢到 ${opportunities.length} 個商機 (offset: ${offset}, limit: ${limit})`);
    
    return new Response(JSON.stringify({
      success: true,
      data: opportunities,
      count: opportunities.length,
      isDemo: false
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });
    
  } catch (error) {
    console.error('查詢商機失敗:', error);
    
    // 如果 API 調用失敗，提供演示數據作為後備
    console.log('API 失敗，提供演示數據作為後備');
    const demoOpportunities = getDemoOpportunities();
    
    return new Response(JSON.stringify({
      success: true,
      data: demoOpportunities,
      count: demoOpportunities.length,
      isDemo: true,
      message: '無法連接 CRM 系統，顯示演示數據'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });
  }
}

/**
 * 處理商機搜尋 API 請求 - 混合搜尋策略
 */
async function handleOpportunitiesSearchAPI(request, env, corsHeaders) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: '僅支援 GET 請求' }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });
  }
  
  try {
    // 獲取搜尋參數
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get('q');
    const forceAPI = url.searchParams.get('force_api') === 'true'; // 強制使用 API 搜尋
    
    if (!searchQuery || searchQuery.trim() === '') {
      return new Response(JSON.stringify({ 
        error: '請提供搜尋關鍵字',
        success: false 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
    
    console.log('🔍 搜尋請求，關鍵字:', searchQuery, forceAPI ? '(強制 API)' : '(優先本地)');
    
    let searchResults = [];
    let searchSource = 'local';
    
    // Step 1: 優先從本地 D1 資料庫搜尋
    if (!forceAPI) {
      try {
        console.log('📦 嘗試從本地 D1 資料庫搜尋...');
        searchResults = await searchOpportunitiesFromDB(env, searchQuery);
        
        if (searchResults.length > 0) {
          console.log(`✅ 本地搜尋成功，找到 ${searchResults.length} 個商機`);
          
          // 記錄搜尋日誌（可選，忽略錯誤）
          try {
            await env.DB.prepare(`
              INSERT INTO search_logs (search_term, results_count, search_source, search_time, user_agent)
              VALUES (?, ?, ?, ?, ?)
            `).bind(
              searchQuery,
              searchResults.length,
              'local',
              Date.now(),
              request.headers.get('User-Agent') || 'Unknown'
            ).run();
          } catch (logError) {
            console.log('搜尋日誌記錄失敗（忽略）:', logError.message);
          }
          
          return new Response(JSON.stringify({
            success: true,
            data: searchResults,
            count: searchResults.length,
            query: searchQuery,
            source: 'local',
            isDemo: false
          }), {
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            }
          });
        } else {
          console.log('📭 本地搜尋無結果，準備調用 CRM API...');
        }
      } catch (dbError) {
        console.error('本地搜尋失敗:', dbError);
        // 繼續嘗試 API 搜尋
      }
    }
    
    // Step 2: 本地無結果或強制 API，則調用 Fxiaoke API
    console.log('🌐 調用 Fxiaoke CRM API 搜尋...');
    
    // 獲取 Token
    const tokenResult = await getFxiaokeToken();
    if (!tokenResult.success) {
      throw new Error(tokenResult.error);
    }
    
    const { token, corpId, userId } = tokenResult;
    console.log('✅ Fxiaoke Token 獲取成功');
    
    // 執行 API 搜尋
    searchResults = await searchOpportunities(token, corpId, userId, searchQuery);
    searchSource = 'api';
    console.log(`✅ API 搜尋完成，找到 ${searchResults.length} 個符合的商機`);
    
    // 如果 API 搜尋有結果，可以考慮更新本地資料庫
    if (searchResults.length > 0) {
      // 異步更新本地資料庫（不阻塞回應）
      updateLocalOpportunities(env, searchResults).catch(error => {
        console.error('更新本地資料庫失敗:', error);
      });
    }
    
    // 記錄搜尋日誌（可選，忽略錯誤）
    try {
      await env.DB.prepare(`
        INSERT INTO search_logs (search_term, results_count, search_source, search_time, user_agent)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        searchQuery,
        searchResults.length,
        searchSource,
        Date.now(),
        request.headers.get('User-Agent') || 'Unknown'
      ).run();
    } catch (logError) {
      console.log('搜尋日誌記錄失敗（忽略）:', logError.message);
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: searchResults,
      count: searchResults.length,
      query: searchQuery,
      source: searchSource,
      isDemo: false
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });
    
  } catch (error) {
    console.error('搜尋失敗:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      data: [],
      count: 0
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });
  }
}

/**
 * 從本地 D1 資料庫搜尋商機
 */
async function searchOpportunitiesFromDB(env, searchQuery) {
  try {
    console.log('🔍 D1 搜尋開始，關鍵字:', searchQuery);
    const searchTerm = `%${searchQuery.toLowerCase()}%`;
    
    // 使用 SQL LIKE 查詢，搜尋名稱和客戶欄位
    const results = await env.DB.prepare(`
      SELECT id, name, customer, amount, stage, create_time as createTime, update_time as updateTime
      FROM opportunities
      WHERE LOWER(name) LIKE ? OR LOWER(customer) LIKE ?
      ORDER BY update_time DESC
      LIMIT 100
    `).bind(searchTerm, searchTerm).all();
    
    console.log('📊 D1 搜尋結果數量:', results.results?.length || 0);
    
    if (!results.results) {
      return [];
    }
    
    // 格式化結果
    return results.results.map(opp => ({
      id: opp.id,
      name: opp.name,
      customer: opp.customer,
      amount: `NT$ ${(opp.amount || 0).toLocaleString()}`,
      stage: opp.stage,
      createTime: opp.createTime,
      updateTime: opp.updateTime
    }));
    
  } catch (error) {
    console.error('D1 資料庫搜尋錯誤:', error);
    throw error;
  }
}

/**
 * 更新本地商機資料（異步）
 */
async function updateLocalOpportunities(env, opportunities) {
  for (const opp of opportunities) {
    try {
      // 檢查是否需要更新
      const existing = await env.DB.prepare(
        'SELECT id FROM opportunities WHERE id = ?'
      ).bind(opp.id).first();
      
      if (!existing) {
        // 新商機，插入資料庫
        await env.DB.prepare(`
          INSERT INTO opportunities 
          (id, name, customer, amount, stage, create_time, update_time, synced_at, raw_data)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          opp.id,
          opp.name,
          opp.customer,
          parseInt(opp.amount?.replace(/[^\d]/g, '') || '0'),
          opp.stage,
          opp.createTime,
          opp.updateTime,
          Date.now(),
          JSON.stringify(opp)
        ).run();
        
        console.log(`✅ 新增商機到本地資料庫: ${opp.name}`);
      }
    } catch (error) {
      console.error(`更新商機 ${opp.id} 失敗:`, error);
    }
  }
}

/**
 * 測試 Worker IP 地址
 */
async function handleTestIP(request, env) {
  try {
    // 方法1：使用 httpbin.org 獲取 IP
    const ipResponse1 = await fetch('https://httpbin.org/ip');
    const ipData1 = await ipResponse1.json();
    
    // 方法2：使用 ifconfig.me
    const ipResponse2 = await fetch('https://ifconfig.me/ip');
    const ipData2 = await ipResponse2.text();
    
    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      worker_ip_httpbin: ipData1.origin,
      worker_ip_ifconfig: ipData2.trim(),
      cloudflare_ray: request.headers.get('cf-ray'),
      cf_connecting_ip: request.headers.get('cf-connecting-ip'),
      x_forwarded_for: request.headers.get('x-forwarded-for'),
      cf_ipcountry: request.headers.get('cf-ipcountry'),
      note: 'Cloudflare Workers 使用動態 IP，建議將完整 IP 範圍加入白名單'
    }, null, 2), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 測試 Token 獲取功能
 */
async function handleTestToken(request, env) {
  try {
    console.log('🧪 開始測試 Token 獲取功能');
    
    const tokenData = await getFxiaokeToken();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Token 獲取測試完成',
      tokenData: tokenData,
      timestamp: new Date().toISOString()
    }, null, 2), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('❌ Token 獲取測試失敗:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 測試 CRM 寫入功能
 */
async function handleTestCRMWrite(request, env) {
  try {
    console.log('🧪 開始測試 CRM 寫入功能');
    
    // 獲取 Fxiaoke token
    console.log('📡 開始獲取 Fxiaoke token...');
    const tokenData = await getFxiaokeToken();
    console.log('📡 Token 獲取結果:', JSON.stringify(tokenData, null, 2));
    
    if (!tokenData || !tokenData.success) {
      const errorDetail = tokenData?.error || '未知錯誤';
      console.error('❌ Token 獲取失敗:', errorDetail);
      throw new Error(`獲取 CRM token 失敗: ${errorDetail}`);
    }
    
    console.log('🔍 Token 數據結構檢查:', {
      hasTokenData: !!tokenData,
      tokenDataKeys: tokenData ? Object.keys(tokenData) : [],
      tokenDataValues: tokenData
    });
    
    const { corpId, token: corpAccessToken, userId: currentOpenUserId } = tokenData;
    console.log('✅ 成功獲取 CRM token:', { 
      corpId: corpId?.substring(0, 10) + '...', 
      userId: currentOpenUserId,
      hasToken: !!corpAccessToken 
    });
    
    // 測試案場 ID 和更新數據
    const siteId = '6621c7a2eb4c7f0001817f67';
    const testValue = 'TEST';
    
    // 按照 API 文檔格式組織請求數據
    const requestData = {
      corpAccessToken: corpAccessToken,
      triggerWorkFlow: false,
      currentOpenUserId: currentOpenUserId,
      corpId: corpId,
      data: {
        skipDataStatusValidate: false,
        object_data: {
          _id: siteId,
          field_u1wpv__c: testValue
        }
      }
    };
    
    console.log('📤 準備發送 CRM 更新請求:', JSON.stringify(requestData, null, 2));
    
    // 調用 Fxiaoke 自定義對象更新 API
    const response = await fetch('https://open.fxiaoke.com/cgi/crm/custom/v2/data/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    const result = await response.json();
    console.log('📡 CRM API 響應:', result);
    
    // 返回測試結果
    return new Response(JSON.stringify({
      success: result.errorCode === 0,
      message: result.errorCode === 0 ? 'CRM 寫入測試成功' : 'CRM 寫入測試失敗',
      testData: {
        siteId: siteId,
        field: 'field_u1wpv__c',
        value: testValue
      },
      crmResponse: result,
      timestamp: new Date().toISOString()
    }, null, 2), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('❌ CRM 寫入測試失敗:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 獲取 Fxiaoke API Token
 * 現在 Fxiaoke 已開放所有 IP，可以直接調用
 */
async function getFxiaokeToken() {
  const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
  };
  
  try {
    // 獲取企業訪問令牌
    const tokenResponse = await fetch(`${CONFIG.baseUrl}/cgi/corpAccessToken/get/V2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appId: CONFIG.appId,
        appSecret: CONFIG.appSecret,
        permanentCode: CONFIG.permanentCode
      })
    });
    
    const tokenResult = await tokenResponse.json();
    
    // 檢查錯誤
    if (tokenResult.errorCode !== 0) {
      return {
        success: false,
        error: `Token獲取失敗: ${tokenResult.errorMessage}`
      };
    }
    
    const token = tokenResult.corpAccessToken;
    const corpId = tokenResult.corpId;
    
    // 獲取用戶信息
    const userResponse = await fetch(`${CONFIG.baseUrl}/cgi/user/getByMobile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        corpId: corpId,
        corpAccessToken: token,
        mobile: "17675662629"
      })
    });
    
    const userResult = await userResponse.json();
    if (userResult.errorCode !== 0) {
      return {
        success: false,
        error: `用戶獲取失敗: ${userResult.errorMessage}`
      };
    }
    
    const userId = userResult.empList[0].openUserId;
    
    return {
      success: true,
      token,
      corpId,
      userId
    };
    
  } catch (error) {
    return {
      success: false,
      error: `API 連接失敗: ${error.message}`
    };
  }
}

/**
 * 處理銷售記錄 API 請求
 */
async function handleSalesRecordsAPI(request, env, corsHeaders) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: '僅支援 GET 請求' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    const tokenResult = await getFxiaokeToken();
    if (!tokenResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: tokenResult.error,
        data: []
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const { token, corpId, userId } = tokenResult;
    const salesRecords = await querySalesRecords(token, corpId, userId, 100, 0);
    
    return new Response(JSON.stringify({
      success: true,
      data: salesRecords,
      count: salesRecords.length
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      data: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * 處理案場 API 請求
 */
async function handleSitesAPI(request, env, corsHeaders) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: '僅支援 GET 請求' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    const url = new URL(request.url);
    const opportunityId = url.searchParams.get('opportunityId');
    const search = url.searchParams.get('search');
    
    // 如果有商機 ID，從 D1 資料庫查詢關聯的案場
    if (opportunityId) {
      const sites = await querySitesByOpportunityFromD1(env, opportunityId);
      return new Response(JSON.stringify({
        success: true,
        data: sites,
        count: sites.length,
        source: 'D1'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // 如果有搜尋參數，使用搜尋功能
    if (search) {
      const sites = await searchSitesFromD1(env, search);
      return new Response(JSON.stringify({
        success: true,
        data: sites,
        count: sites.length,
        source: 'D1'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // 預設返回所有案場（從 CRM API）
    const tokenResult = await getFxiaokeToken();
    if (!tokenResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: tokenResult.error,
        data: []
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const { token, corpId, userId } = tokenResult;
    const sites = await querySites(token, corpId, userId);
    
    return new Response(JSON.stringify({
      success: true,
      data: sites,
      count: sites.length,
      source: 'CRM'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      data: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * 處理維修單 API 請求
 */
async function handleMaintenanceOrdersAPI(request, env, corsHeaders) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: '僅支援 GET 請求' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    const tokenResult = await getFxiaokeToken();
    if (!tokenResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: tokenResult.error,
        data: []
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const { token, corpId, userId } = tokenResult;
    const maintenanceOrders = await queryMaintenanceOrders(token, corpId, userId);
    
    return new Response(JSON.stringify({
      success: true,
      data: maintenanceOrders,
      count: maintenanceOrders.length
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      data: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * 查詢商機列表
 */
async function queryOpportunities(token, corpId, userId, offset = 0, limit = 50) {
  const CONFIG = {
    baseUrl: "https://open.fxiaoke.com"
  };
  
  try {
    const opportunityResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        corpId: corpId,
        corpAccessToken: token,
        currentOpenUserId: userId,
        data: {
          apiName: "NewOpportunityObj",
          search_query_info: {
            limit: limit,
            offset: offset,
            orders: [{fieldName: "create_time", isAsc: "false"}]
          }
        }
      })
    });
    
    const opportunityResult = await opportunityResponse.json();
    console.log('商機查詢原始響應:', JSON.stringify(opportunityResult, null, 2));
    
    if (opportunityResult.errorCode !== 0) {
      throw new Error(`商機查詢失敗: ${opportunityResult.errorMessage}`);
    }
    
    if (!opportunityResult.data?.dataList) {
      return [];
    }
    
    // 轉換為前端需要的格式
    const opportunities = opportunityResult.data.dataList.map(opp => ({
      id: opp._id,
      name: opp.name || '未命名商機',
      customer: opp.customer_name || opp.account_name || '未知客戶',
      amount: formatAmount(opp.amount || opp.estimated_amount || 0),
      stage: opp.stage || '未知階段',
      createTime: opp.create_time,
      updateTime: opp.update_time || opp.last_modified_time
    }));
    
    return opportunities;
    
  } catch (error) {
    console.error('查詢商機錯誤:', error);
    throw error;
  }
}

/**
 * 搜尋商機（支援關鍵字搜尋）
 */
async function searchOpportunities(token, corpId, userId, searchQuery) {
  const CONFIG = {
    baseUrl: "https://open.fxiaoke.com"
  };
  
  try {
    console.log(`🔍 向 Fxiaoke CRM 搜尋商機，關鍵字: ${searchQuery}`);
    
    // 直接使用回退邏輯（獲取所有商機並篩選），因為 Fxiaoke 搜尋 API 可能不支援
    console.log('🔄 使用回退策略：獲取所有商機並進行後端篩選');
    const allOpportunities = await queryOpportunities(token, corpId, userId);
    console.log(`📊 獲取到 ${allOpportunities.length} 個商機，開始篩選包含 "${searchQuery}" 的商機`);
    
    // 顯示前幾個商機名稱供除錯
    console.log('🔍 前10個商機名稱:');
    allOpportunities.slice(0, 10).forEach((opp, i) => {
      console.log(`  ${i + 1}. ${opp.name}`);
    });
    
    // 在後端進行關鍵字篩選
    const filteredOpportunities = allOpportunities.filter(opp => {
      const nameMatch = opp.name && opp.name.toLowerCase().includes(searchQuery.toLowerCase());
      const customerMatch = opp.customer && opp.customer.toLowerCase().includes(searchQuery.toLowerCase());
      const matched = nameMatch || customerMatch;
      
      if (matched) {
        console.log(`✅ 找到符合條件的商機: ${opp.name} (客戶: ${opp.customer})`);
      }
      
      return matched;
    });
    
    console.log(`✅ 後端篩選完成，找到 ${filteredOpportunities.length} 個符合 "${searchQuery}" 的商機`);
    return filteredOpportunities;
    
  } catch (error) {
    console.error('CRM 搜尋錯誤:', error);
    
    // 錯誤時回退到查詢所有商機並篩選
    try {
      console.log(`搜尋失敗，回退到查詢所有商機並篩選，搜尋關鍵字: ${searchQuery}`);
      const allOpportunities = await queryOpportunities(token, corpId, userId);
      console.log(`🔍 回退獲取所有商機完成，共 ${allOpportunities.length} 個，開始篩選`);
      
      // 顯示前幾個商機供除錯
      console.log('前5個商機:', allOpportunities.slice(0, 5).map(opp => opp.name));
      
      const filteredOpportunities = allOpportunities.filter(opp => {
        const nameMatch = opp.name && opp.name.toLowerCase().includes(searchQuery.toLowerCase());
        const customerMatch = opp.customer && opp.customer.toLowerCase().includes(searchQuery.toLowerCase());
        const matched = nameMatch || customerMatch;
        
        if (matched) {
          console.log(`✅ 回退篩選找到符合條件的商機: ${opp.name} (客戶: ${opp.customer})`);
        }
        
        return matched;
      });
      
      console.log(`✅ 回退篩選完成，找到 ${filteredOpportunities.length} 個符合的商機`);
      return filteredOpportunities;
      
    } catch (fallbackError) {
      console.error('回退搜尋也失敗:', fallbackError);
      throw error;
    }
  }
}


/**
 * 查詢案場列表（自定義對象）
 */
async function querySites(token, corpId, userId, limit = 100, offset = 0) {
  const CONFIG = {
    baseUrl: "https://open.fxiaoke.com"
  };
  
  try {
    const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        corpId: corpId,
        corpAccessToken: token,
        currentOpenUserId: userId,
        data: {
          dataObjectApiName: "object_8W9cb__c",
          search_query_info: {
            limit: limit,
            offset: offset,
            orders: [{fieldName: "create_time", isAsc: "false"}]
          }
        }
      })
    });
    
    const result = await response.json();
    console.log('案場查詢原始響應:', JSON.stringify(result, null, 2));
    
    if (result.errorCode !== 0) {
      throw new Error(`案場查詢失敗: ${result.errorMessage}`);
    }
    
    if (!result.data?.dataList) {
      return [];
    }
    
    // 轉換為前端需要的格式
    const sites = result.data.dataList.map(site => ({
      id: site._id,
      name: site.name || '未命名案場',
      opportunityId: site.opportunity_id,
      address: site.address || site.location,
      status: site.status || '進行中',
      createTime: site.create_time,
      updateTime: site.update_time,
      raw: site
    }));
    
    return sites;
    
  } catch (error) {
    throw new Error(`案場查詢失敗: ${error.message}`);
  }
}

/**
 * 查詢維修單列表（自定義對象）
 */
async function queryMaintenanceOrders(token, corpId, userId, limit = 100, offset = 0) {
  const CONFIG = {
    baseUrl: "https://open.fxiaoke.com"
  };
  
  try {
    const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        corpId: corpId,
        corpAccessToken: token,
        currentOpenUserId: userId,
        data: {
          dataObjectApiName: "on_site_signature__c",
          search_query_info: {
            limit: 100,
            offset: 0,
            orders: [{fieldName: "create_time", isAsc: "false"}]
          }
        }
      })
    });
    
    const result = await response.json();
    console.log('維修單查詢原始響應:', JSON.stringify(result, null, 2));
    
    if (result.errorCode !== 0) {
      throw new Error(`維修單查詢失敗: ${result.errorMessage}`);
    }
    
    if (!result.data?.dataList) {
      return [];
    }
    
    // 轉換為前端需要的格式
    const maintenanceOrders = result.data.dataList.map(order => ({
      id: order._id,
      orderNumber: order.order_number || order._id,
      opportunityId: order.opportunity_id,
      building: order.building || order.building_name,
      floor: order.floor || order.floor_number,
      unit: order.unit || order.unit_number,
      issue: order.issue || order.problem_description,
      status: order.status || '待處理',
      contractor: order.contractor || order.contractor_name,
      createTime: order.create_time,
      updateTime: order.update_time,
      raw: order
    }));
    
    return maintenanceOrders;
    
  } catch (error) {
    throw new Error(`維修單查詢失敗: ${error.message}`);
  }
}

/**
 * 格式化金額顯示
 */
function formatAmount(amount) {
  if (!amount || amount === 0) {
    return 'NT$ 0';
  }
  
  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return 'NT$ 0';
  }
  
  return `NT$ ${numAmount.toLocaleString()}`;
}

/**
 * 獲取演示商機數據
 */
function getDemoOpportunities() {
  return [
    {
      id: '650fe201d184e50001102aee',
      name: '勝興-興安西-2024',
      customer: '王先生',
      amount: 'NT$ 15,000,000',
      stage: '施工中',
      createTime: '2024-01-15T00:00:00Z',
      updateTime: '2024-07-20T00:00:00Z'
    },
    {
      id: 'demo_002',
      name: '市鎮南住宅大樓',
      customer: '李小姐',
      amount: 'NT$ 25,000,000',
      stage: '規劃中',
      createTime: '2024-02-01T00:00:00Z',
      updateTime: '2024-07-18T00:00:00Z'
    },
    {
      id: 'demo_003',
      name: '科技園區辦公大樓',
      customer: '陳總經理',
      amount: 'NT$ 80,000,000',
      stage: '設計中',
      createTime: '2024-03-10T00:00:00Z',
      updateTime: '2024-07-15T00:00:00Z'
    },
    {
      id: 'demo_004',
      name: '河岸景觀宅',
      customer: '林董事長',
      amount: 'NT$ 32,000,000',
      stage: '施工中',
      createTime: '2023-11-20T00:00:00Z',
      updateTime: '2024-07-19T00:00:00Z'
    },
    {
      id: 'demo_005',
      name: '都心豪宅',
      customer: '張建設公司',
      amount: 'NT$ 120,000,000',
      stage: '籌備中',
      createTime: '2024-04-01T00:00:00Z',
      updateTime: '2024-07-10T00:00:00Z'
    },
    {
      id: 'demo_006',
      name: '湖畔別墅',
      customer: '黃女士',
      amount: 'NT$ 18,000,000',
      stage: '施工中',
      createTime: '2024-05-20T00:00:00Z',
      updateTime: '2024-07-17T00:00:00Z'
    }
  ];
}

/**
 * 處理案場同步 API
 */
async function handleSitesSync(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '僅支援 POST 請求' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const syncResult = await syncSitesToDB(env);
    
    return new Response(JSON.stringify({
      success: true,
      message: '案場同步完成',
      syncedCount: syncResult.syncedCount,
      totalCount: syncResult.totalCount,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('案場同步失敗:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      syncedCount: 0
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * 同步案場資料到 D1 資料庫
 */
async function syncSitesToDB(env) {
  console.log('🏗️ 開始同步案場資料到 D1...');
  
  try {
    const tokenResult = await getFxiaokeToken();
    if (!tokenResult.success) {
      throw new Error(`獲取 Token 失敗: ${tokenResult.error}`);
    }
    
    const { token, corpId, userId } = tokenResult;
    
    // 分批同步案場 (每次100個)
    let syncedCount = 0;
    let totalCount = 0;
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    
    while (hasMore) {
      console.log(`🔄 同步案場資料 offset=${offset}, limit=${limit}`);
      
      // 使用現有的 querySites 函數，支援分頁
      const sitesData = await querySites(token, corpId, userId, limit, offset);
      
      if (!sitesData || sitesData.length === 0) {
        hasMore = false;
        break;
      }
      
      totalCount += sitesData.length;
      
      const insertedCount = await insertSitesToD1(env, sitesData);
      syncedCount += insertedCount;
      
      if (sitesData.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
      
      console.log(`✅ 已同步 ${syncedCount}/${totalCount} 個案場`);
    }
    
    // 更新同步狀態
    await env.DB.prepare(`
      INSERT OR REPLACE INTO sync_status 
      (sync_type, last_sync_time, last_sync_count, status, message)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      'sites',
      Date.now(),
      syncedCount,
      'completed',
      `成功同步 ${syncedCount}/${totalCount} 個案場`
    ).run();
    
    console.log(`🎉 案場同步完成: ${syncedCount}/${totalCount}`);
    
    return {
      syncedCount,
      totalCount,
      success: true
    };
    
  } catch (error) {
    console.error('❌ 案場同步失敗:', error);
    throw error;
  }
}

/**
 * 查詢真實案場資料
 */
async function queryRealSites(token, corpId, userId, limit = 100, offset = 0) {
  const CONFIG = {
    baseUrl: "https://open.fxiaoke.com"
  };
  
  console.log(`📡 API查詢案場: limit=${limit}, offset=${offset}`);
  
  try {
    const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        corpId: corpId,
        corpAccessToken: token,
        currentOpenUserId: userId,
        data: {
          dataObjectApiName: "object_8W9cb__c",
          search_query_info: {
            limit: limit,
            offset: offset,
            orders: [{ fieldName: "create_time", isAsc: "false" }]
          }
        }
      })
    });
    
    const result = await response.json();
    console.log('案場查詢響應:', JSON.stringify(result, null, 2));
    
    if (result.errorCode !== 0) {
      throw new Error(`案場查詢失敗: ${result.errorMessage}`);
    }
    
    if (!result.dataList || result.dataList.length === 0) {
      console.log('🔍 沒有找到案場資料');
      return [];
    }
    
    const sites = result.dataList.map(site => ({
      id: site._id,
      name: site.name || '未命名案場',
      building: site.field_WD7k1__c || '',
      floor: site.field_Q6Svh__c || 0,
      unit: site.field_XuJP2__c || '',
      site_type: site.field_dxr31__c || '',
      stage: site.field_z9H6O__c || '',
      construction_completed: site.construction_completed__c || 0,
      opportunity_id: site.field_1P96q__c || '',
      owner: site.owner || '',
      create_time: site.create_time || 0,
      last_modified_time: site.last_modified_time || 0,
      raw_data: JSON.stringify(site)
    }));
    
    console.log(`✅ 成功查詢到 ${sites.length} 個案場`);
    return sites;
    
  } catch (error) {
    throw new Error(`案場查詢失敗: ${error.message}`);
  }
}

/**
 * 批量插入案場到 D1 資料庫
 */
async function insertSitesToD1(env, sitesData) {
  if (!sitesData || sitesData.length === 0) {
    return 0;
  }
  
  console.log(`💾 準備插入 ${sitesData.length} 個案場到 D1`);
  
  try {
    const currentTime = Date.now();
    
    // 使用事務批量插入，適應現有格式
    const statements = sitesData.map(site => {
      // 從現有格式提取欄位
      const rawData = site.raw || {};
      return env.DB.prepare(`
        INSERT OR REPLACE INTO sites (
          id, name, opportunity_id, address, status, building_type, 
          floor_info, room_info, create_time, update_time, synced_at, raw_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        site.id || site._id,
        site.name,
        rawData.field_1P96q__c || '', // 商機關聯
        '', // address - 暫時空白
        site.status || '', // 狀態
        rawData.field_WD7k1__c || '', // 棟別 -> building_type
        `${rawData.field_Q6Svh__c || 0}F`, // 樓層 -> floor_info
        rawData.field_XuJP2__c || '', // 戶別 -> room_info
        site.createTime || rawData.create_time || 0,
        rawData.last_modified_time || 0,
        currentTime,
        JSON.stringify(rawData)
      );
    });
    
    const results = await env.DB.batch(statements);
    
    console.log(`✅ 成功插入 ${sitesData.length} 個案場到 D1`);
    return sitesData.length;
    
  } catch (error) {
    console.error('❌ D1插入失敗:', error);
    throw new Error(`D1插入失敗: ${error.message}`);
  }
}

/**
 * 處理從D1資料庫查詢案場 API
 */
async function handleSitesFromDBAPI(request, env, corsHeaders) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: '僅支援 GET 請求' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    const url = new URL(request.url);
    const opportunityId = url.searchParams.get('opportunity_id');
    
    let query = 'SELECT * FROM sites';
    let params = [];
    
    if (opportunityId) {
      query += ' WHERE opportunity_id = ?';
      params.push(opportunityId);
    }
    
    query += ' ORDER BY building_type, CAST(REPLACE(floor_info, "F", "") AS INTEGER), room_info';
    
    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(...params).all();
    
    return new Response(JSON.stringify({
      success: true,
      data: result.results || [],
      count: result.results?.length || 0
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('❌ 從D1查詢案場數據失敗:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      data: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * 處理維修單同步 API
 */
async function handleMaintenanceOrdersSync(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '僅支援 POST 請求' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const syncResult = await syncMaintenanceOrdersToDB(env);
    
    return new Response(JSON.stringify({
      success: true,
      message: '維修單同步完成',
      syncedCount: syncResult.syncedCount,
      totalCount: syncResult.totalCount,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('維修單同步失敗:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      syncedCount: 0
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * 處理銷售記錄同步 API
 */
async function handleSalesRecordsSync(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '僅支援 POST 請求' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const syncResult = await syncSalesRecordsToDB(env);
    
    return new Response(JSON.stringify({
      success: true,
      message: '銷售記錄同步完成',
      syncedCount: syncResult.syncedCount,
      totalCount: syncResult.totalCount,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('銷售記錄同步失敗:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      syncedCount: 0
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * 同步維修單到 D1 資料庫
 */
async function syncMaintenanceOrdersToDB(env) {
  console.log('🔧 開始同步維修單資料到 D1...');
  
  try {
    const tokenResult = await getFxiaokeToken();
    if (!tokenResult.success) {
      throw new Error(`獲取 Token 失敗: ${tokenResult.error}`);
    }
    
    const { token, corpId, userId } = tokenResult;
    
    let syncedCount = 0;
    let totalCount = 0;
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    
    while (hasMore) {
      console.log(`🔄 同步維修單資料 offset=${offset}, limit=${limit}`);
      
      const maintenanceData = await queryMaintenanceOrders(token, corpId, userId, limit, offset);
      
      if (!maintenanceData || maintenanceData.length === 0) {
        hasMore = false;
        break;
      }
      
      totalCount += maintenanceData.length;
      
      const insertedCount = await insertMaintenanceOrdersToD1(env, maintenanceData);
      syncedCount += insertedCount;
      
      if (maintenanceData.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
      
      console.log(`✅ 已同步 ${syncedCount}/${totalCount} 個維修單`);
    }
    
    // 更新同步狀態
    await env.DB.prepare(`
      INSERT OR REPLACE INTO sync_status 
      (sync_type, last_sync_time, last_sync_count, status, message)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      'maintenance_orders',
      Date.now(),
      syncedCount,
      'completed',
      `成功同步 ${syncedCount}/${totalCount} 個維修單`
    ).run();
    
    console.log(`🎉 維修單同步完成: ${syncedCount}/${totalCount}`);
    
    return {
      syncedCount,
      totalCount,
      success: true
    };
    
  } catch (error) {
    console.error('❌ 維修單同步失敗:', error);
    throw error;
  }
}

/**
 * 同步銷售記錄到 D1 資料庫
 */
async function syncSalesRecordsToDB(env) {
  console.log('💰 開始同步銷售記錄資料到 D1...');
  
  try {
    // 確保 sales_records 表結構正確
    await ensureSalesRecordsTableStructure(env);
    console.log('✅ sales_records 表結構檢查完成');
    
    const tokenResult = await getFxiaokeToken();
    if (!tokenResult.success) {
      throw new Error(`獲取 Token 失敗: ${tokenResult.error}`);
    }
    
    const { token, corpId, userId } = tokenResult;
    
    let syncedCount = 0;
    let totalCount = 0;
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    
    while (hasMore) {
      console.log(`🔄 同步銷售記錄資料 offset=${offset}, limit=${limit}`);
      
      const salesData = await querySalesRecords(token, corpId, userId, limit, offset);
      
      if (!salesData || salesData.length === 0) {
        hasMore = false;
        break;
      }
      
      totalCount += salesData.length;
      
      const insertedCount = await insertSalesRecordsToD1(env, salesData);
      syncedCount += insertedCount;
      
      if (salesData.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
      
      console.log(`✅ 已同步 ${syncedCount}/${totalCount} 個銷售記錄`);
    }
    
    // 更新同步狀態
    await env.DB.prepare(`
      INSERT OR REPLACE INTO sync_status 
      (sync_type, last_sync_time, last_sync_count, status, message)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      'sales_records',
      Date.now(),
      syncedCount,
      'completed',
      `成功同步 ${syncedCount}/${totalCount} 個銷售記錄`
    ).run();
    
    console.log(`🎉 銷售記錄同步完成: ${syncedCount}/${totalCount}`);
    
    return {
      syncedCount,
      totalCount,
      success: true
    };
    
  } catch (error) {
    console.error('❌ 銷售記錄同步失敗:', error);
    throw error;
  }
}

/**
 * 查詢銷售記錄
 */
async function querySalesRecords(token, corpId, userId, limit = 100, offset = 0) {
  const CONFIG = {
    baseUrl: "https://open.fxiaoke.com"
  };
  
  console.log(`📡 API查詢銷售記錄: limit=${limit}, offset=${offset}`);
  
  try {
    const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        corpId: corpId,
        corpAccessToken: token,
        currentOpenUserId: userId,
        data: {
          apiName: "ActiveRecordObj",
          search_query_info: {
            limit: limit,
            offset: offset,
            filters: [
              {
                field_name: "external_form_display__c",
                field_values: ["option_displayed__c"],
                operator: "EQ"
              }
            ],
            orders: [{ fieldName: "create_time", isAsc: "false" }]
          }
        }
      })
    });
    
    const result = await response.json();
    console.log('銷售記錄查詢響應:', JSON.stringify(result, null, 2));
    
    if (result.errorCode !== 0) {
      throw new Error(`銷售記錄查詢失敗: ${result.errorMessage}`);
    }
    
    if (!result.data?.dataList || result.data.dataList.length === 0) {
      console.log('🔍 沒有找到銷售記錄資料');
      return [];
    }
    
    const salesRecords = result.data.dataList.map(record => ({
      id: record._id,
      name: record.name || '未命名記錄',
      record_type: record.active_record_type || '',
      content: record.active_record_content || '',
      interactive_type: record.interactive_types || '',
      location: record.field_aN2iY__c || '',
      opportunity_id: record.related_opportunity_id || '', // 可能為空
      external_form_display: record.external_form_display__c || '',
      create_time: record.create_time || 0,
      update_time: record.last_modified_time || 0,
      raw_data: JSON.stringify(record)
    }));
    
    console.log(`✅ 成功查詢到 ${salesRecords.length} 個銷售記錄`);
    return salesRecords;
    
  } catch (error) {
    throw new Error(`銷售記錄查詢失敗: ${error.message}`);
  }
}

/**
 * 批量插入維修單到 D1
 */
async function insertMaintenanceOrdersToD1(env, maintenanceData) {
  if (!maintenanceData || maintenanceData.length === 0) {
    return 0;
  }
  
  console.log(`💾 準備插入 ${maintenanceData.length} 個維修單到 D1`);
  
  try {
    const currentTime = Date.now();
    
    const statements = maintenanceData.map(order => {
      const rawData = order.raw || {};
      return env.DB.prepare(`
        INSERT OR REPLACE INTO maintenance_orders (
          id, name, opportunity_id, site_id, status, issue_type, description,
          maintenance_date, technician, contractor, cost, completion_status,
          create_time, update_time, synced_at, raw_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        order.id,
        order.orderNumber || order.name || '',
        order.opportunityId || '',
        order.building || '',
        order.status || '',
        order.issue || '',
        order.issue || '',
        '',
        '',
        order.contractor || '',
        0,
        0,
        order.createTime || rawData.create_time || 0,
        rawData.update_time || 0,
        currentTime,
        JSON.stringify(rawData)
      );
    });
    
    const results = await env.DB.batch(statements);
    
    console.log(`✅ 成功插入 ${maintenanceData.length} 個維修單到 D1`);
    return maintenanceData.length;
    
  } catch (error) {
    console.error('❌ 維修單D1插入失敗:', error);
    throw new Error(`維修單D1插入失敗: ${error.message}`);
  }
}

/**
 * 批量插入銷售記錄到 D1
 */
async function insertSalesRecordsToD1(env, salesData) {
  if (!salesData || salesData.length === 0) {
    return 0;
  }
  
  console.log(`💾 準備插入 ${salesData.length} 個銷售記錄到 D1`);
  
  try {
    const currentTime = Date.now();
    
    const statements = salesData.map(record => {
      return env.DB.prepare(`
        INSERT OR REPLACE INTO sales_records (
          id, name, opportunity_id, record_type, content, interactive_type,
          location, external_form_display, create_time, update_time, synced_at, raw_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        record.id,
        record.name,
        record.opportunity_id || null, // 注意：可能為空
        record.record_type,
        record.content,
        record.interactive_type,
        record.location,
        record.external_form_display,
        record.create_time,
        record.update_time,
        currentTime,
        record.raw_data
      );
    });
    
    const results = await env.DB.batch(statements);
    
    console.log(`✅ 成功插入 ${salesData.length} 個銷售記錄到 D1`);
    return salesData.length;
    
  } catch (error) {
    console.error('❌ 銷售記錄D1插入失敗:', error);
    throw new Error(`銷售記錄D1插入失敗: ${error.message}`);
  }
}

/**
 * 處理施工進度 API
 */
async function handleProgressAPI(request, env, pathParts) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const endpoint = pathParts[0];
  
  try {
    switch (endpoint) {
      case 'save':
        if (request.method === 'POST') {
          return await saveConstructionProgress(request, env, corsHeaders);
        }
        break;
      
      case 'load':
        if (request.method === 'GET') {
          return await loadConstructionProgress(request, env, corsHeaders, pathParts.slice(1));
        }
        break;
        
      case 'sync-to-crm':
        if (request.method === 'POST') {
          return await syncProgressToCRM(request, env, corsHeaders);
        }
        break;
    }
    
    return new Response(JSON.stringify({ error: '不支援的端點或方法' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('進度 API 錯誤:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '處理請求時發生錯誤',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * 保存施工進度數據到 D1 資料庫
 */
async function saveConstructionProgress(request, env, corsHeaders) {
  try {
    const progressData = await request.json();
    
    // 驗證必填欄位 - 增加 siteId
    const requiredFields = ['projectId', 'building', 'floor', 'unit'];
    for (const field of requiredFields) {
      if (!progressData[field]) {
        return new Response(JSON.stringify({
          success: false,
          error: `缺少必填欄位: ${field}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
    
    // siteId 是可選的，但如果提供了會優先使用
    const siteId = progressData.siteId || null;

    // 生成進度記錄 ID
    const progressId = `progress_${progressData.projectId}_${progressData.building}_${progressData.floor}_${progressData.unit}_${Date.now()}`;
    
    // 確定施工項目（目前使用固定值，可以後續擴展）
    const constructionItem = `${progressData.unit}-地磚舖設`; // 每個戶別獨立的施工項目
    
    // 檢查是否已有記錄
    const existingRecord = await env.DB.prepare(`
      SELECT id FROM site_progress 
      WHERE project_id = ? AND building_name = ? AND floor_number = ? AND construction_item = ?
    `).bind(
      progressData.projectId,
      progressData.building,
      typeof progressData.floor === 'string' ? parseInt(progressData.floor.replace('F', '')) : parseInt(progressData.floor),
      constructionItem
    ).first();

    const currentTime = new Date().toISOString();
    
    if (existingRecord) {
      // 更新現有記錄
      await env.DB.prepare(`
        UPDATE site_progress SET
          progress_percentage = ?,
          status = ?,
          contractor_name = ?,
          start_date = ?,
          end_date = ?,
          actual_start_date = ?,
          actual_end_date = ?,
          notes = ?,
          updated_at = ?
        WHERE id = ?
      `).bind(
        progressData.construction_completed ? 100 : 0,
        progressData.construction_completed ? 'completed' : 'in_progress',
        progressData.contractor || null,
        progressData.date || null,
        progressData.construction_completed ? progressData.date : null,
        progressData.date || null,
        progressData.construction_completed ? progressData.date : null,
        JSON.stringify({
          area: progressData.area,
          unit: progressData.unit, // 保存戶別信息
          preConstructionNote: progressData.preConstructionNote,
          prePhotos: progressData.prePhotos || [],
          completionPhotos: progressData.completionPhotos || [],
          constructionNote: progressData.constructionNote || ''
        }),
        currentTime,
        existingRecord.id
      ).run();
      
      console.log(`✅ 更新施工進度: ${progressId}`);
    } else {
      // 插入新記錄 - 增加 site_id 欄位
      await env.DB.prepare(`
        INSERT INTO site_progress (
          id, crm_opportunity_id, project_id, site_id, building_name, floor_number, construction_item,
          progress_percentage, status, contractor_name, start_date, end_date, 
          actual_start_date, actual_end_date, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        progressId,
        progressData.crmOpportunityId || 'xinganxi_2024', // 預設值，可從專案獲取
        progressData.projectId,
        siteId, // 新增的案場 ID
        progressData.building,
        typeof progressData.floor === 'string' ? parseInt(progressData.floor.replace('F', '')) : parseInt(progressData.floor),
        constructionItem,
        progressData.construction_completed ? 100 : 0,
        progressData.construction_completed ? 'completed' : 'in_progress',
        progressData.contractor || null,
        progressData.date || null,
        progressData.construction_completed ? progressData.date : null,
        progressData.date || null,
        progressData.construction_completed ? progressData.date : null,
        JSON.stringify({
          area: progressData.area,
          unit: progressData.unit, // 保存戶別信息
          siteId: siteId, // 在 notes 中也保存一份 siteId
          preConstructionNote: progressData.preConstructionNote,
          prePhotos: progressData.prePhotos || [],
          completionPhotos: progressData.completionPhotos || [],
          constructionNote: progressData.constructionNote || ''
        }),
        currentTime,
        currentTime
      ).run();
      
      console.log(`✅ 新增施工進度: ${progressId}`);
    }

    // D1 有變動就自動同步到 FXIAOKE（不管完成狀態如何）
    try {
      console.log('🔄 觸發 D1 → FXIAOKE 即時同步...');
      await syncSingleProgressToCRM(env, progressData);
      console.log('✅ D1 → FXIAOKE 同步成功');
    } catch (syncError) {
      console.error('❌ CRM 同步失敗，但 D1 儲存成功:', syncError);
      // 不阻止主要流程，只記錄錯誤
    }

    return new Response(JSON.stringify({
      success: true,
      message: '施工進度已儲存',
      progressId: existingRecord ? existingRecord.id : progressId
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('儲存施工進度失敗:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '儲存施工進度失敗',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * 載入施工進度數據
 */
async function loadConstructionProgress(request, env, corsHeaders, pathParts) {
  try {
    const projectId = pathParts[0];
    
    if (!projectId) {
      return new Response(JSON.stringify({
        success: false,
        error: '需要提供專案 ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 從 D1 載入該專案的所有施工進度
    const progressRecords = await env.DB.prepare(`
      SELECT 
        id,
        building_name,
        floor_number,
        construction_item,
        progress_percentage,
        status,
        contractor_name,
        start_date,
        end_date,
        actual_start_date,
        actual_end_date,
        notes,
        updated_at
      FROM site_progress 
      WHERE project_id = ?
      ORDER BY building_name, floor_number, construction_item
    `).bind(projectId).all();

    // 轉換為前端需要的格式 - 按建築/樓層/戶別分組
    const formattedProgress = {};
    
    for (const record of progressRecords.results || []) {
      const building = record.building_name;
      const floor = record.floor_number + 'F';
      // 從 notes 中解析戶別信息，如果沒有則使用預設格式
      let unit = '';
      try {
        const notes = record.notes ? JSON.parse(record.notes) : {};
        unit = notes.unit || `${building}1`; // 預設戶別格式
      } catch (e) {
        unit = `${building}1`; // 解析失敗時使用預設格式
      }
      
      // 確保有正確的建築分組結構
      if (!formattedProgress[building]) {
        formattedProgress[building] = {};
      }
      if (!formattedProgress[building][floor]) {
        formattedProgress[building][floor] = {};
      }
      
      try {
        const notes = record.notes ? JSON.parse(record.notes) : {};
        formattedProgress[building][floor][unit] = {
          area: notes.area || 0,
          date: record.actual_start_date || record.start_date,
          contractor: record.contractor_name || '',
          note: notes.constructionNote || '',
          preConstructionNote: notes.preConstructionNote || '',
          prePhotos: notes.prePhotos || [],
          completionPhotos: notes.completionPhotos || [],
          construction_completed: record.status === 'completed',
          progress_percentage: record.progress_percentage || 0
        };
      } catch (parseError) {
        console.error('解析施工記錄失敗:', parseError);
        // 使用預設值
        formattedProgress[building][floor][unit] = {
          area: 0,
          date: record.actual_start_date || record.start_date,
          contractor: record.contractor_name || '',
          note: '',
          preConstructionNote: '',
          prePhotos: [],
          completionPhotos: [],
          construction_completed: record.status === 'completed',
          progress_percentage: record.progress_percentage || 0
        };
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: formattedProgress
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('載入施工進度失敗:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '載入施工進度失敗',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * 將單個施工進度同步到 CRM
 */
async function syncSingleProgressToCRM(env, progressData) {
  try {
    console.log('🔄 開始同步施工進度到 FXIAOKE CRM...');
    
    // 獲取 FXIAOKE Token
    const tokenResult = await getFxiaokeToken();
    if (!tokenResult.success) {
      throw new Error(`獲取 FXIAOKE Token 失敗: ${tokenResult.error}`);
    }

    const { token, corpId, userId } = tokenResult;
    console.log('✅ FXIAOKE Token 獲取成功');

    // 準備同步到案場對象 (object_8W9cb__c) 的數據 - 使用正確的欄位映射
    const crmData = {
      // 根據 SITE_FIELD_MAPPING.md 的完整欄位對應
      construction_completed__c: progressData.construction_completed, // 施工完成狀態 (布爾值)
      field_B2gh1__c: parseFloat(progressData.area) || null, // 舖設坪數 (數字)
      field_23pFq__c: progressData.date, // 施工日期 (日期)
      field_u1wpv__c: progressData.contractor || '', // 工班師父 (單行文本)
      field_sF6fn__c: progressData.preConstructionNote || '', // 施工前備註 (單行文本)
      field_WD7k1__c: progressData.building, // 棟別 (單行文本)
      field_Q6Svh__c: parseInt(progressData.floor.replace('F', '')) || null, // 樓層 (數字)
      field_XuJP2__c: progressData.unit, // 戶別 (單行文本)
      // 照片欄位 (Base64 格式) - 需要特別處理
      field_V3d91__c: progressData.prePhotos ? JSON.stringify(progressData.prePhotos) : null, // 施工前照片
      field_3Fqof__c: progressData.completionPhotos ? JSON.stringify(progressData.completionPhotos) : null, // 完工照片
      last_modified_time: Date.now()
    };

    console.log('📤 準備同步數據到 CRM:', crmData);

    const CONFIG = { baseUrl: "https://open.fxiaoke.com" };
    
    // 處理照片上傳（如果有照片的話）
    let photoFields = {};
    if (progressData.prePhotos || progressData.completionPhotos) {
      console.log('📷 開始處理照片上傳...');
      
      const crmConfig = {
        baseUrl: CONFIG.baseUrl,
        token: token,
        corpId: corpId
      };
      
      // 導入照片處理函數
      const { processProgressPhotos } = await import('./photo-sync.js');
      
      try {
        photoFields = await processProgressPhotos(crmConfig, progressData);
        console.log('✅ 照片處理完成:', photoFields);
      } catch (photoError) {
        console.error('❌ 照片處理失敗，將跳過照片欄位:', photoError);
        // 照片處理失敗不應阻止其他欄位同步
      }
    }
    
    // 直接更新案場對象 (object_8W9cb__c) 的施工進度欄位 - 使用正確的欄位映射
    const recordData = {
      // 必填欄位 (從 CSV 中確認的必填欄位)
      name: `${progressData.building}${progressData.floor}${progressData.unit}`, // 編號 (自增编号) - 必填
      owner: userId, // 负责人 (人员) - 必填，使用當前用戶ID
      tenant_id: corpId, // tenant_id (单行文本) - 必填，使用企業ID
      object_describe_api_name: "object_8W9cb__c", // object_describe_api_name - 必填
      
      // 施工進度相關欄位 - 基於 SITE_FIELD_MAPPING.md 的正確映射
      construction_completed__c: progressData.construction_completed, // 施工完成 (布爾值)
      field_B2gh1__c: parseFloat(progressData.area) || null, // 舖設坪數 (數字)
      field_23pFq__c: progressData.date ? new Date(progressData.date).getTime() : null, // 施工日期 (時間戳)
      field_u1wpv__c: progressData.contractor || '', // 工班師父 (單行文本)
      field_sF6fn__c: progressData.preConstructionNote || '', // 施工前備註 (單行文本)
      field_WD7k1__c: progressData.building, // 棟別 (單行文本)
      field_Q6Svh__c: parseInt(progressData.floor.replace('F', '')) || null, // 樓層 (數字)
      field_XuJP2__c: progressData.unit, // 戶別 (單行文本)
      
      // 照片欄位（如果有上傳成功的話）
      field_V3d91__c: photoFields.field_V3d91__c || null, // 施工前照片
      field_3Fqof__c: photoFields.field_3Fqof__c || null, // 完工照片
      
      // 系統欄位
      last_modified_time: Date.now(),
      create_time: Date.now()
    };

    console.log('📤 更新案場對象數據:', recordData);

    // 檢查是否有預設的 site_id（從 progressData 或 notes 中獲取）
    let siteId = progressData.siteId || 
                 (progressData.notes && JSON.parse(progressData.notes).siteId) || null;
    
    if (siteId) {
      console.log(`✅ 使用預設的案場 ID: ${siteId}`);
    } else {
      console.log('⚠️ 沒有提供案場 ID，嘗試根據建築信息查找...');
      
      // 根據建築、樓層、戶別查找現有的案場記錄（回退方案）
      const searchResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          corpId: corpId,
          corpAccessToken: token,
          currentOpenUserId: userId,
          data: {
            dataObjectApiName: "object_8W9cb__c",
            search_query_info: {
              limit: 10,
              offset: 0,
              filters: [
                {
                  fieldName: "field_WD7k1__c", // 棟別
                  fieldValues: [progressData.building],
                  operator: "EQ"
                },
                {
                  fieldName: "field_Q6Svh__c", // 樓層
                  fieldValues: [parseInt(progressData.floor.replace('F', ''))],
                  operator: "EQ"
                },
                {
                  fieldName: "field_XuJP2__c", // 戶別
                  fieldValues: [progressData.unit],
                  operator: "EQ"
                }
              ]
            }
          }
        })
      });

      const searchResult = await searchResponse.json();
      console.log('🔍 查找案場記錄結果:', searchResult);

      if (searchResult.errorCode === 0 && searchResult.data && searchResult.data.length > 0) {
        siteId = searchResult.data[0]._id;
        console.log(`✅ 找到對應案場記錄 ID: ${siteId}`);
      } else {
        console.log('⚠️ 未找到對應的案場記錄');
        throw new Error('未找到對應的案場記錄，無法更新施工進度。請確保在前端選擇了正確的案場。');
      }
    }

    // 準備更新數據（只包含要更新的欄位）
    const updateData = {
      _id: siteId, // 必須提供記錄 ID
      dataObjectApiName: "object_8W9cb__c",
      construction_completed__c: progressData.construction_completed, // 施工完成
      field_B2gh1__c: progressData.area, // 舖設坪數
      field_23pFq__c: progressData.date, // 施工日期
      field_u1wpv__c: progressData.contractor, // 工班師父
      field_sF6fn__c: progressData.preConstructionNote || '', // 施工前備註
    };

    console.log('📤 更新案場記錄數據:', updateData);

    // 調用 FXIAOKE 案場對象 update API
    const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        corpId: corpId,
        corpAccessToken: token,
        currentOpenUserId: userId,
        triggerWorkFlow: false, // 不觸發工作流
        data: {
          skipDataStatusValidate: false,
          igonreMediaIdConvert: true, // 重要：處理圖片路徑
          object_data: updateData
        }
      })
    });

    const result = await response.json();
    console.log('📡 CRM API 響應:', result);

    if (result.errorCode !== 0) {
      throw new Error(`CRM 同步失敗: ${result.errorMessage}`);
    }

    console.log('✅ 施工進度已成功同步到 FXIAOKE CRM');
    return { 
      success: true, 
      message: 'CRM 同步成功',
      crmResponse: result
    };
    
  } catch (error) {
    console.error('❌ CRM 同步失敗:', error);
    throw error;
  }
}

/**
 * 批量同步進度到 CRM
 */
async function syncProgressToCRM(request, env, corsHeaders) {
  try {
    const { projectId } = await request.json();
    
    if (!projectId) {
      return new Response(JSON.stringify({
        success: false,
        error: '需要提供專案 ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 獲取所有已完成但尚未同步的進度記錄
    const pendingRecords = await env.DB.prepare(`
      SELECT * FROM site_progress 
      WHERE project_id = ? AND status = 'completed' AND (crm_last_sync IS NULL OR crm_last_sync < updated_at)
    `).bind(projectId).all();

    let syncedCount = 0;
    const errors = [];

    for (const record of pendingRecords.results || []) {
      try {
        // 轉換為同步格式 - 檢查 record 結構並安全提取數據
        let progressData;
        try {
          // 檢查是否為舊的 site_progress 表格式
          if (record.building_name && record.floor_number) {
            const notes = record.notes ? JSON.parse(record.notes) : {};
            progressData = {
              area: notes.area || 0,
              date: record.actual_start_date || record.start_date || new Date().toISOString().split('T')[0],
              contractor: record.contractor_name || '',
              preConstructionNote: notes.constructionNote || '',
              construction_completed: record.status === 'completed',
              building: record.building_name,
              floor: record.floor_number + 'F',
              unit: record.building_name + '1'
            };
          } else {
            // 新的格式 - 直接從 notes 欄位解析
            const allData = record.notes ? JSON.parse(record.notes) : {};
            // 從 record ID 解析建築資訊
            const idParts = record.id.split('_');
            const building = idParts[2] || 'A';
            const floor = idParts[3] || '1F';
            const unit = idParts[4] || 'A1';
            
            progressData = {
              area: allData.area || 0,
              date: allData.date || new Date().toISOString().split('T')[0],
              contractor: allData.contractor || '',
              preConstructionNote: allData.preConstructionNote || allData.note || '',
              construction_completed: allData.construction_completed || false,
              building: building,
              floor: floor,
              unit: unit
            };
          }
        } catch (parseError) {
          console.error(`解析記錄 ${record.id} 失敗:`, parseError);
          continue; // 跳過這筆記錄
        }

        await syncSingleProgressToCRM(env, progressData);
        
        // 更新同步時間
        await env.DB.prepare(`
          UPDATE site_progress SET crm_last_sync = ? WHERE id = ?
        `).bind(new Date().toISOString(), record.id).run();
        
        syncedCount++;
        
      } catch (syncError) {
        console.error(`同步記錄 ${record.id} 失敗:`, syncError);
        errors.push({
          recordId: record.id,
          error: syncError.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `成功同步 ${syncedCount} 筆記錄`,
      syncedCount,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('批量 CRM 同步失敗:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '批量 CRM 同步失敗',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * 從 D1 資料庫根據商機 ID 查詢關聯的案場
 */
async function querySitesByOpportunityFromD1(env, opportunityId) {
  try {
    console.log(`🔍 從 D1 查詢商機 ${opportunityId} 的關聯案場`);
    
    const result = await env.DB.prepare(`
      SELECT * FROM sites 
      WHERE opportunity_id = ? OR JSON_EXTRACT(raw_data, '$.field_1P96q__c') = ?
      ORDER BY create_time DESC
    `).bind(opportunityId, opportunityId).all();
    
    console.log(`✅ 找到 ${result.results?.length || 0} 個關聯案場`);
    
    const sites = (result.results || []).map(row => {
      let rawData = {};
      try {
        rawData = row.raw_data ? JSON.parse(row.raw_data) : {};
      } catch (e) {
        console.error('解析 raw_data 失敗:', e);
      }
      
      return {
        id: row.id,
        name: row.name,
        status: row.status || '進行中',
        createTime: row.create_time,
        building: rawData.field_WD7k1__c || '',
        floor: rawData.field_Q6Svh__c || '',
        unit: rawData.field_XuJP2__c || '',
        area: rawData.field_tXAko__c || '',
        raw: rawData
      };
    });
    
    return sites;
  } catch (error) {
    console.error('❌ 查詢案場失敗:', error);
    return [];
  }
}

/**
 * 從 D1 資料庫搜尋案場
 */
async function searchSitesFromD1(env, searchQuery) {
  try {
    console.log(`🔍 從 D1 搜尋案場: ${searchQuery}`);
    
    const result = await env.DB.prepare(`
      SELECT * FROM sites 
      WHERE name LIKE ? 
         OR JSON_EXTRACT(raw_data, '$.field_WD7k1__c') LIKE ?
         OR JSON_EXTRACT(raw_data, '$.field_XuJP2__c') LIKE ?
      ORDER BY create_time DESC
      LIMIT 100
    `).bind(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`).all();
    
    console.log(`✅ 搜尋到 ${result.results?.length || 0} 個匹配案場`);
    
    const sites = (result.results || []).map(row => {
      let rawData = {};
      try {
        rawData = row.raw_data ? JSON.parse(row.raw_data) : {};
      } catch (e) {
        console.error('解析 raw_data 失敗:', e);
      }
      
      return {
        id: row.id,
        name: row.name,
        status: row.status || '進行中',
        createTime: row.create_time,
        building: rawData.field_WD7k1__c || '',
        floor: rawData.field_Q6Svh__c || '',
        unit: rawData.field_XuJP2__c || '',
        area: rawData.field_tXAko__c || '',
        raw: rawData
      };
    });
    
    return sites;
  } catch (error) {
    console.error('❌ 搜尋案場失敗:', error);
    return [];
  }
}

/**
 * 處理資料庫 API 請求
 */
async function handleDatabaseAPI(request, env, pathParts) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  const endpoint = pathParts[0];
  console.log('🗄️ 資料庫 API 請求:', { endpoint, pathParts });

  try {
    switch (endpoint) {
      case 'stats':
        return await handleDatabaseStats(env, corsHeaders);
      case 'opportunities':
        return await handleDatabaseTable(env, 'NewOpportunityObj', corsHeaders, request);
      case 'sites':
        return await handleDatabaseTable(env, 'object_8W9cb__c', corsHeaders, request);
      case 'maintenance':
        return await handleDatabaseTable(env, 'on_site_signature__c', corsHeaders, request);
      case 'sales':
        return await handleDatabaseTable(env, 'ActiveRecordObj', corsHeaders, request);
      case 'logs':
        return await handleDatabaseLogs(env, corsHeaders);
      default:
        return new Response(JSON.stringify({ 
          success: false, 
          error: '資料庫 API 端點不存在' 
        }), {
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        });
    }
  } catch (error) {
    console.error('❌ 資料庫 API 錯誤:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });
  }
}

/**
 * 取得資料庫統計資訊
 */
async function handleDatabaseStats(env, corsHeaders) {
  try {
    const stats = {};
    
    // 商機數量 (只統計有案場的商機)
    const opportunitiesResult = await env.DB.prepare(
      'SELECT COUNT(DISTINCT o.id) as count FROM NewOpportunityObj o INNER JOIN object_8W9cb__c s ON o.id = s.opportunity_id'
    ).first();
    stats.opportunities = opportunitiesResult?.count || 0;
    
    // 案場數量 (去重)
    const sitesResult = await env.DB.prepare(
      'SELECT COUNT(DISTINCT id) as count FROM object_8W9cb__c'
    ).first();
    stats.sites = sitesResult?.count || 0;
    
    // 維修單數量
    const maintenanceResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM on_site_signature__c'
    ).first();
    stats.maintenance_orders = maintenanceResult?.count || 0;
    
    // 銷售記錄數量
    const salesResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM ActiveRecordObj'
    ).first();
    stats.sales_records = salesResult?.count || 0;
    
    // 同步記錄數量 (檢查表是否存在)
    let syncLogsCount = 0;
    try {
      const logsResult = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM sync_logs'
      ).first();
      syncLogsCount = logsResult?.count || 0;
    } catch (e) {
      // 表不存在時忽略錯誤
      console.log('sync_logs表不存在');
    }
    stats.search_logs = syncLogsCount;
    
    return new Response(JSON.stringify({ 
      success: true, 
      stats 
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });
  } catch (error) {
    console.error('❌ 取得統計資訊失敗:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });
  }
}

/**
 * 取得資料庫表格資料
 */
async function handleDatabaseTable(env, tableName, corsHeaders, request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const search = url.searchParams.get('search') || '';
    const offset = (page - 1) * limit;
    
    // 不同表格可能有不同的時間欄位名稱
    let orderBy = 'rowid DESC';
    let selectFields = '*';
    let whereClause = '';
    
    if (tableName === 'NewOpportunityObj') {
      orderBy = 'o.create_time DESC';
      selectFields = 'DISTINCT o.id, o.name, o.customer, o.amount, o.stage, o.create_time, o.update_time, o.synced_at, o.raw_data';
      // 只查詢有案場的商機
      whereClause = 'INNER JOIN object_8W9cb__c s ON o.id = s.opportunity_id';
      if (search) {
        whereClause += ` WHERE o.name LIKE '%${search}%' OR o.customer LIKE '%${search}%'`;
      }
    } else if (tableName === 'object_8W9cb__c') {
      orderBy = 'create_time DESC';
      selectFields = 'DISTINCT id, name, opportunity_id, address, status, building_type, floor_info, room_info, create_time, update_time, synced_at, raw_data';
      if (search) {
        whereClause = `WHERE name LIKE '%${search}%' OR address LIKE '%${search}%'`;
      }
    } else if (tableName === 'on_site_signature__c') {
      orderBy = 'create_time DESC';
      selectFields = 'id, name, status, create_time, update_time, synced_at, raw_data';
      if (search) {
        whereClause = `WHERE name LIKE '%${search}%'`;
      }
    } else if (tableName === 'ActiveRecordObj') {
      orderBy = 'create_time DESC';
      selectFields = 'id, name, create_time, update_time, synced_at, raw_data';
      if (search) {
        whereClause = `WHERE name LIKE '%${search}%'`;
      }
    } else if (tableName === 'search_logs') {
      orderBy = 'search_time DESC';
      if (search) {
        whereClause = `WHERE search_term LIKE '%${search}%'`;
      }
    } else {
      if (search) {
        whereClause = `WHERE name LIKE '%${search}%'`;
      }
    }
    
    let query;
    if (tableName === 'NewOpportunityObj') {
      query = `SELECT ${selectFields} FROM ${tableName} o ${whereClause} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`;
    } else {
      query = `SELECT ${selectFields} FROM ${tableName} ${whereClause} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`;
    }
    
    const result = await env.DB.prepare(query).all();
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: result.results || [],
      count: result.results?.length || 0
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });
  } catch (error) {
    console.error(`❌ 取得 ${tableName} 表格資料失敗:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });
  }
}

/**
 * 取得同步記錄
 */
async function handleDatabaseLogs(env, corsHeaders) {
  try {
    // 查詢sync_logs表
    let result;
    try {
      result = await env.DB.prepare(
        'SELECT * FROM sync_logs ORDER BY start_time DESC LIMIT 200'
      ).all();
    } catch (e) {
      // 表不存在時返回空結果
      console.log('sync_logs表不存在，可能是第一次使用');
      result = { results: [] };
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: result.results || [],
      count: result.results?.length || 0
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });
  } catch (error) {
    console.error('❌ 取得同步記錄失敗:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });
  }
}

/**
 * 同步LOG記錄工具函數
 */

/**
 * 記錄同步操作開始
 */
async function logSyncStart(env, syncType, operation, userAgent = '', ipAddress = '') {
  try {
    const result = await env.DB.prepare(`
      INSERT INTO sync_logs 
      (sync_type, operation, status, start_time, user_agent, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      syncType,
      operation,
      'started',
      Date.now(),
      userAgent,
      ipAddress
    ).run();
    
    return result.meta.last_row_id;
  } catch (error) {
    console.error('記錄同步開始失敗:', error);
    return null;
  }
}

/**
 * 記錄同步操作完成
 */
async function logSyncComplete(env, logId, status, recordsProcessed = 0, recordsSuccess = 0, recordsError = 0, errorMessage = '', details = '') {
  if (!logId) return;
  
  try {
    const now = Date.now();
    
    // 獲取開始時間以計算持續時間
    const startLog = await env.DB.prepare(
      'SELECT start_time FROM sync_logs WHERE id = ?'
    ).bind(logId).first();
    
    const duration = startLog ? now - startLog.start_time : 0;
    
    await env.DB.prepare(`
      UPDATE sync_logs SET 
        status = ?, 
        end_time = ?, 
        duration = ?,
        records_processed = ?,
        records_success = ?,
        records_error = ?,
        error_message = ?,
        details = ?
      WHERE id = ?
    `).bind(
      status,
      now,
      duration,
      recordsProcessed,
      recordsSuccess,
      recordsError,
      errorMessage,
      details,
      logId
    ).run();
    
    console.log(`📝 同步LOG已記錄: ${status}, 持續時間: ${duration}ms`);
  } catch (error) {
    console.error('記錄同步完成失敗:', error);
  }
}

/**
 * 處理數據遷移 API 請求
 */
async function handleMigrationAPI(request, env, pathParts) {
  // 由於我們不能使用 ES6 import，這裡需要內聯遷移 API 的邏輯
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // 處理 OPTIONS 預檢請求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const db = env.DB;
  const url = new URL(request.url);
  const method = request.method;

  try {
    // 解析路由
    const segments = pathParts.filter(s => s);
    const action = segments[1]; // /api/migration/{action}
    const objectType = segments[2]; // /api/migration/{action}/{objectType}

    console.log(`遷移 API 請求: ${method} ${url.pathname}`);

    switch (method) {
      case 'GET':
        return await handleMigrationGet(action, objectType, url, db, corsHeaders);
      case 'POST':
        return await handleMigrationPost(action, objectType, request, db, corsHeaders);
      default:
        return new Response(JSON.stringify({
          error: '不支援的 HTTP 方法',
          method
        }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('遷移 API 錯誤:', error);
    return new Response(JSON.stringify({
      error: '遷移 API 處理失敗',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 處理遷移 GET 請求
 */
async function handleMigrationGet(action, objectType, url, db, corsHeaders) {
  switch (action) {
    case 'status':
      if (objectType) {
        // 獲取特定對象的遷移狀態
        try {
          const tableMapping = {
            opportunities: { old: 'NewOpportunityObj', new: 'opportunities' },
            sites: { old: 'object_8W9cb__c', new: 'sites' },
            sales_records: { old: 'ActiveRecordObj', new: 'sales_records' },
            maintenance_orders: { old: 'field_V3d91__c', new: 'maintenance_orders' }
          };

          const mapping = tableMapping[objectType];
          if (!mapping) {
            return new Response(JSON.stringify({
              error: '未知對象類型',
              objectType
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // 獲取原始和遷移後的記錄數
          const [originalCount, migratedCount] = await Promise.all([
            db.prepare(`SELECT COUNT(*) as count FROM ${mapping.old}`).first(),
            db.prepare(`SELECT COUNT(*) as count FROM ${mapping.new}`).first().catch(() => ({ count: 0 }))
          ]);

          return new Response(JSON.stringify({
            objectType,
            status: {
              originalCount: originalCount.count,
              migratedCount: migratedCount.count,
              migrationComplete: originalCount.count === migratedCount.count,
              migrationProgress: originalCount.count > 0 ? 
                Math.round((migratedCount.count / originalCount.count) * 100) : 0
            },
            timestamp: Date.now()
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (error) {
          return new Response(JSON.stringify({
            error: '獲取遷移狀態失敗',
            objectType,
            message: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } else {
        // 獲取所有對象的遷移狀態
        try {
          const tableMapping = {
            opportunities: { old: 'NewOpportunityObj', new: 'opportunities' },
            sites: { old: 'object_8W9cb__c', new: 'sites' },
            sales_records: { old: 'ActiveRecordObj', new: 'sales_records' },
            maintenance_orders: { old: 'field_V3d91__c', new: 'maintenance_orders' }
          };

          const allStatus = {};
          
          for (const [objType, mapping] of Object.entries(tableMapping)) {
            try {
              const [originalCount, migratedCount] = await Promise.all([
                db.prepare(`SELECT COUNT(*) as count FROM ${mapping.old}`).first(),
                db.prepare(`SELECT COUNT(*) as count FROM ${mapping.new}`).first().catch(() => ({ count: 0 }))
              ]);

              allStatus[objType] = {
                originalCount: originalCount.count,
                migratedCount: migratedCount.count,
                migrationComplete: originalCount.count === migratedCount.count,
                migrationProgress: originalCount.count > 0 ? 
                  Math.round((migratedCount.count / originalCount.count) * 100) : 0
              };
            } catch (error) {
              allStatus[objType] = {
                error: error.message
              };
            }
          }

          return new Response(JSON.stringify({
            migration: allStatus,
            timestamp: Date.now()
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (error) {
          return new Response(JSON.stringify({
            error: '獲取整體遷移狀態失敗',
            message: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

    case 'history':
      // 獲取遷移歷史
      try {
        const history = await db.prepare(`
          SELECT * FROM migration_history 
          ORDER BY created_at DESC 
          LIMIT 50
        `).all();

        return new Response(JSON.stringify({
          history,
          count: history.length,
          timestamp: Date.now()
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: '獲取遷移歷史失敗',
          message: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

    case 'validation':
      if (!objectType) {
        return new Response(JSON.stringify({
          error: '需要指定對象類型進行驗證'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        // 簡化的驗證邏輯
        const tableMapping = {
          opportunities: { old: 'NewOpportunityObj', new: 'opportunities' },
          sites: { old: 'object_8W9cb__c', new: 'sites' },
          sales_records: { old: 'ActiveRecordObj', new: 'sales_records' },
          maintenance_orders: { old: 'field_V3d91__c', new: 'maintenance_orders' }
        };

        const mapping = tableMapping[objectType];
        if (!mapping) {
          return new Response(JSON.stringify({
            error: '未知對象類型',
            objectType
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // 檢查數據完整性
        const [originalCount, migratedCount] = await Promise.all([
          db.prepare(`SELECT COUNT(*) as count FROM ${mapping.old}`).first(),
          db.prepare(`SELECT COUNT(*) as count FROM ${mapping.new}`).first().catch(() => ({ count: 0 }))
        ]);

        // 抽樣檢查前10條記錄的ID對應
        const sampleCheck = await db.prepare(`
          SELECT 
            COUNT(CASE WHEN o.DataId IS NOT NULL AND n.id IS NOT NULL THEN 1 END) as matched,
            COUNT(*) as total
          FROM (
            SELECT DataId FROM ${mapping.old} LIMIT 10
          ) o
          LEFT JOIN ${mapping.new} n ON o.DataId = n.id
        `).first().catch(() => ({ matched: 0, total: 0 }));

        const validation = {
          objectType,
          originalCount: originalCount.count,
          migratedCount: migratedCount.count,
          countMatches: originalCount.count === migratedCount.count,
          sampleValidation: {
            totalSamples: sampleCheck.total,
            matchedSamples: sampleCheck.matched,
            matchRate: sampleCheck.total > 0 ? 
              Math.round((sampleCheck.matched / sampleCheck.total) * 100) : 0
          },
          overallStatus: originalCount.count === migratedCount.count ? 'success' : 'incomplete',
          timestamp: Date.now()
        };

        return new Response(JSON.stringify({
          objectType,
          validation,
          timestamp: Date.now()
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: '驗證失敗',
          objectType,
          message: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

    default:
      return new Response(JSON.stringify({
        error: '未知的 GET 操作',
        action,
        availableActions: ['status', 'history', 'validation']
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
  }
}

/**
 * 處理遷移 POST 請求
 */
async function handleMigrationPost(action, objectType, request, db, corsHeaders) {
  let requestData = {};
  
  try {
    const contentType = request.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      requestData = await request.json();
    }
  } catch (error) {
    console.warn('解析請求數據失敗:', error);
  }

  switch (action) {
    case 'start':
      if (!objectType) {
        return new Response(JSON.stringify({
          error: '需要指定對象類型進行遷移'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        // 記錄遷移開始
        await db.prepare(`
          INSERT INTO migration_history (
            migration_name, 
            migration_version, 
            status,
            started_at
          ) VALUES (?, ?, ?, ?)
        `).bind(
          `migrate-${objectType}`,
          '2.0.0',
          'started',
          Math.floor(Date.now() / 1000)
        ).run();

        return new Response(JSON.stringify({
          message: `${objectType} 遷移已啟動`,
          objectType,
          timestamp: Date.now(),
          note: '這是一個簡化的遷移實現，完整遷移請使用專用的遷移腳本'
        }), {
          status: 202, // Accepted
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          error: '啟動遷移失敗',
          objectType,
          message: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

    default:
      return new Response(JSON.stringify({
        error: '未知的 POST 操作',
        action,
        availableActions: ['start']
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
  }
}

/**
 * 確保 sales_records 表結構正確
 */
async function ensureSalesRecordsTableStructure(env) {
  console.log('🔍 檢查 sales_records 表結構...');
  
  try {
    // 檢查表是否存在並且結構正確
    try {
      const checkResult = await env.DB.prepare(`
        SELECT COUNT(*) as column_count 
        FROM pragma_table_info('sales_records') 
        WHERE name = 'external_form_display'
      `).first();
      
      if (checkResult && checkResult.column_count === 0) {
        console.log('⚠️  sales_records 表存在但缺少 external_form_display 欄位，重新創建表...');
        await env.DB.prepare('DROP TABLE IF EXISTS sales_records').run();
      }
    } catch (error) {
      console.log('📋 表不存在或檢查失敗，將創建新表...');
    }
    
    // 創建或更新 sales_records 表結構
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS sales_records (
        id TEXT PRIMARY KEY,
        name TEXT,
        opportunity_id TEXT,
        record_type TEXT,
        content TEXT,
        interactive_type TEXT,
        follow_date TEXT,
        sales_person TEXT,
        customer_name TEXT,
        amount REAL DEFAULT 0,
        stage TEXT,
        notes TEXT,
        location TEXT,
        external_form_display TEXT,
        create_time INTEGER,
        update_time INTEGER,
        synced_at INTEGER,
        raw_data TEXT,
        UNIQUE(id)
      )
    `).run();
    
    // 創建索引
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_sales_records_opportunity_id ON sales_records(opportunity_id)
    `).run();
    
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_sales_records_record_type ON sales_records(record_type)
    `).run();
    
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_sales_records_create_time ON sales_records(create_time)
    `).run();
    
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_sales_records_synced_at ON sales_records(synced_at)
    `).run();
    
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_sales_records_external_form_display ON sales_records(external_form_display)
    `).run();
    
    console.log('✅ sales_records 表結構和索引創建完成');
    
  } catch (error) {
    console.error('❌ sales_records 表結構檢查失敗:', error);
    throw error;
  }
}