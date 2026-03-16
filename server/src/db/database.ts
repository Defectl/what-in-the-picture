import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { GameRow, PlayerRole, PlayerStatus, Image, ImageRow, Player, RoundRow } from '../types.ts';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

let db: Database | null = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      isMain BOOLEAN DEFAULT false,
      image_ids TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (hash, player_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_games_code ON games(code);
    CREATE INDEX IF NOT EXISTS idx_games_hash ON games(hash);
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT NOT NULL,
      is_used BOOLEAN DEFAULT 0,
      used_in_game_hash TEXT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS rounds (
      id TEXT not NULL,
      hash TEXT not NULL,
      word TEXT not NULL,
      main_player_id TEXT not NULL,
      images TEXT NULL,
      voits TEXT NULL,
      PRIMARY KEY (id)
    );
  `);

  return db;
}

export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export async function addImages(gameHash: string) {
  const db = getDb();

  const stmt = await db.prepare(
    `INSERT INTO images (image_url, used_in_game_hash) 
     VALUES (?, ?)`
  );

  const imagesFolder = path.join(__dirname, '../../images');
  const files = fs.readdirSync(imagesFolder);

  files.forEach((file) => {
    const imageUrl = `/images/${file}`;
    stmt.run(imageUrl, gameHash)
  });
}

export async function createGameInDb(hash: string, code: string, hostName: string, role: PlayerRole) {
  const db = getDb();
  
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

export async function createGameRound(idRound: string, hash: string, mainPlayerId: string, word: string) {
  const db = getDb();

  await db.run(
    `INSERT INTO rounds (id, hash, word, main_player_id) 
     VALUES (?, ?, ?, ?)`,
    [idRound, hash, word, mainPlayerId]
  );
}

export async function setImageToRound(idRound: string, playerId: string, imageUrl: string) {
  const db = getDb();

  const round = await db.all<RoundRow[]>(
    'SELECT * FROM rounds WHERE id = ?',
    [idRound]
  );

  await db.run(
    'UPDATE rounds SET images = ? WHERE id = ?',
    [[round[0].images, `${playerId},${imageUrl}`].join(';'), idRound]
  );

  const currentRound = await db.all<RoundRow[]>(
    'SELECT * FROM rounds WHERE id = ?',
    [idRound]
  );

  const currentImages = currentRound[0].images?.split(';');

  return {
    id: currentRound[0].id,
    mainPlayer: currentRound[0].main_player_id,
    word: currentRound[0].word,
    images: currentImages?.map((image) => {
      const [playerId, imageUrl] = image.split(',');
      return {
        playerId, imageUrl
      }
    })
  }
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
    isHost: row.isHost === 0 ? false : true,
    imageIds: row.image_ids ? row.image_ids.split(';') : undefined,
    isMain: row.isMain === 0 ? false : true
  }));
}

export async function getMainPlayer(hash: string) {
  const db = getDb();
  const rows = await db.all<GameRow[]>(
    'SELECT * FROM games WHERE hash = ? ORDER BY created_at',
    hash
  );

  let currentMainIndex = rows.findIndex(row => row.isMain === 1);

    // 4. Вычисляем следующего по кругу
  const nextMainIndex = (currentMainIndex + 1) % rows.length;
  const nextMainPlayer = rows[nextMainIndex];

  // 5. Сбрасываем флаг is_main у всех и устанавливаем новому
  for (const row of rows) {
    row.isMain = 0;
  }
  nextMainPlayer.isMain = 1;

  // 6. Сохраняем изменения в базе данных (транзакция для атомарности)
  await db.exec('BEGIN TRANSACTION');
  try {
    for (const row of rows) {
      await db.run(
        'UPDATE games SET isMain = ? WHERE hash = ? AND player_id = ?',
        [row.isMain, row.hash, row.player_id]
      );
    }
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }

  // 7. Возвращаем нового главного игрока
  return {
    id: nextMainPlayer.player_id,
    name: nextMainPlayer.player_name,
    role: nextMainPlayer.role as PlayerRole,
    score: nextMainPlayer.score,
    status: nextMainPlayer.status as PlayerStatus,
    isHost: nextMainPlayer.isHost === 0 ? false : true,
    imageIds: nextMainPlayer.image_ids ? nextMainPlayer.image_ids.split(';') : undefined,
    isMain: nextMainPlayer.isMain === 0 ? false : true
  } as Player;
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

export async function setImagesForUser(count: number, gameHash: string, playerId: string) {
  const db = getDb();
  const images = await db.all<ImageRow[]>(
    `SELECT * FROM images WHERE is_used = 0 and used_in_game_hash = ? ORDER BY RANDOM() LIMIT ?`,
     [gameHash, count]
  );
  await db.run(
    'UPDATE games SET image_ids = ? WHERE player_id = ? and hash = ?',
    [images.map((image) => image.image_url).join(';'), playerId, gameHash]
  );

  const imageIds = images.map(img => img.id);
  console.log(imageIds);
  const updateQuery = `UPDATE images SET is_used = 1 WHERE used_in_game_hash = ? and id IN (${imageIds.map(() => '?').join(',')})`;
  await db.run(updateQuery, [gameHash, ...imageIds]);
}