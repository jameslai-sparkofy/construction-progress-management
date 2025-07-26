// 检查 external_form_display__c 字段的所有可能值
// 从分析结果看，当前所有记录都是 "option_empty_value__c"
// 需要验证字段定义和可选值

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function checkExternalDisplayOptions() {
    console.log('🔍 检查 external_form_display__c 字段的选项定义');
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
        
        // Step 3: 获取对象字段定义
        console.log('3. 获取 ActiveRecordObj 对象的字段定义...');
        
        const fieldResponse = await fetch(`${CONFIG.baseUrl}/cgi/crm/v2/describe/object`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: corpId,
                corpAccessToken: token,
                currentOpenUserId: userId,
                data: {
                    apiName: "ActiveRecordObj"
                }
            })
        });
        
        const fieldResult = await fieldResponse.json();
        if (fieldResult.errorCode !== 0) {
            throw new Error(`字段定义获取失败: ${fieldResult.errorMessage}`);
        }
        
        console.log('✅ 字段定义获取成功\n');
        
        // Step 4: 查找 external_form_display__c 字段的定义
        console.log('4. 查找 external_form_display__c 字段定义...');
        console.log('='.repeat(50));
        
        const fields = fieldResult.data?.fields || [];
        const externalDisplayField = fields.find(field => field.fieldName === 'external_form_display__c');
        
        if (externalDisplayField) {
            console.log('✅ 找到 external_form_display__c 字段定义:');
            console.log('字段信息:');
            console.log(`   字段名: ${externalDisplayField.fieldName}`);
            console.log(`   字段标签: ${externalDisplayField.fieldLabel}`);
            console.log(`   字段类型: ${externalDisplayField.fieldType}`);
            console.log(`   是否必填: ${externalDisplayField.required ? '是' : '否'}`);
            
            if (externalDisplayField.options && externalDisplayField.options.length > 0) {
                console.log('\n可选值选项:');
                externalDisplayField.options.forEach((option, index) => {
                    console.log(`   ${index + 1}. 值: "${option.value}" | 标签: "${option.label}"`);
                });
            } else {
                console.log('\n❌ 未找到选项定义或字段不是选择类型');
            }
            
            console.log('\n完整字段定义:');
            console.log(JSON.stringify(externalDisplayField, null, 2));
            
        } else {
            console.log('❌ 未找到 external_form_display__c 字段定义');
            
            // 查找可能相关的字段
            const possibleFields = fields.filter(field => {
                const fieldName = field.fieldName.toLowerCase();
                return fieldName.includes('external') || 
                       fieldName.includes('display') || 
                       fieldName.includes('form');
            });
            
            if (possibleFields.length > 0) {
                console.log('\n🔍 找到可能相关的字段:');
                possibleFields.forEach(field => {
                    console.log(`   - ${field.fieldName}: ${field.fieldLabel} (${field.fieldType})`);
                });
            }
        }
        
        // Step 5: 查询实际数据中的所有不同值
        console.log('\n5. 查询实际数据中 external_form_display__c 的所有不同值...');
        console.log('='.repeat(50));
        
        let allValues = new Set();
        let offset = 0;
        const limit = 100;
        let hasMore = true;
        let totalRecords = 0;
        
        while (hasMore && offset < 500) { // 限制查询范围避免过多API调用
            console.log(`   查询 offset=${offset}, limit=${limit}`);
            
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
                if (record.external_form_display__c !== undefined) {
                    allValues.add(record.external_form_display__c);
                }
            });
            
            if (records.length < limit) {
                hasMore = false;
            } else {
                offset += limit;
            }
        }
        
        console.log(`\n📊 统计结果 (基于 ${totalRecords} 条记录):`);
        console.log(`   external_form_display__c 的所有不同值:`);
        
        if (allValues.size > 0) {
            Array.from(allValues).forEach((value, index) => {
                console.log(`   ${index + 1}. "${value}"`);
            });
        } else {
            console.log('   ❌ 未找到任何值');
        }
        
        // Step 6: 基于实际值生成过滤建议
        console.log('\n6. 生成过滤策略建议...');
        console.log('='.repeat(50));
        
        console.log('\n📋 当前发现的情况:');
        console.log(`   • 字段定义: ${externalDisplayField ? '已找到' : '未找到'}`);
        console.log(`   • 实际值数量: ${allValues.size}`);
        console.log(`   • 当前过滤条件: external_form_display__c = "option_displayed__c"`);
        
        if (allValues.has('option_displayed__c')) {
            console.log('\n✅ 过滤条件正确！');
            console.log('   当前代码中的过滤条件 "option_displayed__c" 在数据中存在');
        } else if (allValues.has('option_empty_value__c')) {
            console.log('\n⚠️  需要调整过滤条件！');
            console.log('   建议修改过滤条件为其他值，或者分析是否所有记录都应该同步');
            console.log('   当前所有记录都是 "option_empty_value__c"，可能表示：');
            console.log('   1. 该字段默认值就是 "option_empty_value__c"');
            console.log('   2. 没有记录被标记为 "显示"');
            console.log('   3. 字段值的映射可能不同');
        } else {
            console.log('\n❓ 需要进一步分析');
            console.log('   建议检查字段定义和实际业务逻辑');
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
        console.error(error.stack);
    }
}

// 执行检查
console.log('🚀 开始检查 external_form_display__c 字段选项...\n');
checkExternalDisplayOptions().then(() => {
    console.log('\n✅ 检查完成！');
}).catch(error => {
    console.error('\n❌ 检查过程中发生错误:', error);
});