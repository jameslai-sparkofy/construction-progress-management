// 查詢跟進記錄的富文本內容（包含圖片）

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function getRichTextContent() {
    console.log('=== 查詢跟進記錄的富文本內容 ===\n');
    
    try {
        // Step 1: 獲取Token
        console.log('1. 獲取企業訪問令牌...');
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
            throw new Error(`Token獲取失敗: ${tokenResult.errorMessage}`);
        }
        
        const token = tokenResult.corpAccessToken;
        const corpId = tokenResult.corpId;
        console.log('✅ Token獲取成功\n');
        
        // Step 2: 獲取用戶信息
        console.log('2. 獲取用戶信息...');
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
            throw new Error(`用戶獲取失敗: ${userResult.errorMessage}`);
        }
        
        const userId = userResult.empList[0].openUserId;
        console.log('✅ 用戶信息獲取成功\n');
        
        // Step 3: 查詢勝興-興安西-2024的跟進記錄
        console.log('3. 查詢富文本跟進記錄...\n');
        
        const XINGANXI_OPPORTUNITY_ID = "650fe201d184e50001102aee";
        
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
                        orders: [{fieldName: "create_time", isAsc: "false"}]
                    }
                }
            })
        });
        
        const result = await response.json();
        
        if (result.errorCode !== 0) {
            throw new Error(`查詢失敗: ${result.errorMessage}`);
        }
        
        const records = result.data.dataList || [];
        
        // 篩選出興安西相關的記錄
        const xinganxiRecords = records.filter(record => {
            if (record.related_object_data && Array.isArray(record.related_object_data)) {
                return record.related_object_data.some(obj => 
                    obj.id === XINGANXI_OPPORTUNITY_ID && 
                    obj.describe_api_name === 'NewOpportunityObj'
                );
            }
            return false;
        });
        
        console.log(`找到 ${xinganxiRecords.length} 條興安西相關記錄\n`);
        
        // 分析每條記錄的富文本內容
        xinganxiRecords.forEach((record, idx) => {
            console.log(`\n==================== 記錄 ${idx + 1} ====================`);
            console.log(`記錄ID: ${record._id}`);
            console.log(`創建時間: ${new Date(record.create_time).toLocaleString()}`);
            console.log(`創建人: ${record.created_by__r?.name || '未知'}`);
            console.log(`外部顯示: ${record.external_form_display__c__r || '否'}`);
            console.log(`類型: ${record.active_record_type__r || '未知'}`);
            
            console.log(`\n--- 富文本內容 (active_record_content) ---`);
            const content = record.active_record_content;
            
            if (!content) {
                console.log('無內容');
            } else {
                console.log('原始內容:');
                console.log(content);
                
                // 檢查是否包含HTML標籤
                if (content.includes('<') && content.includes('>')) {
                    console.log('\n✅ 包含HTML標籤，是富文本格式');
                    
                    // 尋找圖片標籤
                    const imgMatches = content.match(/<img[^>]*>/gi);
                    if (imgMatches) {
                        console.log(`\n🖼️ 找到 ${imgMatches.length} 個圖片標籤:`);
                        imgMatches.forEach((img, i) => {
                            console.log(`圖片 ${i + 1}: ${img}`);
                            
                            // 提取src屬性
                            const srcMatch = img.match(/src\s*=\s*["']([^"']+)["']/i);
                            if (srcMatch) {
                                console.log(`  圖片URL: ${srcMatch[1]}`);
                            }
                        });
                    }
                    
                    // 尋找其他媒體標籤
                    const mediaMatches = content.match(/<(video|audio|object|embed)[^>]*>/gi);
                    if (mediaMatches) {
                        console.log(`\n📹 找到 ${mediaMatches.length} 個媒體標籤:`);
                        mediaMatches.forEach((media, i) => {
                            console.log(`媒體 ${i + 1}: ${media}`);
                        });
                    }
                    
                    // 尋找連結標籤
                    const linkMatches = content.match(/<a[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi);
                    if (linkMatches) {
                        console.log(`\n🔗 找到 ${linkMatches.length} 個連結:`);
                        linkMatches.forEach((link, i) => {
                            console.log(`連結 ${i + 1}: ${link}`);
                            
                            // 提取href屬性
                            const hrefMatch = link.match(/href\s*=\s*["']([^"']+)["']/i);
                            if (hrefMatch) {
                                console.log(`  連結URL: ${hrefMatch[1]}`);
                            }
                        });
                    }
                    
                    // 提取純文字內容
                    const textContent = content.replace(/<[^>]*>/g, '').trim();
                    if (textContent) {
                        console.log(`\n📝 純文字內容:`);
                        console.log(textContent);
                    }
                    
                } else {
                    console.log('\n❌ 純文字格式，無HTML標籤');
                }
                
                // 檢查是否包含URL
                const urlMatches = content.match(/https?:\/\/[^\s<>"]+/gi);
                if (urlMatches) {
                    console.log(`\n🌐 找到 ${urlMatches.length} 個URL:`);
                    urlMatches.forEach((url, i) => {
                        console.log(`URL ${i + 1}: ${url}`);
                    });
                }
                
                // 檢查是否包含文件引用
                const fileReferences = [
                    /如附件/g,
                    /詳如附件/g,
                    /附件/g,
                    /照片/g,
                    /圖片/g,
                    /截圖/g,
                    /\.(jpg|jpeg|png|gif|bmp|pdf|doc|docx|xls|xlsx)/gi
                ];
                
                let hasFileReference = false;
                fileReferences.forEach(regex => {
                    const matches = content.match(regex);
                    if (matches) {
                        hasFileReference = true;
                        console.log(`\n📎 找到文件引用: ${matches.join(', ')}`);
                    }
                });
                
                if (!hasFileReference) {
                    console.log('\n📎 未找到明顯的文件引用');
                }
            }
            
            console.log('\n' + '='.repeat(60));
        });
        
        // 特別查看外部顯示的記錄
        const externalRecords = xinganxiRecords.filter(record => 
            record.external_form_display__c__r === '顯示'
        );
        
        if (externalRecords.length > 0) {
            console.log(`\n\n🌐 外部顯示記錄詳細分析 (${externalRecords.length} 條):`);
            
            externalRecords.forEach((record, idx) => {
                console.log(`\n外部記錄 ${idx + 1}:`);
                console.log(`時間: ${new Date(record.create_time).toLocaleString()}`);
                console.log(`創建人: ${record.created_by__r?.name}`);
                
                const content = record.active_record_content || '';
                console.log(`內容長度: ${content.length} 字符`);
                
                // 詳細分析HTML結構
                if (content.includes('<') && content.includes('>')) {
                    console.log('HTML結構分析:');
                    
                    // 統計不同類型的HTML標籤
                    const tagTypes = {};
                    const tagMatches = content.match(/<\/?[^>]+>/gi);
                    if (tagMatches) {
                        tagMatches.forEach(tag => {
                            const tagName = tag.match(/<\/?(\w+)/);
                            if (tagName) {
                                const name = tagName[1].toLowerCase();
                                tagTypes[name] = (tagTypes[name] || 0) + 1;
                            }
                        });
                        
                        console.log('HTML標籤統計:');
                        Object.entries(tagTypes).forEach(([tag, count]) => {
                            console.log(`  ${tag}: ${count} 個`);
                        });
                    }
                }
            });
        }
        
    } catch (error) {
        console.error('❌ 查詢失敗:', error.message);
    }
}

// 執行查詢
console.log('開始查詢富文本內容...\n');
getRichTextContent().then(() => {
    console.log('\n查詢完成！');
}).catch(error => {
    console.error('查詢過程中發生錯誤:', error);
});