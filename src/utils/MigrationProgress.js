/**
 * 遷移進度追蹤工具 (MigrationProgress)
 * 
 * 功能：
 * - 實時進度監控
 * - 進度估算和剩餘時間計算
 * - 性能統計
 * - 錯誤率分析
 * - 可視化進度數據
 */

export class MigrationProgress {
  constructor() {
    this.progressData = new Map();
    this.performanceMetrics = new Map();
    this.listeners = new Map(); // 進度監聽器
  }

  /**
   * 初始化對象進度追蹤
   * @param {string} objectType - 對象類型
   * @param {number} totalRecords - 總記錄數
   * @param {number} batchSize - 批次大小
   */
  initializeProgress(objectType, totalRecords, batchSize) {
    const progress = {
      objectType,
      totalRecords,
      batchSize,
      totalBatches: Math.ceil(totalRecords / batchSize),
      currentBatch: 0,
      processedRecords: 0,
      successCount: 0,
      failureCount: 0,
      
      // 時間統計
      startTime: Date.now(),
      lastBatchTime: Date.now(),
      endTime: null,
      
      // 性能統計
      recordsPerSecond: 0,
      averageBatchTime: 0,
      estimatedTimeRemaining: 0,
      
      // 錯誤統計
      errorRate: 0,
      recentErrors: [],
      
      // 狀態
      status: 'initializing',
      
      // 階段性統計
      phaseStats: []
    };

    this.progressData.set(objectType, progress);
    this.initializePerformanceMetrics(objectType);
    this.notifyListeners(objectType, 'initialized', progress);
    
    return progress;
  }

  /**
   * 初始化性能指標
   * @private
   */
  initializePerformanceMetrics(objectType) {
    this.performanceMetrics.set(objectType, {
      batchTimes: [],
      recordsPerBatch: [],
      errorCounts: [],
      memoryUsage: [],
      averageProcessingTime: 0,
      peakRecordsPerSecond: 0,
      totalProcessingTime: 0
    });
  }

  /**
   * 更新批次進度
   * @param {string} objectType - 對象類型
   * @param {Object} batchResult - 批次處理結果
   */
  updateBatchProgress(objectType, batchResult) {
    const progress = this.progressData.get(objectType);
    if (!progress) {
      throw new Error(`未找到 ${objectType} 的進度追蹤數據`);
    }

    const currentTime = Date.now();
    const batchTime = currentTime - progress.lastBatchTime;
    
    // 更新基本進度
    progress.currentBatch = batchResult.batchIndex + 1;
    progress.processedRecords += batchResult.processedCount;
    progress.successCount += batchResult.successCount;
    progress.failureCount += batchResult.failureCount;
    progress.lastBatchTime = currentTime;
    
    // 更新錯誤信息
    if (batchResult.errors && batchResult.errors.length > 0) {
      progress.recentErrors.push(...batchResult.errors.slice(-5)); // 只保留最近 5 個錯誤
      if (progress.recentErrors.length > 20) {
        progress.recentErrors = progress.recentErrors.slice(-20); // 總共保留 20 個錯誤
      }
    }
    
    // 計算統計數據
    this.calculateStatistics(objectType, batchTime, batchResult);
    
    // 更新狀態
    if (progress.currentBatch >= progress.totalBatches) {
      progress.status = 'completed';
      progress.endTime = currentTime;
    } else {
      progress.status = 'running';
    }
    
    // 通知監聽器
    this.notifyListeners(objectType, 'batch_completed', {
      progress,
      batchResult,
      statistics: this.getStatistics(objectType)
    });
    
    return progress;
  }

  /**
   * 計算統計數據
   * @private
   */
  calculateStatistics(objectType, batchTime, batchResult) {
    const progress = this.progressData.get(objectType);
    const metrics = this.performanceMetrics.get(objectType);
    
    // 記錄批次時間和處理量
    metrics.batchTimes.push(batchTime);
    metrics.recordsPerBatch.push(batchResult.processedCount);
    metrics.errorCounts.push(batchResult.failureCount);
    
    // 計算平均批次時間
    progress.averageBatchTime = metrics.batchTimes.reduce((sum, time) => sum + time, 0) / metrics.batchTimes.length;
    
    // 計算處理速度（記錄/秒）
    if (batchTime > 0) {
      const currentRecordsPerSecond = (batchResult.processedCount / batchTime) * 1000;
      progress.recordsPerSecond = currentRecordsPerSecond;
      
      // 更新峰值處理速度
      if (currentRecordsPerSecond > metrics.peakRecordsPerSecond) {
        metrics.peakRecordsPerSecond = currentRecordsPerSecond;
      }
    }
    
    // 計算錯誤率
    if (progress.processedRecords > 0) {
      progress.errorRate = (progress.failureCount / progress.processedRecords) * 100;
    }
    
    // 估算剩餘時間
    const remainingBatches = progress.totalBatches - progress.currentBatch;
    if (progress.averageBatchTime > 0 && remainingBatches > 0) {
      progress.estimatedTimeRemaining = remainingBatches * progress.averageBatchTime;
    } else {
      progress.estimatedTimeRemaining = 0;
    }
    
    // 計算總處理時間
    metrics.totalProcessingTime = Date.now() - progress.startTime;
    
    // 計算平均處理時間
    if (progress.processedRecords > 0) {
      metrics.averageProcessingTime = metrics.totalProcessingTime / progress.processedRecords;
    }
  }

