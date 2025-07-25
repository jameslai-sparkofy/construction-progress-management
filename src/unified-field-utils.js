/**
 * 統一欄位映射工具函數
 * 用於後端 Cloudflare Workers 中統一處理欄位轉換
 */

// 統一欄位映射配置（與前端 field-mapping.js 保持一致）
const FIELD_MAPPING = {
  // 基本資訊
  building: { d1: 'building_name', crm: 'field_WD7k1__c', type: 'text' },
  floor: { 
    d1: 'floor_number', 
    crm: 'field_Q6Svh__c', 
    type: 'integer',
    transform: {
      toCrm: (value) => parseInt(value.toString().replace('F', '')),
      fromCrm: (value) => `${value}F`,
      toD1: (value) => parseInt(value.toString().replace('F', ''))
    }
  },
  unit: { d1: 'unit_name', crm: 'field_XuJP2__c', type: 'text' },
  opportunityId: { d1: 'crm_opportunity_id', crm: 'field_1P96q__c', type: 'text' },

  // 施工資訊
  area: { 
    d1: 'area', 
    crm: 'field_B2gh1__c', 
    type: 'decimal',
    transform: {
      toCrm: (value) => parseFloat(value) || null,
      toD1: (value) => parseFloat(value) || 0
    }
  },
  siteArea: { d1: 'site_area', crm: 'field_tXAko__c', type: 'decimal' },
  constructionDate: { 
    d1: 'actual_start_date', 
    crm: 'field_23pFq__c', 
    type: 'date',
    transform: {
      toCrm: (value) => value ? new Date(value).getTime() : null,
      fromCrm: (value) => value ? new Date(value).toISOString().split('T')[0] : null
    }
  },
  contractor: { d1: 'contractor_name', crm: 'field_u1wpv__c', type: 'text' },
  constructionCompleted: { d1: 'construction_completed', crm: 'construction_completed__c', type: 'boolean' },

  // 備註欄位
  preConstructionNote: { d1: 'pre_construction_note', crm: 'field_sF6fn__c', type: 'text' },
  contractorNote: { d1: 'contractor_note', crm: 'field_V32Xl__c', type: 'text' },
  siteNote: { d1: 'site_note', crm: 'field_g18hX__c', type: 'textarea' },
  acceptanceNote: { d1: 'acceptance_note', crm: 'field_n37jC__c', type: 'text' },

  // 照片欄位
  prePhotos: { 
    d1: 'pre_photos', 
    crm: 'field_V3d91__c', 
    type: 'file',
    transform: {
      toCrm: (value) => value ? JSON.stringify(value) : null,
      fromCrm: (value) => value ? JSON.parse(value) : [],
      toD1: (value) => value ? JSON.stringify(value) : null
    }
  },
  completionPhotos: { 
    d1: 'completion_photos', 
    crm: 'field_3Fqof__c', 
    type: 'file',
    transform: {
      toCrm: (value) => value ? JSON.stringify(value) : null,
      fromCrm: (value) => value ? JSON.parse(value) : [],
      toD1: (value) => value ? JSON.stringify(value) : null
    }
  },

  // 維修相關
  defectCategory1: { d1: 'defect_category_1', crm: 'field_OmPo8__c', type: 'multiselect' },
  defectNote1: { d1: 'defect_note_1', crm: 'field_nht8k__c', type: 'text' },
  repairDate1: { d1: 'repair_date_1', crm: 'field_r1mp8__c', type: 'date' },
  repairCost1: { d1: 'repair_cost_1', crm: 'field_7ndUg__c', type: 'decimal' },

  // 狀態管理
  stage: { d1: 'stage', crm: 'field_z9H6O__c', type: 'select' },
  tags: { d1: 'tags', crm: 'field_23Z5i__c', type: 'multiselect' },
  siteType: { d1: 'site_type', crm: 'field_dxr31__c', type: 'select' },

  // 系統欄位
  createdAt: { d1: 'created_at', crm: 'create_time', type: 'timestamp' },
  updatedAt: { d1: 'updated_at', crm: 'last_modified_time', type: 'timestamp' },
  crmRecordId: { d1: 'crm_record_id', crm: '_id', type: 'text' }
};

/**
 * 將前端數據轉換為D1資料庫格式
 * @param {Object} frontendData - 前端表單數據
 * @returns {Object} D1資料庫格式數據
 */
export function convertToD1Format(frontendData) {
  const d1Data = {};
  
  Object.keys(frontendData).forEach(key => {
    const mappingKey = findMappingKey(key, 'frontend');
    if (mappingKey && FIELD_MAPPING[mappingKey].d1) {
      const mapping = FIELD_MAPPING[mappingKey];
      let value = frontendData[key];
      
      // 應用轉換函數
      if (mapping.transform && mapping.transform.toD1) {
        value = mapping.transform.toD1(value);
      }
      
      d1Data[mapping.d1] = value;
    }
  });
  
  return d1Data;
}

/**
 * 將前端數據轉換為CRM格式
 * @param {Object} frontendData - 前端表單數據
 * @returns {Object} CRM API格式數據
 */
export function convertToCRMFormat(frontendData) {
  const crmData = {};
  
  Object.keys(frontendData).forEach(key => {
    const mappingKey = findMappingKey(key, 'frontend');
    if (mappingKey && FIELD_MAPPING[mappingKey].crm) {
      const mapping = FIELD_MAPPING[mappingKey];
      let value = frontendData[key];
      
      // 應用轉換函數
      if (mapping.transform && mapping.transform.toCrm) {
        value = mapping.transform.toCrm(value);
      }
      
      crmData[mapping.crm] = value;
    }
  });
  
  return crmData;
}

