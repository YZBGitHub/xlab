import { useState, useEffect, useRef } from 'react';
import { Bot, X, Maximize, Clock, Minus, Plus, ChevronRight, ImageIcon, Paperclip } from 'lucide-react';

export default function AgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCentered, setIsCentered] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [position, setPosition] = useState({ x: Math.max(12, window.innerWidth - 80), y: Math.max(12, window.innerHeight - 80) });
  const [isDragging, setIsDragging] = useState(false);
  const drag = useRef<{ pointerId: number; startX: number; startY: number; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const clampPosition = (x: number, y: number) => ({
    x: Math.max(12, Math.min(x, Math.max(12, window.innerWidth - 68))),
    y: Math.max(12, Math.min(y, Math.max(12, window.innerHeight - 68))),
  });

  useEffect(() => {
    const resize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      setPosition(previous => clampPosition(previous.x, previous.y));
    };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const popupWidth = Math.min(420, viewport.width - 24);
  const popupHeight = Math.min(600, viewport.height - 24);
  const popupPosition = {
    left: Math.max(12, Math.min(position.x + 56 - popupWidth, viewport.width - popupWidth - 12)),
    top: Math.max(12, Math.min(position.y >= popupHeight + 24 ? position.y - popupHeight - 12 : position.y + 68, viewport.height - popupHeight - 12)),
  };

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setIsCentered(true);
      setMessages([
        { role: 'user', content: '帮我创建一个自定义设备' },
        { role: 'assistant', content: '请上传设备图片、协议文档等资料' }
      ]);
    };
    window.addEventListener('open-agent-creation', handleOpen);
    return () => window.removeEventListener('open-agent-creation', handleOpen);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setIsCentered(false);
    }, 300);
  };

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      setIsOpen(true);
      setIsCentered(false);
    }
  };

  return (
    <>
      {/* Centered Overlay */}
      <div 
        className={`fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
          isCentered && isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Chat Popup */}
      <div 
        data-agent-popup
        aria-hidden={!isOpen}
        style={isCentered ? undefined : popupPosition}
        className={`fixed z-[9999] bg-white shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ${
          isCentered 
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl w-[600px] h-[700px]' 
            : 'rounded-2xl w-[420px] h-[600px] max-w-[calc(100vw-24px)] max-h-[calc(100vh-24px)] origin-bottom-right'
        } ${
          isOpen 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="h-[52px] bg-gradient-to-r from-blue-50/50 to-transparent flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-blue-500 font-bold text-[15px]">仿真实验智能体</span>
            <span className="bg-[#e6f4ea] text-[#137333] text-xs px-2.5 py-0.5 rounded-full font-medium">就绪</span>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <Plus size={16} className="cursor-pointer hover:text-gray-600 transition-colors" />
            <Clock size={16} className="cursor-pointer hover:text-gray-600 transition-colors" />
            <div className="w-px h-3.5 bg-gray-300 mx-1"></div>
            <Maximize size={16} className="cursor-pointer hover:text-gray-600 transition-colors" onClick={() => setIsCentered(!isCentered)} />
            <Minus size={16} className="cursor-pointer hover:text-gray-600 transition-colors" onClick={handleClose} />
            <X size={16} className="cursor-pointer hover:text-gray-600 transition-colors" onClick={handleClose} />
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col custom-scrollbar bg-[#fafafa]/50">
          {/* Greeting */}
          {messages.length === 0 && (
            <>
              <div className="flex justify-center mb-10 mt-4">
                <div className="flex items-center gap-2.5 text-blue-500 font-bold text-lg">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center shadow-sm text-xl border border-blue-200">
                    🤖
                  </div>
                  欢迎来到物联网仿真智能体~
                </div>
              </div>
              
              {/* Suggestion Bubbles */}
              <div className="flex flex-col gap-3 items-stretch w-full">
                <button className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-xl text-sm text-gray-700 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-4 text-left">
                  <span>工程排错</span> <ChevronRight size={14} className="text-gray-400 shrink-0" />
                </button>
                <button className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-xl text-sm text-gray-700 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-4 text-left">
                  <span>工程创建</span> <ChevronRight size={14} className="text-gray-400 shrink-0" />
                </button>
                <button className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-xl text-sm text-gray-700 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-4 text-left">
                  <span>创建一个物联网智慧家居仿真实训工程</span> <ChevronRight size={14} className="text-gray-400 shrink-0" />
                </button>
              </div>
            </>
          )}

          {/* Dynamic Messages */}
          <div className="flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-[14px] ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-tr-sm shadow-sm' 
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Box */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all bg-white flex flex-col shadow-sm">
            <textarea
              className="w-full h-[72px] p-3 outline-none resize-none text-sm text-gray-700 placeholder-gray-400"
              placeholder="输入您的问题"
            ></textarea>
            <div className="flex justify-between items-center p-3 border-t border-gray-50 bg-white">
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-500 transition-colors">
                  <ImageIcon size={14} /> 上传图片
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-500 transition-colors">
                  <Paperclip size={14} /> 上传文件
                </button>
              </div>
              <button className="bg-[#93c5fd] hover:bg-blue-500 text-white px-5 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm">
                发送
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toggle Button */}
      <div className="fixed z-[9999] flex flex-col items-end" style={{ left: position.x, top: position.y }}>
        <button
          type="button"
          aria-label="仿真智能体"
          aria-expanded={isOpen}
          onPointerDown={event => {
            if (event.button !== 0 || !event.isPrimary) return;
            suppressClick.current = false;
            drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: position.x, y: position.y };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={event => {
            const current = drag.current;
            if (!current || current.pointerId !== event.pointerId) return;
            const deltaX = event.clientX - current.startX;
            const deltaY = event.clientY - current.startY;
            if (!suppressClick.current && Math.hypot(deltaX, deltaY) < 5) return;
            suppressClick.current = true;
            setIsDragging(true);
            setPosition(clampPosition(current.x + deltaX, current.y + deltaY));
          }}
          onPointerUp={event => {
            if (drag.current?.pointerId !== event.pointerId) return;
            drag.current = null;
            setIsDragging(false);
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => { drag.current = null; suppressClick.current = true; setIsDragging(false); }}
          onLostPointerCapture={() => { drag.current = null; setIsDragging(false); }}
          onClick={event => { if (event.detail !== 0 && suppressClick.current) { event.preventDefault(); return; } handleToggle(); }}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 touch-none select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${
            isOpen && !isCentered ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-blue-500/30'
          }`}
          title="点击打开仿真智能体，按住左键拖动位置"
        >
          {isOpen && !isCentered ? <X size={24} /> : <Bot size={28} />}
        </button>
      </div>
    </>
  );
}
