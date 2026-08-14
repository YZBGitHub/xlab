const fs = require('fs');
const path = './src/components/AddCustomDeviceModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update defaultAttr
const targetDefault = `const defaultAttr = { name: '', unit: '', rangeMin: '', rangeMax: '', funcCode: '', startAddr: '', dataLen: '', formula: '' };`;
const replaceDefault = `const defaultAttr = { name: '', unit: '', precision: '0', rangeMin: '', rangeMax: '', funcCode: '', startAddr: '', dataLen: '', formula: '' };`;
content = content.replace(targetDefault, replaceDefault);

// 2. Update openEdit
const targetOpenEdit = `setAttrForm({...attr, rangeMin, rangeMax});`;
const replaceOpenEdit = `setAttrForm({...attr, rangeMin, rangeMax, precision: attr.precision || '0'});`;
content = content.replace(targetOpenEdit, replaceOpenEdit);

// 3. Update the grid form (grid-cols-3 -> grid-cols-12)
const targetGrid = `<div className="grid grid-cols-3 gap-4 mb-4">
                  <FormInput label="属性名" value={attrForm.name} onChange={v => setAttrForm({...attrForm, name: v})} placeholder="如: 温度" />
                  <FormInput label="单位" value={attrForm.unit} onChange={v => setAttrForm({...attrForm, unit: v})} placeholder="如: ℃" />
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">量程设置</label>`;
const replaceGrid = `<div className="grid grid-cols-12 gap-4 mb-4">
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
                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">量程设置</label>`;
content = content.replace(targetGrid, replaceGrid);

// Close the </div> structure carefully
const targetGridEnd = `                      <input 
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
const replaceGridEnd = `                      <input 
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
                </div>`; // Same, just matching to ensure. Actually we don't need to change this if we just replaced the top.
// Wait, the original `grid-cols-3` had FormInput which is self closing. So `</div>` was for `grid-cols-3`. Our new one has nested `<div className="col-span-*">`. Let's check how many divs we need to close.
// Target Grid replaced the `<div className="grid grid-cols-3...> \n <FormInput...> \n <FormInput...> \n <div> <label>量程设置</label>`
// In our replacement, we added `<div className="col-span-3">`, `</div>`, `<div className="col-span-3">`, `</div>`, `<div className="col-span-2">`, `</div>`, `<div className="col-span-4">`.
// The `</div>` for `<div className="col-span-4">` needs to be inserted before the `</div>` of the grid.

const targetFixGridEnd = `                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all bg-white" 
                        placeholder="结束" 
                      />
                    </div>
                  </div>
                </div>`;
const replaceFixGridEnd = `                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all bg-white" 
                        placeholder="结束" 
                      />
                    </div>
                  </div>
                </div>`; // Actually, the `<div> <label>量程设置</label>` corresponds to `col-span-4`. It is closed by `</div>`. Then `</div>` for grid.
// So `<div>` (now `<div className="col-span-4">`) -> `<label>` -> `<div flex>` -> `<input>` -> `<span>` -> `<input>` -> `</div>(flex)` -> `</div>(col-span)` -> `</div>(grid)`. This is perfect!

fs.writeFileSync(path, content);
