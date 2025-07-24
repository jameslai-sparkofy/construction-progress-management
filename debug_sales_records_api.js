// 測試銷售記錄API調用
const https = require('https');

async function testSalesRecordsAPI() {
  try {
    console.log('=== 測試銷售記錄API ===\n');
    
    // 從 Workers API 獲取 token
    console.log('🔑 獲取API token...');
    const response = await fetch('https://progress.yes-ceramics.com/api/test/auth-token');
    const tokenData = await response.json();
    
    if (!tokenData.success) {
      console.error('Token 獲取失敗:', tokenData.error);
      return;
    }
    
    console.log('✅ Token 獲取成功');
    const { token, corpId, userId } = tokenData;
    
    // 直接測試銷售記錄查詢
    console.log('\n📡 測試銷售記錄查詢 (標準API)...');
    
    const apiResponse = await fetch('https://open.fxiaoke.com/cgi/crm/v2/data/query', {
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
            limit: 10,
            offset: 0,
            orders: [{ fieldName: "create_time", isAsc: "false" }]
          }
        }
      })
    });
    
    const result = await apiResponse.json();
    console.log('\n📋 標準API響應:');
    console.log(JSON.stringify(result, null, 2));
    
    // 如果標準API不工作，試試自定義API
    console.log('\n📡 測試銷售記錄查詢 (自定義API)...');
    
    const customApiResponse = await fetch('https://open.fxiaoke.com/cgi/crm/custom/v2/data/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        corpId: corpId,
        corpAccessToken: token,
        currentOpenUserId: userId,
        data: {
          dataObjectApiName: "ActiveRecordObj",
          search_query_info: {
            limit: 10,
            offset: 0,
            orders: [{ fieldName: "create_time", isAsc: "false" }]
          }
        }
      })
    });
    
    const customResult = await customApiResponse.json();
    console.log('\n📋 自定義API響應:');
    console.log(JSON.stringify(customResult, null, 2));
    
    // 也測試其他可能的對象名稱
    console.log('\n📡 測試其他可能的對象名稱...');
    
    const altNames = [
      "SalesRecord",
      "FollowUpRecord", 
      "SalesFollowUp",
      "CustomerFollowUp",
      "ActiveRecord",
      "FollowRecord"
    ];
    
    for (const objName of altNames) {
      console.log(`\n🔍 測試對象名稱: ${objName}`);
      
      try {
        const testResponse = await fetch('https://open.fxiaoke.com/cgi/crm/v2/data/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            corpId: corpId,
            corpAccessToken: token,
            currentOpenUserId: userId,
            data: {
              apiName: objName,
              search_query_info: {
                limit: 5,
                offset: 0
              }
            }
          })
        });
        
        const testResult = await testResponse.json();
        
        if (testResult.errorCode === 0) {
          console.log(`✅ ${objName} 查詢成功，找到 ${testResult.dataList?.length || 0} 筆記錄`);
          if (testResult.dataList && testResult.dataList.length > 0) {
            console.log('第一筆記錄:', JSON.stringify(testResult.dataList[0], null, 2));
          }
        } else {
          console.log(`❌ ${objName} 查詢失敗: ${testResult.errorMessage}`);
        }
      } catch (error) {
        console.log(`❌ ${objName} 查詢出錯: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('測試失敗:', error);
  }
}

testSalesRecordsAPI();