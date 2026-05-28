import { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  LayoutDashboard, Tv, Gift, Settings, ScrollText, RotateCcw,
  ArrowLeftRight, RefreshCw, Circle, Gamepad2, Users, Clock,
  Wifi, WifiOff, ChevronUp, ChevronDown, X, Plus, Search,
  PanelLeftClose, Eye, Link2, Unlink, AlertTriangle, Check,
  Bell, Monitor, Languages, Sliders, Shield, Zap, ChevronRight,
  Send, LogIn, KeyRound, Info
} from 'lucide-react';
import { useWebSocket } from './useWebSocket';
import type { WsMessage, Page, Channel, Campaign, Settings as SettingsType, WsStatusItem, Game } from './types';

const gameIconUrl = (games: Record<string, Game>, name: string) => {
  const g = games[name];
  return g?.id ? `https://static-cdn.jtvnw.net/ttv-boxart/${g.id}.jpg` : '';
};

function GameIcon({ games, name, size = 24 }: { games: Record<string, Game>; name: string; size?: number }) {
  const url = gameIconUrl(games, name);
  const [error, setError] = useState(false);
  if (url && !error) return <img src={url} alt="" className="rounded object-cover" style={{ width: size, height: size * 1.33 }} onError={() => setError(true)} />;
  return <div className="bg-dark-600 rounded flex items-center justify-center" style={{ width: size, height: size * 1.33 }}><Gamepad2 size={size * 0.5} className="text-dark-300" /></div>;
}

