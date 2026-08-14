import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AddCustomDeviceModal from "../components/AddCustomDeviceModal";
import { LayoutGrid, Settings, Search, MoreHorizontal, Pen, ChevronDown, UserCircle2, Box, X, UploadCloud, Check, Sparkles } from 'lucide-react';

const projects = [
  { id: 1, name: '智慧农业2D虚拟仿真', status: '已发布', date: '2025-10-10 22:14:56', tag: '智慧农业' },
  { id: 2, name: '智慧家居2D仿真', status: '已发布', date: '2025-10-10 23:40:28', tag: '智慧家居' },
  { id: 3, name: '家居2D仿真【娱乐影音】', status: '已发布', date: '2025-10-11 00:01:21', tag: '智慧家居' },
  { id: 4, name: '智慧安防2D仿真', status: '已发布', date: '2025-10-11 00:01:21', tag: '智慧安防' },
  { id: 5, name: '交通2D仿真【隧道】', status: '已发布', date: '2025-10-11 00:11:21', tag: '其他' },
];

const customDevices = [
  { id: 1, name: '自定义温湿度传感器', image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=100&h=100&fit=crop', type: '传感器', protocol: 'Modbus RTU', date: '2026-08-12 10:00' },
  { id: 2, name: '智能灌溉阀门', image: 'https://images.unsplash.com/photo-1635338167822-1bc6e6f1f4f4?w=100&h=100&fit=crop', type: '执行器', protocol: 'Zigbee', date: '2026-08-11 14:30' },
  { id: 3, name: '边缘计算网关V2', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=100&h=100&fit=crop', type: '网关', protocol: 'MQTT', date: '2026-08-10 09:15' },
];

export default function ConsolePage() {
  const [activeMenu, setActiveMenu] = useState('全部应用');
  const navigate = useNavigate();

  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

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
          <Link
            to="/"
            className="text-[15px] font-medium transition-colors h-full flex items-center border-b-2 relative top-[2px] text-gray-600 border-transparent hover:text-[#00a0e9]"
          >
            仿真设备
          </Link>
          <Link
            to="/projects"
            className="text-[15px] font-medium transition-colors h-full flex items-center border-b-2 relative top-[2px] text-gray-600 border-transparent hover:text-[#00a0e9]"
          >
            仿真项目
          </Link>
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
            <div className="px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-50 cursor-pointer font-medium transition-colors">
              <LayoutGrid size={18} className="text-gray-400" /> 
              应用
              <ChevronDown size={14} className="ml-auto" />
            </div>
            <div 
              onClick={() => setActiveMenu('全部应用')}
              className={`px-12 py-2.5 text-sm cursor-pointer font-medium transition-colors border-r-2 ${activeMenu === '全部应用' ? 'bg-blue-50/70 text-blue-600 border-blue-600' : 'text-gray-600 border-transparent hover:bg-gray-50'}`}
            >
              全部应用
            </div>
            <div 
              onClick={() => setActiveMenu('自定义设备')}
              className={`px-12 py-2.5 text-sm cursor-pointer font-medium transition-colors border-r-2 ${activeMenu === '自定义设备' ? 'bg-blue-50/70 text-blue-600 border-blue-600' : 'text-gray-600 border-transparent hover:bg-gray-50'}`}
            >
              自定义设备
            </div>
            <div className="px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-50 cursor-pointer font-medium transition-colors mt-2">
              <Settings size={18} className="text-gray-400" /> 
              系统
              <ChevronDown size={14} className="ml-auto text-gray-400" />
            </div>
          </nav>
        </aside>

        {/* Main Content */}
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
                  <div className="h-44 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:12px_12px] relative p-4 flex items-center justify-center border-b border-gray-100 overflow-hidden rounded-t-lg">
                     <span className="absolute top-0 left-0 bg-blue-500 text-white text-[10px] px-2.5 py-1 rounded-br-lg z-10 shadow-sm">{p.tag}</span>
                     
                     {/* Mock circuit design inside thumbnail */}
                     <div className="relative w-full h-full transform group-hover:scale-105 transition-transform duration-500">
                       <div className="absolute top-4 left-4 w-10 h-10 bg-white border border-gray-200 shadow-sm rounded flex items-center justify-center text-[8px] text-gray-500 font-medium">Sensor</div>
                       <div className="absolute top-16 left-24 w-14 h-8 bg-white border border-gray-200 shadow-sm rounded flex items-center justify-center text-[8px] text-gray-500 font-medium">Controller</div>
                       <div className="absolute top-6 right-6 w-12 h-12 bg-white border border-gray-200 shadow-sm rounded flex items-center justify-center text-[8px] text-gray-500 font-medium">Power</div>
                       <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
                         <path d="M 40 24 L 90 56" stroke="#ef4444" strokeWidth="1.5" fill="none"/>
                         <path d="M 140 56 L 200 40" stroke="#3b82f6" strokeWidth="1.5" fill="none"/>
                       </svg>
                     </div>
                  </div>

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
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                    <tr>
                      <th className="px-6 py-3 font-medium w-24">封面图</th>
                      <th className="px-6 py-3 font-medium">设备名称</th>
                      <th className="px-6 py-3 font-medium">设备类型</th>
                      <th className="px-6 py-3 font-medium">通讯协议</th>
                      <th className="px-6 py-3 font-medium">创建时间</th>
                      <th className="px-6 py-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customDevices.map(device => (
                      <tr key={device.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center">
                            {device.image ? <img src={device.image} alt="cover" className="w-full h-full object-cover" /> : <Box size={24} className="text-gray-400" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {device.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs border border-blue-100">{device.type}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs border border-purple-100">{device.protocol}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{device.date}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 text-blue-500">
                            <span className="cursor-pointer hover:text-blue-600 hover:underline">编辑</span>
                            <span className="cursor-pointer text-red-500 hover:text-red-600 hover:underline">删除</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          <div className="p-4 bg-white border-t border-gray-200 flex justify-end items-center text-sm text-gray-500 gap-4 shrink-0">
            <span>共 5 条</span>
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
      </div>

      {/* Add Device Modal */}
      <AddCustomDeviceModal isOpen={isAddDeviceModalOpen} onClose={() => setIsAddDeviceModalOpen(false)} />
    </div>
  );
}
