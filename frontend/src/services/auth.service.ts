import API from './api';

export interface AuthResponse {
  status: string;
  message: string;
  token?: string;
  data: {
    id: string;
    name: string;
    email: string;
    token?: string;
  };
}

export const authService = {
  login: async (email: string, password: string):Promise<AuthResponse> => {
    const res = await API.post('/user/login', { email, password });
    return res.data;
  },

  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const res = await API.post('/user/create', { name, email, password });
    return res.data;
  },
};
