import React from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Plus, Trash2, AlignLeft, CheckSquare, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CardItem, ListColumn } from './types';
import type { CardDetails } from '../card/CardDetailModal';

interface Props {
  list: ListColumn;
  listIndex: number;
  searchQuery: string;
  addingCardListId: string | null;
  newCardTitle: string;
  newCardDescription: string;
  onAddCardClick: (listId: string) => void;
  onNewCardTitleChange: (val: string) => void;
  onNewCardDescChange: (val: string) => void;
  onCreateCard: (listId: string) => void;
  onCancelAddCard: () => void;
  onDeleteList: (listId: string) => void;
  onCardClick: (card: CardItem, listTitle: string) => void;
}

export const BoardColumn: React.FC<Props> = ({
  list,
  listIndex,
  searchQuery,
  addingCardListId,
  newCardTitle,
  newCardDescription,
  onAddCardClick,
  onNewCardTitleChange,
  onNewCardDescChange,
  onCreateCard,
  onCancelAddCard,
  onDeleteList,
  onCardClick,
}) => {
  const filteredCards = searchQuery.trim()
    ? list.cards.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : list.cards;

  return (
    <Draggable draggableId={list.id} index={listIndex}>
      {(columnProvided, columnSnapshot) => (
        <div
          ref={columnProvided.innerRef}
          {...columnProvided.draggableProps}
          className={`w-72 bg-[#ebecf0] border border-zinc-300/40 rounded-2xl p-3 flex flex-col max-h-[85vh] shadow-xs shrink-0 transition-shadow ${
            columnSnapshot.isDragging ? 'shadow-2xl ring-2 ring-indigo-500/50 rotate-1' : ''
          }`}
        >
          {/* Column Header (drag handle) */}
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
                onDeleteList(list.id);
              }}
              title="Delete list"
              className="opacity-0 group-hover/header:opacity-100 p-1 text-zinc-400 hover:text-red-600 hover:bg-zinc-200 rounded transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Droppable Card Area */}
          <Droppable droppableId={list.id} type="card">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-1 min-h-[80px] space-y-2.5 overflow-y-auto pr-1 transition-colors rounded-xl ${
                  snapshot.isDraggingOver ? 'bg-zinc-300/40' : ''
                }`}
              >
                {filteredCards.map((card, index) => (
                  <BoardCardItem
                    key={card.id}
                    card={card}
                    index={index}
                    listTitle={list.title}
                    onCardClick={onCardClick}
                  />
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
                onChange={(e) => onNewCardTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onCreateCard(list.id);
                  if (e.key === 'Escape') onCancelAddCard();
                }}
                className="w-full p-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              <textarea
                placeholder="Add more details (optional)..."
                value={newCardDescription}
                onChange={(e) => onNewCardDescChange(e.target.value)}
                className="w-full p-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                rows={2}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => onCreateCard(list.id)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-7 px-3"
                >
                  Add Card
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onCancelAddCard}
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
              onClick={() => onAddCardClick(list.id)}
              className="mt-2.5 w-full justify-start text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/80 rounded-xl text-xs font-semibold"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add a card
            </Button>
          )}
        </div>
      )}
    </Draggable>
  );
};

// ─── Individual Card Item ──────────────────────────────────────────────────────

interface CardItemProps {
  card: CardItem;
  index: number;
  listTitle: string;
  onCardClick: (card: CardItem, listTitle: string) => void;
}

export const BoardCardItem: React.FC<CardItemProps> = ({ card, index, listTitle, onCardClick }) => {
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
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onCardClick(card, listTitle)}
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

          {/* Card Labels */}
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

          {/* Card Badges */}
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
                    isOverdue ? 'bg-red-100 text-red-700 font-semibold' : 'bg-zinc-100 text-zinc-600'
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
};
