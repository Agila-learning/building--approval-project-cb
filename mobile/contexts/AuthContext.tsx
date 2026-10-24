import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../services/api';
import { User } from '../types';
import { router } from 'expo-router';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (userData: User, authToken?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAuth() {
      try {
        const savedToken = await storage.getToken();
        const savedUser = await storage.getUser();
        if (savedUser) {
          setUser(savedUser);
          setToken(savedToken);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAuth();
  }, []);

  const login = async (userData: User, authToken?: string) => {
    setUser(userData);
    await storage.setUser(userData);
    if (authToken) {
      setToken(authToken);
      await storage.setToken(authToken);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await storage.removeToken();
    await storage.removeUser();
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
