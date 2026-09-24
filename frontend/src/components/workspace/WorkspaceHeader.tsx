import React from 'react';
import { FolderKanban, Users, Settings, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WorkspaceItem } from '../../services/workspace.service';

interface Props {
  workspace: WorkspaceItem | null;
  onOpenMembers: () => void;
  onOpenSettings: () => void;
  onOpenCreateBoard: () => void;
}

export const WorkspaceHeader: React.FC<Props> = ({
  workspace,
  onOpenMembers,
  onOpenSettings,
  onOpenCreateBoard,
}) => {
  if (!workspace) return null;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/90 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl font-black shadow-sm shrink-0 uppercase">
          {workspace.name ? workspace.name.charAt(0) : 'W'}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 truncate">
              {workspace.name}
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-[11px] font-semibold text-zinc-600">
              Workspace
            </span>
          </div>
          <p className="text-xs text-zinc-500 flex items-center gap-2 mt-1 truncate">
            <FolderKanban className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">
              {workspace.description || 'Collaborative team workspace'}
            </span>
          </p>
        </div>
      </div>

      {/* Action Buttons: Members, Settings, New Board */}
      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
        <button
          type="button"
          onClick={onOpenMembers}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
          title="Manage Workspace Members"
        >
          <Users className="w-3.5 h-3.5 text-zinc-600" />
          <span>Members ({workspace.members?.length || workspace.memberCount || 0})</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
          title="Workspace Settings"
        >
          <Settings className="w-3.5 h-3.5 text-zinc-600" />
          <span>Settings</span>
        </button>

        <Button
          onClick={onOpenCreateBoard}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs gap-1.5 h-9 px-3.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Create Board
        </Button>
      </div>
    </div>
  );
};
