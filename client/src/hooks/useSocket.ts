import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { LobbyUpdate, Player, PlayerStatus } from '../types';

const SOCKET_URL = 'http://localhost:3001';

export function useSocket(gameHash?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lobbyState, setLobbyState] = useState<LobbyUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('lobby-update', (update: LobbyUpdate) => {
      console.log('Lobby update received:', update);
      setLobbyState(update);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const joinGameRoom = (hash: string, player: any) => {
    if (socket && isConnected) {
      socket.emit('join-game-room', { hash, player });
    }
  };

  const updateScore = (hash: string, playerId: string, score: number) => {
    if (socket && isConnected) {
      socket.emit('update-score', { hash, playerId, score });
    }
  };

  const updateStatus = (hash: string, playerId: string, status: PlayerStatus) => {
    if (socket && isConnected) {
      socket.emit('update-status', { hash, playerId, status });
    }
  };

  const getStartImages = (hash: string) => {
    if (socket && isConnected) {
      socket.emit('get-start-images', { hash });
    }
  };

  const setWordRound = (hash: string, word: string, mainPlayerId?: string) => {
    if (socket && isConnected && mainPlayerId) {
      socket.emit('set-word-round', { hash, mainPlayerId, word });
    }
  };

  const setImageToRound = (hash: string, roundId: string, playerId: string, imageUrl: string) => {
    if (socket && isConnected) {
      socket.emit('set-image-to-round', { hash, roundId, playerId, imageUrl });
    }
  };

  const voteImage = (hash: string, roundId: string, playerId: string, imageUrl: string) => {
    if (socket && isConnected) {
      socket.emit('vote-image', { hash, roundId, playerId, imageUrl });
    }
  };

  return {
    socket,
    isConnected,
    lobbyState,
    joinGameRoom,
    updateScore,
    updateStatus,
    getStartImages,
    setWordRound,
    setImageToRound,
    voteImage
  };
}