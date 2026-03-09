import React, { useState } from 'react';
import { Player, PlayerRole } from '../types';

interface JoinGameProps {
  onJoinGame: (hash: string, code: string, player: Player) => void;
}

export function JoinGame({ onJoinGame }: JoinGameProps) {
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [role, setRole] = useState<PlayerRole>('Player');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gameCode.trim() || !playerName.trim()) {
      setError('Please enter game code and your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/games/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: gameCode.trim().toUpperCase(), 
          playerName: playerName.trim(),
          role 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join game');
      }

      const data = await response.json();
      onJoinGame(data.hash, gameCode, data.player);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="join-game">
      <h2>Вступить в игру</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="gameCode">Game Code:</label>
          <input
            type="text"
            id="gameCode"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
            placeholder="Введи 4-значный код"
            maxLength={6}
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="playerName">Твой никнейм</label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Введи свой никнейм"
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label>Твоя роль в игре</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="player"
                checked={role === 'Player'}
                onChange={(e) => setRole('Player')}
              />
              Игрок
            </label>
            <label>
              <input
                type="radio"
                value="spectator"
                checked={role === 'Spectator'}
                onChange={(e) => setRole('Spectator')}
              />
              Наблюдатель
            </label>
          </div>
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Вступаем...' : 'Вступить в игру'}
        </button>
      </form>
    </div>
  );
}