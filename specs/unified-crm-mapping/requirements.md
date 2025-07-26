# Unified CRM Mapping System - 需求規格書

*創建時間: 2025-07-26*
*項目代號: unified-crm-mapping*

## 項目背景

### 現況問題分析
基於對現有系統的深度分析，發現以下關鍵問題：

1. **映射混亂與不一致**
   - 四大對象（商機、案場、維修單、銷售記錄）使用不同的映射邏輯
   - 標準 v2 API vs 自定義 API 處理方式不統一
   - 欄位映射散布在多個文件中，缺乏中央管理

2. **數據量巨大的挑戰**
   - 案場對象 3,943 筆記錄，是最大的數據集
   - 銷售記錄 3,600 筆，需要特殊篩選邏輯
   - 商機 489 筆作為關聯基礎，影響其他對象

3. **架構複雜性**
   - 混合 API 架構（本地 D1 + CRM API 回退）
   - 多租戶系統需要考慮權限和隔離
   - Cloudflare Workers 環境限制（30秒執行時間）

4. **同步機制問題**
   - 定時同步順序依賴關係複雜
   - 缺乏智能增量同步機制
   - 錯誤處理和恢復機制不完善

### 業務影響
- 數據不一致導致工程進度追蹤困難
- 手動映射維護成本高昂
- 系統擴展性受限，新增欄位困難
- 生產環境風險高，任何錯誤影響範圍大

## 用戶故事與接受標準

### Epic 1: 統一映射架構系統

#### US-1.1: 作為系統架構師，我需要統一的映射配置管理系統
**When** 系統需要處理四大 CRM 對象的欄位映射時
**The system shall** 提供統一的映射配置框架
**So that** 所有對象的映射邏輯統一管理，減少維護複雜度

**接受標準**:
- The system shall provide a unified FieldMappingService class supporting all four CRM objects
- The system shall support configuration-driven mapping without code changes
- The system shall handle both standard v2 API and custom API mapping differences
- The system shall provide bidirectional mapping (Frontend ↔ D1 ↔ CRM)

#### US-1.2: 作為開發人員，我需要統一的數據轉換 API
**When** 業務邏輯需要在不同數據格式間轉換時
**The system shall** 提供標準化的轉換服務
**So that** 消除重複代碼並確保轉換一致性

**接受標準**:
- The system shall provide transform() methods for each object type
- The system shall validate data types and constraints before transformation
- The system shall handle null values and provide configurable defaults
- The system shall support batch processing for large datasets (3943+ records)

### Epic 2: 重新設計的資料庫架構

#### US-2.1: 作為數據架構師，我需要優化的數據庫結構
**When** 系統儲存四大對象數據時
**The system shall** 使用優化的表結構和關聯關係
**So that** 支援高效查詢和維護數據完整性

**接受標準**:
- The system shall create four optimized tables with proper foreign key relationships
- The system shall establish indexes for critical query patterns
- The system shall support efficient JOIN operations across related objects
- The system shall maintain referential integrity with cascade options

#### US-2.2: 作為系統管理員，我需要安全的數據遷移機制
**When** 系統升級到新架構時
**The system shall** 無損遷移所有現有數據
**So that** 保證業務連續性和數據完整性

**接受標準**:
- The system shall migrate all 8,037 existing records (489+3943+5+3600) without loss
- The system shall preserve all existing relationships and constraints
- The system shall provide migration progress tracking and status reporting
- The system shall support rollback to previous schema if migration fails

### Epic 3: 智能同步機制優化

#### US-3.1: 作為系統管理員，我需要智能增量同步機制
**When** 系統執行定時同步時
**The system shall** 只同步變更的數據以提高效率
**So that** 減少 API 調用和系統負載

**接受標準**:
- The system shall implement last_modified_time based incremental sync
- The system shall handle CRM API rate limits (100 requests per 20 seconds)
- The system shall provide configurable sync priorities for different object types
- The system shall support resume functionality for interrupted sync operations

#### US-3.2: 作為工程人員，我需要可靠的即時同步功能
**When** 我提交工程進度更新時
**The system shall** 立即同步數據到 CRM 系統
**So that** CRM 中的數據保持即時更新

**接受標準**:
- The system shall sync form submissions to CRM within 3 seconds
- The system shall provide sync status feedback to users
- The system shall handle sync failures with automatic retry (maximum 3 attempts)
- The system shall queue failed syncs for later batch processing

### Epic 4: 統一錯誤處理和監控

#### US-4.1: 作為系統管理員，我需要全面的同步監控系統
**When** 系統執行任何同步操作時
**The system shall** 記錄詳細的操作日誌和狀態
**So that** 可以監控系統健康狀況和排除故障

**接受標準**:
- The system shall log all mapping and sync operations with timestamps
- The system shall provide dashboard view of sync statistics and health metrics
- The system shall alert administrators when sync failure rate exceeds 5%
- The system shall retain sync logs for at least 90 days

