import React, { useState } from 'react';
import { Building2, Plus, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  userName?: string;
  onCreateWorkspace: (name: string, description?: string) => Promise<void>;
  loading: boolean;
  error?: string;
}

export const WorkspaceEmptyState: React.FC<Props> = ({
  userName,
  onCreateWorkspace,
  loading,
  error,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateWorkspace(name.trim(), description.trim() || undefined);
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-8 md:p-10 shadow-lg text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto shadow-xs">
          <Building2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
            Welcome to DevFlow, {userName || 'there'}!
          </h1>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
            You don't have any workspaces yet. Create your first workspace to start organizing boards, lists, and collaborating with your team.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left pt-2">
          <div>
            <label className="text-xs font-bold text-zinc-700 block mb-1">
              Workspace Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Corp, Engineering Team, Personal Projects"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-xs bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5 font-medium">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-10 rounded-xl shadow-xs gap-2 cursor-pointer"
          >
            {loading ? (
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
  );
};
