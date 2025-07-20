# 興安西工程進度管理系統

## 專案概述

興安西工程進度管理系統是一個基於 Cloudflare Workers 的多租戶建築工程管理平台，整合 Fxiaoke CRM API，為建築工程提供即時進度追蹤、施工照片管理、多角色權限控制等功能。

## 主要功能

- 🏗️ **即時進度追蹤** - 各樓層施工進度即時更新
- 📸 **施工照片管理** - 工班上傳施工現場照片記錄
- 📊 **進度報表分析** - 自動生成進度報表，支援多種格式匯出
- 👥 **多角色權限** - 業主、工班負責人、成員等不同角色權限管理
- 🔔 **即時通知** - 重要進度更新即時推送
- 📱 **行動裝置支援** - 響應式設計，支援手機、平板使用

## 技術架構

- **前端**: HTML/CSS/JavaScript (靜態網頁)
- **後端**: Cloudflare Workers (Serverless)
- **資料庫**: Cloudflare D1 (SQLite)
- **儲存**: Cloudflare KV (Key-Value)
- **CRM整合**: Fxiaoke API
- **部署**: Cloudflare Pages + Workers

## 專案結構

```
├── src/                    # Workers 後端程式碼
│   └── index.js           # 主路由器和 API 處理
├── frontend/              # 前端靜態資源
│   ├── index.html         # 專案管理總覽頁面
│   ├── project.html       # 專案詳細頁面
│   └── create.html        # 建立專案頁面
├── migrations/            # 資料庫遷移檔案
├── wrangler.toml          # Cloudflare Workers 配置
├── package.json           # 專案依賴
└── CLAUDE.md             # 專案狀態記錄
```

## 多租戶 URL 架構

- **專案總覽**: `progress.yes-ceramics.com/`
- **專案詳細頁面**: `progress.yes-ceramics.com/{專案簡稱}-{安全令牌}/`
- **管理後台**: `progress.yes-ceramics.com/admin/`
- **API 端點**: `progress.yes-ceramics.com/api/{endpoint}`

## 系統架構

### 技術棧
- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **後端**: Cloudflare Workers (Serverless)
- **數據庫**: Cloudflare KV Store
- **API整合**: Fxiaoke CRM API
- **部署**: Cloudflare (多租戶架構)

### 系統特色
- 多租戶架構：每個商機獨立網站 `progress.yourcompany.com/projectname-randomtoken/`
- 響應式設計 (RWD)：支援手機、平板、桌機
- 角色權限管理：四級用戶權限系統
- 實時數據同步：與 Fxiaoke CRM 雙向同步

## 功能需求

### 1. 用戶權限系統（四級架構）

#### 系統管理員 (admin)
- **權限**：完整系統控制權
- **功能**：
  - 查看所有建築進度和詳細資訊
  - 編輯所有施工記錄
  - 管理所有工班和成員
  - 新增/編輯/刪除工班
  - 匯出工班資料
  - 查看所有建築的工班名稱

#### 業主 (owner)  
- **權限**：查看權限，無編輯權
- **功能**：
  - 查看所有建築的施工進度
  - 查看維修單和跟進記錄
  - 點擊案場查看施工細節（師傅、日期、坪數、備註）
  - 無法看到工班名稱
  - 無法編輯任何資料

#### 工班負責人 (contractor_leader)
- **權限**：管理自己工班，查看其他進度
- **功能**：
  - 編輯自己負責建築的施工記錄
  - 查看所有建築進度（其他建築只顯示 ✓）
  - 管理自己工班的成員
  - 只能看到自己負責建築的工班名稱
  - 新增/編輯/刪除工班成員

#### 一般成員 (member)
- **權限**：施工操作權限
- **功能**：
  - 編輯自己負責建築的施工記錄
  - 查看所有建築進度（其他建築只顯示 ✓）
  - 查看維修單和跟進記錄
  - 只能看到自己負責建築的工班名稱

