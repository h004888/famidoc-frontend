'use client';

import { BanknoteArrowUp, Bell, Landmark, QrCode } from 'lucide-react';
import { AdminPaymentRequestView } from '@/features/admin-contracts/components/admin-payment-request-view';
import { AdminWebhookEventsView } from '@/features/admin-contracts/components/admin-webhook-events-view';
import { AdminReconciliationView, AdminSettlementsView } from '@/features/admin-contracts';
import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const reconciliationTabs = [
  { value: 'settlements', label: 'Chi trả cơ sở y tế', icon: BanknoteArrowUp, View: AdminSettlementsView },
  { value: 'sepay', label: 'Giao dịch ngân hàng', icon: Landmark, View: AdminReconciliationView },
  { value: 'request', label: 'Tạo mã thu tiền', icon: QrCode, View: AdminPaymentRequestView },
  { value: 'webhook', label: 'Thông báo SePay', icon: Bell, View: AdminWebhookEventsView },
];

export default function AdminReconciliationPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Đối soát doanh thu"
        description="Theo dõi tiền vào và chi trả cho các cơ sở y tế."
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
      />
      <Tabs defaultValue="settlements" className="min-w-0 gap-6">
        <TabsList
          aria-label="Công việc đối soát doanh thu"
          className="grid w-full auto-rows-fr grid-cols-2 items-stretch gap-2 rounded-2xl border border-slate-200 bg-white p-2 group-data-[orientation=horizontal]/tabs:h-auto lg:grid-cols-4"
        >
          {reconciliationTabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="group h-auto min-h-14 min-w-0 justify-start gap-2 rounded-xl border-slate-200 bg-slate-50 px-2 py-2.5 text-left text-xs leading-snug whitespace-normal text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-primary focus-visible:ring-primary/35 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:font-semibold data-[state=active]:text-primary-foreground sm:gap-3 sm:px-3 sm:text-sm"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary ring-1 ring-slate-200 group-data-[state=active]:bg-white/15 group-data-[state=active]:text-primary-foreground group-data-[state=active]:ring-white/20">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span>{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {reconciliationTabs.map(({ value, View }) => (
          <TabsContent key={value} value={value}>
            <View />
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}
