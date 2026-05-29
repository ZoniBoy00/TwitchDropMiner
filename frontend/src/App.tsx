import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import type { WsMessage, Page, Channel, Campaign, Settings as SettingsType, WsStatusItem, Game } from './types';

import { Toast } from './components/Toast';

// Pages
import { Dashboard } from './pages/Dashboard';
import { ChannelsPage } from './pages/ChannelsPage';
import { DropsPage } from './pages/DropsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LogsPage } from './pages/LogsPage';
import { FAQPage } from './pages/FAQPage';

// Layout
import { Sidebar } from './layout/Sidebar';
import { Topbar } from './layout/Topbar';
import { LoginOverlay } from './components/LoginOverlay';

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
  const [loginStatus, setLoginStatus] = useState('Logged out');
  const [loginUserId, setLoginUserId] = useState<number | null>(null);
  const [drop, setDrop] = useState<{ active: boolean }>({ active: false });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const serverStartRef = useRef(Date.now());
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
        if (msg.login_status) setLoginStatus(msg.login_status);
        if (msg.login_user_id !== undefined) setLoginUserId(msg.login_user_id);
        if (msg.uptime) { const p = msg.uptime.split(':').map(Number); serverStartRef.current = Date.now() - ((p[0] * 3600 + p[1] * 60 + p[2]) * 1000); }
        if (msg.login_action) { setLoginAction(msg.login_action); if (msg.login_code) setLoginCode(msg.login_code); if (msg.login_url) setLoginUrl(msg.login_url); }
        if (msg.drop) setDrop(msg.drop);
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
        if (msg.status) setLoginStatus(msg.status);
        if (msg.user_id !== undefined) setLoginUserId(msg.user_id);
        if (msg.status && msg.user_id) setLoginAction(null);
        break;
      case 'toast': addToast(msg.message, msg.style); break;
      case 'settings_saved': 
        addToast('Settings saved', 'success'); 
        fetch('/api/settings').then(r => r.json()).then(setSettings).catch(() => {});
        break;
    }
  }, [addToast]);

  const wasConnectedRef = useRef(false);
  const onConnectionChange = useCallback((isConnected: boolean) => {
    if (isConnected) addToast('Connected to server', 'success');
    else if (wasConnectedRef.current) addToast('Disconnected from server', 'error');
  }, [addToast]);

  const { connected, send } = useWebSocket(handleWs, onConnectionChange);
  useEffect(() => { wasConnectedRef.current = connected; }, [connected]);

  // Uptime timer
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

  const titles: Record<Page, string> = { dashboard: 'Dashboard', channels: 'Channels', drops: 'Drops Inventory', settings: 'Settings', logs: 'Logs', faq: 'FAQ' };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setLoginStatus('Logged out');
      setLoginUserId(null);
      addToast('Logged out', 'success');
    } catch (e) {
      addToast('Logout failed', 'error');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar page={page} setPage={setPage} wsConnected={connected} status={status} uptime={uptime} loginStatus={loginStatus} loginUserId={loginUserId} onLogout={handleLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={titles[page]} onReload={() => send({ action: 'reload' })} onSwitch={() => send({ action: 'switch' })} onRestart={() => send({ action: 'restart' })} onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 p-3 md:p-5 min-h-0">
          <div className="overflow-y-auto h-full min-h-0">
            {page === 'dashboard' && <Dashboard status={status} channels={channels} campaigns={campaigns} wsStatus={wsStatus} uptime={uptime} drop={drop as any} games={games} />}
            {page === 'channels' && <ChannelsPage channels={channels} />}
            {page === 'drops' && <DropsPage campaigns={campaigns} games={games} />}
            {page === 'settings' && <SettingsPage settings={settings} games={games} onSave={(d) => send({ action: 'save_settings', ...d as unknown as Record<string, unknown> })} />}
            {page === 'logs' && <LogsPage logs={logs} onClear={() => setLogs([])} />}
            {page === 'faq' && <FAQPage />}
          </div>
        </main>
      </div>
      <LoginOverlay action={loginAction} code={loginCode} url={loginUrl} error={loginError} onLogin={(u, p, t) => send({ action: 'login_submit', username: u, password: p, token: t })} onConfirm={() => send({ action: 'code_confirm' })} />
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50">
        {toasts.map(t => <Toast key={t.id} id={t.id} msg={t} onClose={removeToast} />)}
      </div>
    </div>
  );
}
