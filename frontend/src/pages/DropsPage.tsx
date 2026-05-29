import { Gift, Check, AlertTriangle } from 'lucide-react';
import { GameIcon } from '../components/GameIcon';
import { ProgressBar } from '../components/ProgressBar';
import type { Campaign, Game } from '../types';

export function DropsPage({ campaigns, games }: { campaigns: Campaign[]; games: Record<string, Game> }) {
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
