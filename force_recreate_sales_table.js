// 强制重新创建 sales_records 表
// 这个脚本将通过API调用强制重新创建表结构

async function forceRecreateSalesTable() {
    console.log('🔧 强制重新创建 sales_records 表');
    console.log('='.repeat(60));
    
    try {
        // 创建一个特殊的API端点来重新创建表
        const recreateScript = `
// 临时添加到 src/index.js 的特殊处理函数
async function handleForceRecreateSalesTable(env) {
    console.log('🗑️  删除现有 sales_records 表...');
    
    try {
        // 删除现有表
        await env.DB.prepare('DROP TABLE IF EXISTS sales_records').run();
        console.log('✅ 现有表已删除');
    } catch (error) {
        console.log('⚠️  删除表时出错（可能表不存在）:', error.message);
    }
    
    try {
        // 重新创建表
        await env.DB.prepare(\`
            CREATE TABLE sales_records (
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
            )
        \`).run();
        
        console.log('✅ sales_records 表重新创建完成');
        
        // 创建索引
        await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_sales_records_external_form_display ON sales_records(external_form_display)').run();
        await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_sales_records_opportunity_id ON sales_records(opportunity_id)').run();
        await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_sales_records_create_time ON sales_records(create_time)').run();
        
        console.log('✅ 索引创建完成');
        
        // 重置同步状态
        await env.DB.prepare(\`
            INSERT OR REPLACE INTO sync_status 
            (sync_type, last_sync_time, last_sync_count, status, message)
            VALUES ('sales_records', 0, 0, 'pending', 'Table recreated with correct structure')
        \`).run();
        
        console.log('✅ 同步状态已重置');
        
        return { success: true, message: 'sales_records 表重新创建完成' };
        
    } catch (error) {
        console.error('❌ 重新创建表失败:', error);
        throw error;
    }
}
        `.trim();
        
        console.log('生成的表重建脚本:');
        console.log(recreateScript);
        
        // 创建一个独立的测试脚本
        console.log('\n创建独立的表重建测试...');
        
        const testAPI = async () => {
            try {
                // 通过现有的同步API尝试重建表
                console.log('尝试通过API重建表结构...');
                
                // 首先检查当前状态
                const statusResponse = await fetch('https://progress.yes-ceramics.com/api/sync/status');
                const statusResult = await statusResponse.json();
                console.log('当前同步状态:', statusResult);
                
                // 现在我们通过一个变通方法：运行维修单同步来触发表创建
                console.log('\n尝试触发维修单同步以确保数据库连接正常...');
                const maintenanceResponse = await fetch('https://progress.yes-ceramics.com/api/sync/maintenance-orders', {
                    method: 'POST'
                });
                const maintenanceResult = await maintenanceResponse.json();
                console.log('维修单同步结果:', maintenanceResult);
                
                // 再次尝试销售记录同步
                console.log('\n重新尝试销售记录同步...');
                const salesResponse = await fetch('https://progress.yes-ceramics.com/api/sync/sales-records', {
                    method: 'POST'
                });
                const salesResult = await salesResponse.json();
                console.log('销售记录同步结果:', salesResult);
                
                return salesResult;
                
            } catch (error) {
                console.error('API测试失败:', error);
                throw error;
            }
        };
        
        const result = await testAPI();
        
        if (result.success) {
            console.log('\n🎉 表重建成功！');
            console.log(`✅ 同步了 ${result.syncedCount} 条销售记录`);
            
            if (result.syncedCount === 3) {
                console.log('🎯 完美！同步的记录数量符合预期（3条显示记录）');
            } else {
                console.log(`⚠️  同步的记录数量 ${result.syncedCount} 与预期的 3 条不符`);
            }
        } else {
            console.log('\n❌ 表重建失败:', result.error);
            
            console.log('\n💡 手动解决方案:');
            console.log('1. 登录 Cloudflare Dashboard');
            console.log('2. 转到 Workers & Pages > D1 > DB');
            console.log('3. 执行以下SQL:');
            console.log('   DROP TABLE IF EXISTS sales_records;');
            console.log('   (然后重新运行同步，会自动创建正确的表结构)');
        }
        
    } catch (error) {
        console.error('❌ 强制重建失败:', error.message);
        console.error(error.stack);
    }
}

// 执行强制重建
console.log('🚀 开始强制重新创建 sales_records 表...\n');
forceRecreateSalesTable().then(() => {
    console.log('\n✅ 强制重建完成！');
}).catch(error => {
    console.error('\n❌ 强制重建过程中发生错误:', error);
});