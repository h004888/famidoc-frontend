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
import {
  getCurrentBrowserHost,
  getCurrentBrowserProto,
  resolveLogoutRedirectUrl,
} from '@/lib/portal-routing';
import { useInitialAuthSession } from './initial-auth-session-context';

interface AuthContextType {
  role: LoginRole;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  applySession: (
    nextRole: LoginRole,
    nextUser: AuthUser,
    token?: string,
    rememberMe?: boolean,
  ) => void;
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

  const applySession = (
    nextRole: LoginRole,
    nextUser: AuthUser,
    token?: string,
    rememberMe = true,
  ) => {
    if (token) {
      httpClient.setToken(token, rememberMe);
    }
    saveAuthSession(nextRole, nextUser, token, rememberMe);
    setRole(nextRole);
    setUser(nextUser);
    setIsAuthenticated(true);
    setIsLoading(false);
  };

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
        applySession(selectedRole, assignedUser, undefined, isRemember);

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

      applySession(assignedRole, assignedUser, data.accessToken, isRemember);

      const isInitialPassword = pwd.startsWith('FamiDoc@');
      const redirectPath = isInitialPassword ? '/change-password' : getDefaultPathForRole(assignedRole);
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
    const storedSession = getStoredAuthSession();
    const activeRole = user?.role || storedSession.role || role;
    const activeToken = httpClient.getToken() || storedSession.token;
    const redirectUrl = resolveLogoutRedirectUrl(
      activeRole,
      getCurrentBrowserHost(),
      getCurrentBrowserProto(),
    );

    if (activeToken && !activeToken.startsWith('jwt-token-')) {
      void authApi.logout(activeToken).catch(() => {});
    }

    clearAuthSession();
    httpClient.clearToken();
    setIsAuthenticated(false);
    setUser(null);
    setRole('FAMILY');

    if (typeof window !== 'undefined') {
      window.location.replace(redirectUrl);
    } else {
      router.push(redirectUrl);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        user,
        isAuthenticated,
        isLoading,
        applySession,
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
  user: null,
  isAuthenticated: false,
  isLoading: false,
  applySession: (nextRole, nextUser, token, rememberMe = true) => {
    if (token) {
      httpClient.setToken(token, rememberMe);
    }
    saveAuthSession(nextRole, nextUser, token, rememberMe);
  },
  login: async () => {},
  logout: () => {},
  getDefaultPathForRole: () => '/family',
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  const initialSession = useInitialAuthSession();

  if (!context) {
    if (initialSession) {
      return {
        ...fallbackAuthContext,
        role: initialSession.role,
        user: initialSession.user,
        isAuthenticated: true,
        isLoading: false,
      };
    }
    return fallbackAuthContext;
  }

  if (context.isLoading && initialSession) {
    return {
      ...context,
      role: initialSession.role,
      user: initialSession.user,
      isAuthenticated: true,
      isLoading: false,
    };
  }

  return context;
}
