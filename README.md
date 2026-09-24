<div align="center">

# DevFlow

### Full-Stack Project Management Platform

**A Trello-inspired Kanban board application with real-time collaboration, workspace management, and rich card details.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)

</div>

---

## What is DevFlow?

DevFlow is a full-stack project management tool modelled after Trello. It lets teams organise work into **Workspaces → Boards → Lists → Cards** with real-time updates across all connected collaborators.

### Highlights

- **Kanban boards** with smooth horizontal + vertical drag-and-drop
- **Real-time collaboration** — any user's card move or update is instantly reflected on every connected screen
- **Workspace management** — create isolated workspaces, invite team members, control roles
- **Rich card details** — descriptions, checklists with progress tracking, labels, due dates with overdue indicators, cover colours, and threaded comments
- **Clean architecture** — monorepo with a fully typed React frontend and an Express REST + Socket.IO backend, both passing `tsc --noEmit` with zero errors

---

## Monorepo Structure

```
DevFlow-ProjectManagement/
├── frontend/               # React 19 + Vite 8 SPA
│   └── README.md           # Frontend-specific documentation
├── backend/                # Express 5 + Prisma + Socket.IO API
│   └── README.md           # Backend-specific documentation
├── docker-compose.yml      # MySQL 8 database container
└── README.md               # This file
```

> Each sub-project has its own detailed README.  
> → [Frontend README](./frontend/README.md)  
> → [Backend README](./backend/README.md)

---

## Tech Stack at a Glance

| | Frontend | Backend |
|---|---|---|
| **Language** | TypeScript 6 | TypeScript 5.7 |
| **Framework** | React 19 + Vite 8 | Express 5 |
| **Styling** | TailwindCSS 3 + shadcn/ui | — |
| **Database** | — | MySQL 8 via Prisma 6 |
| **Real-Time** | socket.io-client 4 | Socket.IO 4 |
| **Auth** | JWT (localStorage) | JWT + bcryptjs |
| **Drag & Drop** | @hello-pangea/dnd | — |
| **HTTP** | Axios | — |
| **Dev Server** | Vite HMR | nodemon + ts-node |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      BROWSER (React SPA)                 │
│                                                          │
│   Page → Custom Hook → Service (Axios)                   │
│                   ↕ WebSocket (Socket.IO Client)         │
└──────────────────────────────┬──────────────────────────┘
                               │ HTTP  /  WS
┌──────────────────────────────▼──────────────────────────┐
│                   BACKEND (Express 5)                    │
│                                                          │
│   Route → Middleware → Controller → Prisma Client       │
│                   ↕ Socket.IO Server (broadcast)         │
└──────────────────────────────┬──────────────────────────┘
                               │ TCP
┌──────────────────────────────▼──────────────────────────┐
│                   DATABASE (MySQL 8)                     │
│   Users · Workspaces · Boards · Lists · Cards           │
│   Checklists · Comments · Labels · Attachments          │
└─────────────────────────────────────────────────────────┘
```

---

## Data Hierarchy

```
User
 └── WorkspaceMember  ──►  Workspace
                                └── Board
                                      └── List  (ordered by Float)
                                            └── Card  (ordered by Float)
                                                  ├── Checklist → ChecklistItem
                                                  ├── Label (board-scoped)
                                                  ├── Comment
                                                  └── Attachment
```

Float-based ordering means drag-and-drop reordering never requires updating every sibling — only the moved item receives a new fractional order value.

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | >= 20 |
| npm | >= 10 |
| Docker + Docker Compose | Any recent version |

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/DevFlow-ProjectManagement.git
cd DevFlow-ProjectManagement
```

---

### 2. Start the database

```bash
docker-compose up -d
```

This starts a **MySQL 8** container:
- Host: `localhost`
- Port: `3307`
- Database: `devflow_db`
- Root password: `rootpassword`

---

### 3. Set up the Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="mysql://root:rootpassword@localhost:3307/devflow_db"
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

Run database migrations:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

Start the dev server:
```bash
npm run dev
# → http://localhost:5000
```

---

### 4. Set up the Frontend

```bash
cd ../frontend
npm install
```

Create `.env`:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

Start the dev server:
```bash
npm run dev
# → http://localhost:5173
```

