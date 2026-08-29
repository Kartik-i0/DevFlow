# DevFlow — Fullstack Trello Clone Architecture & Development Roadmap

DevFlow is designed as a **real-time collaborative Trello clone**. This roadmap outlines the exact domain architecture, database schema, real-time sync engine, and step-by-step development phases to build an authentic Trello experience.

---

## 🏗️ 1. Domain Architecture (Trello vs DevFlow Mapping)

| Trello Concept | DevFlow Database Model | Description |
| :--- | :--- | :--- |
| **Workspace** | `Workspace` | Team environment containing multiple boards & members |
| **Board** | `Board` | Individual Kanban board (e.g., "Sprint 1", "Product Launch") |
| **List / Column** | `List` | Vertically ordered columns (e.g., "To Do", "In Progress", "Done") |
| **Card** | `Card` | Draggable task item with title, description, order, due dates |
| **Card Member** | `CardMember` | Assigned users on a card |
| **Label** | `Label` / `CardLabel` | Color-coded badges attached to cards (e.g., "Bug", "High Priority") |
| **Comment** | `Comment` | Conversation thread on a specific card |
| **Activity Log** | `Activity` | Event log of movements (e.g., "Kartik moved Card X from To Do to Done") |

---

## 🗄️ 2. Comprehensive Trello Prisma Schema Blueprint

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id           String        @id @default(uuid())
  email        String        @unique
  name         String
  password     String
  avatarUrl    String?
  workspaces   WorkspaceMember[]
  cardMembers  CardMember[]
  comments     Comment[]
  activities   Activity[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Workspace {
  id          String            @id @default(uuid())
  name        String
  description String?           @db.Text
  boards      Board[]
  members     WorkspaceMember[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}

model WorkspaceMember {
  id          String    @id @default(uuid())
  role        String    @default("MEMBER") // ADMIN, MEMBER
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model Board {
  id          String   @id @default(uuid())
  title       String
  bgImage     String?  // Custom background wallpaper
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  lists       List[]
  labels      Label[]
  activities  Activity[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model List {
  id        String   @id @default(uuid())
  title     String
  order     Float    // Floating position for reordering columns
  boardId   String
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  cards     Card[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Card {
  id          String       @id @default(uuid())
  title       String
  description String?      @db.Text
  order       Float        // Floating position for drag-and-drop reordering
  dueDate     DateTime?
  listId      String
  list        List         @relation(fields: [listId], references: [id], onDelete: Cascade)
  members     CardMember[]
  labels      CardLabel[]
  comments    Comment[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model CardMember {
  id     String @id @default(uuid())
  cardId String
  card   Card   @relation(fields: [cardId], references: [id], onDelete: Cascade)
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Label {
  id      String      @id @default(uuid())
  name    String
  color   String      // Hex color e.g., #ef4444 (Red), #3b82f6 (Blue)
  boardId String
  board   Board       @relation(fields: [boardId], references: [id], onDelete: Cascade)
  cards   CardLabel[]
}

model CardLabel {
  id      String @id @default(uuid())
  cardId  String
  card    Card   @relation(fields: [cardId], references: [id], onDelete: Cascade)
  labelId String
  label   Label  @relation(fields: [labelId], references: [id], onDelete: Cascade)
}

model Comment {
  id        String   @id @default(uuid())
  text      String   @db.Text
  cardId    String
  card      Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

model Activity {
  id        String   @id @default(uuid())
  action    String   // e.g., "moved card", "created list", "assigned user"
  boardId   String
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

---

## ⚡ 3. Real-Time Engine (Socket.IO Events)

In a Trello clone, WebSockets handle instant synchronization when team members move cards:

```text
User A (Drags Card X to Column 'Done')
  │
  ├──> Sends Socket Event: 'card_moved' { cardId, targetListId, newOrder }
  │
  ├──> Backend updates MySQL (Prisma)
  │
  └──> Socket.IO broadcasts to Board Room ('board_123'): 'card_moved_sync'
        │
        └──> User B's screen automatically animates Card X into 'Done'!
```

### Core Socket Events:
- `join_board` / `leave_board`
- `card_created` / `card_moved` / `card_deleted`
- `list_created` / `list_reordered`
- `member_assigned` / `comment_added`

---

## 🚀 4. Step-by-Step Development Phases

### Phase 1: Trello Schema Alignment (Current Step)
- [x] Docker MySQL + Express + Prisma setup
- [x] User Registration + Login + JWT Auth
- [ ] Update `schema.prisma` with Trello models (`Workspace`, `Board`, `List`, `Card`, `Label`, `Comment`)
- [ ] Run `npx prisma db push`

### Phase 2: Socket.IO Integration
- [ ] Install `socket.io` & `@types/socket.io`
- [ ] Configure `http.createServer(app)` in `src/index.ts`
- [ ] Implement Socket Room joining (`board_room`) & live event emitters

### Phase 3: Trello Backend REST + Realtime Endpoints
- [ ] Workspaces & Boards API (`POST /boards`, `GET /boards/:id`)
- [ ] Lists API (`POST /lists`, `PATCH /lists/reorder`)
- [ ] Cards API (`POST /cards`, `PATCH /cards/move`, `DELETE /cards/:id`)

### Phase 4: Frontend Trello Kanban UI (Vite + React + Tailwind)
- [ ] Initialize React + TypeScript in `frontend/`
- [ ] Add `@hello-pangea/dnd` or `dnd-kit` for fluid drag-and-drop cards & columns
- [ ] Build Glassmorphism Board View, Sidebar, & Modal Card details drawer
- [ ] Connect Socket.IO client (`socket.io-client`) for instant UI sync
