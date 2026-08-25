import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AddCustomDeviceModal from "../components/AddCustomDeviceModal";
import DeviceMaterialManager from "../components/DeviceMaterialManager";
import SystemSimDeviceManager from "../components/SystemSimDeviceManager";
import UserAppManager from "../components/UserAppManager";
import UserCustomDeviceManager from "../components/UserCustomDeviceManager";
import TagResourceManager from "../components/TagResourceManager";
import { 
  LayoutGrid, List, Settings, Search, MoreHorizontal, Pen, 
  ChevronDown, ChevronRight, ChevronUp, UserCircle2, Box, X, UploadCloud, 
  Check, Sparkles, Copy, Eye, Plus, Layers, Image as ImageIcon, 
  Trash2, Filter, RotateCcw, Code, Terminal, CheckCircle2, Sliders, 
  HelpCircle, Zap, Globe, Lock
} from 'lucide-react';
import { getDeviceImageUrl } from '../utils/deviceImages';
import { getDeviceProtocolInfo } from '../utils/deviceProtocolHelper';
import { useHeader } from '../context/HeaderContext';

const projects = [
  { 
    id: 1, 
    name: '智慧农业2D虚拟仿真', 
    status: '已发布', 
    date: '2025-10-10 22:14:56', 
    tag: '智慧农业',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=380&fit=crop'
  },
  { 
    id: 2, 
    name: '智慧家居2D仿真', 
    status: '已发布', 
    date: '2025-10-10 23:40:28', 
    tag: '智慧家居',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=380&fit=crop'
  },
  { 
    id: 3, 
    name: '家居2D仿真【娱乐影音】', 
    status: '已发布', 
    date: '2025-10-11 00:01:21', 
    tag: '智慧家居',
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=380&fit=crop'
  },
  { 
    id: 4, 
    name: '智慧安防2D仿真', 
    status: '已发布', 
    date: '2025-10-11 00:01:21', 
    tag: '智慧安防',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=380&fit=crop'
  },
  { 
    id: 5, 
    name: '交通2D仿真【隧道】', 
    status: '已发布', 
    date: '2025-10-11 00:11:21', 
    tag: '智慧交通',
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&h=380&fit=crop'
  },
];

const initialCustomDevices = [
  { id: 'custom_1', name: '自定义温湿度传感器', image: '/device/RS485_Humiture_Thumbnail.png', type: '传感器', protocol: 'Modbus RTU', date: '2026-08-12 10:00', power: 'DC 12V / 24V', publishToSimulation: true },
  { id: 'custom_2', name: '智能灌溉阀门', image: '/device/RS485_WaterPump_Thumbnail.png', type: '执行器', protocol: 'Zigbee', date: '2026-08-11 14:30', power: 'AC 220V', publishToSimulation: true },
  { id: 'custom_3', name: '边缘计算网关V2', image: '/device/UsrG771Gateway_Thumbnail.png', type: '网关', protocol: 'MQTT', date: '2026-08-10 09:15', power: 'DC 12V', publishToSimulation: false },
  { id: 'custom_4', name: '复合传感器模块A', image: '/device/NewLabCommon_Thumbnail.png', type: '传感器', protocol: 'Lora', date: '2026-07-25 11:20', power: 'DC 5V', publishToSimulation: false },
  { id: 'custom_5', name: '大功率工业继电器', image: '/device/Relay_DINRailCircuitBreaker1P_Thumbnail.png', type: '继电器', protocol: 'Modbus TCP', date: '2026-07-18 16:40', power: 'AC 380V', publishToSimulation: true },
];

