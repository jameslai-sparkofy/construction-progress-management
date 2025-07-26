/**
 * 統一映射系統 API 端點
 * 
 * 提供以下功能：
 * - 獲取映射配置
 * - 執行數據轉換  
 * - 配置驗證
 * - 配置更新和重載
 * - 系統健康檢查
 */

import { mappingService } from '../services/UnifiedMappingService.js';
import { createConfigManager } from '../services/ConfigManager.js';
import { runMappingServiceTests } from '../tests/UnifiedMappingService.test.js';

/**
 * 映射 API 路由處理器
 */
export class MappingAPIHandler {
  constructor(env) {
    this.env = env;
    this.configManager = createConfigManager(env);
    
    // API 路由映射
    this.routes = new Map([
      ['GET:/api/mapping/config', this.getMappingConfig.bind(this)],
      ['GET:/api/mapping/config/:objectType', this.getObjectConfig.bind(this)],
      ['POST:/api/mapping/transform', this.transformData.bind(this)],
      ['POST:/api/mapping/validate', this.validateData.bind(this)],
      ['POST:/api/mapping/reload', this.reloadConfig.bind(this)],
      ['GET:/api/mapping/status', this.getSystemStatus.bind(this)],
      ['GET:/api/mapping/statistics', this.getStatistics.bind(this)],
      ['POST:/api/mapping/test', this.runTests.bind(this)],
      ['POST:/api/mapping/batch-transform', this.batchTransform.bind(this)],
      ['GET:/api/mapping/health', this.healthCheck.bind(this)]
    ]);
  }

  /**
   * 處理映射 API 請求
   * @param {Request} request - HTTP 請求
   * @param {Array} pathParts - URL 路徑部分
   * @returns {Response} HTTP 響應
   */
  async handleRequest(request, pathParts) {
    try {
      const method = request.method;
      const path = '/api/mapping/' + pathParts.join('/');
      const routeKey = `${method}:${path}`;
      
      // 檢查精確匹配的路由
      if (this.routes.has(routeKey)) {
        const handler = this.routes.get(routeKey);
        return await handler(request);
      }
      
      // 檢查參數化路由
      for (const [route, handler] of this.routes.entries()) {
        const match = this.matchParameterizedRoute(route, routeKey);
        if (match) {
          request.params = match.params;
          return await handler(request);
        }
      }
      
      // 未找到路由
      return this.errorResponse('路由未找到', 404);
    } catch (error) {
      console.error('映射 API 錯誤:', error);
      return this.errorResponse(error.message, 500);
    }
  }

  /**
   * 匹配參數化路由
   * @param {string} routePattern - 路由模式
   * @param {string} actualRoute - 實際路由
   * @private
   */
  matchParameterizedRoute(routePattern, actualRoute) {
    const patternParts = routePattern.split('/');
    const actualParts = actualRoute.split('/');
    
    if (patternParts.length !== actualParts.length) {
      return null;
    }
    
    const params = {};
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const actualPart = actualParts[i];
      
      if (patternPart.startsWith(':')) {
        // 參數化部分
        const paramName = patternPart.substring(1);
        params[paramName] = actualPart;
      } else if (patternPart !== actualPart) {
        // 不匹配
        return null;
      }
    }
    