  /**
   * 設置進度狀態
   * @param {string} objectType - 對象類型
   * @param {string} status - 狀態
   * @param {Object} additionalData - 額外數據
   */
  setStatus(objectType, status, additionalData = {}) {
    const progress = this.progressData.get(objectType);
    if (!progress) {
      throw new Error(`未找到 ${objectType} 的進度追蹤數據`);
    }

    const previousStatus = progress.status;
    progress.status = status;
    
    // 處理狀態特定邏輯
    switch (status) {
      case 'paused':
        progress.pauseTime = Date.now();
        break;
      case 'resumed':
        if (progress.pauseTime) {
          const pauseDuration = Date.now() - progress.pauseTime;
          progress.totalPauseTime = (progress.totalPauseTime || 0) + pauseDuration;
          delete progress.pauseTime;
        }
        progress.status = 'running';
        break;
      case 'failed':
        progress.endTime = Date.now();
        progress.failureReason = additionalData.error;
        break;
      case 'completed':
        progress.endTime = Date.now();
        this.finalizeStatistics(objectType);
        break;
    }

    // 合併額外數據
    Object.assign(progress, additionalData);

    // 通知監聽器
    this.notifyListeners(objectType, 'status_changed', {
      objectType,
      previousStatus,
      currentStatus: status,
      progress
    });

    return progress;
  }

  /**
   * 完成統計計算
   * @private
   */
  finalizeStatistics(objectType) {
    const progress = this.progressData.get(objectType);
    const metrics = this.performanceMetrics.get(objectType);
    
    if (!progress.endTime) {
      progress.endTime = Date.now();
    }

    // 計算總體統計
    const totalDuration = progress.endTime - progress.startTime - (progress.totalPauseTime || 0);
    const effectiveDuration = totalDuration > 0 ? totalDuration : 1;
    
    progress.totalDuration = totalDuration;
    progress.effectiveProcessingTime = effectiveDuration;
    progress.overallRecordsPerSecond = (progress.processedRecords / effectiveDuration) * 1000;
    progress.successRate = progress.processedRecords > 0 ? 
      ((progress.successCount / progress.processedRecords) * 100) : 0;
      
    // 創建最終階段統計
    progress.phaseStats.push({
      phase: 'completion',
      timestamp: progress.endTime,
      recordsProcessed: progress.processedRecords,
      duration: totalDuration,
      recordsPerSecond: progress.overallRecordsPerSecond,
      errorRate: progress.errorRate
    });
  }

  /**
   * 獲取進度信息
   * @param {string} objectType - 對象類型
   * @returns {Object} 進度信息
   */
  getProgress(objectType) {
    const progress = this.progressData.get(objectType);
    if (!progress) {
      return null;
    }

    // 計算進度百分比
    const percentComplete = progress.totalRecords > 0 ? 
      Math.round((progress.processedRecords / progress.totalRecords) * 100) : 0;

    return {
      ...progress,
      percentComplete,
      isActive: ['initializing', 'running'].includes(progress.status),
      isCompleted: progress.status === 'completed',
      isFailed: progress.status === 'failed',
      isPaused: progress.status === 'paused'
    };
  }

  /**
   * 獲取統計信息
   * @param {string} objectType - 對象類型
   * @returns {Object} 統計信息
   */
  getStatistics(objectType) {
    const progress = this.progressData.get(objectType);
    const metrics = this.performanceMetrics.get(objectType);
    
    if (!progress || !metrics) {
      return null;
    }

    return {
      objectType,
      
      // 基本統計
      totalRecords: progress.totalRecords,
      processedRecords: progress.processedRecords,
      successCount: progress.successCount,
      failureCount: progress.failureCount,
      successRate: progress.successRate,
      errorRate: progress.errorRate,
      
      // 時間統計
      totalDuration: progress.totalDuration,
      effectiveProcessingTime: progress.effectiveProcessingTime,
      averageBatchTime: progress.averageBatchTime,
      estimatedTimeRemaining: progress.estimatedTimeRemaining,
      
      // 性能統計
      recordsPerSecond: progress.recordsPerSecond,
      overallRecordsPerSecond: progress.overallRecordsPerSecond,
      peakRecordsPerSecond: metrics.peakRecordsPerSecond,
      averageProcessingTime: metrics.averageProcessingTime,
      
      // 批次統計
      totalBatches: progress.totalBatches,
      currentBatch: progress.currentBatch,
      batchSize: progress.batchSize,
      
      // 狀態
      status: progress.status,
      percentComplete: Math.round((progress.processedRecords / progress.totalRecords) * 100),
      
      // 錯誤統計
      recentErrorCount: progress.recentErrors.length,
      recentErrors: progress.recentErrors.slice(-5) // 最近 5 個錯誤
    };
  }

