import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import healthRouter from './routes/health.routes';
import userRouter from './routes/user.routes';
import projectRouter from './routes/project.routes';
import taskRouter from './controllers/task.route';
import { authenticateUser } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import { AppError } from './utils/appError';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Root Endpoint
app.get('/', (req: Request, res: Response) => {
  res.json("server is running...");
  console.log(".........working");
});

// API Routes
app.use("/health", healthRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/projects", authenticateUser, projectRouter);
app.use("/api/v1/tasks", authenticateUser, taskRouter);

// 404 Unhandled Route Handler (Must be after all routes)
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler (Must be registered LAST before app.listen)
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});
