import { z } from 'zod';

export const packageItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().min(0),
  period: z.string(),
  tier: z.string(),
  badgeColor: z.enum(['green', 'amber', 'blue', 'red']).default('blue'),
  isPopular: z.boolean().default(false),
  features: z.array(z.string()).min(1),
  doctorTier: z.string().optional(),
});
export type PackageItem = z.infer<typeof packageItemSchema>;

export const packageCatalogFilterSchema = z.object({
  search: z.string().optional(),
  tier: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
});
export type PackageCatalogFilter = z.infer<typeof packageCatalogFilterSchema>;
