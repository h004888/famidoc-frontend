'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { contractsApi, type MedicalContractListItem } from '@/lib/api';
import { ContractSigningWizard } from './contract-signing-wizard';
import {
  useContractWorkflow,
  updateContractStep,
  resetContractWorkflow,
} from '@/lib/contract-workflow-storage';

interface QuotaItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  barColor: string;
  used: number;
  total: number;
  remainingLabel: string;
  unit: string;
  actionLabel: string;
  actionHref: string;
}

const PACKAGE_QUOTAS: QuotaItem[] = [
  {
    id: 'home-visit',
    title: 'Bác Sĩ Thăm Khám Tại Nhà',
    subtitle: 'Mang theo máy đo ECG, siêu âm xách tay & lấy mẫu xét nghiệm tận nơi',
    icon: 'home_health',
    iconBg: 'bg-blue-50 text-[#2E37A4] border-blue-200/80',
    barColor: 'bg-[#2E37A4]',
    used: 2,
    total: 5,
    remainingLabel: 'Còn 3 / 5 lượt',
    unit: 'lượt năm nay',
    actionLabel: 'Đặt lịch khám tại nhà',
    actionHref: '/family/appointments',
  },
  {
    id: 'telehealth',
    title: 'Tư Vấn Video Telehealth 24/7',
    subtitle: 'Kết nối trực tiếp Bác sĩ gia đình & chuyên khoa các tuyến',
    icon: 'videocam',
    iconBg: 'bg-teal-50 text-teal-700 border-teal-200/80',
    barColor: 'bg-teal-600',
    used: 2,
    total: 20,
    remainingLabel: 'Còn 18 / 20 lượt',
    unit: 'lượt năm nay',
    actionLabel: 'Đặt lịch tư vấn Video',
    actionHref: '/family/appointments',
  },
  {
    id: 'lab-test',
    title: 'Xét Nghiệm Tổng Quát Tại Nhà',
    subtitle: 'Sinh hóa máu, mỡ máu, chức năng gan thận & HbA1c định kỳ',
    icon: 'biotech',
    iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    barColor: 'bg-emerald-600',
    used: 1,
    total: 2,
    remainingLabel: 'Còn 1 / 2 đợt',
    unit: 'đợt 6 tháng/lần',
    actionLabel: 'Xem kết quả xét nghiệm',
    actionHref: '/family/members',
  },
];

const PACKAGE_DETAILS_MAP: Record<string, { name: string; price: string; code: string }> = {
  BASIC: {
    code: 'PKG-BASIC-01',
    name: 'Gói Trải Nghiệm Gia Đình (1 Tháng)',
    price: '1.000.000 đ',
  },
  'pkg-basic': {
    code: 'PKG-BASIC-01',
    name: 'Gói Trải Nghiệm Gia Đình (1 Tháng)',
    price: '1.000.000 đ',
  },
  FAMILY: {
    code: 'PKG-FAMILY-03',
    name: 'Gói Đồng Hành Gia Đình (3 Tháng)',
    price: '2.850.000 đ',
  },
  'pkg-toan-dien': {
    code: 'PKG-FAMILY-03',
    name: 'Gói Đồng Hành Gia Đình (3 Tháng)',
    price: '2.850.000 đ',
  },
  ELDERLY: {
    code: 'PKG-ELDERLY-06',
    name: 'Gói An Tâm Người Cao Tuổi (6 Tháng)',
    price: '6.475.000 đ',
  },
  'pkg-nguoi-cao-tuoi': {
    code: 'PKG-ELDERLY-06',
    name: 'Gói An Tâm Người Cao Tuổi (6 Tháng)',
    price: '6.475.000 đ',
  },
  ROYAL: {
    code: 'PKG-ROYAL-12',
    name: 'Gói Toàn Diện Gia Tộc (12 Tháng)',
    price: '12.600.000 đ',
  },
  'pkg-hoang-gia': {
    code: 'PKG-ROYAL-12',
    name: 'Gói Toàn Diện Gia Tộc (12 Tháng)',
    price: '12.600.000 đ',
  },
};

