import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '../../types';

// Tạo một instance Supabase tạm thời để tránh làm logout phiên hiện tại khi signUp
const tempSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const tempSupabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const UserRoleManager: React.FC = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'president' | 'group_leader'>('president');
  const [formGroup, setFormGroup] = useState<string>('1');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('role', { ascending: true });
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      setErrorMsg('Không thể tải danh sách tài khoản: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim() || !formPassword.trim()) {
      setErrorMsg('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }
    if (formPassword.length < 6) {
      setErrorMsg('Mật khẩu tối thiểu 6 ký tự');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const cleanUsername = formUsername.trim();
      const fakeEmail = `${cleanUsername}@muongthanh.edu.vn`;

      // 1. Tạo instance ẩn danh để signUp (được config persistSession = false)
      const secretClient = createClient(tempSupabaseUrl, tempSupabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });

      // 2. SignUp tài khoản mới
      const { data: authData, error: authError } = await secretClient.auth.signUp({
        email: fakeEmail,
        password: formPassword,
      });

      if (authError) throw authError;

      const newUserId = authData.user?.id;
      if (!newUserId) throw new Error("Lỗi không lấy được ID tài khoản vừa tạo.");

      // 3. Ghi vào bảng phân quyền user_roles (sử dụng main client đã login tư cách admin)
      const { error: dbError } = await supabase.from('user_roles').insert({
        id: newUserId,
        username: cleanUsername,
        role: formRole,
        group_id: formRole === 'group_leader' ? parseInt(formGroup) : null
      });

      if (dbError) throw dbError;

      setSuccessMsg(`Tạo tài khoản ${cleanUsername} thành công!`);
      setFormUsername('');
      setFormPassword('');
      setIsAdding(false);
      fetchUsers(); // Tải lại danh sách
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('already registered')) {
         setErrorMsg('Tên đăng nhập này đã tồn tại!');
      } else {
         setErrorMsg('Lỗi tạo tài khoản: ' + (err.message || 'Không xách định'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Bạn có chắc muốn xoá tài khoản: ${username}?\nLưu ý: Hành động này chỉ xoá quyền, để bảo mật bạn nên liên hệ bộ phận IT nếu muốn xoá vĩnh viễn khỏi Auth.`)) return;
    
    try {
       setLoading(true);
       const { error } = await supabase.from('user_roles').delete().eq('id', userId);
       if(error) throw error;
       setSuccessMsg(`Đã thu hồi quyền của ${username}`);
       fetchUsers();
    } catch(err: any) {
        setErrorMsg('Lỗi xóa tài khoản: ' + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative rounded-lg border border-slate-200 p-4 overflow-y-auto">
      {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{errorMsg}</div>}
      {successMsg && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">{successMsg}</div>}

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800">Tất cả tài khoản ({users.length})</h3>
        {!isAdding && (
           <button onClick={() => setIsAdding(true)} className="px-3 py-1.5 bg-indigo-100 text-indigo-700 font-medium text-sm rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-1">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
             Thêm tài khoản
           </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleCreateUser} className="mb-6 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm space-y-4">
           <h4 className="text-sm font-semibold text-slate-700 border-b pb-2">Tạo tài khoản mới</h4>
           
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-semibold text-slate-500 mb-1">Tên đăng nhập (viết liền không dấu)</label>
               <input type="text" required value={formUsername} onChange={e => setFormUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="vd: loptruong_6a" />
             </div>
             <div>
               <label className="block text-xs font-semibold text-slate-500 mb-1">Mật khẩu</label>
               <input type="text" required minLength={6} value={formPassword} onChange={e => setFormPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="******" />
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-semibold text-slate-500 mb-1">Chức vụ (Quyền hạn)</label>
               <select value={formRole} onChange={(e: any) => setFormRole(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none bg-white">
                 <option value="president">Lớp trưởng (Xem tất cả lớp, duyệt Điểm)</option>
                 <option value="group_leader">Tổ trưởng (Chỉ xem và chấm Tổ mình quản lý)</option>
               </select>
             </div>
             {formRole === 'group_leader' && (
               <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Phụ trách Tổ số mấy?</label>
                  <select value={formGroup} onChange={(e) => setFormGroup(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none bg-white">
                    {[1,2,3,4,5,6,7,8].map(g => (
                        <option key={g} value={g}>Tổ {g}</option>
                    ))}
                  </select>
               </div>
             )}
           </div>

           <div className="flex justify-end gap-2 pt-2">
             <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg">Hủy</button>
             <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">Tạo tài khoản</button>
           </div>
        </form>
      )}

      {loading && users.length === 0 ? (
          <div className="text-center py-8 text-slate-400">Đang tải danh sách...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Tài khoản</th>
                <th className="px-4 py-3 font-semibold">Chức vụ</th>
                <th className="px-4 py-3 font-semibold">Khu vực</th>
                <th className="px-4 py-3 font-semibold text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.username}</td>
                  <td className="px-4 py-3">
                     {u.role === 'admin' ? <span className="text-red-600 font-bold">Admin</span> :
                      u.role === 'president' ? <span className="text-indigo-600 font-semibold">Lớp trưởng</span> :
                      <span className="text-emerald-600">Tổ trưởng</span>
                     }
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                     {u.role === 'group_leader' ? `Tổ ${u.group_id}` : 'Toàn trường'}
                  </td>
                  <td className="px-4 py-3 text-right">
                     {u.role !== 'admin' && (
                         <button onClick={() => handleDeleteUser(u.id, u.username)} title="Xóa quyền" className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                         </button>
                     )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                   <td colSpan={4} className="px-4 py-8 text-center text-slate-400">Chưa có tài khoản nào được phân quyền</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
