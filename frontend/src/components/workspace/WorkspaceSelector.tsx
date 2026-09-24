import React from 'react';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import type { WorkspaceItem } from '../../services/workspace.service';

interface Props {
  workspaces: WorkspaceItem[];
  activeWorkspace: WorkspaceItem | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (workspace: WorkspaceItem) => void;
  onCreateNew: () => void;
}

export const WorkspaceSelector: React.FC<Props> = ({
  workspaces,
  activeWorkspace,
  isOpen,
  onToggle,
  onSelect,
  onCreateNew,
}) => {
  if (workspaces.length === 0) {
    return (
      <button
        type="button"
        onClick={onCreateNew}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>New Workspace</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-100 rounded-lg text-xs font-semibold text-zinc-700 transition cursor-pointer"
      >
        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
        <span className="max-w-36 truncate">{activeWorkspace?.name || 'Workspace'}</span>
        <ChevronDown className="w-3 h-3 text-zinc-400" />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 mt-2 w-64 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 z-40 animate-in fade-in zoom-in-95"
          onClick={onToggle}
        >
          <div className="px-3 py-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Your Workspaces
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => onSelect(ws)}
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
              onClick={onCreateNew}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
