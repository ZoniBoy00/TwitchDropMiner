export interface Game { id: number | null; name: string }

export interface WsStatusItem { status: string; topics: number }

export interface Channel {
  id: string; name: string; status: string; game: string;
  drops: boolean; viewers: number; acl: boolean; watching: boolean;
}

export interface Drop {
  id: string; name: string; rewards: string; progress: number;
  cur: number; req: number; claimed: boolean; can_claim: boolean;
}

export interface Campaign {
  id: string; name: string; game: string; status: string; eligible: boolean;
  claimed: number; total: number; progress: number;
  starts: string; ends: string; drops: Drop[];
}

export interface Settings {
  proxy: string; language: string; dark_mode: boolean; tray_notifications: boolean;
  enable_badges_emotes: boolean; available_drops_check: boolean;
  connection_quality: number; priority_mode: number;
  priority: string[]; exclude: string[]; games: Record<string, Game>;
}

export type Page = 'dashboard' | 'channels' | 'drops' | 'settings' | 'logs';

export type WsMessage =
  | { type: 'init'; status: string; channels: Channel[]; tray: string; campaigns: Campaign[]; games: Record<string, Game>; ws_status: Record<string, WsStatusItem>; uptime: string; login_action?: string; login_code?: string; login_url?: string }
  | { type: 'status'; text: string }
  | { type: 'log'; message: string }
  | { type: 'channels'; channels: Channel[] }
  | { type: 'drop'; active: boolean; drop_name?: string; rewards?: string; drop_progress?: number; drop_pct?: string; campaign_name?: string; game_name?: string; campaign_progress?: number; campaign_pct?: string; drop_rem?: string; camp_rem?: string }
  | { type: 'progress'; drop_remaining: string; campaign_remaining: string }
  | { type: 'inventory'; campaigns: Campaign[] }
  | { type: 'tray'; state: string }
  | { type: 'ws_status'; items: Record<string, WsStatusItem> }
  | { type: 'login'; status?: string; user_id?: number | null; action?: string; code?: string; url?: string; error?: string }
  | { type: 'notification'; message: string; title: string }
  | { type: 'toast'; message: string; style: string }
  | { type: 'settings_saved' }
  | { type: 'games_update'; games: Record<string, Game> };
