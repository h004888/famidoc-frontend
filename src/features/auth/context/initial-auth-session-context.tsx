'use client';

import React, { createContext, useContext } from 'react';
import type { LoginRole } from '../schemas/auth.schema';
import type { AuthUser } from '@/lib/auth-storage';

export interface InitialAuthSession {
  role: LoginRole;
  token: string;
  user: AuthUser;
}

const InitialAuthSessionContext = createContext<InitialAuthSession | null>(null);

export function InitialAuthSessionProvider({
  initialSession,
  children,
}: {
  initialSession: InitialAuthSession | null;
  children: React.ReactNode;
}) {
  return (
    <InitialAuthSessionContext.Provider value={initialSession}>
      {children}
    </InitialAuthSessionContext.Provider>
  );
}

export function useInitialAuthSession(): InitialAuthSession | null {
  return useContext(InitialAuthSessionContext);
}
