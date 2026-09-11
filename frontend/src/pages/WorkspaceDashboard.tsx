import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Button } from '@/components/ui/button';
import {
  LayoutGrid,
  Plus,
  LogOut,
  Kanban,
  FolderKanban,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';

interface BoardSummary {
  id: string;
  title: string;
  bgImage?: string | null;
  workspaceId: string;
  createdAt: string;
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

  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // New Board Dialog State
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [boardTitle, setBoardTitle] = useState('');
  const [selectedBg, setSelectedBg] = useState(BG_GRADIENTS[0]);
  const [createLoading, setCreateLoading] = useState(false);

  // Default workspace id (matches seed or user's first workspace)
  const defaultWorkspaceId = 'w1';

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const res = await API.get(`/boards/workspace/${defaultWorkspaceId}`);
        setBoards(res.data.data || []);
      } catch (err) {
        console.warn('Workspace boards fetch failed, using fallback or empty', err);
        // Fallback demo board if none in DB
        setBoards([
          {
            id: '0e36fa9d-0dc8-4bb6-8a58-8c1864394053',
            title: 'Engineering Sprint & Product Launch',
            workspaceId: defaultWorkspaceId,
            bgImage: BG_GRADIENTS[0],
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, []);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardTitle.trim()) return;

    setCreateLoading(true);
    try {
      const res = await API.post('/boards', {
        title: boardTitle.trim(),
        bgImage: selectedBg,
        workspaceId: defaultWorkspaceId,
      });
      const newBoard = res.data.data;
      setBoards((prev) => [...prev, newBoard]);
      setIsCreatingBoard(false);
      setBoardTitle('');
      navigate(`/b/${newBoard.id}`);
    } catch (err) {
      console.error('Failed to create board', err);
      // Client optimistic creation for instant demo
      const fallbackId = 'board_' + Date.now();
      const demoBoard: BoardSummary = {
        id: fallbackId,
        title: boardTitle.trim(),
        workspaceId: defaultWorkspaceId,
        bgImage: selectedBg,
        createdAt: new Date().toISOString(),
      };
      setBoards((prev) => [...prev, demoBoard]);
      setIsCreatingBoard(false);
      navigate(`/b/${fallbackId}`);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-zinc-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-14 border-b border-zinc-200/80 bg-white/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Kanban className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-zinc-900">DevFlow</span>
          </div>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-zinc-600">
            <span className="px-3 py-1.5 bg-zinc-100 text-zinc-900 rounded-md">Workspaces</span>
            <span className="px-3 py-1.5 hover:bg-zinc-100 rounded-md cursor-pointer transition">Recent</span>
            <span className="px-3 py-1.5 hover:bg-zinc-100 rounded-md cursor-pointer transition">Starred</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs">
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
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10">
        {/* Workspace Title & Badge */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-200 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl font-black shadow-sm">
              D
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">DevFlow Main Workspace</h1>
              <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                <FolderKanban className="w-3.5 h-3.5 text-zinc-400" />
                <span>Default Collaborative Workspace</span>
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsCreatingBoard(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-sm gap-2"
          >
            <Plus className="w-4 h-4" /> Create New Board
          </Button>
        </div>

        {/* Boards Grid Section */}
        <div>
          <div className="flex items-center gap-2 mb-4 text-sm font-bold text-zinc-700">
            <Layers className="w-4 h-4 text-zinc-500" />
            <span>Your Boards ({boards.length})</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-zinc-400 text-sm">Loading your workspaces...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {/* Existing Boards */}
              {boards.map((b, idx) => {
                const gradient = b.bgImage || BG_GRADIENTS[idx % BG_GRADIENTS.length];
                return (
                  <div
                    key={b.id}
                    onClick={() => navigate(`/b/${b.id}`)}
                    className={`h-28 rounded-xl p-4 bg-gradient-to-br ${gradient} text-white font-bold text-sm shadow-sm hover:shadow-lg hover:scale-[1.02] cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden`}
                  >
                    <span className="relative z-10 line-clamp-2">{b.title}</span>
                    <div className="relative z-10 flex items-center justify-between text-[11px] text-white/80 font-normal">
                      <span>Trello Board</span>
                      <Sparkles className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                );
              })}

              {/* Create Board Tile Button */}
              <div
                onClick={() => setIsCreatingBoard(true)}
                className="h-28 rounded-xl border-2 border-dashed border-zinc-300 hover:border-zinc-400 bg-zinc-200/40 hover:bg-zinc-200/80 cursor-pointer transition flex flex-col items-center justify-center gap-2 text-zinc-600 hover:text-zinc-900"
              >
                <Plus className="w-5 h-5 text-zinc-500" />
                <span className="text-xs font-semibold">Create new board</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Board Modal */}
      {isCreatingBoard && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsCreatingBoard(false)}
        >
          <div
            className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl shadow-2xl p-6 text-zinc-900 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-zinc-900 mb-4">Create Board</h3>

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
                  className="w-full p-2.5 text-sm bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  disabled={createLoading || !boardTitle.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4"
                >
                  {createLoading ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
