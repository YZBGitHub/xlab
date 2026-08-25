import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit2, Trash2, X, Check, Tag, Layers, 
  Settings, CheckCircle2, AlertCircle, Box, FolderTree,
  Sliders, ExternalLink, HelpCircle
} from 'lucide-react';
import { TagResourceItem, initialTagResources } from '../data/tagResourceList';

const STORAGE_KEY = 'xlab_tag_resources_v1';

// 可供关联的系统资源池
const AVAILABLE_DEVICE_MODULES = [
  { id: 'SensorPanel', name: '传感器模块 (有线/无线/继电器)', count: 32 },
  { id: 'CollectPanel', name: '采集器与网关模块', count: 8 },
  { id: 'RFIDPanel', name: 'RFID 射频识别系统', count: 12 },
  { id: 'OtherDevices', name: '其他显示与报警设备', count: 6 },
  { id: 'EnvParams', name: '气象与环境参数监测仪', count: 10 },
  { id: 'SmartHome', name: '智能家居感知与控制套件', count: 14 },
  { id: 'SmartSecurity', name: '智能安防与周界报警', count: 9 },
  { id: 'SmartAgri', name: '智慧农业水肥环境控制系统', count: 11 }
];

const AVAILABLE_PROJECTS = [
  { id: 1, name: '智慧农业2D虚拟仿真' },
  { id: 2, name: '智慧家居2D仿真' },
  { id: 3, name: '家居2D仿真【娱乐影音】' },
  { id: 4, name: '智慧安防2D仿真' },
  { id: 5, name: '交通2D仿真【隧道】' }
];

