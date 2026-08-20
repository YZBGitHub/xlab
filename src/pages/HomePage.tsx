import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, ChevronRight, ChevronDown, ChevronLeft, Cpu, Thermometer, Wind, Sun, Droplets, CloudRain, Activity, Search, Folder, FolderOpen, Box, Check, Eye, Clock, LayoutGrid, Calendar, Copy, X, Bot, Wrench, PlusSquare, Image as ImageIcon, FolderPlus, Plus, Minus, Maximize } from 'lucide-react';
import { deviceTreeData } from '../data/deviceTree';
import { deviceImageMap } from '../data/deviceImageMap';
import { getDeviceImageUrl } from '../utils/deviceImages';

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
  { id: 1, name: '基于LoRa的智慧农场环境监控系统', category: '智慧农业', publisher: '杨**', time: '2025-10-10 22:14:56', type: '系统应用', views: 1250, image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500&h=300&fit=crop' },
  { id: 2, name: '智能家居全屋控制中心', category: '智慧家居', publisher: '李**', time: '2025-10-09 14:20:12', type: '个人应用', views: 890, image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=500&h=300&fit=crop' },
  { id: 3, name: '城市智慧交通路口监控网络', category: '智慧交通', publisher: '王**', time: '2025-10-08 09:30:45', type: '系统应用', views: 3400, image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500&h=300&fit=crop' },
  { id: 4, name: '工厂园区安防巡检系统', category: '智慧安防', publisher: '陈**', time: '2025-10-05 16:45:00', type: '个人应用', views: 420, image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=300&fit=crop' },
  { id: 5, name: '温室大棚温湿度自动调节', category: '智慧农业', publisher: '林**', time: '2025-10-01 11:10:30', type: '系统应用', views: 2100, image: 'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?w=500&h=300&fit=crop' },
  { id: 6, name: '智能停车场道闸控制', category: '智慧交通', publisher: '赵**', time: '2025-09-28 10:00:15', type: '个人应用', views: 156, image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=500&h=300&fit=crop' },
  { id: 7, name: '智能仓储环境监测系统', category: '智慧安防', publisher: '周**', time: '2025-09-25 15:20:00', type: '个人应用', views: 320, image: 'https://images.unsplash.com/photo-1586528116311-ad8ed7c42633?w=500&h=300&fit=crop' },
  { id: 8, name: '智慧教室灯光环境调节', category: '智慧家居', publisher: '吴**', time: '2025-09-22 08:45:12', type: '系统应用', views: 1890, image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=500&h=300&fit=crop' },
];

export default function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activePrimaryNav, setActivePrimaryNav] = useState(location.state?.activeTab || '仿真设备');

  useEffect(() => {
    if (location.state?.activeTab) {
      setActivePrimaryNav(location.state.activeTab);
    }
  }, [location.state]);
    
  
  const [activeProtocol, setActiveProtocol] = useState('全部协议');
  const [activeDeviceType, setActiveDeviceType] = useState('全部类型');
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceSearchQuery, setDeviceSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({'SensorPanel': true, 'Wired': true});
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Case Builder States
  const [isCaseBuilderMode, setIsCaseBuilderMode] = useState(false);
  const [caseDevices, setCaseDevices] = useState<{device: any, count: number}[]>([]);
  const [caseName, setCaseName] = useState('');
  const [deviceSourceFilter, setDeviceSourceFilter] = useState<'system' | 'custom' | 'all'>('system');

  // Case Creation Progress Modal States
  const [isCreatingCaseModalOpen, setIsCreatingCaseModalOpen] = useState(false);
  const [creationStage, setCreationStage] = useState<'creating_project' | 'adding_devices' | 'done'>('creating_project');
  const [creationProgress, setCreationProgress] = useState(0);

  useEffect(() => {
    let timer1: any, timer2: any, interval: any;
    if (isCreatingCaseModalOpen) {
      setCreationProgress(10);
      setCreationStage('creating_project');
      interval = setInterval(() => {
        setCreationProgress(p => (p < 95 ? p + 3 : p));
      }, 100);

      timer1 = setTimeout(() => {
        setCreationStage('adding_devices');
      }, 1600);

      timer2 = setTimeout(() => {
        clearInterval(interval);
        setCreationProgress(100);
        setCreationStage('done');
      }, 3600);
    }
    return () => {
      clearInterval(interval);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isCreatingCaseModalOpen]);

  const handleConfirmEnterDesign = () => {
    const payload = {
      caseName: caseName.trim(),
      devices: caseDevices.map(item => ({
        ...item.device,
        count: item.count
      }))
    };
    sessionStorage.setItem('xlab_imported_case', JSON.stringify(payload));
    setIsCreatingCaseModalOpen(false);
    navigate('/design', { state: payload });
  };

  // Device Pagination States
  const [deviceCurrentPage, setDeviceCurrentPage] = useState(1);
  const [devicePageSize, setDevicePageSize] = useState(18);
  const [deviceJumpPage, setDeviceJumpPage] = useState('1');

  // Simulation Projects States
  const [projectTypeFilter, setProjectTypeFilter] = useState<'系统项目' | '个人项目' | '全部'>('系统项目');
  const [projectCategory, setProjectCategory] = useState('全部');
  const [projectSort, setProjectSort] = useState('最新发布');
  const [projectSearch, setProjectSearch] = useState('');

  // Project Pagination States
  const [projectCurrentPage, setProjectCurrentPage] = useState(1);
  const [projectPageSize, setProjectPageSize] = useState(8);
  const [projectJumpPage, setProjectJumpPage] = useState('1');

  // Reset page on filter change
  useEffect(() => {
    setDeviceCurrentPage(1);
    setDeviceJumpPage('1');
  }, [deviceSourceFilter, selectedNodeIds, deviceSearchQuery, activeProtocol, activeDeviceType]);

  useEffect(() => {
    setProjectCurrentPage(1);
    setProjectJumpPage('1');
  }, [projectTypeFilter, projectCategory, projectSearch, projectSort]);

  // Copy Project Modal States
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [projectToCopy, setProjectToCopy] = useState<any>(null);
  const [copyProjectName, setCopyProjectName] = useState('');
  const [selectedDeviceDetail, setSelectedDeviceDetail] = useState<any>(null);

  // Copy Custom Device Modal States
  const [isCopyDeviceModalOpen, setIsCopyDeviceModalOpen] = useState(false);
  const [deviceToCopy, setDeviceToCopy] = useState<any>(null);
  const [copyDeviceName, setCopyDeviceName] = useState('');

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

  // Custom devices state
  const [customDevicesList, setCustomDevicesList] = useState<any[]>([
    { id: 'custom_1', name: '自定义温湿度传感器', image: '/device/RS485_Humiture_Thumbnail.png', type: '传感器', protocol: 'Modbus RTU', date: '2026-08-12', power: 'DC 12V / 24V' },
    { id: 'custom_2', name: '智能灌溉阀门 (定制)', image: '/device/RS485_WaterPump_Thumbnail.png', type: '执行器', protocol: 'Zigbee', date: '2026-08-11', power: 'AC 220V' },
    { id: 'custom_3', name: '边缘计算网关V2', image: '/device/UsrG771Gateway_Thumbnail.png', type: '网关', protocol: 'MQTT', date: '2026-08-10', power: 'DC 12V' },
    { id: 'custom_4', name: '复合传感器模块A', image: '/device/NewLabCommon_Thumbnail.png', type: '传感器', protocol: 'Lora', date: '2026-07-25', power: 'DC 5V' },
    { id: 'custom_5', name: '大功率工业继电器', image: '/device/Relay_DINRailCircuitBreaker1P_Thumbnail.png', type: '继电器', protocol: 'Modbus TCP', date: '2026-07-18', power: 'AC 380V' },
  ]);

  const openCopyDeviceModal = (device: any) => {
    setDeviceToCopy(device);
    setCopyDeviceName(`${device.name} 副本`);
    setIsCopyDeviceModalOpen(true);
  };

  const handleConfirmCopyDevice = () => {
    if (!copyDeviceName.trim()) {
      alert('请输入新设备名称');
      return;
    }
    const newDevice = {
      ...deviceToCopy,
      id: `custom_${Date.now()}`,
      name: copyDeviceName.trim(),
      date: new Date().toISOString().split('T')[0],
      isCustom: true
    };
    setCustomDevicesList(prev => [newDevice, ...prev]);
    alert(`设备复制成功！"${copyDeviceName}" 已添加至您的自定义设备列表。`);
    setIsCopyDeviceModalOpen(false);
    setDeviceToCopy(null);
  };

  // Memoize all system devices
  const allSystemDevices = useMemo(() => {
    return getAllLeafNodes(deviceTreeData).filter(d => !(d.categoryPath || '').includes('自定义仿真设备'));
  }, []);

  // Standardize custom devices into unified format
  const formattedCustomDevices = useMemo(() => {
    return customDevicesList.map(d => ({
      ...d,
      inferredProtocol: d.protocol || '其他',
      inferredType: d.type || '传感器',
      categoryPath: '自定义设备',
      isCustom: true
    }));
  }, [customDevicesList]);

  // Combine and filter devices based on selections
  const filteredDevices = useMemo(() => {
    let pool: any[] = [];
    if (deviceSourceFilter === 'system') {
      pool = allSystemDevices;
    } else if (deviceSourceFilter === 'custom') {
      pool = formattedCustomDevices;
    } else {
      pool = [...formattedCustomDevices, ...allSystemDevices];
    }

    if (selectedNodeIds.length > 0) {
      pool = pool.filter(d => selectedNodeIds.includes(d.id));
    }

    if (deviceSearchQuery.trim()) {
      pool = pool.filter(d => d.name.toLowerCase().includes(deviceSearchQuery.toLowerCase()));
    }

    if (activeProtocol !== '全部协议') {
      pool = pool.filter(d => d.inferredProtocol === activeProtocol);
    }

    if (activeDeviceType !== '全部类型') {
      pool = pool.filter(d => d.inferredType === activeDeviceType);
    }

    return pool;
  }, [deviceSourceFilter, allSystemDevices, formattedCustomDevices, selectedNodeIds, deviceSearchQuery, activeProtocol, activeDeviceType]);

  const currentDevices = filteredDevices;
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
    setIsCreatingCaseModalOpen(true);
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
    return nodes.map(node => {
      const isCategory = node.type === 0;
      if (!isCategory) return null;

      const categoryChildren = node.children ? node.children.filter((c: any) => c.type === 0) : [];
      const hasChildren = categoryChildren.length > 0;
      
      const isExpanded = expandedNodes[node.id];
      const isSelected = selectedNodeIds.includes(node.id);
      
      const matchesSearch = (n: any): boolean => {
        if (n.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
        if (n.children) {
          return n.children.filter((c: any) => c.type === 0).some((child: any) => matchesSearch(child));
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
            className={`flex items-center gap-1.5 py-1.5 px-2 rounded cursor-pointer transition-colors hover:bg-gray-100 group`}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
            onClick={(e) => toggleNodeSelection(node, e)}
          >
            <div className="w-4 h-4 flex items-center justify-center shrink-0" onClick={(e) => {
              if (hasChildren) {
                e.stopPropagation();
                toggleNode(node.id, e);
              }
            }}>
              {hasChildren ? (
                actuallyExpanded ? <ChevronDown size={14} className="text-gray-400 hover:text-gray-600" /> : <ChevronRight size={14} className="text-gray-400 hover:text-gray-600" />
              ) : <span className="w-3.5" />}
            </div>
            
            {/* Checkbox for categories */}
            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mr-0.5 transition-colors ${isSelected ? 'bg-[#00a0e9] border-[#00a0e9]' : 'border-gray-300 bg-white'}`}>
              {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>

            {actuallyExpanded ? <FolderOpen size={15} className={isSelected ? "text-[#00a0e9]" : "text-amber-500"} /> : <Folder size={15} className={isSelected ? "text-[#00a0e9]" : "text-amber-500"} />}
            
            <span className={`text-xs truncate flex-1 ${isSelected ? 'text-[#00a0e9] font-medium' : 'text-gray-700 font-medium'}`} title={node.name}>
              {node.name}
            </span>
          </div>
          {hasChildren && actuallyExpanded && (
            <div className="">
              {renderTree(categoryChildren, depth + 1)}
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
          {['仿真设备', '仿真项目'].map(nav => (
            <button
              key={nav}
              onClick={() => setActivePrimaryNav(nav)}
              className={`text-[15px] font-medium transition-colors h-full flex items-center border-b-2 relative top-[2px] ${
                activePrimaryNav === nav 
                   ? 'text-[#00a0e9] border-[#00a0e9]' 
                   : 'text-gray-600 border-transparent hover:text-[#00a0e9]'
              }`}
            >
              {nav}
            </button>
          ))}
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
        {activePrimaryNav === '仿真设备' && (
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
                
                {/* Tabs in Sidebar */}
                <div className="flex mb-3 shrink-0 bg-gray-100/80 p-1 rounded-md">
                  <button
                    className={`flex-1 py-1.5 text-xs font-medium rounded-sm transition-colors ${deviceSourceFilter === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => { setDeviceSourceFilter('all'); setSelectedNodeIds([]); }}
                  >
                    全部
                  </button>
                  <button
                    className={`flex-1 py-1.5 text-xs font-medium rounded-sm transition-colors ${deviceSourceFilter === 'system' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => { setDeviceSourceFilter('system'); setSelectedNodeIds([]); }}
                  >
                    系统设备
                  </button>
                  <button
                    className={`flex-1 py-1.5 text-xs font-medium rounded-sm transition-colors ${deviceSourceFilter === 'custom' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => { setDeviceSourceFilter('custom'); setSelectedNodeIds([]); }}
                  >
                    自定义设备
                  </button>
                </div>

                {/* Tree View */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {deviceSourceFilter === 'custom' ? (
                    <div className="p-3 text-xs text-gray-500 text-center bg-gray-50 rounded-lg">
                      自定义设备按列表平铺展示，可通过上方搜索与类型筛选快速定位
                    </div>
                  ) : (
                    renderTree(deviceTreeData.filter(d => d.id !== 'CustomDevices'))
                  )}
                </div>
              </div>
            )}

            {/* Main device grid area */}
            {(() => {
              const totalDevicePages = Math.ceil(devicesWithIcons.length / devicePageSize) || 1;
              const paginatedDevices = devicesWithIcons.slice((deviceCurrentPage - 1) * devicePageSize, deviceCurrentPage * devicePageSize);

              return (
                <div className="bg-white rounded-xl shadow-sm flex-1 p-6 flex flex-col min-h-0 overflow-hidden border border-gray-100">
                  
                  {/* Sticky Header & Filters */}
                  <div className="shrink-0 border-b border-gray-100 pb-4 mb-4">
                    <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          设备列表 {devicesWithIcons.length > 0 && <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{devicesWithIcons.length}</span>}
                        </h2>

                        {/* Device Source Tabs (All / System / Custom) */}
                        <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200/80">
                          {[
                            { key: 'all', label: '全部' },
                            { key: 'system', label: '系统设备' },
                            { key: 'custom', label: '自定义设备' }
                          ].map(tab => (
                            <button
                              key={tab.key}
                              onClick={() => {
                                setDeviceSourceFilter(tab.key as any);
                                setSelectedNodeIds([]);
                              }}
                              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                deviceSourceFilter === tab.key
                                  ? 'bg-white text-[#00a0e9] shadow-xs'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
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
                              ? 'bg-blue-50 text-[#00a0e9] border-blue-200' 
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <Search size={14} />
                          高级搜索
                        </button>
                      </div>
                    </div>

                    {/* Additional Filters (Protocol & Device Type) */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-400 min-w-[65px]">设备类型:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['全部类型', '网关', '执行器', '传感器', '继电器'].map(type => (
                            <button
                              key={type}
                              onClick={() => setActiveDeviceType(type)}
                              className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                                activeDeviceType === type
                                  ? 'bg-blue-50 text-[#00a0e9] border border-blue-200 font-semibold'
                                  : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 hover:border-gray-200'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-400 min-w-[65px]">通讯协议:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['全部协议', 'Modbus', 'Zigbee', 'Lora', '蓝牙', '模拟量'].map(proto => (
                            <button
                              key={proto}
                              onClick={() => setActiveProtocol(proto)}
                              className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                                activeProtocol === proto
                                  ? 'bg-blue-50 text-[#00a0e9] border border-blue-200 font-semibold'
                                  : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 hover:border-gray-200'
                              }`}
                            >
                              {proto}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Device Grid Area */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-y-8 gap-x-5 pb-6">
                      {paginatedDevices.length === 0 ? (
                        <div className="col-span-full py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                          <Box size={36} className="text-gray-300 stroke-[1.5]" />
                          <div className="text-sm">未找到符合条件的设备</div>
                        </div>
                      ) : (
                        paginatedDevices.map(device => {
                          const isCustomDevice = Boolean(device.isCustom || device.id.startsWith('Custom_') || (device.categoryPath && device.categoryPath.includes('自定义')));
                          const imgUrl = getDeviceImageUrl(device.id, device.image);
                          return (
                            <div 
                              key={device.id} 
                              onClick={() => setSelectedDeviceDetail(device)}
                              className="flex flex-col items-center group cursor-pointer relative bg-white p-3 rounded-xl border border-gray-100 hover:border-blue-300 shadow-xs hover:shadow-md transition-all duration-200"
                            >
                              {/* Device Image Box */}
                              <div className={`w-full aspect-square max-w-[130px] relative flex items-center justify-center rounded-lg p-2 ${isCustomDevice ? 'bg-purple-50/40' : 'bg-gray-50/50'}`}>
                                {isCustomDevice && (
                                  <span className="absolute top-1 left-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs z-20">
                                    自定义
                                  </span>
                                )}

                                {isCustomDevice && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openCopyDeviceModal(device);
                                    }}
                                    className="absolute top-1 right-1 p-1 bg-white/90 hover:bg-white text-gray-400 hover:text-purple-600 rounded-md shadow-xs border border-gray-200 z-20 transition-colors"
                                    title="复制设备"
                                  >
                                    <Copy size={13} />
                                  </button>
                                )}

                                <img 
                                  src={imgUrl}
                                  alt={device.name}
                                  className="w-full h-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-105 mix-blend-multiply" 
                                />
                              </div>
                              
                              {/* Device Info */}
                              <div className="mt-3 flex flex-col items-center w-full px-1">
                                <div className={`text-[13px] font-bold transition-colors text-center w-full truncate ${isCustomDevice ? 'text-purple-700 group-hover:text-purple-900' : 'text-gray-800 group-hover:text-[#00a0e9]'}`} title={device.name}>
                                  {device.name}
                                </div>
                                
                                <div className="flex items-center gap-1.5 mt-1.5 w-full justify-center flex-wrap">
                                  <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">{device.inferredType}</span>
                                  <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100">{device.inferredProtocol}</span>
                                </div>

                                <div className="text-[11px] text-gray-400 mt-1.5 text-center w-full truncate" title={device.date ? `创建于 ${device.date}` : (device.categoryPath || '根目录')}>
                                  {device.date ? `创建于 ${device.date}` : (device.categoryPath || '根目录')}
                                </div>
                                
                                {isCaseBuilderMode ? (
                                  <button 
                                    onClick={(e) => handleAddDeviceToCase(device, e)}
                                    className={`mt-2.5 w-full py-1 rounded text-xs font-medium transition-colors border ${isCustomDevice ? 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-600 hover:text-white' : 'bg-blue-50 text-[#00a0e9] border-blue-100 hover:bg-[#00a0e9] hover:text-white'}`}
                                  >
                                    + 加入案例
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1.5 flex items-center gap-0.5">
                                    点击查看详情 →
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Device Pagination Footer */}
                  <div className="shrink-0 pt-3.5 border-t border-gray-100 flex flex-wrap justify-between items-center text-xs text-gray-500 gap-4">
                    <div>
                      显示第 {(deviceCurrentPage - 1) * devicePageSize + (devicesWithIcons.length > 0 ? 1 : 0)} 到 {Math.min(deviceCurrentPage * devicePageSize, devicesWithIcons.length)} 条，共 <strong className="text-gray-700 font-semibold">{devicesWithIcons.length}</strong> 款设备
                    </div>

                    <div className="flex items-center gap-3">
                      <select 
                        value={devicePageSize}
                        onChange={(e) => {
                          setDevicePageSize(Number(e.target.value));
                          setDeviceCurrentPage(1);
                        }}
                        className="border border-gray-200 rounded-md px-2 py-1 bg-white outline-none text-gray-600 hover:border-gray-300 transition-colors cursor-pointer focus:ring-1 focus:ring-blue-500"
                      >
                        <option value={12}>12条/页</option>
                        <option value={18}>18条/页</option>
                        <option value={24}>24条/页</option>
                        <option value={36}>36条/页</option>
                      </select>

                      <div className="flex items-center gap-1">
                        <button 
                          disabled={deviceCurrentPage <= 1}
                          onClick={() => setDeviceCurrentPage(prev => Math.max(1, prev - 1))}
                          className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 transition-colors font-mono"
                        >
                          {'<'}
                        </button>

                        {Array.from({ length: totalDevicePages }, (_, i) => i + 1)
                          .filter(page => page === 1 || page === totalDevicePages || Math.abs(page - deviceCurrentPage) <= 1)
                          .map((page, index, arr) => {
                            const prevPage = arr[index - 1];
                            const hasGap = prevPage && page - prevPage > 1;
                            return (
                              <React.Fragment key={page}>
                                {hasGap && <span className="px-1 text-gray-400">...</span>}
                                <button 
                                  onClick={() => setDeviceCurrentPage(page)}
                                  className={`w-7 h-7 flex items-center justify-center border rounded text-xs font-medium transition-colors ${
                                    deviceCurrentPage === page
                                      ? 'border-[#00a0e9] bg-[#00a0e9] text-white shadow-2xs'
                                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                                  }`}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            );
                          })}

                        <button 
                          disabled={deviceCurrentPage >= totalDevicePages}
                          onClick={() => setDeviceCurrentPage(prev => Math.min(totalDevicePages, prev + 1))}
                          className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 transition-colors font-mono"
                        >
                          {'>'}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        前往 
                        <input 
                          type="number"
                          min={1}
                          max={totalDevicePages}
                          value={deviceJumpPage}
                          onChange={(e) => setDeviceJumpPage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const p = parseInt(deviceJumpPage);
                              if (p >= 1 && p <= totalDevicePages) {
                                setDeviceCurrentPage(p);
                              }
                            }
                          }}
                          className="w-10 border border-gray-200 rounded px-1 py-0.5 text-center outline-none focus:border-[#00a0e9] transition-colors" 
                        />
                        页
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}

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
                              src={getDeviceImageUrl(item.device.id, item.device.image)}
                              alt=""
                              className="w-full h-full object-contain"
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
        )}
        
        {activePrimaryNav === '仿真项目' && (() => {
          const filteredProjects = MOCK_PUBLIC_PROJECTS.filter(project => {
            if (projectTypeFilter === '系统项目' && project.type !== '系统应用') return false;
            if (projectTypeFilter === '个人项目' && project.type !== '个人应用') return false;
            if (projectCategory !== '全部' && project.category !== projectCategory) return false;
            if (projectSearch.trim() && !project.name.toLowerCase().includes(projectSearch.toLowerCase().trim())) return false;
            return true;
          }).sort((a, b) => {
            if (projectSort === '最多浏览') return b.views - a.views;
            return new Date(b.time).getTime() - new Date(a.time).getTime();
          });

          const totalProjectPages = Math.ceil(filteredProjects.length / projectPageSize) || 1;
          const paginatedProjects = filteredProjects.slice((projectCurrentPage - 1) * projectPageSize, projectCurrentPage * projectPageSize);

          return (
            <div className="bg-white rounded-xl shadow-sm flex-1 p-6 flex flex-col min-h-0 overflow-hidden border border-gray-100">
              {/* Sticky Header & Filters */}
              <div className="flex flex-col gap-4 mb-4 shrink-0 border-b border-gray-100 pb-4">
                {/* Top Row: Type Filter Tabs & Search */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">项目类别:</span>
                    <div className="flex bg-gray-100/80 p-1 rounded-lg border border-gray-200/60">
                      {[
                        { label: '全部', val: '全部' },
                        { label: '系统项目', val: '系统项目' },
                        { label: '个人项目', val: '个人项目' }
                      ].map(tab => (
                        <button
                          key={tab.val}
                          onClick={() => setProjectTypeFilter(tab.val as any)}
                          className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${
                            projectTypeFilter === tab.val
                              ? 'bg-white text-[#00a0e9] shadow-xs'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative w-64">
                    <input 
                      type="text" 
                      placeholder="搜索项目名称" 
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#00a0e9] focus:bg-white transition-colors" 
                    />
                    <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                  </div>
                </div>

                {/* Second Row: Industry Category & Sort */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">行业分类:</span>
                    <div className="flex gap-2">
                      {['全部', '智慧家居', '智慧农业', '智慧安防', '智慧交通', '其他'].map(cat => (
                        <button 
                          key={cat}
                          onClick={() => setProjectCategory(cat)} 
                          className={`px-3.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                            projectCategory === cat 
                              ? 'bg-blue-50 text-[#00a0e9] border-blue-200' 
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">排序方式:</span>
                    <div className="flex gap-2">
                      {['最新发布', '最多浏览'].map(sort => (
                        <button
                          key={sort}
                          onClick={() => setProjectSort(sort)}
                          className={`px-3.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                            projectSort === sort
                              ? 'bg-blue-50 text-[#00a0e9] border-blue-200'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {sort}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Grid Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                {paginatedProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
                    <Box size={40} className="text-gray-300" />
                    <p className="text-sm font-medium">暂无匹配的仿真项目</p>
                    <span className="text-xs text-gray-400">请尝试切换分类或调整搜索关键词</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-6">
                    {paginatedProjects.map(project => (
                      <div 
                        key={project.id} 
                        onClick={() => window.open(`/project/${project.id}`, '_blank')}
                        className="border border-gray-100 rounded-xl bg-white hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer hover:-translate-y-1"
                      >
                        <div className="h-40 bg-gradient-to-br from-gray-50 to-gray-100 relative flex items-center justify-center border-b border-gray-100 overflow-hidden">
                          {project.image ? (
                            <>
                              <img 
                                src={project.image} 
                                alt={project.name} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                referrerPolicy="no-referrer" 
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.nextElementSibling) {
                                    (e.currentTarget.nextElementSibling as HTMLElement).classList.remove('hidden');
                                    (e.currentTarget.nextElementSibling as HTMLElement).classList.add('flex');
                                  }
                                }}
                              />
                              <div className="hidden w-full h-full items-center justify-center bg-gray-100 text-gray-400">
                                <ImageIcon size={40} className="text-gray-300 group-hover:scale-110 transition-transform duration-500" />
                              </div>
                            </>
                          ) : (
                            <ImageIcon size={40} className="text-gray-300 group-hover:scale-110 transition-transform duration-500" />
                          )}
                          <div className="absolute top-3 right-3 flex gap-2">
                            <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-600 rounded-md shadow-sm border border-gray-200">{project.type}</span>
                            <span className="px-2.5 py-1 bg-blue-50/90 backdrop-blur-sm text-[10px] font-bold text-[#00a0e9] rounded-md shadow-sm border border-blue-100">{project.category}</span>
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-1 group-hover:text-[#00a0e9] transition-colors">{project.name}</h3>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 mt-1">
                             <span className="flex items-center gap-1.5"><User size={14}/> {project.publisher}</span>
                             <span className="text-gray-300">|</span>
                             <span className="flex items-center gap-1.5"><Clock size={14}/> {project.time.split(' ')[0]}</span>
                          </div>
                          
                          <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                               <span className="flex items-center gap-1.5 hover:text-[#00a0e9] transition-colors"><Eye size={16}/> {project.views}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <button 
                                 onClick={(e) => { e.stopPropagation(); openCopyModal(project); }} 
                                 className="p-2 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-500 hover:text-[#00a0e9] transition-colors shadow-sm border border-gray-100" 
                                 title="复制项目"
                               >
                                 <Copy size={16} />
                               </button>
                               <a 
                                 href={`/project/${project.id}`} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 onClick={(e) => e.stopPropagation()} 
                                 className="p-2 bg-gray-50 hover:bg-[#00a0e9] hover:text-white rounded-md text-gray-500 transition-colors shadow-sm border border-gray-100" 
                                 title="预览项目详情"
                               >
                                 <Eye size={16} />
                               </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Project Pagination Footer */}
              <div className="shrink-0 pt-3.5 border-t border-gray-100 flex flex-wrap justify-between items-center text-xs text-gray-500 gap-4">
                <div>
                  显示第 {(projectCurrentPage - 1) * projectPageSize + (filteredProjects.length > 0 ? 1 : 0)} 到 {Math.min(projectCurrentPage * projectPageSize, filteredProjects.length)} 条，共 <strong className="text-gray-700 font-semibold">{filteredProjects.length}</strong> 个项目
                </div>

                <div className="flex items-center gap-3">
                  <select 
                    value={projectPageSize}
                    onChange={(e) => {
                      setProjectPageSize(Number(e.target.value));
                      setProjectCurrentPage(1);
                    }}
                    className="border border-gray-200 rounded-md px-2 py-1 bg-white outline-none text-gray-600 hover:border-gray-300 transition-colors cursor-pointer focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={8}>8条/页</option>
                    <option value={12}>12条/页</option>
                    <option value={16}>16条/页</option>
                    <option value={24}>24条/页</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button 
                      disabled={projectCurrentPage <= 1}
                      onClick={() => setProjectCurrentPage(prev => Math.max(1, prev - 1))}
                      className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 transition-colors font-mono"
                    >
                      {'<'}
                    </button>

                    {Array.from({ length: totalProjectPages }, (_, i) => i + 1)
                      .filter(page => page === 1 || page === totalProjectPages || Math.abs(page - projectCurrentPage) <= 1)
                      .map((page, index, arr) => {
                        const prevPage = arr[index - 1];
                        const hasGap = prevPage && page - prevPage > 1;
                        return (
                          <React.Fragment key={page}>
                            {hasGap && <span className="px-1 text-gray-400">...</span>}
                            <button 
                              onClick={() => setProjectCurrentPage(page)}
                              className={`w-7 h-7 flex items-center justify-center border rounded text-xs font-medium transition-colors ${
                                projectCurrentPage === page
                                  ? 'border-[#00a0e9] bg-[#00a0e9] text-white shadow-2xs'
                                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}

                    <button 
                      disabled={projectCurrentPage >= totalProjectPages}
                      onClick={() => setProjectCurrentPage(prev => Math.min(totalProjectPages, prev + 1))}
                      className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 transition-colors font-mono"
                    >
                      {'>'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    前往 
                    <input 
                      type="number"
                      min={1}
                      max={totalProjectPages}
                      value={projectJumpPage}
                      onChange={(e) => setProjectJumpPage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const p = parseInt(projectJumpPage);
                          if (p >= 1 && p <= totalProjectPages) {
                            setProjectCurrentPage(p);
                          }
                        }
                      }}
                      className="w-10 border border-gray-200 rounded px-1 py-0.5 text-center outline-none focus:border-[#00a0e9] transition-colors" 
                    />
                    页
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        
        {/* Copy Project Modal */}
        {isCopyModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800 text-lg">复制项目</h3>
                <button onClick={() => setIsCopyModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">新项目名称</label>
                  <input 
                    type="text" 
                    value={copyProjectName}
                    onChange={(e) => setCopyProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00a0e9] focus:border-[#00a0e9] transition-colors"
                    placeholder="请输入项目名称"
                    autoFocus
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  onClick={() => setIsCopyModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleConfirmCopy}
                  className="px-4 py-2 bg-[#00a0e9] text-white rounded-md text-sm font-medium hover:bg-[#008cc9] shadow-sm transition-colors"
                >
                  确定复制
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Copy Custom Device Modal */}
        {isCopyDeviceModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[420px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                  <Copy size={18} className="text-[#00a0e9]" />
                  复制自定义设备
                </h3>
                <button onClick={() => setIsCopyDeviceModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200/80">
                  <div className="w-12 h-12 rounded bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0">
                    <img src={getDeviceImageUrl(deviceToCopy?.id, deviceToCopy?.image)} alt="" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-gray-400">原设备：</div>
                    <div className="text-sm font-bold text-gray-800 truncate">{deviceToCopy?.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{deviceToCopy?.type || deviceToCopy?.inferredType} · {deviceToCopy?.protocol || deviceToCopy?.inferredProtocol}</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">新设备名称</label>
                  <input 
                    type="text" 
                    value={copyDeviceName}
                    onChange={(e) => setCopyDeviceName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-xs focus:outline-none focus:ring-2 focus:ring-[#00a0e9] focus:border-[#00a0e9] transition-colors text-sm"
                    placeholder="请输入设备名称"
                    autoFocus
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">复制后将生成独立的自定义设备，保存在您的自定义设备库中。</p>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  onClick={() => setIsCopyDeviceModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleConfirmCopyDevice}
                  className="px-4 py-2 bg-[#00a0e9] text-white rounded-md text-sm font-medium hover:bg-[#008cc9] shadow-xs transition-colors"
                >
                  确认复制
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Device Detail & High-Res Image Modal */}
        {selectedDeviceDetail && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col border border-gray-100">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${selectedDeviceDetail.isCustom ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                    {selectedDeviceDetail.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-base">{selectedDeviceDetail.name}</h3>
                      {selectedDeviceDetail.isCustom && (
                        <span className="bg-purple-50 text-purple-600 text-[10px] font-semibold px-2 py-0.5 rounded border border-purple-200">自定义设备</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-mono">{selectedDeviceDetail.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDeviceDetail(null)} 
                  className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Real Device Photo View */}
                <div className={`rounded-xl p-6 border flex flex-col items-center justify-center relative min-h-[260px] group shadow-inner ${selectedDeviceDetail.isCustom ? 'bg-gradient-to-b from-purple-50/50 to-indigo-50/30 border-purple-100' : 'bg-gradient-to-b from-gray-50 to-gray-100/80 border-gray-200'}`}>
                  <img 
                    src={getDeviceImageUrl(selectedDeviceDetail.id, selectedDeviceDetail.image)} 
                    alt={selectedDeviceDetail.name} 
                    className="max-h-56 max-w-full object-contain mix-blend-multiply drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-2 right-2 text-[10px] text-gray-400 bg-white/80 px-2 py-0.5 rounded border border-gray-200 shadow-2xs">
                    {selectedDeviceDetail.isCustom ? '自定义物料贴图' : '3D实物渲染图'}
                  </span>
                </div>

                {/* Specs & Attributes */}
                <div className="flex flex-col gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-2.5 text-xs text-gray-600">
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-400 font-medium">设备分类</span>
                      <span className="text-gray-800 font-semibold">{selectedDeviceDetail.categoryPath || (selectedDeviceDetail.isCustom ? '自定义设备' : '仿真设备')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-400 font-medium">设备类型</span>
                      <span className="bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded border border-blue-100">{selectedDeviceDetail.inferredType || selectedDeviceDetail.type || '仿真传感器'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-400 font-medium">通讯协议</span>
                      <span className="bg-emerald-50 text-emerald-600 font-medium px-2 py-0.5 rounded border border-emerald-100">{selectedDeviceDetail.inferredProtocol || selectedDeviceDetail.protocol || 'RS485 / Modbus'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-400 font-medium">供电规格</span>
                      <span className="text-gray-800 font-mono">{selectedDeviceDetail.power || 'DC 12V / 24V 工业级'}</span>
                    </div>
                    {selectedDeviceDetail.date && (
                      <div className="flex justify-between py-1 border-t border-gray-200/60 pt-2">
                        <span className="text-gray-400 font-medium">创建时间</span>
                        <span className="text-gray-600 font-mono">{selectedDeviceDetail.date}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    {selectedDeviceDetail.isCustom && (
                      <button 
                        onClick={() => {
                          const dev = selectedDeviceDetail;
                          setSelectedDeviceDetail(null);
                          openCopyDeviceModal(dev);
                        }}
                        className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Copy size={15} /> 复制此自定义设备
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        handleAddDeviceToCase(selectedDeviceDetail, { stopPropagation: () => {} } as any);
                        setIsCaseBuilderMode(true);
                        setSelectedDeviceDetail(null);
                      }}
                      className="w-full py-2.5 bg-[#00a0e9] hover:bg-[#008cc9] text-white rounded-xl font-medium text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> 添加到案例清单
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Case Creation Progress Modal (3-5s Animated Flow) */}
        {isCreatingCaseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 flex flex-col items-center text-center relative overflow-hidden border border-gray-100">
              
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500"></div>

              {/* Status Graphic */}
              <div className="my-4 relative flex items-center justify-center">
                {creationStage === 'done' ? (
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-in zoom-in-75 duration-300">
                    <Check size={36} className="stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-[#00a0e9] animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Box size={22} className="text-[#00a0e9] animate-pulse" />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Title & Stage Description */}
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {creationStage === 'creating_project' && '正在创建仿真项目...'}
                {creationStage === 'adding_devices' && '仿真设备初始化与加入中...'}
                {creationStage === 'done' && '仿真项目创建完成！'}
              </h3>

              <p className="text-xs text-gray-500 max-w-xs mb-4">
                {creationStage === 'creating_project' && `正在为「${caseName}」分配仿真工作空间与电气总线...`}
                {creationStage === 'adding_devices' && `正在将选中的 ${caseDevices.reduce((acc, cur) => acc + cur.count, 0)} 台设备导入设计器画布...`}
                {creationStage === 'done' && '所有选中的仿真设备已成功加载至设计器，点击下方按钮即刻开始连线与仿真实验。'}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2 overflow-hidden border border-gray-200/60">
                <div 
                  className={`h-full transition-all duration-300 rounded-full ${
                    creationStage === 'done' ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                  }`}
                  style={{ width: `${creationProgress}%` }}
                ></div>
              </div>

              <div className="w-full flex justify-between text-[11px] text-gray-400 mb-4 px-1">
                <span>
                  {creationStage === 'creating_project' && '步骤 1/2: 创建空间'}
                  {creationStage === 'adding_devices' && '步骤 2/2: 物料配置'}
                  {creationStage === 'done' && '准备就绪'}
                </span>
                <span className="font-mono font-bold text-gray-600">{creationProgress}%</span>
              </div>

              {/* Selected Devices Preview Chips */}
              <div className="w-full bg-gray-50 rounded-xl p-2.5 border border-gray-100 mb-5 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                {caseDevices.map(item => (
                  <div key={item.device.id} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-gray-200/80 shrink-0 shadow-2xs text-[11px] text-gray-700">
                    <img 
                      src={getDeviceImageUrl(item.device.id, item.device.image)} 
                      alt="" 
                      className="w-4 h-4 object-contain" 
                    />
                    <span className="truncate max-w-[90px] font-medium">{item.device.name}</span>
                    {item.count > 1 && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-1 rounded">×{item.count}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Button */}
              {creationStage === 'done' ? (
                <button
                  onClick={handleConfirmEnterDesign}
                  className="w-full py-2.5 bg-[#00a0e9] hover:bg-[#008cc9] text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/25 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Check size={16} /> 确认并进入设计器编辑
                </button>
              ) : (
                <div className="text-xs text-gray-400 py-2 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                  系统正在为您生成设计器环境，请稍候...
                </div>
              )}

            </div>
          </div>
        )}
      </main>
    </div>
  );
}