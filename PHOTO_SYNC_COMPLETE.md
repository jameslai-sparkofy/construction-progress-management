# 照片同步功能完整實作
*更新時間: 2025-07-25*

## 🎯 功能概述

### ✅ 已實現功能
1. **照片上傳** - 前端 Base64 → CRM 媒體庫
2. **照片下載** - CRM mediaId → 前端 Base64
3. **照片刪除** - 同步刪除 CRM 媒體檔案
4. **定時同步** - 每小時從 CRM 同步照片到 D1

## 📊 照片同步流程

### 1. 上傳流程
```
前端 (Base64) → D1 保存 → Workers 處理 → CRM /media/upload → 獲得 mediaId → 更新案場對象
```

### 2. 下載流程
```
CRM 案場對象 → 讀取照片欄位 → CRM /media/download → 轉換 Base64 → D1 保存 → 前端顯示
```

### 3. 刪除流程
```
D1 刪除 → 讀取 mediaId → CRM /media/delete → 更新案場對象（設為 null）
```

## 🔧 技術實現

### API 端點
- **上傳**: `POST /media/upload`
- **下載**: `POST /media/download`
- **刪除**: `POST /media/delete`

### 關鍵參數
- `igonreMediaIdConvert: true` - 使用 npath 格式
- `mediaTypeDesc: 'IMAGE'` - 圖片類型
- `type: 'image'` - 上傳類型

### 照片格式
```javascript
// CRM 照片欄位格式
[{
  "ext": "png",
  "path": "N_202507_25_xxxxx.webp",  // mediaId
  "filename": "施工照片.png",
  "isImage": true
}]

// 前端照片格式
[{
  "name": "施工照片.png",
  "content": "data:image/png;base64,..."
}]
```

## 📋 欄位對應

| 功能 | 前端 | D1 (notes JSON) | CRM |
|------|------|----------------|-----|
| 施工前照片 | prePhotos | notes.prePhotos | field_V3d91__c |
| 完工照片 | completionPhotos | notes.completionPhotos | field_3Fqof__c |

## 🚀 使用範例

### 上傳照片
```javascript
// 1. 上傳到媒體庫
const mediaId = await uploadPhotoToCRM(config, photo);

// 2. 更新案場對象
const photoData = [{
  ext: "jpg",
  path: mediaId,
  filename: "photo.jpg",
  isImage: true
}];
```

### 下載照片
```javascript
// 1. 從 CRM 下載
const result = await downloadPhotoFromCRM(config, mediaId);

// 2. 轉換為 Base64
const base64 = btoa(new Uint8Array(result.data)...);
```

### 刪除照片
```javascript
// 刪除媒體檔案
await deletePhotoFromCRM(config, mediaId);
```

## ⚡ 定時同步

每小時執行一次，同步流程：
1. 從 CRM 查詢所有案場
2. 檢查照片欄位
3. 下載新照片到 D1
4. 清理舊照片

## 📝 注意事項

1. **檔案大小限制**: 圖片最大 20MB
2. **支援格式**: jpg, png, gif, bmp, jpeg
3. **mediaId 重用**: 同一個 mediaId 可用於多個欄位
4. **同步延遲**: 定時同步每小時執行

## ✅ 測試驗證

- 上傳測試: ✅ 成功
- 下載測試: ✅ 成功
- 刪除測試: ✅ 成功
- 定時同步: ✅ 實作完成

## 🎉 系統狀態

**照片功能: 100% 完成**
- 前端上傳 ✅
- D1 保存 ✅
- CRM 同步 ✅
- 照片管理 ✅