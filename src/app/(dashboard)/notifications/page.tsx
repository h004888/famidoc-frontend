import React from 'react';
import { Metadata } from 'next';
import { NotificationsView } from '@/features/notifications';

export const metadata: Metadata = {
  title: 'Trung Tâm Thông Báo Đa Kênh | FamiDoc Pro',
  description: 'Trung tâm thông báo y tế đa kênh tự động FamiDoc Preclinic Architecture',
};

export default function NotificationsPage() {
  return <NotificationsView />;
}

