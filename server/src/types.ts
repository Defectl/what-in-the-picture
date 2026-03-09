export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  score: number;
  status?: PlayerStatus | null;
  socketId?: string;
}

export type PlayerRole = 'Player' | 'Spectator';

export type PlayerStatus = 'Active' | 'Inactive' | 'Waiting';

export interface Game {
  hash: string;
  code: string;
  players: Map<string, Player>;
  createdAt: Date;
}

export interface GameRow {
  hash: string;
  code: string;
  player_id: string;
  player_name: string;
  role: string;
  score: number;
  status: string;
  created_at: string;
  isHost: number
}

export interface CreateGameResponse {
  hash: string;
  code: string;
  player: Player;
}

export interface JoinGameResponse {
  success: boolean;
  hash: string;
  player?: Player;
  error?: string;
}

export type LobbyUpdate = {
  type: 'player_joined' | 'player_left' | 'status_changed';
  player?: Player;
  players: Player[];
  hash: string;
}
