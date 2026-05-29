import { Zap, Tv, Gift, Clock, Circle, Eye, Wifi } from 'lucide-react';
import { ProgressBar } from '../components/ProgressBar';
import { StatusDot } from '../components/StatusDot';
import type { Channel, Campaign, WsStatusItem, Game } from '../types';

export function Dashboard({ status, channels, campaigns, wsStatus, uptime, drop }: {
  status: string; channels: Channel[]; campaigns: Campaign[]; wsStatus: Record<string, WsStatusItem>; uptime: string;
  drop: { active: boolean; drop_name?: string; rewards?: string; drop_pct?: string; drop_progress?: number; campaign_name?: string; game_name?: string; campaign_pct?: string; campaign_progress?: number; drop_rem?: string; camp_rem?: string };
  games: Record<string, Game>;
}) {
  const watching = channels.find(c => c.watching);
  return (
    <div className="space-y-3 md:space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
