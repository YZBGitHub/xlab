import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Sliders, Eye, Trash2, Globe, Lock, X, Check, 
  RotateCcw, ChevronLeft, ChevronRight, Activity, Zap, Cpu,
  Layers, AlertCircle, CheckCircle2, Phone, Calendar, Info,
  Smartphone, Filter, Tag, Code, Terminal, Copy, Box,
  FolderTree, Plus, Sparkles, FolderPlus, ArrowRight
} from 'lucide-react';
import { UserCustomDeviceItem, initialUserCustomDevices } from '../data/userCustomDeviceList';
import { initialSystemDeviceTree, SystemDeviceNode } from '../data/systemDeviceTree';
import { getDeviceImageUrl } from '../utils/deviceImages';
import { getDeviceProtocolInfo } from '../utils/deviceProtocolHelper';

const STORAGE_KEY = 'xlab_user_custom_devices_v1';
const SYSTEM_TREE_STORAGE_KEY = 'xlab_system_sim_devices_v1';

// 递归提取系统设备树中所有的“分类”（Type 0）节点并生成全路径名称
interface CategoryOption {
  id: string;
  name: string;
  fullPath: string;
}

function extractCategoriesFromTree(nodes: SystemDeviceNode[], parentPath = ''): CategoryOption[] {
  let categories: CategoryOption[] = [];
  for (const node of nodes) {
    if (node.type === 0) {
      const currentPath = parentPath ? `${parentPath} / ${node.name}` : node.name;
      categories.push({
        id: node.id,
        name: node.name,
        fullPath: currentPath
      });
      if (node.children && node.children.length > 0) {
        categories = categories.concat(extractCategoriesFromTree(node.children, currentPath));
      }
    }
  }
  return categories;
}

// 递归向系统设备树的目标分类节点下追加子设备
function addDeviceToSystemTree(nodes: SystemDeviceNode[], targetParentId: string, newDevice: SystemDeviceNode): SystemDeviceNode[] {
  return nodes.map(node => {
    if (node.id === targetParentId) {
      const currentChildren = node.children ? [...node.children] : [];
      return {
        ...node,
        children: [...currentChildren, newDevice]
      };
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: addDeviceToSystemTree(node.children, targetParentId, newDevice)
      };
    }
    return node;
  });
}

