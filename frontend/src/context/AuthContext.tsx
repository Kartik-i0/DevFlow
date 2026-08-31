import React, { createContext, useState, useEffect, useContext } from 'react';
import socket from '../socket/socket';


interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}


interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
    // Initialize state directly from localStorage if user refreshed page
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
  
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  
    // Connect Socket.IO automatically when token exists!
    useEffect(() => {
        if (token) {
        socket.connect();
        } else {
        socket.disconnect();
        }
    }, [token]);
  
    const login = (newToken: string, newUser: User) => {
        console.log('hii');
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };
  
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };
    
    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};


// Custom hook for easy access in components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if(!context){throw new Error('useAuth must be used within an AuthProvider');}
    return context;
};
