import React, { createContext, useContext, useState, useEffect } from 'react';

interface HeaderContextType {
  isHeaderVisible: boolean;
  setIsHeaderVisible: (visible: boolean) => void;
  toggleHeader: () => void;
  hideHeader: () => void;
  showHeader: () => void;
}

const STORAGE_KEY = 'xlab_header_visible_v1';

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [isHeaderVisible, setIsHeaderVisibleState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== 'false'; // 默认显示
    } catch {
      return true;
    }
  });

  const setIsHeaderVisible = (visible: boolean) => {
    setIsHeaderVisibleState(visible);
    try {
      localStorage.setItem(STORAGE_KEY, String(visible));
    } catch (e) {
      console.error('Failed to save header visibility to storage', e);
    }
  };

  const toggleHeader = () => setIsHeaderVisible(!isHeaderVisible);
  const hideHeader = () => setIsHeaderVisible(false);
  const showHeader = () => setIsHeaderVisible(true);

  return (
    <HeaderContext.Provider value={{ isHeaderVisible, setIsHeaderVisible, toggleHeader, hideHeader, showHeader }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
}
