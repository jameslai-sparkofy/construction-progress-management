# CRM-D1 欄位映射重構 - 需求規格書

*創建時間: 2025-07-26*
*項目代號: crm-d1-field-mapping-refactor*

## 項目背景

### 現況問題
1. **欄位映射混亂**: 74個案場欄位中只有20個正確映射，映射準確率僅27%
2. **數據分散**: 案場數據分散在多個表中（sites、site_progress），缺乏統一管理
3. **硬編碼實現**: 映射邏輯直接寫在業務代碼中，難以維護和擴展
4. **缺乏驗證**: 無數據類型驗證、必填欄位檢查、長度限制等
5. **圖片處理問題**: 圖片上傳和同步機制不完善
6. **生產風險**: 3943個案場記錄，任何錯誤都可能導致數據遺失

### 業務需求
系統必須支援完整的工程進度管理流程：
- 商機搜尋與案場關聯
- 施工進度更新與追蹤  
- CRM數據雙向同步
- 多租戶權限管理

## 用戶故事與接受標準

### Epic 1: 統一映射配置系統

#### US-1.1: 作為系統管理員，我需要一個統一的欄位映射配置檔案
**When** 系統需要進行欄位映射時
**The system shall** 從統一的配置檔案中獲取映射規則
**So that** 所有映射邏輯集中管理，易於維護

**接受標準**:
- The system shall provide a JSON configuration file containing all 74 field mappings
- The system shall support frontend, D1, and CRM three-layer mapping definitions
- The system shall include data type validation rules for each field
- The system shall define required field constraints and default values

#### US-1.2: 作為開發人員，我需要統一的映射服務類別
**When** 業務邏輯需要進行數據轉換時
**The system shall** 提供標準化的映射服務API
**So that** 避免重複代碼和映射錯誤

**接受標準**:
- The system shall provide a FieldMappingService class with standard APIs
- The system shall support bidirectional mapping (frontend↔D1, D1↔CRM)
- The system shall validate data types before transformation
- The system shall handle null values and provide default values

### Epic 2: 改進的資料庫架構

#### US-2.1: 作為數據管理員，我需要優化的資料庫表結構
**When** 系統儲存案場相關數據時
**The system shall** 使用優化的表結構以提高查詢效能
**So that** 數據存取更高效且結構更清晰

**接受標準**:
- The system shall create optimized table structure with proper indexing
- The system shall establish clear relationships between tables
- The system shall support efficient queries for 3943+ records
- The system shall maintain data integrity constraints

#### US-2.2: 作為系統使用者，我需要完整的數據遷移
**When** 系統升級到新架構時
**The system shall** 安全地遷移所有現有數據
**So that** 不會遺失任何歷史數據

**接受標準**:
- The system shall migrate all 3943 existing site records without data loss
- The system shall preserve all historical progress data
- The system shall maintain referential integrity during migration
- The system shall provide rollback capability if migration fails

### Epic 3: 重構的同步系統

#### US-3.1: 作為工程人員，我需要可靠的CRM同步功能
**When** 我提交施工進度更新時
**The system shall** 自動同步數據到CRM系統
**So that** CRM中的數據保持最新狀態

**接受標準**:
- The system shall sync data to CRM within 5 seconds of form submission
- The system shall handle sync failures with automatic retry mechanism
- The system shall validate required CRM fields before syncing
- The system shall log all sync operations for auditing

#### US-3.2: 作為系統管理員，我需要批量數據同步功能
**When** 系統需要進行大量數據同步時
**The system shall** 提供批量處理機制
**So that** 可以高效處理大量數據更新

**接受標準**:
- The system shall support batch sync for up to 1000 records per operation
- The system shall provide progress tracking for long-running sync operations
- The system shall handle rate limiting (100 requests per 20 seconds)
- The system shall resume interrupted batch operations

### Epic 4: 增強的表單處理

#### US-4.1: 作為工程人員，我需要改進的表單驗證
**When** 我填寫施工進度表單時
**The system shall** 提供即時的欄位驗證
**So that** 減少提交錯誤和數據不一致

**接受標準**:
- The system shall validate field types in real-time (date, number, text)
- The system shall enforce field length limits before submission
- The system shall check required fields before allowing submission
- The system shall provide clear error messages for validation failures

#### US-4.2: 作為工程人員，我需要可靠的圖片上傳功能
**When** 我上傳施工照片時
**The system shall** 安全地處理圖片上傳和同步
**So that** 施工記錄包含完整的視覺證據

**接受標準**:
- The system shall support multiple image formats (JPG, PNG, WebP)
- The system shall compress images to reduce storage and transfer costs
- The system shall sync uploaded images to CRM within 10 seconds
- The system shall provide upload progress feedback to users

### Epic 5: 系統監控與日誌

#### US-5.1: 作為系統管理員，我需要完整的操作日誌
**When** 系統執行關鍵操作時
**The system shall** 記錄詳細的操作日誌
**So that** 可以追蹤問題和系統使用情況

**接受標準**:
- The system shall log all field mapping operations with timestamps
- The system shall log sync successes and failures with error details
- The system shall provide searchable logs for troubleshooting
- The system shall retain logs for at least 30 days

## 非功能性需求

### 效能需求
- 表單提交響應時間 < 2秒
- 搜尋查詢響應時間 < 1秒  
- 批量同步處理能力 > 100 records/minute
- 系統可用性 > 99.5%

### 安全需求
- 所有數據傳輸必須使用HTTPS
- API調用需要適當的身份驗證
- 敏感數據需要適當的存取控制
- 定期備份關鍵數據

### 相容性需求
- 向後相容現有API端點
- 支援現有的多租戶架構
- 維持現有的用戶權限系統
- 不影響生產環境的正常運作

## 約束條件

### 技術約束
- 必須使用現有的Cloudflare Workers + D1架構
- 必須相容紛享銷客CRM API限制
- 必須支援現有的OAuth認證機制

### 業務約束  
- 生產環境不能中斷超過5分鐘
- 數據遷移必須在週末進行
- 所有變更需要完整的回滾計劃

### 資源約束
- D1資料庫大小限制 < 500MB
- Cloudflare Workers執行時間 < 30秒
- CRM API調用頻率 < 100次/20秒

## 成功標準

### 量化指標
- 欄位映射準確率從27%提升到100%
- 數據同步成功率 > 99%
- 系統響應時間改善 > 30%
- Bug數量減少 > 80%

### 質化指標
- 代碼維護性顯著改善
- 系統架構更加清晰
- 開發效率明顯提升
- 用戶體驗更加流暢

## 風險識別

### 高風險
- **數據遷移失敗**: 可能導致歷史數據遺失
- **生產中斷**: 影響正常業務運作
- **CRM同步故障**: 導致數據不一致

### 中風險  
- **效能下降**: 新架構可能影響系統效能
- **相容性問題**: 可能影響現有功能
- **用戶適應**: 需要時間適應新的操作流程

### 緩解措施
- 完整的備份策略
- 段階式部署計劃
- 全面的測試驗證
- 快速回滾機制