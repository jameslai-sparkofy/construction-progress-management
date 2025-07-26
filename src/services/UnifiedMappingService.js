/**
 * 統一映射服務 (UnifiedMappingService)
 * 
 * 核心功能：
 * - 統一處理四大 CRM 對象的映射邏輯
 * - 支援雙向映射轉換 (Frontend ↔ D1 ↔ CRM)
 * - 批量處理和數據驗證
 * - 錯誤處理和空值處理
 */

import { 
  MAPPING_CONFIG, 
  getObjectConfig, 
  getFieldConfig, 
  validateMappingConfig 
} from '../mapping/field-mapping-config.js';

export class UnifiedMappingService {
  constructor() {
    this.config = MAPPING_CONFIG;
    this.validators = new Map();
    this.transformers = new Map();
    this.lastConfigUpdate = Date.now();
    
    // 初始化驗證器和轉換器
    this.initializeValidators();
    this.initializeTransformers();
    
    // 驗證配置完整性
    this.validateConfiguration();
  }

  /**
   * 初始化數據驗證器
   * @private
   */
  initializeValidators() {
    // 載入配置中的驗證規則
    for (const [ruleName, ruleFunction] of Object.entries(this.config.validationRules)) {
      this.validators.set(ruleName, ruleFunction);
    }
    
    // 新增額外的驗證器
    this.validators.set('maxLength', (value, maxLength) => {
      if (value === null || value === undefined) return true;
      return String(value).length <= maxLength;
    });
    
    this.validators.set('enum', (value, enumValues) => {
      if (value === null || value === undefined) return true;
      return enumValues.includes(value);
    });
    
    this.validators.set('type', (value, expectedType) => {
      if (value === null || value === undefined) return true;
      
      switch (expectedType) {
        case 'string':
          return typeof value === 'string';
        case 'number':
          return typeof value === 'number' && !isNaN(value);
        case 'boolean':
          return typeof value === 'boolean';
        case 'array':
          return Array.isArray(value);
        case 'json':
        case 'object':
          return typeof value === 'object';
        case 'timestamp':
        case 'date':
          return !isNaN(Date.parse(value)) || typeof value === 'number';
        case 'text':
          return typeof value === 'string';
        default:
          return true;
      }
    });
  }

  /**
   * 初始化類型轉換器
   * @private
   */
  initializeTransformers() {
    // 載入配置中的轉換規則
    for (const [converterName, converterFunction] of Object.entries(this.config.typeConverters)) {
      this.transformers.set(converterName, converterFunction);
    }
  }

  /**
   * 驗證映射配置
   * @private
   */
  validateConfiguration() {
    const validation = validateMappingConfig();
    
    if (!validation.isValid) {
      console.error('映射配置驗證失敗:', validation.errors);
      throw new Error(`映射配置無效: ${validation.errors.join(', ')}`);
    }
    
    if (validation.warnings.length > 0) {
      console.warn('映射配置警告:', validation.warnings);
    }
    
    console.log('映射配置加載成功:', validation.summary);
  }

  /**
   * 獲取對象配置
   * @param {string} objectType - 對象類型
   * @returns {Object} 對象配置
   */
  getObjectConfig(objectType) {
    const config = getObjectConfig(objectType);
    if (!config) {
      throw new Error(`未找到對象配置: ${objectType}`);
    }
    return config;
  }

