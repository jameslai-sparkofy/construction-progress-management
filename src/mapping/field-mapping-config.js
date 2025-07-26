/**
 * 統一欄位映射配置系統
 * 
 * 支援四大 CRM 對象的統一映射配置：
 * - 商機 (opportunities) - 標準 v2 API
 * - 案場 (sites) - 自定義 API  
 * - 維修單 (maintenance_orders) - 自定義 API
 * - 銷售記錄 (sales_records) - 標準 v2 API
 */

/**
 * 映射配置 Schema 結構
 * 定義每個 CRM 對象的完整映射規則
 */
export const MAPPING_CONFIG = {
  // 配置元數據
  version: "1.0.0",
  lastUpdated: "2025-07-26",
  description: "統一 CRM 對象映射配置",
  
  // 四大對象配置
  objects: {
    /**
     * 商機對象 (標準 v2 API)
     * 數據量：489 筆
     */
    opportunities: {
      // API 基本信息
      apiType: "standard",
      endpoint: "/cgi/crm/v2/data/query",
      updateEndpoint: "/cgi/crm/v2/data/update", 
      apiName: "NewOpportunityObj",
      responseDataPath: "result.data.dataList",
      
      // 查詢配置
      defaultQuery: {
        dataObjectApiName: "NewOpportunityObj",
        limit: 100,
        offset: 0
      },
      
      // 批量處理配置
      batchSize: 100,
      maxRetries: 3,
      rateLimitDelay: 200, // ms
      
      // 欄位映射規則
      fields: {
        // 主鍵
        id: {
          frontend: "opportunityId",
          d1: "id", 
          crm: "_id",
          type: "string",
          required: true,
          primaryKey: true,
          maxLength: 50,
          validation: "notEmpty"
        },
        
        // 商機名稱
        name: {
          frontend: "opportunityName",
          d1: "name",
          crm: "name", 
          type: "string",
          required: true,
          maxLength: 255,
          validation: "notEmpty",
          searchable: true
        },
        
        // 客戶名稱
        customer: {
          frontend: "customerName",
          d1: "customer",
          crm: "customer",
          type: "string", 
          required: false,
          maxLength: 255,
          searchable: true
        },
        
        // 商機金額
        amount: {
          frontend: "amount",
          d1: "amount",
          crm: "amount",
          type: "number",
          required: false,
          defaultValue: 0,
          validation: "positiveNumber"
        },
        
        // 商機階段
        stage: {
          frontend: "stage", 
          d1: "stage",
          crm: "stage",
          type: "string",
          required: false,
          maxLength: 100
        },
        
        // 創建時間
        create_time: {
          frontend: "createTime",
          d1: "create_time", 
          crm: "create_time",
          type: "timestamp",
          required: true,
          readonly: true
        },
        
        // 更新時間
        update_time: {
          frontend: "updateTime",
          d1: "update_time",
          crm: "last_modified_time", 
          type: "timestamp",
          required: true,
          readonly: true
        },
        
        // 同步時間
        synced_at: {
          frontend: "syncedAt",
          d1: "synced_at",
          crm: null, // CRM 中不存在此欄位
          type: "timestamp",
          required: false,
          readonly: true,
          localOnly: true
        },
        
        // 原始數據
        raw_data: {
          frontend: null, // 前端不使用
          d1: "raw_data",
          crm: null, // 整個 CRM 回應作為原始數據
          type: "json",
          required: false,
          readonly: true,
          localOnly: true
        }
      },
      
      // 關聯關係
      relationships: {
        sites: {
          type: "one-to-many",
          foreignKey: "opportunity_id",
          targetObject: "sites"
        }
      }
    },

    /**
     * 案場對象 (自定義 API) 
     * 數據量：3,943 筆（最大數據集）
     */
    sites: {
      // API 基本信息
      apiType: "custom",
      endpoint: "/cgi/crm/custom/v2/data/query",
      updateEndpoint: "/cgi/crm/custom/v2/data/update",
      apiName: "object_8W9cb__c", 
      responseDataPath: "result.dataList",
      
      // 查詢配置  
      defaultQuery: {
        dataObjectApiName: "object_8W9cb__c",
        limit: 100,
        offset: 0
      },
      
      // 批量處理配置（案場數據量大，需要優化）
      batchSize: 50, // 較小批量以避免超時
      maxRetries: 3,
      rateLimitDelay: 250, // ms，稍長延遲
      
      // 特殊篩選邏輯（基於現有 CSV 結構）
      filters: {
        life_status: ["正常"], // 只同步正常狀態的案場
        is_deleted: [false]    // 排除已刪除的記錄
      },
      
      // 欄位映射規則（基於案場對象及欄位.csv）
      fields: {
        // 主鍵
        id: {
          frontend: "siteId",
          d1: "id",
          crm: "_id", 
          type: "string",
          required: true,
          primaryKey: true,
          maxLength: 50,
          validation: "notEmpty"
        },
        
        // 案場編號（自增編號）
        name: {
          frontend: "siteName", 
          d1: "name",
          crm: "name",
          type: "string",
          required: true,
          maxLength: 255,
          validation: "notEmpty",
          searchable: true
        },
        
        // 關聯商機ID
        opportunity_id: {
          frontend: "opportunityId",
          d1: "opportunity_id", 
          crm: "field_1P96q__c", // 查找關聯字段
          type: "string",
          required: false,
          maxLength: 50,
          relationship: {
            targetObject: "opportunities",
            type: "many-to-one"
          }
        },
        
        // 棟別
        building_type: {
          frontend: "buildingType",
          d1: "building_type",
          crm: "field_WD7k1__c",
          type: "string", 
          required: false,
          maxLength: 50,
          enum: ["A棟", "B棟", "C棟"]
        },
        
        // 樓層
        floor_info: {
          frontend: "floor",
          d1: "floor_info", 
          crm: "field_Q6Svh__c",
          type: "number",
          required: false,
          validation: "positiveNumber"
        },
        
        // 戶別
        room_info: {
          frontend: "room",  
          d1: "room_info",
          crm: "field_XuJP2__c",
          type: "string",
          required: false,
          maxLength: 100
        },
        
        // 施工狀態（階段）
        construction_status: {
          frontend: "constructionStatus",
          d1: "construction_status",
          crm: "field_z9H6O__c",
          type: "string",
          required: false,
          enum: ["準備中", "施工前場勘", "施工", "驗收", "缺失維修", "其他"]
        },
        
        // 工班師父
        contractor_team: {
          frontend: "contractorTeam", 
          d1: "contractor_team",
          crm: "field_u1wpv__c",
          type: "string",
          required: false,
          maxLength: 255
        },
        
        // 施工完成標記
        construction_completed: {
          frontend: "isCompleted",
          d1: "construction_completed",
          crm: "construction_completed__c",
          type: "boolean",
          required: false,
          defaultValue: false
        },
        
        // 工地坪數
        site_area: {
          frontend: "siteArea",
          d1: "site_area", 
          crm: "field_tXAko__c",
          type: "number",
          required: false,
          validation: "positiveNumber"
        },
        
        // 舖設坪數
        floor_area: {
          frontend: "floorArea",
          d1: "floor_area",
          crm: "field_B2gh1__c", 
          type: "number",
          required: false,
          validation: "positiveNumber"
        },
        
        // 保護板坪數  
        protection_area: {
          frontend: "protectionArea",
          d1: "protection_area",
          crm: "field_27g6n__c",
          type: "number",
          required: false, 
          validation: "positiveNumber"
        },
        
        // 施工日期
        construction_date: {
          frontend: "constructionDate",
          d1: "construction_date",
          crm: "field_23pFq__c",
          type: "date",
          required: false
        },
        
        // 驗收日期1
        inspection_date1: {
          frontend: "inspectionDate1", 
          d1: "inspection_date1",
          crm: "field_xxa7B__c",
          type: "date",
          required: false
        },
        
        // 驗收日期2
        inspection_date2: {
          frontend: "inspectionDate2",
          d1: "inspection_date2", 
          crm: "field_qEaXB__c",
          type: "date",
          required: false
        },
        
        // 保固日期
        warranty_date: {
          frontend: "warrantyDate",
          d1: "warranty_date",
          crm: "field_f0mz3__c",
          type: "date", 
          required: false
        },
        
        // 標籤（多選）
        tags: {
          frontend: "tags",
          d1: "tags",
          crm: "field_23Z5i__c",
          type: "array",
          required: false,
          enum: ["準備中", "不可施工", "可施工", "已完工", "需維修", "維修完成", "其他"]
        },
        
        // 案場類型
        site_type: {
          frontend: "siteType",
          d1: "site_type", 
          crm: "field_dxr31__c",
          type: "string",
          required: false,
          enum: ["工地", "樣品屋", "民宅", "其他"]
        },
        
        // 工地備註
        site_notes: {
          frontend: "siteNotes",
          d1: "site_notes",
          crm: "field_g18hX__c",
          type: "text", 
          required: false,
          maxLength: 2000
        },
        
        // 施工前備註
        pre_construction_notes: {
          frontend: "preConstructionNotes",
          d1: "pre_construction_notes",
          crm: "field_sF6fn__c",
          type: "string",
          required: false,
          maxLength: 500
        },
        
        // 工班備註
        team_notes: {
          frontend: "teamNotes", 
          d1: "team_notes",
          crm: "field_V32Xl__c",
          type: "string",
          required: false,
          maxLength: 500
        },
        
        // 驗收備註
        inspection_notes: {
          frontend: "inspectionNotes",
          d1: "inspection_notes",
          crm: "field_n37jC__c", 
          type: "string",
          required: false,
          maxLength: 500
        },
        
        // 創建時間
        create_time: {
          frontend: "createTime",
          d1: "create_time",
          crm: "create_time",
          type: "timestamp",
          required: true,
          readonly: true
        },
        
        // 更新時間  
        update_time: {
          frontend: "updateTime",
          d1: "update_time",
          crm: "last_modified_time",
          type: "timestamp",
          required: true,
          readonly: true
        },
        
        // 同步時間
        synced_at: {
          frontend: "syncedAt",
          d1: "synced_at", 
          crm: null,
          type: "timestamp",
          required: false,
          readonly: true,
          localOnly: true  
        },
        
        // 原始數據
        raw_data: {
          frontend: null,
          d1: "raw_data",
          crm: null,
          type: "json",
          required: false,
          readonly: true,
          localOnly: true
        }
      },
      
      // 關聯關係
      relationships: {
        opportunity: {
          type: "many-to-one",
          foreignKey: "opportunity_id", 
          targetObject: "opportunities"
        },
        maintenance_orders: {
          type: "one-to-many",
          foreignKey: "site_id",
          targetObject: "maintenance_orders"
        }
      }
    },

    /**
     * 維修單對象 (自定義 API)
     * 數據量：5 筆
     */
    maintenance_orders: {
      // API 基本信息
      apiType: "custom", 
      endpoint: "/cgi/crm/custom/v2/data/query",
      updateEndpoint: "/cgi/crm/custom/v2/data/update",
      apiName: "object_maintenance_order", // 假設的 API 名稱
      responseDataPath: "result.dataList",
      
      // 查詢配置
      defaultQuery: {
        dataObjectApiName: "object_maintenance_order",
        limit: 100,
        offset: 0
      },
      
      // 批量處理配置（數據量小）
      batchSize: 50,
      maxRetries: 3,
      rateLimitDelay: 200,
      
      // 欄位映射規則
      fields: {
        // 主鍵
        id: {
          frontend: "maintenanceId",
          d1: "id",
          crm: "_id",
          type: "string", 
          required: true,
          primaryKey: true,
          maxLength: 50,
          validation: "notEmpty"
        },
        
        // 維修單名稱
        name: {
          frontend: "maintenanceName",
          d1: "name",
          crm: "name",
          type: "string",
          required: true,
          maxLength: 255,
          validation: "notEmpty",
          searchable: true
        },
        
        // 關聯商機ID
        opportunity_id: {
          frontend: "opportunityId", 
          d1: "opportunity_id",
          crm: "opportunity_field", // 需要確認實際欄位名
          type: "string",
          required: false,
          maxLength: 50,
          relationship: {
            targetObject: "opportunities",
            type: "many-to-one"
          }
        },
        
        // 關聯案場ID
        site_id: {
          frontend: "siteId",
          d1: "site_id",
          crm: "site_field", // 需要確認實際欄位名
          type: "string",
          required: false,
          maxLength: 50,
          relationship: {
            targetObject: "sites", 
            type: "many-to-one"
          }
        },
        
        // 問題類型
        issue_type: {
          frontend: "issueType",
          d1: "issue_type",
          crm: "issue_type_field",
          type: "string",
          required: false,
          maxLength: 100,
          enum: ["刮傷", "矽力康", "空心", "不平", "區隔條", "異音", "其他"] // 基於案場缺失分類
        },
        
        // 維修狀態
        status: {
          frontend: "status",
          d1: "status", 
          crm: "status_field",
          type: "string",
          required: false,
          maxLength: 50,
          enum: ["待處理", "處理中", "已完成", "已取消"]
        },
        
        // 優先級
        priority: {  
          frontend: "priority",
          d1: "priority",
          crm: "priority_field",
          type: "string",
          required: false,
          enum: ["低", "中", "高", "緊急"]
        },
        
        // 指派給
        assigned_to: {
          frontend: "assignedTo",
          d1: "assigned_to",
          crm: "assigned_to_field", 
          type: "string",
          required: false,
          maxLength: 255
        },
        
        // 創建時間
        create_time: {
          frontend: "createTime",
          d1: "create_time",
          crm: "create_time",
          type: "timestamp",
          required: true,
          readonly: true
        },
        
        // 更新時間
        update_time: {
          frontend: "updateTime",
          d1: "update_time", 
          crm: "last_modified_time",
          type: "timestamp",
          required: true,
          readonly: true
        },
        
        // 同步時間
        synced_at: {
          frontend: "syncedAt",
          d1: "synced_at",
          crm: null,
          type: "timestamp",
          required: false,
          readonly: true,
          localOnly: true
        },
        
        // 原始數據
        raw_data: {
          frontend: null,
          d1: "raw_data", 
          crm: null,
          type: "json",
          required: false,
          readonly: true,
          localOnly: true
        }
      },
      
      // 關聯關係
      relationships: {
        opportunity: {
          type: "many-to-one",
          foreignKey: "opportunity_id",
          targetObject: "opportunities"
        },
        site: {
          type: "many-to-one", 
          foreignKey: "site_id",
          targetObject: "sites"
        }
      }
    },

    /**
     * 銷售記錄對象 (標準 v2 API)
     * 數據量：3,600 筆
     * 特殊邏輯：只同步有商機關聯且外部顯示="顯示"的記錄
     */
    sales_records: {
      // API 基本信息
      apiType: "standard",
      endpoint: "/cgi/crm/v2/data/query", 
      updateEndpoint: "/cgi/crm/v2/data/update",
      apiName: "NewSaleRecordObj", // 假設的 API 名稱
      responseDataPath: "result.data.dataList",
      
      // 查詢配置
      defaultQuery: {
        dataObjectApiName: "NewSaleRecordObj",
        limit: 100,
        offset: 0
      },
      
      // 特殊篩選邏輯
      filters: {
        // 只同步有商機關聯的記錄
        opportunity_id: { operator: "isNotEmpty" },
        // 只同步外部顯示="顯示"的記錄
        external_visible: ["顯示"]
      },
      
      // 批量處理配置
      batchSize: 100,
      maxRetries: 3, 
      rateLimitDelay: 200,
      
      // 欄位映射規則
      fields: {
        // 主鍵
        id: {
          frontend: "salesRecordId",
          d1: "id",
          crm: "_id",
          type: "string",
          required: true,
          primaryKey: true,
          maxLength: 50,
          validation: "notEmpty"
        },
        
        // 銷售記錄名稱
        name: {
          frontend: "recordName",
          d1: "name", 
          crm: "name",
          type: "string",
          required: true,
          maxLength: 255,
          validation: "notEmpty",
          searchable: true
        },
        
        // 關聯商機ID（必須）
        opportunity_id: {
          frontend: "opportunityId",
          d1: "opportunity_id",
          crm: "opportunity_field", // 需要確認實際欄位名
          type: "string",
          required: true, // 銷售記錄必須關聯商機
          maxLength: 50,
          validation: "notEmpty",
          relationship: {
            targetObject: "opportunities",
            type: "many-to-one"
          }
        },
        
        // 記錄類型
        record_type: {
          frontend: "recordType",
          d1: "record_type",
          crm: "record_type_field",
          type: "string", 
          required: false,
          maxLength: 100
        },
        
        // 記錄內容
        content: {
          frontend: "content",
          d1: "content",
          crm: "content_field",
          type: "text",
          required: false,
          maxLength: 5000
        },
        
        // 互動類型
        interactive_type: {
          frontend: "interactiveType",
          d1: "interactive_type",
          crm: "interactive_type_field",
          type: "string",
          required: false,
          maxLength: 100
        },
        
        // 地點 
        location: {
          frontend: "location",
          d1: "location",
          crm: "location_field",
          type: "string",
          required: false,
          maxLength: 255
        },
        
        // 外部顯示（篩選條件）
        is_external_visible: {
          frontend: "isExternalVisible",
          d1: "is_external_visible",
          crm: "external_visible_field",
          type: "boolean", 
          required: true,
          defaultValue: false,
          filterValue: true // 只同步為 true 的記錄
        },
        
        // 創建時間
        create_time: {
          frontend: "createTime",
          d1: "create_time",
          crm: "create_time",
          type: "timestamp",
          required: true,
          readonly: true
        },
        
        // 更新時間
        update_time: {
          frontend: "updateTime",
          d1: "update_time",
          crm: "last_modified_time",
          type: "timestamp", 
          required: true,
          readonly: true
        },
        
        // 同步時間
        synced_at: {
          frontend: "syncedAt",
          d1: "synced_at",
          crm: null,
          type: "timestamp",
          required: false,
          readonly: true,
          localOnly: true
        },
        
        // 原始數據
        raw_data: {
          frontend: null,
          d1: "raw_data",
          crm: null,
          type: "json", 
          required: false,
          readonly: true,
          localOnly: true
        }
      },
      
      // 關聯關係
      relationships: {
        opportunity: {
          type: "many-to-one",
          foreignKey: "opportunity_id",
          targetObject: "opportunities"
        }
      }
    }
  },
  
  /**
   * 數據類型驗證規則
   */
  validationRules: {
    notEmpty: (value) => value !== null && value !== undefined && value !== '',
    positiveNumber: (value) => typeof value === 'number' && value >= 0,
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    url: (value) => /^https?:\/\/.+/.test(value),
    dateString: (value) => !isNaN(Date.parse(value)),
    jsonString: (value) => {
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }
  },
  
  /**
   * 類型轉換規則
   */
  typeConverters: {
    // 字串轉數字
    stringToNumber: (value) => {
      if (value === null || value === undefined || value === '') return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    },
    
    // 數字轉字串
    numberToString: (value) => {
      if (value === null || value === undefined) return null;
      return String(value);
    },
    
    // 時間戳轉換
    timestampToDate: (timestamp) => {
      if (!timestamp) return null;
      return new Date(timestamp * 1000).toISOString();
    },
    
    dateToTimestamp: (dateString) => {
      if (!dateString) return null;
      return Math.floor(new Date(dateString).getTime() / 1000);
    },
    
    // 布林值轉換
    stringToBoolean: (value) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1' || value === 'yes';
      }
      return Boolean(value);
    },
    
    booleanToString: (value) => {
      if (typeof value === 'boolean') return value ? 'true' : 'false';
      return String(Boolean(value));
    },
    
    // JSON 轉換
    objectToJson: (obj) => {
      if (obj === null || obj === undefined) return null;
      if (typeof obj === 'string') return obj;
      return JSON.stringify(obj);
    },
    
    jsonToObject: (jsonString) => {
      if (!jsonString) return null;
      if (typeof jsonString === 'object') return jsonString;
      try {
        return JSON.parse(jsonString);
      } catch {
        return null;
      }
    },
    
    // 陣列轉換
    arrayToString: (arr) => {
      if (!Array.isArray(arr)) return null;
      return arr.join(',');
    },
    
    stringToArray: (str) => {
      if (!str) return [];
      if (Array.isArray(str)) return str;
      return str.split(',').map(item => item.trim()).filter(Boolean);
    }
  },
  
  /**
   * 同步配置
   */
  syncConfig: {
    // 預設批量大小
    defaultBatchSize: 100,
    
    // 最大重試次數
    maxRetries: 3,
    
    // API 速率限制 (100 requests per 20 seconds)
    rateLimit: {
      requests: 100,
      window: 20000 // 20 秒
    },
    
    // 同步順序（基於依賴關係）
    syncOrder: [
      'opportunities',     // 基礎對象，必須先同步
      'sites',            // 依賴 opportunities
      'maintenance_orders', // 依賴 opportunities 和 sites  
      'sales_records'     // 部分依賴 opportunities
    ],
    
    // 並發配置
    concurrent: {
      enabled: false, // 暫時禁用並發，使用順序同步
      maxConcurrent: 2
    },
    
    // 錯誤處理
    errorHandling: {
      continueOnError: true, // 單個對象失敗時繼續其他對象
      maxFailureRate: 0.05,  // 失敗率超過 5% 時停止同步
      retryDelay: 1000       // 重試延遲（毫秒）
    }
  }
};