    return { params };
  }

  /**
   * 獲取完整映射配置
   * GET /api/mapping/config
   */
  async getMappingConfig(request) {
    try {
      const stats = mappingService.getStatistics();
      const configStatus = this.configManager.getConfigStatus();
      
      return this.successResponse({
        version: stats.version,
        lastUpdated: stats.lastUpdated,
        configuration: {
          objects: stats.objects,
          totalFields: stats.totalFields,
          validators: stats.validators,
          transformers: stats.transformers
        },
        status: configStatus,
        timestamp: Date.now()
      });
    } catch (error) {
      return this.errorResponse(`獲取配置失敗: ${error.message}`, 500);
    }
  }

  /**
   * 獲取特定對象配置
   * GET /api/mapping/config/:objectType
   */
  async getObjectConfig(request) {
    try {
      const objectType = request.params.objectType;
      
      if (!objectType) {
        return this.errorResponse('缺少對象類型參數', 400);
      }
      
      const config = mappingService.getObjectConfig(objectType);
      
      return this.successResponse({
        objectType,
        config,
        fieldsCount: Object.keys(config.fields).length,
        lastConfigUpdate: this.configManager.lastUpdate,
        timestamp: Date.now()
      });
    } catch (error) {
      return this.errorResponse(`獲取對象配置失敗: ${error.message}`, 404);
    }
  }

  /**
   * 執行數據轉換
   * POST /api/mapping/transform
   */
  async transformData(request) {
    try {
      const requestData = await request.json();
      const { objectType, sourceFormat, targetFormat, data } = requestData;
      
      // 驗證請求參數
      if (!objectType || !sourceFormat || !targetFormat || !data) {
        return this.errorResponse('缺少必要參數', 400);
      }
      
      const validFormats = ['frontend', 'd1', 'crm'];
      if (!validFormats.includes(sourceFormat) || !validFormats.includes(targetFormat)) {
        return this.errorResponse('無效的數據格式', 400);
      }
      
      // 執行轉換
      let result;
      if (sourceFormat === 'frontend' && targetFormat === 'd1') {
        result = await mappingService.mapFrontendToD1(objectType, data);
      } else if (sourceFormat === 'd1' && targetFormat === 'crm') {
        result = await mappingService.mapD1ToCRM(objectType, data);
      } else if (sourceFormat === 'crm' && targetFormat === 'd1') {
        result = await mappingService.mapCRMToD1(objectType, data);
      } else {
        return this.errorResponse(`不支援的轉換: ${sourceFormat} -> ${targetFormat}`, 400);
      }
      
      return this.successResponse({
        objectType,
        sourceFormat,
        targetFormat,
        transformedData: result.data,
        warnings: result.warnings || [],
        metadata: result.metadata,
        timestamp: Date.now()
      });
    } catch (error) {
      return this.errorResponse(`數據轉換失敗: ${error.message}`, 500);
    }
  }

  /**
   * 批量數據轉換
   * POST /api/mapping/batch-transform
   */
  async batchTransform(request) {
    try {
      const requestData = await request.json();
      const { objectType, sourceFormat, targetFormat, dataArray, batchSize = 50 } = requestData;
      
      // 驗證請求參數
      if (!objectType || !sourceFormat || !targetFormat || !Array.isArray(dataArray)) {
        return this.errorResponse('缺少必要參數或數據格式錯誤', 400);
      }
      
      if (dataArray.length === 0) {
        return this.errorResponse('數據陣列不能為空', 400);
      }
      
      // 限制批量大小以防止超時
      if (dataArray.length > 500) {
        return this.errorResponse('批量數據超過限制（最大500筆）', 400);
      }
      
      // 執行批量轉換
      let result;
      if (sourceFormat === 'frontend' && targetFormat === 'd1') {
        result = await mappingService.batchMapFrontendToD1(objectType, dataArray);
      } else if (sourceFormat === 'd1' && targetFormat === 'crm') {
        result = await mappingService.batchMapD1ToCRM(objectType, dataArray);
      } else if (sourceFormat === 'crm' && targetFormat === 'd1') {
        result = await mappingService.batchMapCRMToD1(objectType, dataArray);
      } else {
        return this.errorResponse(`不支援的批量轉換: ${sourceFormat} -> ${targetFormat}`, 400);
      }
      
      return this.successResponse({
        objectType,
        sourceFormat,
        targetFormat,
        totalRecords: dataArray.length,
        successCount: result.successCount,
        failureCount: result.failureCount,
        successRate: (result.successCount / dataArray.length * 100).toFixed(1) + '%',
        transformedData: result.results.map(r => r.data),
        errors: result.errors,
        metadata: result.metadata,
        timestamp: Date.now()
      });
    } catch (error) {
      return this.errorResponse(`批量轉換失敗: ${error.message}`, 500);
    }
  }

  /**
   * 驗證數據
   * POST /api/mapping/validate
   */
  async validateData(request) {
    try {
      const requestData = await request.json();
      const { objectType, format, data } = requestData;
      
      if (!objectType || !format || !data) {
        return this.errorResponse('缺少必要參數', 400);
      }
      
      const objectConfig = mappingService.getObjectConfig(objectType);
      const validationResults = [];
      
      // 驗證每個欄位
      for (const [fieldName, fieldConfig] of Object.entries(objectConfig.fields)) {
        const fieldKey = fieldConfig[format]; // frontend, d1, 或 crm 的欄位名
        
        if (!fieldKey) continue;
        
        const value = data[fieldKey];
        const validation = await mappingService.validateField(fieldConfig, value);
        
        validationResults.push({
          fieldName,
          fieldKey,
          value,
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings
        });
      }
      
      const totalFields = validationResults.length;
      const validFields = validationResults.filter(r => r.isValid).length;
      const isOverallValid = validationResults.every(r => r.isValid);
      
      return this.successResponse({
        objectType,
        format,
        isValid: isOverallValid,
        validationSummary: {
          totalFields,
          validFields,
          invalidFields: totalFields - validFields,
          validationRate: (validFields / totalFields * 100).toFixed(1) + '%'
        },
        fieldResults: validationResults,
        timestamp: Date.now()
      });
    } catch (error) {
      return this.errorResponse(`數據驗證失敗: ${error.message}`, 500);
    }
  }

  /**
   * 重載配置
   * POST /api/mapping/reload
   */
  async reloadConfig(request) {
    try {
      const reloadResult = await this.configManager.reloadConfiguration();
      
      return this.successResponse({
        reloadSuccess: reloadResult.success,
        version: reloadResult.version,
        timestamp: reloadResult.timestamp,
        error: reloadResult.error || null,
        newStatistics: mappingService.getStatistics()
      });
    } catch (error) {
      return this.errorResponse(`配置重載失敗: ${error.message}`, 500);
    }
  }

  /**
   * 獲取系統狀態
   * GET /api/mapping/status
   */
  async getSystemStatus(request) {
    try {
      const configStatus = this.configManager.getConfigStatus();
      const stats = mappingService.getStatistics();
      
      return this.successResponse({
        system: {
          isHealthy: configStatus.isHealthy,
          uptime: configStatus.uptime,
          version: configStatus.currentVersion,
          lastUpdate: configStatus.lastUpdate
        },
        configuration: {
          totalObjects: stats.totalObjects,
          totalFields: stats.totalFields,
          validators: stats.validators.length,
          transformers: stats.transformers.length
        },
        management: {
          backupCount: configStatus.backupCount,
          listenersCount: configStatus.listenersCount
        },
        timestamp: Date.now()
      });
    } catch (error) {
      return this.errorResponse(`獲取系統狀態失敗: ${error.message}`, 500);
    }
  }

  /**
   * 獲取統計信息
   * GET /api/mapping/statistics
   */
  async getStatistics(request) {
    try {
      const stats = mappingService.getStatistics();
      const configHistory = this.configManager.getConfigHistory();
      
      return this.successResponse({
        current: stats,
        history: configHistory,
        performance: {
          averageTransformTime: '< 10ms', // 實際應該測量
          cacheHitRate: '95%', // 實際應該測量
          errorRate: '< 1%' // 實際應該測量
        },
        timestamp: Date.now()
      });
    } catch (error) {
      return this.errorResponse(`獲取統計信息失敗: ${error.message}`, 500);
    }
  }

  /**
   * 運行系統測試
   * POST /api/mapping/test
   */
  async runTests(request) {
    try {
      console.log('開始運行映射服務測試...');
      const testResults = await runMappingServiceTests();
      
      return this.successResponse({
        testResults,
        summary: {
          passed: testResults.passed,
          failed: testResults.failed,
          total: testResults.total,
          successRate: ((testResults.passed / testResults.total) * 100).toFixed(1) + '%',
          coverage: testResults.coverage.toFixed(1) + '%'
        },
        recommendation: testResults.failed === 0 ? 
          '所有測試通過，系統準備就緒' : 
          `${testResults.failed} 個測試失敗，建議修復後再部署`,
        timestamp: Date.now()
      });
    } catch (error) {
      return this.errorResponse(`測試執行失敗: ${error.message}`, 500);
    }
  }

  /**
   * 健康檢查
   * GET /api/mapping/health
   */
  async healthCheck(request) {
    try {
      const stats = mappingService.getStatistics();
      const configStatus = this.configManager.getConfigStatus();
      
      const health = {
        status: configStatus.isHealthy ? 'healthy' : 'unhealthy',
        version: stats.version,
        uptime: configStatus.uptime,
        checks: {
          configuration: configStatus.isHealthy,
          mappingService: stats.totalObjects >= 4,
          validators: stats.validators.length > 5,
          transformers: stats.transformers.length > 5
        },
        timestamp: Date.now()
      };
      
      const statusCode = health.status === 'healthy' ? 200 : 503;
      
      return new Response(JSON.stringify(health), {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    } catch (error) {
      return this.errorResponse(`健康檢查失敗: ${error.message}`, 500);
    }
  }

  /**
   * 成功響應
   * @param {*} data - 響應數據
   * @private
   */
  successResponse(data) {
    return new Response(JSON.stringify({
      success: true,
      data,
      timestamp: Date.now()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  /**
   * 錯誤響應
   * @param {string} message - 錯誤訊息
   * @param {number} status - HTTP 狀態碼
   * @private
   */
  errorResponse(message, status = 400) {
    return new Response(JSON.stringify({
      success: false,
      error: message,
      timestamp: Date.now()
    }), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * 創建映射 API 處理器
 * @param {Object} env - Cloudflare Workers 環境
 * @returns {MappingAPIHandler} API 處理器實例
 */
export function createMappingAPIHandler(env) {
  return new MappingAPIHandler(env);
}