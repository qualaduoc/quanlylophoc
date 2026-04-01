import React, { useMemo } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { SeatingChart, ViewMode, Student, Group, ArrangementMode, UserRole } from '../../types';
import { View2DIcon } from '../../components/common/icons/View2DIcon';
import { View3DIcon } from '../../components/common/icons/View3DIcon';

interface RotationControlsProps {
  rotation: { x: number; y: number };
  setRotation: (rotation: { x: number; y: number }) => void;
  onReset: () => void;
}

const RotationControls: React.FC<RotationControlsProps> = ({ rotation, setRotation, onReset }) => (
    <div className="absolute bottom-4 left-4 z-20 bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-slate-200 w-64 space-y-3 shadow-lg">
        <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-slate-700">Điều Khiển 3D</h4>
            <button onClick={onReset} className="text-xs text-indigo-600 hover:text-indigo-500">Reset</button>
        </div>
        <div className="space-y-2">
            <div>
                <label htmlFor="rotateX" className="block text-xs text-slate-500">Nghiêng ({rotation.x}°)</label>
                <input id="rotateX" type="range" min="-90" max="90" value={rotation.x} onChange={e => setRotation({ ...rotation, x: Number(e.target.value) })} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
            </div>
            <div>
                <label htmlFor="rotateY" className="block text-xs text-slate-500">Xoay ({rotation.y}°)</label>
                <input id="rotateY" type="range" min="-180" max="180" value={rotation.y} onChange={e => setRotation({ ...rotation, y: Number(e.target.value) })} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
            </div>
        </div>
    </div>
);


const formatDuration = (timestamp: number | null): string => {
    if (timestamp === null) return 'Chưa xếp';
    const totalSeconds = Math.floor((Date.now() - timestamp) / 1000);
    if (totalSeconds < 60) return 'Vừa xong';

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    let parts = [];
    if (days > 0) parts.push(`${days} ngày`);
    if (hours > 0) parts.push(`${hours} giờ`);
    if (days === 0 && hours < 12) {
        if (minutes > 0) parts.push(`${minutes} phút`);
    }

    return parts.join(', ') || 'Vừa xong';
};


interface SeatingChartDisplayProps {
  seatingChart: SeatingChart;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  rotation: { x: number, y: number };
  setRotation: React.Dispatch<React.SetStateAction<{ x: number, y: number }>>;
  groups: Group[];
  groupLeaders: Map<number, string>;
  onSetGroupLeader: (groupId: number, studentId: string) => void;
  arrangementMode: ArrangementMode;
  seatsPerTable: number;
  userRole: UserRole | null;
}

