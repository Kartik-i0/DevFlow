import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import API from '../services/api';
import socket from '../socket/socket';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, LayoutGrid, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CardItem {
  id: string;
  title: string;
  description?: string;
  order: number;
  listId: string;
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
  lists: ListColumn[];
}

export const BoardPage: React.FC<{ boardId: string }> = ({ boardId }) => {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [addingCardListId, setAddingCardListId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('')
  const { logout } = useAuth();

  // 1. Fetch Board Details & Join Real-Time Socket Room
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const response = await API.get(`/boards/${boardId}`);
        setBoard(response.data.data);
      } catch (err) {
        console.error('Failed to load board', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();

    // ⚡ Real-Time Socket Room Connection
    socket.emit('join_board', boardId);

    // ⚡ Listen for Real-Time Card Movement from Teammates!
    socket.on('card_moved', (updatedCard: CardItem) => {
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        return {
          ...prevBoard,
          lists: prevBoard.lists.map((list) => {
            // Remove card from old column if moved
            const filteredCards = list.cards.filter((c) => c.id !== updatedCard.id);

            // Add card to target list if matching listId
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

    // ⚡ Listen for Real-Time Card Creation from Teammates!
    socket.on('card_created', (newCard: CardItem) => {
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        return {
          ...prevBoard,
          lists: prevBoard.lists.map((list) => {
            if (list.id === newCard.listId) {
              // Avoid duplicate insertion if creator's client already added it
              if (list.cards.some((c) => c.id === newCard.id)) return list;
              return { ...list, cards: [...list.cards, newCard] };
            }
            return list;
          }),
        };
      });
    });

    // Listen for Real-Time List Creation from Teammates!
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
      socket.off('list_created');
    };
  }, [boardId]);

  // 2. Create Card Handler
  const handleCreateCard = async (listId: string) => {
    if (!newCardTitle.trim()) return;

    try {
      const res = await API.post('/cards', {
        title: newCardTitle,
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
      console.error('Failed to create card', err);
    }
  };


  // 3. Create List Handler
  const handleCreateList = async () => {
  if (!newListTitle.trim()) return;

  try {
    const res = await API.post('/lists', {
      title: newListTitle,
      boardId,
    });

    const createdList = res.data.data;

    // Optimistic state update
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
    console.error('Failed to create column', err);
  }
};


  // 4. Drag & Drop Handler
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a valid drop area
    if (!destination) return;

    // Dropped in the exact same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const targetListId = destination.droppableId;
    const newOrder = (destination.index + 1) * 1000.0;

    // A. OPTIMISTIC UI UPDATE (Move card visually on user's screen immediately)
    setBoard((prevBoard) => {
      if (!prevBoard) return null;

      const newLists = prevBoard.lists.map((list) => {
        // Remove card from source list
        if (list.id === source.droppableId) {
          const updatedCards = Array.from(list.cards);
          const [movedCard] = updatedCards.splice(source.index, 1);

          // If dropped in same list, insert at new index
          if (source.droppableId === targetListId) {
            updatedCards.splice(destination.index, 0, { ...movedCard, order: newOrder });
            return { ...list, cards: updatedCards };
          }
          return { ...list, cards: updatedCards };
        }

        // Add card to target list if different
        if (list.id === targetListId && source.droppableId !== targetListId) {
          const targetCards = Array.from(list.cards);
          const movedCard = prevBoard.lists
            .find((l) => l.id === source.droppableId)
            ?.cards.find((c) => c.id === draggableId);

          if (movedCard) {
            targetCards.splice(destination.index, 0, { ...movedCard, listId: targetListId, order: newOrder });
          }
          return { ...list, cards: targetCards };
        }

        return list;
      });

      return { ...prevBoard, lists: newLists };
    });

    // B. PERSIST TO MYSQL & TRIGGER SOCKET BROADCAST
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-medium">
        Loading Trello Board...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Board Top Navigation Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">{board?.title || 'Kanban Board'}</h1>
        </div>

        <Button variant="ghost" size="sm" onClick={logout} className="text-slate-400 hover:text-white">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </header>

      {/* Main Kanban Workspace */}
      <main className="flex-1 p-6 overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 items-start h-full">
            {board?.lists.map((list) => (
              <div key={list.id} className="w-80 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col max-h-full">
                {/* Column Title Header */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="font-bold text-slate-200 text-sm tracking-wide">{list.title}</h3>
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    {list.cards.length}
                  </span>
                </div>

                {/* Droppable Card Column */}
                <Droppable droppableId={list.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-1 min-h-[150px] space-y-3 overflow-y-auto pr-1"
                    >
                      {list.cards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3.5 bg-slate-800/90 border-slate-700/80 text-slate-100 rounded-xl shadow-sm transition-all hover:border-slate-600 ${
                                snapshot.isDragging ? 'ring-2 ring-indigo-500 shadow-xl scale-105' : ''
                              }`}
                            >
                              <h4 className="font-medium text-sm text-slate-200">{card.title}</h4>
                              {card.description && (
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{card.description}</p>
                              )}
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Add Card Form or Button */}
                {addingCardListId === list.id ? (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Card title..."
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      className="w-full p-2 text-sm bg-slate-800 border border-indigo-500 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none"
                      autoFocus
                    />
                    <textarea
                      placeholder="Add description (optional)..."
                      value={newCardDescription}
                      onChange={(e) => setNewCardDescription(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none resize-none"
                      rows={2}
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleCreateCard(list.id)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
                        Add Card
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAddingCardListId(null)} className="text-slate-400 hover:text-white">
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
                    className="mt-3 w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Card
                  </Button>
                )}
              </div>
            ))}

            {/* Add Column Button or Inline Form */}
            {isAddingList ? (
              <div className="w-80 bg-slate-900 border border-indigo-500 rounded-2xl p-4 flex flex-col gap-3 shrink-0">
                <input
                  type="text"
                  placeholder="Enter column title..."
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleCreateList} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
                    Add Column
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsAddingList(false)} className="text-slate-400 hover:text-white">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setIsAddingList(true)}
                className="w-80 h-14 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 border-dashed rounded-2xl text-slate-400 hover:text-white flex items-center justify-center gap-2 shrink-0 font-medium transition"
              >
                <Plus className="w-5 h-5" /> Add Column
              </Button>
            )}
          </div>
        </DragDropContext>
      </main>
    </div>
  );
};
