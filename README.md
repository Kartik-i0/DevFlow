# DevFlow — Full-Stack Real-Time Project Management Platform (Trello Clone)

<div align="center">

![DevFlow](https://img.shields.io/badge/DevFlow-Trello--Clone-6366f1?style=for-the-badge&logo=trello&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL_8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**A high-performance, real-time Kanban project management system built with modern engineering practices, featuring collaborative workspaces, instant drag-and-drop board synchronization, member permission controls, and a signature off-white & zinc design aesthetic.**

[Features](#-key-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [API Documentation](#-api-documentation) • [Real-Time WebSocket Events](#-real-time-websocket-events) • [Demo Credentials](#-demo-credentials)

</div>

---

## 🌟 Key Features

### 🏢 Workspaces & Multi-Tenancy
- **Workspace Lifecycle**: Create, switch, customize, and manage multiple workspaces.
- **Role-Based Access**: Workspace owners and administrators can manage roles (`ADMIN` vs. `MEMBER`).
- **Teammate Autocomplete**: Instant search and 1-click addition of registered teammates to workspaces.
- **Per-Workspace Board Isolation**: Boards are organized and isolated under active workspaces.

### 📋 Interactive Kanban Boards
- **Smooth Drag-and-Drop**: Fluid card and column reordering powered by `@hello-pangea/dnd`.
- **Automated Starter Lists**: New boards automatically provision standard workflow columns ("To Do", "In Progress", "Done").
- **Isolated List Creation**: Zero event interference with drag monitors when creating lists.
- **Card Filters**: Real-time keyword filter input in the board navigation bar.

### 👥 Real-Time Board Collaboration
- **Add & Share Members**: Invite team members by email or quick-add from workspace users.
- **Live Avatar Stacks**: Shows active members in the board header with role badges.
- **Socket.IO Room Synchronization**: Instant multi-user broadcasts for cards moved, lists created/reordered, and members joined.

### 🔍 Rich Card Details Modal
- **Checklists**: Dynamic task checklists with progress percentage meters.
- **Labels & Cover Colors**: Visual card priority tags and color accents.
- **Due Dates & Descriptions**: Rich markdown-friendly card descriptions and deadlines.
- **Activity & Comments Feed**: Complete audit trail of card edits and updates.

### 🎨 Trello-Grade Aesthetics
- **Modern Palette**: Tailored `#f4f5f7` canvas with crisp `#ffffff` cards and zinc neutral accents.
- **Segmented Auth UI**: Streamlined Login/Register card with quick demo fill badge and password reveal toggles.
- **Responsive Layout**: Designed for seamless desktop and tablet workflows.

---

## 🏗️ Architecture

```
DevFlow/
├── backend/                  # RESTful API & WebSocket Server
│   ├── prisma/               # Database schema & seed scripts
│   │   ├── schema.prisma     # Relational models (User, Workspace, Board, List, Card, Member)
│   │   └── seed.ts           # Development seed data
│   ├── src/
│   │   ├── config/           # Database (Prisma Client) setup
│   │   ├── controllers/      # Route controllers (Workspace, Board, List, Card, User, Health)
│   │   ├── middleware/       # JWT Authentication & global error handling
│   │   ├── routes/           # Express API routers
│   │   ├── types/            # TypeScript interfaces
│   │   ├── utils/            # Async handler & custom AppError
│   │   └── index.ts          # Server entrypoint with Socket.IO room manager
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                 # Single Page Application
│   ├── src/
│   │   ├── components/       # UI & reusable components (CardDetailModal, shadcn UI)
│   │   ├── context/          # AuthContext & RouterContext
│   │   ├── pages/            # View pages (LoginPage, WorkspaceDashboard, BoardPage)
│   │   ├── services/         # Axios client with interceptors
│   │   ├── socket/           # Socket.IO client instance
│   │   ├── App.tsx           # Application route controller
│   │   └── main.tsx          # React root mount
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
│
└── docker-compose.yml        # MySQL 8.0 container service
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, `@hello-pangea/dnd`, Radix UI, Lucide React, Axios |
| **Backend** | Node.js, Express 5, TypeScript, Prisma ORM, Socket.IO, bcryptjs, JSON Web Tokens (JWT) |
| **Database** | MySQL 8.0 (Containerized via Docker) |
| **Real-time** | WebSocket over Socket.IO Rooms |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Docker & Docker Desktop](https://www.docker.com/) (for MySQL)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

---

### 1. Database Setup (Docker)

Start the MySQL 8.0 container from the project root:

```bash
docker-compose up -d
```

Verify that the container `devflow-mysql` is running:
```bash
docker ps
```
*MySQL will be mapped to host port `3307` (`mysql://root:rootpassword@localhost:3307/devflow_db`).*

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (`.env`):
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="mysql://root:rootpassword@localhost:3307/devflow_db"
   JWT_SECRET="YOUR_SECURE_JWT_SECRET"
   ```

4. Push schema and seed initial data:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server starts at `http://localhost:5000` with live Socket.IO connection.*

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 🔑 Demo Credentials

You can use the built-in credentials below or click the **"Demo Fill"** badge on the login screen:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | Kartik | `kartik@gmail.com` | `password123` |
| **Member** | Alex Johnson | `alex@devflow.com` | `password123` |
| **Member** | Sarah Connor | `sarah@devflow.com` | `password123` |

---

## 📡 API Documentation

All protected routes require a Bearer token in the Authorization header:  
`Authorization: Bearer <token>`

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/user/register` | Register a new user |
| `POST` | `/api/v1/user/login` | Login and receive JWT token |
| `GET` | `/api/v1/users/all` | List all users for teammate autocomplete |

### Workspaces
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/workspaces` | Get all workspaces for the authenticated user |
| `POST` | `/api/v1/workspaces` | Create a new workspace (creator becomes ADMIN) |
| `GET` | `/api/v1/workspaces/:id` | Get workspace details with boards and members |
| `PATCH` | `/api/v1/workspaces/:id` | Update workspace name or description |
| `DELETE` | `/api/v1/workspaces/:id` | Delete workspace and cascade boards |
| `GET` | `/api/v1/workspaces/:id/boards` | Get all boards in a workspace |
| `POST` | `/api/v1/workspaces/:id/members` | Invite teammate to workspace |
| `DELETE` | `/api/v1/workspaces/:id/members/:userId` | Remove member from workspace |

### Boards
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/boards` | List boards (supports `?workspaceId=:id` filter) |
| `POST` | `/api/v1/boards` | Create a new board with starter columns |
| `GET` | `/api/v1/boards/:id` | Get full board with lists, cards, and members |
| `PATCH` | `/api/v1/boards/:id` | Update board title or background theme |
| `DELETE` | `/api/v1/boards/:id` | Delete board and associated columns/cards |
| `GET` | `/api/v1/boards/:id/members` | Get board members |
| `POST` | `/api/v1/boards/:id/members` | Add/Invite member to board |
| `DELETE` | `/api/v1/boards/:id/members/:userId` | Remove member from board |

### Lists & Cards
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/lists` | Create a list column |
| `PATCH` | `/api/v1/lists/:id` | Update list title or order |
| `DELETE` | `/api/v1/lists/:id` | Delete a list column |
| `POST` | `/api/v1/cards` | Create a card in a list |
| `PATCH` | `/api/v1/cards/:id` | Update card title, description, cover, due date, or order |
| `DELETE` | `/api/v1/cards/:id` | Delete card |

---

## ⚡ Real-Time WebSocket Events

The application manages collaborative board rooms via Socket.IO:

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join_board` | Client ➔ Server | `boardId` | Joins the specific board room |
| `leave_board` | Client ➔ Server | `boardId` | Leaves the board room |
| `card_moved` | Server ➔ Room | `CardItem` | Broadcasts when a card is dragged to a new list/position |
| `card_created` | Server ➔ Room | `CardItem` | Broadcasts new card addition |
| `card_updated` | Server ➔ Room | `CardItem` | Broadcasts card edits (cover, details, etc.) |
| `card_deleted` | Server ➔ Room | `{ id, listId }` | Broadcasts card deletion |
| `list_created` | Server ➔ Room | `ListColumn` | Broadcasts new column addition |
| `list_moved` | Server ➔ Room | `{ listId, order }` | Broadcasts column reordering |
| `list_deleted` | Server ➔ Room | `{ id }` | Broadcasts column deletion |
| `member_added` | Server ➔ Room | `BoardMemberItem` | Broadcasts new member joining the board |
| `member_removed` | Server ➔ Room | `{ userId }` | Broadcasts member removal |

---

## 🧪 Production Build & Database Tools

### Database GUI (Prisma Studio)
Inspect your MySQL database tables anytime:
```bash
cd backend
npx prisma studio
```
Access the studio interface at `http://localhost:5555`.

### Production Build
```bash
# Build Backend
cd backend
npm run build

# Build Frontend
cd frontend
npm run build
```

---

## 📄 License
This project is open-source under the [ISC License](LICENSE).