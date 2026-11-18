import { httpClient } from './http-client';

type Query = Record<string, string | number | boolean | undefined>;
type List<T> = T[] | { items: T[]; total?: number };
type Envelope<T> = {
  data: List<T>;
  meta?: { pagination?: { totalRecords?: number } };
  pagination?: { total?: number };
};

export async function fetchPaginatedList<T>(
  path: string,
  params?: Query & { page?: number; limit?: number },
): Promise<{ data: T[]; total: number }> {
  const pageSize = Math.min(50, params?.limit ?? 50);
  async function fetchPage(page: number) {
    const response = await httpClient.get<Envelope<T> | List<T>>(
      path, { ...params, page, limit: pageSize }, { cache: 'no-store' },
    );
    const envelope = 'data' in response ? response : undefined;
    const list = envelope?.data ?? (response as List<T>);
    const data = Array.isArray(list) ? list : list.items;
    const total = envelope?.meta?.pagination?.totalRecords ?? envelope?.pagination?.total ??
      (Array.isArray(list) ? undefined : list.total) ?? data.length;
    return { data, total };
  }

  const first = await fetchPage(params?.page ?? 1);
  if (params?.page !== undefined || params?.limit !== undefined) return first;
  const data = [...first.data];
  for (let page = 2; page <= Math.ceil(first.total / pageSize); page++) {
    const result = await fetchPage(page);
    data.push(...result.data);
  }
  return { data, total: first.total };
}
