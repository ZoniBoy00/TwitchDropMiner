import { useState, useEffect } from 'react';
import { Sliders, Bell, Shield, Gift, Circle, Info, Check, Plus, ChevronUp, ChevronDown, X, Zap } from 'lucide-react';
import { GameIcon } from '../components/GameIcon';
import { Tip } from '../components/Tip';
import type { Settings, Game } from '../types';

function GameInput({ games, list, setList, used }: {
  games: Record<string, Game>;
  list: string[];
  setList: (v: string[]) => void;
  used: string[];
}) {
  const [input, setInput] = useState('');
  const [sugs, setSugs] = useState<{ name: string; id: number | null }[]>([]);
  const [focused, setFocused] = useState(false);

  const suggest = (val: string) => {
    if (!val.trim()) return [];
    const vl = val.toLowerCase();
    return Object.values(games).filter(g => g.name.toLowerCase().includes(vl) && !used.includes(g.name)).slice(0, 6);
  };

  const addGame = (name: string) => {
    const v = name.trim();
    if (v && !list.includes(v)) {
      if (!games[v]) games[v] = { id: null, name: v };
      setList([...list, v]);
    }
    setInput('');
    setSugs([]);
  };

  const handleSelect = (name: string) => {
    setInput(name);
    addGame(name);
  };

  const manualAdd = !games[input.trim()] && input.trim() && !used.includes(input.trim()) ? input.trim() : undefined;

  return (
    <div className="relative flex gap-1.5">
      <input className="input flex-1" placeholder="Type game name..." value={input}
        onChange={e => { setInput(e.target.value); setSugs(suggest(e.target.value)); }}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => { setFocused(false); setSugs([]); }, 200)}
        onKeyDown={e => { if (e.key === 'Enter') { addGame(input); setSugs([]); } }}
      />
      <button className="btn-primary shrink-0" onClick={() => { addGame(input); setSugs([]); }}><Plus size={14} /></button>
      {focused && sugs.length > 0 && (
        <div className="absolute left-0 right-11 top-full mt-1 bg-dark-700 border border-dark-600 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
          {sugs.map(g => (
            <div key={g.name} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-dark-600 cursor-pointer text-xs" onMouseDown={() => handleSelect(g.name)}>
              <GameIcon games={games} name={g.name} size={16} /><span>{g.name}</span>
            </div>
          ))}
          {manualAdd && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-dark-600 cursor-pointer text-xs text-accent border-t border-dark-600" onMouseDown={() => handleSelect(manualAdd)}>
              <Plus size={13} /><span>Add "{manualAdd}" manually</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SettingsPage({ settings, games, onSave }: {
  settings: Settings | null;
  games: Record<string, Game>;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState(settings || {} as Settings);
  const [prio, setPrio] = useState<string[]>([]);
  const [excl, setExcl] = useState<string[]>([]);

  useEffect(() => { if (settings) { setForm(settings); setPrio(settings.priority || []); setExcl(settings.exclude || []); } }, [settings]);

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
        <div className="card relative z-10">
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
          <GameInput games={games} list={prio} setList={setPrio} used={prio} />
        </div>

        <div className="card relative z-0">
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
          <GameInput games={games} list={excl} setList={setExcl} used={excl} />
        </div>
      </div>
    </div>
  );
}