---

### 5. Open in browser

Navigate to **[http://localhost:5173](http://localhost:5173)**, create an account, and start building boards.

---

## Features

### Workspace Management
| Feature | Description |
|---------|-------------|
| Create workspace | Name + optional description |
| Switch workspaces | Instant sidebar switcher |
| Invite members | By email address; role: `ADMIN` or `MEMBER` |
| Edit / Delete | Full lifecycle management |
| Onboarding state | Clean empty-state UI for new users |

### Board Management
| Feature | Description |
|---------|-------------|
| Create board | Custom title + background colour |
| Share board | Invite collaborators; quick-add from workspace members |
| Real-time sync | All board mutations broadcast via Socket.IO |

### Kanban
| Feature | Description |
|---------|-------------|
| Lists (columns) | Create, rename, delete, drag to reorder |
| Cards | Create, drag vertically within or across lists |
| Filter | Instant full-text card filter in board navbar |

### Card Detail
| Feature | Description |
|---------|-------------|
| Description | Rich plain-text description |
| Labels | Colour-coded tag system |
| Checklists | Multiple checklists, item-level completion, progress bar |
| Due date | Date picker with overdue badge |
| Cover colour | Decorative colour strip on card face |
| Comments | Threaded comments attributed to users |
| Delete | Soft confirmation + optimistic removal |

---

## API Summary

Base URL: `http://localhost:5000/api/v1`

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /users/register`, `POST /users/login`, `GET /users/me` |
| Workspaces | `GET/POST /workspaces`, `GET/PATCH/DELETE /workspaces/:id` |
| Workspace Members | `POST/DELETE /workspaces/:id/members` |
| Boards | `GET/POST /boards`, `GET/PATCH/DELETE /boards/:id` |
| Board Members | `POST/DELETE /boards/:id/members` |
| Lists | `GET/POST /lists`, `PATCH/DELETE /lists/:id`, `PATCH /lists/:id/order` |
| Cards | `GET/POST /cards`, `PATCH/DELETE /cards/:id`, `PATCH /cards/:id/move` |
| Checklists | `POST /cards/:id/checklists`, `PATCH .../items/:itemId` |
| Comments | `POST /cards/:id/comments` |

Full API documentation is in the [backend README](./backend/README.md#api-reference).

---

## Real-Time Events

The Socket.IO server broadcasts the following events to all members of a board room:

```
card_created  •  card_updated  •  card_moved  •  card_deleted
list_created  •  list_moved    •  list_deleted
member_added  •  member_removed
```

---

## Project Structure (Condensed)

```
DevFlow-ProjectManagement/
├── backend/
│   ├── prisma/schema.prisma         # 14 Prisma models
│   └── src/
│       ├── controllers/             # 6 controllers (one per entity)
│       ├── middleware/              # auth, error, validate
│       ├── routes/                  # 6 route files
│       └── validators/              # per-entity request schemas
│
└── frontend/
    └── src/
        ├── pages/                   # LoginPage, WorkspaceDashboard, BoardPage
        ├── components/
        │   ├── board/               # BoardNavbar, BoardColumn, ShareBoardModal, AddListForm
        │   ├── workspace/           # 7 workspace UI components
        │   └── card/                # CardDetailModal
        ├── hooks/                   # useBoardSocket, useWorkspaces
        ├── services/                # 6 service modules (one per entity)
        └── context/                 # AuthContext, RouterContext
```

---

## Development Commands

### Backend

```bash
npm run dev           # Hot-reload dev server
npm run build         # Compile TypeScript → /dist
npx prisma studio     # Visual DB browser at localhost:5555
npx prisma migrate dev # Apply schema changes
npx tsc --noEmit      # Type check
```

### Frontend

```bash
npm run dev           # Vite dev server with HMR
npm run build         # Production bundle
npm run preview       # Preview production build
npm run lint          # ESLint
npx tsc --noEmit      # Type check
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push and open a Pull Request

Please keep component files under **300 lines** and follow the established **Controller → Service → Route** (backend) and **Page → Hook → Service** (frontend) patterns.

---

## License

This project is licensed under the **ISC License**.

---

<div align="center">
  Built with React, Express, Prisma, Socket.IO, and TailwindCSS
</div>