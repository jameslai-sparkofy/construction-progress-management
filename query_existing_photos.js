#!/usr/bin/env node

/**
 * 查詢現有記錄中的圖片欄位格式
 */

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4", 
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com",
    mobile: "17675662629"
};

async function queryExistingPhotos() {
    console.log('🔍 查詢現有記錄中的圖片欄位格式...\n');
    
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

        // 3. 查詢案場記錄中的圖片欄位
        console.log('\n📊 步驟 3: 查詢案場記錄中的圖片欄位');
        
        const queryResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    dataObjectApiName: "object_8W9cb__c",
                    search_query_info: {
                        limit: 10,
                        offset: 0,
                        // 查詢有圖片的記錄
                        filters: [
                            {
                                fieldName: "field_V3d91__c", // 施工前照片
                                fieldValues: [""],
                                operator: "NE" // 不等於空字符串
                            }
                        ]
                    }
                }
            })
        });

        const queryResult = await queryResponse.json();
        console.log('查詢結果:', JSON.stringify(queryResult, null, 2));
        
        if (queryResult.errorCode === 0 && queryResult.dataList) {
            console.log(`\n找到 ${queryResult.dataList.length} 個有圖片的記錄:`);
            
            queryResult.dataList.forEach((record, index) => {
                console.log(`\n記錄 ${index + 1}:`);
                console.log(`- ID: ${record._id}`);
                console.log(`- 編號: ${record.name}`);
                console.log(`- 施工前照片 (field_V3d91__c):`, record.field_V3d91__c);
                console.log(`- 完工照片 (field_3Fqof__c):`, record.field_3Fqof__c);
                console.log(`- 平面圖 (field_3T38o__c):`, record.field_3T38o__c);
                console.log(`- 工地狀況照片 (field_03U9h__c):`, record.field_03U9h__c);
            });
        } else {
            console.log('❌ 查詢失敗:', queryResult.errorMessage);
            
            // 改為查詢所有記錄，看看圖片欄位的結構
            console.log('\n🔄 改為查詢所有記錄...');
            const allRecordsResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    corpId: corpId,
                    corpAccessToken: token,
                    currentOpenUserId: userId,
                    data: {
                        dataObjectApiName: "object_8W9cb__c",
                        search_query_info: {
                            limit: 5,
                            offset: 0
                        }
                    }
                })
            });

            const allRecordsResult = await allRecordsResponse.json();
            
            if (allRecordsResult.errorCode === 0 && allRecordsResult.dataList) {
                console.log(`\n查看前 ${allRecordsResult.dataList.length} 個記錄的圖片欄位:`);
                
                allRecordsResult.dataList.forEach((record, index) => {
                    console.log(`\n記錄 ${index + 1} (${record.name}):`);
                    console.log(`- 施工前照片: ${record.field_V3d91__c || 'null'}`);
                    console.log(`- 完工照片: ${record.field_3Fqof__c || 'null'}`);
                    console.log(`- 平面圖: ${record.field_3T38o__c || 'null'}`);
                    console.log(`- 工地狀況照片: ${record.field_03U9h__c || 'null'}`);
                    
                    // 如果有圖片數据，顯示格式
                    if (record.field_V3d91__c) {
                        console.log(`- 施工前照片格式:`, typeof record.field_V3d91__c, record.field_V3d91__c.substring(0, 100) + '...');
                    }
                });
            }
        }

    } catch (error) {
        console.error('❌ 查詢失敗:', error.message);
    }
}

queryExistingPhotos();