// 通过API部署销售记录表修复
// 这个脚本将修复后的代码部署到生产环境

async function deploySalesFix() {
    console.log('🚀 部署销售记录表修复到生产环境');
    console.log('='.repeat(60));
    
    try {
        // Step 1: 检查生产环境状态
        console.log('1. 检查生产环境当前状态...');
        
        const statusResponse = await fetch('https://progress.yes-ceramics.com/api/sync/status');
        const statusResult = await statusResponse.json();
        console.log('✅ 生产环境状态:', statusResult);
        
        // Step 2: 部署修复后的代码
        console.log('\n2. 部署修复后的代码...');
        console.log('='.repeat(50));
        
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        try {
            console.log('正在部署到生产环境...');
            const { stdout, stderr } = await execAsync('npx wrangler deploy --env production');
            console.log('部署输出:', stdout);
            if (stderr) {
                console.log('部署警告:', stderr);
            }
            console.log('✅ 代码部署完成');
        } catch (error) {
            console.log('❌ 代码部署失败:', error.message);
            throw error;
        }
        
        // Step 3: 等待部署生效
        console.log('\n3. 等待部署生效...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Step 4: 测试销售记录同步
        console.log('\n4. 测试销售记录同步...');
        console.log('='.repeat(50));
        
        console.log('尝试触发销售记录同步...');
        const syncResponse = await fetch('https://progress.yes-ceramics.com/api/sync/sales-records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const syncResult = await syncResponse.json();
        console.log('同步结果:', JSON.stringify(syncResult, null, 2));
        
        if (syncResult.success) {
            console.log(`✅ 同步成功！已同步 ${syncResult.syncedCount} 条记录`);
            
            // 验证同步的记录数是否符合预期（应该是3条）
            if (syncResult.syncedCount === 3) {
                console.log('🎉 完美！同步的记录数量符合预期（3条显示记录）');
            } else if (syncResult.syncedCount < 3) {
                console.log('⚠️  同步的记录数少于预期，可能是过滤条件过于严格');
            } else {
                console.log('⚠️  同步的记录数多于预期，可能需要调整过滤条件');
            }
        } else {
            console.log('❌ 同步失败:', syncResult.error);
        }
        
        // Step 5: 验证最终状态
        console.log('\n5. 验证最终状态...');
        console.log('='.repeat(50));
        
        const finalStatusResponse = await fetch('https://progress.yes-ceramics.com/api/sync/status');
        const finalStatusResult = await finalStatusResponse.json();
        console.log('最终状态:', JSON.stringify(finalStatusResult, null, 2));
        
        // Step 6: 生成结果报告
        console.log('\n6. 结果报告...');
        console.log('='.repeat(50));
        
        console.log('\n📊 修复结果总结:');
        console.log('   • 代码部署: ✅ 成功');
        console.log(`   • 销售记录同步: ${syncResult.success ? '✅ 成功' : '❌ 失败'}`);
        
        if (syncResult.success) {
            console.log(`   • 同步记录数: ${syncResult.syncedCount} 条`);
            console.log(`   • 过滤效果: ${syncResult.syncedCount === 3 ? '✅ 完美' : '⚠️ 需要检查'}`);
            
            const reduction = syncResult.totalCount ? 
                (((syncResult.totalCount - syncResult.syncedCount) / syncResult.totalCount) * 100).toFixed(1) + '%' : 
                '未知';
            console.log(`   • 数据缩减: ${reduction}`);
        }
        
        console.log('\n🎯 接下来可以做的:');
        console.log('   1. 验证兴安西项目的销售记录是否正确显示');
        console.log('   2. 检查系统监控指标是否正确更新');
        console.log('   3. 测试表单数据保存和CRM同步功能');
        
    } catch (error) {
        console.error('❌ 部署修复失败:', error.message);
        console.error(error.stack);
        
        console.log('\n💡 故障排除建议:');
        console.log('   1. 检查 wrangler 认证是否有效');
        console.log('   2. 确认生产环境域名配置正确');
        console.log('   3. 手动通过 Cloudflare Dashboard 检查D1数据库状态');
        console.log('   4. 查看 Workers 日志了解详细错误信息');
    }
}

// 执行部署修复
console.log('🚀 开始部署销售记录表修复...\n');
deploySalesFix().then(() => {
    console.log('\n✅ 部署修复完成！');
}).catch(error => {
    console.error('\n❌ 部署修复过程中发生错误:', error);
});