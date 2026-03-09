import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { initializeDatabase, createGameInDb, getGameByCode, getGamePlayers, addPlayerToGame } from './db/database.ts';
import { SocketManager } from './socket/socketManager.ts';
import { CreateGameResponse, JoinGameResponse } from './types.ts';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Initialize socket manager
new SocketManager(io);

// Generate unique game code
function generateGameCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// API Routes
app.post('/api/games', async (req, res) => {
  try {
    const { hostName, role } = req.body;
    
    if (!hostName) {
      return res.status(400).json({ error: 'Host name is required' });
    }

    const hash = uuidv4();
    const code = generateGameCode();
    
    const { hostPlayer } = await createGameInDb(hash, code, hostName, role);

    console.log(hostPlayer)
    
    const response: CreateGameResponse = {
      hash,
      code,
      player: hostPlayer
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

app.post('/api/games/join', async (req, res) => {
  try {
    const { code, playerName, role } = req.body;
    
    if (!code || !playerName) {
      return res.status(400).json({ error: 'Code and player name are required' });
    }

    const game = await getGameByCode(code);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const player = await addPlayerToGame(game.hash, playerName, role)
    
    const response: JoinGameResponse = {
      success: true,
      hash: game.hash,
      player
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ error: 'Failed to join game' });
  }
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});