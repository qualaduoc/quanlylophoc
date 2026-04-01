import React, { useState, useRef, useEffect } from 'react';
import { ClassData } from '../../types';

interface Props {
  classes: ClassData[];
  activeClassId: string | null;
  onSelectClass: (id: string) => void;
  onAddClass: (name: string, year: string) => Promise<boolean>;
}

export const ClassSelector: React.FC<Props> = ({ classes, activeClassId, onSelectClass, onAddClass }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newSchoolYear, setNewSchoolYear] = useState('2024-2025');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeClass = classes.find(c => c.id === activeClassId);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setLoading(true);
    const success = await onAddClass(newClassName.trim(), newSchoolYear.trim());
    setLoading(false);
    if (success) {
      setShowAddModal(false);
      setNewClassName('');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-4 py-2 rounded-lg transition-colors border border-indigo-200 shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
        {activeClass ? `Lớp ${activeClass.name}` : "Chọn lớp học..."}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>

      {isOpen && (
        <div className="absolute top-12 left-0 w-64 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">Danh sách Lớp học</span>
          </div>
          <div className="max-h-60 overflow-auto">
            {classes.length === 0 && (
              <div className="p-4 text-sm text-slate-500 text-center italic">Chưa có lớp nào</div>
            )}
            {classes.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  onSelectClass(c.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center justify-between transition-colors ${c.id === activeClassId ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <span>{c.name} <span className="text-xs text-slate-400 font-normal ml-1">({c.school_year || ''})</span></span>
                {c.id === activeClassId && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                )}
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-slate-100 bg-slate-50">
            <button 
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Thêm Lớp Mới
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Thêm Lớp Học Mới</h3>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên Lớp</label>
                <input required autoFocus value={newClassName} onChange={e => setNewClassName(e.target.value)} type="text" placeholder="VD: 6A1, 10 Toán 1..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Năm học</label>
                <input required value={newSchoolYear} onChange={e => setNewSchoolYear(e.target.value)} type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-slate-100 font-semibold text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">Hủy</button>
                <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 font-semibold text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
