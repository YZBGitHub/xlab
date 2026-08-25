import { deviceTreeData } from './deviceTree';

export interface DeviceConfig {
  deviceType: '传感器' | '执行器' | '网关';
  powerType: '直流' | '交流' | '无需供电';
  acVoltage: string;
  customAcVal?: string;
  dcVoltage: string;
  customDcVal?: string;
  protocol: string;
  gatewayType?: string;
  onImage?: string | null;
  offImage?: string | null;
  modbusAttrs?: Array<{
    name: string;
    unit: string;
    precision?: string;
    range?: string;
    funcCode?: string;
    startAddr?: string;
    dataLen?: string;
    formula?: string;
  }>;
  analogConfig?: {
    type: '电压' | '电流';
    range: string;
    unit: string;
    precision: string;
    min: string;
    max: string;
  };
}

export interface SystemDeviceNode {
  id: string;
  name: string;
  parentId: string;
  orderNum: number;
  type: 0 | 1; // 0: 分类, 1: 设备
  status: '启用' | '禁用';
  icon?: string;
  image?: string;
  protocol?: string;
  deviceType?: '传感器' | '执行器' | '网关';
  config?: DeviceConfig;
  description?: string;
  createTime?: string;
  children?: SystemDeviceNode[];
}

// 转换现有 deviceTreeData 为 SystemDeviceNode 格式并丰富默认数据
const convertNode = (node: any, defaultStatus: '启用' | '禁用' = '启用'): SystemDeviceNode => {
  return {
    id: node.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: node.name,
    parentId: node.parentId || '0',
    orderNum: node.orderNum || 1,
    type: node.type ?? (node.children && node.children.length > 0 ? 0 : 1),
    status: node.status || defaultStatus,
    icon: node.icon || '',
    image: node.image || '',
    protocol: node.protocol || (node.type === 1 ? 'Modbus' : undefined),
    description: node.description || '',
    createTime: node.createTime || '2025-05-18 10:00:00',
    children: Array.isArray(node.children) ? node.children.map((c: any) => convertNode(c, defaultStatus)) : []
  };
};

// 提取原有的传感器和采集器
const baseNodes = deviceTreeData
  .filter(item => item.id !== 'CustomDevices')
  .map(item => convertNode(item));

