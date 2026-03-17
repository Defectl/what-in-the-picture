export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  score: number;
  status?: PlayerStatus | null;
  socketId?: string;
  imageIds?: string[];
  isMain?: boolean;
}

export type PlayerRole = 'Player' | 'Spectator';

export type PlayerStatus = 'Active' | 'Inactive' | 'Waiting';

export interface Game {
  hash: string;
  code: string;
  players: Map<string, Player>;
  createdAt: Date;
}

export interface Image {
  id: number;
  url: string;
  isUsed: boolean;
  usedInGameHash: string;
}

export interface ImageRow {
  id: number;
  image_url: string;
  is_used: boolean;
  used_in_game_hash: string;
}

export interface RoundRow {
  id: string;
  hash: string;
  word: string;
  main_player_id: string;
  images: string | null;
  votes: string | null;
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
  isHost: number;
  isMain: number;
  image_ids: string;
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

export interface ImageInRound {
  imageUrl: string;
  playerId: string;
}

export interface Round {
  id: string,
  word: string,
  mainPlayer: string,
  images?: ImageInRound[] | null
}

export type LobbyUpdate = {
  type: 'player_joined' | 'player_left' | 'status_changed' | 'start_images' | 'take-image' | 'show-all-images' | 'vote-image' | 'show-open-images';
  player?: Player;
  players: Player[];
  hash: string;
  roundData?: Round
}
