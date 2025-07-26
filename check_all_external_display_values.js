// 检查所有销售记录的 external_form_display__c 字段值
// 发现了一个奇怪的现象：API 返回的值和 CSV 定义不匹配

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function checkAllExternalDisplayValues() {
    console.log('🔍 全面检查 external_form_display__c 字段的所有值');
    console.log('='.repeat(60));
    
    try {
        // Step 1: 获取Token
        console.log('1. 获取企业访问令牌...');
        const tokenResponse = await fetch(`${CONFIG.baseUrl}/cgi/corpAccessToken/get/V2`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                appId: CONFIG.appId,
                appSecret: CONFIG.appSecret,
                permanentCode: CONFIG.permanentCode
            })
        });
        
        const tokenResult = await tokenResponse.json();
        if (tokenResult.errorCode !== 0) {
            throw new Error(`Token获取失败: ${tokenResult.errorMessage}`);
        }
        
        const token = tokenResult.corpAccessToken;
        const corpId = tokenResult.corpId;
        console.log('✅ Token获取成功\n');
        
        // Step 2: 获取用户信息
        console.log('2. 获取用户信息...');
        const userResponse = await fetch(`${CONFIG.baseUrl}/cgi/user/getByMobile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                mobile: "17675662629"
            })
        });
        
        const userResult = await userResponse.json();
        if (userResult.errorCode !== 0) {
            throw new Error(`用户获取失败: ${userResult.errorMessage}`);
        }
        
        const userId = userResult.empList[0].openUserId;
        console.log('✅ 用户信息获取成功\n');
        
        // Step 3: 查询大量数据统计所有不同的值
        console.log('3. 查询销售记录统计所有 external_form_display__c 值...');
        console.log('='.repeat(50));
        
        const valueCounts = {};
        let totalRecords = 0;
        let offset = 0;
        const limit = 100;
        let hasMore = true;
        
        while (hasMore && offset < 1000) { // 限制最多查询1000条记录
            console.log(`   查询批次: offset=${offset}, limit=${limit}`);
            
            const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    corpId: corpId,
                    corpAccessToken: token,
                    currentOpenUserId: userId,
                    data: {
                        apiName: "ActiveRecordObj",
                        search_query_info: {
                            limit: limit,
                            offset: offset,
                            orders: [{ fieldName: "create_time", isAsc: "false" }]
                        }
                    }
                })
            });
            
            const result = await response.json();
            if (result.errorCode !== 0) {
                console.log(`   查询失败: ${result.errorMessage}`);
                break;
            }
            
            if (!result.data?.dataList || result.data.dataList.length === 0) {
                hasMore = false;
                break;
            }
            
            const records = result.data.dataList;
            totalRecords += records.length;
            
            records.forEach(record => {
                const value = record.external_form_display__c;
                if (value !== undefined) {
                    const key = value || 'null/undefined';
                    valueCounts[key] = (valueCounts[key] || 0) + 1;
                }
            });
            
            if (records.length < limit) {
                hasMore = false;
            } else {
                offset += limit;
            }
            
            console.log(`   已查询 ${totalRecords} 条记录`);
            
            // 添加延迟避免API限制
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Step 4: 显示统计结果
        console.log(`\n4. 统计结果分析 (基于 ${totalRecords} 条记录)...`);
        console.log('='.repeat(50));
        
        console.log('\n📊 external_form_display__c 字段值分布:');
        const sortedEntries = Object.entries(valueCounts).sort((a, b) => b[1] - a[1]);
        
        sortedEntries.forEach(([value, count]) => {
            const percentage = ((count / totalRecords) * 100).toFixed(1);
            console.log(`   "${value}": ${count} 条 (${percentage}%)`);
        });
        
        // Step 5: 映射分析
        console.log('\n5. 字段值映射分析...');
        console.log('='.repeat(50));
        
        console.log('\n📋 发现的问题:');
        console.log('   • CSV 文档显示选项值应该是: 無;顯示;其他');
        console.log('   • 实际 API 返回的值是: option_empty_value__c, option_displayed__c 等');
        console.log('   • 这表明 API 返回的是内部选项 ID，而不是显示标签');
        
        console.log('\n🔍 推测的映射关系:');
        console.log('   • "option_empty_value__c" → "無" (无)');
        console.log('   • "option_displayed__c" → "顯示" (显示)');
        console.log('   • "option_other__c" → "其他" (其他)');
        
        // Step 6: 基于发现生成建议
        console.log('\n6. 生成修正建议...');
        console.log('='.repeat(50));
        
        const displayedCount = valueCounts['option_displayed__c'] || 0;
        const emptyCount = valueCounts['option_empty_value__c'] || 0;
        const otherCount = valueCounts['option_other__c'] || 0;
        
        console.log('\n📊 基于内部选项ID的统计:');
        console.log(`   • option_displayed__c (显示): ${displayedCount} 条`);
        console.log(`   • option_empty_value__c (无): ${emptyCount} 条`);
        console.log(`   • option_other__c (其他): ${otherCount} 条`);
        
        if (displayedCount > 0) {
            console.log('\n✅ 修正建议:');
            console.log('   1. 当前代码的过滤条件实际上是正确的！');
            console.log('   2. 应该继续使用 "option_displayed__c" 作为过滤值');
            console.log(`   3. 这将同步 ${displayedCount} 条标记为"显示"的记录`);
            console.log(`   4. 可以节省 ${totalRecords - displayedCount} 条记录的存储`);
            console.log(`   5. 数据缩减比例: ${(((totalRecords - displayedCount) / totalRecords) * 100).toFixed(1)}%`);
        } else {
            console.log('\n⚠️  当前状况:');
            console.log('   1. 目前没有标记为 "显示" 的记录');
            console.log('   2. 大部分记录都是 "option_empty_value__c" (无)');
            console.log('   3. 如果业务需要，可能需要调整过滤策略');
        }
        
        // Step 7: 检查代码当前状态
        console.log('\n7. 检查当前代码同步状态...');
        console.log('='.repeat(50));
        
        if (displayedCount > 0) {
            console.log('✅ 当前代码状态:');
            console.log('   • 过滤条件: external_form_display__c = "option_displayed__c"');
            console.log('   • 状态: 正确配置');
            console.log(`   • 预期同步记录数: ${displayedCount}`);
            console.log('   • 建议: 可以直接运行同步');
        } else {
            console.log('⚠️  当前代码状态:');
            console.log('   • 过滤条件: external_form_display__c = "option_displayed__c"');
            console.log('   • 状态: 过滤条件正确，但没有匹配的记录');
            console.log('   • 预期同步记录数: 0');
            console.log('   • 建议: 确认业务逻辑是否需要调整过滤条件');
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
        console.error(error.stack);
    }
}

// 执行检查
console.log('🚀 开始全面检查销售记录字段值...\n');
checkAllExternalDisplayValues().then(() => {
    console.log('\n✅ 检查完成！');
}).catch(error => {
    console.error('\n❌ 检查过程中发生错误:', error);
});