// 直接讀取維修單資料來分析勝興-興安西-2024
const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function readRepairData() {
    console.log('=== 讀取維修單資料分析勝興-興安西-2024 ===\n');
    
    try {
        // Step 1: 獲取Token
        console.log('1. 獲取企業訪問令牌...');
        const tokenResponse = await fetch(`${CONFIG.baseUrl}/cgi/corpAccessToken/get/V2`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                appId: CONFIG.appId,
                appSecret: CONFIG.appSecret,
                permanentCode: CONFIG.permanentCode
            })
        });
        
        const tokenResult = await tokenResponse.json();
        if (tokenResult.errorCode !== 0) {
            throw new Error(`Token獲取失敗: ${tokenResult.errorMessage}`);
        }
        
        const token = tokenResult.corpAccessToken;
        const corpId = tokenResult.corpId;
        console.log('✅ Token獲取成功\n');
        
        // Step 2: 獲取用戶信息
        console.log('2. 獲取用戶信息...');
        const userResponse = await fetch(`${CONFIG.baseUrl}/cgi/user/getByMobile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                mobile: "17675662629"
            })
        });
        
        const userResult = await userResponse.json();
        if (userResult.errorCode !== 0) {
            throw new Error(`用戶獲取失敗: ${userResult.errorMessage}`);
        }
        
        const userId = userResult.empList[0].openUserId;
        console.log('✅ 用戶信息獲取成功\n');
        
        // Step 3: 查詢所有維修單
        console.log('3. 查詢所有維修單資料...');
        const repairResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    dataObjectApiName: "on_site_signature__c",
                    search_query_info: {
                        limit: 500,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const repairResult = await repairResponse.json();
        
        if (repairResult.errorCode !== 0) {
            throw new Error(`維修單查詢失敗: ${repairResult.errorMessage}`);
        }
        
        console.log(`✅ 維修單資料查詢成功！獲取到 ${repairResult.data.dataList.length} 條記錄\n`);
        
        // Step 4: 篩選勝興-興安西-2024相關記錄
        console.log('4. 篩選勝興-興安西-2024相關記錄...');
        const all2024Records = repairResult.data.dataList.filter(record => {
            // 檢查各種可能的欄位
            const possibleFields = [
                'opportunity_name', 'opportunity_id', 'project_name', 'site_name', 
                'name', 'title', 'description', 'related_opportunity', 'opportunity__c__r'
            ];
            
            for (const field of possibleFields) {
                if (record[field] && typeof record[field] === 'string') {
                    if (record[field].includes('勝興') && record[field].includes('興安西') && record[field].includes('2024')) {
                        return true;
                    }
                }
            }
            return false;
        });
        
        console.log(`找到 ${all2024Records.length} 條勝興-興安西-2024相關記錄\n`);
        
        if (all2024Records.length === 0) {
            console.log('⚠️ 沒有找到勝興-興安西-2024相關記錄');
            console.log('顯示前5條記錄的結構以供分析...\n');
            
            repairResult.data.dataList.slice(0, 5).forEach((record, index) => {
                console.log(`記錄 ${index + 1}:`);
                console.log(`  ID: ${record._id}`);
                console.log(`  名稱: ${record.name || '未命名'}`);
                console.log(`  創建時間: ${new Date(record.create_time).toLocaleString()}`);
                
                // 顯示包含"勝興"、"興安西"或"2024"的欄位
                Object.keys(record).forEach(key => {
                    if (record[key] && typeof record[key] === 'string') {
                        if (record[key].includes('勝興') || record[key].includes('興安西') || record[key].includes('2024')) {
                            console.log(`  ${key}: ${record[key]}`);
                        }
                    }
                });
                console.log('');
            });
        } else {
            // Step 5: 分析找到的記錄
            console.log('5. 分析勝興-興安西-2024記錄...');
            
            // 先顯示所有記錄的詳細結構
            console.log('詳細記錄結構:');
            all2024Records.forEach((record, index) => {
                console.log(`\n記錄 ${index + 1} (${record._id}):`);
                console.log(`  名稱: ${record.name}`);
                console.log(`  商機: ${record.opportunity__c__r}`);
                console.log(`  對應單據: ${record.corresponding_ticket__c__r || '無'}`);
                console.log(`  創建時間: ${new Date(record.create_time).toLocaleString()}`);
                console.log('  所有欄位:');
                Object.keys(record).forEach(key => {
                    if (record[key] !== null && record[key] !== undefined && record[key] !== '') {
                        console.log(`    ${key}: ${record[key]}`);
                    }
                });
            });
            
            // 分析建築結構
            const buildingAnalysis = analyzeBuildingStructure(all2024Records);
            console.log('\n建築結構分析:');
            console.log(JSON.stringify(buildingAnalysis, null, 2));
            
            // 分析工班配置
            const contractorAnalysis = analyzeContractors(all2024Records);
            console.log('\n工班配置分析:');
            console.log(JSON.stringify(contractorAnalysis, null, 2));
            
            // 生成JavaScript配置
            const siteConfig = {
                site: {
                    name: "勝興-興安西-2024",
                    totalRecords: all2024Records.length
                },
                buildings: buildingAnalysis,
                contractors: contractorAnalysis
            };
            
            console.log('\n完整案場配置:');
            console.log(JSON.stringify(siteConfig, null, 2));
            
            // 寫入配置檔案
            const fs = require('fs');
            const configContent = `
// 勝興-興安西-2024 真實案場配置
const SITE_CONFIG_2024 = ${JSON.stringify(siteConfig, null, 2)};

console.log('勝興-興安西-2024配置載入完成:', SITE_CONFIG_2024);
`;
            
            fs.writeFileSync('勝興-興安西-2024-config.js', configContent, 'utf8');
            console.log('\n✅ 配置已寫入 勝興-興安西-2024-config.js 檔案');
        }
        
    } catch (error) {
        console.error('❌ 讀取失敗:', error.message);
    }
}

// 分析建築結構
function analyzeBuildingStructure(records) {
    const buildings = {};
    
    records.forEach(record => {
        // 使用實際發現的欄位
        let building = null;
        let floor = null;
        let unit = null;
        
        // 建築類型從 building_type__c 讀取
        if (record['building_type__c']) {
            building = record['building_type__c'] + '棟';
        }
        
        // 樓層從 floor_level__c 讀取
        if (record['floor_level__c'] !== undefined && record['floor_level__c'] !== null) {
            floor = Math.floor(record['floor_level__c']); // 轉換為整數
        }
        
        // 戶別從 customer_type__c 讀取
        if (record['customer_type__c']) {
            unit = record['customer_type__c'];
        }
        
        // 從對應單據中提取更多建築資訊
        if (record['corresponding_ticket__c__r']) {
            const ticketInfo = record['corresponding_ticket__c__r'];
            if (ticketInfo.includes('B棟')) {
                building = 'B棟';
                if (ticketInfo.includes('F')) {
                    const floorMatch = ticketInfo.match(/(\d+)F/);
                    if (floorMatch) {
                        floor = parseInt(floorMatch[1]);
                    }
                }
            }
        }
        
        if (building) {
            if (!buildings[building]) {
                buildings[building] = {
                    name: building,
                    floors: new Set(),
                    units: new Set(),
                    records: []
                };
            }
            
            if (floor !== null && floor !== undefined) {
                buildings[building].floors.add(floor);
            }
            
            if (unit) {
                buildings[building].units.add(unit);
            }
            
            buildings[building].records.push(record);
        }
    });
    
    // 轉換為最終格式
    const result = {};
    Object.keys(buildings).forEach(buildingName => {
        const building = buildings[buildingName];
        result[buildingName] = {
            name: building.name,
            floors: Array.from(building.floors).sort((a, b) => b - a),
            units: Array.from(building.units).sort(),
            totalRecords: building.records.length,
            totalFloors: building.floors.size,
            totalUnits: building.units.size
        };
    });
    
    return result;
}

// 分析工班配置
function analyzeContractors(records) {
    const contractors = {};
    
    records.forEach(record => {
        // 使用正確的工班欄位 shift_time__c
        let contractor = record['shift_time__c'];
        
        if (contractor) {
            if (!contractors[contractor]) {
                contractors[contractor] = {
                    name: contractor,
                    buildings: new Set(),
                    floors: new Set(),
                    records: []
                };
            }
            
            // 記錄工班負責的建築和樓層
            if (record['building_type__c']) {
                contractors[contractor].buildings.add(record['building_type__c'] + '棟');
            }
            
            if (record['floor_level__c'] !== undefined && record['floor_level__c'] !== null) {
                contractors[contractor].floors.add(Math.floor(record['floor_level__c']));
            }
            
            contractors[contractor].records.push(record);
        }
    });
    
    // 轉換為最終格式
    const result = {};
    Object.keys(contractors).forEach(contractorName => {
        const contractor = contractors[contractorName];
        result[contractorName] = {
            name: contractor.name,
            buildings: Array.from(contractor.buildings).sort(),
            floors: Array.from(contractor.floors).sort((a, b) => a - b),
            totalRecords: contractor.records.length,
            floorRange: contractor.floors.size > 0 ? 
                `${Math.min(...contractor.floors)}-${Math.max(...contractor.floors)}樓` : '未知'
        };
    });
    
    return result;
}

// 執行讀取
readRepairData();