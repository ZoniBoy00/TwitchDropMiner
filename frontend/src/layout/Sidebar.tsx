import { LayoutDashboard, Tv, Gift, Settings, ScrollText, HelpCircle, LogOut, UserCheck, UserX, X, KeyRound } from 'lucide-react';
import { StatusDot } from '../components/StatusDot';
import type { Page } from '../types';

export function Sidebar({ page, setPage, wsConnected, status, uptime, loginStatus, loginUserId, onLogout, isOpen, onClose }: {
  page: Page; setPage: (p: Page) => void; wsConnected: boolean; status: string; uptime: string;
  loginStatus: string; loginUserId: number | null; onLogout: () => void;
  isOpen: boolean; onClose: () => void;
}) {
  const nav: { id: Page; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { id: 'channels', icon: <Tv size={16} />, label: 'Channels' },
    { id: 'drops', icon: <Gift size={16} />, label: 'Drops' },
    { id: 'api', icon: <KeyRound size={16} />, label: 'API' },
    { id: 'settings', icon: <Settings size={16} />, label: 'Settings' },
    { id: 'logs', icon: <ScrollText size={16} />, label: 'Logs' },
    { id: 'faq', icon: <HelpCircle size={16} />, label: 'FAQ' },
  ];
  const isLoggedIn = loginStatus === 'Logged in' || loginStatus === 'Logged in (cached)';

  const sidebarContent = (
    <div className="flex flex-col w-full h-full bg-dark-800/90 backdrop-blur-md border-r border-dark-600/50">
      <div className="p-4 border-b border-dark-600/50 flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center ring-1 ring-accent/30">
            <img src="/tdm-logo-v3.jpg" alt="TDM" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider">DROPS</h1>
            <p className="text-[9px] text-dark-300 tracking-widest uppercase">Miner</p>
          </div>
        </div>
        <button onClick={onClose} className="md:hidden p-1 rounded hover:bg-dark-600/50 text-dark-400 hover:text-dark-50 transition-colors">
          <X size={18} />
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {nav.map((n, i) => (
          <button key={n.id} onClick={() => { setPage(n.id); onClose(); }}
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
      <div className="px-3 pb-1">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-700/30 border border-dark-600/30">
          {isLoggedIn ? <UserCheck size={14} className="text-green-400 shrink-0" /> : <UserX size={14} className="text-red-400 shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className={`text-[11px] font-medium truncate ${isLoggedIn ? 'text-green-400' : 'text-red-400'}`}>
              {loginStatus}
            </div>
            {loginUserId && <div className="text-[9px] text-dark-400 font-mono truncate">ID: {loginUserId}</div>}
          </div>
          {isLoggedIn && (
            <button onClick={onLogout} title="Logout from Twitch"
              className="p-1 rounded hover:bg-dark-600/50 text-dark-400 hover:text-red-400 transition-colors">
              <LogOut size={12} />
            </button>
          )}
        </div>
      </div>
      <div className="p-3 border-t border-dark-600/50">
        <div className="flex items-center gap-2">
          <StatusDot status={wsConnected ? 'Connected' : 'Disconnected'} />
          <span className="text-xs text-dark-200 truncate">{status || 'Idle'}</span>
        </div>
        <div className="text-[10px] text-dark-400 mt-1 font-mono tracking-wider">{uptime}</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <aside className="hidden md:flex w-56 shrink-0">
        {sidebarContent}
      </aside>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={onClose}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      )}
      {/* Mobile drawer */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 transform transition-transform duration-300 ease-in-out md:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </aside>
    </>
  );
}
