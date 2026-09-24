/**
 * Board request validation rules
 */
export const validateCreateBoard = (body: any): string | null => {
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return 'Board title is required.';
  }
  return null;
};

export const validateUpdateBoard = (body: any): string | null => {
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return 'Board title must be a non-empty string.';
    }
  }
  return null;
};

export const validateBoardMember = (body: any): string | null => {
  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    return 'A valid email address is required to invite a board member.';
  }
  return null;
};
