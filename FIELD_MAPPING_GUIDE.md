# 欄位映射統一指南
*建立時間：2025-07-25*

## 🎯 **目的**
統一 D1資料庫、前端表單、CRM 三方的欄位名稱對應關係，確保數據一致性和維護便利性。

## 📋 **核心施工進度欄位映射**

| 功能描述 | 前端表單ID | D1資料庫欄位 | CRM API名稱 | 數據類型 | 備註 |
|---------|-----------|-------------|------------|---------|------|
| **基本資訊** |
| 專案ID | - | project_id | - | TEXT | 內部使用 |
| 商機ID | - | crm_opportunity_id | field_1P96q__c | TEXT | 關聯商機 |
| 案場ID | - | site_id | _id | TEXT | CRM案場記錄ID |
| 建築棟別 | currentBuilding | building_name | field_WD7k1__c | TEXT | A/B/C棟 |
| 樓層 | currentFloor | floor_number | field_Q6Svh__c | INTEGER | 數字樓層 |
| 戶別 | currentUnit | unit_name | field_XuJP2__c | TEXT | A1/A2等 |
| **施工資訊** |
| 舖設坪數 | constructionArea | area | field_B2gh1__c | DECIMAL | 實際舖設面積 |
| 工地坪數 | - | site_area | field_tXAko__c | DECIMAL | 案場總坪數 |
| 施工日期 | constructionDate | actual_start_date | field_23pFq__c | DATE | 實際施工日期 |
| 工班師父 | constructionContractor | contractor_name | field_u1wpv__c | TEXT | 施工師父名稱 |
| 施工完成狀態 | constructionCompleted | construction_completed | construction_completed__c | BOOLEAN | 是/否 |
| **備註與照片** |
| 施工前特別備註 | preConstructionNote | pre_construction_note | field_sF6fn__c | TEXT | 施工前注意事項 |
| 工班備註 | - | contractor_note | field_V32Xl__c | TEXT | 工班填寫備註 |
| 工地備註 | - | site_note | field_g18hX__c | TEXT | 工地狀況備註 |
| 驗收備註 | - | acceptance_note | field_n37jC__c | TEXT | 驗收相關備註 |
| 施工前照片 | prePhotos | pre_photos | field_V3d91__c | JSON/BLOB | 施工前照片 |
| 完工照片 | completionPhotos | completion_photos | field_3Fqof__c | JSON/BLOB | 完工照片 |
| 工地狀況照片 | - | site_condition_photos | field_03U9h__c | JSON/BLOB | 工地狀況記錄 |
| 驗收照片 | - | acceptance_photos | field_v1x3S__c | JSON/BLOB | 驗收照片 |
| **維修相關** |
| 缺失分類1 | - | defect_category_1 | field_OmPo8__c | TEXT | 多選：刮傷/矽力康/空心等 |
| 缺失分類2 | - | defect_category_2 | field_32Hxs__c | TEXT | 單選：示例選項/其他 |
| 缺失備註1 | - | defect_note_1 | field_nht8k__c | TEXT | 缺失描述1 |
| 缺失備註2 | - | defect_note_2 | field_dXrfQ__c | TEXT | 缺失描述2 |
| 缺失照片1 | - | defect_photos_1 | field_tyRfE__c | JSON/BLOB | 缺失照片1 |
| 缺失照片2 | - | defect_photos_2 | field_62279__c | JSON/BLOB | 缺失照片2 |
| 維修日期1 | - | repair_date_1 | field_r1mp8__c | DATE | 第一次維修日期 |
| 維修日期2 | - | repair_date_2 | field_2io60__c | DATE | 第二次維修日期 |
| 維修費用1 | - | repair_cost_1 | field_7ndUg__c | DECIMAL | 第一次維修費用 |
| 維修費用2 | - | repair_cost_2 | field_2jM31__c | DECIMAL | 第二次維修費用 |
| **狀態管理** |
| 進度百分比 | - | progress_percentage | - | INTEGER | 0-100 |
| 狀態 | - | status | - | TEXT | pending/in-progress/completed |
| 階段 | - | stage | field_z9H6O__c | TEXT | 準備中/施工前場勘/施工/驗收等 |
| 標籤 | - | tags | field_23Z5i__c | TEXT | 多選：準備中/不可施工/可施工等 |
| **系統欄位** |
| 創建時間 | - | created_at | create_time | TIMESTAMP | 記錄創建時間 |
| 更新時間 | - | updated_at | last_modified_time | TIMESTAMP | 最後修改時間 |
| CRM記錄ID | - | crm_record_id | _id | TEXT | CRM中的記錄ID |
| CRM最後同步時間 | - | crm_last_sync | - | TIMESTAMP | 最後同步到CRM時間 |