// 扩展出完整的截图层级结构数据
export const initialSystemDeviceTree: SystemDeviceNode[] = [
  // 1. 传感器
  baseNodes.find(n => n.name === '传感器') || {
    id: 'SensorPanel',
    name: '传感器',
    parentId: '0',
    orderNum: 1,
    type: 0,
    status: '启用',
    icon: 'el-icon-help',
    children: [
      {
        id: 'Wired',
        name: '有线传感器',
        parentId: 'SensorPanel',
        orderNum: 1,
        type: 0,
        status: '启用',
        icon: '',
        children: []
      },
      {
        id: 'Wireless',
        name: '无线传感器',
        parentId: 'SensorPanel',
        orderNum: 1,
        type: 0,
        status: '启用',
        icon: '',
        children: []
      },
      {
        id: 'Actuator',
        name: '继电器',
        parentId: 'SensorPanel',
        orderNum: 3,
        type: 0,
        status: '启用',
        icon: '',
        children: []
      }
    ]
  },
  // 2. 采集器
  baseNodes.find(n => n.name === '采集器') || {
    id: 'CollectPanel',
    name: '采集器',
    parentId: '0',
    orderNum: 2,
    type: 0,
    status: '启用',
    icon: 'el-icon-eleme',
    children: [
      {
        id: 'Gatewary',
        name: '网关',
        parentId: 'CollectPanel',
        orderNum: 1,
        type: 0,
        status: '启用',
        icon: '',
        children: []
      },
      {
        id: 'IO',
        name: '协调器',
        parentId: 'CollectPanel',
        orderNum: 2,
        type: 0,
        status: '启用',
        icon: '',
        children: []
      }
    ]
  },
  // 3. RFID
  {
    id: 'RFIDPanel',
    name: 'RFID',
    parentId: '0',
    orderNum: 3,
    type: 0,
    status: '启用',
    icon: 'el-icon-setting',
    children: [
      {
        id: 'RFID_App',
        name: 'RFID应用',
        parentId: 'RFIDPanel',
        orderNum: 3,
        type: 0,
        status: '启用',
        icon: 'el-icon-setting',
        children: [
          {
            id: 'RFID_Gate',
            name: '超高频通道门',
            parentId: 'RFID_App',
            orderNum: 1,
            type: 1,
            status: '启用',
            image: '/device/NewLab_RFID_ReadCard_1356M_Thumbnail.png',
            protocol: 'Modbus',
            description: 'UHF超高频远距离人员/资产进出通道门'
          },
          {
            id: 'RFID_Issuer',
            name: '桌面发卡器',
            parentId: 'RFID_App',
            orderNum: 2,
            type: 1,
            status: '启用',
            image: '/device/NewLab_RFID_ReadCard_915M_Thumbnail.png',
            protocol: 'USB/HID',
            description: '高频桌面USB一体式发卡读写器'
          }
        ]
      },
      {
        id: 'RFID_Base',
        name: 'RFID基础',
        parentId: 'RFIDPanel',
        orderNum: 3,
        type: 0,
        status: '启用',
        icon: 'el-icon-setting',
        children: [
          {
            id: 'RFID_125K',
            name: '低频125K读卡器',
            parentId: 'RFID_Base',
            orderNum: 1,
            type: 1,
            status: '启用',
            image: '/device/NewLab_RFID_ReadCard_125k_Thumbnail.png',
            protocol: 'Wiegand26',
            description: '125KHz低频非接触式IC卡读卡模块'
          },
          {
            id: 'RFID_1356M',
            name: '高频13.56M读卡器',
            parentId: 'RFID_Base',
            orderNum: 2,
            type: 1,
            status: '启用',
            image: '/device/NewLab_RFID_ReadCard_1356M_Thumbnail.png',
            protocol: 'ISO14443A',
            description: 'ISO/IEC 14443 Type A 标准高频读卡器'
          },
          {
            id: 'RFID_915M',
            name: '超高频915M读写器',
            parentId: 'RFID_Base',
            orderNum: 3,
            type: 1,
            status: '启用',
            image: '/device/NewLab_RFID_ReadCard_915M_Thumbnail.png',
            protocol: 'EPC Gen2',
            description: '902-928MHz UHF远程标签读写天线模组'
          }
        ]
      }
    ]
  },
  // 4. 其他设备
  {
    id: 'OtherDevices',
    name: '其他设备',
    parentId: '0',
    orderNum: 4,
    type: 0,
    status: '启用',
    icon: 'el-icon-s-data',
    children: [
      {
        id: 'Dev_LEDDisplay',
        name: '工业LED点阵屏',
        parentId: 'OtherDevices',
        orderNum: 1,
        type: 1,
        status: '启用',
        image: '/device/RS485_AirQuality_Thumbnail.png',
        protocol: 'Modbus RTU',
        description: '双色/三色RS485实时文本数据看板'
      },
      {
        id: 'Dev_BuzzerAlarm',
        name: '高分贝声光警号',
        parentId: 'OtherDevices',
        orderNum: 2,
        type: 1,
        status: '启用',
        image: '/device/OnOff_Buzzer_Thumbnail.png',
        protocol: '开关量',
        description: '12V工业级高分贝红色频闪报警器'
      }
    ]
  },
  // 5. 环境参数
  {
    id: 'EnvParams',
    name: '环境参数',
    parentId: '0',
    orderNum: 5,
    type: 0,
    status: '启用',
    icon: 'el-icon-set-up',
    children: [
      {
        id: 'Dev_WeatherStation',
        name: '小型气象站',
        parentId: 'EnvParams',
        orderNum: 1,
        type: 1,
        status: '启用',
        image: '/device/RS485_WindSpeed_Thumbnail.png',
        protocol: 'Modbus TCP',
        description: '百叶箱集成风速、风向、温湿度、气压、雨量综合仪'
      },
      {
        id: 'Dev_SoilMulti',
        name: '土壤五合一传感器',
        parentId: 'EnvParams',
        orderNum: 2,
        type: 1,
        status: '启用',
        image: '/device/RS485_SoilHumiture_Thumbnail.png',
        protocol: 'Modbus RTU',
        description: '检测土壤水分、温度、电导率EC、PH值、氮磷钾'
      }
    ]
  },
  // 6. 智慧家居
  {
    id: 'SmartHome',
    name: '智慧家居',
    parentId: '0',
    orderNum: 6,
    type: 0,
    status: '启用',
    icon: 'el-icon-s-home',
    children: [
      {
        id: 'Dev_SmartLock',
        name: '智能指纹锁',
        parentId: 'SmartHome',
        orderNum: 1,
        type: 1,
        status: '启用',
        image: '/device/RS485_WaterTemperature_Thumbnail.png',
        protocol: 'Zigbee 3.0',
        description: '支持指纹、密码、NFC、临时密码多模开锁'
      },
      {
        id: 'Dev_CurtainMotor',
        name: '智能窗帘电机',
        parentId: 'SmartHome',
        orderNum: 2,
        type: 1,
        status: '启用',
        image: '/device/ZigBee_SigleRelay_Thumbnail.png',
        protocol: 'Zigbee 3.0',
        description: '静音导轨开合帘电机，支持百分比无级调控'
      }
    ]
  },
  // 7. 智慧安防
  {
    id: 'SmartSecurity',
    name: '智慧安防',
    parentId: '0',
    orderNum: 7,
    type: 0,
    status: '启用',
    icon: 'el-icon-video-camera',
    children: [
      {
        id: 'Dev_IPC_Camera',
        name: '全彩球机摄像头',
        parentId: 'SmartSecurity',
        orderNum: 1,
        type: 1,
        status: '启用',
        image: '/device/RS485_AirPressure_Thumbnail.png',
        protocol: 'ONVIF / RTSP',
        description: '400万星光全彩PTZ巡航AI人体追踪网络摄像机'
      },
      {
        id: 'Dev_InfraredBeam',
        name: '红外对射报警器',
        parentId: 'SmartSecurity',
        orderNum: 2,
        type: 1,
        status: '启用',
        image: '/device/OnOff_Body_Thumbnail.png',
        protocol: '开关量',
        description: '双光束防拆防剪周界主动红外入侵探测器'
      }
    ]
  },
  // 8. 智慧农业
  {
    id: 'SmartAgri',
    name: '智慧农业',
    parentId: '0',
    orderNum: 8,
    type: 0,
    status: '启用',
    icon: 'el-icon-menu',
    children: [
      {
        id: 'Dev_FertilizerMachine',
        name: '水肥一体机控制柜',
        parentId: 'SmartAgri',
        orderNum: 1,
        type: 1,
        status: '启用',
        image: '/device/RS485_Level_Thumbnail.png',
        protocol: 'Modbus TCP',
        description: '大田精准自动配方施肥与灌溉电磁阀协同控制器'
      },
      {
        id: 'Dev_GreenhouseRoller',
        name: '大棚电动卷膜机',
        parentId: 'SmartAgri',
        orderNum: 2,
        type: 1,
        status: '启用',
        image: '/device/New_ZigBee_Coordinator_Thumbnail.png',
        protocol: '485/无线',
        description: '双向自锁式大棚通风卷膜爬坡电驱总成'
      }
    ]
  }
];

// 内置预设图标选项
export const PRESET_ICONS = [
  { label: '帮助/问号', value: 'el-icon-help', iconName: 'HelpCircle' },
  { label: '应用/采集', value: 'el-icon-eleme', iconName: 'Cpu' },
  { label: '配置/设置', value: 'el-icon-setting', iconName: 'Settings' },
  { label: '图表/数据', value: 'el-icon-s-data', iconName: 'BarChart2' },
  { label: '参数/调节', value: 'el-icon-set-up', iconName: 'Sliders' },
  { label: '家居/房屋', value: 'el-icon-s-home', iconName: 'Home' },
  { label: '监控/视频', value: 'el-icon-video-camera', iconName: 'Video' },
  { label: '九宫/网格', value: 'el-icon-menu', iconName: 'LayoutGrid' },
  { label: '传感器/雷达', value: 'el-icon-radar', iconName: 'Radio' },
  { label: '网关/网络', value: 'el-icon-network', iconName: 'Network' },
  { label: '盒子/设备', value: 'el-icon-box', iconName: 'Box' },
  { label: '层级/分类', value: 'el-icon-folder', iconName: 'Folder' }
];
