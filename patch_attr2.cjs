const fs = require('fs');
const path = './src/components/AddCustomDeviceModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetSaveAttr = `  const saveAttr = () => {
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
const replaceSaveAttr = `  const saveAttr = () => {
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
content = content.replace(targetSaveAttr, replaceSaveAttr);

const targetRender1 = `                      <span>量程: {attr.range}</span>
                      <span>功能码: {attr.funcCode}</span>`;
const replaceRender1 = `                      <span>精度: {attr.precision}位小数</span>
                      <span>量程: {attr.range}</span>
                      <span>功能码: {attr.funcCode}</span>`;
content = content.replace(targetRender1, replaceRender1);

const targetRender2 = `                           <strong className="text-gray-800">{a.name}</strong> ({a.unit}) - 量程: {a.range}, 地址: {a.startAddr}`;
const replaceRender2 = `                           <strong className="text-gray-800">{a.name}</strong> ({a.unit}) - 精度: {a.precision || '0'}, 量程: {a.range}, 地址: {a.startAddr}`;
content = content.replace(targetRender2, replaceRender2);

fs.writeFileSync(path, content);
