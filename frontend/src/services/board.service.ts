import API from './api';

export interface BoardMemberItem {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string;
  memberId?: string;
}

export interface BoardSummary {
  id: string;
  title: string;
  bgImage?: string | null;
  workspaceId: string;
  createdAt: string;
  lists?: any[];
}

export interface BoardData {
  id: string;
  title: string;
  bgImage?: string | null;
  lists: any[];
  members?: BoardMemberItem[];
}

export const boardService = {
  getAll: async (workspaceId?: string): Promise<BoardSummary[]> => {
    const url = workspaceId ? `/boards?workspaceId=${workspaceId}` : '/boards';
    const res = await API.get(url);
    return res.data.data || [];
  },

  getById: async (boardId: string): Promise<BoardData> => {
    const res = await API.get(`/boards/${boardId}`);
    return res.data.data;
  },

  create: async (data: { title: string; bgImage?: string; workspaceId: string }): Promise<BoardSummary> => {
    const res = await API.post('/boards', data);
    return res.data.data;
  },

  delete: async (boardId: string): Promise<void> => {
    await API.delete(`/boards/${boardId}`);
  },

  addMember: async (boardId: string, email: string, role: string): Promise<BoardMemberItem> => {
    const res = await API.post(`/boards/${boardId}/members`, { email, role });
    return res.data.data;
  },

  removeMember: async (boardId: string, userId: string): Promise<void> => {
    await API.delete(`/boards/${boardId}/members/${userId}`);
  },
};
