import { Router } from 'express';
import {
  getAllWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceBoards,
  addWorkspaceMember,
  removeWorkspaceMember
} from '../controllers/workspace.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// Protect all workspace routes with authentication
router.use(authenticateUser);

router.route('/')
  .get(getAllWorkspaces)
  .post(createWorkspace);

router.route('/:id')
  .get(getWorkspaceById)
  .patch(updateWorkspace)
  .delete(deleteWorkspace);

router.route('/:id/boards')
  .get(getWorkspaceBoards);

router.route('/:id/members')
  .post(addWorkspaceMember);

router.route('/:id/members/:userId')
  .delete(removeWorkspaceMember);

export default router;
