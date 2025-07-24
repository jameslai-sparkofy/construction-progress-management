const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('案場對象及欄位.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log('=== 案場對象完整分析 ===');
  const caseFieldObj = data.filter(row => row['对象名称'] === '案場');
  console.log('案場相關欄位總數:', caseFieldObj.length);

  console.log('\n=== 案場API對象名稱 ===');
  const apiName = caseFieldObj[0]['对象 Api Name'];
  console.log('API Name:', apiName);

  console.log('\n=== 案場所有欄位列表 ===');
  caseFieldObj.forEach((field, index) => {
    console.log(`${index + 1}. ${field['字段名称']} (${field['字段 Api Name']}) - ${field['字段类型']} - 必填:${field['是否必填']}`);
  });

  console.log('\n=== 其他對象 ===');
  const allObjects = [...new Set(data.map(row => row['对象名称']))];
  console.log('所有對象:', allObjects);
  
  // 統計每個對象的欄位數量
  console.log('\n=== 各對象欄位數量統計 ===');
  allObjects.forEach(obj => {
    const fieldCount = data.filter(row => row['对象名称'] === obj).length;
    console.log(`${obj}: ${fieldCount} 個欄位`);
  });

} catch (error) {
  console.error('讀取失敗:', error.message);
}