import { useEffect } from 'react';
import socket from '../socket/socket';

export interface BoardSocketHandlers {
  onCardMoved?: (card: any) => void;
  onCardCreated?: (card: any) => void;
  onCardUpdated?: (card: any) => void;
  onCardDeleted?: (data: { id: string; listId: string }) => void;
  onListCreated?: (list: any) => void;
  onListMoved?: (data: { listId: string; order: number }) => void;
  onListDeleted?: (data: { id: string }) => void;
  onMemberAdded?: (member: any) => void;
  onMemberRemoved?: (data: { userId: string }) => void;
}

/**
 * Custom hook to manage real-time Socket.IO room joining and event subscriptions for a board
 */
export const useBoardSocket = (boardId: string | null | undefined, handlers: BoardSocketHandlers) => {
  useEffect(() => {
    if (!boardId) return;

    socket.emit('join_board', boardId);

    if (handlers.onCardMoved) socket.on('card_moved', handlers.onCardMoved);
    if (handlers.onCardCreated) socket.on('card_created', handlers.onCardCreated);
    if (handlers.onCardUpdated) socket.on('card_updated', handlers.onCardUpdated);
    if (handlers.onCardDeleted) socket.on('card_deleted', handlers.onCardDeleted);
    if (handlers.onListCreated) socket.on('list_created', handlers.onListCreated);
    if (handlers.onListMoved) socket.on('list_moved', handlers.onListMoved);
    if (handlers.onListDeleted) socket.on('list_deleted', handlers.onListDeleted);
    if (handlers.onMemberAdded) socket.on('member_added', handlers.onMemberAdded);
    if (handlers.onMemberRemoved) socket.on('member_removed', handlers.onMemberRemoved);

    return () => {
      socket.emit('leave_board', boardId);
      if (handlers.onCardMoved) socket.off('card_moved');
      if (handlers.onCardCreated) socket.off('card_created');
      if (handlers.onCardUpdated) socket.off('card_updated');
      if (handlers.onCardDeleted) socket.off('card_deleted');
      if (handlers.onListCreated) socket.off('list_created');
      if (handlers.onListMoved) socket.off('list_moved');
      if (handlers.onListDeleted) socket.off('list_deleted');
      if (handlers.onMemberAdded) socket.off('member_added');
      if (handlers.onMemberRemoved) socket.off('member_removed');
    };
  }, [boardId]);
};
