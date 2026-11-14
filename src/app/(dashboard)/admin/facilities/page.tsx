import React from 'react';
import type { Metadata } from 'next';
import { AdminFacilitiesView } from '@/features/admin-facilities';

export const metadata: Metadata = {
  title: 'Quản trị & Thẩm định Cơ sở Y tế | Admin FamiDoc',
  description: 'Trung tâm xét duyệt và kích hoạt cơ sở y tế đối tác nền tảng FamiDoc (Duyệt Cấp 1 & Cấp 2)',
};

export default function AdminFacilitiesPage() {
  return <AdminFacilitiesView />;
}
