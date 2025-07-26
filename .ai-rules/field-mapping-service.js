/**
 * 统一字段映射服务
 * 处理 CRM 数据到 D1 数据库的字段转换和验证
 */

import { 
  SITE_FIELD_MAPPING, 
  OPPORTUNITY_FIELD_MAPPING,
  MAINTENANCE_FIELD_MAPPING,
  SALES_FIELD_MAPPING,
  FIELD_TRANSFORMERS,
  FIELD_VALIDATION 
} from './field-mapping-config.js';

/**
 * 字段映射服务类
 */
export class FieldMappingService {
  constructor(env) {
    this.env = env;
    this.mappingConfigs = {
      'sites': SITE_FIELD_MAPPING,
      'opportunities': OPPORTUNITY_FIELD_MAPPING,
      'maintenance_orders': MAINTENANCE_FIELD_MAPPING,
      'sales_records': SALES_FIELD_MAPPING
    };
  }

  /**
   * 转换 CRM 数据到 D1 格式
   * @param {string} objectType - 对象类型 ('sites', 'opportunities', etc.)
   * @param {Object} crmData - CRM 原始数据
   * @param {string} targetTable - 目标表名 ('sites', 'site_progress', etc.)
   * @returns {Object} 转换后的 D1 数据
   */
  async transformCrmToD1(objectType, crmData, targetTable = null) {
    const config = this.mappingConfigs[objectType];
    if (!config) {
      throw new Error(`未找到对象类型 ${objectType} 的映射配置`);
    }

    let mappings;
    
    // 根据目标表选择对应的映射配置
    if (objectType === 'sites') {
      if (targetTable === 'site_progress') {
        mappings = config.progress_fields.mappings;
      } else {
        mappings = config.base_fields.mappings;
      }
    } else {
      mappings = config.mappings;
    }

    const d1Data = {};
    const transformationLog = [];

    for (const [crmField, fieldConfig] of Object.entries(mappings)) {
      try {
        const originalValue = this.extractFieldValue(crmData, crmField);
        const transformedValue = await this.transformFieldValue(
          originalValue, 
          fieldConfig, 
          crmField
        );

        if (transformedValue !== null && transformedValue !== undefined) {
          d1Data[fieldConfig.d1_field] = transformedValue;
        }

        // 记录转换日志
        transformationLog.push({
          crmField,
          d1Field: fieldConfig.d1_field,
          originalValue,
          transformedValue,
          transformationType: 'success'
        });

      } catch (error) {
        console.error(`字段转换失败: ${crmField} -> ${fieldConfig.d1_field}`, error);
        
        transformationLog.push({
          crmField,
          d1Field: fieldConfig.d1_field,
          originalValue: this.extractFieldValue(crmData, crmField),
          transformedValue: null,
          transformationType: 'failed',
          error: error.message
        });
      }
    }

    // 添加系统字段
    d1Data.synced_at = Date.now();
    d1Data.raw_data = JSON.stringify(crmData);

    return {
      data: d1Data,
      transformationLog
    };
  }

  /**
   * 从 CRM 数据中提取字段值
   * @param {Object} crmData - CRM 数据对象
   * @param {string} fieldName - 字段名
   * @returns {any} 字段值
   */
  extractFieldValue(crmData, fieldName) {
    // 处理嵌套字段路径，如 'data.name'
    const fieldPath = fieldName.split('.');
    let value = crmData;
    
    for (const path of fieldPath) {
      if (value && typeof value === 'object' && path in value) {
        value = value[path];
      } else {
        return null;
      }
    }
    
    return value;
  }

  /**
   * 转换字段值到目标格式
   * @param {any} value - 原始值
   * @param {Object} fieldConfig - 字段配置
   * @param {string} crmFieldName - CRM 字段名
   * @returns {any} 转换后的值
   */
  async transformFieldValue(value, fieldConfig, crmFieldName) {
    if (value === null || value === undefined) {
      return null;
    }

    // 应用自定义转换函数
    if (fieldConfig.transform && typeof fieldConfig.transform === 'function') {
      return fieldConfig.transform(value);
    }

    // 根据目标类型进行转换
    switch (fieldConfig.type) {
      case 'TEXT':
        return String(value);
        
      case 'INTEGER':
        if (typeof value === 'number') return Math.floor(value);
        if (typeof value === 'string') {
          const parsed = parseInt(value, 10);
          return isNaN(parsed) ? null : parsed;
        }
        // 时间戳转换
        if (value instanceof Date || typeof value === 'string') {
          return FIELD_TRANSFORMERS.timestampToInteger(value);
        }
        return null;
        
      case 'REAL':
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? null : parsed;
        }
        return null;
        
      case 'DATE':
        if (value instanceof Date) return value.toISOString().split('T')[0];
        if (typeof value === 'string') {
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
        }
        return null;
        
      case 'BOOLEAN':
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true' || value === '1';
        }
        return Boolean(value);
        
