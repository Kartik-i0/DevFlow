import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { validateCreateList } from '../validators/list.validator';
import { createList, updateListOrder, deleteList } from '../controllers/list.controller';

const listRouter = Router();

listRouter.post('/', authenticateUser, validateBody(validateCreateList), createList);
listRouter.patch('/:id/order', authenticateUser, updateListOrder);
listRouter.delete('/:id', authenticateUser, deleteList);

export default listRouter;
