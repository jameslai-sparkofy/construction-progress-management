# 紛享銷客API文檔分析

## 根據官方文檔的重要發現

### 1. 銷售記錄API的正確格式

根據紛享銷客幫助文檔，銷售記錄（ActiveRecordObj）的API調用格式如下：

#### 查詢銷售記錄
```javascript
// 官方文檔示例
APIResult ret = Fx.object.find("ActiveRecordObj", 
    FQLAttribute.builder()
        .columns(["_id", "name"])
        .queryTemplate(
            QueryTemplate.AND(
                ["related_api_names":Operator.EQ("AccountObj")],
                ["related_object_data":Operator.IN(["_id","635202caef27f300011b1c3a"])]
            ))
        .build(),
    SelectAttribute.builder()
        .build())
```

#### 關鍵發現
1. **對象名稱**: `ActiveRecordObj`
2. **查詢方法**: `Fx.object.find`
3. **關聯查詢**: 使用 `related_object_data` 字段
4. **查詢模板**: 使用 `QueryTemplate.AND` 格式

### 2. 可能的API端點

基於文檔分析，可能的端點包括：

#### 方法1: 對象查詢API
```
POST /cgi/crm/object/find
```

#### 方法2: 標準數據查詢API  
```
POST /cgi/crm/data/query
```

#### 方法3: V2數據查詢API
```
POST /cgi/crm/v2/data/query
```

#### 方法4: 對象查詢API
```
POST /cgi/crm/object/query
```

### 3. 請求格式分析

#### 標準格式
```javascript
{
    corpId: "企業ID",
    corpAccessToken: "訪問令牌",
    currentOpenUserId: "用戶ID",
    apiName: "API名稱",
    data: {
        objectApiName: "ActiveRecordObj", // 或 dataType
        // 查詢參數
    }
}
```

#### 查詢模板格式
```javascript
{
    objectApiName: "ActiveRecordObj",
    columns: ["_id", "name", "create_time", "opportunity_id", "external_display"],
    queryTemplate: {
        logic: "AND",
        filters: [
            {
                field_name: "opportunity_id",
                operator: "EQ",
                field_values: ["650fe201d184e50001102aee"]
            }
        ]
    },
    limit: 20,
    offset: 0
}
```

### 4. 重要欄位

#### 商機關聯欄位
- `opportunity_id`: 商機ID
- `related_object`: 關聯對象
- `related_object_data`: 關聯對象數據
- `related_api_names`: 關聯API名稱

#### 外部顯示欄位
- `external_display`: 外部顯示
- `field_external_display`: 外部顯示字段
- `is_external_display`: 是否外部顯示
- `show_external`: 顯示外部

### 5. 與我們之前測試的差異

#### 之前的錯誤
1. **缺少 apiName 參數**: 標準對象查詢需要 `apiName` 參數
2. **端點選擇錯誤**: 使用了自定義對象的端點
3. **參數格式不正確**: 使用了 `dataType` 而非 `objectApiName`

#### 正確的格式
```javascript
// 正確格式
{
    corpId: corpId,
    corpAccessToken: token,
    currentOpenUserId: userId,
    apiName: "crm.object.find", // 必需的API名稱
    data: {
        objectApiName: "ActiveRecordObj", // 使用 objectApiName
        columns: ["_id", "name", "create_time"],
        queryTemplate: {
            logic: "AND",
            filters: [...]
        }
    }
}
```

### 6. 測試策略

#### 測試文件: `test_activerecord_correct.js`
1. **多端點測試**: 同時測試4種可能的端點
2. **參數格式測試**: 測試不同的參數組合
3. **欄位檢查**: 檢查返回的欄位結構
4. **關聯查詢**: 測試商機關聯查詢
5. **外部顯示過濾**: 測試外部顯示欄位過濾

#### 測試順序
1. 獲取Token和用戶信息
2. 測試基本的銷售記錄查詢
3. 確定正確的端點和格式
4. 測試特定商機的記錄查詢
5. 測試外部顯示過濾

### 7. 預期結果

如果API調用成功，應該能夠：
1. 獲取銷售記錄列表
2. 查看記錄的完整欄位結構
3. 找到商機關聯的欄位名稱
4. 找到外部顯示控制的欄位名稱
5. 實現按商機ID和外部顯示條件的過濾

### 8. 下一步計劃

1. **運行測試**: 執行 `test_activerecord_correct.js`
2. **確認格式**: 找到正確的API格式
3. **更新系統**: 將正確的格式應用到跟進記錄功能
4. **完善過濾**: 實現外部顯示=「顯示」的過濾條件
5. **整合UI**: 將API整合到前端界面

### 9. 參考資源

- 紛享開放平台: https://open.fxiaoke.com/
- 開發文檔: https://open.fxiaoke.com/wiki.html
- 銷售記錄函數文檔: https://help.fxiaoke.com/0568/fc26/0f8b/11e5/5e3b/8298
- 銷售記錄後台配置: https://help.fxiaoke.com/a4b8/1e21/e3b7