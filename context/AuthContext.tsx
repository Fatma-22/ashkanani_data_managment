
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import apiClient from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: string) => Promise<User | null>;
  register: (userData: any) => Promise<User | null>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response: any = await apiClient.get('/me');
          if (response.success) {
            if (response.data.isActive === false) {
              localStorage.removeItem('token');
              setUser(null);
            } else {
              setUser(response.data);
            }
          }
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email: string, password: string, role?: string): Promise<User | null> => {
    const payload: any = { email, password };
    if (role) payload.role = role;
    const response: any = await apiClient.post('/login', payload);
    if (response.success) {
      const userData: User = response.data.user;
      localStorage.setItem('token', response.data.access_token || response.data.token);
      setUser(userData);
      return userData;
    }
    return null;
  };

  const register = async (userData: any): Promise<User | null> => {
    const response: any = await apiClient.post('/register', userData);
    if (response.success) {
      const registeredUser: User = response.data.user;
      localStorage.setItem('token', response.data.access_token || response.data.token);
      setUser(registeredUser);
      return registeredUser;
    }
    return null;
  };

  const logout = async () => {
    try {
      await apiClient.post('/logout');
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, isAuthenticated: !!user, loading }}>
      {!loading && children}
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
