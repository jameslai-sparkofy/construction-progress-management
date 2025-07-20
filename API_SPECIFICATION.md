# API 規格文檔 - 工程進度管理系統

## 基礎資訊

**Base URL**: `https://progress.yourcompany.com/{projectToken}/api`  
**版本**: v1  
**認證方式**: Session Token (Cookie)  
**內容類型**: application/json

## 認證和會話

### 登入
```http
POST /api/auth/login
Content-Type: application/json

{
  "phone": "0912345678",
  "password": "678"
}
```

**成功響應 (200)**:
```json
{
  "success": true,
  "user": {
    "name": "王大誠",
    "shortName": "誠",
    "role": "contractor_leader",
    "avatar": "王",
    "buildings": ["B棟"],
    "contractor": "王大誠",
    "email": "wang@example.com"
  },
  "sessionId": "sess_abc123def456"
}
```

**錯誤響應 (401)**:
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

### 登出
```http
POST /api/auth/logout
Cookie: sessionId=sess_abc123def456
```

**響應 (200)**:
```json
{
  "success": true
}
```

### 驗證會話
```http
GET /api/auth/verify
Cookie: sessionId=sess_abc123def456
```

**成功響應 (200)**:
```json
{
  "valid": true,
  "user": {
    "name": "王大誠",
    "role": "contractor_leader",
    "buildings": ["B棟"]
  }
}
```

## 用戶管理

### 獲取用戶列表
```http
GET /api/users
Cookie: sessionId=sess_abc123def456
```

**權限**: admin, contractor_leader (僅自己工班)

**響應 (200)**:
```json
{
  "users": [
    {
      "phone": "0912345678",
      "name": "王大誠",
      "shortName": "誠",
      "role": "contractor_leader",
      "buildings": ["B棟"],
      "contractor": "王大誠",
      "email": "wang@example.com"
    }
  ]
}
```

### 新增用戶
```http
POST /api/users
Cookie: sessionId=sess_abc123def456
Content-Type: application/json

{
  "name": "王小明",
  "phone": "0912345679",
  "shortName": "明",
  "password": "679",
  "role": "member",
  "contractor": "王大誠",
  "email": "ming@example.com"
}
```

**權限**: admin, contractor_leader

**成功響應 (201)**:
```json
{
  "success": true,
  "user": {
    "phone": "0912345679",
    "name": "王小明",
    "shortName": "明",
    "role": "member"
  }
}
```

### 更新用戶
```http
PUT /api/users/0912345679
Cookie: sessionId=sess_abc123def456
Content-Type: application/json

{
  "name": "王小明",
  "shortName": "明",
  "email": "newming@example.com"
}
```

**權限**: admin, contractor_leader, self

### 刪除用戶
```http
DELETE /api/users/0912345679
Cookie: sessionId=sess_abc123def456
```

**權限**: admin, contractor_leader

## 工班管理

### 獲取工班列表
```http
GET /api/contractors
Cookie: sessionId=sess_abc123def456
```

**響應 (200)**:
```json
{
  "contractors": [
    {
      "id": 1,
      "name": "王大誠",
      "shortName": "誠",
      "phone": "0912-345-678",
      "type": "individual",
      "buildings": ["B棟"],
      "floors": "4F-15F",
      "email": "wang@example.com",
      "members": [
        {
          "id": 1,
          "name": "王大誠",
          "shortName": "誠",
          "phone": "0912345678",
          "role": "leader",
          "email": "wang@example.com"
        }
      ]
    }
  ]
}
```

### 新增工班
```http
POST /api/contractors
Cookie: sessionId=sess_abc123def456
Content-Type: application/json

{
  "name": "新工班",
  "shortName": "新",
  "phone": "0923456789",
  "type": "company",
  "buildings": ["A棟"],
  "floors": "1F-10F",
  "email": "new@example.com"
}
```

**權限**: admin

### 工班成員管理
```http
POST /api/contractors/1/members
PUT /api/contractors/1/members/2
DELETE /api/contractors/1/members/2
```

**權限**: admin, contractor_leader (僅自己工班)

## 施工進度管理

### 獲取建築進度
```http
GET /api/progress/B
Cookie: sessionId=sess_abc123def456
```

**響應 (200)**:
```json
{
  "building": {
    "name": "B棟",
    "contractor": "王大誠",
    "floors": ["15F", "14F", "13F", "12F", "11F", "10F", "9F", "8F", "7F", "6F", "5F", "4F", "3F", "2F"],
    "units": ["B1", "B2", "B3", "B4", "B5", "B6"],
    "progress": {
      "4F": {
        "B1": "completed",
        "B2": "issue", 
        "B3": "completed"
      }
    }
  }
}
```

### 獲取施工記錄
```http
GET /api/construction?building=B&floor=4F&unit=B1
Cookie: sessionId=sess_abc123def456
```

**響應 (200)**:
```json
{
  "record": {
    "id": "B_4F_B1_20250719",
    "building": "B",
    "floor": "4F",
    "unit": "B1", 
    "area": 22.1,
    "date": "2025-07-19",
    "contractor": "王大誠",
    "contractorShortName": "誠",
    "note": "客廳臥一、臥二更換22.1坪(Y5003阿米特)",
    "status": "completed",
    "createdAt": "2025-07-19T10:30:00Z",
    "updatedAt": "2025-07-19T10:30:00Z"
  }
}
```

