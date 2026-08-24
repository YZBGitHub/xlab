import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Copy, Play, Square, Eye, Clock, User, 
  X, Cpu
} from 'lucide-react';
import { getDeviceImageUrl } from '../utils/deviceImages';

// Mock detailed projects data
const MOCK_PROJECT_DETAILS: Record<number, any> = {
  1: {
    id: 1,
    name: '基于LoRa的智慧农场环境监控系统',
    category: '智慧农业',
    type: '系统应用',
    publisher: '杨**',
    time: '2025-10-10 22:14:56',
    views: 1250,
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=500&fit=crop',
    description: '本实验项目模拟大型现代农业大棚的物联网监控与自动控制系统。通过LoRa无线传感网络采集土壤温湿度、空气温湿度及光照强度，联动控制水泵滴灌电磁阀与大棚通风风机，实现精准农业自动化管理。',
    experimentObjective: '掌握LoRa自组网通信协议配置、Modbus传感器数据解析算法以及执行器联动闭环控制逻辑。',
    devices: [
      { id: 'UsrG771Gateway', name: '边缘计算无线网关', type: '网关', protocol: 'MQTT / LoRa', image: '/device/UsrG771Gateway_Thumbnail.png', count: 1, power: 'DC 12V' },
      { id: 'RS485_SoilHumiture', name: '土壤温湿度传感器', type: '传感器', protocol: 'Modbus RTU', image: '/device/RS485_SoilHumiture_Thumbnail.png', count: 2, power: 'DC 12V', unit: '%RH / ℃', initVal: '42.5 %RH' },
      { id: 'RS485_Illumination', name: '高精度光照变送器', type: '传感器', protocol: 'Modbus RTU', image: '/device/RS485_Illumination_Thumbnail.png', count: 1, power: 'DC 12V', unit: 'Lux', initVal: '15400 Lux' },
      { id: 'RS485_CO2', name: '二氧化碳传感器', type: '传感器', protocol: 'Modbus RTU', image: '/device/RS485_CO2_Thumbnail.png', count: 1, power: 'DC 12V', unit: 'ppm', initVal: '620 ppm' },
      { id: 'RS485_WaterPump', name: '智能灌溉水泵阀门', type: '执行器', protocol: '继电器控制', image: '/device/RS485_WaterPump_Thumbnail.png', count: 1, power: 'AC 220V', state: '已停止' },
      { id: 'RS485_Fan', name: '温室通风换气风扇', type: '执行器', protocol: '继电器控制', image: '/device/RS485_Fan_Thumbnail.png', count: 1, power: 'AC 220V', state: '运行中' },
      { id: 'Power_DINRailPowerAdapter', name: '工业导轨电源模块', type: '电源', protocol: '供电', image: '/device/Power_DINRailPowerAdapter_Thumbnail.png', count: 1, power: 'AC220V转DC12V' },
    ],
    topologyNodes: [
      { id: 'n_power', deviceId: 'Power_DINRailPowerAdapter', name: '导轨电源 12V', x: 60, y: 70, type: 'power', status: 'normal' },
      { id: 'n_gw', deviceId: 'UsrG771Gateway', name: '边缘LoRa网关', x: 260, y: 150, type: 'gateway', status: 'online' },
      { id: 'n_soil1', deviceId: 'RS485_SoilHumiture', name: '大棚A土壤传感器', x: 500, y: 70, type: 'sensor', key: 'soil', value: '42.5 %RH', status: 'active' },
      { id: 'n_light', deviceId: 'RS485_Illumination', name: '环境光照传感器', x: 500, y: 190, type: 'sensor', key: 'light', value: '15400 Lux', status: 'active' },
      { id: 'n_co2', deviceId: 'RS485_CO2', name: 'CO2气体传感器', x: 500, y: 310, type: 'sensor', key: 'co2', value: '620 ppm', status: 'active' },
      { id: 'n_pump', deviceId: 'RS485_WaterPump', name: '灌溉水泵阀门', x: 740, y: 110, type: 'actuator', key: 'pump', active: false, status: 'off' },
      { id: 'n_fan', deviceId: 'RS485_Fan', name: '大棚通风风扇', x: 740, y: 270, type: 'actuator', key: 'fan', active: true, status: 'on' },
    ],
    topologyLinks: [
      { from: 'n_power', to: 'n_gw', label: 'DC 12V 供电', type: 'power' },
      { from: 'n_gw', to: 'n_soil1', label: 'RS485 / LoRa', type: 'data' },
      { from: 'n_gw', to: 'n_light', label: 'RS485 / LoRa', type: 'data' },
      { from: 'n_gw', to: 'n_co2', label: 'RS485 / LoRa', type: 'data' },
      { from: 'n_gw', to: 'n_pump', label: '继电器控制总线', type: 'control' },
      { from: 'n_gw', to: 'n_fan', label: '继电器控制总线', type: 'control' },
    ]
  },
  2: {
    id: 2,
    name: '智能家居全屋控制中心',
    category: '智慧家居',
    type: '个人应用',
    publisher: '李**',
    time: '2025-10-09 14:20:12',
    views: 890,
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=500&fit=crop',
    description: '集成ZigBee温湿度传感、人体移动探测、智能门锁、智能插座与智能调光灯泡的全屋智能联动实验场景。',
    experimentObjective: '了解家庭网关的局域网组网拓扑，掌握ZigBee无线多设备联动场景联动策略与触发机制。',
    devices: [
      { id: 'ZigBee_Coordinator', name: 'ZigBee网络协调器', type: '网关', protocol: 'ZigBee 3.0', image: '/device/ZigBee_Coordinator_Thumbnail.png', count: 1, power: 'DC 5V' },
      { id: 'ZigBee_Humiture_AIoT', name: 'ZigBee温湿度计', type: '传感器', protocol: 'ZigBee', image: '/device/ZigBee_Humiture_AIoT_Thumbnail.png', count: 1, power: '电池供电', unit: '℃ / %RH', initVal: '24.6 ℃' },
      { id: 'ZigBee_HumanMovement_AIoT', name: '人体红外移动传感器', type: '传感器', protocol: 'ZigBee', image: '/device/ZigBee_HumanMovement_AIoT_Thumbnail.png', count: 1, power: '电池供电', unit: '状态', initVal: '有人' },
      { id: 'Smart_Door_Lock', name: '智能指纹门锁', type: '执行器', protocol: 'ZigBee / 蓝牙', image: '/device/Smart_Door_Lock_Thumbnail.png', count: 1, power: '电池供电', state: '已锁闭' },
      { id: 'ZigBee_RBGWLampBulb_AIoT', name: '智能RGBW调光灯', type: '执行器', protocol: 'ZigBee', image: '/device/ZigBee_RBGWLampBulb_AIoT_Thumbnail.png', count: 2, power: 'AC 220V', state: '已点亮' },
    ],
    topologyNodes: [
      { id: 'n_gw', deviceId: 'ZigBee_Coordinator', name: 'ZigBee主协调器', x: 180, y: 190, type: 'gateway', status: 'online' },
      { id: 'n_th', deviceId: 'ZigBee_Humiture_AIoT', name: '客厅温湿度计', x: 440, y: 90, type: 'sensor', key: 'temp', value: '24.6 ℃', status: 'active' },
      { id: 'n_pir', deviceId: 'ZigBee_HumanMovement_AIoT', name: '玄关人体感应', x: 440, y: 280, type: 'sensor', key: 'pir', value: '有人移动', status: 'active' },
      { id: 'n_lock', deviceId: 'Smart_Door_Lock', name: '入户智能门锁', x: 700, y: 110, type: 'actuator', key: 'lock', active: false, status: 'locked' },
      { id: 'n_lamp', deviceId: 'ZigBee_RBGWLampBulb_AIoT', name: '客厅智能主灯', x: 700, y: 270, type: 'actuator', key: 'lamp', active: true, status: 'on' },
    ],
    topologyLinks: [
      { from: 'n_gw', to: 'n_th', label: 'ZigBee 无线网络', type: 'data' },
      { from: 'n_gw', to: 'n_pir', label: 'ZigBee 无线网络', type: 'data' },
      { from: 'n_gw', to: 'n_lock', label: 'ZigBee 控制链路', type: 'control' },
      { from: 'n_gw', to: 'n_lamp', label: 'ZigBee 控制链路', type: 'control' },
    ]
  }
};

