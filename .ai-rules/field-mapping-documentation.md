# CRM字段映射标准化文档和维护指南

## 📋 概述

本文档定义了CRM系统到D1数据库的字段映射标准化流程、维护规范和最佳实践。

## 🎯 设计原则

### 1. 统一性原则
- **单一数据源**：所有字段映射配置集中在 `field-mapping-config.js`
- **统一接口**：使用 `FieldMappingService` 类处理所有映射逻辑
- **标准化命名**：字段名、表名、函数名遵循统一命名规范

### 2. 可维护性原则
- **配置分离**：映射配置与业务逻辑分离
- **版本控制**：映射配置变更需记录版本和原因
- **向后兼容**：新增字段不影响现有功能

### 3. 可扩展性原则
- **模块化设计**：支持新增CRM对象和字段类型
- **插件机制**：自定义转换函数和验证规则
- **监控完善**：详细的日志和统计信息

## 🔧 标准化流程

### 1. 新增字段映射流程

#### 步骤1：分析CRM字段
```javascript
// 1. 确认CRM字段信息
const newField = {
  name: 'field_ABC123__c',
  type: '单行文本',
  required: false,
  description: '新增字段描述',
  options: ['选项1', '选项2'] // 如果是选择字段
};
```

#### 步骤2：设计D1字段映射
```javascript
// 2. 在 field-mapping-config.js 中添加映射
'field_ABC123__c': {
  d1_field: 'new_field_name',
  type: 'TEXT',
  required: false,
  description: '新增字段描述',
  maxLength: 255,
  transform: (value) => {
    // 可选：自定义转换逻辑
    return value ? value.trim() : null;
  }
}
```

#### 步骤3：更新数据库结构
```sql
-- 3. 在 improved-database-schema.sql 中添加字段
ALTER TABLE sites ADD COLUMN new_field_name TEXT;

-- 创建索引（如需要）
CREATE INDEX IF NOT EXISTS idx_sites_new_field ON sites(new_field_name);
```

#### 步骤4：添加验证规则
```javascript
// 4. 在 FIELD_VALIDATION 中添加验证规则
sites: {
  'new_field_name': {
    maxLength: 255,
    required: false,
    pattern: /^[A-Za-z0-9\s]+$/ // 可选：正则验证
  }
}
```

#### 步骤5：测试和部署
```bash
# 5. 测试字段映射
npm run test:field-mapping

# 部署数据库变更
npx wrangler d1 migrations apply construction-progress-db --env production

# 部署代码变更
npx wrangler deploy --env production
```

### 2. 字段映射变更流程

#### 变更审批流程
1. **需求评估**：评估变更的影响范围和风险
2. **向后兼容**：确保不影响现有数据和功能
3. **测试验证**：在测试环境完整验证
4. **文档更新**：更新相关文档和注释
5. **生产部署**：分步骤部署到生产环境

#### 变更记录模板
```markdown
## 字段映射变更记录 - [YYYY-MM-DD]

### 变更内容
- **变更类型**: 新增/修改/删除
- **影响对象**: sites/opportunities/maintenance_orders/sales_records
- **变更字段**: 字段名列表
- **变更原因**: 业务需求/数据质量优化/性能优化

### 技术细节
- **配置文件变更**: field-mapping-config.js
- **数据库变更**: improved-database-schema.sql
- **代码影响**: 受影响的函数和文件
- **测试范围**: 测试用例和验证结果

### 风险评估
- **数据风险**: 是否影响现有数据
- **功能风险**: 是否影响现有功能
- **性能影响**: 对同步性能的影响
- **回滚方案**: 如何快速回滚

### 部署计划
- **测试环境**: 测试完成时间
- **生产环境**: 部署时间窗口
- **监控计划**: 部署后监控重点
```

## 📊 监控和维护

### 1. 字段映射监控指标

#### 核心指标
- **映射成功率**: 字段转换成功的比例
- **数据质量分数**: 验证通过的数据比例
- **同步性能**: 字段映射处理时间
- **错误分类**: 不同类型错误的分布

#### 监控API端点
```javascript
// 获取字段映射统计
GET /api/field-mapping/stats?type=sites&hours=24

// 获取失败字段详情
GET /api/field-mapping/failures?type=sites&limit=100

// 获取性能指标
GET /api/field-mapping/performance?type=sites
```

### 2. 数据质量检查

#### 自动化检查任务
```javascript
// 每日数据质量检查
const qualityChecks = [
  {
    name: '必填字段完整性',
    query: 'SELECT COUNT(*) FROM sites WHERE name IS NULL OR name = ""',
    threshold: 0
  },
  {
    name: '数据类型一致性',
    query: 'SELECT COUNT(*) FROM sites WHERE floor_info IS NOT NULL AND typeof(floor_info) != "integer"',
    threshold: 0
  },
  {
    name: '字段长度合规',
    query: 'SELECT COUNT(*) FROM sites WHERE length(contractor_name) > 100',
    threshold: 0
  }
];
```

#### 数据修复脚本
```javascript
// 数据清理和修复
const dataRepairTasks = [
  {
    name: '清理空白字符',
    sql: 'UPDATE sites SET contractor_name = trim(contractor_name) WHERE contractor_name IS NOT NULL'
  },
  {
    name: '标准化状态值',
    sql: 'UPDATE sites SET status = "準備中" WHERE status IN ("准备中", "準備", "preparing")'
  }
];
```

### 3. 性能优化

#### 批量处理优化
- **批次大小调优**：根据数据量和API限制调整批次大小
- **并发控制**：避免过度并发导致API限流
- **内存管理**：大数据量处理时的内存优化
- **事务优化**：合理使用数据库事务减少锁时间

