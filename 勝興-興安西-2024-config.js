
// 勝興-興安西-2024 真實案場配置
const SITE_CONFIG_2024 = {
  "site": {
    "name": "勝興-興安西-2024",
    "totalRecords": 4
  },
  "buildings": {
    "B棟": {
      "name": "B棟",
      "floors": [
        12,
        4,
        2
      ],
      "units": [
        "B1",
        "B5"
      ],
      "totalRecords": 3,
      "totalFloors": 3,
      "totalUnits": 2
    },
    "C棟": {
      "name": "C棟",
      "floors": [
        8
      ],
      "units": [
        "C6"
      ],
      "totalRecords": 1,
      "totalFloors": 1,
      "totalUnits": 1
    }
  },
  "contractors": {
    "王大誠": {
      "name": "王大誠",
      "buildings": [
        "B棟"
      ],
      "floors": [
        4,
        12
      ],
      "totalRecords": 2,
      "floorRange": "4-12樓"
    }
  }
};

console.log('勝興-興安西-2024配置載入完成:', SITE_CONFIG_2024);
