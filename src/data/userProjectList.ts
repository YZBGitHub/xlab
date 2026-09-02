// 当前登录用户信息及自定义项目数据规范
export interface UserProjectItem {
  id: string | number;
  name: string;
  status: '已发布' | '未发布';
  date: string;
  tag: string;
  category: string;
  image: string;
  type: '系统应用' | '自定义应用';
  publisher: string;
  creator: string;
  views?: number;
  description?: string;
}

export const CURRENT_USER = {
  name: '杨振邦',
  maskedName: '杨**',
  phone: '15396005420'
};

/**
 * 判断是否为当前登录用户
 */
export const isCurrentUser = (nameOrAuthor?: string): boolean => {
  if (!nameOrAuthor) return false;
  const str = nameOrAuthor.trim();
  return (
    str === '杨振邦' || 
    str === '杨**' || 
    str === '杨*邦' || 
    str.includes('杨振邦') || 
    str.includes('(我)')
  );
};

// 本地存储键名
export const STORAGE_KEY_USER_PROJECTS = 'xlab_user_projects_v1';
export const STORAGE_KEY_CUSTOM_DEVICES = 'xlab_user_custom_devices_v1';

// 系统内置官方应用（所有用户可见）
export const initialSystemProjects: UserProjectItem[] = [
  { 
    id: 'sys_proj_1', 
    name: '基于LoRa的智慧农场环境监控系统', 
    category: '智慧农业', 
    tag: '智慧农业',
    publisher: '系统官方', 
    creator: '系统官方',
    time: '2025-10-10 22:14:56', 
    date: '2025-10-10 22:14:56',
    type: '系统应用', 
    status: '已发布',
    views: 1250, 
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500&h=300&fit=crop',
    description: '集成LoRa无线传感网与智能节水灌溉的典型示范系统。'
  } as any,
  { 
    id: 'sys_proj_3', 
    name: '城市智慧交通路口监控网络', 
    category: '智慧交通', 
    tag: '智慧交通',
    publisher: '系统官方', 
    creator: '系统官方',
    time: '2025-10-08 09:30:45', 
    date: '2025-10-08 09:30:45',
    type: '系统应用', 
    status: '已发布',
    views: 3400, 
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500&h=300&fit=crop',
    description: '模拟路口高清摄像机与信号灯控制器的总线联动通信。'
  } as any,
  { 
    id: 'sys_proj_5', 
    name: '温室大棚温湿度自动调节', 
    category: '智慧农业', 
    tag: '智慧农业',
    publisher: '系统官方', 
    creator: '系统官方',
    time: '2025-10-01 11:10:30', 
    date: '2025-10-01 11:10:30',
    type: '系统应用', 
    status: '已发布',
    views: 2100, 
    image: 'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?w=500&h=300&fit=crop',
    description: '闭环风机、湿帘与遮阳网PID自动化调节仿真。'
  } as any,
  { 
    id: 'sys_proj_8', 
    name: '智慧教室灯光环境调节', 
    category: '智慧家居', 
    tag: '智慧家居',
    publisher: '系统官方', 
    creator: '系统官方',
    time: '2025-09-22 08:45:12', 
    date: '2025-09-22 08:45:12',
    type: '系统应用', 
    status: '已发布',
    views: 1890, 
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=500&h=300&fit=crop',
    description: '照度传感器结合恒照度算法的节能照明仿真方案。'
  } as any,
];

// 当前用户的自定义项目初始列表（发布状态可由用户在控制台切换）
export const initialUserProjects: UserProjectItem[] = [
  { 
    id: 1, 
    name: '智慧农业2D虚拟仿真', 
    status: '已发布', 
    date: '2025-10-10 22:14:56', 
    tag: '智慧农业',
    category: '智慧农业',
    type: '自定义应用',
    publisher: CURRENT_USER.maskedName,
    creator: CURRENT_USER.name,
    views: 450,
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=380&fit=crop'
  },
  { 
    id: 2, 
    name: '智慧家居2D仿真', 
    status: '已发布', 
    date: '2025-10-10 23:40:28', 
    tag: '智慧家居',
    category: '智慧家居',
    type: '自定义应用',
    publisher: CURRENT_USER.maskedName,
    creator: CURRENT_USER.name,
    views: 320,
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=380&fit=crop'
  },
  { 
    id: 3, 
    name: '家居2D仿真【娱乐影音】', 
    status: '已发布', 
    date: '2025-10-11 00:01:21', 
    tag: '智慧家居',
    category: '智慧家居',
    type: '自定义应用',
    publisher: CURRENT_USER.maskedName,
    creator: CURRENT_USER.name,
    views: 180,
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=380&fit=crop'
  },
  { 
    id: 4, 
    name: '智慧安防2D仿真', 
    status: '已发布', 
    date: '2025-10-11 00:01:21', 
    tag: '智慧安防',
    category: '智慧安防',
    type: '自定义应用',
    publisher: CURRENT_USER.maskedName,
    creator: CURRENT_USER.name,
    views: 290,
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=380&fit=crop'
  },
  { 
    id: 5, 
    name: '交通2D仿真【隧道】', 
    status: '已发布', 
    date: '2025-10-11 00:11:21', 
    tag: '智慧交通',
    category: '智慧交通',
    type: '自定义应用',
    publisher: CURRENT_USER.maskedName,
    creator: CURRENT_USER.name,
    views: 156,
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&h=380&fit=crop'
  },
];
