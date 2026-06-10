import { HelpCircle, AlertTriangle, Settings, LogOut, RefreshCw, Clock, Tv, Server, BookOpen } from 'lucide-react';

const faqs = [
  {
    q: 'The miner stays "Idle" and won\'t start mining',
    a: 'This usually means no eligible campaigns were found. Try:\n1. Go to **Settings** and enable **"Enable Badges & Emotes"** — many drops (including Tarkov) require this\n2. Make sure your game is in the **Priority List**\n3. Click **Reload** in the top bar to refresh campaigns\n4. Check the **Logs** page for error messages\n5. Verify you\'re logged in (sidebar shows green "Logged in" status)',
    icon: 'AlertTriangle'
  },
  {
    q: 'How do I log in?',
    a: 'When the page loads, you\'ll see a **LoginOverlay** with the device activation code flow. Enter the code at `twitch.tv/activate` to log in.\n\n> **Note:** The backend also supports username/password + 2FA, but the web UI only shows the device code method.',
    icon: 'HelpCircle'
  },
  {
    q: 'Logout button doesn\'t work',
    a: 'Try these:\n1. Click the logout icon in the sidebar (next to login status)\n2. Or visit `/api/logout` directly in your browser\n3. Refresh the page with **Ctrl+F5** (hard refresh) after logout\n4. If still stuck, restart the server from the top bar',
    icon: 'LogOut'
  },
  {
    q: 'Settings don\'t save / toggle keeps reverting',
    a: 'After pressing **Save Settings**, the page automatically re-fetches settings from the server. If the toggle still looks wrong:\n1. Refresh the page (F5)\n2. Make sure you see the green "Settings saved" toast\n3. The server-side file (`settings.json`) always has the correct values',
    icon: 'Settings'
  },
  {
    q: '"Maintenance task waiting" — what does this mean?',
    a: 'The miner runs a scheduled task every hour that triggers a campaign refresh. This is **normal behavior**. The task automatically reloads inventory when needed — no action required.',
    icon: 'Clock'
  },
  {
    q: 'Campaigns found but no channels are being watched',
    a: 'This means campaigns exist but no live channels are streaming the game with drops enabled. The server automatically checks again when new streams go live, or click **Reload** to force an immediate refresh.',
    icon: 'Tv'
  },
  {
    q: 'Server keeps restarting / crashing',
    a: 'Common causes:\n- **OAuth token expired**: Log out via `/api/logout` and re-login\n- **Twitch API rate limiting**: Wait a few minutes\n- **Network issues**: Check the Logs page\n- The server auto-restarts via systemd if it crashes',
    icon: 'Server'
  }
];

const iconMap: Record<string, React.ReactNode> = {
  AlertTriangle: <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />,
  HelpCircle: <HelpCircle size={18} className="text-accent shrink-0 mt-0.5" />,
  LogOut: <LogOut size={18} className="text-danger shrink-0 mt-0.5" />,
  Settings: <Settings size={18} className="text-info shrink-0 mt-0.5" />,
  Clock: <Clock size={18} className="text-success shrink-0 mt-0.5" />,
  Tv: <Tv size={18} className="text-accent-light shrink-0 mt-0.5" />,
  Server: <Server size={18} className="text-warning shrink-0 mt-0.5" />,
};

function md(s: string) {
  // Simple markdown-like rendering (bold)
  return s.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-dark-50 font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={18} className="text-accent" />
        <h2 className="text-sm font-bold tracking-wider">FAQ / Troubleshooting</h2>
      </div>
      {faqs.map((faq, i) => (
        <details key={i} className="card group open:border-accent/30 transition-all duration-200">
          <summary className="flex items-start gap-3 cursor-pointer list-none py-1 select-none">
            {iconMap[faq.icon]}
            <div className="flex-1">
              <span className="text-sm font-medium text-dark-100 group-open:text-accent transition-colors">
                {faq.q}
              </span>
            </div>
            <ChevronIcon />
          </summary>
          <div className="mt-3 pl-9 text-[13px] text-dark-200 leading-relaxed whitespace-pre-line border-t border-dark-600/30 pt-3">
            {md(faq.a)}
          </div>
        </details>
      ))}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="text-dark-400 group-open:rotate-180 transition-transform duration-200 shrink-0 mt-0.5">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