      case 'JSON':
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
        
      case 'IMAGE_ARRAY':
        // 处理图片数组
        return await this.processImageField(value, crmFieldName);
        
      default:
        return value;
    }
  }

  /**
   * 处理图片字段
   * @param {any} imageData - 图片数据
   * @param {string} fieldName - 字段名
   * @returns {string|null} 处理后的图片URL或JSON
   */
  async processImageField(imageData, fieldName) {
    try {
      if (!imageData) return null;
      
      // 如果是数组，处理多张图片
      if (Array.isArray(imageData)) {
        const processedUrls = [];
        for (const img of imageData) {
          const url = await this.uploadToCloudflareImages(img, fieldName);
          if (url) processedUrls.push(url);
        }
        return processedUrls.length > 0 ? JSON.stringify(processedUrls) : null;
      }
      
      // 单张图片
      const url = await this.uploadToCloudflareImages(imageData, fieldName);
      return url ? JSON.stringify([url]) : null;
      
    } catch (error) {
      console.error(`图片处理失败 ${fieldName}:`, error);
      return null;
    }
  }

  /**
   * 上传图片到 Cloudflare Images
   * @param {Object} imageData - 图片数据
   * @param {string} fieldName - 字段名
   * @returns {string|null} 图片URL
   */
  async uploadToCloudflareImages(imageData, fieldName) {
    try {
      // TODO: 实现 Cloudflare Images 上传逻辑
      // 这里需要根据实际的图片数据格式实现上传
      console.log(`图片上传 ${fieldName}:`, imageData);
      return null; // 暂时返回 null，待实现
    } catch (error) {
      console.error(`图片上传失败 ${fieldName}:`, error);
      return null;
    }
  }

  /**
   * 验证字段数据
   * @param {string} tableName - 表名
   * @param {Object} data - 数据对象
   * @returns {Object} 验证结果
   */
  validateFieldData(tableName, data) {
    const validation = FIELD_VALIDATION[tableName];
    if (!validation) {
      return { isValid: true, errors: [] };
    }

    const errors = [];

    for (const [fieldName, rules] of Object.entries(validation)) {
      const value = data[fieldName];

      // 必填验证
      if (rules.required && (value === null || value === undefined || value === '')) {
        errors.push(`字段 ${fieldName} 为必填项`);
        continue;
      }

      if (value === null || value === undefined) continue;

      // 长度验证
      if (rules.maxLength && String(value).length > rules.maxLength) {
        errors.push(`字段 ${fieldName} 长度不能超过 ${rules.maxLength}`);
      }

      // 数值范围验证
      if (rules.type === 'number') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          errors.push(`字段 ${fieldName} 必须为数字`);
        } else {
          if (rules.min !== undefined && numValue < rules.min) {
            errors.push(`字段 ${fieldName} 不能小于 ${rules.min}`);
          }
          if (rules.max !== undefined && numValue > rules.max) {
            errors.push(`字段 ${fieldName} 不能大于 ${rules.max}`);
          }
        }
      }

      // 选项验证
      if (rules.options && !rules.options.includes(value)) {
        errors.push(`字段 ${fieldName} 值必须为: ${rules.options.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 记录字段映射日志
   * @param {string} syncType - 同步类型
   * @param {string} recordId - 记录ID
   * @param {Array} transformationLog - 转换日志
   */
  async logFieldMapping(syncType, recordId, transformationLog) {
    try {
      const statements = transformationLog.map(log => {
        return this.env.DB.prepare(`
          INSERT INTO field_mapping_logs (
            sync_type, record_id, crm_field, d1_field, 
            original_value, transformed_value, transformation_type, error_message
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          syncType,
          recordId,
          log.crmField,
          log.d1Field,
          JSON.stringify(log.originalValue),
          JSON.stringify(log.transformedValue),
          log.transformationType,
          log.error || null
        );
      });

      await this.env.DB.batch(statements);
      
    } catch (error) {
      console.error('字段映射日志记录失败:', error);
    }
  }

  /**
   * 获取字段映射统计
   * @param {string} syncType - 同步类型
   * @param {number} hours - 统计时间范围（小时）
   * @returns {Object} 统计结果
   */
  async getFieldMappingStats(syncType, hours = 24) {
    try {
      const since = Date.now() - (hours * 60 * 60 * 1000);
      
      const stats = await this.env.DB.prepare(`
        SELECT 
          transformation_type,
          COUNT(*) as count,
          COUNT(DISTINCT record_id) as unique_records
        FROM field_mapping_logs 
        WHERE sync_type = ? AND created_at > datetime(?, 'unixepoch', 'localtime')
        GROUP BY transformation_type
      `).bind(syncType, Math.floor(since / 1000)).all();

      return {
        syncType,
        timeRange: `${hours}小时`,
        stats: stats.results || []
      };
      
    } catch (error) {
      console.error('获取字段映射统计失败:', error);
      return { syncType, error: error.message };
    }
  }
}