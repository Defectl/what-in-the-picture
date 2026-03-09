export type Player = {
  id: string;
  name: string;
  role: PlayerRole;
  score: number;
  status?: PlayerStatus;
  isHost?: boolean;
}

export type PlayerRole = 'Player' | 'Spectator';

export type PlayerStatus = 'Active' | 'Inactive' | 'Waiting';

export type Game = {
  hash: string;
  code: string;
  players: Player[];
}

export type LobbyUpdate = {
  type: 'player_joined' | 'player_left' | 'status_changed';
  player?: Player;
  players: Player[];
  hash: string;
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