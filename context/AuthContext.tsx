
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  login: (role: UserRole, email?: string, password?: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (role: UserRole, email?: string, password?: string) => {
    // Simulate login
    if (role === UserRole.PUBLIC) {
      setUser({ id: 'guest', name: 'Guest User', email: 'guest@example.com', role: UserRole.PUBLIC });
    } else {
      // In a real app, we would validate email/password here
      const foundUser = MOCK_USERS.find((u) => u.role === role);
      setUser(foundUser || { id: 'temp', name: email || 'User', email: email || 'user@example.com', role });
    }
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
