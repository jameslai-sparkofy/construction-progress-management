---
title: Project Structure
description: "定義項目的目錄結構、檔案組織和命名規範"
inclusion: always
---

# 項目結構規範

## 目錄架構概覽

```
工程進度網頁/
├── .ai-rules/                    # AI助手指導文檔
│   ├── product.md               # 產品願景和需求
│   ├── tech.md                  # 技術架構規範
│   └── structure.md             # 項目結構規範
├── frontend/                    # 前端靜態資源
│   ├── index.html              # 專案管理總覽頁面
│   ├── project.html            # 專案詳情頁面
│   ├── create.html             # 建立專案頁面
│   └── assets/                 # 靜態資源
├── src/                        # 主要源代碼
│   └── index.js                # Cloudflare Workers主路由器
├── migrations/                 # 資料庫遷移腳本
│   ├── 0001_initial.sql        # 初始建表
│   ├── 0002_crm_integration.sql # CRM整合表
│   ├── 0003_contractor_building_data.sql
│   ├── 0004_sites_table.sql    # 案場資料表
│   └── 0005_maintenance_sales_tables.sql # 維修單和銷售記錄表
├── docs/                       # 文檔和指南
│   ├── API_USAGE_GUIDE.md      # API使用指南
│   ├── FXIAOKE_OBJECTS_API_GUIDE.md # CRM對象API指南
│   └── CLAUDE.md               # 項目狀態記錄
├── tests/                      # 測試腳本
│   ├── test_*.js               # CRM API測試腳本
│   └── debug_*.js              # 調試腳本
├── config/                     # 配置檔案
│   └── wrangler.toml           # Cloudflare Workers配置
└── data/                       # 資料檔案
    ├── 案場對象及欄位.csv       # 案場欄位定義
    └── 銷售記錄對象及欄位API.xlsx # 銷售記錄欄位定義
```

## 核心檔案說明

### 前端檔案 (`frontend/`)
- **index.html**: 專案管理總覽，多租戶專案列表
- **project.html**: 專案詳情頁面，包含施工進度表單和視覺化
- **create.html**: 建立專案頁面，包含CRM搜尋功能

### 後端檔案 (`src/`)
- **index.js**: Cloudflare Workers主路由器，包含所有API端點和業務邏輯

### 資料庫檔案 (`migrations/`)
- 按版本順序組織的SQL遷移腳本
- 命名格式: `{version}_{description}.sql`

### 文檔檔案 (`docs/`)
- **API_USAGE_GUIDE.md**: 完整的API使用指南和憑證記錄
- **FXIAOKE_OBJECTS_API_GUIDE.md**: 四大CRM對象API連接指南
- **CLAUDE.md**: 項目工作狀態和進度記錄

## 命名規範

### 檔案命名
- **HTML檔案**: 小寫，連字符分隔 (`project-detail.html`)
- **JavaScript檔案**: 駝峰式命名 (`index.js`, `dataProcessor.js`)
- **CSS檔案**: 小寫，連字符分隔 (`main-style.css`)
- **SQL檔案**: 版本號_描述格式 (`0001_initial.sql`)

### 變數命名
- **JavaScript變數**: 駝峰式 (`opportunityData`, `syncStatus`)
- **SQL表名**: 小寫，底線分隔 (`opportunities`, `maintenance_orders`)
- **SQL欄位名**: 小寫，底線分隔 (`create_time`, `opportunity_id`)

### API端點命名
- RESTful風格，小寫，連字符分隔
- 範例: `/api/crm/opportunities`, `/api/sync/maintenance-orders`

## 代碼組織原則

### 前端代碼結構
```javascript
// HTML頁面結構
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <!-- 標準meta標籤和CSS -->
</head>
<body>
    <!-- 主要內容區域 -->
    <main id="main-content">
        <!-- 功能區塊 -->
    </main>
    
    <!-- JavaScript在底部 -->
    <script>
        // 1. 全局變數定義
        // 2. 工具函數
        // 3. API調用函數
        // 4. 事件處理函數
        // 5. 初始化代碼
    </script>
</body>
</html>
```

### 後端代碼結構
```javascript
// src/index.js 結構
// 1. 匯入和全局配置
// 2. 主路由函數 (export default)
// 3. 定時任務函數 (scheduled)
// 4. 路由處理函數群組
// 5. API處理函數群組
// 6. CRM整合函數群組
// 7. 資料庫操作函數群組
// 8. 工具函數群組
```

## 資料流架構

### 同步流程
```
Cron Trigger (每小時)
    ↓
scheduled() 函數
    ↓
syncXXXToDB() 函數群組
    ↓
Fxiaoke CRM API
    ↓
D1 資料庫存儲
```

### 用戶請求流程
```
用戶請求
    ↓
主路由器 (fetch)
    ↓
路由分發 (handleAPI/handleProjectPage)
    ↓
業務邏輯處理
    ↓
資料庫查詢或CRM API調用
    ↓
響應返回
```

## 部署結構

### Cloudflare Workers設定
- **生產環境**: `progress.yes-ceramics.com`
- **開發環境**: `*.workers.dev`
- **D1資料庫**: `construction_progress`
- **KV命名空間**: (如需要)

### 靜態資源
- 前端檔案通過Workers提供服務
- 圖片和文檔存儲在適當目錄
- 快取策略: 公共快取，5分鐘過期

## 開發工作流程

### 新功能開發
1. 更新相關migration檔案 (如需要)
2. 修改 `src/index.js` 添加API端點
3. 更新前端頁面添加UI功能
4. 創建測試腳本驗證功能
5. 更新文檔記錄變更

### 部署流程
1. 測試本地功能
2. 運行資料庫遷移 (如需要)
3. 執行部署指令: `npx wrangler deploy --env production`
4. 驗證生產環境功能
5. 更新項目狀態文檔

## 資料庫表關係

### 核心表關係
```
opportunities (商機)
    ↓ 1:N
sites (案場)
    ↓ 1:N
maintenance_orders (維修單)

opportunities (商機)
    ↓ 1:N (可選)
sales_records (銷售記錄)
```

### 輔助表
- `sync_status`: 同步狀態追蹤
- `search_logs`: 搜尋行為分析
- `site_progress`: 施工進度記錄

## 測試策略

### 測試檔案組織
- `test_crm_*.js`: CRM API連接測試
- `test_sync_*.js`: 數據同步測試
- `debug_*.js`: 問題調試腳本

### 測試覆蓋範圍
- API端點功能測試
- 資料庫操作測試
- CRM整合測試
- 前端功能測試

## 文檔維護

### 必須維護的文檔
- `CLAUDE.md`: 每次重大變更後更新
- `API_USAGE_GUIDE.md`: API變更時更新
- `FXIAOKE_OBJECTS_API_GUIDE.md`: CRM整合變更時更新

### 文檔更新原則
- 重大功能完成後立即更新
- 保持文檔與代碼同步
- 記錄重要的配置和憑證資訊
- 提供充足的使用範例