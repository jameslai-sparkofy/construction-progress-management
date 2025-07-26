/**
 * 數據遷移服務 (DataMigrationService)
 * 
 * 核心功能：
 * - 安全遷移現有數據到新架構
 * - 分批處理避免超時
 * - 完整性驗證和錯誤處理
 * - 進度追蹤和回滾機制
 * - 與 UnifiedMappingService 整合
 */

import { mappingService } from './UnifiedMappingService.js';

export class DataMigrationService {
  constructor(db) {
    this.db = db;
    this.mappingService = mappingService;
    this.migrationProgress = new Map();
    this.batchConfig = {
      opportunities: { size: 100, timeout: 25000 },
      sites: { size: 50, timeout: 25000 },      // 案場數據量大，減少批次大小
      sales_records: { size: 100, timeout: 25000 },
      maintenance_orders: { size: 100, timeout: 25000 }
    };
    
    // 對象表映射
    this.tableMapping = {
      opportunities: { old: 'NewOpportunityObj', new: 'opportunities' },
      sites: { old: 'object_8W9cb__c', new: 'sites' },
      sales_records: { old: 'ActiveRecordObj', new: 'sales_records' },
      maintenance_orders: { old: 'field_V3d91__c', new: 'maintenance_orders' }
    };
  }

  /**
   * 獲取遷移進度
   * @param {string} objectType - 對象類型
   * @returns {Object} 進度信息
   */
  getMigrationProgress(objectType) {
    const progress = this.migrationProgress.get(objectType);
    return progress || {
      status: 'not_started',
      totalRecords: 0,
      processedRecords: 0,
      successCount: 0,
      failureCount: 0,
      currentBatch: 0,
      totalBatches: 0,
      startTime: null,
      endTime: null,
      errors: []
    };
  }

  /**
   * 設置遷移進度
   * @private
   */
  setMigrationProgress(objectType, progressData) {
    const existing = this.migrationProgress.get(objectType) || {};
    this.migrationProgress.set(objectType, { ...existing, ...progressData });
    
    // 記錄到數據庫
    this.logMigrationProgress(objectType, progressData);
  }

  /**
   * 記錄遷移進度到數據庫
   * @private
   */
  async logMigrationProgress(objectType, progressData) {
    try {
      const progress = this.migrationProgress.get(objectType);
      
      await this.db.prepare(`
        UPDATE migration_history 
        SET records_migrated = ?, 
            records_failed = ?,
            completed_at = ?,
            status = ?
        WHERE migration_name = ? AND status IN ('pending', 'running')
      `).bind(
        progress.successCount,
        progress.failureCount,
        progress.status === 'completed' ? Math.floor(Date.now() / 1000) : null,
        progress.status,
        `migrate-${objectType}`
      ).run();
      
    } catch (error) {
      console.warn(`記錄遷移進度失敗 (${objectType}):`, error);
    }
  }

  /**
   * 獲取原始數據總數
   * @param {string} objectType - 對象類型
   * @returns {Promise<number>} 記錄總數
   */
  async getOriginalDataCount(objectType) {
    const mapping = this.tableMapping[objectType];
    if (!mapping) {
      throw new Error(`未知對象類型: ${objectType}`);
    }

    try {
      const result = await this.db.prepare(`
        SELECT COUNT(*) as count FROM ${mapping.old}
      `).first();
      
      return result.count || 0;
    } catch (error) {
      console.error(`獲取 ${objectType} 原始數據總數失敗:`, error);
      return 0;
    }
  }

