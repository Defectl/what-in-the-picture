import React, { useState } from 'react';
import { CreateGame } from './components/CreateGame';
import { JoinGame } from './components/JoinGame';
import { GameRoom } from './components/GameRoom';
import { Player, PlayerRole } from './types';
import './App.css';

type GameState = 
  | { type: 'menu' }
  | { type: 'creating' }
  | { type: 'joining' }
  | { type: 'playing'; hash: string; code: string; currentPlayer: Player; players?: Player[] };

function App() {
  const [gameState, setGameState] = useState<GameState>({ type: 'menu' });

  const handleCreateGame = (hash: string, code: string, player: Player) => {    
    setGameState({
      type: 'playing',
      hash,
      code,
      currentPlayer: player,
      players: [player]
    });
  };

  const handleJoinGame = (hash: string, code: string, player: Player) => {
    setGameState({
      type: 'playing',
      hash,
      code,
      currentPlayer: player
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Что ты видишь на картинке</h1>
      </header>

      <main className="app-main">
        {gameState.type === 'menu' && (
          <div className="menu">
            <button onClick={() => setGameState({ type: 'creating' })}>
              Создать игру
            </button>
            <button onClick={() => setGameState({ type: 'joining' })}>
              Вступить в игру
            </button>
          </div>
        )}

        {gameState.type === 'creating' && (
          <CreateGame onCreateGame={handleCreateGame} />
        )}

        {gameState.type === 'joining' && (
          <JoinGame onJoinGame={handleJoinGame} />
        )}

        {gameState.type === 'playing' && (
          <GameRoom
            hash={gameState.hash}
            code={gameState.code}
            player={gameState.currentPlayer}
            initialPlayers={gameState.players}
          />
        )}
      </main>

      {gameState.type !== 'menu' && (
        <button 
          className="back-button"
          onClick={() => setGameState({ type: 'menu' })}
        >
          ← На стартовое меню
        </button>
      )}
    </div>
  );
}

export default App;