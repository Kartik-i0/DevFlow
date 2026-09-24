/**
 * List request validation rules
 */
export const validateCreateList = (body: any): string | null => {
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return 'List title is required.';
  }
  if (!body.boardId || typeof body.boardId !== 'string') {
    return 'boardId is required.';
  }
  return null;
};
