import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { createList, updateListOrder, deleteList } from '../controllers/list.controller';

const listRouter = Router();

listRouter.post('/', authenticateUser, createList);
listRouter.patch('/:id/order', authenticateUser, updateListOrder);
listRouter.delete('/:id', authenticateUser, deleteList);

export default listRouter;
