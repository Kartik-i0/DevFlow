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
import { validateBody } from '../middleware/validate.middleware';
import {
  validateCreateWorkspace,
  validateUpdateWorkspace,
  validateWorkspaceMember
} from '../validators/workspace.validator';

const router = Router();

// Protect all workspace routes with authentication
router.use(authenticateUser);

router.route('/')
  .get(getAllWorkspaces)
  .post(validateBody(validateCreateWorkspace), createWorkspace);

router.route('/:id')
  .get(getWorkspaceById)
  .patch(validateBody(validateUpdateWorkspace), updateWorkspace)
  .delete(deleteWorkspace);

router.route('/:id/boards')
  .get(getWorkspaceBoards);

router.route('/:id/members')
  .post(validateBody(validateWorkspaceMember), addWorkspaceMember);

router.route('/:id/members/:userId')
  .delete(removeWorkspaceMember);

export default router;
