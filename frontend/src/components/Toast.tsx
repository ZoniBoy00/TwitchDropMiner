import { useEffect } from 'react';

export function Toast({ id, msg, onClose }: { id: number; msg: { text: string; style: string }; onClose: (id: number) => void }) {
  useEffect(() => { const t = setTimeout(() => onClose(id), 3000); return () => clearTimeout(t); }, [id, onClose]);
  const colors: Record<string, string> = {
    success: 'bg-gradient-to-r from-success to-emerald-600',
    error: 'bg-gradient-to-r from-danger to-red-600',
    warning: 'bg-gradient-to-r from-warning to-amber-500 text-dark-900'
  };
  return (
    <div className={`px-5 py-3 rounded-xl text-white text-xs font-semibold shadow-2xl animate-[fadeIn_0.3s_ease-out] ${colors[msg.style] || colors.success}`}>
      {msg.text}
    </div>
  );
}
