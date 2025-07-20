// 測試從 CRM 提取三類資料的功能
// 模擬新建專案時的完整流程

const CONFIG = {
    appId: "FSAID_1320691", 
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

// 模擬興安西專案的商機ID
const OPPORTUNITY_ID = "xinganxi_2024_opportunity";

class CRMDataExtractor {
    constructor() {
        this.accessToken = null;
    }

    // 獲取訪問令牌
    async getAccessToken() {
        console.log('🔑 獲取 CRM 訪問令牌...');
        try {
            const response = await fetch(`${CONFIG.baseUrl}/cgi/corpAccessToken/get/V2`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appId: CONFIG.appId,
                    appSecret: CONFIG.appSecret,
                    permanentCode: CONFIG.permanentCode
                })
            });
            
            const result = await response.json();
            if (result.errorCode !== 0) {
                throw new Error(`Token獲取失敗: ${result.errorMessage}`);
            }
            
            this.accessToken = result.corpAccessToken;
            console.log('✅ Token 獲取成功');
            return this.accessToken;
        } catch (error) {
            console.error('❌ Token 獲取錯誤:', error.message);
            throw error;
        }
    }

    // 1. 搜尋並獲取商機資料
    async searchOpportunities(searchKeyword = "興安西") {
        console.log(`\n📋 搜尋商機: "${searchKeyword}"`);
        try {
            // 這裡應該調用實際的 CRM API 搜尋商機
            // 模擬返回商機資料
            const mockOpportunity = {
                id: OPPORTUNITY_ID,
                name: "勝興-興安西-2024",
                stage: "工程進行中",
                amount: 50000000,
                close_date: "2024-12-31",
                project_type: "住宅建案",
                building_info: {
                    buildings: ["A棟", "B棟", "C棟"],
                    total_floors: {
                        "A棟": ["8F", "10F", "11F", "12F", "13F", "14F"],
                        "B棟": ["2F", "4F", "12F"], 
                        "C棟": ["3F", "4F", "5F", "6F", "7F", "8F", "9F", "10F", "11F", "12F", "13F", "14F", "15F"]
                    }
                }
            };
            
            console.log('✅ 找到商機:', mockOpportunity.name);
            console.log('   棟別:', mockOpportunity.building_info.buildings.join(', '));
            return mockOpportunity;
        } catch (error) {
            console.error('❌ 商機搜尋錯誤:', error.message);
            throw error;
        }
    }

    // 2. 提取案場進度資料 (第一個資料庫)
    async extractSiteProgress(opportunityId) {
        console.log(`\n🏗️  提取案場進度資料 (商機: ${opportunityId})`);
        try {
            // 調用實際的 CRM API 獲取案場進度
            const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accessToken': this.accessToken
                },
                body: JSON.stringify({
                    dataObjectApiName: "ActiveRecordObj",
                    limit: 100,
                    searchQueryInfo: {
                        conditions: [{
                            fieldApiName: "opportunity_id",
                            operator: "EQ", 
                            values: [opportunityId]
                        }]
                    }
                })
            });

            const result = await response.json();
            if (result.errorCode === 0 && result.dataList) {
                console.log(`✅ 找到 ${result.dataList.length} 筆案場進度記錄`);
                
                // 轉換為我們的資料結構
                const siteProgressData = result.dataList.map(record => {
                    // 從 CRM 記錄中解析建築和樓層資訊
                    const buildingInfo = this.parseBuildingInfo(record);
                    return {
                        crm_record_id: record.data_object_id,
                        crm_opportunity_id: opportunityId,
                        building_name: buildingInfo.building,
                        floor_number: buildingInfo.floor,
                        construction_item: buildingInfo.item || "一般施工",
                        progress_percentage: buildingInfo.progress || 0,
                        status: buildingInfo.status || "pending",
                        contractor_name: buildingInfo.contractor,
                        notes: record.active_record_content || "",
                        crm_data: record
                    };
                });
                
                console.log('   樣本資料:', siteProgressData[0]);
                return siteProgressData;
            } else {
                console.log('⚠️  未找到案場進度資料');
                return [];
            }
        } catch (error) {
            console.error('❌ 案場進度提取錯誤:', error.message);
            return [];
        }
    }

    // 3. 提取銷售記錄資料 (第二個資料庫)  
    async extractSalesRecords(opportunityId) {
        console.log(`\n💰 提取銷售記錄資料 (商機: ${opportunityId})`);
        try {
            // 模擬銷售記錄資料
            const mockSalesRecords = [
                {
                    crm_record_id: "sale_001",
                    crm_opportunity_id: opportunityId,
                    customer_name: "王先生",
                    property_info: "A棟12F-A1",
                    sale_amount: 1200000,
                    sale_date: "2024-03-15",
                    payment_status: "已付訂金",
                    handover_status: "預計2024年底",
                    is_external_visible: true,
                    display_order: 1
                },
                {
                    crm_record_id: "sale_002", 
                    crm_opportunity_id: opportunityId,
                    customer_name: "李小姐",
                    property_info: "B棟4F-B3",
                    sale_amount: 1350000,
                    sale_date: "2024-04-20",
                    payment_status: "已付自備款",
                    handover_status: "已交屋",
                    is_external_visible: true,
                    display_order: 2
                }
            ];
            
            console.log(`✅ 找到 ${mockSalesRecords.length} 筆銷售記錄`);
            console.log('   樣本資料:', mockSalesRecords[0]);
            return mockSalesRecords;
        } catch (error) {
            console.error('❌ 銷售記錄提取錯誤:', error.message);
            return [];
        }
    }

    // 4. 提取維修單資料 (第三個資料庫)
    async extractMaintenanceOrders(opportunityId) {
        console.log(`\n🔧 提取維修單資料 (商機: ${opportunityId})`);
        try {
            // 模擬維修單資料
            const mockMaintenanceOrders = [
                {
                    crm_record_id: "repair_001",
                    crm_opportunity_id: opportunityId,
                    order_number: "R2024070801",
                    customer_name: "張先生",
                    property_location: "A棟10F-A2",
                    issue_description: "浴室漏水問題",
                    issue_category: "防水工程",
                    priority_level: "high",
                    status: "in_progress",
                    assigned_to: "築愛家有限公司",
                    estimated_date: "2024-07-25",
                    estimated_cost: 15000
                },
                {
                    crm_record_id: "repair_002",
                    crm_opportunity_id: opportunityId, 
                    order_number: "R2024070802",
                    customer_name: "陳小姐",
                    property_location: "C棟8F-C5",
                    issue_description: "門窗密合度不佳",
                    issue_category: "門窗工程",
                    priority_level: "normal",
                    status: "pending",
                    assigned_to: "塔塔家建材有限公司",
                    estimated_date: "2024-08-01",
                    estimated_cost: 8000
                }
            ];
            
            console.log(`✅ 找到 ${mockMaintenanceOrders.length} 筆維修單`);
            console.log('   樣本資料:', mockMaintenanceOrders[0]);
            return mockMaintenanceOrders;
        } catch (error) {
            console.error('❌ 維修單提取錯誤:', error.message);
            return [];
        }
    }

    // 輔助函數：解析建築資訊
    parseBuildingInfo(record) {
        // 從 CRM 記錄中解析建築、樓層、工班等資訊
        // 這裡需要根據實際的 CRM 資料結構來調整
        const content = record.active_record_content || "";
        
        let building = "未知棟別";
        let floor = 0;
        let contractor = "未分配";
        
        // 解析棟別
        if (content.includes("A棟")) building = "A棟";
        else if (content.includes("B棟")) building = "B棟"; 
        else if (content.includes("C棟")) building = "C棟";
        
        // 解析樓層
        const floorMatch = content.match(/(\d+)F/);
        if (floorMatch) floor = parseInt(floorMatch[1]);
        
        // 解析工班
        if (content.includes("王大誠")) contractor = "王大誠";
        else if (content.includes("築愛家")) contractor = "築愛家有限公司";
        else if (content.includes("塔塔家")) contractor = "塔塔家建材有限公司";
        
        return { building, floor, contractor };
    }

    // 主要執行函數
    async executeFullExtraction() {
        console.log('=== CRM 數據提取測試 - 完整流程 ===\n');
        
        try {
            // 1. 獲取 Token
            await this.getAccessToken();
            
            // 2. 搜尋商機
            const opportunity = await this.searchOpportunities("興安西");
            
            // 3. 提取三類資料
            const [siteProgress, salesRecords, maintenanceOrders] = await Promise.all([
                this.extractSiteProgress(opportunity.id),
                this.extractSalesRecords(opportunity.id), 
                this.extractMaintenanceOrders(opportunity.id)
            ]);
            
            // 4. 統計結果
            console.log('\n📊 提取結果統計:');
            console.log(`   商機資料: 1 筆`);
            console.log(`   案場進度: ${siteProgress.length} 筆`);
            console.log(`   銷售記錄: ${salesRecords.length} 筆`);
            console.log(`   維修單: ${maintenanceOrders.length} 筆`);
            
            // 5. 返回完整資料
            return {
                opportunity,
                siteProgress,
                salesRecords,
                maintenanceOrders
            };
            
        } catch (error) {
            console.error('❌ 完整提取流程失敗:', error.message);
            throw error;
        }
    }
}

// 執行測試
async function testCRMExtraction() {
    const extractor = new CRMDataExtractor();
    try {
        const result = await extractor.executeFullExtraction();
        console.log('\n🎉 CRM 數據提取測試完成!');
        console.log('\n下一步: 將這些資料同步到 D1 資料庫');
    } catch (error) {
        console.error('\n💥 測試失敗:', error.message);
    }
}

// 執行測試
testCRMExtraction();