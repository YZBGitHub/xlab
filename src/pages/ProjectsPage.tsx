import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, ChevronRight, ChevronDown, ChevronLeft, Cpu, Thermometer, Wind, Sun, Droplets, CloudRain, Activity, Search, Folder, FolderOpen, Box, Check, Eye, Clock, LayoutGrid, Calendar, Copy, X, Bot, Wrench, PlusSquare, Image as ImageIcon, FolderPlus, Plus, Minus, Maximize } from 'lucide-react';
import { deviceTreeData } from '../data/deviceTree';

const inferProtocol = (node: any, path: string): string => {
  const text = (node.name + " " + node.id + " " + path).toLowerCase();
  if (text.includes("modbus") || text.includes("485") || text.includes("rs485") || text.includes("rs-485") || text.includes("rtu") || text.includes("tcp")) return "Modbus";
  if (text.includes("zigbee")) return "Zigbee";
  if (text.includes("lora")) return "Lora";
  if (text.includes("蓝牙") || text.includes("bluetooth") || text.includes("ble")) return "蓝牙";
  if (text.includes("模拟") || text.includes("analog") || text.includes("模拟量")) return "模拟量";
  return "其他";
};

const inferDeviceType = (node: any, path: string): string => {
  const text = (node.name + " " + node.id + " " + path).toLowerCase();
  if (text.includes("网关") || text.includes("gateway") || text.includes("cpe") || text.includes("master") || text.includes("采集器")) return "网关";
  if (text.includes("继电器") || text.includes("relay") || text.includes("breaker") || text.includes("断路器") || text.includes("双联") || text.includes("单联")) return "继电器";
  if (text.includes("传感器") || text.includes("探测") || text.includes("sensor") || text.includes("quality") || text.includes("温") || text.includes("风") || text.includes("液位") || text.includes("光") || text.includes("雨") || text.includes("水") || text.includes("门磁") || text.includes("压") || text.includes("表") || text.includes("仪") || text.includes("浓度")) return "传感器";
  if (text.includes("执行器") || text.includes("load") || text.includes("灯") || text.includes("阀") || text.includes("风扇") || text.includes("电机") || text.includes("lamp") || text.includes("fan") || text.includes("motor") || text.includes("valve") || text.includes("警报") || text.includes("alarm") || text.includes("开关") || text.includes("switch") || text.includes("控制")) return "执行器";
  return "传感器"; // default fallback for unmatched leaf nodes
};

const getAllLeafNodes = (nodes: any[], currentPath: string = ''): any[] => {
  let leaves: any[] = [];
  nodes.forEach(node => {
    const path = currentPath ? (node.id === '0' || node.name === 'root' ? currentPath : `${currentPath} / ${node.name}`) : (node.name === 'root' ? '' : node.name);
    
    if (node.type === 1 || node.type === 2) {
      leaves.push({
        ...node,
        categoryPath: currentPath,
        inferredProtocol: inferProtocol(node, currentPath),
        inferredType: inferDeviceType(node, currentPath)
      });
    }
    if (node.children) {
      leaves = leaves.concat(getAllLeafNodes(node.children, path));
    }
  });
  return leaves;
};

const getAllNodeIds = (nodes: any[]): string[] => {
  let ids: string[] = [];
  nodes.forEach(node => {
    ids.push(node.id);
    if (node.children) {
      ids = ids.concat(getAllNodeIds(node.children));
    }
  });
  return ids;
};

const findNodeById = (nodes: any[], id: string): any => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const MOCK_PUBLIC_PROJECTS = [
  { id: 1, name: '基于LoRa的智慧农场环境监控系统', category: '智慧农业', publisher: '杨**', time: '2025-10-10 22:14:56', type: '系统应用', views: 1250 },
  { id: 2, name: '智能家居全屋控制中心', category: '智慧家居', publisher: '李**', time: '2025-10-09 14:20:12', type: '个人应用', views: 890 },
  { id: 3, name: '城市智慧交通路口监控网络', category: '智慧交通', publisher: '王**', time: '2025-10-08 09:30:45', type: '系统应用', views: 3400 },
  { id: 4, name: '工厂园区安防巡检系统', category: '智慧安防', publisher: '陈**', time: '2025-10-05 16:45:00', type: '个人应用', views: 420 },
  { id: 5, name: '温室大棚温湿度自动调节', category: '智慧农业', publisher: '林**', time: '2025-10-01 11:10:30', type: '系统应用', views: 2100 },
  { id: 6, name: '智能停车场道闸控制', category: '智慧交通', publisher: '赵**', time: '2025-09-28 10:00:15', type: '个人应用', views: 156 },
  { id: 7, name: '智能仓储环境监测系统', category: '智慧安防', publisher: '周**', time: '2025-09-25 15:20:00', type: '个人应用', views: 320 },
  { id: 8, name: '智慧教室灯光环境调节', category: '智慧家居', publisher: '吴**', time: '2025-09-22 08:45:12', type: '系统应用', views: 1890 },
];

