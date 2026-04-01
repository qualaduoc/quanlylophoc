import React, { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import ControlsPanel from './features/seating-chart/ControlsPanel';
import SeatingChartDisplay from './features/seating-chart/SeatingChartDisplay';
import HelpModal from './components/common/HelpModal';
import StudentManagerModal from './features/student-manager/StudentManagerModal';
import PriorityStudentsView from './features/student-manager/PriorityStudentsView';
import NavBar from './components/layout/NavBar';
import Login from './features/auth/Login';
import SystemSettingsModal from './features/system-settings/SystemSettingsModal';
import { useSystemSettings } from './hooks/useSystemSettings';
import { useSeatingChart } from './hooks/useSeatingChart';
import { useClasses } from './hooks/useClasses';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('seatflow_isLoggedIn') === 'true';
  });

  const handleLogin = (isRemembered: boolean) => {
    setIsLoggedIn(true);
    if (isRemembered) {
      localStorage.setItem('seatflow_isLoggedIn', 'true');
    } else {
      localStorage.removeItem('seatflow_isLoggedIn');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('seatflow_isLoggedIn');
    import('./supabaseClient').then(({ supabase }) => supabase.auth.signOut());
  };

  const [activeTab, setActiveTab] = useState<'chart' | 'manager' | 'priority'>('chart');
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
  
  const classObj = useClasses(isLoggedIn);
  const sysSettingsObj = useSystemSettings();
  const ctx = useSeatingChart(isLoggedIn, classObj.activeClassId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (classObj.loadingClasses || ctx.isLoading) {
      return <div className="flex h-screen w-full items-center justify-center bg-slate-100 text-slate-500">Đang tải dữ liệu lớp học từ Supabase...</div>;
  }

  const renderContent = () => {
    if (!classObj.activeClassId) {
       return (
         <div className="flex h-full w-full items-center justify-center bg-slate-50">
           <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
             <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
             </div>
             <h2 className="text-xl text-slate-800 font-bold mb-2">Quản Lý Đa Lớp</h2>
             <p className="text-slate-500 mb-6">Bạn chưa chọn hoặc chưa có Lớp học nào. Xin vui lòng <strong>Tạo mới</strong> ở thanh Menu Công Cụ phía trên để bắt đầu!</p>
           </div>
         </div>
       );
    }

      switch (activeTab) {
          case 'chart':
              return (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={ctx.handleDragEnd}>
                    <div className="flex flex-col md:flex-row h-full">
                        <ControlsPanel
                        rows={ctx.rows} setRows={ctx.setRows}
                        cols={ctx.cols} setCols={ctx.setCols}
                        seatsPerTable={ctx.seatsPerTable} setSeatsPerTable={ctx.setSeatsPerTable}
                        studentListInput={ctx.studentListInput} setStudentListInput={ctx.setStudentListInput}
                        students={ctx.students} maxStudents={ctx.maxStudents}
                        onUpdateStudents={ctx.handleUpdateStudents}
                        onInitialArrangement={ctx.handleInitialArrangement}
                        onRotateSeats={ctx.handleRotateSeats}
                        onExportJson={ctx.handleExportJson} onImportJson={ctx.handleImportJson}
                        onExportCsv={ctx.handleExportCsv}
                        onOpenHelp={() => ctx.setIsHelpModalOpen(true)}
                        groupSettings={ctx.groupSettings} setGroupSettings={ctx.setGroupSettings}
                        onApplyGrouping={() => ctx.handleApplyGrouping()}
                        arrangementMode={ctx.arrangementMode} setArrangementMode={ctx.setArrangementMode}
                        sysSettings={sysSettingsObj.settings}
                        />
                        <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-auto">
                        <SeatingChartDisplay
                            seatingChart={ctx.seatingChart}
                            viewMode={ctx.viewMode} setViewMode={ctx.setViewMode}
                            rotation={ctx.rotation} setRotation={ctx.setRotation}
                            groups={ctx.groups} groupLeaders={ctx.groupLeaders}
                            onSetGroupLeader={ctx.handleSetGroupLeader}
                            arrangementMode={ctx.arrangementMode} seatsPerTable={ctx.seatsPerTable}
                        />
                        </main>
                    </div>
                    <HelpModal isOpen={ctx.isHelpModalOpen} onClose={() => ctx.setIsHelpModalOpen(false)} />
                </DndContext>
              );
          case 'manager':
              return (
                <StudentManagerModal 
                    students={ctx.students}
                    onUpdateStudent={ctx.handleUpdateSingleStudent}
                />
              );
          case 'priority':
              return (
                  <PriorityStudentsView students={ctx.students} />
              );
          default:
              return null;
      }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-800 font-sans">
      <NavBar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onOpenAdminSettings={() => setIsAdminSettingsOpen(true)}
        onLogout={handleLogout}
        classObj={classObj}
        sysSettings={sysSettingsObj.settings}
      />
      
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}
      </div>
      
      <SystemSettingsModal 
        isOpen={isAdminSettingsOpen} 
        onClose={() => setIsAdminSettingsOpen(false)} 
        systemSettings={sysSettingsObj.settings}
        onUpdateSystemSettings={sysSettingsObj.updateSettings}
      />
    </div>
  );
}