export default function ConsolePage() {
  const [activeMenu, setActiveMenu] = useState('全部应用');
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(true);
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(true);
  const [createMaterialTrigger, setCreateMaterialTrigger] = useState(0);
  const [customDeviceViewMode, setCustomDeviceViewMode] = useState<'grid' | 'table'>('grid');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('all');
  const [selectedDeviceProtocol, setSelectedDeviceProtocol] = useState<string>('all');
  const [selectedPublishStatus, setSelectedPublishStatus] = useState<string>('all');
  const navigate = useNavigate();
  const { isHeaderVisible, hideHeader } = useHeader();

  const [customDeviceList, setCustomDeviceList] = useState(initialCustomDevices);
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Edit Device Modal State
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [isEditDeviceModalOpen, setIsEditDeviceModalOpen] = useState(false);

  // Device Detail Modal Tab & Copy state
  const [deviceModalTab, setDeviceModalTab] = useState<'basic' | 'protocol'>('basic');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleOpenEditDevice = (device: any) => {
    setEditingDevice(device);
    setIsEditDeviceModalOpen(true);
  };

  const handleSaveEditDevice = (savedData: any) => {
    if (editingDevice) {
      setCustomDeviceList(prev => prev.map(d => {
        if (d.id === editingDevice.id) {
          return {
            ...d,
            name: savedData.name || d.name,
            type: savedData.type || d.type,
            protocol: savedData.protocol || d.protocol,
            image: savedData.image || d.image,
            power: savedData.powerType === '交流' ? (savedData.acVoltage || 'AC 220V') : (savedData.dcVoltage || 'DC 12V'),
            publishToSimulation: savedData.publishToSimulation ?? d.publishToSimulation,
            modbusAttrs: savedData.modbusAttrs || d.modbusAttrs,
            analogConfig: savedData.analogConfig || d.analogConfig
          };
        }
        return d;
      }));
    }
  };

  const handleTogglePublish = (deviceId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCustomDeviceList(prev => prev.map(d => {
      if (d.id === deviceId) {
        const nextState = !d.publishToSimulation;
        return { ...d, publishToSimulation: nextState };
      }
      return d;
    }));
  };

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // Copy Device Modal State
  const [isCopyDeviceModalOpen, setIsCopyDeviceModalOpen] = useState(false);
  const [deviceToCopy, setDeviceToCopy] = useState<any>(null);
  const [copyDeviceName, setCopyDeviceName] = useState('');

  // Device Detail Modal State
  const [selectedDeviceDetail, setSelectedDeviceDetail] = useState<any>(null);

  const handleOpenDeviceDetail = (device: any) => {
    setSelectedDeviceDetail(device);
    setDeviceModalTab('basic');
    setCopiedHex(null);
  };

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
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setCustomDeviceList(prev => [newDevice, ...prev]);
    alert(`设备复制成功！"${copyDeviceName}" 已添加至您的自定义设备列表。`);
    setIsCopyDeviceModalOpen(false);
    setDeviceToCopy(null);
  };

  const handleDeleteDevice = (id: string, name: string) => {
    if (confirm(`确定要删除设备 "${name}" 吗？`)) {
      setCustomDeviceList(prev => prev.filter(d => d.id !== id));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (nav: string) => {
    navigate('/', { state: { activeTab: nav } });
  };

  const filteredProjects = projects.filter(p => {
    if (!searchKeyword.trim()) return true;
    const q = searchKeyword.trim().toLowerCase();
    return p.name.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q);
  });

  const hasCustomDeviceFilter = searchKeyword.trim() !== '' || selectedDeviceType !== 'all' || selectedDeviceProtocol !== 'all' || selectedPublishStatus !== 'all';

  const filteredCustomDevices = customDeviceList.filter(d => {
    // 1. 关键词搜索
    if (searchKeyword.trim()) {
      const q = searchKeyword.trim().toLowerCase();
      const matchSearch = d.name.toLowerCase().includes(q) || 
                          d.type.toLowerCase().includes(q) || 
                          d.protocol.toLowerCase().includes(q) ||
                          d.id.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }
    // 2. 设备类型筛选
    if (selectedDeviceType !== 'all') {
      if (d.type !== selectedDeviceType) return false;
    }
    // 3. 通讯协议筛选
    if (selectedDeviceProtocol !== 'all') {
      const p = (d.protocol || '').toLowerCase();
      const filterP = selectedDeviceProtocol.toLowerCase();
      if (filterP === 'modbus') {
        if (!p.includes('modbus')) return false;
      } else if (filterP === 'zigbee') {
        if (!p.includes('zigbee')) return false;
      } else if (filterP === 'mqtt') {
        if (!p.includes('mqtt')) return false;
      } else if (filterP === 'lora') {
        if (!p.includes('lora')) return false;
      } else if (filterP === '模拟量') {
        if (!d.protocol?.includes('模拟')) return false;
      } else if (filterP === '其他') {
        if (p.includes('modbus') || p.includes('zigbee') || p.includes('mqtt') || p.includes('lora') || d.protocol?.includes('模拟')) return false;
      } else {
        if (d.protocol !== selectedDeviceProtocol) return false;
      }
    }
    // 4. 发布状态筛选
    if (selectedPublishStatus !== 'all') {
      const isPub = Boolean(d.publishToSimulation);
      if (selectedPublishStatus === 'published' && !isPub) return false;
      if (selectedPublishStatus === 'unpublished' && isPub) return false;
    }
    return true;
  });

  return (
    <div className="h-screen bg-[#f0f2f5] flex flex-col font-sans overflow-hidden">
      {/* Top Header */}
      {isHeaderVisible && (
        <header className="h-14 bg-white border-b border-gray-200 flex justify-between items-center px-6 shrink-0 z-10 relative">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="虚拟仿真 by UUSIMA" className="h-10 object-contain" />
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
          <nav className="flex items-center gap-12 absolute left-1/2 -translate-x-1/2 h-full">
            {['仿真设备中心', '仿真项目大厅'].map(nav => (
              <button
                key={nav}
                onClick={() => handleNavClick(nav)}
                className="text-[15px] font-medium transition-colors h-full flex items-center border-b-2 relative top-[2px] text-gray-600 border-transparent hover:text-[#00a0e9] cursor-pointer"
              >
                {nav}
              </button>
            ))}
            <div
              className="text-[15px] font-medium transition-colors h-full flex items-center border-b-2 relative top-[2px] text-[#00a0e9] border-[#00a0e9]"
            >
              控制台
            </div>
          </nav>

          <div className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-blue-600 transition-colors">
             <UserCircle2 size={20} />
             <span className="text-sm">杨振邦</span>
             <ChevronDown size={14} />
          </div>
        </header>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-200 py-4 flex flex-col shrink-0">
          <nav className="flex-1 space-y-1">
            {/* App Menu Group */}
            <div>
              <div 
                onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}
                className="px-4 py-2.5 flex items-center gap-3 text-gray-700 hover:bg-gray-50 cursor-pointer font-medium transition-colors select-none"
              >
                <LayoutGrid size={17} className="text-gray-400" /> 
                <span>应用</span>
                <ChevronDown size={14} className={`ml-auto text-gray-400 transition-transform duration-200 ${isAppMenuOpen ? 'rotate-0' : '-rotate-90'}`} />
              </div>
              {isAppMenuOpen && (
                <div className="space-y-0.5 mt-0.5">
                  <div 
                    onClick={() => setActiveMenu('全部应用')}
                    className={`px-12 py-2 text-sm cursor-pointer font-medium transition-colors border-r-2 ${activeMenu === '全部应用' ? 'bg-blue-50/70 text-blue-600 border-blue-600 font-semibold' : 'text-gray-600 border-transparent hover:bg-gray-50'}`}
                  >
                    全部应用
                  </div>
                  <div 
                    onClick={() => setActiveMenu('自定义设备')}
                    className={`px-12 py-2 text-sm cursor-pointer font-medium transition-colors border-r-2 ${activeMenu === '自定义设备' ? 'bg-blue-50/70 text-blue-600 border-blue-600 font-semibold' : 'text-gray-600 border-transparent hover:bg-gray-50'}`}
                  >
                    自定义设备
                  </div>
                </div>
              )}
            </div>

            {/* System Menu Group */}
            <div className="pt-2">
              <div 
                onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
                className="px-4 py-2.5 flex items-center gap-3 text-gray-700 hover:bg-gray-50 cursor-pointer font-medium transition-colors select-none"
              >
                <Settings size={17} className="text-gray-400" /> 
                <span>系统</span>
                <ChevronDown size={14} className={`ml-auto text-gray-400 transition-transform duration-200 ${isSystemMenuOpen ? 'rotate-0' : '-rotate-90'}`} />
              </div>
              {isSystemMenuOpen && (
                <div className="space-y-0.5 mt-0.5">
                  <div 
                    onClick={() => setActiveMenu('用户应用管理')}
                    className={`px-12 py-2 text-sm cursor-pointer font-medium transition-colors border-r-2 flex items-center justify-between ${activeMenu === '用户应用管理' ? 'bg-blue-50/70 text-blue-600 border-blue-600 font-semibold' : 'text-gray-600 border-transparent hover:bg-gray-50'}`}
                  >
                    <span>用户应用管理</span>
                  </div>
                  <div 
                    onClick={() => setActiveMenu('用户自定义设备')}
                    className={`px-12 py-2 text-sm cursor-pointer font-medium transition-colors border-r-2 flex items-center justify-between ${activeMenu === '用户自定义设备' ? 'bg-blue-50/70 text-blue-600 border-blue-600 font-semibold' : 'text-gray-600 border-transparent hover:bg-gray-50'}`}
                  >
                    <span>用户自定义设备</span>
                  </div>
                  <div 
                    onClick={() => setActiveMenu('系统仿真设备')}
                    className={`px-12 py-2 text-sm cursor-pointer font-medium transition-colors border-r-2 flex items-center justify-between ${activeMenu === '系统仿真设备' ? 'bg-blue-50/70 text-blue-600 border-blue-600 font-semibold' : 'text-gray-600 border-transparent hover:bg-gray-50'}`}
                  >
                    <span>系统仿真设备</span>
                  </div>
                  <div 
                    onClick={() => setActiveMenu('设备素材管理')}
                    className={`px-12 py-2 text-sm cursor-pointer font-medium transition-colors border-r-2 flex items-center justify-between ${activeMenu === '设备素材管理' ? 'bg-blue-50/70 text-blue-600 border-blue-600 font-semibold' : 'text-gray-600 border-transparent hover:bg-gray-50'}`}
                  >
                    <span>设备素材管理</span>
                  </div>
                  <div 
                    onClick={() => setActiveMenu('标签资源管理')}
                    className={`px-12 py-2 text-sm cursor-pointer font-medium transition-colors border-r-2 flex items-center justify-between ${activeMenu === '标签资源管理' ? 'bg-blue-50/70 text-blue-600 border-blue-600 font-semibold' : 'text-gray-600 border-transparent hover:bg-gray-50'}`}
                  >
                    <span>标签资源管理</span>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        {activeMenu === '用户应用管理' ? (
          <UserAppManager />
        ) : activeMenu === '用户自定义设备' ? (
          <UserCustomDeviceManager />
        ) : activeMenu === '系统仿真设备' ? (
          <SystemSimDeviceManager />
        ) : activeMenu === '设备素材管理' ? (
          <DeviceMaterialManager createModalTrigger={createMaterialTrigger} />
        ) : activeMenu === '标签资源管理' ? (
          <TagResourceManager />
        ) : (
          <main className="flex-1 flex flex-col bg-[#f0f2f5] overflow-y-auto">
            <div className="p-6 pb-2 flex-grow">
              <div className="flex justify-between items-center mb-6">
                 <div className="relative" ref={addMenuRef}>
                   <button 
                     onClick={() => {
                       if (activeMenu === '自定义设备') {
                         setIsAddMenuOpen(!isAddMenuOpen);
                       } else {
                         alert('新增应用功能正在建设中...');
                       }
                     }}
                     className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded text-sm flex items-center gap-1 shadow-sm transition-colors font-medium"
                   >
                     <span className="text-lg leading-none mb-0.5">+</span> 新增
                     {activeMenu === '自定义设备' && (
                       <ChevronDown size={14} className={`ml-1 transition-transform duration-200 ${isAddMenuOpen ? 'rotate-180' : ''}`} />
                     )}
                   </button>
                   
                   {isAddMenuOpen && activeMenu === '自定义设备' && (
                     <div className="absolute top-[calc(100%+8px)] left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden py-1">
                       <button 
                         onClick={() => {
                           setIsAddMenuOpen(false);
                           setIsAddDeviceModalOpen(true);
                         }}
                         className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors border-b border-gray-50 text-left font-medium"
                       >
                         <Settings size={16} className="text-gray-400" />
                         自定义生成
                       </button>
                       <button 
                         onClick={() => {
                           setIsAddMenuOpen(false);
                           window.dispatchEvent(new CustomEvent('open-agent-creation'));
                         }}
                         className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-purple-700 hover:bg-purple-50 transition-colors text-left font-medium group"
                       >
                         <Sparkles size={16} className="text-purple-400 group-hover:text-purple-600" />
                         AI生成
                       </button>
                     </div>
                   )}
                 </div>

                 <div className="flex items-center gap-3 flex-wrap">
                    {/* Filter Selects for Custom Devices */}
                    {activeMenu === '自定义设备' && (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-gray-600 font-medium whitespace-nowrap">设备类型:</span>
                          <select
                            value={selectedDeviceType}
                            onChange={(e) => setSelectedDeviceType(e.target.value)}
                            className="bg-white border border-gray-200 rounded px-2.5 py-1.5 text-sm text-gray-700 outline-none hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer shadow-2xs"
                          >
                            <option value="all">全部类型</option>
                            <option value="传感器">传感器</option>
                            <option value="执行器">执行器</option>
                            <option value="网关">网关</option>
                            <option value="继电器">继电器</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-gray-600 font-medium whitespace-nowrap">设备协议:</span>
                          <select
                            value={selectedDeviceProtocol}
                            onChange={(e) => setSelectedDeviceProtocol(e.target.value)}
                            className="bg-white border border-gray-200 rounded px-2.5 py-1.5 text-sm text-gray-700 outline-none hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer shadow-2xs"
                          >
                            <option value="all">全部协议</option>
                            <option value="Modbus">Modbus (RTU/TCP)</option>
                            <option value="Zigbee">Zigbee</option>
                            <option value="MQTT">MQTT</option>
                            <option value="Lora">Lora</option>
                            <option value="模拟量">模拟量</option>
                            <option value="其他">其他</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-gray-600 font-medium whitespace-nowrap">发布状态:</span>
                          <select
                            value={selectedPublishStatus}
                            onChange={(e) => setSelectedPublishStatus(e.target.value)}
                            className="bg-white border border-gray-200 rounded px-2.5 py-1.5 text-sm text-gray-700 outline-none hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer shadow-2xs"
                          >
                            <option value="all">全部状态</option>
                            <option value="published">已发布 (公共仿真大厅)</option>
                            <option value="unpublished">未发布 (仅私有)</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-gray-600 font-medium whitespace-nowrap">{activeMenu === '全部应用' ? '应用名称:' : '设备名称:'}</span>
                      <div className="flex items-center bg-white border border-gray-200 rounded px-3 py-1.5 w-[200px] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-shadow">
                        <input 
                          className="bg-transparent w-full outline-none text-sm placeholder:text-gray-400" 
                          placeholder={activeMenu === '全部应用' ? '请输入应用名称搜索' : '请输入设备名称搜索'}
                          value={searchKeyword}
                          onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                        <Search size={16} className="text-blue-500 cursor-pointer hover:opacity-80"/>
                      </div>
                    </div>

                    {/* Reset Filters button */}
                    {activeMenu === '自定义设备' && hasCustomDeviceFilter && (
                      <button
                        onClick={() => {
                          setSelectedDeviceType('all');
                          setSelectedDeviceProtocol('all');
                          setSelectedPublishStatus('all');
                          setSearchKeyword('');
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-blue-600 bg-white hover:bg-gray-50 rounded border border-gray-200 transition-colors font-medium cursor-pointer shadow-2xs"
                        title="重置所有筛选条件"
                      >
                        <RotateCcw size={12} />
                        <span>重置</span>
                      </button>
                    )}

                    {/* View Mode Toggle for Custom Devices */}
                    {activeMenu === '自定义设备' && (
                      <div className="flex items-center bg-gray-200/80 p-0.5 rounded-lg border border-gray-200 ml-1">
                        <button
                          onClick={() => setCustomDeviceViewMode('grid')}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                            customDeviceViewMode === 'grid'
                              ? 'bg-white text-blue-600 shadow-xs font-bold'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                          title="方块视图 (卡片)"
                        >
                          <LayoutGrid size={14} />
                          <span>方块</span>
                        </button>
                        <button
                          onClick={() => setCustomDeviceViewMode('table')}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                            customDeviceViewMode === 'table'
                              ? 'bg-white text-blue-600 shadow-xs font-bold'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                          title="列表视图 (表格)"
                        >
                          <List size={14} />
                          <span>列表</span>
                        </button>
                      </div>
                    )}
                  </div>
              </div>

              {/* Grid or List based on menu */}
              {activeMenu === '全部应用' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {filteredProjects.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-lg border border-gray-200">
                      未找到符合条件的应用
                    </div>
                  ) : (
                    filteredProjects.map(p => (
                    <div key={p.id} className="bg-white rounded-lg border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-visible flex flex-col group relative">
                      
                      {/* Thumbnail area */}
                      <Link to="/design" className="h-44 relative p-0 flex items-center justify-center border-b border-gray-100 overflow-hidden rounded-t-lg bg-gray-100 block cursor-pointer group/thumb">
                         <span className="absolute top-2.5 left-2.5 bg-blue-600/90 backdrop-blur-xs text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full z-10 shadow-xs">{p.tag}</span>
                         
                         <img 
                           src={p.image} 
                           alt={p.name} 
                           className="w-full h-full object-cover group-hover/thumb:scale-108 group-hover:scale-105 transition-transform duration-500" 
                           referrerPolicy="no-referrer"
                           onError={(e) => {
                             e.currentTarget.style.display = 'none';
                             if (e.currentTarget.nextElementSibling) {
                               (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                             }
                           }}
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <div className="hidden absolute inset-0 items-center justify-center bg-gray-50 text-gray-400">
                           <Box size={32} />
                         </div>
                      </Link>

                      {/* Card Info */}
                      <div className="p-4 flex flex-col gap-2">
                        <Link to="/design" className="font-bold text-gray-800 text-[15px] truncate hover:text-blue-600 transition-colors cursor-pointer">{p.name}</Link>
                        <div className="text-[11px] text-gray-400 font-mono">{p.date}</div>
                        
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                          <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            {p.status}
                          </div>
                          <div className="flex items-center gap-3.5 text-gray-400">
                            <Pen size={14} className="cursor-pointer hover:text-blue-500 transition-colors" />
                            <div className="relative group/menu">
                              <MoreHorizontal size={14} className="cursor-pointer hover:text-blue-500 transition-colors" />
                              
                              {/* Popover Menu */}
                              <div className="absolute right-0 top-full mt-1 w-24 bg-white border border-gray-200 rounded shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden">
                                <div className="py-1">
                                  <Link to="/design" className="px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 cursor-pointer flex items-center gap-2 block w-full text-left">编辑</Link>
                                  <div className="px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center gap-2">预览</div>
                                  <div className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 cursor-pointer flex items-center gap-2">删除</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              ) : customDeviceViewMode === 'grid' ? (
                /* Custom Devices - Grid / Blocks View */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
                  {filteredCustomDevices.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center gap-2">
                      <div>{hasCustomDeviceFilter ? '未找到符合筛选条件的自定义设备' : '暂无自定义设备，点击左上角「+ 新增」创建'}</div>
                      {hasCustomDeviceFilter && (
                        <button
                          onClick={() => {
                            setSelectedDeviceType('all');
                            setSelectedDeviceProtocol('all');
                            setSearchKeyword('');
                          }}
                          className="text-xs text-blue-600 hover:underline mt-1 font-medium cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw size={12} />
                          <span>清除所有筛选条件</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredCustomDevices.map(device => (
                      <div 
                        key={device.id}
                        className="bg-white rounded-xl border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 overflow-hidden flex flex-col group relative"
                      >
                        {/* Thumbnail / Image Area */}
                        <div 
                          onClick={() => handleOpenDeviceDetail(device)}
                          className="h-40 bg-gradient-to-b from-gray-50 to-white relative p-4 flex items-center justify-center border-b border-gray-100 overflow-hidden cursor-pointer group/img"
                          title="点击查看大图与详情"
                        >
                          <span className="absolute top-2.5 left-2.5 bg-blue-50 text-blue-600 border border-blue-200/80 backdrop-blur-xs text-[10px] font-bold px-2 py-0.5 rounded-md z-10 shadow-2xs">
                            {device.type}
                          </span>
                          
                          <span className="absolute top-2.5 right-2.5 bg-purple-50 text-purple-600 border border-purple-200/80 backdrop-blur-xs text-[10px] font-medium px-2 py-0.5 rounded-md z-10 shadow-2xs">
                            {device.protocol}
                          </span>

                          <img 
                            src={getDeviceImageUrl(device.id, device.image)} 
                            alt={device.name} 
                            className="w-full h-full object-contain group-hover/img:scale-108 transition-transform duration-300 pointer-events-none"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                              }
                            }}
                          />
                          <Box size={32} className="text-gray-300 hidden" />

                          {/* Hover Layer */}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenDeviceDetail(device); }}
                              className="w-8 h-8 rounded-full bg-white/90 text-gray-700 hover:text-blue-600 hover:bg-white flex items-center justify-center shadow-md transition-transform hover:scale-110"
                              title="预览详情"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenEditDevice(device); }}
                              className="w-8 h-8 rounded-full bg-white/90 text-gray-700 hover:text-blue-600 hover:bg-white flex items-center justify-center shadow-md transition-transform hover:scale-110"
                              title="编辑设备"
                            >
                              <Pen size={13} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); openCopyDeviceModal(device); }}
                              className="w-8 h-8 rounded-full bg-white/90 text-gray-700 hover:text-blue-600 hover:bg-white flex items-center justify-center shadow-md transition-transform hover:scale-110"
                              title="复制设备"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteDevice(device.id, device.name); }}
                              className="w-8 h-8 rounded-full bg-white/90 text-gray-700 hover:text-red-600 hover:bg-white flex items-center justify-center shadow-md transition-transform hover:scale-110"
                              title="删除设备"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <div>
                            <div 
                              onClick={() => handleOpenDeviceDetail(device)}
                              className="font-bold text-gray-800 text-[14px] truncate hover:text-blue-600 cursor-pointer transition-colors"
                              title={device.name}
                            >
                              {device.name}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center justify-between">
                              <span>ID: {device.id}</span>
                              {device.power && <span className="text-gray-500 font-sans">{device.power}</span>}
                            </div>

                            {/* Publish Status Badge & Toggle */}
                            <div className="mt-2 flex items-center justify-between">
                              <button
                                onClick={(e) => handleTogglePublish(device.id, e)}
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
                                  device.publishToSimulation 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                    : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                                }`}
                                title={device.publishToSimulation ? "当前已发布至公共仿真大厅（点击可切换为私有）" : "当前仅控制台私有（点击可发布至公共仿真大厅）"}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${device.publishToSimulation ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                <span>{device.publishToSimulation ? '已发布至仿真大厅' : '未发布 (私有)'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Footer Actions & Date */}
                          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 font-mono">{device.date?.substring(0, 10)}</span>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEditDevice(device)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => openCopyDeviceModal(device)}
                                className="text-xs text-gray-600 hover:text-blue-600 cursor-pointer"
                              >
                                复制
                              </button>
                              <button
                                onClick={() => handleDeleteDevice(device.id, device.name)}
                                className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Custom Devices - List / Table View */
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 text-xs">
                      <tr>
                        <th className="px-6 py-3 font-medium w-24">封面图</th>
                        <th className="px-6 py-3 font-medium">设备名称</th>
                        <th className="px-6 py-3 font-medium">设备类型</th>
                        <th className="px-6 py-3 font-medium">通讯协议</th>
                        <th className="px-6 py-3 font-medium">供电参数</th>
                        <th className="px-6 py-3 font-medium">发布状态</th>
                        <th className="px-6 py-3 font-medium">创建时间</th>
                        <th className="px-6 py-3 font-medium text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomDevices.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <div>{hasCustomDeviceFilter ? '未找到符合筛选条件的自定义设备' : '暂无自定义设备，点击右上角「+」快速创建'}</div>
                              {hasCustomDeviceFilter && (
                                <button
                                  onClick={() => {
                                    setSelectedDeviceType('all');
                                    setSelectedDeviceProtocol('all');
                                    setSelectedPublishStatus('all');
                                    setSearchKeyword('');
                                  }}
                                  className="text-xs text-blue-600 hover:underline mt-1 font-medium cursor-pointer flex items-center gap-1"
                                >
                                  <RotateCcw size={12} />
                                  <span>清除所有筛选条件</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredCustomDevices.map(device => (
                          <tr key={device.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-3">
                              <div 
                                onClick={() => handleOpenDeviceDetail(device)}
                                className="w-12 h-12 rounded bg-gray-50 overflow-hidden border border-gray-200 flex items-center justify-center p-1 cursor-pointer hover:border-blue-300 transition-colors"
                                title="点击查看大图与详情"
                              >
                                <img 
                                  src={getDeviceImageUrl(device.id, device.image)} 
                                  alt={device.name} 
                                  className="w-full h-full object-contain" 
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    if (e.currentTarget.nextElementSibling) {
                                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                                    }
                                  }}
                                />
                                <Box size={24} className="text-gray-400 hidden" />
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div 
                                onClick={() => handleOpenDeviceDetail(device)}
                                className="font-bold text-gray-800 hover:text-blue-600 cursor-pointer transition-colors text-xs"
                              >
                                {device.name}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">{device.id}</div>
                            </td>
                            <td className="px-6 py-3">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs border border-blue-100 font-medium">{device.type}</span>
                            </td>
                            <td className="px-6 py-3">
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs border border-purple-100 font-medium">{device.protocol}</span>
                            </td>
                            <td className="px-6 py-3 text-xs text-gray-500 font-sans">{device.power || '-'}</td>
                            <td className="px-6 py-3">
                              <button
                                onClick={(e) => handleTogglePublish(device.id, e)}
                                className={`text-[11px] font-medium px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
                                  device.publishToSimulation 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-2xs' 
                                    : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                                }`}
                                title={device.publishToSimulation ? "已发布至公共仿真大厅（点击可切换为私有）" : "未发布，仅个人私有（点击可发布至公共仿真大厅）"}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${device.publishToSimulation ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                <span>{device.publishToSimulation ? '已发布至仿真大厅' : '未发布 (私有)'}</span>
                              </button>
                            </td>
                            <td className="px-6 py-3 text-gray-500 font-mono text-xs">{device.date}</td>
                            <td className="px-6 py-3 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <span 
                                  onClick={() => handleOpenDeviceDetail(device)}
                                  className="text-gray-500 hover:text-blue-600 hover:underline cursor-pointer text-xs font-medium"
                                >
                                  查看
                                </span>
                                <span 
                                  onClick={() => handleOpenEditDevice(device)}
                                  className="text-[#00a0e9] hover:text-blue-700 hover:underline cursor-pointer text-xs font-medium"
                                >
                                  编辑
                                </span>
                                <span 
                                  onClick={() => openCopyDeviceModal(device)}
                                  className="text-gray-600 hover:text-blue-700 hover:underline cursor-pointer text-xs font-medium"
                                >
                                  复制
                                </span>
                                <span 
                                  onClick={() => handleDeleteDevice(device.id, device.name)}
                                  className="text-red-500 hover:text-red-700 hover:underline cursor-pointer text-xs font-medium"
                                >
                                  删除
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Pagination */}
            <div className="p-4 bg-white border-t border-gray-200 flex justify-end items-center text-sm text-gray-500 gap-4 shrink-0">
              <span>共 {activeMenu === '自定义设备' ? filteredCustomDevices.length : filteredProjects.length} 条</span>
              <select className="border border-gray-200 rounded px-2 py-1 outline-none text-gray-600 hover:border-gray-400 transition-colors cursor-pointer focus:ring-1 focus:ring-blue-500">
                <option>10条/页</option>
                <option>20条/页</option>
              </select>
              <div className="flex gap-1">
                 <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded bg-gray-50 text-gray-400 cursor-not-allowed">{'<'}</button>
                 <button className="w-8 h-8 flex items-center justify-center border border-blue-500 rounded bg-blue-500 text-white font-medium">1</button>
                 <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded bg-white hover:bg-gray-50 transition-colors cursor-pointer text-gray-600">{'>'}</button>
              </div>
              <div className="flex items-center gap-2">
                前往 <input className="w-12 border border-gray-200 rounded px-1 py-1 text-center outline-none focus:border-blue-500 transition-colors" defaultValue={1} /> 页
              </div>
            </div>

          </main>
        )}
      </div>

      {/* Copy Custom Device Modal */}
      {isCopyDeviceModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[420px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Copy size={18} className="text-blue-500" />
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
                  <div className="text-xs text-gray-500 mt-0.5">{deviceToCopy?.type} · {deviceToCopy?.protocol}</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">新设备名称</label>
                <input 
                  type="text" 
                  value={copyDeviceName}
                  onChange={(e) => setCopyDeviceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  placeholder="请输入设备名称"
                  autoFocus
                />
                <p className="text-[11px] text-gray-400 mt-1.5">复制后将生成独立的自定义设备，并保存在您的控制台列表中。</p>
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
                className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 shadow-xs transition-colors"
              >
                确认复制
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Detail & High-Res Image Modal (With Protocol Specifications Tab) */}
      {selectedDeviceDetail && (() => {
        const protocolInfo = getDeviceProtocolInfo(selectedDeviceDetail);
        const hasProtocolTab = protocolInfo.protocolCategory === 'modbus' || protocolInfo.protocolCategory === 'analog';

        return (
          <div className="fixed inset-0 bg-black/65 z-[9999] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95 duration-200">
              {/* Modal Header with Tabs */}
              <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center bg-gray-50/90 gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-base shadow-2xs">
                    {String(selectedDeviceDetail.name || '').slice(0, 1) || '设'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-lg tracking-tight">{selectedDeviceDetail.name}</h3>
                      <span className="bg-purple-50 text-purple-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-purple-200">
                        自定义设备
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                        {selectedDeviceDetail.protocol || '标准协议'}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        selectedDeviceDetail.publishToSimulation 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedDeviceDetail.publishToSimulation ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                        {selectedDeviceDetail.publishToSimulation ? '已发布至公共仿真大厅' : '未发布 (私有)'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                      <span>ID: {selectedDeviceDetail.id}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Tabs for Protocol devices */}
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
                    onClick={() => setSelectedDeviceDetail(null)} 
                    className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
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
                      {/* Left: Device Image Box & Primary Actions */}
                      <div className="lg:col-span-4 flex flex-col gap-3">
                        <div className="bg-gradient-to-b from-purple-50/60 to-indigo-50/40 border-purple-100 rounded-xl p-5 border flex flex-col items-center justify-center relative min-h-[220px] group shadow-inner">
                          <img 
                            src={getDeviceImageUrl(selectedDeviceDetail.id, selectedDeviceDetail.image)} 
                            alt={selectedDeviceDetail.name} 
                            className="max-h-48 max-w-full object-contain mix-blend-multiply drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute bottom-2 right-2 text-[10px] text-gray-500 bg-white/90 px-2 py-0.5 rounded border border-gray-200 shadow-2xs font-medium">
                            自定义物料贴图
                          </span>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => {
                              const dev = selectedDeviceDetail;
                              setSelectedDeviceDetail(null);
                              openCopyDeviceModal(dev);
                            }}
                            className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                          >
                            <Copy size={14} /> 复制此自定义设备
                          </button>
                        </div>
                      </div>

                      {/* Right: Specs & Hardware Attributes */}
                      <div className="lg:col-span-8 flex flex-col gap-4">
                        {/* Attributes Grid */}
                        <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="flex justify-between py-1.5 px-2.5 bg-white rounded-lg border border-gray-100 shadow-2xs">
                            <span className="text-gray-400 font-medium">设备分类</span>
                            <span className="text-gray-800 font-semibold truncate max-w-[150px]">自定义设备库</span>
                          </div>
                          <div className="flex justify-between py-1.5 px-2.5 bg-white rounded-lg border border-gray-100 shadow-2xs">
                            <span className="text-gray-400 font-medium">设备类型</span>
                            <span className="bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded border border-blue-100">{selectedDeviceDetail.type || '传感器'}</span>
                          </div>
                          <div className="flex justify-between py-1.5 px-2.5 bg-white rounded-lg border border-gray-100 shadow-2xs">
                            <span className="text-gray-400 font-medium">通讯协议</span>
                            <span className="bg-emerald-50 text-emerald-600 font-medium px-2 py-0.5 rounded border border-emerald-100">{selectedDeviceDetail.protocol || '标准协议'}</span>
                          </div>
                          <div className="flex justify-between py-1.5 px-2.5 bg-white rounded-lg border border-gray-100 shadow-2xs">
                            <span className="text-gray-400 font-medium">供电规格</span>
                            <span className="text-gray-800 font-mono">{selectedDeviceDetail.power || 'DC 12V / 24V 工业级'}</span>
                          </div>
                          <div className="flex justify-between py-1.5 px-2.5 bg-white rounded-lg border border-gray-100 shadow-2xs">
                            <span className="text-gray-400 font-medium">发布状态</span>
                            <span className={`font-semibold px-2 py-0.5 rounded border text-[11px] ${
                              selectedDeviceDetail.publishToSimulation 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                              {selectedDeviceDetail.publishToSimulation ? '已公开在公共仿真设备库' : '仅控制台私有'}
                            </span>
                          </div>
                          {selectedDeviceDetail.date && (
                            <div className="flex justify-between py-1.5 px-2.5 bg-white rounded-lg border border-gray-100 shadow-2xs">
                              <span className="text-gray-400 font-medium">创建时间</span>
                              <span className="text-gray-600 font-mono">{selectedDeviceDetail.date}</span>
                            </div>
                          )}
                        </div>

                        {/* Wiring / Pin Interface Reference */}
                        <div className="bg-blue-50/40 rounded-xl p-3.5 border border-blue-100/80">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900 mb-2">
                            <Zap size={14} className="text-blue-500" />
                            电气引脚定义
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
                                    {copiedHex === cmd.requestHex ? (
                                      <span className="text-emerald-600 flex items-center gap-1 font-semibold"><Check size={13} /> 已复制</span>
                                    ) : (
                                      <span className="flex items-center gap-1"><Copy size={13} /> 复制</span>
                                    )}
                                  </button>
                                </div>

                                {/* Request Frame Box */}
                                <div className="bg-slate-900 rounded-xl p-3.5 text-slate-100 font-mono flex flex-col gap-2 shadow-inner">
                                  <div className="text-[11px] text-slate-400 flex justify-between items-center border-b border-slate-800 pb-1">
                                    <span>请求 (Request)</span>
                                    <span className="text-slate-500">HEX</span>
                                  </div>
                                  <div className="text-sm tracking-wider font-bold text-cyan-400">
                                    {cmd.requestHex}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {cmd.requestExplain.map((exp, i) => (
                                      <span key={i} className="text-[10px] bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                                        <span className="font-bold text-cyan-300">{exp.part}:</span> {exp.meaning}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Response Frame Box */}
                                <div className="bg-slate-900 rounded-xl p-3.5 text-slate-100 font-mono flex flex-col gap-2 shadow-inner">
                                  <div className="text-[11px] text-slate-400 flex justify-between items-center border-b border-slate-800 pb-1">
                                    <span>响应 (Response)</span>
                                    <span className="text-slate-500">HEX</span>
                                  </div>
                                  <div className="text-sm tracking-wider font-bold text-emerald-400">
                                    {cmd.responseHex}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {cmd.responseExplain.map((exp, i) => (
                                      <span key={i} className="text-[10px] bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                                        <span className="font-bold text-emerald-300">{exp.part}:</span> {exp.meaning}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Result Summary */}
                                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-lg p-2.5 text-emerald-800 text-xs flex items-center gap-2">
                                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                  <span>{cmd.resultSummary}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-view: Analog Protocol */}
                    {protocolInfo.protocolCategory === 'analog' && protocolInfo.analogFormula && (
                      <div className="space-y-5">
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                              <Sliders size={16} className="text-amber-500" />
                              <span className="font-bold text-sm text-gray-800">换算公式与实例</span>
                            </div>
                            <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-0.5 rounded border border-amber-200">
                              {protocolInfo.analogFormula.signalType}
                            </span>
                          </div>

                          {/* Formula Math Card */}
                          <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/40 rounded-xl p-4 border border-amber-200/80 flex flex-col gap-2">
                            <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                              <Code size={14} /> 换算公式
                            </span>
                            <div className="bg-white/90 rounded-lg p-3 font-mono text-sm font-bold text-amber-900 border border-amber-200 shadow-2xs">
                              {protocolInfo.analogFormula.formulaLatex}
                            </div>
                          </div>

                          {/* Calculation Example Breakdown */}
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/80 flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                                <HelpCircle size={14} className="text-blue-500" />
                                计算示例
                              </span>
                              <span className="font-mono text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">
                                采样值: {protocolInfo.analogFormula.calculationExample.inputValue}
                              </span>
                            </div>

                            <div className="space-y-1.5 pl-2 border-l-2 border-blue-400 text-xs text-gray-700">
                              {protocolInfo.analogFormula.calculationExample.steps.map((step, idx) => (
                                <div key={idx} className="font-mono text-[11px] text-gray-600">{step}</div>
                              ))}
                            </div>

                            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-semibold mt-1">
                              <span>换算结果：</span>
                              <span className="font-bold text-emerald-700 font-mono text-sm">
                                {protocolInfo.analogFormula.calculationExample.result}
                              </span>
                            </div>
                          </div>

                          {/* ADC Relation Box */}
                          <div className="bg-slate-900 rounded-xl p-3 text-slate-200 font-mono text-xs flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Terminal size={14} className="text-cyan-400" />
                              <span className="text-slate-300">ADC 采样:</span>
                            </div>
                            <span className="text-cyan-300 text-[11px]">{protocolInfo.analogFormula.adcRelation}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Device Modal */}
      <AddCustomDeviceModal 
        isOpen={isAddDeviceModalOpen} 
        onClose={() => setIsAddDeviceModalOpen(false)} 
        onSave={(newDevice) => {
          const created = {
            ...newDevice,
            id: `custom_${Date.now()}`,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16)
          };
          setCustomDeviceList(prev => [created, ...prev]);
        }}
      />

      {/* Edit Device Modal */}
      <AddCustomDeviceModal
        isOpen={isEditDeviceModalOpen}
        onClose={() => {
          setIsEditDeviceModalOpen(false);
          setEditingDevice(null);
        }}
        initialData={editingDevice}
        onSave={handleSaveEditDevice}
      />
    </div>
  );
}
