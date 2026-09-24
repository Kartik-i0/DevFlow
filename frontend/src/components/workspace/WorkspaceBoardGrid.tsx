import React from 'react';
import { Layers, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { BG_GRADIENTS } from '../../constants/gradients';
import type { BoardSummary } from '../../services/board.service';

interface Props {
  boards: BoardSummary[];
  loading: boolean;
  workspaceName?: string;
  onNavigateBoard: (boardId: string) => void;
  onDeleteBoard: (e: React.MouseEvent, boardId: string) => void;
  onOpenCreateBoard: () => void;
}

export const WorkspaceBoardGrid: React.FC<Props> = ({
  boards,
  loading,
  workspaceName,
  onNavigateBoard,
  onDeleteBoard,
  onOpenCreateBoard,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-bold text-zinc-800">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>Boards in {workspaceName || 'Workspace'}</span>
        </div>
        <span className="text-xs font-medium text-zinc-400">
          {boards.length} {boards.length === 1 ? 'board' : 'boards'}
        </span>
      </div>

      {loading ? (
        <div className="h-44 flex items-center justify-center bg-white rounded-2xl border border-zinc-200 text-zinc-400 text-xs">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Loading boards...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {boards.map((b, idx) => {
            const gradient = b.bgImage || BG_GRADIENTS[idx % BG_GRADIENTS.length];
            const listCount = b.lists ? b.lists.length : 0;
            return (
              <div
                key={b.id}
                onClick={() => onNavigateBoard(b.id)}
                className={`h-32 rounded-xl p-4 bg-gradient-to-br ${gradient} text-white font-bold text-sm shadow-sm hover:shadow-xl hover:scale-[1.02] cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden`}
              >
                <div className="relative z-10 flex items-start justify-between gap-2">
                  <span className="line-clamp-2 leading-snug">{b.title}</span>
                  <button
                    onClick={(e) => onDeleteBoard(e, b.id)}
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

          <div
            onClick={onOpenCreateBoard}
            className="h-32 rounded-xl border-2 border-dashed border-zinc-300 hover:border-zinc-400 bg-zinc-200/40 hover:bg-zinc-200/80 cursor-pointer transition flex flex-col items-center justify-center gap-2 text-zinc-600 hover:text-zinc-900"
          >
            <Plus className="w-5 h-5 text-zinc-500" />
            <span className="text-xs font-semibold">Create new board</span>
          </div>
        </div>
      )}
    </div>
  );
};
