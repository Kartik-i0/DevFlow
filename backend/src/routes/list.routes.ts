import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { createList, updateListOrder } from '../controllers/list.controller';

const listRouter = Router();

listRouter.post('/', authenticateUser, createList);
listRouter.patch('/:id/order', authenticateUser, updateListOrder);

export default listRouter;
