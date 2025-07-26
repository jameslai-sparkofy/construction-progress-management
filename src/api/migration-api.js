/**
 * 遷移管理 API (migration-api.js)
 * 
 * 提供完整的數據遷移管理 API 端點：
 * - 啟動/暫停/恢復遷移
 * - 進度查詢和監控
 * - 遷移狀態管理
 * - 數據驗證和回滾
 * - 批量操作和配置管理
 */

import DataMigrationService from '../services/DataMigrationService.js';
import { migrationProgress } from '../utils/MigrationProgress.js';

/**
 * 遷移管理 API 路由處理器
 * @param {Request} request - HTTP 請求
 * @param {Object} env - 環境變數
 * @param {string} path - API 路徑
 * @returns {Promise<Response>} HTTP 響應
 */
export async function handleMigrationAPI(request, env, path) {
  const db = env.DB;
  const migrationService = new DataMigrationService(db);
  const url = new URL(request.url);
  const method = request.method;

  try {
    // 解析路由
    const segments = path.split('/').filter(s => s);
    const action = segments[2]; // /api/migration/{action}
    const objectType = segments[3]; // /api/migration/{action}/{objectType}

    console.log(`遷移 API 請求: ${method} ${path}`);

    switch (method) {
      case 'GET':
        return await handleGetRequest(action, objectType, url, migrationService);
      case 'POST':
        return await handlePostRequest(action, objectType, request, migrationService);
      case 'PUT':
        return await handlePutRequest(action, objectType, request, migrationService);
      case 'DELETE':
        return await handleDeleteRequest(action, objectType, migrationService);
      default:
        return new Response(JSON.stringify({
          error: '不支援的 HTTP 方法',
          method
        }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('遷移 API 錯誤:', error);
    return new Response(JSON.stringify({
      error: '遷移 API 處理失敗',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 處理 GET 請求
 * @private
 */
async function handleGetRequest(action, objectType, url, migrationService) {
  switch (action) {
    case 'status':
      if (objectType) {
        // 獲取特定對象的遷移狀態
        const progress = migrationService.getMigrationProgress(objectType);
        const statistics = migrationProgress.getStatistics(objectType);
        
        return new Response(JSON.stringify({
          objectType,
          progress,
          statistics,
          timestamp: Date.now()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // 獲取所有對象的遷移狀態
        const allStatus = migrationService.getAllMigrationStatus();
        const allProgress = migrationProgress.getAllProgress();
        
        return new Response(JSON.stringify({
          migration: allStatus,
          progress: allProgress,
          timestamp: Date.now()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    case 'progress':
      if (objectType) {
        // 獲取特定對象的詳細進度
        const progress = migrationProgress.getProgress(objectType);
        const statistics = migrationProgress.getStatistics(objectType);
        
        if (!progress) {
          return new Response(JSON.stringify({
            error: '未找到進度數據',
            objectType
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify({
          objectType,
          progress,
          statistics,
          timestamp: Date.now()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // 獲取所有對象的進度摘要
        const allProgress = migrationProgress.getAllProgress();
        
        return new Response(JSON.stringify(allProgress), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    case 'validation':
      if (!objectType) {
        return new Response(JSON.stringify({
          error: '需要指定對象類型進行驗證'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        const validation = await migrationService.validateMigration(objectType);
        return new Response(JSON.stringify({
          objectType,
          validation,
          timestamp: Date.now()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: '驗證失敗',
          objectType,
          message: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    case 'history':
      // 獲取遷移歷史
      try {
        const history = await migrationService.db.prepare(`
          SELECT * FROM migration_history 
          ORDER BY created_at DESC 
          LIMIT 50
        `).all();

        return new Response(JSON.stringify({
          history,
          count: history.length,
          timestamp: Date.now()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: '獲取遷移歷史失敗',
          message: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    case 'config':
      // 獲取遷移配置
      const config = {
        batchConfig: migrationService.batchConfig,
        tableMapping: migrationService.tableMapping,
        availableObjects: Object.keys(migrationService.tableMapping),
        timestamp: Date.now()
      };

      return new Response(JSON.stringify(config), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    default:
      return new Response(JSON.stringify({
        error: '未知的 GET 操作',
        action,
        availableActions: ['status', 'progress', 'validation', 'history', 'config']
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

/**
 * 處理 POST 請求
 * @private
 */
async function handlePostRequest(action, objectType, request, migrationService) {
  let requestData = {};
  
  try {
    const contentType = request.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      requestData = await request.json();
    }
  } catch (error) {
    console.warn('解析請求數據失敗:', error);
  }

  switch (action) {
    case 'start':
      if (objectType) {
        // 啟動特定對象的遷移
        try {
          const options = {
            startBatch: requestData.startBatch || 0,
            skipValidation: requestData.skipValidation || false,
            dryRun: requestData.dryRun || false
          };

          // 初始化進度追蹤
          const totalRecords = await migrationService.getOriginalDataCount(objectType);
          const batchSize = migrationService.batchConfig[objectType]?.size || 100;
          
          migrationProgress.initializeProgress(objectType, totalRecords, batchSize);
          
          // 啟動遷移（非阻塞）
          migrationService.migrateObjectType(objectType, options)
            .then(result => {
              console.log(`${objectType} 遷移完成:`, result);
              migrationProgress.setStatus(objectType, result.status, result);
            })
            .catch(error => {
              console.error(`${objectType} 遷移失敗:`, error);
              migrationProgress.setStatus(objectType, 'failed', { error: error.message });
            });

          return new Response(JSON.stringify({
            message: `${objectType} 遷移已啟動`,
            objectType,
            options,
            totalRecords,
            batchSize,
            estimatedBatches: Math.ceil(totalRecords / batchSize),
            timestamp: Date.now()
          }), {
            status: 202, // Accepted
            headers: { 'Content-Type': 'application/json' }
          });

        } catch (error) {
          return new Response(JSON.stringify({
            error: '啟動遷移失敗',
            objectType,
            message: error.message
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } else {
        // 啟動所有對象的遷移
        try {
          const options = {
            objectOrder: requestData.objectOrder || ['opportunities', 'sites', 'sales_records', 'maintenance_orders'],
            skipValidation: requestData.skipValidation || false,
            stopOnError: requestData.stopOnError || false,
            dryRun: requestData.dryRun || false
          };

          // 初始化所有對象的進度追蹤
          for (const objType of options.objectOrder) {
            const totalRecords = await migrationService.getOriginalDataCount(objType);
            const batchSize = migrationService.batchConfig[objType]?.size || 100;
            migrationProgress.initializeProgress(objType, totalRecords, batchSize);
          }

          // 啟動完整遷移（非阻塞）
          migrationService.migrateAllObjects(options)
            .then(result => {
              console.log('完整遷移完成:', result);
            })
            .catch(error => {
              console.error('完整遷移失敗:', error);
            });

          return new Response(JSON.stringify({
            message: '完整數據遷移已啟動',
            options,
            objectCount: options.objectOrder.length,
            timestamp: Date.now()
          }), {
            status: 202, // Accepted
            headers: { 'Content-Type': 'application/json' }
          });

        } catch (error) {
          return new Response(JSON.stringify({
            error: '啟動完整遷移失敗',
            message: error.message
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

    case 'pause':
      if (!objectType) {
        return new Response(JSON.stringify({
          error: '需要指定對象類型進行暫停'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      migrationService.pauseMigration(objectType);
      migrationProgress.setStatus(objectType, 'paused');

      return new Response(JSON.stringify({
        message: `${objectType} 遷移已暫停`,
        objectType,
        timestamp: Date.now()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    case 'resume':
      if (!objectType) {
        return new Response(JSON.stringify({
          error: '需要指定對象類型進行恢復'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const resumed = migrationService.resumeMigration(objectType);
      if (resumed) {
        migrationProgress.setStatus(objectType, 'resumed');
        
        return new Response(JSON.stringify({
          message: `${objectType} 遷移已恢復`,
          objectType,
          timestamp: Date.now()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({
          error: `${objectType} 遷移無法恢復，當前狀態不是暫停`,
          objectType
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    case 'validate':
      if (!objectType) {
        return new Response(JSON.stringify({
          error: '需要指定對象類型進行驗證'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        const validation = await migrationService.validateMigration(objectType);
        return new Response(JSON.stringify({
          message: '驗證完成',
          objectType,
          validation,
          timestamp: Date.now()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: '驗證失敗',
          objectType,
          message: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    default:
      return new Response(JSON.stringify({
        error: '未知的 POST 操作',
        action,
        availableActions: ['start', 'pause', 'resume', 'validate']
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

/**
 * 處理 PUT 請求
 * @private
 */
async function handlePutRequest(action, objectType, request, migrationService) {
  // PUT 請求用於更新配置
  if (action === 'config') {
    try {
      const configUpdate = await request.json();
      
      // 更新批次配置
      if (configUpdate.batchConfig) {
        Object.assign(migrationService.batchConfig, configUpdate.batchConfig);
      }
      
      return new Response(JSON.stringify({
        message: '配置已更新',
        newConfig: {
          batchConfig: migrationService.batchConfig,
          tableMapping: migrationService.tableMapping
        },
        timestamp: Date.now()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        error: '更新配置失敗',
        message: error.message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } else {
    return new Response(JSON.stringify({
      error: '未知的 PUT 操作',
      action
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 處理 DELETE 請求
 * @private
 */
async function handleDeleteRequest(action, objectType, migrationService) {
  if (action === 'progress' && objectType) {
    // 重置特定對象的進度數據
    migrationProgress.resetProgress(objectType);
    
    return new Response(JSON.stringify({
      message: `${objectType} 進度數據已重置`,
      objectType,
      timestamp: Date.now()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } else if (action === 'progress' && !objectType) {
    // 重置所有進度數據
    migrationProgress.resetAllProgress();
    
    return new Response(JSON.stringify({
      message: '所有進度數據已重置',
      timestamp: Date.now()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    return new Response(JSON.stringify({
      error: '未知的 DELETE 操作',
      action
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 獲取 API 文檔
 * @returns {Response} API 文檔響應
 */
export function getMigrationAPIDocumentation() {
  const documentation = {
    title: '數據遷移 API 文檔',
    version: '2.0.0',
    baseUrl: '/api/migration',
    endpoints: {
      'GET /status': '獲取遷移狀態',
      'GET /status/{objectType}': '獲取特定對象的遷移狀態',
      'GET /progress': '獲取所有進度',
      'GET /progress/{objectType}': '獲取特定對象的進度',
      'GET /validation/{objectType}': '驗證遷移結果',
      'GET /history': '獲取遷移歷史',
      'GET /config': '獲取遷移配置',
      'POST /start': '啟動完整遷移',
      'POST /start/{objectType}': '啟動特定對象遷移',
      'POST /pause/{objectType}': '暫停遷移',
      'POST /resume/{objectType}': '恢復遷移',
      'POST /validate/{objectType}': '執行驗證',
      'PUT /config': '更新配置',
      'DELETE /progress': '重置所有進度',
      'DELETE /progress/{objectType}': '重置特定對象進度'
    },
    objectTypes: ['opportunities', 'sites', 'sales_records', 'maintenance_orders'],
    examples: {
      startMigration: {
        url: 'POST /api/migration/start/opportunities',
        body: {
          startBatch: 0,
          skipValidation: false,
          dryRun: false
        }
      },
      getProgress: {
        url: 'GET /api/migration/progress/opportunities',
        response: {
          objectType: 'opportunities',
          progress: '...',
          statistics: '...'
        }
      }
    }
  };

  return new Response(JSON.stringify(documentation, null, 2), {
    status: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export default handleMigrationAPI;