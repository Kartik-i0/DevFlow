import { Response } from 'express';
import prisma from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/appError';
import { AuthRequest } from '../middleware/auth.middleware';

// POST /api/v1/lists - Create a new column in a Board
export const createList = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, boardId } = req.body;

  if (!title || !boardId) {
    throw new AppError('Title and boardId are required', 400);
  }

  // Find the highest current order in the board to place the new list at the end
  const lastList = await prisma.list.findFirst({
    where: { boardId: boardId as string },
    orderBy: { order: 'desc' }
  });

  const newOrder = lastList ? lastList.order + 1000.0 : 1000.0;

  const list = await prisma.list.create({
    data: {
      title,
      boardId,
      order: newOrder
    }
  });

  res.status(201).json({
    status: 'success',
    data: list
  });
});

// PATCH /api/v1/lists/:id/order - Reorder column
export const updateListOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { order } = req.body;

  const list = await prisma.list.update({
    where: { id: id as string },
    data: { order: parseFloat(order) }
  });

  res.status(200).json({
    status: 'success',
    data: list
  });
});
