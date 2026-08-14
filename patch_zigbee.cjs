const fs = require('fs');
const path = './src/components/AddCustomDeviceModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Initial State
const targetInit = `    modbusAttrs: [
      { name: '温度', unit: '℃', range: '0-100', funcCode: '0x03', startAddr: '0004', dataLen: '1', formula: 'R0=val/10', precision: '1' }
    ],
    analogConfig: { type: '电压', range: '0-24', unit: 'V', min: '0', max: '10', precision: '0' }`;
const replaceInit = `    modbusAttrs: [
      { name: '温度', unit: '℃', range: '0-100', funcCode: '0x03', startAddr: '0004', dataLen: '1', formula: 'R0=val/10', precision: '1' }
    ],
    zigbeeAttrs: [
      { name: '状态', unit: '', precision: '0' }
    ],
    analogConfig: { type: '电压', range: '0-24', unit: 'V', min: '0', max: '10', precision: '0' }`;
content = content.replace(targetInit, replaceInit);

// 2. Protocols array mapping
const targetMap = `{['ModbusRTU', '模拟量', 'Zigbee', '蓝牙', 'Lora'].map(p => (`;
const replaceMap = `{['ModbusRTU', '模拟量', 'Zigbee'].map(p => (`;
content = content.replace(targetMap, replaceMap);

// 3. Update Step3SensorProtocol definitions
const targetStep3Def = `function Step3SensorProtocol({ data, update }: { data: any, update: any }) {
  const [showAttrForm, setShowAttrForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const defaultAttr = { name: '', unit: '', precision: '0', rangeMin: '', rangeMax: '', funcCode: '', startAddr: '', dataLen: '', formula: '' };
  const [attrForm, setAttrForm] = useState(defaultAttr);

  const openAdd = () => {
    setAttrForm(defaultAttr);
    setEditingIndex(-1);
    setShowAttrForm(true);
  };
  
  const openEdit = (index: number) => {
    const attr = data.modbusAttrs[index];`;
const replaceStep3Def = `function Step3SensorProtocol({ data, update }: { data: any, update: any }) {
  const [showAttrForm, setShowAttrForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const defaultAttr = { name: '', unit: '', precision: '0', rangeMin: '', rangeMax: '', funcCode: '', startAddr: '', dataLen: '', formula: '' };
  const [attrForm, setAttrForm] = useState(defaultAttr);

  const isModbus = data.protocol === 'ModbusRTU';
  const isZigbee = data.protocol === 'Zigbee';
  const currentAttrs = isModbus ? data.modbusAttrs : data.zigbeeAttrs;
  
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
    const attr = currentAttrs[index];`;
content = content.replace(targetStep3Def, replaceStep3Def);


const targetRemoveAttr = `  const removeAttr = (index: number) => {
    const newAttrs = data.modbusAttrs.filter((_: any, i: number) => i !== index);
    update({ modbusAttrs: newAttrs });
  };`;
const replaceRemoveAttr = `  const removeAttr = (index: number) => {
    const newAttrs = currentAttrs.filter((_: any, i: number) => i !== index);
    setCurrentAttrs(newAttrs);
  };`;
content = content.replace(targetRemoveAttr, replaceRemoveAttr);


const targetSaveAttr = `  const saveAttr = () => {
    if (!attrForm.name) return;
    const newAttrs = [...data.modbusAttrs];
    const finalAttr = { ...attrForm, range: \`\${attrForm.rangeMin}-\${attrForm.rangeMax}\` };
    delete (finalAttr as any).rangeMin;
    delete (finalAttr as any).rangeMax;
    // ensure precision defaults to '0' if empty
    finalAttr.precision = finalAttr.precision || '0';
    if (editingIndex >= 0) newAttrs[editingIndex] = finalAttr;
    else newAttrs.push(finalAttr);
    update({ modbusAttrs: newAttrs });
    setShowAttrForm(false);
  };`;
