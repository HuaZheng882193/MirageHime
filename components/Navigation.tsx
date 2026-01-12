
import React from 'react';
import { AppTab } from '../types';

interface NavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const Navigation: React.FC<NavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 glass-card rounded-t-3xl flex items-center justify-around px-4 pb-4 z-50">
      <button 
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-pink-500' : 'text-gray-400'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        <span className="text-xs">首页</span>
      </button>

      <button 
        onClick={() => setActiveTab('tryon')}
        className={`flex flex-col items-center gap-1 ${activeTab === 'tryon' ? 'text-pink-500' : 'text-gray-400'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        <span className="text-xs">试戴</span>
      </button>

      <div className="relative -top-8">
        <button 
          onClick={() => setActiveTab('tryon')}
          className="w-16 h-16 magic-gradient rounded-full flex items-center justify-center text-white shadow-lg shadow-pink-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>

      <button 
        onClick={() => setActiveTab('wishlist')}
        className={`flex flex-col items-center gap-1 ${activeTab === 'wishlist' ? 'text-pink-500' : 'text-gray-400'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        <span className="text-xs">愿望单</span>
      </button>

      <button 
        onClick={() => setActiveTab('menu')}
        className={`flex flex-col items-center gap-1 ${activeTab === 'menu' ? 'text-pink-500' : 'text-gray-400'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
        <span className="text-xs">菜单</span>
      </button>
    </div>
  );
};

export default Navigation;
