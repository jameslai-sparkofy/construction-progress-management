// 項目初始化腳本
// 用於在KV存儲中設置興安西項目的初始配置

const PROJECT_CONFIG = {
  "xinganxi-A8B9C": {
    "projectId": "xinganxi-A8B9C",
    "name": "勝興-興安西-2024",
    "opportunity": "勝興-興安西-2024",
    "status": "active",
    "createdAt": "2024-07-18T00:00:00Z",
    "description": "勝興興安西2024年度工程進度管理系統",
    "buildings": ["A棟", "B棟", "C棟"],
    "contractors": [
      {
        "name": "王大誠",
        "type": "individual",
        "phone": "0912345678",
        "buildings": ["B棟"],
        "floors": {
          "B棟": ["2F", "4F", "12F"]
        }
      },
      {
        "name": "築愛家有限公司",
        "type": "company",
        "phone": "0221234567",
        "buildings": ["A棟"],
        "floors": {
          "A棟": ["8F", "10F", "11F", "12F", "13F", "14F"]
        }
      },
      {
        "name": "塔塔家建材有限公司",
        "type": "company",
        "phone": "0287654321",
        "buildings": ["C棟"],
        "floors": {
          "C棟": ["3F", "4F", "5F", "6F", "7F", "8F", "9F", "10F", "11F", "12F", "13F", "14F", "15F"]
        }
      }
    ],
    "users": [
      {
        "phone": "0912345678",
        "name": "王大誠",
        "role": "contractor",
        "permissions": ["view_progress", "edit_own_data", "view_sites", "view_repair_orders"],
        "contractor": "王大誠",
        "buildings": ["B棟"],
        "floors": {
          "B棟": ["2F", "4F", "12F"]
        }
      },
      {
        "phone": "0921234567",
        "name": "築愛家負責人",
        "role": "contractor",
        "permissions": ["view_progress", "edit_own_data", "view_sites", "view_repair_orders"],
        "contractor": "築愛家有限公司",
        "buildings": ["A棟"],
        "floors": {
          "A棟": ["8F", "10F", "11F", "12F", "13F", "14F"]
        }
      },
      {
        "phone": "0987654321",
        "name": "塔塔家負責人",
        "role": "contractor",
        "permissions": ["view_progress", "edit_own_data", "view_sites", "view_repair_orders"],
        "contractor": "塔塔家建材有限公司",
        "buildings": ["C棟"],
        "floors": {
          "C棟": ["3F", "4F", "5F", "6F", "7F", "8F", "9F", "10F", "11F", "12F", "13F", "14F", "15F"]
        }
      },
      {
        "phone": "0911111111",
        "name": "業主代表1",
        "role": "owner",
        "permissions": ["view_progress", "view_sites", "view_repair_orders", "edit_all_data"],
        "contractor": null,
        "buildings": ["A棟", "B棟", "C棟"],
        "floors": {}
      },
      {
        "phone": "0922222222",
        "name": "業主代表2",
        "role": "owner",
        "permissions": ["view_progress", "view_sites", "view_repair_orders", "edit_all_data"],
        "contractor": null,
        "buildings": ["A棟", "B棟", "C棟"],
        "floors": {}
      },
      {
        "phone": "0900000000",
        "name": "系統管理員",
        "role": "admin",
        "permissions": ["view_progress", "view_sites", "view_repair_orders", "edit_all_data", "manage_users", "sync_data"],
        "contractor": null,
        "buildings": ["A棟", "B棟", "C棟"],
        "floors": {}
      }
    ],
    "fxiaokeConfig": {
      "opportunityName": "勝興-興安西-2024",
      "siteObjectApiName": "object_8W9cb__c",
      "repairOrderObjectApiName": "object_repair_order__c",
      "contractorField": "shift_time__c",
      "opportunityField": "field_1P96q__c",
      "buildingField": "building_type__c"
    },
    "apiConfig": {
      "lastSync": "2024-07-18T12:00:00Z",
      "syncInterval": 300000,
      "cacheExpiry": 300000
    },
    "uiConfig": {
      "theme": "blue",
      "showStatistics": true,
      "defaultTab": "progress",
      "enableMobileView": true
    }
  }
};

