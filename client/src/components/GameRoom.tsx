import React, { useEffect, useState } from 'react';
import { Player, PlayerStatus } from '../types';
import { useSocket } from '../hooks/useSocket';
import { Button, Gapped } from '@skbkontur/react-ui';
import './styles.module.css';
import { StartImages } from './StartImages';

interface GameRoomProps {
  hash: string;
  code: string;
  player: Player;
  initialPlayers?: Player[];
}

export function GameRoom({ hash, code, player, initialPlayers = [] }: GameRoomProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(player);
  const { 
    lobbyState, 
    joinGameRoom, 
    updateScore, 
    updateStatus, 
    isConnected, 
    socket, 
    getStartImages,
    setWordRound,
    setImageToRound,
    voteImage
  } = useSocket(hash);

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
      currPlayer && setCurrentPlayer(currPlayer);
    }
  }, [lobbyState, isConnectedToSocket]);

  if (lobbyState?.type === 'start_images') {
    return <StartImages hash={hash} currPlayer={currentPlayer} players={players} setWordRound={setWordRound} />;
  }

  if(lobbyState?.type === 'take-image') {
    const mainPlayer = players.find((player) => player.id === lobbyState.roundData?.mainPlayer)
    return (
      <Gapped gap={32} verticalAlign='top'>
        <Gapped gap={8} vertical>
          {players.map((player) => 
            <span>
              {player.name} {lobbyState.roundData?.images?.map((image) => image.playerId).includes(player!.id) ? 'выбрал' : 'не выбрал'} картинку
            </span>
          )}
        </Gapped>
        <Gapped style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '12px'}} gap={24} vertical>
          <Gapped gap={12} vertical>
            <span>Игрок {mainPlayer?.name} выбрал слово {lobbyState.roundData?.word}</span>
            <span>Выбери картинку, которая наиболее подходит под это слово</span>
          </Gapped>
          <div style={{ margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '12px'}}>
              {currentPlayer?.imageIds?.map((image) => (<div onClick={() => setImageToRound(hash, lobbyState.roundData!.id, currentPlayer.id, image)}>
                <img style={{ maxHeight: '400px'}} key={image} src={`http://localhost:3001${image}`}/>
              </div>))}
          </div>
        </Gapped>
      </Gapped>
    );
  }

  if(lobbyState?.type === 'show-all-images') {
    const isMainPlayer = currentPlayer.id === lobbyState.roundData?.mainPlayer;
    return (
      <Gapped gap={32} verticalAlign='top'>
        <Gapped gap={8} vertical>
          {players.map((player) => 
            <span>
              {player.name} {lobbyState.roundData?.votes?.map((vote) => vote.playerId).includes(player!.id) ? 'проголосовал' : 'не проголосовал'}
            </span>
          )}
        </Gapped>
      <Gapped style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '12px'}} gap={24} vertical>
          <Gapped gap={12} vertical>
            {isMainPlayer ? 
            <span>Ты ведущий в этом раунде. Поэтому просто посмотри, какие картинки выложили другие игроки</span> :
            <span>Выбери картинку, которая наиболее подходит под это слово. Попробуй найти картинку ведущего</span>
            }
            
          </Gapped>
          <div style={{ margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '12px'}}>
              {lobbyState.roundData?.images?.map((image) => (<div onClick={() => {
                !isMainPlayer && voteImage(hash, lobbyState.roundData!.id, currentPlayer.id, image.imageUrl)
              }}>
                <img style={{ maxHeight: '400px'}} key={image.imageUrl} src={`http://localhost:3001${image.imageUrl}`}/>
              </div>))}
          </div>
        </Gapped>
      </Gapped>
    )
  }

  if(lobbyState?.type === 'show-open-images') {
    return (
      <div style={{ margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '12px'}}>
              {lobbyState.roundData?.images?.map((image) => (<div>
                <span>Карточка игрока: {players.find((player) => player.id === image.playerId)?.name}</span>
                <span>Проголосовали:</span>
                {
                  lobbyState.roundData?.votes?.filter((vote) => vote.imageUrl === image.imageUrl).map((voteImage) => <span>
                    {players.find((player) => player.id === voteImage.playerId)?.name}
                  </span>)
                }
                <img style={{ maxHeight: '400px'}} key={image.imageUrl} src={`http://localhost:3001${image.imageUrl}`}/>
              </div>))}
          </div>
    )
  }

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
            onClick={() => getStartImages(hash)}
           >
            Начать игру
          </Button>
           }
      </div>
    </div>
  );
}