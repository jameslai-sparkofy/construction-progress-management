#!/usr/bin/env node

/**
 * 完整的照片上傳流程測試
 * 1. 上傳圖片到 CRM 媒體庫
 * 2. 使用返回的 mediaId 更新案場對象
 */

const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4", 
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com",
    mobile: "17675662629"
};

// 創建測試圖片（1x1 紅色像素）
function createTestImage() {
    // 最小的 PNG 圖片 - 1x1 紅色像素
    const redPixelPNG = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG 標頭
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
        0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
        0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D,
        0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
        0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    // 保存到臨時檔案
    const filename = `test_image_${Date.now()}.png`;
    fs.writeFileSync(filename, redPixelPNG);
    return filename;
}

async function uploadPhotoToCRM(token, corpId, imagePath) {
    try {
        console.log(`📤 上傳圖片: ${imagePath}`);
        
        const form = new FormData();
        form.append('media', fs.createReadStream(imagePath));
        
        const uploadUrl = `${CONFIG.baseUrl}/media/upload?corpAccessToken=${token}&corpId=${corpId}&type=image&igonreMediaIdConvert=true`;
        
        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const uploadResult = await uploadResponse.json();
        console.log('上傳結果:', uploadResult);
        
        if (uploadResult.errorCode === 0 && uploadResult.mediaId) {
            console.log(`✅ 上傳成功！mediaId: ${uploadResult.mediaId}`);
            return {
                success: true,
                mediaId: uploadResult.mediaId
            };
        } else {
            console.log(`❌ 上傳失敗: ${uploadResult.errorMessage}`);
            return {
                success: false,
                error: uploadResult.errorMessage
            };
        }
        
    } catch (error) {
        console.error('上傳錯誤:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function testCompletePhotoUpload() {
    console.log('🚀 開始完整的照片上傳流程測試...\n');
    
    let testImageFile = null;
    
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

        // 3. 創建測試圖片
        console.log('\n🖼️ 步驟 2: 創建測試圖片');
        testImageFile = createTestImage();
        console.log(`✅ 測試圖片已創建: ${testImageFile}`);

        // 4. 上傳圖片到 CRM
        console.log('\n📤 步驟 3: 上傳圖片到 CRM 媒體庫');
        const uploadResult1 = await uploadPhotoToCRM(token, corpId, testImageFile);
        const uploadResult2 = await uploadPhotoToCRM(token, corpId, testImageFile);
        
        if (!uploadResult1.success || !uploadResult2.success) {
            throw new Error('圖片上傳失敗');
        }

        // 5. 使用 mediaId 更新案場對象
        console.log('\n📝 步驟 4: 使用 mediaId 更新案場對象');
        const siteId = "6621c7a2eb4c7f0001817f67";
        
        // 構建正確的圖片格式
        const prePhotos = [
            {
                ext: "png",
                path: uploadResult1.mediaId,  // 使用返回的 mediaId
                filename: "施工前照片.png",
                isImage: true
            }
        ];
        
        const completionPhotos = [
            {
                ext: "png", 
                path: uploadResult2.mediaId,  // 使用返回的 mediaId
                filename: "完工照片.png",
                isImage: true
            }
        ];

        const updateResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpAccessToken: token,
                corpId: corpId,
                currentOpenUserId: userId,
                data: {
                    igonreMediaIdConvert: true,  // 重要：與上傳時保持一致
                    object_data: {
                        dataObjectApiName: "object_8W9cb__c",
                        _id: siteId,
                        field_u1wpv__c: "照片上傳測試-完整流程 " + new Date().toLocaleString(),
                        field_V3d91__c: prePhotos,      // 施工前照片
                        field_3Fqof__c: completionPhotos // 完工照片
                    }
                },
                triggerWorkFlow: false
            })
        });

        const updateResult = await updateResponse.json();
        console.log('更新結果:', JSON.stringify(updateResult, null, 2));

        if (updateResult.errorCode === 0) {
            console.log('\n🎉 成功！完整的照片上傳流程已驗證！');
            console.log('\n📋 總結:');
            console.log('1. ✅ 圖片上傳到媒體庫');
            console.log(`   - 施工前照片 mediaId: ${uploadResult1.mediaId}`);
            console.log(`   - 完工照片 mediaId: ${uploadResult2.mediaId}`);
            console.log('2. ✅ 使用 mediaId 更新案場對象');
            console.log('3. ✅ 照片欄位格式正確');
            
            console.log('\n🔧 正確的照片格式:');
            console.log(JSON.stringify(prePhotos[0], null, 2));
        } else {
            console.log('❌ 更新失敗:', updateResult.errorMessage);
        }

    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    } finally {
        // 清理臨時檔案
        if (testImageFile && fs.existsSync(testImageFile)) {
            fs.unlinkSync(testImageFile);
            console.log('\n🧹 臨時檔案已清理');
        }
    }
}

testCompletePhotoUpload();