  /**
   * 前端數據映射到 D1 格式
   * @param {string} objectType - 對象類型
   * @param {Object} frontendData - 前端數據
   * @returns {Promise<Object>} 映射後的 D1 數據
   */
  async mapFrontendToD1(objectType, frontendData) {
    try {
      const objectConfig = this.getObjectConfig(objectType);
      const mappedData = {};
      const errors = [];
      const warnings = [];

      for (const [fieldName, fieldConfig] of Object.entries(objectConfig.fields)) {
        // 跳過本地專用字段
        if (fieldConfig.localOnly) continue;
        
        const frontendKey = fieldConfig.frontend;
        const d1Key = fieldConfig.d1;
        
        // 如果前端沒有對應欄位，跳過
        if (!frontendKey || !(frontendKey in frontendData)) {
          // 檢查必填欄位
          if (fieldConfig.required && !fieldConfig.defaultValue) {
            errors.push(`缺少必填欄位: ${frontendKey} (${fieldName})`);
          } else if (fieldConfig.defaultValue !== undefined) {
            mappedData[d1Key] = fieldConfig.defaultValue;
          }
          continue;
        }

        let value = frontendData[frontendKey];

        // 類型轉換
        const convertedValue = await this.convertValue(value, 'frontend', 'd1', fieldConfig);
        
        // 數據驗證（使用轉換後的值）
        const validationResult = await this.validateField(fieldConfig, convertedValue);
        if (!validationResult.isValid) {
          errors.push(`欄位 ${frontendKey} 驗證失敗: ${validationResult.errors.join(', ')}`);
          continue;
        }
        mappedData[d1Key] = convertedValue;

        // 記錄警告
        if (validationResult.warnings.length > 0) {
          warnings.push(...validationResult.warnings.map(w => `${frontendKey}: ${w}`));
        }
      }

      // 新增或更新時間戳
      const now = Math.floor(Date.now() / 1000);
      if (!mappedData.create_time) {
        mappedData.create_time = now;
      }
      mappedData.update_time = now;

      if (errors.length > 0) {
        throw new Error(`前端到D1映射失敗: ${errors.join('; ')}`);
      }

      return {
        data: mappedData,
        warnings,
        metadata: {
          objectType,
          mappedFields: Object.keys(mappedData).length,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error(`前端到D1映射錯誤 (${objectType}):`, error);
      throw error;
    }
  }

  /**
   * D1 數據映射到 CRM 格式
   * @param {string} objectType - 對象類型
   * @param {Object} d1Data - D1 數據
   * @returns {Promise<Object>} 映射後的 CRM 數據
   */
  async mapD1ToCRM(objectType, d1Data) {
    try {
      const objectConfig = this.getObjectConfig(objectType);
      const mappedData = {};
      const errors = [];
      const warnings = [];

      for (const [fieldName, fieldConfig] of Object.entries(objectConfig.fields)) {
        // 跳過唯讀欄位和本地專用欄位
        if (fieldConfig.readonly || fieldConfig.localOnly || !fieldConfig.crm) continue;
        
        const d1Key = fieldConfig.d1;
        const crmKey = fieldConfig.crm;
        
        // 如果 D1 中沒有此欄位，跳過
        if (!(d1Key in d1Data)) {
          // 檢查必填欄位
          if (fieldConfig.required && !fieldConfig.defaultValue) {
            errors.push(`缺少必填欄位: ${d1Key} (${fieldName})`);
          }
          continue;
        }

        let value = d1Data[d1Key];

        // 類型轉換
        const convertedValue = await this.convertValue(value, 'd1', 'crm', fieldConfig);
        mappedData[crmKey] = convertedValue;
      }

      if (errors.length > 0) {
        throw new Error(`D1到CRM映射失敗: ${errors.join('; ')}`);
      }

      return {
        data: mappedData,
        warnings,
        metadata: {
          objectType,
          mappedFields: Object.keys(mappedData).length,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error(`D1到CRM映射錯誤 (${objectType}):`, error);
      throw error;
    }
  }

  /**
   * CRM 數據映射到 D1 格式
   * @param {string} objectType - 對象類型
   * @param {Object} crmData - CRM 數據
   * @returns {Promise<Object>} 映射後的 D1 數據
   */
  async mapCRMToD1(objectType, crmData) {
    try {
      const objectConfig = this.getObjectConfig(objectType);
      const mappedData = {};
      const errors = [];
      const warnings = [];

      for (const [fieldName, fieldConfig] of Object.entries(objectConfig.fields)) {
        const crmKey = fieldConfig.crm;
        const d1Key = fieldConfig.d1;
        
        // 處理特殊情況
        if (fieldName === 'synced_at') {
          mappedData[d1Key] = Math.floor(Date.now() / 1000);
          continue;
        }
        
        if (fieldName === 'raw_data') {
          mappedData[d1Key] = JSON.stringify(crmData);
          continue;
        }
        
        // 如果 CRM 中沒有對應欄位，跳過
        if (!crmKey || !(crmKey in crmData)) {
          // 檢查必填欄位
          if (fieldConfig.required && !fieldConfig.defaultValue) {
            errors.push(`CRM中缺少必填欄位: ${crmKey} (${fieldName})`);
          } else if (fieldConfig.defaultValue !== undefined) {
            mappedData[d1Key] = fieldConfig.defaultValue;
          }
          continue;
        }

        let value = crmData[crmKey];

        // 數據驗證
        const validationResult = await this.validateField(fieldConfig, value);
        if (!validationResult.isValid) {
          warnings.push(`CRM欄位 ${crmKey} 驗證失敗: ${validationResult.errors.join(', ')}`);
          // 對於CRM數據，驗證失敗時使用原值或默認值
          value = fieldConfig.defaultValue !== undefined ? fieldConfig.defaultValue : value;
        }

        // 類型轉換
        const convertedValue = await this.convertValue(value, 'crm', 'd1', fieldConfig);
        mappedData[d1Key] = convertedValue;
      }

      if (errors.length > 0) {
        throw new Error(`CRM到D1映射失敗: ${errors.join('; ')}`);
      }

      return {
        data: mappedData,
        warnings,
        metadata: {
          objectType,
          mappedFields: Object.keys(mappedData).length,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error(`CRM到D1映射錯誤 (${objectType}):`, error);
      throw error;
    }
  }

  /**
   * 批量映射：前端到 D1
   * @param {string} objectType - 對象類型
   * @param {Array} dataArray - 前端數據陣列
   * @returns {Promise<Object>} 批量映射結果
   */
  async batchMapFrontendToD1(objectType, dataArray) {
    const results = [];
    const errors = [];
    let successCount = 0;

    for (let i = 0; i < dataArray.length; i++) {
      try {
        const result = await this.mapFrontendToD1(objectType, dataArray[i]);
        results.push(result);
        successCount++;
      } catch (error) {
        errors.push({
          index: i,
          data: dataArray[i],
          error: error.message
        });
      }
    }

    return {
      results,
      successCount,
      failureCount: errors.length,
      errors,
      metadata: {
        objectType,
        totalRecords: dataArray.length,
        timestamp: Date.now()
      }
    };
  }

  /**
   * 批量映射：D1 到 CRM
   * @param {string} objectType - 對象類型
   * @param {Array} dataArray - D1 數據陣列
   * @returns {Promise<Object>} 批量映射結果
   */
  async batchMapD1ToCRM(objectType, dataArray) {
    const results = [];
    const errors = [];
    let successCount = 0;

    for (let i = 0; i < dataArray.length; i++) {
      try {
        const result = await this.mapD1ToCRM(objectType, dataArray[i]);
        results.push(result);
        successCount++;
      } catch (error) {
        errors.push({
          index: i,
          data: dataArray[i],
          error: error.message
        });
      }
    }

    return {
      results,
      successCount,
      failureCount: errors.length,
      errors,
      metadata: {
        objectType,
        totalRecords: dataArray.length,
        timestamp: Date.now()
      }
    };
  }

  /**
   * 批量映射：CRM 到 D1
   * @param {string} objectType - 對象類型
   * @param {Array} dataArray - CRM 數據陣列
   * @returns {Promise<Object>} 批量映射結果
   */
  async batchMapCRMToD1(objectType, dataArray) {
    const results = [];
    const errors = [];
    let successCount = 0;

    for (let i = 0; i < dataArray.length; i++) {
      try {
        const result = await this.mapCRMToD1(objectType, dataArray[i]);
        results.push(result);
        successCount++;
      } catch (error) {
        errors.push({
          index: i,
          data: dataArray[i],
          error: error.message
        });
      }
    }

    return {
      results,
      successCount,
      failureCount: errors.length,
      errors,
      metadata: {
        objectType,
        totalRecords: dataArray.length,
        timestamp: Date.now()
      }
    };
  }

  /**
   * 數據欄位驗證
   * @param {Object} fieldConfig - 欄位配置
   * @param {*} value - 待驗證的值
   * @returns {Promise<Object>} 驗證結果
   */
  async validateField(fieldConfig, value) {
    const errors = [];
    const warnings = [];

    // 檢查必填欄位
    if (fieldConfig.required) {
      const isEmpty = value === null || value === undefined || value === '';
      if (isEmpty && fieldConfig.defaultValue === undefined) {
        errors.push('必填欄位不能為空');
      }
    }

    // 跳過空值的其他驗證
    if (value === null || value === undefined || value === '') {
      return { isValid: errors.length === 0, errors, warnings };
    }

    // 類型驗證
    if (fieldConfig.type) {
      const typeValidator = this.validators.get('type');
      if (typeValidator && !typeValidator(value, fieldConfig.type)) {
        errors.push(`類型不匹配，期望: ${fieldConfig.type}`);
      }
    }

    // 長度驗證
    if (fieldConfig.maxLength) {
      const lengthValidator = this.validators.get('maxLength');
      if (lengthValidator && !lengthValidator(value, fieldConfig.maxLength)) {
        errors.push(`長度超過限制: ${fieldConfig.maxLength}`);
      }
    }

    // 枚舉值驗證
    if (fieldConfig.enum) {
      const enumValidator = this.validators.get('enum');
      if (enumValidator && !enumValidator(value, fieldConfig.enum)) {
        errors.push(`值不在允許範圍內: ${fieldConfig.enum.join(', ')}`);
      }
    }

    // 自定義驗證規則
    if (fieldConfig.validation) {
      const customValidator = this.validators.get(fieldConfig.validation);
      if (customValidator && !customValidator(value)) {
        errors.push(`自定義驗證失敗: ${fieldConfig.validation}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 數據類型轉換
   * @param {*} value - 原始值
   * @param {string} sourceFormat - 來源格式 ('frontend', 'd1', 'crm')
   * @param {string} targetFormat - 目標格式 ('frontend', 'd1', 'crm')
   * @param {Object} fieldConfig - 欄位配置
   * @returns {Promise<*>} 轉換後的值
   */
  async convertValue(value, sourceFormat, targetFormat, fieldConfig) {
    // 空值處理
    if (value === null || value === undefined) {
      return fieldConfig.defaultValue !== undefined ? fieldConfig.defaultValue : null;
    }

    const fieldType = fieldConfig.type;

    try {
      // 基於欄位類型的轉換
      switch (fieldType) {
        case 'timestamp':
          if (sourceFormat === 'crm' && targetFormat === 'd1') {
            // CRM 時間戳通常是秒，D1 存儲也用秒
            return typeof value === 'number' ? value : Math.floor(Date.parse(value) / 1000);
          } else if (sourceFormat === 'd1' && targetFormat === 'frontend') {
            // D1 到前端：秒轉 ISO 字串
            return new Date(value * 1000).toISOString();
          } else if (sourceFormat === 'frontend' && targetFormat === 'd1') {
            // 前端到 D1：可能是數字時間戳或 ISO 字串
            if (typeof value === 'number') {
              return value; // 已經是時間戳，直接返回
            } else if (typeof value === 'string') {
              return Math.floor(Date.parse(value) / 1000);
            }
            return Math.floor(Date.now() / 1000); // 默認當前時間
          }
          break;

        case 'date':
          if (targetFormat === 'frontend') {
            return typeof value === 'string' ? value : new Date(value).toISOString().split('T')[0];
          } else if (sourceFormat === 'frontend') {
            return value; // 保持日期字串格式
          }
          break;

        case 'number':
          const converter = this.transformers.get('stringToNumber');
          return converter ? converter(value) : Number(value);

        case 'boolean':
          const boolConverter = this.transformers.get('stringToBoolean');
          return boolConverter ? boolConverter(value) : Boolean(value);

        case 'array':
          if (typeof value === 'string') {
            const arrayConverter = this.transformers.get('stringToArray');
            return arrayConverter ? arrayConverter(value) : value.split(',');
          } else if (Array.isArray(value) && targetFormat === 'crm') {
            const stringConverter = this.transformers.get('arrayToString');
            return stringConverter ? stringConverter(value) : value.join(',');
          }
          break;

        case 'json':
        case 'object':
          if (targetFormat === 'd1' && typeof value === 'object') {
            const jsonConverter = this.transformers.get('objectToJson');
            return jsonConverter ? jsonConverter(value) : JSON.stringify(value);
          } else if (sourceFormat === 'd1' && typeof value === 'string') {
            const objConverter = this.transformers.get('jsonToObject');
            return objConverter ? objConverter(value) : JSON.parse(value);
          }
          break;

        case 'string':
        case 'text':
        default:
          // 字串類型或默認情況，直接返回
          return String(value);
      }

      return value;
    } catch (error) {
      console.warn(`類型轉換失敗 (${fieldType}):`, error);
      return value; // 轉換失敗時返回原值
    }
  }

  /**
   * 重新載入配置
   * @returns {Promise<boolean>} 重載是否成功
   */
  async reloadConfig() {
    try {
      // 重新驗證配置
      this.validateConfiguration();
      this.lastConfigUpdate = Date.now();
      
      console.log('映射配置重新載入成功');
      return true;
    } catch (error) {
      console.error('映射配置重載失敗:', error);
      return false;
    }
  }

  /**
   * 獲取統計信息
   * @returns {Object} 統計信息
   */
  getStatistics() {
    const objects = Object.keys(this.config.objects);
    const totalFields = objects.reduce((sum, objectType) => {
      return sum + Object.keys(this.config.objects[objectType].fields).length;
    }, 0);

    return {
      version: this.config.version,
      lastUpdated: this.config.lastUpdated,
      lastConfigUpdate: this.lastConfigUpdate,
      totalObjects: objects.length,
      totalFields,
      objects: objects.map(objectType => ({
        name: objectType,
        apiType: this.config.objects[objectType].apiType,
        fieldCount: Object.keys(this.config.objects[objectType].fields).length,
        batchSize: this.config.objects[objectType].batchSize
      })),
      validators: Array.from(this.validators.keys()),
      transformers: Array.from(this.transformers.keys())
    };
  }
}

// 導出單例實例
export const mappingService = new UnifiedMappingService();