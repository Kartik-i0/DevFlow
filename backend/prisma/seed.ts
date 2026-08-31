import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.activity.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.cardLabel.deleteMany();
  await prisma.label.deleteMany();
  await prisma.cardMember.deleteMany();
  await prisma.card.deleteMany();
  await prisma.list.deleteMany();
  await prisma.board.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'alex@devflow.com',
      name: 'Alex Johnson',
      password: hashedPassword,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'sarah@devflow.com',
      name: 'Sarah Connor',
      password: hashedPassword,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  console.log('👤 Created dummy users: alex@devflow.com, sarah@devflow.com (password: password123)');

  // Create Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'DevFlow HQ Workspace',
      description: 'Primary workspace for DevFlow development team',
      members: {
        create: [
          { userId: user1.id, role: 'ADMIN' },
          { userId: user2.id, role: 'MEMBER' },
        ],
      },
    },
  });

  console.log(`🏢 Created workspace: "${workspace.name}"`);

  // Create Board
  const board = await prisma.board.create({
    data: {
      title: 'DevFlow Main Sprint Board',
      bgImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
      workspaceId: workspace.id,
    },
  });

  console.log(`📋 Created board: "${board.title}" (ID: ${board.id})`);

  // Create Labels for the board
  const labelFrontend = await prisma.label.create({
    data: { name: 'Frontend', color: '#3b82f6', boardId: board.id },
  });
  const labelBackend = await prisma.label.create({
    data: { name: 'Backend', color: '#10b981', boardId: board.id },
  });
  const labelBug = await prisma.label.create({
    data: { name: 'Bug', color: '#ef4444', boardId: board.id },
  });
  const labelFeature = await prisma.label.create({
    data: { name: 'Feature', color: '#8b5cf6', boardId: board.id },
  });

  // Create Lists (Columns)
  const todoList = await prisma.list.create({
    data: {
      title: 'Backlog & To Do 📌',
      order: 1000,
      boardId: board.id,
    },
  });

  const inProgressList = await prisma.list.create({
    data: {
      title: 'In Progress ⚡',
      order: 2000,
      boardId: board.id,
    },
  });

  const reviewList = await prisma.list.create({
    data: {
      title: 'Code Review 🔍',
      order: 3000,
      boardId: board.id,
    },
  });

  const doneList = await prisma.list.create({
    data: {
      title: 'Completed ✅',
      order: 4000,
      boardId: board.id,
    },
  });

  console.log('📝 Created 4 lists: To Do, In Progress, Code Review, Completed');

  // Create Cards in "To Do"
  const card1 = await prisma.card.create({
    data: {
      title: 'Setup Socket.IO Real-time Synchronization',
      description: 'Implement WebSocket listeners for card move, list create, and drag-and-drop events.',
      order: 1000,
      listId: todoList.id,
      labels: {
        create: [{ labelId: labelBackend.id }, { labelId: labelFeature.id }],
      },
      members: {
        create: [{ userId: user1.id }],
      },
    },
  });

  await prisma.card.create({
    data: {
      title: 'Design Dark Mode Glassmorphism Theme',
      description: 'Add Tailwind CSS glassmorphism styles and color palette to the frontend UI components.',
      order: 2000,
      listId: todoList.id,
      labels: {
        create: [{ labelId: labelFrontend.id }],
      },
      members: {
        create: [{ userId: user2.id }],
      },
    },
  });

  // Create Cards in "In Progress"
  const card3 = await prisma.card.create({
    data: {
      title: 'Implement Kanban Drag & Drop with hello-pangea/dnd',
      description: 'Enable smooth dragging of cards between columns and order updates via API.',
      order: 1000,
      listId: inProgressList.id,
      labels: {
        create: [{ labelId: labelFrontend.id }, { labelId: labelFeature.id }],
      },
      members: {
        create: [{ userId: user1.id }, { userId: user2.id }],
      },
    },
  });

  // Create Cards in "Code Review"
  await prisma.card.create({
    data: {
      title: 'Fix path-to-regexp 404 handler crash in Express 5',
      description: 'Update app.all("*") wildcard route handler to app.use() in index.ts.',
      order: 1000,
      listId: reviewList.id,
      labels: {
        create: [{ labelId: labelBackend.id }, { labelId: labelBug.id }],
      },
      members: {
        create: [{ userId: user1.id }],
      },
    },
  });

  // Create Cards in "Completed"
  await prisma.card.create({
    data: {
      title: 'Initialize Prisma Schema & MySQL Database Docker Container',
      description: 'Setup MySQL container with Docker Compose and run Prisma migrations.',
      order: 1000,
      listId: doneList.id,
      labels: {
        create: [{ labelId: labelBackend.id }],
      },
      members: {
        create: [{ userId: user1.id }],
      },
    },
  });

  // Add Comments & Activities
  await prisma.comment.create({
    data: {
      text: 'Drag and drop working smoothly in dev environment! Tested with multiple columns.',
      cardId: card3.id,
      userId: user2.id,
    },
  });

  await prisma.activity.create({
    data: {
      action: 'moved card "Fix path-to-regexp 404 handler" to Code Review',
      boardId: board.id,
      userId: user1.id,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n--- DUMMY DATA CREATED ---');
  console.log(`User 1: alex@devflow.com / password123`);
  console.log(`User 2: sarah@devflow.com / password123`);
  console.log(`Workspace ID: ${workspace.id}`);
  console.log(`Board ID: ${board.id}`);
  console.log('--------------------------\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
