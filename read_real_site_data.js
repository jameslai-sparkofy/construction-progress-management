// 真正讀取"勝興-興安西-2024"商機的案場資料
const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function readRealSiteData() {
    console.log('=== 讀取真實的"勝興-興安西-2024"案場資料 ===\n');
    
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
        
        // Step 3: 查找"勝興-興安西-2024"商機
        console.log('3. 查找"勝興-興安西-2024"商機...');
        const targetOpportunity = await findTargetOpportunity(token, corpId, userId);
        
        if (!targetOpportunity) {
            console.log('❌ 找不到"勝興-興安西-2024"商機');
            return;
        }
        
        console.log(`✅ 找到目標商機: ${targetOpportunity.name} (ID: ${targetOpportunity._id})\n`);
        
        // Step 4: 讀取該商機相關的維修單資料
        console.log('4. 讀取該商機的維修單資料...');
        const repairOrders = await getRepairOrdersByOpportunity(token, corpId, userId, targetOpportunity._id);
        
        if (repairOrders.length === 0) {
            console.log('❌ 該商機沒有相關的維修單資料');
            return;
        }
        
        console.log(`✅ 找到 ${repairOrders.length} 條維修單記錄\n`);
        
        // Step 5: 分析建築結構
        console.log('5. 分析建築結構...');
        const buildingStructure = analyzeBuildingStructure(repairOrders);
        console.log('建築結構分析結果:');
        console.log(JSON.stringify(buildingStructure, null, 2));
        
        // Step 6: 分析工班配置
        console.log('\n6. 分析工班配置...');
        const contractorAnalysis = analyzeContractors(repairOrders);
        console.log('工班配置分析結果:');
        console.log(JSON.stringify(contractorAnalysis, null, 2));
        
        // Step 7: 讀取案場對象資料
        console.log('\n7. 讀取案場對象資料...');
        const siteObjects = await getSiteObjects(token, corpId, userId);
        console.log(`案場對象資料: ${siteObjects.length} 條記錄`);
        
        // Step 8: 生成完整的案場配置
        console.log('\n8. 生成完整的案場配置...');
        const siteConfig = generateSiteConfig(targetOpportunity, buildingStructure, contractorAnalysis, repairOrders);
        console.log('=== 完整案場配置 ===');
        console.log(JSON.stringify(siteConfig, null, 2));
        
        // Step 9: 輸出JavaScript格式的配置
        console.log('\n9. 輸出JavaScript配置...');
        outputJavaScriptConfig(siteConfig);
        
    } catch (error) {
        console.error('❌ 讀取失敗:', error.message);
    }
}

