const fs = require('fs');
const path = './src/components/AddCustomDeviceModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update init
const targetInit = `analogConfig: { type: '电压', range: '0-24', unit: 'V', min: '0', max: '10' }`;
const replaceInit = `analogConfig: { type: '电压', range: '0-24', unit: 'V', min: '0', max: '10', precision: '0' }`;
content = content.replace(targetInit, replaceInit);

// Update analog component rendering
const targetAnalogForm = `<div className="bg-gray-50 border border-gray-200 rounded-lg p-5 grid grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">类型</label>
                <div className="flex gap-3">
                  <RadioBox label="电压" active={data.analogConfig.type === '电压'} onClick={() => update({ analogConfig: { ...data.analogConfig, type: '电压' } })} />
                  <RadioBox label="电流" active={data.analogConfig.type === '电流'} onClick={() => update({ analogConfig: { ...data.analogConfig, type: '电流' } })} />
                </div>
              </div>
              <FormInput label="量程" value={data.analogConfig.range} onChange={v => update({ analogConfig: { ...data.analogConfig, range: v } })} placeholder="如: 0-24" />
              <FormInput label="单位" value={data.analogConfig.unit} onChange={v => update({ analogConfig: { ...data.analogConfig, unit: v } })} placeholder="如: V" />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">区间范围</label>
                <div className="flex items-center gap-2">
                  <input type="text" value={data.analogConfig.min} onChange={e => update({ analogConfig: { ...data.analogConfig, min: e.target.value } })} className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-400" placeholder="Min" />
                  <span className="text-gray-400">-</span>
                  <input type="text" value={data.analogConfig.max} onChange={e => update({ analogConfig: { ...data.analogConfig, max: e.target.value } })} className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-400" placeholder="Max" />
                </div>
              </div>
            </div>`;
const replaceAnalogForm = `<div className="bg-gray-50 border border-gray-200 rounded-lg p-5 grid grid-cols-12 gap-x-6 gap-y-5">
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
            </div>`;
content = content.replace(targetAnalogForm, replaceAnalogForm);


const targetDisplay = `<div className="grid grid-cols-2 gap-4">
                    <div><span className="text-gray-500 text-sm">信号类型：</span> <span className="text-gray-800 font-medium text-sm">{data.analogConfig.type}</span></div>
                    <div><span className="text-gray-500 text-sm">量程范围：</span> <span className="text-gray-800 font-medium text-sm">{data.analogConfig.range}{data.analogConfig.unit}</span></div>
                    <div className="col-span-2"><span className="text-gray-500 text-sm">区间映射：</span> <span className="text-gray-800 font-medium text-sm">{data.analogConfig.min} ~ {data.analogConfig.max}</span></div>
                  </div>`;
const replaceDisplay = `<div className="grid grid-cols-2 gap-4">
                    <div><span className="text-gray-500 text-sm">信号类型：</span> <span className="text-gray-800 font-medium text-sm">{data.analogConfig.type}</span></div>
                    <div><span className="text-gray-500 text-sm">量程范围：</span> <span className="text-gray-800 font-medium text-sm">{data.analogConfig.range}{data.analogConfig.unit}</span></div>
                    <div><span className="text-gray-500 text-sm">精度设置：</span> <span className="text-gray-800 font-medium text-sm">保留 {data.analogConfig.precision ?? '0'} 位小数</span></div>
                    <div className="col-span-2"><span className="text-gray-500 text-sm">区间映射：</span> <span className="text-gray-800 font-medium text-sm">{data.analogConfig.min} ~ {data.analogConfig.max}</span></div>
                  </div>`;
content = content.replace(targetDisplay, replaceDisplay);

fs.writeFileSync(path, content);
