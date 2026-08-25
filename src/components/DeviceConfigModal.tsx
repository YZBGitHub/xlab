import React, { useState, useEffect } from 'react';
import { 
  X, Check, Plus, Edit2, Trash2, Zap, Settings, Sliders, 
  Cpu, Radio, Shield, HelpCircle, Activity, Layers, ArrowRight,
  Sparkles, AlertCircle, Info, UploadCloud
} from 'lucide-react';
import { SystemDeviceNode, DeviceConfig } from '../data/systemDeviceTree';

interface Props {
  isOpen: boolean;
  node: SystemDeviceNode | null;
  onClose: () => void;
  onSave: (nodeId: string, updatedConfig: DeviceConfig, updatedProtocol: string, updatedDeviceType: '传感器' | '执行器' | '网关') => void;
}

export default function DeviceConfigModal({ isOpen, node, onClose, onSave }: Props) {
  if (!isOpen || !node) return null;

  // 初始推导默认类型
  const inferInitialType = (): '传感器' | '执行器' | '网关' => {
    if (node.deviceType) return node.deviceType;
    if (node.name.includes('网关') || node.name.includes('协调器') || node.id.includes('Gate') || node.id.includes('Collect')) {
      return '网关';
    }
    if (node.name.includes('继电器') || node.name.includes('泵') || node.name.includes('锁') || node.name.includes('电机') || node.name.includes('卷膜') || node.name.includes('门') || node.id.includes('Actuator')) {
      return '执行器';
    }
    return '传感器';
  };

  const [deviceType, setDeviceType] = useState<'传感器' | '执行器' | '网关'>(inferInitialType);

  // 供电
  const [powerType, setPowerType] = useState<'直流' | '交流' | '无需供电'>('直流');
  const [acVoltage, setAcVoltage] = useState('220V');
  const [customAcVal, setCustomAcVal] = useState('');
  const [dcVoltage, setDcVoltage] = useState('12V');
  const [customDcVal, setCustomDcVal] = useState('');

  // 协议
  const [protocol, setProtocol] = useState('ModbusRTU');

  // 网关
  const [gatewayType, setGatewayType] = useState('云平台网关');

  // 执行器图片与状态
  const [onImage, setOnImage] = useState<string | null>(null);
  const [offImage, setOffImage] = useState<string | null>(null);

  // Modbus/Zigbee 属性
  const [modbusAttrs, setModbusAttrs] = useState<Array<{
    name: string;
    unit: string;
    precision?: string;
    range?: string;
    funcCode?: string;
    startAddr?: string;
    dataLen?: string;
    formula?: string;
  }>>([
    { name: '主测量值', unit: '℃', precision: '1', range: '0-100', funcCode: '0x03', startAddr: '0001', dataLen: '1', formula: 'R0=val/10' }
  ]);

  // 模拟量配置
  const [analogConfig, setAnalogConfig] = useState({
    type: '电压' as '电压' | '电流',
    range: '0-10',
    unit: 'V',
    precision: '1',
    min: '0',
    max: '10'
  });

  // 属性表单编辑弹窗/抽屉
  const [showAttrForm, setShowAttrForm] = useState(false);
  const [editingAttrIndex, setEditingAttrIndex] = useState(-1);
  const defaultAttrForm = { 
    name: '', 
    unit: '℃', 
    precision: '1', 
    rangeMin: '0', 
    rangeMax: '100', 
    funcCode: '0x03', 
    startAddr: '0001', 
    dataLen: '1', 
    formula: 'R0=val/10' 
  };
  const [attrForm, setAttrForm] = useState(defaultAttrForm);

  // 初始化加载已有配置
  useEffect(() => {
    if (node) {
      const cfg = node.config;
      const initialType = inferInitialType();
      setDeviceType(cfg?.deviceType || initialType);
      setPowerType(cfg?.powerType || (initialType === '网关' ? '直流' : '直流'));
      setAcVoltage(cfg?.acVoltage || '220V');
      setCustomAcVal(cfg?.customAcVal || '');
      setDcVoltage(cfg?.dcVoltage || '12V');
      setCustomDcVal(cfg?.customDcVal || '');
      
      const defaultProto = node.protocol || (initialType === '传感器' ? 'ModbusRTU' : initialType === '执行器' ? '开关量' : 'TCP/IP');
      setProtocol(cfg?.protocol || (defaultProto === 'Modbus' ? 'ModbusRTU' : defaultProto));
      setGatewayType(cfg?.gatewayType || '云平台网关');
      setOnImage(cfg?.onImage || null);
      setOffImage(cfg?.offImage || null);

      if (cfg?.modbusAttrs && cfg.modbusAttrs.length > 0) {
        setModbusAttrs(cfg.modbusAttrs);
      } else {
        // 根据设备名称生成预设属性
        let sampleName = '测量值';
        let sampleUnit = '';
        if (node.name.includes('温湿度')) { sampleName = '温度'; sampleUnit = '℃'; }
        else if (node.name.includes('光照')) { sampleName = '光照度'; sampleUnit = 'Lux'; }
        else if (node.name.includes('气压') || node.name.includes('压力')) { sampleName = '大气压'; sampleUnit = 'hPa'; }
        else if (node.name.includes('风速')) { sampleName = '风速'; sampleUnit = 'm/s'; }
        else if (node.name.includes('电') || node.name.includes('电压')) { sampleName = '电压'; sampleUnit = 'V'; }
        else if (node.name.includes('水位') || node.name.includes('液位')) { sampleName = '液位'; sampleUnit = 'm'; }
        else if (node.name.includes('CO2') || node.name.includes('二氧化碳') || node.name.includes('PM')) { sampleName = '浓度'; sampleUnit = 'ppm'; }

        setModbusAttrs([
          { name: sampleName, unit: sampleUnit, precision: '1', range: '0-100', funcCode: '0x03', startAddr: '0001', dataLen: '1', formula: 'R0=val/10' }
        ]);
      }

      if (cfg?.analogConfig) {
        setAnalogConfig(cfg.analogConfig);
      }
    }
  }, [node]);

  // 打开属性新增
  const handleOpenAddAttr = () => {
    setAttrForm(defaultAttrForm);
    setEditingAttrIndex(-1);
    setShowAttrForm(true);
  };

  // 打开属性编辑
  const handleOpenEditAttr = (index: number) => {
    const target = modbusAttrs[index];
    let rangeMin = '0';
    let rangeMax = '100';
    if (target.range && target.range.includes('-')) {
      const parts = target.range.split('-');
      rangeMin = parts[0];
      rangeMax = parts[1];
    }
    setAttrForm({
      name: target.name,
      unit: target.unit || '',
      precision: target.precision || '1',
      rangeMin,
      rangeMax,
      funcCode: target.funcCode || '0x03',
      startAddr: target.startAddr || '0001',
      dataLen: target.dataLen || '1',
      formula: target.formula || 'R0=val/10'
    });
    setEditingAttrIndex(index);
    setShowAttrForm(true);
  };

  // 删除属性
  const handleDeleteAttr = (index: number) => {
    setModbusAttrs(prev => prev.filter((_, i) => i !== index));
  };

  // 保存属性
  const handleSaveAttr = () => {
    if (!attrForm.name.trim()) return;

    const newAttr = {
      name: attrForm.name.trim(),
      unit: attrForm.unit.trim(),
      precision: attrForm.precision || '0',
      range: `${attrForm.rangeMin}-${attrForm.rangeMax}`,
      funcCode: attrForm.funcCode || '0x03',
      startAddr: attrForm.startAddr || '0001',
      dataLen: attrForm.dataLen || '1',
      formula: attrForm.formula || 'R0=val'
    };

    if (editingAttrIndex >= 0) {
      setModbusAttrs(prev => prev.map((item, i) => i === editingAttrIndex ? newAttr : item));
    } else {
      setModbusAttrs(prev => [...prev, newAttr]);
    }
    setShowAttrForm(false);
  };

  // 提交保存整个配置
  const handleSaveTotalConfig = () => {
    const finalConfig: DeviceConfig = {
      deviceType,
      powerType,
      acVoltage,
      customAcVal,
      dcVoltage,
      customDcVal,
      protocol,
      gatewayType: deviceType === '网关' ? gatewayType : undefined,
      onImage: deviceType === '执行器' ? onImage : undefined,
      offImage: deviceType === '执行器' ? offImage : undefined,
      modbusAttrs: deviceType === '传感器' ? modbusAttrs : undefined,
      analogConfig: deviceType === '传感器' && protocol === '模拟量' ? analogConfig : undefined
    };

    onSave(node.id, finalConfig, protocol, deviceType);
  };

  const isModbus = protocol === 'ModbusRTU' || protocol === 'Modbus TCP/RTU';
  const isZigbee = protocol === 'Zigbee';
  const isAnalog = protocol === '模拟量';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[860px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <span>设备配置</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-normal">
                  {node.name}
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                配置设备的物理类型、供电规范、通讯协议及数据解析映射规则
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded p-1.5 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-gray-700 bg-white">
          {/* 1. 设备类型选择卡片 */}
          <div>
            <div className="text-xs font-bold text-gray-800 mb-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-blue-500 rounded-full inline-block" />
              <span>设备类型 (Device Type)</span>
              <span className="text-red-500">*</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {/* 传感器 */}
              <div 
                onClick={() => {
                  setDeviceType('传感器');
                  if (protocol === '开关量') setProtocol('ModbusRTU');
                }}
                className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  deviceType === '传感器'
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  deviceType === '传感器' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Activity size={16} />
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-xs flex items-center justify-between">
                    <span>传感器 (Sensor)</span>
                    {deviceType === '传感器' && <Check size={14} className="text-blue-600 stroke-[3]" />}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 leading-snug">
                    采集物理环境模拟量/数字量数据并上报
                  </div>
                </div>
              </div>

              {/* 执行器 */}
              <div 
                onClick={() => {
                  setDeviceType('执行器');
                  if (protocol === '模拟量') setProtocol('开关量');
                }}
                className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  deviceType === '执行器'
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  deviceType === '执行器' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Zap size={16} />
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-xs flex items-center justify-between">
                    <span>执行器 (Actuator)</span>
                    {deviceType === '执行器' && <Check size={14} className="text-blue-600 stroke-[3]" />}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 leading-snug">
                    接收控制指令并驱动继电器/开关/电机
                  </div>
                </div>
              </div>

              {/* 网关 */}
              <div 
                onClick={() => {
                  setDeviceType('网关');
                  setProtocol('TCP/IP');
                }}
                className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  deviceType === '网关'
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  deviceType === '网关' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Cpu size={16} />
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-xs flex items-center justify-between">
                    <span>网关 / 协调器</span>
                    {deviceType === '网关' && <Check size={14} className="text-blue-600 stroke-[3]" />}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 leading-snug">
                    提供组网汇聚、协议转换与云端互联
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 供电方式设置 */}
          {deviceType !== '网关' && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3">
              <div className="text-xs font-bold text-gray-800 flex items-center justify-between">
                <span>供电方式与电压规格</span>
                <span className="text-[11px] text-gray-400 font-normal">决定接线端子与拓扑供电逻辑</span>
              </div>
              
              <div className="flex gap-3">
                {['直流', '交流', '无需供电'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPowerType(p as any)}
                    className={`px-4 py-1.5 rounded text-xs font-medium border transition-all cursor-pointer ${
                      powerType === p
                        ? 'bg-white border-blue-500 text-blue-600 shadow-2xs font-semibold'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {p === '直流' ? '直流电 (DC)' : p === '交流' ? '交流电 (AC)' : '无需供电'}
                  </button>
                ))}
              </div>

              {powerType === '直流' && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-gray-500 text-xs">直流电压:</span>
                  {['5V', '12V', '24V', '自定义'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDcVoltage(v)}
                      className={`px-3 py-1 rounded text-xs border transition-all ${
                        dcVoltage === v ? 'bg-blue-50 border-blue-500 text-blue-600 font-medium' : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                  {dcVoltage === '自定义' && (
                    <div className="flex items-center gap-1 ml-2">
                      <input 
                        type="text" 
                        value={customDcVal} 
                        onChange={e => setCustomDcVal(e.target.value)} 
                        placeholder="如: 9" 
                        className="w-16 border border-gray-300 rounded px-2 py-0.5 text-xs outline-none focus:border-blue-500 bg-white" 
                      />
                      <span className="text-gray-500">V</span>
                    </div>
                  )}
                </div>
              )}

              {powerType === '交流' && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-gray-500 text-xs">交流电压:</span>
                  {['220V', '110V', '自定义'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAcVoltage(v)}
                      className={`px-3 py-1 rounded text-xs border transition-all ${
                        acVoltage === v ? 'bg-blue-50 border-blue-500 text-blue-600 font-medium' : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                  {acVoltage === '自定义' && (
                    <div className="flex items-center gap-1 ml-2">
                      <input 
                        type="text" 
                        value={customAcVal} 
                        onChange={e => setCustomAcVal(e.target.value)} 
                        placeholder="如: 380" 
                        className="w-16 border border-gray-300 rounded px-2 py-0.5 text-xs outline-none focus:border-blue-500 bg-white" 
                      />
                      <span className="text-gray-500">V</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. 网关专用配置 */}
          {deviceType === '网关' && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-4">
              <div className="text-xs font-bold text-gray-800">网关类型与端口</div>
              <div className="flex gap-3">
                {['云平台网关', '4G-DTU网关 (RS485型)', 'Zigbee协调器网关', '工业边缘网关'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGatewayType(g)}
                    className={`px-3 py-1.5 rounded text-xs border transition-all ${
                      gatewayType === g ? 'bg-white border-blue-500 text-blue-600 font-medium shadow-2xs' : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-3 flex items-center gap-2">
                <span className="text-gray-600 font-medium">系统分配端子：</span>
                <div className="flex gap-2">
                  {gatewayType.includes('云平台') ? (
                    <>
                      <span className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs font-mono font-bold text-gray-700">rs485a</span>
                      <span className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs font-mono font-bold text-gray-700">rs485b</span>
                      <span className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs font-mono font-bold text-blue-600">network</span>
                      <span className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs font-mono font-bold text-red-500">power</span>
                    </>
                  ) : (
                    <>
                      <span className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs font-mono font-bold text-gray-700">rs485a</span>
                      <span className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs font-mono font-bold text-gray-700">rs485b</span>
                      <span className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs font-mono font-bold text-red-500">vs</span>
                      <span className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs font-mono font-bold text-gray-800">gnd</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. 通讯协议选择 (通讯协议 Protocol) */}
          {deviceType !== '网关' && (
            <div>
              <div className="text-xs font-bold text-gray-800 mb-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-blue-500 rounded-full inline-block" />
                <span>设备通讯协议 (Protocol)</span>
                <span className="text-red-500">*</span>
              </div>
              
              <div className="flex gap-2.5 flex-wrap">
                {deviceType === '传感器' ? (
                  ['ModbusRTU', '模拟量', 'Zigbee', 'LoRaWAN', 'MQTT'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProtocol(p)}
                      className={`px-4 py-2 rounded text-xs font-medium border transition-all cursor-pointer ${
                        protocol === p
                          ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-2xs font-semibold'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))
                ) : (
                  ['开关量', 'Modbus TCP/RTU', 'Zigbee', 'MQTT'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProtocol(p)}
                      className={`px-4 py-2 rounded text-xs font-medium border transition-all cursor-pointer ${
                        protocol === p
                          ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-2xs font-semibold'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 5. 协议端子指示 */}
          {deviceType !== '网关' && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-gray-600 font-medium">接线端口拓扑：</span>
              {isModbus ? (
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono font-bold text-gray-700">rs485A</span>
                  <span className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono font-bold text-gray-700">rs485B</span>
                  <span className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono font-bold text-red-500">vs</span>
                  <span className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono font-bold text-gray-800">gnd</span>
                </div>
              ) : isAnalog ? (
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono font-bold text-red-500">vs</span>
                  <span className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono font-bold text-gray-800">gnd</span>
                  <span className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono font-bold text-blue-600">signal</span>
                </div>
              ) : (
                <span className="text-gray-500 text-xs">无线射频透传协议，无需配置物理硬接线端口。</span>
              )}
            </div>
          )}

          {/* 6. 传感器属性配置 (Modbus / Zigbee / LoRaWAN) */}
          {deviceType === '传感器' && (isModbus || isZigbee || protocol === 'LoRaWAN') && (
            <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                  <Activity size={14} className="text-blue-500" />
                  <span>传感器数据属性与解析规则 (Attributes)</span>
                  <span className="text-gray-400 font-normal">({modbusAttrs.length} 个属性)</span>
                </div>
                {!showAttrForm && (
                  <button
                    type="button"
                    onClick={handleOpenAddAttr}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>新增属性</span>
                  </button>
                )}
              </div>

              {/* 属性编辑表单抽屉 */}
              {showAttrForm && (
                <div className="bg-gray-50 border border-blue-200 rounded-lg p-4 space-y-3 animate-in fade-in">
                  <div className="font-bold text-xs text-blue-700 flex items-center justify-between">
                    <span>{editingAttrIndex >= 0 ? '编辑属性' : '新增传感器属性'}</span>
                  </div>

                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-4">
                      <label className="block text-[11px] text-gray-600 mb-1">属性名 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={attrForm.name}
                        onChange={e => setAttrForm({ ...attrForm, name: e.target.value })}
                        placeholder="如: 温度 / 湿度"
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 bg-white"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[11px] text-gray-600 mb-1">单位</label>
                      <input
                        type="text"
                        value={attrForm.unit}
                        onChange={e => setAttrForm({ ...attrForm, unit: e.target.value })}
                        placeholder="如: ℃ / % / Lux"
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 bg-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] text-gray-600 mb-1">精度(位)</label>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        value={attrForm.precision}
                        onChange={e => setAttrForm({ ...attrForm, precision: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 bg-white"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[11px] text-gray-600 mb-1">量程区间</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={attrForm.rangeMin}
                          onChange={e => setAttrForm({ ...attrForm, rangeMin: e.target.value })}
                          placeholder="Min"
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500 bg-white"
                        />
                        <span>-</span>
                        <input
                          type="number"
                          value={attrForm.rangeMax}
                          onChange={e => setAttrForm({ ...attrForm, rangeMax: e.target.value })}
                          placeholder="Max"
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {isModbus && (
                    <div className="grid grid-cols-12 gap-3 pt-2 border-t border-gray-200">
                      <div className="col-span-3">
                        <label className="block text-[11px] text-gray-600 mb-1">功能码</label>
                        <input
                          type="text"
                          value={attrForm.funcCode}
                          onChange={e => setAttrForm({ ...attrForm, funcCode: e.target.value })}
                          placeholder="0x03"
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-mono outline-none focus:border-blue-500 bg-white"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[11px] text-gray-600 mb-1">起始寄存器地址</label>
                        <input
                          type="text"
                          value={attrForm.startAddr}
                          onChange={e => setAttrForm({ ...attrForm, startAddr: e.target.value })}
                          placeholder="0001"
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-mono outline-none focus:border-blue-500 bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] text-gray-600 mb-1">数据长度</label>
                        <input
                          type="text"
                          value={attrForm.dataLen}
                          onChange={e => setAttrForm({ ...attrForm, dataLen: e.target.value })}
                          placeholder="1"
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-mono outline-none focus:border-blue-500 bg-white"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="block text-[11px] text-gray-600 mb-1">编码/解码公式</label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={attrForm.formula}
                            onChange={e => setAttrForm({ ...attrForm, formula: e.target.value })}
                            placeholder="如: R0=val/10"
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-mono outline-none focus:border-blue-500 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setAttrForm({ ...attrForm, formula: 'R0=val/10' })}
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded text-[10px] border border-purple-200 shrink-0 flex items-center gap-0.5"
                            title="自动填入推荐公式"
                          >
                            <Zap size={11} /> 推荐
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAttrForm(false)}
                      className="px-3 py-1 border border-gray-300 rounded text-gray-600 bg-white hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAttr}
                      className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium"
                    >
                      保存属性
                    </button>
                  </div>
                </div>
              )}

              {/* 属性列表卡片 */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {modbusAttrs.map((attr, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 bg-gray-50/80 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="font-semibold text-gray-800 text-xs">
                        {attr.name} {attr.unit && <span className="text-gray-400 font-normal">({attr.unit})</span>}
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-3">
                        <span>精度: {attr.precision || 0}位</span>
                        <span>量程: {attr.range || '0-100'}</span>
                        {isModbus && (
                          <>
                            <span className="font-mono text-gray-600">码: {attr.funcCode || '0x03'}</span>
                            <span className="font-mono text-gray-600">地址: {attr.startAddr || '0001'}</span>
                            <span className="font-mono text-blue-600 bg-blue-50 px-1 rounded">{attr.formula || 'R0=val'}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditAttr(idx)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="编辑"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttr(idx)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="删除"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                {modbusAttrs.length === 0 && !showAttrForm && (
                  <div className="text-center py-6 text-gray-400 border border-dashed border-gray-200 rounded-lg text-xs">
                    暂无配置属性，请点击右上角新增属性
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 7. 模拟量配置 (Analog Config) */}
          {deviceType === '传感器' && isAnalog && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-4">
              <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Sliders size={14} className="text-blue-500" />
                <span>模拟量采集规格</span>
              </div>
              
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-4">
                  <label className="block text-[11px] text-gray-600 mb-1">模拟信号类型</label>
                  <div className="flex gap-2">
                    {['电压', '电流'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAnalogConfig({ ...analogConfig, type: t as any, unit: t === '电压' ? 'V' : 'mA' })}
                        className={`px-3 py-1 rounded text-xs border ${
                          analogConfig.type === t ? 'bg-white border-blue-500 text-blue-600 font-bold shadow-2xs' : 'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        {t === '电压' ? '电压信号 (0-10V)' : '电流信号 (4-20mA)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-3">
                  <label className="block text-[11px] text-gray-600 mb-1">信号量程 (单位: {analogConfig.unit})</label>
                  <input
                    type="text"
                    value={analogConfig.range}
                    onChange={e => setAnalogConfig({ ...analogConfig, range: e.target.value })}
                    placeholder="如: 0-10"
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 bg-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] text-gray-600 mb-1">采集精度</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={analogConfig.precision}
                    onChange={e => setAnalogConfig({ ...analogConfig, precision: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 bg-white"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-[11px] text-gray-600 mb-1">物理区间 (Min - Max)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={analogConfig.min}
                      onChange={e => setAnalogConfig({ ...analogConfig, min: e.target.value })}
                      placeholder="0"
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500 bg-white"
                    />
                    <span>-</span>
                    <input
                      type="text"
                      value={analogConfig.max}
                      onChange={e => setAnalogConfig({ ...analogConfig, max: e.target.value })}
                      placeholder="100"
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. 执行器状态与控制设置 */}
          {deviceType === '执行器' && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-4">
              <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Zap size={14} className="text-blue-500" />
                <span>执行器开/关状态仿真呈现</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-emerald-200 bg-emerald-50/30 rounded-lg space-y-2">
                  <div className="font-bold text-emerald-700 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
                    <span>开启状态 (ON) 呈现</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      value={onImage || ''} 
                      onChange={e => setOnImage(e.target.value)} 
                      placeholder="开状态图片路径 / URL" 
                      className="flex-1 border border-gray-300 rounded px-2.5 py-1 text-xs outline-none focus:border-emerald-500 bg-white"
                    />
                    {onImage && (
                      <div className="w-7 h-7 rounded border bg-white p-0.5 flex items-center justify-center shrink-0">
                        <img src={onImage} alt="ON" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 border border-gray-200 bg-white rounded-lg space-y-2">
                  <div className="font-bold text-gray-700 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    <span>关闭状态 (OFF) 呈现</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      value={offImage || ''} 
                      onChange={e => setOffImage(e.target.value)} 
                      placeholder="关状态图片路径 / URL" 
                      className="flex-1 border border-gray-300 rounded px-2.5 py-1 text-xs outline-none focus:border-gray-500 bg-white"
                    />
                    {offImage && (
                      <div className="w-7 h-7 rounded border bg-white p-0.5 flex items-center justify-center shrink-0">
                        <img src={offImage} alt="OFF" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Info size={13} />
            <span>配置将即时绑定到仿真引擎和接线拓扑中</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 text-xs font-medium transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSaveTotalConfig}
              className="px-5 py-1.5 rounded bg-[#1890ff] hover:bg-[#40a9ff] text-white text-xs font-medium shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>保存配置</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
