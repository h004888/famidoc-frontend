'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  contractsApi,
  doctorsApi,
  extractErrorMessage,
  type DoctorProfileDto,
} from '@/lib/api';
import type { FourPartyContract } from '@/features/four-party-contract';

export function DoctorContractsView() {
  const [contracts, setContracts] = useState<FourPartyContract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING_SIGN' | 'ACTIVE'>('ALL');

  // Modal Ký cam kết
  const [showSignModal, setShowSignModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [agreedEthics, setAgreedEthics] = useState(false);

  // Tải thông tin hồ sơ bác sĩ
  useEffect(() => {
    doctorsApi
      .getDoctorMe()
      .then((res: any) => {
        const data =
          res && typeof res === 'object' && 'data' in res && res.data && !Array.isArray(res.data)
            ? res.data
            : res;
        if (data) setDoctorProfile(data);
      })
      .catch((err) => {
        console.warn('Lỗi tải hồ sơ bác sĩ:', err);
      });
  }, []);

  // Tải danh sách hợp đồng y tế từ Backend
  const loadContracts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await contractsApi.getMedicalContracts();
      setContracts(data);
      if (data.length > 0) {
        setSelectedContractId((prev) => {
          if (prev && data.some((c) => c.id === prev)) return prev;
          // Ưu tiên chọn hợp đồng cần bác sĩ ký trước
          const pendingSign = data.find((c) => !c.signatures?.doctor?.signedAt);
          return pendingSign ? pendingSign.id : data[0].id;
        });
      }
    } catch (err) {
      console.warn('Lỗi nạp danh sách hợp đồng của bác sĩ:', err);
      toast.error(extractErrorMessage(err, 'Không thể tải danh sách hợp đồng y tế.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  // Hợp đồng đang xem chi tiết
  const selectedContract = contracts.find((c) => c.id === selectedContractId) || null;

  // Kiểm tra bác sĩ đã ký hợp đồng này chưa
  const isDoctorSigned = Boolean(selectedContract?.signatures?.doctor?.signedAt);

  // Lọc danh sách hợp đồng
  const filteredContracts = contracts.filter((c) => {
    const docSigned = Boolean(c.signatures?.doctor?.signedAt);
    if (filterTab === 'PENDING_SIGN') return !docSigned;
    if (filterTab === 'ACTIVE') return c.status === 'ACTIVE';
    return true;
  });

  const pendingSignCount = contracts.filter((c) => !c.signatures?.doctor?.signedAt).length;

  // Thực hiện ký số Bên D
  const handleExecuteDoctorSign = async () => {
    if (!selectedContract) return;
    if (!agreedEthics) {
      toast.error('Vui lòng tích xác nhận cam kết trách nhiệm y đức trước khi ký.');
      return;
    }

    setSigning(true);
    try {
      await contractsApi.signContract(selectedContract.id, {
        termsHash: `DOC-HASH-${Date.now()}`,
      });

      toast.success(
        `Đã ký số cam kết y đức phụ trách Hộ ${selectedContract.familyRepresentativeName || selectedContract.familyId} thành công!`
      );
      setShowSignModal(false);
      setAgreedEthics(false);
      await loadContracts();
    } catch (err: any) {
      console.warn('Lỗi ký số bác sĩ:', err);
      toast.error(extractErrorMessage(err, 'Không thể hoàn tất chữ ký số bác sĩ trên máy chủ.'));
    } finally {
      setSigning(false);
    }
  };

  const doctorDisplayName =
    (doctorProfile as any)?.fullName || doctorProfile?.doctorName || 'Bác sĩ Phụ trách';
  const doctorCchn =
    doctorProfile?.credentials?.find((c: any) => c.credentialType === 'PRACTICE_LICENSE_CCHN')
      ?.certificateNumber ||
    (doctorProfile as any)?.cchnNumber ||
    'Đang cập nhật CCHN';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-900 font-sans">
      {/* Header Bác sĩ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span className="material-symbols-outlined text-[17px]">stethoscope</span>
            <span>
              {doctorDisplayName} • CCHN: {doctorCchn}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Hợp Đồng Phụ Trách Sức Khỏe Gia Đình &amp; Ký Cam Kết Y Đức
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tiếp nhận phân công phụ trách hộ gia đình từ Cơ sở Y tế, xem xét hồ sơ thành viên và ký cam kết chuyên môn (Bên D)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadContracts}
            disabled={isLoading}
            className="rounded-xl text-xs font-semibold gap-1.5"
            title="Làm mới danh sách hợp đồng"
          >
            <span className={`material-symbols-outlined text-[16px] text-slate-500 ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>Làm mới</span>
          </Button>

          <Button asChild size="sm" className="rounded-xl text-xs font-semibold gap-1.5">
            <Link href="/doctor/encounters">
              <span className="material-symbols-outlined text-[16px]">clinical_notes</span>
              <span>Bàn khám SOAP</span>
            </Link>
          </Button>
        </div>
      </div>

      {isLoading && contracts.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <div className="w-9 h-9 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-500">Đang tải danh sách hợp đồng được phân công...</p>
        </div>
      ) : contracts.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">assignment_late</span>
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">Chưa có hợp đồng nào được phân công</h3>
            <p className="text-xs text-slate-500">
              Hiện tại bạn chưa được phân công hợp đồng chăm sóc gia đình nào. Khi Cơ sở Y tế hoặc Gia đình hoàn tất thiết lập và chỉ định bạn làm Bác sĩ phụ trách, hợp đồng sẽ xuất hiện tại đây.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
            <Link href="/doctor">Về Bảng điều khiển Bác sĩ</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột trái: Danh sách hợp đồng (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Hợp đồng phụ trách ({contracts.length})
              </span>
              {pendingSignCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                  {pendingSignCount} cần ký
                </span>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterTab('ALL')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                  filterTab === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Tất cả ({contracts.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('PENDING_SIGN')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                  filterTab === 'PENDING_SIGN' ? 'bg-white text-amber-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Cần ký ({pendingSignCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('ACTIVE')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                  filterTab === 'ACTIVE' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Hiệu lực ({contracts.filter((c) => c.status === 'ACTIVE').length})
              </button>
            </div>

            {/* Contract Cards List */}
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {filteredContracts.map((c) => {
                const isSelected = c.id === selectedContractId;
                const hasDocSigned = Boolean(c.signatures?.doctor?.signedAt);

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedContractId(c.id)}
                    className={`p-3.5 rounded-2xl cursor-pointer border transition-all text-xs space-y-2 ${
                      isSelected
                        ? 'bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate text-sm">
                          Hộ {c.familyRepresentativeName || 'Gia đình'}
                        </span>
                        <span className="text-[11px] text-slate-500 tabular-nums">
                          {c.contractNumber}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 border ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : !hasDocSigned
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {c.status === 'ACTIVE' ? 'ACTIVE' : !hasDocSigned ? 'Chờ bạn ký' : c.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-slate-100">
                      <div>Gói: <strong>{c.packageName}</strong></div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>{c.membersCount} thành viên</span>
                        <span>{c.packagePrice ? `${c.packagePrice.toLocaleString('vi-VN')} đ` : '—'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cột phải: Chi tiết hợp đồng đang chọn (8 cols) */}
          {selectedContract ? (
            <div className="lg:col-span-8 space-y-6">
              {/* Tiến trình 4 Bên Real-time */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Tiến trình Ký số 4 Bên
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      Hợp đồng số: <span className="font-bold text-primary tabular-nums">{selectedContract.contractNumber}</span>
                    </h3>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
                      isDoctorSigned
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                    }`}
                  >
                    {isDoctorSigned ? 'Bác Sĩ Đã Hoàn Tất Ký Số ✓' : 'Đang Chờ Bạn Ký Cam Kết Y Đức (Bên D)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Party A: Family */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600">1. Đại diện Gia đình</span>
                      <span className="text-emerald-600 material-symbols-outlined text-[18px]">check_circle</span>
                    </div>
                    <div className="mt-2 font-bold text-slate-900 truncate">
                      {selectedContract.familyRepresentativeName || 'Hộ gia đình'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {selectedContract.signatures?.family?.signedAt
                        ? new Date(selectedContract.signatures.family.signedAt).toLocaleDateString('vi-VN')
                        : 'Đã ký xác nhận'}
                    </div>
                  </div>

                  {/* Party B: Platform Admin */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600">2. Nền tảng FamiDoc</span>
                      <span className="text-emerald-600 material-symbols-outlined text-[18px]">check_circle</span>
                    </div>
                    <div className="mt-2 font-bold text-slate-900 truncate">Quản Trị Hệ Thống</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {selectedContract.signatures?.platform?.signedAt
                        ? new Date(selectedContract.signatures.platform.signedAt).toLocaleDateString('vi-VN')
                        : 'Đã duyệt SmartCA'}
                    </div>
                  </div>

                  {/* Party C: Facility */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600">3. Cơ sở y tế</span>
                      <span className="text-emerald-600 material-symbols-outlined text-[18px]">check_circle</span>
                    </div>
                    <div className="mt-2 font-bold text-slate-900 truncate">
                      {selectedContract.facilityName || 'Bệnh viện / Phòng khám'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {selectedContract.signatures?.facility?.signedAt
                        ? new Date(selectedContract.signatures.facility.signedAt).toLocaleDateString('vi-VN')
                        : 'Đã phân công BS'}
                    </div>
                  </div>

                  {/* Party D: Doctor (You) */}
                  <div
                    className={`p-3.5 rounded-xl border text-xs ${
                      isDoctorSigned
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">4. Bác sĩ Phụ trách (Bạn)</span>
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          isDoctorSigned ? 'text-emerald-600' : 'text-blue-600 animate-spin'
                        }`}
                      >
                        {isDoctorSigned ? 'check_circle' : 'progress_activity'}
                      </span>
                    </div>
                    <div className="mt-2 font-bold text-slate-900 truncate">{doctorDisplayName}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      {isDoctorSigned
                        ? selectedContract.signatures?.doctor?.signedAt
                          ? new Date(selectedContract.signatures.doctor.signedAt).toLocaleDateString('vi-VN')
                          : 'Đã ký số Bên D'
                        : 'Chờ bạn ký số'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin Hộ gia đình & Gói chăm sóc */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5 rounded-2xl border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">home</span>
                    <span>Thông Tin Hộ Gia Đình</span>
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-700">
                    <div>Chủ hộ: <strong>{selectedContract.familyRepresentativeName}</strong></div>
                    <div>Số điện thoại: <strong>{selectedContract.familyRepresentativePhone || '—'}</strong></div>
                    {selectedContract.familyRepresentativeEmail && (
                      <div>Email: {selectedContract.familyRepresentativeEmail}</div>
                    )}
                    {selectedContract.familyAddress && (
                      <div>Địa chỉ: {selectedContract.familyAddress}</div>
                    )}
                    <div>Quy mô hộ: <Badge variant="secondary" className="text-[11px]">{selectedContract.membersCount} thành viên</Badge></div>
                  </div>
                </Card>

                <Card className="p-5 rounded-2xl border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">medical_services</span>
                    <span>Quyền Lợi Gói Chăm Sóc</span>
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-700">
                    <div>Tên gói: <strong className="text-primary">{selectedContract.packageName}</strong></div>
                    <div>Thời hạn: <strong>{selectedContract.durationMonths || 12} tháng</strong></div>
                    <div>Giá trị gói: <strong>{selectedContract.packagePrice ? `${selectedContract.packagePrice.toLocaleString('vi-VN')} đ` : '—'}</strong></div>
                    <div>CSYT điều phối: <strong>{selectedContract.facilityName}</strong></div>
                  </div>
                </Card>
              </div>

              {/* SLA & Action Ký số */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <h4 className="text-sm font-bold text-slate-900">Cam Kết Chuyên Môn &amp; Trách Nhiệm Y Đức (SCR-16)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[16px]">home_health</span>
                      <span>Thăm khám tại nhà</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Thực hiện các đợt khám định kỳ tận nơi và kiểm tra thiết bị IoT gia đình.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-teal-700 text-[16px]">videocam</span>
                      <span>Telemedicine 24/7</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Sẵn sàng nhận lịch tư vấn từ xa và kê đơn thuốc điện tử hợp lệ.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-purple-700 text-[16px]">emergency</span>
                      <span>Phản ứng nhanh SLA</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Hỗ trợ khẩn cấp dưới 15 phút khi người thân gia đình báo động cấp cứu.</p>
                  </div>
                </div>

                {/* Nút hành động Ký số */}
                <div className="pt-2">
                  {isDoctorSigned ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-600 text-xl">verified</span>
                        <span>Bạn đã hoàn tất ký cam kết chuyên môn y đức đối với hợp đồng này.</span>
                      </div>
                      <Button asChild size="sm" variant="outline" className="rounded-xl text-xs bg-white text-emerald-900 border-emerald-300">
                        <Link href="/doctor/encounters">Mở Bàn Khám SOAP</Link>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => setShowSignModal(true)}
                      className="w-full py-3.5 h-auto rounded-2xl text-xs sm:text-sm font-bold shadow-md gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">draw</span>
                      <span>Ký Số Chấp Thuận Phụ Trách (Bên D - Bác Sĩ Gia Đình)</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Modal Ký Số Bác Sĩ Phụ Trách */}
      <Dialog open={showSignModal} onOpenChange={setShowSignModal}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-6">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-base font-bold">
              <span className="material-symbols-outlined text-[20px] text-primary">verified_user</span>
              <span>Ký Cam Kết Chuyên Môn Bác Sĩ Gia Đình (Bên D)</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 text-xs text-slate-700 space-y-3">
            <Card className="p-3.5 bg-slate-50 border-slate-200 rounded-xl space-y-1 shadow-none">
              <div className="text-slate-500">Bác sĩ ký cam kết:</div>
              <div className="font-bold text-slate-900 text-sm">{doctorDisplayName}</div>
              <div className="text-slate-600 text-[11px]">Chứng chỉ hành nghề số: <strong>{doctorCchn}</strong></div>
              <div className="text-slate-600 text-[11px]">
                Hộ tiếp nhận: <strong>{selectedContract?.familyRepresentativeName} ({selectedContract?.contractNumber})</strong>
              </div>
            </Card>

            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-700">gavel</span>
                <span>Cam kết trách nhiệm y đức &amp; pháp lý (Thông tư 04/2022/TT-BYT):</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800 leading-relaxed">
                <li>Tuân thủ tuyệt đối quy chế chuyên môn Y học gia đình và pháp luật khám bệnh, chữa bệnh.</li>
                <li>Cập nhật đầy đủ hồ sơ bệnh án điện tử (EMR) sau mỗi lần thăm khám hoặc tư vấn video.</li>
                <li>Không từ chối xử trí khẩn cấp, duy trì đường dây nóng thường trực đối với các thành viên trong hộ.</li>
              </ul>
            </div>

            <label className="flex items-start gap-2.5 pt-2 cursor-pointer select-none">
              <Checkbox
                checked={agreedEthics}
                onCheckedChange={(checked) => setAgreedEthics(checked === true)}
                className="mt-0.5"
              />
              <span className="text-[11px] text-slate-700 font-medium leading-relaxed">
                Tôi đã đọc kỹ hồ sơ và quyền lợi của hộ, tự nguyện tiếp nhận và chấp thuận thực hiện nghĩa vụ Bác sĩ Gia đình phụ trách theo Hợp đồng dịch vụ y tế 4 bên.
              </span>
            </label>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSignModal(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Hủy bỏ
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleExecuteDoctorSign}
              disabled={!agreedEthics || signing}
              className="rounded-xl text-xs font-bold gap-2"
            >
              {signing ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Đang tạo chữ ký số CCHN...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">draw</span>
                  <span>Xác Nhận Ký Số (Bên D)</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
