# DevFlow — Backend API

> **REST + WebSocket server** powering the DevFlow project management platform.  
> Built with **Express 5**, **Prisma ORM**, **MySQL**, **Socket.IO**, and **TypeScript**.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Real-Time Events (Socket.IO)](#real-time-events-socketio)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)

---

## Overview

The DevFlow backend is a **Node.js/Express 5** REST API with real-time capabilities via **Socket.IO**. It follows the **Controller → Middleware → Route** pattern with a clear separation of concerns across routes, controllers, validators, and middleware layers.

Key responsibilities:
- JWT-based authentication & session management
- Workspace, Board, List, and Card CRUD operations
- Drag-and-drop order persistence using fractional float indexing
- Real-time event broadcasting to connected board rooms via Socket.IO
- Request validation with schema validators per entity

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express 5 |
| Language | TypeScript 5.7 |
| ORM | Prisma 6 |
| Database | MySQL 8.0 |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` |
| Real-Time | Socket.IO 4 |
| Dev Server | `nodemon` + `ts-node` |

---

## Architecture

```
Request
  └── Route          (routes/*.routes.ts)
        └── Middleware (auth, validate, error)
              └── Controller  (controllers/*.controller.ts)
                    └── Prisma Client  (database queries)
                          └── Socket.IO  (real-time broadcast on mutations)
```

Every controller function is wrapped with Express 5's native async error propagation. A global `errorHandler` middleware catches all `AppError` instances and unhandled rejections uniformly.

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # All database models
│   └── seed.ts                # Optional seed data
├── src/
│   ├── index.ts               # App entry — Express + Socket.IO bootstrap
│   ├── config/
│   │   └── prisma.ts          # Singleton Prisma client
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── board.controller.ts
│   │   ├── card.controller.ts
│   │   ├── list.controller.ts
│   │   ├── user.controller.ts
│   │   └── workspace.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT verification & req.user injection
│   │   ├── error.middleware.ts     # Global error handler
│   │   └── validate.middleware.ts  # Request body validation factory
│   ├── routes/
│   │   ├── board.routes.ts
│   │   ├── card.routes.ts
│   │   ├── health.routes.ts
│   │   ├── list.routes.ts
│   │   ├── user.routes.ts
│   │   └── workspace.routes.ts
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── board.validator.ts
│   │   ├── card.validator.ts
│   │   ├── list.validator.ts
│   │   ├── workspace.validator.ts
│   │   └── index.ts
│   ├── utils/
│   │   └── appError.ts            # Custom operational error class
│   └── types/
│       └── express.d.ts           # Extended Express Request typings
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Database Schema

The Prisma schema models the full hierarchy:

```
User
 └── WorkspaceMember  ──► Workspace
                              └── Board
                                    └── List
                                          └── Card
                                                ├── Checklist → ChecklistItem
                                                ├── CardLabel  ──► Label
                                                ├── CardMember ──► User
                                                ├── Comment    ──► User
                                                └── Attachment
```

All entities use **UUID** primary keys. `List.order` and `Card.order` are `Float` columns for fractional drag-and-drop ordering without re-indexing entire collections.

---

## API Reference

All routes are prefixed with `/api/v1`. Protected routes require an `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/users/register` | ✗ | Register a new user |
| `POST` | `/users/login` | ✗ | Login and receive a JWT |
| `GET` | `/users/me` | ✓ | Get the currently authenticated user |
| `GET` | `/users/all` | ✓ | List all registered users |

**Register body:**
```json
{ "name": "Alice", "email": "alice@example.com", "password": "secret123" }
```

**Login response:**
```json
{ "token": "<jwt>", "user": { "id": "...", "name": "Alice", "email": "..." } }
```

---

### Workspaces

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/workspaces` | ✓ | List all workspaces for the current user |
| `POST` | `/workspaces` | ✓ | Create a new workspace |
| `GET` | `/workspaces/:id` | ✓ | Get workspace by ID (with boards & members) |
| `PATCH` | `/workspaces/:id` | ✓ | Update workspace name / description |
| `DELETE` | `/workspaces/:id` | ✓ | Delete workspace and all its boards |
| `POST` | `/workspaces/:id/members` | ✓ | Add a member by email |
| `DELETE` | `/workspaces/:id/members/:userId` | ✓ | Remove a member |

---

### Boards

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/boards` | ✓ | List boards for a workspace (`?workspaceId=`) |
| `POST` | `/boards` | ✓ | Create a board in a workspace |
| `GET` | `/boards/:id` | ✓ | Get full board (lists + cards + members) |
| `PATCH` | `/boards/:id` | ✓ | Update title / background |
| `DELETE` | `/boards/:id` | ✓ | Delete a board |
| `POST` | `/boards/:id/members` | ✓ | Invite a member by email |
| `DELETE` | `/boards/:id/members/:userId` | ✓ | Remove a board member |

---

### Lists

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/lists?boardId=` | ✓ | Get all lists for a board |
| `POST` | `/lists` | ✓ | Create a new list (column) |
| `PATCH` | `/lists/:id` | ✓ | Rename a list |
| `PATCH` | `/lists/:id/order` | ✓ | Reorder column (drag-and-drop) |
| `DELETE` | `/lists/:id` | ✓ | Delete list and all its cards |

---

### Cards

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/cards/:id` | ✓ | Get a card with full details |
| `POST` | `/cards` | ✓ | Create a card in a list |
| `PATCH` | `/cards/:id` | ✓ | Update card (title, description, dueDate, cover, labels) |
| `PATCH` | `/cards/:id/move` | ✓ | Move card to a different list/position |
| `DELETE` | `/cards/:id` | ✓ | Delete a card |
| `POST` | `/cards/:id/checklists` | ✓ | Add a checklist to a card |
| `PATCH` | `/cards/:id/checklists/:clId/items/:itemId` | ✓ | Toggle checklist item completion |
| `POST` | `/cards/:id/comments` | ✓ | Add a comment |

---

## Real-Time Events (Socket.IO)

Clients connect via WebSocket and join a board-specific room. All data mutations broadcast to that room.

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_board` | `boardId: string` | Join a board's real-time room |
| `leave_board` | `boardId: string` | Leave the room on component unmount |

### Server → Client

| Event | Payload | Triggered by |
|-------|---------|-------------|
| `card_created` | `CardItem` | New card added to a list |
| `card_updated` | `CardItem` | Card fields modified |
| `card_moved` | `CardItem` | Card dragged to new position or list |
| `card_deleted` | `{ id: string }` | Card removed |
| `list_created` | `ListColumn` | New list added to the board |
| `list_moved` | `{ listId, order }` | List column reordered |
| `list_deleted` | `{ id: string }` | List removed |
| `member_added` | `BoardMemberItem` | User invited to board |
| `member_removed` | `{ userId: string }` | User removed from board |

---

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **MySQL** 8.0 (or Docker)

### 1. Start the database

```bash
# From the project root
docker-compose up -d
```

This starts a MySQL 8 container on port `3307` with database `devflow_db`.

### 2. Install dependencies

```bash
cd backend
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in the values — see [Environment Variables](#environment-variables).

### 4. Apply Prisma migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start the development server

```bash
npm run dev
```

Server starts at **`http://localhost:5000`**.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | HTTP server port |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_URL` | — | MySQL connection string |
| `JWT_SECRET` | — | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | `7d` | JWT expiry duration |

**Example `.env`:**
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="mysql://root:rootpassword@localhost:3307/devflow_db"
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
```

> **Warning:** Never commit your `.env` file. It is already listed in `.gitignore`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot-reload via `nodemon` |
| `npm run build` | Compile TypeScript to `/dist` |
| `npm run db:seed` | Run `prisma/seed.ts` to populate test data |
| `npx prisma studio` | Open Prisma Studio GUI at `localhost:5555` |
| `npx prisma migrate dev` | Apply pending schema migrations |
| `npx tsc --noEmit` | Type-check without emitting files |
