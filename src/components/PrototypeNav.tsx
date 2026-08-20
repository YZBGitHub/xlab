import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutList, X } from 'lucide-react';

export default function PrototypeNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const routes = [
    { path: '/', name: '仿真设备页面 (首页)' },
    { path: '/console', name: '控制台页面' },
    { path: '/design', name: '仿真项目设计页面' },
  ];

  return (
    <div className="fixed bottom-6 left-6 z-[9999]">
      {/* Menu Box */}
      <div 
        className={`absolute bottom-16 left-0 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 transition-all duration-300 origin-bottom-left ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">原型页面导航</h3>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-2 space-y-1">
          {routes.map(route => (
            <Link
              key={route.path}
              to={route.path}
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-sm transition-colors ${
                location.pathname === route.path 
                  ? 'bg-blue-50 text-[#00a0e9] font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {route.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-gray-800 hover:bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
        title="页面导航"
      >
        <LayoutList size={22} />
      </button>
    </div>
  );
}