export function SubscriptionContractView() {
  const workflow = useContractWorkflow();
  const searchParams = useSearchParams();
  const packageParam = searchParams?.get('packageId');
  const activePackageInfo = packageParam ? PACKAGE_DETAILS_MAP[packageParam] : null;

  const [activeTab, setActiveTab] = useState<'contract' | 'benefits'>('contract');
  const [isSigningWizardOpen, setIsSigningWizardOpen] = useState(Boolean(activePackageInfo));
  const [isAddendumModalOpen, setIsAddendumModalOpen] = useState(false);
  const [isTerminationModalOpen, setIsTerminationModalOpen] = useState(false);
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
  const [selectedAddendum, setSelectedAddendum] = useState<'home-visit-1' | 'home-visit-3' | 'telehealth-5' | 'member-slot' | 'upgrade-royal'>('home-visit-1');
  const [terminationReason, setTerminationReason] = useState('Chuyển nơi cư trú ra ngoài địa bàn');
  const [terminationBankInfo, setTerminationBankInfo] = useState('0912345678 - MB Bank - NGUYEN VAN AN');
  const [terminationNote, setTerminationNote] = useState('');
  const [quotas, setQuotas] = useState<QuotaItem[]>(PACKAGE_QUOTAS);
  const [contractPlanName, setContractPlanName] = useState('Gói Bác Sĩ Gia Đình Toàn Diện VIP (12 Tháng)');
  const [serverContracts, setServerContracts] = useState<MedicalContractListItem[]>([]);
  const [activeServerContract, setActiveServerContract] = useState<MedicalContractListItem | null>(null);
  const [isLoadingContracts, setIsLoadingContracts] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    contractsApi
      .getMedicalContracts()
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : [];
        setServerContracts(list);
        if (list.length > 0) {
          const matched = list.find((c) => c.contractStatus === 'ACTIVE') || list[0];
          setActiveServerContract(matched);
          if (matched.packageName) {
            setContractPlanName(matched.packageName);
          }
        }
      })
      .catch((err) => {
        console.warn('Contracts API fetch fallback:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingContracts(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);
  const [toastMessage, setToastMessage] = useState<string | null>(
    activePackageInfo
      ? `Đã chọn ${activePackageInfo.name}. Mời quý khách xem điều khoản và ký hợp đồng 4 bên.`
      : null
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApplyAddendum = async (e: React.FormEvent) => {
    e.preventDefault();
    const contractId = activeServerContract?.id;

    if (contractId) {
      try {
        if (selectedAddendum === 'home-visit-1') {
          await contractsApi.createAddendum(contractId, {
            requestKey: `addon-visit-1-${Date.now()}`,
            type: 'QUOTA_EXPANSION',
            extraHomeVisits: 1,
          });
        } else if (selectedAddendum === 'home-visit-3') {
          await contractsApi.createAddendum(contractId, {
            requestKey: `addon-visit-3-${Date.now()}`,
            type: 'QUOTA_EXPANSION',
            extraHomeVisits: 3,
          });
        } else if (selectedAddendum === 'member-slot') {
          await contractsApi.createAddendum(contractId, {
            requestKey: `addon-member-slot-${Date.now()}`,
            type: 'MEMBER_EXTENSION',
            additionalMembers: 2,
          });
        }
      } catch {
        // Fallback
      }
    }

    if (selectedAddendum === 'home-visit-1') {
      setQuotas((prev) =>
        prev.map((q) =>
          q.id === 'home-visit'
            ? { ...q, total: q.total + 1, remainingLabel: `Còn ${q.total - q.used + 1} / ${q.total + 1} lượt` }
            : q
        )
      );
      showToast('Đã mua thêm thành công 01 lượt khám tại nhà (+850.000 đ). Hạn mức đã được cộng ngay!');
    } else if (selectedAddendum === 'home-visit-3') {
      setQuotas((prev) =>
        prev.map((q) =>
          q.id === 'home-visit'
            ? { ...q, total: q.total + 3, remainingLabel: `Còn ${q.total - q.used + 3} / ${q.total + 3} lượt` }
            : q
        )
      );
      showToast('Đã mua thêm thành công 03 lượt khám tại nhà (+2.400.000 đ). Hạn mức đã được cộng ngay!');
    } else if (selectedAddendum === 'telehealth-5') {
      setQuotas((prev) =>
        prev.map((q) =>
          q.id === 'telehealth'
            ? { ...q, total: q.total + 5, remainingLabel: `Còn ${q.total - q.used + 5} / ${q.total + 5} lượt` }
            : q
        )
      );
      showToast('Đã mua thêm thành công 05 lượt tư vấn Video Telehealth (+900.000 đ)!');
    } else if (selectedAddendum === 'member-slot') {
      showToast('Đã ký phụ lục mở rộng thêm 02 slot thành viên (+150.000 đ/tháng)!');
    } else if (selectedAddendum === 'upgrade-royal') {
      setContractPlanName('Gói Bác Sĩ Gia Đình Hoàng Gia Toàn Diện (12 Tháng)');
      setQuotas((prev) =>
        prev.map((q) => {
          if (q.id === 'home-visit') return { ...q, total: q.total + 5, remainingLabel: `Còn ${q.total - q.used + 5} / ${q.total + 5} lượt` };
          if (q.id === 'telehealth') return { ...q, total: q.total + 20, remainingLabel: `Còn ${q.total - q.used + 20} / ${q.total + 20} lượt` };
          return q;
        })
      );
      showToast('Nâng cấp lên Gói Hoàng Gia thành công! Đã mở rộng hạn mức khám tại nhà và Telehealth.');
    }
    setIsAddendumModalOpen(false);
  };

  const handleDownloadDocument = async () => {
    const contractId = activeServerContract?.id;
    if (contractId) {
      try {
        showToast('Đang kết xuất văn bản hợp đồng điện tử 4 bên...');
        const doc = await contractsApi.getContractDocument(contractId);
        if (doc && doc.htmlContent) {
          const blob = new Blob([doc.htmlContent], { type: 'text/html;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Hop_dong_${doc.contractNumber || 'FamiDoc'}.html`;
          a.click();
          showToast('Đã tải văn bản hợp đồng điện tử thành công!');
          return;
        }
      } catch {
        // Fallback
      }
    }
    showToast('Đang tải file Hợp đồng PDF có chứng thư ký số 4 bên...');
  };

  const handleFamilySignContract = async () => {
    const contractId = activeServerContract?.id;
    if (contractId) {
      try {
        await contractsApi.signContract(contractId, { confirmationCode: 'OTP-VIETTEL' });
        showToast('Ký số điện tử hợp đồng thành công với mã chứng thực Viettel-CA!');
        setActiveServerContract((prev) =>
          prev ? { ...prev, signaturesCount: (prev.signaturesCount || 0) + 1 } : null
        );
        return;
      } catch {
        // Fallback
      }
    }
    updateContractStep('PENDING_FACILITY_SIGN', {
      familySigned: true,
      familySignedAt: new Date().toLocaleString('vi-VN'),
    });
    showToast('Đã ký số điện tử hợp đồng 4 bên thành công qua OTP!');
  };

  const handleTerminationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTerminationModalOpen(false);
    showToast('Đã gửi yêu cầu thanh lý hợp đồng. Bộ phận CSKH & Tài chính sẽ đối soát Escrow và hoàn phí trong 24-48h.');
  };

  const handleSimulatePaymentWebhook = () => {
    updateContractStep('ACTIVE', {
      paymentPaid: true,
      paymentPaidAt: new Date().toLocaleString('vi-VN'),
    });
    showToast('Webhook Payment Gateway ghi nhận thanh toán thành công! Hợp đồng đã kích hoạt ACTIVE.');
  };

  const handleResetDemo = () => {
    resetContractWorkflow();
    showToast('Đã reset dữ liệu hợp đồng về trạng thái mẫu!');
  };

  const fourPartiesList = [
    {
      code: 'BÊN A · ĐẠI DIỆN HỘ GIA ĐÌNH',
      badgeClass: 'bg-blue-50 text-[#2E37A4] border-blue-200/80',
      name: activeServerContract?.familyHeadName || workflow?.familyHeadName || 'Nguyễn Văn An',
      identifier: `Mã hộ #${activeServerContract?.familyId || workflow?.familyId || 'FAM-88219'} · SĐT: ${workflow?.familyPhone || '0912345678'}`,
      roleDesc: 'Đại diện Hộ Gia Đình ký kết gói chăm sóc',
      signMethod: (activeServerContract?.signaturesCount ?? 0) >= 1 || workflow?.familySigned ? 'Đã ký OTP Viettel' : 'Chưa ký số',
      signDetail: workflow?.familyOtpMethod || 'Mã OTP Viettel 0988',
      signedAt: workflow?.familySignedAt || (activeServerContract?.signaturesCount ? 'Đã xác nhận ký' : 'Chưa hoàn tất'),
      isSigned: (activeServerContract?.signaturesCount ?? 0) >= 1 || !!workflow?.familySigned,
    },
    {
      code: 'BÊN B · NỀN TẢNG FAMIDOC',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      name: 'FamiDoc Platform Administration',
      identifier: 'MST: 0317892182 · SmartCA',
      roleDesc: 'Đơn vị vận hành hồ sơ EHR & điều phối mạng lưới 24/7',
      signMethod: (activeServerContract?.signaturesCount ?? 0) >= 4 || workflow?.adminSigned ? 'Chứng thư số FamiDoc SmartCA' : 'Chờ Admin duyệt (Bên B)',
      signDetail: workflow?.adminCertSerial || 'Chuẩn SHA-256 RSA',
      signedAt: workflow?.adminSignedAt || ((activeServerContract?.signaturesCount ?? 0) >= 4 ? 'Đã duyệt' : 'Chờ ký duyệt'),
      isSigned: (activeServerContract?.signaturesCount ?? 0) >= 4 || !!workflow?.adminSigned,
    },
    {
      code: 'BÊN C · CƠ SỞ Y TẾ ĐỐI TÁC',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
      name: activeServerContract?.facilityName || workflow?.facilityName || 'BV Đại học Y Dược TP.HCM',
      identifier: 'Mã CSYT: 79024 · Tuyến TW',
      roleDesc: activeServerContract?.doctorName ? `Đã phân công: ${activeServerContract.doctorName}` : (workflow?.assignedDoctorName ? `Đã phân công: ${workflow.assignedDoctorName}` : 'Bảo trợ chuyên môn & phân công bác sĩ'),
      signMethod: (activeServerContract?.signaturesCount ?? 0) >= 2 || workflow?.facilitySigned ? 'Chữ ký số Bệnh viện VNPT-CA' : 'Chờ cơ sở y tế (Bên C)',
      signDetail: workflow?.facilitySignerName || 'Định danh: UMC-HCMC-CA',
      signedAt: workflow?.facilitySignedAt || ((activeServerContract?.signaturesCount ?? 0) >= 2 ? 'Đã ký xác nhận' : 'Chờ phân công & ký'),
      isSigned: (activeServerContract?.signaturesCount ?? 0) >= 2 || !!workflow?.facilitySigned,
    },
    {
      code: 'BÊN D · BÁC SĨ PHỤ TRÁCH',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      name: activeServerContract?.doctorName || workflow?.assignedDoctorName || 'BS.CKII Trần Thanh Mai',
      identifier: `CCHN: ${workflow?.doctorCchn || '004128/HCM'}`,
      roleDesc: 'Bác sĩ gia đình phụ trách trực tiếp hộ',
      signMethod: (activeServerContract?.signaturesCount ?? 0) >= 3 || workflow?.doctorSigned ? 'Chữ ký số cá nhân Viettel-CA' : 'Chờ bác sĩ xác nhận (Bên D)',
      signDetail: 'Cam kết trách nhiệm y đức & SLA',
      signedAt: workflow?.doctorSignedAt || ((activeServerContract?.signaturesCount ?? 0) >= 3 ? 'Đã ký cam kết' : 'Chờ xác nhận chuyên môn'),
      isSigned: (activeServerContract?.signaturesCount ?? 0) >= 3 || !!workflow?.doctorSigned,
    },
  ];

  const displayContractNumber = activeServerContract?.contractNumber || workflow?.contractCode || 'CTR-4P-2026-88219';
  const isContractActive = activeServerContract ? activeServerContract.contractStatus === 'ACTIVE' : workflow?.step === 'ACTIVE';
  const displayStatusBadge = activeServerContract
    ? activeServerContract.contractStatus === 'ACTIVE'
      ? 'Đang hiệu lực (ACTIVE)'
      : (activeServerContract.contractStatus as string) === 'PENDING_APPROVAL'
      ? 'Chờ ký kết & Phân công BS'
      : (activeServerContract.contractStatus as string) === 'SUSPENDED'
      ? 'Tạm ngưng phục vụ'
      : 'Chờ kích hoạt'
    : workflow?.statusLabel || 'Đang hiệu lực (ACTIVE)';

  const displayAnnualFee = activeServerContract
    ? `${activeServerContract.totalAmountVnd.toLocaleString('vi-VN')} đ/năm`
    : '9.600.000 đ/năm';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. HEADER HỢP ĐỒNG TINH GỌN, CÂN ĐỐI & THOÁNG ĐÃNG */}
        <header className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Cột trái: Thông tin hợp đồng rộng rãi, chữ không bị gãy rụng */}
            <div className="space-y-2.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tabular-nums text-[#2E37A4] bg-blue-50/80 border border-blue-200/60">
                  #{displayContractNumber}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                    isContractActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                      : 'bg-amber-50 text-amber-800 border-amber-200/60 animate-pulse'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isContractActive ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span>{displayStatusBadge}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {contractPlanName}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Hiệu lực từ <strong className="text-slate-800 font-semibold">01/01/2026 – 31/12/2026</strong> · Phí thường niên trọn gói:{' '}
                <strong className="text-[#2E37A4] tabular-nums font-bold">{displayAnnualFee}</strong> (Bảo lãnh 100% quyền lợi Escrow)
              </p>
            </div>

            {/* Cột phải: Cụm nút hành động tinh gọn & phân cấp chuẩn UX */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start">
              {/* Nút Thanh toán VietQR kích hoạt hợp đồng nếu chưa ACTIVE */}
              {((activeServerContract && activeServerContract.contractStatus !== 'ACTIVE') || workflow?.step === 'PENDING_PAYMENT') && (
                <Link
                  href={`/family/billing?contractId=${activeServerContract?.id || ''}`}
                  className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap animate-pulse"
                >
                  <span className="material-symbols-outlined text-[19px]">qr_code_2</span>
                  <span>Thanh Toán VietQR Kích Hoạt</span>
                </Link>
              )}

              {/* Nút Chọn Bác Sĩ & Đăng Ký Gói Mới (Toàn Màn Hình) */}
              <Link
                href="/family/subscription/new"
                className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[19px]">person_search</span>
                <span>Chọn Bác Sĩ &amp; Đăng Ký Gói</span>
              </Link>

              {/* Nút Phụ: Mua Thêm Lượt / Nâng Gói */}
              <button
                type="button"
                onClick={() => setIsAddendumModalOpen(true)}
                className="min-h-11 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100/80 text-[#2E37A4] border border-blue-200/80 rounded-xl text-sm font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[19px]">add_circle</span>
                <span>Mua Thêm Lượt</span>
              </button>

              {/* Nút hành động phụ (Secondary) */}
              <button
                type="button"
                onClick={handleDownloadDocument}
                className="min-h-11 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold shadow-xs hover:border-slate-300 transition-all cursor-pointer whitespace-nowrap"
                title="Tải văn bản hợp đồng điện tử có chữ ký số 4 bên"
              >
                <span className="material-symbols-outlined text-[19px] text-rose-500">picture_as_pdf</span>
                <span>Tải bản HĐ (HTML/PDF)</span>
              </button>

              {/* Menu tùy chọn bổ sung (Dropdown gom các thao tác ít dùng) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsActionsDropdownOpen((prev) => !prev)}
                  className="min-h-11 w-11 inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-all cursor-pointer"
                  title="Tùy chọn khác"
                  aria-label="Tùy chọn khác"
                  aria-expanded={isActionsDropdownOpen}
                >
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>

                {isActionsDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsActionsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsDropdownOpen(false);
                          handleFamilySignContract();
                        }}
                        className="w-full px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer text-left"
                      >
                        <span className="material-symbols-outlined text-[18px] text-emerald-600">draw</span>
                        <span>Ký số điện tử (Bên A)</span>
                      </button>

                      <Link
                        href="/family/billing"
                        onClick={() => setIsActionsDropdownOpen(false)}
                        className="w-full px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-semibold transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#2E37A4]">receipt_long</span>
                        <span>Xem biên lai thanh toán</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsDropdownOpen(false);
                          setIsSigningWizardOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer text-left"
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#2E37A4]">edit_document</span>
                        <span>Gia hạn hợp đồng mới</span>
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsDropdownOpen(false);
                          setIsTerminationModalOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer text-left"
                      >
                        <span className="material-symbols-outlined text-[18px] text-rose-500">cancel</span>
                        <span>Yêu cầu thanh lý hợp đồng</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsDropdownOpen(false);
                          handleResetDemo();
                        }}
                        className="w-full px-4 py-2 text-[11px] text-slate-500 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer text-left"
                      >
                        <span className="material-symbols-outlined text-[16px] text-slate-400">restart_alt</span>
                        <span>Đặt lại dữ liệu mẫu (Reset Demo)</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Dải thông tin Bác sĩ gia đình phụ trách & Người thụ hưởng (Card nền trắng tinh tế) */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2E37A4] font-bold text-xs flex items-center justify-center border border-blue-200/80 shrink-0">
                TN
              </div>
              <div>
                <span className="text-slate-500">Bác sĩ gia đình phụ trách: </span>
                <strong className="text-slate-900 font-semibold">{workflow?.assignedDoctorName || 'PGS.TS Nguyễn Trọng Nghĩa'}</strong>
                <span className="text-slate-400 hidden sm:inline"> · BV Đại học Y Dược TP.HCM</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-medium mr-1">Thành viên thụ hưởng (4/4):</span>
              <Link
                href="/family/members/mem-01"
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-700 hover:border-[#2E37A4] hover:text-[#2E37A4] transition-colors"
              >
                Ông Phúc (78t)
              </Link>
              <Link
                href="/family/members/mem-02"
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-700 hover:border-[#2E37A4] hover:text-[#2E37A4] transition-colors"
              >
                Chị Mai (42t)
              </Link>
              <Link
                href="/family/members/mem-03"
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-700 hover:border-[#2E37A4] hover:text-[#2E37A4] transition-colors"
              >
                Cháu Quân (12t)
              </Link>
              <Link
                href="/family/members"
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-700 hover:border-[#2E37A4] hover:text-[#2E37A4] transition-colors"
              >
                Bé An (6t)
              </Link>
            </div>
          </div>
        </header>

        {/* 1.5. BANNER THÔNG BÁO TIẾN TRÌNH KÝ DUYỆT & THANH TOÁN */}
        {workflow?.step === 'PENDING_PAYMENT' && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">payments</span>
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Hợp Đồng Đã Ký Số Thành Công! Chờ Hoàn Tất Thanh Toán
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Các bên đã hoàn tất thủ tục ký điện tử. Quý gia đình vui lòng thanh toán để kích hoạt quyền lợi gói chăm sóc.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/family/billing"
                className="px-4 py-2 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                <span>Thanh Toán VietQR</span>
              </Link>
            </div>
          </div>
        )}

        {workflow?.step === 'PENDING_ADMIN_SIGN' && (
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-blue-900 flex items-center gap-3 text-xs sm:text-sm">
            <span className="material-symbols-outlined text-[22px] text-[#2E37A4] shrink-0">pending</span>
            <div className="space-y-0.5">
              <div className="font-bold text-slate-900">
                Hợp đồng đang trong quá trình phê duyệt ký số điện tử
              </div>
              <p className="text-slate-600 text-xs">
                Ban quản trị nền tảng FamiDoc đang tiến hành rà soát điều khoản và chứng thực số (SmartCA). Quý gia đình sẽ nhận được thông báo ngay khi hoàn tất.
              </p>
            </div>
          </div>
        )}

        {workflow?.step === 'PENDING_FACILITY_SIGN' && (
          <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 text-indigo-900 flex items-center gap-3 text-xs sm:text-sm">
            <span className="material-symbols-outlined text-[22px] text-indigo-600 shrink-0">local_hospital</span>
            <div className="space-y-0.5">
              <div className="font-bold text-slate-900">
                Bệnh viện đối tác đang phân công Bác sĩ gia đình phụ trách
              </div>
              <p className="text-slate-600 text-xs">
                Cơ sở y tế đang hoàn tất phân công chuyên môn và thực hiện ký số xác nhận bảo trợ y tế cho gia đình.
              </p>
            </div>
          </div>
        )}

        {workflow?.step === 'PENDING_DOCTOR_SIGN' && (
          <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200/80 text-teal-900 flex items-center gap-3 text-xs sm:text-sm">
            <span className="material-symbols-outlined text-[22px] text-teal-700 shrink-0">stethoscope</span>
            <div className="space-y-0.5">
              <div className="font-bold text-slate-900">
                Bác sĩ gia đình đang xác nhận cam kết chuyên môn
              </div>
              <p className="text-slate-600 text-xs">
                Bác sĩ phụ trách đang rà soát hồ sơ sức khỏe ban đầu của hộ để ký số cam kết trách nhiệm chăm sóc y tế.
              </p>
            </div>
          </div>
        )}

        {/* 2. DẢI 3 CARD HẠN MỨC QUYỀN LỢI — THIẾT KẾ ĐỘC LẬP, THOÁNG MẮT, SỐ TO TABULAR-NUMS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Hạn Mức Quyền Lợi Gia Đình Đang Có
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Các lượt thăm khám và xét nghiệm được dùng chung linh hoạt cho cả 3 thành viên
              </p>
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Đồng bộ tự động theo từng lần khám hoàn tất
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {quotas.map((q) => {
              const remaining = q.total - q.used;
              const remainingPercent = Math.round((remaining / q.total) * 100);

              return (
                <div
                  key={q.id}
                  className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between gap-5 hover:shadow-md transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${q.iconBg}`}
                      >
                        <span className="material-symbols-outlined text-[22px]">{q.icon}</span>
                      </div>

                      <span className="px-3 py-1 rounded-full text-xs font-bold tabular-nums bg-slate-100 text-slate-800">
                        {q.remainingLabel}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-slate-900">{q.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{q.subtitle}</p>
                    </div>

                    {/* Thanh tiến độ hạn mức siêu mảnh */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          Đã dùng: <strong className="text-slate-800 tabular-nums">{q.used}</strong> / {q.total}{' '}
                          {q.unit}
                        </span>
                        <span className="font-bold tabular-nums text-slate-800">Còn {remainingPercent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${q.barColor}`}
                          style={{ width: `${remainingPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <Link
                      href={q.actionHref}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/80 text-[#2E37A4] font-semibold text-xs sm:text-sm flex items-center justify-between transition-colors"
                    >
                      <span>{q.actionLabel}</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. THANH TAB CHUYỂN ĐỔI: HỢP ĐỒNG 4 BÊN vs QUY CHẾ GÓI */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 bg-slate-100/90 p-1 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('contract')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'contract'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[17px] text-[#2E37A4]">verified</span>
              <span>Hợp đồng &amp; Chữ ký 4 bên</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('benefits')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'benefits'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[17px] text-teal-600">policy</span>
              <span>Quy chế &amp; Quyền lợi gói</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">lock</span>
            <span>Lưu trữ trên FamiDoc Vault · Chuẩn bảo mật HIPAA &amp; ISO 27799</span>
          </div>
        </div>

        {/* NỘI DUNG TAB 1: 4 THẺ CHỮ KÝ SỐ & BẢN SAO HỢP ĐỒNG ĐIỆN TỬ */}
        {activeTab === 'contract' && (
          <div className="space-y-8 animate-fade-in">
            {/* 4 Thẻ Chữ Ký Pháp Lý 4 Bên */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Chữ Ký Số Xác Thực Của 4 Bên Ký Kết
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hợp đồng điện tử được chứng thực pháp lý toàn vẹn bởi TSA &amp; các nhà cấp chứng thư số quốc gia
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {fourPartiesList.map((party) => (
                  <div
                    key={party.code}
                    className={`bg-white p-5 rounded-2xl border shadow-xs flex flex-col justify-between gap-4 transition-all ${
                      party.isSigned ? 'border-slate-200/80' : 'border-amber-200 bg-amber-50/20'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${party.badgeClass}`}
                        >
                          {party.code}
                        </span>
                        <span
                          className={`material-symbols-outlined text-[18px] ${
                            party.isSigned ? 'text-emerald-600' : 'text-amber-500 animate-pulse'
                          }`}
                          title={party.isSigned ? 'Đã xác thực chữ ký số' : 'Đang chờ ký'}
                        >
                          {party.isSigned ? 'verified' : 'pending'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{party.name}</h4>
                        <p className="text-xs font-semibold tabular-nums text-slate-500 mt-0.5">
                          {party.identifier}
                        </p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{party.roleDesc}</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-1">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-700">
                          done_all
                        </span>
                        <span>{party.signMethod}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">{party.signDetail}</div>
                      <div className="text-[11px] font-medium tabular-nums text-slate-500 pt-0.5">
                        Ký lúc: {party.signedAt}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Khung Văn Bản Hợp Đồng Điện Tử */}
            <section className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
              {/* Header văn bản */}
              <div className="p-5 sm:px-6 bg-slate-50/80 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2E37A4] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">description</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      Bản Sao Văn Bản Hợp Đồng Điện Tử
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Toàn vẹn dữ liệu mã hóa SHA-256 · Giá trị pháp lý tương đương bản hợp đồng giấy
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => showToast('Đang chuẩn bị bản in hợp đồng điện tử...')}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    <span>In văn bản</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Đang tải file hợp đồng PDF có chứng thư ký số TSA...')}
                    className="px-3.5 py-2 rounded-xl bg-[#2E37A4] hover:bg-[#222982] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Tải bản PDF</span>
                  </button>
                </div>
              </div>

              {/* Nội dung điều khoản chính */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="text-center border-b border-slate-100 pb-5 space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </span>
                  <p className="text-xs font-semibold text-slate-500">
                    Độc lập - Tự do - Hạnh phúc
                  </p>
                  <h4 className="text-base sm:text-xl font-bold text-slate-900 pt-2">
                    HỢP ĐỒNG CUNG CẤP DỊCH VỤ BÁC SĨ GIA ĐÌNH &amp; CHĂM SÓC SỨC KHỎE
                  </h4>
                  <p className="text-xs font-bold tabular-nums text-[#2E37A4]">
                    Số hợp đồng: FMD-HD-88219/2026 · Ngày ký: 01/01/2026
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2.5">
                    <div className="flex items-center gap-2 text-[#2E37A4] font-bold text-xs uppercase">
                      <span className="material-symbols-outlined text-[18px]">medical_services</span>
                      <span>Điều 1: Phạm vi chăm sóc</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">
                      Bác sĩ gia đình phụ trách (Bên B) và FamiDoc (Bên D) cung cấp gói chăm sóc sức khỏe
                      trọn năm cho hộ gia đình Bên A gồm: <strong>05 lượt khám tại nhà</strong>,{' '}
                      <strong>20 lượt tư vấn Telehealth</strong>, quản lý hồ sơ bệnh án điện tử EHR
                      và <strong>02 đợt lấy mẫu xét nghiệm</strong> định kỳ tại nhà.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2.5">
                    <div className="flex items-center gap-2 text-[#2E37A4] font-bold text-xs uppercase">
                      <span className="material-symbols-outlined text-[18px]">local_hospital</span>
                      <span>Điều 2: Chuyển tuyến ưu tiên</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">
                      Bệnh viện Đại học Y Dược TP.HCM (Bên C) tiếp nhận thành viên hộ Bên A theo
                      luồng ưu tiên <strong>Fast-Track</strong> khi có chỉ định chuyển viện điện tử
                      từ Bác sĩ gia đình phụ trách; đồng bộ sẵn kết quả xét nghiệm và hỗ trợ hưởng BHYT đúng
                      tuyến.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2.5">
                    <div className="flex items-center gap-2 text-[#2E37A4] font-bold text-xs uppercase">
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                      <span>Điều 3: Bảo mật bệnh án</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">
                      Toàn bộ dữ liệu bệnh án, chỉ số sinh hiệu IoT và đơn thuốc của gia đình được
                      mã hóa đầu-cuối theo chuẩn <strong>HIPAA &amp; Bộ Y Tế</strong>. Tuyệt đối
                      không chia sẻ cho bên thứ ba khi chưa có sự đồng ý của Chủ hộ.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* NỘI DUNG TAB 2: QUY CHẾ SỬ DỤNG & QUYỀN LỢI CHI TIẾT */}
        {activeTab === 'benefits' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2E37A4] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">home_health</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    Quy Định Sử Dụng Lượt Khám Tại Nhà &amp; Telehealth
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hướng dẫn đặt lịch và chuẩn bị đón Bác sĩ gia đình
                  </p>
                </div>
              </div>

              <ul className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#2E37A4] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Chia sẻ hạn mức linh hoạt:</strong> Tổng số lượt khám tại nhà (5 lượt) và
                    tư vấn video (20 lượt) được dùng chung cho tất cả thành viên có tên trong hộ.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#2E37A4] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Thời gian đặt hẹn trước:</strong> Đặt lịch khám tại nhà trước tối thiểu
                    03 tiếng hoặc gọi tổng đài khẩn cấp <strong>1900 6868</strong> để được điều phối
                    bác sĩ trực 24/7.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#2E37A4] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Trang thiết bị mang theo:</strong> Bác sĩ mang theo vali y tế gồm máy đo
                    điện tim ECG, máy siêu âm cầm tay, máy đo SpO2/huyết áp và bộ lấy mẫu xét nghiệm.
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">support_agent</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    Chính Sách Đổi Bác Sĩ Phụ Trách &amp; Gia Hạn Gói
                  </h3>
                  <p className="text-xs text-slate-500">
                    Quyền lợi đảm bảo chất lượng phục vụ hộ gia đình
                  </p>
                </div>
              </div>

              <ul className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0 mt-0.5">
                    verified
                  </span>
                  <span>
                    <strong>Quyền đổi Bác sĩ gia đình:</strong> Gia đình có thể yêu cầu đổi Bác sĩ
                    phụ trách miễn phí nếu muốn thay đổi chuyên khoa phù hợp hơn với nhu cầu thực tế.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0 mt-0.5">
                    verified
                  </span>
                  <span>
                    <strong>Gia hạn &amp; chuyển tiếp hợp đồng:</strong> Mỗi hộ gia đình duy trì 01
                    hợp đồng đang hoạt động. Khi gia hạn sớm, kỳ hạn mới sẽ tự động nối tiếp sau ngày
                    31/12/2026.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0 mt-0.5">
                    verified
                  </span>
                  <span>
                    <strong>Bảo lưu hồ sơ trọn đời:</strong> Ngay cả khi tạm ngưng gói dịch vụ, toàn
                    bộ lịch sử khám và kết quả xét nghiệm của gia đình vẫn được lưu trữ và tra cứu
                    miễn phí.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Modal Ký Kết / Đăng Ký Gói & Chọn Bác Sĩ 4 Bên */}
      {isSigningWizardOpen && (
        <ContractSigningWizard
          packageName={activePackageInfo?.name || "Gói Toàn Diện Gia Đình VIP (12 Tháng)"}
          packagePrice={activePackageInfo?.price || "9.600.000 đ"}
          doctorName={workflow?.assignedDoctorName || "BS.CKII Trần Thanh Mai"}
          onClose={() => setIsSigningWizardOpen(false)}
          onSuccess={() => {
            showToast('Ký hợp đồng thành công! Vui lòng quét mã VietQR để kích hoạt gói dịch vụ.');
          }}
        />
      )}

      {/* MODAL: KÝ PHỤ LỤC HỢP ĐỒNG & MUA THÊM LƯỢT / NÂNG GÓI */}
      {isAddendumModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 my-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">add_circle</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Ký Phụ Lục Hợp Đồng &amp; Mua Thêm Lượt
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mã phụ lục: <span className="tabular-nums font-bold text-emerald-800">PL-CTR-88219-01</span> · Bảo lãnh Escrow FamiDoc
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddendumModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyAddendum} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">
                  Chọn hạng mục bổ sung vào hợp đồng hiện hành:
                </label>

                {([
                  {
                    id: 'home-visit-1',
                    title: '+1 Lượt Khám Tại Nhà',
                    price: '850.000 đ',
                    desc: 'BS Gia đình mang máy ECG, siêu âm xách tay & dụng cụ lấy mẫu tới nhà.',
                  },
                  {
                    id: 'home-visit-3',
                    title: '+3 Lượt Khám Tại Nhà (Ưu đãi)',
                    price: '2.400.000 đ',
                    desc: 'Tiết kiệm 150.000 đ so với mua lẻ. Thích hợp người già bệnh mạn tính.',
                  },
                  {
                    id: 'telehealth-5',
                    title: '+5 Lượt Video Telehealth 24/7',
                    price: '900.000 đ',
                    desc: 'Tư vấn video trực tiếp cùng Bác sĩ gia đình và chuyên khoa tuyến trên.',
                  },
                  {
                    id: 'member-slot',
                    title: 'Mở rộng +2 Slot Thành Viên Gia Đình',
                    price: '150.000 đ/tháng',
                    desc: 'Nâng hạn mức từ 4 lên 6 người, chia sẻ quyền lợi dùng chung.',
                  },
                  {
                    id: 'upgrade-royal',
                    title: 'Nâng Cấp Gói Hoàng Gia Toàn Diện',
                    price: '+3.000.000 đ',
                    desc: 'Tăng +5 lượt khám nhà, +20 lượt Telehealth & cam kết điều dưỡng túc trực.',
                  },
                ] as const).map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedAddendum === opt.id
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="addendum_option"
                      checked={selectedAddendum === opt.id}
                      onChange={() => setSelectedAddendum(opt.id)}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-slate-900 font-bold text-xs sm:text-sm">
                          {opt.title}
                        </strong>
                        <span className="tabular-nums font-bold text-emerald-700 text-xs sm:text-sm shrink-0">
                          {opt.price}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Thông tin xác thực & Phương thức thanh toán */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1.5 leading-relaxed">
                <div className="flex justify-between">
                  <span className="text-slate-500">Chữ ký điện tử:</span>
                  <span className="font-semibold text-slate-800">Xác thực OTP qua SĐT chủ hộ (0912 345 678)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bảo lãnh tài chính:</span>
                  <span className="font-bold text-emerald-700">Tài khoản phong tỏa Escrow FamiDoc</span>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddendumModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Ký Phụ Lục &amp; Thanh Toán</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: YÊU CẦU CHẤM DỨT HỢP ĐỒNG SỚM & HOÀN PHÍ ESCROW */}
      {isTerminationModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 my-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">cancel</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Yêu Cầu Chấm Dứt &amp; Thanh Lý Hợp Đồng
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hợp đồng #{workflow?.contractCode || 'CTR-4P-2026-88219'} · Bảo vệ quyền lợi Escrow
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTerminationModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTerminationSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lý do chấm dứt hợp đồng <span className="text-rose-500">*</span>
                </label>
                <select
                  value={terminationReason}
                  onChange={(e) => setTerminationReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-xs sm:text-sm bg-white focus:border-rose-500 outline-hidden"
                >
                  <option value="Chuyển nơi cư trú ra ngoài địa bàn">Chuyển nơi cư trú ra ngoài địa bàn TP.HCM</option>
                  <option value="Thay đổi nhu cầu chăm sóc sức khỏe">Thay đổi nhu cầu chăm sóc sức khỏe gia đình</option>
                  <option value="Bác sĩ gia đình không phù hợp">Bác sĩ gia đình không phù hợp phong cách giao tiếp</option>
                  <option value="Lý do cá nhân khác">Lý do cá nhân khác</option>
                </select>
              </div>

              {/* Bảng tính toán hoàn phí Escrow minh bạch */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-slate-700">
                <div className="font-bold text-amber-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px] text-amber-700">account_balance</span>
                  <span>Bảng Tính Hoàn Phí Escrow Minh Bạch:</span>
                </div>
                <div className="divide-y divide-amber-200/50 text-[11px] space-y-1.5 pt-1">
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-600">Tổng phí dịch vụ đã đóng:</span>
                    <strong className="tabular-nums font-bold text-slate-800">9.600.000 đ (12 Tháng)</strong>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-600">Thời gian đã phục vụ (6 tháng):</span>
                    <strong className="tabular-nums font-bold text-slate-800">- 4.800.000 đ</strong>
                  </div>
                  <div className="flex justify-between pt-1 text-xs">
                    <strong className="text-emerald-900">Số dư hoàn trả vào tài khoản (Dự kiến):</strong>
                    <strong className="tabular-nums font-bold text-emerald-700 text-sm">4.800.000 đ</strong>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic pt-1">
                  * Tiền hoàn sẽ được chuyển khoản trực tiếp qua tài khoản ngân hàng trong vòng 24 - 48 giờ làm việc.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Thông tin tài khoản nhận tiền hoàn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Số tài khoản - Ngân hàng - Tên chủ tài khoản"
                  value={terminationBankInfo}
                  onChange={(e) => setTerminationBankInfo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold tabular-nums text-xs sm:text-sm bg-white focus:border-[#2E37A4] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú hoặc ý kiến đóng góp cho FamiDoc
                </label>
                <textarea
                  rows={2}
                  placeholder="Chia sẻ lý do cụ thể để FamiDoc cải thiện chất lượng dịch vụ..."
                  value={terminationNote}
                  onChange={(e) => setTerminationNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:border-[#2E37A4] outline-hidden"
                />
              </div>

              {/* Cam kết bảo lưu hồ sơ EHR trọn đời */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-blue-600 shrink-0 mt-0.5">verified_user</span>
                <span>
                  <strong>Cam kết bảo lưu hồ sơ EHR:</strong> Toàn bộ lịch sử bệnh án, chỉ số sinh hiệu và kết quả xét nghiệm của gia đình vẫn được bảo mật và lưu trữ trọn đời trên FamiDoc.
                </span>
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTerminationModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Giữ lại hợp đồng
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer shadow-xs transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Gửi Yêu Cầu Thanh Lý</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast phản hồi */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm animate-fade-in"
        >
          <span className="material-symbols-outlined text-[18px] text-emerald-400">
            check_circle
          </span>
          <span className="font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
