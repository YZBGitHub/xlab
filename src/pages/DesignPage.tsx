import { 
  Settings, Search, Radio, ChevronRight, Play, Square, Save, 
  MousePointer2, Move, Type, Image, Undo, Redo, ZoomIn, ZoomOut, 
  Maximize, Eye, FileText, Cloud, Clock, ChevronDown, UserCircle2,
  Grid3X3, ArrowRightLeft, AlignLeft, Layers, Power, Wifi, Plus,
  Sparkles, Box
} from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { useState, useRef, useEffect, useMemo } from 'react';

import AddCustomDeviceModal from '../components/AddCustomDeviceModal';
import { deviceTreeData } from '../data/deviceTree';

import { useDraggable } from '../hooks/useDraggable';

const getAllLeafNodes = (nodes: any[], currentPath: string = ''): any[] => {
  let leaves: any[] = [];
  nodes.forEach(node => {
    const path = currentPath ? (node.id === '0' || node.name === 'root' ? currentPath : `${currentPath} / ${node.name}`) : (node.name === 'root' ? '' : node.name);
    
    if (node.type === 1 || node.type === 2) {
      leaves.push({
        ...node,
        categoryPath: currentPath,
      });
    }
    if (node.children) {
      leaves = leaves.concat(getAllLeafNodes(node.children, path));
    }
  });
  return leaves;
};

