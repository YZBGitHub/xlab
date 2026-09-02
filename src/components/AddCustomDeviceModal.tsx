import React, { useState, useEffect } from 'react';
import { X, UploadCloud, Check, Plus, Edit2, Trash2, Shield, Settings, Info, Zap, Layers, Play, Square, CheckCircle2, Eye, Terminal } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  onSave?: (savedData: any) => void;
}

export default function AddCustomDeviceModal({ isOpen, onClose, initialData, onSave }: Props) {
  const isEditMode = !!initialData;
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    image: null as string | null,
    type: '执行器' as '执行器' | '传感器' | '网关',
    
    // Gateway
    gatewayType: '云平台网关',

    // Power (Shared)
    powerType: '直流', // '交流' | '直流' | '无需供电'
    acVoltage: '220V',
    customAcVal: '',
    dcVoltage: '12V',
    customDcVal: '',
    
    // Actuator
    onImage: null as string | null,
    offImage: null as string | null,
    
    // Sensor
    protocol: 'ModbusRTU',
    modbusAttrs: [
      { name: '温度', key: 'temperature', unit: '℃', range: '0-100', funcCode: '0x03', startAddr: '0004', dataLen: '1', formula: 'R0=val/10' }
    ],
    analogConfig: { name: '物理量采集', key: 'analog_value', type: '电压', range: '0-24', unit: 'V', min: '0', max: '10', precision: '0' },
    digitalConfig: { propertyName: '人体感应', propertyKey: 'human_presence', key: 'human_presence', zeroLabel: '无人', oneLabel: '有人', defaultVal: '0', triggerMode: '高电平有效 (Active High)' },
    
    // Publish Option
    publishToSimulation: false
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          image: initialData.image || null,
          type: (initialData.type === '网关' || initialData.type === '传感器') ? initialData.type : '执行器',
          gatewayType: initialData.gatewayType || '云平台网关',
          powerType: initialData.powerType || (initialData.power?.includes('AC') ? '交流' : '直流'),
          acVoltage: initialData.acVoltage || '220V',
          customAcVal: initialData.customAcVal || '',
          dcVoltage: initialData.dcVoltage || '12V',
          customDcVal: initialData.customDcVal || '',
          onImage: initialData.onImage || null,
          offImage: initialData.offImage || null,
          protocol: initialData.protocol === 'Modbus RTU' ? 'ModbusRTU' : (initialData.protocol || 'ModbusRTU'),
          modbusAttrs: initialData.modbusAttrs || [
            { name: '温度', key: 'temperature', unit: '℃', range: '0-100', funcCode: '0x03', startAddr: '0004', dataLen: '1', formula: 'R0=val/10' }
          ],
          analogConfig: initialData.analogConfig || { name: '物理量采集', key: 'analog_value', type: '电压', range: '0-24', unit: 'V', min: '0', max: '10', precision: '0' },
          digitalConfig: initialData.digitalConfig || { propertyName: '人体感应', propertyKey: 'human_presence', key: 'human_presence', zeroLabel: '无人', oneLabel: '有人', defaultVal: '0', triggerMode: '高电平有效 (Active High)' },
          publishToSimulation: initialData.publishToSimulation || false
        });
      } else {
        setFormData({
          name: '',
          image: null,
          type: '执行器',
          gatewayType: '云平台网关',
          powerType: '直流',
          acVoltage: '220V',
          customAcVal: '',
          dcVoltage: '12V',
          customDcVal: '',
          onImage: null,
          offImage: null,
          protocol: 'ModbusRTU',
          modbusAttrs: [
            { name: '温度', key: 'temperature', unit: '℃', range: '0-100', funcCode: '0x03', startAddr: '0004', dataLen: '1', formula: 'R0=val/10' }
          ],
          analogConfig: { name: '物理量采集', key: 'analog_value', type: '电压', range: '0-24', unit: 'V', min: '0', max: '10', precision: '0' },
          digitalConfig: { propertyName: '人体感应', propertyKey: 'human_presence', key: 'human_presence', zeroLabel: '无人', oneLabel: '有人', defaultVal: '0', triggerMode: '高电平有效 (Active High)' },
          publishToSimulation: false
        });
      }
    }
  }, [isOpen, initialData]);

  const totalSteps = formData.type === '执行器' ? 5 : (formData.type === '传感器' ? 4 : 3);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else {
      if (isEditMode) {
        if (onSave) onSave(formData);
        alert(`自定义设备 "${formData.name}" 修改已成功保存！`);
      } else {
        if (onSave) onSave(formData);
        alert(formData.publishToSimulation ? '设备生成成功，已同步发布至仿真设备大厅！' : '设备生成成功，已保存至您的自定义设备！');
      }
      onClose();
      setTimeout(() => setStep(1), 300);
    }
  };

  const isActuator = formData.type === '执行器';
  const isSensor = formData.type === '传感器';
  const isGateway = formData.type === '网关';

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[960px] h-[88vh] max-h-[880px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
          <h3 className="font-bold text-gray-800 text-lg">
            {isEditMode ? '编辑自定义设备' : '新增自定义设备'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Steps Indicator */}
          <div className="w-56 bg-gray-50 border-r border-gray-100 p-6 flex flex-col gap-6 shrink-0">
            <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">配置向导</div>
            <div className="flex flex-col relative gap-2">
              <div className="absolute left-[11px] top-4 bottom-4 w-px bg-gray-200 z-0"></div>
              <StepIndicator num={1} label="基础信息" active={step === 1} done={step > 1} onClick={() => setStep(1)} />
              <StepIndicator 
                num={2} 
                label={isActuator ? '供电方式' : (isSensor ? '供电电压' : '网关配置')} 
                active={step === 2} 
                done={step > 2} 
                onClick={() => step > 1 && setStep(2)} 
              />
              {!isGateway && (
                <StepIndicator 
                  num={3} 
                  label={isActuator ? '端口设置' : '设备协议'} 
                  active={step === 3} 
                  done={step > 3} 
                  onClick={() => step > 2 && setStep(3)} 
                />
              )}
              {isActuator && (
                <StepIndicator num={4} label="状态设置" active={step === 4} done={step > 4} onClick={() => step > 3 && setStep(4)} />
              )}
              <StepIndicator num={totalSteps} label="确认生成" active={step === totalSteps} done={step > totalSteps} onClick={() => step === totalSteps && setStep(totalSteps)} />
            </div>
          </div>

          {/* Right Panel: Form Area */}
          <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
            {step === 1 && <Step1BasicInfo data={formData} update={(d: any) => setFormData({...formData, ...d})} />}
            {step === 2 && !isGateway && <Step2Power data={formData} update={(d: any) => setFormData({...formData, ...d})} />}
            {step === 2 && isGateway && <Step2Gateway data={formData} update={(d: any) => setFormData({...formData, ...d})} />}
            {step === 3 && isActuator && <Step3ActuatorPorts data={formData} />}
            {step === 4 && isActuator && <Step4ActuatorStatus data={formData} update={(d: any) => setFormData({...formData, ...d})} />}
            {step === 3 && isSensor && <Step3SensorProtocol data={formData} update={(d: any) => setFormData({...formData, ...d})} />}
            {step === totalSteps && <StepConfirm data={formData} update={(d: any) => setFormData({...formData, ...d})} />}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="px-5 py-2 border border-gray-300 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors mr-auto"
            >
              上一步
            </button>
          )}
          <button 
            onClick={onClose} 
            className="px-5 py-2 border border-gray-300 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleNext}
            className="px-5 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 shadow-sm transition-colors"
          >
            {step === totalSteps ? (isEditMode ? '保存修改' : '确认并生成') : '下一步'}
          </button>
        </div>




      </div>
    </div>
  );
}

