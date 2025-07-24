#!/usr/bin/env node

/**
 * 測試 CRM 檔案上傳 API
 * 研究如何正確上傳圖片到紛享銷客
 */

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4", 
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com",
    mobile: "17675662629"
};

// 創建測試用的 Base64 圖片數據
function createTestImageBase64() {
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/bkTbGwAAAABJRU5ErkJggg==';
    return pngBase64;
}

async function testFileUploadAPI() {
    console.log('📁 開始測試 CRM 檔案上傳 API...\n');
    
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

        // 3. 嘗試不同的檔案上傳 API 端點
        console.log('\n📤 步驟 3: 測試不同的檔案上傳端點');
        
        const testImageBase64 = createTestImageBase64();
        const fileName = 'test_construction_photo.png';
        
        // 測試端點 1: /cgi/crm/upload
        console.log('\n🧪 測試端點 1: /cgi/crm/upload');
        await testUploadEndpoint1(token, corpId, userId, testImageBase64, fileName);
        
        // 測試端點 2: /cgi/file/upload
        console.log('\n🧪 測試端點 2: /cgi/file/upload');
        await testUploadEndpoint2(token, corpId, userId, testImageBase64, fileName);
        
        // 測試端點 3: /cgi/attachment/upload
        console.log('\n🧪 測試端點 3: /cgi/attachment/upload');
        await testUploadEndpoint3(token, corpId, userId, testImageBase64, fileName);
        
        // 4. 測試只更新文字欄位，不包含圖片
        console.log('\n📝 步驟 4: 測試只更新文字欄位（確認其他欄位正常）');
        await testTextOnlyUpdate(token, corpId, userId);

    } catch (error) {
        console.error('❌ 檔案上傳測試失敗:', error.message);
    }
}

async function testUploadEndpoint1(token, corpId, userId, imageBase64, fileName) {
    try {
        const uploadResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpAccessToken: token,
                corpId: corpId,
                currentOpenUserId: userId,
                fileName: fileName,
                fileContent: imageBase64,
                fileType: 'image/png'
            })
        });

        const result = await uploadResponse.json();
        console.log('/cgi/crm/upload 結果:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.log('/cgi/crm/upload 錯誤:', error.message);
    }
}

async function testUploadEndpoint2(token, corpId, userId, imageBase64, fileName) {
    try {
        const uploadResponse = await fetch(`${CONFIG.baseUrl}/cgi/file/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpAccessToken: token,
                corpId: corpId,
                fileName: fileName,
                fileData: imageBase64
            })
        });

        const result = await uploadResponse.json();
        console.log('/cgi/file/upload 結果:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.log('/cgi/file/upload 錯誤:', error.message);
    }
}

async function testUploadEndpoint3(token, corpId, userId, imageBase64, fileName) {
    try {
        const uploadResponse = await fetch(`${CONFIG.baseUrl}/cgi/attachment/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpAccessToken: token,
                corpId: corpId,
                currentOpenUserId: userId,
                attachmentName: fileName,
                attachmentContent: imageBase64
            })
        });

        const result = await uploadResponse.json();
        console.log('/cgi/attachment/upload 結果:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.log('/cgi/attachment/upload 錯誤:', error.message);
    }
}

async function testTextOnlyUpdate(token, corpId, userId) {
    try {
        const siteId = "6621c7a2eb4c7f0001817f67";
        
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
                        field_u1wpv__c: "照片測試-文字欄位確認 " + new Date().toLocaleString(),
                        field_sF6fn__c: "測試備註-確認文字欄位正常工作"
                    }
                },
                triggerWorkFlow: false
            })
        });

        const result = await updateResponse.json();
        console.log('文字欄位更新結果:', JSON.stringify(result, null, 2));
        
        if (result.errorCode === 0) {
            console.log('✅ 文字欄位更新成功，圖片欄位可能需要特殊處理');
        } else {
            console.log('❌ 連文字欄位都更新失敗');
        }
    } catch (error) {
        console.log('文字欄位更新錯誤:', error.message);
    }
}

testFileUploadAPI();