import { Request, Response } from 'express';
import prisma from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/appError';
import { AuthRequest } from '../middleware/auth.middleware';
import { io } from '../index';

// GET /api/v1/boards - Get all boards (optionally filtered by workspaceId)
export const getAllBoards = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { workspaceId } = req.query;

  const where: any = {};
  if (workspaceId && typeof workspaceId === 'string') {
    where.workspaceId = workspaceId;
  }

  const boards = await prisma.board.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      lists: {
        include: {
          cards: true
        }
      }
    }
  });

  res.status(200).json({
    status: 'success',
    count: boards.length,
    data: boards
  });
});

// POST /api/v1/boards - Create a new Trello Board
export const createBoard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, bgImage, workspaceId } = req.body;

  if (!title) {
    throw new AppError('Board title is required', 400);
  }

  // Resolve or validate workspaceId
  let validWorkspaceId = workspaceId;
  if (validWorkspaceId) {
    const existingWs = await prisma.workspace.findUnique({ where: { id: validWorkspaceId } });
    if (!existingWs) {
      validWorkspaceId = null;
    }
  }

  if (!validWorkspaceId) {
    // Find first existing workspace or create a default one
    let ws = await prisma.workspace.findFirst();
    if (!ws) {
      ws = await prisma.workspace.create({
        data: {
          name: 'DevFlow Workspace',
          description: 'Primary Team Workspace'
        }
      });
    }
    validWorkspaceId = ws.id;
  }

  // Ensure current user is a member of the workspace
  if (req.user?.userId) {
    const existingMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId: validWorkspaceId, userId: req.user.userId }
    });
    if (!existingMember) {
      await prisma.workspaceMember.create({
        data: {
          workspaceId: validWorkspaceId,
          userId: req.user.userId,
          role: 'ADMIN'
        }
      });
    }
  }

  // Create Board
  const board = await prisma.board.create({
    data: {
      title: title.trim(),
      bgImage: bgImage || 'from-indigo-600 to-blue-500',
      workspaceId: validWorkspaceId
    }
  });

  // Create standard starter Trello columns so the new board is immediately ready to use!
  await prisma.list.createMany({
    data: [
      { title: 'To Do', boardId: board.id, order: 1000.0 },
      { title: 'In Progress', boardId: board.id, order: 2000.0 },
      { title: 'Done', boardId: board.id, order: 3000.0 },
    ]
  });

  const fullBoard = await prisma.board.findUnique({
    where: { id: board.id },
    include: {
      lists: {
        orderBy: { order: 'asc' },
        include: { cards: true }
      }
    }
  });

  res.status(201).json({
    status: 'success',
    data: fullBoard || board
  });
});

// GET /api/v1/boards/workspace/:workspaceId - Get all boards in a workspace
export const getWorkspaceBoards = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { workspaceId } = req.params;

  const boards = await prisma.board.findMany({
    where: { workspaceId: workspaceId as string },
    orderBy: { createdAt: 'desc' },
    include: {
      lists: {
        include: {
          cards: true
        }
      }
    }
  });

  res.status(200).json({
    status: 'success',
    count: boards.length,
    data: boards
  });
});

// GET /api/v1/boards/:id - Get full Board detail with Lists & Cards and Members
export const getBoardById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const board = await prisma.board.findUnique({
    where: { id: id as string },
    include: {
      lists: {
        orderBy: { order: 'asc' },
        include: {
          cards: {
            orderBy: { order: 'asc' },
            include: {
              labels: { include: { label: true } },
              members: { include: { user: { select: { id: true, name: true, avatarUrl: true, email: true } } } }
            }
          }
        }
      },
      labels: true,
      workspace: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true }
              }
            }
          }
        }
      }
    }
  });

  if (!board) {
    throw new AppError('Board not found', 404);
  }

  // Flatten workspace members into board members
  const members = board.workspace?.members?.map((m) => ({
    ...m.user,
    role: m.role,
    memberId: m.id
  })) || [];

  res.status(200).json({
    status: 'success',
    data: {
      ...board,
      members
    }
  });
});

// DELETE /api/v1/boards/:id - Delete a board
export const deleteBoard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await prisma.board.delete({
    where: { id: id as string }
  });

  res.status(200).json({
    status: 'success',
    message: 'Board deleted successfully'
  });
});

// POST /api/v1/boards/:id/members - Add member to board
export const addBoardMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { email, userId, role } = req.body;

  if (!email && !userId) {
    throw new AppError('Email or userId is required', 400);
  }

  // Find user by email or ID
  const user = await prisma.user.findFirst({
    where: email ? { email: (email as string).trim() } : { id: userId as string },
    select: { id: true, name: true, email: true, avatarUrl: true }
  });

  if (!user) {
    throw new AppError(`User ${email || userId} not found. Ensure they have signed up first.`, 404);
  }

  // Find board
  const board = await prisma.board.findUnique({
    where: { id: id as string },
    select: { id: true, workspaceId: true }
  });

  if (!board) {
    throw new AppError('Board not found', 404);
  }

  // Check if user is already a member
  const existing = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: board.workspaceId,
      userId: user.id
    }
  });

  let memberRecord;
  if (!existing) {
    memberRecord = await prisma.workspaceMember.create({
      data: {
        workspaceId: board.workspaceId,
        userId: user.id,
        role: role || 'MEMBER'
      }
    });
  } else {
    memberRecord = existing;
  }

  const memberData = {
    ...user,
    role: memberRecord.role,
    memberId: memberRecord.id
  };

  // ⚡ Broadcast real-time event to teammates on this board
  io.to(`board_${id}`).emit('member_added', memberData);

  res.status(201).json({
    status: 'success',
    message: 'Member added to board successfully',
    data: memberData
  });
});

// GET /api/v1/boards/:id/members - Get all members of a board
export const getBoardMembers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const board = await prisma.board.findUnique({
    where: { id: id as string },
    select: { workspaceId: true }
  });

  if (!board) {
    throw new AppError('Board not found', 404);
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: board.workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true }
      }
    }
  });

  res.status(200).json({
    status: 'success',
    count: members.length,
    data: members.map((m) => ({
      ...m.user,
      role: m.role,
      memberId: m.id
    }))
  });
});

// DELETE /api/v1/boards/:id/members/:userId - Remove member from board
export const removeBoardMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id, userId } = req.params;

  const board = await prisma.board.findUnique({
    where: { id: id as string },
    select: { workspaceId: true }
  });

  if (!board) {
    throw new AppError('Board not found', 404);
  }

  await prisma.workspaceMember.deleteMany({
    where: {
      workspaceId: board.workspaceId,
      userId: userId as string
    }
  });

  // ⚡ Broadcast real-time event
  io.to(`board_${id}`).emit('member_removed', { userId });

  res.status(200).json({
    status: 'success',
    message: 'Member removed from board successfully'
  });
});
