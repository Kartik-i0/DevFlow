import { Response } from 'express';
import prisma from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/appError';
import { AuthRequest } from '../middleware/auth.middleware';

import { io } from '../index';

// POST /api/v1/cards - Create a card in a list
export const createCard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, listId, description } = req.body;

  if (!title || !listId) {
    throw new AppError('Title and listId are required', 400);
  }

  // Find highest card order in list
  const lastCard = await prisma.card.findFirst({
    where: { listId: listId as string },
    orderBy: { order: 'desc' }
  });

  const newOrder = lastCard ? lastCard.order + 1000.0 : 1000.0;

  const card = await prisma.card.create({
    data: {
      title,
      description,
      listId,
      order: newOrder
    }
  });

  res.status(201).json({
    status: 'success',
    data: card
  });
});

export const moveCard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { listId, order, boardId } = req.body;

  // 1. Update position in MySQL
  const updatedCard = await prisma.card.update({
    where: { id: id as string },
    data: {
      ...(listId && { listId }),
      ...(order !== undefined && { order: parseFloat(order) })
    }
  });

  // 2. Broadcast to all teammates viewing boardId
  if (boardId) {
    io.to(`board_${boardId}`).emit('card_moved', updatedCard);
  }

  res.status(200).json({
    status: 'success',
    data: updatedCard
  });
});