// 初始化項目資料
async function initializeProject() {
  const projectId = "xinganxi-A8B9C";
  const config = PROJECT_CONFIG[projectId];
  
  console.log('正在初始化項目:', config.name);
  
  // 這些函數需要在Cloudflare Workers環境中執行
  // 可以通過wrangler或直接在Workers中調用
  
  try {
    // 1. 設置項目配置
    await setProjectConfig(projectId, config);
    
    // 2. 初始化用戶權限
    await initializeUsers(projectId, config.users);
    
    // 3. 創建初始快取資料
    await initializeCacheData(projectId, config);
    
    // 4. 設置預設進度資料
    await initializeProgressData(projectId, config);
    
    console.log('✅ 項目初始化完成');
    
    // 輸出項目資訊
    console.log('\n項目資訊:');
    console.log('- 項目ID:', projectId);
    console.log('- 項目名稱:', config.name);
    console.log('- 訪問URL:', `https://progress.yourcompany.com/${projectId}`);
    console.log('- 登入URL:', `https://progress.yourcompany.com/${projectId}/login`);
    console.log('- 建築數量:', config.buildings.length);
    console.log('- 工班數量:', config.contractors.length);
    console.log('- 用戶數量:', config.users.length);
    
    console.log('\n測試用戶:');
    config.users.forEach(user => {
      console.log(`- ${user.name} (${user.phone}): ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ 項目初始化失敗:', error);
  }
}

// 設置項目配置（需要在Workers環境中執行）
async function setProjectConfig(projectId, config) {
  // 這個函數應該在Cloudflare Workers中執行
  // 例如：await env.PROJECTS_CONFIG.put(projectId, JSON.stringify(config));
  console.log('設置項目配置:', projectId);
}

// 初始化用戶資料（需要在Workers環境中執行）
async function initializeUsers(projectId, users) {
  console.log('初始化用戶資料...');
  
  // 為每個用戶創建權限配置
  users.forEach(user => {
    const userConfig = {
      phone: user.phone,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      contractor: user.contractor,
      buildings: user.buildings,
      floors: user.floors,
      projectId: projectId,
      createdAt: new Date().toISOString()
    };
    
    // 應該存儲到KV: await env.USER_PERMISSIONS.put(`user-${projectId}-${user.phone}`, JSON.stringify(userConfig));
    console.log(`- 配置用戶: ${user.name} (${user.phone})`);
  });
}

// 初始化快取資料（需要在Workers環境中執行）
async function initializeCacheData(projectId, config) {
  console.log('初始化快取資料...');
  
  const cacheData = {
    projectId: projectId,
    lastUpdate: new Date().toISOString(),
    totalSites: 224,
    buildings: {
      "A棟": {
        "name": "A棟",
        "contractor": "築愛家有限公司",
        "floors": ["8F", "10F", "11F", "12F", "13F", "14F"],
        "units": [],
        "totalRecords": 0
      },
      "B棟": {
        "name": "B棟",
        "contractor": "王大誠",
        "floors": ["2F", "4F", "12F"],
        "units": ["B1", "B5"],
        "totalRecords": 3
      },
      "C棟": {
        "name": "C棟",
        "contractor": "塔塔家建材有限公司",
        "floors": ["3F", "4F", "5F", "6F", "7F", "8F", "9F", "10F", "11F", "12F", "13F", "14F", "15F"],
        "units": ["C6"],
        "totalRecords": 1
      }
    },
    contractors: {
      "王大誠": {
        "name": "王大誠",
        "type": "individual",
        "buildings": ["B棟"],
        "floors": ["2F", "4F", "12F"],
        "totalRecords": 3
      },
      "築愛家有限公司": {
        "name": "築愛家有限公司",
        "type": "company",
        "buildings": ["A棟"],
        "floors": ["8F", "10F", "11F", "12F", "13F", "14F"],
        "totalRecords": 0
      },
      "塔塔家建材有限公司": {
        "name": "塔塔家建材有限公司",
        "type": "company",
        "buildings": ["C棟"],
        "floors": ["3F", "4F", "5F", "6F", "7F", "8F", "9F", "10F", "11F", "12F", "13F", "14F", "15F"],
        "totalRecords": 1
      }
    }
  };
  
  // 應該存儲到KV: await env.SITE_DATA.put(`sites-${projectId}`, JSON.stringify(cacheData));
  console.log('- 快取資料配置完成');
}

// 初始化進度資料（需要在Workers環境中執行）
async function initializeProgressData(projectId, config) {
  console.log('初始化進度資料...');
  
  const progressData = {
    projectId: projectId,
    lastUpdate: new Date().toISOString(),
    overallProgress: 72,
    buildings: {
      "A棟": {
        "progress": 65,
        "floors": {
          "8F": { "overall": 80 },
          "10F": { "overall": 70 },
          "11F": { "overall": 65 },
          "12F": { "overall": 60 },
          "13F": { "overall": 55 },
          "14F": { "overall": 50 }
        }
      },
      "B棟": {
        "progress": 78,
        "floors": {
          "2F": { "B1": "completed", "B5": "completed" },
          "4F": { "B1": "issue", "B5": "in_progress" },
          "12F": { "B1": "completed", "B5": "completed" }
        }
      },
      "C棟": {
        "progress": 68,
        "floors": {
          "3F": { "C6": "completed" },
          "4F": { "C6": "completed" },
          "5F": { "C6": "completed" },
          "6F": { "C6": "completed" },
          "7F": { "C6": "completed" },
          "8F": { "C6": "completed" },
          "9F": { "C6": "in_progress" },
          "10F": { "C6": "pending" },
          "11F": { "C6": "pending" },
          "12F": { "C6": "pending" },
          "13F": { "C6": "pending" },
          "14F": { "C6": "pending" },
          "15F": { "C6": "pending" }
        }
      }
    }
  };
  
  // 應該存儲到KV: await env.PROGRESS_DATA.put(`progress-${projectId}`, JSON.stringify(progressData));
  console.log('- 進度資料配置完成');
}

// Cloudflare Workers部署腳本
const DEPLOY_SCRIPT = `
# 部署腳本 - 需要在有wrangler的環境中執行

# 1. 創建KV命名空間
wrangler kv:namespace create "PROJECTS_CONFIG" --preview=false
wrangler kv:namespace create "USER_SESSIONS" --preview=false
wrangler kv:namespace create "SITE_DATA" --preview=false
wrangler kv:namespace create "SMS_CODES" --preview=false
wrangler kv:namespace create "PROGRESS_DATA" --preview=false

# 2. 設置項目配置
wrangler kv:key put --namespace-id=YOUR_PROJECTS_CONFIG_ID "xinganxi-A8B9C" --path=project-config.json

# 3. 部署Workers
wrangler deploy --name construction-progress-main
wrangler deploy --name construction-progress-api

# 4. 設置自定義域名
wrangler route add "progress.yourcompany.com/*" construction-progress-main

echo "部署完成！"
echo "訪問地址: https://progress.yourcompany.com/xinganxi-A8B9C"
`;

// 導出配置
export {
  PROJECT_CONFIG,
  initializeProject,
  DEPLOY_SCRIPT
};

// 如果直接執行此腳本
if (typeof globalThis !== 'undefined') {
  initializeProject();
}

console.log('項目配置已準備完成');
console.log('配置文件可用於Cloudflare Workers部署');
console.log('項目ID: xinganxi-A8B9C');
console.log('訪問URL: https://progress.yourcompany.com/xinganxi-A8B9C');