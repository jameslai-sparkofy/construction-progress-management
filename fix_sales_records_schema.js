// 修复 sales_records 表的约束问题
// 确保 opportunity_id 字段允许为 NULL

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function fixSalesRecordsSchema() {
    console.log('🔧 修复 sales_records 表的约束问题');
    console.log('='.repeat(60));
    
    try {
        // Step 1: 通过API检查当前表结构
        console.log('1. 检查当前数据库状态...');
        
        const response = await fetch('https://progress.yes-ceramics.com/api/database/ActiveRecordObj?limit=1', {
            method: 'GET',
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ API连接正常');
        } else {
            console.log('⚠️  API连接异常，继续尝试修复');
        }
        
        // Step 2: 创建修复脚本
        console.log('\n2. 生成表结构修复脚本...');
        console.log('='.repeat(50));
        
        const fixScript = `
-- 修复 sales_records 表结构
-- 步骤 1: 备份现有数据（如果存在）
CREATE TABLE IF NOT EXISTS sales_records_backup AS SELECT * FROM sales_records;

-- 步骤 2: 删除现有表
DROP TABLE IF EXISTS sales_records;

-- 步骤 3: 重新创建表，确保 opportunity_id 允许为 NULL
CREATE TABLE sales_records (
    id TEXT PRIMARY KEY,
    name TEXT,
    opportunity_id TEXT NULL, -- 明确标记为可以为 NULL
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

-- 步骤 4: 恢复数据（如果备份表存在）
INSERT OR IGNORE INTO sales_records 
SELECT * FROM sales_records_backup 
WHERE EXISTS (SELECT name FROM sqlite_master WHERE type='table' AND name='sales_records_backup');

-- 步骤 5: 清理备份表
DROP TABLE IF EXISTS sales_records_backup;

-- 步骤 6: 创建索引
CREATE INDEX IF NOT EXISTS idx_sales_records_opportunity_id ON sales_records(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sales_records_record_type ON sales_records(record_type);
CREATE INDEX IF NOT EXISTS idx_sales_records_create_time ON sales_records(record_time);
CREATE INDEX IF NOT EXISTS idx_sales_records_synced_at ON sales_records(synced_at);
CREATE INDEX IF NOT EXISTS idx_sales_records_external_form_display ON sales_records(external_form_display);

-- 步骤 7: 更新或创建同步状态记录
INSERT OR REPLACE INTO sync_status (sync_type, last_sync_time, last_sync_count, status, message)
VALUES ('sales_records', 0, 0, 'pending', 'Table recreated, ready for sync with NULL-safe opportunity_id');
        `.trim();
        
        console.log('修复脚本内容:');
        console.log(fixScript);
        
        // Step 3: 提供手动执行指南
        console.log('\n3. 执行指南...');
        console.log('='.repeat(50));
        
        console.log('\n📋 手动执行步骤:');
        console.log('   方法1: 使用 wrangler CLI (推荐)');
        console.log('   1. 将上述脚本保存为 fix_sales_records.sql');
        console.log('   2. 执行: wrangler d1 execute DB --file=fix_sales_records.sql --remote');
        console.log('');
        console.log('   方法2: 使用 Cloudflare Dashboard');
        console.log('   1. 登录 Cloudflare Dashboard');
        console.log('   2. 转到 Workers & Pages > D1');
        console.log('   3. 选择 DB 数据库');
        console.log('   4. 在控制台中逐条执行上述 SQL 语句');
        console.log('');
        console.log('   方法3: 通过 API 批量操作 (暂不支持)');
        
        // Step 4: 创建SQL文件
        console.log('\n4. 创建修复SQL文件...');
        const fs = require('fs');
        const sqlFileName = 'fix_sales_records.sql';
        
        fs.writeFileSync(sqlFileName, fixScript);
        console.log(`✅ 修复脚本已保存为: ${sqlFileName}`);
        
        // Step 5: 验证修复后的预期结果
        console.log('\n5. 预期修复结果...');
        console.log('='.repeat(50));
        
        console.log('\n🎯 修复完成后的预期状态:');
        console.log('   • sales_records 表已重新创建');
        console.log('   • opportunity_id 字段明确允许 NULL 值');
        console.log('   • 所有索引已重新创建');
        console.log('   • sync_status 表中的状态重置为 pending');
        console.log('');
        console.log('🔄 后续步骤:');
        console.log('   1. 执行修复脚本');
        console.log('   2. 重新运行销售记录同步');
        console.log('   3. 验证只同步了 3 条 option_displayed__c 记录');
        
        // Step 6: 创建验证脚本
        console.log('\n6. 创建验证脚本...');
        
        const verifyScript = `
-- 验证修复结果
SELECT 'Table exists' as status, COUNT(*) as record_count FROM sales_records;
SELECT 'Schema check' as status, sql FROM sqlite_master WHERE type='table' AND name='sales_records';
SELECT 'Sync status' as status, * FROM sync_status WHERE sync_type = 'sales_records';
        `.trim();
        
        const verifyFileName = 'verify_sales_records_fix.sql';
        fs.writeFileSync(verifyFileName, verifyScript);
        console.log(`✅ 验证脚本已保存为: ${verifyFileName}`);
        
    } catch (error) {
        console.error('❌ 修复脚本生成失败:', error.message);
        console.error(error.stack);
    }
}

// 执行修复
console.log('🚀 开始生成 sales_records 表修复脚本...\n');
fixSalesRecordsSchema().then(() => {
    console.log('\n✅ 修复脚本生成完成！');
    console.log('\n⚡ 接下来请执行:');
    console.log('   wrangler d1 execute DB --file=fix_sales_records.sql --remote');
}).catch(error => {
    console.error('\n❌ 修复脚本生成过程中发生错误:', error);
});