import React, { useState, useEffect } from 'react';
import { X, UploadCloud, Check, Plus, Edit2, Trash2, Shield, Settings, Info, Zap } from 'lucide-react';

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
      { name: '温度', unit: '℃', range: '0-100', funcCode: '0x03', startAddr: '0004', dataLen: '1', formula: 'R0=val/10' }
    ],
    analogConfig: { type: '电压', range: '0-24', unit: 'V', min: '0', max: '10', precision: '0' },
    
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
            { name: '温度', unit: '℃', range: '0-100', funcCode: '0x03', startAddr: '0004', dataLen: '1', formula: 'R0=val/10' }
          ],
          analogConfig: initialData.analogConfig || { type: '电压', range: '0-24', unit: 'V', min: '0', max: '10', precision: '0' },
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
            { name: '温度', unit: '℃', range: '0-100', funcCode: '0x03', startAddr: '0004', dataLen: '1', formula: 'R0=val/10' }
          ],
          analogConfig: { type: '电压', range: '0-24', unit: 'V', min: '0', max: '10', precision: '0' },
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
      <div className="bg-white rounded-xl shadow-2xl w-[900px] h-[85vh] max-h-[850px] flex flex-col overflow-hidden">
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
  const defaultAttr = { name: '', unit: '', precision: '0', rangeMin: '', rangeMax: '', funcCode: '', startAddr: '', dataLen: '', formula: '' };
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
    if (!attrForm.name) return;
    const newAttrs = [...currentAttrs];
    let finalAttr = { name: attrForm.name, unit: attrForm.unit, precision: attrForm.precision || '0' };
    
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
          {['ModbusRTU', '模拟量', 'Zigbee'].map(p => (
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
                    <FormInput label="属性名" value={attrForm.name} onChange={v => setAttrForm({...attrForm, name: v})} placeholder="如: 温度" />
                  </div>
                  <div className="col-span-3">
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
                    <label className="block text-xs font-medium text-gray-500 mb-1">精度</label>
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
                  <div className="col-span-4">
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
                    <div className="font-bold text-gray-800 text-sm mb-1">{attr.name} <span className="text-gray-400 font-normal ml-1">({attr.unit})</span></div>
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

        {data.protocol === '模拟量' && (
          <div>
            <div className="text-sm font-bold text-gray-700 mb-3">默认接线端口</div>
            <div className="flex gap-3 mb-8">
              <Tag label="vs" /> <Tag label="gnd" /> <Tag label="signal" />
            </div>

            <div className="text-sm font-bold text-gray-700 mb-4">属性设置</div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 grid grid-cols-12 gap-x-6 gap-y-5">
              <div className="col-span-6">
                <label className="block text-xs font-medium text-gray-500 mb-2">类型</label>
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h4 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Shield size={20} className="text-green-500" />
          确认配置信息
        </h4>
        <p className="text-sm text-gray-500">请核对以下设备配置，确认无误后点击生成。</p>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg divide-y divide-gray-200">
        {/* Basic */}
        <div className="p-5">
          <div className="text-xs font-bold text-gray-400 uppercase mb-4">基础信息</div>
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-gray-500 text-sm">设备名称：</span> <span className="text-gray-800 font-medium text-sm">{data.name || '-'}</span></div>
            <div><span className="text-gray-500 text-sm">设备类型：</span> <span className="text-gray-800 font-medium text-sm">{data.type}</span></div>
            <div><span className="text-gray-500 text-sm">封面图片：</span> <span className="text-blue-500 font-medium text-sm">{data.image ? '已上传' : '未上传'}</span></div>
          </div>
        </div>

        {/* Power */}
        {!isGateway && (
        <div className="p-5">
          <div className="text-xs font-bold text-gray-400 uppercase mb-4">供电设置</div>
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-gray-500 text-sm">供电方式：</span> <span className="text-gray-800 font-medium text-sm">{data.powerType}</span></div>
            {data.powerType !== '无需供电' && (
              <div>
                <span className="text-gray-500 text-sm">电压大小：</span> 
                <span className="text-gray-800 font-medium text-sm">
                  {data.powerType === '交流' ? (data.acVoltage === '自定义' ? `${data.customAcVal}V` : data.acVoltage) : (data.dcVoltage === '自定义' ? `${data.customDcVal}V` : data.dcVoltage)}
                </span>
              </div>
            )}
          </div>
        </div>

        )}

        {/* Actuator Specific */}
        {isActuator && (
          <div className="p-5">
            <div className="text-xs font-bold text-gray-400 uppercase mb-4">扩展配置</div>
            <div className="space-y-4">
              <div>
                <span className="text-gray-500 text-sm mb-2 block">系统分配端口：</span> 
                <div className="flex gap-2">
                  {data.powerType === '直流' ? (
                    <><Tag label="vs" /><Tag label="gnd" /></>
                  ) : data.powerType === '交流' ? (
                    <Tag label="power" />
                  ) : <span className="text-sm text-gray-400">无</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div><span className="text-gray-500 text-sm">开状态图片：</span> <span className="text-blue-500 font-medium text-sm">{data.onImage ? '已设置' : '未上传'}</span></div>
                <div><span className="text-gray-500 text-sm">关状态图片：</span> <span className="text-blue-500 font-medium text-sm">{data.offImage ? '已设置' : '未上传'}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Sensor Specific */}
        {isSensor && (
          <div className="p-5">
            <div className="text-xs font-bold text-gray-400 uppercase mb-4">协议及属性</div>
            <div className="space-y-4">
              <div><span className="text-gray-500 text-sm">设备协议：</span> <span className="text-blue-600 font-bold text-sm bg-blue-50 px-2 py-1 rounded">{data.protocol}</span></div>
              
              {data.protocol === 'ModbusRTU' && (
                <>
                  <div>
                    <span className="text-gray-500 text-sm mb-2 block">系统分配端口：</span> 
                    <div className="flex gap-2"><Tag label="rs485A" /><Tag label="rs485B" /><Tag label="vs" /><Tag label="gnd" /></div>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm mb-2 block">采集属性 ({data.modbusAttrs.length})：</span> 
                    <div className="bg-white border border-gray-200 rounded p-3 text-sm text-gray-600">
                      {data.modbusAttrs.map((a: any, i: number) => (
                         <div key={i} className="mb-1 last:mb-0">
                           <strong className="text-gray-800">{a.name}</strong> ({a.unit}) - 精度: {a.precision || '0'}, 量程: {a.range}, 地址: {a.startAddr}
                         </div>
                      ))}
                      {data.modbusAttrs.length === 0 && <span className="text-gray-400">暂无属性</span>}
                    </div>
                  </div>
                </>
              )}

              {data.protocol === '模拟量' && (
                <>
                  <div>
                    <span className="text-gray-500 text-sm mb-2 block">系统分配端口：</span> 
                    <div className="flex gap-2"><Tag label="vs" /><Tag label="gnd" /><Tag label="signal" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-gray-500 text-sm">信号类型：</span> <span className="text-gray-800 font-medium text-sm">{data.analogConfig.type}</span></div>
                    <div><span className="text-gray-500 text-sm">量程范围：</span> <span className="text-gray-800 font-medium text-sm">{data.analogConfig.range}{data.analogConfig.unit}</span></div>
                    <div><span className="text-gray-500 text-sm">精度设置：</span> <span className="text-gray-800 font-medium text-sm">保留 {data.analogConfig.precision ?? '0'} 位小数</span></div>
                    <div className="col-span-2"><span className="text-gray-500 text-sm">区间映射：</span> <span className="text-gray-800 font-medium text-sm">{data.analogConfig.min} ~ {data.analogConfig.max}</span></div>
                  </div>
                </>
              )}

              {data.protocol === 'Zigbee' && (
                <>
                  <div>
                    <span className="text-gray-500 text-sm mb-2 block">无线协议：</span> 
                    <div className="text-sm text-gray-800">透传模式，无物理端口</div>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm mb-2 block">采集属性 ({data.zigbeeAttrs?.length || 0})：</span> 
                    <div className="bg-white border border-gray-200 rounded p-3 text-sm text-gray-600">
                      {data.zigbeeAttrs?.map((a: any, i: number) => (
                         <div key={i} className="mb-1 last:mb-0">
                           <strong className="text-gray-800">{a.name}</strong> ({a.unit}) - 精度: {a.precision || '0'}
                         </div>
                      ))}
                      {(!data.zigbeeAttrs || data.zigbeeAttrs.length === 0) && <span className="text-gray-400">暂无属性</span>}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Gateway Specific */}
        {isGateway && (
          <div className="p-5">
            <div className="text-xs font-bold text-gray-400 uppercase mb-4">网关配置</div>
            <div className="space-y-4">
              <div><span className="text-gray-500 text-sm">网关类型：</span> <span className="text-gray-800 font-medium text-sm">{data.gatewayType}</span></div>
              <div>
                <span className="text-gray-500 text-sm mb-2 block">系统分配端口：</span> 
                <div className="flex gap-2">
                  {data.gatewayType === '云平台网关' ? (
                    <><Tag label="rs485a" /><Tag label="rs485b" /><Tag label="network" /><Tag label="power" /></>
                  ) : (
                    <><Tag label="rs485a" /><Tag label="rs485b" /><Tag label="vs" /><Tag label="gnd" /></>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Publish Option */}
        <div className="p-5 bg-gradient-to-r from-blue-50/70 to-indigo-50/40">
          <div className="flex items-start gap-3.5">
            <div className="pt-0.5">
              <input
                type="checkbox"
                id="publishToSimulationCheckbox"
                checked={data.publishToSimulation || false}
                onChange={(e) => update({ publishToSimulation: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
              />
            </div>
            <label htmlFor="publishToSimulationCheckbox" className="cursor-pointer select-none">
              <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
                是否发布到仿真设备
                {data.publishToSimulation && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200">公开共享</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                发布后可以被其他用户查看和复制，共同构建开源设备库生态。
              </p>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
