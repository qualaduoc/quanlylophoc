import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { DragEndEvent } from '@dnd-kit/core';
import type { Student, SeatingChart, ViewMode, GroupSettings, Group, ArrangementMode, Row, Table } from '../types';
import { shuffleArray, calculateShortNames } from '../utils/seatingLogic';
import { exportToCSV } from '../utils/exportUtils';

export const useSeatingChart = (isLoggedIn: boolean, activeClassId: string | null) => {
  const [isLoading, setIsLoading] = useState(false);
  const [appSettingsId, setAppSettingsId] = useState<number | null>(null);
  
  // Settings & Data
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(5);
  const [seatsPerTable, setSeatsPerTable] = useState(2);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentListInput, setStudentListInput] = useState('');
  const [seatingChart, setSeatingChart] = useState<SeatingChart>([]);
  
  // UI State for Chart
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [rotation, setRotation] = useState({ x: 55, y: 0 });
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  
  // State for grouping feature
  const [groupSettings, setGroupSettings] = useState<GroupSettings>({
    enabled: false,
    groupSizes: [4, 4, 4],
    arrangement: 'horizontal',
  });
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupLeaders, setGroupLeaders] = useState<Map<number, string>>(new Map());

  // State for arrangement mode
  const [arrangementMode, setArrangementMode] = useState<ArrangementMode>('automatic');

  const maxStudents = useMemo(() => rows * cols * seatsPerTable, [rows, cols, seatsPerTable]);

  // --- Supabase Persistence Helpers ---
  const saveAppSettings = useCallback(async (updates: any) => {
    if (!activeClassId) return;
    try {
        let finalId = appSettingsId;
        if (!finalId) {
            // Check if it exists but wasn't synced to state yet
            const { data: existing } = await supabase.from('app_settings').select('id').eq('class_id', activeClassId).order('id', { ascending: false }).limit(1).maybeSingle();
            if (existing?.id) {
                finalId = existing.id;
            } else {
                finalId = Math.floor(Math.random() * 2000000000); // Missing constraint fallback
            }
        }

        const payload: any = { class_id: activeClassId, ...updates, id: finalId };
        
        const { data, error } = await supabase
            .from('app_settings')
            .upsert(payload)
            .select('id')
            .maybeSingle();
            
        if (data?.id && !appSettingsId) {
            setAppSettingsId(data.id);
        }
        if (error) console.error('Error saving settings:', error);
    } catch (err) {
        console.error('Exception saving settings:', err);
    }
  }, [activeClassId, appSettingsId]);

  // --- Initial Data Fetching ---
  useEffect(() => {
    if (!isLoggedIn || !activeClassId) return;

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data: settings, error: settingsError } = await supabase
                .from('app_settings')
                .select('*')
                .eq('class_id', activeClassId)
                .order('id', { ascending: false })
                .limit(1)
                .maybeSingle();
            
            if (settings && !settingsError) {
                if (settings.rows) setRows(settings.rows);
                if (settings.cols) setCols(settings.cols);
                if (settings.seats_per_table) setSeatsPerTable(settings.seats_per_table);
                if (settings.student_list_input) setStudentListInput(settings.student_list_input);
                if (settings.group_settings) setGroupSettings(settings.group_settings);
                if (settings.groups_data) setGroups(settings.groups_data);
                if (settings.group_leaders) {
                     try {
                        const entries = Array.isArray(settings.group_leaders) ? settings.group_leaders : Object.entries(settings.group_leaders);
                        setGroupLeaders(new Map(entries.map((e: any) => [Number(e[0]), e[1]])));
                     } catch(e) { console.error("Error parsing group leaders", e)}
                }
                if (settings.arrangement_mode) setArrangementMode(settings.arrangement_mode as ArrangementMode);
                setAppSettingsId(settings.id);
            } else {
                 setAppSettingsId(null);
                 setRows(4);
                 setCols(5);
                 setSeatingChart([]);
                 setStudents([]);
                 setGroups([]);
            }

            const { data: studentsData, error: studentsError } = await supabase
                .from('students')
                .select(`id, full_name, short_name, parent_phone, address, weight, height, is_nearsighted, is_special_needs, current_seat_assigned_timestamp, behavior_records (id, type, description, score, timestamp)`)
                .eq('class_id', activeClassId)
                .order('full_name');

                if (studentsData && !studentsError) {
                    const mappedStudents: Student[] = studentsData.map((s: any) => ({
                        id: s.id,
                        fullName: s.full_name,
                        shortName: s.short_name || '',
                        currentSeatAssignedTimestamp: s.current_seat_assigned_timestamp ? Number(s.current_seat_assigned_timestamp) : null,
                        parentPhone: s.parent_phone,
                        address: s.address,
                        weight: s.weight,
                        height: s.height,
                        isNearsighted: s.is_nearsighted,
                        isSpecialNeeds: s.is_special_needs,
                        behaviorRecords: (s.behavior_records || []).map((br: any) => ({
                            ...br,
                            timestamp: Number(br.timestamp)
                        }))
                    }));
                    const withShortNames = calculateShortNames(mappedStudents);
                    setStudents(withShortNames);

                    if (!settings?.student_list_input && withShortNames.length > 0) {
                        const fallbackNames = withShortNames.map((s: Student) => s.fullName).join('\n');
                        setStudentListInput(fallbackNames);
                        setTimeout(() => saveAppSettings({ student_list_input: fallbackNames }), 500);
                    }

                    if (settings && settings.seating_chart && Array.isArray(settings.seating_chart)) {
                        const freshStudentMap = new Map(withShortNames.map(s => [s.id, s]));
                        const freshChart = settings.seating_chart.map((row: any) => 
                            row.map((table: any) => 
                                table.map((st: any) => freshStudentMap.get(st.id) || st)
                            )
                        );
                        setSeatingChart(freshChart);
                    }
                }
        } catch (error) {
            console.error("Unexpected error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStudentsSilent = async () => {
        if (!activeClassId) return;
        const { data: studentsData } = await supabase
            .from('students')
            .select(`id, full_name, short_name, parent_phone, address, weight, height, is_nearsighted, is_special_needs, current_seat_assigned_timestamp, behavior_records (id, type, description, score, timestamp, status, created_by)`)
            .eq('class_id', activeClassId)
            .order('full_name');

        if (studentsData) {
            const mappedStudents: Student[] = studentsData.map((s: any) => ({
                id: s.id,
                fullName: s.full_name,
                shortName: s.short_name || '',
                currentSeatAssignedTimestamp: s.current_seat_assigned_timestamp ? Number(s.current_seat_assigned_timestamp) : null,
                parentPhone: s.parent_phone,
                address: s.address,
                weight: s.weight,
                height: s.height,
                isNearsighted: s.is_nearsighted,
                isSpecialNeeds: s.is_special_needs,
                behaviorRecords: (s.behavior_records || []).map((br: any) => ({
                    ...br,
                    timestamp: Number(br.timestamp)
                }))
            }));
            const withShortNames = calculateShortNames(mappedStudents);
            setStudents(withShortNames);
            setSeatingChart(prev => {
                if (!prev || prev.length === 0) return prev;
                const freshMap = new Map(withShortNames.map(s => [s.id, s]));
                return prev.map(row => row.map(table => table.map(st => freshMap.get(st.id) || st)));
            });
        }
    };

    fetchData();

    // Setup Realtime Subscription for behavioral updates across devices
    const channel = supabase.channel('realtime_behavior')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'behavior_records' }, () => {
             console.log("Realtime: behavior_records changed!");
             fetchStudentsSilent();
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };

  }, [isLoggedIn, activeClassId]);

  // --- Auto-save Effects ---
  useEffect(() => {
    if (isLoading || !isLoggedIn) return;
    const timer = setTimeout(() => {
        saveAppSettings({
            rows,
            cols,
            seats_per_table: seatsPerTable,
            group_settings: groupSettings,
        });
    }, 1000);
    return () => clearTimeout(timer);
  }, [rows, cols, seatsPerTable, groupSettings, isLoading, saveAppSettings, isLoggedIn]);

  const handleUpdateStudents = useCallback(async () => {
    if (isLoading || !activeClassId) return;
    const names = studentListInput.split('\n').map(n => n.trim()).filter(n => n !== '');
    
    try {
        const { data: currentDbStudents } = await supabase.from('students').select('id, full_name').eq('class_id', activeClassId);
        
        const existingMap = new Map();
        currentDbStudents?.forEach((s: any) => {
            if (!existingMap.has(s.full_name)) {
                existingMap.set(s.full_name, s);
            }
        });

        const promises = names.map(async (name) => {
             if (existingMap.has(name)) {
                 const existing = existingMap.get(name);
                 existingMap.delete(name); 
                 return existing;
             } else {
                 const { data, error } = await supabase
                    .from('students')
                    .insert({ full_name: name, class_id: activeClassId })
                    .select()
                    .single();
                 if (error) throw error;
                 return data;
             }
        });

        await Promise.all(promises);

        const { data: allStudents } = await supabase
            .from('students')
            .select(`*, behavior_records(*)`)
            .eq('class_id', activeClassId)
            .order('full_name');
        
        if (allStudents) {
            let mapped: Student[] = allStudents.map((s: any) => ({
                id: s.id,
                fullName: s.full_name,
                shortName: '', // will calc
                currentSeatAssignedTimestamp: s.current_seat_assigned_timestamp,
                parentPhone: s.parent_phone,
                address: s.address,
                weight: s.weight,
                height: s.height,
                isNearsighted: s.is_nearsighted,
                isSpecialNeeds: s.is_special_needs,
                behaviorRecords: s.behavior_records || []
            }));
            
            mapped = calculateShortNames(mapped);
            
            const updates = mapped.map(s => supabase.from('students').update({ short_name: s.shortName }).eq('id', s.id));
            await Promise.all(updates);

            setStudents(mapped);
            setSeatingChart([]);
            setGroups([]);
            setGroupLeaders(new Map());
            
            saveAppSettings({ 
                student_list_input: studentListInput,
                seating_chart: [],
                groups_data: [],
                group_leaders: {}
            });
        }
        alert("Đã cập nhật danh sách học sinh thành công!");
    } catch (error) {
        console.error("Error updating students:", error);
        alert("Có lỗi xảy ra khi cập nhật danh sách.");
    }
  }, [studentListInput, isLoading, activeClassId, saveAppSettings]);

  const handleUpdateSingleStudent = useCallback(async (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    
    const updateChart = (chart: SeatingChart) => chart.map(row => 
        row.map(table => 
            table.map(s => s.id === updatedStudent.id ? updatedStudent : s)
        )
    );
    setSeatingChart(prev => updateChart(prev));
    
    try {
        await supabase.from('students').update({
            parent_phone: updatedStudent.parentPhone,
            address: updatedStudent.address,
            weight: updatedStudent.weight,
            height: updatedStudent.height,
            is_nearsighted: updatedStudent.isNearsighted,
            is_special_needs: updatedStudent.isSpecialNeeds
        }).eq('id', updatedStudent.id);
    } catch(e) {
        console.error("Error saving student profile", e);
    }
  }, []);

  const handleApplyGrouping = useCallback((currentChart?: SeatingChart) => {
    if (arrangementMode === 'manual') {
      alert("Không thể chia tổ ở chế độ sắp xếp thủ công. Vui lòng chuyển sang chế độ Tự động.");
      return;
    }
    const chartToUse = currentChart || seatingChart;
    if (chartToUse.length === 0) {
      alert("Vui lòng sắp xếp lớp học trước khi chia tổ.");
      return;
    }
    const { groupSizes, arrangement } = groupSettings;
    const newGroups: Group[] = [];
    
    const allTableCoords: { rowIndex: number; colIndex: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        allTableCoords.push({ rowIndex: r, colIndex: c });
      }
    }

    if (arrangement === 'cluster') {
        const isGrouped = Array(rows).fill(null).map(() => Array(cols).fill(false));
        for (let r = 0; r < rows - 1; r++) {
            for (let c = 0; c < cols - 1; c++) {
                if (!isGrouped[r][c] && !isGrouped[r][c+1] && !isGrouped[r+1][c] && !isGrouped[r+1][c+1]) {
                    newGroups.push([
                        { rowIndex: r, colIndex: c },
                        { rowIndex: r, colIndex: c + 1 },
                        { rowIndex: r + 1, colIndex: c },
                        { rowIndex: r + 1, colIndex: c + 1 },
                    ]);
                    isGrouped[r][c] = true; isGrouped[r][c+1] = true; isGrouped[r+1][c] = true; isGrouped[r+1][c+1] = true;
                }
            }
        }
        const remainingTables: Group = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!isGrouped[r][c]) remainingTables.push({ rowIndex: r, colIndex: c });
            }
        }
        if (remainingTables.length > 0) newGroups.push(remainingTables);
    } else { 
        let orderedCoords: { rowIndex: number; colIndex: number }[] = [];
        if (arrangement === 'vertical') {
            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) orderedCoords.push({ rowIndex: r, colIndex: c });
            }
        } else { // 'horizontal'
            orderedCoords = allTableCoords;
        }

        let currentIndex = 0;
        for (const size of groupSizes) {
            if (currentIndex >= orderedCoords.length || size <= 0) continue;
            const group = orderedCoords.slice(currentIndex, currentIndex + size);
            if (group.length > 0) newGroups.push(group);
            currentIndex += size;
        }
    }

    setGroups(newGroups);
    setGroupLeaders(new Map());
    saveAppSettings({ groups_data: newGroups, group_leaders: {} });
  }, [seatingChart, rows, cols, groupSettings, arrangementMode, saveAppSettings]);

  const handleInitialArrangement = useCallback(async () => {
    if (students.length === 0) {
      alert("Vui lòng nhập danh sách học sinh trước.");
      return;
    }

    const timestamp = Date.now();
    
    const specialNeeds = students.filter(s => s.isSpecialNeeds);
    const priorityHealth = students.filter(s => {
        if (s.isSpecialNeeds) return false;
        const isShort = s.height && parseInt(s.height) < 135;
        return s.isNearsighted || isShort;
    });

    const normalStudents = students.filter(s => {
        if (s.isSpecialNeeds) return false;
        const isShort = s.height && parseInt(s.height) < 135;
        return !s.isNearsighted && !isShort;
    });

    const shuffledSpecial = shuffleArray(specialNeeds);
    const shuffledPriority = shuffleArray(priorityHealth);
    const shuffledNormal = shuffleArray(normalStudents);

    const sortedStudents = [...shuffledSpecial, ...shuffledPriority, ...shuffledNormal];

    const newChart: SeatingChart = [];
    let studentIndex = 0;

    for (let i = 0; i < rows; i++) {
        const newRow: (Student[])[] = [];
        for (let j = 0; j < cols; j++) {
            const newTable: Student[] = [];
            for (let k = 0; k < seatsPerTable; k++) {
                if (studentIndex < sortedStudents.length) {
                    newTable.push(sortedStudents[studentIndex]);
                    studentIndex++;
                }
            }
            newRow.push(newTable);
        }
        newChart.push(newRow);
    }
    
    const flatStudents: Student[] = [];
    newChart.forEach(row => row.forEach(table => table.forEach(s => flatStudents.push(s))));
    const seatedStudentIds = new Set(flatStudents.map(s => s.id));
    
    const updatedStudents = students.map(student => 
      seatedStudentIds.has(student.id)
        ? { ...student, currentSeatAssignedTimestamp: timestamp }
        : { ...student, currentSeatAssignedTimestamp: null }
    );

    const updatedStudentMap = new Map(updatedStudents.map(s => [s.id, s]));
    
    const finalChartWithUpdates = newChart.map(row => 
      row.map(table => 
        table.map(student => updatedStudentMap.get(student.id)!)
      )
    );

    setStudents(updatedStudents);
    setSeatingChart(finalChartWithUpdates);
    
    await saveAppSettings({ 
        seating_chart: finalChartWithUpdates,
        student_list_input: studentListInput 
    });

    await supabase.from('students').upsert(updatedStudents.map(s => ({
        id: s.id,
        current_seat_assigned_timestamp: s.currentSeatAssignedTimestamp
    })));
    
    if(groupSettings.enabled) {
      handleApplyGrouping(finalChartWithUpdates);
    }

  }, [students, rows, cols, seatsPerTable, groupSettings.enabled, handleApplyGrouping, saveAppSettings, studentListInput]);
  
  const handleRotateSeats = useCallback(async () => {
    if (seatingChart.length < 2) {
      alert("Cần ít nhất 2 hàng để thực hiện luân chuyển.");
      return;
    }
    const timestamp = Date.now();

    const currentSeatedStudents: Student[] = [];
    seatingChart.forEach(row => {
        row.forEach(table => {
            table.forEach(s => {
                const latest = students.find(st => st.id === s.id) || s;
                currentSeatedStudents.push(latest);
            });
        });
    });

    const poolSpecial: Student[] = [];
    const poolPriority: Student[] = [];
    const poolNormal: Student[] = [];

    currentSeatedStudents.forEach(s => {
        if (s.isSpecialNeeds) {
            poolSpecial.push(s);
        } else {
             const isShort = s.height ? parseInt(s.height) < 135 : false;
             if (s.isNearsighted || isShort) {
                 poolPriority.push(s);
             } else {
                 poolNormal.push(s);
             }
        }
    });

    const shuffledSpecial = shuffleArray(poolSpecial);
    const shuffledPriority = shuffleArray(poolPriority);
    const rotateChunkSize = Math.max(1, cols * seatsPerTable);
    
    let rotatedNormal: Student[] = [];
    if (poolNormal.length > 0) {
        const actualShift = rotateChunkSize % poolNormal.length;
        rotatedNormal = [
            ...poolNormal.slice(actualShift),
            ...poolNormal.slice(0, actualShift)
        ];
    }

    const fillQueue = [...shuffledSpecial, ...shuffledPriority, ...rotatedNormal];
    
    const newChart: SeatingChart = [];
    let queueIndex = 0;

    for (let r = 0; r < rows; r++) {
        const newRow: Row = [];
        for (let c = 0; c < cols; c++) {
            const newTable: Table = [];
            for (let s = 0; s < seatsPerTable; s++) {
                if (queueIndex < fillQueue.length) {
                    newTable.push(fillQueue[queueIndex]);
                    queueIndex++;
                }
            }
            newRow.push(newTable);
        }
        newChart.push(newRow);
    }

    const flatFinalStudents: Student[] = [];
    newChart.forEach(row => row.forEach(table => table.forEach(s => flatFinalStudents.push(s))));

    const seatedStudentIds = new Set(flatFinalStudents.map(s => s.id));
    const updatedStudents = students.map(student => 
      seatedStudentIds.has(student.id) ? { ...student, currentSeatAssignedTimestamp: timestamp } : student
    );
    const updatedStudentMap = new Map(updatedStudents.map(s => [s.id, s]));
    
    const finalChartWithUpdates = newChart.map(row => 
      row.map(table => table.map(student => updatedStudentMap.get(student.id)!))
    );

    setStudents(updatedStudents);
    setSeatingChart(finalChartWithUpdates);
    
    await saveAppSettings({ seating_chart: finalChartWithUpdates });
    await supabase.from('students').upsert(updatedStudents.map(s => ({ id: s.id, current_seat_assigned_timestamp: s.currentSeatAssignedTimestamp })));

    if(groupSettings.enabled) {
      handleApplyGrouping(finalChartWithUpdates);
    }
  }, [seatingChart, students, groupSettings.enabled, handleApplyGrouping, saveAppSettings, rows, cols, seatsPerTable]);

  const handleSetGroupLeader = useCallback((groupIndex: number, studentId: string) => {
    setGroupLeaders(prev => {
        const newLeaders = new Map(prev);
        newLeaders.set(groupIndex, studentId);
        saveAppSettings({ group_leaders: Array.from(newLeaders.entries()) });
        return newLeaders;
    });
  }, [saveAppSettings]);

  const findStudentPosition = (studentId: string, chart: SeatingChart) => {
      for (let r = 0; r < chart.length; r++) {
          for (let c = 0; c < chart[r].length; c++) {
              for (let s = 0; s < chart[r][c].length; s++) {
                  if (`student-${chart[r][c][s].id}` === studentId) {
                      return { r, c, s, student: chart[r][c][s] };
                  }
              }
          }
      }
      return null;
  };

  const handleTableDragEnd = (activeId: string, overId: string) => {
      const [, startRow, startCol] = activeId.split('-').map(Number);
      const [, endRow, endCol] = overId.split('-').map(Number);

      const newChart: SeatingChart = JSON.parse(JSON.stringify(seatingChart));
      const temp = newChart[startRow][startCol];
      newChart[startRow][startCol] = newChart[endRow][endCol];
      newChart[endRow][endCol] = temp;
      setSeatingChart(newChart);
      saveAppSettings({ seating_chart: newChart });
  };

  const handleStudentSwap = (activeId: string, overId: string) => {
      const startPos = findStudentPosition(activeId, seatingChart);
      const endPos = findStudentPosition(overId, seatingChart);

      if (startPos && endPos) {
          const newChart: SeatingChart = JSON.parse(JSON.stringify(seatingChart));
          newChart[startPos.r][startPos.c][startPos.s] = endPos.student;
          newChart[endPos.r][endPos.c][endPos.s] = startPos.student;
          setSeatingChart(newChart);
          saveAppSettings({ seating_chart: newChart });
      }
  };

  const handleStudentMoveToTable = (activeId: string, overId: string) => {
      const startPos = findStudentPosition(activeId, seatingChart);
      const [, endRow, endCol] = overId.split('-').map(Number);
      
      if (startPos && seatingChart[endRow][endCol].length < seatsPerTable) {
          const newChart: SeatingChart = JSON.parse(JSON.stringify(seatingChart));
          newChart[startPos.r][startPos.c].splice(startPos.s, 1);
          newChart[endRow][endCol].push(startPos.student);
          setSeatingChart(newChart);
          saveAppSettings({ seating_chart: newChart });
      }
  };

  const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      
      setArrangementMode('manual');
      saveAppSettings({ arrangement_mode: 'manual' });

      const activeId = active.id.toString();
      const overId = over.id.toString();

      if (activeId.startsWith('table-') && overId.startsWith('table-')) {
          handleTableDragEnd(activeId, overId);
      } else if (activeId.startsWith('student-') && overId.startsWith('student-')) {
          handleStudentSwap(activeId, overId);
      } else if (activeId.startsWith('student-') && overId.startsWith('table-')) {
          handleStudentMoveToTable(activeId, overId);
      }
  };

  const handleExportJson = useCallback(() => {
    const seatingChartOfIds = seatingChart.map(row => 
      row.map(table => 
        table.map(student => student.id)
      )
    );
    const exportData = {
      seatflow_version: 1,
      exportDate: new Date().toLocaleString('vi-VN'),
      settings: { rows, cols, seatsPerTable },
      studentListInput,
      students,
      seatingChart: seatingChartOfIds,
      groupSettings,
      groups,
      groupLeaders: Array.from(groupLeaders.entries()),
      arrangementMode,
      ui: { viewMode, rotation }
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'seatflow_backup.json');
    linkElement.click();
  }, [rows, cols, seatsPerTable, studentListInput, students, seatingChart, groupSettings, groups, groupLeaders, arrangementMode, viewMode, rotation]);

  const handleImportJson = useCallback(async (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.seatflow_version !== 1) { alert("Phiên bản tệp không tương thích."); return; }
      
      setRows(data.settings.rows);
      setCols(data.settings.cols);
      setSeatsPerTable(data.settings.seatsPerTable);
      setStudentListInput(data.studentListInput);

      const importedStudents = data.students as Student[];
      setStudents(importedStudents);
      
      setGroupSettings(data.groupSettings);
      setGroups(data.groups);
      setGroupLeaders(new Map(data.groupLeaders));
      setArrangementMode(data.arrangementMode);

      const studentMap = new Map<string, Student>();
      importedStudents.forEach(s => studentMap.set(s.id, s));

      const rawSeatingChart = data.seatingChart as string[][][];
      const newSeatingChart: SeatingChart = rawSeatingChart.map((row) => 
        row.map((table) => 
          table.map((studentId) => studentMap.get(studentId))
               .filter((student): student is Student => student !== undefined)
        )
      );
      setSeatingChart(newSeatingChart);
      
      alert("Đã tải trạng thái.");

    } catch (error) {
      console.error("Lỗi khi nhập tệp JSON:", error);
      alert("Lỗi tệp JSON.");
    }
  }, []);

  const handleExportCsv = useCallback(() => {
    exportToCSV(seatingChart);
  }, [seatingChart]);

  return {
    isLoading,
    rows, setRows,
    cols, setCols,
    seatsPerTable, setSeatsPerTable,
    students,
    studentListInput, setStudentListInput,
    seatingChart,
    viewMode, setViewMode,
    rotation, setRotation,
    isHelpModalOpen, setIsHelpModalOpen,
    groupSettings, setGroupSettings,
    groups,
    groupLeaders,
    arrangementMode, setArrangementMode,
    maxStudents,
    handleUpdateStudents,
    handleUpdateSingleStudent,
    handleApplyGrouping,
    handleInitialArrangement,
    handleRotateSeats,
    handleSetGroupLeader,
    handleDragEnd,
    handleExportJson,
    handleImportJson,
    handleExportCsv
  };
};
