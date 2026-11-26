import { defineConfig } from 'vite';
import path from 'node:path';
export default defineConfig({
  root: process.cwd(),
  esbuild: { jsx: 'automatic' },
  resolve: { alias: [
    { find: 'next/link', replacement: path.resolve('.payment-settings-preview/link.tsx') },
    { find: '@/features/auth/context/auth-context', replacement: path.resolve('.payment-settings-preview/auth.ts') },
    { find: '@/lib/api/payment-settings.api', replacement: path.resolve('.payment-settings-preview/api.ts') },
    { find: '@', replacement: path.resolve('src') },
  ] },
});
