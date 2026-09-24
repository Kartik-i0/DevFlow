/**
 * Card request validation rules
 */
export const validateCreateCard = (body: any): string | null => {
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return 'Card title is required.';
  }
  if (!body.listId || typeof body.listId !== 'string') {
    return 'listId is required.';
  }
  return null;
};
