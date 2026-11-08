import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('GitHub Actions CI/CD Workflow Spec', () => {
  const workflowPath = path.resolve(process.cwd(), '.github/workflows/ci-cd.yml');

  it('runs production build in quality-gate job', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain('npm run build');
  });

  it('contains ghcr.io registry login and docker build-push step with build-args', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain('ghcr.io');
    expect(content).toContain('docker/login-action');
    expect(content).toContain('docker/build-push-action');
    expect(content).toContain('NEXT_PUBLIC_API_URL');
  });

  it('triggers Dokploy webhook and executes smoke-test verification', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain('DOKPLOY_WEBHOOK_URL');
    expect(content).toContain('smoke-test.mjs');
  });
});
