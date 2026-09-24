import React, { useState } from 'react';
import { Settings, X, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WorkspaceItem } from '../../services/workspace.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceItem | null;
  onUpdate: (data: { name: string; description?: string | null }) => Promise<void>;
  onDelete: () => Promise<void>;
  canDelete: boolean;
  loading: boolean;
  error?: string;
  success?: string;
}

export const WorkspaceSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  workspace,
  onUpdate,
  onDelete,
  canDelete,
  loading,
  error,
  success,
}) => {
  const [name, setName] = useState(workspace?.name || '');
  const [description, setDescription] = useState(workspace?.description || '');

  // Sync form when workspace changes
  React.useEffect(() => {
    setName(workspace?.name || '');
    setDescription(workspace?.description || '');
  }, [workspace?.id]);

  if (!isOpen || !workspace) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onUpdate({ name: name.trim(), description: description.trim() || null });
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${workspace.name}" and all its boards? This cannot be undone.`)) return;
    await onDelete();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
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
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-700 block mb-1">Workspace Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2.5 text-xs bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 block mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 text-xs bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2 font-medium">{error}</p>
          )}
          {success && (
            <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg p-2 font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />{success}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete || loading}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition disabled:opacity-40 cursor-pointer"
              title={!canDelete ? 'Cannot delete only workspace' : 'Delete Workspace'}
            >
              Delete Workspace
            </button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-zinc-600 text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading || !name.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 cursor-pointer"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
