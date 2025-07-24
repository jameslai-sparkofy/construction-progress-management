// 檢查D1資料庫中的商機-案場關聯

const { execSync } = require('child_process');

console.log('=== 檢查D1資料庫中的商機-案場關聯 ===\n');

try {
  // 1. 查詢商機總數
  console.log('📊 查詢商機總數...');
  const oppCountResult = execSync('npx wrangler d1 execute construction_progress --env production --remote --command "SELECT COUNT(*) as total FROM opportunities"', {
    encoding: 'utf8'
  });
  console.log(oppCountResult);
  
  // 2. 查詢案場總數
  console.log('\n📊 查詢案場總數...');
  const siteCountResult = execSync('npx wrangler d1 execute construction_progress --env production --remote --command "SELECT COUNT(*) as total FROM sites"', {
    encoding: 'utf8'
  });
  console.log(siteCountResult);
  
  // 3. 查詢有商機關聯的案場數量
  console.log('\n🔗 查詢有商機關聯的案場...');
  const linkedSitesResult = execSync('npx wrangler d1 execute construction_progress --env production --remote --command "SELECT COUNT(*) as total FROM sites WHERE opportunity_id IS NOT NULL AND opportunity_id != \'\'"', {
    encoding: 'utf8'
  });
  console.log(linkedSitesResult);
  
  // 4. 查詢前10個商機及其關聯的案場數
  console.log('\n📋 查詢前10個商機及其關聯案場數...');
  const topOppsResult = execSync(`npx wrangler d1 execute construction_progress --env production --remote --command "
    SELECT o.id, o.name, COUNT(s.id) as site_count 
    FROM opportunities o 
    LEFT JOIN sites s ON s.opportunity_id = o.id 
    GROUP BY o.id, o.name 
    ORDER BY site_count DESC 
    LIMIT 10"`, {
    encoding: 'utf8'
  });
  console.log(topOppsResult);
  
  // 5. 查詢特定商機的案場
  console.log('\n🏢 查詢特定商機的關聯案場...');
  const specificOppResult = execSync(`npx wrangler d1 execute construction_progress --env production --remote --command "
    SELECT name, building_type, floor_info, room_info 
    FROM sites 
    WHERE opportunity_id = '66defc17d0d4940001cf0fbf' 
    LIMIT 5"`, {
    encoding: 'utf8'
  });
  console.log(specificOppResult);
  
} catch (error) {
  console.error('查詢失敗:', error.message);
}