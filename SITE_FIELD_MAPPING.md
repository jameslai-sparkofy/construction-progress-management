# 案場三層欄位對應關係表
*更新時間: 2025-07-24*

## 概述
建立前台案場輸入欄位 → D1 資料庫 → CRM 案場對象的完整對應關係

## 三層架構說明

### 1. 前台案場表單欄位 (frontend/project.html)
```html
<!-- 施工資訊輸入表單 -->
<textarea id="preConstructionNote">施工前特別備註</textarea>
<input type="file" id="prePhotos" multiple>施工前照片
<input type="file" id="completionPhotos" multiple>完工照片
<input type="radio" name="constructionCompleted">施工完成狀態
<input type="date" id="constructionDate">施工日期
<input type="number" id="constructionArea">舖設坪數
<input type="text" id="constructionContractor">施工人員/工班師父
```

### 2. D1 資料庫表結構
#### sites 表 (案場基本資訊)
```sql
CREATE TABLE sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    opportunity_id TEXT,
    address TEXT,
    status TEXT,
    building_type TEXT,
    floor_info TEXT,
    room_info TEXT,
    create_time INTEGER,
    update_time INTEGER,
    synced_at INTEGER,
    raw_data TEXT
)
```

#### site_progress 表 (施工進度資訊)
```sql
CREATE TABLE site_progress (
    id TEXT PRIMARY KEY,
    crm_opportunity_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    building_name TEXT NOT NULL,
    floor_number INTEGER NOT NULL,
    construction_item TEXT NOT NULL,
    progress_percentage INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    contractor_name TEXT,
    start_date DATE,
    end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    notes TEXT,
    crm_record_id TEXT,
    crm_last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    site_id TEXT
)
```

### 3. CRM 案場對象 (object_8W9cb__c)
```javascript
// 關鍵欄位對應
{
    "dataObjectApiName": "object_8W9cb__c",
    "_id": "案場記錄ID",
    "field_sF6fn__c": "施工前備註",
    "field_V3d91__c": "施工前照片",
    "field_3Fqof__c": "完工照片", 
    "construction_completed__c": "施工完成",
    "field_23pFq__c": "施工日期",
    "field_B2gh1__c": "舖設坪數",
    "field_u1wpv__c": "工班師父",
    "field_WD7k1__c": "棟別",
    "field_Q6Svh__c": "樓層",
    "field_XuJP2__c": "戶別",
    "name": "編號(自增)",
    "field_1P96q__c": "商機(關聯)"
}
```

## 完整欄位對應表

| **功能** | **前台欄位** | **D1 欄位** | **CRM 欄位** | **資料類型** | **說明** |
|----------|-------------|-------------|-------------|-------------|----------|
| **基本資訊** | | | | | |
| 案場編號 | - | id | _id | TEXT | CRM ID 作為主鍵 |
| 案場名稱 | - | name | name | TEXT | 自增編號 |
| 商機關聯 | - | opportunity_id | field_1P96q__c | TEXT | 查找關聯 |
| 棟別 | building | building_name | field_WD7k1__c | TEXT | A棟/B棟/C棟 |
| 樓層 | floor | floor_number | field_Q6Svh__c | INTEGER | 樓層數字 |
| 戶別 | unit | construction_item | field_XuJP2__c | TEXT | 戶別編號 |
| **施工資訊** | | | | | |
| 施工前備註 | preConstructionNote | notes | field_sF6fn__c | TEXT | 特別注意事項 |
| 施工前照片 | prePhotos | - | field_V3d91__c | 图片 | 多張照片上傳 |
| 完工照片 | completionPhotos | - | field_3Fqof__c | 图片 | 多張照片上傳 |
| 施工完成狀態 | constructionCompleted | status | construction_completed__c | BOOLEAN | true/false |
| 施工日期 | constructionDate | actual_start_date | field_23pFq__c | DATE | 實際施工日期 |
| 舖設坪數 | constructionArea | - | field_B2gh1__c | INTEGER | 施工面積 |
| 工班師父 | constructionContractor | contractor_name | field_u1wpv__c | TEXT | 施工人員名稱 |
| **進度管理** | | | | | |
| 進度百分比 | - | progress_percentage | - | INTEGER | 0-100% |
| 開始日期 | - | start_date | - | DATE | 預計開始 |
| 結束日期 | - | end_date | - | DATE | 預計完成 |
| 實際完成日期 | - | actual_end_date | - | DATE | 實際完成 |
| **同步資訊** | | | | | |
| CRM 記錄ID | - | crm_record_id | _id | TEXT | 對應 CRM ID |
| 最後同步時間 | - | crm_last_sync | - | TIMESTAMP | 同步時間戳 |
| 建立時間 | - | created_at | create_time | TIMESTAMP | 記錄建立時間 |
| 更新時間 | - | updated_at | last_modified_time | TIMESTAMP | 最後更新時間 |

## 資料流程圖

```
前台表單提交
    ↓
D1 資料庫更新 (site_progress 表)
    ↓ (觸發器)
自動同步到 CRM (object_8W9cb__c)
```

## 實作注意事項

### 1. 資料類型轉換
- **日期格式**: 前台 HTML date → D1 DATE → CRM 日期時間戳
- **布林值**: 前台 radio button → D1 TEXT → CRM 布尔值
- **圖片**: 前台 File → Base64 → CRM 图片欄位
- **數字**: 前台 number → D1 INTEGER → CRM 数字

### 2. 必填欄位檢查
```javascript
// CRM 必填欄位
const requiredFields = {
    "name": "編號", // 自增，系統產生
    "owner": "負責人", // 需要設定預設值
    "tenant_id": "租戶ID", // 系統設定
    "object_describe_api_name": "對象描述" // 固定值
};
```

### 3. 同步時機
- **即時同步**: 表單提交時立即同步
- **批量同步**: 定時任務每小時同步
- **失敗重試**: 同步失敗時自動重試機制

### 4. 欄位驗證規則
```javascript
const fieldValidation = {
    "field_sF6fn__c": { maxLength: 255, required: false },
    "construction_completed__c": { type: "boolean", required: false },
    "field_B2gh1__c": { type: "number", min: 0, required: false },
    "field_Q6Svh__c": { type: "number", min: 1, required: false }
};
```

## 測試驗證
- ✅ 前台表單提交正常
- ✅ D1 資料庫保存成功
- ✅ CRM 同步測試通過 (field_u1wpv__c = "TEST")
- ⏳ 完整資料流程測試待執行

## 下一步工作
1. 實作 D1 資料變化觸發器
2. 建立自動同步到 CRM 的機制
3. 新增錯誤處理和重試邏輯
4. 實作批量同步功能