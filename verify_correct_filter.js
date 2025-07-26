// 验证正确的销售记录过滤条件
// 基于CSV文件发现，external_form_display__c 的选项值是：無;顯示;其他
// 我们需要过滤 external_form_display__c = "顯示" 的记录

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function verifyCorrectFilter() {
    console.log('🔍 验证销售记录的正确过滤条件');
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
        
        // Step 3: 测试不同的过滤条件
        console.log('3. 测试不同的过滤条件...');
        console.log('='.repeat(50));
        
        const filterTests = [
            { label: '当前错误的过滤条件', value: 'option_displayed__c' },
            { label: '正确的过滤条件（显示）', value: '顯示' },
            { label: '无过滤条件（查看所有）', value: null },
            { label: '過濾條件（無）', value: '無' },
            { label: '過濾條件（其他）', value: '其他' }
        ];
        
        const results = {};
        
        for (const test of filterTests) {
            console.log(`\n测试: ${test.label}`);
            console.log('-'.repeat(40));
            
            try {
                const requestBody = {
                    corpId: corpId,
                    corpAccessToken: token,
                    currentOpenUserId: userId,
                    data: {
                        apiName: "ActiveRecordObj",
                        search_query_info: {
                            limit: 50,
                            offset: 0,
                            orders: [{ fieldName: "create_time", isAsc: "false" }]
                        }
                    }
                };
                
                // 添加过滤条件（如果有）
                if (test.value !== null) {
                    requestBody.data.search_query_info.filters = [
                        {
                            field_name: "external_form_display__c",
                            field_values: [test.value],
                            operator: "EQ"
                        }
                    ];
                }
                
                const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });
                
                const result = await response.json();
                
                if (result.errorCode === 0) {
                    const count = result.data?.dataList?.length || 0;
                    results[test.label] = count;
                    console.log(`✅ 查询成功: 找到 ${count} 条记录`);
                    
                    if (count > 0 && test.value) {
                        const firstRecord = result.data.dataList[0];
                        console.log(`   第一条记录的 external_form_display__c 值: "${firstRecord.external_form_display__c}"`);
                    }
                } else {
                    results[test.label] = `错误: ${result.errorMessage}`;
                    console.log(`❌ 查询失败: ${result.errorMessage}`);
                }
                
            } catch (error) {
                results[test.label] = `异常: ${error.message}`;
                console.log(`❌ 查询异常: ${error.message}`);
            }
            
            // 添加延迟避免API限制
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Step 4: 汇总结果
        console.log('\n4. 汇总测试结果...');
        console.log('='.repeat(50));
        
        console.log('\n📊 各过滤条件的查询结果:');
        Object.entries(results).forEach(([label, count]) => {
            console.log(`   ${label}: ${count}`);
        });
        
        // Step 5: 分析和建议
        console.log('\n5. 分析和建议...');
        console.log('='.repeat(50));
        
        const displayCount = results['正确的过滤条件（显示）'];
        const totalCount = results['无过滤条件（查看所有）'];
        const emptyCount = results['過濾條件（無）'];
        
        console.log('\n📋 当前状况分析:');
        console.log(`   • 总记录数: ${totalCount}`);
        console.log(`   • external_form_display__c = "顯示" 的记录: ${displayCount}`);
        console.log(`   • external_form_display__c = "無" 的记录: ${emptyCount}`);
        
        if (displayCount > 0) {
            console.log('\n✅ 修正建议:');
            console.log('   1. 当前代码使用了错误的过滤值 "option_displayed__c"');
            console.log('   2. 应该修改为 "顯示"');
            console.log(`   3. 修正后只需同步 ${displayCount} 条记录，而不是全部 ${totalCount} 条`);
            console.log(`   4. 可以节省 ${totalCount - displayCount} 条记录的存储空间`);
        } else {
            console.log('\n⚠️  注意事项:');
            console.log('   1. 当前没有 external_form_display__c = "顯示" 的记录');
            console.log('   2. 可能所有记录都标记为 "無"');
            console.log('   3. 需要确认业务逻辑是否需要同步所有记录');
            console.log('   4. 如果需要同步所有记录，应该移除过滤条件');
        }
        
        // Step 6: 查看兴安西相关记录
        console.log('\n6. 查看兴安西相关记录的外部显示状态...');
        console.log('='.repeat(50));
        
        try {
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
                            limit: 100,
                            offset: 0,
                            orders: [{ fieldName: "create_time", isAsc: "false" }]
                        }
                    }
                })
            });
            
            const result = await response.json();
            if (result.errorCode === 0 && result.data?.dataList) {
                const allRecords = result.data.dataList;
                
                // 查找包含"兴安西"的记录
                const xinganxiRecords = allRecords.filter(record => {
                    return Object.values(record).some(value => 
                        value && typeof value === 'string' && value.includes('興安西')
                    );
                });
                
                console.log(`🏢 找到 ${xinganxiRecords.length} 条与兴安西相关的记录`);
                
                if (xinganxiRecords.length > 0) {
                    const displayStats = {};
                    xinganxiRecords.forEach(record => {
                        const value = record.external_form_display__c || '未设置';
                        displayStats[value] = (displayStats[value] || 0) + 1;
                    });
                    
                    console.log('\n兴安西记录的 external_form_display__c 分布:');
                    Object.entries(displayStats).forEach(([value, count]) => {
                        console.log(`   "${value}": ${count} 条`);
                    });
                }
            }
            
        } catch (error) {
            console.log(`❌ 查询兴安西记录失败: ${error.message}`);
        }
        
    } catch (error) {
        console.error('❌ 验证失败:', error.message);
        console.error(error.stack);
    }
}

// 执行验证
console.log('🚀 开始验证销售记录过滤条件...\n');
verifyCorrectFilter().then(() => {
    console.log('\n✅ 验证完成！');
}).catch(error => {
    console.error('\n❌ 验证过程中发生错误:', error);
});