export default function UserCustomDeviceManager() {
  // 数据源
  const [deviceList, setDeviceList] = useState<UserCustomDeviceItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load user custom devices from storage', e);
    }
    return initialUserCustomDevices;
  });

  // 本地持久化
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deviceList));
    } catch (e) {
      console.error('Failed to save user custom devices to storage', e);
    }
  }, [deviceList]);

  // Tab 切换：'用户库' | '系统库'
  const [activeTab, setActiveTab] = useState<'用户库' | '系统库'>('用户库');

  // 筛选表单输入状态
  const [filterPhone, setFilterPhone] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterProtocol, setFilterProtocol] = useState('all');
  const [filterPublishStatus, setFilterPublishStatus] = useState('all');
  const [filterTimeRange, setFilterTimeRange] = useState('all');

  // 生效的过滤条件
  const [appliedFilters, setAppliedFilters] = useState({
    phone: '',
    name: '',
    type: 'all',
    protocol: 'all',
    status: 'all',
    timeRange: 'all'
  });

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpPageInput, setJumpPageInput] = useState('1');

  // 详情弹窗状态
  const [detailDevice, setDetailDevice] = useState<UserCustomDeviceItem | null>(null);
  const [deviceModalTab, setDeviceModalTab] = useState<'basic' | 'protocol'>('basic');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // 克隆至系统设备库弹窗状态
  const [cloneModalDevice, setCloneModalDevice] = useState<UserCustomDeviceItem | null>(null);
  const [cloneNewName, setCloneNewName] = useState('');
  const [cloneTargetCategory, setCloneTargetCategory] = useState('');
  const [cloneOrderNum, setCloneOrderNum] = useState(1);
  const [cloneStatus, setCloneStatus] = useState<'启用' | '禁用'>('启用');

  // 系统分类列表（供克隆选择）
  const [systemCategories, setSystemCategories] = useState<CategoryOption[]>([]);

  // 删除二次确认弹窗
  const [deleteConfirmDevice, setDeleteConfirmDevice] = useState<UserCustomDeviceItem | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Toast 提示
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 2500);
  };

  // 加载系统设备树分类
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SYSTEM_TREE_STORAGE_KEY);
      const tree: SystemDeviceNode[] = saved ? JSON.parse(saved) : initialSystemDeviceTree;
      const cats = extractCategoriesFromTree(tree);
      setSystemCategories(cats);
      if (cats.length > 0 && !cloneTargetCategory) {
        setCloneTargetCategory(cats[0].id);
      }
    } catch (e) {
      const cats = extractCategoriesFromTree(initialSystemDeviceTree);
      setSystemCategories(cats);
      if (cats.length > 0) {
        setCloneTargetCategory(cats[0].id);
      }
    }
  }, []);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
    showToast('报文已复制至剪贴板', 'info');
  };

  // 执行搜索
  const handleSearch = () => {
    setAppliedFilters({
      phone: filterPhone.trim(),
      name: filterName.trim(),
      type: filterType,
      protocol: filterProtocol,
      status: filterPublishStatus,
      timeRange: filterTimeRange
    });
    setCurrentPage(1);
    setJumpPageInput('1');
  };

  // 重置筛选
  const handleResetFilters = () => {
    setFilterPhone('');
    setFilterName('');
    setFilterType('all');
    setFilterProtocol('all');
    setFilterPublishStatus('all');
    setFilterTimeRange('all');
    setAppliedFilters({
      phone: '',
      name: '',
      type: 'all',
      protocol: 'all',
      status: 'all',
      timeRange: 'all'
    });
    setCurrentPage(1);
    setJumpPageInput('1');
    showToast('已重置所有筛选条件', 'info');
  };

  // 统计各 Tab 下的总数量
  const countStats = useMemo(() => {
    const userCount = deviceList.filter(d => (d.source || '用户') === '用户').length;
    const systemCount = deviceList.filter(d => d.source === '系统库').length;
    return { userCount, systemCount };
  }, [deviceList]);

  // 检查是否有活跃的筛选
  const hasActiveFilters = useMemo(() => {
    return (
      appliedFilters.phone !== '' ||
      appliedFilters.name !== '' ||
      appliedFilters.type !== 'all' ||
      appliedFilters.protocol !== 'all' ||
      appliedFilters.status !== 'all' ||
      appliedFilters.timeRange !== 'all'
    );
  }, [appliedFilters]);

  // 过滤后的设备列表（先根据 Tab 过滤，再根据搜索条件过滤）
  const filteredDevices = useMemo(() => {
    const now = new Date().getTime();
    const targetSource = activeTab === '用户库' ? '用户' : '系统库';

    return deviceList.filter(item => {
      // 1. Tab 归属判断
      const itemSource = item.source || '用户';
      if (itemSource !== targetSource) {
        return false;
      }

      // 2. 手机号码过滤
      if (appliedFilters.phone && !item.phone.includes(appliedFilters.phone)) {
        return false;
      }

      // 3. 设备名称过滤
      if (appliedFilters.name && !item.name.toLowerCase().includes(appliedFilters.name.toLowerCase())) {
        return false;
      }

      // 4. 设备类型过滤
      if (appliedFilters.type !== 'all' && item.type !== appliedFilters.type) {
        return false;
      }

      // 5. 设备协议过滤
      if (appliedFilters.protocol !== 'all') {
        if (!item.protocol.toLowerCase().includes(appliedFilters.protocol.toLowerCase())) {
          return false;
        }
      }

      // 6. 发布状态过滤
      if (appliedFilters.status !== 'all' && item.publishStatus !== appliedFilters.status) {
        return false;
      }

      // 7. 发布/创建时间过滤
      if (appliedFilters.timeRange !== 'all') {
        const itemTime = new Date(item.createTime.replace(/-/g, '/')).getTime();
        const diffDays = (now - itemTime) / (1000 * 3600 * 24);
        if (appliedFilters.timeRange === '7d' && diffDays > 7) return false;
        if (appliedFilters.timeRange === '30d' && diffDays > 30) return false;
        if (appliedFilters.timeRange === '90d' && diffDays > 90) return false;
        if (appliedFilters.timeRange === '365d' && diffDays > 365) return false;
      }

      return true;
    });
  }, [deviceList, activeTab, appliedFilters]);

  // 分页计算
  const totalCount = filteredDevices.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const paginatedDevices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDevices.slice(start, start + pageSize);
  }, [filteredDevices, currentPage, pageSize]);

  // 切换发布状态
  const handleTogglePublishStatus = (device: UserCustomDeviceItem) => {
    const nextStatus = device.publishStatus === 'published' ? 'unpublished' : 'published';
    setDeviceList(prev =>
      prev.map(d =>
        d.id === device.id
          ? {
              ...d,
              publishStatus: nextStatus,
              publishToSimulation: nextStatus === 'published'
            }
          : d
      )
    );
    showToast(
      nextStatus === 'published'
        ? `已将【${device.name}】发布至公共仿真大厅`
        : `已将【${device.name}】设为私有未发布`,
      nextStatus === 'published' ? 'success' : 'info'
    );
  };

  // 打开克隆弹窗
  const handleOpenCloneModal = (device: UserCustomDeviceItem) => {
    setCloneModalDevice(device);
    setCloneNewName(`${device.name}_系统副本`);
    setCloneOrderNum(1);
    setCloneStatus('启用');
    if (systemCategories.length > 0 && !cloneTargetCategory) {
      setCloneTargetCategory(systemCategories[0].id);
    }
  };

  // 确认克隆并写入系统设备库
  const handleConfirmCloneToSystem = () => {
    if (!cloneModalDevice) return;
    if (!cloneNewName.trim()) {
      showToast('请输入新设备名称', 'error');
      return;
    }
    if (!cloneTargetCategory) {
      showToast('请选择目标系统分类目录', 'error');
      return;
    }

    const targetCategoryObj = systemCategories.find(c => c.id === cloneTargetCategory);
    const categoryName = targetCategoryObj ? targetCategoryObj.fullPath : '系统设备库';

    // 1. 构造系统仿真设备树节点
    const newSystemNode: SystemDeviceNode = {
      id: `sys_clone_${Date.now()}`,
      name: cloneNewName.trim(),
      parentId: cloneTargetCategory,
      orderNum: cloneOrderNum,
      type: 1, // 设备
      status: cloneStatus,
      image: cloneModalDevice.image,
      protocol: cloneModalDevice.protocol,
      deviceType: cloneModalDevice.type === '继电器' ? '执行器' : cloneModalDevice.type,
      description: cloneModalDevice.description || `克隆自用户自定义设备【${cloneModalDevice.name}】`,
      createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      config: {
        deviceType: cloneModalDevice.type === '继电器' ? '执行器' : cloneModalDevice.type,
        powerType: cloneModalDevice.power.includes('AC') ? '交流' : cloneModalDevice.power.includes('无需') ? '无需供电' : '直流',
        acVoltage: '220V',
        dcVoltage: cloneModalDevice.power.includes('24V') ? '24V' : cloneModalDevice.power.includes('5V') ? '5V' : '12V',
        protocol: cloneModalDevice.protocol,
        modbusAttrs: cloneModalDevice.modbusAttrs?.map(a => ({
          name: a.name,
          unit: a.unit,
          precision: a.precision || '1',
          range: a.range || '0-100',
          funcCode: '0x03',
          startAddr: '0001',
          dataLen: '1',
          formula: 'R0=val/10'
        }))
      }
    };

    // 2. 写入系统仿真设备树 LocalStorage
    try {
      const saved = localStorage.getItem(SYSTEM_TREE_STORAGE_KEY);
      const currentTree: SystemDeviceNode[] = saved ? JSON.parse(saved) : initialSystemDeviceTree;
      const updatedTree = addDeviceToSystemTree(currentTree, cloneTargetCategory, newSystemNode);
      localStorage.setItem(SYSTEM_TREE_STORAGE_KEY, JSON.stringify(updatedTree));
    } catch (e) {
      console.error('Failed to update system tree in storage', e);
    }

    // 3. 同时在当前自定义设备中追加一条 source: '系统库' 的记录
    const newCustomSystemDevice: UserCustomDeviceItem = {
      ...cloneModalDevice,
      id: `uc_sys_${Date.now()}`,
      name: cloneNewName.trim(),
      source: '系统库',
      targetCategoryId: cloneTargetCategory,
      publishStatus: 'published',
      publishToSimulation: true,
      createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    };

    setDeviceList(prev => [newCustomSystemDevice, ...prev]);
    showToast(`成功将【${cloneModalDevice.name}】克隆至系统设备库【${categoryName}】！`, 'success');
    setCloneModalDevice(null);
  };

  // 确认删除设备
  const handleConfirmDelete = () => {
    if (!deleteConfirmDevice) return;
    setDeviceList(prev => prev.filter(d => d.id !== deleteConfirmDevice.id));
    showToast(`已删除自定义设备【${deleteConfirmDevice.name}】`, 'info');
    setDeleteConfirmDevice(null);
  };

  // 页码跳转
  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    } else {
      setJumpPageInput(String(currentPage));
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden select-none">
      {/* Toast 提示条 */}
      {toastMsg && (
        <div className={`fixed top-16 right-8 z-50 px-4 py-2.5 rounded-lg shadow-lg border text-sm flex items-center gap-2 animate-bounce transition-all ${
          toastMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          toastMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' :
          'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* 顶部工具栏：左侧 Tabs (用户库 / 系统库)，右侧多维复合筛选与搜索 */}
      <div className="px-6 py-3.5 border-b border-gray-100 bg-white shrink-0 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* 左侧：Tabs 切换 (用户库 vs 系统库) */}
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50/80 shadow-2xs">
              <button
                onClick={() => {
                  setActiveTab('用户库');
                  setCurrentPage(1);
                  setJumpPageInput('1');
                }}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === '用户库'
                    ? 'bg-white text-[#1890ff] shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>用户库</span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === '用户库' ? 'bg-blue-50 text-blue-600' : 'bg-gray-200/70 text-gray-500'
                }`}>
                  {countStats.userCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('系统库');
                  setCurrentPage(1);
                  setJumpPageInput('1');
                }}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === '系统库'
                    ? 'bg-white text-[#1890ff] shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>系统库</span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === '系统库' ? 'bg-blue-50 text-blue-600' : 'bg-gray-200/70 text-gray-500'
                }`}>
                  {countStats.systemCount}
                </span>
              </button>
            </div>

            <span className="text-xs text-gray-400">
              {activeTab === '用户库' ? '用户自建设备，支持一键克隆至系统设备库' : '已归档沉淀为公共系统模板的设备'}
            </span>
          </div>

          {/* 右侧筛选器组 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. 手机号码 */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">用户手机:</span>
              <input
                type="text"
                value={filterPhone}
                onChange={(e) => setFilterPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索手机号"
                className="w-28 h-8 px-2.5 text-xs text-gray-700 bg-white border border-gray-300 rounded outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] placeholder:text-gray-400"
              />
            </div>

            {/* 2. 设备名称 */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">设备名称:</span>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索设备名称"
                className="w-32 h-8 px-2.5 text-xs text-gray-700 bg-white border border-gray-300 rounded outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] placeholder:text-gray-400"
              />
            </div>

            {/* 3. 设备类型 */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">类型:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-8 px-2 text-xs text-gray-700 bg-white border border-gray-300 rounded outline-none focus:border-[#1890ff] cursor-pointer"
              >
                <option value="all">全部类型</option>
                <option value="传感器">传感器</option>
                <option value="执行器">执行器</option>
                <option value="网关">网关</option>
                <option value="继电器">继电器</option>
              </select>
            </div>

            {/* 4. 设备协议 */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">协议:</span>
              <select
                value={filterProtocol}
                onChange={(e) => setFilterProtocol(e.target.value)}
                className="h-8 px-2 text-xs text-gray-700 bg-white border border-gray-300 rounded outline-none focus:border-[#1890ff] cursor-pointer"
              >
                <option value="all">全部协议</option>
                <option value="Modbus">Modbus (RTU/TCP)</option>
                <option value="Zigbee">Zigbee</option>
                <option value="MQTT">MQTT</option>
                <option value="Lora">Lora</option>
                <option value="模拟量">模拟量</option>
                <option value="开关量">开关量</option>
              </select>
            </div>

            {/* 5. 发布状态 */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">状态:</span>
              <select
                value={filterPublishStatus}
                onChange={(e) => setFilterPublishStatus(e.target.value)}
                className="h-8 px-2 text-xs text-gray-700 bg-white border border-gray-300 rounded outline-none focus:border-[#1890ff] cursor-pointer"
              >
                <option value="all">全部状态</option>
                <option value="published">已发布 (公共大厅)</option>
                <option value="unpublished">未发布 (私有)</option>
              </select>
            </div>

            {/* 6. 发布时间 */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">时间:</span>
              <select
                value={filterTimeRange}
                onChange={(e) => setFilterTimeRange(e.target.value)}
                className="h-8 px-2 text-xs text-gray-700 bg-white border border-gray-300 rounded outline-none focus:border-[#1890ff] cursor-pointer"
              >
                <option value="all">全部时间</option>
                <option value="7d">近 7 天</option>
                <option value="30d">近 30 天</option>
                <option value="90d">近 3 个月</option>
                <option value="365d">近 1 年</option>
              </select>
            </div>

            {/* 搜索与重置按钮 */}
            <div className="flex items-center gap-1.5 ml-1">
              <button
                onClick={handleSearch}
                className="h-8 px-3.5 bg-[#1890ff] hover:bg-[#40a9ff] text-white text-xs font-medium rounded flex items-center gap-1 transition-colors shadow-2xs cursor-pointer active:scale-98"
              >
                <Search size={13} className="stroke-[2.5]" />
                <span>搜索</span>
              </button>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="h-8 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded transition-colors cursor-pointer"
                  title="重置全部筛选条件"
                >
                  重置
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 数据表格区域 */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[#fafafa] border-b border-gray-200 z-10">
            <tr className="text-gray-600 text-xs font-medium select-none">
              <th className="py-3 px-4 w-[6%] text-center">序号</th>
              <th className="py-3 px-6 w-[22%]">设备名称</th>
              <th className="py-3 px-6 w-[16%]">创建用户 / 手机号</th>
              <th className="py-3 px-4 w-[10%] text-center">设备类型</th>
              <th className="py-3 px-4 w-[12%] text-center">通讯协议</th>
              <th className="py-3 px-4 w-[10%] text-center">供电方式</th>
              <th className="py-3 px-4 w-[10%] text-center">发布状态</th>
              <th className="py-3 px-6 w-[14%] text-center">创建时间</th>
              <th className="py-3 px-6 w-[12%] text-center">操作</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
            {paginatedDevices.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-20 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Cpu size={36} className="text-gray-300 stroke-1" />
                    <span>暂无符合条件的【{activeTab}】自定义设备</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedDevices.map((item, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index + 1;
                const isPublished = item.publishStatus === 'published';

                return (
                  <tr key={item.id} className="hover:bg-[#f5f9ff] transition-colors group">
                    {/* 1. 序号 */}
                    <td className="py-3.5 px-4 text-center text-gray-500 font-mono">
                      {globalIndex}
                    </td>

                    {/* 2. 设备名称与封面 */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div 
                          onClick={() => item.image && setPreviewImage(item.image)}
                          className="w-8 h-8 rounded border border-gray-200 bg-white p-0.5 shrink-0 flex items-center justify-center cursor-pointer hover:border-blue-500"
                          title="点击放大预览"
                        >
                          <img 
                            src={getDeviceImageUrl(item.id, item.image)} 
                            alt={item.name} 
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div>
                          <div 
                            onClick={() => {
                              setDetailDevice(item);
                              setDeviceModalTab('basic');
                            }}
                            className="font-medium text-gray-800 hover:text-blue-600 text-xs cursor-pointer transition-colors"
                          >
                            {item.name}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono flex items-center gap-2">
                            <span>ID: {item.id}</span>
                            {item.source === '系统库' && (
                              <span className="text-purple-600 bg-purple-50 px-1 rounded text-[9px] font-sans">系统库模板</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 3. 创建用户 / 手机号 */}
                    <td className="py-3.5 px-6">
                      <div>
                        <div className="font-medium text-gray-800 text-xs">{item.userName}</div>
                        <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1">
                          <Smartphone size={11} className="text-gray-400" />
                          <span>{item.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* 4. 设备类型 */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        item.type === '传感器' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        item.type === '执行器' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        item.type === '网关' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {item.type}
                      </span>
                    </td>

                    {/* 5. 通讯协议 */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono text-gray-700 text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {item.protocol}
                      </span>
                    </td>

                    {/* 6. 供电方式 */}
                    <td className="py-3.5 px-4 text-center font-mono text-gray-600 text-xs">
                      {item.power || 'DC 12V'}
                    </td>

                    {/* 7. 发布状态 (可切换) */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleTogglePublishStatus(item)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                          isPublished
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                        }`}
                        title="点击快速切换发布状态"
                      >
                        {isPublished ? <Globe size={11} /> : <Lock size={11} />}
                        <span>{isPublished ? '已发布' : '未发布'}</span>
                      </button>
                    </td>

                    {/* 8. 创建/发布时间 */}
                    <td className="py-3.5 px-6 text-center text-gray-500 font-mono text-xs">
                      {item.createTime}
                    </td>

                    {/* 9. 操作列 (包含：详情、克隆至系统库、删除) */}
                    <td className="py-3.5 px-6 text-center">
                      <div className="flex items-center justify-center gap-2.5">
                        <button
                          onClick={() => {
                            setDetailDevice(item);
                            setDeviceModalTab('basic');
                          }}
                          className="text-[#1890ff] hover:text-[#40a9ff] flex items-center gap-0.5 font-medium cursor-pointer"
                          title="查看完整详情与协议参数"
                        >
                          <Sliders size={12} />
                          <span>详情</span>
                        </button>

                        {/* 克隆按钮：将用户自定义设备克隆到系统仿真设备库 */}
                        <button
                          onClick={() => handleOpenCloneModal(item)}
                          className="text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 font-medium cursor-pointer"
                          title="克隆此设备并指定系统目录归档至系统设备库"
                        >
                          <Copy size={12} />
                          <span>克隆</span>
                        </button>

                        <button
                          onClick={() => setDeleteConfirmDevice(item)}
                          className="text-gray-400 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer"
                          title="删除设备"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 底部翻页栏 */}
      <div className="px-6 py-3.5 border-t border-gray-100 bg-white flex items-center justify-between text-xs text-gray-600 shrink-0 select-none">
        <div className="text-gray-500">
          共 <span className="font-bold text-gray-800">{totalCount}</span> 款【{activeTab}】设备，当前显示第 {currentPage} / {totalPages} 页
        </div>

        <div className="flex items-center gap-4">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded px-2 py-1 bg-white text-xs text-gray-700 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value={10}>10条/页</option>
            <option value={20}>20条/页</option>
            <option value={50}>50条/页</option>
          </select>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage(Math.max(1, currentPage - 1));
                setJumpPageInput(String(Math.max(1, currentPage - 1)));
              }}
              className={`w-7 h-7 rounded border flex items-center justify-center transition-colors ${
                currentPage === 1
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                  : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-500 cursor-pointer bg-white'
              }`}
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => {
                  setCurrentPage(page);
                  setJumpPageInput(String(page));
                }}
                className={`w-7 h-7 rounded text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
                  currentPage === page
                    ? 'bg-[#1890ff] text-white border border-[#1890ff] shadow-xs'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-500'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage(Math.min(totalPages, currentPage + 1));
                setJumpPageInput(String(Math.min(totalPages, currentPage + 1)));
              }}
              className={`w-7 h-7 rounded border flex items-center justify-center transition-colors ${
                currentPage === totalPages
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                  : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-500 cursor-pointer bg-white'
              }`}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <form onSubmit={handleJumpPage} className="flex items-center gap-1 text-gray-600">
            <span>前往</span>
            <input
              type="text"
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              className="w-10 h-7 text-center border border-gray-300 rounded text-xs outline-none focus:border-blue-500 bg-white"
            />
            <span>页</span>
          </form>
        </div>
      </div>

      {/* 克隆设备至系统设备库模态框 */}
      {cloneModalDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-[520px] overflow-hidden animate-in zoom-in-95 duration-150 border border-gray-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/80 to-blue-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-2xs">
                  <Copy size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">克隆至系统设备库</h3>
                  <p className="text-[11px] text-gray-500">将用户设备沉淀为公共系统仿真模型</p>
                </div>
              </div>
              <button 
                onClick={() => setCloneModalDevice(null)}
                className="text-gray-400 hover:text-gray-600 rounded p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* 原设备基础信息预览卡片 */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200/80">
                <div className="w-10 h-10 rounded border bg-white p-1 flex items-center justify-center shrink-0">
                  <img src={getDeviceImageUrl(cloneModalDevice.id, cloneModalDevice.image)} alt={cloneModalDevice.name} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800 text-xs truncate">{cloneModalDevice.name}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>创建者: {cloneModalDevice.userName}</span>
                    <span>类型: {cloneModalDevice.type}</span>
                    <span>协议: {cloneModalDevice.protocol}</span>
                  </div>
                </div>
              </div>

              {/* 1. 新设备名称 */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">
                  <span className="text-red-500 mr-1">*</span>系统设备名称：
                </label>
                <input
                  type="text"
                  value={cloneNewName}
                  onChange={(e) => setCloneNewName(e.target.value)}
                  placeholder="请输入克隆后的设备名称"
                  className="w-full h-8 px-3 text-xs border border-gray-300 rounded outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff]"
                />
              </div>

              {/* 2. 目标系统分类目录 */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">
                  <span className="text-red-500 mr-1">*</span>目标系统分类目录：
                </label>
                <div className="relative">
                  <select
                    value={cloneTargetCategory}
                    onChange={(e) => setCloneTargetCategory(e.target.value)}
                    className="w-full h-8 px-3 text-xs border border-gray-300 rounded outline-none focus:border-[#1890ff] bg-white cursor-pointer"
                  >
                    {systemCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.fullPath}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  克隆后该设备将出现在“系统仿真设备”及设计器左侧对应分类下
                </p>
              </div>

              {/* 3. 排序号与初始状态 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">排序序号：</label>
                  <input
                    type="number"
                    min={1}
                    value={cloneOrderNum}
                    onChange={(e) => setCloneOrderNum(Number(e.target.value))}
                    className="w-full h-8 px-3 text-xs border border-gray-300 rounded outline-none focus:border-[#1890ff]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">初始状态：</label>
                  <select
                    value={cloneStatus}
                    onChange={(e) => setCloneStatus(e.target.value as '启用' | '禁用')}
                    className="w-full h-8 px-3 text-xs border border-gray-300 rounded outline-none focus:border-[#1890ff] bg-white cursor-pointer"
                  >
                    <option value="启用">启用 (上线)</option>
                    <option value="禁用">禁用 (暂不上线)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCloneModalDevice(null)}
                className="px-3.5 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-white text-xs transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmCloneToSystem}
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Check size={14} />
                <span>确认克隆入库</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 设备详情配置查看弹窗 (基础信息 / 协议信息 / 关闭按钮 靠右整齐布局) */}
      {detailDevice && (() => {
        const protocolInfo = getDeviceProtocolInfo(detailDevice);
        const hasProtocolTab = protocolInfo.protocolCategory === 'modbus' || protocolInfo.protocolCategory === 'analog';

        return (
          <div className="fixed inset-0 bg-black/65 z-[9999] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95 duration-200">
              {/* Modal Header: 左侧设备名与信息，右侧 Tabs 与关闭按钮 */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/90 gap-4 shrink-0">
                {/* Left Side Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
                    {String(detailDevice.name || '').slice(0, 1) || '设'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-base tracking-tight truncate">{detailDevice.name}</h3>
                      <span className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-purple-200">
                        {detailDevice.source === '系统库' ? '系统库模板' : '用户自定义'}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                        {detailDevice.protocol || '标准协议'}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        detailDevice.publishStatus === 'published' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${detailDevice.publishStatus === 'published' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                        {detailDevice.publishStatus === 'published' ? '已发布' : '未发布'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono mt-0.5 flex items-center gap-3">
                      <span>ID: {detailDevice.id}</span>
                      <span>创建用户: <strong className="text-gray-700">{detailDevice.userName}</strong> ({detailDevice.phone})</span>
                    </p>
                  </div>
                </div>

                {/* Right Side: Tab Buttons & Close Button */}
                <div className="flex items-center gap-3 shrink-0 ml-auto">
                  {hasProtocolTab && (
                    <div className="flex bg-gray-200/70 p-1 rounded-xl border border-gray-300/40 shadow-2xs">
                      <button
                        onClick={() => setDeviceModalTab('basic')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          deviceModalTab === 'basic'
                            ? 'bg-white text-gray-800 shadow-xs'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        基础信息
                      </button>
                      <button
                        onClick={() => setDeviceModalTab('protocol')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          deviceModalTab === 'protocol'
                            ? 'bg-white text-[#00a0e9] shadow-xs'
                            : 'text-gray-500 hover:text-[#00a0e9]'
                        }`}
                      >
                        <Code size={13} />
                        协议信息
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => setDetailDevice(null)} 
                    className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    title="关闭"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                {/* TAB 1: Basic Info View */}
                {(deviceModalTab === 'basic' || !hasProtocolTab) && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left: Device Image Box & Actions */}
                      <div className="lg:col-span-4 flex flex-col gap-3">
                        <div className="bg-gradient-to-b from-purple-50/60 to-indigo-50/40 border-purple-100 rounded-xl p-5 border flex flex-col items-center justify-center relative min-h-[220px] group shadow-inner">
                          <img 
                            src={getDeviceImageUrl(detailDevice.id, detailDevice.image)} 
                            alt={detailDevice.name} 
                            className="max-h-48 max-w-full object-contain mix-blend-multiply drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute bottom-2 right-2 text-[10px] text-gray-500 bg-white/90 px-2 py-0.5 rounded border border-gray-200 shadow-2xs font-medium">
                            物料贴图
                          </span>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => {
                              const dev = detailDevice;
                              setDetailDevice(null);
                              handleOpenCloneModal(dev);
                            }}
                            className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                          >
                            <Copy size={14} /> 克隆至系统设备库
                          </button>
                        </div>
                      </div>

                      {/* Right: Specs & Hardware Attributes */}
                      <div className="lg:col-span-8 flex flex-col gap-4">
                        {/* Attributes Grid */}
                        <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="flex justify-between py-1.5 px-2.5 bg-white rounded-lg border border-gray-100 shadow-2xs">
                            <span className="text-gray-400 font-medium">所属库别</span>
                            <span className="font-semibold text-purple-700">{detailDevice.source === '系统库' ? '系统库模板' : '用户库'}</span>
                          </div>
                          <div className="flex justify-between py-1.5 px-2.5 bg-white rounded-lg border border-gray-100 shadow-2xs">
                            <span className="text-gray-400 font-medium">创建用户</span>
                            <span className="text-gray-800 font-semibold">{detailDevice.userName} ({detailDevice.phone})</span>
                          </div>
                          <div className="flex justify-between py-1.5 px-2.5 bg-white rounded-lg border border-gray-100 shadow-2xs">
                            <span className="text-gray-400 font-medium">设备类型</span>
                            <span className="bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded border border-blue-100">{detailDevice.type || '传感器'}</span>
                          </div>
                          <div className="flex justify-between py-1.5 px-2.5 bg-white rounded-lg border border-gray-100 shadow-2xs">
                            <span className="text-gray-400 font-medium">通讯协议</span>
                            <span className="bg-emerald-50 text-emerald-600 font-medium px-2 py-0.5 rounded border border-emerald-100">{detailDevice.protocol || '标准协议'}</span>
                          </div>
                          <div className="flex justify-between py-1.5 px-2.5 bg-white rounded-lg border border-gray-100 shadow-2xs">
                            <span className="text-gray-400 font-medium">供电规格</span>
                            <span className="text-gray-800 font-mono">{detailDevice.power || 'DC 12V / 24V 工业级'}</span>
                          </div>
                          <div className="flex justify-between py-1.5 px-2.5 bg-white rounded-lg border border-gray-100 shadow-2xs">
                            <span className="text-gray-400 font-medium">发布状态</span>
                            <span className={`font-semibold px-2 py-0.5 rounded border text-[11px] ${
                              detailDevice.publishStatus === 'published' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                              {detailDevice.publishStatus === 'published' ? '已公开在公共仿真设备库' : '仅控制台私有'}
                            </span>
                          </div>
                        </div>

                        {/* Wiring / Pin Interface Reference */}
                        <div className="bg-blue-50/40 rounded-xl p-3.5 border border-blue-100/80">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900 mb-2">
                            <Zap size={14} className="text-blue-500" />
                            电气引脚定义与接线拓扑
                          </div>
                          {protocolInfo.protocolCategory === 'analog' ? (
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs flex flex-col">
                                <span className="font-mono font-bold text-red-600 text-[11px]">VS</span>
                                <span className="text-[11px] text-gray-500 mt-0.5">电源正极</span>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs flex flex-col">
                                <span className="font-mono font-bold text-gray-800 text-[11px]">GND</span>
                                <span className="text-[11px] text-gray-500 mt-0.5">电源地</span>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs flex flex-col">
                                <span className="font-mono font-bold text-emerald-600 text-[11px]">SIGNAL</span>
                                <span className="text-[11px] text-gray-500 mt-0.5">模拟信号</span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs flex flex-col">
                                <span className="font-mono font-bold text-red-600 text-[11px]">VCC</span>
                                <span className="text-[11px] text-gray-500 mt-0.5">电源正极 (12~24V)</span>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs flex flex-col">
                                <span className="font-mono font-bold text-gray-800 text-[11px]">GND</span>
                                <span className="text-[11px] text-gray-500 mt-0.5">电源地 / 信号共地</span>
                              </div>
                              {protocolInfo.protocolCategory === 'modbus' ? (
                                <>
                                  <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs flex flex-col">
                                    <span className="font-mono font-bold text-emerald-600 text-[11px]">RS485-A</span>
                                    <span className="text-[11px] text-gray-500 mt-0.5">差分信号 A+</span>
                                  </div>
                                  <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs flex flex-col">
                                    <span className="font-mono font-bold text-indigo-600 text-[11px]">RS485-B</span>
                                    <span className="text-[11px] text-gray-500 mt-0.5">差分信号 B-</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs flex flex-col">
                                    <span className="font-mono font-bold text-indigo-600 text-[11px]">ANT</span>
                                    <span className="text-[11px] text-gray-500 mt-0.5">板载射频</span>
                                  </div>
                                  <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs flex flex-col">
                                    <span className="font-mono font-bold text-emerald-600 text-[11px]">STATUS</span>
                                    <span className="text-[11px] text-gray-500 mt-0.5">状态指示灯</span>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Protocol Details View (Modbus / Analog) */}
                {deviceModalTab === 'protocol' && hasProtocolTab && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Sub-view: Modbus Protocol */}
                    {protocolInfo.protocolCategory === 'modbus' && (
                      <div className="space-y-5">
                        {/* Modbus Register Mapping Table */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Code size={16} className="text-[#00a0e9]" />
                              <span className="font-bold text-sm text-gray-800">Modbus 寄存器表</span>
                              <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-mono font-semibold">
                                RTU · 从机: 0x01
                              </span>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 text-[11px]">
                                <tr>
                                  <th className="py-2.5 px-3.5 font-semibold">属性名称</th>
                                  <th className="py-2.5 px-3 font-semibold">功能码</th>
                                  <th className="py-2.5 px-3 font-semibold">起始地址</th>
                                  <th className="py-2.5 px-3 font-semibold">类型</th>
                                  <th className="py-2.5 px-3 font-semibold">换算公式</th>
                                  <th className="py-2.5 px-3 font-semibold">量程/单位</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 text-gray-700 font-sans">
                                {protocolInfo.modbusRegisters?.map((reg, idx) => (
                                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="py-2.5 px-3.5 font-medium text-gray-900">{reg.name}</td>
                                    <td className="py-2.5 px-3 font-mono">
                                      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px] font-medium">
                                        {reg.functionCode}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 font-mono font-semibold text-blue-600">
                                      {reg.addressHex} <span className="text-gray-400 font-normal">({reg.addressDec})</span>
                                    </td>
                                    <td className="py-2.5 px-3 font-mono text-gray-600">
                                      {reg.lengthWords} Word <span className="text-gray-400 text-[10px]">({reg.dataType})</span>
                                    </td>
                                    <td className="py-2.5 px-3 font-mono text-purple-700 font-semibold">
                                      {reg.formula}
                                    </td>
                                    <td className="py-2.5 px-3 font-medium text-gray-600">
                                      {reg.range} {reg.unit !== '-' && `(${reg.unit})`}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Command Frames & Parsing Examples */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                              <Terminal size={16} className="text-emerald-600" />
                              <span className="font-bold text-sm text-gray-800">指令示例</span>
                            </div>
                            <span className="text-xs text-gray-400 font-mono">9600 bps</span>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {protocolInfo.commandExamples?.map((cmd, idx) => (
                              <div key={idx} className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/80 flex flex-col gap-3 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${cmd.type === 'read' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                                    {cmd.title}
                                  </span>
                                  <button
                                    onClick={() => handleCopyHex(cmd.requestHex)}
                                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium cursor-pointer"
                                  >
                                    <Copy size={12} />
                                    {copiedHex === cmd.requestHex ? '已复制' : '复制报文'}
                                  </button>
                                </div>

                                <div className="space-y-2">
                                  {/* Request Frame */}
                                  <div className="bg-white p-2.5 rounded-lg border border-gray-200 flex flex-col gap-1.5 font-mono text-[11px]">
                                    <div className="text-gray-400 flex items-center justify-between">
                                      <span>下发指令 (Request):</span>
                                      <span className="text-blue-600 font-bold">{cmd.requestHex}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {cmd.requestExplain.map((exp, eIdx) => (
                                        <span key={eIdx} className={`${exp.color} px-1.5 py-0.5 rounded text-[10px]`} title={exp.meaning}>
                                          {exp.part}: {exp.meaning}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Response Frame */}
                                  <div className="bg-white p-2.5 rounded-lg border border-gray-200 flex flex-col gap-1.5 font-mono text-[11px]">
                                    <div className="text-gray-400 flex items-center justify-between">
                                      <span>上报响应 (Response):</span>
                                      <span className="text-emerald-600 font-bold">{cmd.responseHex}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {cmd.responseExplain.map((exp, eIdx) => (
                                        <span key={eIdx} className={`${exp.color} px-1.5 py-0.5 rounded text-[10px]`} title={exp.meaning}>
                                          {exp.part}: {exp.meaning}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-[11px] text-gray-500 bg-emerald-50/50 p-2 rounded border border-emerald-100 font-sans">
                                  解析结果：{cmd.resultSummary}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-view: Analog Protocol */}
                    {protocolInfo.protocolCategory === 'analog' && protocolInfo.analogFormula && (
                      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4 text-xs">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                          <Zap size={16} className="text-amber-500" />
                          <span className="font-bold text-sm text-gray-800">模拟量信号与物理量换算</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col gap-2">
                            <span className="text-gray-500 font-medium">换算公式 (线性插值)：</span>
                            <div className="bg-white p-3 rounded-lg border border-gray-200 font-mono text-sm font-bold text-purple-700">
                              {protocolInfo.analogFormula.formulaLatex}
                            </div>
                            <span className="text-[11px] text-gray-400">
                              信号量程: {protocolInfo.analogFormula.voltageOrCurrentRange} → 物理量程: {protocolInfo.analogFormula.physicalRange}
                            </span>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col gap-2">
                            <span className="text-gray-500 font-medium">ADC 采样对应关系：</span>
                            <div className="bg-white p-3 rounded-lg border border-gray-200 font-mono text-xs text-gray-700">
                              {protocolInfo.analogFormula.adcRelation}
                            </div>
                            <span className="text-[11px] text-emerald-600 font-medium">
                              示例：{protocolInfo.analogFormula.calculationExample.inputValue} → {protocolInfo.analogFormula.calculationExample.result}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between shrink-0 text-xs text-gray-500">
                <span>设备 ID: {detailDevice.id}</span>
                <button
                  type="button"
                  onClick={() => setDetailDevice(null)}
                  className="px-5 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors cursor-pointer"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 删除二次确认弹窗 */}
      {deleteConfirmDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-[380px] p-6 animate-in zoom-in-95 duration-150 border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 text-sm mb-1">确定删除该自定义设备？</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  您正在删除：<strong>{deleteConfirmDevice.name}</strong>（所属用户：{deleteConfirmDevice.userName}）。删除后不可撤销。
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmDevice(null)}
                className="px-3.5 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 图片大图预览 */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 p-4 cursor-zoom-out"
        >
          <div className="bg-white rounded-lg p-3 max-w-lg max-h-[80vh] shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-black transition-colors shadow"
            >
              <X size={15} />
            </button>
            <img src={previewImage} alt="封面预览" className="max-w-full max-h-[70vh] object-contain rounded" />
          </div>
        </div>
      )}
    </div>
  );
}
