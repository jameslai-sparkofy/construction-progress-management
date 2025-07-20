// 完整讀取勝興-興安西-2024的案場和維修單資料
const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function readComplete2024Data() {
    console.log('=== 完整讀取勝興-興安西-2024資料 ===\n');
    
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
        
        // Step 3: 查詢案場資料（object_8W9cb__c）
        console.log('3. 查詢案場資料...');
        const siteResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    dataObjectApiName: "object_8W9cb__c",
                    search_query_info: {
                        limit: 100,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const siteResult = await siteResponse.json();
        
        if (siteResult.errorCode !== 0) {
            throw new Error(`案場查詢失敗: ${siteResult.errorMessage}`);
        }
        
        console.log(`✅ 案場資料查詢成功！獲取到 ${siteResult.data.dataList.length} 條記錄\n`);
        
        // Step 4: 篩選勝興-興安西-2024相關案場
        console.log('4. 篩選勝興-興安西-2024相關案場...');
        const targetSites = siteResult.data.dataList.filter(site => {
            // 使用 field_1P96q__c 欄位檢查商機
            if (site['field_1P96q__c'] && site['field_1P96q__c'].includes('勝興-興安西-2024')) {
                return true;
            }
            // 也檢查其他可能包含商機名稱的欄位
            const possibleFields = ['name', 'opportunity_name', 'project_name'];
            for (const field of possibleFields) {
                if (site[field] && typeof site[field] === 'string') {
                    if (site[field].includes('勝興') && site[field].includes('興安西') && site[field].includes('2024')) {
                        return true;
                    }
                }
            }
            return false;
        });
        
        console.log(`找到 ${targetSites.length} 個勝興-興安西-2024相關案場\n`);
        
        if (targetSites.length > 0) {
            console.log('案場詳細資訊:');
            targetSites.forEach((site, index) => {
                console.log(`\n案場 ${index + 1} (${site._id}):`);
                console.log(`  名稱: ${site.name}`);
                console.log(`  商機: ${site.field_1P96q__c || '未知'}`);
                console.log(`  工班: ${site.shift_time__c || '未知'}`);
                console.log('  關鍵欄位:');
                Object.keys(site).forEach(key => {
                    if (site[key] !== null && site[key] !== undefined && site[key] !== '' && 
                        !key.includes('__l') && !key.includes('__r') && 
                        !['_id', 'create_time', 'last_modified_time', 'owner', 'created_by', 'last_modified_by'].includes(key)) {
                        console.log(`    ${key}: ${site[key]}`);
                    }
                });
            });
        }
        
        // Step 5: 查詢維修單資料
        console.log('\n5. 查詢維修單資料...');
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
        
        // Step 6: 篩選勝興-興安西-2024相關維修單
        console.log('6. 篩選勝興-興安西-2024相關維修單...');
        const targetRepairs = repairResult.data.dataList.filter(record => {
            if (record['opportunity__c__r'] && record['opportunity__c__r'].includes('勝興-興安西-2024')) {
                return true;
            }
            return false;
        });
        
        console.log(`找到 ${targetRepairs.length} 條勝興-興安西-2024相關維修單\n`);
        
        // Step 7: 分析建築結構
        console.log('7. 分析建築結構...');
        const buildingAnalysis = analyzeBuildingStructure(targetRepairs);
        console.log('建築結構:');
        console.log(JSON.stringify(buildingAnalysis, null, 2));
        
        // Step 8: 分析工班配置
        console.log('\n8. 分析工班配置...');
        const contractorAnalysis = analyzeContractors(targetRepairs);
        console.log('工班配置:');
        console.log(JSON.stringify(contractorAnalysis, null, 2));
        
        // Step 9: 生成完整配置
        const completeConfig = {
            site: {
                name: "勝興-興安西-2024",
                totalSites: targetSites.length,
                totalRepairOrders: targetRepairs.length
            },
            sites: targetSites.map(site => ({
                id: site._id,
                name: site.name,
                opportunity: site.field_1P96q__c,
                contractor: site.shift_time__c
            })),
            buildings: buildingAnalysis,
            contractors: contractorAnalysis
        };
        
        console.log('\n9. 完整配置:');
        console.log(JSON.stringify(completeConfig, null, 2));
        
        // 寫入檔案
        const fs = require('fs');
        const configContent = `
// 勝興-興安西-2024 完整真實資料配置
// 生成時間: ${new Date().toLocaleString()}

const COMPLETE_SITE_CONFIG_2024 = ${JSON.stringify(completeConfig, null, 2)};

// 建築列表
const BUILDINGS = [${Object.keys(buildingAnalysis).map(b => `"${b}"`).join(', ')}];

// 工班列表  
const CONTRACTORS = [${Object.keys(contractorAnalysis).map(c => `"${c}"`).join(', ')}];

console.log('勝興-興安西-2024完整配置載入完成');
`;
        
        fs.writeFileSync('勝興-興安西-2024-complete-config.js', configContent, 'utf8');
        console.log('\n✅ 完整配置已寫入 勝興-興安西-2024-complete-config.js 檔案');
        
    } catch (error) {
        console.error('❌ 讀取失敗:', error.message);
    }
}

// 分析建築結構
function analyzeBuildingStructure(records) {
    const buildings = {};
    
    records.forEach(record => {
        let building = null;
        let floor = null;
        let unit = null;
        
        // 建築類型從 building_type__c 讀取
        if (record['building_type__c']) {
            building = record['building_type__c'] + '棟';
        }
        
        // 樓層從 floor_level__c 讀取
        if (record['floor_level__c'] !== undefined && record['floor_level__c'] !== null) {
            floor = Math.floor(record['floor_level__c']);
        }
        
        // 戶別從 customer_type__c 讀取
        if (record['customer_type__c']) {
            unit = record['customer_type__c'];
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
readComplete2024Data();