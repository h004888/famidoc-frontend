import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Dockerfile Healthcheck & Build Args Spec', () => {
  const dockerfilePath = path.resolve(process.cwd(), 'Dockerfile');

  it('contains HEALTHCHECK directive verifying /api/health endpoint', () => {
    const content = fs.readFileSync(dockerfilePath, 'utf-8');
    expect(content).toMatch(/HEALTHCHECK\s+[\s\S]*--interval=[\s\S]*CMD\s+node\s+-e/);
    expect(content).toContain('/api/health');
  });

  it('declares NEXT_PUBLIC_API_URL build argument in builder stage', () => {
    const content = fs.readFileSync(dockerfilePath, 'utf-8');
    expect(content).toMatch(/ARG\s+NEXT_PUBLIC_API_URL/);
    expect(content).toMatch(/ENV\s+NEXT_PUBLIC_API_URL=\$NEXT_PUBLIC_API_URL/);
  });
});
