import { z } from 'zod';

// Schema cho một bác sĩ trong danh bạ
export const doctorItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  specialty: z.string().min(1),
  title: z.string().min(1),
  rating: z.number().min(0).max(5),
  experience: z.number().int().nonnegative(),
  fee: z.number().int().min(0),
  avatarUrl: z.string().url().optional(),
  cchn: z.string().min(1),
});

// Schema cho filter/query params của Doctors Catalog
export const doctorCatalogFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(6),
  specialty: z.string().optional(),
  searchTerm: z.string().optional(),
});

// TypeScript types từ Zod schemas
export type DoctorItem = z.infer<typeof doctorItemSchema>;
export type DoctorCatalogFilter = z.infer<typeof doctorCatalogFilterSchema>;

/**
 * Helper function thuần túy: lọc và phân trang dữ liệu bác sĩ
 */
export function filterAndPaginateDoctors(
  doctors: DoctorItem[],
  filter: DoctorCatalogFilter
): DoctorItem[] {
  let filtered = [...doctors];

  // Lọc theo chuyên khoa
  if (filter.specialty) {
    filtered = filtered.filter((d) => d.specialty === filter.specialty);
  }

  // Lọc theo từ khóa tìm kiếm (tên hoặc CCHN)
  if (filter.searchTerm) {
    const term = filter.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (d) => d.name.toLowerCase().includes(term) || d.cchn.toLowerCase().includes(term)
    );
  }

  // Phân trang
  const start = (filter.page - 1) * filter.limit;
  return filtered.slice(start, start + filter.limit);
}
