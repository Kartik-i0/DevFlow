import React, { createContext, useContext, useState, useEffect } from 'react';

interface RouterContextType {
  path: string;
  navigate: (to: string) => void;
  boardId: string | null;
  cardId: string | null;
  setCardId: (id: string | null) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState(window.location.pathname);
  const [search, setSearch] = useState(window.location.search);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
      setSearch(window.location.search);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string) => {
    if (to !== window.location.pathname + window.location.search) {
      window.history.pushState(null, '', to);
      const url = new URL(window.location.origin + to);
      setPath(url.pathname);
      setSearch(url.search);
    }
  };

  // Helper: extract boardId from /b/:boardId
  let boardId: string | null = null;
  const boardMatch = path.match(/^\/b\/([^/?#]+)/);
  if (boardMatch) {
    boardId = boardMatch[1];
  }

  // Helper: extract cardId from query param ?c=:cardId or ?cardId=:cardId
  const searchParams = new URLSearchParams(search);
  const cardId = searchParams.get('c') || searchParams.get('cardId');

  const setCardId = (id: string | null) => {
    const currentParams = new URLSearchParams(window.location.search);
    if (id) {
      currentParams.set('c', id);
    } else {
      currentParams.delete('c');
      currentParams.delete('cardId');
    }
    const newSearch = currentParams.toString();
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
    navigate(newUrl);
  };

  return (
    <RouterContext.Provider value={{ path, navigate, boardId, cardId, setCardId }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};