// --- Layout Components ---
function StepIndicator({ num, label, active, done, onClick }: { num: number, label: string, active: boolean, done: boolean, onClick: () => void }) {
  return (
    <div className="flex items-center gap-3 relative z-10 py-2 cursor-pointer group" onClick={onClick}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
        active ? 'bg-blue-500 text-white ring-4 ring-blue-50' : 
        done ? 'bg-blue-100 text-blue-500' : 'bg-white border-2 border-gray-200 text-gray-400 group-hover:border-gray-300 group-hover:text-gray-500'
      }`}>
        {done ? <Check size={12} strokeWidth={3} /> : num}
      </div>
      <span className={`text-sm font-medium ${active ? 'text-blue-600' : done ? 'text-gray-700' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}

function RadioBox({ label, active, onClick, className = '' }: { label: string, active: boolean, onClick: () => void, className?: string }) {
  return (
    <div 
      onClick={onClick}
      className={`px-4 py-2 rounded-md border cursor-pointer text-sm font-medium transition-all text-center ${
        active 
          ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm' 
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
      } ${className}`}
    >
      {label}
    </div>
  );
}

function ImageUploadBox({ label }: { label: string }) {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer bg-gray-50 group h-full">
      <UploadCloud size={32} className="mb-2 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-[10px] text-gray-400 mt-1">支持 PNG, JPG</span>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return <div className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-mono text-gray-600 shadow-sm font-medium">{label}</div>;
}

function FormInput({ label, value, onChange, placeholder = '' }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input 
        type="text" 
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all bg-white" 
      />
    </div>
  );
}

// --- Step Flows ---
function Step1BasicInfo({ data, update }: any) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h4 className="text-lg font-bold text-gray-800 mb-1">基础信息</h4>
        <p className="text-sm text-gray-500">填写设备的名称、上传展示图片并选择基础类型。</p>
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">设备名称 <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            value={data.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="请输入设备名称"
            className="w-full max-w-md border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">设备图片 <span className="text-red-500">*</span></label>
          <div className="w-32 h-32">
            <ImageUploadBox label="点击上传封面图" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">设备类型 <span className="text-red-500">*</span></label>
          <div className="flex gap-4">
            <RadioBox label="执行器" active={data.type === '执行器'} onClick={() => update({ type: '执行器' })} className="w-32" />
            <RadioBox label="传感器" active={data.type === '传感器'} onClick={() => update({ type: '传感器' })} className="w-32" />
            <RadioBox label="网关" active={data.type === '网关'} onClick={() => update({ type: '网关' })} className="w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}