#### 索引优化
```sql
-- 根据查询模式优化索引
CREATE INDEX IF NOT EXISTS idx_sites_multi_field ON sites(status, building_type, floor_info);
CREATE INDEX IF NOT EXISTS idx_progress_contractor_date ON site_progress(contractor_name, actual_start_date);
```

## 🛠️ 开发工具和脚本

### 1. 字段映射验证工具
```javascript
// validate-field-mapping.js
import { FieldMappingService } from './field-mapping-service.js';

const validator = new FieldMappingService();

// 验证配置完整性
const validateConfig = () => {
  const issues = [];
  
  // 检查必填字段配置
  // 检查数据类型匹配
  // 检查字段名冲突
  
  return issues;
};

// 模拟数据验证
const testWithSampleData = async (sampleData) => {
  try {
    const result = await validator.transformCrmToD1('sites', sampleData);
    console.log('验证通过:', result);
  } catch (error) {
    console.error('验证失败:', error);
  }
};
```

### 2. 数据迁移脚本
```javascript
// migrate-field-mapping.js
const migrateFieldMapping = async (env, fromVersion, toVersion) => {
  console.log(`开始字段映射迁移: ${fromVersion} -> ${toVersion}`);
  
  // 1. 备份现有数据
  await backupTables(env, ['sites', 'site_progress']);
  
  // 2. 执行数据库结构变更
  await runMigrations(env, fromVersion, toVersion);
  
  // 3. 迁移数据格式
  await migrateDataFormats(env, fromVersion, toVersion);
  
  // 4. 验证迁移结果
  const validationResult = await validateMigration(env);
  
  if (!validationResult.success) {
    // 回滚操作
    await rollbackMigration(env, fromVersion);
    throw new Error('迁移验证失败，已回滚');
  }
  
  console.log('字段映射迁移完成');
};
```

### 3. 性能测试脚本
```javascript
// performance-test.js
const testFieldMappingPerformance = async () => {
  const testSizes = [10, 100, 1000, 5000];
  const results = [];
  
  for (const size of testSizes) {
    const startTime = Date.now();
    
    // 生成测试数据
    const testData = generateTestSites(size);
    
    // 执行字段映射
    const mappingService = new FieldMappingService();
    await Promise.all(testData.map(data => 
      mappingService.transformCrmToD1('sites', data)
    ));
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    results.push({
      size,
      duration,
      avgPerRecord: duration / size
    });
  }
  
  console.table(results);
};
```

## 📚 常见问题和解决方案

### 1. 字段映射失败

#### 问题：数据类型转换失败
```javascript
// 原因：CRM返回的数据类型与预期不符
// 解决方案：增强类型转换逻辑
const robustTypeConversion = (value, targetType) => {
  try {
    switch (targetType) {
      case 'INTEGER':
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        return isNaN(num) ? null : Math.floor(num);
      
      case 'TEXT':
        return value === null || value === undefined ? null : String(value);
      
      default:
        return value;
    }
  } catch (error) {
    console.error(`类型转换失败: ${value} -> ${targetType}`, error);
    return null;
  }
};
```

### 2. 同步性能问题

#### 问题：大批量数据同步超时
```javascript
// 解决方案：分批处理和进度跟踪
const batchProcessWithProgress = async (data, batchSize = 100) => {
  const batches = [];
  for (let i = 0; i < data.length; i += batchSize) {
    batches.push(data.slice(i, i + batchSize));
  }
  
  let processed = 0;
  for (const batch of batches) {
    await processBatch(batch);
    processed += batch.length;
    
    console.log(`进度: ${processed}/${data.length} (${Math.round(processed/data.length*100)}%)`);
    
    // 添加延迟避免过载
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};
```

### 3. 数据一致性问题

#### 问题：CRM和D1数据不一致
```javascript
// 解决方案：数据一致性检查和修复
const checkDataConsistency = async (env) => {
  const inconsistencies = [];
  
  // 检查记录数量一致性
  const d1Count = await env.DB.prepare('SELECT COUNT(*) as count FROM sites').first();
  const crmCount = await getCRMRecordCount('sites');
  
  if (d1Count.count !== crmCount) {
    inconsistencies.push({
      type: 'count_mismatch',
      d1Count: d1Count.count,
      crmCount: crmCount
    });
  }
  
  // 检查关键字段一致性
  const sampleRecords = await env.DB.prepare('SELECT * FROM sites LIMIT 100').all();
  for (const record of sampleRecords.results) {
    const crmRecord = await getCRMRecord('sites', record.id);
    const diff = compareRecords(record, crmRecord);
    if (diff.length > 0) {
      inconsistencies.push({
        type: 'field_mismatch',
        recordId: record.id,
        differences: diff
      });
    }
  }
  
  return inconsistencies;
};
```

## 🎯 未来发展规划

### 1. 智能化字段映射
- **AI辅助映射**：使用AI自动识别和建议字段映射关系
- **动态映射调整**：根据数据质量自动优化映射规则
- **异常检测**：智能识别数据异常和映射错误

### 2. 实时同步优化
- **增量同步**：只同步变更的数据，提高效率
- **实时触发**：CRM数据变更时实时触发同步
- **冲突解决**：智能处理并发修改冲突

### 3. 数据治理增强
- **数据血缘**：跟踪数据从CRM到D1的完整路径
- **质量评分**：为每个字段和记录评估数据质量分数
- **合规检查**：自动检查数据是否符合业务规则和法规要求

---

## 📞 支持和联系

- **技术文档**: `/docs/field-mapping/`
- **API参考**: `/api/field-mapping/`
- **问题报告**: GitHub Issues
- **技术支持**: 开发团队邮箱

---

*最后更新：2025-07-25*
*版本：1.0.0*