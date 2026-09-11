import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import API from '../services/api';
import socket from '../socket/socket';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Plus,
  ArrowLeft,
  Search,
  Filter,
  LogOut,
  Calendar,
  AlignLeft,
  CheckSquare,
  Sparkles,
  Kanban,
  Trash2,
  MessageSquare,
  UserPlus,
  Users,
  X,
  Loader2,
  Check,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { CardDetailModal, type CardDetails, type Checklist } from '../components/card/CardDetailModal';

export interface BoardMemberItem {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string;
  memberId?: string;
}

interface CardItem {
  id: string;
  title: string;
  description?: string;
  order: number;
  listId: string;
  dueDate?: string | null;
  coverColor?: string | null;
  labels?: Array<{ id?: string; name: string; color: string }>;
  checklists?: Checklist[];
}

interface ListColumn {
  id: string;
  title: string;
  order: number;
  cards: CardItem[];
}

interface BoardData {
  id: string;
  title: string;
  bgImage?: string | null;
  lists: ListColumn[];
  members?: BoardMemberItem[];
}


export const BoardPage: React.FC<{ boardId?: string }> = ({ boardId: propBoardId }) => {
  const { boardId: routeBoardId, navigate, cardId: activeCardIdUrl, setCardId: setActiveCardIdUrl } = useRouter();
  const boardId = propBoardId || routeBoardId || '0e36fa9d-0dc8-4bb6-8a58-8c1864394053';

  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Search / Filter cards state
  const [searchQuery, setSearchQuery] = useState('');

  // Active Card Modal State
  const [selectedCard, setSelectedCard] = useState<CardDetails | null>(null);

  // Inline forms state
  const [addingCardListId, setAddingCardListId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const { logout } = useAuth();

  // Member invite modal state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<BoardMemberItem[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Fetch all registered users for autocomplete suggestions
  const loadAllUsers = async () => {
    try {
      const res = await API.get('/users/all');
      if (res.data.data) {
        setAllUsers(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load registered users', err);
    }
  };

  // Add member handler
  const handleAddMember = async (targetUser?: { email: string; id?: string }) => {
    const emailToInvite = targetUser?.email || inviteEmail.trim();
    if (!emailToInvite) return;

    setInviteLoading(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const res = await API.post(`/boards/${boardId}/members`, {
        email: emailToInvite,
        role: inviteRole
      });

      const addedMember = res.data.data;

      setBoard((prev) => {
        if (!prev) return null;
        const currentMembers = prev.members || [];
        if (currentMembers.some((m) => m.email.toLowerCase() === addedMember.email.toLowerCase())) {
          return prev;
        }
        return {
          ...prev,
          members: [...currentMembers, addedMember]
        };
      });

      setInviteSuccess(`Added ${addedMember.name} to the board!`);
      setInviteEmail('');
      setTimeout(() => setInviteSuccess(''), 3000);
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Failed to add member to board.');
    } finally {
      setInviteLoading(false);
    }
  };

  // Remove member handler
  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this member from the board?')) return;

    setBoard((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        members: (prev.members || []).filter((m) => m.id !== userId)
      };
    });

    try {
      await API.delete(`/boards/${boardId}/members/${userId}`);
    } catch (err) {
      console.warn('Failed to remove member on backend', err);
    }
  };

  // 1. Fetch Board Details & Join Real-Time Socket Room

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const response = await API.get(`/boards/${boardId}`);
        setBoard(response.data.data);
      } catch (err) {
        console.warn('Failed to load board from API, creating default board view', err);
        setBoard({
          id: boardId,
          title: 'Product Roadmap & Sprint Backlog',
          lists: [
            {
              id: 'col-1',
              title: 'To Do',
              order: 1000,
              cards: [
                {
                  id: 'card-1',
                  title: 'Design high-fidelity UI components',
                  description: 'Follow off-white and zinc styling guidelines with shadcn.',
                  order: 1000,
                  listId: 'col-1',
                },
                {
                  id: 'card-2',
                  title: 'Setup WebSocket room connection',
                  description: 'Broadcast card movements and updates in real-time.',
                  order: 2000,
                  listId: 'col-1',
                },
              ],
            },
            {
              id: 'col-2',
              title: 'In Progress',
              order: 2000,
              cards: [
                {
                  id: 'card-3',
                  title: 'Implement Card Details Modal',
                  description: 'Checklists, comments, and due dates.',
                  order: 1000,
                  listId: 'col-2',
                },
              ],
            },
            {
              id: 'col-3',
              title: 'Done',
              order: 3000,
              cards: [
                {
                  id: 'card-4',
                  title: 'Database Schema & Prisma Migrations',
                  description: 'Configured models for Board, List, Card, and User.',
                  order: 1000,
                  listId: 'col-3',
                },
              ],
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();

    // ⚡ Real-Time Socket Room Connection
    socket.emit('join_board', boardId);

    // ⚡ Listen for Real-Time Card Movement
    socket.on('card_moved', (updatedCard: CardItem) => {
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        return {
          ...prevBoard,
          lists: prevBoard.lists.map((list) => {
            const filteredCards = list.cards.filter((c) => c.id !== updatedCard.id);
            if (list.id === updatedCard.listId) {
              return {
                ...list,
                cards: [...filteredCards, updatedCard].sort((a, b) => a.order - b.order),
              };
            }
            return { ...list, cards: filteredCards };
          }),
        };
      });
    });

    // ⚡ Listen for Real-Time Card Creation
    socket.on('card_created', (newCard: CardItem) => {
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        return {
          ...prevBoard,
          lists: prevBoard.lists.map((list) => {
            if (list.id === newCard.listId) {
              if (list.cards.some((c) => c.id === newCard.id)) return list;
              return { ...list, cards: [...list.cards, newCard] };
            }
            return list;
          }),
        };
      });
    });

    // ⚡ Listen for Card Update (title, description, etc.)
    socket.on('card_updated', (updatedCard: CardItem) => {
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        return {
          ...prevBoard,
          lists: prevBoard.lists.map((list) => ({
            ...list,
            cards: list.cards.map((c) => (c.id === updatedCard.id ? { ...c, ...updatedCard } : c)),
          })),
        };
      });
    });

    // ⚡ Listen for Card Deletion
    socket.on('card_deleted', ({ id }: { id: string }) => {
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        return {
          ...prevBoard,
          lists: prevBoard.lists.map((list) => ({
            ...list,
            cards: list.cards.filter((c) => c.id !== id),
          })),
        };
      });
    });

    // ⚡ Listen for List Creation
    socket.on('list_created', (newList: ListColumn) => {
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        if (prevBoard.lists.some((list) => list.id === newList.id)) return prevBoard;
        return {
          ...prevBoard,
          lists: [...prevBoard.lists, newList],
        };
      });
    });

    // ⚡ Listen for List Movement
    socket.on('list_moved', ({ listId, order }: { listId: string; order: number }) => {
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        const updatedLists = prevBoard.lists
          .map((l) => (l.id === listId ? { ...l, order } : l))
          .sort((a, b) => a.order - b.order);
        return { ...prevBoard, lists: updatedLists };
      });
    });

    // ⚡ Listen for List Deletion
    socket.on('list_deleted', ({ id }: { id: string }) => {
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        return {
          ...prevBoard,
          lists: prevBoard.lists.filter((l) => l.id !== id),
        };
      });
    });

    // ⚡ Listen for Board Member Added
    socket.on('member_added', (member: BoardMemberItem) => {
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        const currentMembers = prevBoard.members || [];
        if (currentMembers.some((m) => m.id === member.id)) return prevBoard;
        return {
          ...prevBoard,
          members: [...currentMembers, member],
        };
      });
    });

    // ⚡ Listen for Board Member Removed
    socket.on('member_removed', ({ userId }: { userId: string }) => {
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        return {
          ...prevBoard,
          members: (prevBoard.members || []).filter((m) => m.id !== userId),
        };
      });
    });

    // Cleanup on unmount
    return () => {
      socket.emit('leave_board', boardId);
      socket.off('card_moved');
      socket.off('card_created');
      socket.off('card_updated');
      socket.off('card_deleted');
      socket.off('list_created');
      socket.off('list_moved');
      socket.off('list_deleted');
      socket.off('member_added');
      socket.off('member_removed');
    };
  }, [boardId]);


  // Open modal if URL has ?c=:cardId
  useEffect(() => {
    if (board && activeCardIdUrl) {
      for (const list of board.lists) {
        const found = list.cards.find((c) => c.id === activeCardIdUrl);
        if (found) {
          setSelectedCard({ ...found, listTitle: list.title });
          break;
        }
      }
    }
  }, [board, activeCardIdUrl]);

  // 2. Create Card Handler
  const handleCreateCard = async (listId: string) => {
    if (!newCardTitle.trim()) return;

    try {
      const res = await API.post('/cards', {
        title: newCardTitle.trim(),
        description: newCardDescription.trim() || undefined,
        listId,
        boardId,
      });

      const createdCard = res.data.data;

      // Optimistic UI Update
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        return {
          ...prevBoard,
          lists: prevBoard.lists.map((list) => {
            if (list.id === listId) {
              if (list.cards.some((c) => c.id === createdCard.id)) return list;
              return { ...list, cards: [...list.cards, createdCard] };
            }
            return list;
          }),
        };
      });

      setNewCardTitle('');
      setNewCardDescription('');
      setAddingCardListId(null);
    } catch (err) {
      console.warn('API card create failed, updating client state directly', err);
      const fallbackCard: CardItem = {
        id: 'card_' + Date.now(),
        title: newCardTitle.trim(),
        description: newCardDescription.trim() || undefined,
        order: Date.now(),
        listId,
      };
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        return {
          ...prevBoard,
          lists: prevBoard.lists.map((l) =>
            l.id === listId ? { ...l, cards: [...l.cards, fallbackCard] } : l
          ),
        };
      });
      setNewCardTitle('');
      setNewCardDescription('');
      setAddingCardListId(null);
    }
  };

  // 3. Create List Handler
  const handleCreateList = async () => {
    if (!newListTitle.trim()) return;

    try {
      const res = await API.post('/lists', {
        title: newListTitle.trim(),
        boardId,
      });

      const createdList = res.data.data;

      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        if (prevBoard.lists.some((l) => l.id === createdList.id)) return prevBoard;
        return {
          ...prevBoard,
          lists: [...prevBoard.lists, createdList],
        };
      });

      setNewListTitle('');
      setIsAddingList(false);
    } catch (err) {
      console.warn('API list create failed, updating client state directly', err);
      const fallbackList: ListColumn = {
        id: 'list_' + Date.now(),
        title: newListTitle.trim(),
        order: Date.now(),
        cards: [],
      };
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        return {
          ...prevBoard,
          lists: [...prevBoard.lists, fallbackList],
        };
      });
      setNewListTitle('');
      setIsAddingList(false);
    }
  };

  // 4. Update Card Details (from Modal)
  const handleUpdateCardDetails = async (cardId: string, updates: Partial<CardDetails>) => {
    // Optimistic UI Update
    setBoard((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        lists: prev.lists.map((list) => ({
          ...list,
          cards: list.cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)),
        })),
      };
    });

    if (selectedCard && selectedCard.id === cardId) {
      setSelectedCard((prev) => (prev ? { ...prev, ...updates } : null));
    }

    try {
      await API.patch(`/cards/${cardId}`, {
        ...updates,
        boardId,
      });
    } catch (err) {
      console.error('Failed to update card details on backend', err);
    }
  };

  // 5. Delete Card (from Modal)
  const handleDeleteCard = async (cardId: string) => {
    // Optimistic UI Update
    setBoard((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        lists: prev.lists.map((list) => ({
          ...list,
          cards: list.cards.filter((c) => c.id !== cardId),
        })),
      };
    });

    try {
      await API.delete(`/cards/${cardId}?boardId=${boardId}`);
    } catch (err) {
      console.error('Failed to delete card on backend', err);
    }
  };

  // 5b. Delete List Handler
  const handleDeleteList = async (listId: string) => {
    if (!window.confirm('Are you sure you want to delete this list and all its cards?')) return;
    setBoard((prevBoard) => {
      if (!prevBoard) return null;
      return {
        ...prevBoard,
        lists: prevBoard.lists.filter((l) => l.id !== listId),
      };
    });

    try {
      await API.delete(`/lists/${listId}`);
    } catch (err) {
      console.warn('Failed to delete list on backend', err);
    }
  };

  // 6. Drag & Drop Handler with Fractional Indexing
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // A) Column (List) Horizontal Reordering
    if (type === 'column') {
      if (!board) return;
      const newLists = Array.from(board.lists);
      const [movedList] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, movedList);

      const newOrder = (destination.index + 1) * 1000.0;
      movedList.order = newOrder;

      setBoard({ ...board, lists: newLists });

      try {
        await API.patch(`/lists/${draggableId}/order`, { order: newOrder });
        socket.emit('list_moved', { boardId, listId: draggableId, order: newOrder });
      } catch (err) {
        console.warn('Failed to update list order in backend', err);
      }
      return;
    }

    // B) Card Reordering
    const targetListId = destination.droppableId;
    const newOrder = (destination.index + 1) * 1000.0;


    // Optimistic UI update
    setBoard((prevBoard) => {
      if (!prevBoard) return null;

      const newLists = prevBoard.lists.map((list) => {
        if (list.id === source.droppableId) {
          const updatedCards = Array.from(list.cards);
          const [movedCard] = updatedCards.splice(source.index, 1);

          if (source.droppableId === targetListId) {
            updatedCards.splice(destination.index, 0, { ...movedCard, order: newOrder });
            return { ...list, cards: updatedCards };
          }
          return { ...list, cards: updatedCards };
        }

        if (list.id === targetListId && source.droppableId !== targetListId) {
          const targetCards = Array.from(list.cards);
          const movedCard = prevBoard.lists
            .find((l) => l.id === source.droppableId)
            ?.cards.find((c) => c.id === draggableId);

          if (movedCard) {
            targetCards.splice(destination.index, 0, {
              ...movedCard,
              listId: targetListId,
              order: newOrder,
            });
          }
          return { ...list, cards: targetCards };
        }

        return list;
      });

      return { ...prevBoard, lists: newLists };
    });

    try {
      await API.patch(`/cards/${draggableId}/move`, {
        listId: targetListId,
        order: newOrder,
        boardId,
      });
    } catch (err) {
      console.error('Failed to persist card movement', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center text-zinc-500 font-medium">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading Trello Board...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-zinc-900 flex flex-col font-sans">
      {/* Board Top Navigation Bar */}
      <header className="h-14 border-b border-zinc-200/90 bg-white/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        {/* Left: Back to Boards & Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
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
            <h1 className="text-base font-bold text-zinc-900 tracking-tight">
              {board?.title || 'DevFlow Board'}
            </h1>
          </div>
        </div>

        {/* Center: Instant Filter Search */}
        <div className="hidden md:flex items-center gap-2 max-w-xs w-full">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-100 border border-zinc-200/80 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>
        </div>

        {/* Right: Board Members, Share/Add Member & Sign Out */}
        <div className="flex items-center gap-3">
          {/* Member Avatars Stack */}
          {board?.members && board.members.length > 0 && (
            <div className="flex items-center -space-x-2 mr-1">
              {board.members.slice(0, 4).map((member) => (
                <div
                  key={member.id}
                  title={`${member.name} (${member.email}) • ${member.role || 'MEMBER'}`}
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white shadow-2xs select-none uppercase tracking-wider"
                >
                  {member.name ? member.name.charAt(0) : 'U'}
                </div>
              ))}
              {board.members.length > 4 && (
                <div
                  className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center text-[10px] font-bold ring-2 ring-white shadow-2xs"
                  title={`${board.members.length - 4} more members`}
                >
                  +{board.members.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Share / Add Member Button */}
          <button
            type="button"
            onClick={() => {
              loadAllUsers();
              setIsMemberModalOpen(true);
            }}
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
            onClick={logout}
            className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 text-xs"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Kanban Canvas */}
      <main className="flex-1 p-6 overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 items-start h-full pb-4">
            <Droppable droppableId="board-columns" direction="horizontal" type="column">
              {(boardDroppableProvided) => (
                <div
                  ref={boardDroppableProvided.innerRef}
                  {...boardDroppableProvided.droppableProps}
                  className="flex gap-4 items-start"
                >

                {board?.lists.map((list, listIndex) => {
                  // Filter cards by search query
                  const filteredCards = searchQuery.trim()
                    ? list.cards.filter((c) =>
                        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                    : list.cards;

                  return (
                    <Draggable key={list.id} draggableId={list.id} index={listIndex}>
                      {(columnProvided, columnSnapshot) => (
                        <div
                          ref={columnProvided.innerRef}
                          {...columnProvided.draggableProps}
                          className={`w-72 bg-[#ebecf0] border border-zinc-300/40 rounded-2xl p-3 flex flex-col max-h-[85vh] shadow-xs shrink-0 transition-shadow ${
                            columnSnapshot.isDragging ? 'shadow-2xl ring-2 ring-indigo-500/50 rotate-1' : ''
                          }`}
                        >
                          {/* Column Header (acts as drag handle) */}
                          <div
                            {...columnProvided.dragHandleProps}
                            className="flex items-center justify-between mb-3 px-1.5 cursor-grab active:cursor-grabbing group/header"
                          >
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-zinc-800 text-sm tracking-tight">{list.title}</h3>
                              <span className="text-xs bg-zinc-200 text-zinc-600 font-semibold px-2 py-0.5 rounded-full">
                                {filteredCards.length}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteList(list.id);
                              }}
                              title="Delete list"
                              className="opacity-0 group-hover/header:opacity-100 p-1 text-zinc-400 hover:text-red-600 hover:bg-zinc-200 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Droppable Card Column */}
                          <Droppable droppableId={list.id} type="card">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`flex-1 min-h-[80px] space-y-2.5 overflow-y-auto pr-1 transition-colors rounded-xl ${
                                  snapshot.isDraggingOver ? 'bg-zinc-300/40' : ''
                                }`}
                              >
                                {filteredCards.map((card, index) => {
                                  // Gather card decorations (cover, labels, checklists, comments)
                                  const cardCover = card.coverColor || localStorage.getItem(`trello_cover_${card.id}`) || null;

                                  let cardLabels: Array<{ name: string; color: string }> = card.labels || [];
                                  if (cardLabels.length === 0) {
                                    try {
                                      const raw = localStorage.getItem(`trello_labels_${card.id}`);
                                      if (raw) cardLabels = JSON.parse(raw);
                                    } catch {}
                                  }

                                  let cardChecklists: any[] = card.checklists || [];
                                  if (cardChecklists.length === 0) {
                                    try {
                                      const raw = localStorage.getItem(`trello_checklists_${card.id}`);
                                      if (raw) cardChecklists = JSON.parse(raw);
                                    } catch {}
                                  }
                                  const totalChecklistItems = cardChecklists.reduce(
                                    (acc: number, cl: any) => acc + (cl.items?.length || 0),
                                    0
                                  );
                                  const completedChecklistItems = cardChecklists.reduce(
                                    (acc: number, cl: any) =>
                                      acc + (cl.items?.filter((i: any) => i.completed)?.length || 0),
                                    0
                                  );

                                  let commentCount = 0;
                                  try {
                                    const raw = localStorage.getItem(`trello_comments_${card.id}`);
                                    if (raw) commentCount = JSON.parse(raw).length;
                                  } catch {}

                                  const isOverdue = card.dueDate ? new Date(card.dueDate) < new Date() : false;

                                  return (
                                    <Draggable key={card.id} draggableId={card.id} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          onClick={() => {
                                            setSelectedCard({ ...card, listTitle: list.title });
                                            setActiveCardIdUrl(card.id);
                                          }}
                                          className={`p-3 bg-white border border-zinc-200/90 rounded-xl shadow-xs text-zinc-900 transition-all cursor-pointer group hover:border-zinc-300 hover:shadow-md overflow-hidden ${
                                            snapshot.isDragging ? 'ring-2 ring-indigo-500 shadow-2xl scale-105 rotate-1' : ''
                                          }`}
                                        >
                                          {/* Card Cover Strip */}
                                          {cardCover && (
                                            <div
                                              className="h-6 -mx-3 -mt-3 mb-2 rounded-t-xl transition-all"
                                              style={{ backgroundColor: cardCover }}
                                            />
                                          )}

                                          {/* Card Labels Bar */}
                                          {cardLabels.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-1.5">
                                              {cardLabels.map((lbl, idx) => (
                                                <span
                                                  key={idx}
                                                  className={`h-1.5 w-8 rounded-full ${lbl.color} inline-block`}
                                                  title={lbl.name}
                                                />
                                              ))}
                                            </div>
                                          )}

                                          <h4 className="font-semibold text-sm text-zinc-800 leading-snug group-hover:text-indigo-600 transition">
                                            {card.title}
                                          </h4>

                                          {card.description && (
                                            <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">
                                              {card.description}
                                            </p>
                                          )}

                                          {/* Card Badges (Due Date, Checklist progress, Comments, Description Icon) */}
                                          {(card.description || card.dueDate || totalChecklistItems > 0 || commentCount > 0) && (
                                            <div className="flex items-center flex-wrap gap-2.5 mt-2.5 text-zinc-400 text-xs">
                                              {card.description && (
                                                <div className="flex items-center gap-1" title="This card has a description">
                                                  <AlignLeft className="w-3.5 h-3.5" />
                                                </div>
                                              )}
                                              {totalChecklistItems > 0 && (
                                                <div
                                                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${
                                                    completedChecklistItems === totalChecklistItems
                                                      ? 'bg-emerald-100 text-emerald-700 font-semibold'
                                                      : 'bg-zinc-100 text-zinc-600'
                                                  }`}
                                                >
                                                  <CheckSquare className="w-3 h-3" />
                                                  <span>
                                                    {completedChecklistItems}/{totalChecklistItems}
                                                  </span>
                                                </div>
                                              )}
                                              {card.dueDate && (
                                                <div
                                                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${
                                                    isOverdue
                                                      ? 'bg-red-100 text-red-700 font-semibold'
                                                      : 'bg-zinc-100 text-zinc-600'
                                                  }`}
                                                >
                                                  <Calendar className="w-3 h-3" />
                                                  <span>
                                                    {new Date(card.dueDate).toLocaleDateString(undefined, {
                                                      month: 'short',
                                                      day: 'numeric',
                                                    })}
                                                  </span>
                                                </div>
                                              )}
                                              {commentCount > 0 && (
                                                <div className="flex items-center gap-1 text-zinc-400 text-xs">
                                                  <MessageSquare className="w-3 h-3" />
                                                  <span>{commentCount}</span>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </Draggable>
                                  );
                                })}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>

                          {/* Add Card Form or Trigger */}
                          {addingCardListId === list.id ? (
                            <div className="mt-2.5 space-y-2 bg-white p-2.5 border border-zinc-300 rounded-xl shadow-xs">
                              <input
                                type="text"
                                placeholder="Enter a title for this card..."
                                value={newCardTitle}
                                onChange={(e) => setNewCardTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCreateCard(list.id);
                                  if (e.key === 'Escape') setAddingCardListId(null);
                                }}
                                className="w-full p-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                autoFocus
                              />
                              <textarea
                                placeholder="Add more details (optional)..."
                                value={newCardDescription}
                                onChange={(e) => setNewCardDescription(e.target.value)}
                                className="w-full p-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                                rows={2}
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleCreateCard(list.id)}
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-7 px-3"
                                >
                                  Add Card
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setAddingCardListId(null)}
                                  className="text-zinc-600 text-xs h-7 px-2 hover:bg-zinc-100"
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
                                setAddingCardListId(list.id);
                                setNewCardTitle('');
                                setNewCardDescription('');
                              }}
                              className="mt-2.5 w-full justify-start text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/80 rounded-xl text-xs font-semibold"
                            >
                              <Plus className="w-4 h-4 mr-1.5" /> Add a card
                            </Button>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {boardDroppableProvided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Add Column Button or Inline Form */}
          {isAddingList ? (
            <div className="w-72 bg-[#ebecf0] border border-zinc-300/80 rounded-2xl p-3 flex flex-col gap-2 shrink-0 shadow-xs">
              <input
                type="text"
                placeholder="Enter list title..."
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateList();
                  if (e.key === 'Escape') setIsAddingList(false);
                }}
                className="w-full p-2 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateList}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-7 px-3"
                >
                  Add List
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAddingList(false)}
                  className="text-zinc-600 text-xs h-7 px-2 hover:bg-zinc-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingList(true)}
              className="w-72 h-12 bg-zinc-200/60 hover:bg-zinc-200/90 border border-zinc-300/70 border-dashed rounded-2xl text-zinc-700 hover:text-zinc-900 flex items-center justify-start px-4 gap-2 shrink-0 font-semibold text-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-zinc-600" /> Add another list
            </button>
          )}
        </div>
      </DragDropContext>


      </main>

      {/* Interactive Card Details Modal */}
      <CardDetailModal
        card={selectedCard}
        isOpen={!!selectedCard}
        onClose={() => {
          setSelectedCard(null);
          setActiveCardIdUrl(null);
        }}
        onUpdateCard={handleUpdateCardDetails}
        onDeleteCard={handleDeleteCard}
      />

      {/* Share Board / Add Member Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200/90 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
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
                onClick={() => {
                  setIsMemberModalOpen(false);
                  setInviteError('');
                  setInviteSuccess('');
                  setInviteEmail('');
                }}
                className="w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Add Member Form */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">
                  Invite by Email
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddMember();
                  }}
                  className="flex gap-2"
                >
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
                    {inviteLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Invite'
                    )}
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

              {/* Quick Add Registered Teammates */}
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
                          !board?.members?.some(
                            (m) => m.email.toLowerCase() === user.email.toLowerCase()
                          )
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
                            onClick={() => handleAddMember(user)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition shrink-0 cursor-pointer"
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Current Board Members */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-700">Board Members</span>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    {board?.members?.length || 0} active
                  </span>
                </div>
                <div className="divide-y divide-zinc-100 border border-zinc-200/80 rounded-xl overflow-hidden">
                  {board?.members && board.members.length > 0 ? (
                    board.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-white hover:bg-zinc-50/50 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0 shadow-2xs">
                            {member.name ? member.name.charAt(0) : 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-zinc-900 truncate">
                              {member.name}
                            </p>
                            <p className="text-[11px] text-zinc-400 truncate">{member.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            member.role === 'ADMIN'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                          }`}>
                            {member.role || 'MEMBER'}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id)}
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

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMemberModalOpen(false)}
                className="text-xs text-zinc-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
