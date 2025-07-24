#!/usr/bin/env node

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4", 
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com",
    mobile: "17675662629"
};

async function updateSiteField() {
    try {
        console.log("🔐 獲取企業訪問令牌...");
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
        console.log("Token 結果:", tokenResult);
        
        if (tokenResult.errorCode !== 0) {
            throw new Error(`獲取 token 失敗: ${tokenResult.errorMessage}`);
        }

        const { corpAccessToken: token, corpId } = tokenResult;

        console.log("👤 獲取用戶信息...");
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
        console.log("用戶結果:", userResult);
        
        if (userResult.errorCode !== 0) {
            throw new Error(`獲取用戶失敗: ${userResult.errorMessage}`);
        }

        const userId = userResult.empList[0].openUserId;

        console.log("📝 更新案場 field_u1wpv__c 為 TEST...");
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
                        _id: "6621c7a2eb4c7f0001817f67",
                        field_u1wpv__c: "TEST"
                    }
                },
                triggerWorkFlow: false
            })
        });

        const updateResult = await updateResponse.json();
        console.log("更新結果:", JSON.stringify(updateResult, null, 2));

        if (updateResult.errorCode === 0) {
            console.log("✅ 成功更新案場 ID: 6621c7a2eb4c7f0001817f67");
            console.log("✅ field_u1wpv__c 已設定為: TEST");
        } else {
            console.log("❌ 更新失敗:", updateResult.errorMessage);
        }

    } catch (error) {
        console.error("❌ 執行錯誤:", error.message);
    }
}

updateSiteField();