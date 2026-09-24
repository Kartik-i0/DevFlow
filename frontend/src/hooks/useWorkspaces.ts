import { useState, useEffect } from 'react';
import { workspaceService, type WorkspaceItem } from '../services/workspace.service';

/**
 * Custom hook to manage workspaces lifecycle and member operations
 */
export const useWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await workspaceService.getAll();
      setWorkspaces(data);
      setActiveWorkspace((prev) => {
        if (!prev) return data[0] || null;
        const found = data.find((w) => w.id === prev.id);
        return found || data[0] || null;
      });
    } catch (err: any) {
      console.warn('Failed to load workspaces', err);
      setError(err.response?.data?.message || 'Failed to load workspaces.');
      setWorkspaces([]);
      setActiveWorkspace(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const createWorkspace = async (name: string, description?: string) => {
    const newWs = await workspaceService.create({ name, description });
    setWorkspaces((prev) => [newWs, ...prev]);
    setActiveWorkspace(newWs);
    return newWs;
  };

  const updateWorkspace = async (id: string, data: { name?: string; description?: string | null }) => {
    const updated = await workspaceService.update(id, data);
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, name: updated.name, description: updated.description } : w))
    );
    setActiveWorkspace((prev) => (prev?.id === id ? { ...prev, name: updated.name, description: updated.description } : prev));
    return updated;
  };

  const deleteWorkspace = async (id: string) => {
    await workspaceService.delete(id);
    const remaining = workspaces.filter((w) => w.id !== id);
    setWorkspaces(remaining);
    setActiveWorkspace(remaining[0] || null);
  };

  const addMember = async (id: string, email: string, role: 'MEMBER' | 'ADMIN') => {
    const added = await workspaceService.addMember(id, email, role);
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, memberCount: w.memberCount + 1, members: [...w.members, added] }
          : w
      )
    );
    setActiveWorkspace((prev) => {
      if (prev?.id !== id) return prev;
      return {
        ...prev,
        memberCount: prev.memberCount + 1,
        members: [...prev.members, added],
      };
    });
    return added;
  };

  const removeMember = async (id: string, userId: string) => {
    await workspaceService.removeMember(id, userId);
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              memberCount: Math.max(0, w.memberCount - 1),
              members: w.members.filter((m) => m.id !== userId),
            }
          : w
      )
    );
    setActiveWorkspace((prev) => {
      if (prev?.id !== id) return prev;
      return {
        ...prev,
        memberCount: Math.max(0, prev.memberCount - 1),
        members: prev.members.filter((m) => m.id !== userId),
      };
    });
  };

  return {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    loading,
    error,
    refetch: fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    addMember,
    removeMember,
  };
};