/**
 * 獲取對象配置
 * @param {string} objectType - 對象類型
 * @returns {Object|null} 對象配置
 */
export function getObjectConfig(objectType) {
  return MAPPING_CONFIG.objects[objectType] || null;
}

/**
 * 獲取欄位映射配置
 * @param {string} objectType - 對象類型
 * @param {string} fieldName - 欄位名稱
 * @returns {Object|null} 欄位配置
 */
export function getFieldConfig(objectType, fieldName) {
  const objectConfig = getObjectConfig(objectType);
  if (!objectConfig) return null;
  
  return objectConfig.fields[fieldName] || null;
}

/**
 * 驗證映射配置完整性
 * @returns {Object} 驗證結果
 */
export function validateMappingConfig() {
  const errors = [];
  const warnings = [];
  
  // 檢查必要的對象是否存在
  const requiredObjects = ['opportunities', 'sites', 'maintenance_orders', 'sales_records'];
  for (const objectType of requiredObjects) {
    if (!MAPPING_CONFIG.objects[objectType]) {
      errors.push(`缺少必要對象配置: ${objectType}`);
    }
  }
  
  // 檢查每個對象的完整性
  for (const [objectType, config] of Object.entries(MAPPING_CONFIG.objects)) {
    // 檢查必要屬性
    const requiredProps = ['apiType', 'endpoint', 'apiName', 'responseDataPath', 'fields'];
    for (const prop of requiredProps) {
      if (!config[prop]) {
        errors.push(`對象 ${objectType} 缺少必要屬性: ${prop}`);
      }
    }
    
    // 檢查主鍵欄位
    const primaryKeyFields = Object.entries(config.fields || {})
      .filter(([, fieldConfig]) => fieldConfig.primaryKey);
    
    if (primaryKeyFields.length === 0) {
      errors.push(`對象 ${objectType} 缺少主鍵欄位`);
    } else if (primaryKeyFields.length > 1) {
      warnings.push(`對象 ${objectType} 定義了多個主鍵欄位`);
    }
    
    // 檢查必填欄位
    for (const [fieldName, fieldConfig] of Object.entries(config.fields || {})) {
      if (fieldConfig.required && !fieldConfig.defaultValue && fieldConfig.type !== 'timestamp') {
        // 確保必填欄位有適當的驗證
        if (!fieldConfig.validation) {
          warnings.push(`必填欄位 ${objectType}.${fieldName} 缺少驗證規則`);
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalObjects: Object.keys(MAPPING_CONFIG.objects).length,
      totalFields: Object.values(MAPPING_CONFIG.objects)
        .reduce((sum, obj) => sum + Object.keys(obj.fields || {}).length, 0),
      errorsCount: errors.length,
      warningsCount: warnings.length
    }
  };
}

/**
 * 導出配置供外部使用
 */
export default MAPPING_CONFIG;