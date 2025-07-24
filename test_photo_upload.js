#!/usr/bin/env node

/**
 * 測試照片上傳到 CRM 的完整流程
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4", 
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com",
    mobile: "17675662629"
};

// 創建測試用的 Base64 圖片數據
function createTestImageBase64() {
    // 創建一個簡單的 1x1 像素 PNG 圖片的 Base64 數據
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/bkTbGwAAAABJRU5ErkJggg==';
    return pngBase64;
}

async function testPhotoUpload() {
    console.log('📷 開始測試照片上傳到 CRM...\n');
    
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

        // 3. 準備測試圖片數據
        console.log('🖼️ 步驟 3: 準備測試圖片數據');
        const testImageBase64 = createTestImageBase64();
        
        // 準備兩張照片：施工前照片和完工照片
        const prePhotos = [
            {
                name: 'construction_pre_1.png',
                content: testImageBase64,
                type: 'image/png'
            },
            {
                name: 'construction_pre_2.png', 
                content: testImageBase64,
                type: 'image/png'
            }
        ];
        
        const completionPhotos = [
            {
                name: 'construction_completed_1.png',
                content: testImageBase64,
                type: 'image/png'
            }
        ];

        console.log(`準備了 ${prePhotos.length} 張施工前照片和 ${completionPhotos.length} 張完工照片`);

        // 4. 測試不同的照片格式
        console.log('\n📸 步驟 4: 測試不同的照片欄位格式');
        
        const siteId = "6621c7a2eb4c7f0001817f67";
        
        // 測試方案 1: JSON 字符串格式
        console.log('\n🧪 測試方案 1: JSON 字符串格式');
        const updateData1 = {
            field_u1wpv__c: "照片測試-JSON格式",
            field_V3d91__c: JSON.stringify(prePhotos), // 施工前照片
            field_3Fqof__c: JSON.stringify(completionPhotos), // 完工照片
        };

        const result1 = await updateSiteRecord(token, corpId, userId, siteId, updateData1);
        console.log('結果 1:', result1);

        // 等待一下
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 測試方案 2: Base64 字符串格式
        console.log('\n🧪 測試方案 2: Base64 字符串格式');
        const updateData2 = {
            field_u1wpv__c: "照片測試-Base64格式",
            field_V3d91__c: testImageBase64, // 單張照片 Base64
            field_3Fqof__c: testImageBase64, // 單張照片 Base64
        };

        const result2 = await updateSiteRecord(token, corpId, userId, siteId, updateData2);
        console.log('結果 2:', result2);

        // 等待一下
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 測試方案 3: 照片數組格式
        console.log('\n🧪 測試方案 3: 照片數組格式');
        const updateData3 = {
            field_u1wpv__c: "照片測試-數組格式",
            field_V3d91__c: prePhotos.map(p => p.content).join(','), // 多張照片用逗號分隔
            field_3Fqof__c: completionPhotos[0].content, // 單張照片
        };

        const result3 = await updateSiteRecord(token, corpId, userId, siteId, updateData3);
        console.log('結果 3:', result3);

        // 5. 總結測試結果
        console.log('\n📋 照片上傳測試總結:');
        console.log(`- JSON 字符串格式: ${result1.success ? '✅' : '❌'} ${result1.message || ''}`);
        console.log(`- Base64 字符串格式: ${result2.success ? '✅' : '❌'} ${result2.message || ''}`);
        console.log(`- 照片數組格式: ${result3.success ? '✅' : '❌'} ${result3.message || ''}`);

    } catch (error) {
        console.error('❌ 照片測試失敗:', error.message);
    }
}

async function updateSiteRecord(token, corpId, userId, siteId, updateData) {
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

testPhotoUpload();