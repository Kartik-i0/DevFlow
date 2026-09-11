import { useAuth } from './context/AuthContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import { LoginPage } from './pages/LoginPage';
import { WorkspaceDashboard } from './pages/WorkspaceDashboard';
import { BoardPage } from './pages/BoardPage';

function AppContent() {
  const { user } = useAuth();
  const { boardId } = useRouter();

  // If user is not logged in, render the clean off-white & gray LoginPage
  if (!user) {
    return <LoginPage />;
  }

  // If URL points to a specific board (/b/:boardId), render the BoardPage
  if (boardId) {
    return <BoardPage boardId={boardId} />;
  }

  // Otherwise, render the Workspace Dashboard
  return <WorkspaceDashboard />;
}

function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}

export default App;
