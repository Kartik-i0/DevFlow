import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';


// Load environment variables
dotenv.config();

import healthRouter from './routes/health.routes';
import userRouter from './routes/user.routes';
import boardRouter from './routes/board.routes';
import listRouter from './routes/list.routes';
import cardRouter from './routes/card.routes';
import { authenticateUser } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import { AppError } from './utils/appError';

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server & attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

app.use(express.json());

// Socket.IO Connection & Board Room Handlers
io.on('connection', (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  // Join a Trello Board room
  socket.on('join_board', (boardId: string) => {
    socket.join(`board_${boardId}`);
    console.log(`Socket ${socket.id} joined room: board_${boardId}`);
  });

  // Leave a Trello Board room
  socket.on('leave_board', (boardId: string) => {
    socket.leave(`board_${boardId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Export io so controllers can emit real-time card/list movements!
export { io };

// Root Endpoint
app.get('/', (req: Request, res: Response) => {
  res.json("server is running...");
});

// API Routes
app.use("/health", healthRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/boards", boardRouter);
app.use("/api/v1/lists", listRouter);
app.use("/api/v1/cards", cardRouter);

// 404 Unhandled Route Handler
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

// Start HTTP & Socket Server
server.listen(PORT, () => {
  console.log(`🚀 Server & Socket.IO running on port ${PORT}`);
});
