// CRM API 代理服務器 - 用固定 IP 的 VPS 部署
// 解決 Cloudflare Workers 動態 IP 問題

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const CONFIG = {
    appId: "FSAID_1320691",
    appSecret: "ec63ff237c5c4a759be36d3a8fb7a3b4",
    permanentCode: "899433A4A04A3B8CB1CC2183DA4B5B48",
    baseUrl: "https://open.fxiaoke.com"
};

// 獲取 Fxiaoke Token
async function getFxiaokeToken() {
    try {
        const response = await fetch(`${CONFIG.baseUrl}/cgi/corpAccessToken/get/V2`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                appId: CONFIG.appId,
                appSecret: CONFIG.appSecret,
                permanentCode: CONFIG.permanentCode
            })
        });
        
        const result = await response.json();
        if (result.errorCode !== 0) {
            throw new Error(result.errorMessage);
        }
        
        // 獲取用戶信息
        const userResponse = await fetch(`${CONFIG.baseUrl}/cgi/user/getByMobile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                corpId: result.corpId,
                corpAccessToken: result.corpAccessToken,
                mobile: "17675662629"
            })
        });
        
        const userResult = await userResponse.json();
        if (userResult.errorCode !== 0) {
            throw new Error(userResult.errorMessage);
        }
        
        return {
            success: true,
            token: result.corpAccessToken,
            corpId: result.corpId,
            userId: userResult.empList[0].openUserId
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// 代理所有 CRM API 請求
app.all('/api/crm/*', async (req, res) => {
    try {
        const { token, corpId, userId } = await getFxiaokeToken();
        if (!token) {
            return res.status(500).json({ error: 'Token 獲取失敗' });
        }
        
        const endpoint = req.path.replace('/api/crm/', '');
        let apiResponse;
        
        switch (endpoint) {
            case 'opportunities':
                apiResponse = await queryOpportunities(token, corpId, userId);
                break;
            case 'sales-records':
                apiResponse = await querySalesRecords(token, corpId, userId);
                break;
            case 'sites':
                apiResponse = await querySites(token, corpId, userId);
                break;
            case 'maintenance-orders':
                apiResponse = await queryMaintenanceOrders(token, corpId, userId);
                break;
            default:
                return res.status(404).json({ error: 'API 端點不存在' });
        }
        
        res.json(apiResponse);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 各種查詢函數（與 Worker 中相同的實作）
async function queryOpportunities(token, corpId, userId) {
    const response = await fetch(`${CONFIG.baseUrl}/cgi/crm/data/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            corpId, corpAccessToken: token, currentOpenUserId: userId,
            apiName: "crm.data.query",
            data: {
                dataType: "OpportunityObj",
                search_query_info: { limit: 50, offset: 0 }
            }
        })
    });
    const result = await response.json();
    // 處理結果...
    return { success: true, data: result.data?.dataList || [] };
}

app.listen(3000, () => {
    console.log('🚀 CRM 代理服務器運行在 http://localhost:3000');
    console.log('💡 將此服務器的 IP 加入 Fxiaoke 白名單即可');
});