import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { createCard, moveCard, updateCard, deleteCard } from '../controllers/card.controller';

const cardRouter = Router();

cardRouter.post('/', authenticateUser, createCard);
cardRouter.patch('/:id/move', authenticateUser, moveCard);
cardRouter.patch('/:id', authenticateUser, updateCard);
cardRouter.delete('/:id', authenticateUser, deleteCard);

export default cardRouter;
