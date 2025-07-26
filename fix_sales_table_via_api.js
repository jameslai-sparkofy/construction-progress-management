// 通过生产环境API修复sales_records表结构
// 添加缺失的external_form_display字段

async function fixSalesTableViaAPI() {
    console.log('🔧 通过API修复 sales_records 表结构');
    console.log('='.repeat(60));
    
    try {
        // Step 1: 检查当前表结构
        console.log('1. 检查当前数据库表结构...');
        
        const response = await fetch('https://progress.yes-ceramics.com/api/database/opportunities?limit=1');
        if (response.ok) {
            console.log('✅ API连接正常');
        } else {
            console.log('⚠️  API连接异常');
        }
        
        // Step 2: 创建表结构修复API调用
        console.log('\n2. 准备表结构修复...');
        console.log('='.repeat(50));
        
        // 我们需要通过现有的数据库迁移系统来修复表结构
        // 首先创建一个新的迁移脚本
        
        const migrationSQL = `
-- 修复 sales_records 表结构 - 添加缺失字段
-- Migration: Add external_form_display column to sales_records

-- 检查表是否存在，如果不存在则创建
CREATE TABLE IF NOT EXISTS sales_records (
    id TEXT PRIMARY KEY,
    name TEXT,
    opportunity_id TEXT,
    record_type TEXT,
    content TEXT,
    interactive_type TEXT,
    follow_date TEXT,
    sales_person TEXT,
    customer_name TEXT,
    amount REAL DEFAULT 0,
    stage TEXT,
    notes TEXT,
    location TEXT,
    external_form_display TEXT,
    create_time INTEGER,
    update_time INTEGER,
    synced_at INTEGER,
    raw_data TEXT,
    UNIQUE(id)
);

-- 如果表已存在但缺少字段，则添加字段
ALTER TABLE sales_records ADD COLUMN external_form_display TEXT;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sales_records_opportunity_id ON sales_records(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sales_records_record_type ON sales_records(record_type);
CREATE INDEX IF NOT EXISTS idx_sales_records_create_time ON sales_records(create_time);
CREATE INDEX IF NOT EXISTS idx_sales_records_synced_at ON sales_records(synced_at);
CREATE INDEX IF NOT EXISTS idx_sales_records_external_form_display ON sales_records(external_form_display);

-- 更新同步状态
INSERT OR REPLACE INTO sync_status (sync_type, last_sync_time, last_sync_count, status, message)
VALUES ('sales_records', 0, 0, 'pending', 'Table structure fixed, ready for sync');
        `.trim();
        
        console.log('表结构修复SQL:');
        console.log(migrationSQL);
        
        // Step 3: 创建迁移文件
        console.log('\n3. 创建迁移文件...');
        const fs = require('fs');
        const migrationFileName = 'migrations/0007_fix_sales_records_structure.sql';
        
        // 确保目录存在
        if (!fs.existsSync('migrations')) {
            fs.mkdirSync('migrations', { recursive: true });
        }
        
        fs.writeFileSync(migrationFileName, migrationSQL);
        console.log(`✅ 迁移文件已创建: ${migrationFileName}`);
        
        // Step 4: 创建直接执行脚本
        console.log('\n4. 创建直接执行脚本...');
        
        const directExecuteScript = `
-- 直接修复脚本 - 可以在Cloudflare Dashboard中执行
-- 第一步：尝试添加字段（可能会失败，如果字段已存在）
ALTER TABLE sales_records ADD COLUMN external_form_display TEXT;

-- 第二步：验证表结构
PRAGMA table_info(sales_records);

-- 第三步：检查字段是否添加成功
SELECT COUNT(*) as column_count 
FROM pragma_table_info('sales_records') 
WHERE name = 'external_form_display';
        `.trim();
        
        const directFileName = 'direct_fix_sales_table.sql';
        fs.writeFileSync(directFileName, directExecuteScript);
        console.log(`✅ 直接执行脚本已创建: ${directFileName}`);
        
        // Step 5: 尝试通过代码中的方式修复
        console.log('\n5. 更新代码中的表创建逻辑...');
        console.log('='.repeat(50));
        
        // 检查现有的代码是否正确创建了表结构
        console.log('✅ 代码修复建议:');
        console.log('   1. 确保 src/index.js 中的 insertSalesRecordsToD1 函数正确处理 external_form_display 字段');
        console.log('   2. 确保数据库迁移脚本包含了所有必需的字段');
        console.log('   3. 在同步之前先运行表结构检查');
        
        // Step 6: 提供手动修复指导
        console.log('\n6. 手动修复指导...');
        console.log('='.repeat(50));
        
        console.log('\n📋 手动修复步骤:');
        console.log('   方法1: 使用 Cloudflare Dashboard');
        console.log('   1. 登录 Cloudflare Dashboard');
        console.log('   2. 转到 Workers & Pages > D1 > DB');
        console.log('   3. 在控制台中执行:');
        console.log('      ALTER TABLE sales_records ADD COLUMN external_form_display TEXT;');
        console.log('');
        console.log('   方法2: 通过API重新创建表');
        console.log('   1. 备份现有数据（如果有）');
        console.log('   2. 删除并重新创建 sales_records 表');
        console.log('   3. 重新运行同步');
        
        // Step 7: 测试表结构修复的验证方法
        console.log('\n7. 验证方法...');
        console.log('='.repeat(50));
        
        console.log('\n🔍 修复完成后的验证步骤:');
        console.log('   1. 检查表结构: PRAGMA table_info(sales_records);');
        console.log('   2. 重新运行同步: POST /api/sync/sales-records');
        console.log('   3. 验证同步结果是否为 3 条记录');
        console.log('   4. 检查过滤条件是否正确应用');
        
        // Step 8: 创建测试脚本
        const testScript = `
// 测试修复后的销售记录同步
async function testSalesRecordSync() {
    try {
        const response = await fetch('https://progress.yes-ceramics.com/api/sync/sales-records', {
            method: 'POST'
        });
        const result = await response.json();
        console.log('同步结果:', result);
        
        if (result.success && result.syncedCount === 3) {
            console.log('✅ 修复成功！同步了预期的3条记录');
        } else {
            console.log('⚠️  需要进一步检查');
        }
    } catch (error) {
        console.error('测试失败:', error);
    }
}

testSalesRecordSync();
        `.trim();
        
        const testFileName = 'test_sales_sync_fix.js';
        fs.writeFileSync(testFileName, testScript);
        console.log(`✅ 测试脚本已创建: ${testFileName}`);
        
        console.log('\n🎯 下一步操作:');
        console.log('   1. 手动执行表结构修复SQL');
        console.log('   2. 运行测试脚本验证修复效果');
        console.log('   3. 如果成功，更新系统监控指标');
        
    } catch (error) {
        console.error('❌ API修复失败:', error.message);
        console.error(error.stack);
        
        console.log('\n💡 备选方案:');
        console.log('   1. 通过 wrangler CLI 直接操作数据库');
        console.log('   2. 重新部署带有正确表结构的代码');
        console.log('   3. 联系 Cloudflare 技术支持');
    }
}

// 执行API修复
console.log('🚀 开始通过API修复销售记录表结构...\n');
fixSalesTableViaAPI().then(() => {
    console.log('\n✅ API修复准备完成！');
    console.log('\n⚡ 接下来请执行:');
    console.log('   1. 在 Cloudflare Dashboard 中执行 direct_fix_sales_table.sql');
    console.log('   2. 运行 test_sales_sync_fix.js 验证修复效果');
}).catch(error => {
    console.error('\n❌ API修复过程中发生错误:', error);
});