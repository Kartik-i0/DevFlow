import React, { useState } from 'react';
import { Users, X, Loader2, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WorkspaceItem } from '../../services/workspace.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceItem | null;
  onAddMember: (email: string, role: 'MEMBER' | 'ADMIN') => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  allUsers: Array<{ id: string; name: string; email: string }>;
  loading: boolean;
  error?: string;
  success?: string;
}

export const WorkspaceMembersModal: React.FC<Props> = ({
  isOpen,
  onClose,
  workspace,
  onAddMember,
  onRemoveMember,
  allUsers,
  loading,
  error,
  success,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');

  if (!isOpen || !workspace) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await onAddMember(email.trim(), role);
    setEmail('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
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
              <p className="text-xs text-zinc-500">{workspace.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Invite Member Form */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 block">Invite Teammate by Email</label>
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                placeholder="teammate@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'MEMBER' | 'ADMIN')}
                className="px-2.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-700 font-medium focus:outline-none focus:bg-white focus:border-indigo-500 cursor-pointer"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
              <Button
                type="submit"
                disabled={loading || !email.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 rounded-xl shadow-xs cursor-pointer"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Invite'}
              </Button>
            </form>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2 font-medium">
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg p-2 font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                {success}
              </p>
            )}
          </div>

          {/* Quick Add Teammates */}
          {allUsers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700">Quick Add Registered Users</span>
                <span className="text-[11px] text-zinc-400 font-medium">Available to add</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {allUsers
                  .filter(
                    (u) =>
                      !workspace.members?.some(
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
                        disabled={loading}
                        onClick={() => onAddMember(u.email, 'MEMBER')}
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
                {workspace.members?.length || 0} members
              </span>
            </div>
            <div className="divide-y divide-zinc-100 border border-zinc-200/80 rounded-xl overflow-hidden">
              {workspace.members && workspace.members.length > 0 ? (
                workspace.members.map((m) => (
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
                        onClick={() => onRemoveMember(m.id)}
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
            onClick={onClose}
            className="text-xs text-zinc-700 cursor-pointer"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
