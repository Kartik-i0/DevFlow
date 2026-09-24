import { Response } from 'express';
import prisma from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/appError';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/v1/workspaces - Get all workspaces for the authenticated user
export const getAllWorkspaces = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  let workspaces: any[] = [];
  if (userId) {
    // Find workspaces where user is an explicit member
    workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        },
        boards: {
          include: {
            lists: {
              select: { id: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Format response
  const formatted = workspaces.map((ws) => ({
    id: ws.id,
    name: ws.name,
    description: ws.description,
    createdAt: ws.createdAt,
    updatedAt: ws.updatedAt,
    boardCount: ws.boards ? ws.boards.length : 0,
    memberCount: ws.members ? ws.members.length : 0,
    boards: ws.boards || [],
    members: (ws.members || []).map((m: any) => ({
      id: m.user?.id || m.userId,
      memberId: m.id,
      name: m.user?.name || 'Member',
      email: m.user?.email || '',
      avatarUrl: m.user?.avatarUrl || null,
      role: m.role
    }))
  }));

  res.status(200).json({
    status: 'success',
    count: formatted.length,
    data: formatted
  });
});

// GET /api/v1/workspaces/:id - Get a single workspace by ID
export const getWorkspaceById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      },
      boards: {
        include: {
          lists: {
            select: { id: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      boards: workspace.boards,
      members: (workspace.members || []).map((m: any) => ({
        id: m.user?.id || m.userId,
        memberId: m.id,
        name: m.user?.name || 'Member',
        email: m.user?.email || '',
        avatarUrl: m.user?.avatarUrl || null,
        role: m.role
      }))
    }
  });
});

// POST /api/v1/workspaces - Create a new workspace
export const createWorkspace = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description } = req.body;
  const userId = req.user?.userId;

  if (!name || !String(name).trim()) {
    throw new AppError('Workspace name is required', 400);
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: String(name).trim(),
      description: description ? String(description).trim() : null
    }
  });

  // Automatically add creator as ADMIN
  let membersList: any[] = [];
  if (userId) {
    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId,
        role: 'ADMIN'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });
    membersList = [member];
  }

  res.status(201).json({
    status: 'success',
    message: 'Workspace created successfully',
    data: {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      boardCount: 0,
      memberCount: membersList.length,
      boards: [],
      members: membersList.map((m: any) => ({
        id: m.user?.id || m.userId,
        memberId: m.id,
        name: m.user?.name || 'Admin',
        email: m.user?.email || '',
        avatarUrl: m.user?.avatarUrl || null,
        role: m.role
      }))
    }
  });
});

// PATCH /api/v1/workspaces/:id - Update workspace details
export const updateWorkspace = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { name, description } = req.body;

  const existing = await prisma.workspace.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Workspace not found', 404);
  }

  const updated = await prisma.workspace.update({
    where: { id },
    data: {
      ...(name && { name: String(name).trim() }),
      ...(description !== undefined && { description: description ? String(description).trim() : null })
    }
  });

  res.status(200).json({
    status: 'success',
    message: 'Workspace updated successfully',
    data: updated
  });
});

// DELETE /api/v1/workspaces/:id - Delete workspace
export const deleteWorkspace = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);

  const existing = await prisma.workspace.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Workspace not found', 404);
  }

  await prisma.workspace.delete({ where: { id } });

  res.status(200).json({
    status: 'success',
    message: 'Workspace deleted successfully'
  });
});

// GET /api/v1/workspaces/:id/boards - Get all boards in a workspace
export const getWorkspaceBoards = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);

  const boards = await prisma.board.findMany({
    where: { workspaceId: id },
    include: {
      lists: {
        include: { cards: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({
    status: 'success',
    count: boards.length,
    data: boards
  });
});

// POST /api/v1/workspaces/:id/members - Add/Invite a member to a workspace
export const addWorkspaceMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { email, role } = req.body;

  if (!email || !String(email).trim()) {
    throw new AppError('Email is required to invite a member', 400);
  }

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  // Find user by email
  let user = await prisma.user.findUnique({
    where: { email: String(email).trim().toLowerCase() }
  });

  if (!user) {
    // Create new invited user account
    user = await prisma.user.create({
      data: {
        email: String(email).trim().toLowerCase(),
        name: String(email).split('@')[0],
        password: 'Password123!'
      }
    });
  }

  // Check if already a member
  const existingMember = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: id,
      userId: user.id
    }
  });

  if (existingMember) {
    throw new AppError('User is already a member of this workspace', 400);
  }

  const newMember = await prisma.workspaceMember.create({
    data: {
      workspaceId: id,
      userId: user.id,
      role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true
        }
      }
    }
  });

  res.status(201).json({
    status: 'success',
    message: 'Member added to workspace successfully',
    data: {
      id: newMember.user.id,
      memberId: newMember.id,
      name: newMember.user.name,
      email: newMember.user.email,
      avatarUrl: newMember.user.avatarUrl,
      role: newMember.role
    }
  });
});

// DELETE /api/v1/workspaces/:id/members/:userId - Remove a member from a workspace
export const removeWorkspaceMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const userId = String(req.params.userId);

  const member = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: id,
      userId
    }
  });

  if (!member) {
    throw new AppError('Member not found in this workspace', 404);
  }

  await prisma.workspaceMember.delete({
    where: { id: member.id }
  });

  res.status(200).json({
    status: 'success',
    message: 'Member removed from workspace successfully'
  });
});
