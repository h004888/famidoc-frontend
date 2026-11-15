'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  useContractWorkflow,
  updateContractStep,
  resetContractWorkflow,
  INITIAL_DOCTOR_CANDIDATES,
  DoctorCapacityOption,
} from '@/lib/contract-workflow-storage';
import { contractsApi, type StaffingContractItem } from '@/lib/api/contracts.api';

import { facilitiesApi } from '@/lib/api/facilities.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export function FacilityContractsView() {
  const contract = useContractWorkflow();
  const [activeTab, setActiveTab] = useState<'staffing' | 'four_party'>('staffing');
  const [staffingList, setStaffingList] = useState<StaffingContractItem[]>([]);
  const [selectedStaffing, setSelectedStaffing] = useState<StaffingContractItem | null>(null);
  const [showStaffingDetailModal, setShowStaffingDetailModal] = useState(false);
  const [showStaffingSignModal, setShowStaffingSignModal] = useState(false);
  const [showStaffingRejectModal, setShowStaffingRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isStaffingLoading, setIsStaffingLoading] = useState(false);
  const [facilityName, setFacilityName] = useState('Cơ sở Y tế Đối tác');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [doctors] = useState<DoctorCapacityOption[]>(INITIAL_DOCTOR_CANDIDATES);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('DOC-7901');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [capacityError, setCapacityError] = useState<string | null>(null);

  // Nạp danh sách hợp đồng B2B trực tiếp từ Backend API
  const fetchStaffingContracts = async () => {
    setIsStaffingLoading(true);
    try {
      const res = await contractsApi.getStaffingContracts();
      if (res && Array.isArray(res.data)) {
        setStaffingList(res.data);
      } else {
        setStaffingList([]);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách hợp đồng B2B từ Backend:', err);
    } finally {
      setIsStaffingLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    facilitiesApi
      .getMyFacilityProfile()
      .then((data) => {
        if (!isMounted) return;
        if (data?.facilityName) {
          setFacilityName(data.facilityName);
        }
      })
      .catch(() => {});

    fetchStaffingContracts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Ký số hợp đồng B2B trực tiếp trên Backend
  const handleExecuteSignStaffing = async () => {
    if (!selectedStaffing) return;
    setIsStaffingLoading(true);
    try {
      await contractsApi.signStaffingContract(selectedStaffing.id, {
        confirmed: true,
        signedPdfUrl: `https://cdn.famidoc.vn/contracts/staffing/${selectedStaffing.contractNumber}-signed.pdf`,
        signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

      const updated = staffingList.map((c) =>
        c.id === selectedStaffing.id
          ? { ...c, status: 'ACTIVE' as const, facilitySigned: true }
          : c
      );
      setStaffingList(updated);
      setSelectedStaffing({ ...selectedStaffing, status: 'ACTIVE', facilitySigned: true });

      setToastMessage(`Đã ký số điện tử thành công! Hợp đồng B2B ${selectedStaffing.contractNumber} chính thức ACTIVE trên Database.`);
      setShowStaffingSignModal(false);
      setShowStaffingDetailModal(false);
    } catch (err: any) {
      console.warn('Lỗi ký số hợp đồng B2B:', err);
      const msg = err?.message || 'Không thể ký số hợp đồng B2B trên máy chủ.';
      setToastMessage(`[Lỗi] ${msg}`);
    } finally {
      setIsStaffingLoading(false);
    }
  };

  // Từ chối dự thảo hợp đồng B2B
  const handleExecuteRejectStaffing = async () => {
    if (!selectedStaffing || !rejectionReason.trim()) return;
    setIsStaffingLoading(true);
    try {
      await contractsApi.rejectStaffingContract(selectedStaffing.id, rejectionReason.trim());

      const updated = staffingList.map((c) =>
        c.id === selectedStaffing.id
          ? { ...c, status: 'TERMINATED' as const, rejectionReason: rejectionReason.trim() }
          : c
      );
      setStaffingList(updated);
      setSelectedStaffing({ ...selectedStaffing, status: 'TERMINATED', rejectionReason: rejectionReason.trim() });

      setToastMessage(`Đã từ chối dự thảo hợp đồng B2B và gửi yêu cầu đàm phán tới Quản trị viên.`);
      setShowStaffingRejectModal(false);
      setShowStaffingDetailModal(false);
      setRejectionReason('');
    } catch (err: any) {
      console.warn('Lỗi từ chối hợp đồng B2B:', err);
      const msg = err?.message || 'Không thể gửi phản hồi từ chối hợp đồng.';
      setToastMessage(`[Lỗi] ${msg}`);
    } finally {
      setIsStaffingLoading(false);
    }
  };

  if (!contract) return null;

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  const handleSelectDoctor = (doc: DoctorCapacityOption) => {
    if (doc.activePanelCount >= doc.maxPanelCapacity) {
      setCapacityError(
        `Quy tắc BR-04 (Panel Cap Ceilings): Bác sĩ ${doc.name} đã chạm ngưỡng tối đa ${doc.maxPanelCapacity}/${doc.maxPanelCapacity} hộ gia đình. Không thể phân công thêm để đảm bảo an toàn chất lượng chuyên môn y tế!`
      );
      return;
    }
    setCapacityError(null);
    setSelectedDoctorId(doc.id);
  };

  const handleExecuteFacilitySign = () => {
    if (!selectedDoctor) return;
    if (selectedDoctor.activePanelCount >= selectedDoctor.maxPanelCapacity) {
      setCapacityError('Bác sĩ đã quá tải, vui lòng chọn bác sĩ khác!');
      return;
    }

    setSigning(true);
    setTimeout(() => {
      updateContractStep('PENDING_DOCTOR_SIGN', {
        facilitySigned: true,
        facilitySignedAt: new Date().toLocaleString('vi-VN'),
        facilitySignerName: 'GS.TS Nguyễn Văn H. (Phó Giám đốc BV ĐHYD)',
        assignedDoctorId: selectedDoctor.id,
        assignedDoctorName: selectedDoctor.name,
        assignedDoctorTitle: selectedDoctor.title,
      });
      setSigning(false);
      setShowAssignModal(false);
      toast.success(
        `Đã ký số Bệnh viện và phân công Bác sĩ ${selectedDoctor.name} phụ trách Hộ ${contract.familyId}!`
      );
    }, 1200);
  };

  const handleResetDemo = () => {
    resetContractWorkflow();
    fetchStaffingContracts();
    setToastMessage('Đã đồng bộ lại dữ liệu hợp đồng B2B từ máy chủ Backend!');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-900 font-sans">
      {/* Header Điều Phối SCR-22 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span className="material-symbols-outlined text-[17px]">local_hospital</span>
            <span>{facilityName} • Quản Trị Hợp Đồng &amp; Nhân Lực Y Tế</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Hợp Đồng Cung Ứng Nhân Lực B2B &amp; Điều Phối 4 Bên
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý hợp đồng cung ứng nhân lực y tế B2B (Flow 2.1) và điều phối hợp đồng y tế gia đình 4 bên (SCR-22).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDemo}
            className="rounded-xl bg-white text-xs font-semibold cursor-pointer"
            title="Đặt lại trạng thái mẫu để test lại từ đầu"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">restart_alt</span>
            <span>Reset Demo</span>
          </Button>
          <Button asChild variant="secondary" size="sm" className="rounded-xl text-xs font-semibold">
            <Link href="/facility/staff">
              <span className="material-symbols-outlined text-[16px]">group</span>
              <span>Danh bạ Nhân sự BS</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Navigation Tab Bar (Flow 2.1 vs Flow 2.2) */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('staffing')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'staffing'
              ? 'border-[#0052cc] text-[#0052cc]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">handshake</span>
          <span>1. Hợp Đồng Cung Ứng Nhân Lực B2B (Flow 2.1)</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {staffingList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('four_party')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'four_party'
              ? 'border-[#0052cc] text-[#0052cc]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
          <span>2. Hợp Đồng Y Tế 4 Bên &amp; Phân Công Bác Sĩ (SCR-22)</span>
        </button>
      </div>

      {/* PHÂN HỆ 1: HỢP ĐỒNG CUNG ỨNG NHÂN LỰC Y TẾ B2B (FLOW 2.1) */}
      {activeTab === 'staffing' ? (
        <div className="space-y-6">
          {/* Banner thông báo hợp đồng ACTIVE đã sẵn sàng */}
          {staffingList.some((c) => c.status === 'ACTIVE') && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[26px]">verified</span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-800">
                    Hợp đồng Cung ứng Nhân lực B2B đang có hiệu lực (ACTIVE) trên Database!
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Cơ sở y tế của bạn đã đủ điều kiện pháp lý (Gate 3) để khởi tạo tài khoản và phân bổ Bác sĩ trực thuộc.
                  </p>
                </div>
              </div>
              <Link
                href="/facility/staff"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all shrink-0"
              >
                <span>Đi đến Thêm Bác Sĩ Mới</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          )}

          {/* Banner Giới thiệu điều khoản */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0052cc] text-lg">contract</span>
                <span>Hợp Đồng Khung Cung Ứng Nhân Lực Y Tế B2B</span>
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                Thỏa thuận hợp tác giữa <strong>Nền tảng FamiDoc</strong> và <strong>Cơ sở Y tế Đối tác</strong>, quy định phân chia doanh thu theo tỷ lệ cố định (15% Phí Nền tảng / 85% Doanh thu CSYT) và điều kiện pháp lý để kích hoạt đội ngũ Bác sĩ tham gia khám chữa bệnh gia đình.
              </p>
            </div>
            <div className="px-4 py-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1 self-start md:self-auto">
              <div className="text-slate-600 font-medium">Tỷ lệ phân chia chuẩn:</div>
              <div className="font-bold text-[#0052cc] text-sm">85% CSYT • 15% Platform</div>
            </div>
          </div>

          {/* Bảng danh sách hợp đồng B2B */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Danh Sách Hợp Đồng Cung Ứng Nhân Lực</h3>
                <span className="text-xs text-slate-500">Hợp đồng khung B2B do Nền tảng FamiDoc thiết lập và gửi ký kết</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>{staffingList.length} hợp đồng B2B</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Mã Hợp Đồng</th>
                    <th className="py-3 px-4">Đơn Vị Ký Kết</th>
                    <th className="py-3 px-4">Phân Chia Doanh Thu</th>
                    <th className="py-3 px-4">Thời Hạn Hiệu Lực</th>
                    <th className="py-3 px-4">Chữ Ký 2 Bên</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {staffingList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 px-4 text-center">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[24px]">hourglass_top</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">Chưa có dự thảo Hợp đồng Cung ứng Nhân lực B2B</h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              Hợp đồng khung cung ứng nhân lực sẽ do Quản trị viên Nền tảng FamiDoc khởi tạo và gửi sang sau khi Cơ sở y tế hoàn tất duyệt pháp lý. Khi nhận được dự thảo, đơn vị có thể kiểm tra điều khoản và tiến hành ký số SmartCA.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    staffingList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 tracking-wide font-bold text-[#0052cc] whitespace-nowrap">
                        {item.contractNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{item.facilityName}</div>
                        <div className="text-[11px] text-slate-400">ID: {item.id}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800">{item.facilitySharePercent}% CSYT</span>
                        <span className="text-slate-400 text-xs"> / {item.platformSharePercent}% Platform</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap text-slate-600">
                        {new Date(item.validFrom).toLocaleDateString('vi-VN')} - {new Date(item.validTo).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className={`flex items-center gap-1 text-[11px] font-medium ${item.adminSigned ? 'text-emerald-700' : 'text-slate-500'}`}>
                            <span>{item.adminSigned ? '✓' : '○'}</span> Admin: {item.adminSigned ? 'Đã ký số' : 'Chờ ký duyệt'}
                          </span>
                          <span className={`flex items-center gap-1 text-[11px] font-medium ${item.facilitySigned ? 'text-emerald-700' : 'text-amber-600'}`}>
                            <span>{item.facilitySigned ? '✓' : '○'}</span> CSYT: {item.facilitySigned ? 'Đã ký số' : 'Chờ ký xác nhận'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đang Hoạt Động (ACTIVE)
                          </span>
                        )}
                        {item.status === 'DRAFT' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                            Dự Thảo (Chờ CSYT ký)
                          </span>
                        )}
                        {item.status === 'TERMINATED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Đã từ chối / Đàm phán lại
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStaffing(item);
                            setShowStaffingDetailModal(true);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border shadow-2xs ${
                            item.status === 'DRAFT'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.status === 'DRAFT'
                            ? 'Chi Tiết & Ký Số'
                            : item.status === 'ACTIVE'
                            ? 'Xem Hợp Đồng'
                            : 'Xem Chi Tiết'}
                        </button>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* PHÂN HỆ 2: ĐIỀU PHỐI HỢP ĐỒNG 4 BÊN (MEDICAL CONTRACT) HIỆN CÓ */
        <div className="space-y-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Tiến trình Ký số Hợp đồng 4 Bên ({contract.contractCode})
          </span>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              contract.step === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : contract.step === 'PENDING_FACILITY_SIGN'
                ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            {contract.statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">1. Đại diện Gia đình</span>
              <span className="text-emerald-600 material-symbols-outlined text-[18px]">check_circle</span>
            </div>
            <div className="mt-2 text-xs font-bold text-slate-900">{contract.familyHeadName}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">{contract.familySignedAt || 'Đã ký OTP'}</div>
          </div>

            <div className={`p-3.5 rounded-xl border ${contract.adminSigned ? 'border-emerald-200 bg-emerald-50/40' : 'border-amber-200 bg-amber-50/40'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">2. Nền tảng FamiDoc</span>
                <span className={`material-symbols-outlined text-[18px] ${contract.adminSigned ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {contract.adminSigned ? 'check_circle' : 'pending'}
                </span>
              </div>
              <div className="mt-2 text-xs font-bold text-slate-900">Ban Quản Trị Hệ Thống</div>
              <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                {contract.adminSigned ? `${contract.adminSignedAt} (SmartCA)` : 'Đang chờ ký'}
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border ${contract.facilitySigned ? 'border-emerald-200 bg-emerald-50/40' : 'border-primary/40 bg-accent/50 ring-2 ring-primary/15'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary">3. Cơ sở Y tế (Bên C)</span>
                <span className={`material-symbols-outlined text-[18px] ${contract.facilitySigned ? 'text-emerald-600' : 'text-primary animate-spin'}`}>
                  {contract.facilitySigned ? 'check_circle' : 'progress_activity'}
                </span>
              </div>
              <div className="mt-2 text-xs font-bold text-slate-900">BV Đại học Y Dược</div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                {contract.facilitySigned ? `BS: ${contract.assignedDoctorName}` : 'Bạn đang duyệt bước này'}
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border ${contract.doctorSigned ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50/70'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">4. Bác sĩ Phụ trách</span>
                <span className={`material-symbols-outlined text-[18px] ${contract.doctorSigned ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {contract.doctorSigned ? 'check_circle' : 'schedule'}
                </span>
              </div>
              <div className="mt-2 text-xs font-bold text-slate-900">
                {contract.assignedDoctorName || 'Chờ cơ sở phân công'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                {contract.doctorSigned ? `${contract.doctorSignedAt}` : 'Chờ BS xác nhận'}
              </div>
            </div>
          </div>

        {/* Thẻ Chi tiết Hợp đồng & Phân công */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái: Thông tin Hợp đồng & Hồ sơ Bệnh án ban đầu của Hộ */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-200 rounded-2xl py-6 shadow-2xs">
            <CardContent className="px-6">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Hồ Sơ Hộ Gia Đình</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{contract.familyHeadName} ({contract.familyId})</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px]">location_on</span>
                    <span>{contract.familyAddress}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px]">phone</span>
                    <span className="tabular-nums font-semibold">{contract.familyPhone}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-500 block">Gói chăm sóc</span>
                  <span className="text-sm font-bold text-primary block mt-0.5">{contract.packageName}</span>
                  <span className="text-xs font-bold text-slate-900 tabular-nums">{contract.packagePriceFormatted} / 12 tháng</span>
                </div>
              </div>

              <div className="mt-5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-slate-500">clinical_notes</span>
                  <span>Tiền sử y tế ban đầu của các thành viên ({contract.members.length} người)</span>
                </h4>

                <div className="space-y-3">
                  {contract.members.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-accent text-primary text-xs font-bold flex items-center justify-center">
                            {m.name.charAt(0)}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{m.name}</span>
                          <span className="text-[11px] text-slate-500 tabular-nums">
                            ({m.relation} • {new Date().getFullYear() - m.birthYear} tuổi • {m.gender})
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                          ID: {m.cccdOrBhyt}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-slate-700 pl-8 space-y-1">
                        <p>
                          <strong className="text-slate-800">Bệnh sử ban đầu:</strong> {m.baselineMedicalHistory}
                        </p>
                        {m.allergies && m.allergies !== 'Không ghi nhận' && m.allergies !== 'Không' && (
                          <p className="text-[#ba1a1a] font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                            <span>Dị ứng: {m.allergies}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cột Phải: Phân Công Bác Sĩ & Ký Số Cơ Sở Y Tế */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200 rounded-2xl py-6 shadow-2xs">
            <CardContent className="px-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Phân Công Bác Sĩ Phụ Trách</h3>
                  <p className="text-xs text-slate-500">Theo chuẩn định mức tải BR-04 (Tối đa 30 hộ/BS)</p>
                </div>
                <Badge variant="outline" className="px-2.5 py-1 rounded-md bg-accent text-primary text-[11px] font-bold border-primary/20">
                  BR-04 Rule
                </Badge>
              </div>

              {capacityError && (
                <Alert variant="destructive" className="mb-4 rounded-xl bg-red-50 border-red-200 text-[#ba1a1a]">
                  <AlertTitle className="text-xs font-bold">Cảnh báo vi phạm giới hạn:</AlertTitle>
                  <AlertDescription className="text-xs text-[#ba1a1a]">{capacityError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                {doctors.map((doc) => {
                  const isSelected = selectedDoctorId === doc.id;
                  const isFull = doc.activePanelCount >= doc.maxPanelCapacity;
                  const percentage = Math.round((doc.activePanelCount / doc.maxPanelCapacity) * 100);

                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectDoctor(doc)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isFull
                          ? 'border-red-200 bg-red-50/40 opacity-75 cursor-not-allowed'
                          : isSelected
                          ? 'border-primary bg-accent/50 ring-2 ring-primary/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                              isSelected ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {doc.name.split(' ').slice(-1)[0].charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{doc.name}</span>
                              {isSelected && (
                                <span className="material-symbols-outlined text-[15px] text-primary">
                                  check_circle
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">{doc.title}</div>
                          </div>
                        </div>

                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-bold rounded-full ${
                            isFull
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : doc.activePanelCount >= 24
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isFull ? 'Quá tải (30/30)' : 'Khả dụng'}
                        </Badge>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-500">Định mức phụ trách:</span>
                          <span className="font-bold text-slate-800 tabular-nums">
                            {doc.activePanelCount} / {doc.maxPanelCapacity} hộ ({percentage}%)
                          </span>
                        </div>
                        <Progress
                          value={percentage}
                          className={`h-1.5 bg-slate-200 ${
                            isFull
                              ? '[&_[data-slot=progress-indicator]]:bg-red-600'
                              : doc.activePanelCount >= 24
                              ? '[&_[data-slot=progress-indicator]]:bg-amber-500'
                              : '[&_[data-slot=progress-indicator]]:bg-emerald-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                    <span>Chứng thư số SmartCA Bệnh viện</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ký số điện tử xác nhận Bệnh viện tiếp nhận dịch vụ và bảo lãnh chuyên môn theo Nghị định 13/2023/NĐ-CP &amp; Thông tư 04/2022/TT-BYT.
                  </p>
                </div>

                {contract.facilitySigned ? (
                  <Alert className="rounded-xl bg-emerald-50 border-emerald-200 text-emerald-800 py-3">
                    <AlertDescription className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
                        <span>Đã hoàn tất ký số đại diện Cơ sở y tế!</span>
                      </div>
                      <span className="text-[11px] text-emerald-700 tabular-nums">{contract.facilitySignedAt}</span>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setShowAssignModal(true)}
                    disabled={!contract.adminSigned && contract.step !== 'PENDING_FACILITY_SIGN'}
                    className="w-full h-11 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-primary/20 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">draw</span>
                    <span>Ký Số Đại Diện Bệnh Viện &amp; Chuyển Giao Bác Sĩ</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
      )}

      {/* Dialog Xác Nhận Ký Số Bệnh Viện */}
      <Dialog open={showAssignModal && Boolean(selectedDoctor)} onOpenChange={setShowAssignModal}>
        <DialogContent className="rounded-2xl border-slate-200 sm:max-w-lg">
          {selectedDoctor && (
            <>
              <DialogHeader className="border-b border-slate-100 pb-3">
                <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <span className="material-symbols-outlined text-[20px] text-primary">verified_user</span>
                  <span>Xác Nhận Ký Số &amp; Phân Công Bác Sĩ</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Kiểm tra lại thông tin bác sĩ phụ trách trước khi ký số đại diện Cơ sở Y tế
                </DialogDescription>
              </DialogHeader>

              <div className="py-2 text-xs text-slate-700 space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                  <div className="text-slate-500">Hợp đồng điện tử:</div>
                  <div className="font-bold text-slate-900 text-sm tabular-nums">{contract.contractCode}</div>
                  <div className="text-slate-500">Hộ gia đình:</div>
                  <div className="font-bold text-slate-900">{contract.familyHeadName} (4 thành viên)</div>
                </div>

                <div className="p-3 bg-accent/60 border border-primary/20 rounded-xl space-y-1.5">
                  <div className="text-primary font-semibold">Bác sĩ được chỉ định phụ trách:</div>
                  <div className="font-bold text-slate-900 text-sm">{selectedDoctor.name}</div>
                  <div className="text-slate-600 text-[11px]">{selectedDoctor.specialty}</div>
                  <div className="text-slate-600 text-[11px]">
                    Tải hiện tại: <strong className="tabular-nums font-bold text-slate-900">{selectedDoctor.activePanelCount} / 30 hộ</strong> (Sau khi gán: {selectedDoctor.activePanelCount + 1}/30)
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Khi bấm ký số, hệ thống sẽ gắn chứng thư số điện tử của <strong>Bệnh viện Đại học Y Dược TP.HCM</strong> và gửi thông báo trực tiếp đến Bác sĩ phụ trách tại màn hình <span className="font-semibold text-primary">SCR-16</span>.
                </p>
              </div>

              <DialogFooter className="border-t border-slate-100 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAssignModal(false)}
                  className="rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </Button>

                <Button
                  type="button"
                  onClick={handleExecuteFacilitySign}
                  disabled={signing}
                  className="rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {signing ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      <span>Đang ký số SmartCA...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">draw</span>
                      <span>Xác Nhận Ký Số (Bên C)</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 1: CHI TIẾT HỢP ĐỒNG B2B (FLOW 2.1) */}
      {showStaffingDetailModal && selectedStaffing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Chi Tiết Hợp Đồng Cung Ứng Nhân Lực B2B</h3>
                <p className="text-xs text-slate-500 tracking-wide">Mã: {selectedStaffing.contractNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowStaffingDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-500 block text-xs">Cơ sở y tế đối tác:</span>
                  <span className="font-bold text-slate-900">{selectedStaffing.facilityName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Trạng thái hợp đồng:</span>
                  <span className="font-bold text-[#0052cc]">{selectedStaffing.status}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Tỷ lệ phân chia doanh thu:</span>
                  <span className="font-bold text-emerald-700">{selectedStaffing.facilitySharePercent}% CSYT / {selectedStaffing.platformSharePercent}% Platform</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Thời hạn hiệu lực:</span>
                  <span className="font-medium text-slate-800">
                    {new Date(selectedStaffing.validFrom).toLocaleDateString('vi-VN')} - {new Date(selectedStaffing.validTo).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 block">Nội dung điều khoản hợp tác:</span>
                <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed font-sans max-h-48 overflow-y-auto">
                  {selectedStaffing.contractTerms}
                </div>
              </div>

              {selectedStaffing.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  <span className="font-bold block">Lý do từ chối / Đề xuất đàm phán:</span>
                  <span>{selectedStaffing.rejectionReason}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowStaffingDetailModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                {selectedStaffing.status === 'DRAFT' && !selectedStaffing.facilitySigned && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowStaffingRejectModal(true)}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200"
                    >
                      Từ chối / Đàm phán lại
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowStaffingSignModal(true)}
                      className="px-5 py-2 bg-[#0052cc] hover:bg-[#003da6] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">draw</span>
                      <span>Ký Số Điện Tử B2B</span>
                    </button>
                  </>
                )}

                {selectedStaffing.status === 'ACTIVE' && (
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                    ✓ Hợp đồng đã có hiệu lực pháp lý đầy đủ
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: XÁC NHẬN KÝ SỐ B2B */}
      {showStaffingSignModal && selectedStaffing && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0052cc] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">verified</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Xác Nhận Ký Số Hợp Đồng B2B</h4>
                <p className="text-xs text-slate-500 tracking-wide">{selectedStaffing.contractNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn đang thực hiện ký số đại diện cho <strong>{selectedStaffing.facilityName}</strong>. Khi hoàn tất, hợp đồng sẽ chính thức kích hoạt sang trạng thái <strong>ACTIVE</strong> và cho phép cơ sở y tế khởi tạo bác sĩ tham gia mạng lưới FamiDoc.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 tracking-wide text-slate-700">
              <div>Chứng thư: CERT-VNPT-CA-2026-B2B</div>
              <div>Thuật toán: SHA-256 with RSA 2048-bit</div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowStaffingSignModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isStaffingLoading}
                onClick={handleExecuteSignStaffing}
                className="px-5 py-2 bg-[#0052cc] hover:bg-[#003da6] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-60"
              >
                {isStaffingLoading ? 'Đang ký số...' : 'Xác Nhận Ký Số Ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TỪ CHỐI / ĐÀM PHÁN LẠI */}
      {showStaffingRejectModal && selectedStaffing && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4 animate-fade-in">
            <h4 className="text-base font-bold text-slate-900">Từ Chối Dự Thảo &amp; Đề Xuất Đàm Phán</h4>
            <p className="text-xs text-slate-500">
              Vui lòng nhập rõ lý do không đồng ý điều khoản dự thảo (ví dụ: tỷ lệ phân chia, thời hạn) để Quản trị viên điều chỉnh lại.
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ví dụ: Đề xuất điều chỉnh lại tỷ lệ phân chia thành 10% Platform / 90% Cơ sở y tế..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowStaffingRejectModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim() || isStaffingLoading}
                onClick={handleExecuteRejectStaffing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isStaffingLoading ? 'Đang gửi...' : 'Gửi Yêu Cầu Đàm Phán'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
