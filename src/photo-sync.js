/**
 * 照片同步功能模組
 * 處理照片上傳到 CRM 媒體庫並更新案場對象
 */

/**
 * 上傳單張照片到 CRM 媒體庫
 * @param {Object} config - CRM 配置 (token, corpId)
 * @param {Object} photo - 照片數據 {name, content}
 * @returns {Promise<Object>} 上傳結果 {success, mediaId, error}
 */
async function uploadPhotoToCRM(config, photo) {
  try {
    // 將 Base64 轉換為 Blob
    const base64Data = photo.content.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = atob(base64Data);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/jpeg' });

    // 創建 FormData
    const formData = new FormData();
    formData.append('media', blob, photo.name || 'upload.jpg');

    // 上傳到 CRM
    const uploadUrl = `${config.baseUrl}/media/upload?corpAccessToken=${config.token}&corpId=${config.corpId}&type=image&igonreMediaIdConvert=true`;
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });

    const uploadResult = await uploadResponse.json();
    
    if (uploadResult.errorCode === 0 && uploadResult.mediaId) {
      console.log(`✅ 照片上傳成功: ${photo.name} → ${uploadResult.mediaId}`);
      return {
        success: true,
        mediaId: uploadResult.mediaId
      };
    } else {
      console.error(`❌ 照片上傳失敗: ${uploadResult.errorMessage}`);
      return {
        success: false,
        error: uploadResult.errorMessage
      };
    }
  } catch (error) {
    console.error('照片上傳錯誤:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 批量上傳照片並轉換為 CRM 格式
 * @param {Object} config - CRM 配置
 * @param {Array} photos - 照片數組
 * @returns {Promise<Array>} CRM 照片格式數組
 */
async function uploadPhotosAndFormat(config, photos) {
  if (!photos || photos.length === 0) {
    return null;
  }

  const formattedPhotos = [];
  
  for (const photo of photos) {
    const uploadResult = await uploadPhotoToCRM(config, photo);
    
    if (uploadResult.success) {
      // 從檔名獲取副檔名
      const ext = photo.name ? photo.name.split('.').pop().toLowerCase() : 'jpg';
      
      formattedPhotos.push({
        ext: ext,
        path: uploadResult.mediaId,
        filename: photo.name || `photo_${Date.now()}.${ext}`,
        isImage: true
      });
    }
  }

  return formattedPhotos.length > 0 ? formattedPhotos : null;
}

/**
 * 處理施工進度照片同步到 CRM
 * @param {Object} config - CRM 配置
 * @param {Object} progressData - 施工進度數據
 * @returns {Promise<Object>} 處理後的照片欄位數據
 */
async function processProgressPhotos(config, progressData) {
  const photoFields = {};
  
  // 處理施工前照片
  if (progressData.prePhotos && progressData.prePhotos.length > 0) {
    console.log(`📷 處理 ${progressData.prePhotos.length} 張施工前照片...`);
    photoFields.field_V3d91__c = await uploadPhotosAndFormat(config, progressData.prePhotos);
  }
  
  // 處理完工照片
  if (progressData.completionPhotos && progressData.completionPhotos.length > 0) {
    console.log(`📷 處理 ${progressData.completionPhotos.length} 張完工照片...`);
    photoFields.field_3Fqof__c = await uploadPhotosAndFormat(config, progressData.completionPhotos);
  }
  
  return photoFields;
}

/**
 * 下載 CRM 媒體檔案
 * @param {Object} config - CRM 配置
 * @param {String} mediaId - 媒體 ID (N_開頭的路徑)
 * @param {String} mediaType - 媒體類型 ('IMAGE' 或 'DOCUMENT')
 * @returns {Promise<Object>} 下載結果 {success, data, contentType, error}
 */
async function downloadPhotoFromCRM(config, mediaId, mediaType = 'IMAGE') {
  try {
    const response = await fetch(`${config.baseUrl}/media/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        corpAccessToken: config.token,
        corpId: config.corpId,
        mediaTypeDesc: mediaType,
        igonreMediaIdConvert: true, // mediaId 是 npath 格式
        mediaId: mediaId
      })
    });

    if (!response.ok) {
      throw new Error(`下載失敗: HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    const data = await response.arrayBuffer();
    
    console.log(`✅ 成功下載媒體檔案: ${mediaId}`);
    return {
      success: true,
      data: data,
      contentType: contentType
    };
  } catch (error) {
    console.error(`❌ 下載媒體檔案失敗: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 刪除 CRM 媒體檔案
 * @param {Object} config - CRM 配置
 * @param {String} mediaId - 媒體 ID
 * @returns {Promise<Object>} 刪除結果 {success, error}
 */
async function deletePhotoFromCRM(config, mediaId) {
  try {
    const response = await fetch(`${config.baseUrl}/media/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        corpAccessToken: config.token,
        corpId: config.corpId,
        mediaId: mediaId
      })
    });

    const result = await response.json();
    
    if (result.errorCode === 0) {
      console.log(`✅ 成功刪除媒體檔案: ${mediaId}`);
      return { success: true };
    } else {
      console.error(`❌ 刪除媒體檔案失敗: ${result.errorMessage}`);
      return {
        success: false,
        error: result.errorMessage
      };
    }
  } catch (error) {
    console.error(`❌ 刪除媒體檔案錯誤: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 同步照片到前端顯示格式
 * 從 CRM 照片格式轉換為前端可用的 Base64 格式
 * @param {Object} config - CRM 配置
 * @param {Array} crmPhotos - CRM 照片格式 [{path, filename, ...}]
 * @returns {Promise<Array>} 前端照片格式 [{name, content}]
 */
async function syncPhotosToFrontend(config, crmPhotos) {
  if (!crmPhotos || crmPhotos.length === 0) {
    return [];
  }

  const frontendPhotos = [];
  
  for (const photo of crmPhotos) {
    if (photo.path) {
      const downloadResult = await downloadPhotoFromCRM(config, photo.path);
      
      if (downloadResult.success) {
        // 將 ArrayBuffer 轉換為 Base64
        const base64 = btoa(
          new Uint8Array(downloadResult.data)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        
        frontendPhotos.push({
          name: photo.filename || 'photo.jpg',
          content: `data:${downloadResult.contentType || 'image/jpeg'};base64,${base64}`
        });
      }
    }
  }
  
  return frontendPhotos;
}

// 導出所有函數供主程序使用
export { 
  uploadPhotoToCRM, 
  uploadPhotosAndFormat, 
  processProgressPhotos,
  downloadPhotoFromCRM,
  deletePhotoFromCRM,
  syncPhotosToFrontend
};