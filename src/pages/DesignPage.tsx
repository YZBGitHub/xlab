import { 
  Settings, Search, ChevronRight, 
  MousePointer2, Type, Image, Undo, Redo, 
  Eye, FileText, Cloud, Clock, ChevronDown, UserCircle2,
  Grid3X3, ArrowRightLeft, AlignLeft, Layers, Plus,
  Box, LayoutGrid, List, Sparkles, AlertCircle
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';

import AddCustomDeviceModal from '../components/AddCustomDeviceModal';
import { deviceTreeData } from '../data/deviceTree';
import { getDeviceImageUrl } from '../utils/deviceImages';
import { useDraggable } from '../hooks/useDraggable';

const DeviceImage = ({ deviceId, customImage, alt, className }: { deviceId?: string, customImage?: string, alt?: string, className?: string }) => {
  const [errorStatus, setErrorStatus] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    setErrorStatus(0);
  }, [deviceId, customImage]);

  if (errorStatus === 2) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
        <Box size={20} strokeWidth={1.5} />
      </div>
    );
  }

  const src = errorStatus === 0
    ? getDeviceImageUrl(deviceId || '', customImage)
    : getDeviceImageUrl('NewLabCommon');

  return (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      loading="lazy"
      onError={() => {
        setErrorStatus(prev => (prev === 0 ? 1 : 2));
      }}
    />
  );
};

const inferProtocol = (node: any, path: string = ''): string => {
  if (node.protocol) return node.protocol;
  const text = `${node.name || ''} ${node.id || ''} ${path || ''} ${node.categoryPath || ''}`.toLowerCase();
  if (text.includes("modbus") || text.includes("485") || text.includes("rs485") || text.includes("rs-485") || text.includes("rtu") || text.includes("tcp")) return "Modbus RTU";
  if (text.includes("zigbee")) return "Zigbee";
  if (text.includes("lora")) return "LoRa";
  if (text.includes("蓝牙") || text.includes("bluetooth") || text.includes("ble")) return "蓝牙";
  if (text.includes("mqtt")) return "MQTT";
  if (text.includes("模拟") || text.includes("analog") || text.includes("0-5v") || text.includes("4-20ma") || text.includes("voltage") || text.includes("barometric") || text.includes("soilhumidity") || text.includes("waterlevel")) return "模拟量";
  if (text.includes("rs232") || text.includes("232")) return "RS232";
  if (text.includes("onoff") || text.includes("switch") || text.includes("开关") || text.includes("button") || text.includes("smoke") || text.includes("fire") || text.includes("body")) return "开关量";
  return "标准协议";
};

