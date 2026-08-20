import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AddCustomDeviceModal from "../components/AddCustomDeviceModal";
import DeviceMaterialManager from "../components/DeviceMaterialManager";
import { LayoutGrid, Settings, Search, MoreHorizontal, Pen, ChevronDown, ChevronRight, UserCircle2, Box, X, UploadCloud, Check, Sparkles, Copy, Eye, Plus, Layers, Image as ImageIcon } from 'lucide-react';
import { getDeviceImageUrl } from '../utils/deviceImages';

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
  { id: 'custom_1', name: '自定义温湿度传感器', image: '/device/RS485_Humiture_Thumbnail.png', type: '传感器', protocol: 'Modbus RTU', date: '2026-08-12 10:00', power: 'DC 12V / 24V' },
  { id: 'custom_2', name: '智能灌溉阀门', image: '/device/RS485_WaterPump_Thumbnail.png', type: '执行器', protocol: 'Zigbee', date: '2026-08-11 14:30', power: 'AC 220V' },
  { id: 'custom_3', name: '边缘计算网关V2', image: '/device/UsrG771Gateway_Thumbnail.png', type: '网关', protocol: 'MQTT', date: '2026-08-10 09:15', power: 'DC 12V' },
  { id: 'custom_4', name: '复合传感器模块A', image: '/device/NewLabCommon_Thumbnail.png', type: '传感器', protocol: 'Lora', date: '2026-07-25 11:20', power: 'DC 5V' },
  { id: 'custom_5', name: '大功率工业继电器', image: '/device/Relay_DINRailCircuitBreaker1P_Thumbnail.png', type: '继电器', protocol: 'Modbus TCP', date: '2026-07-18 16:40', power: 'AC 380V' },
];

