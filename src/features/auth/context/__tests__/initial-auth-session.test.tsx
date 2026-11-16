import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  InitialAuthSessionProvider,
  useInitialAuthSession,
  type InitialAuthSession,
} from '../initial-auth-session-context';

function Consumer() {
  const session = useInitialAuthSession();
  return <div data-testid="session">{session ? session.user.name : 'null'}</div>;
}

describe('InitialAuthSessionProvider', () => {
  it('provides initialSession to descendants when wrapped', () => {
    const mockSession: InitialAuthSession = {
      role: 'FAMILY',
      token: 'jwt-123',
      user: {
        id: 'usr-1',
        name: 'Nguyễn Văn An',
        phone: '0912345678',
        role: 'FAMILY',
        avatarText: 'NA',
      },
    };

    const html = renderToStaticMarkup(
      <InitialAuthSessionProvider initialSession={mockSession}>
        <Consumer />
      </InitialAuthSessionProvider>
    );

    expect(html).toContain('Nguyễn Văn An');
  });

  it('falls back to null outside provider', () => {
    const html = renderToStaticMarkup(<Consumer />);
    expect(html).toContain('null');
  });
});
