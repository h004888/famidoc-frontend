'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FileCheck2, Handshake, PlusCircle, RefreshCw } from 'lucide-react';
import type { FourPartyContract } from '@/features/four-party-contract';
import {
  contractsApi,
  extractErrorMessage,
  type StaffingContractItem,
} from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  computeContractTriageCounts,
  type AdminStatusFilter,
  type StaffingStatusFilter,
} from './contract-status-helpers';
import { ContractsKpiStrip } from './contracts-kpi-strip';
import { CreateB2BContractDialog } from './create-b2b-contract-dialog';
import { DocumensoSignDialog } from './documenso-sign-dialog';
import { MedicalContractsTab } from './medical-contracts-tab';
import { StaffingContractsTab } from './staffing-contracts-tab';
import {
  StaffingDetailSheet,
  StaffingSignConfirmDialog,
} from './staffing-detail-sheet';

export function AdminContractsView() {
  const [contracts, setContracts] = useState<FourPartyContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [activeTab, setActiveTab] = useState<'medical' | 'staffing'>('medical');
  const [medicalFilter, setMedicalFilter] = useState<AdminStatusFilter>('ALL');
  const [staffingFilter, setStaffingFilter] = useState<StaffingStatusFilter>('ALL');

  const [selectedContract, setSelectedContract] = useState<FourPartyContract | null>(null);

  const [staffingList, setStaffingList] = useState<StaffingContractItem[]>([]);
  const [isStaffingLoading, setIsStaffingLoading] = useState(false);
  const [selectedStaffing, setSelectedStaffing] = useState<StaffingContractItem | null>(null);
  const [showStaffingSheet, setShowStaffingSheet] = useState(false);
  const [confirmSignStaffing, setConfirmSignStaffing] = useState<StaffingContractItem | null>(null);
  const [signingStaffingId, setSigningStaffingId] = useState<string | null>(null);

  const [showCreateB2BModal, setShowCreateB2BModal] = useState(false);

  const triggerReload = () => {
    setIsLoading(true);
    setIsStaffingLoading(true);
    setLoadError(null);
    setReloadTick((t) => t + 1);
  };

  useEffect(() => {
    let active = true;
    async function loadContracts() {
      try {
        const [items, staffingRes] = await Promise.allSettled([
          contractsApi.getMedicalContracts({ limit: 50 }),
          contractsApi.getStaffingContracts(),
        ]);

        if (!active) return;

        if (items.status === 'fulfilled') {
          setContracts(items.value);
          setLoadError(null);
        } else {
          setLoadError(
            items.reason instanceof Error
              ? items.reason.message
              : 'Không thể tải danh sách hợp đồng y tế từ máy chủ.'
          );
        }

        if (staffingRes.status === 'fulfilled' && staffingRes.value?.data) {
          setStaffingList(staffingRes.value.data);
        }
      } catch (err) {
        if (!active) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Không thể tải danh sách hợp đồng từ máy chủ.'
        );
      } finally {
        if (active) {
          setIsLoading(false);
          setIsStaffingLoading(false);
        }
      }
    }
    void loadContracts();
    return () => {
      active = false;
    };
  }, [reloadTick]);

  const counts = useMemo(
    () => computeContractTriageCounts(contracts, staffingList),
    [contracts, staffingList]
  );

  const handleConfirmSignStaffing = async (contractId: string) => {
    setSigningStaffingId(contractId);
    try {
      await contractsApi.signStaffingContract(contractId, {
        confirmed: true,
        signedPdfUrl: `https://cdn.famidoc.vn/contracts/staffing/${contractId}-admin-signed.pdf`,
        signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });
      toast.success('Admin đã hoàn tất ký số điện tử SmartCA cho Hợp đồng B2B!');
      setConfirmSignStaffing(null);
      setShowStaffingSheet(false);
      triggerReload();
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Lỗi khi ký số hợp đồng B2B.'));
    } finally {
      setSigningStaffingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        breadcrumbs={[
          { label: 'Quản trị hệ thống', href: '/admin' },
          { label: 'Quản lý Hợp đồng & Pháp lý' },
        ]}
        title="Quản lý Hợp đồng & Ký Duyệt Nền tảng (Bên D)"
        description="Theo dõi tiến độ ký số hợp đồng y tế gia đình 4 bên trên Documenso và quản trị hợp đồng khung cung ứng nhân lực B2B."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={triggerReload}
              disabled={isLoading}
              className="rounded-xl bg-white text-xs font-semibold cursor-pointer gap-1.5"
            >
              <RefreshCw
                aria-hidden="true"
                className={cn('h-3.5 w-3.5 text-slate-500', isLoading && 'animate-spin')}
              />
              <span>Làm mới</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === 'staffing' ? 'default' : 'secondary'}
              onClick={() => setShowCreateB2BModal(true)}
              className="rounded-xl text-xs font-semibold cursor-pointer gap-1.5"
            >
              <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Thiết Lập Dự Thảo HĐ B2B</span>
            </Button>
          </>
        }
      />

      {loadError && (
        <Alert variant="destructive" className="rounded-xl border-rose-200 bg-rose-50 text-rose-800">
          <AlertDescription className="flex items-center justify-between gap-3 text-xs sm:text-sm text-rose-800">
            <span>{loadError}</span>
            <Button
              type="button"
              size="xs"
              variant="destructive"
              onClick={triggerReload}
              className="rounded-lg text-xs font-semibold cursor-pointer"
            >
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <ContractsKpiStrip
        activeTab={activeTab}
        medicalFilter={medicalFilter}
        staffingFilter={staffingFilter}
        counts={counts}
        onSelectMedicalFilter={setMedicalFilter}
        onSelectStaffingFilter={setStaffingFilter}
        isMedicalLimitReached={contracts.length === 50}
      />

      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'medical' | 'staffing')}
        className="space-y-4"
      >
        <TabsList variant="line" className="w-full justify-start border-b border-slate-200 rounded-none p-0 h-auto gap-2">
          <TabsTrigger
            value="medical"
            className="flex-none rounded-none border-b-2 border-transparent px-4 py-3 text-xs sm:text-sm font-bold data-[state=active]:border-primary data-[state=active]:text-primary cursor-pointer"
          >
            <FileCheck2 className="h-4 w-4" aria-hidden="true" />
            <span>Hợp Đồng Y Tế Gia Đình (4 Bên)</span>
            <span className="ml-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-primary tabular-nums">
              {contracts.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="staffing"
            className="flex-none rounded-none border-b-2 border-transparent px-4 py-3 text-xs sm:text-sm font-bold data-[state=active]:border-primary data-[state=active]:text-primary cursor-pointer"
          >
            <Handshake className="h-4 w-4" aria-hidden="true" />
            <span>Hợp Đồng Cung Ứng Nhân Lực B2B</span>
            <span className="ml-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-primary tabular-nums">
              {staffingList.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medical" className="mt-0">
          <MedicalContractsTab
            contracts={contracts}
            isLoading={isLoading}
            filterStatus={medicalFilter}
            onFilterStatusChange={setMedicalFilter}
            onSelectContract={setSelectedContract}
            counts={{
              all: contracts.length,
              readyForAdmin: counts.medicalReadyForAdmin,
              waitingFamily: counts.medicalWaitingFamily,
              pendingPayment: counts.medicalPendingPayment,
              active: counts.medicalActive,
              cancelled: counts.medicalCancelled,
            }}
          />
        </TabsContent>

        <TabsContent value="staffing" className="mt-0">
          <StaffingContractsTab
            staffingList={staffingList}
            isLoading={isStaffingLoading}
            filterStatus={staffingFilter}
            onFilterStatusChange={setStaffingFilter}
            signingStaffingId={signingStaffingId}
            onRequestSign={(item) => setConfirmSignStaffing(item)}
            onOpenDetail={(item) => {
              setSelectedStaffing(item);
              setShowStaffingSheet(true);
            }}
            counts={{
              all: staffingList.length,
              draft: counts.staffingDraft,
              readyForAdmin: counts.staffingReadyForAdmin,
              active: counts.staffingActive,
              terminated: counts.staffingTerminated,
            }}
          />
        </TabsContent>
      </Tabs>

      <DocumensoSignDialog
        contract={selectedContract}
        onClose={() => setSelectedContract(null)}
        onSyncCompleted={triggerReload}
      />

      <CreateB2BContractDialog
        open={showCreateB2BModal}
        onOpenChange={setShowCreateB2BModal}
        onCreated={triggerReload}
      />

      <StaffingDetailSheet
        item={selectedStaffing}
        open={showStaffingSheet}
        onOpenChange={setShowStaffingSheet}
        signingStaffingId={signingStaffingId}
        onRequestSign={(item) => setConfirmSignStaffing(item)}
      />

      <StaffingSignConfirmDialog
        item={confirmSignStaffing}
        isSigning={Boolean(confirmSignStaffing && signingStaffingId === confirmSignStaffing.id)}
        onClose={() => setConfirmSignStaffing(null)}
        onConfirm={handleConfirmSignStaffing}
      />
    </div>
  );
}
