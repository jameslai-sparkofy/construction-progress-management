#!/usr/bin/env node

/**
 * 使用現有案場記錄測試 CRM 更新
 */

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4", 
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com",
    mobile: "17675662629"
};

async function testExistingSiteUpdate() {
    console.log('🧪 使用現有案場記錄測試 CRM 更新...\n');
    
    try {
        // 1. 獲取 Token
        console.log('🔐 步驟 1: 獲取 CRM Token');
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
            throw new Error(`獲取 token 失敗: ${tokenResult.errorMessage}`);
        }

        const { corpAccessToken: token, corpId } = tokenResult;
        console.log('✅ Token 獲取成功');

        // 2. 獲取用戶信息
        const userResponse = await fetch(`${CONFIG.baseUrl}/cgi/user/getByMobile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                mobile: CONFIG.mobile
            })
        });

        const userResult = await userResponse.json();
        if (userResult.errorCode !== 0) {
            throw new Error(`獲取用戶失敗: ${userResult.errorMessage}`);
        }

        const userId = userResult.empList[0].openUserId;
        console.log('✅ 用戶信息獲取成功');

        // 3. 直接更新指定的案場記錄
        const siteId = "6621c7a2eb4c7f0001817f67"; // 之前測試成功的 ID
        
        console.log(`📝 步驟 3: 更新案場記錄 ${siteId}`);
        
        // 使用正確的欄位對應關係和資料格式
        const updateData = {
            // 施工進度相關欄位
            construction_completed__c: true, // 施工完成
            field_B2gh1__c: 28.5, // 舖設坪數
            field_23pFq__c: new Date("2025-07-24").getTime(), // 施工日期 (時間戳格式)
            field_u1wpv__c: "測試工班師父-完整對應", // 工班師父
            field_sF6fn__c: "測試施工前備註-三層對應驗證", // 施工前備註
            field_WD7k1__c: "A棟", // 棟別
            field_Q6Svh__c: 3, // 樓層
            field_XuJP2__c: "301", // 戶別
        };

        const updateResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpAccessToken: token,
                corpId: corpId,
                currentOpenUserId: userId,
                data: {
                    object_data: {
                        dataObjectApiName: "object_8W9cb__c",
                        _id: siteId,
                        ...updateData
                    }
                },
                triggerWorkFlow: false
            })
        });

        const updateResult = await updateResponse.json();
        console.log('CRM 更新結果:', JSON.stringify(updateResult, null, 2));

        if (updateResult.errorCode === 0) {
            console.log('✅ 案場記錄更新成功！');
            console.log('\n📊 更新的欄位對應:');
            console.log(`- construction_completed__c: ${updateData.construction_completed__c} (施工完成)`);
            console.log(`- field_B2gh1__c: ${updateData.field_B2gh1__c} (舖設坪數)`);
            console.log(`- field_23pFq__c: ${updateData.field_23pFq__c} (施工日期)`);
            console.log(`- field_u1wpv__c: ${updateData.field_u1wpv__c} (工班師父)`);
            console.log(`- field_sF6fn__c: ${updateData.field_sF6fn__c} (施工前備註)`);
            console.log(`- field_WD7k1__c: ${updateData.field_WD7k1__c} (棟別)`);
            console.log(`- field_Q6Svh__c: ${updateData.field_Q6Svh__c} (樓層)`);
            console.log(`- field_XuJP2__c: ${updateData.field_XuJP2__c} (戶別)`);
            
            console.log('\n🎉 三層欄位對應測試成功！');
        } else {
            console.log('❌ 更新失敗:', updateResult.errorMessage);
        }

    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

testExistingSiteUpdate();