  /**
   * 遷移單個對象類型的所有數據
   * @param {string} objectType - 對象類型
   * @param {Object} options - 遷移選項
   * @returns {Promise<Object>} 遷移結果
   */
  async migrateObjectType(objectType, options = {}) {
    const {
      startBatch = 0,
      skipValidation = false,
      dryRun = false
    } = options;

    console.log(`開始遷移 ${objectType} 數據...`);
    
    // 初始化遷移記錄
    await this.initializeMigrationRecord(objectType);
    
    const totalRecords = await this.getOriginalDataCount(objectType);
    const batchConfig = this.batchConfig[objectType];
    const totalBatches = Math.ceil(totalRecords / batchConfig.size);
    
    this.setMigrationProgress(objectType, {
      status: 'running',
      totalRecords,
      totalBatches,
      currentBatch: startBatch,
      startTime: Date.now()
    });

    let processedRecords = startBatch * batchConfig.size;
    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    try {
      // 分批處理數據
      for (let batchIndex = startBatch; batchIndex < totalBatches; batchIndex++) {
        console.log(`處理第 ${batchIndex + 1}/${totalBatches} 批 (${objectType})`);
        
        const batchResult = await this.migrateBatch(
          objectType, 
          batchIndex, 
          batchConfig.size,
          { skipValidation, dryRun }
        );
        
        processedRecords += batchResult.processedCount;
        successCount += batchResult.successCount;
        failureCount += batchResult.failureCount;
        errors.push(...batchResult.errors);
        
        this.setMigrationProgress(objectType, {
          currentBatch: batchIndex + 1,
          processedRecords,
          successCount,
          failureCount,
          errors: errors.slice(-10) // 只保留最近 10 個錯誤
        });

        // 檢查是否需要暫停（錯誤率過高）
        if (failureCount > 0 && (failureCount / processedRecords) > 0.1) {
          console.warn(`${objectType} 錯誤率過高 (${(failureCount/processedRecords*100).toFixed(1)}%)，暫停遷移`);
          this.setMigrationProgress(objectType, { status: 'paused' });
          break;
        }
      }

      // 遷移完成
      const finalStatus = failureCount === 0 ? 'completed' : 'completed_with_errors';
      this.setMigrationProgress(objectType, {
        status: finalStatus,
        endTime: Date.now()
      });

      console.log(`${objectType} 遷移完成: ${successCount}/${totalRecords} 成功`);
      
      return {
        objectType,
        status: finalStatus,
        totalRecords,
        processedRecords,
        successCount,
        failureCount,
        duration: Date.now() - this.getMigrationProgress(objectType).startTime,
        errors: errors.slice(-20) // 返回最近 20 個錯誤
      };

    } catch (error) {
      console.error(`${objectType} 遷移失敗:`, error);
      
      this.setMigrationProgress(objectType, {
        status: 'failed',
        endTime: Date.now()
      });
      
      throw error;
    }
  }

  /**
   * 初始化遷移記錄
   * @private
   */
  async initializeMigrationRecord(objectType) {
    try {
      await this.db.prepare(`
        INSERT INTO migration_history (
          migration_name, 
          migration_version, 
          status,
          started_at
        ) VALUES (?, ?, ?, ?)
      `).bind(
        `migrate-${objectType}`,
        '2.0.0',
        'running',
        Math.floor(Date.now() / 1000)
      ).run();
    } catch (error) {
      // 記錄可能已存在，更新狀態
      await this.db.prepare(`
        UPDATE migration_history 
        SET status = 'running', started_at = ?
        WHERE migration_name = ?
      `).bind(
        Math.floor(Date.now() / 1000),
        `migrate-${objectType}`
      ).run();
    }
  }

