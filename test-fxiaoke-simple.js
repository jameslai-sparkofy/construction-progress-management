// 簡化的 Fxiaoke 測試（使用正確的配置）
const FXIAOKE_CONFIG = {
  appId: 'FSAID_1320691',
  appSecret: 'ec63ff237c5c4a759be36d3a8fb7a3b4',
  permanentCode: '899433A4A04A3B8CB1CC2183DA4B5B48',
  baseUrl: 'https://open.fxiaoke.com'
};

async function testFxiaokeSimple() {
  try {
    console.log('🔍 測試 Fxiaoke Token 獲取...');
    
    const tokenUrl = `${FXIAOKE_CONFIG.baseUrl}/cgi/corpAccessToken/get/V2`;
    console.log(`請求 URL: ${tokenUrl}`);
    console.log(`請求數據:`, {
      appId: FXIAOKE_CONFIG.appId,
      appSecret: FXIAOKE_CONFIG.appSecret.substring(0, 10) + '...',
      permanentCode: FXIAOKE_CONFIG.permanentCode
    });
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Script'
      },
      body: JSON.stringify({
        appId: FXIAOKE_CONFIG.appId,
        appSecret: FXIAOKE_CONFIG.appSecret,
        permanentCode: FXIAOKE_CONFIG.permanentCode
      })
    });

    console.log(`響應狀態: ${response.status} ${response.statusText}`);
    console.log(`響應標頭:`, Object.fromEntries(response.headers.entries()));

    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}`);

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('📄 JSON 響應:', JSON.stringify(data, null, 2));
      
      if (!data.errorCode || data.errorCode === 0) {
        console.log('✅ Token 獲取成功');
        return { success: true, token: data.corpAccessToken, corpId: data.corpId };
      } else {
        console.log('❌ Token 獲取失敗');
        console.log(`錯誤代碼: ${data.errorCode}`);
        console.log(`錯誤訊息: ${data.errorMessage}`);
        return { success: false, error: data.errorMessage };
      }
    } else {
      const text = await response.text();
      console.log('📄 文本響應 (前 500 字符):');
      console.log(text.substring(0, 500));
      console.log('❌ 響應不是 JSON 格式');
      return { success: false, error: '響應格式錯誤' };
    }
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    return { success: false, error: error.message };
  }
}

testFxiaokeSimple().catch(console.error);