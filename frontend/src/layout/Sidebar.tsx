import { LayoutDashboard, Tv, Gift, Settings, ScrollText } from 'lucide-react';
import { StatusDot } from '../components/StatusDot';
import type { Page } from '../types';

export function Sidebar({ page, setPage, wsConnected, status, uptime }: { page: Page; setPage: (p: Page) => void; wsConnected: boolean; status: string; uptime: string }) {
  const nav: { id: Page; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { id: 'channels', icon: <Tv size={16} />, label: 'Channels' },
    { id: 'drops', icon: <Gift size={16} />, label: 'Drops' },
    { id: 'settings', icon: <Settings size={16} />, label: 'Settings' },
    { id: 'logs', icon: <ScrollText size={16} />, label: 'Logs' },
  ];
  return (
    <aside className="w-56 bg-dark-800/90 backdrop-blur-md border-r border-dark-600/50 flex flex-col shrink-0">
      <div className="p-4 border-b border-dark-600/50 text-center">
        <div className="inline-flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
            <span className="text-white text-sm font-bold">TD</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider">DROPS</h1>
            <p className="text-[9px] text-dark-300 tracking-widest uppercase">Miner</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {nav.map((n, i) => (
          <button key={n.id} onClick={() => setPage(n.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
              page === n.id
                ? 'bg-accent/15 text-accent-light border border-accent/30'
                : 'text-dark-200 hover:bg-dark-600/50 hover:text-dark-50 border border-transparent'
            }`}
            style={{ animationDelay: `${i * 50}ms` }}>
            {n.icon}{n.label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-dark-600/50">
        <div className="flex items-center gap-2">
          <StatusDot status={wsConnected ? 'Connected' : 'Disconnected'} />
          <span className="text-xs text-dark-200 truncate">{status || 'Idle'}</span>
        </div>
        <div className="text-[10px] text-dark-400 mt-1 font-mono tracking-wider">{uptime}</div>
      </div>
    </aside>
  );
}
