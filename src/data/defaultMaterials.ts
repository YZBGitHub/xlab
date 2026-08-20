export interface DeviceMaterial {
  id: string;
  name: string;
  category: string;
  tags: string[];
  image: string;
  description: string;
  createdAt: string;
  usageCount?: number;
}

export const initialDeviceMaterials: DeviceMaterial[] = [
  {
    id: 'mat_01',
    name: '工业级温湿度变送器',
    category: '传感器',
    tags: ['RS485', 'Modbus', '壁挂式', '工业级', '温湿度'],
    image: '/device/RS485_Humiture_Thumbnail.png',
    description: '适用于机房、温室大棚和仓储环境的高精度壁挂式温湿度变送器外观素材。',
    createdAt: '2026-08-01 10:20',
    usageCount: 42,
  },
  {
    id: 'mat_02',
    name: '高精度二氧化碳传感器',
    category: '传感器',
    tags: ['NDIR', 'RS485', '空气质量', '气体检测', '室内监控'],
    image: '/device/RS485_CO2_Thumbnail.png',
    description: '基于非分光红外原理的CO2气体监测探头，常用于楼宇自动化与智慧农业。',
    createdAt: '2026-08-02 14:15',
    usageCount: 35,
  },
  {
    id: 'mat_03',
    name: '工业空气质量监测仪(PM2.5/PM10)',
    category: '传感器',
    tags: ['激光散射', '颗粒物', '环境监测', 'RS485'],
    image: '/device/RS485_PM25_Thumbnail.png',
    description: '室外/室内高精度颗粒物监测传感器，支持长周期稳定运行与多参数联动。',
    createdAt: '2026-08-03 09:30',
    usageCount: 28,
  },
  {
    id: 'mat_04',
    name: '土壤多参数监测仪(NPK/温湿盐)',
    category: '传感器',
    tags: ['智慧农业', '土壤检测', '不锈钢探针', '防水', 'RS485'],
    image: '/device/RS485_SoilHumiture_Thumbnail.png',
    description: '五针不锈钢耐腐蚀土壤传感器，实时采集土壤温湿度、EC电导率及肥力。',
    createdAt: '2026-08-04 16:45',
    usageCount: 56,
  },
  {
    id: 'mat_05',
    name: '三杯式脉冲风速传感器',
    category: '传感器',
    tags: ['气象监测', '风速仪', '铝合金', '室外', '防雷'],
    image: '/device/RS485_WindSpeed_Thumbnail.png',
    description: '黑色高强度铝合金外壳三杯式风速传感器，专用于气象观测与风力控制。',
    createdAt: '2026-08-05 11:00',
    usageCount: 19,
  },
  {
    id: 'mat_06',
    name: '投入式静压液位变送器',
    category: '传感器',
    tags: ['液位监测', '水利水务', '投入式', '防水IP68', '4-20mA'],
    image: '/device/RS485_Level_Thumbnail.png',
    description: '316L全不锈钢探头投入式水位传感器，用于水池、深井、河流液位实时测算。',
    createdAt: '2026-08-06 13:25',
    usageCount: 22,
  },
  {
    id: 'mat_07',
    name: '吸顶式人体微波/红外双鉴探测器',
    category: '传感器',
    tags: ['安防报警', '人体感应', '吸顶式', '红外', '微波'],
    image: '/device/RS485_Ceiling_Infrared_Thumbnail.png',
    description: '360度全方位吸顶安装人体活动传感器，有效过滤宠物与光线干扰。',
    createdAt: '2026-08-07 15:10',
    usageCount: 31,
  },
  {
    id: 'mat_08',
    name: '光电感烟火灾探测报警器',
    category: '传感器',
    tags: ['消防安全', '烟感', '声光报警', '低功耗', '独立/联动'],
    image: '/device/OnOff_Smoke_Thumbnail.png',
    description: '标准化光电烟雾报警传感器素材，具备防尘防虫结构设计与快速响应能力。',
    createdAt: '2026-08-08 17:05',
    usageCount: 48,
  },
  {
    id: 'mat_09',
    name: '智能变频灌溉水泵/电动阀门',
    category: '执行器',
    tags: ['水处理', '电动阀', '继电器控制', '强电控制', 'AC220V'],
    image: '/device/RS485_WaterPump_Thumbnail.png',
    description: '适用于农业灌溉管网与工业供水管路的电动受控阀门与泵体执行机构。',
    createdAt: '2026-08-09 08:40',
    usageCount: 39,
  },
  {
    id: 'mat_10',
    name: '标准导轨式智能微型断路器',
    category: '执行器',
    tags: ['配电控制', '导轨式', '断路器', '过载保护', '远程分合闸'],
    image: '/device/Relay_DINRailCircuitBreaker1P_Thumbnail.png',
    description: '标准DIN35mm导轨安装智能断路器/继电器，用于智慧能耗管理与电路远程通断。',
    createdAt: '2026-08-10 10:50',
    usageCount: 64,
  },
  {
    id: 'mat_11',
    name: '工业微动/行程限位开关',
    category: '执行器',
    tags: ['机械限位', '行程开关', '开关量', '高机械寿命'],
    image: '/device/OnOff_LimitSwitch_Thumbnail.png',
    description: '坚固机械限位触点开关，用于自动化流水线、仓储移动机构的位置到位检测。',
    createdAt: '2026-08-11 14:00',
    usageCount: 15,
  },
  {
    id: 'mat_12',
    name: '全网通边缘计算工业物联网网关',
    category: '网关/通信',
    tags: ['4G/5G', '以太网', '边缘计算', 'MQTT', '协议转换', '金属壳体'],
    image: '/device/UsrG771Gateway_Thumbnail.png',
    description: '具备多串口与以太网接口的高性能工业通信网关，内置多种PLC/仪器驱动协议。',
    createdAt: '2026-08-12 09:10',
    usageCount: 89,
  },
  {
    id: 'mat_13',
    name: '多功能物联网综合实验终端模块',
    category: '网关/通信',
    tags: ['教学实验', '多接口', 'OLED显示', '无线透传', 'STM32'],
    image: '/device/NewLabCommon_Thumbnail.png',
    description: '集成多种传感器接口与主控核心的通用物联网开发与实验仿真硬件外观。',
    createdAt: '2026-08-13 11:30',
    usageCount: 72,
  },
  {
    id: 'mat_14',
    name: '智能门禁考勤控制面板',
    category: '控制终端',
    tags: ['门禁', '人脸识别', '触摸屏', '继电器输出', 'RS485/以太网'],
    image: '/device/Other_XC40_DoorControl_Thumbnail.png',
    description: '嵌入式触摸显示门禁主控面板，提供直观操作交互与设备状态指示灯。',
    createdAt: '2026-08-14 15:45',
    usageCount: 26,
  },
  {
    id: 'mat_15',
    name: '工业光电隔离远程I/O采集模块',
    category: '控制终端',
    tags: ['ADAM4017', '模拟量采集', '数字量IO', 'Modbus', '导轨安装'],
    image: '/device/Switch_LH_IO404_RS485_Thumbnail.png',
    description: '多路模拟量(AI)与开关量(DI/DO)采集控制一体化模块，工业现场标准节点。',
    createdAt: '2026-08-15 16:20',
    usageCount: 45,
  }
];

export const materialCategories = [
  '全部',
  '传感器',
  '执行器',
  '网关/通信',
  '控制终端',
  '仪器设备',
  '通用外观'
];

export const commonMaterialTags = [
  'RS485', 'Modbus', 'MQTT', 'Zigbee', 'Lora', '4G/5G',
  '工业级', '壁挂式', '导轨式', '吸顶式', '防水IP68',
  '温湿度', '空气质量', '智慧农业', '水质监测', '安防报警',
  '配电控制', '金属壳体', '触摸屏', '低功耗'
];
