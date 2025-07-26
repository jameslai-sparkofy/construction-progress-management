/**
 * UnifiedMappingService 單元測試
 * 
 * 測試覆蓋：
 * - 映射轉換邏輯測試
 * - 批量處理測試
 * - 數據驗證測試
 * - 錯誤處理測試
 */

import { UnifiedMappingService } from '../services/UnifiedMappingService.js';

/**
 * 模擬測試數據
 */
const mockTestData = {
  // 商機測試數據
  opportunity: {
    frontend: {
      opportunityId: 'opp_123',
      opportunityName: '測試商機',
      customerName: '測試客戶',
      amount: 100000,
      stage: '談判中',
      createTime: 1642492800,
      updateTime: 1642492800
    },
    d1: {
      id: 'opp_123',
      name: '測試商機',
      customer: '測試客戶',
      amount: 100000,
      stage: '談判中',
      create_time: 1642492800,
      update_time: 1642492800
    },
    crm: {
      _id: 'opp_123',
      name: '測試商機',
      customer: '測試客戶',
      amount: 100000,
      stage: '談判中',
      create_time: 1642492800,
      last_modified_time: 1642492800
    }
  },

  // 案場測試數據
  site: {
    frontend: {
      siteId: 'site_456',
      siteName: 'A01-3F-301',
      opportunityId: 'opp_123',
      buildingType: 'A棟',
      floor: 3,
      room: '301',
      constructionStatus: '施工',
      contractorTeam: '第一工班',
      isCompleted: false,
      createTime: 1642492800,
      updateTime: 1642492800
    },
    d1: {
      id: 'site_456',
      name: 'A01-3F-301',
      opportunity_id: 'opp_123',
      building_type: 'A棟',
      floor_info: 3,
      room_info: '301',
      construction_status: '施工',
      contractor_team: '第一工班',
      construction_completed: false,
      create_time: 1642492800,
      update_time: 1642492800
    },
    crm: {
      _id: 'site_456',
      name: 'A01-3F-301',
      field_1P96q__c: 'opp_123',
      field_WD7k1__c: 'A棟',
      field_Q6Svh__c: 3,
      field_XuJP2__c: '301',
      field_z9H6O__c: '施工',
      field_u1wpv__c: '第一工班',
      construction_completed__c: false,
      create_time: 1642492800,
      last_modified_time: 1642492800
    }
  }
};

/**
 * 測試套件：基本映射功能
 */
