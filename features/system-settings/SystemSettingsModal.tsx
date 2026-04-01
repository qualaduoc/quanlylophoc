import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { SystemSettingsData } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  systemSettings: SystemSettingsData;
  onUpdateSystemSettings: (updates: Partial<SystemSettingsData>) => Promise<boolean>;
}

export default function SystemSettingsModal({ isOpen, onClose, systemSettings, onUpdateSystemSettings }: Props) {
  const [activeTab, setActiveTab] = useState<'brand' | 'account'>('brand');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Account Context
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Brand Context
  const [brandData, setBrandData] = useState({
    app_name: '',
    school_name: '',
    author_name: '',
    address: '',
    version: '',
    project_title: '',
    project_description: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadProfile();
      setBrandData({
        app_name: systemSettings.app_name || '',
        school_name: systemSettings.school_name || '',
        author_name: systemSettings.author_name || '',
        address: systemSettings.address || '',
        version: systemSettings.version || '',
        project_title: systemSettings.project_title || '',
        project_description: systemSettings.project_description || ''
      });
    } else {
      setSuccessMsg('');
      setErrorMsg('');
      setNewPassword('');
    }
  }, [isOpen, systemSettings]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase.from('users').select('full_name').eq('id', user.id).single();
        if (data) setFullName(data.full_name || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErrorMsg(''); setSuccessMsg('');

    try {
      if (userId && fullName.trim()) {
        const { error: dbError } = await supabase.from('users').update({ full_name: fullName.trim() }).eq('id', userId);
        if (dbError) throw dbError;
      }
      if (newPassword.trim().length > 0) {
        if (newPassword.trim().length < 6) throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
        const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
        if (authError) throw authError;
      }
      setSuccessMsg('Đã lưu tài khoản thành công!');
      setNewPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErrorMsg(''); setSuccessMsg('');
    const success = await onUpdateSystemSettings(brandData);
    setLoading(false);
    if (success) {
      setSuccessMsg('Đã cập nhật hệ thống thành công!');
    } else {
      setErrorMsg('Có lỗi xảy ra khi lưu trên máy chủ.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-1/3 bg-slate-50 border-r border-slate-200 p-4 space-y-2">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Cài Đặt Hệ Thống
          </h2>
          <button
            onClick={() => { setActiveTab('brand'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all ${activeTab === 'brand' ? 'bg-indigo-600 text-white shadow-md transform scale-105' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            🏫 Thông tin Bản Quyền
          </button>
          <button
            onClick={() => { setActiveTab('account'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all ${activeTab === 'account' ? 'bg-indigo-600 text-white shadow-md transform scale-105' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            🪪 Tài Khoản Admin
          </button>
        </div>

        {/* Content Area */}
        <div className="w-2/3 p-6 bg-white flex flex-col relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          <h3 className="text-xl font-bold text-slate-800 mb-6">
            {activeTab === 'brand' ? 'Thông Tin Bản Quyền Web/App' : 'Quản Lý Tài Khoản'}
          </h3>

          {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{errorMsg}</div>}
          {successMsg && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium">{successMsg}</div>}

          {activeTab === 'brand' ? (
            <form onSubmit={handleSaveBrand} className="space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tên Thương hiệu / App</label>
                  <input type="text" value={brandData.app_name} onChange={e => setBrandData({...brandData, app_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="SeatFlow" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Phiên bản</label>
                  <input type="text" value={brandData.version} onChange={e => setBrandData({...brandData, version: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="1.0.0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tiêu đề Dự án (Ví dụ: Sản phẩm dự thi)</label>
                  <input type="text" value={brandData.project_title} onChange={e => setBrandData({...brandData, project_title: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Sản phẩm dự thi" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả Dự án</label>
                  <input type="text" value={brandData.project_description} onChange={e => setBrandData({...brandData, project_description: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Sơ đồ lớp học thông minh..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên Đơn vị / Trường học</label>
                <input type="text" value={brandData.school_name} onChange={e => setBrandData({...brandData, school_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="THCS Mường Thanh" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ / Tỉnh thành</label>
                  <input type="text" value={brandData.address} onChange={e => setBrandData({...brandData, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Hà Nội, Việt Nam" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    Tác giả / Nhóm thực hiện
                    <span className="text-xs font-normal text-slate-500">(Mỗi người 1 dòng)</span>
                  </label>
                  <textarea rows={3} value={brandData.author_name} onChange={e => setBrandData({...brandData, author_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-y" placeholder={`Đào Hoa - Giáo viên\nNgô Thị Hanh - Giáo viên`} />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={loading} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveAccount} className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Họ và Tên Quản Trị Viên (Hiển thị góc phải)</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ví dụ: Thầy Giáo A" />
              </div>
              <div className="pt-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Đổi mật khẩu mới (Bỏ trống nếu không đổi)</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Nhập mật khẩu mới từ 6 ký tự..." />
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={loading} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {loading ? 'Đang lưu...' : 'Cập Nhật Tài Khoản'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
