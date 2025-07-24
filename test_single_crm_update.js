#!/usr/bin/env node

/**
 * 測試單一案場記錄的 CRM 更新
 */

const baseUrl = 'https://progress.yes-ceramics.com';

async function testSingleCRMUpdate() {
    console.log('🧪 測試單一案場記錄的 CRM 更新...\n');
    
    // 使用剛才測試的記錄
    const testData = {
        building: 'A棟',
        floor: '3F', 
        unit: '301',
        projectId: 'xinganxi_2024',
        construction_completed: true,
        preConstructionNote: '測試CRM更新 - 欄位對應驗證',
        date: '2025-07-24',
        area: '30.0',
        contractor: '測試師父 CRM'
    };

    try {
        // 1. 先保存到 D1
        console.log('📝 步驟 1: 保存資料到 D1');
        const saveResponse = await fetch(`${baseUrl}/api/progress/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
        const saveResult = await saveResponse.json();
        console.log('D1 保存結果:', saveResult);
        
        if (!saveResult.success) {
            throw new Error(`D1 保存失敗: ${saveResult.error}`);
        }
        
        // 等待自動同步
        console.log('\n⏳ 等待 3 秒讓自動同步完成...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 2. 檢查 D1 中的記錄是否有 CRM 同步時間
        console.log('📊 步驟 2: 檢查同步狀態');
        
        // 手動觸發 CRM 同步測試
        console.log('\n🔄 步驟 3: 手動觸發 CRM 同步');
        const syncResponse = await fetch(`${baseUrl}/api/progress/sync-to-crm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId: testData.projectId,
                filters: {
                    building: testData.building,
                    floor: testData.floor,
                    unit: testData.unit
                }
            })
        });
        
        const syncResult = await syncResponse.json();
        console.log('CRM 同步結果:', JSON.stringify(syncResult, null, 2));
        
        if (syncResult.success) {
            console.log('✅ CRM 同步成功！');
            if (syncResult.syncedCount) {
                console.log(`同步數量: ${syncResult.syncedCount} 筆記錄`);
            }
        } else {
            console.log('❌ CRM 同步失敗:', syncResult.error);
            if (syncResult.details) {
                console.log('詳細錯誤:', syncResult.details);
            }
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

testSingleCRMUpdate();