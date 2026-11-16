import React from 'react';
import { readServerAuthSession } from '@/lib/server-auth-session';
import { InitialAuthSessionProvider } from '../context/initial-auth-session-context';

/**
 * Ranh giới Server Component đọc cookie phiên bên trong `<Suspense>` cục bộ,
 * truyền `initialSession` xuống cây client mà không làm mất static shell tại `RootLayout`.
 */
export async function ServerAuthSessionBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialSession = await readServerAuthSession();

  return (
    <InitialAuthSessionProvider initialSession={initialSession}>
      {children}
    </InitialAuthSessionProvider>
  );
}
