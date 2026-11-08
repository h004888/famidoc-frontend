#!/usr/bin/env node

/**
 * CI/CD Post-Deploy Smoke Test
 * Reads TARGET_URL from environment variable and polls until healthy or timeout.
 */

const targetUrl = process.env.FRONTEND_PROD_URL || process.env.TARGET_URL || process.argv[2];

if (!targetUrl) {
  console.error('[SmokeTest] ❌ Missing target URL! Please provide FRONTEND_PROD_URL environment variable or argument.');
  process.exit(1);
}

const maxRetries = Number(process.env.SMOKE_MAX_RETRIES || 20);
const intervalMs = Number(process.env.SMOKE_INTERVAL_MS || 3000);
const normalizedUrl = targetUrl.endsWith('/api/health') ? targetUrl : `${targetUrl.replace(/\/$/, '')}/api/health`;

console.log(`[SmokeTest] 🚀 Starting post-deployment verification on: ${normalizedUrl}`);
console.log(`[SmokeTest] Settings: maxRetries=${maxRetries}, intervalMs=${intervalMs}`);

async function run() {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Famidoc-CI-SmokeTest/1.0',
        },
      });

      clearTimeout(timer);

      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.status === 'ok') {
          console.log(`[SmokeTest] ✅ Frontend is healthy and serving requests! (Attempt ${attempt}/${maxRetries})`);
          process.exit(0);
        }
      }

      console.log(`[SmokeTest] (${attempt}/${maxRetries}) Received HTTP ${res.status}. Retrying in ${intervalMs / 1000}s...`);
    } catch (err) {
      console.log(`[SmokeTest] (${attempt}/${maxRetries}) Connection error: ${err.message}. Retrying in ${intervalMs / 1000}s...`);
    }

    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  console.error(`[SmokeTest] ❌ Healthcheck failed after ${maxRetries} attempts. Deployment verification FAILED!`);
  process.exit(1);
}

run();
