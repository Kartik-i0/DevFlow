import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';
import API from '../services/api';
import socket from '../socket/socket';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { CardDetailModal, type CardDetails } from '../components/card/CardDetailModal';
import {
  BoardNavbar,
  BoardColumn,
  ShareBoardModal,
  AddListForm,
  type BoardData,
  type BoardMemberItem,
  type CardItem,
  type ListColumn,
} from '../components/board';

// Re-export BoardMemberItem so other files that import from BoardPage.tsx continue to work
export type { BoardMemberItem } from '../components/board';

// ─── Default board for offline/error fallback ───────────────────────────────
const DEFAULT_BOARD: BoardData = {
  id: 'offline',
  title: 'Product Roadmap & Sprint Backlog',
  lists: [
    {
      id: 'col-1',
      title: 'To Do',
      order: 1000,
      cards: [
        { id: 'card-1', title: 'Design high-fidelity UI components', description: 'Follow off-white and zinc styling guidelines with shadcn.', order: 1000, listId: 'col-1' },
        { id: 'card-2', title: 'Setup WebSocket room connection', description: 'Broadcast card movements and updates in real-time.', order: 2000, listId: 'col-1' },
      ],
    },
    {
      id: 'col-2',
      title: 'In Progress',
      order: 2000,
      cards: [
        { id: 'card-3', title: 'Implement Card Details Modal', description: 'Checklists, comments, and due dates.', order: 1000, listId: 'col-2' },
      ],
    },
    {
      id: 'col-3',
      title: 'Done',
      order: 3000,
      cards: [
        { id: 'card-4', title: 'Database Schema & Prisma Migrations', description: 'Configured models for Board, List, Card, and User.', order: 1000, listId: 'col-3' },
      ],
    },
  ],
};

