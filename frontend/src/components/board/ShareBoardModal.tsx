import React, { useState } from 'react';
import { Users, X, Loader2, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BoardMemberItem } from './types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  members: BoardMemberItem[];
  allUsers: BoardMemberItem[];
  onAddMember: (user?: { email: string; id?: string }) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  inviteLoading: boolean;
  inviteError: string;
  inviteSuccess: string;
}

export const ShareBoardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  members,
  allUsers,
  onAddMember,
  onRemoveMember,
  inviteLoading,
  inviteError,
  inviteSuccess,
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddMember({ email: inviteEmail });
    setInviteEmail('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200/90 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Share Board</h2>
              <p className="text-xs text-zinc-500">Collaborate with your team in real time</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Invite Form */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700">Invite by Email</label>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                placeholder="teammate@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'MEMBER' | 'ADMIN')}
                className="px-2.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-700 font-medium focus:outline-none focus:bg-white focus:border-indigo-500 transition cursor-pointer"
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
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200/80 rounded-lg p-2 font-medium">
                {inviteError}
              </p>
            )}
            {inviteSuccess && (
              <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200/80 rounded-lg p-2 font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                {inviteSuccess}
              </p>
            )}
          </div>

          {/* Quick Add (unregistered users) */}
          {allUsers.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700">Quick Add Teammates</span>
                <span className="text-[11px] text-zinc-400 font-medium">Registered in workspace</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {allUsers
                  .filter(
                    (user) =>
                      !members.some((m) => m.email.toLowerCase() === user.email.toLowerCase())
                  )
                  .slice(0, 5)
                  .map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-xl border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50/60 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                          {user.name ? user.name.charAt(0) : 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-zinc-900 truncate">{user.name}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={inviteLoading}
                        onClick={() => onAddMember(user)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition shrink-0 cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Current Members */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700">Board Members</span>
              <span className="text-[11px] text-zinc-400 font-medium">{members.length} active</span>
            </div>
            <div className="divide-y divide-zinc-100 border border-zinc-200/80 rounded-xl overflow-hidden">
              {members.length > 0 ? (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-white hover:bg-zinc-50/50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0 shadow-2xs">
                        {member.name ? member.name.charAt(0) : 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 truncate">{member.name}</p>
                        <p className="text-[11px] text-zinc-400 truncate">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          member.role === 'ADMIN'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}
                      >
                        {member.role || 'MEMBER'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveMember(member.id)}
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
                  No members added yet. Invite someone above!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs text-zinc-700">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
