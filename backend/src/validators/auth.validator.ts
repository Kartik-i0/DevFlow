/**
 * Auth request validation rules
 */
export const validateRegister = (body: any): string | null => {
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return 'Name is required.';
  }
  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    return 'A valid email address is required.';
  }
  if (!body.password || typeof body.password !== 'string' || body.password.length < 6) {
    return 'Password must be at least 6 characters long.';
  }
  return null;
};

export const validateLogin = (body: any): string | null => {
  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    return 'A valid email address is required.';
  }
  if (!body.password || typeof body.password !== 'string') {
    return 'Password is required.';
  }
  return null;
};
