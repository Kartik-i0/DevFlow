import { Response } from 'express';
import prisma from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/appError';
import { AuthRequest } from '../middleware/auth.middleware';
import {io} from "../index"


// POST /api/v1/lists - Create a new column in a Board
export const createList = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, boardId } = req.body;

  if (!title || !boardId) {
    throw new AppError('Title and boardId are required', 400);
  }

  // Resolve targetBoardId to ensure board exists in MySQL
  let targetBoardId = boardId as string;
  const existingBoard = await prisma.board.findUnique({
    where: { id: targetBoardId }
  });

  if (!existingBoard) {
    // If board does not exist, attach to first board or create one
    const firstBoard = await prisma.board.findFirst();
    if (firstBoard) {
      targetBoardId = firstBoard.id;
    } else {
      let ws = await prisma.workspace.findFirst();
      if (!ws) {
        ws = await prisma.workspace.create({
          data: { name: 'DevFlow Workspace' }
        });
      }
      const newBoard = await prisma.board.create({
        data: {
          id: targetBoardId,
          title: 'DevFlow Board',
          workspaceId: ws.id
        }
      });
      targetBoardId = newBoard.id;
    }
  }

  // Find highest current order in the board to place new list at the end
  const lastList = await prisma.list.findFirst({
    where: { boardId: targetBoardId },
    orderBy: { order: 'desc' }
  });

  const newOrder = lastList ? lastList.order + 1000.0 : 1000.0;

  const list = await prisma.list.create({
    data: {
      title: title.trim(),
      boardId: targetBoardId,
      order: newOrder
    }
  });

  const newListWithCards = { ...list, cards: [] };

  // Broadcast real-time event to teammates viewing the board
  if (boardId) {
    io.to(`board_${boardId}`).emit('list_created', newListWithCards);
  }
  if (targetBoardId !== boardId) {
    io.to(`board_${targetBoardId}`).emit('list_created', newListWithCards);
  }

  res.status(201).json({
    status: 'success',
    data: newListWithCards
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

// DELETE /api/v1/lists/:id - Delete list
export const deleteList = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const list = await prisma.list.findUnique({
    where: { id: id as string }
  });

  if (!list) {
    throw new AppError('List not found', 404);
  }

  await prisma.list.delete({
    where: { id: id as string }
  });

  io.to(`board_${list.boardId}`).emit('list_deleted', { id });

  res.status(200).json({
    status: 'success',
    message: 'List deleted successfully'
  });
});
