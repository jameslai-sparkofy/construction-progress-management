# API 調試經驗記錄

## 案場API參數問題 (2025-07-25)

### 問題描述
在實現「根據商機ID查詢案場資料」功能時，發現API返回的數據與實際不符：
- 期望：AB兩棟，4樓，236戶
- 實際返回：ABC三棟，15樓，只有100筆數據

### 根本原因
**錯誤的API參數名稱**：
```javascript
// ❌ 錯誤：使用了 opportunity_id
const response = await fetch(`/api/crm/sites?opportunity_id=${opportunityId}`);

// ✅ 正確：應該使用 opportunityId
const response = await fetch(`/api/crm/sites?opportunityId=${opportunityId}`);
```

### 調試過程
1. **API測試**：直接測試API端點，發現數據被截斷
2. **參數檢查**：發現參數名稱不匹配
3. **後端代碼檢查**：確認後端期望的參數名稱是 ```opportunityId```
4. **修正並驗證**：修正後獲得完整的236戶資料

### 學到的經驗
1. **API參數命名一致性很重要**：`opportunity_id` vs `opportunityId`
2. **分頁限制會隱藏問題**：錯誤參數導致只返回預設的100筆
3. **測試實際商機ID**：不要只依賴演示數據
4. **完整性檢查**：當數據看起來被截斷時，檢查API限制和參數

### 測試用商機ID
- `66defc17d0d4940001cf0fbf` - 祥鎮營造-元鼎三期-2025
  - 實際：AB兩棟，4樓，236戶
  - 戶別格式：A1, A1-1, A10, A10-1等

### API端點對照表
```
正確的案場查詢API：
GET /api/crm/sites?opportunityId={商機ID}

錯誤的參數會導致：
GET /api/crm/sites?opportunity_id={商機ID} → 只返回通用案場列表的前100筆
```

### 預防措施
1. 在API文檔中明確標註參數名稱的大小寫
2. 前端API調用時使用TypeScript或JSDoc標註參數
3. 添加API響應數據的完整性檢查
4. 測試時使用真實的商機ID，不只是演示數據

---

## 其他API調試技巧

### 快速數據分析
使用Python進行API響應分析：
```bash
curl -s "API_URL" | python3 -c "
import json, sys
data = json.load(sys.stdin)
sites = data.get('data', [])
print(f'總數: {len(sites)}')
# 分析邏輯...
"
```

### D1資料庫驗證
當API數據有疑問時，直接查詢D1資料庫確認：
```sql
SELECT COUNT(*) FROM sites WHERE opportunity_id = '商機ID';
```

### 常見陷阱
1. 參數名稱大小寫敏感
2. 分頁限制隱藏實際數據量
3. 預設值掩蓋實際問題
4. 演示數據與真實數據的差異