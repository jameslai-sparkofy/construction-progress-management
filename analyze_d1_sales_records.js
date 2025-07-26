// 分析 D1 数据库中 sales_records 表的 external_form_display 字段分布
// 这个脚本将帮助我们了解当前数据库中的数据状况

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function analyzeD1SalesRecords() {
    console.log('🔍 开始分析 D1 数据库中 sales_records 表的数据分布');
    console.log('='.repeat(60));
    
    try {
        // Step 1: 获取Token用于CRM API查询
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
        
        // Step 3: 查询一小批 ActiveRecordObj 数据来分析字段结构
        console.log('3. 查询 ActiveRecordObj 数据进行字段分析...');
        
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
                        limit: 50,
                        offset: 0,
                        orders: [{ fieldName: "create_time", isAsc: "false" }]
                    }
                }
            })
        });
        
        const result = await response.json();
        if (result.errorCode !== 0) {
            throw new Error(`查询失败: ${result.errorMessage}`);
        }
        
        if (!result.data?.dataList || result.data.dataList.length === 0) {
            console.log('❌ 没有找到任何 ActiveRecordObj 记录');
            return;
        }
        
        const records = result.data.dataList;
        console.log(`✅ 查询到 ${records.length} 条记录用于分析\n`);
        
        // Step 4: 分析字段结构
        console.log('4. 分析字段结构...');
        console.log('='.repeat(50));
        
        if (records.length > 0) {
            const firstRecord = records[0];
            console.log('\n📋 第一条记录的所有字段:');
            
            const allFields = Object.keys(firstRecord);
            console.log(`字段总数: ${allFields.length}`);
            
            // 查找与外部显示相关的字段
            const externalFields = allFields.filter(field => {
                const lowerField = field.toLowerCase();
                return lowerField.includes('external') || 
                       lowerField.includes('display') ||
                       lowerField.includes('form') ||
                       lowerField.includes('option');
            });
            
            console.log('\n🔍 可能的外部显示相关字段:');
            if (externalFields.length > 0) {
                externalFields.forEach(field => {
                    const value = firstRecord[field];
                    console.log(`   - ${field}: "${value}"`);
                });
            } else {
                console.log('   ❌ 未找到明显的外部显示相关字段');
            }
            
            // 显示所有字段和它们的值
            console.log('\n📄 第一条记录的完整字段列表:');
            Object.entries(firstRecord).forEach(([field, value]) => {
                if (typeof value === 'string' && value.length > 50) {
                    console.log(`   ${field}: "${value.substring(0, 50)}..."`);
                } else {
                    console.log(`   ${field}: "${value}"`);
                }
            });
        }
        
        // Step 5: 分析 external_form_display__c 字段的分布
        console.log('\n5. 分析 external_form_display__c 字段的分布...');
        console.log('='.repeat(50));
        
        const displayStats = {};
        let hasExternalDisplayField = false;
        
        records.forEach(record => {
            if (record.external_form_display__c !== undefined) {
                hasExternalDisplayField = true;
                const value = record.external_form_display__c || '空值';
                displayStats[value] = (displayStats[value] || 0) + 1;
            }
        });
        
        if (hasExternalDisplayField) {
            console.log('\n📊 external_form_display__c 字段值分布:');
            Object.entries(displayStats)
                .sort((a, b) => b[1] - a[1])
                .forEach(([value, count]) => {
                    const percentage = ((count / records.length) * 100).toFixed(1);
                    console.log(`   "${value}": ${count} 条 (${percentage}%)`);
                });
        } else {
            console.log('❌ 在查询的记录中未找到 external_form_display__c 字段');
        }
        
        // Step 6: 查询 "显示" 值的记录
        console.log('\n6. 专门查询 external_form_display__c = "显示" 的记录...');
        console.log('='.repeat(50));
        
        const displayResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/data/query`, {
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
                        filters: [
                            {
                                field_name: "external_form_display__c",
                                field_values: ["顯示"],
                                operator: "EQ"
                            }
                        ],
                        orders: [{ fieldName: "create_time", isAsc: "false" }]
                    }
                }
            })
        });
        
        const displayResult = await displayResponse.json();
        if (displayResult.errorCode === 0 && displayResult.data?.dataList) {
            const displayRecords = displayResult.data.dataList;
            console.log(`✅ 找到 ${displayRecords.length} 条 external_form_display__c = "顯示" 的记录`);
            
            if (displayRecords.length > 0) {
                console.log('\n第一条 "顯示" 记录示例:');
                const firstDisplayRecord = displayRecords[0];
                Object.entries(firstDisplayRecord).forEach(([field, value]) => {
                    if (typeof value === 'string' && value.length > 50) {
                        console.log(`   ${field}: "${value.substring(0, 50)}..."`);
                    } else {
                        console.log(`   ${field}: "${value}"`);
                    }
                });
            }
        } else {
            console.log(`❌ 查询 "顯示" 记录失败: ${displayResult.errorMessage || '未知错误'}`);
        }
        
        // Step 7: 生成迁移建议
        console.log('\n7. 生成迁移策略建议...');
        console.log('='.repeat(50));
        
        const totalDisplayRecords = displayResult.data?.dataList?.length || 0;
        
        console.log('\n📋 当前状况分析:');
        console.log(`   • 总记录数（样本）: ${records.length}`);
        console.log(`   • 有 external_form_display__c 字段的记录: ${hasExternalDisplayField ? '是' : '否'}`);
        console.log(`   • external_form_display__c = "顯示" 的记录数: ${totalDisplayRecords}`);
        
        if (totalDisplayRecords > 0) {
            console.log('\n✅ 迁移策略建议:');
            console.log('   1. 当前代码已正确配置过滤条件');
            console.log('   2. 使用 external_form_display__c = "顯示" 过滤');
            console.log(`   3. 预计只需同步约 ${totalDisplayRecords} 条记录（基于当前样本估算）`);
            console.log('   4. 建议重新运行同步以应用过滤条件');
        } else {
            console.log('\n⚠️  注意事项:');
            console.log('   1. 可能字段值不是 "顯示" 而是其他值');
            console.log('   2. 建议检查实际的字段值选项');
            console.log('   3. 可能需要调整过滤条件');
        }
        
    } catch (error) {
        console.error('❌ 分析失败:', error.message);
        console.error(error.stack);
    }
}

// 执行分析
console.log('🚀 开始 D1 销售记录数据分析...\n');
analyzeD1SalesRecords().then(() => {
    console.log('\n✅ 分析完成！');
}).catch(error => {
    console.error('\n❌ 分析过程中发生错误:', error);
});