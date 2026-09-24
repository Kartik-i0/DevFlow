import API from './api';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export const userService = {
  getAll: async (): Promise<UserSummary[]> => {
    const res = await API.get('/users/all');
    return res.data.data || [];
  },
};
