#!/usr/bin/env node

/**
 * 測試正確的照片格式上傳到 CRM
 * 基於提供的格式：[{"ext":"png","path":"N_202312_07_xxxxxxxx.png","filename":"logo.png","isImage":true}]
 */

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4", 
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com",
    mobile: "17675662629"
};

async function testCorrectPhotoFormat() {
    console.log('📷 測試正確的照片格式上傳...\n');
    
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

        console.log('✅ Token 和用戶信息獲取成功');

        // 3. 測試正確的照片格式
        const siteId = "6621c7a2eb4c7f0001817f67";
        
        // 生成當前時間戳用於檔案路徑
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
        
        console.log('\n🧪 測試方案 1: 標準圖片格式 (基於提供的範例)');
        const photoFormat1 = [
            {
                "ext": "jpg",
                "path": `N_${timestamp}_construction_pre.jpg`,
                "filename": "施工前照片.jpg",
                "isImage": true
            }
        ];
        
        const completionFormat1 = [
            {
                "ext": "jpg", 
                "path": `N_${timestamp}_construction_completed.jpg`,
                "filename": "完工照片.jpg",
                "isImage": true
            }
        ];

        const result1 = await updatePhotoField(token, corpId, userId, siteId, {
            field_u1wpv__c: "照片測試-標準格式",
            field_V3d91__c: JSON.stringify(photoFormat1),
            field_3Fqof__c: JSON.stringify(completionFormat1)
        });
        
        console.log('結果 1:', result1);
        
        // 等待一下
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('\n🧪 測試方案 2: 簡化格式');
        const photoFormat2 = [
            {
                "ext": "png",
                "path": `construction_pre_${timestamp}.png`,
                "filename": "pre.png",
                "isImage": true
            }
        ];

        const result2 = await updatePhotoField(token, corpId, userId, siteId, {
            field_u1wpv__c: "照片測試-簡化格式",
            field_V3d91__c: JSON.stringify(photoFormat2),
            field_3Fqof__c: null // 只測試一個欄位
        });
        
        console.log('結果 2:', result2);
        
        // 等待一下
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('\n🧪 測試方案 3: 多張照片格式');
        const multiPhotos = [
            {
                "ext": "jpg",
                "path": `N_${timestamp}_photo1.jpg`,
                "filename": "照片1.jpg", 
                "isImage": true
            },
            {
                "ext": "jpg",
                "path": `N_${timestamp}_photo2.jpg`,
                "filename": "照片2.jpg",
                "isImage": true
            }
        ];

        const result3 = await updatePhotoField(token, corpId, userId, siteId, {
            field_u1wpv__c: "照片測試-多張照片",
            field_V3d91__c: JSON.stringify(multiPhotos),
            field_3Fqof__c: null
        });
        
        console.log('結果 3:', result3);

        // 4. 總結測試結果
        console.log('\n📋 照片格式測試總結:');
        console.log(`- 標準格式: ${result1.success ? '✅' : '❌'} ${result1.message || ''}`);
        console.log(`- 簡化格式: ${result2.success ? '✅' : '❌'} ${result2.message || ''}`);
        console.log(`- 多張照片: ${result3.success ? '✅' : '❌'} ${result3.message || ''}`);
        
        if (result1.success || result2.success || result3.success) {
            console.log('\n🎉 找到了正確的照片格式！');
            console.log('正確格式範例:');
            if (result1.success) {
                console.log('標準格式:', JSON.stringify(photoFormat1, null, 2));
            }
            if (result2.success) {
                console.log('簡化格式:', JSON.stringify(photoFormat2, null, 2));
            }
        } else {
            console.log('\n🤔 所有格式都失敗了，可能還需要其他參數...');
        }

    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

async function updatePhotoField(token, corpId, userId, siteId, updateData) {
    try {
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
        
        if (updateResult.errorCode === 0) {
            return { success: true, message: '更新成功' };
        } else {
            return { 
                success: false, 
                message: `更新失敗: ${updateResult.errorMessage}`,
                errorCode: updateResult.errorCode
            };
        }
    } catch (error) {
        return { success: false, message: `請求失敗: ${error.message}` };
    }
}

testCorrectPhotoFormat();