
import React, { useRef } from 'react';
import type { Student, GroupSettings, ArrangementMode } from '../../types';
import { RotateIcon } from '../../components/common/icons/RotateIcon';
import { JsonIcon } from '../../components/common/icons/JsonIcon';
import { CsvIcon } from '../../components/common/icons/CsvIcon';
import { HelpIcon } from '../../components/common/icons/HelpIcon';
import { ImportIcon } from '../../components/common/icons/ImportIcon';

interface ControlsPanelProps {
  rows: number;
  setRows: (value: number) => void;
  cols: number;
  setCols: (value: number) => void;
  seatsPerTable: number;
  setSeatsPerTable: (value: number) => void;
  studentListInput: string;
  setStudentListInput: (value: string) => void;
  students: Student[];
  maxStudents: number;
  onUpdateStudents: () => void;
  onInitialArrangement: () => void;
  onRotateSeats: () => void;
  onExportJson: () => void;
  onImportJson: (jsonString: string) => void;
  onExportCsv: () => void;
  onOpenHelp: () => void;
  groupSettings: GroupSettings;
  setGroupSettings: (settings: GroupSettings) => void;
  onApplyGrouping: () => void;
  arrangementMode: ArrangementMode;
  setArrangementMode: (mode: ArrangementMode) => void;
  sysSettings: SystemSettingsData;
}

const InputField: React.FC<{ label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; min?: number; max?: number }> = ({ label, value, onChange, min = 1, max = 20 }) => (
  <div>
    <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
    <input
      type="number"
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      className="w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
    />
  </div>
);

