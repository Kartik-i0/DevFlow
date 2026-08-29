import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { createCard, moveCard } from '../controllers/card.controller';

const cardRouter = Router();

cardRouter.post('/', authenticateUser, createCard);
cardRouter.patch('/:id/move', authenticateUser, moveCard);

export default cardRouter;
