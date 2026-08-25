import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Copy, Check, Eye, X, RefreshCw, ChevronLeft, 
  ChevronRight, AlertCircle, Sparkles, CheckCircle2, 
  Layers, ExternalLink, Trash2, Smartphone, LayoutGrid
} from 'lucide-react';
import { UserAppItem, initialUserApps } from '../data/userAppList';

const STORAGE_KEY = 'xlab_user_app_management_v1';

export default function UserAppManager() {
  // 数据源（带 LocalStorage 持久化）
  const [appList, setAppList] = useState<UserAppItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load user app list from localStorage', e);
    }
    return initialUserApps;
  });

  // 持久化存储
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appList));
    } catch (e) {
      console.error('Failed to save user app list to localStorage', e);
    }
  }, [appList]);

  // Tab 切换：'用户' | '系统库'
  const [activeTab, setActiveTab] = useState<'用户' | '系统库'>('用户');

  // 筛选状态
  const [searchAppName, setSearchAppName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // 当前激活生效的过滤条件（点击搜索按钮时触发生效）
  const [appliedFilters, setAppliedFilters] = useState({
    name: '',
    phone: '',
    status: 'all'
  });

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpPageInput, setJumpPageInput] = useState('1');

  // 模态弹窗状态
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cloneModalApp, setCloneModalApp] = useState<UserAppItem | null>(null);
  const [cloneNewName, setCloneNewName] = useState('');
  const [deleteConfirmApp, setDeleteConfirmApp] = useState<UserAppItem | null>(null);

  // Toast 提示
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 2500);
  };

  // 执行搜索
  const handleSearch = () => {
    setAppliedFilters({
      name: searchAppName.trim(),
      phone: searchPhone.trim(),
      status: selectedStatus
    });
    setCurrentPage(1);
    setJumpPageInput('1');
  };

  // 清除搜索
  const handleResetFilters = () => {
    setSearchAppName('');
    setSearchPhone('');
    setSelectedStatus('all');
    setAppliedFilters({
      name: '',
      phone: '',
      status: 'all'
    });
    setCurrentPage(1);
    setJumpPageInput('1');
    showToast('已重置所有筛选条件', 'info');
  };

  // 过滤后的应用列表
  const filteredApps = useMemo(() => {
    return appList.filter(item => {
      // Tab 过滤
      if (item.source !== activeTab) return false;

      // 名称过滤
      if (appliedFilters.name && !item.name.toLowerCase().includes(appliedFilters.name.toLowerCase())) {
        return false;
      }

      // 手机号过滤
      if (appliedFilters.phone && !item.phone.includes(appliedFilters.phone)) {
        return false;
      }

      // 状态过滤
      if (appliedFilters.status !== 'all' && item.status !== appliedFilters.status) {
        return false;
      }

      return true;
    });
  }, [appList, activeTab, appliedFilters]);

  // 分页计算
  const totalCount = filteredApps.length;
  // 为匹配截图的 "共 1825 条 / 183页" 视觉真实感，当处于用户 Tab 且默认数据时，计算总页数；若总数较少则按真实数量
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const paginatedApps = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApps.slice(start, start + pageSize);
  }, [filteredApps, currentPage, pageSize]);

  // 打开克隆弹窗
  const openCloneModal = (app: UserAppItem) => {
    setCloneModalApp(app);
    setCloneNewName(`${app.name}_副本`);
  };

  // 执行克隆
  const handleConfirmClone = () => {
    if (!cloneModalApp) return;
    const newApp: UserAppItem = {
      id: Date.now(),
      name: cloneNewName.trim() || `${cloneModalApp.name}_副本`,
      phone: '18396528500', // 当前登录用户
      createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      appType: cloneModalApp.appType || '仿真',
      status: '草稿',
      coverImage: cloneModalApp.coverImage || '',
      source: '用户',
      author: '杨振邦 (我)',
      description: `克隆自【${cloneModalApp.name}】`
    };

    setAppList(prev => [newApp, ...prev]);
    showToast(`成功克隆应用【${newApp.name}】！已加入您的应用列表`, 'success');
    setCloneModalApp(null);
    if (activeTab !== '用户') {
      setActiveTab('用户');
    }
  };

  // 执行删除
  const handleConfirmDelete = () => {
    if (!deleteConfirmApp) return;
    setAppList(prev => prev.filter(item => item.id !== deleteConfirmApp.id));
    showToast(`已删除应用【${deleteConfirmApp.name}】`, 'info');
    setDeleteConfirmApp(null);
  };

  // 处理跳转页
  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    } else {
      setJumpPageInput(String(currentPage));
    }
  };

  // 生成页码数字数组
  const paginationRange = useMemo(() => {
    const delta = 2;
    const range: (number | string)[] = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  }, [currentPage, totalPages]);

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

      {/* 顶部工具栏 (精准还原截图布局：左侧 Tabs，右侧筛选输入框与搜索按钮) */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 shrink-0 bg-white">
        {/* 左侧：Tabs 切换 (用户 / 系统库) */}
        <div className="inline-flex rounded-md border border-gray-200 p-0.5 bg-gray-50/60 shadow-2xs">
          <button
            onClick={() => {
              setActiveTab('用户');
              setCurrentPage(1);
            }}
            className={`px-5 py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
              activeTab === '用户'
                ? 'bg-white text-[#1890ff] font-semibold shadow-xs border border-gray-100'
                : 'text-gray-600 hover:text-gray-900 border border-transparent'
            }`}
          >
            用户
          </button>
          <button
            onClick={() => {
              setActiveTab('系统库');
              setCurrentPage(1);
            }}
            className={`px-5 py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
              activeTab === '系统库'
                ? 'bg-white text-[#1890ff] font-semibold shadow-xs border border-gray-100'
                : 'text-gray-600 hover:text-gray-900 border border-transparent'
            }`}
          >
            系统库
          </button>
        </div>

        {/* 右侧：筛选条件 (应用名称 + 手机号码 + 发布状态 + 搜索按钮) */}
        <div className="flex items-center gap-2.5">
          {/* 应用名称输入框 */}
          <input
            type="text"
            value={searchAppName}
            onChange={(e) => setSearchAppName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="应用名称"
            className="w-36 h-8 px-3 text-xs text-gray-700 bg-white border border-gray-300 rounded outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] transition-all placeholder:text-gray-400"
          />

          {/* 手机号码输入框 */}
          <input
            type="text"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="手机号码"
            className="w-36 h-8 px-3 text-xs text-gray-700 bg-white border border-gray-300 rounded outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] transition-all placeholder:text-gray-400"
          />

          {/* 发布状态下拉选择 */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8 px-3 text-xs text-gray-700 bg-white border border-gray-300 rounded outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] transition-all cursor-pointer"
          >
            <option value="all">发布状态</option>
            <option value="草稿">草稿</option>
            <option value="已发布">已发布</option>
            <option value="已下架">已下架</option>
          </select>

          {/* 搜索按钮 (蓝色背景) */}
          <button
            onClick={handleSearch}
            className="h-8 px-4 bg-[#1890ff] hover:bg-[#40a9ff] text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer active:scale-98"
          >
            <Search size={13} className="stroke-[2.5]" />
            <span>搜索</span>
          </button>

          {/* 重置按钮 (有筛选条件时展示) */}
          {(appliedFilters.name || appliedFilters.phone || appliedFilters.status !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="h-8 px-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              title="重置筛选"
            >
              重置
            </button>
          )}
        </div>
      </div>

      {/* 数据表格区域 */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          {/* 表头 (对齐截图：序号、应用名称、手机号码、创建时间、应用类型、状态、封面图、操作) */}
          <thead className="sticky top-0 bg-[#fafafa] border-b border-gray-200 z-10">
            <tr className="text-gray-600 text-xs font-medium select-none">
              <th className="py-3 px-6 w-[8%] text-center">序号</th>
              <th className="py-3 px-6 w-[18%]">应用名称</th>
              <th className="py-3 px-6 w-[14%] text-center">手机号码</th>
              <th className="py-3 px-6 w-[18%] text-center">创建时间</th>
              <th className="py-3 px-6 w-[12%] text-center">应用类型</th>
              <th className="py-3 px-6 w-[10%] text-center">状态</th>
              <th className="py-3 px-6 w-[10%] text-center">封面图</th>
              <th className="py-3 px-6 w-[10%] text-center">操作</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
            {paginatedApps.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Layers size={36} className="text-gray-300 stroke-1" />
                    <span>暂无符合条件的用户应用</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedApps.map((app, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index + 1;

                return (
                  <tr 
                    key={app.id}
                    className="hover:bg-[#f5f9ff] transition-colors group"
                  >
                    {/* 1. 序号 */}
                    <td className="py-3.5 px-6 text-center text-gray-600 font-mono">
                      {globalIndex}
                    </td>

                    {/* 2. 应用名称 */}
                    <td className="py-3.5 px-6 font-normal text-gray-900">
                      <span className="font-medium text-gray-800">{app.name}</span>
                    </td>

                    {/* 3. 手机号码 */}
                    <td className="py-3.5 px-6 text-center text-gray-600 font-mono">
                      {app.phone}
                    </td>

                    {/* 4. 创建时间 */}
                    <td className="py-3.5 px-6 text-center text-gray-500 font-mono">
                      {app.createTime}
                    </td>

                    {/* 5. 应用类型 */}
                    <td className="py-3.5 px-6 text-center text-gray-700">
                      {app.appType || '仿真'}
                    </td>

                    {/* 6. 状态 */}
                    <td className="py-3.5 px-6 text-center">
                      <span className={`${
                        app.status === '已发布' ? 'text-emerald-600 font-medium' :
                        app.status === '已下架' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {app.status || '草稿'}
                      </span>
                    </td>

                    {/* 7. 封面图 */}
                    <td className="py-3.5 px-6 text-center">
                      {app.coverImage ? (
                        <div 
                          onClick={() => setPreviewImage(app.coverImage!)}
                          className="w-9 h-9 rounded border border-gray-200 bg-white p-0.5 mx-auto cursor-pointer hover:border-blue-500 transition-colors flex items-center justify-center group/img"
                          title="点击查看大图"
                        >
                          <img 
                            src={app.coverImage} 
                            alt={app.name}
                            className="max-h-full max-w-full object-cover rounded group-hover/img:scale-110 transition-transform"
                            onError={(e) => {
                              // 图片加载失败降级
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400 font-mono">-</span>
                      )}
                    </td>

                    {/* 8. 操作 (蓝色链接克隆) */}
                    <td className="py-3.5 px-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => openCloneModal(app)}
                          className="text-[#1890ff] hover:text-[#40a9ff] flex items-center gap-1 font-medium cursor-pointer transition-colors"
                          title="克隆此应用"
                        >
                          <Copy size={13} />
                          <span>克隆</span>
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

      {/* 底部翻页分页栏 (完全对齐截图：共 1825 条、10条/页、数字页码、前往 [ ] 页) */}
      <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-end gap-5 text-xs text-gray-600 shrink-0 select-none">
        {/* 左侧汇总 */}
        <div>
          共 <span className="font-medium text-gray-800">{totalCount}</span> 条
        </div>

        {/* 每页条数下拉 */}
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="border border-gray-300 rounded px-2 py-1 bg-white text-xs text-gray-700 outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value={10}>10条/页</option>
          <option value={20}>20条/页</option>
          <option value={50}>50条/页</option>
        </select>

        {/* 分页按钮组 */}
        <div className="flex items-center gap-1">
          {/* 上一页 */}
          <button
            disabled={currentPage === 1}
            onClick={() => {
              const prev = Math.max(1, currentPage - 1);
              setCurrentPage(prev);
              setJumpPageInput(String(prev));
            }}
            className={`w-7 h-7 rounded border flex items-center justify-center transition-colors ${
              currentPage === 1
                ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-500 cursor-pointer bg-white'
            }`}
          >
            <ChevronLeft size={14} />
          </button>

          {/* 页码数字 */}
          {paginationRange.map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="w-7 h-7 flex items-center justify-center text-gray-400 font-mono">
                  ...
                </span>
              );
            }

            const isCurrent = currentPage === page;

            return (
              <button
                key={page}
                onClick={() => {
                  setCurrentPage(Number(page));
                  setJumpPageInput(String(page));
                }}
                className={`w-7 h-7 rounded text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#1890ff] text-white border border-[#1890ff] shadow-xs'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-500'
                }`}
              >
                {page}
              </button>
            );
          })}

          {/* 下一页 */}
          <button
            disabled={currentPage === totalPages}
            onClick={() => {
              const next = Math.min(totalPages, currentPage + 1);
              setCurrentPage(next);
              setJumpPageInput(String(next));
            }}
            className={`w-7 h-7 rounded border flex items-center justify-center transition-colors ${
              currentPage === totalPages
                ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-500 cursor-pointer bg-white'
            }`}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* 前往指定页 */}
        <form onSubmit={handleJumpPage} className="flex items-center gap-1 text-gray-600">
          <span>前往</span>
          <input
            type="text"
            value={jumpPageInput}
            onChange={(e) => setJumpPageInput(e.target.value)}
            className="w-10 h-7 text-center border border-gray-300 rounded text-xs outline-none focus:border-blue-500 bg-white"
          />
          <span>页</span>
        </form>
      </div>

      {/* 克隆确认弹窗 */}
      {cloneModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-[420px] overflow-hidden animate-in zoom-in-95 duration-150 border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#fafafa]">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <Copy size={16} className="text-[#1890ff]" />
                <span>克隆应用工程</span>
              </h3>
              <button 
                onClick={() => setCloneModalApp(null)}
                className="text-gray-400 hover:text-gray-600 rounded p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-blue-800 leading-relaxed">
                正在从源应用 <strong>【{cloneModalApp.name}】</strong> 克隆出完整仿真工程与接线拓扑配置。
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1.5">
                  新应用工程名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cloneNewName}
                  onChange={(e) => setCloneNewName(e.target.value)}
                  placeholder="请输入克隆后的新名称"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between text-gray-500 pt-2 text-[11px]">
                <span>源工程状态: {cloneModalApp.status}</span>
                <span>创建者: {cloneModalApp.author || '用户'}</span>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCloneModalApp(null)}
                className="px-4 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-white text-xs transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmClone}
                className="px-5 py-1.5 rounded bg-[#1890ff] hover:bg-[#40a9ff] text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
              >
                确认克隆
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
            <img src={previewImage} alt="封面预览" className="max-w-full max-h-[70vh] object-contain rounded" />
          </div>
        </div>
      )}
    </div>
  );
}
