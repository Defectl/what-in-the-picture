import { Server, Socket } from 'socket.io';
import { 
  getGamePlayers, 
  addPlayerToGame, 
  updatePlayerScore, 
  updatePlayerStatus,
  removePlayerFromGame, 
  setImagesForUser,
  getMainPlayer,
  createGameRound,
  setImageToRound,
  voteImage
} from '../db/database.ts';
import { LobbyUpdate } from '../types.ts';
import { v4 as uuidv4 } from 'uuid';

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

      socket.on('get-start-images', async ({ hash }) => {
        try {
          const players = await getGamePlayers(hash);
          const activePlayers = players.filter((player) => player.role === 'Player' && player.status === 'Active');
          for (const player of activePlayers) {
            await setImagesForUser(3, hash, player.id)
          }
          const mainPlayer = await getMainPlayer(hash)
          const updatedUsers = await getGamePlayers(hash);
          console.log(updatedUsers);
          this.io.to(hash).emit('lobby-update', {
            type: 'start_images',
            players: updatedUsers,
            player: mainPlayer,
            hash
          } as LobbyUpdate);
        } catch (error) {
          console.error('Error set started images:', error);
          socket.emit('error', { message: 'Failed to set started images' });
        }
      });

      socket.on('set-word-round', async ({ hash, mainPlayerId, word }) => {
        try {
          const idRound = uuidv4();

          await createGameRound(idRound, hash, mainPlayerId, word);

          this.io.to(hash).emit('lobby-update', {
            type: 'take-image',
            hash,
            roundData: { id: idRound, mainPlayer: mainPlayerId, word: word}
          } as LobbyUpdate);
        } catch (error) {
          console.error('Error set started images:', error);
          socket.emit('error', { message: 'Failed to set started images' });
        }
      });

      socket.on('set-image-to-round', async ({ hash, roundId, playerId, imageUrl }) => {
        try {
          const updatedRoundData = await setImageToRound(roundId, playerId, imageUrl);
          const players = await getGamePlayers(hash);
          const activePlayers = players.filter((player) => player.role === 'Player' && player.status === 'Active');

          if(updatedRoundData.images?.length === activePlayers.length) {
            this.io.to(hash).emit('lobby-update', {
              type: 'show-all-images',
              hash,
              roundData: updatedRoundData,
              players,
            } as LobbyUpdate);
          } else {
            this.io.to(hash).emit('lobby-update', {
              type: 'take-image',
              hash,
              roundData: updatedRoundData,
              players,
            } as LobbyUpdate);
          }

          
        } catch (error) {
          console.error('Error set started images:', error);
          socket.emit('error', { message: 'Failed to set started images' });
        }
      });

      socket.on('vote-image', async ({ hash, roundId, playerId, imageUrl }) => {
        try {
          const updatedRoundData = await voteImage(roundId, playerId, imageUrl);
          const players = await getGamePlayers(hash);
          const activePlayers = players.filter((player) => player.role === 'Player' && player.status === 'Active' && !player.isMain);

          if(activePlayers.length !== updatedRoundData.votes?.length) {
            this.io.to(hash).emit('lobby-update', {
              type: 'show-all-images',
              hash,
              roundData: updatedRoundData,
              players,
            } as LobbyUpdate);
          } else {
            this.io.to(hash).emit('lobby-update', {
              type: 'show-open-images',
              hash,
              roundData: updatedRoundData,
              players,
            } as LobbyUpdate);
          }

          
        } catch (error) {
          console.error('Error set started images:', error);
          socket.emit('error', { message: 'Failed to set started images' });
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