  /**
   * 獲取所有對象的進度摘要
   * @returns {Object} 進度摘要
   */
  getAllProgress() {
    const summary = {
      timestamp: Date.now(),
      totalObjects: this.progressData.size,
      completedObjects: 0,
      runningObjects: 0,
      failedObjects: 0,
      pausedObjects: 0,
      objects: {}
    };

    for (const [objectType, progress] of this.progressData.entries()) {
      const progressInfo = this.getProgress(objectType);
      summary.objects[objectType] = progressInfo;
      
      // 統計狀態
      switch (progress.status) {
        case 'completed':
          summary.completedObjects++;
          break;
        case 'running':
        case 'initializing':
          summary.runningObjects++;
          break;
        case 'failed':
          summary.failedObjects++;
          break;
        case 'paused':
          summary.pausedObjects++;
          break;
      }
    }

    // 計算總體進度
    const allProgress = Object.values(summary.objects);
    if (allProgress.length > 0) {
      summary.overallProgress = Math.round(
        allProgress.reduce((sum, p) => sum + p.percentComplete, 0) / allProgress.length
      );
      summary.totalRecords = allProgress.reduce((sum, p) => sum + p.totalRecords, 0);
      summary.processedRecords = allProgress.reduce((sum, p) => sum + p.processedRecords, 0);
      summary.totalErrors = allProgress.reduce((sum, p) => sum + p.failureCount, 0);
    }

    return summary;
  }

  /**
   * 添加進度監聽器
   * @param {string} objectType - 對象類型
   * @param {Function} callback - 回調函數
   * @returns {string} 監聽器 ID
   */
  addListener(objectType, callback) {
    if (!this.listeners.has(objectType)) {
      this.listeners.set(objectType, new Map());
    }
    
    const listenerId = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.listeners.get(objectType).set(listenerId, callback);
    
    return listenerId;
  }

  /**
   * 移除進度監聽器
   * @param {string} objectType - 對象類型
   * @param {string} listenerId - 監聽器 ID
   */
  removeListener(objectType, listenerId) {
    const objectListeners = this.listeners.get(objectType);
    if (objectListeners) {
      objectListeners.delete(listenerId);
    }
  }

  /**
   * 通知監聽器
   * @private
   */
  notifyListeners(objectType, eventType, data) {
    const objectListeners = this.listeners.get(objectType);
    if (objectListeners) {
      for (const [listenerId, callback] of objectListeners.entries()) {
        try {
          callback(eventType, data);
        } catch (error) {
          console.error(`進度監聽器錯誤 (${listenerId}):`, error);
        }
      }
    }
  }

  /**
   * 重置對象進度
   * @param {string} objectType - 對象類型
   */
  resetProgress(objectType) {
    this.progressData.delete(objectType);
    this.performanceMetrics.delete(objectType);
    this.listeners.delete(objectType);
  }

  /**
   * 重置所有進度
   */
  resetAllProgress() {
    this.progressData.clear();
    this.performanceMetrics.clear();
    this.listeners.clear();
  }

  /**
   * 導出進度數據（用於報告）
   * @param {string} objectType - 對象類型（可選，不指定則導出所有）
   * @returns {Object} 導出的進度數據
   */
  exportProgress(objectType = null) {
    const exportData = {
      timestamp: Date.now(),
      version: '2.0.0'
    };

    if (objectType) {
      exportData.objectType = objectType;
      exportData.progress = this.getProgress(objectType);
      exportData.statistics = this.getStatistics(objectType);
    } else {
      exportData.summary = this.getAllProgress();
      exportData.objects = {};
      
      for (const objType of this.progressData.keys()) {
        exportData.objects[objType] = {
          progress: this.getProgress(objType),
          statistics: this.getStatistics(objType)
        };
      }
    }

    return exportData;
  }
}

// 創建全局實例
export const migrationProgress = new MigrationProgress();
export default MigrationProgress;