### 新增/更新施工記錄
```http
POST /api/construction
Cookie: sessionId=sess_abc123def456
Content-Type: application/json

{
  "building": "B",
  "floor": "4F", 
  "unit": "B1",
  "area": 22.1,
  "date": "2025-07-19",
  "contractor": "王大誠",
  "note": "客廳臥一、臥二更換",
  "status": "completed"
}
```

**權限**: admin, contractor_leader, member (僅負責建築)

**成功響應 (201)**:
```json
{
  "success": true,
  "record": {
    "id": "B_4F_B1_20250719",
    "building": "B",
    "floor": "4F",
    "unit": "B1",
    "area": 22.1,
    "date": "2025-07-19",
    "contractor": "王大誠",
    "contractorShortName": "誠",
    "status": "completed"
  }
}
```

## 維修單管理

### 獲取維修單列表
```http
GET /api/repair-orders?building=B&status=正常
Cookie: sessionId=sess_abc123def456
```

**響應 (200)**:
```json
{
  "repairOrders": [
    {
      "id": "2025-07-15-06",
      "name": "2025-07-15-06",
      "date": "2025/7/15",
      "building": "B棟", 
      "floor": "4F",
      "unit": "B1",
      "contractor": "王大誠",
      "description": "客廳臥一、臥二更換22.1坪(Y5003阿米特)",
      "status": "正常",
      "opportunity": "勝興-興安西-2024"
    }
  ]
}
```

## 跟進記錄管理

### 獲取跟進記錄
```http
GET /api/followup-records?external=true
Cookie: sessionId=sess_abc123def456
```

**響應 (200)**:
```json
{
  "followupRecords": [
    {
      "id": "687907732a14650001438a66",
      "name": "2025-07-17-004212",
      "date": "2025/7/17",
      "time": "22:23:47",
      "creator": "賴俊穎",
      "type": "親自拜訪",
      "importance": "重要",
      "content": "TEST",
      "isExternal": true
    }
  ]
}
```

## 統計數據

### 獲取項目統計
```http
GET /api/stats
Cookie: sessionId=sess_abc123def456
```

**響應 (200)**:
```json
{
  "stats": {
    "totalBuildings": 3,
    "totalUnits": 224,
    "totalContractors": 3,
    "totalRepairOrders": 3,
    "overallProgress": 72,
    "buildingProgress": {
      "A": 65,
      "B": 78, 
      "C": 45
    }
  }
}
```

## Fxiaoke 數據同步

### 手動同步數據
```http
POST /api/sync/fxiaoke
Cookie: sessionId=sess_abc123def456
```

**權限**: admin

**響應 (200)**:
```json
{
  "success": true,
  "syncResults": {
    "repairOrders": {
      "synced": 5,
      "updated": 2,
      "created": 3
    },
    "followupRecords": {
      "synced": 8,
      "updated": 1,
      "created": 7
    },
    "lastSyncTime": "2025-07-19T12:00:00Z"
  }
}
```

### 獲取同步狀態
```http
GET /api/sync/status
Cookie: sessionId=sess_abc123def456
```

**響應 (200)**:
```json
{
  "lastSyncTime": "2025-07-19T12:00:00Z",
  "syncStatus": "completed",
  "nextScheduledSync": "2025-07-19T13:00:00Z",
  "isAutoSyncEnabled": true
}
```

## 錯誤處理

### 標準錯誤格式
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  }
}
```

### 常見錯誤碼

| 狀態碼 | 錯誤碼 | 描述 |
|--------|--------|------|
| 400 | INVALID_REQUEST | 請求格式錯誤 |
| 401 | UNAUTHORIZED | 未認證或會話過期 |
| 403 | FORBIDDEN | 權限不足 |
| 404 | NOT_FOUND | 資源不存在 |
| 409 | CONFLICT | 數據衝突 |
| 422 | VALIDATION_ERROR | 數據驗證失敗 |
| 429 | RATE_LIMIT | 請求頻率超限 |
| 500 | INTERNAL_ERROR | 服務器內部錯誤 |
| 502 | EXTERNAL_API_ERROR | 外部 API 調用失敗 |

## 數據驗證規則

### 用戶數據
- **手機號碼**: 11位數字，以09開頭
- **姓名**: 1-20字符，不能為空
- **簡稱**: 1個字符
- **密碼**: 3-20字符
- **Email**: 有效的 Email 格式

### 施工記錄
- **建築**: A/B/C
- **樓層**: 符合格式 "數字F"
- **單位**: 符合格式 "字母+數字"
- **坪數**: 大於0的數字，最多2位小數
- **日期**: YYYY-MM-DD 格式

## 限流規則

| 端點類型 | 限制 |
|----------|------|
| 認證 API | 10 次/分鐘 |
| 查詢 API | 100 次/分鐘 |
| 寫入 API | 50 次/分鐘 |
| 同步 API | 5 次/小時 |

## 緩存策略

| 數據類型 | 緩存時間 |
|----------|----------|
| 用戶資料 | 15 分鐘 |
| 工班資料 | 30 分鐘 |
| 施工記錄 | 5 分鐘 |
| 維修單 | 10 分鐘 |
| 跟進記錄 | 10 分鐘 |

---

**版本**: 1.0  
**最後更新**: 2025-07-19  
**維護人員**: 開發團隊