import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
    >
      <div 
        className="bg-white text-slate-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
          <h2 id="help-modal-title" className="text-xl font-bold text-indigo-600">Hướng Dẫn Sử Dụng SeatFlow</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600"
            aria-label="Đóng"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </header>

        <main className="p-6 overflow-y-auto space-y-6">
          <HelpSection title="1. Thiết Lập Lớp Học">
            <p>Tại mục <strong>Thiết Lập Lớp Học</strong>, bạn có thể cấu hình sơ đồ vật lý của lớp:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 pl-2">
              <li><strong>Hàng dọc:</strong> Số lượng hàng bàn theo chiều dọc (từ bục giảng xuống cuối lớp).</li>
              <li><strong>Hàng ngang:</strong> Số lượng dãy bàn theo chiều ngang.</li>
              <li><strong>Chỗ/bàn:</strong> Số lượng học sinh có thể ngồi tại một bàn.</li>
            </ul>
            <p className="mt-2 text-sm text-slate-500">Tổng số chỗ ngồi sẽ được tự động tính toán dựa trên các thông số này.</p>
          </HelpSection>

          <HelpSection title="2. Cập Nhật Danh Sách Học Sinh">
            <p>Tại mục <strong>Danh Sách Học Sinh</strong>:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 pl-2">
              <li>Nhập họ và tên của từng học sinh, mỗi học sinh trên một dòng.</li>
              <li>Sử dụng nút <strong>Nhập TXT/CSV</strong> để tải lên danh sách từ file có sẵn.</li>
              <li>Nhấn nút <strong>Cập Nhật Danh Sách</strong>. Ứng dụng sẽ tự động xử lý danh sách, tạo tên viết tắt và hiển thị tổng số học sinh.</li>
              <li>Tên viết tắt sẽ tự động xử lý các trường hợp trùng tên (ví dụ: Hùng A, Hùng B).</li>
            </ul>
          </HelpSection>
          
          <HelpSection title="3. Chế Độ Sắp Xếp">
            <p>SeatFlow có hai chế độ hoạt động chính:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 pl-2">
              <li><strong>Tự động:</strong> Sử dụng các nút "Sắp xếp ban đầu" và "Luân chuyển" để ứng dụng tự động xếp chỗ. Ở chế độ này, bạn cũng có thể sử dụng tính năng "Chia Tổ".</li>
              <li><strong>Thủ công:</strong> Cho phép bạn toàn quyền điều chỉnh sơ đồ bằng cách kéo và thả.</li>
            </ul>
          </HelpSection>
          
          <HelpSection title="4. Sắp Xếp Thủ Công (Kéo và Thả)">
            <p>Ở chế độ <strong>Thủ công</strong>, bạn có thể:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 pl-2">
               <li><strong>Di chuyển cả bàn:</strong> Nhấn giữ và kéo một bàn học đến vị trí của bàn khác để hoán đổi vị trí của chúng.</li>
               <li><strong>Di chuyển học sinh:</strong> Nhấn giữ và kéo tên một học sinh.
                  <ul className="list-['-_'] list-inside ml-4 mt-1 space-y-1">
                      <li>Thả vào một học sinh khác để đổi chỗ.</li>
                      <li>Thả vào một chỗ trống ở bàn khác để chuyển học sinh đó đến.</li>
                  </ul>
               </li>
            </ul>
             <p className="mt-2 text-sm text-slate-500">Mỗi khi bạn thực hiện một thao tác kéo thả, ứng dụng sẽ tự động chuyển sang chế độ "Thủ công".</p>
          </HelpSection>

          <HelpSection title="5. Tương Tác Với Sơ Đồ">
             <ul className="list-disc list-inside space-y-1 mt-2 pl-2">
              <li><strong>Chế độ 2D/3D:</strong> Chuyển đổi giữa giao diện phẳng (2D) và giao diện có chiều sâu (3D) để có góc nhìn trực quan hơn.</li>
              <li><strong>Điều Khiển 3D:</strong> Trong chế độ 3D, sử dụng các thanh trượt để xoay và nghiêng sơ đồ lớp học theo ý muốn.</li>
              <li><strong>Xem thông tin:</strong> Di chuột (hover) lên một bàn học để xem tên đầy đủ và thời gian học sinh đã ngồi tại vị trí đó.</li>
              <li><strong>Bầu tổ trưởng:</strong> Ở chế độ "Tự động" và khi đã chia tổ, nhấp vào tên một học sinh để chọn em đó làm tổ trưởng.</li>
            </ul>
          </HelpSection>

          <HelpSection title="6. Lưu, Tải và Xuất Dữ Liệu">
            <p>Lưu trữ và chia sẻ dữ liệu dễ dàng:</p>
             <ul className="list-disc list-inside space-y-1 mt-2 pl-2">
              <li><strong>Nhập/Xuất JSON (Lưu & Tải Trạng Thái):</strong> Đây là tính năng mạnh mẽ nhất.
                <ul className="list-['-_'] list-inside ml-4 mt-1 space-y-1">
                    <li><strong>Xuất JSON:</strong> Lưu lại <span className="font-semibold">toàn bộ trạng thái</span> của lớp học ra một file, bao gồm tất cả cài đặt, danh sách học sinh, sơ đồ chỗ ngồi, các tổ, tổ trưởng...</li>
                    <li><strong>Nhập JSON:</strong> Tải một file JSON đã lưu trước đó để <span className="font-semibold">khôi phục lại chính xác</span> trạng thái lớp học.</li>
                </ul>
              </li>
              <li><strong>Xuất sang CSV (Excel):</strong> Tải về sơ đồ lớp học hiện tại dưới dạng tệp CSV, có thể mở bằng Excel để in ấn hoặc lưu trữ.</li>
            </ul>
          </HelpSection>
        </main>
      </div>
    </div>
  );
};

const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
        <div className="space-y-2 text-slate-600 text-sm leading-relaxed">
            {children}
        </div>
    </section>
);

export default HelpModal;
