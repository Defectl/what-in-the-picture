import React, { useState } from 'react';
import { Player, PlayerRole } from '../types';

interface CreateGameProps {
  onCreateGame: (hash: string, code: string, player: Player) => void;
}

export function CreateGame({ onCreateGame }: CreateGameProps) {
  const [hostName, setHostName] = useState('');
  const [role, setRole] = useState<PlayerRole>('Player');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hostName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hostName: hostName.trim(), role }),
      });

      if (!response.ok) {
        throw new Error('Failed to create game');
      }

      const data = await response.json();
      onCreateGame(data.hash, data.code, data.player);
    } catch (err) {
      setError('Failed to create game. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-game">
      <h2>Создать новую игру</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="hostName">Твой никнейм</label>
          <input
            type="text"
            id="hostName"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
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
          {isLoading ? 'Создаем игру...' : 'Создать игру'}
        </button>
      </form>
    </div>
  );
}