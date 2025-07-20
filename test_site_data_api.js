// 測試案場和工班資料API
const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function testSiteDataAPI() {
    console.log('=== 測試案場和工班資料API ===\n');
    
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
        
        // Step 3: 查詢商機資料（案場資料）
        console.log('3. 查詢商機資料（案場資料）...');
        const opportunityResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                apiName: "crm.data.query",
                data: {
                    dataType: "OpportunityObj",
                    search_query_info: {
                        limit: 20,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const opportunityResult = await opportunityResponse.json();
        console.log('商機查詢響應:', JSON.stringify(opportunityResult, null, 2));
        
        if (opportunityResult.errorCode === 0) {
            console.log(`✅ 商機資料查詢成功！獲取到 ${opportunityResult.data?.dataList?.length || 0} 個案場`);
            
            if (opportunityResult.data?.dataList?.length > 0) {
                console.log('\n案場列表:');
                opportunityResult.data.dataList.forEach((site, index) => {
                    console.log(`${index + 1}. ${site.name || '未命名案場'} (ID: ${site._id})`);
                });
                
                // 找到"勝興-興安西-2023"案場
                const targetSite = opportunityResult.data.dataList.find(site => 
                    site.name && site.name.includes('勝興') && site.name.includes('興安西')
                );
                
                if (targetSite) {
                    console.log(`\n✅ 找到目標案場: ${targetSite.name}`);
                    console.log('案場詳細資料:');
                    Object.keys(targetSite).forEach(key => {
                        if (key !== '_id') {
                            console.log(`  ${key}:`, targetSite[key]);
                        }
                    });
                    
                    // 查詢該案場的相關資料
                    await queryRelatedSiteData(targetSite, token, corpId, userId);
                } else {
                    console.log('\n⚠️ 未找到"勝興-興安西-2023"案場');
                }
            }
        } else {
            console.log(`❌ 商機資料查詢失敗: ${opportunityResult.errorMessage}`);
        }
        
        // Step 4: 查詢維修單資料（工程進度）
        console.log('\n4. 查詢維修單資料（工程進度）...');
        await queryRepairOrderData(token, corpId, userId);
        
        // Step 5: 查詢案場資料（自定義對象）
        console.log('\n5. 查詢案場資料（自定義對象）...');
        await querySiteObjectData(token, corpId, userId);
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

// 查詢案場相關資料
async function queryRelatedSiteData(site, token, corpId, userId) {
    console.log('\n=== 查詢案場相關資料 ===');
    
    try {
        // 查詢該案場的維修單
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
                        limit: 50,
                        offset: 0,
                        filters: [
                            {
                                field_name: "opportunity_id",
                                field_values: [site._id],
                                operator: "EQ"
                            }
                        ],
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const repairResult = await repairResponse.json();
        console.log('該案場維修單查詢結果:', JSON.stringify(repairResult, null, 2));
        
        if (repairResult.errorCode === 0) {
            console.log(`✅ 找到該案場的維修單 ${repairResult.data?.dataList?.length || 0} 條`);
            
            if (repairResult.data?.dataList?.length > 0) {
                // 分析維修單資料結構
                console.log('\n維修單資料結構分析:');
                const firstRepair = repairResult.data.dataList[0];
                console.log('第一條維修單的欄位:');
                Object.keys(firstRepair).forEach(key => {
                    console.log(`  ${key}:`, firstRepair[key]);
                });
                
                // 提取建築/樓層/戶別資訊
                console.log('\n建築資訊提取:');
                const buildingInfo = extractBuildingInfo(repairResult.data.dataList);
                console.log('建築統計:', buildingInfo);
            }
        }
        
    } catch (error) {
        console.error('案場相關資料查詢失敗:', error.message);
    }
}

// 查詢維修單資料
async function queryRepairOrderData(token, corpId, userId) {
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
                        limit: 100,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const result = await response.json();
        console.log('維修單查詢結果:', JSON.stringify(result, null, 2));
        
        if (result.errorCode === 0) {
            console.log(`✅ 維修單資料查詢成功！獲取到 ${result.data?.dataList?.length || 0} 條記錄`);
            
            if (result.data?.dataList?.length > 0) {
                // 分析工班資訊
                console.log('\n工班資訊分析:');
                const contractorInfo = extractContractorInfo(result.data.dataList);
                console.log('工班統計:', contractorInfo);
                
                // 分析建築資訊
                console.log('\n建築資訊分析:');
                const buildingInfo = extractBuildingInfo(result.data.dataList);
                console.log('建築統計:', buildingInfo);
            }
        }
    } catch (error) {
        console.error('維修單資料查詢失敗:', error.message);
    }
}

// 查詢案場對象資料
async function querySiteObjectData(token, corpId, userId) {
    try {
        const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    dataObjectApiName: "object_8W9cb__c", // 案場對象
                    search_query_info: {
                        limit: 50,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const result = await response.json();
        console.log('案場對象查詢結果:', JSON.stringify(result, null, 2));
        
        if (result.errorCode === 0) {
            console.log(`✅ 案場對象資料查詢成功！獲取到 ${result.data?.dataList?.length || 0} 條記錄`);
            
            if (result.data?.dataList?.length > 0) {
                console.log('\n案場對象資料:');
                result.data.dataList.forEach((site, index) => {
                    console.log(`${index + 1}. ${site.name || '未命名'} (ID: ${site._id})`);
                });
            }
        }
    } catch (error) {
        console.error('案場對象資料查詢失敗:', error.message);
    }
}

// 提取工班資訊
function extractContractorInfo(repairOrders) {
    const contractors = {};
    
    repairOrders.forEach(order => {
        // 檢查可能的工班欄位
        const contractorFields = ['contractor', 'contractor_name', 'work_team', 'construction_team'];
        
        contractorFields.forEach(field => {
            if (order[field]) {
                const contractorName = order[field];
                if (!contractors[contractorName]) {
                    contractors[contractorName] = {
                        name: contractorName,
                        count: 0,
                        orders: []
                    };
                }
                contractors[contractorName].count++;
                contractors[contractorName].orders.push(order._id);
            }
        });
    });
    
    return contractors;
}

// 提取建築資訊
function extractBuildingInfo(repairOrders) {
    const buildings = {};
    const floors = new Set();
    const units = new Set();
    
    repairOrders.forEach(order => {
        // 檢查可能的建築欄位
        const buildingFields = ['building', 'building_name', 'tower'];
        const floorFields = ['floor', 'floor_number', 'level'];
        const unitFields = ['unit', 'unit_number', 'room'];
        
        buildingFields.forEach(field => {
            if (order[field]) {
                const buildingName = order[field];
                if (!buildings[buildingName]) {
                    buildings[buildingName] = { name: buildingName, count: 0 };
                }
                buildings[buildingName].count++;
            }
        });
        
        floorFields.forEach(field => {
            if (order[field]) {
                floors.add(order[field]);
            }
        });
        
        unitFields.forEach(field => {
            if (order[field]) {
                units.add(order[field]);
            }
        });
    });
    
    return {
        buildings: buildings,
        floors: Array.from(floors).sort((a, b) => b - a),
        units: Array.from(units).sort(),
        totalBuildings: Object.keys(buildings).length,
        totalFloors: floors.size,
        totalUnits: units.size
    };
}

// 執行測試
testSiteDataAPI();