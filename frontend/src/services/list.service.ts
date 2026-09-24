import API from './api';

export const listService = {
  create: async (boardId: string, title: string) => {
    const res = await API.post('/lists', { boardId, title });
    return res.data.data;
  },

  updateOrder: async (listId: string, order: number) => {
    const res = await API.patch(`/lists/${listId}/order`, { order });
    return res.data.data;
  },

  delete: async (listId: string) => {
    await API.delete(`/lists/${listId}`);
  },
};