export default function DesignPage() {
  const [customExpanded, setCustomExpanded] = useState(false);
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'system' | 'custom'>('system');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedNodes, setAddedNodes] = useState<any[]>([]);
  const [nodeOffsets, setNodeOffsets] = useState<Record<string, {x: number, y: number}>>({});

  const handleNodeDrag = (id: string) => (pos: {x: number, y: number}) => {
    setNodeOffsets(prev => ({...prev, [id]: pos}));
  };
  const allDevices = useMemo(() => getAllLeafNodes(deviceTreeData), []);
  
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allDevices.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allDevices, searchQuery]);

  const mockCustomDevices = [
    { id: 'c1', name: '自定义电机 (V2)', type: '执行器', date: '2023-10-24' },
    { id: 'c2', name: '高精度测试仪', type: '仪器设备', date: '2023-11-05' },
    { id: 'c3', name: '定制控制面板', type: '控制终端', date: '2024-01-12' },
    { id: 'c4', name: '复合传感器模块A', type: '传感器', date: '2024-02-18' },
    { id: 'c5', name: '特殊网关协议版', type: '网关', date: '2024-03-01' },
    { id: 'c6', name: '压力监测单元', type: '传感器', date: '2024-04-10' },
  ];

  return (
    <div className="h-screen bg-[#f5f5f5] flex flex-col font-sans overflow-hidden">
      
      {/* Top Header */}
      <header className="h-12 bg-white border-b flex justify-between items-center px-4 shrink-0 z-20 relative shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="虚拟仿真 by UUSIMA" className="h-10 object-contain" />
          </Link>
    
    </div>
        <div className="flex items-center gap-3 text-gray-600 cursor-pointer hover:text-blue-600 transition-colors">
           <UserCircle2 size={18} />
           <span className="text-sm font-medium">杨振邦</span>
           <ChevronDown size={14} />
    
    </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[280px] bg-white border-r flex flex-col shrink-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
          <div className="p-3 border-b flex items-center gap-2 text-sm font-bold text-gray-700 bg-gray-50/50">
            <Layers size={16} className="text-blue-500"/> 仿真设备
      
    </div>
          <div className="bg-white border-b flex flex-col">
            <div className="p-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                <input 
                  className="w-full bg-gray-50 border border-gray-200 rounded-full pl-8 pr-3 py-1.5 text-xs outline-none focus:border-blue-400 focus:bg-white transition-colors" 
                  placeholder="请输入组件名搜索" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex px-2 pb-2 gap-2">
              <button 
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${activeDeviceTab === 'system' ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                onClick={() => setActiveDeviceTab('system')}
              >
                系统设备
              </button>
              <button 
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${activeDeviceTab === 'custom' ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                onClick={() => setActiveDeviceTab('custom')}
              >
                自定义设备
              </button>
            </div>
          </div>
          
          {/* Categories */}
          {activeDeviceTab === 'system' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {searchQuery.trim() ? (
              <div className="p-3 space-y-2">
                <div className="text-xs text-gray-500 mb-2 font-medium bg-gray-50 p-2 rounded">
                  找到 <span className="text-blue-600 font-bold">{searchResults.length}</span> 个相关仿真设备
                </div>
                {searchResults.length > 0 ? (
                  searchResults.map(device => (
                    <div key={device.id} className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow cursor-pointer flex items-center gap-3 transition-all group">
                      <div className="w-12 h-12 rounded bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 p-1 group-hover:scale-105 transition-transform">
                        <img 
                          src={`/devices/${device.id}_Thumbnail.png`} 
                          alt={device.name} 
                          className="w-full h-full object-contain" 
                          onError={(e) => { 
                            e.currentTarget.style.display = 'none'; 
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'; 
                            }
                          }} 
                        />
                        <Box size={24} className="text-gray-400 hidden" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors" title={device.name}>{device.name}</div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                           <Layers size={10} className="shrink-0" />
                           <div className="truncate" title={device.categoryPath || '根目录'}>{device.categoryPath || '根目录'}</div>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddedNodes([...addedNodes, { 
                            ...device, 
                            x: 100 + addedNodes.length * 40, 
                            y: 100 + addedNodes.length * 40 
                          }]);
                        }}
                        className="w-6 h-6 shrink-0 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100 cursor-pointer"
                        title="添加到画布"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    未找到相关设备
                  </div>
                )}
              </div>
            ) : (
            <>
            <div className="group">
              <div className="px-3 py-2.5 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer font-medium border-b border-gray-100 transition-colors">
                <ChevronDown size={14} className="text-gray-400" />
                <span className="flex-1">传感器</span>
          
    </div>
              <div className="bg-gray-50/30">
                <div className="px-7 py-2 text-xs text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors">有线传感器</div>
                <div className="px-7 py-2 text-xs text-blue-600 bg-blue-50 border-r-2 border-blue-500 cursor-pointer font-medium transition-colors">无线传感器</div>
                
                {/* Component Grid */}
                <div className="grid grid-cols-4 gap-2 p-3 bg-white border-b border-gray-100 shadow-inner">
                  <DeviceIcon label="温湿度" active/>
                  <DeviceIcon label="光照度" />
                  <DeviceIcon label="人体探测" />
                  <DeviceIcon label="烟雾探测" />
                  <DeviceIcon label="水浸探测" />
                  <DeviceIcon label="门磁探测" />
                  <DeviceIcon label="空气质量" />
                  <DeviceIcon label="可燃气体" />
                  <DeviceIcon label="火焰探测" />
                  <DeviceIcon label="声光报警" />
                  <DeviceIcon label="红外入侵" />
            
    </div>
          
    </div>
        
    </div>
            
            <div className="px-3 py-2.5 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer font-medium border-b border-gray-100 transition-colors">
              <ChevronRight size={14} className="text-gray-400" />
              <span className="flex-1">继电器</span>
        
    </div>
            <div className="px-3 py-2.5 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer font-medium border-b border-gray-100 transition-colors">
              <ChevronRight size={14} className="text-gray-400" />
              <span className="flex-1">采集器</span>
        
    </div>
            <div className="px-3 py-2.5 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer font-medium border-b border-gray-100 transition-colors">
              <ChevronRight size={14} className="text-gray-400" />
              <span className="flex-1">网关</span>
        
    </div>
            <div className="px-3 py-2.5 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer font-medium border-b border-gray-100 transition-colors">
              <ChevronRight size={14} className="text-gray-400" />
              <span className="flex-1">I/O模块</span>
        
    </div>
            <div className="px-3 py-2.5 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer font-medium border-b border-gray-100 transition-colors">
              <ChevronRight size={14} className="text-gray-400" />
              <span className="flex-1">RFID</span>
            </div>
            </>
            )}
          </div>
          ) : (
          <div className="flex-1 overflow-y-auto bg-gray-50/50 p-3 space-y-2.5">
            {mockCustomDevices.map(dev => (
              <div key={dev.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow hover:border-blue-300 cursor-pointer transition-all flex items-start gap-3 group">
                <div className="w-10 h-10 rounded-md bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Settings size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-800 truncate">{dev.name}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-medium border border-gray-200">{dev.type}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{dev.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </aside>

        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col min-w-0">
          
          {/* Toolbar */}
          <div className="h-10 bg-white border-b flex justify-between items-center px-4 shadow-sm z-10 shrink-0">
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
            
            <div className="ml-auto flex items-center gap-2 text-gray-500 cursor-pointer hover:text-gray-700">
               虚拟仿真助手 <ChevronDown size={14} />
        
    </div>
      
    </div>

          {/* Canvas */}
          <div className="flex-1 relative overflow-auto bg-white bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:20px_20px]">
            
            {/* Added Devices (Dynamically added from search list) */}
            {addedNodes.map((node, i) => (
              <DraggableNode 
                key={`${node.id}-${i}`}
                title={node.name}
                subtitle={`序列号(Hex):${i+1}`}
                style={{ top: node.y, left: node.x }}
                icon={
                  <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center relative overflow-hidden">
                    <img 
                      src={`/devices/${node.id}_Thumbnail.png`} 
                      alt={node.name}
                      className="w-full h-full object-contain"
                      onError={(e) => { 
                        e.currentTarget.style.display = 'none'; 
                        if (e.currentTarget.nextElementSibling) {
                          (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'; 
                        }
                      }} 
                    />
                    <Box size={24} className="text-gray-400 hidden" strokeWidth={1.5} />
                  </div>
                }
                ports={['top-blue', 'bottom-red', 'bottom-black']}
              />
            ))}

            {/* Top Left Component */}
            <DraggableNode id="ha" onDrag={handleNodeDrag("ha")} title="温湿度HA_61" 
              subtitle="序列号(Hex):0" 
              icon={<div className="w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-inner border-2 border-white ring-1 ring-yellow-200">HA</div>}
              style={{ top: 80, left: 120 }}
              ports={['bottom-red', 'bottom-black', 'bottom-blue', 'bottom-green']}
            />
            
            <DraggableNode id="pwr" onDrag={handleNodeDrag("pwr")} title="5V Power Supply" 
              headerClass="bg-gray-800 text-white"
              style={{ top: 80, left: 320 }}
              icon={
                <div className="flex gap-3 p-2 bg-gray-50 rounded border border-gray-200">
                  <div className="w-5 h-5 bg-yellow-400 rounded-full border border-gray-300 text-[10px] flex items-center justify-center shadow-sm">⏚</div>
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[12px] text-white font-bold shadow-sm">+</div>
                  <div className="w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center text-[12px] text-white font-bold shadow-sm">-</div>
            
    </div>
              }
              ports={['bottom-red', 'bottom-black']}
            />

            {/* Access Control Keypad */}
            <DraggableContainer id="keypad" onDrag={handleNodeDrag("keypad")} className="absolute top-[60px] left-[550px] w-28 border border-gray-300 shadow-xl bg-white rounded flex flex-col items-center p-2 z-10 cursor-move hover:shadow-2xl transition-shadow group">
              <div className="w-full bg-blue-600 text-white text-[10px] text-center py-1 rounded-t -mt-2 -mx-2 mb-2 w-[calc(100%+16px)] font-medium">门禁键盘</div>
              <div className="w-24 h-32 bg-[#111] rounded-md p-1.5 mb-2 shadow-inner border border-gray-800">
                <div className="text-green-500 font-mono text-center text-[10px] mb-1.5 bg-black/50 py-0.5 rounded border border-green-900/50">00:00</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(n => <div key={n} className="text-green-400 text-[10px] text-center bg-gray-900 rounded-sm hover:bg-gray-800 cursor-pointer active:bg-gray-700 transition-colors border border-gray-800">{n}</div>)}
            
    </div>
                <div className="text-center mt-2 flex justify-center"><div className="w-5 h-5 border border-green-500 rounded bg-green-900/20 flex items-center justify-center text-[10px] text-green-500 shadow-[0_0_5px_rgba(34,197,94,0.3)]">🔔</div></div>
          
    </div>
              <div className="w-full flex justify-around mt-1 pt-1 border-t border-gray-100 bg-gray-50 rounded-b p-1">
                 <Port color="red" /><Port color="black" /><Port color="blue" /><Port color="green" />
          
    </div>
        
    </DraggableContainer>
            
            {/* ADAM Module Mock */}
            <DraggableNode id="adam" onDrag={handleNodeDrag("adam")} title="ADAM-4055" 
              headerClass="bg-blue-600 text-white"
              style={{ top: 320, left: 350 }}
              icon={
                <div className="w-32 h-20 bg-blue-50 border-2 border-blue-200 rounded flex items-center justify-center">
                  <div className="text-blue-800 font-mono font-bold text-lg opacity-30">ADAM</div>
            
    </div>
              }
              ports={['top-blue', 'top-green', 'bottom-red', 'bottom-black']}
            />

            {/* Wires (SVG) */}
            <WireRenderer nodeOffsets={nodeOffsets} />

            {/* 自定义温湿度传感器 (Custom Sensor) */}
            <DraggableNode 
              id="custom_sensor"
              onDrag={handleNodeDrag("custom_sensor")}
              title="自定义温湿度传感器" 
              subtitle="类型: 传感器\n协议: Modbus RTU" 
              headerClass="bg-teal-600 text-white"
              style={{ top: 460, left: 120 }}
              icon={
                <div className="w-20 h-16 rounded border-2 border-teal-200 overflow-hidden shadow-inner relative group-hover:shadow-md transition-shadow">
                  <img src="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=100&h=100&fit=crop" alt="温湿度传感器" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center py-0.5 font-mono opacity-80">HA-SENSOR</div>
                </div>
              }
              ports={['bottom-red', 'bottom-black', 'bottom-blue', 'bottom-green']}
            />

            {/* 智能灌溉阀门 (Custom Actuator) */}
            <DraggableNode 
              id="custom_actuator"
              onDrag={handleNodeDrag("custom_actuator")}
              title="智能灌溉阀门" 
              subtitle="类型: 执行器\n协议: Zigbee" 
              headerClass="bg-orange-500 text-white"
              style={{ top: 460, left: 320 }}
              icon={
                <div className="w-20 h-20 rounded-full border-2 border-orange-200 overflow-hidden shadow-inner relative group-hover:shadow-md transition-shadow bg-gray-100 flex items-center justify-center">
                  <img src="https://images.unsplash.com/photo-1635338167822-1bc6e6f1f4f4?w=100&h=100&fit=crop" alt="智能灌溉阀门" className="w-full h-full object-cover rounded-full" />
                </div>
              }
              ports={['top-blue', 'bottom-red', 'bottom-black']}
            />

            {/* 边缘计算网关V2 (Custom Gateway) */}
            <DraggableNode 
              id="custom_gateway"
              onDrag={handleNodeDrag("custom_gateway")}
              title="边缘计算网关V2" 
              subtitle="类型: 网关\n协议: MQTT" 
              headerClass="bg-indigo-600 text-white"
              style={{ top: 460, left: 520 }}
              icon={
                <div className="w-24 h-16 rounded border-2 border-indigo-200 overflow-hidden shadow-inner relative group-hover:shadow-md transition-shadow">
                  <img src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=150&h=100&fit=crop" alt="边缘计算网关" className="w-full h-full object-cover" />
                  <div className="absolute top-1 right-1 flex gap-1 bg-black/30 p-1 rounded backdrop-blur-sm">
                     <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_4px_#4ade80]"></div>
                     <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-75 shadow-[0_0_4px_#60a5fa]"></div>
                  </div>
                </div>
              }
              ports={['bottom-red', 'bottom-black', 'bottom-blue', 'bottom-green', 'bottom-yellow']}
            />

      
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
        ${active ? 'bg-blue-100 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:text-blue-600'}
      `}
      title={tooltip}
    >
      {icon}
    </button>
  );
}

function DeviceIcon({ label, active }: { label: string, active?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 p-1.5 cursor-pointer rounded border transition-all duration-200 ${active ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'}`}>
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-50 to-gray-200 border border-gray-300 shadow-sm flex items-center justify-center relative overflow-hidden group">
        {/* Abstract icon inside circle */}
        <div className="w-4 h-4 bg-gray-400 rounded-sm transform rotate-45 opacity-40 group-hover:opacity-60 transition-opacity"></div>
        {active && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>}
  
    </div>
      <div className="text-[10px] text-gray-600 text-center truncate w-full font-medium">{label}</div>

    </div>
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
      className="drop-shadow-sm transition-all duration-75" 
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

function DraggableNode({ id, title, subtitle, icon, style, ports, headerClass="bg-gray-100", onDrag }: any) {
  return (
    <DraggableContainer className="absolute border border-gray-300 shadow-md bg-white rounded flex flex-col items-center cursor-move hover:shadow-xl transition-shadow z-10 group"
      style={style}
      onDrag={onDrag}
      id={id}
    >
      <div className={`w-full px-3 py-1.5 text-[11px] font-medium text-center border-b border-gray-200 rounded-t ${headerClass}`}>{title}</div>
      <div className="p-3 flex flex-col items-center">
        {icon}
        {subtitle && <div className="text-[9px] text-gray-500 mt-2 text-center leading-tight whitespace-pre-line bg-gray-50 px-2 py-0.5 rounded">{subtitle}</div>}
  
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
    <div className={`w-2.5 h-2.5 rounded-full ${bgMap[color] || 'bg-gray-300'} border-[1.5px] border-white shadow-sm ring-1 ring-gray-300 cursor-crosshair hover:scale-125 transition-transform hover:ring-blue-400`}></div>
  );
}