#### US-4.2: 作為開發人員，我需要統一的錯誤處理機制
**When** 系統遇到映射或同步錯誤時
**The system shall** 提供一致的錯誤處理和報告
**So that** 錯誤可以被適當處理和追蹤

**接受標準**:
- The system shall provide standardized error codes and messages
- The system shall implement proper error boundaries for each sync operation
- The system shall support graceful degradation when partial sync fails
- The system shall provide detailed error context for troubleshooting

### Epic 5: 效能優化和擴展性

#### US-5.1: 作為系統架構師，我需要高效能的批量處理機制
**When** 系統需要處理大量數據（如 3943 個案場）時
**The system shall** 提供優化的批量處理能力
**So that** 系統可以在 Cloudflare Workers 限制內高效運作

**接受標準**:
- The system shall process records in configurable batches (default: 100 records)
- The system shall complete full sync of 3943 sites within 5 minutes
- The system shall support parallel processing where possible
- The system shall optimize database queries to minimize D1 usage costs

## 非功能性需求

### 效能需求
- **同步效能**: 全量同步四大對象 < 10 分鐘
- **查詢響應**: 單一對象查詢 < 500ms
- **批量處理**: 支援 100+ records/batch 處理能力
- **記憶體使用**: 單次操作記憶體使用 < 128MB

### 可靠性需求
- **數據一致性**: 99.9% 映射準確率
- **同步成功率**: > 99% 成功率
- **系統可用性**: > 99.5% 正常運行時間
- **錯誤恢復**: 自動重試機制，最大3次嘗試

### 擴展性需求
- **新增對象**: 支援快速新增新的 CRM 對象類型
- **新增欄位**: 通過配置即可新增欄位映射
- **多租戶**: 支援不同租戶的獨立映射配置
- **國際化**: 支援多語言欄位名稱和錯誤訊息

### 安全性需求
- **數據保護**: 所有敏感數據加密傳輸和儲存
- **存取控制**: 基於角色的映射配置存取權限
- **稽核日誌**: 所有配置變更和關鍵操作日誌
- **備份恢復**: 定期備份關鍵配置和數據

## 技術約束

### 平台約束
- **Cloudflare Workers**: 30 秒最大執行時間限制
- **D1 資料庫**: 500MB 大小限制，每日讀寫限制
- **CRM API**: 100 requests/20 seconds 速率限制
- **記憶體限制**: 128MB 最大記憶體使用

### 相容性約束
- **向後相容**: 現有 API 端點不能中斷
- **資料格式**: 必須支援現有的 JSON 資料格式
- **多租戶**: 維持現有的多租戶架構
- **驗證機制**: 相容現有的 OAuth 認證流程

## 風險評估與緩解策略

### 高風險 (關鍵影響)
1. **大量數據遷移失敗**
   - **風險**: 3943 個案場記錄遷移過程可能失敗
   - **緩解**: 分批遷移 + 完整備份 + 回滾機制

2. **生產環境中斷**
   - **風險**: 部署過程可能影響正常業務運作
   - **緩解**: 藍綠部署 + 金絲雀發布 + 即時監控

3. **CRM API 配額耗盡**
   - **風險**: 大量同步可能觸發 API 限制
   - **緩解**: 智能批量處理 + 重試機制 + 配額監控

### 中風險 (需要關注)
1. **效能下降**
   - **風險**: 新架構可能影響查詢效能
   - **緩解**: 效能測試 + 索引優化 + 快取策略

2. **資料一致性問題**
   - **風險**: 複雜映射可能導致數據不一致
   - **緩解**: 數據驗證 + 對比測試 + 監控告警

### 低風險 (持續監控)
1. **使用者學習成本**
   - **風險**: 新系統可能需要用戶適應
   - **緩解**: 文檔更新 + 用戶培訓 + 向下相容

## 成功標準

### 量化指標
- **映射準確率**: 從當前狀態提升到 100%
- **同步成功率**: > 99%
- **效能改善**: 查詢響應時間改善 > 40%
- **維護成本**: 代碼維護工作量減少 > 60%

### 質化指標
- **系統穩定性**: 顯著減少同步相關故障
- **開發效率**: 新增欄位映射時間從數小時縮短到數分鐘
- **代碼品質**: 統一的架構和更好的可測試性
- **使用者體驗**: 更可靠的數據同步和更快的響應

## 交付期望

### 階段性里程碑
1. **Phase 1**: 統一映射配置系統 (第1-2週)
2. **Phase 2**: 資料庫架構重構 (第3-4週)
3. **Phase 3**: 同步機制優化 (第5-6週)
4. **Phase 4**: 監控和部署 (第7-8週)

### 最終交付物
- 完整的統一映射系統
- 重構的資料庫架構
- 優化的同步機制
- 全面的監控和日誌系統
- 完整的技術文檔和操作手冊

這個需求規格書為後續的設計和實作提供了清晰的指導方針，確保所有利害關係人對項目目標和預期成果有一致的理解。