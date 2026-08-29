import { Request, Response } from 'express';
import prisma from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/appError';
import { AuthRequest } from '../middleware/auth.middleware';

// POST /api/v1/boards - Create a new Trello Board
export const createBoard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, bgImage, workspaceId } = req.body;

  if (!title || !workspaceId) {
    throw new AppError('Title and workspaceId are required', 400);
  }

  const board = await prisma.board.create({
    data: {
      title,
      bgImage,
      workspaceId
    }
  });

  res.status(201).json({
    status: 'success',
    data: board
  });
});

// GET /api/v1/boards/workspace/:workspaceId - Get all boards in a workspace
export const getWorkspaceBoards = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { workspaceId } = req.params;

  const boards = await prisma.board.findMany({
    where: { workspaceId: workspaceId as string }
  });

  res.status(200).json({
    status: 'success',
    count: boards.length,
    data: boards
  });
});

// GET /api/v1/boards/:id - Get full Board detail with Lists & Cards (For Trello Board View)
export const getBoardById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const board = await prisma.board.findUnique({
    where: { id: id as string },
    include: {
      lists: {
        orderBy: { order: 'asc' }, // Ordered columns
        include: {
          cards: {
            orderBy: { order: 'asc' }, // Ordered cards inside columns
            include: {
              labels: { include: { label: true } },
              members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } }
            }
          }
        }
      },
      labels: true
    }
  });

  if (!board) {
    throw new AppError('Board not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: board
  });
});