/**
 * 將CRM數據轉換為D1格式
 * @param {Object} crmData - CRM API數據
 * @returns {Object} D1資料庫格式數據
 */
export function convertCRMToD1Format(crmData) {
  const d1Data = {};
  
  Object.keys(FIELD_MAPPING).forEach(key => {
    const mapping = FIELD_MAPPING[key];
    
    if (mapping.crm && crmData[mapping.crm] !== undefined && mapping.d1) {
      let value = crmData[mapping.crm];
      
      // 先從CRM格式轉換，再轉換為D1格式
      if (mapping.transform && mapping.transform.fromCrm) {
        value = mapping.transform.fromCrm(value);
      }
      if (mapping.transform && mapping.transform.toD1) {
        value = mapping.transform.toD1(value);
      }
      
      d1Data[mapping.d1] = value;
    }
  });
  
  return d1Data;
}

/**
 * 將D1數據轉換為CRM格式
 * @param {Object} d1Data - D1資料庫數據
 * @returns {Object} CRM API格式數據
 */
export function convertD1ToCRMFormat(d1Data) {
  const crmData = {};
  
  Object.keys(FIELD_MAPPING).forEach(key => {
    const mapping = FIELD_MAPPING[key];
    
    if (mapping.d1 && d1Data[mapping.d1] !== undefined && mapping.crm) {
      let value = d1Data[mapping.d1];
      
      // 應用轉換函數
      if (mapping.transform && mapping.transform.toCrm) {
        value = mapping.transform.toCrm(value);
      }
      
      crmData[mapping.crm] = value;
    }
  });
  
  return crmData;
}

/**
 * 生成統一的D1插入SQL語句
 * @param {Object} data - 要插入的數據
 * @param {string} tableName - 表名
 * @returns {Object} { sql, values } SQL語句和參數
 */
export function generateD1InsertSQL(data, tableName = 'site_progress') {
  const columns = Object.keys(data).filter(key => data[key] !== undefined);
  const values = columns.map(key => data[key]);
  const placeholders = columns.map(() => '?').join(', ');
  
  const sql = `
    INSERT INTO ${tableName} (${columns.join(', ')})
    VALUES (${placeholders})
  `;
  
  return { sql, values };
}

/**
 * 生成統一的D1更新SQL語句
 * @param {Object} data - 要更新的數據
 * @param {string} whereClause - WHERE條件
 * @param {Array} whereValues - WHERE條件參數
 * @param {string} tableName - 表名
 * @returns {Object} { sql, values } SQL語句和參數
 */
export function generateD1UpdateSQL(data, whereClause, whereValues, tableName = 'site_progress') {
  const columns = Object.keys(data).filter(key => data[key] !== undefined);
  const values = columns.map(key => data[key]);
  const setClause = columns.map(key => `${key} = ?`).join(', ');
  
  const sql = `
    UPDATE ${tableName} 
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE ${whereClause}
  `;
  
  return { sql, values: [...values, ...whereValues] };
}

/**
 * 獲取所有CRM欄位名稱
 * @returns {Array} CRM欄位名稱陣列
 */
export function getAllCRMFields() {
  return Object.keys(FIELD_MAPPING)
    .filter(key => FIELD_MAPPING[key].crm)
    .map(key => FIELD_MAPPING[key].crm);
}

/**
 * 獲取所有D1欄位名稱
 * @returns {Array} D1欄位名稱陣列
 */
export function getAllD1Fields() {
  return Object.keys(FIELD_MAPPING)
    .filter(key => FIELD_MAPPING[key].d1)
    .map(key => FIELD_MAPPING[key].d1);
}

/**
 * 根據欄位名稱和類型查找映射配置
 * @param {string} fieldName - 欄位名稱
 * @param {string} type - 欄位類型 ('frontend', 'd1', 'crm')
 * @returns {string|null} 映射配置的key
 */
function findMappingKey(fieldName, type) {
  return Object.keys(FIELD_MAPPING).find(key => {
    const mapping = FIELD_MAPPING[key];
    switch(type) {
      case 'frontend': return mapping.frontend === fieldName;
      case 'd1': return mapping.d1 === fieldName;
      case 'crm': return mapping.crm === fieldName;
      default: return false;
    }
  });
}

/**
 * 驗證數據格式
 * @param {Object} data - 要驗證的數據
 * @param {string} targetType - 目標類型 ('d1', 'crm')
 * @returns {Object} { isValid, errors } 驗證結果
 */
export function validateData(data, targetType) {
  const errors = [];
  
  Object.keys(data).forEach(key => {
    const mappingKey = findMappingKey(key, targetType);
    if (mappingKey) {
      const mapping = FIELD_MAPPING[mappingKey];
      const value = data[key];
      
      // 基本類型驗證
      switch(mapping.type) {
        case 'integer':
          if (value !== null && !Number.isInteger(Number(value))) {
            errors.push(`${key} 必須是整數`);
          }
          break;
        case 'decimal':
          if (value !== null && isNaN(Number(value))) {
            errors.push(`${key} 必須是數字`);
          }
          break;
        case 'boolean':
          if (value !== null && typeof value !== 'boolean') {
            errors.push(`${key} 必須是布爾值`);
          }
          break;
        case 'date':
          if (value !== null && isNaN(Date.parse(value))) {
            errors.push(`${key} 必須是有效日期格式`);
          }
          break;
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export default {
  FIELD_MAPPING,
  convertToD1Format,
  convertToCRMFormat,
  convertCRMToD1Format,
  convertD1ToCRMFormat,
  generateD1InsertSQL,
  generateD1UpdateSQL,
  getAllCRMFields,
  getAllD1Fields,
  validateData
};