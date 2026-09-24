# DevFlow — Frontend

> **React 19 + Vite 8** single-page application for the DevFlow project management platform.  
> Kanban boards with real-time drag-and-drop, workspaces, and rich card details.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Component Hierarchy](#component-hierarchy)
- [State Management](#state-management)
- [Services Layer](#services-layer)
- [Real-Time Integration](#real-time-integration)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)

---

## Overview

The DevFlow frontend is a fully client-rendered **React 19** SPA built with **Vite 8** and written in **TypeScript**. It connects to the DevFlow REST API and maintains a persistent WebSocket connection per board for real-time collaboration.

Design philosophy:
- **Glassmorphism & off-white aesthetic** with Zinc colour palette
- **Micro-animations** on hover, drag, and modal transitions
- **Single Responsibility**: every file ≤ 300 lines; pages delegate to extracted components and hooks
- **Zero prop-drilling**: context handles auth and routing; hooks own data-fetching logic

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Bundler | Vite 8 |
| Language | TypeScript 6 |
| Styling | TailwindCSS 3 + custom CSS variables |
| UI Components | shadcn/ui (Radix primitives) |
| Icons | Lucide React |
| Drag & Drop | `@hello-pangea/dnd` (React 18/19 fork of `react-beautiful-dnd`) |
| Real-Time | `socket.io-client` 4 |
| HTTP Client | Axios |
| Font | Geist Variable (`@fontsource-variable/geist`) |

---

## Architecture

```
Page (route entry point)
  └── Custom Hook  (data fetching, business logic, socket subscriptions)
        └── Service  (API calls via Axios — one file per entity)
              └── Component  (pure, prop-driven UI building blocks)
                    └── Context  (global auth state, client-side router)
```

Routing is custom — a lightweight `RouterContext` holds the current view state and a `navigate()` function, keeping bundle size minimal without adding a router library.

---

## Project Structure

```
frontend/src/
├── App.tsx                       # Root — AuthGuard + RouterContext router switch
├── main.tsx                      # React DOM entry point
├── index.css                     # Global design tokens & Tailwind directives
│
├── pages/
│   ├── LoginPage.tsx             # Auth pages (Login + Register)
│   ├── WorkspaceDashboard.tsx    # Main workspace hub (create/switch workspaces)
│   └── BoardPage.tsx             # Kanban board view (orchestrator)
│
├── components/
│   ├── board/
│   │   ├── BoardNavbar.tsx       # Board top bar (search, members, share, logout)
│   │   ├── BoardColumn.tsx       # Kanban column + inline BoardCardItem
│   │   ├── ShareBoardModal.tsx   # Invite/manage board members modal
│   │   ├── AddListForm.tsx       # Add new column form
│   │   ├── types.ts              # Shared board TypeScript types
│   │   └── index.ts             # Barrel export
│   │
│   ├── workspace/
│   │   ├── WorkspaceEmptyState.tsx    # Onboarding UI when no workspaces exist
│   │   ├── WorkspaceSelector.tsx      # Sidebar/dropdown workspace switcher
│   │   ├── WorkspaceHeader.tsx        # Workspace title + action buttons
│   │   ├── WorkspaceBoardGrid.tsx     # Board cards grid with create board CTA
│   │   ├── CreateWorkspaceModal.tsx   # New workspace form modal
│   │   ├── WorkspaceMembersModal.tsx  # Invite/manage workspace members
│   │   ├── WorkspaceSettingsModal.tsx # Edit/delete workspace
│   │   └── index.ts                  # Barrel export
│   │
│   ├── card/
│   │   └── CardDetailModal.tsx   # Full card detail sheet (checklists, labels, comments, due date)
│   │
│   └── ui/                       # shadcn/ui base components (button, card, etc.)
│
├── hooks/
│   ├── useBoardSocket.ts         # Socket.IO event subscriptions for a board
│   ├── useWorkspaces.ts          # Workspace CRUD state & API orchestration
│   └── index.ts                 # Barrel export
│
├── services/
│   ├── api.ts                    # Axios instance with base URL + auth interceptor
│   ├── auth.service.ts           # Login, register, me
│   ├── workspace.service.ts      # Workspace CRUD + members
│   ├── board.service.ts          # Board CRUD + members
│   ├── list.service.ts           # List CRUD + reorder
│   ├── card.service.ts           # Card CRUD + move + checklists + comments
│   ├── user.service.ts           # User listing
│   └── index.ts                 # Barrel export
│
├── context/
│   ├── AuthContext.tsx           # useAuth — user, token, login, logout
│   └── RouterContext.tsx         # useRouter — navigate, boardId, cardId params
│
├── socket/
│   └── socket.ts                # socket.io-client singleton
│
├── constants/
│   └── gradients.ts             # Board background colour presets
│
└── types/
    └── index.ts                 # Global shared TypeScript types
```

---

## Key Features

### Workspaces
- Create, rename, and delete workspaces
- Invite members by email; assign `ADMIN` or `MEMBER` roles
- Empty-state onboarding UI when the user has no workspaces

### Boards
- Create boards within a workspace with custom background colours
- Real-time board updates via Socket.IO room subscriptions
- Share board — invite members with quick-add from registered users

### Kanban (Lists & Cards)
- Unlimited lists (columns) per board
- Drag-and-drop columns horizontally and cards vertically / across columns
- Fractional order indexing — no full re-sort needed on every move

### Card Detail Modal
- Rich text description
- Colour-coded labels
- Checklists with per-item completion tracking and progress bar
- Due date with overdue badge
- Card cover colour
- Comments (threaded, user-attributed)
- Delete card

### Real-Time Collaboration
- All board mutations (card create/move/delete, list create/delete) broadcast instantly via Socket.IO
- Optimistic UI updates for zero perceived latency — server confirmation arrives asynchronously

---

## Component Hierarchy

```
App
├── AuthContext (global)
├── RouterContext (global)
│
├── /login        → LoginPage
├── /             → WorkspaceDashboard
│     ├── WorkspaceSelector
│     ├── WorkspaceHeader
│     ├── WorkspaceBoardGrid
│     ├── WorkspaceEmptyState (conditional)
│     ├── CreateWorkspaceModal
│     ├── WorkspaceMembersModal
│     └── WorkspaceSettingsModal
│
└── /board/:id    → BoardPage
      ├── BoardNavbar
      ├── DragDropContext (@hello-pangea/dnd)
      │   └── BoardColumn[]
      │         └── BoardCardItem[]
      ├── AddListForm
      ├── CardDetailModal
      └── ShareBoardModal
```

---

## State Management

| Concern | Mechanism |
|---------|-----------|
| Auth (user, token) | `AuthContext` — persisted to `localStorage` |
| Routing / current view | `RouterContext` — in-memory state |
| Workspace list + active workspace | `useWorkspaces` hook |
| Board data (lists + cards) | Local `useState` in `BoardPage`, updated via socket events |
| Card detail | `useState<CardDetails>` in `BoardPage`, passed down to modal |

No external state library (Redux/Zustand) is used — the scope and update patterns are simple enough that React context + local state handles everything cleanly.

---

## Services Layer

All API communication is centralised in `src/services/`. Each service file:
- Imports the shared **Axios instance** (`services/api.ts`) which automatically attaches the JWT from `localStorage`
- Returns typed responses via TypeScript interfaces
- Contains no UI logic

```ts
// Example: workspace.service.ts
export const getWorkspaces = async (): Promise<WorkspaceItem[]> => {
  const res = await API.get('/workspaces');
  return res.data.data;
};
```

---

## Real-Time Integration

```
socket.ts  ──► singleton io() client connected to backend
    │
useBoardSocket(boardId)
    ├── emit('join_board', boardId)   on mount
    ├── on('card_moved', ...)         → setBoard(...)
    ├── on('card_created', ...)       → setBoard(...)
    └── emit('leave_board', boardId) on unmount
```

The `socket.ts` singleton ensures a single persistent connection for the lifetime of the browser session regardless of page navigation.

---

## Getting Started

### Prerequisites

- **Node.js** >= 20
- Backend API running at `http://localhost:5000` (see [backend README](../backend/README.md))

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Set `VITE_API_URL` — see [Environment Variables](#environment-variables).

### 3. Start the dev server

```bash
npm run dev
```

App runs at **`http://localhost:5173`** with hot module replacement.

---

## Environment Variables

Create a `.env` file in `/frontend`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Base URL of the DevFlow backend REST API |

> **Note:** All Vite env vars must be prefixed with `VITE_` to be exposed to the client bundle.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and produce optimised production bundle in `/dist` |
| `npm run preview` | Serve the production build locally for testing |
| `npm run lint` | Run ESLint across all source files |
| `npx tsc --noEmit` | Type-check without emitting output |
