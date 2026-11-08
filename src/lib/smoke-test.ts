export interface PollHealthCheckOptions {
  url: string;
  maxRetries?: number;
  intervalMs?: number;
  timeoutMs?: number;
}

export async function pollHealthCheck({
  url,
  maxRetries = 15,
  intervalMs = 3000,
  timeoutMs = 5000,
}: PollHealthCheckOptions): Promise<boolean> {
  const normalizedUrl = url.endsWith('/api/health') ? url : `${url.replace(/\/$/, '')}/api/health`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Famidoc-CI-SmokeTest/1.0',
        },
      });

      clearTimeout(timer);

      if (res.ok) {
        const body = (await res.json().catch(() => ({}))) as { status?: string };
        if (body.status === 'ok') {
          console.log(`[SmokeTest] ✅ Endpoint ${normalizedUrl} responded 200 OK on attempt ${attempt}/${maxRetries}.`);
          return true;
        }
      }

      console.warn(`[SmokeTest] Attempt ${attempt}/${maxRetries}: HTTP status ${res.status}. Retrying in ${intervalMs}ms...`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[SmokeTest] Attempt ${attempt}/${maxRetries} failed: ${message}. Retrying in ${intervalMs}ms...`);
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error(`[SmokeTest] ❌ Healthcheck failed after ${maxRetries} attempts on ${normalizedUrl}.`);
}
