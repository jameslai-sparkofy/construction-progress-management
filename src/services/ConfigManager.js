/**
 * 配置管理服務 (ConfigManager)
 * 
 * 功能：
 * - 配置熱重載
 * - 配置版本管理
 * - 配置更新通知
 * - 配置備份和恢復
 */

import { mappingService } from './UnifiedMappingService.js';

export class ConfigManager {
  constructor(env) {
    this.env = env;
    this.configVersion = '1.0.0';
    this.lastUpdate = Date.now();
    this.updateListeners = new Set();
    this.backupConfigs = new Map();
    
    // 初始化配置監控
    this.initializeConfigMonitoring();
  }

  /**
   * 初始化配置監控
   * @private
   */
  initializeConfigMonitoring() {
    // 定期檢查配置更新（在生產環境中可能通過其他機制觸發）
    this.configCheckInterval = setInterval(async () => {
      await this.checkForConfigUpdates();
    }, 60000); // 每分鐘檢查一次
  }

  /**
   * 檢查配置更新
   * @private
   */
  async checkForConfigUpdates() {
    try {
      // 在實際應用中，這裡可能會檢查：
      // 1. KV 存儲中的配置版本
      // 2. 外部配置服務的版本
      // 3. 文件系統的修改時間（如果適用）
      
      const storedVersion = await this.getStoredConfigVersion();
      if (storedVersion && storedVersion !== this.configVersion) {
        console.log(`檢測到配置更新: ${this.configVersion} -> ${storedVersion}`);
        await this.reloadConfiguration();
      }
    } catch (error) {
      console.error('檢查配置更新失敗:', error);
    }
  }

  /**
   * 獲取存儲的配置版本
   * @private
   */
  async getStoredConfigVersion() {
    try {
      // 從 KV 存儲讀取配置版本
      if (this.env?.MAPPING_CONFIG_KV) {
        const versionData = await this.env.MAPPING_CONFIG_KV.get('config_version');
        return versionData ? JSON.parse(versionData).version : null;
      }
      return null;
    } catch (error) {
      console.error('讀取配置版本失敗:', error);
      return null;
    }
  }

