/**
 * 統一欄位映射配置
 * 用於 D1資料庫、前端表單、CRM API 之間的欄位對應
 */

// 核心欄位映射配置
export const FIELD_MAPPING = {
  // 基本資訊
  building: {
    frontend: 'currentBuilding',
    d1: 'building_name',
    crm: 'field_WD7k1__c',
    type: 'text',
    description: '建築棟別 (A/B/C棟)'
  },
  floor: {
    frontend: 'currentFloor',
    d1: 'floor_number',
    crm: 'field_Q6Svh__c',
    type: 'integer',
    description: '樓層數字',
    transform: {
      toCrm: (value) => parseInt(value.toString().replace('F', '')),
      fromCrm: (value) => `${value}F`,
      toD1: (value) => parseInt(value.toString().replace('F', ''))
    }
  },
  unit: {
    frontend: 'currentUnit',
    d1: 'unit_name',
    crm: 'field_XuJP2__c',
    type: 'text',
    description: '戶別 (A1/A2等)'
  },
  opportunityId: {
    frontend: null,
    d1: 'crm_opportunity_id',
    crm: 'field_1P96q__c',
    type: 'text',
    description: '關聯商機ID'
  },

  // 施工資訊
  area: {
    frontend: 'constructionArea',
    d1: 'area',
    crm: 'field_B2gh1__c',
    type: 'decimal',
    description: '舖設坪數',
    transform: {
      toCrm: (value) => parseFloat(value) || null,
      toD1: (value) => parseFloat(value) || 0
    }
  },
  siteArea: {
    frontend: null,
    d1: 'site_area',
    crm: 'field_tXAko__c',
    type: 'decimal',
    description: '工地總坪數'
  },
  constructionDate: {
    frontend: 'constructionDate',
    d1: 'actual_start_date',
    crm: 'field_23pFq__c',
    type: 'date',
    description: '施工日期',
    transform: {
      toCrm: (value) => value ? new Date(value).getTime() : null,
      fromCrm: (value) => value ? new Date(value).toISOString().split('T')[0] : null
    }
  },
  contractor: {
    frontend: 'constructionContractor',
    d1: 'contractor_name',
    crm: 'field_u1wpv__c',
    type: 'text',
    description: '工班師父'
  },
  constructionCompleted: {
    frontend: 'constructionCompleted',
    d1: 'construction_completed',
    crm: 'construction_completed__c',
    type: 'boolean',
    description: '施工完成狀態'
  },

  // 備註欄位
  preConstructionNote: {
    frontend: 'preConstructionNote',
    d1: 'pre_construction_note',
    crm: 'field_sF6fn__c',
    type: 'text',
    description: '施工前特別備註'
  },
  contractorNote: {
    frontend: 'contractorNote',
    d1: 'contractor_note',
    crm: 'field_V32Xl__c',
    type: 'text',
    description: '工班備註'
  },
  siteNote: {
    frontend: 'siteNote',
    d1: 'site_note',
    crm: 'field_g18hX__c',
    type: 'textarea',
    description: '工地備註'
  },
  acceptanceNote: {
    frontend: 'acceptanceNote',
    d1: 'acceptance_note',
    crm: 'field_n37jC__c',
    type: 'text',
    description: '驗收備註'
  },

  // 照片欄位
  prePhotos: {
    frontend: 'prePhotos',
    d1: 'pre_photos',
    crm: 'field_V3d91__c',
    type: 'file',
    description: '施工前照片',
    transform: {
      toCrm: (value) => value ? JSON.stringify(value) : null,
      fromCrm: (value) => value ? JSON.parse(value) : []
    }
  },
  completionPhotos: {
    frontend: 'completionPhotos',
    d1: 'completion_photos',
    crm: 'field_3Fqof__c',
    type: 'file',
    description: '完工照片',
    transform: {
      toCrm: (value) => value ? JSON.stringify(value) : null,
      fromCrm: (value) => value ? JSON.parse(value) : []
    }
  },
  siteConditionPhotos: {
    frontend: 'siteConditionPhotos',
    d1: 'site_condition_photos',
    crm: 'field_03U9h__c',
    type: 'file',
    description: '工地狀況照片'
  },
  acceptancePhotos: {
    frontend: 'acceptancePhotos',
    d1: 'acceptance_photos',
    crm: 'field_v1x3S__c',
    type: 'file',
    description: '驗收照片'
  },

  // 維修相關
  defectCategory1: {
    frontend: 'defectCategory1',
    d1: 'defect_category_1',
    crm: 'field_OmPo8__c',
    type: 'multiselect',
    description: '缺失分類1',
    options: ['刮傷', '矽力康', '空心', '不平', '區隔條', '異音', '其他']
  },
  defectCategory2: {
    frontend: 'defectCategory2',
    d1: 'defect_category_2',
    crm: 'field_32Hxs__c',
    type: 'select',
    description: '缺失分類2',
    options: ['示例選項', '其他']
  },
  defectNote1: {
    frontend: 'defectNote1',
    d1: 'defect_note_1',
    crm: 'field_nht8k__c',
    type: 'text',
    description: '缺失備註1'
  },
  defectNote2: {
    frontend: 'defectNote2',
    d1: 'defect_note_2',
    crm: 'field_dXrfQ__c',
    type: 'text',
    description: '缺失備註2'
  },
  repairDate1: {
    frontend: 'repairDate1',
    d1: 'repair_date_1',
    crm: 'field_r1mp8__c',
    type: 'date',
    description: '維修日期1'
  },
  repairDate2: {
    frontend: 'repairDate2',
    d1: 'repair_date_2',
    crm: 'field_2io60__c',
    type: 'date',
    description: '維修日期2'
  },
  repairCost1: {
    frontend: 'repairCost1',
    d1: 'repair_cost_1',
    crm: 'field_7ndUg__c',
    type: 'decimal',
    description: '維修費用1'
  },
  repairCost2: {
    frontend: 'repairCost2',
    d1: 'repair_cost_2',
    crm: 'field_2jM31__c',
    type: 'decimal',
    description: '維修費用2'
  },

  // 狀態管理
  stage: {
    frontend: 'stage',
    d1: 'stage',
    crm: 'field_z9H6O__c',
    type: 'select',
    description: '階段',
    options: ['準備中', '施工前場勘', '施工', '驗收', '缺失維修', '其他']
  },
  tags: {
    frontend: 'tags',
    d1: 'tags',
    crm: 'field_23Z5i__c',
    type: 'multiselect',
    description: '標籤',
    options: ['準備中', '不可施工', '可施工', '已完工', '需維修', '維修完成', '其他']
  },
  siteType: {
    frontend: 'siteType',
    d1: 'site_type',
    crm: 'field_dxr31__c',
    type: 'select',
    description: '案場類型',
    options: ['工地', '樣品屋', '民宅', '其他']
  },

  // 系統欄位
  createdAt: {
    frontend: null,
    d1: 'created_at',
    crm: 'create_time',
    type: 'timestamp',
    description: '創建時間'
  },
  updatedAt: {
    frontend: null,
    d1: 'updated_at',
    crm: 'last_modified_time',
    type: 'timestamp',
    description: '更新時間'
  },
  crmRecordId: {
    frontend: null,
    d1: 'crm_record_id',
    crm: '_id',
    type: 'text',
    description: 'CRM記錄ID'
  }
};

