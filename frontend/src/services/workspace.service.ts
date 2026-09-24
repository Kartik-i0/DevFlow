import API from './api';

export interface WorkspaceMember {
  id: string;
  memberId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string;
}

export interface WorkspaceItem {
  id: string;
  name: string;
  description?: string | null;
  boardCount: number;
  memberCount: number;
  createdAt: string;
  members: WorkspaceMember[];
}

export const workspaceService = {
  getAll: async (): Promise<WorkspaceItem[]> => {
    const res = await API.get('/workspaces');
    return res.data.data || [];
  },

  getById: async (id: string): Promise<WorkspaceItem> => {
    const res = await API.get(`/workspaces/${id}`);
    return res.data.data;
  },

  create: async (data: { name: string; description?: string }): Promise<WorkspaceItem> => {
    const res = await API.post('/workspaces', data);
    return res.data.data;
  },

  update: async (id: string, data: { name?: string; description?: string | null }): Promise<WorkspaceItem> => {
    const res = await API.patch(`/workspaces/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await API.delete(`/workspaces/${id}`);
  },

  addMember: async (id: string, email: string, role: 'MEMBER' | 'ADMIN'): Promise<WorkspaceMember> => {
    const res = await API.post(`/workspaces/${id}/members`, { email, role });
    return res.data.data;
  },

  removeMember: async (id: string, userId: string): Promise<void> => {
    await API.delete(`/workspaces/${id}/members/${userId}`);
  },
};
