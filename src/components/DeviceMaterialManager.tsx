import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Plus, Filter, Tag, LayoutGrid, List, 
  Trash2, Edit3, Eye, Upload, Image as ImageIcon,
  X, Check, AlertCircle, Sparkles, RefreshCw, Folder,
  ExternalLink, Layers, Box, Info
} from 'lucide-react';
import { 
  DeviceMaterial, 
  initialDeviceMaterials, 
  materialCategories, 
  commonMaterialTags 
} from '../data/defaultMaterials';

interface Props {
  onOpenCreateModal?: () => void;
  createModalTrigger?: number;
}

const STORAGE_KEY = 'xlab_device_materials';

export default function DeviceMaterialManager({ createModalTrigger }: Props) {
  // Materials state with localStorage persistence
  const [materials, setMaterials] = useState<DeviceMaterial[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load materials from localStorage', e);
    }
    return initialDeviceMaterials;
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
    } catch (e) {
      console.error('Failed to save materials to localStorage', e);
    }
  }, [materials]);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpPageInput, setJumpPageInput] = useState('1');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<DeviceMaterial | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<DeviceMaterial | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('传感器');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formTagInput, setFormTagInput] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // External trigger to open create modal
  useEffect(() => {
    if (createModalTrigger && createModalTrigger > 0) {
      openCreateModal();
    }
  }, [createModalTrigger]);

  // All distinct tags from current materials + common tags
  const allAvailableTags = useMemo(() => {
    const set = new Set<string>(commonMaterialTags);
    materials.forEach(m => {
      m.tags?.forEach(t => set.add(t));
    });
    return Array.from(set);
  }, [materials]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter(item => {
      // Category filter
      if (selectedCategory !== '全部' && item.category !== selectedCategory) {
        return false;
      }
      // Tags filter (must contain all selected tags)
      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every(t => item.tags?.includes(t));
        if (!hasAllTags) return false;
      }
      // Keyword search (name, description, tags)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchTag = item.tags?.some(t => t.toLowerCase().includes(q));
        const matchCat = item.category?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchTag && !matchCat) return false;
      }
      return true;
    });
  }, [materials, selectedCategory, selectedTags, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setJumpPageInput('1');
  }, [searchQuery, selectedCategory, selectedTags, pageSize]);

  // Total pages and paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredMaterials.length / pageSize));

  const paginatedMaterials = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMaterials.slice(start, start + pageSize);
  }, [filteredMaterials, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    const target = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(target);
    setJumpPageInput(String(target));
  };

  const handleJumpPageSubmit = () => {
    const val = parseInt(jumpPageInput, 10);
    if (!isNaN(val)) {
      handlePageChange(val);
    } else {
      setJumpPageInput(String(currentPage));
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingMaterial(null);
    setFormName('');
    setFormCategory('传感器');
    setFormTags(['工业级', 'RS485']);
    setFormTagInput('');
    setFormImage('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (material: DeviceMaterial) => {
    setEditingMaterial(material);
    setFormName(material.name);
    setFormCategory(material.category || '传感器');
    setFormTags(material.tags ? [...material.tags] : []);
    setFormTagInput('');
    setFormImage(material.image || '');
    setFormDescription(material.description || '');
    setIsModalOpen(true);
  };

  // Handle Tag Input Addition
  const handleAddTag = (tagToAdd?: string) => {
    const val = (tagToAdd ?? formTagInput).trim();
    if (!val) return;
    if (!formTags.includes(val)) {
      setFormTags(prev => [...prev, val]);
    }
    if (!tagToAdd) setFormTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormTags(prev => prev.filter(t => t !== tagToRemove));
  };

  // Toggle tag filter
  const toggleFilterTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Handle Image Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('图片大小不能超过 3MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('请输入素材名称');
      return;
    }
    if (!formImage.trim()) {
      alert('请设置素材图片');
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (editingMaterial) {
      // Update
      setMaterials(prev => prev.map(m => {
        if (m.id === editingMaterial.id) {
          return {
            ...m,
            name: formName.trim(),
            category: formCategory,
            tags: formTags,
            image: formImage.trim(),
            description: formDescription.trim(),
          };
        }
        return m;
      }));
    } else {
      // Create
      const newMat: DeviceMaterial = {
        id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: formName.trim(),
        category: formCategory,
        tags: formTags,
        image: formImage.trim(),
        description: formDescription.trim() || '通用AI设备素材，适用于自定义设备外观匹配与渲染。',
        createdAt: now,
        usageCount: 0,
      };
      setMaterials(prev => [newMat, ...prev]);
    }

    setIsModalOpen(false);
  };

  // Delete Material
  const handleDelete = (id: string, name: string) => {
    if (confirm(`确定要删除设备素材 "${name}" 吗？删除后AI在生成对应类别设备时将无法引用此素材。`)) {
      setMaterials(prev => prev.filter(m => m.id !== id));
      if (previewMaterial?.id === id) {
        setPreviewMaterial(null);
      }
    }
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    if (confirm('确定要恢复系统默认的设备素材库吗？这将重置内置素材列表。')) {
      setMaterials(initialDeviceMaterials);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDeviceMaterials));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f0f2f5]">
      
      {/* Top Filter & Toolbar Banner */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex flex-col gap-3">
          
          {/* Header Row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Layers className="text-blue-500" size={20} />
                设备素材管理
                <span className="text-xs font-normal bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full border border-blue-100 font-mono">
                  共 {materials.length} 项素材
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                用于管理 AI 在生成自定义仿真设备时所调用的图片外观、分类结构与特征标签
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleResetDefaults}
                className="px-3 py-1.5 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="重置恢复内置初始素材"
              >
                <RefreshCw size={13} className="text-gray-500" />
                重置预设
              </button>
              
              <button
                onClick={openCreateModal}
                className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:shadow"
              >
                <Plus size={15} />
                新建素材
              </button>
            </div>
          </div>

          {/* Search & Category Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-gray-100">
            
            {/* Categories Pills */}
            <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
              {materialCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-all shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Right Controls: Search & View Switch */}
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索素材名称、标签、描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-7 py-1.5 text-xs outline-none focus:border-blue-400 focus:bg-white transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* View Switch */}
              <div className="flex items-center bg-gray-100 border border-gray-200 p-0.5 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                  title="网格视图"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                  title="表格视图"
                >
                  <List size={14} />
                </button>
              </div>
            </div>

          </div>

          {/* Tags Cloud Filter Bar */}
          <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
            <span className="text-gray-400 flex items-center gap-1 shrink-0 font-medium">
              <Tag size={12} /> 标签筛选:
            </span>
            {allAvailableTags.slice(0, 14).map(tag => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleFilterTag(tag)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-normal transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-purple-100 text-purple-700 border border-purple-300 font-medium'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  <span>{tag}</span>
                  {isSelected && <Check size={10} />}
                </button>
              );
            })}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="text-[11px] text-red-500 hover:underline ml-1 cursor-pointer"
              >
                清除标签筛选 ({selectedTags.length})
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Main Material Content */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        {filteredMaterials.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto my-8 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
              <Box size={28} />
            </div>
            <h4 className="font-bold text-gray-700 text-sm mb-1">未找到符合条件的设备素材</h4>
            <p className="text-xs text-gray-400 mb-4">
              尝试清除筛选关键词或点击右上角新建专属设备素材
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('全部'); setSelectedTags([]); }}
                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                重置所有筛选
              </button>
              <button
                onClick={openCreateModal}
                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                新建素材
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
            {paginatedMaterials.map(mat => (
              <div
                key={mat.id}
                className="bg-white rounded-xl border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 overflow-hidden flex flex-col group relative"
              >
                {/* Image Preview Box */}
                <div 
                  onClick={() => setPreviewMaterial(mat)}
                  className="h-40 bg-gradient-to-b from-gray-50 to-white relative p-4 flex items-center justify-center border-b border-gray-100 overflow-hidden cursor-pointer group/img"
                >
                  <span className="absolute top-2.5 left-2.5 bg-blue-50/90 text-blue-600 border border-blue-200/80 backdrop-blur-xs text-[10px] font-bold px-2 py-0.5 rounded-md z-10 shadow-2xs">
                    {mat.category}
                  </span>

                  <img
                    src={mat.image}
                    alt={mat.name}
                    className="w-full h-full object-contain group-hover/img:scale-108 transition-transform duration-300 pointer-events-none"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />

                  {/* Hover Quick Action Layer */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewMaterial(mat); }}
                      className="w-8 h-8 rounded-full bg-white/90 text-gray-700 hover:text-blue-600 hover:bg-white flex items-center justify-center shadow-md transition-transform hover:scale-110"
                      title="预览详情"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(mat); }}
                      className="w-8 h-8 rounded-full bg-white/90 text-gray-700 hover:text-blue-600 hover:bg-white flex items-center justify-center shadow-md transition-transform hover:scale-110"
                      title="编辑素材"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(mat.id, mat.name); }}
                      className="w-8 h-8 rounded-full bg-white/90 text-gray-700 hover:text-red-600 hover:bg-white flex items-center justify-center shadow-md transition-transform hover:scale-110"
                      title="删除素材"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Card Information */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div 
                      onClick={() => setPreviewMaterial(mat)}
                      className="font-bold text-gray-800 text-[13px] truncate hover:text-blue-600 cursor-pointer transition-colors" 
                      title={mat.name}
                    >
                      {mat.name}
                    </div>
                    
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed" title={mat.description}>
                      {mat.description || '暂无详细描述'}
                    </p>
                  </div>

                  {/* Tags & Footer */}
                  <div className="mt-3 pt-2 border-t border-gray-50">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {mat.tags?.slice(0, 3).map((t, idx) => (
                        <span 
                          key={idx}
                          onClick={() => toggleFilterTag(t)}
                          className="text-[10px] bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          #{t}
                        </span>
                      ))}
                      {(mat.tags?.length || 0) > 3 && (
                        <span className="text-[10px] text-gray-400 self-center">
                          +{mat.tags.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                      <span>{mat.createdAt?.substring(0, 10)}</span>
                      {mat.usageCount !== undefined && (
                        <span className="text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded font-sans flex items-center gap-0.5">
                          <Sparkles size={9} /> AI已引用 {mat.usageCount}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700">
                <tr>
                  <th className="px-6 py-3 w-20">缩略图</th>
                  <th className="px-6 py-3">素材名称</th>
                  <th className="px-6 py-3 w-28">所属分类</th>
                  <th className="px-6 py-3">标签</th>
                  <th className="px-6 py-3">简短描述</th>
                  <th className="px-6 py-3 w-36">创建时间</th>
                  <th className="px-6 py-3 text-right w-28">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedMaterials.map(mat => (
                  <tr key={mat.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-6 py-3">
                      <div 
                        onClick={() => setPreviewMaterial(mat)}
                        className="w-11 h-11 rounded-lg bg-gray-50 border border-gray-200 p-1 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
                      >
                        <img src={mat.image} alt="" className="w-full h-full object-contain" />
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div 
                        onClick={() => setPreviewMaterial(mat)}
                        className="font-bold text-gray-800 hover:text-blue-600 cursor-pointer transition-colors text-xs"
                      >
                        {mat.name}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">{mat.id}</div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs border border-blue-100 font-medium">
                        {mat.category}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {mat.tags?.map((t, idx) => (
                          <span 
                            key={idx}
                            onClick={() => toggleFilterTag(t)}
                            className="text-[10px] bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-xs text-gray-500 max-w-md truncate" title={mat.description}>
                        {mat.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-400 font-mono">
                      {mat.createdAt}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-3 text-xs">
                        <button
                          onClick={() => setPreviewMaterial(mat)}
                          className="text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          查看
                        </button>
                        <button
                          onClick={() => openEditModal(mat)}
                          className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer font-medium"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(mat.id, mat.name)}
                          className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {filteredMaterials.length > 0 && (
        <div className="p-4 bg-white border-t border-gray-200 flex justify-end items-center text-sm text-gray-500 gap-4 shrink-0 shadow-2xs">
          <span>共 {filteredMaterials.length} 项素材</span>
          
          <select 
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-gray-200 rounded px-2 py-1 outline-none text-gray-600 hover:border-gray-400 transition-colors cursor-pointer focus:ring-1 focus:ring-blue-500 text-xs"
          >
            <option value={8}>8项/页</option>
            <option value={10}>10项/页</option>
            <option value={20}>20项/页</option>
            <option value={50}>50项/页</option>
          </select>

          {/* Page Buttons */}
          <div className="flex gap-1 items-center">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className={`w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-xs transition-colors ${
                currentPage <= 1 ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700 cursor-pointer'
              }`}
            >
              {'<'}
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
              // Simple smart truncation for pagination buttons if totalPages > 7
              if (totalPages > 7) {
                if (p !== 1 && p !== totalPages && Math.abs(p - currentPage) > 2) {
                  if (p === 2 || p === totalPages - 1) {
                    return <span key={p} className="px-1 text-gray-400 text-xs">...</span>;
                  }
                  return null;
                }
              }
              const isActive = currentPage === p;
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-8 h-8 flex items-center justify-center border rounded text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'border-blue-500 bg-blue-500 text-white shadow-xs'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className={`w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-xs transition-colors ${
                currentPage >= totalPages ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700 cursor-pointer'
              }`}
            >
              {'>'}
            </button>
          </div>

          {/* Quick Jump Input */}
          <div className="flex items-center gap-2 text-xs">
            前往 
            <input 
              type="text"
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              onBlur={handleJumpPageSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJumpPageSubmit();
              }}
              className="w-12 border border-gray-200 rounded px-1 py-1 text-center outline-none focus:border-blue-500 transition-colors text-xs" 
            /> 
            页
          </div>
        </div>
      )}

      {/* Create / Edit Material Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/70 shrink-0">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Sparkles size={18} className="text-blue-500" />
                {editingMaterial ? '编辑设备素材' : '新建设备素材'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              
              {/* Material Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  素材名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="例如：高精度工业温湿度变送器、4路继电器控制板"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  required
                />
              </div>

              {/* Category & Tags Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    素材分类 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {materialCategories.filter(c => c !== '全部').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Tag Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    添加特征标签 (按回车添加)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="输入标签按回车"
                      value={formTagInput}
                      onChange={(e) => setFormTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTag()}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg font-medium transition-colors cursor-pointer"
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Tags List & Quick Suggestions */}
              <div>
                <div className="text-[11px] text-gray-400 mb-1.5">当前素材标签：</div>
                <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-gray-50 rounded-lg border border-gray-100">
                  {formTags.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">暂未设置标签，点击下方推荐或手动输入</span>
                  ) : (
                    formTags.map(t => (
                      <span
                        key={t}
                        className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded-md flex items-center gap-1 font-medium shadow-2xs"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-red-500 ml-0.5"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Common Tags Quick Picks */}
                <div className="mt-2 flex items-center gap-1 flex-wrap text-xs text-gray-500">
                  <span className="text-[11px] text-gray-400">快速推荐：</span>
                  {commonMaterialTags.slice(0, 10).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      disabled={formTags.includes(tag)}
                      className={`text-[11px] px-1.5 py-0.5 rounded border transition-colors ${
                        formTags.includes(tag)
                          ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 cursor-pointer'
                      }`}
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Configuration - Local File Upload Only */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  素材图片 (仅支持本地文件上传) <span className="text-red-500">*</span>
                </label>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {!formImage ? (
                  /* Empty State: Upload / Drag Drop Zone */
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('图片大小不能超过 5MB');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) setFormImage(ev.target.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer ${
                      isDragOver
                        ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-100'
                        : 'border-gray-300 hover:border-blue-400 bg-gray-50/60 hover:bg-blue-50/20'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                      <Upload size={22} />
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-gray-700">
                        点击上传本地图片，或直接拖拽文件到这里
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1">
                        支持 PNG / JPG / JPEG / WebP / SVG，建议透明底图，文件大小不超过 5MB
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Uploaded Image Preview & Replace Zone */
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-4">
                    <div className="w-24 h-24 rounded-xl bg-white border border-gray-200 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-xs relative group/prev">
                      <img src={formImage} alt="Uploaded preview" className="w-full h-full object-contain" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-green-700 font-medium bg-green-50 px-2.5 py-1 rounded-md border border-green-200 w-fit">
                        <Check size={14} className="text-green-600" />
                        本地图片已就绪
                      </div>
                      <p className="text-[11px] text-gray-400">
                        该图片将在 AI 创作设备模型或拓扑布局时作为核心外观图元被引用。
                      </p>
                      
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-700 text-xs rounded-lg font-medium transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                        >
                          <Upload size={13} />
                          更换本地图片
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormImage('')}
                          className="px-3 py-1.5 bg-white border border-gray-200 hover:border-red-300 hover:text-red-600 text-gray-600 text-xs rounded-lg font-medium transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <Trash2 size={13} />
                          移除
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  简短描述 / 适用场景说明
                </label>
                <textarea
                  rows={3}
                  placeholder="简要描述该设备素材的外观特征、适用场景（如：工业管道监测、大棚环境检测、导轨安装配电箱等），便于AI在理解用户需求时精准推荐。"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  maxLength={200}
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                />
                <div className="text-[10px] text-gray-400 text-right mt-0.5">
                  {formDescription.length}/200 字
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all cursor-pointer"
                >
                  {editingMaterial ? '保存修改' : '确认创建'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Preview Material Detail Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <Eye size={16} className="text-blue-500" />
                素材详情预览
              </h3>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* High-res Image Box */}
              <div className="w-full h-52 rounded-xl bg-gradient-to-b from-gray-50 to-gray-100/50 border border-gray-200 p-6 flex items-center justify-center relative overflow-hidden shadow-inner">
                <img
                  src={previewMaterial.image}
                  alt={previewMaterial.name}
                  className="w-full h-full object-contain drop-shadow-md"
                />
                <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                  {previewMaterial.category}
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-gray-800">{previewMaterial.name}</h4>
                <div className="text-[11px] text-gray-400 font-mono mt-0.5">ID: {previewMaterial.id}</div>
              </div>

              {/* Description */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-[11px] text-gray-400 font-medium mb-1">素材描述：</div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {previewMaterial.description || '暂无描述信息'}
                </p>
              </div>

              {/* Tags */}
              <div>
                <div className="text-[11px] text-gray-400 font-medium mb-1.5">关联特征标签：</div>
                <div className="flex flex-wrap gap-1.5">
                  {previewMaterial.tags?.map(t => (
                    <span key={t} className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md font-medium">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Guidance Note */}
              <div className="flex items-start gap-2 p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-700">
                <Sparkles size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  在控制台或设计器中使用 AI 生成自定义设备时，系统会根据用户输入的自然语言描述自动匹配本素材库中的图片与特征标签。
                </p>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-gray-100">
                <button
                  onClick={() => {
                    const target = previewMaterial;
                    setPreviewMaterial(null);
                    openEditModal(target);
                  }}
                  className="px-4 py-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors"
                >
                  编辑此素材
                </button>
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="px-4 py-1.5 text-xs bg-gray-800 text-white hover:bg-gray-900 rounded-lg font-medium transition-colors"
                >
                  关闭
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
