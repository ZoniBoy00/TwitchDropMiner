import { RefreshCw, ArrowLeftRight, RotateCcw } from 'lucide-react';
import { Tip } from '../components/Tip';

export function Topbar({ title, onReload, onSwitch, onRestart }: { title: string; onReload: () => void; onSwitch: () => void; onRestart: () => void }) {
  return (
    <header className="h-12 bg-dark-800/80 backdrop-blur-sm border-b border-dark-600/50 flex items-center px-5 gap-3 shrink-0">
      <span className="text-sm font-semibold flex-1 bg-gradient-to-r from-dark-50 to-dark-200 bg-clip-text text-transparent">{title}</span>
      <Tip text="Re-fetch inventory and campaigns from Twitch"><button onClick={onReload} className="btn-ghost"><RefreshCw size={13} /> Reload</button></Tip>
      <Tip text="Manually switch to a different channel"><button onClick={onSwitch} className="btn-ghost"><ArrowLeftRight size={13} /> Switch</button></Tip>
      <Tip text="Restart the server process (auto-reconnects)"><button onClick={onRestart} className="btn-warning"><RotateCcw size={13} /> Restart</button></Tip>
    </header>
  );
}
