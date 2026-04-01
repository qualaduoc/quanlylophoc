import React from 'react';
import { ZaloIcon } from './icons/ZaloIcon';

interface ZaloPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const ZaloPopup: React.FC<ZaloPopupProps> = ({ isOpen, onClose }) => {
  return (
    <div
      className={`fixed bottom-5 right-5 z-50 w-80 max-w-[calc(100vw-2.5rem)] bg-gradient-to-br from-blue-500 to-cyan-400 text-white rounded-xl shadow-2xl transform transition-all duration-500 ease-in-out
        ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="zalo-popup-title"
      aria-hidden={!isOpen}
    >
      <div className="relative p-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 text-cyan-200 hover:text-white rounded-full transition-colors"
          aria-label="Đóng thông báo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <header className="flex items-center gap-3 mb-3">
          <div className="bg-white p-1 rounded-full">
            <ZaloIcon />
          </div>
          <h3 id="zalo-popup-title" className="text-lg font-bold">Tham Gia Cộng Đồng Zalo!</h3>
        </header>

        <main className="space-y-3">
          <p className="text-sm text-cyan-100">Kết nối, học hỏi và nhận những tài liệu, phần mềm hữu ích nhất cho việc giảng dạy.</p>
          <ZaloLink href="https://zalo.me/g/tncmdq530" text="Nhóm tạo Video từ SGK" />
          <ZaloLink href="https://zalo.me/g/uditpr888" text="Nhóm nhận học liệu, học tập" />
        </main>
      </div>
    </div>
  );
};

const ZaloLink: React.FC<{ href: string; text: string }> = ({ href, text }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 text-sm group"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
    <span className="flex-1">{text}</span>
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  </a>
);

export default ZaloPopup;
