// 測試 Fxiaoke CRM 連接
const CONFIG = {
  appId: "FSAID_1320691",
  appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
  permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
  baseUrl: "https://open.fxiaoke.com"
};

async function testCRMConnection() {
  console.log('🔌 開始測試 Fxiaoke CRM 連接...');
  
  try {
    // Step 1: 獲取企業訪問令牌
    console.log('📝 Step 1: 獲取企業訪問令牌...');
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
    console.log('Token 響應:', JSON.stringify(tokenResult, null, 2));
    
    if (tokenResult.errorCode !== 0) {
      throw new Error(`Token獲取失敗: ${tokenResult.errorMessage}`);
    }
    
    const token = tokenResult.corpAccessToken;
    const corpId = tokenResult.corpId;
    console.log('✅ Token 獲取成功:', { corpId, token: token.substring(0, 20) + '...' });
    
    // Step 2: 獲取用戶信息
    console.log('📝 Step 2: 獲取用戶信息...');
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
    console.log('用戶響應:', JSON.stringify(userResult, null, 2));
    
    if (userResult.errorCode !== 0) {
      throw new Error(`用戶獲取失敗: ${userResult.errorMessage}`);
    }
    
    const userId = userResult.empList[0].openUserId;
    console.log('✅ 用戶信息獲取成功:', { userId });
    
    // Step 3: 查詢商機列表 (使用 data/query 搭配 NewOpportunityObj)
    console.log('📝 Step 3: 查詢商機列表...');
    const opportunityResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/data/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        corpId: corpId,
        corpAccessToken: token,
        currentOpenUserId: userId,
        apiName: "crm.data.query",
        data: {
          dataType: "OpportunityObj",
          search_query_info: {
            limit: 50,
            offset: 0,
            orders: [{fieldName: "create_time", isAsc: "false"}]
          }
        }
      })
    });
    
    const opportunityResult = await opportunityResponse.json();
    console.log('商機查詢響應:', JSON.stringify(opportunityResult, null, 2));
    
    if (opportunityResult.errorCode !== 0) {
      throw new Error(`商機查詢失敗: ${opportunityResult.errorMessage}`);
    }
    
    const opportunities = opportunityResult.data?.dataList || [];
    console.log(`✅ 成功獲取 ${opportunities.length} 個商機`);
    
    if (opportunities.length > 0) {
      console.log('📋 第一個商機詳情:');
      console.log(JSON.stringify(opportunities[0], null, 2));
    }
    
    return {
      success: true,
      message: 'CRM 連接測試成功',
      data: {
        tokenValid: true,
        userValid: true,
        opportunitiesCount: opportunities.length,
        sampleOpportunity: opportunities[0] || null
      }
    };
    
  } catch (error) {
    console.error('❌ CRM 連接測試失敗:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 執行測試
testCRMConnection().then(result => {
  console.log('\n🎯 最終結果:');
  console.log(JSON.stringify(result, null, 2));
}).catch(error => {
  console.error('腳本執行失敗:', error);
});