// 檢查商機-案場關聯的測試腳本

async function checkOpportunitySiteRelation() {
  try {
    console.log('=== 檢查商機-案場關聯 ===\n');
    
    // 1. 獲取商機列表
    console.log('📋 獲取商機列表...');
    const opportunitiesResponse = await fetch('https://progress.yes-ceramics.com/api/crm/opportunities?limit=10');
    const opportunitiesData = await opportunitiesResponse.json();
    
    if (!opportunitiesData.success) {
      console.error('獲取商機失敗:', opportunitiesData.error);
      return;
    }
    
    console.log(`找到 ${opportunitiesData.data.length} 個商機\n`);
    
    // 2. 獲取所有案場（只獲取一次）
    console.log('📍 獲取案場列表...');
    const sitesResponse = await fetch('https://progress.yes-ceramics.com/api/crm/sites');
    const sitesData = await sitesResponse.json();
    
    if (!sitesData.success) {
      console.error('獲取案場失敗:', sitesData.error);
      return;
    }
    
    console.log(`找到 ${sitesData.data.length} 個案場\n`);
    
    // 3. 對每個商機，查找關聯的案場
    for (const opportunity of opportunitiesData.data.slice(0, 5)) { // 只檢查前5個
      console.log(`\n🏢 商機: ${opportunity.name}`);
      console.log(`   ID: ${opportunity.id}`);
      
      // 過濾出關聯到此商機的案場
      const relatedSites = sitesData.data.filter(site => {
        const raw = site.raw || {};
        return raw.field_1P96q__c === opportunity.id;
      });
      
      console.log(`   📍 關聯案場數: ${relatedSites.length}`);
      
      if (relatedSites.length > 0) {
        console.log('   案場列表:');
        relatedSites.slice(0, 3).forEach(site => {
          const raw = site.raw || {};
          console.log(`     - ${site.name} (${raw.field_WD7k1__c || ''}棟 ${raw.field_Q6Svh__c || ''}F ${raw.field_XuJP2__c || ''})`);
        });
        if (relatedSites.length > 3) {
          console.log(`     ... 還有 ${relatedSites.length - 3} 個案場`);
        }
      }
    }
    
    console.log('\n=== 關聯檢查完成 ===');
    
  } catch (error) {
    console.error('檢查失敗:', error);
  }
}

// 執行檢查
checkOpportunitySiteRelation();