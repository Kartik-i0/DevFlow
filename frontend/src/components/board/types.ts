/**
 * Shared types for the Board feature components.
 */

export interface BoardMemberItem {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string;
  memberId?: string;
}

export interface CardItem {
  id: string;
  title: string;
  description?: string;
  order: number;
  listId: string;
  dueDate?: string | null;
  coverColor?: string | null;
  labels?: Array<{ id?: string; name: string; color: string }>;
  checklists?: any[];
}

export interface ListColumn {
  id: string;
  title: string;
  order: number;
  cards: CardItem[];
}

export interface BoardData {
  id: string;
  title: string;
  bgImage?: string | null;
  lists: ListColumn[];
  members?: BoardMemberItem[];
}
