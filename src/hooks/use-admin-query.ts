'use client';

import { useEffect, useState } from 'react';

export function useAdminQuery<T>(load: () => Promise<T>) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    load: () => Promise<T>;
    revision: number;
    data?: T;
    error?: string;
    cause?: unknown;
  }>();

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const data = await load();
        if (active) setResult({ load, revision, data });
      } catch (error) {
        if (active) setResult({
          load, revision,
          error: error instanceof Error ? error.message : 'Không thể tải dữ liệu.',
          cause: error,
        });
      }
    }
    void run();
    return () => { active = false; };
  }, [load, revision]);

  const current = result?.load === load && result.revision === revision ? result : undefined;
  return {
    data: current?.data,
    error: current?.error,
    cause: current?.cause,
    loading: !current,
    refresh: () => setRevision((value) => value + 1),
  };
}
