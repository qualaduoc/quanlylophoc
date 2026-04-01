
import React from 'react';
import type { Student } from '../../types';

interface PriorityStudentsViewProps {
  students: Student[];
}

const PriorityStudentsView: React.FC<PriorityStudentsViewProps> = ({ students }) => {
  const specialNeeds = students.filter(s => s.isSpecialNeeds);
  const nearsightedOrShort = students.filter(s => 
    !s.isSpecialNeeds && (s.isNearsighted || (s.height && parseInt(s.height) < 135))
  );

  return (
    <div className="flex-1 overflow-auto bg-slate-100 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <h2 className="text-2xl font-bold text-slate-800">Danh Sách Học Sinh Ưu Tiên</h2>
          <p className="text-slate-600">
            Học sinh trong danh sách này sẽ được hệ thống tự động sắp xếp vào các hàng đầu tiên của lớp học.
          </p>
        </header>

        {/* Group 1: Special Needs */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
          <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
             <div>
                <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-red-200 rounded-full text-xs">1</span>
                    Nhóm Ưu Tiên Đặc Biệt
                </h3>
                <p className="text-xs text-red-600">Khiếm thính, trầm cảm, tăng động... (Luôn xếp hàng 1)</p>
             </div>
             <span className="px-3 py-1 bg-white text-red-600 rounded-full text-xs font-bold shadow-sm">
                {specialNeeds.length} học sinh
             </span>
          </div>
          <div className="p-6">
            {specialNeeds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {specialNeeds.map(s => (
                        <div key={s.id} className="flex items-center gap-3 p-3 bg-red-50/50 rounded-lg border border-red-100">
                            <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center text-red-700 font-bold">
                                {s.fullName.charAt(0)}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-800">{s.fullName}</p>
                                <p className="text-xs text-slate-500">Mã: {s.shortName}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-slate-400 italic">Không có học sinh nào.</p>
            )}
          </div>
        </div>

        {/* Group 2: Nearsighted / Short */}
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
          <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex justify-between items-center">
             <div>
                <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-orange-200 rounded-full text-xs">2</span>
                    Nhóm Ưu Tiên Sức Khỏe
                </h3>
                <p className="text-xs text-orange-600">Cận thị hoặc Chiều cao dưới 135cm (Ưu tiên xếp hàng 1, 2)</p>
             </div>
             <span className="px-3 py-1 bg-white text-orange-600 rounded-full text-xs font-bold shadow-sm">
                {nearsightedOrShort.length} học sinh
             </span>
          </div>
          <div className="p-6">
            {nearsightedOrShort.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {nearsightedOrShort.map(s => {
                        const isShort = s.height && parseInt(s.height) < 135;
                        const reasons = [];
                        if (s.isNearsighted) reasons.push("Cận thị");
                        if (isShort) reasons.push(`< 135cm (${s.height}cm)`);

                        return (
                            <div key={s.id} className="flex items-center gap-3 p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                                <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center text-orange-700 font-bold">
                                    {s.fullName.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{s.fullName}</p>
                                    <p className="text-xs text-orange-600 font-medium">{reasons.join(', ')}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-center text-slate-400 italic">Không có học sinh nào.</p>
            )}
          </div>
        </div>

        <div className="p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-sm flex gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
             <div>
                 <strong>Cách thức hoạt động:</strong> Khi bạn nhấn nút "Sắp xếp ban đầu" ở trang Sơ đồ lớp học:
                 <ul className="list-disc list-inside mt-1 ml-2">
                     <li>Nhóm (1) sẽ được xếp vào các vị trí đầu tiên của lớp học (Hàng 1).</li>
                     <li>Tiếp theo, Nhóm (2) sẽ được xếp vào các vị trí tiếp theo (Hết Hàng 1 rồi đến Hàng 2).</li>
                     <li>Cuối cùng là các học sinh còn lại.</li>
                 </ul>
             </div>
        </div>
      </div>
    </div>
  );
};

export default PriorityStudentsView;
