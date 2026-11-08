export interface HealthCheckResponse {
  status: 'ok';
  uptime: number;
  timestamp: string;
}

export async function GET(): Promise<Response> {
  const body: HealthCheckResponse = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  return Response.json(body, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
