import { Server, Socket } from 'socket.io';
import { 
  getGamePlayers, 
  addPlayerToGame, 
  updatePlayerScore, 
  updatePlayerStatus,
  removePlayerFromGame 
} from '../db/database.ts';
import { LobbyUpdate } from '../types.ts';

interface SocketData {
  playerId?: string;
  playerName?: string;
  gameHash?: string;
}

export class SocketManager {
  private io: Server;
  private connectedPlayers: Map<string, SocketData> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log('New client connected:', socket.id);

      socket.on('join-game-room', async ({ hash, player }) => {
        try {
          socket.join(hash);
          
          this.connectedPlayers.set(socket.id, {
            playerId: player.id,
            playerName: player.name,
            gameHash: hash
          });

          const players = await getGamePlayers(hash);
          this.io.to(hash).emit('lobby-update', {
            type: 'player_joined',
            player,
            players,
            hash
          } as LobbyUpdate);

          console.log(`Player ${player.name} joined game ${hash}`);
        } catch (error) {
          console.error('Error joining game room:', error);
          socket.emit('error', { message: 'Failed to join game room' });
        }
      });

      socket.on('update-status', async ({ hash, playerId, status }) => {
        try {
          await updatePlayerStatus(hash, playerId, status);
          
          const players = await getGamePlayers(hash);
          const updatedPlayer = players.find(p => p.id === playerId);
          
          this.io.to(hash).emit('lobby-update', {
            type: 'status_changed',
            player: updatedPlayer,
            players,
            hash
          } as LobbyUpdate);
        } catch (error) {
          console.error('Error updating status:', error);
          socket.emit('error', { message: 'Failed to update status' });
        }
      });

      socket.on('disconnect', async () => {
        const socketData = this.connectedPlayers.get(socket.id);
        
        if (socketData?.gameHash && socketData.playerId) {
          try {
            await removePlayerFromGame(socketData.gameHash, socketData.playerId);
            
            const players = await getGamePlayers(socketData.gameHash);
            
            this.io.to(socketData.gameHash).emit('lobby-update', {
              type: 'player_left',
              players,
              hash: socketData.gameHash
            } as LobbyUpdate);

            console.log(`Player ${socketData.playerName} left game ${socketData.gameHash}`);
          } catch (error) {
            console.error('Error handling disconnect:', error);
          }
        }

        this.connectedPlayers.delete(socket.id);
        console.log('Client disconnected:', socket.id);
      });
    });
  }
}