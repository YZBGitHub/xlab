import React, { useState, useMemo } from 'react';
import { 
  X, Search, RotateCcw, Plus, CheckCircle2, 
  Layers, User, Cpu, Box, Sparkles 
} from 'lucide-react';
import { deviceTreeData } from '../data/deviceTree';
import { getDeviceImageUrl } from '../utils/deviceImages';
import { 
  STORAGE_KEY_CUSTOM_DEVICES, 
  isCurrentUser 
} from '../data/userProjectList';
import { initialUserCustomDevices } from '../data/userCustomDeviceList';

interface QuickDeviceCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDevice: (device: any) => void;
  canvasDeviceCount: number;
}

const inferProtocol = (node: any, path: string = ''): string => {
  const text = (node.name + " " + node.id + " " + path).toLowerCase();
  if (text.includes("modbus") || text.includes("485") || text.includes("rs485") || text.includes("rs-485") || text.includes("rtu") || text.includes("tcp")) return "Modbus";
  if (text.includes("zigbee")) return "Zigbee";
  if (text.includes("lora")) return "Lora";
  if (text.includes("蓝牙") || text.includes("bluetooth") || text.includes("ble")) return "蓝牙";
  if (text.includes("数字") || text.includes("digital")) return "数字量";
  if (text.includes("模拟") || text.includes("analog") || text.includes("模拟量")) return "模拟量";
  return "其他";
};

const inferDeviceType = (node: any, path: string = ''): string => {
  const text = (node.name + " " + node.id + " " + path).toLowerCase();
  if (text.includes("网关") || text.includes("gateway") || text.includes("cpe") || text.includes("master") || text.includes("采集器")) return "网关";
  if (text.includes("继电器") || text.includes("relay") || text.includes("breaker") || text.includes("断路器") || text.includes("双联") || text.includes("单联")) return "继电器";
  if (text.includes("传感器") || text.includes("探测") || text.includes("sensor") || text.includes("quality") || text.includes("温") || text.includes("风") || text.includes("液位") || text.includes("光") || text.includes("雨") || text.includes("水") || text.includes("门磁") || text.includes("压") || text.includes("表") || text.includes("仪") || text.includes("浓度")) return "传感器";
  if (text.includes("执行器") || text.includes("load") || text.includes("灯") || text.includes("阀") || text.includes("风扇") || text.includes("电机") || text.includes("lamp") || text.includes("fan") || text.includes("motor") || text.includes("valve") || text.includes("警报") || text.includes("alarm") || text.includes("开关") || text.includes("switch") || text.includes("控制")) return "执行器";
  return "传感器";
};

const getAllLeafNodes = (nodes: any[], currentPath: string = ''): any[] => {
  let leaves: any[] = [];
  nodes.forEach(node => {
    const path = currentPath ? (node.id === '0' || node.name === 'root' ? currentPath : `${currentPath} / ${node.name}`) : (node.name === 'root' ? '' : node.name);
    if (node.type === 1 || node.type === 2) {
      leaves.push({
        ...node,
        categoryPath: currentPath || '系统设备',
        inferredProtocol: inferProtocol(node, currentPath),
        inferredType: inferDeviceType(node, currentPath),
        isCustom: false
      });
    }
    if (node.children && node.children.length > 0) {
      leaves = leaves.concat(getAllLeafNodes(node.children, path));
    }
  });
  return leaves;
};

