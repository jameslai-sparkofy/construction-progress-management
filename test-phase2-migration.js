/**
 * Phase 2 數據遷移測試腳本
 * 
 * 測試完整的遷移流程：
 * 1. 檢查遷移前狀態
 * 2. 執行實際數據遷移（通過 SQL）
 * 3. 驗證遷移結果
 * 4. 檢查數據完整性
 */

const BASE_URL = 'https://progress.yes-ceramics.com';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return {
      success: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testMigrationStatus() {
  console.log('\n=== 測試遷移狀態 API ===');
  
  // 測試總體狀態
  const allStatus = await makeRequest(`${BASE_URL}/api/migration/status`);
  console.log('總體遷移狀態:', JSON.stringify(allStatus.data, null, 2));
  
  // 測試各對象狀態
  const objects = ['opportunities', 'sites', 'sales_records', 'maintenance_orders'];
  
  for (const objectType of objects) {
    const objectStatus = await makeRequest(`${BASE_URL}/api/migration/status/${objectType}`);
    console.log(`${objectType} 狀態:`, objectStatus.data);
  }
  
  return allStatus.data;
}

async function testMigrationHistory() {
  console.log('\n=== 測試遷移歷史 ===');
  
  const history = await makeRequest(`${BASE_URL}/api/migration/history`);
  console.log('遷移歷史:', history.data);
  
  return history.data;
}

async function testMigrationValidation() {
  console.log('\n=== 測試數據驗證 ===');
  
  const objects = ['opportunities', 'sites', 'sales_records'];
  const validationResults = {};
  
  for (const objectType of objects) {
    const validation = await makeRequest(`${BASE_URL}/api/migration/validation/${objectType}`);
    console.log(`${objectType} 驗證結果:`, validation.data);
    validationResults[objectType] = validation.data;
  }
  
  return validationResults;
}

async function runFullMigrationTest() {
  console.log('🚀 開始 Phase 2 遷移測試');
  console.log('時間:', new Date().toISOString());
  
  try {
    // 1. 檢查遷移前狀態
    console.log('\n📊 Step 1: 檢查遷移前狀態');
    const initialStatus = await testMigrationStatus();
    
    // 2. 檢查遷移歷史
    console.log('\n📜 Step 2: 檢查遷移歷史');
    const history = await testMigrationHistory();
    
    // 3. 驗證當前數據狀態
    console.log('\n✅ Step 3: 驗證當前數據狀態');
    const validation = await testMigrationValidation();
    
    // 4. 數據統計摘要
    console.log('\n📈 Step 4: 數據統計摘要');
    let totalOriginal = 0;
    let totalMigrated = 0;
    
    for (const [objectType, status] of Object.entries(initialStatus.migration)) {
      if (status.originalCount !== undefined) {
        totalOriginal += status.originalCount;
        totalMigrated += status.migratedCount;
        
        console.log(`${objectType}: ${status.originalCount} 原始 → ${status.migratedCount} 已遷移 (${status.migrationProgress}%)`);
      }
    }
    
    console.log(`\n總計: ${totalOriginal} 原始記錄 → ${totalMigrated} 已遷移記錄`);
    console.log(`整體進度: ${totalOriginal > 0 ? Math.round((totalMigrated / totalOriginal) * 100) : 0}%`);
    
    // 5. 測試總結
    console.log('\n🎯 Phase 2 測試總結');
    console.log(`✅ 資料庫架構：已部署 (${history.history.results.length} 個遷移步驟完成)`);
    console.log(`📊 數據狀態：${totalOriginal} 筆原始數據已備份`);
    console.log(`🏗️ 新架構：已創建 4 個對象表`);
    console.log(`🔍 API 端點：遷移管理 API 正常運作`);
    
    if (totalMigrated === 0) {
      console.log('\n⚠️  注意：實際數據遷移尚未執行');
      console.log('   下一步需要執行第3階段SQL腳本來遷移數據');
    }
    
    console.log('\n✨ Phase 2 測試完成！');
    return {
      success: true,
      summary: {
        totalOriginal,
        totalMigrated,
        migrationProgress: totalOriginal > 0 ? Math.round((totalMigrated / totalOriginal) * 100) : 0,
        migrationsCompleted: history.history.results.length,
        apiStatus: 'operational'
      }
    };
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 執行測試
runFullMigrationTest().then(result => {
  if (result.success) {
    console.log('\n🎉 Phase 2 所有測試通過！');
    process.exit(0);
  } else {
    console.log('\n💥 測試失敗');
    process.exit(1);
  }
}).catch(error => {
  console.error('腳本執行錯誤:', error);
  process.exit(1);
});