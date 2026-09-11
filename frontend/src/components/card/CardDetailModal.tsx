import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  AlignLeft,
  CheckSquare,
  Clock,
  Tag,
  Trash2,
  Plus,
  MessageSquare,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../context/AuthContext';

export interface CardDetails {
  id: string;
  title: string;
  description?: string;
  listId: string;
  order: number;
  dueDate?: string | null;
  listTitle?: string;
  labels?: Array<{ id: string; name: string; color: string }>;
}

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface CommentItem {
  id: string;
  text: string;
  userName: string;
  createdAt: string;
}

interface CardDetailModalProps {
  card: CardDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCard: (cardId: string, updates: Partial<CardDetails>) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  isOpen,
  onClose,
  onUpdateCard,
  onDeleteCard,
}) => {
  const { user } = useAuth();

  // Local card state
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [description, setDescription] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  const [dueDate, setDueDate] = useState<string>('');
  const [isDueDateCompleted, setIsDueDateCompleted] = useState(false);

  // Checklists state (stored with card in localStorage / state)
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState<{ [checklistId: string]: string }>({});
  const [activeNewItemInput, setActiveNewItemInput] = useState<string | null>(null);

  // Comments state
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  // Labels state
  const [selectedLabels, setSelectedLabels] = useState<Array<{ name: string; color: string }>>([]);
  const [isLabelPickerOpen, setIsLabelPickerOpen] = useState(false);

  // Available label presets like Trello
  const LABEL_PALETTE = [
    { name: 'Feature', color: 'bg-emerald-500' },
    { name: 'High Priority', color: 'bg-rose-500' },
    { name: 'In Review', color: 'bg-amber-500' },
    { name: 'Bug Fix', color: 'bg-red-600' },
    { name: 'Design', color: 'bg-indigo-500' },
    { name: 'Enhancement', color: 'bg-sky-500' },
  ];

  // Sync state when active card changes
  useEffect(() => {
    if (card) {
      setTitle(card.title || '');
      setDescription(card.description || '');
      setDueDate(card.dueDate ? card.dueDate.split('T')[0] : '');
      setIsDueDateCompleted(false);

      // Restore card-specific checklist / comments from local storage for seamless persistence
      const savedChecklists = localStorage.getItem(`trello_checklists_${card.id}`);
      if (savedChecklists) {
        try {
          setChecklists(JSON.parse(savedChecklists));
        } catch {
          setChecklists([]);
        }
      } else {
        setChecklists([]);
      }

      const savedComments = localStorage.getItem(`trello_comments_${card.id}`);
      if (savedComments) {
        try {
          setComments(JSON.parse(savedComments));
        } catch {
          setComments([]);
        }
      } else {
        setComments([]);
      }

      const savedLabels = localStorage.getItem(`trello_labels_${card.id}`);
      if (savedLabels) {
        try {
          setSelectedLabels(JSON.parse(savedLabels));
        } catch {
          setSelectedLabels([]);
        }
      } else {
        setSelectedLabels([]);
      }
    }
  }, [card]);

  // Persist checklists
  const updateChecklists = (newLists: Checklist[]) => {
    setChecklists(newLists);
    if (card) {
      localStorage.setItem(`trello_checklists_${card.id}`, JSON.stringify(newLists));
    }
  };

  // Persist labels
  const toggleLabel = (label: { name: string; color: string }) => {
    const exists = selectedLabels.some((l) => l.name === label.name);
    const updated = exists
      ? selectedLabels.filter((l) => l.name !== label.name)
      : [...selectedLabels, label];
    setSelectedLabels(updated);
    if (card) {
      localStorage.setItem(`trello_labels_${card.id}`, JSON.stringify(updated));
    }
  };

  // Persist comments
  const handleAddComment = () => {
    if (!newCommentText.trim() || !card) return;
    const newComment: CommentItem = {
      id: Date.now().toString(),
      text: newCommentText.trim(),
      userName: user?.name || 'Teammate',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [newComment, ...comments];
    setComments(updated);
    localStorage.setItem(`trello_comments_${card.id}`, JSON.stringify(updated));
    setNewCommentText('');
  };

  // Save Title
  const handleSaveTitle = async () => {
    setIsEditingTitle(false);
    if (card && title.trim() && title !== card.title) {
      await onUpdateCard(card.id, { title: title.trim() });
    }
  };

  // Save Description
  const handleSaveDescription = async () => {
    setIsEditingDesc(false);
    if (card && description !== card.description) {
      await onUpdateCard(card.id, { description: description.trim() });
    }
  };

  // Save Due Date
  const handleDueDateChange = async (dateVal: string) => {
    setDueDate(dateVal);
    if (card) {
      await onUpdateCard(card.id, { dueDate: dateVal || null });
    }
  };

  // Add new Checklist
  const handleAddChecklist = () => {
    if (!newChecklistTitle.trim()) return;
    const newCl: Checklist = {
      id: Date.now().toString(),
      title: newChecklistTitle.trim(),
      items: [],
    };
    updateChecklists([...checklists, newCl]);
    setNewChecklistTitle('');
    setIsAddingChecklist(false);
  };

  // Add Item to Checklist
  const handleAddChecklistItem = (checklistId: string) => {
    const text = (newItemTitle[checklistId] || '').trim();
    if (!text) return;

    const updated = checklists.map((cl) => {
      if (cl.id === checklistId) {
        return {
          ...cl,
          items: [...cl.items, { id: Date.now().toString(), title: text, completed: false }],
        };
      }
      return cl;
    });

    updateChecklists(updated);
    setNewItemTitle({ ...newItemTitle, [checklistId]: '' });
    setActiveNewItemInput(null);
  };

  // Toggle Checklist Item
  const handleToggleChecklistItem = (checklistId: string, itemId: string) => {
    const updated = checklists.map((cl) => {
      if (cl.id === checklistId) {
        return {
          ...cl,
          items: cl.items.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        };
      }
      return cl;
    });
    updateChecklists(updated);
  };

  // Delete Checklist
  const handleDeleteChecklist = (checklistId: string) => {
    const updated = checklists.filter((cl) => cl.id !== checklistId);
    updateChecklists(updated);
  };

  if (!isOpen || !card) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#f4f5f7] border border-zinc-200 rounded-2xl shadow-2xl my-8 overflow-hidden text-zinc-900 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between p-6 pb-2">
          <div className="flex items-start gap-3 flex-1 pr-6">
            <CreditCard className="w-5 h-5 text-zinc-600 mt-1 shrink-0" />
            <div className="flex-1">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  autoFocus
                  className="w-full text-xl font-bold bg-white border border-indigo-500 rounded-lg px-2.5 py-1 text-zinc-900 focus:outline-none"
                />
              ) : (
                <h2
                  onClick={() => setIsEditingTitle(true)}
                  className="text-xl font-bold text-zinc-900 hover:bg-zinc-200/70 px-2 py-0.5 -ml-2 rounded-lg cursor-pointer transition"
                >
                  {title}
                </h2>
              )}
              <p className="text-xs text-zinc-500 mt-1">
                in list <span className="font-semibold underline text-zinc-700">{card.listTitle || 'Column'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Details & Right Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 pt-3">
          {/* Main Left Column (2 Cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* Active Labels & Due Date Tags */}
            {(selectedLabels.length > 0 || dueDate) && (
              <div className="flex flex-wrap gap-4 items-center">
                {selectedLabels.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                      Labels
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedLabels.map((lbl) => (
                        <span
                          key={lbl.name}
                          className={`${lbl.color} text-white text-xs font-medium px-2.5 py-1 rounded-md shadow-xs`}
                        >
                          {lbl.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {dueDate && (
                  <div>
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                      Due Date
                    </span>
                    <div className="flex items-center gap-2 bg-white border border-zinc-200 px-3 py-1 rounded-md shadow-xs text-xs">
                      <input
                        type="checkbox"
                        checked={isDueDateCompleted}
                        onChange={(e) => setIsDueDateCompleted(e.target.checked)}
                        className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className={isDueDateCompleted ? 'line-through text-zinc-400' : 'text-zinc-800 font-medium'}>
                        {new Date(dueDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      {isDueDateCompleted && (
                        <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          COMPLETE
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description Section */}
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <AlignLeft className="w-5 h-5 text-zinc-600" />
                <h3 className="font-semibold text-sm text-zinc-800">Description</h3>
              </div>

              {isEditingDesc ? (
                <div className="space-y-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a more detailed description..."
                    rows={4}
                    autoFocus
                    className="w-full p-3 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveDescription}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingDesc(false)}
                      className="text-zinc-600 hover:bg-zinc-200"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  className="min-h-[70px] p-3.5 bg-zinc-200/50 hover:bg-zinc-200/80 border border-zinc-200/60 rounded-xl text-sm text-zinc-700 cursor-pointer transition"
                >
                  {description ? (
                    <p className="whitespace-pre-wrap">{description}</p>
                  ) : (
                    <span className="text-zinc-400 italic">Add a more detailed description...</span>
                  )}
                </div>
              )}
            </div>

            {/* Checklists Section */}
            {checklists.map((cl) => {
              const totalItems = cl.items.length;
              const completedItems = cl.items.filter((i) => i.completed).length;
              const percentage = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

              return (
                <div key={cl.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CheckSquare className="w-5 h-5 text-zinc-600" />
                      <h4 className="font-semibold text-sm text-zinc-800">{cl.title}</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteChecklist(cl.id)}
                      className="text-zinc-400 hover:text-red-600 text-xs h-7 px-2"
                    >
                      Delete
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 font-medium w-8">{percentage}%</span>
                    <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Checklist Items */}
                  <div className="space-y-2">
                    {cl.items.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-start gap-3 p-2 hover:bg-zinc-200/40 rounded-lg cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleChecklistItem(cl.id, item.id)}
                          className="mt-0.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span
                          className={`text-sm ${
                            item.completed ? 'line-through text-zinc-400' : 'text-zinc-800'
                          }`}
                        >
                          {item.title}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Add Item to Checklist */}
                  {activeNewItemInput === cl.id ? (
                    <div className="space-y-2 pl-7">
                      <input
                        type="text"
                        placeholder="Add an item..."
                        value={newItemTitle[cl.id] || ''}
                        onChange={(e) =>
                          setNewItemTitle({ ...newItemTitle, [cl.id]: e.target.value })
                        }
                        onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem(cl.id)}
                        autoFocus
                        className="w-full p-2 text-sm bg-white border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAddChecklistItem(cl.id)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                        >
                          Add Item
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveNewItemInput(null)}
                          className="text-zinc-600 text-xs hover:bg-zinc-200"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveNewItemInput(cl.id)}
                      className="ml-7 text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Add an item
                    </Button>
                  )}
                </div>
              );
            })}

            {/* Comments & Activity Stream */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-zinc-600" />
                <h3 className="font-semibold text-sm text-zinc-800">Activity & Comments</h3>
              </div>

              {/* Comment Input */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="flex-1 space-y-2">
                  <textarea
                    placeholder="Write a comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 text-sm bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                  />
                  {newCommentText.trim() && (
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                    >
                      Save Comment
                    </Button>
                  )}
                </div>
              </div>

              {/* Comments Feed */}
              <div className="space-y-3 pt-2">
                {comments.map((cm) => (
                  <div key={cm.id} className="flex items-start gap-3 text-xs">
                    <div className="w-7 h-7 rounded-full bg-zinc-300 text-zinc-700 flex items-center justify-center font-bold shrink-0">
                      {cm.userName[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-800">{cm.userName}</span>
                        <span className="text-zinc-400">{cm.createdAt}</span>
                      </div>
                      <div className="mt-1 p-2.5 bg-white border border-zinc-200/80 rounded-xl text-zinc-700 shadow-xs">
                        {cm.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar (1 Col): "Add to card" & Actions */}
          <div className="space-y-5">
            {/* Add to Card Section */}
            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
                Add to card
              </span>
              <div className="flex flex-col gap-2">
                {/* Labels Trigger */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsLabelPickerOpen(!isLabelPickerOpen)}
                    className="w-full justify-start bg-zinc-200/60 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-lg h-8"
                  >
                    <Tag className="w-4 h-4 mr-2 text-zinc-600" /> Labels
                  </Button>

                  {/* Label Picker Popover */}
                  {isLabelPickerOpen && (
                    <div className="absolute top-10 left-0 w-56 bg-white border border-zinc-200 rounded-xl shadow-xl p-3 z-30 space-y-2 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                        <span className="text-xs font-bold text-zinc-700">Labels</span>
                        <button
                          onClick={() => setIsLabelPickerOpen(false)}
                          className="text-zinc-400 hover:text-zinc-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {LABEL_PALETTE.map((lbl) => {
                          const isSelected = selectedLabels.some((l) => l.name === lbl.name);
                          return (
                            <button
                              key={lbl.name}
                              onClick={() => toggleLabel(lbl)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-md text-white text-xs font-medium flex items-center justify-between ${lbl.color} hover:opacity-90 transition`}
                            >
                              <span>{lbl.name}</span>
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Checklist Trigger */}
                {isAddingChecklist ? (
                  <div className="bg-white border border-zinc-300 rounded-xl p-3 shadow-md space-y-2">
                    <span className="text-xs font-bold text-zinc-700 block">Add Checklist</span>
                    <input
                      type="text"
                      placeholder="Checklist title..."
                      value={newChecklistTitle}
                      onChange={(e) => setNewChecklistTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
                      autoFocus
                      className="w-full p-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded text-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        onClick={handleAddChecklist}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-7 px-2.5"
                      >
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsAddingChecklist(false)}
                        className="text-zinc-600 text-xs h-7 px-2"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAddingChecklist(true);
                      setNewChecklistTitle('Checklist');
                    }}
                    className="w-full justify-start bg-zinc-200/60 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-lg h-8"
                  >
                    <CheckSquare className="w-4 h-4 mr-2 text-zinc-600" /> Checklist
                  </Button>
                )}

                {/* Dates Trigger */}
                <div className="relative">
                  <label className="w-full flex items-center justify-start px-3 py-1.5 bg-zinc-200/60 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-lg h-8 cursor-pointer transition">
                    <Clock className="w-4 h-4 mr-2 text-zinc-600" />
                    <span>Dates</span>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => handleDueDateChange(e.target.value)}
                      className="opacity-0 absolute inset-0 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
                Actions
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (window.confirm('Are you sure you want to delete this card?')) {
                    await onDeleteCard(card.id);
                    onClose();
                  }
                }}
                className="w-full justify-start bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg h-8 transition"
              >
                <Trash2 className="w-4 h-4 mr-2 text-red-500" /> Delete Card
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
