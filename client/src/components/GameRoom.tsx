import React, { useEffect, useState } from 'react';
import { Player, PlayerStatus } from '../types';
import { useSocket } from '../hooks/useSocket';
import { Button } from '@skbkontur/react-ui';

interface GameRoomProps {
  hash: string;
  code: string;
  player: Player;
  initialPlayers?: Player[];
}

export function GameRoom({ hash, code, player, initialPlayers = [] }: GameRoomProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(player);
  const { lobbyState, joinGameRoom, updateScore, updateStatus, isConnected, socket } = useSocket(hash);

  const isConnectedToSocket = socket && isConnected;

  useEffect(() => {
    if (isConnectedToSocket && hash && player) {
      joinGameRoom(hash, player);
    }
  }, [hash, player, isConnectedToSocket]);

  useEffect(() => {
    if (isConnectedToSocket && lobbyState?.players) {
      setPlayers(lobbyState.players);
      const currPlayer = lobbyState.players.find((playerFromDb) => playerFromDb.id === player.id);
      console.log(currPlayer)
      currPlayer && setCurrentPlayer(currPlayer);
    }
  }, [lobbyState, isConnectedToSocket]);

  return (
    <div className="game-room">
      <div className="game-header">
        <h2>Game Room</h2>
        <div className="game-info">
          <p>Game Code: <strong>{code}</strong></p>
          <p>Share this code with friends to join!</p>
        </div>
      </div>

      <div className="players-section">
        <h3>Players ({players.length})</h3>
        <div className="players-list">
          {players.map((player) => (
            <div key={player.id} className={`player-card ${player.role}`}>
              <div className="player-info">
                <span className="player-name">
                  {player.name} {player.id === currentPlayer.id && '(You)'}
                </span>
                <span className="player-role">{player.role}</span>
                <span className={`player-status ${player.status}`}>
                  {player.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        {
          currentPlayer.status === 'Waiting' && 
          <Button
            disabled={players.filter((player) => player.status === 'Active').length >= 5}
            onClick={() => updateStatus(hash, currentPlayer.id, 'Active')}
          >
            Готов
          </Button>
        }
        {currentPlayer.isHost && 
           <Button
            disabled={!(players.length > 1 && 
              players.filter((player) => player.status === 'Active').length === players.filter((player) => player.role === 'Player').length)
            }
           >
            Начать игру
          </Button>
           }
      </div>
    </div>
  );
}