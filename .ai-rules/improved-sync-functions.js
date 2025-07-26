/**
 * 改进的同步函数
 * 使用统一的字段映射服务进行数据同步
 */

import { FieldMappingService } from './field-mapping-service.js';

/**
 * 改进的案场同步函数
 * @param {Object} env - Cloudflare 环境对象
 * @param {string} logId - 日志ID
 * @returns {Object} 同步结果
 */
export async function syncSitesToDBImproved(env, logId = null) {
  console.log('🏗️ 开始改进的案场同步到 D1...');
  
  const mappingService = new FieldMappingService(env);
  const syncStats = {
    totalCount: 0,
    syncedCount: 0,
    failedCount: 0,
    skippedCount: 0,
    errors: []
  };

  try {
    // 1. 获取 CRM Token
    const tokenResult = await getFxiaokeToken();
    if (!tokenResult.success) {
      throw new Error(`获取 Token 失败: ${tokenResult.error}`);
    }

    const { token, corpId, userId } = tokenResult;

    // 2. 分批获取案场数据
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      console.log(`📥 获取案场数据 offset=${offset}, limit=${limit}`);
      
      const batchData = await fetchSitesBatch(token, corpId, userId, offset, limit);
      
      if (!batchData || !batchData.dataList || batchData.dataList.length === 0) {
        hasMore = false;
        break;
      }

      const sitesData = batchData.dataList;
      syncStats.totalCount += sitesData.length;

      // 3. 处理每个案场记录
      const batchResults = await processSitesBatch(sitesData, mappingService, env);
      
      syncStats.syncedCount += batchResults.syncedCount;
      syncStats.failedCount += batchResults.failedCount;
      syncStats.skippedCount += batchResults.skippedCount;
      syncStats.errors.push(...batchResults.errors);

      // 4. 更新偏移量
      offset += limit;
      
      // 防止无限循环
      if (sitesData.length < limit) {
        hasMore = false;
      }

      // 添加延迟避免 API 限制
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 5. 更新同步状态
    await updateSyncStatus(env, 'sites', {
      totalCount: syncStats.totalCount,
      syncedCount: syncStats.syncedCount,
      failedCount: syncStats.failedCount,
      status: syncStats.failedCount > 0 ? 'partial_success' : 'completed',
      errors: syncStats.errors
    });

    console.log('✅ 改进的案场同步完成:', syncStats);
    return syncStats;

  } catch (error) {
    console.error('❌ 案场同步失败:', error);
    
    await updateSyncStatus(env, 'sites', {
      status: 'failed',
      error: error.message
    });
    
    throw error;
  }
}

/**
 * 处理案场数据批次
 * @param {Array} sitesData - 案场数据数组
 * @param {FieldMappingService} mappingService - 映射服务
 * @param {Object} env - 环境对象
 * @returns {Object} 批次处理结果
 */