export default function ConsolePage() {
  const [activeMenu, setActiveMenu] = useState('全部应用');
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(true);
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(true);
  const [createMaterialTrigger, setCreateMaterialTrigger] = useState(0);
  const navigate = useNavigate();

  const [customDeviceList, setCustomDeviceList] = useState(initialCustomDevices);
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Edit Device Modal State
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [isEditDeviceModalOpen, setIsEditDeviceModalOpen] = useState(false);

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
            power: savedData.powerType === '交流' ? (savedData.acVoltage || 'AC 220V') : (savedData.dcVoltage || 'DC 12V')
          };
        }
        return d;
      }));
    }
  };

  // Copy Device Modal State
  const [isCopyDeviceModalOpen, setIsCopyDeviceModalOpen] = useState(false);
  const [deviceToCopy, setDeviceToCopy] = useState<any>(null);
  const [copyDeviceName, setCopyDeviceName] = useState('');

  // Device Detail Modal State
  const [selectedDeviceDetail, setSelectedDeviceDetail] = useState<any>(null);

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

  return (
    <div className="h-screen bg-[#f0f2f5] flex flex-col font-sans overflow-hidden">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex justify-between items-center px-6 shrink-0 z-10 relative">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="虚拟仿真 by UUSIMA" className="h-10 object-contain" />
          </Link>
        </div>

        {/* Primary Navigation */}
        <nav className="flex items-center gap-12 absolute left-1/2 -translate-x-1/2 h-full">
          {['仿真设备', '仿真项目'].map(nav => (
            <button
              key={nav}
              onClick={() => handleNavClick(nav)}
              className="text-[15px] font-medium transition-colors h-full flex items-center border-b-2 relative top-[2px] text-gray-600 border-transparent hover:text-[#00a0e9]"
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
                    onClick={() => setActiveMenu('设备素材管理')}
                    className={`px-12 py-2 text-sm cursor-pointer font-medium transition-colors border-r-2 flex items-center justify-between ${activeMenu === '设备素材管理' ? 'bg-blue-50/70 text-blue-600 border-blue-600 font-semibold' : 'text-gray-600 border-transparent hover:bg-gray-50'}`}
                  >
                    <span>设备素材管理</span>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        {activeMenu === '设备素材管理' ? (
          <DeviceMaterialManager createModalTrigger={createMaterialTrigger} />
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
                 <div className="flex items-center gap-3">
                   <span className="text-sm text-gray-600 font-medium">{activeMenu === '全部应用' ? '应用名称:' : '设备名称:'}</span>
                   <div className="flex items-center bg-white border border-gray-200 rounded px-3 py-1.5 w-[280px] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-shadow">
                     <input className="bg-transparent w-full outline-none text-sm placeholder:text-gray-400" placeholder={activeMenu === '全部应用' ? '请输入应用名称搜索' : '请输入设备名称搜索'} />
                     <Search size={16} className="text-blue-500 cursor-pointer hover:opacity-80"/>
                   </div>
                 </div>
              </div>

              {/* Grid or List based on menu */}
              {activeMenu === '全部应用' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {projects.map(p => (
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
                ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                      <tr>
                        <th className="px-6 py-3 font-medium w-24">封面图</th>
                        <th className="px-6 py-3 font-medium">设备名称</th>
                        <th className="px-6 py-3 font-medium">设备类型</th>
                        <th className="px-6 py-3 font-medium">通讯协议</th>
                        <th className="px-6 py-3 font-medium">创建时间</th>
                        <th className="px-6 py-3 font-medium text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customDeviceList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                            暂无自定义设备，点击右上角「+」快速创建
                          </td>
                        </tr>
                      ) : (
                        customDeviceList.map(device => (
                          <tr key={device.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div 
                                onClick={() => setSelectedDeviceDetail(device)}
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
                            <td className="px-6 py-4">
                              <div 
                                onClick={() => setSelectedDeviceDetail(device)}
                                className="font-bold text-gray-800 hover:text-blue-600 cursor-pointer transition-colors"
                              >
                                {device.name}
                              </div>
                              <div className="text-xs text-gray-400 font-mono mt-0.5">{device.id}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs border border-blue-100 font-medium">{device.type}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs border border-purple-100 font-medium">{device.protocol}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">{device.date}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <span 
                                  onClick={() => handleOpenEditDevice(device)}
                                  className="text-[#00a0e9] hover:text-blue-700 hover:underline cursor-pointer text-xs font-medium"
                                >
                                  编辑
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
              <span>共 {activeMenu === '自定义设备' ? customDeviceList.length : projects.length} 条</span>
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

      {/* Device Detail Modal */}
      {selectedDeviceDetail && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col border border-gray-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                  {selectedDeviceDetail.name.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base">{selectedDeviceDetail.name}</h3>
                    <span className="bg-purple-50 text-purple-600 text-[10px] font-semibold px-2 py-0.5 rounded border border-purple-200">自定义设备</span>
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
              {/* Device Photo View */}
              <div className="bg-gradient-to-b from-purple-50/40 to-indigo-50/20 rounded-xl p-6 border border-purple-100 flex flex-col items-center justify-center relative min-h-[260px] group shadow-inner">
                <img 
                  src={getDeviceImageUrl(selectedDeviceDetail.id, selectedDeviceDetail.image)} 
                  alt={selectedDeviceDetail.name} 
                  className="max-h-56 max-w-full object-contain mix-blend-multiply drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-2 right-2 text-[10px] text-gray-400 bg-white/80 px-2 py-0.5 rounded border border-gray-200 shadow-2xs">
                  自定义物料贴图
                </span>
              </div>

              {/* Specs & Attributes */}
              <div className="flex flex-col gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-2.5 text-xs text-gray-600">
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-400 font-medium">设备分类</span>
                    <span className="text-gray-800 font-semibold">自定义设备</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-400 font-medium">设备类型</span>
                    <span className="bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded border border-blue-100">{selectedDeviceDetail.type || '传感器'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-400 font-medium">通讯协议</span>
                    <span className="bg-emerald-50 text-emerald-600 font-medium px-2 py-0.5 rounded border border-emerald-100">{selectedDeviceDetail.protocol || 'Modbus RTU'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-400 font-medium">供电规格</span>
                    <span className="text-gray-800 font-mono">{selectedDeviceDetail.power || 'DC 12V / 24V 工业级'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-400 font-medium">创建时间</span>
                    <span className="text-gray-600 font-mono">{selectedDeviceDetail.date}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button 
                    onClick={() => {
                      const dev = selectedDeviceDetail;
                      setSelectedDeviceDetail(null);
                      openCopyDeviceModal(dev);
                    }}
                    className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy size={15} /> 复制此设备
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
