// 獲取真實 CRM 數據 - 使用已驗證的方法
const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function getAllCRMData() {
    console.log('🚀 開始獲取真實 CRM 數據...\n');
    
    try {
        // Step 1: 獲取 Token 和用戶信息
        const auth = await getAuthInfo();
        if (!auth.success) {
            throw new Error(auth.error);
        }
        
        const { token, corpId, userId } = auth;
        console.log('✅ 認證成功\n');
        
        // Step 2: 獲取所有數據
        console.log('📊 開始獲取各類數據...\n');
        
        // 1. 商機數據
        console.log('1️⃣ 獲取商機數據...');
        const opportunities = await getOpportunities(token, corpId, userId);
        
        // 2. 銷售記錄（跟進記錄）
        console.log('2️⃣ 獲取銷售記錄...');
        const salesRecords = await getSalesRecords(token, corpId, userId);
        
        // 3. 案場數據
        console.log('3️⃣ 獲取案場數據...');
        const sites = await getSites(token, corpId, userId);
        
        // 4. 維修單數據
        console.log('4️⃣ 獲取維修單數據...');
        const maintenanceOrders = await getMaintenanceOrders(token, corpId, userId);
        
        // 輸出結果
        console.log('\n🎯 數據獲取完成！');
        console.log('='.repeat(50));
        
        console.log(`\n📋 商機數據: ${opportunities.length} 條`);
        if (opportunities.length > 0) {
            opportunities.slice(0, 3).forEach((opp, idx) => {
                console.log(`  ${idx + 1}. ${opp.name || '未命名'} (${opp._id})`);
            });
        }
        
        console.log(`\n💼 銷售記錄: ${salesRecords.length} 條`);
        if (salesRecords.length > 0) {
            console.log(`  最近記錄: ${salesRecords[0].content || '無內容'}`);
        }
        
        console.log(`\n🏗️ 案場數據: ${sites.length} 條`);
        if (sites.length > 0) {
            sites.slice(0, 3).forEach((site, idx) => {
                console.log(`  ${idx + 1}. ${site.name || '未命名'} (${site._id})`);
            });
        }
        
        console.log(`\n🔧 維修單數據: ${maintenanceOrders.length} 條`);
        if (maintenanceOrders.length > 0) {
            console.log(`  最近維修單: ${maintenanceOrders[0].issue || '無問題描述'}`);
        }
        
        // 保存到文件
        const allData = {
            timestamp: new Date().toISOString(),
            opportunities,
            salesRecords,
            sites,
            maintenanceOrders
        };
        
        require('fs').writeFileSync('real-crm-data.json', JSON.stringify(allData, null, 2));
        console.log('\n💾 數據已保存到 real-crm-data.json');
        
        return allData;
        
    } catch (error) {
        console.error('❌ 獲取 CRM 數據失敗:', error.message);
        return null;
    }
}

async function getAuthInfo() {
    try {
        // 獲取 Token
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
            return { success: false, error: `Token 獲取失敗: ${tokenResult.errorMessage}` };
        }
        
        // 獲取用戶信息
        const userResponse = await fetch(`${CONFIG.baseUrl}/cgi/user/getByMobile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: tokenResult.corpId,
                corpAccessToken: tokenResult.corpAccessToken,
                mobile: "17675662629"
            })
        });
        
        const userResult = await userResponse.json();
        if (userResult.errorCode !== 0) {
            return { success: false, error: `用戶獲取失敗: ${userResult.errorMessage}` };
        }
        
        return {
            success: true,
            token: tokenResult.corpAccessToken,
            corpId: tokenResult.corpId,
            userId: userResult.empList[0].openUserId
        };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getOpportunities(token, corpId, userId) {
    try {
        // 根據之前的測試記錄，使用這個格式
        const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/data/query`, {
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
        
        const result = await response.json();
        console.log(`   API 響應: ${result.errorCode === 0 ? '✅ 成功' : '❌ ' + result.errorMessage}`);
        
        if (result.errorCode === 0) {
            console.log(`   獲取到 ${result.data?.dataList?.length || 0} 個商機`);
            return result.data?.dataList || [];
        } else {
            console.log(`   錯誤: ${result.errorMessage}`);
            return [];
        }
        
    } catch (error) {
        console.log(`   ❌ 請求失敗: ${error.message}`);
        return [];
    }
}

async function getSalesRecords(token, corpId, userId) {
    try {
        const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                apiName: "crm.data.query",
                data: {
                    dataType: "ActiveRecordObj",
                    search_query_info: {
                        limit: 100,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const result = await response.json();
        console.log(`   API 響應: ${result.errorCode === 0 ? '✅ 成功' : '❌ ' + result.errorMessage}`);
        
        if (result.errorCode === 0) {
            console.log(`   獲取到 ${result.data?.dataList?.length || 0} 條銷售記錄`);
            return result.data?.dataList || [];
        } else {
            console.log(`   錯誤: ${result.errorMessage}`);
            return [];
        }
        
    } catch (error) {
        console.log(`   ❌ 請求失敗: ${error.message}`);
        return [];
    }
}

async function getSites(token, corpId, userId) {
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
                        limit: 50,
                        offset: 0,
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const result = await response.json();
        console.log(`   API 響應: ${result.errorCode === 0 ? '✅ 成功' : '❌ ' + result.errorMessage}`);
        
        if (result.errorCode === 0) {
            console.log(`   獲取到 ${result.data?.dataList?.length || 0} 個案場`);
            return result.data?.dataList || [];
        } else {
            console.log(`   錯誤: ${result.errorMessage}`);
            return [];
        }
        
    } catch (error) {
        console.log(`   ❌ 請求失敗: ${error.message}`);
        return [];
    }
}

async function getMaintenanceOrders(token, corpId, userId) {
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
        console.log(`   API 響應: ${result.errorCode === 0 ? '✅ 成功' : '❌ ' + result.errorMessage}`);
        
        if (result.errorCode === 0) {
            console.log(`   獲取到 ${result.data?.dataList?.length || 0} 條維修單`);
            return result.data?.dataList || [];
        } else {
            console.log(`   錯誤: ${result.errorMessage}`);
            return [];
        }
        
    } catch (error) {
        console.log(`   ❌ 請求失敗: ${error.message}`);
        return [];
    }
}

// 執行獲取
getAllCRMData().then(data => {
    if (data) {
        console.log('\n🎉 所有 CRM 數據獲取完成！');
    } else {
        console.log('\n💥 數據獲取失敗！');
    }
}).catch(error => {
    console.error('執行錯誤:', error);
});