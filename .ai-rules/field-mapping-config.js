// 统一字段映射配置系统
// 用于标准化 CRM 对象到 D1 数据库的字段映射关系

/**
 * 案场对象字段映射配置
 * CRM Object: object_8W9cb__c → D1 Tables: sites + site_progress
 */
export const SITE_FIELD_MAPPING = {
  // 基本信息字段 → sites 表
  base_fields: {
    crm_table: 'object_8W9cb__c',
    d1_table: 'sites',
    mappings: {
      '_id': { 
        d1_field: 'id', 
        type: 'TEXT', 
        required: true, 
        description: 'CRM主键ID' 
      },
      'name': { 
        d1_field: 'name', 
        type: 'TEXT', 
        required: true, 
        description: '案场编号（自增）' 
      },
      'field_1P96q__c': { 
        d1_field: 'opportunity_id', 
        type: 'TEXT', 
        required: false, 
        description: '关联商机ID' 
      },
      'field_WD7k1__c': { 
        d1_field: 'building_type', 
        type: 'TEXT', 
        required: false, 
        description: '栋别（A栋/B栋/C栋）' 
      },
      'field_Q6Svh__c': { 
        d1_field: 'floor_info', 
        type: 'INTEGER', 
        required: false, 
        description: '楼层数字' 
      },
      'field_XuJP2__c': { 
        d1_field: 'room_info', 
        type: 'TEXT', 
        required: false, 
        description: '户别编号' 
      },
      'field_z9H6O__c': { 
        d1_field: 'status', 
        type: 'TEXT', 
        required: false, 
        description: '阶段状态',
        options: ['準備中', '施工前場勘', '施工', '驗收', '缺失維修', '其他']
      },
      'create_time': { 
        d1_field: 'create_time', 
        type: 'INTEGER', 
        required: false, 
        description: '创建时间戳' 
      },
      'last_modified_time': { 
        d1_field: 'update_time', 
        type: 'INTEGER', 
        required: false, 
        description: '最后修改时间戳' 
      }
    }
  },

  // 施工进度字段 → site_progress 表
  progress_fields: {
    crm_table: 'object_8W9cb__c',
    d1_table: 'site_progress',
    mappings: {
      '_id': { 
        d1_field: 'crm_record_id', 
        type: 'TEXT', 
        required: true, 
        description: 'CRM记录ID' 
      },
      'field_sF6fn__c': { 
        d1_field: 'notes', 
        type: 'TEXT', 
        required: false, 
        description: '施工前备注' 
      },
      'construction_completed__c': { 
        d1_field: 'status', 
        type: 'TEXT', 
        required: false, 
        description: '施工完成状态',
        transform: (value) => value ? 'completed' : 'pending'
      },
      'field_23pFq__c': { 
        d1_field: 'actual_start_date', 
        type: 'DATE', 
        required: false, 
        description: '施工日期' 
      },
      'field_B2gh1__c': { 
        d1_field: 'construction_area', 
        type: 'INTEGER', 
        required: false, 
        description: '铺设坪数' 
      },
      'field_u1wpv__c': { 
        d1_field: 'contractor_name', 
        type: 'TEXT', 
        required: false, 
        description: '工班师父' 
      }
    }
  },

  // 图片字段 → 独立处理
  media_fields: {
    'field_V3d91__c': { 
      description: '施工前照片', 
      type: 'IMAGE_ARRAY',
      storage: 'cloudflare_images' 
    },
    'field_3Fqof__c': { 
      description: '完工照片', 
      type: 'IMAGE_ARRAY',
      storage: 'cloudflare_images' 
    },
    'field_3T38o__c': { 
      description: '平面图', 
      type: 'IMAGE_ARRAY',
      storage: 'cloudflare_images' 
    },
    'field_03U9h__c': { 
      description: '工地状况照片', 
      type: 'IMAGE_ARRAY',
      storage: 'cloudflare_images' 
    }
  },

  // 维修相关字段 → 扩展字段处理
  maintenance_fields: {
    'field_tyRfE__c': { description: '缺失照片1', type: 'IMAGE' },
    'field_62279__c': { description: '缺失照片2', type: 'IMAGE' },
    'field_PuaLk__c': { description: '维修完成照片1', type: 'IMAGE' },
    'field_d2O5i__c': { description: '维修完成照片2', type: 'IMAGE' },
    'field_OmPo8__c': { description: '缺失分类1', type: 'MULTI_SELECT' },
    'field_32Hxs__c': { description: '缺失分类2', type: 'SINGLE_SELECT' },
    'field_r1mp8__c': { description: '维修日期1', type: 'DATE' },
    'field_2io60__c': { description: '维修日期2', type: 'TEXT' }
  }
};

