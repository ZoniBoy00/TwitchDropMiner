import { useState, useRef } from 'react';
import ReactDOM from 'react-dom';

export function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [show, setShow] = useState(false);
  const showTip = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ x: r.left, y: r.top - 8 });
    }
    setShow(true);
  };
  return (
    <span ref={ref} className="relative inline-flex items-center" onMouseEnter={showTip} onMouseLeave={() => setShow(false)}>
      {children}
      {show && ReactDOM.createPortal(
        <div className="fixed px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-[11px] text-dark-100 z-[9999] shadow-lg pointer-events-none leading-relaxed" style={{ left: pos.x, top: pos.y, transform: 'translateY(-100%)', maxWidth: '280px', width: 'max-content' }}>{text}</div>,
        document.body
      )}
    </span>
  );
}
