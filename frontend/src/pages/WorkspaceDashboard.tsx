import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Button } from '@/components/ui/button';
import {
  Plus,
  LogOut,
  Kanban,
  FolderKanban,
  Sparkles,
  Layers,
  Trash2,
  Users,
  Settings,
  ChevronDown,
  Check,
  X,
  Loader2,
  Building2,
  Shield,
  UserPlus
} from 'lucide-react';

export interface WorkspaceMember {
  id: string;
  memberId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string;
}

export interface WorkspaceItem {
  id: string;
  name: string;
  description?: string | null;
  boardCount: number;
  memberCount: number;
  createdAt: string;
  members: WorkspaceMember[];
}

interface BoardSummary {
  id: string;
  title: string;
  bgImage?: string | null;
  workspaceId: string;
  createdAt: string;
  lists?: any[];
}

const BG_GRADIENTS = [
  'from-indigo-600 to-blue-500',
  'from-violet-600 to-purple-500',
  'from-emerald-600 to-teal-500',
  'from-rose-600 to-orange-500',
  'from-amber-500 to-orange-500',
  'from-slate-700 to-zinc-900',
];

export const WorkspaceDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();

  // Workspaces State
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceItem | null>(null);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);

  // Boards State
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(true);

  // Create Board Modal State
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [boardTitle, setBoardTitle] = useState('');
  const [selectedBg, setSelectedBg] = useState(BG_GRADIENTS[0]);
  const [createBoardLoading, setCreateBoardLoading] = useState(false);

  // Create Workspace Modal State
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [createWorkspaceLoading, setCreateWorkspaceLoading] = useState(false);
  const [createWorkspaceError, setCreateWorkspaceError] = useState('');

  // Workspace Members Modal State
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<WorkspaceMember[]>([]);

  // Workspace Settings Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // 1. Fetch All Workspaces
  const fetchWorkspaces = async () => {
    try {
      setLoadingWorkspaces(true);
      const res = await API.get('/workspaces');
      if (res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setWorkspaces(res.data.data);
        // If no active workspace or previous active is not found, default to the first one
        setActiveWorkspace((prev) => {
          if (!prev) return res.data.data[0];
          const found = res.data.data.find((w: WorkspaceItem) => w.id === prev.id);
          return found || res.data.data[0];
        });
      } else {
        setWorkspaces([]);
      }
    } catch (err) {
      console.warn('Failed to load workspaces', err);
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // 2. Fetch Boards for Active Workspace
  const fetchBoards = async (wsId?: string) => {
    const targetWsId = wsId || activeWorkspace?.id;
    if (!targetWsId) return;

    try {
      setLoadingBoards(true);
      const res = await API.get(`/boards?workspaceId=${targetWsId}`);
      if (res.data.data && Array.isArray(res.data.data)) {
        setBoards(res.data.data);
      } else {
        setBoards([]);
      }
    } catch (err) {
      console.warn('Failed to load boards for workspace', err);
      setBoards([]);
    } finally {
      setLoadingBoards(false);
    }
  };

  useEffect(() => {
    if (activeWorkspace?.id) {
      fetchBoards(activeWorkspace.id);
    }
  }, [activeWorkspace?.id]);

  // Load all registered users for autocomplete suggestions
  const loadAllUsers = async () => {
    try {
      const res = await API.get('/users/all');
      if (res.data.data) {
        setAllRegisteredUsers(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load users', err);
    }
  };

  // 3. Create New Workspace Handler
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;

    setCreateWorkspaceLoading(true);
    setCreateWorkspaceError('');

    try {
      const res = await API.post('/workspaces', {
        name: workspaceName.trim(),
        description: workspaceDescription.trim() || undefined,
      });

      const newWs = res.data.data;
      setWorkspaces((prev) => [newWs, ...prev]);
      setActiveWorkspace(newWs);
      setIsCreatingWorkspace(false);
      setWorkspaceName('');
      setWorkspaceDescription('');
    } catch (err: any) {
      setCreateWorkspaceError(err.response?.data?.message || 'Failed to create workspace.');
    } finally {
      setCreateWorkspaceLoading(false);
    }
  };

  // 4. Update Workspace Settings Handler
  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !editName.trim()) return;

    setSettingsLoading(true);
    setSettingsError('');
    setSettingsSuccess('');

    try {
      const res = await API.patch(`/workspaces/${activeWorkspace.id}`, {
        name: editName.trim(),
        description: editDescription.trim() || null,
      });

      const updated = res.data.data;
      setActiveWorkspace((prev) => (prev ? { ...prev, name: updated.name, description: updated.description } : null));
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === activeWorkspace.id ? { ...w, name: updated.name, description: updated.description } : w))
      );
      setSettingsSuccess('Workspace updated successfully!');
      setTimeout(() => {
        setSettingsSuccess('');
        setIsSettingsModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setSettingsError(err.response?.data?.message || 'Failed to update workspace.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // 5. Delete Workspace Handler
  const handleDeleteWorkspace = async () => {
    if (!activeWorkspace) return;
    if (!window.confirm(`Are you sure you want to delete "${activeWorkspace.name}" and all its boards? This action cannot be undone.`)) {
      return;
    }

    setSettingsLoading(true);
    try {
      await API.delete(`/workspaces/${activeWorkspace.id}`);
      const remaining = workspaces.filter((w) => w.id !== activeWorkspace.id);
      setWorkspaces(remaining);
      setActiveWorkspace(remaining[0] || null);
      setIsSettingsModalOpen(false);
    } catch (err: any) {
      setSettingsError(err.response?.data?.message || 'Failed to delete workspace.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // 6. Add Workspace Member Handler
  const handleAddWorkspaceMember = async (targetEmail?: string) => {
    const emailToInvite = targetEmail || inviteEmail.trim();
    if (!activeWorkspace || !emailToInvite) return;

    setInviteLoading(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const res = await API.post(`/workspaces/${activeWorkspace.id}/members`, {
        email: emailToInvite,
        role: inviteRole,
      });

      const added = res.data.data;
      setActiveWorkspace((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          memberCount: prev.memberCount + 1,
          members: [...prev.members, added],
        };
      });
      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === activeWorkspace.id
            ? { ...w, memberCount: w.memberCount + 1, members: [...w.members, added] }
            : w
        )
      );
      setInviteSuccess(`Added ${added.name} to workspace!`);
      setInviteEmail('');
      setTimeout(() => setInviteSuccess(''), 3000);
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Failed to add member to workspace.');
    } finally {
      setInviteLoading(false);
    }
  };

  // 7. Remove Workspace Member Handler
  const handleRemoveWorkspaceMember = async (userId: string) => {
    if (!activeWorkspace) return;
    if (!window.confirm('Are you sure you want to remove this member from the workspace?')) return;

    try {
      await API.delete(`/workspaces/${activeWorkspace.id}/members/${userId}`);
      setActiveWorkspace((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          memberCount: Math.max(0, prev.memberCount - 1),
          members: prev.members.filter((m) => m.id !== userId),
        };
      });
      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === activeWorkspace.id
            ? {
                ...w,
                memberCount: Math.max(0, w.memberCount - 1),
                members: w.members.filter((m) => m.id !== userId),
              }
            : w
        )
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  // 8. Create Board inside active workspace
  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardTitle.trim() || !activeWorkspace) return;

    setCreateBoardLoading(true);
    try {
      const res = await API.post('/boards', {
        title: boardTitle.trim(),
        bgImage: selectedBg,
        workspaceId: activeWorkspace.id,
      });
      const newBoard = res.data.data;
      setBoards((prev) => [newBoard, ...prev]);
      setIsCreatingBoard(false);
      setBoardTitle('');
      // Navigate to the newly created board
      navigate(`/b/${newBoard.id}`);
    } catch (err) {
      console.error('Failed to create board', err);
      alert('Failed to create board. Please check backend connection.');
    } finally {
      setCreateBoardLoading(false);
    }
  };

  // 9. Delete Board Handler
  const handleDeleteBoard = async (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this board? This action cannot be undone.')) return;

    setBoards((prev) => prev.filter((b) => b.id !== boardId));

    try {
      await API.delete(`/boards/${boardId}`);
    } catch (err) {
      console.error('Failed to delete board', err);
      fetchBoards();
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-zinc-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-14 border-b border-zinc-200/90 bg-white/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Kanban className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-zinc-900">DevFlow</span>
          </div>

          {/* Navigation Links with Workspace Switcher */}
          <nav className="hidden md:flex items-center gap-2 text-sm font-medium text-zinc-600">
            <span className="px-3 py-1.5 bg-zinc-100 text-zinc-900 rounded-lg font-semibold text-xs">
              Boards
            </span>

            {/* Workspace Switcher or New Workspace Button */}
            {workspaces.length > 0 ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsWorkspaceDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-100 rounded-lg text-xs font-semibold text-zinc-700 transition cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="max-w-36 truncate">{activeWorkspace?.name || 'Workspace'}</span>
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </button>

                {isWorkspaceDropdownOpen && (
                  <div
                    className="absolute left-0 mt-2 w-64 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 z-40 animate-in fade-in zoom-in-95"
                    onClick={() => setIsWorkspaceDropdownOpen(false)}
                  >
                    <div className="px-3 py-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Your Workspaces
                    </div>

                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {workspaces.map((ws) => (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => setActiveWorkspace(ws)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition cursor-pointer ${
                            activeWorkspace?.id === ws.id
                              ? 'bg-indigo-50 text-indigo-700 font-semibold'
                              : 'hover:bg-zinc-50 text-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 uppercase">
                              {ws.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate">{ws.name}</p>
                              <p className="text-[10px] text-zinc-400 font-normal">
                                {ws.boardCount} boards • {ws.memberCount} members
                              </p>
                            </div>
                          </div>
                          {activeWorkspace?.id === ws.id && (
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 mt-2 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsWorkspaceDropdownOpen(false);
                          setIsCreatingWorkspace(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create New Workspace</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreatingWorkspace(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Workspace</span>
              </button>
            )}
          </nav>
        </div>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs">
            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <span className="font-medium text-zinc-700">{user?.name}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 text-xs"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
          </Button>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 space-y-8">
        {loadingWorkspaces ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-zinc-200/80 text-zinc-400 text-xs">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Loading your workspaces...</span>
            </div>
          </div>
        ) : workspaces.length === 0 ? (
          /* Welcome Onboarding: Create Your First Workspace */
          <div className="max-w-xl mx-auto py-8">
            <div className="bg-white rounded-3xl border border-zinc-200/90 p-8 md:p-10 shadow-lg text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto shadow-xs">
                <Building2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                  Welcome to DevFlow, {user?.name || 'there'}!
                </h1>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  You don't have any workspaces yet. Create your first workspace to start organizing boards, lists, and collaborating with your team.
                </p>
              </div>

              {/* Quick Workspace Creation Form */}
              <form onSubmit={handleCreateWorkspace} className="space-y-4 text-left pt-2">
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">
                    Workspace Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp, Engineering Team, Personal Projects"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    autoFocus
                    required
                    className="w-full p-3 text-xs bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">
                    Description <span className="font-normal text-zinc-400">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief summary of projects in this workspace..."
                    value={workspaceDescription}
                    onChange={(e) => setWorkspaceDescription(e.target.value)}
                    className="w-full p-3 text-xs bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition"
                  />
                </div>

                {createWorkspaceError && (
                  <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5 font-medium">
                    {createWorkspaceError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={createWorkspaceLoading || !workspaceName.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-10 rounded-xl shadow-xs gap-2 cursor-pointer"
                >
                  {createWorkspaceLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Your Workspace & Get Started</span>
                    </>
                  )}
                </Button>
              </form>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-center gap-6 text-[11px] text-zinc-400 flex-wrap">
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Unlimited Boards</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Real-Time Sync</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Team Collaboration</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Workspace Banner & Control Strip */}
            <div className="bg-white rounded-2xl border border-zinc-200/90 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl font-black shadow-sm shrink-0 uppercase">
                  {activeWorkspace?.name ? activeWorkspace.name.charAt(0) : 'D'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-xl font-bold text-zinc-900 truncate">
                      {activeWorkspace?.name || 'Workspace'}
                    </h1>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-[11px] font-semibold text-zinc-600">
                      Workspace
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 flex items-center gap-2 mt-1 truncate">
                    <FolderKanban className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">
                      {activeWorkspace?.description || 'Collaborative team workspace'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons: Members, Settings, New Board */}
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                {/* Manage Members Button */}
                <button
                  type="button"
                  onClick={() => {
                    loadAllUsers();
                    setIsMembersModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                  title="Manage Workspace Members"
                >
                  <Users className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Members ({activeWorkspace?.members?.length || activeWorkspace?.memberCount || 0})</span>
                </button>

                {/* Workspace Settings Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (activeWorkspace) {
                      setEditName(activeWorkspace.name);
                      setEditDescription(activeWorkspace.description || '');
                      setSettingsError('');
                      setSettingsSuccess('');
                    }
                    setIsSettingsModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                  title="Workspace Settings"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Settings</span>
                </button>

                {/* Create Board Button */}
                <Button
                  onClick={() => setIsCreatingBoard(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs gap-1.5 h-9 px-3.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Board
                </Button>
              </div>
            </div>

            {/* Boards Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-800">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Boards in {activeWorkspace?.name || 'Workspace'}</span>
                </div>
                <span className="text-xs font-medium text-zinc-400">
                  {boards.length} {boards.length === 1 ? 'board' : 'boards'}
                </span>
              </div>

          {loadingBoards ? (
            <div className="h-44 flex items-center justify-center bg-white rounded-2xl border border-zinc-200 text-zinc-400 text-xs">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Loading boards...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {/* Existing Boards */}
              {boards.map((b, idx) => {
                const gradient = b.bgImage || BG_GRADIENTS[idx % BG_GRADIENTS.length];
                const listCount = b.lists ? b.lists.length : 0;
                return (
                  <div
                    key={b.id}
                    onClick={() => navigate(`/b/${b.id}`)}
                    className={`h-32 rounded-xl p-4 bg-gradient-to-br ${gradient} text-white font-bold text-sm shadow-sm hover:shadow-xl hover:scale-[1.02] cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden`}
                  >
                    <div className="relative z-10 flex items-start justify-between gap-2">
                      <span className="line-clamp-2 leading-snug">{b.title}</span>
                      <button
                        onClick={(e) => handleDeleteBoard(e, b.id)}
                        title="Delete Board"
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-black/30 hover:bg-black/60 text-white transition shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-[11px] text-white/80 font-normal">
                      <span>{listCount > 0 ? `${listCount} lists` : 'Trello Board'}</span>
                      <Sparkles className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                    </div>

                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                );
              })}

              {/* Create Board Tile Button */}
              <div
                onClick={() => setIsCreatingBoard(true)}
                className="h-32 rounded-xl border-2 border-dashed border-zinc-300 hover:border-zinc-400 bg-zinc-200/40 hover:bg-zinc-200/80 cursor-pointer transition flex flex-col items-center justify-center gap-2 text-zinc-600 hover:text-zinc-900"
              >
                <Plus className="w-5 h-5 text-zinc-500" />
                <span className="text-xs font-semibold">Create new board</span>
              </div>
            </div>
          )}
        </div>
          </>
        )}
      </main>

      {/* -------------------- MODALS -------------------- */}

      {/* 1. Create Workspace Modal */}
      {isCreatingWorkspace && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsCreatingWorkspace(false)}
        >
          <div
            className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-2xl p-6 text-zinc-900 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900">Create Workspace</h3>
                  <p className="text-xs text-zinc-500">Organize your team's projects in one place</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingWorkspace(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Engineering, Marketing, Design Studio"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  autoFocus
                  required
                  className="w-full p-2.5 text-xs bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of what this workspace is used for..."
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  className="w-full p-2.5 text-xs bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              {createWorkspaceError && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2 font-medium">
                  {createWorkspaceError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreatingWorkspace(false)}
                  className="text-zinc-600 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createWorkspaceLoading || !workspaceName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4"
                >
                  {createWorkspaceLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    'Create Workspace'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Workspace Members Modal */}
      {isMembersModalOpen && activeWorkspace && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsMembersModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-zinc-900 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">Workspace Members</h3>
                  <p className="text-xs text-zinc-500">{activeWorkspace.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMembersModalOpen(false)}
                className="w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Invite Member Form */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 block">Invite Teammate by Email</label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddWorkspaceMember();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="email"
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'MEMBER' | 'ADMIN')}
                    className="px-2.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-700 font-medium focus:outline-none focus:bg-white focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <Button
                    type="submit"
                    disabled={inviteLoading || !inviteEmail.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 rounded-xl shadow-xs"
                  >
                    {inviteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Invite'}
                  </Button>
                </form>

                {inviteError && (
                  <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2 font-medium">
                    {inviteError}
                  </p>
                )}
                {inviteSuccess && (
                  <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg p-2 font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    {inviteSuccess}
                  </p>
                )}
              </div>

              {/* Quick Add Teammates */}
              {allRegisteredUsers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-700">Quick Add Registered Users</span>
                    <span className="text-[11px] text-zinc-400 font-medium">Available to add</span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {allRegisteredUsers
                      .filter(
                        (u) =>
                          !activeWorkspace.members?.some(
                            (m) => m.email.toLowerCase() === u.email.toLowerCase()
                          )
                      )
                      .slice(0, 5)
                      .map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-2 rounded-xl border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50/60 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                              {u.name ? u.name.charAt(0) : 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-zinc-900 truncate">{u.name}</p>
                              <p className="text-[11px] text-zinc-400 truncate">{u.email}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={inviteLoading}
                            onClick={() => handleAddWorkspaceMember(u.email)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition shrink-0 cursor-pointer"
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Active Workspace Members List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-700">Current Members</span>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    {activeWorkspace.members?.length || 0} members
                  </span>
                </div>
                <div className="divide-y divide-zinc-100 border border-zinc-200/80 rounded-xl overflow-hidden">
                  {activeWorkspace.members && activeWorkspace.members.length > 0 ? (
                    activeWorkspace.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 bg-white hover:bg-zinc-50/50 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0 shadow-2xs">
                            {m.name ? m.name.charAt(0) : 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-zinc-900 truncate">{m.name}</p>
                            <p className="text-[11px] text-zinc-400 truncate">{m.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                              m.role === 'ADMIN'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                            }`}
                          >
                            {m.role || 'MEMBER'}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveWorkspaceMember(m.id)}
                            className="text-zinc-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition cursor-pointer"
                            title="Remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-zinc-400">
                      No members in this workspace yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMembersModalOpen(false)}
                className="text-xs text-zinc-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Workspace Settings Modal */}
      {isSettingsModalOpen && activeWorkspace && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsSettingsModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-2xl p-6 text-zinc-900 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900">Workspace Settings</h3>
                  <p className="text-xs text-zinc-500">Edit details or manage workspace lifecycle</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateWorkspace} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full p-2.5 text-xs bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2.5 text-xs bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              {settingsError && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2 font-medium">
                  {settingsError}
                </p>
              )}
              {settingsSuccess && (
                <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg p-2 font-medium flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  {settingsSuccess}
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleDeleteWorkspace}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                  title="Delete Workspace"
                >
                  Delete Workspace
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="text-zinc-600 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={settingsLoading || !editName.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4"
                  >
                    {settingsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Create Board Modal */}
      {isCreatingBoard && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsCreatingBoard(false)}
        >
          <div
            className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl shadow-2xl p-6 text-zinc-900 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-zinc-900 mb-1">Create Board</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Inside <span className="font-semibold text-zinc-700">{activeWorkspace?.name}</span>
            </p>

            {/* Board Preview Thumbnail */}
            <div
              className={`h-24 rounded-xl mb-4 bg-gradient-to-br ${selectedBg} p-3 flex items-center justify-center text-white font-bold text-sm shadow-inner`}
            >
              {boardTitle || 'Board Preview'}
            </div>

            {/* Title Input */}
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Board Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Sprint Roadmap, Marketing Launch"
                  value={boardTitle}
                  onChange={(e) => setBoardTitle(e.target.value)}
                  autoFocus
                  required
                  className="w-full p-2.5 text-xs bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Gradient Theme Picker */}
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-2">Background Theme</label>
                <div className="grid grid-cols-6 gap-2">
                  {BG_GRADIENTS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setSelectedBg(bg)}
                      className={`h-7 rounded-md bg-gradient-to-br ${bg} transition ${
                        selectedBg === bg ? 'ring-2 ring-indigo-600 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreatingBoard(false)}
                  className="text-zinc-600 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createBoardLoading || !boardTitle.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4"
                >
                  {createBoardLoading ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
