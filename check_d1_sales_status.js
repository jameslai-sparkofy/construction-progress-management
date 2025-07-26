// 检查当前 D1 数据库中 sales_records 表的状态
// 确认需要清理多少不符合过滤条件的记录

const CONFIG = {
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    DATABASE_ID: process.env.CLOUDFLARE_DATABASE_ID
};

async function checkD1SalesStatus() {
    console.log('🔍 检查 D1 数据库中 sales_records 表的状态');
    console.log('='.repeat(60));
    console.log('注意：此脚本需要本地安装 wrangler 并配置好认证');
    console.log('='.repeat(60));
    
    try {
        // 检查必要的环境变量或使用 wrangler
        console.log('1. 检查 Cloudflare 连接...');
        
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        // 检查 wrangler 是否可用
        try {
            await execAsync('wrangler --version');
            console.log('✅ wrangler CLI 可用');
        } catch (error) {
            throw new Error('wrangler CLI 不可用，请确保已安装并配置好认证');
        }
        
        // Step 2: 查询当前 sales_records 表的记录数量
        console.log('\n2. 查询 sales_records 表的记录数量...');
        console.log('='.repeat(50));
        
        const countQuery = "SELECT COUNT(*) as total_count FROM sales_records";
        console.log('执行查询:', countQuery);
        
        try {
            const { stdout: countResult } = await execAsync(`wrangler d1 execute DB --command "${countQuery}"`);
            console.log('查询结果:', countResult);
            
            // 尝试解析结果
            const lines = countResult.trim().split('\n');
            const resultLine = lines.find(line => line.includes('total_count') || /^\d+$/.test(line.trim()));
            
            if (resultLine) {
                const match = resultLine.match(/\d+/);
                const totalCount = match ? parseInt(match[0]) : 0;
                console.log(`✅ 当前 sales_records 表总记录数: ${totalCount}`);
            }
        } catch (error) {
            console.log('❌ 查询记录数量失败:', error.message);
        }
        
        // Step 3: 查询 external_form_display 字段的分布
        console.log('\n3. 查询 external_form_display 字段分布...');
        console.log('='.repeat(50));
        
        const distributionQuery = "SELECT external_form_display, COUNT(*) as count FROM sales_records GROUP BY external_form_display";
        console.log('执行查询:', distributionQuery);
        
        try {
            const { stdout: distributionResult } = await execAsync(`wrangler d1 execute DB --command "${distributionQuery}"`);
            console.log('查询结果:', distributionResult);
        } catch (error) {
            console.log('❌ 查询字段分布失败:', error.message);
        }
        
        // Step 4: 查询符合过滤条件的记录数量
        console.log('\n4. 查询符合过滤条件的记录数量...');
        console.log('='.repeat(50));
        
        const filteredQuery = "SELECT COUNT(*) as filtered_count FROM sales_records WHERE external_form_display = 'option_displayed__c'";
        console.log('执行查询:', filteredQuery);
        
        try {
            const { stdout: filteredResult } = await execAsync(`wrangler d1 execute DB --command "${filteredQuery}"`);
            console.log('查询结果:', filteredResult);
        } catch (error) {
            console.log('❌ 查询过滤记录失败:', error.message);
        }
        
        // Step 5: 查询同步状态
        console.log('\n5. 查询同步状态...');
        console.log('='.repeat(50));
        
        const syncStatusQuery = "SELECT * FROM sync_status WHERE sync_type = 'sales_records'";
        console.log('执行查询:', syncStatusQuery);
        
        try {
            const { stdout: syncResult } = await execAsync(`wrangler d1 execute DB --command "${syncStatusQuery}"`);
            console.log('查询结果:', syncResult);
        } catch (error) {
            console.log('❌ 查询同步状态失败:', error.message);
        }
        
        // Step 6: 检查表结构
        console.log('\n6. 检查 sales_records 表结构...');
        console.log('='.repeat(50));
        
        const schemaQuery = "PRAGMA table_info(sales_records)";
        console.log('执行查询:', schemaQuery);
        
        try {
            const { stdout: schemaResult } = await execAsync(`wrangler d1 execute DB --command "${schemaQuery}"`);
            console.log('查询结果:', schemaResult);
        } catch (error) {
            console.log('❌ 查询表结构失败:', error.message);
        }
        
        // Step 7: 生成清理建议
        console.log('\n7. 生成清理和同步建议...');
        console.log('='.repeat(50));
        
        console.log('\n📋 基于分析结果的建议:');
        console.log('   1. 当前代码的过滤条件是正确的: external_form_display__c = "option_displayed__c"');
        console.log('   2. 预期只需同步 3 条记录（基于CRM分析）');
        console.log('   3. 如果 D1 中有超过 3 条记录，说明之前同步了不符合条件的数据');
        console.log('   4. 建议操作：');
        console.log('      a. 清理 D1 中不符合条件的记录');
        console.log('      b. 重新运行同步以确保数据一致性');
        console.log('      c. 更新监控指标以反映正确的记录数量');
        
        console.log('\n🧹 清理命令建议:');
        console.log('   -- 删除不符合条件的记录:');
        console.log('   DELETE FROM sales_records WHERE external_form_display != "option_displayed__c";');
        console.log('   ');
        console.log('   -- 或者清空表重新同步:');
        console.log('   DELETE FROM sales_records;');
        console.log('   UPDATE sync_status SET last_sync_time = 0, last_sync_count = 0, status = "pending" WHERE sync_type = "sales_records";');
        
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
        
        console.log('\n💡 替代方案:');
        console.log('   如果无法使用 wrangler 查询，可以通过以下方式检查:');
        console.log('   1. 访问 Cloudflare Dashboard > Workers & Pages > D1');
        console.log('   2. 打开 DB 数据库');
        console.log('   3. 在控制台中执行上述 SQL 查询');
        console.log('   4. 或者通过 API 端点检查同步状态');
    }
}

// 执行检查
console.log('🚀 开始检查 D1 sales_records 表状态...\n');
checkD1SalesStatus().then(() => {
    console.log('\n✅ 检查完成！');
}).catch(error => {
    console.error('\n❌ 检查过程中发生错误:', error);
});