// 工具函數：將表單數據轉換為D1格式
export function convertFormToD1(formData) {
  const d1Data = {};
  
  Object.keys(formData).forEach(key => {
    // 找到對應的映射配置
    const mappingKey = Object.keys(FIELD_MAPPING).find(mapKey => 
      FIELD_MAPPING[mapKey].frontend === key
    );
    
    if (mappingKey && FIELD_MAPPING[mappingKey].d1) {
      const mapping = FIELD_MAPPING[mappingKey];
      let value = formData[key];
      
      // 應用轉換函數
      if (mapping.transform && mapping.transform.toD1) {
        value = mapping.transform.toD1(value);
      }
      
      d1Data[mapping.d1] = value;
    }
  });
  
  return d1Data;
}

// 工具函數：將表單數據轉換為CRM格式
export function convertFormToCRM(formData) {
  const crmData = {};
  
  Object.keys(formData).forEach(key => {
    const mappingKey = Object.keys(FIELD_MAPPING).find(mapKey => 
      FIELD_MAPPING[mapKey].frontend === key
    );
    
    if (mappingKey && FIELD_MAPPING[mappingKey].crm) {
      const mapping = FIELD_MAPPING[mappingKey];
      let value = formData[key];
      
      // 應用轉換函數
      if (mapping.transform && mapping.transform.toCrm) {
        value = mapping.transform.toCrm(value);
      }
      
      crmData[mapping.crm] = value;
    }
  });
  
  return crmData;
}

// 工具函數：將CRM數據轉換為前端格式
export function convertCRMToForm(crmData) {
  const formData = {};
  
  Object.keys(FIELD_MAPPING).forEach(key => {
    const mapping = FIELD_MAPPING[key];
    
    if (mapping.crm && crmData[mapping.crm] !== undefined && mapping.frontend) {
      let value = crmData[mapping.crm];
      
      // 應用轉換函數
      if (mapping.transform && mapping.transform.fromCrm) {
        value = mapping.transform.fromCrm(value);
      }
      
      formData[mapping.frontend] = value;
    }
  });
  
  return formData;
}

// 工具函數：將D1數據轉換為前端格式
export function convertD1ToForm(d1Data) {
  const formData = {};
  
  Object.keys(FIELD_MAPPING).forEach(key => {
    const mapping = FIELD_MAPPING[key];
    
    if (mapping.d1 && d1Data[mapping.d1] !== undefined && mapping.frontend) {
      formData[mapping.frontend] = d1Data[mapping.d1];
    }
  });
  
  return formData;
}

// 獲取所有CRM欄位名稱
export function getCRMFields() {
  return Object.keys(FIELD_MAPPING)
    .filter(key => FIELD_MAPPING[key].crm)
    .map(key => FIELD_MAPPING[key].crm);
}

// 獲取所有D1欄位名稱
export function getD1Fields() {
  return Object.keys(FIELD_MAPPING)
    .filter(key => FIELD_MAPPING[key].d1)
    .map(key => FIELD_MAPPING[key].d1);
}

// 根據欄位名稱獲取映射配置
export function getFieldMapping(fieldName) {
  return Object.keys(FIELD_MAPPING).find(key => {
    const mapping = FIELD_MAPPING[key];
    return mapping.frontend === fieldName || 
           mapping.d1 === fieldName || 
           mapping.crm === fieldName;
  });
}

export default FIELD_MAPPING;