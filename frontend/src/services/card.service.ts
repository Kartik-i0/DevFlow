import API from './api';

export const cardService = {
  create: async (listId: string, title: string, description?: string) => {
    const res = await API.post('/cards', { listId, title, description });
    return res.data.data;
  },

  move: async (cardId: string, listId: string, order: number) => {
    const res = await API.patch(`/cards/${cardId}/move`, { listId, order });
    return res.data.data;
  },

  update: async (cardId: string, updates: Record<string, any>) => {
    const res = await API.patch(`/cards/${cardId}`, updates);
    return res.data.data;
  },

  delete: async (cardId: string) => {
    await API.delete(`/cards/${cardId}`);
  },
};
