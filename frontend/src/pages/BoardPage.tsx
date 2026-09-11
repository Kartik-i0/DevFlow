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
  Kanban
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { CardDetailModal, type CardDetails } from '../components/card/CardDetailModal';

interface CardItem {
  id: string;
  title: string;
  description?: string;
  order: number;
  listId: string;
  dueDate?: string | null;
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

    // Cleanup on unmount
    return () => {
      socket.emit('leave_board', boardId);
      socket.off('card_moved');
      socket.off('card_created');
      socket.off('card_updated');
      socket.off('card_deleted');
      socket.off('list_created');
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

  // 6. Drag & Drop Handler with Fractional Indexing
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

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

        {/* Right: User & Sign Out */}
        <div className="flex items-center gap-3">
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
          <div className="flex gap-4 items-start h-full">
            {board?.lists.map((list) => {
              // Filter cards by search query
              const filteredCards = searchQuery.trim()
                ? list.cards.filter((c) =>
                    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                : list.cards;

              return (
                <div
                  key={list.id}
                  className="w-72 bg-[#ebecf0] border border-zinc-300/40 rounded-2xl p-3 flex flex-col max-h-[85vh] shadow-xs shrink-0"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3 px-1.5">
                    <h3 className="font-bold text-zinc-800 text-sm tracking-tight">{list.title}</h3>
                    <span className="text-xs bg-zinc-200 text-zinc-600 font-semibold px-2 py-0.5 rounded-full">
                      {filteredCards.length}
                    </span>
                  </div>

                  {/* Droppable Card Column */}
                  <Droppable droppableId={list.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 min-h-[100px] space-y-2.5 overflow-y-auto pr-1 transition-colors rounded-xl ${
                          snapshot.isDraggingOver ? 'bg-zinc-300/40' : ''
                        }`}
                      >
                        {filteredCards.map((card, index) => (
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
                                className={`p-3 bg-white border border-zinc-200/90 rounded-xl shadow-xs text-zinc-900 transition-all cursor-pointer group hover:border-zinc-300 hover:shadow-md ${
                                  snapshot.isDragging ? 'ring-2 ring-indigo-500 shadow-2xl scale-105 rotate-1' : ''
                                }`}
                              >
                                <h4 className="font-semibold text-sm text-zinc-800 leading-snug group-hover:text-indigo-600 transition">
                                  {card.title}
                                </h4>

                                {card.description && (
                                  <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">
                                    {card.description}
                                  </p>
                                )}

                                {/* Card Badges (Due Date, Description Icon) */}
                                {(card.description || card.dueDate) && (
                                  <div className="flex items-center gap-3 mt-2.5 text-zinc-400 text-xs">
                                    {card.description && (
                                      <div className="flex items-center gap-1" title="This card has a description">
                                        <AlignLeft className="w-3.5 h-3.5" />
                                      </div>
                                    )}
                                    {card.dueDate && (
                                      <div className="flex items-center gap-1 bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded text-[11px] font-medium">
                                        <Calendar className="w-3 h-3" />
                                        <span>
                                          {new Date(card.dueDate).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                          })}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
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
              );
            })}

            {/* Add Column Button or Inline Form */}
            {isAddingList ? (
              <div className="w-72 bg-[#ebecf0] border border-zinc-300/80 rounded-2xl p-3 flex flex-col gap-2 shrink-0 shadow-xs">
                <input
                  type="text"
                  placeholder="Enter list title..."
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateList}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-7 px-3"
                  >
                    Add List
                  </Button>
                  <Button
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
              <Button
                onClick={() => setIsAddingList(true)}
                className="w-72 h-12 bg-zinc-200/50 hover:bg-zinc-200/80 border border-zinc-300/60 border-dashed rounded-2xl text-zinc-600 hover:text-zinc-900 flex items-center justify-start px-4 gap-2 shrink-0 font-medium text-xs transition"
              >
                <Plus className="w-4 h-4" /> Add another list
              </Button>
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
    </div>
  );
};