export default function QuickDeviceCenterModal({
  isOpen,
  onClose,
  onAddDevice,
  canvasDeviceCount
}: QuickDeviceCenterModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'system' | 'custom'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('全部类型');
  const [protocolFilter, setProtocolFilter] = useState<string>('全部协议');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. 系统内置设备列表
  const systemDevices = useMemo(() => {
    return getAllLeafNodes(deviceTreeData.filter(item => item.id !== 'CustomDevices'));
  }, []);

  // 2. 自定义设备列表（从本地存储读取，并兼容初始数据）
  const customDevices = useMemo(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_DEVICES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .filter(d => Boolean(d.publishToSimulation || d.publishStatus === 'published') || isCurrentUser(d.userName || d.creator))
            .map(d => ({
              ...d,
              inferredProtocol: d.protocol || 'Modbus',
              inferredType: d.type || '传感器',
              categoryPath: '自定义设备库',
              isCustom: true
            }));
        }
      }
    } catch (e) {}
    return initialUserCustomDevices.map(d => ({
      ...d,
      inferredProtocol: d.protocol || 'Modbus',
      inferredType: d.type || '传感器',
      categoryPath: '自定义设备库',
      isCustom: true
    }));
  }, [isOpen]);

  // 3. 全量合并设备池
  const allDevices = useMemo(() => {
    return [...systemDevices, ...customDevices];
  }, [systemDevices, customDevices]);

  // 4. 复合筛选
  const filteredDevices = useMemo(() => {
    return allDevices.filter(dev => {
      // 来源筛选
      if (sourceFilter === 'system' && dev.isCustom) return false;
      if (sourceFilter === 'custom' && !dev.isCustom) return false;

      // 类型筛选
      if (typeFilter !== '全部类型' && dev.inferredType !== typeFilter) return false;

      // 协议筛选
      if (protocolFilter !== '全部协议') {
        const p = (dev.inferredProtocol || '').toLowerCase();
        const target = protocolFilter.toLowerCase();
        if (target.includes('modbus') && !p.includes('modbus') && !p.includes('485')) return false;
        if (target.includes('zigbee') && !p.includes('zigbee')) return false;
        if (target.includes('模拟') && !p.includes('模拟') && !p.includes('analog')) return false;
        if (target.includes('数字') && !p.includes('数字') && !p.includes('digital')) return false;
        if (!target.includes('modbus') && !target.includes('zigbee') && !target.includes('模拟') && !target.includes('数字')) {
          if (!p.includes(target)) return false;
        }
      }

      // 搜索关键字模糊匹配
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (dev.name || '').toLowerCase().includes(q);
        const protoMatch = (dev.inferredProtocol || '').toLowerCase().includes(q);
        const catMatch = (dev.categoryPath || '').toLowerCase().includes(q);
        const creatorMatch = (dev.userName || dev.creator || '').toLowerCase().includes(q);
        if (!nameMatch && !protoMatch && !catMatch && !creatorMatch) return false;
      }

      return true;
    });
  }, [allDevices, sourceFilter, typeFilter, protocolFilter, searchQuery]);

  const hasActiveFilters = searchQuery.trim() !== '' || sourceFilter !== 'all' || typeFilter !== '全部类型' || protocolFilter !== '全部协议';

  const resetFilters = () => {
    setSearchQuery('');
    setSourceFilter('all');
    setTypeFilter('全部类型');
    setProtocolFilter('全部协议');
  };

  const handleAdd = (device: any) => {
    onAddDevice(device);
    setToastMessage(`已将「${device.name}」添加至仿真画布`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-[1140px] max-w-full h-[88vh] max-h-[850px] flex flex-col overflow-hidden border border-gray-100">
        
        {/* 1. 弹窗顶部 Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-200/60 shadow-xs">
              <Layers size={22} className="text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-lg">仿真设备中心</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  全网可用 {allDevices.length} 款设备
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                支持按来源、类型与通信协议快速筛选检索。鼠标悬浮设备卡片点击【+】号，即可一键加入当前设计画布。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs font-medium">
              画布已有: <strong className="text-blue-600 font-mono text-sm">{canvasDeviceCount}</strong> 台设备
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="关闭弹窗"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 2. 筛选与搜索工具条（对标仿真设备中心） */}
        <div className="p-4 border-b border-gray-100 bg-white space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-4">
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索设备名称、协议、型号或创建人..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-8 py-2 text-xs outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            {/* 统计与重置 */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                匹配结果: <strong className="text-blue-600 font-mono">{filteredDevices.length}</strong> 款
              </span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md border border-red-200 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RotateCcw size={12} />
                  重置筛选
                </button>
              )}
            </div>
          </div>

          {/* 三组筛选标签 */}
          <div className="flex flex-col sm:flex-row gap-2.5 text-xs">
            {/* 来源 */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium shrink-0">来源:</span>
              <div className="flex items-center bg-gray-100/70 p-0.5 rounded-lg border border-gray-200/60">
                {[
                  { key: 'all', label: '全部来源' },
                  { key: 'system', label: '系统设备' },
                  { key: 'custom', label: '自定义设备' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setSourceFilter(item.key as any)}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                      sourceFilter === item.key
                        ? 'bg-white text-blue-600 shadow-xs font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 类型 */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium shrink-0">类型:</span>
              <div className="flex items-center gap-1 flex-wrap">
                {['全部类型', '传感器', '执行器', '网关', '继电器'].map(type => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-2.5 py-1 rounded-md transition-all border font-medium cursor-pointer ${
                      typeFilter === type
                        ? 'bg-blue-50 text-blue-600 border-blue-200 font-semibold shadow-2xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 协议 */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium shrink-0">协议:</span>
              <div className="flex items-center gap-1 flex-wrap">
                {['全部协议', 'Modbus', 'Zigbee', '模拟量', '数字量'].map(proto => (
                  <button
                    key={proto}
                    onClick={() => setProtocolFilter(proto)}
                    className={`px-2.5 py-1 rounded-md transition-all border font-medium cursor-pointer ${
                      protocolFilter === proto
                        ? 'bg-blue-50 text-blue-600 border-blue-200 font-semibold shadow-2xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {proto}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. 实时加入提示条 (Toast Banner) */}
        {toastMessage && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in duration-150 shrink-0">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              {toastMessage}
            </span>
            <span className="text-emerald-600 text-[11px]">可继续点击添加其他设备</span>
          </div>
        )}

        {/* 4. 设备卡片展示网格 (Grid) */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 custom-scrollbar">
          {filteredDevices.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-gray-400">
              <Box size={42} className="text-gray-300 stroke-[1.5] mb-3" />
              <p className="text-sm font-medium text-gray-600">未找到符合条件的仿真设备</p>
              <p className="text-xs text-gray-400 mt-1">请尝试修改搜索词或重置筛选条件</p>
              <button
                onClick={resetFilters}
                className="mt-3 text-xs text-blue-600 hover:underline cursor-pointer"
              >
                重置全部筛选
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredDevices.map(device => {
                const imgUrl = getDeviceImageUrl(device.id, device.image);
                const isCustom = Boolean(device.isCustom);

                return (
                  <div
                    key={device.id}
                    onClick={() => handleAdd(device)}
                    className="bg-white rounded-xl border border-gray-200/80 p-3 flex flex-col items-center relative transition-all duration-200 hover:shadow-lg hover:border-blue-400 group cursor-pointer"
                    title={`点击将【${device.name}】添加至当前仿真画布`}
                  >
                    {/* 上部：图片框 + 悬浮加号遮罩 */}
                    <div className={`w-full aspect-square max-w-[130px] relative flex items-center justify-center rounded-lg p-2 overflow-hidden transition-colors ${
                      isCustom ? 'bg-purple-50/50' : 'bg-gray-50/70'
                    }`}>
                      {/* 自定义徽标 */}
                      {isCustom && (
                        <span className="absolute top-1.5 left-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-2xs z-10">
                          自定义
                        </span>
                      )}

                      {/* 设备图片 */}
                      <img
                        src={imgUrl}
                        alt={device.name}
                        className="w-full h-full object-contain relative z-0 transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* 核心交互：鼠标悬浮展示加号遮罩 (Hover Overlay with Plus icon) */}
                      <div className="absolute inset-0 bg-blue-900/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center rounded-lg z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdd(device);
                          }}
                          className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-110 hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
                          title="点击添加到画布"
                        >
                          <Plus size={22} strokeWidth={2.5} />
                        </button>
                        <span className="text-[10px] font-bold text-white bg-slate-900/85 px-2 py-0.5 rounded-full mt-2 shadow-xs">
                          添加到画布
                        </span>
                      </div>
                    </div>

                    {/* 下部：设备信息 */}
                    <div className="mt-2.5 flex flex-col items-center w-full px-0.5">
                      <div 
                        className={`text-xs font-bold text-center w-full truncate transition-colors ${
                          isCustom ? 'text-purple-800 group-hover:text-purple-950' : 'text-gray-800 group-hover:text-blue-600'
                        }`} 
                        title={device.name}
                      >
                        {device.name}
                      </div>

                      {/* 类型与协议徽章 */}
                      <div className="flex items-center gap-1 mt-1.5 w-full justify-center flex-wrap">
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded border border-blue-100">
                          {device.inferredType || '传感器'}
                        </span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-100">
                          {device.inferredProtocol || 'Modbus'}
                        </span>
                      </div>

                      {/* 来源标识 */}
                      <div className="text-[10px] text-gray-400 mt-1.5 truncate w-full text-center">
                        {isCustom ? (
                          <span className="text-purple-600 font-medium">👤 {device.userName || device.creator || '杨振邦'}</span>
                        ) : (
                          <span>🏢 系统标准物料</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. 底部状态栏 */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>提示：点击任意设备卡片或卡片中央出现的【+】号，设备将自动添加并排列在当前仿真画布中。</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            完成选择并返回
          </button>
        </div>

      </div>
    </div>
  );
}
