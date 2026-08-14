const fs = require('fs');
const path = './src/data/deviceTree.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/"id": "Custom_Actuator",\s*"icon": "",\s*"parentId": "CustomDevices",\s*"type": 1,/g, 
  '"id": "Custom_Actuator",\n                "icon": "",\n                "parentId": "CustomDevices",\n                "type": 0,');
content = content.replace(/"id": "Custom_Sensor",\s*"icon": "",\s*"parentId": "CustomDevices",\s*"type": 1,/g, 
  '"id": "Custom_Sensor",\n                "icon": "",\n                "parentId": "CustomDevices",\n                "type": 0,');

fs.writeFileSync(path, content);