async function processSitesBatch(sitesData, mappingService, env) {
  const results = {
    syncedCount: 0,
    failedCount: 0,
    skippedCount: 0,
    errors: []
  };

  // 准备数据库事务
  const statements = [];
  const progressStatements = [];

  for (const siteData of sitesData) {
    try {
      // 1. 转换基本案场数据
      const { data: siteD1Data, transformationLog: siteLog } = await mappingService.transformCrmToD1(
        'sites', 
        siteData, 
        'sites'
      );

      // 2. 验证数据
      const siteValidation = mappingService.validateFieldData('sites', siteD1Data);
      if (!siteValidation.isValid) {
        console.warn(`案场数据验证失败 ${siteData._id}:`, siteValidation.errors);
        results.errors.push({
          recordId: siteData._id,
          type: 'validation',
          errors: siteValidation.errors
        });
        results.failedCount++;
        continue;
      }

      // 3. 准备案场基本信息 SQL
      const siteInsertSQL = generateSiteInsertSQL(siteD1Data);
      statements.push(siteInsertSQL);

      // 4. 转换施工进度数据（如果存在）
      if (needsProgressRecord(siteData)) {
        const { data: progressD1Data, transformationLog: progressLog } = await mappingService.transformCrmToD1(
          'sites', 
          siteData, 
          'site_progress'
        );

        // 补充进度记录必需字段
        progressD1Data.id = generateProgressId(siteData);
        progressD1Data.site_id = siteData._id;
        progressD1Data.project_id = siteData.field_1P96q__c || 'unknown';
        progressD1Data.building_name = siteData.field_WD7k1__c || 'unknown';
        progressD1Data.floor_number = siteData.field_Q6Svh__c || 1;
        progressD1Data.unit_name = siteData.field_XuJP2__c || 'unknown';
        progressD1Data.construction_item = '施工项目';

        const progressValidation = mappingService.validateFieldData('site_progress', progressD1Data);
        if (progressValidation.isValid) {
          const progressInsertSQL = generateProgressInsertSQL(progressD1Data);
          progressStatements.push(progressInsertSQL);
        }

        // 记录转换日志
        await mappingService.logFieldMapping('sites_progress', siteData._id, progressLog);
      }

      // 5. 记录转换日志
      await mappingService.logFieldMapping('sites', siteData._id, siteLog);

      results.syncedCount++;

    } catch (error) {
      console.error(`处理案场记录失败 ${siteData._id}:`, error);
      results.errors.push({
        recordId: siteData._id,
        type: 'processing',
        error: error.message
      });
      results.failedCount++;
    }
  }

  try {
    // 执行数据库事务
    if (statements.length > 0) {
      await env.DB.batch(statements);
      console.log(`✅ 案场基本信息批量插入成功: ${statements.length} 条`);
    }

    if (progressStatements.length > 0) {
      await env.DB.batch(progressStatements);
      console.log(`✅ 施工进度批量插入成功: ${progressStatements.length} 条`);
    }

  } catch (dbError) {
    console.error('❌ 数据库批量操作失败:', dbError);
    // 将所有记录标记为失败
    results.failedCount += results.syncedCount;
    results.syncedCount = 0;
    results.errors.push({
      type: 'database',
      error: dbError.message
    });
  }

  return results;
}

/**
 * 生成案场插入 SQL
 * @param {Object} siteData - 案场数据
 * @returns {Object} 预处理的 SQL 语句
 */
function generateSiteInsertSQL(siteData) {
  const fields = Object.keys(siteData);
  const placeholders = fields.map(() => '?').join(', ');
  const values = fields.map(field => siteData[field]);

  return {
    sql: `INSERT OR REPLACE INTO sites (${fields.join(', ')}) VALUES (${placeholders})`,
    values: values
  };
}

/**
 * 生成进度插入 SQL
 * @param {Object} progressData - 进度数据
 * @returns {Object} 预处理的 SQL 语句
 */
function generateProgressInsertSQL(progressData) {
  const fields = Object.keys(progressData);
  const placeholders = fields.map(() => '?').join(', ');
  const values = fields.map(field => progressData[field]);

  return {
    sql: `INSERT OR REPLACE INTO site_progress (${fields.join(', ')}) VALUES (${placeholders})`,
    values: values
  };
}

/**
 * 判断是否需要创建进度记录
 * @param {Object} siteData - 案场数据
 * @returns {boolean} 是否需要创建进度记录
 */
function needsProgressRecord(siteData) {
  // 如果有施工相关信息，则创建进度记录
  return siteData.field_23pFq__c ||  // 施工日期
         siteData.field_u1wpv__c ||  // 工班师父
         siteData.construction_completed__c ||  // 施工完成状态
         siteData.field_B2gh1__c;    // 铺设坪数
}

/**
 * 生成进度记录 ID
 * @param {Object} siteData - 案场数据
 * @returns {string} 进度记录 ID
 */
function generateProgressId(siteData) {
  const siteId = siteData._id;
  const building = siteData.field_WD7k1__c || 'unknown';
  const floor = siteData.field_Q6Svh__c || '1';
  const unit = siteData.field_XuJP2__c || 'unknown';
  
  return `${siteId}-${building}-${floor}-${unit}`;
}

/**
 * 更新同步状态
 * @param {Object} env - 环境对象
 * @param {string} syncType - 同步类型
 * @param {Object} status - 状态信息
 */
