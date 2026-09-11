import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import {
  getAllBoards,
  createBoard,
  getWorkspaceBoards,
  getBoardById,
  deleteBoard,
  addBoardMember,
  getBoardMembers,
  removeBoardMember
} from '../controllers/board.controller';

const router = Router();

router.get('/', authenticateUser, getAllBoards);
router.post('/', authenticateUser, createBoard);
router.get('/workspace/:workspaceId', authenticateUser, getWorkspaceBoards);
router.get('/:id', authenticateUser, getBoardById);
router.delete('/:id', authenticateUser, deleteBoard);

// Board Member routes
router.get('/:id/members', authenticateUser, getBoardMembers);
router.post('/:id/members', authenticateUser, addBoardMember);
router.delete('/:id/members/:userId', authenticateUser, removeBoardMember);

export default router;
