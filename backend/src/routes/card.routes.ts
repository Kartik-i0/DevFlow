import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { validateCreateCard } from '../validators/card.validator';
import { createCard, moveCard, updateCard, deleteCard } from '../controllers/card.controller';

const cardRouter = Router();

cardRouter.post('/', authenticateUser, validateBody(validateCreateCard), createCard);
cardRouter.patch('/:id/move', authenticateUser, moveCard);
cardRouter.patch('/:id', authenticateUser, updateCard);
cardRouter.delete('/:id', authenticateUser, deleteCard);

export default cardRouter;