/**
 * 商机对象字段映射配置
 * CRM Object: NewOpportunityObj → D1 Table: opportunities
 */
export const OPPORTUNITY_FIELD_MAPPING = {
  crm_table: 'NewOpportunityObj',
  d1_table: 'opportunities',
  api_type: 'standard_v2',
  mappings: {
    '_id': { d1_field: 'id', type: 'TEXT', required: true },
    'name': { d1_field: 'name', type: 'TEXT', required: true },
    'customer': { d1_field: 'customer', type: 'TEXT', required: false },
    'stage': { d1_field: 'stage', type: 'TEXT', required: false },
    'create_time': { d1_field: 'create_time', type: 'INTEGER', required: false },
    'last_modified_time': { d1_field: 'update_time', type: 'INTEGER', required: false }
  }
};

/**
 * 维修单对象字段映射配置  
 * CRM Object: on_site_signature__c → D1 Table: maintenance_orders
 */
export const MAINTENANCE_FIELD_MAPPING = {
  crm_table: 'on_site_signature__c',
  d1_table: 'maintenance_orders', 
  api_type: 'custom',
  mappings: {
    '_id': { d1_field: 'id', type: 'TEXT', required: true },
    'name': { d1_field: 'name', type: 'TEXT', required: true },
    'create_time': { d1_field: 'create_time', type: 'INTEGER', required: false },
    'last_modified_time': { d1_field: 'update_time', type: 'INTEGER', required: false }
  }
};

/**
 * 销售记录对象字段映射配置
 * CRM Object: ActiveRecordObj → D1 Table: sales_records  
 */
export const SALES_FIELD_MAPPING = {
  crm_table: 'ActiveRecordObj',
  d1_table: 'sales_records',
  api_type: 'standard_v2', 
  mappings: {
    '_id': { d1_field: 'id', type: 'TEXT', required: true },
    'name': { d1_field: 'name', type: 'TEXT', required: true },
    'create_time': { d1_field: 'create_time', type: 'INTEGER', required: false },
    'last_modified_time': { d1_field: 'update_time', type: 'INTEGER', required: false }
  }
};

/**
 * 数据转换工具函数
 */
export const FIELD_TRANSFORMERS = {
  // 日期转换：CRM timestamp → D1 INTEGER
  timestampToInteger: (timestamp) => {
    return timestamp ? new Date(timestamp).getTime() : null;
  },
  
  // 布尔值转换：CRM boolean → D1 TEXT
  booleanToText: (value) => {
    return value === true ? 'completed' : 'pending';
  },
  
  // 多选字段转换：CRM array → D1 TEXT (JSON)
  arrayToJson: (array) => {
    return Array.isArray(array) ? JSON.stringify(array) : null;
  },
  
  // 图片字段处理：CRM image → Cloudflare Images URL
  processImages: async (imageData, env) => {
    // TODO: 实现图片上传到 Cloudflare Images
    return imageData;
  }
};

/**
 * 字段验证规则
 */
export const FIELD_VALIDATION = {
  sites: {
    'name': { required: true, maxLength: 255 },
    'building_type': { options: ['A栋', 'B栋', 'C栋'] },
    'floor_info': { type: 'number', min: 1, max: 100 }
  },
  site_progress: {
    'contractor_name': { maxLength: 100 },
    'construction_area': { type: 'number', min: 0 },
    'status': { options: ['pending', 'in_progress', 'completed'] }
  }
};