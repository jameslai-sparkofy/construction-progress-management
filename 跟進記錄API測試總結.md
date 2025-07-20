# 跟進記錄API測試總結

## 測試現況

### 已成功的API調用
✅ **維修單查詢**（自定義對象）
- 端點：`/cgi/crm/custom/v2/data/query`
- 對象：`on_site_signature__c`
- 參數格式：`dataObjectApiName`

✅ **案場查詢**（自定義對象）  
- 端點：`/cgi/crm/custom/v2/data/query`
- 對象：`object_8W9cb__c`
- 參數格式：`dataObjectApiName`

### 尚未成功的API調用
❌ **跟進記錄查詢**（標準對象）
- 對象：`ActiveRecordObj`
- 問題：找不到正確的API端點和參數格式

## 發現的關鍵問題

### 1. 自定義對象 vs 標準對象的差異
```javascript
// 自定義對象（已成功）
{
    data: {
        dataObjectApiName: "on_site_signature__c",  // 使用 dataObjectApiName
        search_query_info: { ... }
    }
}
// 端點：/cgi/crm/custom/v2/data/query

// 標準對象（尚未成功）  
{
    data: {
        dataType: "ActiveRecordObj",  // 使用 dataType
        search_query_info: { ... }
    }
}
// 端點：需要確認正確端點
```

### 2. 嘗試過的端點（都失敗）
- `/cgi/crm/data/query` - 缺少 apiName 參數
- `/cgi/crm/v2/data/query` - 缺少 apiName 參數  
- `/cgi/data/query` - 端點不存在
- `/cgi/crm/activerecord/query` - 端點不存在
- `/cgi/crm/followup/query` - 端點不存在

### 3. 錯誤信息分析
```
"errorCode": 10006,
"errorMessage": "the parameter apiName is missing or illegal"
```

這表示標準對象查詢需要額外的 `apiName` 參數。

## 建議的解決方案

### 方案1：添加 apiName 參數
根據錯誤信息，嘗試在請求中添加 `apiName` 參數：

```javascript
{
    corpId: corpId,
    corpAccessToken: token,
    currentOpenUserId: userId,
    apiName: "crm.data.query",  // 添加此參數
    data: {
        dataType: "ActiveRecordObj",
        search_query_info: { ... }
    }
}
```

### 方案2：使用OpenAPI格式
某些標準對象可能需要使用OpenAPI格式：

```javascript
// 端點：/cgi/crm/v2/data/query
{
    corpId: corpId,
    corpAccessToken: token,
    currentOpenUserId: userId,
    apiName: "openapi.crm.data.query",
    data: {
        objectApiName: "ActiveRecordObj",  // 使用 objectApiName
        pageSize: 10,
        pageNumber: 1,
        filters: [...]
    }
}
```

### 方案3：查詢商機下的跟進記錄
直接查詢商機對象，獲取其關聯的跟進記錄：

```javascript
// 先查詢商機
{
    data: {
        dataType: "OpportunityObj",
        search_query_info: {
            filters: [{
                field_name: "name",
                field_values: ["勝興-興安西-2024"],
                operator: "EQ"
            }],
            include_detail: true  // 包含詳細信息和關聯記錄
        }
    }
}
```

## 推薦的測試步驟

### 第一步：確認IP白名單
目前遇到IP白名單限制，需要先解決：
```
"the source ip[49.215.22.37] is not in the ip white list"
```

### 第二步：測試標準對象查詢
1. 嘗試添加 `apiName` 參數的方案
2. 測試不同的端點和參數組合
3. 查看紛享銷客開發者文檔的標準對象查詢說明

### 第三步：確認跟進記錄的數據結構
1. 確認跟進記錄的確切對象名稱（可能不是 ActiveRecordObj）
2. 確認商機關聯欄位的名稱
3. 確認外部顯示欄位的名稱

## 臨時解決方案

在找到正確的跟進記錄API之前，可以考慮：

### 1. 使用已成功的API建立原型
先用維修單和案場數據建立完整的UI和功能流程，跟進記錄暫時用模擬數據。

### 2. 聯繫紛享銷客技術支持
獲取標準對象查詢的準確API文檔和示例。

### 3. 檢查紛享銷客管理後台
確認跟進記錄對象的確切API名稱和可用欄位。

## 下一步行動

1. **高優先級**：解決IP白名單問題
2. **中優先級**：測試標準對象API的不同格式
3. **低優先級**：繼續開發其他功能模組

## 相關檔案
- `test_followup_correct.js` - 最新的跟進記錄測試
- `test_standard_objects.js` - 標準對象測試
- `跟進記錄分頁設計.md` - UI設計規範
- `fixed_fxiaoke_tool.html` - 成功的API調用參考