function GameDropdown({ suggestions, onSelect, games, manualAdd }: {
  suggestions: { name: string; id: number | null }[];
  onSelect: (name: string) => void;
  games: Record<string, Game>;
  manualAdd?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, [suggestions]);

  if (suggestions.length === 0 && !manualAdd) return null;

  return (
    <>
      <div ref={ref} className="absolute invisible" />
      {ReactDOM.createPortal(
        <div
          className="fixed bg-dark-700 border border-dark-600 rounded-md shadow-lg z-[9999] max-h-40 overflow-y-auto"
          style={{ top: pos.top, left: pos.left, width: pos.width - 36 }}
        >
          {suggestions.map(g => (
            <div key={g.name} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-dark-600 cursor-pointer text-xs" onMouseDown={() => onSelect(g.name)}>
              <GameIcon games={games} name={g.name} size={16} /><span>{g.name}</span>
            </div>
          ))}
          {manualAdd && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-dark-600 cursor-pointer text-xs text-accent border-t border-dark-600" onMouseDown={() => onSelect(manualAdd)}>
              <Plus size={13} /><span>Add "{manualAdd}" manually</span>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

function ProgressBar({ value, color = 'accent' }: { value: number; color?: string }) {
  const colors: Record<string, string> = { accent: 'from-accent to-accent-light', green: 'from-success to-emerald-400', yellow: 'from-warning to-amber-400', red: 'from-danger to-orange-400' };
  return (
    <div className="progress-track">
      <div
        className={`progress-fill bg-gradient-to-r ${colors[color] || colors.accent}`}
        style={{ width: `${Math.min(100, value * 100)}%` }}
      />
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const c = status === 'Connected'
    ? 'bg-success shadow-[0_0_8px_rgba(0,184,148,0.6)]'
    : status === 'Connecting' ? 'bg-warning animate-pulse' : 'bg-dark-400';
  return <span className={`w-2 h-2 rounded-full ${c} transition-colors duration-300`} />;
}

// ─── SIDEBAR ──────────────────────────────────────────
function Sidebar({ page, setPage, wsConnected, status, uptime }: { page: Page; setPage: (p: Page) => void; wsConnected: boolean; status: string; uptime: string }) {
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

// ─── TOPBAR ───────────────────────────────────────────
function Topbar({ title, onReload, onSwitch, onRestart }: { title: string; onReload: () => void; onSwitch: () => void; onRestart: () => void }) {
  return (
    <header className="h-12 bg-dark-800/80 backdrop-blur-sm border-b border-dark-600/50 flex items-center px-5 gap-3 shrink-0">
      <span className="text-sm font-semibold flex-1 bg-gradient-to-r from-dark-50 to-dark-200 bg-clip-text text-transparent">{title}</span>
      <Tip text="Re-fetch inventory and campaigns from Twitch"><button onClick={onReload} className="btn-ghost"><RefreshCw size={13} /> Reload</button></Tip>
      <Tip text="Manually switch to a different channel"><button onClick={onSwitch} className="btn-ghost"><ArrowLeftRight size={13} /> Switch</button></Tip>
      <Tip text="Restart the server process (auto-reconnects)"><button onClick={onRestart} className="btn-warning"><RotateCcw size={13} /> Restart</button></Tip>
    </header>
  );
}

// ─── TOAST ────────────────────────────────────────────
function Toast({ id, msg, onClose }: { id: number; msg: { text: string; style: string }; onClose: (id: number) => void }) {
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

// ─── DASHBOARD ────────────────────────────────────────
function Dashboard({ status, channels, campaigns, wsStatus, uptime, drop, games }: {
  status: string; channels: Channel[]; campaigns: Campaign[]; wsStatus: Record<string, WsStatusItem>; uptime: string;
  drop: { active: boolean; drop_name?: string; rewards?: string; drop_pct?: string; drop_progress?: number; campaign_name?: string; game_name?: string; campaign_pct?: string; campaign_progress?: number; drop_rem?: string; camp_rem?: string };
  games: Record<string, Game>;
}) {
  const watching = channels.find(c => c.watching);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: <Zap size={18} className="text-accent" />, label: 'Status', value: status || 'Idle', tip: 'Current miner state (Idle, Watching, Fetching, etc.)', gradient: 'from-accent/20 to-transparent' },
          { icon: <Tv size={18} className="text-info" />, label: 'Channels', value: String(channels.length), tip: 'Number of channels currently being tracked', gradient: 'from-info/20 to-transparent' },
          { icon: <Gift size={18} className="text-success" />, label: 'Campaigns', value: String(campaigns.length), tip: 'Active drop campaigns available for mining', gradient: 'from-success/20 to-transparent' },
          { icon: <Clock size={18} className="text-warning" />, label: 'Uptime', value: uptime, tip: 'How long the server has been running', gradient: 'from-warning/20 to-transparent' },
        ].map((s, i) => (
          <div key={i} className="stat-card group cursor-default" title={s.tip}>
            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl`} />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-dark-600/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">{s.icon}</div>
              <div>
                <div className="text-lg font-bold tracking-tight">{s.value}</div>
                <div className="text-[10px] text-dark-300 uppercase tracking-wider">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    <div className="grid grid-cols-2 gap-4 relative z-10">
        <div className="card">
          <div className="flex items-center gap-2 mb-3"><Circle size={8} className="text-accent fill-accent" /><h3 className="text-xs font-semibold">Current Drop</h3></div>
          <div className="font-semibold text-sm">{drop.active ? drop.drop_name : '-'}</div>
          <div className="text-[11px] text-dark-200 mt-0.5">{drop.active ? drop.rewards : '-'}</div>
          <div className="mt-3"><div className="flex justify-between text-[11px]"><span>Progress</span><span>{drop.active ? drop.drop_pct : '0%'}</span></div><ProgressBar value={drop.active ? drop.drop_progress || 0 : 0} /></div>
          <div className="text-[11px] text-dark-200 mt-1.5">Remaining: <span className="font-mono">{drop.active ? drop.drop_rem : '-'}</span></div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-3"><Circle size={8} className="text-success fill-success" /><h3 className="text-xs font-semibold">Campaign</h3></div>
          <div className="font-semibold text-sm">{drop.active ? drop.campaign_name : '-'}</div>
          <div className="text-[11px] text-dark-200 mt-0.5">{drop.active ? drop.game_name : '-'}</div>
          <div className="mt-3"><div className="flex justify-between text-[11px]"><span>Progress</span><span>{drop.active ? drop.campaign_pct : '0%'}</span></div><ProgressBar value={drop.active ? drop.campaign_progress || 0 : 0} color="green" /></div>
          <div className="text-[11px] text-dark-200 mt-1.5">Remaining: <span className="font-mono">{drop.active ? drop.camp_rem : '-'}</span></div>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center gap-2 mb-2"><Eye size={14} className="text-info" /><h3 className="text-xs font-semibold">Watching</h3></div>
        <div className="text-base font-semibold">{watching?.name || 'None'}</div>
      </div>
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Wifi size={14} className="text-warning" /><h3 className="text-xs font-semibold">WebSocket Connections</h3></div>
          <span className="text-[10px] text-dark-300 bg-dark-600/50 px-2 py-0.5 rounded-full">{Object.values(wsStatus).filter(w => w.status === 'Connected').length}/8 active</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }, (_, i) => {
            const w = wsStatus[i] || { status: 'Disconnected', topics: 0 };
            const active = w.status === 'Connected';
            const pct = Math.min(100, (w.topics / 50) * 100);
            return (
              <div key={i} className={`bg-dark-900/60 border rounded-lg p-2.5 transition-all duration-300 ${active ? 'border-success/50 shadow-[0_0_12px_rgba(0,184,148,0.15)]' : 'border-dark-600/30'}`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <StatusDot status={w.status} />
                  <span className="text-[11px] font-bold flex-1">WS{i + 1}</span>
                  <span className={`text-[9px] transition-colors ${active ? 'text-success' : 'text-dark-400'}`}>{w.status}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1 bg-dark-700/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${active ? 'bg-gradient-to-r from-success to-emerald-400' : 'bg-dark-500/30'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] text-dark-400 font-mono whitespace-nowrap">{w.topics}/50</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── CHANNELS ─────────────────────────────────────────
function Channels({ channels }: { channels: Channel[] }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3"><Tv size={14} className="text-accent" /><h3 className="text-xs font-semibold">Channels</h3></div>
      {channels.length === 0 ? <div className="text-center py-10 text-dark-300"><Tv size={32} className="mx-auto mb-2 opacity-40" /><p className="text-xs">No channels loaded yet</p></div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs"><thead><tr className="border-b-2 border-dark-600">
            {['Channel', 'Status', 'Game', 'Drops', 'Viewers', 'ACL', ''].map(h => <th key={h} className="text-left py-2 px-2.5 text-[10px] text-dark-200 uppercase tracking-wider font-bold">{h}</th>)}
          </tr></thead><tbody>
            {channels.map(ch => (
              <tr key={ch.id} className={`border-b border-dark-600 hover:bg-dark-600/50 ${ch.watching ? 'bg-accent/10' : ''}`}>
                <td className="py-2 px-2.5 font-semibold">{ch.name}</td>
                <td className="py-2 px-2.5"><span className={`badge ${ch.status === 'Online' ? 'badge-green' : ch.status === 'Pending' ? 'badge-yellow' : 'badge-red'}`}>{ch.status}</span></td>
                <td className="py-2 px-2.5 text-dark-200">{ch.game || '-'}</td>
                <td className="py-2 px-2.5">{ch.drops ? <span className="badge badge-green">Yes</span> : <span className="badge badge-red">No</span>}</td>
                <td className="py-2 px-2.5 text-dark-200">{ch.viewers || '-'}</td>
                <td className="py-2 px-2.5">{ch.acl ? <span className="badge badge-purple">ACL</span> : ''}</td>
                <td className="py-2 px-2.5">{ch.watching ? <Eye size={14} className="text-accent" /> : null}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}
    </div>
  );
}

// ─── DROPS ────────────────────────────────────────────
function Drops({ campaigns, games }: { campaigns: Campaign[]; games: Record<string, Game> }) {
  return (
    <div className="space-y-3">
      {campaigns.length === 0 ? <div className="card text-center py-10 text-dark-400"><Gift size={32} className="mx-auto mb-2 opacity-30" /><p className="text-xs">No campaigns loaded yet</p></div> :
        campaigns.map((c, idx) => (
          <div key={c.id} className="card" style={{ animationDelay: `${idx * 50}ms` }}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <GameIcon games={games} name={c.game} />
                <div><h4 className="text-[13px] font-semibold">{c.name}</h4>
                  <div className="text-[11px] text-dark-300">{c.game} · {c.claimed}/{c.total} drops · {c.eligible ? <span className="text-success">Linked</span> : <span className="text-danger">Not linked</span>}</div>
                </div>
              </div>
              <span className={`badge ${c.status === 'active' ? 'badge-green' : c.status === 'upcoming' ? 'badge-yellow' : 'badge-red'}`}>{c.status}</span>
            </div>
            <div className="flex justify-between text-[11px] mb-1"><span className="text-dark-300">Progress</span><span className="font-medium">{(c.progress * 100).toFixed(1)}%</span></div>
            <ProgressBar value={c.progress} color="green" />
            <div className="text-[10px] text-dark-400 mt-1.5">{c.starts ? `Starts: ${new Date(c.starts).toLocaleString()}` : ''} {c.ends ? `Ends: ${new Date(c.ends).toLocaleString()}` : ''}</div>
            {c.drops.map(d => (
              <div key={d.id} className="flex items-center gap-2.5 py-1.5 border-t border-dark-600/30 first:border-t-0 text-xs">
                <span className="flex-1 font-medium">{d.name} <span className="text-dark-400">- {d.rewards}</span></span>
                <span className="text-dark-300 whitespace-nowrap">{d.cur}/{d.req}m {d.claimed ? <Check size={12} className="inline text-success" /> : d.can_claim ? <AlertTriangle size={12} className="inline text-warning" /> : ''}</span>
                <div className="w-20"><ProgressBar value={d.progress} /></div>
              </div>
            ))}
          </div>
        ))
      }
    </div>
  );
}

// ─── TOOLTIP ──────────────────────────────────────────
function Tip({ text, children }: { text: string; children: React.ReactNode }) {
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

// ─── SETTINGS ─────────────────────────────────────────
function SettingsPage({ settings, games, onSave }: { settings: SettingsType | null; games: Record<string, Game>; onSave: (data: Record<string, unknown>) => void }) {
  const [form, setForm] = useState(settings || {} as SettingsType);
  const [prio, setPrio] = useState<string[]>([]);
  const [excl, setExcl] = useState<string[]>([]);
  const [prioInput, setPrioInput] = useState('');
  const [exclInput, setExclInput] = useState('');
  const [prioSugs, setPrioSugs] = useState<{ name: string; id: number | null }[]>([]);
  const [exclSugs, setExclSugs] = useState<{ name: string; id: number | null }[]>([]);

  useEffect(() => { if (settings) { setForm(settings); setPrio(settings.priority || []); setExcl(settings.exclude || []); } }, [settings]);

  const suggest = (val: string, used: string[]) => {
    if (!val.trim()) return [];
    const vl = val.toLowerCase();
    return Object.values(games).filter(g => g.name.toLowerCase().includes(vl) && !used.includes(g.name)).slice(0, 6);
  };

  const addGame = (list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void, games: Record<string, Game>) => {
    const v = input.trim();
    if (v && !list.includes(v)) {
      if (!games[v]) games[v] = { id: null, name: v };
      setList([...list, v]);
      setInput('');
    }
  };

  const handleSave = () => {
    onSave({ ...form, priority: prio, exclude: excl });
  };

  if (!settings) return null;
  const langList = ['English','Deutsch','Français','Español','Português','Italiano','Nederlands','Polski','Română','Türkçe','Čeština','Dansk','Norsk','Indonesian','Українська','Русский','العربية','日本語','简体中文','繁體中文'];

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-3"><Sliders size={14} className="text-accent" /><h3 className="text-xs font-semibold">General</h3></div>
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <label className="text-[10px] text-dark-200 uppercase tracking-wider font-semibold">Proxy</label>
              <Tip text="Route all traffic through a proxy server. Format: http://user:pass@host:port"><Info size={10} className="text-dark-300 cursor-help" /></Tip>
            </div>
            <input className="input" placeholder="http://user:pass@host:port" value={form.proxy || ''} onChange={e => setForm({ ...form, proxy: e.target.value })} />
          </div>
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <label className="text-[10px] text-dark-200 uppercase tracking-wider font-semibold">Language (restart required)</label>
              <Tip text="UI language. Changes take effect after restarting the server."><Info size={10} className="text-dark-300 cursor-help" /></Tip>
            </div>
            <select className="input" value={form.language || 'English'} onChange={e => setForm({ ...form, language: e.target.value })}>
              {langList.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <label className="text-[10px] text-dark-200 uppercase tracking-wider font-semibold">Priority Mode</label>
              <Tip text="How to order games when mining. Priority Only = only your list. Ending Soonest = mine expiring drops first. Low Availability = mine rare drops first."><Info size={10} className="text-dark-300 cursor-help" /></Tip>
            </div>
            <select className="input" value={form.priority_mode ?? 0} onChange={e => setForm({ ...form, priority_mode: +e.target.value })}>
              <option value={0}>Priority Only</option><option value={1}>Ending Soonest</option><option value={2}>Low Availability First</option>
            </select>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="text-[10px] text-dark-200 uppercase tracking-wider font-semibold">Connection Quality (1-6)</label>
              <Tip text="Higher values = longer timeouts for slow connections. Default 1 is fine for most."><Info size={10} className="text-dark-300 cursor-help" /></Tip>
            </div>
            <input type="number" className="input" min={1} max={6} value={form.connection_quality || 1} onChange={e => setForm({ ...form, connection_quality: +e.target.value })} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-3"><Zap size={14} className="text-warning" /><h3 className="text-xs font-semibold">Toggles</h3></div>
          {[
            { key: 'tray_notifications', label: 'Desktop Notifications', icon: <Bell size={13} />, tip: 'Show OS notifications when drops are claimed or errors occur.' },
            { key: 'enable_badges_emotes', label: 'Enable Badges & Emotes', icon: <Shield size={13} />, tip: 'Include badge and emote drops in mining. These are usually sub-only.' },
            { key: 'available_drops_check', label: 'Available Drops Check', icon: <Gift size={13} />, tip: 'Extra check to verify drops are available. Uses more API calls.' },
          ].map(t => (
            <label key={t.key} className="flex items-center gap-2 mb-2 cursor-pointer" title={t.tip}>
              <input type="checkbox" className="accent-accent w-3.5 h-3.5" checked={!!(form as unknown as Record<string, unknown>)[t.key]} onChange={e => setForm({ ...form, [t.key]: e.target.checked })} />
              <span className="text-xs flex items-center gap-1.5">{t.icon}{t.label}</span>
            </label>
          ))}
          <button className="btn-primary mt-3 w-full justify-center" onClick={handleSave}><Check size={13} /> Save Settings</button>
        </div>
      </div>
      <div className="space-y-4">
        {/* PRIORITY LIST */}
        <div className="card !overflow-visible relative z-50 isolation-auto">
          <div className="flex items-center gap-2 mb-3">
            <Circle size={8} className="text-success fill-success" />
            <h3 className="text-xs font-semibold">Priority List</h3>
            <Tip text="Games mined in order (top first). Only these are mined in Priority Only mode.">
              <Info size={10} className="text-dark-300 cursor-help" />
            </Tip>
          </div>
          <div className="max-h-44 overflow-y-auto bg-dark-900 border border-dark-600 rounded-md p-1.5 mb-2">
            {prio.length === 0 && <div className="text-[11px] text-dark-300 text-center py-2">No games added</div>}
            {prio.map((g, i) => (
              <div key={i} className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-dark-600 text-xs">
                <GameIcon games={games} name={g} size={18} />
                <span className="flex-1">{g}</span>
                <button onClick={() => { if (i > 0) { const n = [...prio]; [n[i], n[i - 1]] = [n[i - 1], n[i]]; setPrio(n); } }} className="text-dark-200 hover:text-dark-50 p-0.5"><ChevronUp size={12} /></button>
                <button onClick={() => { if (i < prio.length - 1) { const n = [...prio]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; setPrio(n); } }} className="text-dark-200 hover:text-dark-50 p-0.5"><ChevronDown size={12} /></button>
                <button onClick={() => setPrio(prio.filter((_, j) => j !== i))} className="text-danger/60 hover:text-danger p-0.5"><X size={12} /></button>
              </div>
            ))}
          </div>
          <div className="relative flex gap-1.5">
            <input className="input flex-1" placeholder="Type game name..." value={exclInput} onChange={e => { setExclInput(e.target.value); setExclSugs(suggest(e.target.value, excl)); }} onFocus={() => setExclSugs(suggest(exclInput, excl))} onBlur={() => setTimeout(() => setExclSugs([]), 200)} onKeyDown={e => { if (e.key === 'Enter') { addGame(excl, setExcl, exclInput, setExclInput, games); setExclSugs([]); } }} />
            <button className="btn-primary" onClick={() => { addGame(excl, setExcl, exclInput, setExclInput, games); setExclSugs([]); }}><Plus size={14} /></button>
            <GameDropdown
              suggestions={exclSugs}
              onSelect={(name) => { setExclInput(name); addGame(excl, setExcl, name, setExclInput, games); setExclSugs([]); }}
              games={games}
              manualAdd={!games[exclInput.trim()] && exclInput.trim() && !excl.includes(exclInput.trim()) ? exclInput.trim() : undefined}
            />
          </div>
        </div>

        {/* EXCLUDE LIST */}
        <div className="card !overflow-visible relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Circle size={8} className="text-danger fill-danger" />
            <h3 className="text-xs font-semibold">Exclude List</h3>
            <Tip text="Games in this list are never mined, regardless of Priority Mode.">
              <Info size={10} className="text-dark-300 cursor-help" />
            </Tip>
          </div>
          <div className="max-h-44 overflow-y-auto bg-dark-900 border border-dark-600 rounded-md p-1.5 mb-2">
            {excl.length === 0 && <div className="text-[11px] text-dark-300 text-center py-2">No games excluded</div>}
            {excl.map((g, i) => (
              <div key={i} className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-dark-600 text-xs">
                <GameIcon games={games} name={g} size={18} />
                <span className="flex-1">{g}</span>
                <button onClick={() => setExcl(excl.filter((_, j) => j !== i))} className="text-danger/60 hover:text-danger p-0.5"><X size={12} /></button>
              </div>
            ))}
          </div>
          <div className="relative flex gap-1.5">
            <input className="input flex-1" placeholder="Type game name..." value={exclInput} onChange={e => { setExclInput(e.target.value); setExclSugs(suggest(e.target.value, excl)); }} onFocus={() => setExclSugs(suggest(exclInput, excl))} onBlur={() => setTimeout(() => setExclSugs([]), 200)} onKeyDown={e => { if (e.key === 'Enter') { addGame(excl, setExcl, exclInput, setExclInput, games); setExclSugs([]); } }} />
            <button className="btn-primary" onClick={() => { addGame(excl, setExcl, exclInput, setExclInput, games); setExclSugs([]); }}><Plus size={14} /></button>
            <GameDropdown
              suggestions={exclSugs}
              onSelect={(name) => { setExclInput(name); addGame(excl, setExcl, name, setExclInput, games); setExclSugs([]); }}
              games={games}
              manualAdd={!games[exclInput.trim()] && exclInput.trim() && !excl.includes(exclInput.trim()) ? exclInput.trim() : undefined}
            />
          </div>
      </div>
    </div>
  );
}

// ─── LOGS ─────────────────────────────────────────────
function Logs({ logs, onClear }: { logs: string[]; onClear: () => void }) {
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

// ─── LOGIN OVERLAY ────────────────────────────────────
function LoginOverlay({ action, code, url, error, onLogin, onConfirm }: {
  action: string | null; code?: string; url?: string; error?: string;
  onLogin: (u: string, p: string, t: string) => void; onConfirm: () => void;
}) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [token, setToken] = useState('');
  if (!action) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s]">
      <div className="bg-dark-700/95 backdrop-blur-md border border-dark-600/50 rounded-2xl p-8 w-[380px] shadow-2xl animate-[scale-in_0.25s_ease-out]">
        {action === 'enter_code' ? (
          <>
            <h2 className="text-lg font-bold text-center">Enter Activation Code</h2>
            <p className="text-[11px] text-dark-300 text-center mt-1">Go to twitch.tv/activate and enter the code</p>
            <div className="my-5 p-5 bg-dark-900/80 rounded-xl text-center font-mono text-3xl font-extrabold tracking-[6px] text-accent-light border border-accent/20">{code}</div>
            <a href={url} target="_blank" rel="noreferrer" className="block text-center text-accent text-xs mb-4 hover:underline">Open twitch.tv/activate <ChevronRight size={10} className="inline" /></a>
            <button className="btn-primary w-full justify-center py-2.5" onClick={onConfirm}><Check size={14} /> I've entered the code</button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-center">Login Required</h2>
            <p className="text-[11px] text-dark-300 text-center mt-1">Enter your Twitch credentials</p>
            <div className="mt-5 space-y-3">
              <div><label className="text-[10px] text-dark-300 uppercase tracking-wider font-semibold mb-1 block">Username</label><input className="input" placeholder="Twitch username" value={user} onChange={e => setUser(e.target.value)} /></div>
              <div><label className="text-[10px] text-dark-300 uppercase tracking-wider font-semibold mb-1 block">Password</label><input type="password" className="input" placeholder="Twitch password" value={pass} onChange={e => setPass(e.target.value)} /></div>
              <div><label className="text-[10px] text-dark-300 uppercase tracking-wider font-semibold mb-1 block">2FA Token (optional)</label><input className="input" placeholder="6-digit code" value={token} onChange={e => setToken(e.target.value)} /></div>
              {error && <p className="text-danger text-[11px] text-center bg-danger/10 py-2 rounded-lg">{error}</p>}
              <button className="btn-primary w-full justify-center mt-2 py-2.5" onClick={() => onLogin(user, pass, token)}><LogIn size={14} /> Login</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [status, setStatus] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [wsStatus, setWsStatus] = useState<Record<string, WsStatusItem>>({});
  const [games, setGames] = useState<Record<string, Game>>({});
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [uptime, setUptime] = useState('00:00:00');
  const [logs, setLogs] = useState<string[]>([]);
  const [toasts, setToasts] = useState<{ id: number; text: string; style: string }[]>([]);
  const [loginAction, setLoginAction] = useState<string | null>(null);
  const [loginCode, setLoginCode] = useState('');
  const [loginUrl, setLoginUrl] = useState('');
  const [loginError, setLoginError] = useState('');
  const [drop, setDrop] = useState<{ active: boolean }>({ active: false });
  const serverStartRef = useRef(Date.now());
  const gamesRef = useRef<Record<string, Game>>({});
  const toastIdRef = useRef(0);

  const addToast = useCallback((text: string, style: string) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, text, style }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleWs = useCallback((msg: WsMessage) => {
    switch (msg.type) {
      case 'init':
        setStatus(msg.status);
        setChannels(msg.channels);
        setCampaigns(msg.campaigns);
        setWsStatus(msg.ws_status);
        setGames(msg.games);
        gamesRef.current = msg.games;
        if (msg.uptime) { const p = msg.uptime.split(':').map(Number); serverStartRef.current = Date.now() - ((p[0] * 3600 + p[1] * 60 + p[2]) * 1000); }
        if (msg.login_action) { setLoginAction(msg.login_action); if (msg.login_code) setLoginCode(msg.login_code); if (msg.login_url) setLoginUrl(msg.login_url); }
        fetch('/api/settings').then(r => r.json()).then(setSettings).catch(() => {});
        break;
      case 'status': setStatus(msg.text); break;
      case 'log': setLogs(prev => [...prev.slice(-999), msg.message]); break;
      case 'channels': setChannels(msg.channels); break;
      case 'drop': setDrop(msg); break;
      case 'progress': break;
      case 'inventory': setCampaigns(msg.campaigns); break;
      case 'ws_status': setWsStatus(msg.items); break;
      case 'games_update': setGames(msg.games); break;
      case 'login':
        if (msg.action) { setLoginAction(msg.action); if (msg.code) setLoginCode(msg.code); if (msg.url) setLoginUrl(msg.url); }
        if (msg.error) setLoginError(msg.error);
        if (msg.status && msg.user_id) setLoginAction(null);
        break;
      case 'toast': addToast(msg.message, msg.style); break;
      case 'settings_saved': addToast('Settings saved', 'success'); break;
    }
  }, [addToast]);

  const wasConnectedRef = useRef(false);
  const onConnectionChange = useCallback((isConnected: boolean) => {
    if (isConnected) addToast('Connected to server', 'success');
    else if (wasConnectedRef.current) addToast('Disconnected from server', 'error');
  }, [addToast]);

  const { connected, send } = useWebSocket(handleWs, onConnectionChange);
  useEffect(() => { wasConnectedRef.current = connected; }, [connected]);

  // Uptime timer - only interval, no init override
  useEffect(() => {
    const t = setInterval(() => {
      const ms = Date.now() - serverStartRef.current;
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setUptime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const titles: Record<Page, string> = { dashboard: 'Dashboard', channels: 'Channels', drops: 'Drops Inventory', settings: 'Settings', logs: 'Logs' };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar page={page} setPage={setPage} wsConnected={connected} status={status} uptime={uptime} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={titles[page]} onReload={() => send({ action: 'reload' })} onSwitch={() => send({ action: 'switch' })} onRestart={() => send({ action: 'restart' })} />
        <main className="flex-1 overflow-y-auto p-5">
          {page === 'dashboard' && <Dashboard status={status} channels={channels} campaigns={campaigns} wsStatus={wsStatus} uptime={uptime} drop={drop as any} games={games} />}
          {page === 'channels' && <Channels channels={channels} />}
          {page === 'drops' && <Drops campaigns={campaigns} games={games} />}
          {page === 'settings' && <SettingsPage settings={settings} games={games}     onSave={(d) => send({ action: 'save_settings', ...d as unknown as Record<string, unknown> })} />}
          {page === 'logs' && <Logs logs={logs} onClear={() => setLogs([])} />}
        </main>
      </div>
      <LoginOverlay action={loginAction} code={loginCode} url={loginUrl} error={loginError} onLogin={(u, p, t) => send({ action: 'login_submit', username: u, password: p, token: t })} onConfirm={() => send({ action: 'code_confirm' })} />
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50">
        {toasts.map(t => <Toast key={t.id} id={t.id} msg={t} onClose={removeToast} />)}
      </div>
    </div>
  );
}