---

## 🔄 **資料同步流程**

### 前端 → D1 → CRM
```javascript
// 前端表單數據收集
const formData = {
    preConstructionNote: document.getElementById('preConstructionNote').value,
    constructionArea: document.getElementById('constructionArea').value,
    constructionDate: document.getElementById('constructionDate').value,
    constructionContractor: document.getElementById('constructionContractor').value,
    // ...其他欄位
};

// D1資料庫保存
const d1Data = {
    pre_construction_note: formData.preConstructionNote,
    area: formData.constructionArea,
    actual_start_date: formData.constructionDate,
    contractor_name: formData.constructionContractor,
    // ...對應的D1欄位
};

// CRM API同步
const crmData = {
    field_sF6fn__c: formData.preConstructionNote,
    field_B2gh1__c: formData.constructionArea,
    field_23pFq__c: formData.constructionDate,
    field_u1wpv__c: formData.constructionContractor,
    // ...對應的CRM API名稱
};
```

---

## 🎯 **實作建議**

### 1. 建立統一的欄位轉換函數
```javascript
// 欄位映射配置
const FIELD_MAPPING = {
    preConstructionNote: {
        d1: 'pre_construction_note',
        crm: 'field_sF6fn__c',
        type: 'text'
    },
    constructionArea: {
        d1: 'area',
        crm: 'field_B2gh1__c',
        type: 'decimal'
    },
    // ...更多欄位
};

// 轉換函數
function convertFormToD1(formData) {
    const d1Data = {};
    Object.keys(formData).forEach(key => {
        if (FIELD_MAPPING[key]) {
            d1Data[FIELD_MAPPING[key].d1] = formData[key];
        }
    });
    return d1Data;
}

function convertFormToCRM(formData) {
    const crmData = {};
    Object.keys(formData).forEach(key => {
        if (FIELD_MAPPING[key]) {
            crmData[FIELD_MAPPING[key].crm] = formData[key];
        }
    });
    return crmData;
}
```

### 2. 更新D1資料庫結構
```sql
-- 建議的D1資料庫表結構更新
ALTER TABLE site_progress ADD COLUMN pre_construction_note TEXT;
ALTER TABLE site_progress ADD COLUMN contractor_note TEXT;
ALTER TABLE site_progress ADD COLUMN site_note TEXT;
ALTER TABLE site_progress ADD COLUMN acceptance_note TEXT;
ALTER TABLE site_progress ADD COLUMN pre_photos TEXT; -- JSON格式
ALTER TABLE site_progress ADD COLUMN completion_photos TEXT; -- JSON格式
ALTER TABLE site_progress ADD COLUMN defect_category_1 TEXT;
ALTER TABLE site_progress ADD COLUMN defect_category_2 TEXT;
-- ...更多欄位
```

### 3. 前端表單ID統一
```html
<!-- 統一表單欄位ID -->
<textarea id="preConstructionNote" placeholder="施工前特別備註"></textarea>
<input id="constructionArea" type="number" placeholder="舖設坪數">
<input id="constructionDate" type="date" placeholder="施工日期">
<input id="constructionContractor" type="text" placeholder="工班師父">
```

---

## 📊 **目前狀態檢查**

### ✅ 已實現的映射
- preConstructionNote → notes(JSON) → field_sF6fn__c
- constructionArea → area → field_B2gh1__c
- constructionDate → actual_start_date → field_23pFq__c
- constructionContractor → contractor_name → field_u1wpv__c

### 🔄 待統一的映射
- 照片欄位的統一處理
- 維修相關欄位的完整映射
- 狀態和階段欄位的同步
- 時間戳欄位的標準化

---

## 🚀 **下一步行動**

1. **重構後端API**：使用統一的欄位映射配置
2. **更新前端表單**：確保所有ID符合映射規範
3. **擴展D1表結構**：添加缺失的重要欄位
4. **完善CRM同步**：實現所有欄位的雙向同步
5. **添加資料驗證**：確保三方數據格式一致性

---

*本文檔應與程式碼同步更新，確保映射關係的準確性*