const ProtocolBadge = ({ protocol }: { protocol: string }) => {
  let colorStyle = "bg-gray-100 text-gray-600 border-gray-200";
  const p = (protocol || '').toLowerCase();
  if (p.includes('modbus') || p.includes('485')) {
    colorStyle = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  } else if (p.includes('模拟') || p.includes('analog')) {
    colorStyle = "bg-amber-50 text-amber-700 border-amber-200/80";
  } else if (p.includes('zigbee')) {
    colorStyle = "bg-purple-50 text-purple-700 border-purple-200/80";
  } else if (p.includes('lora')) {
    colorStyle = "bg-indigo-50 text-indigo-700 border-indigo-200/80";
  } else if (p.includes('mqtt')) {
    colorStyle = "bg-cyan-50 text-cyan-700 border-cyan-200/80";
  } else if (p.includes('蓝牙') || p.includes('bluetooth')) {
    colorStyle = "bg-blue-50 text-blue-700 border-blue-200/80";
  } else if (p.includes('开关') || p.includes('onoff')) {
    colorStyle = "bg-teal-50 text-teal-700 border-teal-200/80";
  } else if (p.includes('232')) {
    colorStyle = "bg-orange-50 text-orange-700 border-orange-200/80";
  }

  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium border shrink-0 inline-flex items-center leading-none ${colorStyle}`}>
      {protocol}
    </span>
  );
};

const getAllLeafNodes = (nodes: any[], currentPath: string = ''): any[] => {
  let leaves: any[] = [];
  nodes.forEach(node => {
    const path = currentPath 
      ? (node.id === '0' || node.name === 'root' ? currentPath : `${currentPath} / ${node.name}`) 
      : (node.name === 'root' ? '' : node.name);
    
    if (node.type === 1 || node.type === 2) {
      leaves.push({
        ...node,
        categoryPath: currentPath || '系统设备',
        protocol: inferProtocol(node, currentPath),
      });
    }
    if (node.children && node.children.length > 0) {
      leaves = leaves.concat(getAllLeafNodes(node.children, path));
    }
  });
  return leaves;
};

export default function DesignPage() {
  const location = useLocation();
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'system' | 'custom'>('system');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Expanded top-level categories (Level 1)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'SensorPanel': true,
    'CollectPanel': true,
  });

  // Expanded subcategories (Level 2)
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({
    'Wired': true,
    'Wireless': false,
    'Actuator': false,
    'Gatewary': true,
    'IO': false,
  });

  // Parse imported case from HomePage case builder
  const importedCase = useMemo(() => {
    if (location.state?.devices && location.state.devices.length > 0) {
      return location.state;
    }
    try {
      const cached = sessionStorage.getItem('xlab_imported_case');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  }, [location.state]);

  const [projectName, setProjectName] = useState('默认仿真工程');

  // Canvas nodes
  const [addedNodes, setAddedNodes] = useState<any[]>([]);
  const [nodeOffsets, setNodeOffsets] = useState<Record<string, {x: number, y: number}>>({});

  // Initialize imported devices in a neat side-by-side / grid layout without wires
  useEffect(() => {
    if (importedCase?.devices && importedCase.devices.length > 0) {
      setProjectName(importedCase.caseName || '自建仿真工程');
      const formattedNodes: any[] = [];
      let index = 0;
      importedCase.devices.forEach((dev: any) => {
        const count = dev.count || 1;
        for (let c = 0; c < count; c++) {
          const col = index % 4;
          const row = Math.floor(index / 4);
          const x = 70 + col * 260;
          const y = 80 + row * 220;
          formattedNodes.push({
            ...dev,
            uniqueId: `imported_${dev.id}_${index}_${Date.now()}`,
            displayName: count > 1 ? `${dev.name} #${c + 1}` : dev.name,
            x,
            y,
            isImported: true
          });
          index++;
        }
      });
      setAddedNodes(formattedNodes);
    }
  }, [importedCase]);

  const handleNodeDrag = (id: string) => (pos: {x: number, y: number}) => {
    setNodeOffsets(prev => ({...prev, [id]: pos}));
  };

  // Extract all devices
  const allDevices = useMemo(() => getAllLeafNodes(deviceTreeData), []);
  
  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allDevices.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (d.protocol && d.protocol.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allDevices, searchQuery]);

  // System category tree (exclude custom devices from system tab)
  const systemTree = useMemo(() => {
    return deviceTreeData.filter(item => item.id !== 'CustomDevices');
  }, []);

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const toggleSubcategory = (subId: string) => {
    setExpandedSubcategories(prev => ({
      ...prev,
      [subId]: !prev[subId]
    }));
  };

  const expandAll = () => {
    const newCats: Record<string, boolean> = {};
    const newSubs: Record<string, boolean> = {};
    systemTree.forEach(cat => {
      newCats[cat.id] = true;
      cat.children?.forEach((sub: any) => {
        newSubs[sub.id] = true;
      });
    });
    setExpandedCategories(newCats);
    setExpandedSubcategories(newSubs);
  };

  const collapseAll = () => {
    setExpandedCategories({});
    setExpandedSubcategories({});
  };

  const handleAddDeviceToCanvas = (device: any, pos?: { x: number, y: number }) => {
    const x = pos?.x ?? (140 + (addedNodes.length % 6) * 35);
    const y = pos?.y ?? (140 + (addedNodes.length % 6) * 35);
    const newDevice = {
      ...device,
      uniqueId: `dev_${device.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x,
      y,
    };
    setAddedNodes(prev => [...prev, newDevice]);
  };

  const handleDragStartFromSidebar = (e: React.DragEvent, device: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify(device));
  };

  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const device = JSON.parse(raw);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(20, e.clientX - rect.left - 50);
      const y = Math.max(20, e.clientY - rect.top - 40);
      handleAddDeviceToCanvas(device, { x, y });
    } catch (err) {
      console.error('Drag drop error', err);
    }
  };

  const mockCustomDevices = [
    { id: 'c1', name: '自定义电机 (V2)', type: '执行器', protocol: 'Modbus RTU', date: '2023-10-24', image: '/device/RS485_WaterPump_Thumbnail.png' },
    { id: 'c2', name: '高精度测试仪', type: '仪器设备', protocol: 'Modbus RTU', date: '2023-11-05', image: '/device/RS485_Humiture_Thumbnail.png' },
    { id: 'c3', name: '定制控制面板', type: '控制终端', protocol: 'Zigbee', date: '2024-01-12', image: '/device/Other_XC40_DoorControl_Thumbnail.png' },
    { id: 'c4', name: '复合传感器模块A', type: '传感器', protocol: '模拟量', date: '2024-02-18', image: '/device/NewLabCommon_Thumbnail.png' },
    { id: 'c5', name: '特殊网关协议版', type: '网关', protocol: 'MQTT', date: '2024-03-01', image: '/device/UsrG771Gateway_Thumbnail.png' },
    { id: 'c6', name: '压力监测单元', type: '传感器', protocol: '模拟量', date: '2024-04-10', image: '/device/RS485_Pressure_Thumbnail.png' },
  ];

  return (
    <div className="h-screen bg-[#f5f5f5] flex flex-col font-sans overflow-hidden">
      
      {/* Top Header */}
      <header className="h-12 bg-white border-b flex justify-between items-center px-4 shrink-0 z-20 relative shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="虚拟仿真 by UUSIMA" className="h-10 object-contain" />
          </Link>
          <div className="h-4 w-px bg-gray-300 mx-1"></div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800 text-sm">{projectName}</span>
            {importedCase && (
              <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                <Sparkles size={11} /> 自建仿真案例
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-gray-600 cursor-pointer hover:text-blue-600 transition-colors">
           <UserCircle2 size={18} />
           <span className="text-sm font-medium">杨振邦</span>
           <ChevronDown size={14} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[310px] bg-white border-r flex flex-col shrink-0 z-10 shadow-[2px_0_6px_rgba(0,0,0,0.03)]">
          {/* Header */}
          <div className="p-3 border-b flex items-center justify-between text-sm font-bold text-gray-700 bg-gray-50/70">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-blue-500"/>
              <span>仿真设备库</span>
            </div>
            <span className="text-[11px] font-normal text-gray-500 bg-gray-200/70 px-2 py-0.5 rounded-full">
              共 {allDevices.length} 种
            </span>
          </div>

          {/* Search & Tabs */}
          <div className="bg-white border-b flex flex-col p-2.5 gap-2 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-blue-400 focus:bg-white transition-colors" 
                placeholder="搜索传感器、网关、继电器、协议..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button 
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeDeviceTab === 'system' ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                onClick={() => setActiveDeviceTab('system')}
              >
                系统设备 ({allDevices.length})
              </button>
              <button 
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeDeviceTab === 'custom' ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                onClick={() => setActiveDeviceTab('custom')}
              >
                自定义设备 ({mockCustomDevices.length})
              </button>
            </div>
          </div>
          
          {/* Main List Area */}
          {activeDeviceTab === 'system' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {searchQuery.trim() ? (
                /* Search Results View */
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  <div className="text-xs text-gray-500 mb-2 font-medium bg-blue-50/50 p-2 rounded border border-blue-100 flex items-center justify-between">
                    <span>搜索结果</span>
                    <span className="text-blue-600 font-bold">{searchResults.length} 个匹配</span>
                  </div>
                  {searchResults.length > 0 ? (
                    searchResults.map(device => {
                      const proto = device.protocol || inferProtocol(device, device.categoryPath);
                      return (
                        <div 
                          key={device.id} 
                          draggable
                          onDragStart={(e) => handleDragStartFromSidebar(e, device)}
                          className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-xs hover:border-blue-300 hover:shadow cursor-grab active:cursor-grabbing flex items-center gap-3 transition-all group"
                          title={`可拖拽或点击右侧 + 添加至画布: ${device.name}`}
                        >
                          <div className="w-12 h-12 rounded bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 p-1 group-hover:scale-105 transition-transform overflow-hidden pointer-events-none">
                            <DeviceImage
                              deviceId={device.id}
                              customImage={device.image}
                              alt={device.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0 pointer-events-none">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[12px] font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors" title={device.name}>
                                {device.name}
                              </span>
                              <ProtocolBadge protocol={proto} />
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                               <Layers size={10} className="shrink-0 text-gray-400" />
                               <div className="truncate" title={device.categoryPath || '系统设备'}>{device.categoryPath || '系统设备'}</div>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddDeviceToCanvas(device);
                            }}
                            className="w-6 h-6 shrink-0 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:!bg-blue-600 hover:!text-white transition-all cursor-pointer shadow-xs"
                            title="点击添加到画布"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-gray-400 text-xs">
                      <Box size={32} className="mx-auto mb-2 text-gray-300 stroke-[1.5]" />
                      未找到与 "{searchQuery}" 相关的设备
                    </div>
                  )}
                </div>
              ) : (
                /* Dynamic 3-Level Hierarchical Tree Navigation */
                <div className="flex-1 flex flex-col overflow-hidden">
                  
                  {/* Tree Toolbar (Expand/Collapse All & View Switcher) */}
                  <div className="px-3 py-1.5 bg-gray-50/90 border-b border-gray-200 flex items-center justify-between shrink-0 text-xs">
                    <div className="flex items-center gap-2 text-gray-500 text-[11px]">
                      <button 
                        onClick={expandAll} 
                        className="hover:text-blue-600 transition-colors hover:underline cursor-pointer"
                      >
                        展开全部
                      </button>
                      <span>|</span>
                      <button 
                        onClick={collapseAll} 
                        className="hover:text-blue-600 transition-colors hover:underline cursor-pointer"
                      >
                        折叠全部
                      </button>
                    </div>

                    <div className="flex items-center gap-1 bg-white border border-gray-200 p-0.5 rounded shadow-2xs">
                      <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-1 rounded ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-400 hover:text-gray-700'}`}
                        title="宫格视图"
                      >
                        <LayoutGrid size={12} />
                      </button>
                      <button 
                        onClick={() => setViewMode('list')}
                        className={`p-1 rounded ${viewMode === 'list' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-400 hover:text-gray-700'}`}
                        title="列表视图"
                      >
                        <List size={12} />
                      </button>
                    </div>
                  </div>

                  {/* 3-Level Nested Tree Content */}
                  <div className="flex-1 overflow-y-auto divide-y divide-gray-100 custom-scrollbar">
                    {systemTree.map(cat => {
                      const isCatExpanded = !!expandedCategories[cat.id];
                      const totalCatDevices = cat.children ? cat.children.reduce((acc: number, c: any) => acc + (c.children?.length || 0), 0) : 0;
                      
                      return (
                        <div key={cat.id} className="bg-white">
                          {/* Level 1: Category Header (e.g. 传感器, 采集/控制设备) */}
                          <div 
                            onClick={() => toggleCategory(cat.id)}
                            className="px-3 py-2.5 flex items-center justify-between text-xs font-bold text-gray-800 hover:bg-blue-50/40 cursor-pointer transition-colors select-none sticky top-0 bg-white/95 backdrop-blur-xs z-2 border-b border-gray-100"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`transition-transform duration-200 ${isCatExpanded ? 'text-blue-600' : 'text-gray-400'}`}>
                                {isCatExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                              </span>
                              <span className="text-[13px] tracking-tight">{cat.name}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 bg-gray-100 font-normal px-2 py-0.5 rounded-full">
                              {totalCatDevices} 种设备
                            </span>
                          </div>

                          {/* Level 2 & 3: Subcategories and Devices */}
                          {isCatExpanded && cat.children && (
                            <div className="bg-gray-50/30 divide-y divide-gray-100/80">
                              {cat.children.map((sub: any) => {
                                const isSubExpanded = !!expandedSubcategories[sub.id];
                                const subDevices = sub.children || [];
                                
                                return (
                                   <div key={sub.id} className="transition-colors">
                                    {/* Level 2: Subcategory Header (e.g. 有线传感器, 无线传感器, 继电器) */}
                                    <div 
                                      onClick={() => toggleSubcategory(sub.id)}
                                      className={`pl-6 pr-3 py-2 flex items-center justify-between text-xs cursor-pointer select-none transition-colors ${
                                        isSubExpanded ? 'bg-blue-50/50 text-blue-700 font-semibold' : 'text-gray-700 font-medium hover:bg-gray-100/70'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <span className={`transition-transform duration-150 ${isSubExpanded ? 'text-blue-600 rotate-0' : 'text-gray-400'}`}>
                                          {isSubExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                        </span>
                                        <span className="text-xs">{sub.name}</span>
                                      </div>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-normal ${
                                        isSubExpanded ? 'bg-blue-100/80 text-blue-700 font-medium' : 'bg-gray-100 text-gray-500'
                                      }`}>
                                        {subDevices.length}
                                      </span>
                                    </div>

                                    {/* Level 3: Concrete Device Items under this subcategory */}
                                    {isSubExpanded && (
                                      <div className="p-2 pl-4 bg-gray-50/70 border-t border-gray-100/60">
                                        {subDevices.length > 0 ? (
                                          viewMode === 'grid' ? (
                                            /* Grid View (2 Columns for Clean Layout in 300px sidebar) */
                                            <div className="grid grid-cols-2 gap-2">
                                              {subDevices.map((device: any) => {
                                                const proto = device.protocol || inferProtocol(device, sub.name);
                                                return (
                                                  <div
                                                    key={device.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStartFromSidebar(e, device)}
                                                    className="group relative flex flex-col items-center bg-white border border-gray-200/90 rounded-lg p-2 hover:border-blue-400 hover:shadow-md cursor-grab active:cursor-grabbing transition-all select-none"
                                                    title={`可拖拽或点击右上方 + 添加: ${device.name}`}
                                                  >
                                                    <div className="w-12 h-12 rounded bg-gray-50 flex items-center justify-center p-1 relative overflow-hidden mb-1.5 border border-gray-100 group-hover:scale-105 transition-transform pointer-events-none">
                                                      <DeviceImage
                                                        deviceId={device.id}
                                                        customImage={device.image}
                                                        alt={device.name}
                                                        className="w-full h-full object-contain"
                                                      />
                                                    </div>
                                                    <div className="text-[11px] font-medium text-gray-700 text-center truncate w-full group-hover:text-blue-600 transition-colors pointer-events-none">
                                                      {device.name}
                                                    </div>
                                                    <div className="mt-1 flex items-center justify-center pointer-events-none">
                                                      <ProtocolBadge protocol={proto} />
                                                    </div>
                                                    <button 
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddDeviceToCanvas(device);
                                                      }}
                                                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-50 text-blue-600 opacity-0 group-hover:opacity-100 hover:!bg-blue-600 hover:!text-white flex items-center justify-center transition-all shadow-xs cursor-pointer z-10"
                                                      title="点击添加到画布"
                                                    >
                                                      <Plus size={12} />
                                                    </button>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            /* List View */
                                            <div className="space-y-1.5">
                                              {subDevices.map((device: any) => {
                                                const proto = device.protocol || inferProtocol(device, sub.name);
                                                return (
                                                  <div
                                                    key={device.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStartFromSidebar(e, device)}
                                                    className="group flex items-center gap-2.5 bg-white border border-gray-200/90 rounded-lg p-2 hover:border-blue-400 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all select-none"
                                                    title={`可拖拽或点击右侧 + 添加: ${device.name}`}
                                                  >
                                                    <div className="w-10 h-10 rounded bg-gray-50 flex items-center justify-center p-1 shrink-0 border border-gray-100 overflow-hidden pointer-events-none">
                                                      <DeviceImage
                                                        deviceId={device.id}
                                                        customImage={device.image}
                                                        alt={device.name}
                                                        className="w-full h-full object-contain"
                                                      />
                                                    </div>
                                                    <div className="flex-1 min-w-0 pointer-events-none">
                                                      <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                                                          {device.name}
                                                        </span>
                                                        <ProtocolBadge protocol={proto} />
                                                      </div>
                                                      <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                                                        {device.id}
                                                      </div>
                                                    </div>
                                                    <button 
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddDeviceToCanvas(device);
                                                      }}
                                                      className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 opacity-0 group-hover:opacity-100 group-hover:bg-blue-50 group-hover:text-blue-600 hover:!bg-blue-600 hover:!text-white flex items-center justify-center shrink-0 transition-all cursor-pointer"
                                                      title="点击添加到画布"
                                                    >
                                                      <Plus size={12} />
                                                    </button>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )
                                        ) : (
                                          <div className="text-center py-4 text-gray-400 text-xs">
                                            暂无设备
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Custom Devices Tab */
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
              <div className="p-3 border-b border-gray-200 bg-white flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">已导入自定义仿真设备</span>
                <button
                  onClick={() => setIsAddDeviceModalOpen(true)}
                  className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded font-medium hover:bg-blue-700 flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                >
                  <Plus size={12} /> 新建设备
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                {mockCustomDevices.map(dev => (
                  <div 
                    key={dev.id} 
                    draggable
                    onDragStart={(e) => handleDragStartFromSidebar(e, dev)}
                    className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs hover:shadow hover:border-blue-300 cursor-grab active:cursor-grabbing transition-all flex items-start gap-3 group select-none"
                    title={`可拖拽或点击右侧 + 添加: ${dev.name}`}
                  >
                    <div className="w-11 h-11 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform p-1 pointer-events-none">
                      <DeviceImage
                        deviceId={dev.id}
                        customImage={dev.image}
                        alt={dev.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0 pointer-events-none">
                      <div className="text-xs font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">{dev.name}</div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium border border-blue-100">{dev.type}</span>
                        <ProtocolBadge protocol={dev.protocol || 'Modbus RTU'} />
                        <span className="text-[10px] text-gray-400 font-mono ml-auto">{dev.date}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddDeviceToCanvas(dev);
                      }}
                      className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 opacity-0 group-hover:opacity-100 group-hover:bg-blue-50 group-hover:text-blue-600 hover:!bg-blue-600 hover:!text-white flex items-center justify-center shrink-0 transition-all cursor-pointer"
                      title="点击添加到画布"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col min-w-0">
          
          {/* Toolbar */}
          <div className="h-10 bg-white border-b flex justify-between items-center px-4 shadow-xs z-10 shrink-0">
            <div className="flex items-center gap-1">
              <ToolBtn icon={<MousePointer2 size={16} />} active tooltip="选择" />
              <div className="w-px h-4 bg-gray-200 mx-1"></div>
              <ToolBtn icon={<ArrowRightLeft size={16} />} tooltip="连线" />
              <ToolBtn icon={<Grid3X3 size={16} />} tooltip="网格" />
              <ToolBtn icon={<Type size={16} />} tooltip="文本" />
              <ToolBtn icon={<Image size={16} />} tooltip="图片" />
              <div className="w-px h-4 bg-gray-200 mx-1"></div>
              <ToolBtn icon={<AlignLeft size={16} />} tooltip="对齐" />
              <div className="w-px h-4 bg-gray-200 mx-1"></div>
              <ToolBtn icon={<Undo size={16} />} disabled tooltip="撤销" />
              <ToolBtn icon={<Redo size={16} />} disabled tooltip="重做" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center text-xs text-blue-700 font-medium bg-blue-50 border border-blue-100 rounded px-3 py-1.5 cursor-pointer hover:bg-blue-100 transition-colors">
                实验智能体 <Eye size={14} className="ml-2 text-blue-500" />
              </div>
              <div className="flex items-center gap-1">
                <ToolBtn icon={<Eye size={16} />} tooltip="预览" />
                <ToolBtn icon={<FileText size={16} />} tooltip="文档" />
                <ToolBtn icon={<Cloud size={16} />} tooltip="云端" />
                <ToolBtn icon={<Clock size={16} />} tooltip="历史记录" />
              </div>
              <div className="text-xs text-gray-700 font-medium flex items-center gap-1 cursor-pointer hover:bg-gray-100 px-3 py-1.5 rounded transition-colors border border-transparent hover:border-gray-200">
                默认场景 <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* Canvas Sub-header */}
          <div className="h-8 bg-[#f8f9fa] border-b flex items-center px-4 text-xs shrink-0">
            <div className="flex items-center gap-1 text-blue-600 font-medium cursor-pointer border-r border-gray-200 pr-4 hover:opacity-80">
               连线验证 (已开启) <ChevronDown size={14} />
            </div>
            <div className="flex items-center gap-2 text-gray-500 cursor-pointer pl-4 hover:text-gray-700 transition-colors">
               <div className="w-2 h-2 rounded-full bg-gray-300"></div> 模拟实验 (已关闭)
            </div>
            <div className="ml-4 text-gray-400 text-[11px]">
              提示：可从左侧设备库拖拽或点击设备添加至仿真画布
            </div>
            <div className="ml-auto flex items-center gap-2 text-gray-500 cursor-pointer hover:text-gray-700">
               虚拟仿真助手 <ChevronDown size={14} />
            </div>
          </div>

          {/* Canvas Area */}
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropOnCanvas}
            className="flex-1 relative overflow-auto bg-white bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:20px_20px]"
          >
            {/* Top Prompt Banner for Imported Case */}
            {importedCase && (
              <div className="absolute top-3 left-4 right-4 z-10 bg-blue-50/90 backdrop-blur-xs border border-blue-200 text-blue-800 text-xs px-4 py-2 rounded-xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-blue-500 shrink-0" />
                  <span>
                    已为您并排导入 <strong>{projectName}</strong> 的 <strong>{addedNodes.length}</strong> 台仿真设备。当前<strong>无任何预设连线</strong>，请拖动设备或从端口引脚接线开启仿真。
                  </span>
                </div>
                <span className="text-[11px] text-blue-600 font-medium">设计器模式：自定义连线</span>
              </div>
            )}
            
            {/* Added / Imported Devices (Dynamically arranged side by side) */}
            {addedNodes.map((node, i) => (
              <DraggableNode 
                key={node.uniqueId || `${node.id}-${i}`}
                id={node.uniqueId || `${node.id}-${i}`}
                onDrag={handleNodeDrag(node.uniqueId || `${node.id}-${i}`)}
                title={node.displayName || node.name}
                subtitle={node.categoryPath || node.inferredType || '仿真节点'}
                style={{ top: node.y, left: node.x }}
                onDelete={() => {
                  setAddedNodes(prev => prev.filter(n => (n.uniqueId || `${n.id}-${i}`) !== (node.uniqueId || `${node.id}-${i}`)));
                }}
                icon={
                  <div className="w-14 h-14 bg-white rounded-md flex items-center justify-center relative overflow-hidden p-1 border border-gray-100">
                    <DeviceImage
                      deviceId={node.id}
                      customImage={node.image}
                      alt={node.displayName || node.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                }
                ports={['top-blue', 'bottom-red', 'bottom-black', 'bottom-green']}
              />
            ))}

            {/* Default Topology Components & Wires (Only rendered if NOT an imported case) */}
            {!importedCase && (
              <>
                <DraggableNode id="ha" onDrag={handleNodeDrag("ha")} title="温湿度传感器 HA_61" 
                  subtitle="RS485 / Modbus" 
                  icon={<DeviceImage deviceId="RS485_Humiture" customImage="/device/RS485_Humiture_Thumbnail.png" alt="温湿度" className="w-14 h-14 object-contain" />}
                  style={{ top: 80, left: 120 }}
                  ports={['bottom-red', 'bottom-black', 'bottom-blue', 'bottom-green']}
                />
                
                <DraggableNode id="pwr" onDrag={handleNodeDrag("pwr")} title="5V 工业导轨电源" 
                  subtitle="DC12V/10A"
                  headerClass="bg-gray-800 text-white"
                  style={{ top: 80, left: 320 }}
                  icon={<DeviceImage deviceId="Power_DINRailPowerAdapter" customImage="/device/Power_DINRailPowerAdapter_Thumbnail.png" alt="电源" className="w-14 h-14 object-contain" />}
                  ports={['bottom-red', 'bottom-black']}
                />

                {/* Custom Component: Keypad / Door Access */}
                <DraggableContainer id="keypad" onDrag={handleNodeDrag("keypad")} className="absolute top-[60px] left-[550px] w-32 border border-gray-300 shadow-xl bg-white rounded flex flex-col items-center p-2 z-10 cursor-move hover:shadow-2xl transition-shadow group">
                  <div className="w-full bg-blue-600 text-white text-[11px] text-center py-1 rounded-t -mt-2 -mx-2 mb-2 w-[calc(100%+16px)] font-medium">门禁读卡键盘</div>
                  <div className="w-24 h-24 bg-gray-50 rounded-md p-1 mb-2 flex items-center justify-center border border-gray-200">
                    <DeviceImage deviceId="Other_XC40_DoorControl" customImage="/device/Other_XC40_DoorControl_Thumbnail.png" alt="门禁" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-full flex justify-around mt-1 pt-1 border-t border-gray-100 bg-gray-50 rounded-b p-1">
                     <Port color="red" /><Port color="black" /><Port color="blue" /><Port color="green" />
                  </div>
                </DraggableContainer>

                {/* Middle Router Component */}
                <DraggableNode id="adam" onDrag={handleNodeDrag("adam")} title="串口服务器 (NLESerial)" 
                  subtitle="RS485 转以太网" 
                  style={{ top: 320, left: 350 }}
                  icon={
                    <div className="w-28 h-20 bg-gray-50 border border-gray-200 rounded p-1 flex items-center justify-center">
                      <DeviceImage deviceId="NLESerialServer" customImage="/device/NLESerialServer_Thumbnail.png" alt="串口服务器" className="w-full h-full object-contain" />
                    </div>
                  }
                  ports={['top-blue', 'top-green', 'bottom-red', 'bottom-black']}
                />

                {/* Dynamic Wiring Layer */}
                <WireRenderer nodeOffsets={nodeOffsets} />

                {/* Bottom Row Extra Components */}
                <DraggableNode id="btm1" onDrag={handleNodeDrag("btm1")} title="温湿度变送器" 
                  subtitle="RS485 / 地址 0x01" 
                  style={{ top: 460, left: 120 }}
                  icon={
                    <div className="w-20 h-16 rounded border border-teal-200 bg-white p-1 flex items-center justify-center shadow-xs">
                      <DeviceImage deviceId="RS485_Humiture" customImage="/device/RS485_Humiture_Thumbnail.png" alt="温湿度传感器" className="w-full h-full object-contain" />
                    </div>
                  }
                  ports={['bottom-red', 'bottom-black', 'bottom-blue', 'bottom-green']}
                />

                <DraggableNode id="btm2" onDrag={handleNodeDrag("btm2")} title="智能水泵执行器" 
                  subtitle="继电器控制单元" 
                  style={{ top: 460, left: 320 }}
                  icon={
                    <div className="w-20 h-16 rounded border border-orange-200 bg-white p-1 flex items-center justify-center shadow-xs">
                      <DeviceImage deviceId="RS485_WaterPump" customImage="/device/RS485_WaterPump_Thumbnail.png" alt="水泵阀门" className="w-full h-full object-contain" />
                    </div>
                  }
                  ports={['top-blue', 'bottom-red', 'bottom-black']}
                />

                <DraggableNode id="btm3" onDrag={handleNodeDrag("btm3")} title="边缘计算网关 USR-G771" 
                  subtitle="MQTT / 4G LTE" 
                  style={{ top: 460, left: 520 }}
                  icon={
                    <div className="w-24 h-16 rounded border border-indigo-200 bg-white p-1 flex items-center justify-center shadow-xs">
                      <DeviceImage deviceId="UsrG771Gateway" customImage="/device/UsrG771Gateway_Thumbnail.png" alt="边缘计算网关" className="w-full h-full object-contain" />
                    </div>
                  }
                  ports={['bottom-red', 'bottom-black', 'bottom-blue', 'bottom-green', 'bottom-yellow']}
                />
              </>
            )}

          </div>
          
          {/* Footer Tabs */}
          <div className="h-10 bg-[#f8f9fa] border-t flex items-center px-4 text-xs shrink-0">
            <div className="flex items-center gap-1.5 text-green-600 mr-6 font-medium bg-green-50 px-2 py-1 rounded border border-green-100">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> 已发布
            </div>
            <button className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded bg-white text-gray-500 hover:bg-gray-50 hover:text-blue-500 mr-2 transition-colors shadow-sm cursor-pointer">+</button>
            <div className="flex bg-white border border-gray-200 border-b-0 mt-[1px] shadow-[0_-2px_5px_rgba(0,0,0,0.02)] rounded-t overflow-hidden">
              <div className="px-5 py-2.5 border-r border-gray-200 text-gray-600 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors">实验1 <span className="text-gray-400 hover:text-red-500 text-base leading-none">×</span></div>
              <div className="px-5 py-2.5 border-r border-gray-200 text-blue-600 border-t-2 border-t-blue-500 bg-white font-medium flex items-center gap-3 cursor-pointer">实验1 <span className="text-gray-400 hover:text-red-500 text-base leading-none">×</span></div>
            </div>
          </div>
        </main>
      </div>

      <AddCustomDeviceModal isOpen={isAddDeviceModalOpen} onClose={() => setIsAddDeviceModalOpen(false)} />
    </div>
  );
}

function ToolBtn({ icon, active, disabled, tooltip }: { icon: React.ReactNode, active?: boolean, disabled?: boolean, tooltip?: string }) {
  return (
    <button 
      className={`p-1.5 rounded flex items-center justify-center transition-all
        ${active ? 'bg-blue-100 text-blue-600 shadow-xs' : 'text-gray-600 hover:bg-gray-100'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:text-blue-600'}
      `}
      title={tooltip}
    >
      {icon}
    </button>
  );
}

const Wire = ({ start, end, color, dasharray, offset = 30 }: any) => {
  const midY = Math.max(start.y, end.y) + offset;
  return (
    <path 
      d={`M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`}
      stroke={color} 
      strokeWidth="2" 
      fill="none" 
      strokeDasharray={dasharray}
      className="drop-shadow-xs transition-all duration-75" 
    />
  );
};

function WireRenderer({ nodeOffsets }: any) {
  const getPos = (baseX: number, baseY: number, nodeId: string) => {
    const offset = nodeOffsets[nodeId] || { x: 0, y: 0 };
    return { x: baseX + offset.x, y: baseY + offset.y };
  };

  const haRed = getPos(140, 170, 'ha');
  const haBlack = getPos(160, 170, 'ha');
  const haBlue = getPos(180, 170, 'ha');
  const haGreen = getPos(200, 170, 'ha');

  const pwrRed = getPos(345, 170, 'pwr');
  const pwrBlack = getPos(370, 170, 'pwr');

  const keypadRed = getPos(570, 240, 'keypad');
  const keypadBlack = getPos(595, 240, 'keypad');
  const keypadBlue = getPos(620, 240, 'keypad');
  const keypadGreen = getPos(645, 240, 'keypad');

  const adamBlue = getPos(380, 320, 'adam');
  const adamGreen = getPos(410, 320, 'adam');

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <Wire start={haRed} end={pwrRed} color="#ef4444" offset={50} />
      <Wire start={pwrRed} end={keypadRed} color="#ef4444" offset={10} />
      
      <Wire start={haBlack} end={pwrBlack} color="#1f2937" offset={60} />
      <Wire start={pwrBlack} end={keypadBlack} color="#1f2937" offset={20} />

      <Wire start={haBlue} end={keypadBlue} color="#3b82f6" offset={70} />
      <Wire start={keypadBlue} end={adamBlue} color="#3b82f6" offset={30} dasharray="4 2" />

      <Wire start={haGreen} end={keypadGreen} color="#22c55e" offset={80} />
      <Wire start={keypadGreen} end={adamGreen} color="#22c55e" offset={40} dasharray="4 2" />
    </svg>
  );
}

function DraggableContainer({ children, className, style, id, onDrag }: any) {
  const { position, handleMouseDown } = useDraggable({ x: 0, y: 0 }, onDrag);
  
  return (
    <div 
      className={className} 
      style={{
        ...style,
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  );
}

function DraggableNode({ id, title, subtitle, icon, style, ports, headerClass="bg-gray-100", onDrag, onDelete }: any) {
  return (
    <DraggableContainer className="absolute border border-gray-300 shadow-md bg-white rounded flex flex-col items-center cursor-move hover:shadow-xl transition-shadow z-10 group"
      style={style}
      onDrag={onDrag}
      id={id}
    >
      <div className={`w-full px-3 py-1.5 text-[11px] font-medium text-center border-b border-gray-200 rounded-t relative ${headerClass}`}>
        <span className="truncate block max-w-[130px] mx-auto">{title}</span>
        {onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="absolute right-1 top-1 w-4 h-4 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            title="删除"
          >
            ×
          </button>
        )}
      </div>
      <div className="p-3 flex flex-col items-center">
        {icon}
        {subtitle && <div className="text-[9px] text-gray-500 mt-2 text-center leading-tight whitespace-pre-line bg-gray-50 px-2 py-0.5 rounded max-w-[130px] truncate">{subtitle}</div>}
      </div>
      
      {/* Ports */}
      {ports && ports.length > 0 && (
        <div className="flex justify-around w-full pb-1.5 px-2 gap-1.5 border-t border-gray-100 pt-1.5 bg-gray-50 rounded-b">
          {ports.map((p: string, i: number) => {
             const color = p.split('-')[1];
             return <Port key={i} color={color} />
          })}
        </div>
      )}
    </DraggableContainer>
  );
}

function Port({ color }: { color: string; key?: any }) {
  const bgMap: Record<string, string> = {
    red: 'bg-red-500',
    black: 'bg-gray-800',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-400'
  };
  return (
    <div className={`w-2.5 h-2.5 rounded-full ${bgMap[color] || 'bg-gray-300'} border-[1.5px] border-white shadow-xs ring-1 ring-gray-300 cursor-crosshair hover:scale-125 transition-transform hover:ring-blue-400`}></div>
  );
}
