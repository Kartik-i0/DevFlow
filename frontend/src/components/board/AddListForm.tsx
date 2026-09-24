import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  isAddingList: boolean;
  newListTitle: string;
  onNewListTitleChange: (val: string) => void;
  onAddListClick: () => void;
  onCreateList: () => void;
  onCancelAddList: () => void;
}

export const AddListForm: React.FC<Props> = ({
  isAddingList,
  newListTitle,
  onNewListTitleChange,
  onAddListClick,
  onCreateList,
  onCancelAddList,
}) => {
  if (isAddingList) {
    return (
      <div className="w-72 bg-[#ebecf0] border border-zinc-300/80 rounded-2xl p-3 flex flex-col gap-2 shrink-0 shadow-xs">
        <input
          type="text"
          placeholder="Enter list title..."
          value={newListTitle}
          onChange={(e) => onNewListTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCreateList();
            if (e.key === 'Escape') onCancelAddList();
          }}
          className="w-full p-2 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          autoFocus
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={onCreateList}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-7 px-3"
          >
            Add List
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onCancelAddList}
            className="text-zinc-600 text-xs h-7 px-2 hover:bg-zinc-200"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onAddListClick}
      className="w-72 h-12 bg-zinc-200/60 hover:bg-zinc-200/90 border border-zinc-300/70 border-dashed rounded-2xl text-zinc-700 hover:text-zinc-900 flex items-center justify-start px-4 gap-2 shrink-0 font-semibold text-xs transition cursor-pointer"
    >
      <Plus className="w-4 h-4 text-zinc-600" /> Add another list
    </button>
  );
};
