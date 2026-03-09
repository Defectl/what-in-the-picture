import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { GameRow, PlayerRole, PlayerStatus } from '../types.ts';

let db: Database | null = null;

export async function initializeDatabase() {
  db = await open({
    filename: './game.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      hash TEXT NOT NULL,
      code TEXT NOT NULL,
      player_id TEXT NOT NULL,
      player_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Player', 'Spectator')),
      score INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('Active', 'Inactive', 'Waiting')),
      isHost BOOLEAN DEFAULT false,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (hash, player_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_games_code ON games(code);
    CREATE INDEX IF NOT EXISTS idx_games_hash ON games(hash);
  `);

  return db;
}

export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export async function createGameInDb(hash: string, code: string, hostName: string, role: PlayerRole) {
  const db = getDb();

  console.log(role);
  
  const hostPlayer = {
    id: `host-${Date.now()}`,
    name: hostName,
    role,
    score: 0,
    status: role === 'Player' ? 'Active' as PlayerStatus : null,
    isHost: true
  };

  await db.run(
    `INSERT INTO games (hash, code, player_id, player_name, role, score, status, isHost) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [hash, code, hostPlayer.id, hostPlayer.name, hostPlayer.role, hostPlayer.score, hostPlayer.status, hostPlayer.isHost]
  );

  return { hostPlayer };
}

export async function addPlayerToGame(hash: string, playerName: string, role: PlayerRole) {
  const db = getDb();


  const player = {
    id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: playerName,
    role,
    score: 0,
    status: role === 'Player' ? 'Waiting' as PlayerStatus : null,
  }
  
  await db.run(
    `INSERT INTO games (hash, code, player_id, player_name, role, score, status) 
     SELECT ?, code, ?, ?, ?, ?, ? FROM games WHERE hash = ? LIMIT 1`,
    [hash, player.id, player.name, player.role, player.score, player.status, hash]
  );

  return player;
}

export async function getGamePlayers(hash: string) {
  const db = getDb();
  const rows = await db.all<GameRow[]>(
    'SELECT * FROM games WHERE hash = ? ORDER BY created_at',
    hash
  );
  
  return rows.map(row => ({
    id: row.player_id,
    name: row.player_name,
    role: row.role as PlayerRole,
    score: row.score,
    status: row.status as PlayerStatus,
    isHost: row.isHost === 0 ? false : true
  }));
}

export async function getGameByCode(code: string) {
  const db = getDb();
  return db.get<{ hash: string }>(
    'SELECT DISTINCT hash FROM games WHERE code = ?',
    code
  );
}

export async function updatePlayerScore(hash: string, playerId: string, score: number) {
  const db = getDb();
  await db.run(
    'UPDATE games SET score = ? WHERE hash = ? AND player_id = ?',
    [score, hash, playerId]
  );
}

export async function updatePlayerStatus(hash: string, playerId: string, status: PlayerStatus) {
  const db = getDb();
  await db.run(
    'UPDATE games SET status = ? WHERE hash = ? AND player_id = ?',
    [status, hash, playerId]
  );
}

export async function removePlayerFromGame(hash: string, playerId: string) {
  const db = getDb();
  await db.run(
    'DELETE FROM games WHERE hash = ? AND player_id = ?',
    [hash, playerId]
  );
}