  /**
   * 遷移單批數據
   * @private
   */
  async migrateBatch(objectType, batchIndex, batchSize, options = {}) {
    const { skipValidation = false, dryRun = false } = options;
    const mapping = this.tableMapping[objectType];
    const offset = batchIndex * batchSize;
    
    try {
      // 獲取原始數據
      const rawData = await this.db.prepare(`
        SELECT * FROM ${mapping.old}
        LIMIT ? OFFSET ?
      `).bind(batchSize, offset).all();

      if (!rawData || rawData.length === 0) {
        return {
          batchIndex,
          processedCount: 0,
          successCount: 0,
          failureCount: 0,
          errors: []
        };
      }

      // 使用統一映射服務轉換數據
      const conversionResult = await this.mappingService.batchMapCRMToD1(
        objectType, 
        rawData.map(row => ({ ...row })) // 創建數據副本
      );

      let successCount = 0;
      let failureCount = 0;
      const errors = [];

      if (!dryRun) {
        // 批量插入轉換後的數據
        const insertSQL = this.generateInsertSQL(objectType, conversionResult.results[0]?.data);
        
        for (const result of conversionResult.results) {
          try {
            await this.insertMappedData(objectType, result.data, insertSQL);
            successCount++;
          } catch (error) {
            failureCount++;
            errors.push({
              originalData: result.data,
              error: error.message
            });
          }
        }

        // 處理轉換失敗的記錄
        for (const error of conversionResult.errors) {
          failureCount++;
          errors.push({
            index: error.index,
            originalData: error.data,
            error: `轉換失敗: ${error.error}`
          });
        }
      } else {
        // 乾跑模式，只統計轉換結果
        successCount = conversionResult.successCount;
        failureCount = conversionResult.failureCount;
        errors.push(...conversionResult.errors);
      }

      return {
        batchIndex,
        processedCount: rawData.length,
        successCount,
        failureCount,
        errors
      };

    } catch (error) {
      console.error(`批量遷移失敗 (${objectType}, batch ${batchIndex}):`, error);
      
      return {
        batchIndex,
        processedCount: 0,
        successCount: 0,
        failureCount: batchSize,
        errors: [{
          error: `批量處理失敗: ${error.message}`
        }]
      };
    }
  }

  /**
   * 生成插入 SQL
   * @private
   */
  generateInsertSQL(objectType, sampleData) {
    const mapping = this.tableMapping[objectType];
    
    if (!sampleData) {
      throw new Error(`無法生成 ${objectType} 的插入 SQL，缺少樣本數據`);
    }

    const fields = Object.keys(sampleData);
    const placeholders = fields.map(() => '?').join(', ');
    
    return {
      sql: `INSERT OR REPLACE INTO ${mapping.new} (${fields.join(', ')}) VALUES (${placeholders})`,
      fields
    };
  }

  /**
   * 插入映射後的數據
   * @private
   */  
  async insertMappedData(objectType, data, insertSQL) {
    try {
      const values = insertSQL.fields.map(field => data[field] ?? null);
      await this.db.prepare(insertSQL.sql).bind(...values).run();
    } catch (error) {
      throw new Error(`插入數據失敗: ${error.message}`);
    }
  }

  /**
   * 驗證遷移結果
   * @param {string} objectType - 對象類型
   * @returns {Promise<Object>} 驗證結果
   */
  async validateMigration(objectType) {
    const mapping = this.tableMapping[objectType];
    
    try {
      // 獲取原始數據和新數據的數量
      const [originalCount, newCount] = await Promise.all([
        this.db.prepare(`SELECT COUNT(*) as count FROM ${mapping.old}`).first(),
        this.db.prepare(`SELECT COUNT(*) as count FROM ${mapping.new}`).first()
      ]);

      // 抽樣檢查數據完整性（檢查前10條記錄）
      const sampleValidation = await this.validateSampleRecords(objectType, 10);
      
      const validation = {
        objectType,
        originalCount: originalCount.count,
        migratedCount: newCount.count,
        countMatches: originalCount.count === newCount.count,
        sampleValidation,
        timestamp: Date.now()
      };

      console.log(`${objectType} 驗證結果:`, validation);
      return validation;
      
    } catch (error) {
      console.error(`${objectType} 驗證失敗:`, error);
      throw error;
    }
  }