  /**
   * 重新載入配置
   */
  async reloadConfiguration() {
    try {
      // 備份當前配置
      await this.backupCurrentConfig();
      
      // 重新載入映射服務配置
      const reloadSuccess = await mappingService.reloadConfig();
      
      if (reloadSuccess) {
        this.lastUpdate = Date.now();
        
        // 通知所有監聽器
        this.notifyConfigUpdate();
        
        console.log('配置重載成功');
        return {
          success: true,
          timestamp: this.lastUpdate,
          version: this.configVersion
        };
      } else {
        throw new Error('映射服務配置重載失敗');
      }
    } catch (error) {
      console.error('配置重載失敗:', error);
      
      // 嘗試恢復備份配置
      await this.restoreBackupConfig();
      
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 備份當前配置
   * @private
   */
  async backupCurrentConfig() {
    try {
      const currentStats = mappingService.getStatistics();
      const backupKey = `backup_${Date.now()}`;
      
      this.backupConfigs.set(backupKey, {
        version: this.configVersion,
        statistics: currentStats,
        timestamp: Date.now()
      });
      
      // 只保留最近5個備份
      if (this.backupConfigs.size > 5) {
        const oldestKey = Math.min(...Array.from(this.backupConfigs.keys()).map(k => k.split('_')[1]));
        this.backupConfigs.delete(`backup_${oldestKey}`);
      }
      
      console.log('配置備份完成:', backupKey);
    } catch (error) {
      console.error('配置備份失敗:', error);
    }
  }

  /**
   * 恢復備份配置
   * @private
   */
  async restoreBackupConfig() {
    try {
      if (this.backupConfigs.size === 0) {
        console.warn('沒有可用的備份配置');
        return false;
      }
      
      // 獲取最新的備份
      const latestBackupKey = Array.from(this.backupConfigs.keys())
        .sort((a, b) => parseInt(b.split('_')[1]) - parseInt(a.split('_')[1]))[0];
      
      const backup = this.backupConfigs.get(latestBackupKey);
      
      if (backup) {
        this.configVersion = backup.version;
        console.log('配置恢復成功:', latestBackupKey);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('配置恢復失敗:', error);
      return false;
    }
  }

  /**
   * 註冊配置更新監聽器
   * @param {Function} listener - 監聽器函數
   */
  addUpdateListener(listener) {
    if (typeof listener === 'function') {
      this.updateListeners.add(listener);
    }
  }

  /**
   * 移除配置更新監聽器
   * @param {Function} listener - 監聽器函數
   */
  removeUpdateListener(listener) {
    this.updateListeners.delete(listener);
  }

  /**
   * 通知配置更新
   * @private
   */
  notifyConfigUpdate() {
    const updateInfo = {
      version: this.configVersion,
      timestamp: this.lastUpdate,
      statistics: mappingService.getStatistics()
    };
    
    for (const listener of this.updateListeners) {
      try {
        listener(updateInfo);
      } catch (error) {
        console.error('配置更新通知失敗:', error);
      }
    }
  }

  /**
   * 手動更新配置
   * @param {Object} newConfig - 新配置
   * @param {string} version - 新版本號
   */
  async updateConfig(newConfig, version) {
    try {
      // 驗證新配置
      if (!this.validateConfigStructure(newConfig)) {
        throw new Error('新配置結構無效');
      }
      
      // 備份當前配置
      await this.backupCurrentConfig();
      
      // 存儲新配置到 KV（如果可用）
      if (this.env?.MAPPING_CONFIG_KV) {
        await this.env.MAPPING_CONFIG_KV.put('config_version', JSON.stringify({
          version: version,
          timestamp: Date.now()
        }));
        
        await this.env.MAPPING_CONFIG_KV.put('mapping_config', JSON.stringify(newConfig));
      }
      
      // 更新版本
      this.configVersion = version;
      
      // 重載配置
      const reloadResult = await this.reloadConfiguration();
      
      if (reloadResult.success) {
        console.log('配置更新成功:', version);
        return {
          success: true,
          version: version,
          timestamp: Date.now()
        };
      } else {
        throw new Error('配置重載失敗');
      }
    } catch (error) {
      console.error('配置更新失敗:', error);
      
      // 恢復備份
      await this.restoreBackupConfig();
      
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 驗證配置結構
   * @param {Object} config - 配置對象
   * @private
   */
  validateConfigStructure(config) {
    try {
      // 基本結構檢查
      if (!config || typeof config !== 'object') {
        return false;
      }
      
      // 檢查必要屬性
      const requiredProps = ['version', 'objects', 'validationRules', 'typeConverters', 'syncConfig'];
      for (const prop of requiredProps) {
        if (!(prop in config)) {
          console.error(`配置缺少必要屬性: ${prop}`);
          return false;
        }
      }
      
      // 檢查對象配置
      if (!config.objects || typeof config.objects !== 'object') {
        console.error('對象配置無效');
        return false;
      }
      
      // 檢查每個對象的基本結構
      for (const [objectType, objectConfig] of Object.entries(config.objects)) {
        if (!objectConfig.fields || typeof objectConfig.fields !== 'object') {
          console.error(`對象 ${objectType} 缺少欄位配置`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('配置結構驗證失敗:', error);
      return false;
    }
  }

  /**
   * 獲取配置狀態
   */
  getConfigStatus() {
    const stats = mappingService.getStatistics();
    
    return {
      currentVersion: this.configVersion,
      lastUpdate: this.lastUpdate,
      statistics: stats,
      backupCount: this.backupConfigs.size,
      listenersCount: this.updateListeners.size,
      isHealthy: this.isConfigHealthy(),
      uptime: Date.now() - this.lastUpdate
    };
  }

  /**
   * 檢查配置健康狀態
   * @private
   */
  isConfigHealthy() {
    try {
      const stats = mappingService.getStatistics();
      
      // 基本健康檢查
      if (stats.totalObjects < 4) { // 應該有4個對象
        return false;
      }
      
      if (stats.totalFields < 20) { // 應該有足夠的欄位
        return false;
      }
      
      // 檢查是否有錯誤（這裡簡化處理）
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 清理資源
   */
  cleanup() {
    if (this.configCheckInterval) {
      clearInterval(this.configCheckInterval);
      this.configCheckInterval = null;
    }
    
    this.updateListeners.clear();
    this.backupConfigs.clear();
  }

  /**
   * 獲取配置變更歷史
   */
  getConfigHistory() {
    return Array.from(this.backupConfigs.entries()).map(([key, backup]) => ({
      backupId: key,
      version: backup.version,
      timestamp: backup.timestamp,
      statistics: backup.statistics
    })).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 導出配置
   */
  async exportConfig() {
    try {
      const stats = mappingService.getStatistics();
      const status = this.getConfigStatus();
      
      return {
        metadata: {
          exportedAt: Date.now(),
          version: this.configVersion,
          exporter: 'ConfigManager'
        },
        configuration: {
          version: this.configVersion,
          statistics: stats,
          status: status
        },
        history: this.getConfigHistory()
      };
    } catch (error) {
      console.error('配置導出失敗:', error);
      throw error;
    }
  }
}

/**
 * 創建配置管理器實例
 * @param {Object} env - Cloudflare Workers 環境
 * @returns {ConfigManager} 配置管理器實例
 */
export function createConfigManager(env) {
  return new ConfigManager(env);
}