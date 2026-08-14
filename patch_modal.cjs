const fs = require('fs');
const path = './src/components/AddCustomDeviceModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = `  const defaultAttr = { name: '', unit: '', range: '', funcCode: '', startAddr: '', dataLen: '', formula: '' };`;
const replace1 = `  const defaultAttr = { name: '', unit: '', rangeMin: '', rangeMax: '', funcCode: '', startAddr: '', dataLen: '', formula: '' };`;
content = content.replace(target1, replace1);

const targetOpenEdit = `  const openEdit = (index: number) => {
    setAttrForm(data.modbusAttrs[index]);
    setEditingIndex(index);
    setShowAttrForm(true);
  };`;
const replaceOpenEdit = `  const openEdit = (index: number) => {
    const attr = data.modbusAttrs[index];
    let rangeMin = '';
    let rangeMax = '';
    if (attr.range) {
      const parts = attr.range.split('-');
      if (parts.length === 2) {
        rangeMin = parts[0];
        rangeMax = parts[1];
      }
    }
    setAttrForm({...attr, rangeMin, rangeMax});
    setEditingIndex(index);
    setShowAttrForm(true);
  };`;
content = content.replace(targetOpenEdit, replaceOpenEdit);

const targetSaveAttr = `  const saveAttr = () => {
    if (!attrForm.name) return;
    const newAttrs = [...data.modbusAttrs];
    if (editingIndex >= 0) newAttrs[editingIndex] = attrForm;
    else newAttrs.push(attrForm);
    update({ modbusAttrs: newAttrs });
    setShowAttrForm(false);
  };`;
const replaceSaveAttr = `  const saveAttr = () => {
    if (!attrForm.name) return;
    const newAttrs = [...data.modbusAttrs];
    const finalAttr = { ...attrForm, range: \`\${attrForm.rangeMin}-\${attrForm.rangeMax}\` };
    delete (finalAttr as any).rangeMin;
    delete (finalAttr as any).rangeMax;
    if (editingIndex >= 0) newAttrs[editingIndex] = finalAttr;
    else newAttrs.push(finalAttr);
    update({ modbusAttrs: newAttrs });
    setShowAttrForm(false);
  };`;
content = content.replace(targetSaveAttr, replaceSaveAttr);

const targetGrid = `                <div className="grid grid-cols-3 gap-4 mb-4">
                  <FormInput label="属性名" value={attrForm.name} onChange={v => setAttrForm({...attrForm, name: v})} placeholder="如: 温度" />
                  <FormInput label="单位" value={attrForm.unit} onChange={v => setAttrForm({...attrForm, unit: v})} placeholder="如: ℃" />
                  <FormInput label="量程设置" value={attrForm.range} onChange={v => setAttrForm({...attrForm, range: v})} placeholder="如: 0-100" />
                </div>`;
const replaceGrid = `                <div className="grid grid-cols-3 gap-4 mb-4">
                  <FormInput label="属性名" value={attrForm.name} onChange={v => setAttrForm({...attrForm, name: v})} placeholder="如: 温度" />
                  <FormInput label="单位" value={attrForm.unit} onChange={v => setAttrForm({...attrForm, unit: v})} placeholder="如: ℃" />
                  <div>
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
                </div>`;
content = content.replace(targetGrid, replaceGrid);

const targetRS485 = `                    <FormInput label="功能码" value={attrForm.funcCode} onChange={v => setAttrForm({...attrForm, funcCode: v})} placeholder="0x03" />
                    <FormInput label="起始地址" value={attrForm.startAddr} onChange={v => setAttrForm({...attrForm, startAddr: v})} placeholder="0004" />
                    <FormInput label="数据长度" value={attrForm.dataLen} onChange={v => setAttrForm({...attrForm, dataLen: v})} placeholder="1" />
                    <FormInput label="编码公式" value={attrForm.formula} onChange={v => setAttrForm({...attrForm, formula: v})} placeholder="R0=val/10" />`;
const replaceRS485 = `                    <FormInput label="功能码" value={attrForm.funcCode} onChange={v => setAttrForm({...attrForm, funcCode: v})} placeholder="0x03" />
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
                    </div>`;
content = content.replace(targetRS485, replaceRS485);

fs.writeFileSync(path, content);
