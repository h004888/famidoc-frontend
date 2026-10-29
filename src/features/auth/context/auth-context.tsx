'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginRole } from '../schemas/auth.schema';
import {
  AuthUser,
  DEFAULT_USERS,
  saveAuthSession,
  clearAuthSession,
  getStoredAuthSession,
} from '@/lib/auth-storage';

interface AuthContextType {
  role: LoginRole;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (role: LoginRole, phone?: string, password?: string) => Promise<void>;
  logout: () => void;
  getDefaultPathForRole: (r: LoginRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getDefaultPathForRole(r: LoginRole): string {
  switch (r) {
    case 'ADMIN':
      return '/admin';
    case 'FACILITY':
      return '/facility';
    case 'DOCTOR':
      return '/doctor';
    case 'FAMILY':
    case 'PATIENT':
    default:
      return '/family';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [role, setRole] = useState<LoginRole>('FAMILY');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync state từ cookies/localStorage khi mount
  useEffect(() => {
    const session = getStoredAuthSession();
    if (session.role && session.token) {
      setRole(session.role);
      setUser(session.user || DEFAULT_USERS[session.role]);
      setIsAuthenticated(true);
    } else {
      setRole('FAMILY');
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  const login = async (selectedRole: LoginRole) => {
    setIsLoading(true);
    const assignedUser = DEFAULT_USERS[selectedRole];
    saveAuthSession(selectedRole, assignedUser);
    setRole(selectedRole);
    setUser(assignedUser);
    setIsAuthenticated(true);
    setIsLoading(false);

    // Chuyển hướng vào trang riêng biệt của Role
    const redirectPath = getDefaultPathForRole(selectedRole);
    if (typeof window !== 'undefined') {
      window.location.replace(redirectPath);
    } else {
      router.push(redirectPath);
    }
  };

  const logout = () => {
    clearAuthSession();
    setIsAuthenticated(false);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    } else {
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        getDefaultPathForRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Fallback an toàn cho test hoặc ngoài provider
const fallbackAuthContext: AuthContextType = {
  role: 'FAMILY',
  user: DEFAULT_USERS.FAMILY,
  isAuthenticated: true,
  isLoading: false,
  login: async () => {},
  logout: () => {},
  getDefaultPathForRole: () => '/family',
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    return fallbackAuthContext;
  }
  return context;
}