const replaceSaveAttr = `  const saveAttr = () => {
    if (!attrForm.name) return;
    const newAttrs = [...currentAttrs];
    let finalAttr = { name: attrForm.name, unit: attrForm.unit, precision: attrForm.precision || '0' };
    
    if (isModbus) {
      finalAttr = {
        ...finalAttr,
        range: \`\${attrForm.rangeMin}-\${attrForm.rangeMax}\`,
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
  };`;
content = content.replace(targetSaveAttr, replaceSaveAttr);


const targetModbusRender = `{data.protocol === 'ModbusRTU' && (
          <div>
            <div className="text-sm font-bold text-gray-700 mb-3">默认接线端口</div>
            <div className="flex gap-3 mb-8">
              <Tag label="rs485A" /> <Tag label="rs485B" /> <Tag label="vs" /> <Tag label="gnd" />
            </div>`;
const replaceModbusRender = `{(isModbus || isZigbee) && (
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
            )}`;
content = content.replace(targetModbusRender, replaceModbusRender);


const targetGridCols4 = `                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">量程设置</label>`;
const replaceGridCols4 = `                  {isModbus && (
                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">量程设置</label>`;
content = content.replace(targetGridCols4, replaceGridCols4);

const targetGridEnd = `                      />
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="text-xs font-bold text-gray-600 mb-3">RS485 配置</div>`;
const replaceGridEnd = `                      />
                    </div>
                  </div>
                  )}
                </div>
                {isModbus && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="text-xs font-bold text-gray-600 mb-3">RS485 配置</div>`;
content = content.replace(targetGridEnd, replaceGridEnd);


const targetAIEnd = `                        </button>
                      </div>
                    </div>
                  </div>
                </div>`;
const replaceAIEnd = `                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                )}`;
content = content.replace(targetAIEnd, replaceAIEnd);

const targetMap2 = `{data.modbusAttrs.map((attr: any, i: number) => (`;
const replaceMap2 = `{currentAttrs.map((attr: any, i: number) => (`;
content = content.replace(targetMap2, replaceMap2);

const targetListItems = `                      <span>精度: {attr.precision}位小数</span>
                      <span>量程: {attr.range}</span>
                      <span>功能码: {attr.funcCode}</span>
                      <span>起始地址: {attr.startAddr}</span>`;
const replaceListItems = `                      <span>精度: {attr.precision}位小数</span>
                      {isModbus && (
                        <>
                          <span>量程: {attr.range}</span>
                          <span>功能码: {attr.funcCode}</span>
                          <span>起始地址: {attr.startAddr}</span>
                        </>
                      )}`;
content = content.replace(targetListItems, replaceListItems);

const targetLength0 = `{data.modbusAttrs.length === 0 && <div className="text-center text-sm text-gray-400 py-6 border border-dashed border-gray-200 rounded-lg">暂无属性，请点击新增</div>}`;
const replaceLength0 = `{currentAttrs.length === 0 && <div className="text-center text-sm text-gray-400 py-6 border border-dashed border-gray-200 rounded-lg">暂无属性，请点击新增</div>}`;
content = content.replace(targetLength0, replaceLength0);

const targetWirelessDisplay = `{['Zigbee', '蓝牙', 'Lora'].includes(data.protocol) && (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-50 border border-gray-200 rounded-lg">
            <Info size={32} className="text-blue-400 mb-3" />
            <div className="text-sm font-medium text-gray-700">当前无线协议无需额外配置端口及映射属性</div>
            <div className="text-xs text-gray-400 mt-1">系统将自动完成无线数据的透传</div>
          </div>
        )}`;
const replaceWirelessDisplay = ``;
content = content.replace(targetWirelessDisplay, replaceWirelessDisplay);

// In StepConfirm
const targetStepConfirmIncludes = `{['Zigbee', '蓝牙', 'Lora'].includes(data.protocol) && (
                <div className="text-sm text-gray-500">无线透传模式，无配置端口。</div>
              )}`;
const replaceStepConfirmIncludes = `{data.protocol === 'Zigbee' && (
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
              )}`;
content = content.replace(targetStepConfirmIncludes, replaceStepConfirmIncludes);


fs.writeFileSync(path, content);
