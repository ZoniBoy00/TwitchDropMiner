import { useState, useEffect, useRef } from 'react';
import { ScrollText, Search, X } from 'lucide-react';

export function LogsPage({ logs, onClear }: { logs: string[]; onClear: () => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState('');
  useEffect(() => { if (autoScroll && boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [logs, autoScroll]);
  const filtered = filter ? logs.filter(l => l.toLowerCase().includes(filter.toLowerCase())) : logs;
  const colorClass = (l: string) => {
    if (l.includes('error') || l.includes('ERROR')) return 'text-danger';
    if (l.includes('warning') || l.includes('WARNING')) return 'text-warning';
    if (l.includes('[system]')) return 'text-accent-light';
    return 'text-dark-300';
  };
  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-600/50">
        <div className="flex items-center gap-2"><ScrollText size={14} className="text-accent" /><h3 className="text-xs font-semibold">Live Logs</h3><span className="text-[10px] text-dark-400 bg-dark-600/50 px-2 py-0.5 rounded-full font-mono">{filtered.length}</span></div>
        <div className="flex items-center gap-3">
          <div className="relative"><Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-dark-400" /><input className="input pl-6 py-1 w-36 text-[10px]" placeholder="Filter..." value={filter} onChange={e => setFilter(e.target.value)} /></div>
          <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="accent-accent w-3 h-3" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} /><span className="text-[10px] text-dark-300">Auto</span></label>
          <button className="btn-ghost text-[10px]" onClick={onClear}><X size={11} /> Clear</button>
        </div>
      </div>
      <div ref={boxRef} className="h-[calc(100vh-200px)] min-h-[300px] overflow-y-auto p-2.5 font-mono text-[11px] leading-relaxed bg-dark-900/50">
        {filtered.length === 0 && <div className="text-center text-dark-400 py-10">No logs yet</div>}
        {filtered.map((l, i) => <div key={i} className={`px-1 py-px rounded hover:bg-dark-600/30 transition-colors ${colorClass(l)}`}>{l}</div>)}
      </div>
    </div>
  );
}
