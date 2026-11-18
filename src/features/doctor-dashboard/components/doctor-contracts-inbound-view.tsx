'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { FourPartyContract } from '@/features/four-party-contract';
import { contractsApi, doctorsApi, type DoctorProfileDto } from '@/lib/api';
import { useAuth } from '@/features/auth/context/auth-context';

export interface DoctorContractsInboundViewProps {
  initialContracts?: FourPartyContract[];
}

export function DoctorContractsInboundView({
  initialContracts,
}: DoctorContractsInboundViewProps) {
  const { user } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfileDto | null>(null);
  const isControlledByProps = initialContracts !== undefined;
  const [contracts, setContracts] = useState<FourPartyContract[]>(
    initialContracts ?? []
  );
  const [isLoading, setIsLoading] = useState<boolean>(!isControlledByProps);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');
  const [reloadTick, setReloadTick] = useState(0);

  const triggerReload = () => {
    if (isControlledByProps) return;
    setIsLoading(true);
    setLoadError(null);
    setReloadTick((t) => t + 1);
  };

  useEffect(() => {
    let isMounted = true;
    doctorsApi
      .getDoctorMe()
      .then((data) => {
        if (!isMounted) return;
        if (data && data.id) setDoctorProfile(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isControlledByProps) return;
    let active = true;
    async function loadContracts() {
      try {
        const items = await contractsApi.getMedicalContracts({ limit: 50, role: 'DOCTOR' });
        if (!active) return;
        setContracts(items);
        setLoadError(null);
      } catch (err) {
        if (!active) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Không thể tải danh sách hợp đồng phân công.'
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    void loadContracts();
    return () => {
      active = false;
    };
  }, [isControlledByProps, reloadTick]);

  const isContractPendingForDoctor = (c: FourPartyContract) =>
    !c.signatures?.doctor &&
    c.status !== 'ACTIVE' &&
    c.status !== 'DOCTOR_ACCEPTED' &&
    c.status !== 'PENDING_PAYMENT' &&
    c.status !== 'CANCELLED';

  const filteredContracts = contracts.filter((c) => {
    if (filter === 'pending') {
      return isContractPendingForDoctor(c);
    }
    if (filter === 'active') {
      return c.status === 'ACTIVE' || c.status === 'DOCTOR_ACCEPTED';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Profile / Quota status */}
      <Card className="bg-white border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb matching project style */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Link href="/" className="hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/doctor" className="hover:text-primary transition-colors">
              Bác sĩ
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-primary font-semibold">Hợp đồng phụ trách</span>
          </div>
          <Badge variant="outline" className="rounded-full text-xs font-semibold bg-primary/10 text-primary border-primary/20 mb-2">
            <span>Bên C • Bác sĩ gia đình phụ trách</span>
          </Badge>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Danh sách Hợp đồng Y tế Phân công
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý và ký xác nhận trên Documenso để tiếp nhận theo dõi sức khỏe dài hạn cho các hộ gia đình theo chuẩn y khoa FamiDoc.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerReload}
            disabled={isLoading}
            className="rounded-lg text-xs font-semibold"
          >
            Làm mới
          </Button>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-2xs">
            <span className="material-symbols-outlined text-[16px] text-amber-400">medical_services</span>
            <span>BS Gia Đình: {doctorProfile?.doctorName || user?.name || 'Lê Hoàng Nam'}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-right">
            <span className="block text-[11px] text-slate-500 font-medium">Panel Cap / Định biên</span>
            <span className="text-base font-bold text-slate-900 tabular-nums">
              {contracts.filter((c) => c.status === 'ACTIVE').length} / {doctorProfile?.maxPanelCapacity || 30} hộ
            </span>
          </div>
        </div>
      </Card>

      {loadError && (
        <Alert
          role="alert"
          variant="destructive"
          className="rounded-xl bg-rose-50 border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2"
        >
          <AlertDescription>{loadError}</AlertDescription>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={triggerReload}
            className="rounded-md font-semibold"
          >
            Thử lại
          </Button>
        </Alert>
      )}

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <Button
          type="button"
          size="sm"
          variant={filter === 'all' ? 'default' : 'ghost'}
          onClick={() => setFilter('all')}
          className="rounded-lg text-xs font-semibold"
        >
          Tất cả ({contracts.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filter === 'pending' ? 'default' : 'ghost'}
          onClick={() => setFilter('pending')}
          className="rounded-lg text-xs font-semibold"
        >
          Chờ tiếp nhận ({contracts.filter(isContractPendingForDoctor).length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filter === 'active' ? 'default' : 'ghost'}
          onClick={() => setFilter('active')}
          className="rounded-lg text-xs font-semibold"
        >
          Đang phụ trách ({contracts.filter((c) => c.status === 'ACTIVE').length})
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <Card className="bg-white border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs">
          Đang tải danh sách hợp đồng phân công...
        </Card>
      ) : filteredContracts.length === 0 ? (
        <Card className="bg-white border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <p className="text-sm font-semibold">Chưa có hợp đồng nào được phân công</p>
          <p className="text-xs text-slate-400 mt-1">
            Khi hộ gia đình đăng ký gói hoặc Cơ sở y tế phân công hộ gia đình mới, danh sách sẽ hiển thị tại đây.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredContracts.map((contract) => {
            const familySigned =
              Boolean(contract.signatures?.family) || contract.status !== 'DRAFT';
            const isPendingReview = isContractPendingForDoctor(contract);
            return (
              <Card
                key={contract.id}
                className="bg-white border-slate-200 rounded-xl p-5 shadow-sm hover:border-primary/40 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-primary tabular-nums">
                      {contract.contractNumber}
                    </span>
                    {!familySigned ? (
                      <Badge variant="outline" className="text-[11px] font-semibold bg-slate-100 text-slate-700 border-slate-200">
                        Chờ Bên A ký trước
                      </Badge>
                    ) : isPendingReview ? (
                      <Badge variant="outline" className="text-[11px] font-semibold bg-amber-50 text-amber-700 border-amber-200">
                        Chờ bác sĩ ký Documenso
                      </Badge>
                    ) : contract.status === 'PENDING_PAYMENT' ? (
                      <Badge variant="outline" className="text-[11px] font-semibold bg-primary/10 text-primary border-primary/20">
                        Chờ gia đình thanh toán
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                        Đang phụ trách
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{contract.packageName}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Chủ hộ: <strong className="text-slate-800">{contract.familyRepresentativeName}</strong> ({contract.membersCount ?? 1} thành viên)
                    </p>
                    {contract.familyAddress && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        Địa chỉ: {contract.familyAddress}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 tabular-nums">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.packagePrice)}
                  </span>
                  {isPendingReview ? (
                    <Button asChild size="sm" className="rounded-lg text-xs font-semibold">
                      <Link href={`/doctor/contracts/${contract.id}/review`}>
                        Thẩm định &amp; Ký Documenso
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="secondary" size="sm" className="rounded-lg text-xs font-semibold">
                      <Link href={`/doctor/contracts/${contract.id}/review`}>
                        Xem hồ sơ hợp đồng
                      </Link>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      </main>
    </div>
  );
}