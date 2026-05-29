import { useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import type { Game } from '../types';

export const gameIconUrl = (games: Record<string, Game>, name: string) => {
  const g = games[name];
  return g?.id ? `https://static-cdn.jtvnw.net/ttv-boxart/${g.id}.jpg` : '';
};

export function GameIcon({ games, name, size = 24 }: { games: Record<string, Game>; name: string; size?: number }) {
  const url = gameIconUrl(games, name);
  const [error, setError] = useState(false);
  if (url && !error) return <img src={url} alt="" className="rounded object-cover" style={{ width: size, height: size * 1.33 }} onError={() => setError(true)} />;
  return <div className="bg-dark-600 rounded flex items-center justify-center" style={{ width: size, height: size * 1.33 }}><Gamepad2 size={size * 0.5} className="text-dark-300" /></div>;
}
