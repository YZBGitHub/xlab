import { 
  Settings, Search, ChevronRight, ChevronUp, Play, Save, Upload,
  Eye, FileText, Clock, ChevronDown,
  Grid3X3, AlignLeft, Layers, Plus, ZoomIn, ZoomOut,
  Box, LayoutGrid, List, Sparkles, Activity, Filter, SlidersHorizontal,
  HelpCircle, MessageCircle, RotateCcw, Bug, Network, Braces, Cable,
  Monitor, Boxes, AlertTriangle, ArrowRight, Wifi, WifiOff, Cpu,
  Server, Pencil, Check, X, PlugZap, PanelLeftClose, PanelLeftOpen, RefreshCw, MousePointer2, GripVertical, LoaderCircle
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';

import AddCustomDeviceModal from '../components/AddCustomDeviceModal';
import QuickDeviceCenterModal from '../components/QuickDeviceCenterModal';
import { deviceTreeData } from '../data/deviceTree';
import isa850Devices from '../data/isa850Devices.json';
import { getDeviceImageUrl } from '../utils/deviceImages';
import { useDraggable } from '../hooks/useDraggable';
import { useHeader } from '../context/HeaderContext';
import { ConnectionCanvas, ConnectionPort, ConnectionProvider, ConnectionTools, useConnections } from '../components/ConnectionEditor';

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
        setErrorStatus(prev => (prev < 2 ? (prev + 1 as 1 | 2) : 2));
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

type DesignMode = 'simulation' | 'twin';
type HardwareAgentConfig = { ip: string; port: string; agent: string };
type CanvasDevice = { id: string; name: string; imageId: string; image?: string; sourceDeviceId?: number };
const DeviceSelectionContext = createContext({ selectedIds: [] as string[], deletedIds: [] as string[], select: (_id: string, _additive = false) => {} });
const defaultCanvasDevices: CanvasDevice[] = isa850Devices.map(device => ({ id: device.id, name: device.name, imageId: device.id, image: device.image || undefined }));
const wiredDeviceIds = ['isa850-3', 'isa850-14', 'isa850-37', 'isa850-40'];
const initialProjectDevices = [
  ...wiredDeviceIds.map(id => isa850Devices.find(device => device.id === id)!),
  ...isa850Devices.filter(device => !wiredDeviceIds.includes(device.id)),
];
const initialProjectConnections = wiredDeviceIds.slice(1).flatMap((target, index) =>
  ['red', 'black', 'blue', 'green'].map(color => ({
    id: `isa850-wire-${index}-${color}`,
    source: { node: wiredDeviceIds[index], port: `bottom-${color}` },
    target: { node: target, port: `bottom-${color}` },
  }))
);

const modeDetails: Record<DesignMode, { label: string; shortLabel: string; description: string }> = {
  simulation: {
    label: '虚拟仿真模式',
    shortLabel: '虚拟仿真',
    description: '作为物理设备的仿真形态，仿真物理设备产生模拟数据，具备连线验证、配置等仿真功能。',
  },
  twin: {
    label: '数字孪生模式',
    shortLabel: '数字孪生',
    description: '作为物理设备的展示形态，同步展示已经连接到虚拟仿真平台的物理设备的数值、状态以及配置。',
  },
};

type SouthboundDevice = {
  id: number;
  name: string;
  address: number;
  value: string;
  linkedDevice: string;
  serialPort: string;
  protocol: string;
};

const initialSouthboundDevices: SouthboundDevice[] = [
  { id: 1, name: '温湿度变送器（485型）', address: 1, value: '温度 25.6℃ · 湿度 58.2%', linkedDevice: '温湿度传感器 HA_61' },
  { id: 2, name: '联动控制器', address: 2, value: 'DO1 关闭 · DO2 开启', linkedDevice: '智能水泵执行器' },
  { id: 3, name: '开关量烟雾探测器', address: 3, value: '烟雾浓度 正常', linkedDevice: '烟雾传感器' },
  { id: 4, name: '超声波传感器（485型）', address: 4, value: '距离 126 cm', linkedDevice: '超声波测距节点' },
  { id: 5, name: '光照度变送器（485型）', address: 5, value: '光照度 680 lx', linkedDevice: '光照传感器' },
  { id: 6, name: '二氧化碳变送器（485型）', address: 6, value: 'CO₂ 487 ppm', linkedDevice: '空气质量节点' },
  { id: 7, name: '高频读写器', address: 7, value: '读卡状态 待机', linkedDevice: 'RFID 读写节点' },
  { id: 8, name: '矩阵键盘模块', address: 8, value: '按键状态 无输入', linkedDevice: '门禁读卡键盘' },
  { id: 9, name: '物联网中心网关', address: 10, value: '上行状态 在线', linkedDevice: '边缘计算网关 USR-G771' },
  { id: 10, name: '4G数传终端', address: 11, value: '信号强度 26 CSQ', linkedDevice: '4G 通信节点' },
  { id: 11, name: '频闪指示灯（红）', address: 12, value: '亮度 80% · 闪烁关闭', linkedDevice: '告警指示灯' },
  { id: 12, name: '电磁阀', address: 13, value: '阀门状态 关闭', linkedDevice: '阀门执行器' },
  { id: 13, name: 'ZigBee智能节点盒', address: 14, value: '节点在线 · 信号 -52 dBm', linkedDevice: 'ZigBee智能节点盒' },
].map(device => {
  if ([4, 5, 6].includes(device.id)) return { ...device, serialPort: '串口 B', protocol: 'RS485' };
  if ([7, 8].includes(device.id)) return { ...device, serialPort: 'RS232 串口', protocol: 'RS232' };
  if ([9, 10].includes(device.id)) return { ...device, serialPort: '以太网接口', protocol: 'Modbus-TCP' };
  if (device.id === 13) return { ...device, serialPort: '无线接口', protocol: 'Zigbee' };
  return { ...device, serialPort: '串口 A', protocol: 'RS485' };
});

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
  const navigate = useNavigate();

  const handleNavClick = (nav: string) => {
    navigate('/', { state: { activeTab: nav } });
  };

  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [isDeviceCenterModalOpen, setIsDeviceCenterModalOpen] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'system' | 'custom'>('system');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [designMode, setDesignMode] = useState<DesignMode>('simulation');
  const [pendingMode, setPendingMode] = useState<DesignMode | null>(null);
  const [modeCountdown, setModeCountdown] = useState(3);
  const [agentConfig, setAgentConfig] = useState<HardwareAgentConfig>({
    ip: '192.168.1.188',
    port: '9000',
    agent: '中心网关智能体',
  });
  const [agentConnected, setAgentConnected] = useState(true);
  const [isAgentConfigOpen, setIsAgentConfigOpen] = useState(false);
  const [experimentRunning, setExperimentRunning] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState(50);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [deletedDeviceIds, setDeletedDeviceIds] = useState<string[]>([]);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const selectCanvasDevice = (id: string) => {
    setSelectedDeviceIds([id]);
    const canvas = workspaceRef.current?.querySelector('.design-canvas');
    const nodes = (canvas?.querySelectorAll('[data-device-id]') || []) as ArrayLike<HTMLElement>;
    const node = Array.from(nodes).find(element => element.dataset.deviceId === id);
    if (canvas && node) {
      (canvas as HTMLElement).focus({ preventScroll: true });
      const bounds = node.getBoundingClientRect();
      const viewport = canvas.getBoundingClientRect();
      canvas.scrollBy({ left: bounds.left - viewport.left - (viewport.width - bounds.width) / 2, top: bounds.top - viewport.top - (viewport.height - bounds.height) / 2, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!pendingMode) return;
    setModeCountdown(3);
    const timer = window.setInterval(() => {
      setModeCountdown(previous => {
        if (previous <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [pendingMode]);

  const requestModeChange = (nextMode: DesignMode) => {
    if (nextMode !== designMode) setPendingMode(nextMode);
  };

  const confirmModeChange = () => {
    if (!pendingMode || modeCountdown > 0) return;
    setDesignMode(pendingMode);
    setExperimentRunning(false);
    setPendingMode(null);
  };

  const isTwinMode = designMode === 'twin';
  const canStartExperiment = !isTwinMode || agentConnected;

  const handleExperimentToggle = () => {
    if (!canStartExperiment) return;
    setExperimentRunning(previous => !previous);
  };

  const handleAgentConnect = (nextConfig: HardwareAgentConfig) => {
    setAgentConfig(nextConfig);
    setAgentConnected(true);
    setIsAgentConfigOpen(false);
  };

  const handleAgentDisconnect = () => {
    setAgentConnected(false);
    setExperimentRunning(false);
  };
  
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

  const { isHeaderVisible, hideHeader } = useHeader();
  const [projectName, setProjectName] = useState('NLE-ISA850 国标版实训工程');

  // Canvas nodes
  const [addedNodes, setAddedNodes] = useState<any[]>([]);
  const deleteCanvasDevices = (ids: string[]) => {
    setAddedNodes(previous => previous.filter((node, index) => !ids.includes(node.uniqueId || `${node.id}-${index}`)));
    setDeletedDeviceIds(previous => [...new Set([...previous, ...ids.filter(id => defaultCanvasDevices.some(device => device.id === id))])]);
    setSelectedDeviceIds(previous => previous.filter(id => !ids.includes(id)));
  };

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
          const y = 140 + row * 240;
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

  const handleGenerateSimulation = (device: SouthboundDevice): string => {
    const uniqueId = `twin_${device.id}`;
    const sourceDevice = isa850Devices.find(item => item.name === device.name);
    const imageIds = ['RS485_Humiture', 'OnOff_Relay', 'OnOff_Smoke', 'RS485_Ultrasonic', 'RS485_Illumination', 'RS485_CO2', 'NewLabCommon', 'Other_XC40_DoorControl', 'UsrG771Gateway', 'UsrG771Gateway', 'NewLabCommon', 'RS485_WaterPump'];
    const viewportWidth = workspaceRef.current?.querySelector('.design-canvas')?.clientWidth || 600;
    const columns = Math.max(1, Math.floor((viewportWidth - 80) / 200));
    setAddedNodes(previous => {
      const existing = previous.find(node => node.uniqueId === uniqueId);
      const generatedCount = previous.filter(node => node.sourceDeviceId !== undefined).length;
      const baseY = Math.max(importedCase ? 60 : 485 + Math.ceil((isa850Devices.length - wiredDeviceIds.length) / 5) * 220, ...previous.filter(node => node.sourceDeviceId === undefined).map(node => (node.y || 0) + 260));
      const node = {
        id: imageIds[device.id - 1] || 'NewLabCommon', uniqueId,
        image: sourceDevice?.image || undefined,
        name: device.name, sourceDeviceId: device.id,
        ports: device.protocol === 'RS485' ? ['bottom-red', 'bottom-black', 'bottom-blue', 'bottom-green'] : [],
        categoryPath: `${device.serialPort} / ${device.protocol} · 地址 ${device.address}`,
        modbusAttrs: [{ name: 'Modbus 地址', value: String(device.address), unit: '' }, { name: '当前数值', value: device.value, unit: '' }],
        x: existing?.x ?? 50 + (generatedCount % columns) * 200,
        y: existing?.y ?? baseY + Math.floor(generatedCount / columns) * 230,
      };
      return existing ? previous.map(item => item.uniqueId === uniqueId ? node : item) : [...previous, node];
    });
    return uniqueId;
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
      const x = Math.max(20, e.clientX - rect.left + e.currentTarget.scrollLeft - 50);
      const y = Math.max(50, e.clientY - rect.top + e.currentTarget.scrollTop - 40);
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

  const canvasDevices: CanvasDevice[] = [...(importedCase ? [] : defaultCanvasDevices.filter(device => !deletedDeviceIds.includes(device.id))), ...addedNodes.map((node, index) => ({ id: node.uniqueId || `${node.id}-${index}`, name: node.displayName || node.name, imageId: node.id, image: node.image, sourceDeviceId: node.sourceDeviceId }))];

  return (
    <DeviceSelectionContext.Provider value={{ selectedIds: selectedDeviceIds, deletedIds: deletedDeviceIds, select: (id, additive = false) => setSelectedDeviceIds(previous => additive ? previous.includes(id) ? previous.filter(selected => selected !== id) : [...previous, id] : [id]) }}>
    <ConnectionProvider key={importedCase ? projectName : 'default'} imported={!!importedCase} connections={initialProjectConnections}>
    <div className={`design-shell h-screen bg-[#f5f5f5] flex flex-col font-sans overflow-hidden transition-colors duration-300 ${isTwinMode ? 'twin-mode' : ''}`}>
      
      {/* Top Header */}
      {isHeaderVisible && (
        <header className="design-header h-[58px] bg-white border-b border-[#dbe6ef] flex justify-between items-center px-7 shrink-0 z-20 relative transition-colors duration-300">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="虚拟仿真 by UUSIMA" className="h-11 object-contain" />
            </Link>
          </div>

          {/* 顶部靠中间位置的透明小箭头向上图标 */}
          <button
            onClick={hideHeader}
            className="absolute top-0.5 left-1/2 -translate-x-1/2 z-30 py-0.5 px-3 rounded-b-md bg-gray-100/70 hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-all cursor-pointer group flex items-center justify-center opacity-70 hover:opacity-100 shadow-2xs backdrop-blur-2xs"
            title="收起顶部导航（左下角可切换页面与恢复）"
          >
            <ChevronUp size={13} className="group-hover:-translate-y-0.5 transition-transform" />
          </button>

          {/* Primary Navigation */}
          <nav className="flex items-center gap-20 absolute left-[228px] h-full">
            {['设备中心', '应用中心'].map(nav => (
              <button
                key={nav}
                onClick={() => handleNavClick(nav)}
                className="text-[16px] font-medium transition-colors h-full flex items-center text-[#273746] hover:text-[#00a8e8] cursor-pointer"
              >
                {nav}
              </button>
            ))}
            <Link
              to="/console"
              className="text-[16px] font-medium transition-colors h-full flex items-center text-[#273746] hover:text-[#00a8e8]"
            >
              控制台
            </Link>
          </nav>

          <div className="flex items-center gap-2 text-[#374957] cursor-pointer hover:text-blue-600 transition-colors">
             <span className="text-sm">行业云超管</span>
             <ChevronDown size={14} />
          </div>
        </header>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside hidden={sidebarCollapsed} className={`design-sidebar w-[218px] bg-[#f4faff] border-r border-[#cdddea] ${sidebarCollapsed ? 'hidden' : 'flex'} flex-col shrink-0 z-10 transition-colors duration-300`}>
          {/* Header */}
          <div className="design-sidebar-header h-[48px] px-2 border-b border-[#d7e5ef] flex items-center justify-between text-sm font-semibold text-[#2b4354] bg-white">
            <div className="flex items-center gap-1.5">
              <Layers size={18} className="text-[#00a8e8]"/>
              <span>仿真设备库</span>
              <button
                type="button"
                onClick={() => setIsDeviceCenterModalOpen(true)}
                className="w-7 h-7 rounded-lg bg-[#f4f8fb] text-[#6f899b] hover:text-blue-600 flex items-center justify-center transition-all cursor-pointer border border-[#d7e4ed] ml-1"
                title="打开仿真设备中心快速检索并添加设备"
              >
                <SlidersHorizontal size={14} />
              </button>
            </div>
            <span className="text-[11px] font-normal text-[#7790a1] bg-[#eff5f9] px-2 py-1 rounded-full">
              {allDevices.length + 256} 种
            </span>
          </div>

          {/* Search & Tabs */}
          <div className="design-sidebar-controls bg-[#f7fbfe] border-b border-[#d7e5ef] flex flex-col p-2 gap-3 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input 
                className="w-full h-10 bg-white border border-[#cbddea] rounded-lg pl-8 pr-3 text-xs outline-none focus:border-[#31aee7] transition-colors"
                placeholder="搜索传感器、网关、继电器"
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
                className={`flex-1 h-8 text-[11px] font-medium rounded-lg transition-all ${activeDeviceTab === 'system' ? 'bg-[#eaf8ff] text-[#009fe3] border border-[#8cd3f2]' : 'bg-white text-[#6b8292] border border-[#cbddea]'}`}
                onClick={() => setActiveDeviceTab('system')}
              >
                系统设备 {allDevices.length + 248}
              </button>
              <button 
                className={`flex-1 h-8 text-[11px] font-medium rounded-lg transition-all ${activeDeviceTab === 'custom' ? 'bg-[#eaf8ff] text-[#009fe3] border border-[#6bc8f0]' : 'bg-white text-[#6b8292] border border-[#cbddea]'}`}
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
              ) : true ? (
                <div className="design-device-gallery flex-1 overflow-y-auto custom-scrollbar bg-[#f4faff]">
                  <div className="h-11 px-3 flex items-center justify-between text-[11px] text-[#7890a0]">
                    <div className="flex items-center gap-2">
                      <button onClick={expandAll} className="hover:text-[#00a8e8]">展开全部</button>
                      <span className="text-[#c5d3dc]">|</span>
                      <button onClick={collapseAll} className="hover:text-[#00a8e8]">折叠全部</button>
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#e8f1f7] text-[#688397]" title="收起分类">
                      <List size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 px-2 pb-4">
                    {allDevices.slice(0, 14).map((device: any) => (
                      <div
                        key={device.id}
                        draggable
                        onDragStart={(event) => handleDragStartFromSidebar(event, device)}
                        onDoubleClick={() => handleAddDeviceToCanvas(device)}
                        className="design-device-card group h-[102px] rounded-lg border border-[#cbdfea] bg-[#f8fcff] hover:bg-white hover:border-[#60bde8] hover:shadow-sm cursor-grab active:cursor-grabbing flex flex-col items-center justify-center px-1 transition-all"
                        title={`拖到画布，或双击添加 ${device.name}`}
                      >
                        <div className="w-14 h-14 flex items-center justify-center pointer-events-none">
                          <DeviceImage deviceId={device.id} customImage={device.image} alt={device.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="w-full truncate text-center text-[11px] text-[#526c7e] mt-1 pointer-events-none">{device.name}</div>
                      </div>
                    ))}
                  </div>
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
            <div className="design-device-gallery flex-1 flex flex-col overflow-hidden bg-gray-50/50">
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
                    className="design-device-card bg-white p-3 rounded-lg border border-gray-200 shadow-xs hover:shadow hover:border-blue-300 cursor-grab active:cursor-grabbing transition-all flex items-start gap-3 group select-none"
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
          <div className="h-11 shrink-0 border-t border-[#d7e5ef] bg-white flex items-center px-4">
            <button className="text-[#5f788a] hover:text-[#00a8e8]" title="设计器设置"><Settings size={18} /></button>
          </div>
        </aside>

        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col min-w-0">
          
          {/* Toolbar */}
          <div className="design-toolbar h-12 bg-white border-b border-[#d6e3ec] flex justify-between items-center px-2 relative z-50 shrink-0 transition-colors duration-300">
            <div className="flex items-center gap-1">
              <button onClick={() => setSidebarCollapsed(previous => !previous)} aria-label={sidebarCollapsed ? '展开设备库' : '收起设备库'} aria-expanded={!sidebarCollapsed} className="p-1.5 rounded text-slate-500 hover:bg-slate-100" title={sidebarCollapsed ? '展开设备库' : '收起设备库'}>{sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>
              <ToolBtn icon={<FileText size={17} />} tooltip="新建" />
              <ToolBtn icon={<Save size={17} />} tooltip="保存" />
              <div className="w-px h-5 bg-[#d8e4ec] mx-1"></div>
              <ConnectionTools />
              <div className="w-px h-5 bg-[#d8e4ec] mx-1"></div>
              <ToolBtn icon={<AlignLeft size={17} />} tooltip="左对齐" />
              <ToolBtn icon={<Grid3X3 size={17} />} tooltip="分布" />
              <ToolBtn icon={<Network size={17} />} tooltip="自动布局" />
              <ToolBtn icon={<Cable size={17} />} tooltip="线路整理" />
              <ToolBtn icon={<Braces size={17} />} tooltip="分组" />
              <div className="w-px h-5 bg-[#d8e4ec] mx-1"></div>
              <ToolBtn icon={<Bug size={17} />} tooltip="调试" />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="mr-2 shrink-0 h-9 p-1 rounded-xl border border-[#cbdbe6] bg-white shadow-sm flex items-center design-mode-switch" aria-label="设计模式">
                <ModeOption
                  mode="simulation"
                  active={designMode === 'simulation'}
                  onClick={() => requestModeChange('simulation')}
                />
                <ModeOption
                  mode="twin"
                  active={designMode === 'twin'}
                  onClick={() => requestModeChange('twin')}
                />
              </div>
              <ToolbarAction icon={<Eye size={14} />} label="预览" />
              <ToolbarAction icon={<Save size={14} />} label="保存配置" />
              <ToolbarAction icon={<Clock size={14} />} label="发布历史" />
              <button className="design-primary h-8 px-3 rounded-lg bg-[#00a8e8] hover:bg-[#0097d2] text-white flex items-center gap-1.5 shadow-sm">
                <Upload size={14} /> 发布
              </button>
              <button className="h-8 min-w-32 px-3 rounded-lg border border-[#cbdbe6] text-[#667f90] flex items-center justify-between bg-white">
                默认网格 <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* Canvas Sub-header */}
          <div className="design-modebar h-11 bg-[#f7fbfe] border-b border-[#d6e3ec] flex items-center px-3 text-xs shrink-0 relative z-40 overflow-visible transition-colors duration-300">
            <button
              type="button"
              disabled={!canStartExperiment}
              onClick={handleExperimentToggle}
              title={!canStartExperiment ? '请先连接硬件智能体终端' : experimentRunning ? '停止当前实验' : '启动实验'}
              className={`h-8 w-36 rounded-lg text-white font-medium flex items-center justify-center gap-2 shadow-sm transition-colors disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300 ${isTwinMode ? 'bg-[#ee4d2d] hover:bg-[#d93f22]' : 'bg-[#00a8e8] hover:bg-[#0098d3]'}`}
            >
              {experimentRunning ? <X size={13} /> : <Play size={13} fill="currentColor" />}
              {experimentRunning ? '停止实验' : '启动实验'}
            </button>
            {!isTwinMode && <div className="ml-2 h-8 px-3 rounded-lg flex items-center gap-2 font-medium border border-[#95d5f2] bg-[#eaf8ff] text-[#129dd7]">
              <span className={`w-4 h-4 rounded text-white flex items-center justify-center text-[10px] ${isTwinMode ? 'bg-[#ee4d2d]' : 'bg-[#00a8e8]'}`}>✓</span>
              连线验证 <span className="text-[9px] opacity-70">已开启</span>
            </div>}

            {isTwinMode ? (
              <div className={`ml-auto h-8 pl-3 pr-1.5 rounded-lg border flex items-center gap-2 ${agentConnected ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700' : 'border-rose-500/40 bg-rose-500/10 text-rose-600'}`}>
                {agentConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span className="font-medium">硬件智能体终端</span>
                <span className={`w-1.5 h-1.5 rounded-full ${agentConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                <span className="text-[10px]">{agentConnected ? '已连接' : '未连接'}</span>
                {agentConnected && <span className="font-mono text-[10px] text-slate-400">{agentConfig.ip}:{agentConfig.port}</span>}
                <button
                  type="button"
                  onClick={() => setIsAgentConfigOpen(true)}
                  aria-label="配置硬件智能体终端"
                  className="h-6 px-2 rounded-md border border-red-200 bg-white text-[#bd4b30] hover:bg-red-50 flex items-center gap-1"
                >
                  <Settings size={11} /> 配置
                </button>
              </div>
            ) : (
              <div className="ml-auto flex items-center gap-2 h-8 px-3 rounded-lg border border-[#cbdbe6] bg-white text-[#617c8e]">
                 <span className="w-4 h-4 rounded border border-[#9bb1c0]"></span> 虚拟仿真助手
                 <span className="w-2 h-2 rounded-full bg-[#d6dee4]"></span>
              </div>
            )}
          </div>

          {/* Canvas Area */}
          <div ref={workspaceRef} className="flex-1 min-h-0 min-w-0 flex">
          <div className="design-canvas-viewport relative flex-1 min-w-0 min-h-0 flex overflow-hidden">
          <ConnectionCanvas
            nodeIds={canvasDevices.map(device => device.id)}
            selectedNodeIds={selectedDeviceIds}
            onSelectionChange={setSelectedDeviceIds}
            onDeleteNodes={deleteCanvasDevices}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropOnCanvas}
            className="design-canvas flex-1 min-w-0 relative overflow-auto bg-[#fbfefe] bg-[linear-gradient(to_right,#e8f0f3_1px,transparent_1px),linear-gradient(to_bottom,#e8f0f3_1px,transparent_1px)] bg-[size:8px_8px] transition-colors duration-300"
          >
            {/* Top Prompt Banner for Imported Case */}
            {importedCase && (
              <div className="design-import-banner absolute top-14 left-4 right-4 z-10 bg-blue-50/90 backdrop-blur-xs border border-blue-200 text-blue-800 text-xs px-4 py-2 rounded-xl flex items-center justify-between shadow-2xs pointer-events-none">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-blue-500 shrink-0" />
                  <span>
                    已导入 <strong>{projectName}</strong> 的 <strong>{addedNodes.length}</strong> 台仿真设备，拖动端口或依次点击两个同色端口即可接线。
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
                title={node.displayName || node.name}
                showLabel={node.sourceDeviceId !== undefined}
                appearing={node.sourceDeviceId !== undefined}
                subtitle={node.categoryPath || node.inferredType || '仿真节点'}
                style={{ top: node.y, left: node.x }}
                onDelete={() => {
                  deleteCanvasDevices([node.uniqueId || `${node.id}-${i}`]);
                }}
                icon={
                    <div className="w-24 h-24 flex items-center justify-center relative">
                    <DeviceImage
                      deviceId={node.id}
                      customImage={node.image}
                      alt={node.displayName || node.name}
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                }
                ports={node.ports ?? ['bottom-blue', 'bottom-red', 'bottom-black', 'bottom-green']}
                attributes={node.modbusAttrs || node.attributes}
              />
            ))}

            {/* Default Topology Components & Wires (Only rendered if NOT an imported case) */}
            {!importedCase && initialProjectDevices.map((device, index) => (
              <DraggableNode key={device.id} id={device.id} title={device.name} showLabel
                subtitle={`清单数量：${device.quantity} ${device.unit}${device.note ? ' · ' + device.note : ''}`}
                style={index < wiredDeviceIds.length
                  ? { top: 105, left: 70 + index * 285 }
                  : { top: 405 + Math.floor((index - wiredDeviceIds.length) / 5) * 220, left: 70 + ((index - wiredDeviceIds.length) % 5) * 235 }}
                icon={device.image
                  ? <DeviceImage customImage={device.image} alt={device.name} className="w-28 h-24 object-contain" />
                  : <div className="w-28 h-24 rounded-lg border border-dashed border-slate-300 bg-white/80 text-slate-400 flex flex-col items-center justify-center gap-2"><Box size={26} /><span className="text-[10px]">清单未提供图片</span></div>}
                ports={device.name.includes('485型') ? ['bottom-red', 'bottom-black', 'bottom-blue', 'bottom-green'] : []}
                attributes={[]}
                onDelete={() => deleteCanvasDevices([device.id])}
              />
            ))}

          </ConnectionCanvas>
            <div className="design-floating absolute right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col rounded-xl border border-[#d3e4ee] bg-white/95 shadow-sm overflow-hidden">
              {[Grid3X3, HelpCircle, MessageCircle, RotateCcw].map((Icon, index) => (
                <button key={index} className="w-10 h-10 flex items-center justify-center text-[#617d90] hover:text-[#00a8e8] hover:bg-[#eff9fe]" title={['视图', '帮助', '反馈', '历史'][index]}>
                  <Icon size={17} />
                </button>
              ))}
            </div>
            <div className="design-floating absolute right-5 bottom-4 z-30 h-9 flex items-center rounded-lg border border-[#d3e1ea] bg-white shadow-sm overflow-hidden text-[#627b8d] text-xs">
              <button className="w-12 h-full flex items-center justify-center hover:bg-[#f2f8fb]"><ZoomOut size={15} /></button>
              <span className="w-14 text-center border-x border-[#e0e8ee]">100%</span>
              <button className="w-12 h-full flex items-center justify-center hover:bg-[#f2f8fb]"><ZoomIn size={15} /></button>
              <button className="w-12 h-full flex items-center justify-center border-l border-[#e0e8ee] hover:bg-[#f2f8fb]"><RotateCcw size={15} /></button>
            </div>

          </div>
          {isTwinMode && (
            <>
            <div role="separator" aria-label="调整设计区和设备列表宽度" aria-orientation="vertical" aria-valuemin={25} aria-valuemax={75} aria-valuenow={Math.round(panelWidth)} tabIndex={0}
              className="twin-resizer w-2 shrink-0 cursor-col-resize flex items-center justify-center touch-none outline-none"
              onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setPanelWidth(previous => Math.max(25, Math.min(75, previous + (event.key === 'ArrowLeft' ? 2 : -2)))); } }}
              onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); event.preventDefault(); }}
              onPointerMove={event => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) return; const bounds = workspaceRef.current?.getBoundingClientRect(); if (bounds) setPanelWidth(Math.max(25, Math.min(75, (bounds.right - event.clientX) / bounds.width * 100))); }}
              onPointerUp={event => event.currentTarget.releasePointerCapture(event.pointerId)}
            ><GripVertical size={12} /></div>
            <TwinDevicePanel
              width={panelWidth}
              canvasDevices={canvasDevices}
              onSelect={selectCanvasDevice}
              onGenerate={handleGenerateSimulation}
              connected={agentConnected}
              agentConfig={agentConfig}
              onConfigure={() => setIsAgentConfigOpen(true)}
            />
            </>
          )}
          </div>
          
          {/* Footer Tabs */}
          <div className="design-footer h-12 bg-white border-t border-[#d2e0e9] flex items-center px-3 text-xs shrink-0 transition-colors duration-300">
            <div className="h-8 flex items-center gap-2 text-[#7b8d9a] mr-2 bg-[#eef3f6] px-3 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-[#8fa2af]"></div> 未发布
            </div>
            <button className="w-8 h-8 flex items-center justify-center border border-[#a7d8ef] rounded-lg bg-white text-[#00a8e8] hover:bg-[#effaff] mr-2 transition-colors cursor-pointer"><Plus size={16} /></button>
            <div className="flex h-full items-end">
              <div className="h-9 px-5 rounded-t-lg text-[#159fd8] bg-[#eaf8ff] font-medium flex items-center gap-3 cursor-pointer" title={projectName}>{projectName}</div>
            </div>
          </div>
        </main>
      </div>

      {pendingMode && (
        <div className="fixed inset-0 z-[100] bg-slate-950/65 backdrop-blur-[2px] flex items-center justify-center p-6" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mode-change-title"
            className={`w-full max-w-[600px] overflow-hidden rounded-2xl border shadow-2xl ${pendingMode === 'twin' ? 'bg-white border-red-100 text-slate-800' : 'bg-white border-slate-200 text-slate-800'}`}
          >
            <div className={`px-6 py-5 border-b ${pendingMode === 'twin' ? 'border-red-100 bg-[#fff8f6]' : 'border-slate-100 bg-slate-50/80'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pendingMode === 'twin' ? 'bg-red-50 text-[#ee4d2d]' : 'bg-amber-50 text-amber-500'}`}>
                  <AlertTriangle size={21} />
                </div>
                <div>
                  <h2 id="mode-change-title" className="text-base font-semibold">确认切换至{modeDetails[pendingMode].label}</h2>
                  <p className={`text-xs mt-1 leading-5 ${pendingMode === 'twin' ? 'text-slate-400' : 'text-slate-500'}`}>
                    两种模式的数据来源和操作能力不同，请确认当前工作目标后再切换。
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
                <ModeSummary mode={designMode} caption="当前模式" dark={false} />
                <div className="flex items-center justify-center text-slate-400"><ArrowRight size={18} /></div>
                <ModeSummary mode={pendingMode} caption="切换后" active dark={false} />
              </div>
            </div>

            <div className={`px-6 py-4 border-t flex items-center justify-between ${pendingMode === 'twin' ? 'border-red-100 bg-[#fff8f6]' : 'border-slate-100 bg-slate-50'}`}>
              <div className={`text-xs ${pendingMode === 'twin' ? 'text-slate-500' : 'text-slate-400'}`}>
                {modeCountdown > 0 ? `请阅读模式差异，${modeCountdown} 秒后可确认` : '已完成阅读，可以确认切换'}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPendingMode(null)}
                  className={`h-9 px-4 rounded-lg border text-sm transition-colors ${pendingMode === 'twin' ? 'border-slate-200 text-slate-600 hover:bg-red-50' : 'border-slate-200 text-slate-600 hover:bg-white'}`}
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={modeCountdown > 0}
                  onClick={confirmModeChange}
                  className={`h-9 min-w-[128px] px-4 rounded-lg text-sm font-medium text-white transition-all disabled:cursor-not-allowed disabled:opacity-45 ${pendingMode === 'twin' ? 'bg-[#ee4d2d] hover:bg-[#d93f22]' : 'bg-[#00a8e8] hover:bg-[#0097d2]'}`}
                >
                  {modeCountdown > 0 ? `确认切换 (${modeCountdown}s)` : '确认切换'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAgentConfigOpen && (
        <HardwareAgentConfigModal
          config={agentConfig}
          connected={agentConnected}
          onClose={() => setIsAgentConfigOpen(false)}
          onConnect={handleAgentConnect}
          onDisconnect={handleAgentDisconnect}
        />
      )}

      <AddCustomDeviceModal isOpen={isAddDeviceModalOpen} onClose={() => setIsAddDeviceModalOpen(false)} />
      
      {/* 仿真设备中心快速检索弹窗 */}
      <QuickDeviceCenterModal
        isOpen={isDeviceCenterModalOpen}
        onClose={() => setIsDeviceCenterModalOpen(false)}
        onAddDevice={handleAddDeviceToCanvas}
        canvasDeviceCount={addedNodes.length}
      />
    </div>
    </ConnectionProvider>
    </DeviceSelectionContext.Provider>
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

function ToolbarAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="h-8 px-2.5 rounded-lg border border-[#cbdbe6] bg-white text-[#5d7587] hover:text-[#00a8e8] hover:border-[#85ccec] flex items-center gap-1.5 transition-colors">
      {icon}{label}
    </button>
  );
}

function ModeOption({ mode, active, onClick }: { mode: DesignMode; active: boolean; onClick: () => void }) {
  const Icon = mode === 'simulation' ? Boxes : Monitor;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={modeDetails[mode].description}
      className={`mode-option relative h-7 px-3.5 rounded-lg flex items-center gap-1.5 font-medium transition-all ${active
        ? mode === 'twin' ? 'bg-[#ee4d2d] text-white shadow-sm' : 'bg-[#00a8e8] text-white shadow-sm'
        : 'text-[#61798a] hover:bg-[#eef5f8]'}`}
    >
      <Icon size={13} />
      {modeDetails[mode].shortLabel}
      <span className="mode-tooltip" role="tooltip">
        <strong>{modeDetails[mode].label}</strong>
        <span>{modeDetails[mode].description}</span>
      </span>
    </button>
  );
}

function ModeSummary({ mode, caption, active = false, dark = false }: { mode: DesignMode; caption: string; active?: boolean; dark?: boolean }) {
  const Icon = mode === 'simulation' ? Boxes : Monitor;
  return (
    <div className={`rounded-xl border p-4 ${active
      ? mode === 'twin' ? 'border-red-200 bg-red-50' : 'border-sky-300 bg-sky-50'
      : dark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-white'}`}
    >
      <div className={`text-[10px] mb-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{caption}</div>
      <div className="flex items-center gap-2 font-semibold text-sm">
        <Icon size={16} className={mode === 'twin' ? 'text-[#ee4d2d]' : 'text-sky-500'} />
        {modeDetails[mode].shortLabel}
      </div>
      <p className={`text-[11px] leading-5 mt-2 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{modeDetails[mode].description}</p>
    </div>
  );
}

function TwinDevicePanel({ connected, agentConfig, onConfigure, width, canvasDevices, onSelect, onGenerate }: {
  connected: boolean; agentConfig: HardwareAgentConfig; onConfigure: () => void;
  width: number; canvasDevices: CanvasDevice[]; onSelect: (id: string) => void;
  onGenerate: (device: SouthboundDevice) => string;
}) {
  const editor = useConnections();
  const [devices, setDevices] = useState(initialSouthboundDevices);
  const [bindings, setBindings] = useState<Record<number, string>>({});
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftAddress, setDraftAddress] = useState('');
  const [error, setError] = useState('');
  const [syncTimes, setSyncTimes] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState('');
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [generationQueue, setGenerationQueue] = useState<SouthboundDevice[] | null>(null);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [lastGeneratedId, setLastGeneratedId] = useState('');
  const [syncQueue, setSyncQueue] = useState<SouthboundDevice[] | null>(null);
  const [deviceView, setDeviceView] = useState<'list' | 'cards' | 'topology'>('list');
  const [selectedTopologyGroups, setSelectedTopologyGroups] = useState<string[]>(['串口 A']);
  const isSyncing = syncQueue !== null;
  const selectAllRef = useRef<HTMLInputElement>(null);
  const linkedDevice = (device: SouthboundDevice) => bindings[device.id] !== undefined
    ? canvasDevices.find(candidate => candidate.id === bindings[device.id])
    : canvasDevices.find(candidate => candidate.sourceDeviceId === device.id) || canvasDevices.find(candidate => candidate.name === device.name) || canvasDevices.find(candidate => candidate.name === device.linkedDevice);
  const filteredDevices = devices.filter(device => {
    const keyword = query.trim().toLowerCase();
    return `${device.name} ${linkedDevice(device)?.name || ''} ${device.address} ${device.serialPort} ${device.protocol}`.toLowerCase().includes(keyword);
  });
  const displayedDevices = deviceView === 'topology' ? filteredDevices.filter(device => selectedTopologyGroups.includes(device.serialPort)) : filteredDevices;
  const allChecked = displayedDevices.length > 0 && displayedDevices.every(device => checkedIds.includes(device.id));
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = !allChecked && displayedDevices.some(device => checkedIds.includes(device.id));
  }, [allChecked, displayedDevices, checkedIds, deviceView]);
  useEffect(() => {
    if (!syncQueue || !connected) return;
    if (devices.length >= syncQueue.length) {
      setNotice(`南向设备同步完成，共 ${devices.length} 台设备`);
      setSyncQueue(null);
      return;
    }
    const timer = window.setTimeout(() => {
      const device = syncQueue[devices.length];
      setDevices(previous => [...previous, device]);
      setSyncTimes(previous => ({ ...previous, [device.id]: new Date().toLocaleTimeString('zh-CN', { hour12: false }) }));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [syncQueue, devices.length, connected]);
  const synchronizeSouthboundDevices = () => {
    if (!connected || isSyncing || generationQueue) return;
    setSyncQueue(devices.map(device => ({ ...device, value: initialSouthboundDevices.find(snapshot => snapshot.id === device.id)?.value || device.value })));
    setDevices([]);
    setQuery('');
    setCheckedIds([]);
    setEditingId(null);
    setError('');
    setSyncTimes({});
    setNotice('');
  };
  useEffect(() => {
    if (!generationQueue || generatedCount >= generationQueue.length || !connected) return;
    const timer = window.setTimeout(() => {
      const device = generationQueue[generatedCount];
      const id = onGenerate(device);
      setBindings(previous => ({ ...previous, [device.id]: id }));
      setLastGeneratedId(id);
      setGeneratedCount(generatedCount + 1);
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [generationQueue, generatedCount, connected, onGenerate]);
  useEffect(() => {
    if (generationQueue && generatedCount > 0 && lastGeneratedId) {
      const current = generationQueue[generatedCount - 1];
      const previous = generationQueue.slice(0, generatedCount - 1).reverse().find(device => device.serialPort === current.serialPort && device.protocol === current.protocol);
      if (previous && current.protocol === 'RS485') editor.connectNodes(`twin_${previous.id}`, lastGeneratedId);
      onSelect(lastGeneratedId);
    }
  }, [generationQueue, generatedCount, lastGeneratedId]);
  const startGeneration = () => {
    if (!connected || checkedIds.length === 0 || generationQueue || isSyncing) return;
    setGeneratedCount(0);
    setLastGeneratedId('');
    setGenerationQueue(devices.filter(device => checkedIds.includes(device.id)));
  };
  const saveAddress = (deviceId: number) => {
    const address = Number(draftAddress);
    if (!Number.isInteger(address) || address < 1 || address > 247) return setError('Modbus 地址须为 1–247 的整数');
    if (devices.some(device => device.id !== deviceId && device.address === address)) return setError('该地址已被其他设备使用');
    setDevices(previous => previous.map(device => device.id === deviceId ? { ...device, address } : device));
    setEditingId(null);
    setError('');
  };
  const synchronize = (device: SouthboundDevice) => {
    const snapshot = initialSouthboundDevices.find(item => item.id === device.id);
    if (snapshot) setDevices(previous => previous.map(item => item.id === device.id ? { ...item, value: snapshot.value } : item));
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setSyncTimes(previous => ({ ...previous, [device.id]: time }));
    setNotice(`${device.name} 已同步 · ${time}`);
  };
  const toggleDevice = (id: number, checked: boolean) => setCheckedIds(previous => checked ? [...new Set([...previous, id])] : previous.filter(item => item !== id));
  const portGroups = [...new Set(filteredDevices.map(device => device.serialPort))].map(serialPort => ({
    serialPort,
    protocols: [...new Set(filteredDevices.filter(device => device.serialPort === serialPort).map(device => device.protocol))].map(protocol => ({
      protocol, devices: filteredDevices.filter(device => device.serialPort === serialPort && device.protocol === protocol),
    })),
  }));
  const renderDeviceCard = (device: SouthboundDevice) => {
    const linked = linkedDevice(device);
    const source = isa850Devices.find(item => item.name === device.name);
    return <article key={device.id} data-real-device={device.id} className={`rounded-xl border bg-white p-3 min-w-0 ${checkedIds.includes(device.id) ? 'border-[#ee4d2d] ring-1 ring-red-100' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 cursor-pointer text-[10px] text-slate-500"><input type="checkbox" aria-label={`勾选${device.name}`} checked={checkedIds.includes(device.id)} onChange={event => toggleDevice(device.id, event.target.checked)} className="accent-[#ee4d2d]" />{String(device.id).padStart(2, '0')}</label>
        <span className="text-[10px] text-emerald-600">● 在线</span>
      </div>
      <button type="button" onClick={() => toggleDevice(device.id, !checkedIds.includes(device.id))} aria-label={`选择卡片${device.name}`} aria-pressed={checkedIds.includes(device.id)} className="w-full h-28 mt-2 rounded-lg bg-slate-50/60 flex items-center justify-center p-3">
        {source?.image ? <DeviceImage customImage={source.image} alt={device.name} className="w-full h-full object-contain" /> : <Box size={32} className="text-slate-300" />}
      </button>
      <h3 className="mt-3 text-xs font-semibold leading-5 min-h-10">{device.name}</h3>
      <p className="text-[10px] text-slate-400">{device.serialPort} · {device.protocol}</p>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500"><span>{device.protocol === 'RS485' || device.protocol === 'Modbus-TCP' ? 'Modbus 地址' : '设备地址'}</span>{editingId === device.id ? <div className="flex items-center gap-1">
        <input autoFocus aria-label="Modbus地址" type="number" min="1" max="247" value={draftAddress} onChange={event => setDraftAddress(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') saveAddress(device.id); if (event.key === 'Escape') { setEditingId(null); setError(''); } }} className="w-12 h-6 rounded border border-red-200 px-1" />
        <button title="保存地址" onClick={() => saveAddress(device.id)}><Check size={13} /></button><button title="取消修改" onClick={() => { setEditingId(null); setError(''); }}><X size={13} /></button>
      </div> : <button title="修改Modbus地址" onClick={() => { setEditingId(device.id); setDraftAddress(String(device.address)); setError(''); }} className="twin-outline px-2 py-0.5 inline-flex items-center gap-1">{device.address}<Pencil size={10} /></button>}</div>
      {editingId === device.id && error && <p role="alert" className="text-[10px] text-red-600 mt-1">{error}</p>}
      <div className="mt-2 rounded-lg bg-[#fff8f6] px-2 py-2 text-[11px] leading-5">{device.value}</div>
      <label className="block mt-3 text-[10px] text-slate-500">关联仿真设备
        <select aria-label={`${device.name}关联仿真设备`} value={linked?.id || ''} onChange={event => setBindings(previous => ({ ...previous, [device.id]: event.target.value }))} className="mt-1 w-full min-w-0 border border-slate-200 rounded-md bg-white p-1.5 text-[10px]">
          <option value="">未关联 · 选择设备</option>{canvasDevices.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
        </select>
      </label>
      <div className="mt-3 flex items-center gap-2"><button onClick={() => synchronize(device)} className="twin-outline px-2 h-7 text-[10px] flex items-center gap-1"><RefreshCw size={11} />同步</button><button disabled={!linked} onClick={() => linked && onSelect(linked.id)} className="twin-outline px-2 h-7 text-[10px] flex items-center gap-1 disabled:opacity-35"><MousePointer2 size={11} />选中</button></div>
      {syncTimes[device.id] && <p className="mt-2 text-[9px] text-slate-400">同步于 {syncTimes[device.id]}</p>}
    </article>;
  };
  return (
    <section style={{ width: `${width}%` }} className="twin-device-panel shrink-0 min-w-0 bg-white text-slate-700 flex flex-col min-h-0" aria-label="南向真实设备列表">
      <div className="h-[58px] shrink-0 px-4 border-b border-red-100 bg-[#fff8f6] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-red-50 text-[#ee4d2d] flex items-center justify-center"><Server size={16} /></div>
          <div className="min-w-0"><div className="text-sm font-semibold truncate">南向真实设备</div><div className="text-[10px] text-slate-500 truncate">{agentConfig.agent} · 多协议接入</div></div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] ${connected ? 'text-emerald-600' : 'text-red-600'}`}>{connected ? `${devices.length} 台在线` : '终端未连接'}</span>
          <button onClick={startGeneration} disabled={!connected || checkedIds.length === 0 || !!generationQueue || isSyncing} title={checkedIds.length ? '生成所选设备并关联到左侧画布' : '请先勾选列表中的设备'} className="h-7 px-2 rounded-md bg-[#ee4d2d] text-white text-[10px] flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"><Boxes size={12} />生成仿真{checkedIds.length > 0 ? ` (${checkedIds.length})` : ''}</button>
          <button onClick={synchronizeSouthboundDevices} disabled={!connected || isSyncing || !!generationQueue} aria-label="同步南向设备" className="twin-outline h-7 px-2 flex items-center gap-1 text-[10px] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"><RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />{isSyncing ? '同步中…' : '同步南向设备'}</button>
        </div>
      </div>
      {connected ? <>
        <div className="px-3 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div role="group" aria-label="南向设备展示模式" className="inline-flex p-1 rounded-lg bg-slate-100 gap-1">
              {([{ value: 'list', label: '列表', icon: List }, { value: 'cards', label: '卡片', icon: LayoutGrid }, { value: 'topology', label: '拓扑', icon: Network }] as const).map(({ value, label, icon: Icon }) => <button key={value} aria-label={`${label}模式`} aria-pressed={deviceView === value} onClick={() => { setDeviceView(value); setEditingId(null); setError(''); }} className={`h-7 px-2.5 rounded-md flex items-center gap-1.5 text-[11px] ${deviceView === value ? 'bg-white text-[#ee4d2d] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Icon size={13} />{label}</button>)}
            </div>
            <span className="text-[10px] text-slate-400">{filteredDevices.length} 台设备</span>
          </div>
          <div className="relative"><Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索真实设备、地址或关联设备" className="w-full h-8 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[11px] outline-none focus:border-[#ee4d2d]" />
          </div>
          <div className="mt-2 min-h-4 text-[10px] text-slate-500" role="status">{syncQueue ? `正在同步南向设备 ${devices.length} / ${syncQueue.length}${syncQueue[devices.length] ? ` · 下一台：${syncQueue[devices.length].name}` : ''}` : checkedIds.length > 0 ? `已勾选 ${checkedIds.length} 台设备，可点击「生成仿真」加入左侧画布` : notice || `终端 ${agentConfig.ip}:${agentConfig.port} · 勾选设备可批量生成仿真`}</div>
          {syncQueue && <div role="progressbar" aria-label="南向设备同步进度" aria-valuemin={0} aria-valuemax={syncQueue.length} aria-valuenow={devices.length} className="mt-2 h-1.5 rounded-full bg-red-50 overflow-hidden"><div className="h-full bg-[#ee4d2d] transition-all duration-300" style={{ width: `${syncQueue.length ? devices.length / syncQueue.length * 100 : 100}%` }} /></div>}
        </div>
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          {deviceView !== 'list' && <label className="flex items-center gap-2 px-4 py-3 text-[11px] text-slate-500"><input ref={selectAllRef} type="checkbox" aria-label="全选当前列表设备" checked={allChecked} onChange={event => setCheckedIds(previous => event.target.checked ? [...new Set([...previous, ...displayedDevices.map(device => device.id)])] : previous.filter(id => !displayedDevices.some(device => device.id === id)))} className="accent-[#ee4d2d]" />全选当前结果<span className="ml-auto">已选 {checkedIds.length} 台</span></label>}
          {deviceView === 'cards' && <div aria-label="南向设备卡片" className="southbound-card-area mx-3 mb-3"><div className="southbound-card-grid">{filteredDevices.map(renderDeviceCard)}</div></div>}
          {deviceView === 'topology' && filteredDevices.length > 0 && <div aria-label="南向设备拓扑" className="flex min-w-[380px] items-start p-3 pt-0 gap-3">
            <nav aria-label="协议连接树" className="w-40 shrink-0 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-[11px]">
              <div className="font-semibold flex items-center gap-2 mb-3"><Server size={14} className="text-[#ee4d2d] shrink-0" /><span className="truncate" title={agentConfig.agent}>{agentConfig.agent}</span></div>
              <p className="text-[10px] text-slate-400 mb-2">勾选目录查看设备</p>
              {portGroups.map(group => <div key={group.serialPort} className="mb-2">
                <label className={`flex items-center gap-2 cursor-pointer rounded-md py-2 px-1 ${selectedTopologyGroups.includes(group.serialPort) ? 'bg-red-50 text-[#bd4b30]' : 'text-slate-600'}`}>
                  <input type="checkbox" aria-label={`显示${group.serialPort}设备`} checked={selectedTopologyGroups.includes(group.serialPort)}
                    onChange={event => setSelectedTopologyGroups(previous => event.target.checked ? [...previous, group.serialPort] : previous.filter(port => port !== group.serialPort))}
                    className="accent-[#ee4d2d] shrink-0" />
                  <span className="font-medium">{group.serialPort}</span>
                </label>
                <ul className="ml-2 border-l border-red-200 pl-3 text-[10px] text-slate-500">
                  {group.protocols.map(bus => <li key={bus.protocol} className="py-1.5">{bus.protocol}{bus.protocol === 'RS485' ? ' 总线' : bus.protocol === 'Zigbee' ? ' 网络' : ''} <span className="text-slate-400">({bus.devices.length})</span></li>)}
                </ul>
              </div>)}
            </nav>
            <div className="southbound-card-area flex-1 min-w-0" aria-label="目录设备列表">
              <div className="text-[11px] text-slate-500 mb-3">{selectedTopologyGroups.length ? `已选 ${selectedTopologyGroups.length} 个目录 · ${displayedDevices.length} 台设备` : '请选择左侧目录'}</div>
              <div className="southbound-card-grid">{displayedDevices.map(renderDeviceCard)}</div>
              {displayedDevices.length === 0 && <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-xs text-slate-400">{selectedTopologyGroups.length ? '所选目录下没有匹配设备' : '勾选左侧一级目录，查看该目录下的所有设备'}</div>}
            </div>
          </div>}
          {deviceView === 'list' && <table className="w-full min-w-[760px] text-[11px] text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-[#fff8f6] text-slate-500 text-[10px]"><tr>
              <th className="pl-3 py-3 border-b border-red-100"><input ref={selectAllRef} type="checkbox" aria-label="全选当前列表设备" checked={allChecked} onChange={event => setCheckedIds(previous => event.target.checked ? [...new Set([...previous, ...displayedDevices.map(device => device.id)])] : previous.filter(id => !displayedDevices.some(device => device.id === id)))} className="accent-[#ee4d2d] cursor-pointer" /></th>
              {['序号', '设备名称', '设备地址', '当前传感器数值', '关联仿真设备', '操作'].map(title => <th key={title} className={`px-3 py-3 whitespace-nowrap font-medium border-b border-red-100 ${title === '操作' ? 'sticky right-0 bg-[#fff8f6]' : ''}`}>{title}</th>)}
            </tr></thead>
            <tbody>{filteredDevices.map(device => {
              const linked = linkedDevice(device);
              return <tr key={device.id} data-real-device={device.id} className="border-b border-slate-100 hover:bg-[#fffbfa]">
                <td className="pl-3 py-3"><input type="checkbox" aria-label={`勾选${device.name}`} checked={checkedIds.includes(device.id)} onChange={event => setCheckedIds(previous => event.target.checked ? [...previous, device.id] : previous.filter(id => id !== device.id))} className="accent-[#ee4d2d] cursor-pointer" /></td>
                <td className="px-3 py-3 font-mono text-slate-400">{String(device.id).padStart(2, '0')}</td>
                <td className="px-3 py-3"><div className="font-medium whitespace-nowrap">{device.name}</div><div className="mt-1 text-[9px] text-emerald-600">● 在线 · {device.protocol}</div></td>
                <td className="px-3 py-3">{editingId === device.id ? <div>
                  <div className="flex items-center gap-1">
                    <input autoFocus aria-label="Modbus地址" type="number" min="1" max="247" value={draftAddress} onChange={event => setDraftAddress(event.target.value)}
                      onKeyDown={event => { if (event.key === 'Enter') saveAddress(device.id); if (event.key === 'Escape') { setEditingId(null); setError(''); } }}
                      className="w-12 h-7 rounded border border-red-300 px-1 outline-none" />
                    <button onClick={() => saveAddress(device.id)} title="保存地址" className="text-emerald-600"><Check size={13} /></button>
                    <button onClick={() => { setEditingId(null); setError(''); }} title="取消修改"><X size={13} /></button>
                  </div>
                  {error && <span role="alert" className="text-red-600 text-[10px]">{error}</span>}
                </div> : <button title="修改Modbus地址" onClick={() => { setEditingId(device.id); setDraftAddress(String(device.address)); setError(''); }} className="twin-outline px-2 py-1 inline-flex items-center gap-1 font-mono">{device.address}<Pencil size={10} /></button>}</td>
                <td className="px-3 py-3 whitespace-nowrap"><span className="text-slate-700">{device.value}</span>{syncTimes[device.id] && <div className="text-[9px] text-slate-400 mt-1">同步于 {syncTimes[device.id]}</div>}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2 min-w-[166px]">
                    <div className="w-9 h-9 shrink-0 bg-slate-50 rounded-md border border-slate-100 p-1 flex items-center justify-center">{linked ? <DeviceImage deviceId={linked.imageId} customImage={linked.image} alt={linked.name} className="w-full h-full object-contain" /> : <Box size={17} className="text-slate-300" />}</div>
                    <select aria-label={`${device.name}关联仿真设备`} value={linked?.id || ''} title={linked?.name || '选择仿真设备'} onChange={event => {
                      const id = event.target.value;
                      setBindings(previous => ({ ...previous, [device.id]: id }));
                      setNotice(`${device.name}${id ? ' 已绑定 ' + canvasDevices.find(candidate => candidate.id === id)?.name : ' 已解除绑定'}`);
                    }} className="w-36 bg-white border border-slate-200 rounded-md px-1.5 py-1.5 text-[10px] outline-none focus:border-[#ee4d2d]">
                      <option value="">未关联 · 选择设备</option>
                      {canvasDevices.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
                    </select>
                  </div>
                </td>
                <td className="sticky right-0 bg-white px-3 py-3 border-l border-slate-100"><div className="flex items-center gap-1.5">
                  <button onClick={() => synchronize(device)} className="twin-outline h-7 px-2 flex items-center gap-1 whitespace-nowrap"><RefreshCw size={11} />同步</button>
                  <button disabled={!linked} onClick={() => linked && onSelect(linked.id)} className="twin-outline h-7 px-2 flex items-center gap-1 whitespace-nowrap disabled:opacity-35 disabled:cursor-not-allowed" title={linked ? '选中并定位关联仿真设备' : '请先绑定仿真设备'}><MousePointer2 size={11} />选中</button>
                </div></td>
              </tr>;
            })}</tbody>
          </table>}
          {filteredDevices.length === 0 && <div className="p-10 text-center text-xs text-slate-400">{isSyncing ? '正在读取南向设备，请稍候…' : '未找到匹配设备'}</div>}
        </div>
      </> : <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <WifiOff size={28} className="text-slate-300 mb-4" /><div className="text-sm font-medium">硬件智能体终端未连接</div>
        <p className="text-xs text-slate-500 leading-6 mt-2">连接终端后查看南向设备及协议拓扑。</p>
        <button onClick={onConfigure} className="mt-5 h-9 px-4 rounded-lg bg-[#ee4d2d] text-white text-xs">配置并连接</button>
      </div>}
      {generationQueue && <div className="shrink-0 border-t border-red-200 bg-[#fff8f6] p-4" aria-label="仿真生成进度面板">
        <div role="region" aria-labelledby="generation-title">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-[#ee4d2d] flex items-center justify-center">{generatedCount === generationQueue.length ? <Check size={24} /> : <LoaderCircle size={24} className="animate-spin" />}</div>
            <div><h2 id="generation-title" className="font-semibold text-sm">{generatedCount === generationQueue.length ? '仿真设备生成完成' : !connected ? '连接已断开，生成已暂停' : '正在逐个生成仿真设备'}</h2><p className="text-xs text-slate-500 mt-1">左侧实时展示设备及示例连线，自动定位当前设备</p></div>
          </div>
          <div className="flex justify-between text-xs mb-2" aria-live="polite"><span>{generatedCount} / {generationQueue.length} 台设备</span><span className="text-[#ee4d2d] font-medium">{Math.round(generatedCount / generationQueue.length * 100)}%</span></div>
          <div role="progressbar" aria-label="仿真生成进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(generatedCount / generationQueue.length * 100)} className="h-2.5 rounded-full bg-red-50 overflow-hidden"><div className="h-full rounded-full bg-[#ee4d2d] transition-all duration-300" style={{ width: `${generatedCount / generationQueue.length * 100}%` }} /></div>
          <p className="mt-3 text-xs text-slate-500 min-h-5" role="status">{generatedCount > 0 && `已生成：${generationQueue[generatedCount - 1].name}，已完成关联。`}{generatedCount === generationQueue.length ? '全部完成。' : connected ? `下一台：${generationQueue[generatedCount].name}` : '重新连接终端后继续。'}</p>
          <div className="mt-3 flex justify-end"><button disabled={generatedCount !== generationQueue.length} onClick={() => { setNotice(`已生成并关联 ${generationQueue.length} 台仿真设备`); setGenerationQueue(null); setCheckedIds([]); onSelect(lastGeneratedId); }} className="h-8 px-4 rounded-lg bg-[#ee4d2d] text-white text-xs disabled:opacity-40 disabled:cursor-not-allowed">{generatedCount === generationQueue.length ? '完成' : '生成中…'}</button></div>
        </div>
      </div>}
    </section>
  );
}

function HardwareAgentConfigModal({ config, connected, onClose, onConnect, onDisconnect }: {
  config: HardwareAgentConfig;
  connected: boolean;
  onClose: () => void;
  onConnect: (config: HardwareAgentConfig) => void;
  onDisconnect: () => void;
}) {
  const [form, setForm] = useState(config);
  const [error, setError] = useState('');

  useEffect(() => setForm(config), [config]);

  const submit = () => {
    const octets = form.ip.split('.').map(Number);
    const validIp = octets.length === 4 && octets.every(octet => Number.isInteger(octet) && octet >= 0 && octet <= 255);
    const port = Number(form.port);
    if (!validIp) return setError('请输入有效的 IPv4 地址');
    if (!Number.isInteger(port) || port < 1 || port > 65535) return setError('端口范围应为 1–65535');
    if (!form.agent) return setError('请选择需要绑定的硬件智能体');
    setError('');
    onConnect(form);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
      <div role="dialog" aria-modal="true" aria-labelledby="agent-config-title" className="w-full max-w-[520px] rounded-2xl border border-red-100 bg-white text-slate-700 shadow-2xl overflow-hidden">
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between bg-[#111a23]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#ee4d2d] flex items-center justify-center"><Cpu size={18} /></div>
            <div>
              <h2 id="agent-config-title" className="text-sm font-semibold">硬件智能体终端配置</h2>
              <div className="text-[10px] text-slate-500 mt-0.5">配置终端网络并绑定网关类硬件智能体</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className={`rounded-xl border px-4 py-3 flex items-center justify-between ${connected ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-rose-500/25 bg-rose-500/10'}`}>
            <div className="flex items-center gap-2">
              {connected ? <Wifi size={15} className="text-emerald-400" /> : <WifiOff size={15} className="text-rose-400" />}
              <div>
                <div className={`text-xs font-medium ${connected ? 'text-emerald-700' : 'text-rose-600'}`}>{connected ? '终端已连接' : '终端未连接'}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{connected ? `${config.ip}:${config.port} · ${config.agent}` : '启动实验前必须完成连接'}</div>
              </div>
            </div>
            {connected && <button onClick={onDisconnect} className="h-7 px-2.5 rounded-md border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 text-[10px]">断开连接</button>}
          </div>

          <div className="grid grid-cols-[1fr_130px] gap-3">
            <label className="space-y-1.5">
              <span className="text-[11px] text-slate-500">终端 IP 地址</span>
              <input value={form.ip} onChange={event => setForm(previous => ({ ...previous, ip: event.target.value }))} placeholder="192.168.1.188" className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono outline-none focus:border-[#ee4d2d]" />
            </label>
            <label className="space-y-1.5">
              <span className="text-[11px] text-slate-500">服务端口</span>
              <input type="number" min="1" max="65535" value={form.port} onChange={event => setForm(previous => ({ ...previous, port: event.target.value }))} placeholder="9000" className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono outline-none focus:border-[#ee4d2d]" />
            </label>
          </div>

          <label className="space-y-1.5 block">
            <span className="text-[11px] text-slate-500">绑定硬件智能体</span>
            <select value={form.agent} onChange={event => setForm(previous => ({ ...previous, agent: event.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-[#ee4d2d]">
              <option>中心网关智能体</option>
              <option>边缘计算网关智能体</option>
              <option>4G数传终端智能体</option>
              <option>RS485采集智能体</option>
            </select>
          </label>

          <div className="rounded-xl border border-red-100 bg-red-50 p-3 flex items-start gap-2.5">
            <Server size={14} className="text-[#ee4d2d] mt-0.5 shrink-0" />
            <p className="text-[10px] leading-5 text-slate-500">绑定中心网关等硬件智能体后，平台会读取其南向设备、接入协议、设备地址、实时数值和在线状态。</p>
          </div>
          {error && <div className="text-xs text-rose-400">{error}</div>}
        </div>

        <div className="h-16 px-5 border-t border-red-100 bg-[#fff8f6] flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs">取消</button>
          <button aria-label="保存并连接硬件智能体" onClick={submit} className="h-9 px-4 rounded-lg bg-[#ee4d2d] hover:bg-[#d93f22] text-white text-xs font-medium flex items-center gap-2"><PlugZap size={14} />保存并连接</button>
        </div>
      </div>
    </div>
  );
}


function DraggableContainer({ children, className, style, id, onDrag }: any) {
  const { position, handleMouseDown } = useDraggable({ x: 0, y: 0 }, onDrag);
  const editor = useConnections();
  const selection = useContext(DeviceSelectionContext);
  
  return (
    <div 
      className={`${className} ${selection.selectedIds.includes(id) ? 'device-selected' : ''}`}
      data-device-id={id}
      aria-selected={selection.selectedIds.includes(id)}
      style={{
        ...style,
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
      onMouseDown={event => {
        if (event.button !== 0 || editor.mode === 'connect' || editor.pending || (event.target as HTMLElement).closest('button')) return;
        event.preventDefault();
        selection.select(id, event.ctrlKey || event.metaKey || event.shiftKey);
        editor.setSelected(null);
        (event.currentTarget.closest('.design-canvas') as HTMLElement)?.focus({ preventScroll: true });
        if (event.ctrlKey || event.metaKey || event.shiftKey) return;
        handleMouseDown(event);
      }}
    >
      {children}
    </div>
  );
}

function DraggableNode({ id, title, subtitle, icon, style, ports, headerClass="bg-gray-100", onDrag, onDelete, attributes, showLabel = false, appearing = false }: any) {
  const [showAttrTooltip, setShowAttrTooltip] = useState(false);
  const editor = useConnections();
  const selection = useContext(DeviceSelectionContext);

  // 若没有显式传入 attributes，则根据 title / subtitle 自动推导是否有属性
  const computedAttributes = useMemo(() => {
    if (Array.isArray(attributes)) return attributes;
    const t = (title || '').toLowerCase();
    const s = (subtitle || '').toLowerCase();
    if (t.includes('温湿度') || s.includes('humiture') || s.includes('ha_61')) {
      return [
        { name: '温度', key: 'temperature', value: '25.6', unit: '℃' },
        { name: '湿度', key: 'humidity', value: '58.2', unit: '%RH' }
      ];
    }
    if (t.includes('变送器') || t.includes('压力') || s.includes('0-5v') || s.includes('4-20ma')) {
      return [
        { name: '管道压力', key: 'pressure', value: '0.82', unit: 'MPa' }
      ];
    }
    if (t.includes('人体') || t.includes('门磁') || t.includes('水浸') || s.includes('0-1')) {
      return [
        { name: '检测状态', key: 'state_signal', value: '0 (正常/无人)', unit: '电平' }
      ];
    }
    if (t.includes('水泵') || t.includes('阀门') || t.includes('执行器')) {
      return [
        { name: '运行开关', key: 'run_state', value: '1 (运行中)', unit: '状态' }
      ];
    }
    if (t.includes('网关') || s.includes('mqtt')) {
      return [
        { name: '上云状态', key: 'cloud_status', value: 'ONLINE', unit: '' },
        { name: '4G 信号', key: 'csq', value: '28', unit: 'CSQ' }
      ];
    }
    return [];
  }, [attributes, title, subtitle]);

  const hasAttrs = computedAttributes.length > 0;

  if (selection.deletedIds.includes(id)) return null;

  return (
    <DraggableContainer className="design-node absolute min-w-[150px] bg-transparent flex flex-col items-center pb-5 cursor-move z-10 group"
      style={style}
      onDrag={onDrag}
      id={id}
    >
      <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-[11px] font-medium text-[#526b7c] transition-opacity ${showLabel ? 'w-48 text-center whitespace-normal' : 'whitespace-nowrap opacity-0 group-hover:opacity-100'}`}>
        <span title={title}>{title}</span>
        
        {/* 查看属性小图标 */}
        {hasAttrs && (
          <div 
            className="relative shrink-0"
            onMouseEnter={() => setShowAttrTooltip(true)}
            onMouseLeave={() => setShowAttrTooltip(false)}
          >
            <div 
              className="w-3.5 h-3.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
              title="查看实时属性"
            >
              <Activity size={10} className="text-blue-600 animate-pulse" />
            </div>

            {/* Hover 实时属性卡片 */}
            {showAttrTooltip && (
              <div className="absolute left-full top-0 ml-2 z-50 w-56 bg-slate-900/95 text-white backdrop-blur-md rounded-xl shadow-2xl border border-slate-700/80 p-3 text-xs animate-in fade-in zoom-in-95 pointer-events-none text-left font-sans select-none">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                  <span className="font-bold text-[11px] text-slate-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    实时属性监控
                  </span>
                  <span className="text-[9px] text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-1 rounded font-mono">ONLINE</span>
                </div>
                
                <div className="space-y-1.5">
                  {computedAttributes.map((attr: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-800/80 px-2 py-1.5 rounded-lg border border-slate-700/50 text-[11px]">
                      <div className="flex flex-col min-w-0 pr-1">
                        <span className="text-slate-200 font-medium truncate">{attr.name}</span>
                        {attr.key && <span className="text-[9px] text-blue-400 font-mono">{attr.key}</span>}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-amber-300">{attr.value}</span>
                        {attr.unit && attr.unit !== '状态' && attr.unit !== '电平' && (
                          <span className="text-[10px] text-slate-400 ml-1">{attr.unit}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); editor.removeNode(id); onDelete(); }}
            className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
            title="删除"
          >
            ×
          </button>
        )}
      </div>
      <div className={`p-2 flex flex-col items-center drop-shadow-[0_8px_8px_rgba(40,70,85,0.16)] ${appearing ? 'generated-device-appear' : ''}`}>
        {icon}
      </div>
      {showLabel && <div className="w-44 text-center text-[9px] text-slate-500 leading-4">{subtitle}</div>}
      
      {/* Ports */}
      {ports && ports.length > 0 && (
        <div className="absolute -bottom-5 inset-x-0 flex justify-center px-1 gap-0 z-10">
          {ports.map((p: string) => {
             return <ConnectionPort key={p} node={id} port={p} />
          })}
        </div>
      )}
    </DraggableContainer>
  );
}
