import React from 'react';
import { ArrowLeft, Search, LogOut, UserPlus, Kanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BoardMemberItem } from './types';

interface Props {
  boardTitle: string;
  members: BoardMemberItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onShareClick: () => void;
  onBack: () => void;
  onLogout: () => void;
}

export const BoardNavbar: React.FC<Props> = ({
  boardTitle,
  members,
  searchQuery,
  onSearchChange,
  onShareClick,
  onBack,
  onLogout,
}) => {
  return (
    <header className="h-14 border-b border-zinc-200/90 bg-white/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Left: Back & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200/80 px-2.5 py-1.5 rounded-lg transition"
          title="Back to Workspace Boards"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Boards</span>
        </button>

        <div className="h-4 w-px bg-zinc-300" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Kanban className="w-4 h-4" />
          </div>
          <h1 className="text-base font-bold text-zinc-900 tracking-tight">{boardTitle}</h1>
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex items-center gap-2 max-w-xs w-full">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter cards..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-100 border border-zinc-200/80 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>
      </div>

      {/* Right: Members, Share, Logout */}
      <div className="flex items-center gap-3">
        {/* Member Avatar Stack */}
        {members.length > 0 && (
          <div className="flex items-center -space-x-2 mr-1">
            {members.slice(0, 4).map((member) => (
              <div
                key={member.id}
                title={`${member.name} (${member.email}) • ${member.role || 'MEMBER'}`}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white shadow-2xs select-none uppercase tracking-wider"
              >
                {member.name ? member.name.charAt(0) : 'U'}
              </div>
            ))}
            {members.length > 4 && (
              <div
                className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center text-[10px] font-bold ring-2 ring-white shadow-2xs"
                title={`${members.length - 4} more members`}
              >
                +{members.length - 4}
              </div>
            )}
          </div>
        )}

        {/* Share Button */}
        <button
          type="button"
          onClick={onShareClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
          title="Add members or share board"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>

        <div className="h-4 w-px bg-zinc-200" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 text-xs"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          Sign Out
        </Button>
      </div>
    </header>
  );
};
