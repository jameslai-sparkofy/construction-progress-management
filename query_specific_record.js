#!/usr/bin/env node

/**
 * 查詢特定記錄的圖片欄位格式
 */

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4", 
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com",
    mobile: "17675662629"
};

async function querySpecificRecord() {
    console.log('🔍 查詢特定記錄的詳細信息...\n');
    
    try {
        // 1. 獲取 Token
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
        const { corpAccessToken: token, corpId } = tokenResult;

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
        const userId = userResult.empList[0].openUserId;

        // 3. 使用 detail API 查詢特定記錄
        console.log('📋 使用 detail API 查詢記錄...');
        const siteId = "6621c7a2eb4c7f0001817f67";
        
        const detailResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/detail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    dataObjectApiName: "object_8W9cb__c",
                    dataId: siteId
                }
            })
        });

        const detailResult = await detailResponse.json();
        console.log('記錄詳情:', JSON.stringify(detailResult, null, 2));
        
        if (detailResult.errorCode === 0 && detailResult.data) {
            const record = detailResult.data;
            console.log('\n🖼️ 圖片欄位分析:');
            
            const imageFields = [
                { name: 'field_V3d91__c', desc: '施工前照片' },
                { name: 'field_3Fqof__c', desc: '完工照片' },
                { name: 'field_3T38o__c', desc: '平面圖' },
                { name: 'field_03U9h__c', desc: '工地狀況照片' },
                { name: 'field_PuaLk__c', desc: '維修完成照片1' },
                { name: 'field_d2O5i__c', desc: '維修完成照片2' },
                { name: 'field_tyRfE__c', desc: '缺失照片1' },
                { name: 'field_62279__c', desc: '缺失照片2' },
                { name: 'field_W2i6j__c', desc: '施工前缺失' },
                { name: 'field_v1x3S__c', desc: '驗收照片' }
            ];
            
            imageFields.forEach(field => {
                const value = record[field.name];
                console.log(`\n- ${field.desc} (${field.name}):`);
                console.log(`  類型: ${typeof value}`);
                console.log(`  值: ${value === null ? 'null' : value === '' ? '空字符串' : JSON.stringify(value).substring(0, 100) + '...'}`);
                
                if (value && typeof value === 'string' && value.length > 0) {
                    console.log(`  長度: ${value.length} 字符`);
                    console.log(`  開頭: ${value.substring(0, 50)}...`);
                }
            });
            
            // 檢查其他更新的欄位
            console.log('\n📝 其他重要欄位:');
            console.log(`- 工班師父 (field_u1wpv__c): ${record.field_u1wpv__c}`);
            console.log(`- 施工前備註 (field_sF6fn__c): ${record.field_sF6fn__c}`);
            console.log(`- 施工完成 (construction_completed__c): ${record.construction_completed__c}`);
            console.log(`- 舖設坪數 (field_B2gh1__c): ${record.field_B2gh1__c}`);
            console.log(`- 施工日期 (field_23pFq__c): ${record.field_23pFq__c}`);
        }

    } catch (error) {
        console.error('❌ 查詢失敗:', error.message);
    }
}

querySpecificRecord();