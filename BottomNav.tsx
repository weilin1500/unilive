import React from 'react';
import { MainTab } from '../types';

interface BottomNavProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const getTabClass = (tab: MainTab) =>
    `flex flex-col items-center justify-center w-full h-full ${
      activeTab === tab ? 'text-white font-bold' : 'text-gray-400 hover:text-gray-200'
    }`;

  return (
    <div className="w-full h-16 bg-black/80 backdrop-blur-md border-t border-white/10 grid grid-cols-5 items-center z-50 safe-area-bottom shrink-0 pb-[env(safe-area-inset-bottom)] box-content">
      
      {/* Home Button */}
      <button className={getTabClass(MainTab.HOME)} onClick={() => onTabChange(MainTab.HOME)}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={activeTab === MainTab.HOME ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span className="text-[10px] mt-1">Home</span>
      </button>

      {/* Explore Button */}
      <button className={getTabClass(MainTab.EXPLORE)} onClick={() => onTabChange(MainTab.EXPLORE)}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-[10px] mt-1">Explore</span>
      </button>

      {/* Create Button (Center) - Circular and contained */}
      <button className="flex flex-col items-center justify-center w-full h-full" onClick={() => onTabChange(MainTab.CREATE)}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-cyan-500/20">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
        </div>
      </button>

      {/* Messages Button */}
      <button className={getTabClass(MainTab.MESSAGES)} onClick={() => onTabChange(MainTab.MESSAGES)}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={activeTab === MainTab.MESSAGES ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="text-[10px] mt-1">Messages</span>
      </button>

      {/* Profile Button */}
      <button className={getTabClass(MainTab.PROFILE)} onClick={() => onTabChange(MainTab.PROFILE)}>
         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={activeTab === MainTab.PROFILE ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-[10px] mt-1">Profile</span>
      </button>
    </div>
  );
};

export default BottomNav;