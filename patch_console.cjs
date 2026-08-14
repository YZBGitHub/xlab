const fs = require('fs');
const path = './src/pages/ConsolePage.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetThead = `<thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                    <tr>
                      <th className="px-6 py-3 font-medium">封面图</th>
                      <th className="px-6 py-3 font-medium">封面图</th>
                      <th className="px-6 py-3 font-medium">设备名称</th>
                      <th className="px-6 py-3 font-medium">设备类型</th>
                      <th className="px-6 py-3 font-medium">通讯协议</th>
                      <th className="px-6 py-3 font-medium">创建时间</th>
                      <th className="px-6 py-3 font-medium">操作</th>
                    </tr>
                  </thead>`;
const replaceThead = `<thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                    <tr>
                      <th className="px-6 py-3 font-medium w-24">封面图</th>
                      <th className="px-6 py-3 font-medium">设备名称</th>
                      <th className="px-6 py-3 font-medium">设备类型</th>
                      <th className="px-6 py-3 font-medium">通讯协议</th>
                      <th className="px-6 py-3 font-medium">创建时间</th>
                      <th className="px-6 py-3 font-medium">操作</th>
                    </tr>
                  </thead>`;
content = content.replace(targetThead, replaceThead);

const targetTbody = `<td className="px-6 py-4 font-medium text-gray-800">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center border border-gray-200">
                              <Box size={16} className="text-gray-400" />
                            </div>
                            {device.name}
                          </div>
                        </td>`;
const replaceTbody = `<td className="px-6 py-4">
                          <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center">
                            {device.image ? <img src={device.image} alt="cover" className="w-full h-full object-cover" /> : <Box size={24} className="text-gray-400" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {device.name}
                        </td>`;
content = content.replace(targetTbody, replaceTbody);

fs.writeFileSync(path, content);
