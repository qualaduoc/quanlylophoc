
import React, { useState, useMemo, useEffect } from 'react';
import type { Student, BehaviorRecord, UserRole } from '../../types';
import { UserIcon } from '../../components/common/icons/UserIcon';
import { supabase } from '../../supabaseClient';

interface StudentManagerProps {
  students: Student[];
  onUpdateStudent: (updatedStudent: Student) => void;
  userRole: UserRole | null;
}

const COMMON_REASONS = {
  bonus: [
    "Phát biểu xây dựng bài",
    "Làm bài tập đầy đủ",
    "Giúp đỡ bạn bè",
    "Trực nhật tốt",
    "Có tiến bộ trong học tập"
  ],
  penalty: [
    "Đi học muộn",
    "Không làm bài tập",
    "Mất trật tự trong giờ",
    "Không trực nhật",
    "Nói chuyện riêng",
    "Quên sách vở/dụng cụ",
    "Không thực hiện nề nếp",
    "Sử dụng điện thoại trong giờ"
  ]
};

const StudentManagerModal: React.FC<StudentManagerProps> = ({ students, onUpdateStudent, userRole }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'conduct' | 'summary'>(userRole?.role === 'admin' ? 'info' : 'conduct');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form states for behavior
  const [behaviorType, setBehaviorType] = useState<'bonus' | 'penalty'>('penalty');
  const [customReason, setCustomReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [pointAmount, setPointAmount] = useState<number>(5);
  
  // Filter state for monthly view
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  const selectedStudent = useMemo(() => 
    students.find(s => s.id === selectedStudentId) || null, 
  [students, selectedStudentId]);

  const filteredStudents = useMemo(() => 
    students.filter(s => s.fullName.toLowerCase().includes(searchTerm.toLowerCase())),
  [students, searchTerm]);

  // --- Helpers for Monthly View ---
  const currentMonthRecords = useMemo(() => {
    if (!selectedStudent || !selectedStudent.behaviorRecords) return [];
    return selectedStudent.behaviorRecords.filter(r => {
      const date = new Date(r.timestamp);
      return date.getMonth() === viewMonth && date.getFullYear() === viewYear;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [selectedStudent, viewMonth, viewYear]);

  const monthlyScore = useMemo(() => {
    return 100 + currentMonthRecords.reduce((acc, r) => acc + r.score, 0);
  }, [currentMonthRecords]);

  const getConductRating = (score: number) => {
    if (score >= 90) return { label: 'Tốt', color: 'text-green-600 bg-green-100' };
    if (score >= 70) return { label: 'Khá', color: 'text-blue-600 bg-blue-100' };
    if (score >= 50) return { label: 'Đạt', color: 'text-yellow-600 bg-yellow-100' };
    return { label: 'Chưa đạt', color: 'text-red-600 bg-red-100' };
  };

  // --- Actions ---
  const handleAddRecord = async () => {
    if (!selectedStudent || isProcessing) return;
    const reason = customReason.trim() || selectedReason;
    if (!reason) {
      alert("Vui lòng nhập hoặc chọn lý do");
      return;
    }

    setIsProcessing(true);
    const finalScore = behaviorType === 'bonus' ? Math.abs(pointAmount) : -Math.abs(pointAmount);
    const timestamp = Date.now();
    
    // Auto-append date to description if it sounds like a specific incident
    const description = reason;

    try {
        const initStatus = userRole?.role === 'admin' ? 'approved' 
                         : userRole?.role === 'president' ? 'pending_teacher' 
                         : 'pending_president';

        const { data: newRecord, error } = await supabase
            .from('behavior_records')
            .insert({
                student_id: selectedStudent.id,
                type: behaviorType,
                description: description,
                score: finalScore,
                timestamp: timestamp,
                status: initStatus,
                created_by: userRole?.id
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // Optimistic update
        const updatedStudent = {
            ...selectedStudent,
            behaviorRecords: [
                ...(selectedStudent.behaviorRecords || []), 
                { ...newRecord, timestamp: Number(newRecord.timestamp) } 
            ]
        };
        onUpdateStudent(updatedStudent);

        setCustomReason('');
        setSelectedReason('');

    } catch (err) {
        console.error("Lỗi thêm hạnh kiểm:", err);
        alert("Có lỗi xảy ra khi lưu dữ liệu.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleApproveRecord = async (recordId: string, newStatus: string) => {
    if (!selectedStudent || isProcessing) return;
    setIsProcessing(true);
    try {
        const { error } = await supabase
            .from('behavior_records')
            .update({ status: newStatus })
            .eq('id', recordId);
        
        if (error) throw error;
        
        const updatedStudent = {
            ...selectedStudent,
            behaviorRecords: selectedStudent.behaviorRecords.map(r => 
                r.id === recordId ? { ...r, status: newStatus as any } : r
            )
        };
        onUpdateStudent(updatedStudent);
    } catch (err) {
        console.error("Lỗi duyệt hạnh kiểm:", err);
        alert("Không thể thay đổi trạng thái lúc này.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleUpdateProfile = async (field: keyof Student, value: any) => {
    if (!selectedStudent) return;
    const updatedStudent = { ...selectedStudent, [field]: value };
    onUpdateStudent(updatedStudent); // Calls App.tsx which handles Supabase update
  };

  const handleDeleteRecord = async (recordId: string) => {
    if(!selectedStudent || !selectedStudent.behaviorRecords || isProcessing) return;
    if(!confirm("Bạn có chắc chắn muốn xóa ghi chú này?")) return;

    setIsProcessing(true);
    try {
        const { error } = await supabase.from('behavior_records').delete().eq('id', recordId);
        if (error) throw error;

        const updatedStudent = {
            ...selectedStudent,
            behaviorRecords: selectedStudent.behaviorRecords.filter(r => r.id !== recordId)
        };
        onUpdateStudent(updatedStudent);

    } catch (err) {
        console.error("Lỗi xóa hạnh kiểm:", err);
        alert("Không thể xóa bản ghi.");
    } finally {
        setIsProcessing(false);
    }
  }

  // --- Summary Calculation ---
  const calculateYearSummary = () => {
     if (!selectedStudent) return null;
     
     const records = selectedStudent.behaviorRecords || [];
     // OFFICIAL records for long-term summary
     const approvedRecords = records.filter(r => r.status === 'approved');
     
     const monthsMap = new Map<string, { score: number, month: number, year: number }>();

     approvedRecords.forEach(r => {
         const d = new Date(r.timestamp);
         const key = `${d.getMonth()}-${d.getFullYear()}`;
         if (!monthsMap.has(key)) {
             monthsMap.set(key, { score: 100, month: d.getMonth(), year: d.getFullYear() });
         }
         const current = monthsMap.get(key)!;
         current.score += r.score;
     });

     const monthlyStats = Array.from(monthsMap.values()).sort((a, b) => {
         if (a.year !== b.year) return a.year - b.year;
         return a.month - b.month;
     });

     let sem1Total = 0, sem1Count = 0;
     let sem2Total = 0, sem2Count = 0;

     monthlyStats.forEach(stat => {
         if ([7, 8, 9, 10, 11, 0].includes(stat.month)) {
             sem1Total += stat.score;
             sem1Count++;
         } else {
             sem2Total += stat.score;
             sem2Count++;
         }
     });

     // Calculate current viewMonth's weekly stats
     const weekStats = [
        { label: 'Tuần 1 (Ngày 1-7)', score: 100 },
        { label: 'Tuần 2 (Ngày 8-14)', score: 100 },
        { label: 'Tuần 3 (Ngày 15-21)', score: 100 },
        { label: 'Tuần 4 (Ngày 22+)', score: 100 },
     ];
     
     approvedRecords.forEach(r => {
         const d = new Date(r.timestamp);
         if (d.getMonth() === viewMonth && d.getFullYear() === viewYear) {
             const date = d.getDate();
             if (date >= 1 && date <= 7) weekStats[0].score += r.score;
             else if (date >= 8 && date <= 14) weekStats[1].score += r.score;
             else if (date >= 15 && date <= 21) weekStats[2].score += r.score;
             else weekStats[3].score += r.score;
         }
     });

     return {
         monthlyStats,
         weekStats,
         sem1Avg: sem1Count > 0 ? (sem1Total / sem1Count).toFixed(1) : null,
         sem2Avg: sem2Count > 0 ? (sem2Total / sem2Count).toFixed(1) : null,
         yearAvg: (sem1Count + sem2Count) > 0 ? ((sem1Total + sem2Total) / (sem1Count + sem2Count)).toFixed(1) : null
     };
  };

  const summaryData = activeTab === 'summary' ? calculateYearSummary() : null;

  return (
    <div className="w-full h-full flex bg-slate-100 overflow-hidden">
        {/* Sidebar: List */}
        <div className="w-80 border-r border-slate-200 flex flex-col bg-white h-full flex-shrink-0">
          <div className="p-4 border-b border-slate-200 bg-indigo-50">
            <h2 className="text-sm font-bold text-indigo-900 mb-3 uppercase tracking-wide">Danh sách học sinh</h2>
            <div className="relative">
                <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <svg className="absolute left-3 top-2.5 text-indigo-400 w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => (
                <button
                  type="button"
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-3
                    ${selectedStudent?.id === student.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent text-slate-600'}`}
                >
                  <div className={`p-2 rounded-full ${selectedStudent?.id === student.id ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-200 text-slate-500'}`}>
                    <UserIcon />
                  </div>
                  <div>
                      <div className={`font-medium text-sm ${selectedStudent?.id === student.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                          {student.fullName}
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[150px]">
                         {student.shortName}
                      </div>
                  </div>
                </button>
              ))
            ) : (
                <div className="p-8 text-center text-slate-400 text-sm">
                  {students.length === 0 ? (
                      userRole?.role === 'group_leader' 
                      ? (
                          <div className="flex flex-col items-center">
                              <span className="text-red-500 font-bold mb-2">Tổ này chưa có học sinh.</span>
                              <span>Vui lòng nhờ lớp trưởng hoặc giáo viên chia tổ trên Sơ đồ bằng cách xếp chỗ!</span>
                              <div className="bg-slate-100 p-4 mt-4 text-xs font-mono text-left rounded w-full max-w-md">
                                  <div>Debug Info:</div>
                                  <div>Role: {userRole.role}</div>
                                  <div>Group ID: {userRole.group_id}</div>
                              </div>
                          </div>
                      )
                      : "Chưa có danh sách."
                  ) : "Không tìm thấy."}
                </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-slate-50 min-w-0 h-full overflow-hidden">
          {selectedStudent ? (
            <div className="flex flex-col h-full">
              {/* Header Profile Short */}
              <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm flex-shrink-0">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {selectedStudent.fullName.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">{selectedStudent.fullName}</h1>
                        <p className="text-slate-500 text-sm">Mã học sinh: {selectedStudent.shortName || 'N/A'}</p>
                    </div>
                </div>
                {(selectedStudent.isSpecialNeeds || selectedStudent.isNearsighted || (parseInt(selectedStudent.height || '999') < 135)) && (
                    <div className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full border border-orange-200">
                        Ưu tiên xếp chỗ
                    </div>
                )}
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 px-8 bg-white flex-shrink-0">
                 {[
                     ...(userRole?.role === 'admin' ? [{ id: 'info', label: 'Thông tin cá nhân' }] : []),
                     { id: 'conduct', label: 'Sổ theo dõi (Tháng)' },
                     { id: 'summary', label: 'Tổng kết & Xếp loại' }
                 ].map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-4 px-6 text-sm font-semibold border-b-2 transition-all ${
                            activeTab === tab.id 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        {tab.label}
                    </button>
                 ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-8">
                
                {/* TAB 1: INFO */}
                {(activeTab === 'info' && userRole?.role === 'admin') && (
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">Hồ sơ chi tiết</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Số điện thoại phụ huynh</label>
                                <input
                                    type="text"
                                    value={selectedStudent.parentPhone || ''}
                                    onChange={(e) => handleUpdateProfile('parentPhone', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="Ví dụ: 0912..."
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Địa chỉ</label>
                                <input
                                    type="text"
                                    value={selectedStudent.address || ''}
                                    onChange={(e) => handleUpdateProfile('address', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="Ví dụ: Tổ 1, Phường..."
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Cân nặng (kg)</label>
                                <input
                                    type="text"
                                    value={selectedStudent.weight || ''}
                                    onChange={(e) => handleUpdateProfile('weight', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="Ví dụ: 45"
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Chiều cao (cm)</label>
                                <input
                                    type="text"
                                    value={selectedStudent.height || ''}
                                    onChange={(e) => handleUpdateProfile('height', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="Ví dụ: 155"
                                />
                                {parseInt(selectedStudent.height || '999') < 135 && (
                                    <p className="text-xs text-orange-600 mt-1">* Chiều cao dưới 135cm - Tự động ưu tiên xếp bàn đầu.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Priority Settings */}
                    <div className="bg-orange-50 p-8 rounded-xl shadow-sm border border-orange-200">
                        <h3 className="text-lg font-bold text-orange-800 mb-4 border-b border-orange-200 pb-2 flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                             Diện Ưu Tiên Xếp Chỗ
                        </h3>
                        <p className="text-sm text-orange-700 mb-4">Các học sinh thuộc diện này sẽ được thuật toán tự động ưu tiên xếp ngồi các hàng đầu.</p>
                        
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 bg-white p-3 rounded-lg border border-orange-100 cursor-pointer hover:shadow-sm transition-all">
                                <input 
                                    type="checkbox" 
                                    checked={selectedStudent.isNearsighted || false}
                                    onChange={(e) => handleUpdateProfile('isNearsighted', e.target.checked)}
                                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500" 
                                />
                                <div>
                                    <span className="font-semibold text-slate-800 block">Bị cận thị</span>
                                    <span className="text-xs text-slate-500">Ưu tiên xếp hàng 1 hoặc hàng 2.</span>
                                </div>
                            </label>
                            
                            <label className="flex items-center gap-3 bg-white p-3 rounded-lg border border-orange-100 cursor-pointer hover:shadow-sm transition-all">
                                <input 
                                    type="checkbox" 
                                    checked={selectedStudent.isSpecialNeeds || false}
                                    onChange={(e) => handleUpdateProfile('isSpecialNeeds', e.target.checked)}
                                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500" 
                                />
                                <div>
                                    <span className="font-semibold text-slate-800 block">Học sinh đặc biệt</span>
                                    <span className="text-xs text-slate-500">Khiếm thính, trầm cảm, tăng động... Luôn ưu tiên xếp hàng 1.</span>
                                </div>
                            </label>
                        </div>
                    </div>
                  </div>
                )}

                {/* TAB 2 & 3: Keep existing logic */}
                {activeTab === 'conduct' && (
                  <div className="max-w-5xl mx-auto space-y-6">
                    {/* Month Selector & Score Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="md:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <label className="text-xs text-slate-500 font-bold uppercase mb-3 block">Thời gian theo dõi</label>
                            <div className="flex gap-2">
                                <select 
                                    value={viewMonth}
                                    onChange={(e) => setViewMonth(Number(e.target.value))}
                                    className="block w-full rounded-lg border-slate-300 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    {Array.from({length: 12}, (_, i) => (
                                        <option key={i} value={i}>Tháng {i + 1}</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    value={viewYear}
                                    onChange={(e) => setViewYear(Number(e.target.value))}
                                    className="block w-24 rounded-lg border-slate-300 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                         </div>

                         <div className="md:col-span-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl p-6 shadow-lg flex items-center justify-between">
                            <div>
                                <p className="text-indigo-100 text-sm font-medium mb-1">Điểm Hạnh Kiểm Tháng {viewMonth + 1}</p>
                                <div className="text-5xl font-bold">{monthlyScore}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-indigo-100 text-sm mb-2">Xếp loại hiện tại</div>
                                <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xl font-bold border border-white/30">
                                    {getConductRating(monthlyScore).label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Entry Form */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                             <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Thêm Ghi Chú / Điểm</h3>
                        </div>
                        <div className="p-6">
                             <div className="flex gap-4 mb-4">
                                <button
                                    type="button"
                                    onClick={() => { setBehaviorType('penalty'); setSelectedReason(''); }}
                                    className={`flex-1 py-3 px-4 text-center rounded-lg border-2 font-semibold transition-all ${behaviorType === 'penalty' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >
                                    Vi Phạm (Trừ điểm)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setBehaviorType('bonus'); setSelectedReason(''); }}
                                    className={`flex-1 py-3 px-4 text-center rounded-lg border-2 font-semibold transition-all ${behaviorType === 'bonus' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >
                                    Khen Thưởng (Cộng điểm)
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Chọn nội dung mẫu (Click để chọn nhanh)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {COMMON_REASONS[behaviorType].map((r, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => { setSelectedReason(r); setCustomReason(''); }}
                                                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${selectedReason === r ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                     <div className="md:col-span-2">
                                         <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú cụ thể (hoặc nhập mới)</label>
                                         <input
                                            type="text"
                                            value={customReason || selectedReason}
                                            onChange={(e) => { setCustomReason(e.target.value); setSelectedReason(''); }}
                                            placeholder="Ví dụ: Đi học muộn 15 phút..."
                                            className="w-full rounded-lg border border-slate-300 py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                     </div>
                                     <div>
                                         <label className="block text-sm font-medium text-slate-700 mb-1">Số điểm {behaviorType === 'penalty' ? 'trừ' : 'cộng'}</label>
                                         <input 
                                            type="number" 
                                            min="1" 
                                            max="100"
                                            value={pointAmount}
                                            onChange={e => setPointAmount(Number(e.target.value))}
                                            className="w-full rounded-lg border border-slate-300 py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                                        />
                                     </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={handleAddRecord}
                                        disabled={isProcessing}
                                        className={`px-8 py-2.5 rounded-lg text-white font-bold shadow-md transition-transform active:scale-95 ${behaviorType === 'penalty' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                                    >
                                        {isProcessing ? 'Đang lưu...' : 'Lưu Ghi Nhận'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History Table */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 pl-1">Lịch sử ghi nhận tháng {viewMonth + 1}</h3>
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nội dung</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Điểm</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {currentMonthRecords.length > 0 ? (
                                        currentMonthRecords.map((record) => (
                                            <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    {new Date(record.timestamp).toLocaleDateString('vi-VN')}
                                                    <span className="block text-xs text-slate-400">{new Date(record.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-900">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2 border ${record.type === 'bonus' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                        {record.type === 'bonus' ? 'Khen' : 'Phạt'}
                                                    </span>
                                                    {record.description}
                                                    <div className="mt-1 text-xs">
                                                        {record.status === 'pending_president' ? (
                                                            <span className="text-orange-500 font-medium">⏳ Tổ trưởng chấm (Chờ Lớp trưởng duyệt)</span>
                                                        ) : record.status === 'pending_teacher' ? (
                                                            <span className="text-blue-500 font-medium">⏳ Lớp trưởng đã duyệt (Chờ GV duyệt)</span>
                                                        ) : (
                                                            <span className="text-green-500 font-medium">✅ Đã duyệt</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-right text-base font-bold ${record.score > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {record.score > 0 ? '+' : ''}{record.score}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                    {(userRole?.role === 'president' && record.status === 'pending_president') && (
                                                        <button type="button" onClick={() => handleApproveRecord(record.id, 'pending_teacher')} className="text-blue-600 font-bold mr-3 hover:underline">Duyệt</button>
                                                    )}
                                                    {(userRole?.role === 'admin' && record.status !== 'approved') && (
                                                        <button type="button" onClick={() => handleApproveRecord(record.id, 'approved')} className="text-green-600 font-bold mr-3 hover:underline">Duyệt</button>
                                                    )}
                                                    <button type="button" onClick={() => handleDeleteRecord(record.id)} className="text-slate-400 hover:text-red-600 transition-colors font-medium">Xóa</button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm italic">
                                                Chưa có ghi nhận nào trong tháng này.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: SUMMARY */}
                {activeTab === 'summary' && summaryData && (
                    <div className="max-w-5xl mx-auto space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-6 rounded-xl shadow-lg">
                                <h4 className="text-blue-100 font-medium mb-1">TB Học Kỳ 1</h4>
                                <div className="text-4xl font-bold">{summaryData.sem1Avg || '--'}</div>
                                <p className="text-xs text-blue-100 mt-2 opacity-80">Các tháng: 9, 10, 11, 12, 1</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-6 rounded-xl shadow-lg">
                                <h4 className="text-purple-100 font-medium mb-1">TB Học Kỳ 2</h4>
                                <div className="text-4xl font-bold">{summaryData.sem2Avg || '--'}</div>
                                <p className="text-xs text-purple-100 mt-2 opacity-80">Các tháng: 2, 3, 4, 5</p>
                            </div>
                            <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-6 rounded-xl shadow-lg ring-4 ring-orange-100">
                                <h4 className="text-orange-100 font-medium mb-1">Tổng Kết Năm</h4>
                                <div className="text-5xl font-bold">{summaryData.yearAvg || '--'}</div>
                                <div className="mt-2 inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-bold backdrop-blur-sm">
                                    {summaryData.yearAvg ? getConductRating(Number(summaryData.yearAvg)).label : 'Chưa xếp loại'}
                                </div>
                            </div>
                        </div>

                        {/* Detail Table */}
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Chi tiết từng tháng</h3>
                            </div>
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tháng / Năm</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Điểm Tổng Kết</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Xếp Loại</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {summaryData.monthlyStats.length > 0 ? (
                                        summaryData.monthlyStats.map((stat, idx) => {
                                            const rating = getConductRating(stat.score);
                                            return (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                                        Tháng {stat.month + 1} / {stat.year}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-center font-bold text-indigo-600">
                                                        {stat.score}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${rating.color}`}>
                                                            {rating.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">Chưa có dữ liệu chính thức nào được duyệt trong năm học.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Weekly Detail of Current View Month */}
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide">Thống Kê Tuần</h3>
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-2 items-center bg-white rounded-lg border border-indigo-200 px-2 py-1">
                                        <select 
                                            value={viewMonth}
                                            onChange={(e) => setViewMonth(Number(e.target.value))}
                                            className="bg-transparent border-none text-sm focus:ring-0 font-medium text-indigo-900 py-1"
                                        >
                                            {Array.from({length: 12}, (_, i) => (
                                                <option key={i} value={i}>Tháng {i + 1}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            value={viewYear}
                                            onChange={(e) => setViewYear(Number(e.target.value))}
                                            className="bg-transparent border-none text-sm focus:ring-0 w-16 font-medium text-indigo-900 py-1 p-0"
                                        />
                                    </div>
                                    <div className="text-xs px-2 py-1.5 bg-white text-indigo-600 font-medium rounded shadow-sm border border-indigo-200">Chỉ tính điểm đã duyệt</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-200">
                                {summaryData.weekStats.map((week, idx) => (
                                    <div key={idx} className="p-4 text-center">
                                        <div className="text-xs text-slate-500 mb-1">{week.label}</div>
                                        <div className={`text-2xl font-bold ${week.score < 100 ? 'text-red-500' : week.score > 100 ? 'text-green-500' : 'text-slate-800'}`}>
                                            {week.score} <span className="text-sm font-normal text-slate-400">điểm</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                 <div className="p-4 rounded-full bg-slate-200 mb-4 text-slate-500">
                    <UserIcon />
                 </div>
                 <p className="text-lg font-medium text-slate-600">Chưa chọn học sinh</p>
                 <p className="text-sm">Vui lòng chọn một học sinh từ danh sách bên trái để xem chi tiết.</p>
            </div>
          )}
        </div>
    </div>
  );
};

export default StudentManagerModal;
