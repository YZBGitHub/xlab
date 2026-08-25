export interface TagResourceItem {
  id: string | number;
  name: string;
  code: string;
  remark: string;
  resourceCount?: number;
  assignedResources?: {
    deviceIds?: string[];
    materialIds?: string[];
    projectIds?: number[];
  };
  createTime?: string;
}

export const initialTagResources: TagResourceItem[] = [
  {
    id: 1,
    name: '历史遗留',
    code: 'legacy',
    remark: '用于绑定标签资源功能上线前所有的案例。保证这些案例能正常使用',
    resourceCount: 42,
    assignedResources: {
      deviceIds: ['SensorPanel', 'CollectPanel'],
      projectIds: [1, 2, 3]
    },
    createTime: '2024-01-10 10:00:00'
  },
  {
    id: 2,
    name: '公共标签',
    code: 'public',
    remark: '用于即使没有购买案例的用户也可以使用的资源',
    resourceCount: 128,
    assignedResources: {
      deviceIds: ['SensorPanel', 'RFIDPanel', 'EnvParams'],
      projectIds: [1, 4]
    },
    createTime: '2024-02-15 14:30:00'
  },
  {
    id: 3,
    name: '智慧建筑能耗',
    code: 'zhihuinenghao',
    remark: '--',
    resourceCount: 16,
    assignedResources: {
      deviceIds: ['SmartHome', 'EnvParams'],
      projectIds: [2]
    },
    createTime: '2024-03-20 09:15:00'
  },
  {
    id: 4,
    name: '全量标签',
    code: 'total',
    remark: '用于比赛、私有化、测试等需要 全量测试或者使用的场景',
    resourceCount: 256,
    assignedResources: {
      deviceIds: ['SensorPanel', 'CollectPanel', 'RFIDPanel', 'OtherDevices', 'EnvParams', 'SmartHome', 'SmartSecurity', 'SmartAgri'],
      projectIds: [1, 2, 3, 4, 5]
    },
    createTime: '2024-04-05 11:20:00'
  },
  {
    id: 5,
    name: '行业云标签测试',
    code: 'test12',
    remark: '智慧化工案例',
    resourceCount: 8,
    assignedResources: {
      deviceIds: ['EnvParams', 'OtherDevices'],
      projectIds: [4]
    },
    createTime: '2024-05-12 16:40:00'
  }
];
