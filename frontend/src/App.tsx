import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { BoardPage } from './pages/BoardPage';

function App() {
  const { user, logout } = useAuth();

  // If user is not logged in, render LoginPage
  if (!user) {
    return <LoginPage />;
  }

  // If user is logged in, show Workspace Header
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold">DevFlow Workspace</h1>
          <p className="text-sm text-slate-400">Logged in as {user.name} ({user.email})</p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-sm font-medium transition"
        >
          Sign Out
        </button>
      </div>

      <div className="mt-8 text-center text-slate-400">
        🎉 Authenticated! Real-Time Socket Connection Ready.
      </div>
      <BoardPage boardId='0e36fa9d-0dc8-4bb6-8a58-8c1864394053'/>
    </div>
  );
}

export default App;
