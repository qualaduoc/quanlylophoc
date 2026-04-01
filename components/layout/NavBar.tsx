import React from 'react';
import { UserIcon } from '../common/icons/UserIcon';
import { StarIcon } from '../common/icons/StarIcon';
import { ClassSelector } from '../../features/class-manager/ClassSelector';
import { SystemSettingsData, UserRole } from '../../types';

interface NavBarProps {
  activeTab: 'chart' | 'manager' | 'priority';
  onTabChange: (tab: 'chart' | 'manager' | 'priority') => void;
  onOpenAdminSettings: () => void;
  onLogout: () => void;
  classObj: any;
  sysSettings: SystemSettingsData | null;
  userRole: UserRole | null;
  groupsCount: number;
  groupFilter: 'all' | number;
  onGroupFilterChange: (val: 'all' | number) => void;
}

const NavBar: React.FC<NavBarProps> = ({ 
  activeTab, onTabChange, onOpenAdminSettings, onLogout, 
  classObj, sysSettings, userRole, groupsCount, groupFilter, onGroupFilterChange 
}) => {
  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight" title={sysSettings?.version ? `Phiên bản: ${sysSettings.version}` : undefined}>
              {sysSettings?.app_name || 'SmartClass'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {sysSettings?.school_name || 'THCS Nguyễn Hồng Ánh'}
            </p>
          </div>
        </div>
        
        <div className="hidden md:block w-px h-8 bg-slate-200"></div>

        <ClassSelector 
          classes={classObj.classes}
          activeClassId={classObj.activeClassId}
          onSelectClass={classObj.setActiveClassId}
          onAddClass={classObj.addClass}
        />

        {/* Group Filter for President/Admin */}
        {(userRole?.role === 'president' || userRole?.role === 'admin') && activeTab === 'manager' && groupsCount > 0 && (
            <div className="flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
               <select 
                  value={groupFilter === 'all' ? 'all' : groupFilter.toString()}
                  onChange={(e) => onGroupFilterChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="rounded-lg border-slate-300 py-1.5 pl-3 pr-8 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 cursor-pointer focus:border-indigo-500 focus:ring-indigo-500 transition-colors shadow-sm"
               >
                  <option value="all">Tất cả (Cả lớp)</option>
                  {Array.from({ length: groupsCount }, (_, i) => (
                      <option key={i} value={i.toString()}>Tổ {i + 1}</option>
                  ))}
               </select>
            </div>
        )}
      </div>

      <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto">
        {userRole?.role === 'admin' && (
          <>
            <button
              onClick={() => onTabChange('chart')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'chart'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
              Sơ đồ lớp học
            </button>
            <button
              onClick={() => onTabChange('priority')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'priority'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <StarIcon />
              Học sinh ưu tiên
            </button>
          </>
        )}
        <button
          onClick={() => onTabChange('manager')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'manager'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <UserIcon />
          Quản lý học sinh
        </button>
      </div>

      <div className="hidden md:flex items-center gap-2">
        {userRole?.role === 'admin' && (
          <button onClick={onOpenAdminSettings} className="px-3 py-1.5 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Cài Đặt
          </button>
        )}
        <button onClick={onLogout} className="px-3 py-1.5 flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 ml-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Đăng xuất
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
