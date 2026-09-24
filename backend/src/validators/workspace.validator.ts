/**
 * Workspace request validation rules
 */
export const validateCreateWorkspace = (body: any): string | null => {
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return 'Workspace name is required.';
  }
  if (body.name.trim().length > 100) {
    return 'Workspace name cannot exceed 100 characters.';
  }
  return null;
};

export const validateUpdateWorkspace = (body: any): string | null => {
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return 'Workspace name must be a non-empty string.';
    }
  }
  return null;
};

export const validateWorkspaceMember = (body: any): string | null => {
  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    return 'A valid email address is required to invite a member.';
  }
  if (body.role && !['ADMIN', 'MEMBER'].includes(body.role)) {
    return 'Role must be either ADMIN or MEMBER.';
  }
  return null;
};
