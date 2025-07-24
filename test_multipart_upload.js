#!/usr/bin/env node

/**
 * 測試使用 multipart/form-data 格式上傳圖片到 CRM
 */

const FormData = require('form-data');
const fetch = require('node-fetch');

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4", 
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com",
    mobile: "17675662629"
};

// 創建測試用的 Base64 圖片數據
function createTestImageBuffer() {
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/bkTbGwAAAABJRU5ErkJggg==';
    return Buffer.from(pngBase64, 'base64');
}

async function testMultipartUpload() {
    console.log('🗂️ 開始測試 multipart/form-data 上傳...\n');
    
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

        // 3. 測試 multipart 上傳
        console.log('\n📤 步驟 3: 測試 multipart/form-data 上傳');
        
        const imageBuffer = createTestImageBuffer();
        const fileName = 'test_construction_photo.png';
        
        // 嘗試不同的上傳端點
        await testMultipartEndpoint(token, corpId, userId, imageBuffer, fileName, '/cgi/file/upload');
        await testMultipartEndpoint(token, corpId, userId, imageBuffer, fileName, '/cgi/attachment/upload');
        
        // 4. 測試圖片欄位的特殊格式
        console.log('\n🖼️ 步驟 4: 測試圖片欄位的特殊格式');
        await testImageFieldFormats(token, corpId, userId);

    } catch (error) {
        console.error('❌ multipart 上傳測試失敗:', error.message);
    }
}

async function testMultipartEndpoint(token, corpId, userId, imageBuffer, fileName, endpoint) {
    try {
        console.log(`\n🧪 測試端點: ${endpoint}`);
        
        const form = new FormData();
        form.append('corpAccessToken', token);
        form.append('corpId', corpId);
        form.append('currentOpenUserId', userId);
        form.append('file', imageBuffer, {
            filename: fileName,
            contentType: 'image/png'
        });

        const uploadResponse = await fetch(`${CONFIG.baseUrl}${endpoint}`, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const result = await uploadResponse.text();
        console.log(`${endpoint} 結果:`, result);
        
        // 嘗試解析 JSON
        try {
            const jsonResult = JSON.parse(result);
            if (jsonResult.errorCode === 0) {
                console.log(`✅ ${endpoint} 上傳成功！`);
                console.log('檔案 ID:', jsonResult.fileId || jsonResult.id || '未知');
                return jsonResult;
            } else {
                console.log(`❌ ${endpoint} 上傳失敗:`, jsonResult.errorMessage);
            }
        } catch (parseError) {
            console.log(`❌ ${endpoint} 返回非 JSON 格式:`, result.substring(0, 200));
        }
    } catch (error) {
        console.log(`${endpoint} 錯誤:`, error.message);
    }
    return null;
}

async function testImageFieldFormats(token, corpId, userId) {
    const siteId = "6621c7a2eb4c7f0001817f67";
    
    // 測試空值更新
    console.log('\n🧪 測試圖片欄位設為 null');
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
                        field_u1wpv__c: "照片測試-NULL值",
                        field_V3d91__c: null, // 施工前照片設為 null
                        field_3Fqof__c: null, // 完工照片設為 null
                    }
                },
                triggerWorkFlow: false
            })
        });

        const result = await updateResponse.json();
        console.log('NULL 值測試結果:', JSON.stringify(result, null, 2));
        
        if (result.errorCode === 0) {
            console.log('✅ 圖片欄位可以設為 null');
        }
    } catch (error) {
        console.log('NULL 值測試錯誤:', error.message);
    }
    
    // 測試空字符串
    console.log('\n🧪 測試圖片欄位設為空字符串');
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
                        field_u1wpv__c: "照片測試-空字符串",
                        field_V3d91__c: "", // 施工前照片設為空字符串
                        field_3Fqof__c: "", // 完工照片設為空字符串
                    }
                },
                triggerWorkFlow: false
            })
        });

        const result = await updateResponse.json();
        console.log('空字符串測試結果:', JSON.stringify(result, null, 2));
        
        if (result.errorCode === 0) {
            console.log('✅ 圖片欄位可以設為空字符串');
        }
    } catch (error) {
        console.log('空字符串測試錯誤:', error.message);
    }
}

testMultipartUpload();