class MappingServiceTestSuite {
  constructor() {
    this.mappingService = new UnifiedMappingService();
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  /**
   * 執行單個測試
   * @param {string} testName - 測試名稱
   * @param {Function} testFunction - 測試函數
   */
  async runTest(testName, testFunction) {
    this.testResults.total++;
    
    try {
      console.log(`🧪 執行測試: ${testName}`);
      await testFunction();
      
      this.testResults.passed++;
      this.testResults.details.push({
        name: testName,
        status: 'PASSED',
        timestamp: Date.now()
      });
      
      console.log(`✅ 測試通過: ${testName}`);
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        name: testName,
        status: 'FAILED',
        error: error.message,
        timestamp: Date.now()
      });
      
      console.error(`❌ 測試失敗: ${testName}`, error.message);
    }
  }

  /**
   * 測試：商機前端到D1映射
   */
  async testOpportunityFrontendToD1() {
    const result = await this.mappingService.mapFrontendToD1(
      'opportunities', 
      mockTestData.opportunity.frontend
    );

    // 驗證映射結果
    this.assertEqual(result.data.id, 'opp_123');
    this.assertEqual(result.data.name, '測試商機');
    this.assertEqual(result.data.customer, '測試客戶');
    this.assertEqual(result.data.amount, 100000);
    this.assertTrue(result.data.create_time > 0);
    this.assertTrue(result.data.update_time > 0);
  }

  /**
   * 測試：商機D1到CRM映射
   */
  async testOpportunityD1ToCRM() {
    const result = await this.mappingService.mapD1ToCRM(
      'opportunities',
      mockTestData.opportunity.d1
    );

    // 驗證映射結果
    this.assertEqual(result.data._id, 'opp_123');
    this.assertEqual(result.data.name, '測試商機');
    this.assertEqual(result.data.customer, '測試客戶');
    this.assertEqual(result.data.amount, 100000);
  }

  /**
   * 測試：商機CRM到D1映射
   */
  async testOpportunityCRMToD1() {
    const result = await this.mappingService.mapCRMToD1(
      'opportunities',
      mockTestData.opportunity.crm
    );

    // 驗證映射結果
    this.assertEqual(result.data.id, 'opp_123');
    this.assertEqual(result.data.name, '測試商機');
    this.assertEqual(result.data.customer, '測試客戶');
    this.assertTrue(result.data.synced_at > 0);
    this.assertTrue(result.data.raw_data.includes('測試商機'));
  }

  /**
   * 測試：案場前端到D1映射
   */
  async testSiteFrontendToD1() {
    const result = await this.mappingService.mapFrontendToD1(
      'sites',
      mockTestData.site.frontend
    );

    // 驗證映射結果
    this.assertEqual(result.data.id, 'site_456');
    this.assertEqual(result.data.name, 'A01-3F-301');
    this.assertEqual(result.data.opportunity_id, 'opp_123');
    this.assertEqual(result.data.building_type, 'A棟');
    this.assertEqual(result.data.floor_info, 3);
    this.assertEqual(result.data.construction_completed, false);
  }

  /**
   * 測試：案場D1到CRM映射
   */
  async testSiteD1ToCRM() {
    const result = await this.mappingService.mapD1ToCRM(
      'sites',
      mockTestData.site.d1
    );

    // 驗證映射結果
    this.assertEqual(result.data._id, 'site_456');
    this.assertEqual(result.data.name, 'A01-3F-301');
    this.assertEqual(result.data.field_1P96q__c, 'opp_123');
    this.assertEqual(result.data.field_WD7k1__c, 'A棟');
    this.assertEqual(result.data.field_Q6Svh__c, 3);
  }

  /**
   * 測試：案場CRM到D1映射
   */
  async testSiteCRMToD1() {
    const result = await this.mappingService.mapCRMToD1(
      'sites',
      mockTestData.site.crm
    );

    // 驗證映射結果
    this.assertEqual(result.data.id, 'site_456');
    this.assertEqual(result.data.name, 'A01-3F-301');
    this.assertEqual(result.data.opportunity_id, 'opp_123');
    this.assertEqual(result.data.building_type, 'A棟');
    this.assertEqual(result.data.floor_info, 3);
  }

  /**
   * 測試：批量處理功能
   */
  async testBatchProcessing() {
    const batchData = [
      mockTestData.opportunity.frontend,
      {
        ...mockTestData.opportunity.frontend,
        opportunityId: 'opp_124',
        opportunityName: '測試商機2',
        createTime: 1642492800,
        updateTime: 1642492800
      },
      {
        ...mockTestData.opportunity.frontend,
        opportunityId: 'opp_125',
        opportunityName: '測試商機3',
        createTime: 1642492800,
        updateTime: 1642492800
      }
    ];

    const result = await this.mappingService.batchMapFrontendToD1(
      'opportunities',
      batchData
    );

    // 驗證批量處理結果
    this.assertEqual(result.successCount, 3);
    this.assertEqual(result.failureCount, 0);
    this.assertEqual(result.results.length, 3);
    this.assertEqual(result.metadata.totalRecords, 3);
  }

  /**
   * 測試：數據驗證功能
   */
  async testDataValidation() {
    // 測試必填欄位驗證
    const invalidData = {
      // 缺少必填的 opportunityName
      opportunityId: 'opp_invalid',
      createTime: 1642492800,
      updateTime: 1642492800
    };

    try {
      await this.mappingService.mapFrontendToD1('opportunities', invalidData);
      throw new Error('應該拋出驗證錯誤');
    } catch (error) {
      this.assertTrue(error.message.includes('缺少必填欄位') || error.message.includes('驗證失敗'));
    }
  }

  /**
   * 測試：類型轉換功能
   */
  async testTypeConversion() {
    const testData = {
      opportunityId: 'opp_type_test',
      opportunityName: '類型轉換測試',
      amount: 50000, // 確保是數字格式
      customerName: '測試客戶',
      createTime: 1642492800,
      updateTime: 1642492800
    };

    const result = await this.mappingService.mapFrontendToD1('opportunities', testData);

    // 驗證類型轉換
    this.assertEqual(typeof result.data.amount, 'number');
    this.assertEqual(result.data.amount, 50000);
  }

  /**
   * 測試：空值處理
   */
  async testNullValueHandling() {
    const testData = {
      opportunityId: 'opp_null_test',
      opportunityName: '空值測試',
      customerName: null, // 空值
      amount: undefined,   // 未定義值
      createTime: 1642492800,
      updateTime: 1642492800
    };

    const result = await this.mappingService.mapFrontendToD1('opportunities', testData);

    // 驗證空值處理
    this.assertEqual(result.data.customer, null);
    this.assertEqual(result.data.amount, 0); // 應該使用默認值
  }

  /**
   * 測試：錯誤處理機制
   */
  async testErrorHandling() {
    // 測試無效對象類型
    try {
      await this.mappingService.mapFrontendToD1('invalid_object', {});
      throw new Error('應該拋出錯誤');
    } catch (error) {
      this.assertTrue(error.message.includes('未找到對象配置'));
    }
  }

  /**
   * 測試：配置統計功能
   */
  async testConfigStatistics() {
    const stats = this.mappingService.getStatistics();

    // 驗證統計信息
    this.assertTrue(stats.totalObjects >= 4);
    this.assertTrue(stats.totalFields > 20);
    this.assertTrue(stats.objects.length >= 4);
    this.assertTrue(stats.validators.length > 5);
    this.assertTrue(stats.transformers.length > 5);
  }

  /**
   * 測試：配置重載功能
   */
  async testConfigReload() {
    const reloadResult = await this.mappingService.reloadConfig();
    this.assertTrue(reloadResult);
  }

  /**
   * 斷言：相等
   */
  assertEqual(actual, expected) {
    if (actual !== expected) {
      throw new Error(`斷言失敗: 期望 ${expected}, 實際 ${actual}`);
    }
  }

  /**
   * 斷言：為真
   */
  assertTrue(condition) {
    if (!condition) {
      throw new Error('斷言失敗: 期望為真');
    }
  }

  /**
   * 斷言：為假
   */
  assertFalse(condition) {
    if (condition) {
      throw new Error('斷言失敗: 期望為假');
    }
  }

  /**
   * 執行所有測試
   */
  async runAllTests() {
    console.log('🚀 開始執行 UnifiedMappingService 單元測試...\n');

    // 基本映射測試
    await this.runTest('商機前端到D1映射', () => this.testOpportunityFrontendToD1());
    await this.runTest('商機D1到CRM映射', () => this.testOpportunityD1ToCRM());
    await this.runTest('商機CRM到D1映射', () => this.testOpportunityCRMToD1());
    
    await this.runTest('案場前端到D1映射', () => this.testSiteFrontendToD1());
    await this.runTest('案場D1到CRM映射', () => this.testSiteD1ToCRM());
    await this.runTest('案場CRM到D1映射', () => this.testSiteCRMToD1());

    // 進階功能測試
    await this.runTest('批量處理功能', () => this.testBatchProcessing());
    await this.runTest('數據驗證功能', () => this.testDataValidation());
    await this.runTest('類型轉換功能', () => this.testTypeConversion());
    await this.runTest('空值處理', () => this.testNullValueHandling());
    await this.runTest('錯誤處理機制', () => this.testErrorHandling());
    
    // 配置管理測試
    await this.runTest('配置統計功能', () => this.testConfigStatistics());
    await this.runTest('配置重載功能', () => this.testConfigReload());

    // 輸出測試結果
    this.printTestResults();
  }

  /**
   * 輸出測試結果
   */
  printTestResults() {
    console.log('\n📊 測試結果摘要:');
    console.log(`總計: ${this.testResults.total}`);
    console.log(`通過: ${this.testResults.passed}`);
    console.log(`失敗: ${this.testResults.failed}`);
    console.log(`成功率: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);

    if (this.testResults.failed > 0) {
      console.log('\n❌ 失敗的測試:');
      this.testResults.details
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
    }

    const coverage = this.calculateTestCoverage();
    console.log(`\n📈 測試覆蓋率: ${coverage.toFixed(1)}%`);
    
    if (this.testResults.failed === 0) {
      console.log('\n🎉 所有測試通過！映射服務準備就緒。');
    } else {
      console.log('\n⚠️  部分測試失敗，需要修復後再部署。');
    }
  }

  /**
   * 計算測試覆蓋率
   * @returns {number} 覆蓋率百分比
   */
  calculateTestCoverage() {
    // 基於測試的功能點數量計算覆蓋率
    const totalFeatures = 15; // 映射服務總功能點
    const testedFeatures = this.testResults.total;
    
    return Math.min((testedFeatures / totalFeatures) * 100, 100);
  }

  /**
   * 獲取測試結果
   * @returns {Object} 測試結果
   */
  getTestResults() {
    return {
      ...this.testResults,
      coverage: this.calculateTestCoverage(),
      timestamp: Date.now()
    };
  }
}

/**
 * 執行測試的主函數
 */
export async function runMappingServiceTests() {
  const testSuite = new MappingServiceTestSuite();
  await testSuite.runAllTests();
  return testSuite.getTestResults();
}

/**
 * 導出測試套件供外部使用
 */
export { MappingServiceTestSuite };

// 如果直接執行此檔案，則運行測試
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('test')) {
  runMappingServiceTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}