function Step2Gateway({ data, update }: any) {
  const isCloud = data.gatewayType === '云平台网关';
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h4 className="text-lg font-bold text-gray-800 mb-1">网关配置</h4>
        <p className="text-sm text-gray-500">选择网关类型，接线点将自动配置。</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">网关类型</label>
          <div className="flex gap-4">
            <RadioBox label="云平台网关" active={data.gatewayType === '云平台网关'} onClick={() => update({ gatewayType: '云平台网关' })} className="w-40" />
            <RadioBox label="4G-DTU网关 (RS485型)" active={data.gatewayType === '4G-DTU网关 (RS485型)'} onClick={() => update({ gatewayType: '4G-DTU网关 (RS485型)' })} className="w-56" />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <div className="text-sm font-bold text-gray-700 mb-3">系统分配端口</div>
          <div className="flex gap-3">
            {isCloud ? (
              <><Tag label="rs485a" /><Tag label="rs485b" /><Tag label="network" /><Tag label="power" /></>
            ) : (
              <><Tag label="rs485a" /><Tag label="rs485b" /><Tag label="vs" /><Tag label="gnd" /></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step2Power({ data, update }: any) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h4 className="text-lg font-bold text-gray-800 mb-1">{data.type === '执行器' ? '供电方式' : '供电电压'}</h4>
        <p className="text-sm text-gray-500">配置该设备所需的供电类型及电压大小。</p>
      </div>
      
      <div className="space-y-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">供电类型</label>
          <div className="flex gap-4">
            <RadioBox label="交流电 (AC)" active={data.powerType === '交流'} onClick={() => update({ powerType: '交流' })} className="w-32" />
            <RadioBox label="直流电 (DC)" active={data.powerType === '直流'} onClick={() => update({ powerType: '直流' })} className="w-32" />
            <RadioBox label="无需供电" active={data.powerType === '无需供电'} onClick={() => update({ powerType: '无需供电' })} className="w-32" />
          </div>
        </div>

        {data.powerType !== '无需供电' && (
          <div className="p-5 bg-gray-50 rounded-lg border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-3">电压设置</label>
            
            {data.powerType === '交流' && (
              <div className="flex items-center gap-4">
                <RadioBox label="220V" active={data.acVoltage === '220V'} onClick={() => update({ acVoltage: '220V' })} />
                <RadioBox label="自定义" active={data.acVoltage === '自定义'} onClick={() => update({ acVoltage: '自定义' })} />
                {data.acVoltage === '自定义' && (
                  <div className="flex items-center gap-2">
                    <input type="text" value={data.customAcVal} onChange={e => update({ customAcVal: e.target.value })} placeholder="如: 110" className="border border-gray-200 rounded px-3 py-1.5 text-sm w-24 outline-none focus:border-blue-400" />
                    <span className="text-sm text-gray-500">V</span>
                  </div>
                )}
              </div>
            )}

            {data.powerType === '直流' && (
              <div className="flex items-center gap-4 flex-wrap">
                <RadioBox label="5V" active={data.dcVoltage === '5V'} onClick={() => update({ dcVoltage: '5V' })} />
                <RadioBox label="12V" active={data.dcVoltage === '12V'} onClick={() => update({ dcVoltage: '12V' })} />
                <RadioBox label="24V" active={data.dcVoltage === '24V'} onClick={() => update({ dcVoltage: '24V' })} />
                <RadioBox label="自定义" active={data.dcVoltage === '自定义'} onClick={() => update({ dcVoltage: '自定义' })} />
                {data.dcVoltage === '自定义' && (
                  <div className="flex items-center gap-2">
                    <input type="text" value={data.customDcVal} onChange={e => update({ customDcVal: e.target.value })} placeholder="如: 9" className="border border-gray-200 rounded px-3 py-1.5 text-sm w-24 outline-none focus:border-blue-400" />
                    <span className="text-sm text-gray-500">V</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Step3ActuatorPorts({ data }: any) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h4 className="text-lg font-bold text-gray-800 mb-1">端口设置</h4>
        <p className="text-sm text-gray-500">系统已根据您的供电方式自动配置了接线端口。</p>
      </div>
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-100 flex flex-col items-center justify-center py-12">
        <div className="text-sm text-gray-500 mb-6">当前供电方式：<strong className="text-gray-800">{data.powerType}</strong></div>
        <div className="flex gap-4">
          {data.powerType === '直流' ? (
            <>
              <div className="px-6 py-3 bg-white border border-gray-200 rounded-md shadow-sm font-mono text-base font-bold text-red-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> vs</div>
              <div className="px-6 py-3 bg-white border border-gray-200 rounded-md shadow-sm font-mono text-base font-bold text-gray-800 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-800"></div> gnd</div>
            </>
          ) : data.powerType === '交流' ? (
            <div className="px-6 py-3 bg-white border border-gray-200 rounded-md shadow-sm font-mono text-base font-bold text-blue-600 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> power</div>
          ) : (
            <div className="text-gray-400 font-medium">无需接线端口</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Step4ActuatorStatus({ data, update }: any) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h4 className="text-lg font-bold text-gray-800 mb-1">状态设置</h4>
        <p className="text-sm text-gray-500">为执行器的开/关状态分别设置不同的展示图片，以便在仿真中呈现动态效果。</p>
      </div>
      <div className="grid grid-cols-2 gap-8 h-64">
        <div className="space-y-4 p-5 border border-green-100 bg-green-50/30 rounded-xl flex flex-col">
          <div className="font-bold text-green-700 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            状态: 开启 (ON)
          </div>
          <div className="flex-1"><ImageUploadBox label="上传开状态图片" /></div>
        </div>
        <div className="space-y-4 p-5 border border-gray-200 bg-gray-50 rounded-xl flex flex-col">
          <div className="font-bold text-gray-700 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
            状态: 关闭 (OFF)
          </div>
          <div className="flex-1"><ImageUploadBox label="上传关状态图片" /></div>
        </div>
      </div>
    </div>
  );
}

function Step3SensorProtocol({ data, update }: any) {
  const [showAttrForm, setShowAttrForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const defaultAttr = { name: '', key: '', unit: '', precision: '0', rangeMin: '', rangeMax: '', funcCode: '', startAddr: '', dataLen: '', formula: '' };
  const [attrForm, setAttrForm] = useState(defaultAttr);

  const isModbus = data.protocol === 'ModbusRTU';
  const isZigbee = data.protocol === 'Zigbee';
  const currentAttrs = isModbus ? data.modbusAttrs : (data.zigbeeAttrs || []);
  
  const setCurrentAttrs = (newAttrs: any[]) => {
    if (isModbus) update({ modbusAttrs: newAttrs });
    else update({ zigbeeAttrs: newAttrs });
  };

  const openAdd = () => {
    setAttrForm(defaultAttr);
    setEditingIndex(-1);
    setShowAttrForm(true);
  };
  
  const openEdit = (index: number) => {
    const attr = currentAttrs[index];
    let rangeMin = '';
    let rangeMax = '';
    if (attr.range) {
      const parts = attr.range.split('-');
      if (parts.length === 2) {
        rangeMin = parts[0];
        rangeMax = parts[1];
      }
    }
    setAttrForm({...attr, rangeMin, rangeMax, precision: attr.precision || '0'});
    setEditingIndex(index);
    setShowAttrForm(true);
  };

  const removeAttr = (index: number) => {
    const newAttrs = [...currentAttrs];
    newAttrs.splice(index, 1);
    setCurrentAttrs(newAttrs);
  };

  const saveAttr = () => {
    if (!attrForm.name || !attrForm.name.trim()) {
      alert('请输入属性名称！');
      return;
    }
    const cleanKey = (attrForm.key || '').trim().replace(/[^a-zA-Z_]/g, '').slice(0, 50);
    if (!cleanKey) {
      alert('请输入英文标识，支持英文和下划线，50字符以内！');
      return;
    }
    const newAttrs = [...currentAttrs];
    let finalAttr = { name: attrForm.name.trim(), key: cleanKey, unit: attrForm.unit, precision: attrForm.precision || '0' };
    
    if (isModbus) {
      finalAttr = {
        ...finalAttr,
        range: `${attrForm.rangeMin}-${attrForm.rangeMax}`,
        funcCode: attrForm.funcCode,
        startAddr: attrForm.startAddr,
        dataLen: attrForm.dataLen,
        formula: attrForm.formula
      } as any;
    }
    
    if (editingIndex >= 0) newAttrs[editingIndex] = finalAttr;
    else newAttrs.push(finalAttr);
    setCurrentAttrs(newAttrs);
    setShowAttrForm(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h4 className="text-lg font-bold text-gray-800 mb-1">设备协议 & 属性</h4>
        <p className="text-sm text-gray-500">配置传感器的通讯协议及数据解析方式。</p>
      </div>
      
      <div>
        <div className="text-sm font-bold text-gray-700 mb-3">通讯协议</div>
        <div className="flex gap-4 flex-wrap mb-2">
          {['ModbusRTU', '模拟量', '数字量', 'Zigbee'].map(p => (
            <div key={p}><RadioBox label={p} active={data.protocol === p} onClick={() => update({ protocol: p })} /></div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6">
        {(isModbus || isZigbee) && (
          <div>
            <div className="text-sm font-bold text-gray-700 mb-3">{isModbus ? '默认接线端口' : '无线配置'}</div>
            {isModbus ? (
              <div className="flex gap-3 mb-8">
                <Tag label="rs485A" /> <Tag label="rs485B" /> <Tag label="vs" /> <Tag label="gnd" />
              </div>
            ) : (
              <div className="text-sm text-gray-500 mb-8">
                Zigbee 协议使用无线透传，无需配置物理接线端口。
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-bold text-gray-700">属性设置</div>
              {!showAttrForm && (
                <button onClick={openAdd} className="text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors">
                  <Plus size={14} /> 新增属性
                </button>
              )}
            </div>

            {showAttrForm && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
                <div className="font-bold text-sm text-gray-800 mb-4">{editingIndex >= 0 ? '编辑属性' : '新增属性'}</div>
                <div className="grid grid-cols-12 gap-4 mb-4">
                  <div className="col-span-3">
                    <FormInput label="属性名称" value={attrForm.name} onChange={v => setAttrForm({...attrForm, name: v})} placeholder="如: 温度" />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center justify-between">
                      <span>英文标识 (Key)</span>
                      <span className="text-[10px] text-gray-400">英文/下划线</span>
                    </label>
                    <input 
                      type="text"
                      maxLength={50}
                      value={attrForm.key || ''} 
                      onChange={e => {
                        const sanitized = e.target.value.replace(/[^a-zA-Z_]/g, '').slice(0, 50);
                        setAttrForm({...attrForm, key: sanitized});
                      }} 
                      placeholder="如: temperature" 
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all bg-white font-mono" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">单位</label>
                    <input 
                      type="text" 
                      list="unit-options" 
                      value={attrForm.unit} 
                      onChange={e => setAttrForm({...attrForm, unit: e.target.value})} 
                      placeholder="如: ℃" 
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all bg-white" 
                    />
                    <datalist id="unit-options">
                      <option value="℃" />
                      <option value="%" />
                      <option value="Lux" />
                      <option value="V" />
                      <option value="A" />
                      <option value="W" />
                      <option value="kWh" />
                      <option value="m" />
                      <option value="m/s" />
                      <option value="ppm" />
                    </datalist>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">精度 (小数位)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="6"
                      value={attrForm.precision} 
                      onChange={e => setAttrForm({...attrForm, precision: e.target.value})} 
                      placeholder="小数位" 
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all bg-white" 
                    />
                  </div>
                  {isModbus && (
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">量程设置</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={attrForm.rangeMin} 
                        onChange={e => {
                          const min = e.target.value;
                          const minNum = Number(min);
                          const maxNum = Number(attrForm.rangeMax);
                          if (attrForm.rangeMax !== '' && min !== '' && minNum > maxNum) {
                            setAttrForm({...attrForm, rangeMin: min, rangeMax: min});
                          } else {
                            setAttrForm({...attrForm, rangeMin: min});
                          }
                        }}
                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all bg-white" 
                        placeholder="起始" 
                      />
                      <span className="text-gray-400">-</span>
                      <input 
                        type="number" 
                        value={attrForm.rangeMax} 
                        onChange={e => setAttrForm({...attrForm, rangeMax: e.target.value})}
                        onBlur={e => {
                          const max = e.target.value;
                          if (max === '' || attrForm.rangeMin === '') return;
                          if (Number(max) < Number(attrForm.rangeMin)) {
                            setAttrForm({...attrForm, rangeMax: attrForm.rangeMin});
                          }
                        }}
                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all bg-white" 
                        placeholder="结束" 
                      />
                    </div>
                  </div>
                  )}
                </div>
                {isModbus && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="text-xs font-bold text-gray-600 mb-3">RS485 配置</div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput label="功能码" value={attrForm.funcCode} onChange={v => setAttrForm({...attrForm, funcCode: v})} placeholder="0x03" />
                    <FormInput label="起始地址" value={attrForm.startAddr} onChange={v => setAttrForm({...attrForm, startAddr: v})} placeholder="0004" />
                    <FormInput label="数据长度" value={attrForm.dataLen} onChange={v => setAttrForm({...attrForm, dataLen: v})} placeholder="1" />
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">编码公式</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={attrForm.formula} 
                          onChange={e => setAttrForm({...attrForm, formula: e.target.value})}
                          placeholder="如: R0=val/10"
                          className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all bg-white font-mono"
                        />
                        <button 
                          onClick={() => setAttrForm({...attrForm, formula: 'R0=(val*10)/4095'})}
                          className="shrink-0 bg-purple-50 text-purple-600 border border-purple-200 px-3 py-2 rounded text-xs font-medium hover:bg-purple-100 transition-colors flex items-center gap-1"
                        >
                          <Zap size={14} /> AI 生成
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                )}
                <div className="flex justify-end gap-3 mt-5">
                  <button onClick={() => setShowAttrForm(false)} className="px-4 py-1.5 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50">取消</button>
                  <button onClick={saveAttr} className="px-4 py-1.5 text-sm text-white bg-blue-500 rounded hover:bg-blue-600">保存</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {currentAttrs.map((attr: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors">
                  <div>
                    <div className="font-bold text-gray-800 text-sm mb-1 flex items-center gap-1.5">
                      <span>{attr.name}</span>
                      {attr.key && (
                        <span className="font-mono text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {attr.key}
                        </span>
                      )}
                      <span className="text-gray-400 font-normal ml-1">({attr.unit})</span>
                    </div>
                    <div className="text-xs text-gray-500 flex gap-4">
                      <span>精度: {attr.precision}位小数</span>
                      {isModbus && (
                        <>
                          <span>量程: {attr.range}</span>
                          <span>功能码: {attr.funcCode}</span>
                          <span>起始地址: {attr.startAddr}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(i)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"><Edit2 size={16}/></button>
                    <button onClick={() => removeAttr(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
              {data.modbusAttrs.length === 0 && !showAttrForm && (
                <div className="text-center py-8 text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg">暂无属性，请点击右上角新增</div>
              )}
            </div>
          </div>
        )}


        {data.protocol === '数字量' && (
          <div>
            <div className="text-sm font-bold text-gray-700 mb-3">默认接线端口</div>
            <div className="flex gap-3 mb-8">
              <Tag label="vs" /> <Tag label="gnd" /> <Tag label="signal" />
            </div>

            <div className="text-sm font-bold text-gray-700 mb-1">属性设置</div>
            <p className="text-xs text-gray-500 mb-4">数字量协议仅设定一个属性，用于模拟 0 和 1 电平逻辑输出（例如：人体传感器有人/无人）。</p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">快捷传感器模板</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: '人体红外感应', prop: '人体感应', zero: '无人', one: '有人' },
                    { label: '门磁开关', prop: '门磁状态', zero: '关闭', one: '开启' },
                    { label: '水浸探测', prop: '水浸状态', zero: '无水', one: '有水/告警' },
                    { label: '火焰检测', prop: '火焰状态', zero: '正常', one: '火警' },
                    { label: '光电对射', prop: '遮挡状态', zero: '无遮挡', one: '有遮挡' }
                  ].map(tpl => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => update({
                        digitalConfig: {
                          ...data.digitalConfig,
                          propertyName: tpl.prop,
                          zeroLabel: tpl.zero,
                          oneLabel: tpl.one
                        }
                      })}
                      className="text-xs bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 border border-gray-200 px-2.5 py-1 rounded-md transition-colors text-gray-600 cursor-pointer shadow-2xs"
                    >
                      + {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 sm:col-span-4">
                  <FormInput 
                    label="属性名称" 
                    value={data.digitalConfig?.propertyName || ''} 
                    onChange={v => update({ digitalConfig: { ...data.digitalConfig, propertyName: v } })} 
                    placeholder="如: 人体感应" 
                  />
                </div>
                <div className="col-span-12 sm:col-span-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center justify-between">
                    <span>英文标识 (Key)</span>
                    <span className="text-[10px] text-gray-400">英文/下划线, 50字内</span>
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    value={data.digitalConfig?.propertyKey || data.digitalConfig?.key || ''}
                    onChange={e => {
                      const sanitized = e.target.value.replace(/[^a-zA-Z_]/g, '').slice(0, 50);
                      update({ digitalConfig: { ...data.digitalConfig, propertyKey: sanitized, key: sanitized } });
                    }}
                    placeholder="如: human_presence"
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all bg-white font-mono"
                  />
                </div>
                <div className="col-span-12 sm:col-span-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">触发电平逻辑</label>
                  <select
                    value={data.digitalConfig?.triggerMode || '高电平有效 (Active High)'}
                    onChange={e => update({ digitalConfig: { ...data.digitalConfig, triggerMode: e.target.value } })}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all bg-white"
                  >
                    <option value="高电平有效 (Active High)">高电平有效 (Active High · 1为触发)</option>
                    <option value="低电平有效 (Active Low)">低电平有效 (Active Low · 0为触发)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <FormInput 
                    label="逻辑值 0 状态含义" 
                    value={data.digitalConfig?.zeroLabel || ''} 
                    onChange={v => update({ digitalConfig: { ...data.digitalConfig, zeroLabel: v } })} 
                    placeholder="如: 无人 / 关闭 / 正常" 
                  />
                </div>
                <div className="col-span-6">
                  <FormInput 
                    label="逻辑值 1 状态含义" 
                    value={data.digitalConfig?.oneLabel || ''} 
                    onChange={v => update({ digitalConfig: { ...data.digitalConfig, oneLabel: v } })} 
                    placeholder="如: 有人 / 开启 / 告警" 
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-md text-xs text-blue-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">二值输出定义：</span>
                  <span>0 ➔ <strong className="text-blue-700 font-bold">{data.digitalConfig?.zeroLabel || '0'}</strong></span>
                  <span className="text-blue-300">|</span>
                  <span>1 ➔ <strong className="text-blue-700 font-bold">{data.digitalConfig?.oneLabel || '1'}</strong></span>
                </div>
                <span className="text-[11px] text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-200">
                  单属性数字量
                </span>
              </div>
            </div>
          </div>
        )}

        {data.protocol === '模拟量' && (
          <div>
            <div className="text-sm font-bold text-gray-700 mb-3">默认接线端口</div>
            <div className="flex gap-3 mb-8">
              <Tag label="vs" /> <Tag label="gnd" /> <Tag label="signal" />
            </div>

            <div className="text-sm font-bold text-gray-700 mb-1">属性设置</div>
            <p className="text-xs text-gray-500 mb-4">模拟量采集单项连续物理量，请配置物理量名称、英文标识与换算区间。</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 grid grid-cols-12 gap-x-6 gap-y-5">
              <div className="col-span-6">
                <FormInput 
                  label="属性名称" 
                  value={data.analogConfig.name || ''} 
                  onChange={v => update({ analogConfig: { ...data.analogConfig, name: v } })} 
                  placeholder="如: 光照度 / 水压" 
                />
              </div>
              <div className="col-span-6">
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center justify-between">
                  <span>英文标识 (Key)</span>
                  <span className="text-[10px] text-gray-400">英文/下划线, 50字内</span>
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={data.analogConfig.key || ''}
                  onChange={e => {
                    const sanitized = e.target.value.replace(/[^a-zA-Z_]/g, '').slice(0, 50);
                    update({ analogConfig: { ...data.analogConfig, key: sanitized } });
                  }}
                  placeholder="如: light_intensity"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all bg-white font-mono"
                />
              </div>

              <div className="col-span-6">
                <label className="block text-xs font-medium text-gray-500 mb-2">信号类型</label>
                <div className="flex gap-3">
                  <RadioBox label="电压" active={data.analogConfig.type === '电压'} onClick={() => update({ analogConfig: { ...data.analogConfig, type: '电压' } })} />
                  <RadioBox label="电流" active={data.analogConfig.type === '电流'} onClick={() => update({ analogConfig: { ...data.analogConfig, type: '电流' } })} />
                </div>
              </div>
              <div className="col-span-6">
                <FormInput label="量程" value={data.analogConfig.range} onChange={v => update({ analogConfig: { ...data.analogConfig, range: v } })} placeholder="如: 0-24" />
              </div>
              <div className="col-span-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">单位</label>
                <input 
                  type="text" 
                  list="analog-unit-options" 
                  value={data.analogConfig.unit} 
                  onChange={e => update({ analogConfig: { ...data.analogConfig, unit: e.target.value } })} 
                  placeholder="如: V" 
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all bg-white" 
                />
                <datalist id="analog-unit-options">
                  <option value="℃" />
                  <option value="%" />
                  <option value="Lux" />
                  <option value="V" />
                  <option value="A" />
                  <option value="mA" />
                  <option value="W" />
                  <option value="m" />
                  <option value="ppm" />
                </datalist>
              </div>
              <div className="col-span-4">
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center">精度 <span className="text-gray-400 font-normal ml-1">(小数位)</span></label>
                <input 
                  type="number" 
                  min="0"
                  max="6"
                  value={data.analogConfig.precision ?? '0'} 
                  onChange={e => update({ analogConfig: { ...data.analogConfig, precision: e.target.value } })} 
                  placeholder="小数位" 
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all bg-white" 
                />
              </div>
              <div className="col-span-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">区间范围</label>
                <div className="flex items-center gap-2">
                  <input type="text" value={data.analogConfig.min} onChange={e => update({ analogConfig: { ...data.analogConfig, min: e.target.value } })} className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all" placeholder="Min" />
                  <span className="text-gray-400">-</span>
                  <input type="text" value={data.analogConfig.max} onChange={e => update({ analogConfig: { ...data.analogConfig, max: e.target.value } })} className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all" placeholder="Max" />
                </div>
              </div>
            </div>
          </div>
        )}

        
      </div>
    </div>
  );
}

function StepConfirm({ data, update }: { data: any; update: (fields: any) => void }) {
  const isActuator = data.type === '执行器';
  const isSensor = data.type === '传感器';
  const isGateway = data.type === '网关';

  // 执行器状态切换预览
  const [actuatorState, setActuatorState] = useState<'on' | 'off'>('on');
  // 数字量模拟电平
  const [digitalSimVal, setDigitalSimVal] = useState<'0' | '1'>('0');
  // 悬浮查看实时属性气泡
  const [showAttrTooltip, setShowAttrTooltip] = useState(false);

  // 获取当前展示图片
  const getDisplayImage = () => {
    if (isActuator) {
      if (actuatorState === 'on') return data.onImage || data.image || '/device/RS485_WaterPump_Thumbnail.png';
      return data.offImage || data.image || '/device/RS485_WaterPump_Thumbnail.png';
    }
    if (data.image) return data.image;
    if (isSensor) {
      if (data.protocol === '模拟量') return '/device/RS485_AirPressure_Thumbnail.png';
      if (data.protocol === '数字量') return '/device/RS485_WaterLevel_Thumbnail.png';
      return '/device/RS485_Humiture_Thumbnail.png';
    }
    if (isGateway) return '/device/UsrG771Gateway_Thumbnail.png';
    return '/device/RS485_Humiture_Thumbnail.png';
  };

  // 根据协议与设备类型，推导与实际设计器一致的副标题与端口引脚
  const getNodeProps = () => {
    let subtitle = '标准设备';
    let ports: string[] = [];
    let portTitles: string[] = [];

    if (isSensor) {
      if (data.protocol === 'ModbusRTU') {
        subtitle = 'RS485 / Modbus';
        ports = ['red', 'black', 'blue', 'green'];
        portTitles = ['VS (电源正)', 'GND (电源地)', 'RS485-A (差分正)', 'RS485-B (差分负)'];
      } else if (data.protocol === '数字量') {
        subtitle = '数字量 / 0-1电平';
        ports = ['red', 'black', 'blue'];
        portTitles = ['VS (电源正)', 'GND (电源地)', 'SIGNAL (数字逻辑)'];
      } else if (data.protocol === '模拟量') {
        subtitle = `模拟量 / ${data.analogConfig?.type || '电压型'}`;
        ports = ['red', 'black', 'blue'];
        portTitles = ['VS (电源正)', 'GND (电源地)', 'SIGNAL (模拟信号)'];
      } else if (data.protocol === 'Zigbee') {
        subtitle = 'Zigbee 无线透传';
        ports = [];
        portTitles = [];
      }
    } else if (isActuator) {
      if (data.powerType === '交流') {
        subtitle = `AC ${data.acVoltage || '220V'} 控制`;
        ports = ['yellow', 'blue'];
        portTitles = ['L (火线)', 'N (零线)'];
      } else {
        subtitle = `DC ${data.dcVoltage || '12V'} 开关控制`;
        ports = ['red', 'black'];
        portTitles = ['VS (+)', 'GND (-)'];
      }
    } else if (isGateway) {
      subtitle = 'MQTT / 4G LTE';
      ports = ['red', 'black', 'blue', 'green', 'yellow'];
      portTitles = ['VCC', 'GND', 'RS485-A', 'RS485-B', 'ANT'];
    }

    return { subtitle, ports, portTitles };
  };

  const { subtitle, ports, portTitles } = getNodeProps();

  // 提取设备的实时属性列表用于 Hover 弹窗
  const getDeviceAttributes = () => {
    if (isSensor) {
      if (data.protocol === 'ModbusRTU') {
        return (data.modbusAttrs && data.modbusAttrs.length > 0)
          ? data.modbusAttrs.map((a: any, idx: number) => ({
              name: a.name || `属性 ${idx + 1}`,
              key: a.key || 'temperature',
              value: idx === 0 ? '25.6' : (idx === 1 ? '58.2' : '10.0'),
              unit: a.unit || '℃'
            }))
          : [{ name: '温度', key: 'temperature', value: '25.6', unit: '℃' }];
      }
      if (data.protocol === '模拟量') {
        return [{
          name: data.analogConfig?.name || '物理量采集',
          key: data.analogConfig?.key || 'analog_value',
          value: '12.50',
          unit: data.analogConfig?.unit || 'V'
        }];
      }
      if (data.protocol === '数字量') {
        return [{
          name: data.digitalConfig?.propertyName || '人体感应',
          key: data.digitalConfig?.propertyKey || data.digitalConfig?.key || 'human_presence',
          value: digitalSimVal === '1' ? `1 [${data.digitalConfig?.oneLabel || '有人'}]` : `0 [${data.digitalConfig?.zeroLabel || '无人'}]`,
          unit: '电平'
        }];
      }
      if (data.protocol === 'Zigbee') {
        return (data.zigbeeAttrs || []).map((a: any) => ({
          name: a.name,
          key: a.key || 'zigbee_val',
          value: '36.8',
          unit: a.unit || ''
        }));
      }
    } else if (isActuator) {
      return [{
        name: '动作开关状态',
        key: 'switch_state',
        value: actuatorState === 'on' ? '1 (运行/开启)' : '0 (停止/关闭)',
        unit: '状态'
      }];
    }
    return [];
  };

  const attributes = getDeviceAttributes();
  const hasAttributes = attributes.length > 0;

  const bgMap: Record<string, string> = {
    red: 'bg-red-500',
    black: 'bg-gray-800',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-400'
  };

  const getProtocolColor = (proto: string) => {
    const p = (proto || '').toLowerCase();
    if (p.includes('modbus')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (p.includes('模拟')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (p.includes('数字')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (p.includes('zigbee')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* 标题 */}
      <div>
        <h4 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Shield size={20} className="text-green-500" />
          确认配置信息
        </h4>
        <p className="text-sm text-gray-500">
          最上方仿真画布呈现设备在设计器中的<strong>真实拓扑节点形态（所见即所得）</strong>。若设备包含属性，右上角带有<strong>属性查看小图标</strong>，鼠标移动上去可即时查看实时属性值。
        </p>
      </div>

      {/* 1. 顶部真实设计界面仿真画布 (与实际设计器画布 100% 一致) */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-white">
        {/* 画布顶部工具栏 */}
        <div className="px-4 py-2 bg-[#f8f9fa] border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Layers size={14} className="text-blue-500" />
              设计器拓扑仿真画布预览
            </span>
            <span className="text-[11px] text-gray-400">（与实际设计界面完全一致 · 所见即所得）</span>
          </div>

          <div className="flex items-center gap-2">
            {isActuator && (
              <button
                type="button"
                onClick={() => setActuatorState(s => s === 'on' ? 'off' : 'on')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border ${
                  actuatorState === 'on'
                    ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600'
                    : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                }`}
                title="点击实时切换运行/停止状态贴图"
              >
                {actuatorState === 'on' ? <Play size={11} fill="currentColor" /> : <Square size={11} fill="currentColor" />}
                <span>{actuatorState === 'on' ? '预览: 运行状态 (ON)' : '预览: 停止状态 (OFF)'}</span>
              </button>
            )}

            {isSensor && data.protocol === '数字量' && (
              <button
                type="button"
                onClick={() => setDigitalSimVal(v => v === '0' ? '1' : '0')}
                className="px-2.5 py-1 rounded text-xs font-semibold bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                title="点击测试 0 / 1 仿真输出状态切换"
              >
                <Zap size={12} />
                <span>电平模拟: <strong>{digitalSimVal}</strong> ({digitalSimVal === '0' ? (data.digitalConfig?.zeroLabel || '无人') : (data.digitalConfig?.oneLabel || '有人')})</span>
              </button>
            )}

            <span className="text-[10px] bg-white text-gray-500 px-2 py-0.5 rounded border border-gray-200 font-mono">
              网格 20px · 100%
            </span>
          </div>
        </div>

        {/* 实际设计界面的网格背景画布 */}
        <div className="min-h-[230px] p-6 bg-white bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:20px_20px] flex items-center justify-center relative">
          {/* 仿真节点实体：与实际设计界面 DraggableNode 样式 100% 一致 */}
          <div className="border border-gray-300 shadow-md bg-white rounded flex flex-col items-center z-10 w-[140px] select-none hover:shadow-xl transition-shadow relative">
            {/* 节点顶部标题栏 */}
            <div className="w-full px-2 py-1.5 text-[11px] font-medium text-center border-b border-gray-200 rounded-t bg-gray-100 flex items-center justify-between relative">
              <span className="truncate flex-1 text-center text-gray-900 font-bold px-1" title={data.name || '未命名设备'}>
                {data.name || '未命名设备'}
              </span>

              {/* 关键功能：查看属性的小图标，鼠标悬浮查看实时属性值 */}
              {hasAttributes && (
                <div 
                  className="relative shrink-0"
                  onMouseEnter={() => setShowAttrTooltip(true)}
                  onMouseLeave={() => setShowAttrTooltip(false)}
                >
                  <div 
                    className="w-4 h-4 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                    title="鼠标悬浮查看实时属性"
                  >
                    <Activity size={11} className="text-blue-600 animate-pulse" />
                  </div>

                  {/* 鼠标移动上去弹出的实时属性值浮层气泡 */}
                  {showAttrTooltip && (
                    <div className="absolute left-full top-0 ml-2.5 z-50 w-60 bg-slate-900/95 text-white backdrop-blur-md rounded-xl shadow-2xl border border-slate-700/80 p-3 text-xs animate-in fade-in zoom-in-95 pointer-events-none text-left font-sans">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                        <span className="font-bold text-[11px] text-slate-200 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          实时属性监控
                        </span>
                        <span className="text-[9px] text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.5 rounded font-mono font-semibold">
                          ONLINE
                        </span>
                      </div>
                      
                      <div className="space-y-1.5">
                        {attributes.map((attr: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-800/80 px-2 py-1.5 rounded-lg border border-slate-700/50 text-[11px]">
                            <div className="flex flex-col min-w-0 pr-1">
                              <span className="text-slate-200 font-medium truncate">{attr.name}</span>
                              {attr.key && <span className="text-[9px] text-blue-400 font-mono">{attr.key}</span>}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono font-bold text-amber-300 text-xs">{attr.value}</span>
                              {attr.unit && attr.unit !== '状态' && attr.unit !== '电平' && (
                                <span className="text-[10px] text-slate-400 ml-1">{attr.unit}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex justify-between items-center text-[9px] text-slate-400">
                        <span>刷新周期: 1000ms</span>
                        <span className="text-cyan-400 font-mono">仿真数据源正常</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 节点中间设备贴图与副标题 */}
            <div className="p-3 flex flex-col items-center w-full">
              <div className="w-14 h-14 flex items-center justify-center">
                <img 
                  src={getDisplayImage()} 
                  alt={data.name} 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="text-[9px] text-gray-500 mt-2 text-center leading-tight whitespace-pre-line bg-gray-50 px-2 py-0.5 rounded max-w-[125px] truncate border border-gray-100 font-mono">
                {subtitle}
              </div>
            </div>

            {/* 节点底部端子圆点 (与实际设计界面一致) */}
            {ports && ports.length > 0 && (
              <div className="flex justify-around w-full pb-1.5 px-2 gap-1.5 border-t border-gray-100 pt-1.5 bg-gray-50 rounded-b">
                {ports.map((color: string, i: number) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full ${bgMap[color] || 'bg-gray-300'} border-[1.5px] border-white shadow-xs ring-1 ring-gray-300`}
                    title={portTitles[i] || color}
                  ></div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. 整理后的规格参数详情卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 卡片 1: 基础参数与供电规格 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-2 border-b border-gray-100 flex items-center gap-1.5">
            <Info size={14} className="text-blue-500" />
            基础规格与供电
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">设备名称</span>
              <span className="font-bold text-gray-800">{data.name || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">设备类型</span>
              <span className="font-semibold text-gray-700">{data.type}</span>
            </div>
            {!isGateway && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">供电方式</span>
                  <span className="font-semibold text-gray-800">{data.powerType}</span>
                </div>
                {data.powerType !== '无需供电' && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">额定工作电压</span>
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {data.powerType === '交流' ? (data.acVoltage === '自定义' ? `${data.customAcVal}V` : data.acVoltage) : (data.dcVoltage === '自定义' ? `${data.customDcVal}V` : data.dcVoltage)}
                    </span>
                  </div>
                )}
              </>
            )}
            {isGateway && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">网关类型</span>
                <span className="font-semibold text-gray-800">{data.gatewayType}</span>
              </div>
            )}
          </div>
        </div>

        {/* 卡片 2: 通讯接口与接线引脚 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-2 border-b border-gray-100 flex items-center gap-1.5">
            <Terminal size={14} className="text-emerald-500" />
            通讯接口与接线引脚
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">通讯协议</span>
              <span className={`font-bold text-xs px-2 py-0.5 rounded border ${getProtocolColor(data.protocol)}`}>
                {isSensor ? data.protocol : (isActuator ? '开关量控制' : data.gatewayType)}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-500 pt-1">系统分配引脚</span>
              <div className="flex gap-1.5 flex-wrap justify-end">
                {isSensor && (data.protocol === '数字量' || data.protocol === '模拟量') && (
                  <><Tag label="vs" /><Tag label="gnd" /><Tag label="signal" /></>
                )}
                {isSensor && data.protocol === 'ModbusRTU' && (
                  <><Tag label="rs485A" /><Tag label="rs485B" /><Tag label="vs" /><Tag label="gnd" /></>
                )}
                {isSensor && data.protocol === 'Zigbee' && (
                  <span className="text-gray-400">无线透传 (无物理端口)</span>
                )}
                {isActuator && (
                  data.powerType === '直流' ? (
                    <><Tag label="vs" /><Tag label="gnd" /></>
                  ) : <Tag label="power" />
                )}
                {isGateway && <span className="text-gray-400">标准网络通信端口</span>}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">物理端子数</span>
              <span className="font-mono text-gray-700">
                {isSensor && (data.protocol === '数字量' || data.protocol === '模拟量') ? '3 端子 (三线制)' : (data.protocol === 'ModbusRTU' ? '4 端子 (RS485)' : '无物理端子')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 卡片 3: 遥测属性与参数定义规范 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs space-y-3">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-2 border-b border-gray-100 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Zap size={14} className="text-amber-500" />
            遥测属性与数据解析规范
          </span>
          <span className="text-[11px] font-normal text-gray-400">
            {isSensor ? `已配置 ${data.protocol} 协议参数` : (isActuator ? '执行器动作贴图规格' : '网关配置')}
          </span>
        </div>

        {/* Modbus 属性 */}
        {isSensor && data.protocol === 'ModbusRTU' && (
          <div className="space-y-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 text-[11px]">
                  <tr>
                    <th className="py-2 px-3 font-semibold">属性名称</th>
                    <th className="py-2 px-3 font-semibold">英文标识 (Key)</th>
                    <th className="py-2 px-3 font-semibold">单位</th>
                    <th className="py-2 px-3 font-semibold">精度</th>
                    <th className="py-2 px-3 font-semibold">量程</th>
                    <th className="py-2 px-3 font-semibold">功能码</th>
                    <th className="py-2 px-3 font-semibold">起始地址</th>
                    <th className="py-2 px-3 font-semibold">换算公式</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.modbusAttrs.map((a: any, i: number) => (
                    <tr key={i} className="hover:bg-blue-50/30">
                      <td className="py-2 px-3 font-medium text-gray-900">{a.name}</td>
                      <td className="py-2 px-3 font-mono text-blue-600 font-semibold">{a.key || '-'}</td>
                      <td className="py-2 px-3 text-gray-600">{a.unit}</td>
                      <td className="py-2 px-3 text-gray-600">{a.precision || '0'} 位</td>
                      <td className="py-2 px-3 text-gray-600">{a.range || '-'}</td>
                      <td className="py-2 px-3 font-mono text-emerald-600">{a.funcCode || '0x03'}</td>
                      <td className="py-2 px-3 font-mono text-gray-700">{a.startAddr || '0004'}</td>
                      <td className="py-2 px-3 font-mono text-purple-700">{a.formula || 'RAW/10'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.modbusAttrs.length === 0 && (
              <div className="text-center py-4 text-xs text-gray-400">暂无属性</div>
            )}
          </div>
        )}

        {/* 数字量属性 */}
        {isSensor && data.protocol === '数字量' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col gap-1">
              <span className="text-gray-400 text-[11px]">检测属性名称</span>
              <span className="font-bold text-gray-800">{data.digitalConfig?.propertyName || '人体感应'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col gap-1">
              <span className="text-gray-400 text-[11px]">英文标识 (Key)</span>
              <span className="font-mono font-bold text-blue-600">{data.digitalConfig?.propertyKey || data.digitalConfig?.key || 'human_presence'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col gap-1">
              <span className="text-gray-400 text-[11px]">触发电平逻辑</span>
              <span className="font-semibold text-gray-700">{data.digitalConfig?.triggerMode || '高电平有效'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col gap-1">
              <span className="text-gray-400 text-[11px]">二值状态映射</span>
              <span className="font-semibold text-emerald-700">0: {data.digitalConfig?.zeroLabel || '正常'} | 1: {data.digitalConfig?.oneLabel || '告警'}</span>
            </div>
          </div>
        )}

        {/* 模拟量属性 */}
        {isSensor && data.protocol === '模拟量' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col gap-1">
              <span className="text-gray-400 text-[11px]">物理量名称</span>
              <span className="font-bold text-gray-800">{data.analogConfig?.name || '物理量采集'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col gap-1">
              <span className="text-gray-400 text-[11px]">英文标识 (Key)</span>
              <span className="font-mono font-bold text-blue-600">{data.analogConfig?.key || 'analog_value'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col gap-1">
              <span className="text-gray-400 text-[11px]">信号类型与量程</span>
              <span className="font-semibold text-gray-700">{data.analogConfig?.type} ({data.analogConfig?.range}{data.analogConfig?.unit})</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col gap-1">
              <span className="text-gray-400 text-[11px]">量程区间映射</span>
              <span className="font-mono font-semibold text-amber-700">{data.analogConfig?.min} ~ {data.analogConfig?.max} {data.analogConfig?.unit}</span>
            </div>
          </div>
        )}

        {/* Zigbee 属性 */}
        {isSensor && data.protocol === 'Zigbee' && (
          <div className="space-y-2">
            {data.zigbeeAttrs && data.zigbeeAttrs.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 text-xs">
                {data.zigbeeAttrs.map((a: any, i: number) => (
                  <div key={i} className="bg-gray-50 p-2.5 rounded border border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-800">{a.name}</span>
                      {a.key && <span className="font-mono text-blue-600 ml-1.5">({a.key})</span>}
                    </div>
                    <span className="text-gray-500 font-mono">{a.unit} · {a.precision || '0'}位小数</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-gray-400">暂无属性</div>
            )}
          </div>
        )}

        {/* 执行器贴图对比 */}
        {isActuator && (
          <div className="grid grid-cols-2 gap-4 text-xs pt-1">
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0">
                <img src={data.onImage || data.image || '/device/RS485_WaterPump_Thumbnail.png'} alt="开" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="font-bold text-gray-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 运行 / 开状态贴图
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">{data.onImage ? '已上传专属贴图' : '使用默认缩略图'}</div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0">
                <img src={data.offImage || data.image || '/device/RS485_WaterPump_Thumbnail.png'} alt="关" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="font-bold text-gray-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span> 停止 / 关状态贴图
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">{data.offImage ? '已上传专属贴图' : '使用默认缩略图'}</div>
              </div>
            </div>
          </div>
        )}

        {/* 网关 */}
        {isGateway && (
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
            网关将作为拓扑中的中心采集路由节点，支持对下挂 Modbus / 模拟量 / 数字量设备进行统一透传上报。
          </div>
        )}
      </div>

      {/* 4. 发布状态选项 */}
      <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="publish_checkbox"
            checked={Boolean(data.publishToSimulation)}
            onChange={e => update({ publishToSimulation: e.target.checked })}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-400 border-gray-300 cursor-pointer"
          />
          <label htmlFor="publish_checkbox" className="text-xs text-gray-700 cursor-pointer">
            <span className="font-bold text-gray-800">同步发布至公共仿真设备大厅</span>
            <span className="block text-gray-500 mt-0.5">勾选后该设备将出现在“仿真设备中心”，其他用户仅可见不可编辑，支持添加到仿真拓扑中。</span>
          </label>
        </div>
        <span className="text-[11px] font-semibold text-blue-600 bg-white px-2.5 py-1 rounded-md border border-blue-200 shrink-0">
          创建者: 杨振邦
        </span>
      </div>
    </div>
  );
}