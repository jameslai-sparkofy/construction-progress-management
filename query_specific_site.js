#!/usr/bin/env node

/**
 * 查詢特定案場數據
 * 目標ID: 6621c7a6ed564b0001a72154 (A棟10F A1戶)
 * 重點關注: 坪數欄位和施工前照片相關欄位
 */

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4", 
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com",
    mobile: "17675662629"
};

async function main() {
    try {
        console.log('🔐 正在獲取認證信息...');
        
        // 1. 獲取企業訪問令牌
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
            throw new Error(`Token error: ${tokenResult.errorMessage}`);
        }

        const { corpAccessToken: token, corpId } = tokenResult;
        console.log('✅ 企業訪問令牌獲取成功');

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
            throw new Error(`User error: ${userResult.errorMessage}`);
        }

        const userId = userResult.empList[0].openUserId;
        console.log('✅ 用戶信息獲取成功');

        console.log('\n🔍 正在查詢特定案場數據...');
        console.log(`目標案場ID: 6621c7a6ed564b0001a72154`);

        // 3. 使用自定義 API 查詢案場數據
        // 由於無法直接根據ID查詢，先獲取案場列表然後篩選
        const siteResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    dataObjectApiName: "object_8W9cb__c", // 案場對象
                    search_query_info: {
                        limit: 100,
                        offset: 0,
                        orders: [{ fieldName: "create_time", isAsc: "false" }]
                    }
                }
            })
        });

        const siteResult = await siteResponse.json();
        console.log('API 響應狀態:', siteResult.errorCode === 0 ? '✅ 成功' : '❌ 失敗');
        
        if (siteResult.errorCode !== 0) {
            console.error('API 錯誤:', siteResult.errorMessage);
            return;
        }

        console.log(`總共獲取到 ${siteResult.data?.dataList?.length || 0} 個案場記錄`);

        // 4. 查找目標案場
        const targetSiteId = "6621c7a6ed564b0001a72154";
        let targetSite = null;
        let checkedCount = 0;

        // 分批查詢以找到目標案場
        for (let offset = 0; offset < 4000; offset += 100) {
            const batchResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/custom/v2/data/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    corpId: corpId,
                    corpAccessToken: token,
                    currentOpenUserId: userId,
                    data: {
                        dataObjectApiName: "object_8W9cb__c",
                        search_query_info: {
                            limit: 100,
                            offset: offset,
                            orders: [{ fieldName: "create_time", isAsc: "false" }]
                        }
                    }
                })
            });

            const batchResult = await batchResponse.json();
            if (batchResult.errorCode === 0 && batchResult.data?.dataList) {
                checkedCount += batchResult.data.dataList.length;
                
                // 檢查這批數據中是否有目標案場
                targetSite = batchResult.data.dataList.find(site => site._id === targetSiteId);
                
                if (targetSite) {
                    console.log(`\n🎯 找到目標案場！(檢查了 ${checkedCount} 個記錄)`);
                    break;
                }

                console.log(`檢查進度: ${checkedCount} 個記錄...`);
                
                // 如果這批數據少於100個，說明已經到末尾了
                if (batchResult.data.dataList.length < 100) {
                    break;
                }
            } else {
                console.error(`批次查詢失敗 (offset: ${offset}):`, batchResult.errorMessage);
                break;
            }
        }

        if (!targetSite) {
            console.error(`❌ 未找到ID為 ${targetSiteId} 的案場記錄`);
            return;
        }

        // 5. 顯示案場詳細信息
        console.log('\n📋 案場詳細信息:');
        console.log('=' .repeat(60));
        
        console.log(`ID: ${targetSite._id}`);
        console.log(`名稱: ${targetSite.name || 'N/A'}`);
        console.log(`創建時間: ${new Date(targetSite.create_time).toLocaleString('zh-TW')}`);
        console.log(`最後修改: ${new Date(targetSite.last_modified_time).toLocaleString('zh-TW')}`);

        // 6. 重點關注的坪數欄位
        console.log('\n📐 坪數相關欄位:');
        console.log('-'.repeat(40));
        
        const areaFields = {
            'field_i2Q1g__c': '坪數欄位1',
            'field_B2gh1__c': '坪數欄位2', 
            'field_tXAko__c': '坪數欄位3'
        };

        for (const [fieldKey, fieldName] of Object.entries(areaFields)) {
            const value = targetSite[fieldKey];
            console.log(`${fieldName} (${fieldKey}): ${value || 'N/A'}`);
        }

        // 7. 施工前照片相關欄位
        console.log('\n📸 施工前照片相關欄位:');
        console.log('-'.repeat(40));
        
        // 搜尋所有可能的照片相關欄位
        const photoFields = [];
        for (const key in targetSite) {
            if (key.includes('photo') || key.includes('image') || key.includes('pic') || 
                key.includes('照片') || key.includes('圖片') || key.includes('before')) {
                photoFields.push({ key, value: targetSite[key] });
            }
        }

        if (photoFields.length > 0) {
            photoFields.forEach(field => {
                console.log(`${field.key}: ${field.value || 'N/A'}`);
            });
        } else {
            console.log('未找到明顯的照片相關欄位');
        }

        // 8. 顯示所有可用欄位
        console.log('\n📊 完整欄位列表:');
        console.log('-'.repeat(40));
        
        const sortedFields = Object.keys(targetSite).sort();
        sortedFields.forEach(key => {
            const value = targetSite[key];
            let displayValue = '';
            
            if (value === null || value === undefined) {
                displayValue = 'N/A';
            } else if (typeof value === 'object') {
                displayValue = JSON.stringify(value);
            } else if (typeof value === 'string' && value.length > 100) {
                displayValue = value.substring(0, 100) + '...';
            } else {
                displayValue = String(value);
            }
            
            console.log(`${key}: ${displayValue}`);
        });

        // 9. 保存完整數據到文件
        const fs = require('fs');
        const filename = `site_${targetSiteId}_data.json`;
        fs.writeFileSync(filename, JSON.stringify(targetSite, null, 2), 'utf8');
        console.log(`\n💾 完整數據已保存到: ${filename}`);

        console.log('\n✅ 查詢完成！');

    } catch (error) {
        console.error('❌ 查詢失敗:', error.message);
        console.error(error.stack);
    }
}

// 執行查詢
main();