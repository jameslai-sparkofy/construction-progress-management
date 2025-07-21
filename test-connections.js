// 測試 Cloudflare 和 Fxiaoke 連接
const FXIAOKE_CONFIG = {
  appId: 'FSAID_1320691',
  appSecret: 'XcAjT3iYZ4V2W8rP9qN7sM6uLk5J0hT',
  permanentCode: '0dTQjYfOdyOQHsGMhINYCw',
  baseUrl: 'https://open.fxiaoke.com'
};

/**
 * 測試 Fxiaoke API 連接
 */
async function testFxiaokeConnection() {
  try {
    console.log('🔍 測試 Fxiaoke API 連接...');
    
    // 1. 獲取訪問令牌
    const tokenUrl = `${FXIAOKE_CONFIG.baseUrl}/cgi/token/get`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appId: FXIAOKE_CONFIG.appId,
        appSecret: FXIAOKE_CONFIG.appSecret,
        permanentCode: FXIAOKE_CONFIG.permanentCode
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.errorCode || tokenData.errorCode === 0) {
      console.log('✅ Fxiaoke Token 獲取成功');
      console.log(`   Corp ID: ${tokenData.corpId}`);
      console.log(`   User ID: ${tokenData.userId}`);
      console.log(`   Token: ${tokenData.accessToken.substring(0, 20)}...`);
      
      // 2. 測試 API 調用 - 獲取商機列表
      const queryUrl = `${FXIAOKE_CONFIG.baseUrl}/cgi/crm/v2/data/query`;
      const queryResponse = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          corpAccessToken: tokenData.accessToken,
          corpId: tokenData.corpId,
          openUserId: tokenData.userId,
          apiName: 'crm.data.query',
          requestId: Date.now().toString(),
          data: {
            dataType: 'CrmOpportunityData',
            pageSize: 5,
            pageNumber: 1
          }
        })
      });

      const queryData = await queryResponse.json();
      
      if (!queryData.errorCode || queryData.errorCode === 0) {
        console.log('✅ Fxiaoke 商機數據獲取成功');
        console.log(`   獲取到 ${queryData.data?.dataList?.length || 0} 個商機`);
        if (queryData.data?.dataList?.length > 0) {
          const firstOpp = queryData.data.dataList[0];
          console.log(`   第一個商機: ${firstOpp.name || '無名稱'} (${firstOpp.customer || '無客戶'})`);
        }
        return { success: true, message: 'Fxiaoke 連接正常' };
      } else {
        console.log('❌ Fxiaoke 數據查詢失敗');
        console.log(`   錯誤代碼: ${queryData.errorCode}`);
        console.log(`   錯誤訊息: ${queryData.errorMessage}`);
        return { success: false, message: `數據查詢失敗: ${queryData.errorMessage}` };
      }
    } else {
      console.log('❌ Fxiaoke Token 獲取失敗');
      console.log(`   錯誤代碼: ${tokenData.errorCode}`);
      console.log(`   錯誤訊息: ${tokenData.errorMessage}`);
      return { success: false, message: `Token 獲取失敗: ${tokenData.errorMessage}` };
    }
    
  } catch (error) {
    console.error('❌ Fxiaoke 連接測試失敗:', error);
    return { success: false, message: `連接失敗: ${error.message}` };
  }
}

/**
 * 測試 Cloudflare Workers 部署狀態
 */
async function testCloudflareConnection() {
  try {
    console.log('🔍 測試 Cloudflare Workers 連接...');
    
    const workerUrl = 'https://progress.yes-ceramics.com';
    const response = await fetch(workerUrl);
    
    if (response.ok) {
      const text = await response.text();
      if (text.includes('興安西工程管理') || text.includes('專案總覽')) {
        console.log('✅ Cloudflare Workers 部署正常');
        console.log(`   狀態碼: ${response.status}`);
        console.log(`   內容長度: ${text.length} 字符`);
        return { success: true, message: 'Cloudflare Workers 運行正常' };
      } else {
        console.log('⚠️  Cloudflare Workers 回應異常');
        console.log(`   狀態碼: ${response.status}`);
        console.log(`   內容預覽: ${text.substring(0, 200)}...`);
        return { success: false, message: 'Workers 回應內容異常' };
      }
    } else {
      console.log('❌ Cloudflare Workers 連接失敗');
      console.log(`   狀態碼: ${response.status}`);
      console.log(`   狀態文字: ${response.statusText}`);
      return { success: false, message: `連接失敗: ${response.status} ${response.statusText}` };
    }
    
  } catch (error) {
    console.error('❌ Cloudflare 連接測試失敗:', error);
    return { success: false, message: `連接失敗: ${error.message}` };
  }
}

/**
 * 測試 Cloudflare Workers API 端點
 */
async function testCloudflareAPI() {
  try {
    console.log('🔍 測試 Cloudflare Workers API 端點...');
    
    // 測試健康檢查端點
    const healthUrl = 'https://progress.yes-ceramics.com/api/health';
    const healthResponse = await fetch(healthUrl);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ API 健康檢查通過');
      console.log(`   版本: ${healthData.version || '未知'}`);
      console.log(`   狀態: ${healthData.status || '未知'}`);
      
      // 測試同步端點（不實際執行同步，只檢查端點存在性）
      const syncUrl = 'https://progress.yes-ceramics.com/api/sync-opportunities';
      const syncResponse = await fetch(syncUrl, { method: 'OPTIONS' });
      
      if (syncResponse.ok || syncResponse.status === 405) {
        console.log('✅ 同步端點可訪問');
        return { success: true, message: 'Cloudflare API 端點正常' };
      } else {
        console.log('⚠️  同步端點異常');
        return { success: false, message: '同步端點不可訪問' };
      }
      
    } else {
      console.log('❌ API 健康檢查失敗');
      console.log(`   狀態碼: ${healthResponse.status}`);
      return { success: false, message: `健康檢查失敗: ${healthResponse.status}` };
    }
    
  } catch (error) {
    console.error('❌ Cloudflare API 測試失敗:', error);
    return { success: false, message: `API 測試失敗: ${error.message}` };
  }
}

/**
 * 主測試函數
 */
async function runConnectionTests() {
  console.log('🚀 開始連接測試...\n');
  
  const results = {
    cloudflare: await testCloudflareConnection(),
    cloudflareAPI: await testCloudflareAPI(),
    fxiaoke: await testFxiaokeConnection()
  };
  
  console.log('\n📊 測試結果總結:');
  console.log('==================');
  
  for (const [service, result] of Object.entries(results)) {
    const status = result.success ? '✅ 成功' : '❌ 失敗';
    console.log(`${service.padEnd(15)}: ${status} - ${result.message}`);
  }
  
  const allSuccess = Object.values(results).every(r => r.success);
  console.log(`\n總體狀態: ${allSuccess ? '✅ 所有服務正常' : '⚠️  部分服務異常'}`);
  
  return results;
}

// 執行測試
runConnectionTests().catch(console.error);