// Fallback project builder
const getProjectData = (id: number) => {
  if (MOCK_PROJECT_DETAILS[id]) return MOCK_PROJECT_DETAILS[id];
  return {
    id,
    name: `仿真实验工程项目 #${id}`,
    category: '智慧物联网',
    type: '系统应用',
    publisher: '管理员',
    time: '2025-10-10 12:00:00',
    views: 680,
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=500&fit=crop',
    description: '这是一个标准的物联网2D仿真实验工程，包含了完整的通信协议链路、传感器采集与执行器控制回路。',
    experimentObjective: '学习工业总线拓扑设计、设备参数建模与数据流转验证。',
    devices: [
      { id: 'UsrG771Gateway', name: '工业物联网网关', type: '网关', protocol: 'Modbus TCP', image: '/device/UsrG771Gateway_Thumbnail.png', count: 1, power: 'DC 12V' },
      { id: 'RS485_Humiture', name: 'RS485温湿度传感器', type: '传感器', protocol: 'Modbus RTU', image: '/device/RS485_Humiture_Thumbnail.png', count: 1, power: 'DC 12V', unit: '℃ / %RH', initVal: '25.2 ℃' },
      { id: 'Relay_DINRailCircuitBreaker1P', name: '智能导轨断路器', type: '继电器', protocol: 'Modbus RTU', image: '/device/Relay_DINRailCircuitBreaker1P_Thumbnail.png', count: 1, power: 'AC 220V', state: '已闭合' },
    ],
    topologyNodes: [
      { id: 'n_gw', deviceId: 'UsrG771Gateway', name: '工业网关', x: 200, y: 190, type: 'gateway', status: 'online' },
      { id: 'n_s1', deviceId: 'RS485_Humiture', name: '温湿度变送器', x: 480, y: 120, type: 'sensor', key: 'hum', value: '25.2 ℃', status: 'active' },
      { id: 'n_r1', deviceId: 'Relay_DINRailCircuitBreaker1P', name: '智能继电器', x: 480, y: 260, type: 'actuator', key: 'relay', active: true, status: 'on' },
    ],
    topologyLinks: [
      { from: 'n_gw', to: 'n_s1', label: 'RS485 总线', type: 'data' },
      { from: 'n_gw', to: 'n_r1', label: 'RS485 控制', type: 'control' },
    ]
  };
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id) || 1;
  const project = useMemo(() => getProjectData(projectId), [projectId]);

  // Simulation State
  const [isRunning, setIsRunning] = useState(false);
  const [actuators, setActuators] = useState<Record<string, boolean>>({
    pump: false,
    fan: true,
    lock: false,
    lamp: true,
    relay: true
  });
  const [sensorValues, setSensorValues] = useState<Record<string, string>>({
    soil: '42.5 %RH',
    light: '15400 Lux',
    co2: '620 ppm',
    temp: '24.6 ℃',
    pir: '有人移动',
    hum: '25.2 ℃'
  });

  // Copy Project Modal
  const [isCopyProjectModalOpen, setIsCopyProjectModalOpen] = useState(false);
  const [copyProjectName, setCopyProjectName] = useState('');

  // Copy Device Modal
  const [isCopyDeviceModalOpen, setIsCopyDeviceModalOpen] = useState(false);
  const [deviceToCopy, setDeviceToCopy] = useState<any>(null);
  const [copyDeviceName, setCopyDeviceName] = useState('');

  // Simulation Timer loop
  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        // Random slight fluctuation for sensor values
        setSensorValues(prev => ({
          ...prev,
          soil: `${(40 + Math.random() * 5).toFixed(1)} %RH`,
          light: `${Math.floor(15000 + Math.random() * 800)} Lux`,
          co2: `${Math.floor(610 + Math.random() * 30)} ppm`,
          temp: `${(24 + Math.random() * 1.5).toFixed(1)} ℃`,
          hum: `${(24.5 + Math.random() * 1.2).toFixed(1)} ℃`
        }));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const toggleActuator = (key: string) => {
    if (!isRunning) {
      alert('请先点击右上角【开启实验】按钮启动仿真运行！');
      return;
    }
    setActuators(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleOpenCopyProject = () => {
    setCopyProjectName(`${project.name} 副本`);
    setIsCopyProjectModalOpen(true);
  };

  const handleConfirmCopyProject = () => {
    if (!copyProjectName.trim()) {
      alert('请输入项目名称');
      return;
    }
    alert(`项目复制成功！"${copyProjectName}" 已添加至您的控制台个人空间。`);
    setIsCopyProjectModalOpen(false);
  };

  const handleOpenCopyDevice = (device: any) => {
    setDeviceToCopy(device);
    setCopyDeviceName(`${device.name} 副本`);
    setIsCopyDeviceModalOpen(true);
  };

  const handleConfirmCopyDevice = () => {
    if (!copyDeviceName.trim()) {
      alert('请输入设备名称');
      return;
    }
    alert(`自定义设备复制成功！"${copyDeviceName}" 已保存至您的自定义设备库。`);
    setIsCopyDeviceModalOpen(false);
    setDeviceToCopy(null);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-800 font-sans flex flex-col">
      {/* Header Bar */}
      <header className="bg-white shadow-xs border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="XLab" className="h-8 object-contain" />
          </Link>
          <span className="text-sm font-bold text-gray-700 hidden md:inline">
            / 仿真项目详情
          </span>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* ========================================================================= */}
        {/* [上] 顶部基础信息区域                                                      */}
        {/* ========================================================================= */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-6 relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-50/60 rounded-full blur-3xl pointer-events-none"></div>

          {/* Project Cover */}
          <div className="w-full lg:w-72 h-44 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200 relative group">
            <img 
              src={project.image} 
              alt={project.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="px-2.5 py-0.5 bg-white/95 backdrop-blur-xs text-xs font-bold text-gray-700 rounded-md shadow-xs border border-gray-200">
                {project.type}
              </span>
              <span className="px-2.5 py-0.5 bg-blue-500/90 backdrop-blur-xs text-xs font-bold text-white rounded-md shadow-xs">
                {project.category}
              </span>
            </div>
          </div>

          {/* Project Meta Info */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  {project.name}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3.5">
                <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                  <User size={14} className="text-gray-400" /> 开发者：<strong className="text-gray-700">{project.publisher}</strong>
                </span>
                <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                  <Clock size={14} className="text-gray-400" /> 发布时间：<span className="font-mono text-gray-600">{project.time}</span>
                </span>
                <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                  <Eye size={14} className="text-blue-500" /> 查看热度：<strong className="text-blue-600">{project.views} 次</strong>
                </span>
                <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md border border-purple-200 font-medium">
                  <Cpu size={14} /> 包含 {project.devices.length} 款硬件节点
                </span>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                {project.description}
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 下半部分：[左下] 设备列表 + [右下] 2D 仿真工程拓扑与实验画布                */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[620px]">
          
          {/* ----------------------------------------------------------------------- */}
          {/* [左下] 本项目使用设备列表                                               */}
          {/* ----------------------------------------------------------------------- */}
          <section className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00a0e9]"></div>
                <h3 className="font-bold text-gray-800 text-base">
                  工程设备清单
                </h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  共 {project.devices.length} 款
                </span>
              </div>
            </div>

            {/* Device List Scrollable */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar max-h-[580px]">
              {project.devices.map((device: any, idx: number) => (
                <div 
                  key={device.id + idx}
                  className="p-3.5 bg-gray-50/80 hover:bg-purple-50/40 rounded-xl border border-gray-200/80 hover:border-purple-200 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-13 h-13 rounded-lg bg-white border border-gray-200 p-1.5 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      <img 
                        src={getDeviceImageUrl(device.id, device.image)} 
                        alt={device.name} 
                        className="w-full h-full object-contain mix-blend-multiply" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-800 text-sm truncate group-hover:text-purple-700 transition-colors" title={device.name}>
                        {device.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-medium">
                          {device.type}
                        </span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 font-medium">
                          {device.protocol}
                        </span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                          x{device.count || 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Copy Single Device Action */}
                  <button 
                    onClick={() => handleOpenCopyDevice(device)}
                    className="p-2 bg-white hover:bg-purple-600 text-gray-400 hover:text-white rounded-lg border border-gray-200 hover:border-purple-600 shadow-2xs transition-all shrink-0"
                    title="复制为我的自定义设备"
                  >
                    <Copy size={15} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ----------------------------------------------------------------------- */}
          {/* [右下] 2D 仿真工程布局图与实验交互画布                                     */}
          {/* ----------------------------------------------------------------------- */}
          <section className="lg:col-span-8 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
            
            {/* Canvas Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3.5 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                  仿真工程
                </h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 border ${
                  isRunning 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-500 animate-ping' : 'bg-gray-400'}`}></span>
                  {isRunning ? '仿真实验运行中' : '待机状态'}
                </span>
              </div>

              {/* Toolbar Action Buttons (Copy Project & Start/Stop Experiment) */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleOpenCopyProject}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-sm rounded-xl border border-purple-200 transition-all shadow-2xs"
                >
                  <Copy size={15} /> 复制整个项目
                </button>

                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all transform active:scale-95 ${
                    isRunning
                      ? 'bg-rose-500 hover:bg-rose-600 text-white ring-2 ring-rose-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Square size={16} fill="currentColor" /> 停止实验
                    </>
                  ) : (
                    <>
                      <Play size={16} fill="currentColor" /> 开启实验
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Topology SVG + Node Interactive Canvas Area */}
            <div className="flex-1 bg-[#0f172a] rounded-xl relative overflow-hidden border border-gray-800 flex flex-col min-h-[420px] select-none shadow-inner">
              
              {/* Background Grid Pattern */}
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />

              {/* Topology SVG Connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                  <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {project.topologyLinks.map((link: any, i: number) => {
                  const source = project.topologyNodes.find((n: any) => n.id === link.from);
                  const target = project.topologyNodes.find((n: any) => n.id === link.to);
                  if (!source || !target) return null;

                  const x1 = source.x + 50;
                  const y1 = source.y + 45;
                  const x2 = target.x + 50;
                  const y2 = target.y + 45;
                  const mx = (x1 + x2) / 2;
                  const my = (y1 + y2) / 2;

                  return (
                    <g key={i}>
                      {/* Connection Line */}
                      <path
                        d={`M ${x1} ${y1} Q ${mx} ${my - 10} ${x2} ${y2}`}
                        fill="none"
                        stroke={isRunning ? '#38bdf8' : '#334155'}
                        strokeWidth="2.5"
                        strokeDasharray={isRunning ? '6,6' : 'none'}
                        className={isRunning ? 'animate-pulse' : ''}
                      />
                      {/* Link Protocol Tag */}
                      <rect 
                        x={mx - 38} 
                        y={my - 18} 
                        width="76" 
                        height="18" 
                        rx="4" 
                        fill="#1e293b" 
                        stroke="#475569" 
                        strokeWidth="1" 
                      />
                      <text 
                        x={mx} 
                        y={my - 6} 
                        fill="#94a3b8" 
                        fontSize="9" 
                        fontWeight="bold" 
                        textAnchor="middle"
                      >
                        {link.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Topology Interactive Node Elements */}
              <div className="absolute inset-0 z-10 p-4">
                {project.topologyNodes.map((node: any) => {
                  const isActuator = node.type === 'actuator';
                  const isSensor = node.type === 'sensor';
                  const isGateway = node.type === 'gateway';
                  const isActuatorActive = node.key ? actuators[node.key] : false;
                  const curVal = node.key ? sensorValues[node.key] : node.value;

                  return (
                    <div
                      key={node.id}
                      style={{ left: `${node.x}px`, top: `${node.y}px` }}
                      className={`absolute w-32 p-2.5 rounded-xl backdrop-blur-md transition-all duration-300 border flex flex-col items-center gap-1.5 shadow-lg ${
                        isRunning
                          ? isActuatorActive
                            ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/40'
                            : 'bg-slate-900/85 border-cyan-500/60 text-cyan-200 shadow-cyan-500/10'
                          : 'bg-slate-900/70 border-slate-700 text-slate-300'
                      }`}
                    >
                      {/* Device Thumbnail */}
                      <div className="w-12 h-12 rounded-lg bg-white/95 p-1 flex items-center justify-center overflow-hidden border border-white/20 shadow-inner">
                        <img 
                          src={getDeviceImageUrl(node.deviceId)} 
                          alt="" 
                          className={`w-full h-full object-contain ${isActuator && isActuatorActive ? 'scale-110' : ''} transition-transform`} 
                        />
                      </div>

                      {/* Node Title */}
                      <div className="text-[11px] font-bold text-center truncate w-full text-white">
                        {node.name}
                      </div>

                      {/* Dynamic Sensor Value / Actuator Switch */}
                      {isSensor && (
                        <div className="w-full py-1 bg-black/40 rounded border border-cyan-500/30 text-center font-mono text-[10px] text-cyan-300 font-bold">
                          {isRunning ? curVal : (node.value || '待测数据')}
                        </div>
                      )}

                      {isActuator && (
                        <button
                          onClick={() => toggleActuator(node.key)}
                          className={`w-full py-1 rounded text-[10px] font-bold transition-all border ${
                            isActuatorActive
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-300 shadow-xs'
                              : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600'
                          }`}
                        >
                          {isActuatorActive ? '● 运行中 (点击关)' : '○ 已停止 (点击开)'}
                        </button>
                      )}

                      {isGateway && (
                        <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          在线转发中
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

          </section>

        </div>

      </main>

      {/* Copy Project Modal */}
      {isCopyProjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[440px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Copy size={18} className="text-[#00a0e9]" />
                复制整个仿真工程项目
              </h3>
              <button onClick={() => setIsCopyProjectModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-800">
                将克隆本项目的所有 <strong>2D 拓扑布局、连线网络、硬件参数与控制策略</strong> 到您的个人控制台空间。
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">新工程项目名称</label>
                <input 
                  type="text" 
                  value={copyProjectName}
                  onChange={(e) => setCopyProjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-[#00a0e9] focus:border-[#00a0e9] transition-colors text-sm"
                  placeholder="请输入新项目名称"
                  autoFocus
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsCopyProjectModalOpen(false)}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleConfirmCopyProject}
                className="px-5 py-2 bg-[#00a0e9] text-white rounded-xl text-sm font-bold hover:bg-[#008cc9] shadow-xs transition-colors"
              >
                确认复制到个人空间
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Custom Device Modal */}
      {isCopyDeviceModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[420px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Copy size={18} className="text-purple-600" />
                复制设备到自定义设备库
              </h3>
              <button onClick={() => setIsCopyDeviceModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0">
                  <img src={getDeviceImageUrl(deviceToCopy?.id, deviceToCopy?.image)} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-gray-400">原硬件：</div>
                  <div className="text-sm font-bold text-gray-800 truncate">{deviceToCopy?.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{deviceToCopy?.type} · {deviceToCopy?.protocol}</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">新自定义设备名称</label>
                <input 
                  type="text" 
                  value={copyDeviceName}
                  onChange={(e) => setCopyDeviceName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
                  placeholder="请输入设备名称"
                  autoFocus
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsCopyDeviceModalOpen(false)}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleConfirmCopyDevice}
                className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 shadow-xs transition-colors"
              >
                确认复制
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