### 2. 核心功能模組

#### 施工進度管理
- **進度網格視覺化**：樓層×戶別矩陣顯示
- **建築切換器**：A棟/B棟/C棟選擇
- **進度狀態**：
  - 未施工：`—`
  - 施工中：`施工中`
  - 已完成（有坪數）：`簡稱+坪數+✓` (例如：`誠22.1✓`)
  - 已完成（無坪數）：`✓`
  - 有問題：`!`

#### 施工記錄輸入
- **觸發方式**：點擊案場單元格
- **輸入欄位**：
  - 鋪設坪數（必填）
  - 施工日期（預設今日）
  - 施工師傅（自動填入）
  - 備註（選填）
- **權限控制**：
  - 工班：可編輯自己負責的建築
  - 業主：只能查看細節
  - 其他工班：無法查看細節

#### 維修單管理
- **數據來源**：Fxiaoke CRM 維修單對象
- **顯示內容**：
  - 維修單編號
  - 建築樓層戶別
  - 描述內容
  - 負責工班
  - 狀態（正常/作廢）

#### 跟進記錄
- **數據來源**：Fxiaoke CRM ActiveRecordObj
- **篩選條件**：僅顯示 `外部顯示=顯示` 的記錄
- **顯示內容**：
  - 記錄編號和日期
  - 創建者和拜訪類型
  - 重要程度
  - 記錄內容（支援富文本+圖片）

#### 工班管理
- **工班資訊**：
  - 工班名稱
  - 簡稱（預設姓名最後一字）
  - 聯絡電話
  - 工班類型（個人/公司）
  - 負責建築
  - 負責樓層範圍
  - Email
- **成員管理**：
  - 成員姓名
  - 手機號碼
  - 密碼（預設手機後3碼）
  - 簡稱（預設姓名最後一字）
  - 角色（負責人/一般成員）
  - Email（選填）

### 3. 登入系統
- **認證方式**：手機號碼 + 密碼
- **預設密碼**：手機號碼後3碼
- **密碼找回**：透過 Email 認證
- **測試用戶切換器**：開發測試用

## API 整合規格

### Fxiaoke CRM API
- **基礎 URL**：`https://open.fxiaoke.com`
- **認證方式**：appId + appSecret
- **主要端點**：
  - 維修單查詢：`/cgi/crm/custom/v2/data/query`
  - 跟進記錄：`/cgi/crm/v2/data/query`
  - 案場資訊：`/cgi/crm/custom/v2/data/query`

### 數據對象映射
- **維修單對象**：`RepairOrderObj_2kfeo`
- **跟進記錄對象**：`ActiveRecordObj`
- **案場對象**：`SiteObj_41dBi`
- **商機對象**：關聯字段 `勝興-興安西-2024`

## 部署架構

### Cloudflare Workers 架構
```
progress.yourcompany.com/
├── xinganxi-2024-abc123/     # 興安西專案
├── project2-def456/          # 其他專案
└── project3-ghi789/          # 其他專案
```

### 多租戶實現
- **路由解析**：根據 URL 路徑識別專案
- **數據隔離**：每個專案獨立的 KV 命名空間
- **權限控制**：基於專案的用戶權限

### Cloudflare KV 數據結構
```javascript
// 用戶數據
users:{projectId}:{phone} = {
  name: string,
  shortName: string,
  role: string,
  avatar: string,
  buildings: string[],
  contractor: string,
  email: string
}

// 施工記錄
construction:{projectId}:{building}_{floor}_{unit} = {
  area: number,
  date: string,
  contractor: string,
  contractorShortName: string,
  note: string,
  status: string
}

// 會話管理
session:{sessionId} = {
  phone: string,
  projectId: string,
  expiry: timestamp
}
```

## 測試數據