const DraggableStudent: React.FC<{ 
  student: Student; 
  isLeader: boolean; 
  onSetLeader: () => void; 
  isManualMode: boolean;
  userRole: UserRole | null;
}> = ({ student, isLeader, onSetLeader, isManualMode, userRole }) => {
  const isDndDisabled = !isManualMode || userRole?.role !== 'admin';
  const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
    id: `student-${student.id}`,
    disabled: isDndDisabled,
  });
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: `student-${student.id}`,
    disabled: isDndDisabled,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const combinedRef = (node: HTMLElement | null) => {
    setNodeRef(node);
    setDroppableRef(node);
  };

  return (
    <div
      ref={combinedRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative text-white text-xs font-bold px-2 py-1 rounded-full shadow-md whitespace-nowrap truncate transition-all duration-200
        ${isLeader ? 'bg-orange-500' : 'bg-indigo-500'}
        ${isManualMode ? 'cursor-grab' : 'cursor-pointer'}
        ${isDragging ? 'z-50 ring-2 ring-offset-2 ring-yellow-400 scale-110 shadow-2xl' : ''}
        ${isOver ? 'ring-2 ring-green-400' : ''}
      `}
      title={isManualMode ? `Kéo để đổi chỗ ${student.fullName}` : `${student.fullName}${isLeader ? ' (Tổ trưởng)' : ''}\nNhấn để chọn làm tổ trưởng`}
      onClick={!isManualMode ? onSetLeader : undefined}
    >
      {student.shortName}
    </div>
  );
};


const CustomTooltip: React.FC<{ students: Student[], groupIndex: number | null, groupLeaders: Map<number, string> }> = ({ students, groupIndex, groupLeaders }) => {
    if (students.length === 0) return (
        <div className="absolute bottom-full mb-2 w-48 bg-slate-800 text-white text-sm rounded-lg py-2 px-3 shadow-lg border border-slate-600 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none">
            Bàn trống
            {groupIndex !== null && <p className="text-xs text-gray-400">Tổ {groupIndex + 1}</p>}
        </div>
    );

    const leaderId = groupIndex !== null ? groupLeaders.get(groupIndex) : null;

    return (
        <div className="absolute bottom-full mb-2 w-max max-w-xs bg-slate-800 text-white text-sm rounded-lg p-3 shadow-lg border border-slate-600 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none">
            {groupIndex !== null && <p className="font-bold text-base mb-2 pb-2 border-b border-slate-700">Tổ {groupIndex + 1}</p>}
            {students.map((s, index) => (
                <div key={s.id} className={index > 0 ? 'mt-2 pt-2 border-t border-slate-700' : ''}>
                    <p className={`font-semibold ${s.id === leaderId ? 'text-orange-400' : ''}`}>
                        {s.fullName} {s.id === leaderId ? ' (Tổ trưởng)' : ''}
                    </p>
                    <p className="text-xs text-gray-400">Thời gian: {formatDuration(s.currentSeatAssignedTimestamp)}</p>
                </div>
            ))}
        </div>
    )
};

const DraggableTable: React.FC<{ 
    students: Student[]; 
    rowIndex: number;
    colIndex: number;
    tableNumber: number;
    groupIndex: number | null;
    isGroupStart: boolean;
    groupLeaders: Map<number, string>;
    onSetGroupLeader: (groupIndex: number, studentId: string) => void;
    arrangementMode: ArrangementMode;
    seatsPerTable: number;
    userRole: UserRole | null;
}> = ({ students, rowIndex, colIndex, tableNumber, groupIndex, isGroupStart, groupLeaders, onSetGroupLeader, arrangementMode, seatsPerTable, userRole }) => {
    
    const isManualMode = arrangementMode === 'manual';
    const id = `table-${rowIndex}-${colIndex}`;

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id,
        disabled: !isManualMode || userRole?.role !== 'admin',
    });
    const { isOver, setNodeRef: setDroppableRef } = useDroppable({
        id,
        disabled: !isManualMode || userRole?.role !== 'admin',
    });
    
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : 'auto',
    } : {};
    
    const combinedRef = (node: HTMLElement | null) => {
        setNodeRef(node);
        setDroppableRef(node);
    };

    const colorSet = groupIndex !== null ? groupColors[groupIndex % groupColors.length] : null;
    const leaderId = groupIndex !== null ? groupLeaders.get(groupIndex) : null;

    let bgColor = 'bg-white';
    let borderColor = 'border-slate-300';
    if(colorSet) {
        bgColor = colorSet.bg;
        borderColor = colorSet.border;
    }
    if (isOver && isManualMode) {
      bgColor = 'bg-green-100';
      borderColor = 'border-green-400';
    }


    return (
        <div
            ref={combinedRef}
            style={style}
            className={`group relative border rounded-lg p-2 w-48 h-24 flex flex-row flex-wrap gap-2 justify-center items-center shadow-lg border-l-8 transition-all duration-200 
                ${isManualMode ? 'cursor-grab' : ''} 
                ${isDragging ? 'shadow-2xl scale-105' : ''}
                ${bgColor} ${borderColor}`
            }
        >
          <div {...(isManualMode ? listeners : {})} {...(isManualMode ? attributes : {})} className="absolute inset-0 z-0"></div>
          
            <CustomTooltip students={students} groupIndex={groupIndex} groupLeaders={groupLeaders} />
            <div className="absolute top-1 right-2 text-xs font-mono text-slate-500 bg-slate-200/50 px-1 rounded">{tableNumber}</div>
             {isGroupStart && groupIndex !== null && colorSet && (
                <div className={`absolute -top-4 z-10 px-4 py-1 text-sm font-extrabold text-white rounded-full shadow-lg whitespace-nowrap ${colorSet.labelBg}`}>
                    Tổ {groupIndex + 1}
                </div>
            )}
            {students.length > 0 ? (
                students.map(student => (
                  <DraggableStudent 
                    key={student.id} 
                    student={student} 
                    isLeader={student.id === leaderId}
                    onSetLeader={() => groupIndex !== null && onSetGroupLeader(groupIndex, student.id)}
                    isManualMode={isManualMode}
                    userRole={userRole}
                  />
                ))
            ) : null }
             {students.length < seatsPerTable && isManualMode && (
                <div className="text-slate-300 text-xs font-bold">(Chỗ trống)</div>
            )}
        </div>
    );
};


const groupColors = [
    { bg: 'bg-blue-200', border: 'border-blue-500', labelBg: 'bg-blue-500' },
    { bg: 'bg-green-200', border: 'border-green-500', labelBg: 'bg-green-500' },
    { bg: 'bg-yellow-200', border: 'border-yellow-500', labelBg: 'bg-yellow-500' },
    { bg: 'bg-red-200', border: 'border-red-500', labelBg: 'bg-red-500' },
    { bg: 'bg-purple-200', border: 'border-purple-500', labelBg: 'bg-purple-500' },
    { bg: 'bg-pink-200', border: 'border-pink-500', labelBg: 'bg-pink-500' },
    { bg: 'bg-cyan-200', border: 'border-cyan-500', labelBg: 'bg-cyan-500' },
    { bg: 'bg-orange-200', border: 'border-orange-500', labelBg: 'bg-orange-500' },
];

const SeatingChartDisplay: React.FC<SeatingChartDisplayProps> = ({ 
  seatingChart, viewMode, setViewMode, rotation, setRotation,
  groups, groupLeaders,  onSetGroupLeader,
  arrangementMode,
  seatsPerTable,
  userRole
}) => {
  const hasChart = seatingChart.length > 0 && seatingChart[0].length > 0;
  const cols = hasChart ? seatingChart[0].length : 0;

  const tableGroupMap = useMemo(() => {
    const map = new Map<string, { index: number, isStart: boolean }>();
    groups.forEach((group, groupIndex) => {
        group.forEach((pos, posIndex) => {
            map.set(`${pos.rowIndex}-${pos.colIndex}`, { 
                index: groupIndex,
                isStart: posIndex === 0
            });
        });
    });
    return map;
  }, [groups]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 relative p-4">
      {/* View Mode & Position Toggle */}
      <div className="absolute top-4 right-4 z-20 flex gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-lg border border-slate-200">
        <button
          onClick={() => setViewMode('2d')}
          className={`p-2 rounded-md transition-colors ${viewMode === '2d' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
          title="Chế độ 2D"
        >
          <View2DIcon />
        </button>
        <button
          onClick={() => setViewMode('3d')}
          className={`p-2 rounded-md transition-colors ${viewMode === '3d' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
          title="Chế độ 3D"
        >
          <View3DIcon />
        </button>
      </div>

      {viewMode === '3d' && hasChart && (
          <RotationControls 
              rotation={rotation} 
              setRotation={setRotation}
              onReset={() => {
                  setRotation({ x: 55, y: 0 });
              }}
          />
      )}

      {/* Teacher's Area */}
      <div className="w-2/3 max-w-lg h-10 bg-slate-200 rounded-t-lg flex items-center justify-center text-slate-600 font-semibold border-b-4 border-green-500 mb-8 shadow-2xl">
        BẢNG/BỤC GIẢNG
      </div>

      {/* Seating Chart Area */}
      <div 
        className="flex-1 flex items-center justify-center w-full"
        style={{ perspective: viewMode === '3d' ? '1500px' : 'none' }}
      >
        {hasChart ? (
          <div
            className={`grid gap-x-6 gap-y-12 transition-transform duration-700 ease-in-out`} // Increased gap-y for group labels
            style={{
              gridTemplateColumns: `repeat(${seatingChart[0].length}, minmax(0, 1fr))`,
              transformStyle: 'preserve-3d',
              transform: viewMode === '3d' ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` : 'rotateX(0deg)',
            }}
          >
            {seatingChart.map((row, rowIndex) => (
              <React.Fragment key={rowIndex}>
                {row.map((table, tableIndex) => {
                  const tableNumber = (rowIndex * cols) + (cols - tableIndex);
                  const groupInfo = tableGroupMap.get(`${rowIndex}-${tableIndex}`);
                  return (
                    <DraggableTable 
                        key={`${rowIndex}-${tableIndex}`} 
                        students={table} 
                        rowIndex={rowIndex}
                        colIndex={tableIndex}
                        tableNumber={tableNumber}
                        groupIndex={groupInfo?.index ?? null}
                        isGroupStart={groupInfo?.isStart ?? false}
                        groupLeaders={groupLeaders}
                        onSetGroupLeader={onSetGroupLeader}
                        arrangementMode={arrangementMode}
                        seatsPerTable={seatsPerTable}
                        userRole={userRole}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-500">
            <p className="text-xl">Chưa có sơ đồ lớp học.</p>
            <p>Vui lòng cập nhật danh sách và nhấn "Sắp Xếp Ban Đầu".</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatingChartDisplay;
