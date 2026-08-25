import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, X, ChevronDown, ChevronUp, Eye, Compass, 
  Cpu, FolderKanban, Sliders, Sparkles, MonitorSmartphone,
  Layers, ArrowUpRight
} from 'lucide-react';
import { useHeader } from '../context/HeaderContext';

export default function GlobalFloatingNav() {
  const { isHeaderVisible, showHeader } = useHeader();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 如果顶部导航栏是可见的，左下角默认不打扰用户（或者完全收起）
  if (isHeaderVisible) {
    return null;
  }

  const handleNavigate = (path: string, primaryNav?: string) => {
    setIsOpen(false);
    if (path === '/') {
      navigate('/', { state: { activeTab: primaryNav || '仿真设备中心' } });
    } else {
      navigate(path);
    }
  };

  const isHomeDevices = location.pathname === '/' && (!location.state || location.state.activeTab !== '仿真项目大厅');
  const isHomeProjects = location.pathname === '/' && location.state?.activeTab === '仿真项目大厅';
  const isConsole = location.pathname.startsWith('/console');

  return (
    <>
      {/* 顶部隐藏后在屏幕正中间保留的向下小箭头 */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[99998] select-none">
        <button
          onClick={showHeader}
          className="py-1 px-4 rounded-b-xl bg-white/90 hover:bg-white text-gray-400 hover:text-[#1890ff] shadow-md border-x border-b border-gray-200/80 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1 group backdrop-blur-sm"
          title="点击恢复显示顶部导航"
        >
          <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform stroke-[2.5]" />
        </button>
      </div>

      {/* 左下角页面切换控制器 */}
      <div className="fixed bottom-6 left-6 z-[99999] select-none">
        {/* 弹出的页面切换与恢复顶部菜单 */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-2xs animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />
        )}

      <div 
        className={`absolute bottom-14 left-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 z-50 transition-all duration-200 origin-bottom-left ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
        }`}
      >
        {/* 顶部标题与关闭按钮 */}
        <div className="px-2 py-1.5 flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
            <Compass size={15} className="text-[#1890ff]" />
            <span>页面导航 & 控制</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* 核心功能：恢复显示顶部导航 */}
        <button
          onClick={() => {
            showHeader();
            setIsOpen(false);
          }}
          className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/70 hover:from-blue-100 hover:to-indigo-100 text-[#1890ff] text-xs font-bold transition-all flex items-center justify-between border border-blue-100/80 mb-2.5 cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <ChevronDown size={14} className="stroke-[3]" />
            </div>
            <span>恢复显示顶部导航</span>
          </div>
          <span className="text-[10px] text-blue-400 font-normal">点击展开</span>
        </button>

        {/* 快捷页面跳转列表 */}
        <div className="space-y-1 text-xs">
          <div className="text-[11px] font-semibold text-gray-400 px-2 pt-1 pb-0.5">快速切换页面</div>
          
          {/* 1. 仿真设备中心 */}
          <button
            onClick={() => handleNavigate('/', '仿真设备中心')}
            className={`w-full px-3 py-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
              isHomeDevices 
                ? 'bg-blue-50 text-[#1890ff] font-bold shadow-2xs' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Cpu size={15} className={isHomeDevices ? 'text-[#1890ff]' : 'text-gray-400'} />
              <span>仿真设备中心</span>
            </div>
            {isHomeDevices && <span className="w-1.5 h-1.5 rounded-full bg-[#1890ff]"></span>}
          </button>

          {/* 2. 仿真项目大厅 */}
          <button
            onClick={() => handleNavigate('/', '仿真项目大厅')}
            className={`w-full px-3 py-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
              isHomeProjects 
                ? 'bg-blue-50 text-[#1890ff] font-bold shadow-2xs' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FolderKanban size={15} className={isHomeProjects ? 'text-[#1890ff]' : 'text-gray-400'} />
              <span>仿真项目大厅</span>
            </div>
            {isHomeProjects && <span className="w-1.5 h-1.5 rounded-full bg-[#1890ff]"></span>}
          </button>

          {/* 3. 控制台 */}
          <button
            onClick={() => handleNavigate('/console')}
            className={`w-full px-3 py-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
              isConsole 
                ? 'bg-blue-50 text-[#1890ff] font-bold shadow-2xs' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sliders size={15} className={isConsole ? 'text-[#1890ff]' : 'text-gray-400'} />
              <span>控制台</span>
            </div>
            {isConsole && <span className="w-1.5 h-1.5 rounded-full bg-[#1890ff]"></span>}
          </button>
        </div>
      </div>

      {/* 左下角小浮动图标 (沉浸全屏模式下的页面导航与恢复入口) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-11 h-11 bg-white/95 hover:bg-white text-gray-700 hover:text-[#1890ff] rounded-2xl flex items-center justify-center shadow-lg border border-gray-200/80 transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm group relative"
        title="页面导航 & 显示顶部导航"
      >
        <Compass size={20} className="group-hover:rotate-45 transition-transform duration-300 text-gray-700 group-hover:text-[#1890ff]" />
        
        {/* 呼吸红点/指示器 */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#1890ff]"></span>
        </span>
      </button>
      </div>
    </>
  );
}
