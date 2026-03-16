export type Player = {
  id: string;
  name: string;
  role: PlayerRole;
  score: number;
  status?: PlayerStatus;
  isHost?: boolean;
  isMain?: boolean;
  imageIds?: string[];
}

export type PlayerRole = 'Player' | 'Spectator';

export type PlayerStatus = 'Active' | 'Inactive' | 'Waiting';

export type Game = {
  hash: string;
  code: string;
  players: Player[];
}

export interface ImageInRound {
  imageUrl: string;
  playerId: string;
}

export interface Round {
  id: string,
  word: string,
  mainPlayer: string,
  images?: ImageInRound[]
}

export type LobbyUpdate = {
  type: 'player_joined' | 'player_left' | 'status_changed' | 'start_images' | 'take-image';
  player?: Player;
  players: Player[];
  hash: string;
  roundData?: Round
}

export type CreateGameResponse = {
  hash: string;
  code: string;
}

export type JoinGameResponse = {
  success: boolean;
  hash: string;
  players: Player[];
  error?: string;
}

export type GameStateType = 'MainMenu' | 'CreatingRoom' | 'JoiningRoom' | 'Playing';

export type GameState = {
  type: GameStateType;
  roomState?: RoomState;
}

export type RoomState = {
  hash: string; 
  code: string; 
  currentPlayer: Player; 
  players: Player[]
}