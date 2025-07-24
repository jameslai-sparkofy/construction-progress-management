// 案場同步功能代碼片段
// 需要添加到 src/index.js 中

// 1. 在 handleSyncAPI 的 switch 中添加
case 'sites':
  return await handleSitesSync(request, env, corsHeaders);

// 2. 新增 handleSitesSync 函數
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

// 3. 新增 syncSitesToDB 函數
async function syncSitesToDB(env) {
  console.log('🏗️ 開始同步案場資料到 D1...');
  
  try {
    // 獲取 API Token
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
      
      // 從 CRM API 獲取案場資料
      const sitesData = await queryRealSites(token, corpId, userId, limit, offset);
      
      if (!sitesData || sitesData.length === 0) {
        hasMore = false;
        break;
      }
      
      totalCount += sitesData.length;
      
      // 批量插入到 D1 資料庫
      const insertedCount = await insertSitesToD1(env, sitesData);
      syncedCount += insertedCount;
      
      // 檢查是否還有更多資料
      if (sitesData.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
      
      console.log(`✅ 已同步 ${syncedCount}/${totalCount} 個案場`);
    }
    
    // 更新同步狀態
    await updateSyncStatus(env, 'sites', syncedCount);
    
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

// 4. 新增 queryRealSites 函數 - 查詢真實案場資料
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
          apiName: "object_8W9cb__c", // 案場對象 API 名稱
          search_query_info: {
            limit: limit,
            offset: offset,
            orders: [{ fieldName: "create_time", isAsc: "false" }]
          }
        }
      })
    });
    
    const result = await response.json();
    console.log('案場查詢原始響應:', JSON.stringify(result, null, 2));
    
    if (result.errorCode !== 0) {
      throw new Error(`案場查詢失敗: ${result.errorMessage}`);
    }
    
    if (!result.dataList || result.dataList.length === 0) {
      console.log('🔍 沒有找到案場資料');
      return [];
    }
    
    // 轉換案場資料格式
    const sites = result.dataList.map(site => ({
      id: site._id,
      name: site.name || '未命名案場',
      building: site.field_WD7k1__c || '', // 棟別
      floor: site.field_Q6Svh__c || 0, // 樓層
      unit: site.field_XuJP2__c || '', // 戶別
      site_type: site.field_dxr31__c || '', // 案場類型
      stage: site.field_z9H6O__c || '', // 階段
      construction_completed: site.construction_completed__c || 0, // 施工完成
      opportunity_id: site.field_1P96q__c || '', // 商機關聯
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

// 5. 新增 insertSitesToD1 函數
async function insertSitesToD1(env, sitesData) {
  if (!sitesData || sitesData.length === 0) {
    return 0;
  }
  
  console.log(`💾 準備插入 ${sitesData.length} 個案場到 D1`);
  
  try {
    const currentTime = Date.now();
    
    // 構建批量插入語句
    const values = sitesData.map(site => 
      `('${site.id}', '${site.name}', '${site.building}', ${site.floor}, '${site.unit}', '${site.site_type}', '${site.stage}', ${site.construction_completed}, '${site.opportunity_id}', '${site.owner}', ${site.create_time}, ${site.last_modified_time}, ${currentTime}, '${site.raw_data.replace(/'/g, "''")}')`
    ).join(', ');
    
    const insertSQL = `
      INSERT OR REPLACE INTO sites (
        id, name, building, floor, unit, site_type, stage, 
        construction_completed, opportunity_id, owner, 
        create_time, last_modified_time, synced_at, raw_data
      ) VALUES ${values}
    `;
    
    const stmt = env.DB.prepare(insertSQL);
    const result = await stmt.run();
    
    console.log(`✅ 成功插入 ${sitesData.length} 個案場到 D1`);
    return sitesData.length;
    
  } catch (error) {
    console.error('❌ D1插入失敗:', error);
    throw new Error(`D1插入失敗: ${error.message}`);
  }
}

// 6. 更新定時任務，加入案場同步
async scheduled(event, env, ctx) {
  console.log('🕐 開始執行定時同步任務...');
  
  try {
    // 執行商機同步
    const opportunitySync = await syncOpportunitiesToDB(env);
    
    // 執行案場同步 
    const siteSync = await syncSitesToDB(env);
    
    console.log('✅ 定時同步完成:', {
      opportunities: {
        syncedCount: opportunitySync.syncedCount,
        totalCount: opportunitySync.totalCount
      },
      sites: {
        syncedCount: siteSync.syncedCount, 
        totalCount: siteSync.totalCount
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ 定時同步失敗:', error);
  }
}