const ActionButton: React.FC<{ onClick: () => void; className: string; children: React.ReactNode }> = ({ onClick, className, children }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-white font-semibold py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white transition-colors duration-200 flex items-center justify-center gap-2 text-sm ${className}`}
    >
      {children}
    </button>
);


const ControlsPanel: React.FC<ControlsPanelProps> = ({
  rows, setRows, cols, setCols, seatsPerTable, setSeatsPerTable,
  studentListInput, setStudentListInput, students, maxStudents,
  onUpdateStudents, onInitialArrangement, onRotateSeats,
  onExportJson, onImportJson, onExportCsv, onOpenHelp,
  groupSettings, setGroupSettings, onApplyGrouping,
  arrangementMode, setArrangementMode, sysSettings
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          setStudentListInput(text);
        }
      };
      reader.readAsText(file, 'UTF-8');
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleJsonImportClick = () => {
    jsonFileInputRef.current?.click();
  };

  const handleJsonFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          onImportJson(text);
        }
      };
      reader.readAsText(file, 'UTF-8');
    }
    if (event.target) {
      event.target.value = '';
    }
  };


  return (
    <aside className="w-full md:w-80 lg:w-96 bg-white p-6 flex-shrink-0 flex flex-col space-y-6 overflow-y-auto shadow-xl border-r border-slate-200 h-full">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Thiết lập</h2>
          <p className="text-xs text-slate-500">Cấu hình thông số lớp học</p>
        </div>
        <button 
          type="button"
          onClick={onOpenHelp} 
          className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-indigo-600 transition-colors" 
          title="Hướng dẫn sử dụng"
        >
          <HelpIcon />
        </button>
      </header>

      {/* Section: Thiết lập lớp học */}
      <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="text-sm font-semibold text-indigo-600 border-b border-slate-200 pb-2 uppercase">Kích thước</h3>
        <div className="grid grid-cols-3 gap-4">
          <InputField label="Hàng dọc" value={rows} onChange={(e) => setRows(Number(e.target.value))} />
          <InputField label="Hàng ngang" value={cols} onChange={(e) => setCols(Number(e.target.value))} />
          <InputField label="Chỗ/bàn" value={seatsPerTable} onChange={(e) => setSeatsPerTable(Number(e.target.value))} max={6} />
        </div>
        <p className="text-xs text-center text-slate-500 pt-2">Tổng số chỗ ngồi: <span className="font-bold text-indigo-600">{maxStudents}</span></p>
      </div>

      {/* Section: Danh sách học sinh */}
      <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="text-sm font-semibold text-indigo-600 uppercase">Danh sách học sinh</h3>
            <button
                type="button"
                onClick={handleImportClick}
                className="flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                title="Nhập danh sách từ file .txt hoặc .csv"
            >
                <ImportIcon />
                Nhập TXT/CSV
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelected}
                className="hidden"
                accept=".txt,.csv"
            />
        </div>
        <textarea
          value={studentListInput}
          onChange={(e) => setStudentListInput(e.target.value)}
          placeholder="Nguyễn Văn A
Trần Thị B..."
          className="w-full h-32 bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y text-sm"
        />
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={onUpdateStudents}
            className="w-full bg-slate-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-700 focus:outline-none transition-colors duration-200 text-sm"
          >
            Cập Nhật Từ Ô Nhập Liệu
          </button>
        </div>
        <p className="text-xs text-center text-slate-500">
             Hiện có: <span className="font-bold text-indigo-600">{students.length}</span> học sinh
        </p>
      </div>
      
      {/* Arrangement Mode Switch */}
      <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="text-sm font-semibold text-indigo-600 border-b border-slate-200 pb-2 uppercase">Chế độ Sắp xếp</h3>
        <div className="relative flex w-full p-1 bg-slate-200 rounded-lg">
            <div className={`absolute top-1 left-1 h-8 w-1/2 bg-white rounded-md shadow-md transition-transform duration-300 ease-in-out ${arrangementMode === 'manual' ? 'translate-x-full' : 'translate-x-0'}`}></div>
            <button type="button" onClick={() => setArrangementMode('automatic')} className={`w-1/2 z-10 text-sm font-bold py-1 transition-colors ${arrangementMode === 'automatic' ? 'text-indigo-600' : 'text-slate-500'}`}>Tự động</button>
            <button type="button" onClick={() => setArrangementMode('manual')} className={`w-1/2 z-10 text-sm font-bold py-1 transition-colors ${arrangementMode === 'manual' ? 'text-indigo-600' : 'text-slate-500'}`}>Thủ công</button>
        </div>
        <p className="text-xs text-center text-slate-500">
            {arrangementMode === 'manual' 
                ? 'Kéo thả bàn hoặc học sinh để sắp xếp tự do.'
                : 'Sử dụng các nút hành động để sắp xếp và luân chuyển.'
            }
        </p>
      </div>


       {/* Section: Chia tổ */}
      <div className={`space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200 transition-opacity ${arrangementMode === 'manual' && !groupSettings.enabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}>
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
           <h3 className="text-sm font-semibold text-indigo-600 uppercase">Chia Tổ</h3>
            <div className="flex items-center">
                <label htmlFor="enable-grouping" className="text-sm mr-2 text-slate-600">Bật</label>
                <input
                    type="checkbox"
                    id="enable-grouping"
                    checked={groupSettings.enabled}
                    onChange={(e) => setGroupSettings({ ...groupSettings, enabled: e.target.checked })}
                    disabled={arrangementMode === 'manual'}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:bg-slate-200 disabled:cursor-not-allowed"
                />
            </div>
        </div>
        
        {arrangementMode === 'manual' && (
            <p className="text-xs text-center text-orange-600 p-2 bg-orange-50 rounded-md">
                {groupSettings.enabled
                    ? <>Bạn đang ở chế độ <strong>Thủ công</strong>. Các tổ vẫn được giữ lại. Quay về Tự động để cấu hình lại.</>
                    : <>Chia tổ không khả dụng ở chế độ <strong>Thủ công</strong>.</>
                }
            </p>
        )}

        {groupSettings.enabled && (
          <fieldset disabled={arrangementMode === 'manual'} className="space-y-4 pt-2 disabled:opacity-70">
              <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Sắp xếp theo</label>
                   <select
                      value={groupSettings.arrangement}
                      onChange={(e) => {
                          const newArrangement = e.target.value as GroupSettings['arrangement'];
                          setGroupSettings({ ...groupSettings, arrangement: newArrangement })
                      }}
                      className="w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100"
                  >
                      <option value="horizontal">Hàng ngang</option>
                      <option value="vertical">Hàng dọc</option>
                      <option value="cluster">Theo Cụm (Tự động)</option>
                  </select>
              </div>

              {groupSettings.arrangement === 'cluster' ? (
                  <p className="text-xs text-center text-slate-500 p-2 bg-slate-100 rounded-md">Chế độ "Theo Cụm" sẽ tự động nhóm các bàn thành cụm 4 bàn (2x2) khi có thể.</p>
              ) : (
                  <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Quy định số bàn cho từng tổ</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                          {groupSettings.groupSizes.map((size, index) => (
                              <div key={index} className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-700 w-12 shrink-0">Tổ {index + 1}:</span>
                                  <input
                                    type="number"
                                    value={size}
                                    onChange={(e) => {
                                        const newSizes = [...groupSettings.groupSizes];
                                        newSizes[index] = Number(e.target.value) >= 1 ? Number(e.target.value) : 1;
                                        setGroupSettings({...groupSettings, groupSizes: newSizes});
                                    }}
                                    min={1}
                                    max={rows * cols}
                                    className="flex-1 bg-white border border-slate-300 rounded-md shadow-sm py-1 px-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                                  />
                                  <button
                                      type="button" 
                                      onClick={() => {
                                          const newSizes = groupSettings.groupSizes.filter((_, i) => i !== index);
                                          setGroupSettings({...groupSettings, groupSizes: newSizes});
                                      }}
                                      className="p-1 rounded-full text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-50"
                                      title="Xóa tổ"
                                  >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                  </button>
                              </div>
                          ))}
                      </div>
                      <button
                          type="button"
                          onClick={() => {
                              const newSizes = [...groupSettings.groupSizes, 4]; // Default new group size
                              setGroupSettings({...groupSettings, groupSizes: newSizes});
                          }}
                          className="w-full mt-3 text-indigo-600 font-semibold py-2 px-3 rounded-md border-2 border-dashed border-indigo-300 hover:bg-indigo-50 transition-colors duration-200 flex items-center justify-center gap-2 text-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-300"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                          Thêm Tổ
                      </button>
                       <p className="text-xs text-center text-slate-500 pt-2">
                          Tổng số bàn đã nhóm: <span className="font-bold text-indigo-600">{groupSettings.groupSizes.reduce((a, b) => a + b, 0)}</span> / {rows * cols}
                      </p>
                  </div>
              )}
              <button
                  type="button"
                  onClick={onApplyGrouping}
                  className="w-full bg-orange-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-orange-500 transition-colors duration-200 disabled:bg-orange-300 disabled:cursor-not-allowed"
              >
                  Áp Dụng Chia Tổ
              </button>
          </fieldset>
        )}
      </div>

      {/* Section: Hành động */}
      <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="text-sm font-semibold text-indigo-600 border-b border-slate-200 pb-2 uppercase">Hành Động</h3>
        <div className="space-y-3">
            <ActionButton
              onClick={onInitialArrangement}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
            >
              Sắp Xếp Ban Đầu
            </ActionButton>
            <ActionButton
              onClick={onRotateSeats}
              className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
            >
              <RotateIcon />
              Luân Chuyển Chỗ Ngồi
            </ActionButton>
        </div>
        <div className="pt-3">
             <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase text-center">Lưu & Tải Trạng Thái</h3>
             <div className="grid grid-cols-2 gap-3">
                 <ActionButton
                    onClick={handleJsonImportClick}
                    className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
                  >
                    <ImportIcon />
                    Nhập JSON
                  </ActionButton>
                  <ActionButton
                    onClick={onExportJson}
                    className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
                  >
                    <JsonIcon />
                    Xuất JSON
                  </ActionButton>
                  <input
                      type="file"
                      ref={jsonFileInputRef}
                      onChange={handleJsonFileSelected}
                      className="hidden"
                      accept=".json"
                  />
             </div>
        </div>
         <div className="pt-3">
             <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase text-center">Xuất Sơ Đồ</h3>
             <ActionButton
                onClick={onExportCsv}
                className="bg-teal-600 hover:bg-teal-700 focus:ring-teal-500"
              >
                <CsvIcon />
                Xuất sang CSV
              </ActionButton>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="mt-auto pt-6 border-t border-slate-200 text-center text-xs text-slate-500 space-y-3 pb-6">
        <div className="px-2">
          <p className="font-bold text-slate-700 text-sm">
            {sysSettings?.project_title || 'Sản phẩm dự thi'}
          </p>
          <p className="text-indigo-600 font-semibold mb-2">
            {sysSettings?.project_description || 'Sơ đồ lớp học thông minh ứng dụng AI trong quản lý lớp học'}
          </p>
          
          <p className="font-semibold text-slate-600">
            {sysSettings?.school_name || 'Trường THCS Mường Thanh'}
          </p>
          <p className="text-slate-500 mb-2">
            {sysSettings?.address || 'Phường Điện Biên Phủ, Tỉnh Điện Biên'}
          </p>

          <p className="font-semibold text-slate-600 mt-3">
            Nhóm giáo viên thực hiện:
          </p>
          <ul className="text-slate-500">
            {sysSettings?.author_name?.split('\n').map((author, index) => (
              <li key={index}>{author}</li>
            )) || (
              <>
                <li>Đào Hoa - Giáo viên</li>
                <li>Ngô Thị Hanh - Giáo viên</li>
                <li>Nguyễn Thị Vân - Tổ trưởng</li>
              </>
            )}
          </ul>
        </div>
      </footer>
    </aside>
  );
};

export default ControlsPanel;
