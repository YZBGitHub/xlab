export interface UserAppItem {
  id: string | number;
  name: string;
  phone: string;
  createTime: string;
  appType: string; // '仿真' | '实训' | '接线' | '控制'
  status: '草稿' | '已发布' | '已下架';
  coverImage?: string;
  source: '用户' | '系统库';
  author?: string;
  description?: string;
  viewCount?: number;
}

export const initialUserApps: UserAppItem[] = [
  {
    id: 1,
    name: '1',
    phone: '18396528500',
    createTime: '2025-04-28 14:48:06',
    appType: '仿真',
    status: '草稿',
    coverImage: '',
    source: '用户',
    author: '陈**',
    description: '基础传感器采集工程测试'
  },
  {
    id: 2,
    name: '智能家电',
    phone: '17996804886',
    createTime: '2024-05-14 17:28:03',
    appType: '仿真',
    status: '草稿',
    coverImage: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=500&h=300&fit=crop',
    source: '用户',
    author: '李**',
    description: '全屋智能家电联动与继电器调控仿真'
  },
  {
    id: 3,
    name: '智慧家居',
    phone: '17996804886',
    createTime: '2024-05-16 11:17:54',
    appType: '仿真',
    status: '草稿',
    coverImage: '',
    source: '用户',
    author: '李**',
    description: '室内环境温湿度监测及智能窗帘联动'
  },
  {
    id: 4,
    name: '智慧安防虚拟仿真',
    phone: '13011111006',
    createTime: '2024-04-12 16:31:22',
    appType: '仿真',
    status: '草稿',
    coverImage: '',
    source: '用户',
    author: '王**',
    description: '红外对射报警与网络高清摄像头周界防范'
  },
  {
    id: 5,
    name: '智慧农业接线',
    phone: '17856316832',
    createTime: '2025-06-09 15:11:27',
    appType: '仿真',
    status: '草稿',
    coverImage: '',
    source: '用户',
    author: '赵**',
    description: '大棚土壤墒情多合一传感器与水肥机电磁阀接线'
  },
  {
    id: 6,
    name: '智慧农业设备',
    phone: '17856316832',
    createTime: '2025-06-10 09:08:06',
    appType: '仿真',
    status: '草稿',
    coverImage: '',
    source: '用户',
    author: '赵**',
    description: '自动补光灯、风机与大棚卷膜器综合控制'
  },
  {
    id: 7,
    name: 'wqwd',
    phone: '18273689693',
    createTime: '2025-11-30 14:01:50',
    appType: '仿真',
    status: '草稿',
    coverImage: '',
    source: '用户',
    author: '张**',
    description: '自定义RS485协议调试测试台'
  },
  {
    id: 8,
    name: '工业机械臂视觉识别实训',
    phone: '13812345678',
    createTime: '2025-08-12 10:20:15',
    appType: '仿真',
    status: '已发布',
    coverImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=300&fit=crop',
    source: '用户',
    author: '杨**',
    description: '六轴机械臂物料抓取与视觉分拣闭环仿真'
  },
  {
    id: 9,
    name: '智能微电网储能监控系统',
    phone: '15987654321',
    createTime: '2025-07-20 16:45:30',
    appType: '仿真',
    status: '已发布',
    coverImage: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=500&h=300&fit=crop',
    source: '用户',
    author: '刘**',
    description: '光伏发电、储能电池与市电双向逆变仿真'
  },
  {
    id: 10,
    name: '城市智慧隧道消防联动',
    phone: '13766668888',
    createTime: '2025-05-18 09:30:00',
    appType: '仿真',
    status: '草稿',
    coverImage: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=500&h=300&fit=crop',
    source: '用户',
    author: '吴**',
    description: '特长隧道烟雾报警与排烟风机自动启动仿真'
  },
  // 系统库预置应用
  {
    id: 101,
    name: '智慧农业标准示范实训平台',
    phone: '10086000001',
    createTime: '2024-01-01 00:00:00',
    appType: '仿真',
    status: '已发布',
    coverImage: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=380&fit=crop',
    source: '系统库',
    author: '系统官方',
    description: '教育部推荐物联网专业标准实训教学方案'
  },
  {
    id: 102,
    name: '现代智能家居物联控制中心',
    phone: '10086000002',
    createTime: '2024-01-01 00:00:00',
    appType: '仿真',
    status: '已发布',
    coverImage: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=380&fit=crop',
    source: '系统库',
    author: '系统官方',
    description: '支持Zigbee 3.0网状组网与多传感器联动'
  },
  {
    id: 103,
    name: '工业4.0数字孪生智能产线',
    phone: '10086000003',
    createTime: '2024-01-01 00:00:00',
    appType: '仿真',
    status: '已发布',
    coverImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&h=380&fit=crop',
    source: '系统库',
    author: '系统官方',
    description: '基于Modbus TCP工业总线的智能制造装配示范'
  }
];
