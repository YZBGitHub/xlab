import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Edit3, Trash2, ChevronRight, ChevronDown, 
  HelpCircle, Cpu, Settings, BarChart2, Sliders, Home, 
  Video, LayoutGrid, Radio, Network, Box, Folder, PlusCircle,
  X, Check, AlertCircle, RefreshCw, Layers, ArrowUp, ArrowDown,
  Eye, Image as ImageIcon, Sparkles, CheckCircle2
} from 'lucide-react';
import { SystemDeviceNode, DeviceConfig, initialSystemDeviceTree, PRESET_ICONS } from '../data/systemDeviceTree';
import DeviceConfigModal from './DeviceConfigModal';

const STORAGE_KEY = 'xlab_system_sim_devices_v1';

export default function SystemSimDeviceManager() {
  // 数据源（带 LocalStorage 持久化）
  const [treeData, setTreeData] = useState<SystemDeviceNode[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse system device tree from storage', e);
    }
    return initialSystemDeviceTree;
  });

  // 持久化存储
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(treeData));
    } catch (e) {
      console.error('Failed to save system device tree to storage', e);
    }
  }, [treeData]);

  // 搜索关键字
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // 展开折叠节点集合（默认展开传感器 SensorPanel 和 RFID RFIDPanel）
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    new Set(['SensorPanel', 'RFIDPanel'])
  );

  // 模态弹窗状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingNode, setEditingNode] = useState<SystemDeviceNode | null>(null);

  // 配置弹窗状态
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configNode, setConfigNode] = useState<SystemDeviceNode | null>(null);

  // 删除确认弹窗
  const [deleteConfirmNode, setDeleteConfirmNode] = useState<SystemDeviceNode | null>(null);

  // 图片大图预览
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Toast 提示
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 2500);
  };

  // 表单状态
  const [formType, setFormType] = useState<0 | 1>(0); // 0: 分类, 1: 设备
  const [formParentId, setFormParentId] = useState<string>('0');
  const [formName, setFormName] = useState('');
  const [formId, setFormId] = useState('');
  const [formOrderNum, setFormOrderNum] = useState<number>(1);
  const [formStatus, setFormStatus] = useState<'启用' | '禁用'>('启用');
  const [formIcon, setFormIcon] = useState('el-icon-help');
  const [formImage, setFormImage] = useState('');
  const [formProtocol, setFormProtocol] = useState('Modbus');
  const [formDescription, setFormDescription] = useState('');

  // 切换折叠/展开单个节点
  const toggleExpand = (id: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 全部展开 / 全部折叠
  const handleExpandAll = (expand: boolean) => {
    if (expand) {
      const allIds = new Set<string>();
      const collect = (nodes: SystemDeviceNode[]) => {
        nodes.forEach(n => {
          if (n.children && n.children.length > 0) {
            allIds.add(n.id);
            collect(n.children);
          }
        });
      };
      collect(treeData);
      setExpandedKeys(allIds);
      showToast('已全部展开', 'info');
    } else {
      setExpandedKeys(new Set());
      showToast('已全部折叠', 'info');
    }
  };

  // 收集所有分类节点（用于上级分类选择下拉框）
  const allCategoryOptions = useMemo(() => {
    const list: { id: string; name: string; level: number }[] = [
      { id: '0', name: '顶级分类 (无上级)', level: 0 }
    ];
    const collect = (nodes: SystemDeviceNode[], level = 1) => {
      nodes.forEach(node => {
        if (node.type === 0) {
          list.push({ id: node.id, name: node.name, level });
          if (node.children && node.children.length > 0) {
            collect(node.children, level + 1);
          }
        }
      });
    };
    collect(treeData);
    return list;
  }, [treeData]);

  // 处理搜索过滤与自动展开祖先
  const { filteredTree, matchCount } = useMemo(() => {
    if (!activeSearch.trim()) {
      return { filteredTree: treeData, matchCount: 0 };
    }

    const kw = activeSearch.trim().toLowerCase();
    let count = 0;
    const autoExpandIds = new Set<string>();

    const filterNodes = (nodes: SystemDeviceNode[]): SystemDeviceNode[] => {
      const result: SystemDeviceNode[] = [];

      nodes.forEach(node => {
        const nameMatches = node.name.toLowerCase().includes(kw);
        const protocolMatches = node.protocol?.toLowerCase().includes(kw);
        const selfMatch = nameMatches || protocolMatches;

        const filteredChildren = node.children && node.children.length > 0 ? filterNodes(node.children) : [];

        if (selfMatch || filteredChildren.length > 0) {
          if (selfMatch) count++;
          if (filteredChildren.length > 0) {
            autoExpandIds.add(node.id);
          }
          result.push({
            ...node,
            children: filteredChildren
          });
        }
      });

      return result;
    };

    const filtered = filterNodes(treeData);
    if (autoExpandIds.size > 0) {
      setExpandedKeys(prev => new Set([...Array.from(prev), ...Array.from(autoExpandIds)]));
    }
    return { filteredTree: filtered, matchCount: count };
  }, [treeData, activeSearch]);

  // 扁平化渲染行（带深度 depth）
  const flattenedRows = useMemo(() => {
    const rows: { node: SystemDeviceNode; depth: number; hasChildren: boolean; isExpanded: boolean }[] = [];

    const traverse = (nodes: SystemDeviceNode[], depth = 0) => {
      nodes.forEach(node => {
        const hasChildren = Boolean(node.children && node.children.length > 0);
        const isExpanded = expandedKeys.has(node.id);

        rows.push({
          node,
          depth,
          hasChildren,
          isExpanded
        });

        if (hasChildren && isExpanded) {
          traverse(node.children!, depth + 1);
        }
      });
    };

    traverse(filteredTree, 0);
    return rows;
  }, [filteredTree, expandedKeys]);

  // 状态切换
  const handleToggleStatus = (node: SystemDeviceNode) => {
    const nextStatus: '启用' | '禁用' = node.status === '启用' ? '禁用' : '启用';
    
    const updateStatus = (nodes: SystemDeviceNode[]): SystemDeviceNode[] => {
      return nodes.map(n => {
        if (n.id === node.id) {
          return { ...n, status: nextStatus };
        }
        if (n.children && n.children.length > 0) {
          return { ...n, children: updateStatus(n.children) };
        }
        return n;
      });
    };

    setTreeData(updateStatus(treeData));
    showToast(`已${nextStatus}【${node.name}】`, nextStatus === '启用' ? 'success' : 'info');
  };

  // 打开新增模态框
  const openCreateModal = (parent?: SystemDeviceNode) => {
    setModalMode('create');
    setEditingNode(null);
    setFormType(parent ? 1 : 0);
    setFormParentId(parent ? parent.id : '0');
    setFormName('');
    const randomId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setFormId(randomId);
    setFormOrderNum(parent?.children ? parent.children.length + 1 : treeData.length + 1);
    setFormStatus('启用');
    setFormIcon('el-icon-help');
    setFormImage('');
    setFormProtocol('Modbus');
    setFormDescription('');
    setIsModalOpen(true);
  };

  // 打开编辑模态框
  const openEditModal = (node: SystemDeviceNode) => {
    setModalMode('edit');
    setEditingNode(node);
    setFormType(node.type);
    setFormParentId(node.parentId || '0');
    setFormName(node.name);
    setFormId(node.id);
    setFormOrderNum(node.orderNum);
    setFormStatus(node.status || '启用');
    setFormIcon(node.icon || 'el-icon-help');
    setFormImage(node.image || '');
    setFormProtocol(node.protocol || 'Modbus');
    setFormDescription(node.description || '');
    setIsModalOpen(true);
  };

  // 打开配置模态框
  const openConfigModal = (node: SystemDeviceNode) => {
    setConfigNode(node);
    setIsConfigModalOpen(true);
  };

  // 保存设备配置
  const handleSaveDeviceConfig = (
    nodeId: string, 
    updatedConfig: DeviceConfig, 
    updatedProtocol: string, 
    updatedDeviceType: '传感器' | '执行器' | '网关'
  ) => {
    const updateNodeConfig = (nodes: SystemDeviceNode[]): SystemDeviceNode[] => {
      return nodes.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            config: updatedConfig,
            protocol: updatedProtocol,
            deviceType: updatedDeviceType
          };
        }
        if (n.children && n.children.length > 0) {
          return { ...n, children: updateNodeConfig(n.children) };
        }
        return n;
      });
    };

    setTreeData(updateNodeConfig(treeData));
    showToast(`已成功保存【${configNode?.name || '设备'}】的类型与协议配置`, 'success');
    setIsConfigModalOpen(false);
  };

  // 保存新增或编辑
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('请输入名称', 'error');
      return;
    }

    const payload: SystemDeviceNode = {
      id: formId.trim() || `node_${Date.now()}`,
      name: formName.trim(),
      parentId: formParentId,
      orderNum: Number(formOrderNum) || 1,
      type: formType,
      status: formStatus,
      icon: formType === 0 ? formIcon : '',
      image: formType === 1 ? formImage.trim() : '',
      protocol: formType === 1 ? formProtocol : undefined,
      description: formDescription.trim(),
      createTime: editingNode?.createTime || new Date().toLocaleString(),
      children: editingNode?.children || []
    };

    if (modalMode === 'create') {
      // 添加到树中
      if (formParentId === '0') {
        setTreeData(prev => [...prev, payload]);
      } else {
        const addToParent = (nodes: SystemDeviceNode[]): SystemDeviceNode[] => {
          return nodes.map(n => {
            if (n.id === formParentId) {
              return {
                ...n,
                children: [...(n.children || []), payload]
              };
            }
            if (n.children && n.children.length > 0) {
              return { ...n, children: addToParent(n.children) };
            }
            return n;
          });
        };
        setTreeData(addToParent(treeData));
        // 自动展开父级
        setExpandedKeys(prev => new Set([...Array.from(prev), formParentId]));
      }
      showToast(`成功新增【${payload.name}】`, 'success');
    } else {
      // 编辑已有节点（如果父级改变，需要移位）
      const oldParentId = editingNode?.parentId || '0';
      if (oldParentId === formParentId) {
        // 同一父级直接替换更新
        const updateNode = (nodes: SystemDeviceNode[]): SystemDeviceNode[] => {
          return nodes.map(n => {
            if (n.id === editingNode!.id) {
              return { ...n, ...payload, children: n.children };
            }
            if (n.children && n.children.length > 0) {
              return { ...n, children: updateNode(n.children) };
            }
            return n;
          });
        };
        setTreeData(updateNode(treeData));
      } else {
        // 跨父级移动：先从原树中移除，再插入新父级
        let nodeToMove: SystemDeviceNode = { ...payload, children: editingNode?.children || [] };

        const removeNode = (nodes: SystemDeviceNode[]): SystemDeviceNode[] => {
          return nodes
            .filter(n => n.id !== editingNode!.id)
            .map(n => ({
              ...n,
              children: n.children ? removeNode(n.children) : []
            }));
        };

        const cleanedTree = removeNode(treeData);

        if (formParentId === '0') {
          setTreeData([...cleanedTree, nodeToMove]);
        } else {
          const insertNode = (nodes: SystemDeviceNode[]): SystemDeviceNode[] => {
            return nodes.map(n => {
              if (n.id === formParentId) {
                return { ...n, children: [...(n.children || []), nodeToMove] };
              }
              if (n.children && n.children.length > 0) {
                return { ...n, children: insertNode(n.children) };
              }
              return n;
            });
          };
          setTreeData(insertNode(cleanedTree));
          setExpandedKeys(prev => new Set([...Array.from(prev), formParentId]));
        }
      }
      showToast(`已更新【${payload.name}】`, 'success');
    }

    setIsModalOpen(false);
  };

  // 确认删除节点
  const handleConfirmDelete = () => {
    if (!deleteConfirmNode) return;

    const removeNode = (nodes: SystemDeviceNode[]): SystemDeviceNode[] => {
      return nodes
        .filter(n => n.id !== deleteConfirmNode.id)
        .map(n => ({
          ...n,
          children: n.children ? removeNode(n.children) : []
        }));
    };

    setTreeData(removeNode(treeData));
    showToast(`已删除【${deleteConfirmNode.name}】`, 'info');
    setDeleteConfirmNode(null);
  };

  // 重置为出厂预设
  const handleResetDefault = () => {
    if (window.confirm('确定要重置所有系统仿真设备为出厂预设数据吗？本地修改将被覆盖。')) {
      setTreeData(initialSystemDeviceTree);
      setExpandedKeys(new Set(['SensorPanel', 'RFIDPanel']));
      showToast('已重置为系统出厂预设数据', 'success');
    }
  };

  // 渲染图标或封面
  const renderCover = (node: SystemDeviceNode) => {
    if (node.type === 0) {
      // 分类图标
      if (!node.icon) {
        return <span className="text-gray-400 font-mono">--</span>;
      }
      switch (node.icon) {
        case 'el-icon-help':
          return (
            <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto" title="传感器">
              <HelpCircle size={15} />
            </div>
          );
        case 'el-icon-eleme':
          return (
            <div className="w-6 h-6 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto" title="采集器">
              <Cpu size={15} />
            </div>
          );
        case 'el-icon-setting':
          return (
            <div className="w-6 h-6 rounded-full bg-slate-100 text-gray-700 flex items-center justify-center mx-auto" title="配置">
              <Settings size={15} />
            </div>
          );
        case 'el-icon-s-data':
          return (
            <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto" title="其他设备">
              <BarChart2 size={15} />
            </div>
          );
        case 'el-icon-set-up':
          return (
            <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto" title="环境参数">
              <Sliders size={15} />
            </div>
          );
        case 'el-icon-s-home':
          return (
            <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto" title="智慧家居">
              <Home size={15} />
            </div>
          );
        case 'el-icon-video-camera':
          return (
            <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto" title="智慧安防">
              <Video size={15} />
            </div>
          );
        case 'el-icon-menu':
          return (
            <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto" title="智慧农业">
              <LayoutGrid size={15} />
            </div>
          );
        case 'el-icon-radar':
          return (
            <div className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto" title="雷达/射频">
              <Radio size={15} />
            </div>
          );
        case 'el-icon-network':
          return (
            <div className="w-6 h-6 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto" title="网络">
              <Network size={15} />
            </div>
          );
        default:
          return (
            <div className="w-6 h-6 rounded bg-gray-100 text-gray-500 flex items-center justify-center mx-auto text-xs">
              <Folder size={14} />
            </div>
          );
      }
    } else {
      // 设备封面
      if (node.image) {
        return (
          <div 
            onClick={() => setPreviewImage(node.image!)}
            className="w-8 h-8 rounded border border-gray-200 bg-white p-0.5 mx-auto cursor-pointer hover:border-blue-500 transition-colors flex items-center justify-center group"
            title="点击查看大图"
          >
            <img 
              src={node.image} 
              alt={node.name} 
              className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform"
              onError={(e) => {
                // 图片加载失败时降级显示
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        );
      }
      return <span className="text-gray-400 font-mono">--</span>;
    }
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

      {/* 顶部工具栏 (精准还原截图布局) */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 shrink-0 bg-white">
        {/* 左侧：新增按钮 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => openCreateModal()}
            className="bg-[#1890ff] hover:bg-[#40a9ff] text-white px-4 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 shadow-sm transition-colors active:scale-98"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>新增</span>
          </button>

          <div className="h-4 w-px bg-gray-200 mx-1" />

          {/* 快捷展开/折叠/重置 */}
          <button
            onClick={() => handleExpandAll(true)}
            className="text-xs text-gray-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            title="全部展开"
          >
            全部展开
          </button>
          <button
            onClick={() => handleExpandAll(false)}
            className="text-xs text-gray-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            title="全部折叠"
          >
            全部折叠
          </button>
          <button
            onClick={handleResetDefault}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors flex items-center gap-1"
            title="重置为出厂预设"
          >
            <RefreshCw size={12} />
            重置预设
          </button>
        </div>

        {/* 右侧：搜索框与搜索按钮 (与截图完全一致) */}
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
              placeholder="设备/分类"
              className="w-56 h-8 px-3 text-xs text-gray-700 bg-white border border-gray-300 rounded-l outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] transition-all placeholder:text-gray-400"
            />
            {searchKeyword && (
              <button 
                onClick={() => {
                  setSearchKeyword('');
                  setActiveSearch('');
                }}
                className="absolute right-2 text-gray-400 hover:text-gray-600"
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
          <span>搜索 “{activeSearch}” 的结果，共找到 <strong>{matchCount}</strong> 个匹配项</span>
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
          {/* 表头 (与截图对齐：设备名称、封面、状态、类型、排序、操作) */}
          <thead className="sticky top-0 bg-[#fafafa] border-b border-gray-200 z-10">
            <tr className="text-gray-600 text-xs font-medium select-none">
              <th className="py-3 px-6 w-[36%] min-w-[220px]">设备名称</th>
              <th className="py-3 px-4 w-[12%] text-center">封面</th>
              <th className="py-3 px-4 w-[12%] text-center">状态</th>
              <th className="py-3 px-4 w-[12%] text-center">类型</th>
              <th className="py-3 px-4 w-[12%] text-center">排序</th>
              <th className="py-3 px-6 w-[16%] text-center">操作</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
            {flattenedRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Box size={36} className="text-gray-300 stroke-1" />
                    <span>暂无匹配的设备或分类数据</span>
                  </div>
                </td>
              </tr>
            ) : (
              flattenedRows.map(({ node, depth, hasChildren, isExpanded }) => {
                const isMatching = activeSearch && node.name.toLowerCase().includes(activeSearch.toLowerCase());

                return (
                  <tr 
                    key={node.id} 
                    className={`hover:bg-[#f5f9ff] transition-colors group ${isMatching ? 'bg-amber-50/40' : ''}`}
                  >
                    {/* 1. 设备名称 (树形缩进 + 展开折叠箭头) */}
                    <td className="py-3 px-6">
                      <div 
                        className="flex items-center gap-1.5"
                        style={{ paddingLeft: `${depth * 24}px` }}
                      >
                        {/* 折叠/展开箭头 */}
                        {hasChildren ? (
                          <button
                            onClick={() => toggleExpand(node.id)}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors cursor-pointer"
                            title={isExpanded ? '折叠' : '展开'}
                          >
                            {isExpanded ? (
                              <ChevronDown size={14} className="text-gray-500" />
                            ) : (
                              <ChevronRight size={14} className="text-gray-500" />
                            )}
                          </button>
                        ) : (
                          <span className="w-5 inline-block" />
                        )}

                        {/* 名称文字 */}
                        <span 
                          className={`font-normal ${depth === 0 ? 'text-gray-900 font-medium' : 'text-gray-700'} ${isMatching ? 'text-blue-600 font-semibold' : ''}`}
                        >
                          {node.name}
                        </span>

                        {/* 子项数量徽标 */}
                        {hasChildren && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            ({node.children!.length})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. 封面 */}
                    <td className="py-3 px-4 text-center">
                      {renderCover(node)}
                    </td>

                    {/* 3. 状态 (蓝色"启用" / 灰色"禁用"，可点击快速切换) */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(node)}
                        className={`font-medium transition-colors cursor-pointer ${
                          node.status === '启用' ? 'text-[#1890ff] hover:text-[#40a9ff]' : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title="点击切换状态"
                      >
                        {node.status || '启用'}
                      </button>
                    </td>

                    {/* 4. 类型 */}
                    <td className="py-3 px-4 text-center text-gray-600">
                      {node.type === 0 ? '分类' : '设备'}
                    </td>

                    {/* 5. 排序 */}
                    <td className="py-3 px-4 text-center text-gray-700 font-mono">
                      {node.orderNum}
                    </td>

                    {/* 6. 操作 (配置、编辑、删除、添加子项) */}
                    <td className="py-3 px-6 text-center">
                      <div className="flex items-center justify-center gap-2.5">
                        <button
                          onClick={() => openConfigModal(node)}
                          className="text-[#1890ff] hover:text-[#40a9ff] flex items-center gap-1 font-medium cursor-pointer"
                          title="配置设备类型与设备协议"
                        >
                          <Sliders size={13} />
                          <span>配置</span>
                        </button>

                        <button
                          onClick={() => openEditModal(node)}
                          className="text-[#1890ff] hover:text-[#40a9ff] flex items-center gap-1 font-medium cursor-pointer"
                        >
                          <Edit3 size={13} />
                          <span>编辑</span>
                        </button>

                        <button
                          onClick={() => setDeleteConfirmNode(node)}
                          className="text-[#1890ff] hover:text-red-600 flex items-center gap-1 font-medium cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>删除</span>
                        </button>

                        {node.type === 0 && (
                          <button
                            onClick={() => openCreateModal(node)}
                            className="text-gray-400 hover:text-[#1890ff] flex items-center gap-0.5 font-normal cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            title="添加子项"
                          >
                            <PlusCircle size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 底部汇总状态栏 */}
      <div className="px-6 py-2.5 border-t border-gray-100 bg-[#fafafa] flex items-center justify-between text-xs text-gray-500 shrink-0">
        <div>
          <span>系统分类/设备总数：<strong>{treeData.length}</strong> 个一级模块，当前显示 <strong>{flattenedRows.length}</strong> 行</span>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> 支持多级树形无限扩展</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 自动本地持久化</span>
        </div>
      </div>

      {/* 新增 / 编辑 模态弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl w-[520px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 border border-gray-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#fafafa]">
              <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                {modalMode === 'create' ? <Plus size={16} className="text-[#1890ff]" /> : <Edit3 size={16} className="text-[#1890ff]" />}
                <span>{modalMode === 'create' ? '新增系统节点' : '编辑系统节点'}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 rounded p-1 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* 类型选择 */}
              <div>
                <label className="block text-gray-700 font-medium mb-1.5">节点类型 <span className="text-red-500">*</span></label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="formType"
                      checked={formType === 0}
                      onChange={() => setFormType(0)}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-gray-700">分类 (可包含子项)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="formType"
                      checked={formType === 1}
                      onChange={() => setFormType(1)}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-gray-700">设备 (具体仿真模型)</span>
                  </label>
                </div>
              </div>

              {/* 上级分类 */}
              <div>
                <label className="block text-gray-700 font-medium mb-1.5">上级分类</label>
                <select
                  value={formParentId}
                  onChange={(e) => setFormParentId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 bg-white"
                >
                  {allCategoryOptions.map(opt => (
                    <option key={opt.id} value={opt.id} disabled={modalMode === 'edit' && editingNode?.id === opt.id}>
                      {'\u00A0\u00A0'.repeat(opt.level)}{opt.level > 0 ? '└─ ' : ''}{opt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 名称 */}
              <div>
                <label className="block text-gray-700 font-medium mb-1.5">
                  {formType === 0 ? '分类名称' : '设备名称'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例如: 传感器 / 高频RFID读写器"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-500"
                />
              </div>

              {/* 标识编码 ID */}
              <div>
                <label className="block text-gray-700 font-medium mb-1.5">节点唯一标识 (ID)</label>
                <input
                  type="text"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  placeholder="例如: Sensor_AirQuality"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs font-mono text-gray-800 outline-none focus:border-blue-500"
                />
              </div>

              {/* 排序与状态 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1.5">排序号</label>
                  <input
                    type="number"
                    min="1"
                    value={formOrderNum}
                    onChange={(e) => setFormOrderNum(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1.5">状态</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as '启用' | '禁用')}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="启用">启用</option>
                    <option value="禁用">禁用</option>
                  </select>
                </div>
              </div>

              {/* 分类图标选择器（若为分类） */}
              {formType === 0 ? (
                <div>
                  <label className="block text-gray-700 font-medium mb-1.5">分类图标</label>
                  <div className="grid grid-cols-4 gap-2 border border-gray-200 rounded p-2.5 bg-gray-50 max-h-36 overflow-y-auto">
                    {PRESET_ICONS.map(item => (
                      <button
                        type="button"
                        key={item.value}
                        onClick={() => setFormIcon(item.value)}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded border text-[11px] transition-all cursor-pointer ${
                          formIcon === item.value
                            ? 'bg-blue-50 border-blue-500 text-blue-600 font-medium shadow-2xs'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="shrink-0">{renderCover({ ...editingNode, id: 'temp', name: '', parentId: '0', orderNum: 1, type: 0, status: '启用', icon: item.value } as any)}</span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* 设备图片与协议（若为设备） */
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1.5">设备通信协议</label>
                    <input
                      type="text"
                      value={formProtocol}
                      onChange={(e) => setFormProtocol(e.target.value)}
                      placeholder="例如: Modbus RTU / Zigbee / MQTT / 开关量"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1.5">设备封面图片路径 / URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        placeholder="例如: /device/RS485_Humiture_Thumbnail.png"
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-500"
                      />
                      {formImage && (
                        <div className="w-8 h-8 rounded border border-gray-200 bg-white p-0.5 shrink-0 flex items-center justify-center">
                          <img src={formImage} alt="预览" className="max-h-full max-w-full object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 描述说明 */}
              <div>
                <label className="block text-gray-700 font-medium mb-1.5">描述说明</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="请输入描述或配置备注..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-500"
                />
              </div>

              {/* 底部按钮 */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
      {deleteConfirmNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl w-[400px] p-6 animate-in zoom-in-95 duration-150 border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 text-sm mb-1">确定删除该节点？</h4>
                <p className="text-xs text-gray-600 leading-relaxed mb-1">
                  您正在删除：<strong>{deleteConfirmNode.name}</strong>
                </p>
                {deleteConfirmNode.children && deleteConfirmNode.children.length > 0 && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200 mt-2 font-medium">
                    ⚠️ 警告：该分类包含 {deleteConfirmNode.children.length} 个子节点，删除后将同时级联删除所有子节点！
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmNode(null)}
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

      {/* 图片大图预览 */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 p-4 cursor-zoom-out"
        >
          <div className="bg-white rounded-lg p-3 max-w-lg max-h-[80vh] shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-black transition-colors shadow"
            >
              <X size={15} />
            </button>
            <img src={previewImage} alt="大图预览" className="max-w-full max-h-[70vh] object-contain rounded" />
          </div>
        </div>
      )}

      {/* 设备配置弹窗 (类型与协议) */}
      <DeviceConfigModal
        isOpen={isConfigModalOpen}
        node={configNode}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleSaveDeviceConfig}
      />
    </div>
  );
}
