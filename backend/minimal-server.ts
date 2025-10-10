import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

// Test database connection
import './src/database';

// Test Socket.IO directly
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const server = createServer(app);

const PORT = 12003;

// Basic middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Minimal server is running' });
});

// Initialize Socket.IO directly
const io = new SocketIOServer(server, {
  cors: {
    origin: ["http://localhost:12000", "https://work-1-veuhqyphpzgedabx.prod-runtime.all-hands.dev"],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

console.log('Socket.IO initialized');

// Start server
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
});

export { app, server };