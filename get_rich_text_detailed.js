// 查詢所有興安西跟進記錄的富文本內容

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

async function getRichTextDetailed() {
    console.log('=== 查詢所有興安西跟進記錄的富文本內容 ===\n');
    
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
        
        // Step 3: 查詢更多的跟進記錄
        console.log('3. 查詢更多的跟進記錄...\n');
        
        const XINGANXI_OPPORTUNITY_ID = "650fe201d184e50001102aee";
        let allXinganxiRecords = [];
        
        // 分批查詢更多記錄
        let offset = 0;
        let hasMore = true;
        
        while (hasMore && offset < 500) {
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
                            offset: offset,
                            orders: [{fieldName: "create_time", isAsc: "false"}]
                        }
                    }
                })
            });
            
            const result = await response.json();
            
            if (result.errorCode === 0 && result.data) {
                const records = result.data.dataList || [];
                
                // 篩選興安西相關記錄
                records.forEach(record => {
                    if (record.related_object_data && Array.isArray(record.related_object_data)) {
                        const isXinganxi = record.related_object_data.some(obj => 
                            obj.id === XINGANXI_OPPORTUNITY_ID && 
                            obj.describe_api_name === 'NewOpportunityObj'
                        );
                        
                        if (isXinganxi) {
                            allXinganxiRecords.push(record);
                        }
                    }
                });
                
                if (records.length < 100) {
                    hasMore = false;
                } else {
                    offset += 100;
                }
            } else {
                hasMore = false;
            }
        }
        
        console.log(`找到 ${allXinganxiRecords.length} 條興安西相關記錄\n`);
        
        // 按時間排序
        allXinganxiRecords.sort((a, b) => b.create_time - a.create_time);
        
        // 分析每條記錄的富文本內容
        let richTextCount = 0;
        let imageCount = 0;
        let attachmentCount = 0;
        
        allXinganxiRecords.forEach((record, idx) => {
            console.log(`\n==================== 記錄 ${idx + 1} / ${allXinganxiRecords.length} ====================`);
            console.log(`記錄ID: ${record._id}`);
            console.log(`創建時間: ${new Date(record.create_time).toLocaleString()}`);
            console.log(`創建人: ${record.created_by__r?.name || '未知'}`);
            console.log(`外部顯示: ${record.external_form_display__c__r || '否'}`);
            console.log(`類型: ${record.active_record_type__r || '未知'}`);
            
            const content = record.active_record_content || '';
            console.log(`內容長度: ${content.length} 字符`);
            
            if (content.length > 0) {
                // 檢查是否包含HTML標籤
                const hasHTML = content.includes('<') && content.includes('>');
                
                if (hasHTML) {
                    richTextCount++;
                    console.log(`✅ 富文本格式`);
                    
                    // 尋找圖片
                    const imgMatches = content.match(/<img[^>]*>/gi);
                    if (imgMatches) {
                        imageCount += imgMatches.length;
                        console.log(`🖼️ 找到 ${imgMatches.length} 個圖片:`);
                        imgMatches.forEach((img, i) => {
                            console.log(`  圖片 ${i + 1}: ${img}`);
                            
                            // 提取src屬性
                            const srcMatch = img.match(/src\s*=\s*["']([^"']+)["']/i);
                            if (srcMatch) {
                                console.log(`    URL: ${srcMatch[1]}`);
                            }
                            
                            // 提取alt屬性
                            const altMatch = img.match(/alt\s*=\s*["']([^"']+)["']/i);
                            if (altMatch) {
                                console.log(`    說明: ${altMatch[1]}`);
                            }
                        });
                    }
                    
                    // 尋找其他媒體
                    const mediaMatches = content.match(/<(video|audio|object|embed)[^>]*>/gi);
                    if (mediaMatches) {
                        console.log(`📹 找到 ${mediaMatches.length} 個媒體元素:`);
                        mediaMatches.forEach((media, i) => {
                            console.log(`  媒體 ${i + 1}: ${media}`);
                        });
                    }
                    
                    // 尋找連結
                    const linkMatches = content.match(/<a[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi);
                    if (linkMatches) {
                        console.log(`🔗 找到 ${linkMatches.length} 個連結:`);
                        linkMatches.forEach((link, i) => {
                            const hrefMatch = link.match(/href\s*=\s*["']([^"']+)["']/i);
                            if (hrefMatch) {
                                console.log(`  連結 ${i + 1}: ${hrefMatch[1]}`);
                            }
                        });
                    }
                    
                    // 顯示HTML結構概要
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
                        
                        console.log(`📋 HTML標籤統計:`, Object.keys(tagTypes).map(tag => `${tag}(${tagTypes[tag]})`).join(', '));
                    }
                    
                    // 提取並顯示純文字
                    const textContent = content.replace(/<[^>]*>/g, '').trim();
                    if (textContent.length > 0) {
                        const preview = textContent.length > 200 ? textContent.substring(0, 200) + '...' : textContent;
                        console.log(`📝 純文字內容: ${preview}`);
                    }
                    
                } else {
                    console.log(`📄 純文字格式`);
                    
                    // 即使是純文字，也檢查是否包含URL
                    const urlMatches = content.match(/https?:\/\/[^\s<>"]+/gi);
                    if (urlMatches) {
                        console.log(`🌐 找到 ${urlMatches.length} 個URL:`);
                        urlMatches.forEach((url, i) => {
                            console.log(`  URL ${i + 1}: ${url}`);
                        });
                    }
                }
                
                // 檢查文件引用
                const fileKeywords = ['附件', '照片', '圖片', '截圖', '如附件', '詳如附件'];
                const foundKeywords = fileKeywords.filter(keyword => content.includes(keyword));
                if (foundKeywords.length > 0) {
                    attachmentCount++;
                    console.log(`📎 文件引用關鍵字: ${foundKeywords.join(', ')}`);
                }
                
                // 顯示內容預覽
                if (content.length > 100) {
                    const preview = content.substring(0, 100) + '...';
                    console.log(`💬 內容預覽: ${preview}`);
                } else {
                    console.log(`💬 完整內容: ${content}`);
                }
            } else {
                console.log(`❌ 無內容`);
            }
        });
        
        // 統計總結
        console.log(`\n\n=== 📊 統計總結 ===`);
        console.log(`總跟進記錄: ${allXinganxiRecords.length} 條`);
        console.log(`富文本記錄: ${richTextCount} 條`);
        console.log(`包含圖片: ${imageCount} 張`);
        console.log(`提及附件: ${attachmentCount} 條`);
        console.log(`外部顯示: ${allXinganxiRecords.filter(r => r.external_form_display__c__r === '顯示').length} 條`);
        
        // 按創建人統計
        const creatorStats = {};
        allXinganxiRecords.forEach(record => {
            const creator = record.created_by__r?.name || '未知';
            creatorStats[creator] = (creatorStats[creator] || 0) + 1;
        });
        
        console.log(`\n創建人統計:`);
        Object.entries(creatorStats).forEach(([creator, count]) => {
            console.log(`  ${creator}: ${count} 條`);
        });
        
        // 按類型統計
        const typeStats = {};
        allXinganxiRecords.forEach(record => {
            const type = record.active_record_type__r || '未知';
            typeStats[type] = (typeStats[type] || 0) + 1;
        });
        
        console.log(`\n跟進類型統計:`);
        Object.entries(typeStats).forEach(([type, count]) => {
            console.log(`  ${type}: ${count} 條`);
        });
        
        // 找出最可能包含圖片的記錄
        const potentialImageRecords = allXinganxiRecords.filter(record => {
            const content = record.active_record_content || '';
            return content.includes('<img') || 
                   content.includes('照片') || 
                   content.includes('圖片') || 
                   content.includes('截圖') ||
                   content.includes('附件');
        });
        
        if (potentialImageRecords.length > 0) {
            console.log(`\n🎯 最可能包含圖片的記錄 (${potentialImageRecords.length} 條):`);
            potentialImageRecords.forEach((record, idx) => {
                console.log(`\n${idx + 1}. ${new Date(record.create_time).toLocaleDateString()}`);
                console.log(`   創建人: ${record.created_by__r?.name}`);
                console.log(`   外部顯示: ${record.external_form_display__c__r || '否'}`);
                console.log(`   內容: ${(record.active_record_content || '').substring(0, 100)}...`);
            });
        }
        
    } catch (error) {
        console.error('❌ 查詢失敗:', error.message);
    }
}

// 執行查詢
console.log('開始詳細查詢富文本內容...\n');
getRichTextDetailed().then(() => {
    console.log('\n詳細查詢完成！');
}).catch(error => {
    console.error('查詢過程中發生錯誤:', error);
});