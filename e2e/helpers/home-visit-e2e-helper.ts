import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';

export const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:4000';
export const FRONTEND_URL = process.env.E2E_FRONTEND_URL || 'http://localhost:3000';
const SEED_SCRIPT = path.resolve(
  __dirname,
  '..',
  'scripts',
  'home-visit-2tier-e2e-seed.py',
);

export function originForRole(feRole: string): string {
  const url = new URL(FRONTEND_URL);
  if (url.hostname === 'localhost') {
    if (feRole === 'DOCTOR') return `${url.protocol}//bacsi.localhost:${url.port || '3000'}`;
    if (feRole === 'ADMIN') return `${url.protocol}//admin.localhost:${url.port || '3000'}`;
    if (feRole === 'FACILITY') return `${url.protocol}//csyt.localhost:${url.port || '3000'}`;
  }
  return FRONTEND_URL;
}

export function runHomeVisitSeedScript<T>(action: 'seed' | 'inspect' | 'cleanup'): T {
  const out = execFileSync('python', [SEED_SCRIPT, action], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(out) as T;
}

function mapRoleToFrontendCookie(backendRole: string): string {
  if (backendRole === 'FAMILY_REP') return 'FAMILY';
  if (backendRole === 'HEALTHCARE_FACILITY') return 'FACILITY';
  return backendRole;
}

export async function loginRealSession(
  page: Page,
  email: string,
  password: string,
): Promise<{ origin: string; role: string }> {
  const res = await page.request.post(`${BACKEND_URL}/api/v1/auth/login`, {
    data: { email, password },
  });
  expect(res.ok(), `Login failed for ${email}: ${await res.text()}`).toBeTruthy();
  const envelope = await res.json();
  const payload = envelope?.data ?? envelope;
  const accessToken: string = payload.accessToken;
  const refreshToken: string = payload.refreshToken || '';
  const user = payload.user;
  const feRole = mapRoleToFrontendCookie(payload.role || user?.role || '');

  const authUser = {
    id: user.id,
    name: user.fullName || user.email,
    phone: user.phone || '',
    email: user.email,
    role: feRole,
    avatarText: (user.fullName || 'E2').slice(0, 2).toUpperCase(),
    mustChangePassword: false,
  };

  const targetOrigin = originForRole(feRole);
  await page.goto(`${targetOrigin}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ token, refresh, role, userJson }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem('famidoc_token', token);
      window.localStorage.setItem('famidoc_role', role);
      window.localStorage.setItem('famidoc_user', userJson);
      if (refresh) window.localStorage.setItem('famidoc_refresh_token', refresh);
    },
    {
      token: accessToken,
      refresh: refreshToken,
      role: feRole,
      userJson: JSON.stringify(authUser),
    },
  );

  await page.context().clearCookies();
  await page.context().addCookies([
    { name: 'famidoc_token', value: accessToken, url: targetOrigin },
    { name: 'famidoc_role', value: feRole, url: targetOrigin },
    {
      name: 'famidoc_user',
      value: encodeURIComponent(JSON.stringify(authUser)),
      url: targetOrigin,
    },
    ...(refreshToken
      ? [{ name: 'famidoc_refresh_token', value: refreshToken, url: targetOrigin }]
      : []),
  ]);

  return { origin: targetOrigin, role: feRole };
}
