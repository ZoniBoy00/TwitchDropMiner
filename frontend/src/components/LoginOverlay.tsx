import { useState } from 'react';
import { Check, ChevronRight, LogIn } from 'lucide-react';

export function LoginOverlay({ action, code, url, error, onLogin, onConfirm }: {
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