// 查找目標商機
async function findTargetOpportunity(token, corpId, userId) {
    console.log('搜尋商機列表...');
    
    // 嘗試不同的API格式
    const apiFormats = [
        {
            name: '標準商機查詢',
            endpoint: '/cgi/crm/data/query',
            body: {
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                apiName: "crm.data.query",
                searchQuery: {
                    dataType: "OpportunityObj",
                    search_query_info: {
                        limit: 100,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            }
        },
        {
            name: 'V2商機查詢',
            endpoint: '/cgi/crm/v2/data/query',
            body: {
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                apiName: "crm.v2.data.query",
                searchQuery: {
                    dataType: "OpportunityObj",
                    search_query_info: {
                        limit: 100,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            }
        }
    ];
    
    for (const format of apiFormats) {
        try {
            console.log(`嘗試${format.name}...`);
            
            const response = await fetch(`${CONFIG.baseUrl}${format.endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(format.body)
            });
            
            const result = await response.json();
            console.log(`${format.name}響應:`, JSON.stringify(result, null, 2));
            
            if (result.errorCode === 0 && result.data?.dataList) {
                console.log(`✅ ${format.name}成功！找到 ${result.data.dataList.length} 個商機`);
                
                // 顯示所有商機
                console.log('\n所有商機列表:');
                result.data.dataList.forEach((opp, index) => {
                    console.log(`${index + 1}. ${opp.name || '未命名'} (ID: ${opp._id})`);
                });
                
                // 尋找目標商機
                const target = result.data.dataList.find(opp => 
                    opp.name && (
                        opp.name.includes('勝興') && opp.name.includes('興安西') && opp.name.includes('2024')
                    )
                );
                
                if (target) {
                    console.log(`\n✅ 找到目標商機: ${target.name}`);
                    return target;
                } else {
                    console.log('\n⚠️ 在商機列表中未找到"勝興-興安西-2024"');
                    // 繼續嘗試下一個格式
                }
            } else {
                console.log(`❌ ${format.name}失敗: ${result.errorMessage}`);
            }
        } catch (error) {
            console.log(`❌ ${format.name}錯誤: ${error.message}`);
        }
    }
    
    return null;
}

// 根據商機ID獲取維修單
async function getRepairOrdersByOpportunity(token, corpId, userId, opportunityId) {
    console.log(`查詢商機 ${opportunityId} 的維修單...`);
    
    try {
        const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    dataObjectApiName: "on_site_signature__c",
                    search_query_info: {
                        limit: 500, // 增加限制以獲取更多資料
                        offset: 0,
                        filters: [
                            {
                                field_name: "opportunity_id",
                                field_values: [opportunityId],
                                operator: "EQ"
                            }
                        ],
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const result = await response.json();
        console.log('維修單查詢響應:', JSON.stringify(result, null, 2));
        
        if (result.errorCode === 0 && result.data?.dataList) {
            console.log(`✅ 維修單查詢成功！獲取到 ${result.data.dataList.length} 條記錄`);
            
            // 顯示第一條記錄的所有欄位
            if (result.data.dataList.length > 0) {
                console.log('\n第一條維修單的所有欄位:');
                const firstOrder = result.data.dataList[0];
                Object.keys(firstOrder).forEach(key => {
                    console.log(`  ${key}:`, firstOrder[key]);
                });
            }
            
            return result.data.dataList;
        } else {
            console.log(`❌ 維修單查詢失敗: ${result.errorMessage}`);
            return [];
        }
    } catch (error) {
        console.log(`❌ 維修單查詢錯誤: ${error.message}`);
        return [];
    }
}

// 分析建築結構
function analyzeBuildingStructure(repairOrders) {
    console.log('分析建築結構中...');
    
    const buildings = {};
    
    repairOrders.forEach(order => {
        // 嘗試多種可能的欄位名稱
        const buildingFields = ['building', 'building_name', 'tower', 'dongbie', '棟別', 'field_building'];
        const floorFields = ['floor', 'floor_number', 'level', 'cengsu', '層數', 'field_floor'];
        const unitFields = ['unit', 'unit_number', 'room', 'hubie', '戶別', 'field_unit'];
        
        let building = null;
        let floor = null;
        let unit = null;
        
        // 尋找建築名稱
        for (const field of buildingFields) {
            if (order[field]) {
                building = order[field];
                break;
            }
        }
        
        // 尋找樓層
        for (const field of floorFields) {
            if (order[field] !== undefined && order[field] !== null) {
                floor = order[field];
                break;
            }
        }
        
        // 尋找戶別
        for (const field of unitFields) {
            if (order[field]) {
                unit = order[field];
                break;
            }
        }
        
        console.log(`記錄分析: 建築=${building}, 樓層=${floor}, 戶別=${unit}`);
        
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
            
            buildings[building].records.push(order);
        }
    });
    
    // 轉換Set為排序的陣列
    const result = {};
    Object.keys(buildings).forEach(buildingName => {
        const building = buildings[buildingName];
        result[buildingName] = {
            name: building.name,
            floors: Array.from(building.floors).sort((a, b) => b - a), // 從高到低排序
            units: Array.from(building.units).sort(),
            totalRecords: building.records.length,
            totalFloors: building.floors.size,
            totalUnits: building.units.size
        };
    });
    
    return result;
}

// 分析工班配置
function analyzeContractors(repairOrders) {
    console.log('分析工班配置中...');
    
    const contractors = {};
    
    repairOrders.forEach(order => {
        // 嘗試多種可能的工班欄位
        const contractorFields = [
            'contractor', 'contractor_name', 'work_team', 'construction_team', 
            'gongban', '工班', 'field_contractor', 'team_name'
        ];
        
        const buildingFields = ['building', 'building_name', 'tower', 'dongbie', '棟別'];
        const floorFields = ['floor', 'floor_number', 'level', 'cengsu', '層數'];
        
        let contractor = null;
        let building = null;
        let floor = null;
        
        // 尋找工班名稱
        for (const field of contractorFields) {
            if (order[field]) {
                contractor = order[field];
                break;
            }
        }
        
        // 尋找建築和樓層
        for (const field of buildingFields) {
            if (order[field]) {
                building = order[field];
                break;
            }
        }
        
        for (const field of floorFields) {
            if (order[field] !== undefined && order[field] !== null) {
                floor = order[field];
                break;
            }
        }
        
        if (contractor) {
            if (!contractors[contractor]) {
                contractors[contractor] = {
                    name: contractor,
                    buildings: new Set(),
                    floors: new Set(),
                    records: []
                };
            }
            
            if (building) {
                contractors[contractor].buildings.add(building);
            }
            
            if (floor !== null && floor !== undefined) {
                contractors[contractor].floors.add(floor);
            }
            
            contractors[contractor].records.push(order);
        }
    });
    
    // 整理工班配置
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

// 獲取案場對象資料
async function getSiteObjects(token, corpId, userId) {
    console.log('查詢案場對象資料...');
    
    try {
        const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
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
        
        const result = await response.json();
        console.log('案場對象查詢響應:', JSON.stringify(result, null, 2));
        
        if (result.errorCode === 0 && result.data?.dataList) {
            return result.data.dataList;
        } else {
            console.log(`❌ 案場對象查詢失敗: ${result.errorMessage}`);
            return [];
        }
    } catch (error) {
        console.log(`❌ 案場對象查詢錯誤: ${error.message}`);
        return [];
    }
}

// 生成完整的案場配置
function generateSiteConfig(opportunity, buildingStructure, contractorAnalysis, repairOrders) {
    return {
        site: {
            id: opportunity._id,
            name: opportunity.name,
            totalBuildings: Object.keys(buildingStructure).length,
            totalRecords: repairOrders.length
        },
        buildings: buildingStructure,
        contractors: contractorAnalysis,
        summary: {
            buildingList: Object.keys(buildingStructure),
            contractorList: Object.keys(contractorAnalysis),
            totalFloors: Object.values(buildingStructure).reduce((sum, b) => sum + b.totalFloors, 0),
            totalUnits: Object.values(buildingStructure).reduce((sum, b) => sum + b.totalUnits, 0)
        }
    };
}

// 輸出JavaScript配置
function outputJavaScriptConfig(siteConfig) {
    const jsConfig = `
// 勝興-興安西-2024 真實案場配置
const REAL_SITE_CONFIG = ${JSON.stringify(siteConfig, null, 2)};

// 建築列表
const BUILDINGS = [${siteConfig.summary.buildingList.map(b => `"${b}"`).join(', ')}];

// 工班列表  
const CONTRACTORS = [${siteConfig.summary.contractorList.map(c => `"${c}"`).join(', ')}];

// 建築詳細配置
const BUILDING_DETAILS = {
${Object.entries(siteConfig.buildings).map(([name, building]) => `
  "${name}": {
    floors: [${building.floors.join(', ')}],
    units: [${building.units.map(u => `"${u}"`).join(', ')}],
    totalRecords: ${building.totalRecords}
  }`).join(',\n')}
};

// 工班詳細配置
const CONTRACTOR_DETAILS = {
${Object.entries(siteConfig.contractors).map(([name, contractor]) => `
  "${name}": {
    buildings: [${contractor.buildings.map(b => `"${b}"`).join(', ')}],
    floorRange: "${contractor.floorRange}",
    totalRecords: ${contractor.totalRecords}
  }`).join(',\n')}
};

console.log('真實案場配置載入完成:', REAL_SITE_CONFIG);
`;
    
    console.log(jsConfig);
    
    // 也寫入檔案
    require('fs').writeFileSync('real_site_config.js', jsConfig, 'utf8');
    console.log('\n✅ 配置已寫入 real_site_config.js 檔案');
}

// 執行讀取
readRealSiteData();