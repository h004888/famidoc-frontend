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
import { httpClient } from '@/lib/api/http-client';
import { authApi, mapBackendRoleToFrontendRole } from '@/lib/api/auth.api';

interface AuthContextType {
  role: LoginRole;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    roleOrIdentifier: string,
    passwordOrPhone?: string,
    password?: string,
    rememberMe?: boolean,
  ) => Promise<void>;
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
    const timer = setTimeout(() => {
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
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const login = async (
    roleOrIdentifier: string,
    passwordOrPhone?: string,
    password?: string,
    rememberMe?: boolean,
  ) => {
    setIsLoading(true);
    const isRemember = rememberMe ?? true;
    try {
      const isRoleCall =
        ['FAMILY', 'PATIENT', 'DOCTOR', 'FACILITY', 'ADMIN'].includes(roleOrIdentifier.toUpperCase()) &&
        !password &&
        !passwordOrPhone?.includes('@') &&
        passwordOrPhone !== 'Password@123';

      if (isRoleCall) {
        const selectedRole = roleOrIdentifier.toUpperCase() as LoginRole;
        const assignedUser = DEFAULT_USERS[selectedRole];
        saveAuthSession(selectedRole, assignedUser, undefined, isRemember);
        setRole(selectedRole);
        setUser(assignedUser);
        setIsAuthenticated(true);
        setIsLoading(false);

        const redirectPath = getDefaultPathForRole(selectedRole);
        if (typeof window !== 'undefined') {
          window.location.replace(redirectPath);
        } else {
          router.push(redirectPath);
        }
        return;
      }

      // Đăng nhập thực tế với Backend NestJS qua authApi.login
      const email = roleOrIdentifier.trim();
      const pwd = password || passwordOrPhone || '';

      const data = await authApi.login({
        email,
        password: pwd,
        rememberMe: isRemember,
      });
      const rawRole = (data.user?.role || data.role || 'FAMILY').toUpperCase();
      const assignedRole = (mapBackendRoleToFrontendRole(rawRole) as LoginRole) || 'FAMILY';
      const assignedUser: AuthUser = {
        id: data.user?.id || 'usr-1',
        name: data.user?.fullName || email,
        email: data.user?.email || email,
        phone: data.user?.phone || '0912345678',
        role: assignedRole,
        avatarText: (data.user?.fullName || email).slice(0, 2).toUpperCase(),
      };

      if (data.accessToken) {
        httpClient.setToken(data.accessToken, isRemember);
      }
      saveAuthSession(assignedRole, assignedUser, data.accessToken, isRemember);
      setRole(assignedRole);
      setUser(assignedUser);
      setIsAuthenticated(true);
      setIsLoading(false);

      const redirectPath = getDefaultPathForRole(assignedRole);
      if (typeof window !== 'undefined') {
        window.location.replace(redirectPath);
      } else {
        router.push(redirectPath);
      }
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    clearAuthSession();
    httpClient.clearToken();
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
  isAuthenticated: false,
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
