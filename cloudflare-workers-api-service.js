// Cloudflare Workers API服務
// 處理紛享銷客API代理和資料處理

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // 提取項目ID和API路徑
    const projectId = pathSegments[0];
    const apiPath = pathSegments.slice(2).join('/'); // 跳過'api'
    
    // 獲取項目配置
    const projectConfig = await getProjectConfig(env, projectId);
    if (!projectConfig) {
      return errorResponse('Project not found', 404);
    }
    
    // 驗證用戶會話（除了登入相關API）
    if (!['send-sms', 'verify-login'].includes(apiPath)) {
      const session = await validateSession(request, env, projectId);
      if (!session) {
        return errorResponse('Unauthorized', 401);
      }
    }
    
    // 路由API請求
    switch (apiPath) {
      case 'send-sms':
        return handleSendSMS(request, env, projectId);
      case 'verify-login':
        return handleVerifyLogin(request, env, projectId, projectConfig);
      case 'logout':
        return handleLogout(request, env, projectId);
      case 'sites':
        return handleSitesAPI(request, env, projectId, projectConfig);
      case 'repair-orders':
        return handleRepairOrdersAPI(request, env, projectId, projectConfig);
      case 'progress':
        return handleProgressAPI(request, env, projectId, projectConfig);
      case 'sync':
        return handleSyncAPI(request, env, projectId, projectConfig);
      default:
        return errorResponse('API endpoint not found', 404);
    }
  }
};

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

// 發送短信驗證碼
async function handleSendSMS(request, env, projectId) {
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }
  
  try {
    const { phone } = await request.json();
    
    if (!phone || !isValidPhone(phone)) {
      return errorResponse('Invalid phone number', 400);
    }
    
    // 檢查發送頻率限制
    const rateLimitKey = `sms-rate-${projectId}-${phone}`;
    const lastSent = await env.SMS_CODES.get(rateLimitKey);
    
    if (lastSent && Date.now() - parseInt(lastSent) < 60000) {
      return errorResponse('請等待60秒後再次發送', 429);
    }
    
    // 生成驗證碼
    const code = generateSMSCode();
    const key = `sms-${projectId}-${phone}`;
    
    // 存儲驗證碼（5分鐘有效）
    await env.SMS_CODES.put(key, JSON.stringify({
      code,
      createdAt: Date.now(),
      expiresAt: Date.now() + 300000
    }), { expirationTtl: 300 });
    
    // 記錄發送時間
    await env.SMS_CODES.put(rateLimitKey, Date.now().toString(), { expirationTtl: 60 });
    
    // 發送短信
    const smsResult = await sendSMS(env, phone, `您的驗證碼是：${code}，5分鐘內有效。`);
    
    if (smsResult.success) {
      return successResponse('驗證碼已發送');
    } else {
      return errorResponse('短信發送失敗，請稍後再試');
    }
    
  } catch (error) {
    console.error('Send SMS error:', error);
    return errorResponse('服務器錯誤');
  }
}

// 驗證登入
async function handleVerifyLogin(request, env, projectId, projectConfig) {
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }
  
  try {
    const { phone, code } = await request.json();
    
    if (!phone || !code) {
      return errorResponse('手機號碼和驗證碼不能為空', 400);
    }
    
    // 驗證短信驗證碼
    const isValidCode = await verifySMSCode(env, projectId, phone, code);
    if (!isValidCode) {
      return errorResponse('驗證碼錯誤或已過期');
    }
    
    // 檢查用戶權限
    const userPermissions = await getUserPermissions(env, projectId, phone, projectConfig);
    if (!userPermissions) {
      return errorResponse('您沒有權限訪問此項目');
    }
    
    // 創建會話
    const sessionId = generateSessionId();
    const session = {
      userId: phone,
      projectId,
      ...userPermissions,
      createdAt: Date.now(),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000 // 8小時
    };
    
    await env.USER_SESSIONS.put(`session-${sessionId}`, JSON.stringify(session), {
      expirationTtl: 8 * 60 * 60 // 8小時
    });
    
    // 返回成功響應和設置Cookie
    const response = successResponse('登入成功', { redirectUrl: `/${projectId}/dashboard` });
    response.headers.set('Set-Cookie', 
      `session-${projectId}=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800`
    );
    
    return response;
    
  } catch (error) {
    console.error('Verify login error:', error);
    return errorResponse('服務器錯誤');
  }
}

