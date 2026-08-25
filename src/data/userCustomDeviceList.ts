export interface UserCustomDeviceItem {
  id: string;
  name: string;
  phone: string;
  userName: string;
  image: string;
  type: '传感器' | '执行器' | '网关' | '继电器';
  protocol: 'Modbus RTU' | 'Modbus TCP' | 'Zigbee' | 'MQTT' | 'Lora' | '模拟量' | '开关量' | '其他';
  power: string;
  publishStatus: 'published' | 'unpublished' | 'banned'; // published: 已发布, unpublished: 未发布, banned: 已下架
  publishToSimulation: boolean;
  createTime: string;
  source?: '用户' | '系统库'; // 来源分区：用户自主创建 vs 克隆入库/系统公共库
  targetCategoryId?: string; // 归属的系统分类ID（若已克隆）
  description?: string;
  modbusAttrs?: Array<{
    name: string;
    unit: string;
    range?: string;
    precision?: string;
  }>;
}

export const initialUserCustomDevices: UserCustomDeviceItem[] = [
  {
    id: 'uc_1001',
    name: '工业高精度温湿度传感器',
    phone: '18396528500',
    userName: '杨振邦',
    image: '/device/RS485_Humiture_Thumbnail.png',
    type: '传感器',
    protocol: 'Modbus RTU',
    power: 'DC 12V',
    publishStatus: 'published',
    publishToSimulation: true,
    createTime: '2026-08-20 14:32:10',
    source: '用户',
    description: '工业级大棚与机房高精度RS485温湿度一体变送器',
    modbusAttrs: [
      { name: '温度', unit: '℃', range: '-40-80', precision: '1' },
      { name: '湿度', unit: '%RH', range: '0-100', precision: '1' }
    ]
  },
  {
    id: 'uc_1002',
    name: '智慧农业智能灌溉水泵阀',
    phone: '17996804886',
    userName: '李工',
    image: '/device/RS485_WaterPump_Thumbnail.png',
    type: '执行器',
    protocol: 'Zigbee',
    power: 'AC 220V',
    publishStatus: 'published',
    publishToSimulation: true,
    createTime: '2026-08-18 10:15:30',
    source: '用户',
    description: '大田精准水肥灌溉电动蝶阀控制器'
  },
  {
    id: 'uc_1003',
    name: '4G-DTU工业边缘网关 Pro',
    phone: '13011111006',
    userName: '王老师',
    image: '/device/UsrG771Gateway_Thumbnail.png',
    type: '网关',
    protocol: 'MQTT',
    power: 'DC 12V',
    publishStatus: 'unpublished',
    publishToSimulation: false,
    createTime: '2026-08-15 09:40:00',
    source: '用户',
    description: '支持MQTT/HTTP多协议上云的工业网关'
  },
  {
    id: 'uc_1004',
    name: '超远距离LoRa土壤水分检测仪',
    phone: '17856316832',
    userName: '赵工',
    image: '/device/RS485_SoilHumiture_Thumbnail.png',
    type: '传感器',
    protocol: 'Lora',
    power: 'DC 5V',
    publishStatus: 'published',
    publishToSimulation: true,
    createTime: '2026-08-11 16:22:45',
    source: '用户',
    description: '长距离低功耗土壤剖面多层水分速测探针'
  },
  {
    id: 'uc_1005',
    name: '导轨式单联大功率工业继电器',
    phone: '18273689693',
    userName: '张主管',
    image: '/device/Relay_DINRailCircuitBreaker1P_Thumbnail.png',
    type: '继电器',
    protocol: 'Modbus TCP',
    power: 'AC 380V',
    publishStatus: 'published',
    publishToSimulation: true,
    createTime: '2026-07-28 11:05:12',
    source: '系统库',
    targetCategoryId: 'cat_other',
    description: '配电箱导轨安装32A大功率远程分合闸继电器'
  },
  {
    id: 'uc_1006',
    name: '0-10V电压型模拟量光照度计',
    phone: '13812345678',
    userName: '陈助理',
    image: '/device/RS485_AirPressure_Thumbnail.png',
    type: '传感器',
    protocol: '模拟量',
    power: 'DC 24V',
    publishStatus: 'unpublished',
    publishToSimulation: false,
    createTime: '2026-07-15 15:50:20',
    source: '用户',
    description: '标准0-10V模拟电压输出工业光照强度计'
  },
  {
    id: 'uc_1007',
    name: '六路干接点开关量输入输出模块',
    phone: '15987654321',
    userName: '刘工程师',
    image: '/device/OnOff_Buzzer_Thumbnail.png',
    type: '执行器',
    protocol: '开关量',
    power: 'DC 12V',
    publishStatus: 'published',
    publishToSimulation: true,
    createTime: '2026-06-30 08:20:00',
    source: '系统库',
    targetCategoryId: 'cat_smarthome',
    description: '支持6路DI/DO独立隔离控制'
  },
  {
    id: 'uc_1008',
    name: 'Zigbee 3.0智能窗帘开合电机',
    phone: '18396528500',
    userName: '杨振邦',
    image: '/device/ZigBee_SigleRelay_Thumbnail.png',
    type: '执行器',
    protocol: 'Zigbee',
    power: 'AC 220V',
    publishStatus: 'published',
    publishToSimulation: true,
    createTime: '2026-06-12 17:00:15',
    source: '系统库',
    targetCategoryId: 'cat_smarthome',
    description: '静音电机，支持行程校准与百分比控制'
  }
];