// ─── BoardPage ───────────────────────────────────────────────────────────────
export const BoardPage: React.FC<{ boardId?: string }> = ({ boardId: propBoardId }) => {
  const { boardId: routeBoardId, navigate, cardId: activeCardIdUrl, setCardId: setActiveCardIdUrl } = useRouter();
  const boardId = propBoardId || routeBoardId || '0e36fa9d-0dc8-4bb6-8a58-8c1864394053';
  const { logout } = useAuth();

  // ── Core state ──
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Filter ──
  const [searchQuery, setSearchQuery] = useState('');

  // ── Card detail modal ──
  const [selectedCard, setSelectedCard] = useState<CardDetails | null>(null);

  // ── Inline add-card form ──
  const [addingCardListId, setAddingCardListId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');

  // ── Inline add-list form ──
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  // ── Share / member modal ──
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<BoardMemberItem[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // ── Fetch board + socket setup ──────────────────────────────────────────────
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const response = await API.get(`/boards/${boardId}`);
        setBoard(response.data.data);
      } catch (err) {
        console.warn('Failed to load board from API, using fallback', err);
        setBoard({ ...DEFAULT_BOARD, id: boardId });
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
    socket.emit('join_board', boardId);

    socket.on('card_moved', (updatedCard: CardItem) => {
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lists: prev.lists.map((list) => {
            const filtered = list.cards.filter((c) => c.id !== updatedCard.id);
            if (list.id === updatedCard.listId) {
              return { ...list, cards: [...filtered, updatedCard].sort((a, b) => a.order - b.order) };
            }
            return { ...list, cards: filtered };
          }),
        };
      });
    });

    socket.on('card_created', (newCard: CardItem) => {
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lists: prev.lists.map((list) => {
            if (list.id === newCard.listId) {
              if (list.cards.some((c) => c.id === newCard.id)) return list;
              return { ...list, cards: [...list.cards, newCard] };
            }
            return list;
          }),
        };
      });
    });

    socket.on('card_updated', (updatedCard: CardItem) => {
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.map((c) => (c.id === updatedCard.id ? { ...c, ...updatedCard } : c)),
          })),
        };
      });
    });

    socket.on('card_deleted', ({ id }: { id: string }) => {
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.filter((c) => c.id !== id),
          })),
        };
      });
    });

    socket.on('list_created', (newList: ListColumn) => {
      setBoard((prev) => {
        if (!prev) return null;
        if (prev.lists.some((l) => l.id === newList.id)) return prev;
        return { ...prev, lists: [...prev.lists, newList] };
      });
    });

    socket.on('list_moved', ({ listId, order }: { listId: string; order: number }) => {
      setBoard((prev) => {
        if (!prev) return null;
        const updated = prev.lists.map((l) => (l.id === listId ? { ...l, order } : l)).sort((a, b) => a.order - b.order);
        return { ...prev, lists: updated };
      });
    });

    socket.on('list_deleted', ({ id }: { id: string }) => {
      setBoard((prev) => {
        if (!prev) return null;
        return { ...prev, lists: prev.lists.filter((l) => l.id !== id) };
      });
    });

    socket.on('member_added', (member: BoardMemberItem) => {
      setBoard((prev) => {
        if (!prev) return null;
        const current = prev.members || [];
        if (current.some((m) => m.id === member.id)) return prev;
        return { ...prev, members: [...current, member] };
      });
    });

    socket.on('member_removed', ({ userId }: { userId: string }) => {
      setBoard((prev) => {
        if (!prev) return null;
        return { ...prev, members: (prev.members || []).filter((m) => m.id !== userId) };
      });
    });

    return () => {
      socket.emit('leave_board', boardId);
      ['card_moved', 'card_created', 'card_updated', 'card_deleted', 'list_created', 'list_moved', 'list_deleted', 'member_added', 'member_removed'].forEach((ev) => socket.off(ev));
    };
  }, [boardId]);

  // Open card modal when URL has ?c=:cardId
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

  // ── Member actions ──────────────────────────────────────────────────────────
  const loadAllUsers = async () => {
    try {
      const res = await API.get('/users/all');
      if (res.data.data) setAllUsers(res.data.data);
    } catch (err) {
      console.warn('Failed to load registered users', err);
    }
  };

  const handleAddMember = async (targetUser?: { email: string; id?: string }) => {
    const emailToInvite = targetUser?.email?.trim();
    if (!emailToInvite) return;

    setInviteLoading(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const res = await API.post(`/boards/${boardId}/members`, { email: emailToInvite, role: 'MEMBER' });
      const added = res.data.data;
      setBoard((prev) => {
        if (!prev) return null;
        const current = prev.members || [];
        if (current.some((m) => m.email.toLowerCase() === added.email.toLowerCase())) return prev;
        return { ...prev, members: [...current, added] };
      });
      setInviteSuccess(`Added ${added.name} to the board!`);
      setTimeout(() => setInviteSuccess(''), 3000);
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Failed to add member to board.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this member from the board?')) return;
    setBoard((prev) => {
      if (!prev) return null;
      return { ...prev, members: (prev.members || []).filter((m) => m.id !== userId) };
    });
    try {
      await API.delete(`/boards/${boardId}/members/${userId}`);
    } catch (err) {
      console.warn('Failed to remove member on backend', err);
    }
  };

  // ── Card CRUD ───────────────────────────────────────────────────────────────
  const handleCreateCard = async (listId: string) => {
    if (!newCardTitle.trim()) return;
    try {
      const res = await API.post('/cards', { title: newCardTitle.trim(), description: newCardDescription.trim() || undefined, listId, boardId });
      const created = res.data.data;
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lists: prev.lists.map((l) => {
            if (l.id === listId) {
              if (l.cards.some((c) => c.id === created.id)) return l;
              return { ...l, cards: [...l.cards, created] };
            }
            return l;
          }),
        };
      });
    } catch {
      const fallback: CardItem = { id: 'card_' + Date.now(), title: newCardTitle.trim(), description: newCardDescription.trim() || undefined, order: Date.now(), listId };
      setBoard((prev) => {
        if (!prev) return null;
        return { ...prev, lists: prev.lists.map((l) => l.id === listId ? { ...l, cards: [...l.cards, fallback] } : l) };
      });
    }
    setNewCardTitle('');
    setNewCardDescription('');
    setAddingCardListId(null);
  };

  const handleUpdateCardDetails = async (cardId: string, updates: Partial<CardDetails>) => {
    setBoard((prev) => {
      if (!prev) return null;
      return { ...prev, lists: prev.lists.map((list) => ({ ...list, cards: list.cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)) })) };
    });
    if (selectedCard?.id === cardId) setSelectedCard((prev) => (prev ? { ...prev, ...updates } : null));
    try {
      await API.patch(`/cards/${cardId}`, { ...updates, boardId });
    } catch (err) {
      console.error('Failed to update card details', err);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    setBoard((prev) => {
      if (!prev) return null;
      return { ...prev, lists: prev.lists.map((list) => ({ ...list, cards: list.cards.filter((c) => c.id !== cardId) })) };
    });
    try {
      await API.delete(`/cards/${cardId}?boardId=${boardId}`);
    } catch (err) {
      console.error('Failed to delete card', err);
    }
  };

  // ── List CRUD ───────────────────────────────────────────────────────────────
  const handleCreateList = async () => {
    if (!newListTitle.trim()) return;
    try {
      const res = await API.post('/lists', { title: newListTitle.trim(), boardId });
      const created = res.data.data;
      setBoard((prev) => {
        if (!prev) return null;
        if (prev.lists.some((l) => l.id === created.id)) return prev;
        return { ...prev, lists: [...prev.lists, created] };
      });
    } catch {
      const fallback: ListColumn = { id: 'list_' + Date.now(), title: newListTitle.trim(), order: Date.now(), cards: [] };
      setBoard((prev) => prev ? { ...prev, lists: [...prev.lists, fallback] } : null);
    }
    setNewListTitle('');
    setIsAddingList(false);
  };

  const handleDeleteList = async (listId: string) => {
    if (!window.confirm('Are you sure you want to delete this list and all its cards?')) return;
    setBoard((prev) => prev ? { ...prev, lists: prev.lists.filter((l) => l.id !== listId) } : null);
    try {
      await API.delete(`/lists/${listId}`);
    } catch (err) {
      console.warn('Failed to delete list', err);
    }
  };

  // ── Drag & Drop ─────────────────────────────────────────────────────────────
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'column') {
      if (!board) return;
      const newLists = Array.from(board.lists);
      const [moved] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, moved);
      const newOrder = (destination.index + 1) * 1000.0;
      moved.order = newOrder;
      setBoard({ ...board, lists: newLists });
      try {
        await API.patch(`/lists/${draggableId}/order`, { order: newOrder });
        socket.emit('list_moved', { boardId, listId: draggableId, order: newOrder });
      } catch { /* ignore */ }
      return;
    }

    const targetListId = destination.droppableId;
    const newOrder = (destination.index + 1) * 1000.0;

    setBoard((prev) => {
      if (!prev) return null;
      const newLists = prev.lists.map((list) => {
        if (list.id === source.droppableId) {
          const cards = Array.from(list.cards);
          const [movedCard] = cards.splice(source.index, 1);
          if (source.droppableId === targetListId) {
            cards.splice(destination.index, 0, { ...movedCard, order: newOrder });
          }
          return { ...list, cards };
        }
        if (list.id === targetListId && source.droppableId !== targetListId) {
          const cards = Array.from(list.cards);
          const movedCard = prev.lists.find((l) => l.id === source.droppableId)?.cards.find((c) => c.id === draggableId);
          if (movedCard) cards.splice(destination.index, 0, { ...movedCard, listId: targetListId, order: newOrder });
          return { ...list, cards };
        }
        return list;
      });
      return { ...prev, lists: newLists };
    });

    try {
      await API.patch(`/cards/${draggableId}/move`, { listId: targetListId, order: newOrder, boardId });
    } catch (err) {
      console.error('Failed to persist card movement', err);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center text-zinc-500 font-medium">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading Board...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-zinc-900 flex flex-col font-sans">
      {/* ── Navbar ── */}
      <BoardNavbar
        boardTitle={board?.title || 'DevFlow Board'}
        members={board?.members || []}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onShareClick={() => {
          loadAllUsers();
          setIsMemberModalOpen(true);
        }}
        onBack={() => navigate('/')}
        onLogout={logout}
      />

      {/* ── Kanban Canvas ── */}
      <main className="flex-1 p-6 overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 items-start h-full pb-4">
            <Droppable droppableId="board-columns" direction="horizontal" type="column">
              {(boardProvided) => (
                <div
                  ref={boardProvided.innerRef}
                  {...boardProvided.droppableProps}
                  className="flex gap-4 items-start"
                >
                  {board?.lists.map((list, listIndex) => (
                    <BoardColumn
                      key={list.id}
                      list={list}
                      listIndex={listIndex}
                      searchQuery={searchQuery}
                      addingCardListId={addingCardListId}
                      newCardTitle={newCardTitle}
                      newCardDescription={newCardDescription}
                      onAddCardClick={(id) => {
                        setAddingCardListId(id);
                        setNewCardTitle('');
                        setNewCardDescription('');
                      }}
                      onNewCardTitleChange={setNewCardTitle}
                      onNewCardDescChange={setNewCardDescription}
                      onCreateCard={handleCreateCard}
                      onCancelAddCard={() => setAddingCardListId(null)}
                      onDeleteList={handleDeleteList}
                      onCardClick={(card, listTitle) => {
                        setSelectedCard({ ...card, listTitle });
                        setActiveCardIdUrl(card.id);
                      }}
                    />
                  ))}
                  {boardProvided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Add List Form */}
            <AddListForm
              isAddingList={isAddingList}
              newListTitle={newListTitle}
              onNewListTitleChange={setNewListTitle}
              onAddListClick={() => setIsAddingList(true)}
              onCreateList={handleCreateList}
              onCancelAddList={() => setIsAddingList(false)}
            />
          </div>
        </DragDropContext>
      </main>

      {/* ── Card Details Modal ── */}
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

      {/* ── Share Board Modal ── */}
      <ShareBoardModal
        isOpen={isMemberModalOpen}
        onClose={() => {
          setIsMemberModalOpen(false);
          setInviteError('');
          setInviteSuccess('');
        }}
        members={board?.members || []}
        allUsers={allUsers}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        inviteLoading={inviteLoading}
        inviteError={inviteError}
        inviteSuccess={inviteSuccess}
      />
    </div>
  );
};