// 登出
async function handleLogout(request, env, projectId) {
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  const sessionId = cookies[`session-${projectId}`];
  
  if (sessionId) {
    await env.USER_SESSIONS.delete(`session-${sessionId}`);
  }
  
  const response = new Response(null, {
    status: 302,
    headers: {
      'Location': `/${projectId}/login`,
      'Set-Cookie': `session-${projectId}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
    }
  });
  
  return response;
}

// 獲取案場資料
async function handleSitesAPI(request, env, projectId, projectConfig) {
  try {
    const session = await validateSession(request, env, projectId);
    const fxiaokeData = await getFxiaokeData(env, projectConfig, 'sites');
    
    // 根據用戶權限過濾資料
    const filteredData = filterDataByPermissions(fxiaokeData, session);
    
    return successResponse('案場資料獲取成功', filteredData);
  } catch (error) {
    console.error('Sites API error:', error);
    return errorResponse('獲取案場資料失敗');
  }
}

// 獲取維修單資料
async function handleRepairOrdersAPI(request, env, projectId, projectConfig) {
  try {
    const session = await validateSession(request, env, projectId);
    const fxiaokeData = await getFxiaokeData(env, projectConfig, 'repair-orders');
    
    // 根據用戶權限過濾資料
    const filteredData = filterDataByPermissions(fxiaokeData, session);
    
    return successResponse('維修單資料獲取成功', filteredData);
  } catch (error) {
    console.error('Repair orders API error:', error);
    return errorResponse('獲取維修單資料失敗');
  }
}

// 獲取進度資料
async function handleProgressAPI(request, env, projectId, projectConfig) {
  try {
    const session = await validateSession(request, env, projectId);
    
    // 從快取獲取或重新計算進度
    const progressData = await getProgressData(env, projectId, projectConfig, session);
    
    return successResponse('進度資料獲取成功', progressData);
  } catch (error) {
    console.error('Progress API error:', error);
    return errorResponse('獲取進度資料失敗');
  }
}

// 手動同步資料
async function handleSyncAPI(request, env, projectId, projectConfig) {
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }
  
  try {
    const session = await validateSession(request, env, projectId);
    
    // 只有管理員可以手動同步
    if (session.role !== 'admin') {
      return errorResponse('權限不足', 403);
    }
    
    // 同步資料
    await syncProjectData(env, projectId, projectConfig);
    
    return successResponse('資料同步成功');
  } catch (error) {
    console.error('Sync API error:', error);
    return errorResponse('資料同步失敗');
  }
}

// 紛享銷客API調用
async function getFxiaokeData(env, projectConfig, dataType) {
  const token = await getFxiaokeToken(env);
  
  switch (dataType) {
    case 'sites':
      return await getFxiaokeSites(env, token, projectConfig.opportunity);
    case 'repair-orders':
      return await getFxiaokeRepairOrders(env, token, projectConfig.opportunity);
    default:
      throw new Error(`Unknown data type: ${dataType}`);
  }
}

// 獲取紛享銷客Token
async function getFxiaokeToken(env) {
  try {
    const response = await fetch(`${env.FXIAOKE_BASE_URL}/cgi/corpAccessToken/get/V2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: env.FXIAOKE_APP_ID,
        appSecret: env.FXIAOKE_APP_SECRET,
        permanentCode: env.FXIAOKE_PERMANENT_CODE
      })
    });
    
    const result = await response.json();
    
    if (result.errorCode !== 0) {
      throw new Error(`Token獲取失敗: ${result.errorMessage}`);
    }
    
    return {
      token: result.corpAccessToken,
      corpId: result.corpId
    };
  } catch (error) {
    console.error('Fxiaoke token error:', error);
    throw error;
  }
}

// 獲取案場資料
async function getFxiaokeSites(env, tokenData, opportunity) {
  // 實現具體的API調用邏輯
  // 這裡應該使用實際的紛享銷客API
  return {
    sites: [],
    totalCount: 0
  };
}

// 發送短信
async function sendSMS(env, phone, message) {
  try {
    // 使用Twilio或三竹短信服務
    // 這裡需要根據實際選擇的服務商實現
    
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
      // 使用Twilio
      return await sendTwilioSMS(env, phone, message);
    } else {
      // 使用三竹或其他服務
      return await sendCustomSMS(env, phone, message);
    }
  } catch (error) {
    console.error('SMS sending error:', error);
    return { success: false, error: error.message };
  }
}

// 工具函數
function isValidPhone(phone) {
  return /^09\d{8}$/.test(phone);
}

function generateSMSCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

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

function successResponse(message, data = null) {
  return new Response(JSON.stringify({
    success: true,
    message,
    data
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({
    success: false,
    message
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// 驗證短信驗證碼
async function verifySMSCode(env, projectId, phone, code) {
  const key = `sms-${projectId}-${phone}`;
  const storedData = await env.SMS_CODES.get(key);
  
  if (!storedData) {
    return false;
  }
  
  const { code: storedCode, expiresAt } = JSON.parse(storedData);
  
  if (Date.now() > expiresAt || code !== storedCode) {
    return false;
  }
  
  // 驗證成功，刪除驗證碼
  await env.SMS_CODES.delete(key);
  return true;
}

// 獲取用戶權限
async function getUserPermissions(env, projectId, phone, projectConfig) {
  // 這裡應該根據實際的用戶管理系統實現
  // 可以從KV存儲、數據庫或配置文件中獲取用戶權限
  
  // 示例：基本權限配置
  const defaultPermissions = {
    role: 'viewer',
    permissions: ['view_progress', 'view_sites'],
    contractor: null,
    buildings: []
  };
  
  return defaultPermissions;
}