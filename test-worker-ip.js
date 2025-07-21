// 測試 Cloudflare Worker 的外部 IP
export default {
  async fetch(request, env, ctx) {
    try {
      // 方法1：使用 httpbin.org 獲取 IP
      const ipResponse1 = await fetch('https://httpbin.org/ip');
      const ipData1 = await ipResponse1.json();
      
      // 方法2：使用 ifconfig.me
      const ipResponse2 = await fetch('https://ifconfig.me/ip');
      const ipData2 = await ipResponse2.text();
      
      // 方法3：使用 icanhazip.com
      const ipResponse3 = await fetch('https://icanhazip.com');
      const ipData3 = await ipResponse3.text();
      
      return new Response(JSON.stringify({
        timestamp: new Date().toISOString(),
        method1_httpbin: ipData1,
        method2_ifconfig: ipData2.trim(),
        method3_icanhazip: ipData3.trim(),
        headers: Object.fromEntries(request.headers),
        cf: request.cf
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};