export default function TagResourceManager() {
  // 数据源
  const [tagList, setTagList] = useState<TagResourceItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load tag resources from storage', e);
    }
    return initialTagResources;
  });

  // 本地存储
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tagList));
    } catch (e) {
      console.error('Failed to save tag resources to storage', e);
    }
  }, [tagList]);

  // 搜索关键字
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // 弹窗状态
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagModalMode, setTagModalMode] = useState<'create' | 'edit'>('create');
  const [editingTag, setEditingTag] = useState<TagResourceItem | null>(null);

  // 资源管理弹窗
  const [managingTag, setManagingTag] = useState<TagResourceItem | null>(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);

  // 删除确认弹窗
  const [deleteConfirmTag, setDeleteConfirmTag] = useState<TagResourceItem | null>(null);

  // 表单状态
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formRemark, setFormRemark] = useState('');

  // Toast 提示
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 2500);
  };

  // 过滤后的列表
  const filteredTags = useMemo(() => {
    if (!activeSearch.trim()) return tagList;
    const kw = activeSearch.trim().toLowerCase();
    return tagList.filter(
      item =>
        item.name.toLowerCase().includes(kw) ||
        item.code.toLowerCase().includes(kw) ||
        item.remark.toLowerCase().includes(kw)
    );
  }, [tagList, activeSearch]);

  // 打开新增标签弹窗
  const openCreateTagModal = () => {
    setTagModalMode('create');
    setEditingTag(null);
    setFormName('');
    setFormCode('');
    setFormRemark('');
    setIsTagModalOpen(true);
  };

  // 打开编辑标签弹窗
  const openEditTagModal = (item: TagResourceItem) => {
    setTagModalMode('edit');
    setEditingTag(item);
    setFormName(item.name);
    setFormCode(item.code);
    setFormRemark(item.remark === '--' ? '' : item.remark);
    setIsTagModalOpen(true);
  };

  // 保存标签基本信息
  const handleSaveTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('请输入标签名称', 'error');
      return;
    }
    if (!formCode.trim()) {
      showToast('请输入标签标识', 'error');
      return;
    }

    if (tagModalMode === 'create') {
      const newTag: TagResourceItem = {
        id: Date.now(),
        name: formName.trim(),
        code: formCode.trim(),
        remark: formRemark.trim() || '--',
        resourceCount: 0,
        assignedResources: {
          deviceIds: [],
          projectIds: []
        },
        createTime: new Date().toLocaleString()
      };
      setTagList(prev => [...prev, newTag]);
      showToast(`成功新增标签【${newTag.name}】`, 'success');
    } else if (editingTag) {
      setTagList(prev =>
        prev.map(t =>
          t.id === editingTag.id
            ? {
                ...t,
                name: formName.trim(),
                code: formCode.trim(),
                remark: formRemark.trim() || '--'
              }
            : t
        )
      );
      showToast(`已更新标签【${formName.trim()}】`, 'success');
    }

    setIsTagModalOpen(false);
  };

  // 打开资源管理关联弹窗
  const openResourceManageModal = (tag: TagResourceItem) => {
    setManagingTag(tag);
    setSelectedDeviceIds(tag.assignedResources?.deviceIds || []);
    setSelectedProjectIds(tag.assignedResources?.projectIds || []);
  };

  // 保存资源关联
  const handleSaveResourceAssignment = () => {
    if (!managingTag) return;

    setTagList(prev =>
      prev.map(t =>
        t.id === managingTag.id
          ? {
              ...t,
              assignedResources: {
                deviceIds: selectedDeviceIds,
                projectIds: selectedProjectIds
              },
              resourceCount: selectedDeviceIds.length * 8 + selectedProjectIds.length
            }
          : t
      )
    );

    showToast(`已更新【${managingTag.name}】关联的资源绑定配置`, 'success');
    setManagingTag(null);
  };

  // 确认删除标签
  const handleConfirmDelete = () => {
    if (!deleteConfirmTag) return;
    setTagList(prev => prev.filter(t => t.id !== deleteConfirmTag.id));
    showToast(`已删除标签【${deleteConfirmTag.name}】`, 'info');
    setDeleteConfirmTag(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden select-none">
      {/* Toast 提示条 */}
      {toastMsg && (
        <div className={`fixed top-16 right-8 z-50 px-4 py-2.5 rounded-lg shadow-lg border text-sm flex items-center gap-2 animate-bounce transition-all ${
          toastMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          toastMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' :
          'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* 顶部工具栏 (精准还原截图布局：右侧为标签名称搜索输入框与蓝色搜索按钮) */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 shrink-0 bg-white">
        {/* 左侧：新增按钮 */}
        <div>
          <button
            onClick={openCreateTagModal}
            className="bg-[#1890ff] hover:bg-[#40a9ff] text-white px-4 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer active:scale-98"
          >
            <Plus size={15} className="stroke-[2.5]" />
            <span>新增标签</span>
          </button>
        </div>

        {/* 右侧：标签名称搜索输入框与搜索按钮 (与截图完全一致) */}
        <div className="flex items-center">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                if (e.target.value === '') setActiveSearch('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setActiveSearch(searchKeyword);
                }
              }}
              placeholder="标签名称"
              className="w-56 h-8 px-3 text-xs text-gray-700 bg-white border border-gray-300 rounded-l outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] transition-all placeholder:text-gray-400"
            />
            {searchKeyword && (
              <button 
                onClick={() => {
                  setSearchKeyword('');
                  setActiveSearch('');
                }}
                className="absolute right-2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <button
            onClick={() => setActiveSearch(searchKeyword)}
            className="h-8 px-4 bg-[#1890ff] hover:bg-[#40a9ff] text-white text-xs font-medium rounded-r flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer active:scale-98"
          >
            <Search size={13} className="stroke-[2.5]" />
            <span>搜索</span>
          </button>
        </div>
      </div>

      {/* 搜索提示条 */}
      {activeSearch && (
        <div className="px-6 py-2 bg-blue-50/70 border-b border-blue-100 text-xs text-blue-700 flex items-center justify-between shrink-0">
          <span>搜索 “{activeSearch}” 的结果，共找到 <strong>{filteredTags.length}</strong> 条记录</span>
          <button 
            onClick={() => { setSearchKeyword(''); setActiveSearch(''); }}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            清除搜索
          </button>
        </div>
      )}

      {/* 表格容器 */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          {/* 表头 (严格对齐截图：序号、标签名称、标识、备注信息、操作) */}
          <thead className="sticky top-0 bg-[#fafafa] border-b border-gray-200 z-10">
            <tr className="text-gray-600 text-xs font-medium select-none">
              <th className="py-3 px-6 w-[8%] text-center">序号</th>
              <th className="py-3 px-6 w-[20%]">标签名称</th>
              <th className="py-3 px-6 w-[18%] text-center">标识</th>
              <th className="py-3 px-6 w-[40%] text-center">备注信息</th>
              <th className="py-3 px-6 w-[14%] text-center">操作</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
            {filteredTags.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Tag size={36} className="text-gray-300 stroke-1" />
                    <span>暂无匹配的标签资源数据</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTags.map((item, index) => {
                return (
                  <tr 
                    key={item.id} 
                    className="hover:bg-[#f5f9ff] transition-colors group"
                  >
                    {/* 1. 序号 */}
                    <td className="py-4 px-6 text-center text-gray-600 font-mono">
                      {index + 1}
                    </td>

                    {/* 2. 标签名称 */}
                    <td className="py-4 px-6 font-medium text-gray-800">
                      <span>{item.name}</span>
                    </td>

                    {/* 3. 标识 */}
                    <td className="py-4 px-6 text-center font-mono text-gray-600">
                      {item.code}
                    </td>

                    {/* 4. 备注信息 */}
                    <td className="py-4 px-6 text-center text-gray-600 leading-relaxed max-w-md mx-auto">
                      <span className={item.remark === '--' ? 'text-gray-400 font-mono' : ''}>
                        {item.remark}
                      </span>
                    </td>

                    {/* 5. 操作 (蓝色纯文本资源管理) */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => openResourceManageModal(item)}
                          className="text-[#1890ff] hover:text-[#40a9ff] font-medium cursor-pointer transition-colors"
                        >
                          资源管理
                        </button>
                        <button
                          onClick={() => openEditTagModal(item)}
                          className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                          title="编辑标签"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmTag(item)}
                          className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="删除标签"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 底部状态栏 */}
      <div className="px-6 py-3 border-t border-gray-100 bg-[#fafafa] flex items-center justify-between text-xs text-gray-500 shrink-0">
        <div>
          <span>共 <strong>{tagList.length}</strong> 个系统资源标签</span>
        </div>
        <div className="text-gray-400 flex items-center gap-2">
          <span>点击“资源管理”即可快速按标签划定案例与设备权限</span>
        </div>
      </div>

      {/* 资源管理弹窗 (绑定仿真设备/项目应用) */}
      {managingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-[640px] max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 border border-gray-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Tag size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <span>标签资源绑定管理</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-normal">
                      {managingTag.name} ({managingTag.code})
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    勾选分配给该标签的仿真模型模块与应用案例工程
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setManagingTag(null)}
                className="text-gray-400 hover:text-gray-600 rounded p-1.5 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {/* 1. 仿真设备模块库 */}
              <div>
                <div className="font-bold text-gray-800 text-xs mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Box size={14} className="text-blue-500" />
                    <span>关联仿真设备模块 ({selectedDeviceIds.length}/{AVAILABLE_DEVICE_MODULES.length})</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDeviceIds(AVAILABLE_DEVICE_MODULES.map(d => d.id))}
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                    >
                      全选
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDeviceIds([])}
                      className="text-[11px] text-gray-500 hover:underline cursor-pointer"
                    >
                      清空
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {AVAILABLE_DEVICE_MODULES.map(mod => {
                    const checked = selectedDeviceIds.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => {
                          if (checked) {
                            setSelectedDeviceIds(prev => prev.filter(id => id !== mod.id));
                          } else {
                            setSelectedDeviceIds(prev => [...prev, mod.id]);
                          }
                        }}
                        className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                          checked
                            ? 'border-blue-500 bg-blue-50/50 shadow-2xs'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className={`text-xs ${checked ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                            {mod.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {mod.count} 款
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. 关联仿真案例项目 */}
              <div>
                <div className="font-bold text-gray-800 text-xs mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers size={14} className="text-blue-500" />
                    <span>关联应用工程案例 ({selectedProjectIds.length}/{AVAILABLE_PROJECTS.length})</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProjectIds(AVAILABLE_PROJECTS.map(p => p.id))}
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                    >
                      全选
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedProjectIds([])}
                      className="text-[11px] text-gray-500 hover:underline cursor-pointer"
                    >
                      清空
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {AVAILABLE_PROJECTS.map(proj => {
                    const checked = selectedProjectIds.includes(proj.id);
                    return (
                      <div
                        key={proj.id}
                        onClick={() => {
                          if (checked) {
                            setSelectedProjectIds(prev => prev.filter(id => id !== proj.id));
                          } else {
                            setSelectedProjectIds(prev => [...prev, proj.id]);
                          }
                        }}
                        className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                          checked
                            ? 'border-blue-500 bg-blue-50/50 shadow-2xs'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className={`text-xs ${checked ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                            {proj.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400">
                          ID: #{proj.id}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between shrink-0">
              <div className="text-[11px] text-gray-400">
                已选中 {selectedDeviceIds.length} 个设备模块与 {selectedProjectIds.length} 个案例工程
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setManagingTag(null)}
                  className="px-4 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 text-xs transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveResourceAssignment}
                  className="px-5 py-1.5 rounded bg-[#1890ff] hover:bg-[#40a9ff] text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
                >
                  保存关联
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新增 / 编辑标签弹窗 */}
      {isTagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-[460px] overflow-hidden animate-in zoom-in-95 duration-150 border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#fafafa]">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <Tag size={16} className="text-[#1890ff]" />
                <span>{tagModalMode === 'create' ? '新增资源标签' : '编辑资源标签'}</span>
              </h3>
              <button 
                onClick={() => setIsTagModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 rounded p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTag} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1.5">
                  标签名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例如: 公共标签 / 智慧建筑能耗"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1.5">
                  标签标识 (Code) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="例如: public / legacy / zhihuinenghao"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs font-mono text-gray-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1.5">
                  备注信息
                </label>
                <textarea
                  rows={3}
                  value={formRemark}
                  onChange={(e) => setFormRemark(e.target.value)}
                  placeholder="请输入标签用途或说明..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTagModalOpen(false)}
                  className="px-4 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded bg-[#1890ff] hover:bg-[#40a9ff] text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除二次确认弹窗 */}
      {deleteConfirmTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-[380px] p-6 animate-in zoom-in-95 duration-150 border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 text-sm mb-1">确定删除该资源标签？</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  您正在删除标签：<strong>{deleteConfirmTag.name}</strong> ({deleteConfirmTag.code})。
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmTag(null)}
                className="px-3.5 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