### 示例用戶
```javascript
// 管理層
'0900000000': { name: '系統管理員', role: 'admin' }
'0911111111': { name: '業主代表1', role: 'owner' }

// 工班負責人
'0912345678': { name: '王大誠', shortName: '誠', role: 'contractor_leader', buildings: ['B棟'] }
'0921234567': { name: '築愛家負責人', shortName: '築', role: 'contractor_leader', buildings: ['A棟'] }
'0987654321': { name: '塔塔家負責人', shortName: '塔', role: 'contractor_leader', buildings: ['C棟'] }

// 一般成員
'0912345679': { name: '王小明', shortName: '明', role: 'member', buildings: ['B棟'] }
```

### 建築結構
- **A棟**：築愛家負責，8F/10F-14F，6戶 (A1-A6)
- **B棟**：王大誠負責，2F-15F，6戶 (B1-B6)  
- **C棟**：塔塔家負責，3F-15F，7戶 (C1-C7)

## 開發環境設置

### 本地開發
1. 克隆專案：`git clone [repository-url]`
2. 開啟本地服務器測試 HTML
3. 配置 Fxiaoke API 憑證
4. 設置 IP 白名單

### Cloudflare 部署
1. 安裝 Wrangler CLI
2. 配置 `wrangler.toml`
3. 設置環境變數和 KV 命名空間
4. 部署 Workers 腳本

## 安全考量

### 數據保護
- API 金鑰環境變數儲存
- 會話管理和過期控制
- 角色權限嚴格驗證
- 敏感資訊遮罩顯示

### 訪問控制  
- IP 白名單限制
- 專案隔離機制
- 用戶權限細粒度控制
- 防止跨專案數據洩露

## 維護和監控

### 日誌記錄
- API 調用日誌
- 用戶操作記錄
- 錯誤和異常追蹤
- 性能監控指標

### 備份策略
- KV 數據定期備份
- 配置檔案版本控制
- 災難恢復計劃

---

## 開發進度

目前專案約 **70% 完成**，主要完成項目：

✅ **已完成**
- UI 原型設計和前端界面
- Cloudflare Workers 後端架構
- Fxiaoke API 整合測試
- 多租戶路由系統
- 專案管理總覽頁面
- 專案詳細頁面連接

❌ **待完成**
- Email 認證系統實作
- 完整的前後端 API 串接
- 資料庫同步機制
- 使用者權限管理
- 施工進度詳細功能

## 安裝與部署

### 本地開發

1. 安裝依賴
```bash
npm install
```

2. 設定環境變數
```bash
cp wrangler.toml.example wrangler.toml
# 編輯 wrangler.toml 設定必要的環境變數
```

3. 啟動開發伺服器
```bash
wrangler dev
```

### 生產部署

1. 登入 Cloudflare
```bash
wrangler login
```

2. 建立必要資源
```bash
# 建立 D1 資料庫
wrangler d1 create construction_progress

# 建立 KV 命名空間
wrangler kv:namespace create "PROJECTS"
wrangler kv:namespace create "SESSIONS"
```

3. 執行資料庫遷移
```bash
wrangler d1 migrations apply construction_progress --remote
```

4. 部署到生產環境
```bash
wrangler deploy --env=production
```

## 環境配置

### 必要環境變數

- `FXIAOKE_APP_ID`: Fxiaoke CRM App ID
- `FXIAOKE_BASE_URL`: Fxiaoke API 基礎 URL
- `ENVIRONMENT`: 環境標示 (development/production)

### Cloudflare 資源

- **D1 資料庫**: 儲存專案資料、使用者資訊、進度記錄
- **KV 命名空間**: 快取和 Session 管理
- **Workers**: 處理 API 請求和路由
- **Pages**: 託管靜態資源

## 線上展示

- **專案總覽**: https://progress.yes-ceramics.com/
- **興安西專案**: https://progress.yes-ceramics.com/xinganxi-abc123def456/

## 貢獻指南

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權條款

本專案採用 MIT 授權條款

---

**專案狀態**: 開發中 (70% 完成)  
**最後更新**: 2025-07-20  
**預計完成**: 2025年8月