  /**
   * 抽樣驗證記錄
   * @private
   */
  async validateSampleRecords(objectType, sampleSize = 10) {
    const mapping = this.tableMapping[objectType];
    
    try {
      const originalRecords = await this.db.prepare(`
        SELECT * FROM ${mapping.old} LIMIT ?
      `).bind(sampleSize).all();

      const migratedRecords = await this.db.prepare(`
        SELECT * FROM ${mapping.new} LIMIT ?
      `).bind(sampleSize).all();

      const validations = [];
      
      for (let i = 0; i < Math.min(originalRecords.length, migratedRecords.length); i++) {
        const originalRecord = originalRecords[i];
        const migratedRecord = migratedRecords[i];
        
        // 基本檢查：ID 是否一致
        const idMatches = originalRecord.DataId === migratedRecord.id;
        
        validations.push({
          index: i,
          originalId: originalRecord.DataId,
          migratedId: migratedRecord.id,
          idMatches,
          hasRequiredFields: this.checkRequiredFields(objectType, migratedRecord)
        });
      }

      return {
        totalSamples: validations.length,
        validSamples: validations.filter(v => v.idMatches && v.hasRequiredFields).length,
        validations
      };
      
    } catch (error) {
      console.error(`抽樣驗證失敗 (${objectType}):`, error);
      return {
        totalSamples: 0,
        validSamples: 0,
        error: error.message
      };
    }
  }

  /**
   * 檢查必填字段
   * @private
   */
  checkRequiredFields(objectType, record) {
    const requiredFields = {
      opportunities: ['id', 'name', 'create_time', 'update_time'],
      sites: ['id', 'name', 'create_time', 'update_time'],
      sales_records: ['id', 'name', 'opportunity_id', 'create_time', 'update_time'],
      maintenance_orders: ['id', 'name', 'create_time', 'update_time']
    };

    const required = requiredFields[objectType] || [];
    return required.every(field => record[field] !== null && record[field] !== undefined);
  }

  /**
   * 獲取所有對象的遷移狀態
   * @returns {Object} 遷移狀態摘要
   */
  getAllMigrationStatus() {
    const status = {};
    
    for (const objectType of Object.keys(this.tableMapping)) {
      status[objectType] = this.getMigrationProgress(objectType);
    }
    
    return {
      timestamp: Date.now(),
      totalObjects: Object.keys(this.tableMapping).length,
      completedObjects: Object.values(status).filter(s => s.status === 'completed').length,
      status
    };
  }

  /**
   * 暫停遷移
   * @param {string} objectType - 對象類型
   */
  pauseMigration(objectType) {
    this.setMigrationProgress(objectType, { status: 'paused' });
    console.log(`${objectType} 遷移已暫停`);
  }

  /**
   * 恢復遷移
   * @param {string} objectType - 對象類型
   */
  resumeMigration(objectType) {
    const progress = this.getMigrationProgress(objectType);
    if (progress.status === 'paused') {
      this.setMigrationProgress(objectType, { status: 'running' });
      console.log(`${objectType} 遷移已恢復`);
      return true;
    }
    return false;
  }

  /**
   * 執行完整數據遷移（所有對象）
   * @param {Object} options - 遷移選項
   * @returns {Promise<Object>} 遷移結果
   */
  async migrateAllObjects(options = {}) {
    const { 
      objectOrder = ['opportunities', 'sites', 'sales_records', 'maintenance_orders'],
      skipValidation = false,
      stopOnError = false
    } = options;

    console.log('開始完整數據遷移...');
    const startTime = Date.now();
    const results = {};
    
    for (const objectType of objectOrder) {
      try {
        console.log(`開始遷移 ${objectType}...`);
        results[objectType] = await this.migrateObjectType(objectType, options);
        
        if (!skipValidation) {
          console.log(`驗證 ${objectType} 遷移結果...`);
          results[objectType].validation = await this.validateMigration(objectType);
        }
        
      } catch (error) {
        console.error(`${objectType} 遷移失敗:`, error);
        results[objectType] = {
          status: 'failed',
          error: error.message
        };
        
        if (stopOnError) {
          break;
        }
      }
    }

    const totalDuration = Date.now() - startTime;
    const summary = {
      startTime,
      endTime: Date.now(),
      duration: totalDuration,
      totalObjects: objectOrder.length,
      successfulObjects: Object.values(results).filter(r => r.status?.startsWith('completed')).length,
      failedObjects: Object.values(results).filter(r => r.status === 'failed').length,
      results
    };

    console.log('完整數據遷移完成:', summary);
    return summary;
  }
}

// 導出遷移服務類
export default DataMigrationService;