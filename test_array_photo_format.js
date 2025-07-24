#!/usr/bin/env node

/**
 * 測試陣列格式的照片上傳（不用 JSON.stringify）
 */

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4", 
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com",
    mobile: "17675662629"
};

async function testArrayPhotoFormat() {
    console.log('📷 測試陣列格式照片上傳（不用 JSON.stringify）...\n');
    
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

        const siteId = "6621c7a2eb4c7f0001817f67";
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);

        // 測試 1: 直接傳陣列（不用 JSON.stringify）
        console.log('\n🧪 測試方案 1: 直接傳陣列格式');
        const photoArray1 = [
            {
                "ext": "jpg",
                "path": `N_${timestamp}_direct_array.jpg`,
                "filename": "direct_array.jpg",
                "isImage": true
            }
        ];

        const result1 = await updatePhotoField(token, corpId, userId, siteId, {
            field_u1wpv__c: "照片測試-直接陣列",
            field_V3d91__c: photoArray1  // 直接傳陣列，不用 JSON.stringify
        });
        
        console.log('結果 1:', result1);

        await new Promise(resolve => setTimeout(resolve, 2000));

        // 測試 2: 單一物件格式
        console.log('\n🧪 測試方案 2: 單一物件格式');
        const photoObject = {
            "ext": "jpg",
            "path": `N_${timestamp}_single_object.jpg`,
            "filename": "single_object.jpg",
            "isImage": true
        };

        const result2 = await updatePhotoField(token, corpId, userId, siteId, {
            field_u1wpv__c: "照片測試-單一物件",
            field_V3d91__c: photoObject  // 直接傳物件
        });
        
        console.log('結果 2:', result2);

        await new Promise(resolve => setTimeout(resolve, 2000));

        // 測試 3: 字符串格式（路徑）
        console.log('\n🧪 測試方案 3: 字符串路徑格式');
        const photoPath = `N_${timestamp}_string_path.jpg`;

        const result3 = await updatePhotoField(token, corpId, userId, siteId, {
            field_u1wpv__c: "照片測試-字符串路徑",
            field_V3d91__c: photoPath  // 只傳路徑字符串
        });
        
        console.log('結果 3:', result3);

        await new Promise(resolve => setTimeout(resolve, 2000));

        // 測試 4: 包含更多欄位的格式
        console.log('\n🧪 測試方案 4: 包含更多欄位');
        const richPhotoFormat = [
            {
                "ext": "jpg",
                "path": `N_${timestamp}_rich_format.jpg`,
                "filename": "rich_format.jpg",
                "isImage": true,
                "size": 12345,
                "width": 800,
                "height": 600
            }
        ];

        const result4 = await updatePhotoField(token, corpId, userId, siteId, {
            field_u1wpv__c: "照片測試-豐富格式",
            field_V3d91__c: richPhotoFormat
        });
        
        console.log('結果 4:', result4);

        // 總結測試結果
        console.log('\n📋 陣列格式測試總結:');
        console.log(`- 直接陣列: ${result1.success ? '✅' : '❌'} ${result1.message || ''}`);
        console.log(`- 單一物件: ${result2.success ? '✅' : '❌'} ${result2.message || ''}`);
        console.log(`- 字符串路徑: ${result3.success ? '✅' : '❌'} ${result3.message || ''}`);
        console.log(`- 豐富格式: ${result4.success ? '✅' : '❌'} ${result4.message || ''}`);

        if (result1.success || result2.success || result3.success || result4.success) {
            console.log('\n🎉 找到了可用的格式！');
        } else {
            console.log('\n🤔 仍然需要進一步研究照片欄位的正確格式...');
            console.log('可能需要：');
            console.log('1. 先上傳檔案到 CRM 檔案系統');
            console.log('2. 獲得檔案 ID 後再引用');
            console.log('3. 或者使用特定的 API 端點');
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

testArrayPhotoFormat();