async function updateSyncStatus(env, syncType, status) {
  try {
    await env.DB.prepare(`
      INSERT OR REPLACE INTO sync_status (
        sync_type, last_sync_time, last_sync_count, total_records, 
        failed_records, status, message, error_details, next_sync_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      syncType,
      Date.now(),
      status.syncedCount || 0,
      status.totalCount || 0,
      status.failedCount || 0,
      status.status || 'completed',
      status.message || '同步完成',
      JSON.stringify(status.errors || []),
      Date.now() + (60 * 60 * 1000) // 下次同步时间：1小时后
    ).run();

  } catch (error) {
    console.error('更新同步状态失败:', error);
  }
}

/**
 * 改进的商机同步函数
 * @param {Object} env - 环境对象
 * @param {string} logId - 日志ID
 * @returns {Object} 同步结果
 */
export async function syncOpportunitiesToDBImproved(env, logId = null) {
  console.log('💼 开始改进的商机同步到 D1...');
  
  const mappingService = new FieldMappingService(env);
  const syncStats = {
    totalCount: 0,
    syncedCount: 0,
    failedCount: 0,
    errors: []
  };

  try {
    const tokenResult = await getFxiaokeToken();
    if (!tokenResult.success) {
      throw new Error(`获取 Token 失败: ${tokenResult.error}`);
    }

    const { token, corpId, userId } = tokenResult;

    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const batchData = await fetchOpportunitiesBatch(token, corpId, userId, offset, limit);
      
      if (!batchData || !batchData.dataList || batchData.dataList.length === 0) {
        hasMore = false;
        break;
      }

      const opportunitiesData = batchData.dataList;
      syncStats.totalCount += opportunitiesData.length;

      // 批量处理商机数据
      const statements = [];
      
      for (const oppData of opportunitiesData) {
        try {
          const { data: d1Data, transformationLog } = await mappingService.transformCrmToD1(
            'opportunities', 
            oppData
          );

          const validation = mappingService.validateFieldData('opportunities', d1Data);
          if (!validation.isValid) {
            console.warn(`商机数据验证失败 ${oppData._id}:`, validation.errors);
            syncStats.failedCount++;
            continue;
          }

          statements.push(env.DB.prepare(`
            INSERT OR REPLACE INTO opportunities (
              id, name, customer, amount, stage, create_time, update_time, synced_at, raw_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            d1Data.id,
            d1Data.name,
            d1Data.customer,
            d1Data.amount || 0,
            d1Data.stage,
            d1Data.create_time,
            d1Data.update_time,
            d1Data.synced_at,
            d1Data.raw_data
          ));

          await mappingService.logFieldMapping('opportunities', oppData._id, transformationLog);
          syncStats.syncedCount++;

        } catch (error) {
          console.error(`处理商机记录失败 ${oppData._id}:`, error);
          syncStats.failedCount++;
          syncStats.errors.push({
            recordId: oppData._id,
            error: error.message
          });
        }
      }

      // 执行批量插入
      if (statements.length > 0) {
        await env.DB.batch(statements);
      }

      offset += limit;
      if (opportunitiesData.length < limit) {
        hasMore = false;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await updateSyncStatus(env, 'opportunities', {
      totalCount: syncStats.totalCount,
      syncedCount: syncStats.syncedCount,
      failedCount: syncStats.failedCount,
      status: syncStats.failedCount > 0 ? 'partial_success' : 'completed',
      errors: syncStats.errors
    });

    console.log('✅ 改进的商机同步完成:', syncStats);
    return syncStats;

  } catch (error) {
    console.error('❌ 商机同步失败:', error);
    await updateSyncStatus(env, 'opportunities', {
      status: 'failed',
      error: error.message
    });
    throw error;
  }
}

// 辅助函数（这些函数需要从现有代码中导入或重新实现）
// 为了完整性，这里提供函数签名

async function getFxiaokeToken() {
  // 从现有代码中导入
  throw new Error('需要实现 getFxiaokeToken 函数');
}

async function fetchSitesBatch(token, corpId, userId, offset, limit) {
  // 从现有代码中导入
  throw new Error('需要实现 fetchSitesBatch 函数');
}

async function fetchOpportunitiesBatch(token, corpId, userId, offset, limit) {
  // 从现有代码中导入
  throw new Error('需要实现 fetchOpportunitiesBatch 函数');
}