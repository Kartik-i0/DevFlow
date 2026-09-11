import { Response } from 'express';
import prisma from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/appError';
import { AuthRequest } from '../middleware/auth.middleware';

import { io } from '../index';

// POST /api/v1/cards - Create a card in a list
export const createCard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, listId, description, boardId } = req.body;

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

  // ⚡ Broadcast real-time event to teammates viewing the board
  if (boardId) {
    io.to(`board_${boardId}`).emit('card_created', card);
  }

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

  // ⚡ Broadcast real-time card movement to teammates
  if (boardId) {
    io.to(`board_${boardId}`).emit('card_moved', updatedCard);
  }

  res.status(200).json({
    status: 'success',
    data: updatedCard
  });
});

// PATCH /api/v1/cards/:id - Update card details (title, description, dueDate, coverColor)
export const updateCard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, dueDate, coverColor, boardId } = req.body;

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

  let card;
  try {
    card = await prisma.card.update({
      where: { id: id as string },
      data: {
        ...updateData,
        ...(coverColor !== undefined ? { coverColor } : {})
      }
    });
  } catch (err) {
    card = await prisma.card.update({
      where: { id: id as string },
      data: updateData
    });
  }

  const resultCard = { ...card, ...(coverColor !== undefined ? { coverColor } : {}) };

  if (boardId) {
    io.to(`board_${boardId}`).emit('card_updated', resultCard);
  }

  res.status(200).json({
    status: 'success',
    data: resultCard
  });
});

// DELETE /api/v1/cards/:id - Delete card
export const deleteCard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { boardId } = req.query;

  await prisma.card.delete({
    where: { id: id as string }
  });

  if (boardId) {
    io.to(`board_${boardId}`).emit('card_deleted', { id });
  }

  res.status(200).json({
    status: 'success',
    message: 'Card deleted successfully'
  });
});
