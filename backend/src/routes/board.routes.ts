import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import {
  createBoard,
  getWorkspaceBoards,
  getBoardById
} from '../controllers/board.controller';

const router = Router();

router.post('/', authenticateUser, createBoard);
router.get('/workspace/:workspaceId', authenticateUser, getWorkspaceBoards);
router.get('/:id', authenticateUser, getBoardById);

export default router;