export default function ProjectsPage() {
    
  
  const [activeProtocol, setActiveProtocol] = useState('全部协议');
  const [activeDeviceType, setActiveDeviceType] = useState('全部类型');
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceSearchQuery, setDeviceSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({'SensorPanel': true, 'Wired': true});
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Case Builder States
  const [isCaseBuilderMode, setIsCaseBuilderMode] = useState(false);
  const [caseDevices, setCaseDevices] = useState<{device: any, count: number}[]>([]);
  const [caseName, setCaseName] = useState('');
  const [deviceSourceTab, setDeviceSourceTab] = useState<'system' | 'custom'>('system');

  // Simulation Projects States
  const [projectCategory, setProjectCategory] = useState('全部');
  const [projectSort, setProjectSort] = useState('最新发布');
  const [projectSearch, setProjectSearch] = useState('');

  // Copy Project Modal States
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [projectToCopy, setProjectToCopy] = useState<any>(null);
  const [copyProjectName, setCopyProjectName] = useState('');

  const openCopyModal = (project: any) => {
    setProjectToCopy(project);
    setCopyProjectName(`${project.name} 副本`);
    setIsCopyModalOpen(true);
  };

  const handleConfirmCopy = () => {
    if (!copyProjectName.trim()) {
      alert('请输入项目名称');
      return;
    }
    alert(`项目复制成功！"${copyProjectName}" 已添加至您的个人空间。`);
    setIsCopyModalOpen(false);
    setProjectToCopy(null);
  };

  // Memoize all devices
  const allDevices = useMemo(() => getAllLeafNodes(deviceTreeData), []);

  // Custom devices mock data
  const customDevicesMockData = useMemo(() => [
    { id: 'custom_1', name: '自定义温湿度传感器', image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=100&h=100&fit=crop', type: '传感器', protocol: 'Modbus RTU', date: '2026-08-12' },
    { id: 'custom_2', name: '智能灌溉阀门 (定制)', image: 'https://images.unsplash.com/photo-1635338167822-1bc6e6f1f4f4?w=100&h=100&fit=crop', type: '执行器', protocol: 'Zigbee', date: '2026-08-11' },
    { id: 'custom_3', name: '边缘计算网关V2', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=100&h=100&fit=crop', type: '网关', protocol: 'MQTT', date: '2026-08-10' },
    { id: 'custom_4', name: '复合传感器模块A', image: '', type: '传感器', protocol: 'Lora', date: '2026-07-25' },
    { id: 'custom_5', name: '大功率工业继电器', image: '', type: '继电器', protocol: 'Modbus TCP', date: '2026-07-18' },
  ], []);

  // Filter devices based on selections
  let currentDevices = allDevices;
  
  // Filter by active tab (system vs custom)
  if (deviceSourceTab === 'system') {
    currentDevices = currentDevices.filter(d => !(d.categoryPath || '').includes('自定义仿真设备'));
  } else {
    // We will render customDevicesMockData instead, but keep currentDevices empty so the count isn't wrong
    currentDevices = [];
  }

  if (selectedNodeIds.length > 0) {
    currentDevices = currentDevices.filter(d => selectedNodeIds.includes(d.id));
  }

  if (deviceSearchQuery.trim()) {
    currentDevices = currentDevices.filter(d => d.name.toLowerCase().includes(deviceSearchQuery.toLowerCase()));
  }

  if (activeProtocol !== '全部协议') {
    currentDevices = currentDevices.filter(d => d.inferredProtocol === activeProtocol);
  }

  if (activeDeviceType !== '全部类型') {
    currentDevices = currentDevices.filter(d => d.inferredType === activeDeviceType);
  }

  const devicesWithIcons = currentDevices;

  const handleAddDeviceToCase = (device: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setCaseDevices(prev => {
      const existing = prev.find(item => item.device.id === device.id);
      if (existing) {
        return prev.map(item => item.device.id === device.id ? { ...item, count: item.count + 1 } : item);
      }
      return [...prev, { device, count: 1 }];
    });
  };

  const updateDeviceCount = (id: string, delta: number) => {
    setCaseDevices(prev => prev.map(item => {
      if (item.device.id === id) {
        const newCount = Math.max(1, item.count + delta);
        return { ...item, count: newCount };
      }
      return item;
    }));
  };

  const removeDeviceFromCase = (id: string) => {
    setCaseDevices(prev => prev.filter(item => item.device.id !== id));
  };

  const handleCreateCase = () => {
    if (!caseName.trim()) {
      alert("请输入案例名称");
      return;
    }
    if (caseDevices.length === 0) {
      alert("请先加入设备");
      return;
    }
    alert(`已成功创建仿真案例：${caseName}，包含 ${caseDevices.length} 种设备`);
    setCaseName('');
    setCaseDevices([]);
    setIsCaseBuilderMode(false);
  };

  const toggleNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleNodeSelection = (node: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlySelected = selectedNodeIds.includes(node.id);
    const descendantIds = getAllNodeIds([node]);
    
    setSelectedNodeIds(prev => {
      if (isCurrentlySelected) {
         // unselect this node and all its descendants
         const toRemove = new Set(descendantIds);
         // and unselect all ancestors up to the root
         let current = node.parentId;
         while(current && current !== "0") {
           toRemove.add(current);
           const pNode = findNodeById(deviceTreeData, current);
           if (pNode) current = pNode.parentId;
           else current = null;
         }
         return prev.filter(id => !toRemove.has(id));
      } else {
         // select this node and all its descendants
         const next = new Set([...prev, ...descendantIds]);
         // check if ancestors should now be selected
         let current = node.parentId;
         while(current && current !== "0") {
           const pNode = findNodeById(deviceTreeData, current);
           if (pNode && pNode.children.every((c: any) => next.has(c.id))) {
             next.add(current);
             current = pNode.parentId;
           } else {
             break;
           }
         }
         return Array.from(next);
      }
    });
  };

  const renderTree = (nodes: any[], depth = 0) => {
    const categoryNodes = nodes.filter(n => n.type === 0);
    return categoryNodes.map(node => {
      const isExpanded = expandedNodes[node.id];
      const isSelected = selectedNodeIds.includes(node.id);
      const categoryChildren = node.children ? node.children.filter((c: any) => c.type === 0) : [];
      const hasChildren = categoryChildren.length > 0;
      
      const matchesSearch = (n: any): boolean => {
        if (n.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
        if (n.children) {
          return n.children.some((child: any) => matchesSearch(child));
        }
        return false;
      };

      if (searchQuery && !matchesSearch(node)) {
        return null;
      }

      const actuallyExpanded = (searchQuery && hasChildren) ? true : isExpanded;

      return (
        <div key={node.id} className="select-none">
          <div 
            className={`flex items-center gap-1.5 py-1.5 px-2 rounded cursor-pointer transition-colors hover:bg-gray-100`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={(e) => toggleNodeSelection(node, e)}
          >
            <div className="w-4 h-4 flex items-center justify-center shrink-0" onClick={(e) => hasChildren ? toggleNode(node.id, e) : undefined}>
              {hasChildren ? (
                actuallyExpanded ? <ChevronDown size={14} className="text-gray-400 hover:text-gray-600" /> : <ChevronRight size={14} className="text-gray-400 hover:text-gray-600" />
              ) : <span className="w-3.5" />}
            </div>
            
            {/* Checkbox */}
            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mr-0.5 transition-colors ${isSelected ? 'bg-[#00a0e9] border-[#00a0e9]' : 'border-gray-300 bg-white'}`}>
              {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>

            {node.type === 0 ? (
              actuallyExpanded ? <FolderOpen size={14} className={isSelected ? "text-[#00a0e9]" : "text-gray-400"} /> : <Folder size={14} className={isSelected ? "text-[#00a0e9]" : "text-gray-400"} />
            ) : (
              <Box size={14} className={isSelected ? "text-[#00a0e9]" : "text-gray-400"} />
            )}
            <span className={`text-sm truncate ${isSelected ? 'text-[#00a0e9] font-medium' : 'text-gray-600'}`} title={node.name}>{node.name}</span>
          </div>
          {hasChildren && actuallyExpanded && (
            <div className="">
              {renderTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f3f4f6] text-gray-800 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm relative z-10 flex items-center justify-between px-8 py-3">
        <div className="flex items-center">
          <img src="/logo.png" alt="虚拟仿真 by UUSIMA" className="h-10 object-contain" />
        </div>
        
        {/* Primary Navigation */}
        <nav className="flex items-center gap-12 absolute left-1/2 -translate-x-1/2 h-full">
          <Link
            to="/"
            className="text-[15px] font-medium transition-colors h-full flex items-center border-b-2 relative top-[2px] text-gray-600 border-transparent hover:text-[#00a0e9]"
          >
            仿真设备
          </Link>
          <Link
            to="/projects"
            className="text-[15px] font-medium transition-colors h-full flex items-center border-b-2 relative top-[2px] text-[#00a0e9] border-[#00a0e9]"
          >
            仿真项目
          </Link>
          <Link
            to="/console"
            className="text-[15px] font-medium transition-colors h-full flex items-center border-b-2 relative top-[2px] text-gray-600 border-transparent hover:text-[#00a0e9]"
          >
            控制台
          </Link>
        </nav>

        {/* User Profile Dropdown */}
        <div className="relative group z-50">
          <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-md transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#cbd5e1] flex items-center justify-center text-white overflow-hidden">
              <User size={20} className="mt-1" />
            </div>
            <span className="text-sm font-medium text-gray-700">杨振邦(15396005420)</span>
          </div>

          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right text-gray-700 py-1 border border-gray-100">
            <div className="py-1">
              <a href="#" className="block px-5 py-3 text-sm hover:bg-gray-50 transition-colors">个人中心</a>
              <a href="#" className="block px-5 py-3 text-sm hover:bg-gray-50 transition-colors">UPMS</a>
            </div>
            <div className="border-t border-gray-100 mx-5"></div>
            <div className="py-1">
              <a href="#" className="block px-5 py-3 text-sm text-[#ff4d4f] hover:bg-red-50 transition-colors">退出登录</a>
            </div>
            <div className="border-t border-gray-100 mx-5"></div>
            <div className="p-5 pt-3">
              <div className="text-xs text-gray-500 font-medium mb-3">组织</div>
              <button className="w-full flex items-center justify-between bg-[#f8f9fa] hover:bg-gray-100 px-4 py-2.5 rounded transition-colors group/btn">
                <span className="text-gray-800 text-sm font-medium">新大陆教育行业云</span>
                <span className="text-gray-400 flex items-center text-[13px] group-hover/btn:text-gray-600">
                  切换 <ChevronRight size={14} className="ml-0.5" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto p-6 flex flex-col min-h-0">
        
          <div className="flex gap-6 flex-1 min-h-0">
            {/* Sidebar for Tree */}
            {isSidebarOpen && (
              <div className="w-72 bg-white rounded-xl shadow-sm p-4 flex flex-col shrink-0 min-h-0 transition-all duration-300 border border-gray-100">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <span className="font-medium text-gray-700">设备分类</span>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                </div>
                
                {/* Search Input */}
                <div className="mb-4 shrink-0">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="输入关键字搜索" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#00a0e9] focus:bg-white transition-colors" 
                    />
                    <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                  </div>
                </div>
                
                {/* Tabs */}
                <div className="flex mb-3 shrink-0 bg-gray-100/80 p-1 rounded-md">
                  <button
                    className={`flex-1 py-1.5 text-xs font-medium rounded-sm transition-colors ${deviceSourceTab === 'system' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => { setDeviceSourceTab('system'); setSelectedNodeIds([]); }}
                  >
                    系统设备
                  </button>
                  <button
                    className={`flex-1 py-1.5 text-xs font-medium rounded-sm transition-colors ${deviceSourceTab === 'custom' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => { setDeviceSourceTab('custom'); setSelectedNodeIds([]); }}
                  >
                    自定义设备
                  </button>
                </div>

                {/* Tree View */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {deviceSourceTab === 'system' 
                    ? renderTree(deviceTreeData.filter(d => d.id !== 'CustomDevices'))
                    : renderTree(deviceTreeData.find(d => d.id === 'CustomDevices')?.children || [])
                  }
                </div>
              </div>
            )}

            {/* Main device grid area */}
            <div className="bg-white rounded-xl shadow-sm flex-1 p-8 flex flex-col min-h-0 overflow-y-auto custom-scrollbar border border-gray-100">
              
              {/* Header inside right panel */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  设备列表 {currentDevices.length > 0 && <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{currentDevices.length}</span>}
                </h2>
                
                <div className="flex items-center gap-4">
                  {/* Case builder toggle */}
                  <button 
                    onClick={() => setIsCaseBuilderMode(!isCaseBuilderMode)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                      isCaseBuilderMode 
                        ? 'bg-[#00a0e9] text-white border-[#00a0e9]' 
                        : 'bg-white text-[#00a0e9] border-[#00a0e9] hover:bg-blue-50'
                    }`}
                  >
                    {isCaseBuilderMode ? '退出案例搭建' : '快速搭建仿真案例'}
                  </button>

                  {/* Device Search */}
                  <div className="relative w-64">
                    <input 
                      type="text" 
                      placeholder="搜索设备名称..." 
                      value={deviceSearchQuery}
                      onChange={(e) => setDeviceSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#00a0e9] focus:bg-white transition-colors" 
                    />
                    <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                  </div>

                  {/* Advanced Search Toggle */}
                  <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors border ${
                      isSidebarOpen 
                        ? 'bg-gray-100 text-gray-700 border-gray-200' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Search size={14} />
                    高级搜索
                  </button>
                </div>
              </div>

              {/* Additional Filters (Protocol & Device Type) */}
              <div className="flex flex-col gap-4 mb-8 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 min-w-[70px]">设备类型:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['全部类型', '网关', '执行器', '传感器', '继电器'].map(type => (
                      <button
                        key={type}
                        onClick={() => setActiveDeviceType(type)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          activeDeviceType === type
                            ? 'bg-blue-50 text-[#00a0e9] border border-blue-200'
                            : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 min-w-[70px]">通讯协议:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['全部协议', 'Modbus', 'Zigbee', 'Lora', '蓝牙', '模拟量'].map(proto => (
                      <button
                        key={proto}
                        onClick={() => setActiveProtocol(proto)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          activeProtocol === proto
                            ? 'bg-blue-50 text-[#00a0e9] border border-blue-200'
                            : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {proto}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Device Grid */}
              {deviceSourceTab === 'custom' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                  {customDevicesMockData.map(device => (
                    <div key={device.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-purple-200 transition-all flex flex-col group relative overflow-hidden">
                      {/* Subtle top indicator line instead of absolute badge */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                          {device.image ? (
                            <img src={device.image} alt={device.name} className="w-full h-full object-cover" />
                          ) : (
                            <Box size={20} className="text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-gray-800 text-[14px] truncate group-hover:text-purple-600 transition-colors" title={device.name}>
                              {device.name}
                            </h3>
                            <span className="shrink-0 bg-purple-50 text-purple-600 text-[10px] font-medium px-1.5 py-0.5 rounded border border-purple-100">
                              自定义
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="text-[10px] bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">{device.type}</span>
                            <span className="text-[10px] bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">{device.protocol}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                        <span className="font-mono text-[11px]">{device.date}</span>
                        {isCaseBuilderMode && (
                          <button 
                            onClick={(e) => handleAddDeviceToCase({ ...device, inferredType: device.type, categoryPath: '自定义' }, e)}
                            className="px-3 py-1 bg-gray-50 text-gray-600 rounded font-medium hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 border border-transparent transition-colors text-[11px]"
                          >
                            加入案例
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-y-12 gap-x-8 pb-10">
                  {devicesWithIcons.map(device => {
                    const isCustomDevice = device.id.startsWith('Custom_') || (device.categoryPath && device.categoryPath.includes('自定义'));
                    return (
                    <div key={device.id} className="flex flex-col items-center group cursor-pointer relative">
                      {/* Device Image Box */}
                      <div className={`w-28 h-28 relative flex items-center justify-center transition-transform group-hover:-translate-y-2 duration-300 rounded-lg shadow-[0_5px_15px_rgba(0,0,0,0.05)] group-hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)] border p-2 ${isCustomDevice ? 'bg-purple-50/50 border-purple-200 ring-1 ring-purple-100' : 'bg-white border-gray-100'}`}>
                        {isCustomDevice && (
                          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-20">
                            自定义
                          </span>
                        )}
                        <img 
                          src={`/devices/${device.id}_Thumbnail.png`}
                          alt={device.name}
                          className="w-full h-full object-contain relative z-10"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                            }
                          }}
                        />
                        {/* Fallback Icon */}
                        <Box size={40} strokeWidth={1.5} className="text-gray-400 absolute hidden z-0" />
                      </div>
                      
                      {/* Device Info */}
                      <div className="mt-4 flex flex-col items-center w-full px-2">
                        <div className={`text-[14px] font-bold transition-colors text-center w-full truncate ${isCustomDevice ? 'text-purple-700 group-hover:text-purple-900' : 'text-gray-700 group-hover:text-[#00a0e9]'}`} title={device.name}>
                          {device.name}
                        </div>
                        
                        <div className="flex items-center gap-1.5 mt-1.5 w-full justify-center flex-wrap">
                          <span className="text-[11px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">{device.inferredType}</span>
                          <span className="text-[11px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100">{device.inferredProtocol}</span>
                        </div>
  
                        <div className="text-[12px] text-gray-400 mt-1.5 text-center w-full truncate" title={device.categoryPath || '根目录'}>
                          {device.categoryPath || '根目录'}
                        </div>
                        
                        {isCaseBuilderMode && (
                          <button 
                            onClick={(e) => handleAddDeviceToCase(device, e)}
                            className={`mt-3 w-full py-1.5 rounded text-xs font-medium transition-colors border ${isCustomDevice ? 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-600 hover:text-white' : 'bg-blue-50 text-[#00a0e9] border-blue-100 hover:bg-[#00a0e9] hover:text-white'}`}
                          >
                            加入案例
                          </button>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              )}
              
            </div>

            {/* Case Builder Panel */}
            {isCaseBuilderMode && (
              <div className="w-[340px] bg-white rounded-xl shadow-sm p-5 flex flex-col shrink-0 min-h-0 border border-blue-100 ring-1 ring-blue-50 transition-all duration-300">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3 flex justify-between items-center">
                  已选设备清单
                  <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{caseDevices.reduce((acc, curr) => acc + curr.count, 0)}</span>
                </h3>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 space-y-3 pr-2">
                  {caseDevices.length === 0 ? (
                    <div className="text-sm text-gray-400 text-center mt-10">暂未加入任何设备</div>
                  ) : (
                    caseDevices.map(item => (
                      <div key={item.device.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0 pr-2">
                          <div className="w-10 h-10 bg-white rounded border border-gray-100 p-1 flex-shrink-0 flex items-center justify-center">
                            <img 
                              src={`/devices/${item.device.id}_Thumbnail.png`}
                              alt=""
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                                }
                              }}
                            />
                            <Box size={16} strokeWidth={1.5} className="text-gray-400 absolute hidden z-0" />
                          </div>
                          <div className="text-sm font-medium text-gray-700 truncate" title={item.device.name}>{item.device.name}</div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => updateDeviceCount(item.device.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-100 transition-colors">-</button>
                          <span className="text-sm text-gray-800 w-5 text-center">{item.count}</span>
                          <button onClick={() => updateDeviceCount(item.device.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-100 transition-colors">+</button>
                          <button onClick={() => removeDeviceFromCase(item.device.id)} className="ml-1 text-gray-400 hover:text-red-500 p-1 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="pt-4 border-t border-gray-100 shrink-0">
                  <input 
                    type="text" 
                    placeholder="请输入案例名称" 
                    value={caseName}
                    onChange={(e) => setCaseName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#00a0e9] focus:bg-white transition-colors mb-3" 
                  />
                  <button 
                    onClick={handleCreateCase}
                    className="w-full py-2 bg-[#00a0e9] text-white rounded-md text-sm font-medium hover:bg-[#008cc9] transition-colors shadow-sm"
                  >
                    确认创建
                  </button>
                </div>
              </div>
            )}
          </div>
      </main>
    </div>
  );
}

