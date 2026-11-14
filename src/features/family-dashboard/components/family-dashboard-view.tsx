'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useContractWorkflow } from '@/lib/contract-workflow-storage';
import { contractsApi, patientsApi, type MedicalContractListItem, type PatientDto } from '@/lib/api';
import { getStoredAuthSession } from '@/lib/auth-storage';
import {
  INITIAL_FAMILY_MEMBERS_DATA,
  MemberHealthData,
} from './family-member-care-view';

interface FamilyMedicationItem {
  id: string;
  memberId: string;
  memberName: string;
  relation: string;
  medName: string;
  dosage: string;
  time: string;
  timeGroup: 'morning' | 'noon' | 'evening';
  status: 'taken' | 'pending';
}

function calculateAge(dob?: string): number {
  if (!dob) return 45;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 45;
  const diff = Date.now() - birthDate.getTime();
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return age > 0 && age < 120 ? age : 45;
}

function formatRelation(rel?: string, gender?: string): string {
  switch (rel) {
    case 'SELF':
      return 'Chủ hộ';
    case 'SPOUSE':
      return gender === 'FEMALE' ? 'Vợ' : 'Chồng';
    case 'CHILD':
      return 'Con';
    case 'PARENT':
      return gender === 'FEMALE' ? 'Mẹ' : 'Bố';
    case 'OTHER':
    default:
      return 'Thành viên';
  }
}

function getAvatar(rel?: string, gender?: string, age?: number): string {
  if (age && age >= 60) {
    return gender === 'FEMALE' ? '👵' : '👨‍🦳';
  }
  if (age && age < 18) {
    return gender === 'FEMALE' ? '👧' : '👦';
  }
  return gender === 'FEMALE' ? '👩' : '👨';
}

function formatAllergies(allergies?: any[]): string {
  if (!allergies || !Array.isArray(allergies) || allergies.length === 0) {
    return 'Không có tiền sử dị ứng thuốc';
  }
  return allergies
    .map((a) => (typeof a === 'string' ? a : a.allergen || 'Dị ứng thuốc'))
    .join(', ');
}

function convertPatientsToMembersData(
  patients: PatientDto[],
  contract: MedicalContractListItem | null
): Record<string, MemberHealthData> {
  if (!patients || patients.length === 0) return INITIAL_FAMILY_MEMBERS_DATA;

  const result: Record<string, MemberHealthData> = {};

  patients.forEach((p, idx) => {
    const age = calculateAge(p.dateOfBirth);
    const relation = p.relationshipToHead
      ? formatRelation(p.relationshipToHead, p.gender)
      : idx === 0
      ? 'Chủ hộ'
      : 'Thành viên';
    const avatar = getAvatar(p.relationshipToHead, p.gender, age);
    const allergiesStr = formatAllergies(p.allergies);
    const isElderly = age >= 60;
    const isChild = age < 18;
    const memberId = p.id || `mem-${idx + 1}`;

    const medicines = isElderly
      ? [
          {
            id: `med-${memberId}-1`,
            name: 'Amlodipine 5mg (Hạ huyết áp)',
            dosage: '1 viên nén • Uống sau ăn sáng',
            time: '08:00 Sáng mỗi ngày',
            status: 'taken' as const,
          },
          {
            id: `med-${memberId}-2`,
            name: 'Metformin 500mg (Đường huyết)',
            dosage: '1 viên • Uống sau ăn tối',
            time: '19:30 Tối mỗi ngày',
            status: 'pending' as const,
          },
        ]
      : isChild
      ? [
          {
            id: `med-${memberId}-1`,
            name: 'Vitamin D3 + K2 & Canxi sinh học',
            dosage: '1 ống uống sau ăn sáng',
            time: '08:00 Sáng mỗi ngày',
            status: 'taken' as const,
          },
        ]
      : [
          {
            id: `med-${memberId}-1`,
            name: 'Omega-3 & Multivitamin',
            dosage: '1 viên sau ăn trưa',
            time: '12:30 Trưa mỗi ngày',
            status: 'taken' as const,
          },
        ];

    const upcomingVisit = contract?.doctorName
      ? {
          doctor: `${contract.doctorTitle ? contract.doctorTitle + ' ' : 'BSCKI. '}${contract.doctorName}`,
          specialty: contract.doctorSpecialty || 'Y học Gia đình & Nội khoa',
          hospital: contract.facilityName || 'Bệnh viện ĐHYD',
          time: '09:30',
          date: '27/10',
          mode: 'home' as const,
          note: 'Khám sức khỏe gia đình định kỳ tại nhà',
        }
      : undefined;

    result[memberId] = {
      id: memberId,
      name: p.fullName || `Thành viên ${idx + 1}`,
      relation: relation,
      age: age,
      avatar: avatar,
      bhyt: p.healthInsuranceNumber || 'Chưa cập nhật BHYT',
      bloodType: 'O+',
      allergies: allergiesStr,
      chronicCondition: isElderly
        ? 'Tăng huyết áp • Đái tháo đường Typ 2'
        : isChild
        ? 'Thể trạng phát triển bình thường'
        : 'Sức khỏe tổng quát tốt',
      status: isElderly ? 'warning' : 'good',
      statusText: isElderly ? 'Huyết áp cần chú ý nhẹ' : 'Chỉ số sức khỏe ổn định',
      bp: isElderly ? '135/85' : isChild ? '105/70' : '118/78',
      bpStatus: isElderly ? 'Hơi cao • Cần uống thuốc đều' : 'Bình thường',
      spo2: isElderly ? '98%' : '99%',
      heartRate: isElderly ? '76 lần/phút' : isChild ? '88 lần/phút' : '72 lần/phút',
      glucose: isElderly ? '6.8 mmol/L' : '5.4 mmol/L',
      glucoseStatus: isElderly ? 'Ổn định sau ăn' : 'Bình thường',
      lastUpdated: '07:30 Sáng hôm nay',
      medicines: medicines,
      upcomingVisit: upcomingVisit,
    };
  });

  return result;
}

export function FamilyDashboardView() {
  const workflow = useContractWorkflow();
  const session = getStoredAuthSession();
  const loggedInName =
    session.user?.name && !session.user.name.includes('(Chủ Hộ)')
      ? session.user.name
      : null;

  const [contracts, setContracts] = useState<MedicalContractListItem[]>([]);
  const [activeContract, setActiveContract] = useState<MedicalContractListItem | null>(null);
  const [realPatients, setRealPatients] = useState<PatientDto[]>([]);
  const [membersData, setMembersData] = useState<Record<string, MemberHealthData>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    contractsApi
      .getMedicalContracts()
      .then((res) => {
        if (!isMounted) return;
        const list: MedicalContractListItem[] = Array.isArray(res)
          ? res
          : (res as any)?.data && Array.isArray((res as any).data)
          ? (res as any).data
          : (res as any)?.data?.items && Array.isArray((res as any).data.items)
          ? (res as any).data.items
          : [];
        setContracts(list);
        if (list.length > 0) {
          const found = list.find((c: MedicalContractListItem) => c.contractStatus === 'ACTIVE') || list[0];
          setActiveContract(found);
          // Đồng bộ nếu đã có realPatients
          setRealPatients((currentPatients) => {
            if (currentPatients.length > 0) {
              setMembersData(convertPatientsToMembersData(currentPatients, found));
            }
            return currentPatients;
          });
        }
      })
      .catch((err) => {
        console.warn('Contracts API fetch fallback:', err);
      });

    patientsApi
      .getFamilyMembers()
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res)
          ? res
          : (res as any)?.data && Array.isArray((res as any).data)
          ? (res as any).data
          : [];
        if (list.length > 0) {
          setRealPatients(list);
          setActiveContract((currentContract) => {
            setMembersData(convertPatientsToMembersData(list, currentContract));
            return currentContract;
          });
        }
      })
      .catch((err) => {
        console.warn('Patients API fetch fallback:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const membersList = Object.values(membersData);
  const totalMembers = realPatients.length > 0 ? realPatients.length : membersList.length;
  const warningMembers = membersList.filter((m) => m.status === 'warning');
  const warningMembersCount = warningMembers.length;
  const warningMember = warningMembers.length > 0 ? warningMembers[0] : null;
  const upcomingVisitsCount = membersList.filter((m) => Boolean(m.upcomingVisit)).length;

  const headMember = realPatients.find((p) => p.relationshipToHead === 'SELF') || realPatients[0];
  const familyHeadName = headMember ? headMember.fullName : (loggedInName || session.user?.name || 'Gia Đình');

  const daysUntilExpiry = activeContract?.endDate
    ? Math.ceil((new Date(activeContract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Tổng hợp danh sách thuốc hôm nay của cả gia đình
  const familyMedicines: FamilyMedicationItem[] = membersList.flatMap((m) =>
    m.medicines.map((med) => {
      const isEvening =
        med.time.toLowerCase().includes('tối') ||
        med.time.includes('19:00') ||
        med.time.includes('20:00');
      const isNoon = med.time.toLowerCase().includes('trưa') || med.time.includes('12:00');
      return {
        id: `${m.id}-${med.id}`,
        memberId: m.id,
        memberName: m.name,
        relation: m.relation,
        medName: med.name,
        dosage: med.dosage,
        time: med.time,
        timeGroup: isEvening ? 'evening' : isNoon ? 'noon' : 'morning',
        status: med.status,
      };
    })
  );

  const totalMedicines = familyMedicines.length;
  const takenMedicines = familyMedicines.filter((item) => item.status === 'taken').length;
  const medPercent = totalMedicines > 0 ? Math.round((takenMedicines / totalMedicines) * 100) : 0;

  const handleToggleMedStatus = (memberId: string, medOriginalId: string) => {
    setMembersData((prev) => {
      const updated = { ...prev };
      const member = { ...updated[memberId] };
      member.medicines = member.medicines.map((m) =>
        m.id === medOriginalId
          ? { ...m, status: m.status === 'taken' ? 'pending' : 'taken' }
          : m
      );
      updated[memberId] = member;
      return updated;
    });

    setToastMessage('Đã cập nhật trạng thái uống thuốc hôm nay của gia đình!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. HEADER THOÁNG ĐÃNG TRỰC TIẾP TRÊN NỀN CANVAS (GIẢI PHÓNG KHUNG HỘP) */}
        <header className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tabular-nums text-[#2E37A4] bg-blue-50/80 border border-blue-200/60">
                  Hộ #{activeContract?.contractNumber || (session.user?.id ? `FAM-${session.user.id.slice(0, 6).toUpperCase()}` : 'FAM-NEW')}
                </span>
                <Link
                  href="/family/subscription"
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    activeContract
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200/60'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200/60'
                  }`}
                  title="Xem hợp đồng hoặc đổi Bác sĩ / Gói dịch vụ"
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeContract ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span>{activeContract?.packageName || 'Chưa Đăng Ký Gói Y Tế'}</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                Bảng Sức Khỏe Gia Đình: Hộ {familyHeadName}
              </h1>

              <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                Trung tâm điều hành sức khỏe hằng ngày · Theo dõi chỉ số sức khỏe, nhắc lịch uống thuốc và lịch khám bác sĩ tại nhà
              </p>
            </div>

            {/* Cụm nút hành động tinh gọn & phân cấp chuẩn */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/family/appointments"
                className="min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all whitespace-nowrap outline-hidden"
              >
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                <span>Đặt lịch khám</span>
              </Link>

              <Link
                href="/family/telemedicine"
                className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-sm font-medium shadow-xs hover:border-slate-300 transition-all whitespace-nowrap outline-hidden"
              >
                <span className="material-symbols-outlined text-[20px] text-[#2E37A4]">videocam</span>
                <span>Gọi video bác sĩ</span>
              </Link>

              <a
                href="tel:19006868"
                className="min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200/80 rounded-xl text-sm font-bold tabular-nums transition-colors whitespace-nowrap outline-hidden"
                title="Tổng đài y tế cấp cứu khẩn cấp 24/7"
              >
                <span className="material-symbols-outlined text-[19px] text-rose-600">emergency</span>
                <span>SOS 1900 6868</span>
              </a>
            </div>
          </div>
        </header>

        {/* 1.5. BANNER NHẮC THANH TOÁN VIETQR HỢP ĐỒNG (NẾU ĐANG CHỜ KÍCH HOẠT) */}
        {activeContract && activeContract.contractStatus !== 'ACTIVE' ? (
          <aside
            aria-label="Thanh toán kích hoạt hợp đồng"
            className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg shadow-emerald-950/15"
          >
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-white/15 text-emerald-100 border border-white/20 inline-block">
                  Hợp đồng #{activeContract.contractNumber}
                </span>
                <span className="text-xs text-emerald-200">· Chờ thanh toán kích hoạt</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Thanh Toán VietQR Để Kích Hoạt Quyền Lợi Chăm Sóc Sức Khỏe
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                Hợp đồng y tế 4 bên đã được xác nhận. Vui lòng hoàn tất thanh toán {activeContract.totalAmountVnd.toLocaleString('vi-VN')} đ để bắt đầu lịch khám và kết nối với bác sĩ gia đình.
              </p>
            </div>

            <Link
              href={`/family/billing?contractId=${activeContract.id}`}
              className="px-6 py-3 bg-white hover:bg-slate-100 text-emerald-800 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all self-start md:self-center shrink-0 flex items-center gap-2 cursor-pointer animate-pulse"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
              <span>Thanh Toán VietQR Ngay</span>
            </Link>
          </aside>
        ) : workflow?.step !== 'ACTIVE' && (
          <aside
            aria-label="Đăng ký Bác sĩ gia đình"
            className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#2E37A4] via-[#242c88] to-[#1a206b] text-white flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg shadow-blue-950/15"
          >
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-white/15 text-blue-100 border border-white/20 inline-block">
                  Quy Trình Chuẩn Bộ Y Tế 2026
                </span>
                <span className="text-xs text-blue-200">· Hợp đồng y tế điện tử 4 bên</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Bảo Vệ Sức Khỏe Gia Đình Toàn Diện Cùng Bác Sĩ Riêng Quản Nhiệm
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                Khám phá danh sách Bác sĩ gia đình chuyên môn cao (BV ĐHYD, Bạch Mai, Chợ Rẫy, Vinmec), chọn gói dịch vụ phù hợp và ký kết Hợp đồng điện tử 4 bên bảo chứng pháp lý.
              </p>
            </div>

            <Link
              href="/family/subscription/new"
              className="px-6 py-3 bg-white hover:bg-slate-100 text-[#2E37A4] rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all self-start md:self-center shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_search</span>
              <span>Chọn Bác Sĩ &amp; Đăng Ký Gói Ngay</span>
            </Link>
          </aside>
        )}

        {/* 1.8 THẺ HỢP ĐỒNG Y TẾ HIỆN TẠI & BÁC SĨ GIA ĐÌNH PHỤ TRÁCH CHÍNH (BACKEND SYNC) */}
        <section aria-label="Hợp đồng y tế & Bác sĩ gia đình" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Thông tin Hợp đồng Y tế Hiện tại */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#2E37A4] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">assignment</span>
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Hợp Đồng Y Tế Hiện Tại
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    activeContract?.contractStatus === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {activeContract?.contractStatus === 'ACTIVE' ? 'Đang hiệu lực' : 'Chờ hoàn tất'}
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {activeContract?.packageName || 'Gói Chăm Sóc Sức Khỏe Gia Đình Toàn Diện'}
                </h3>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                  <span>Mã HĐ: <strong className="text-slate-700">#{activeContract?.contractNumber || 'FMD-2026-HN-001'}</strong></span>
                  <span>·</span>
                  <span>Thời hạn: {activeContract?.startDate ? new Date(activeContract.startDate).toLocaleDateString('vi-VN') : '01/01/2026'} – {activeContract?.endDate ? new Date(activeContract.endDate).toLocaleDateString('vi-VN') : '31/12/2026'}</span>
                </div>
              </div>

              {daysUntilExpiry !== null && daysUntilExpiry <= 15 && daysUntilExpiry >= 0 && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-rose-600">notification_important</span>
                  <span>Hợp đồng sắp hết hạn trong {daysUntilExpiry} ngày! Vui lòng gia hạn để duy trì quyền lợi bác sĩ riêng.</span>
                </div>
              )}

              {/* Hạn ngạch quyền lợi */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-emerald-600">home</span>
                    Khám tại nhà còn lại
                  </div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">
                    {activeContract?.remainingHomeVisits ?? 3} / {activeContract?.totalHomeVisits ?? 4} <span className="text-xs font-normal text-slate-500">lượt</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-blue-600">videocam</span>
                    Tư vấn Telehealth
                  </div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">
                    {activeContract?.remainingTelehealth ?? 10} / {activeContract?.totalTelehealth ?? 12} <span className="text-xs font-normal text-slate-500">lượt</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
              <Link
                href="/family/subscription"
                className="text-[#2E37A4] font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>Xem chi tiết hợp đồng &amp; phụ lục</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
              <Link
                href="/family/billing"
                className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1"
              >
                <span>Hóa đơn VietQR</span>
                <span className="material-symbols-outlined text-[14px]">receipt_long</span>
              </Link>
            </div>
          </div>

          {/* Card 2: Bác Sĩ Gia Đình Phụ Trách Chính */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">stethoscope</span>
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Bác Sĩ Gia Đình Phụ Trách
                  </span>
                </div>
                {activeContract?.doctorId || activeContract?.doctorName ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2E37A4] border border-blue-200">
                    Bác sĩ quản nhiệm
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                    Đang chờ CSYT chỉ định
                  </span>
                )}
              </div>

              {activeContract?.doctorId || activeContract?.doctorName ? (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#2E37A4] flex items-center justify-center text-xl font-bold">
                      {activeContract.doctorName ? activeContract.doctorName.charAt(0) : 'B'}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        {activeContract.doctorTitle ? `${activeContract.doctorTitle} ` : 'BSCKI. '}
                        {activeContract.doctorName || 'Nguyễn Minh Tuấn'}
                      </h4>
                      <div className="text-xs text-slate-500 font-medium">
                        {activeContract.doctorSpecialty || 'Chuyên khoa Y học Gia đình & Nội khoa'} · {activeContract.facilityName || 'Bệnh viện ĐHYD'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="material-symbols-outlined text-[18px] text-rose-600">phone_in_talk</span>
                      <span>Hotline khẩn cấp:</span>
                      <strong className="text-slate-900 tabular-nums">{activeContract.doctorPhone || '0988 123 456'}</strong>
                    </div>
                    <a
                      href={`tel:${activeContract.doctorPhone || '0988123456'}`}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors shadow-xs"
                    >
                      Gọi ngay
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <span className="material-symbols-outlined text-[18px] text-amber-700">schedule</span>
                    <span>Đang chờ cơ sở y tế chỉ định bác sĩ</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hợp đồng của gia đình đã được ghi nhận. Cơ sở y tế <strong>{activeContract?.facilityName || 'Bệnh viện Đa khoa Quốc tế'}</strong> đang tiến hành phân bổ bác sĩ gia đình phù hợp trong vòng 24 giờ làm việc.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
              <Link
                href="/family/feedback"
                className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px] text-amber-500">star</span>
                <span>Đánh giá &amp; Góp ý bác sĩ</span>
              </Link>
              <Link
                href="/family/telemedicine"
                className="text-[#2E37A4] font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>Tư vấn qua video</span>
                <span className="material-symbols-outlined text-[14px]">videocam</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 2. CẢNH BÁO SỨC KHỎE NHẸ NHÀNG (KHI CÓ CHỈ SỐ CẦN CHÚ Ý) */}
        {warningMembersCount > 0 && warningMember && (
          <aside
            aria-label="Cảnh báo sức khỏe trong ngày"
            className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
          >
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-amber-900">
                  Lưu ý sức khỏe hôm nay: {warningMember.name} ({warningMember.bpStatus} - Huyết áp {warningMember.bp} mmHg)
                </div>
                <p className="text-xs sm:text-sm text-slate-700 mt-0.5 leading-relaxed">
                  Chỉ số cần theo dõi. Vui lòng kiểm tra lại vào buổi chiều và nhắc thành viên dùng thuốc đúng giờ theo chỉ định của bác sĩ phụ trách.
                </p>
              </div>
            </div>

            <Link
              href={`/family/members/${warningMember.id}`}
              className="min-h-9 px-4 py-2 bg-white hover:bg-amber-100/50 text-slate-900 border border-amber-300 font-medium text-xs sm:text-sm rounded-xl transition-colors self-start sm:self-auto shrink-0 inline-flex items-center justify-center whitespace-nowrap outline-hidden shadow-xs"
            >
              Xem chi tiết {warningMember.name.split(' ').slice(-1)[0]}
            </Link>
          </aside>
        )}

        {/* 3. DẢI 3 CHỈ SỐ NHỊP NGÀY (KPI) THOÁNG ĐẠT VỚI KHOẢNG THỞ LỚN */}
        <section
          aria-label="Tổng quan chỉ số hộ gia đình"
          className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6"
        >
          {/* KPI 1 */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Trạng thái cả gia đình
              </span>
              <span className="material-symbols-outlined text-slate-400 text-[20px]">group</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
              {totalMembers} thành viên
            </div>
            <div className="text-xs font-medium text-amber-800 flex items-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>{warningMembersCount} người cần chú ý huyết áp</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Uống thuốc hôm nay
              </span>
              <span className="material-symbols-outlined text-slate-400 text-[20px]">medication</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
              Đã uống {takenMedicines}/{totalMedicines} lần
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${medPercent}%` }}
                />
              </div>
              <div className="text-xs font-medium text-emerald-800 flex items-center justify-between">
                <span>Đạt {medPercent}%</span>
                <span className="text-slate-500 font-normal">Còn {totalMedicines - takenMedicines} lần chưa uống</span>
              </div>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Lịch khám sắp tới
              </span>
              <span className="material-symbols-outlined text-slate-400 text-[20px]">event_available</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
              {upcomingVisitsCount} lịch hẹn
            </div>
            <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5 pt-1">
              <span className="material-symbols-outlined text-[16px] text-[#2E37A4]">home</span>
              <span>
                {activeContract?.doctorName
                  ? `BS. ${activeContract.doctorName} (Khám tại nhà)`
                  : 'Gần nhất: 09:30 · 27/10 (Khám tại nhà)'}
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Chỉ Số Sức Khỏe Hôm Nay Của Các Thành Viên ({totalMembers})
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Cập nhật tự động từ thiết bị đo IoT gia đình và sổ theo dõi hàng ngày
              </p>
            </div>

            <Link
              href="/family/members"
              className="text-xs sm:text-sm font-semibold text-[#2E37A4] hover:text-[#222982] inline-flex items-center gap-1 hover:underline outline-hidden"
            >
              <span>Mở sổ Quản lý thành viên &amp; BHYT</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {membersList.map((m) => {
              const isWarning = m.status === 'warning';

              return (
                <Link
                  key={m.id}
                  href={`/family/members/${m.id}`}
                  className="group bg-white p-6 rounded-2xl border border-slate-200/70 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5 outline-hidden"
                >
                  {/* Hàng 1: Avatar, Họ tên, Tuổi, Vai trò & Badge Trạng thái */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                        {m.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-base text-slate-900 group-hover:text-[#2E37A4] transition-colors truncate">
                          {m.name}
                        </div>
                        <div className="text-xs text-slate-500 font-medium truncate mt-0.5">
                          {m.relation} · <span className="tabular-nums">{m.age}</span> tuổi
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${isWarning
                        ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                      />
                      <span>{isWarning ? 'Cần chú ý' : 'Ổn định'}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100/90">
                    <div className="text-center">
                      <span className="text-[11px] font-medium text-slate-500 block truncate">
                        Huyết áp
                      </span>
                      <span
                        className={`font-bold tabular-nums text-sm sm:text-base mt-1 block truncate ${isWarning ? 'text-amber-800' : 'text-slate-900'
                          }`}
                      >
                        {m.bp}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[11px] font-medium text-slate-500 block truncate">
                        SpO2
                      </span>
                      <span className="font-bold tabular-nums text-sm sm:text-base text-slate-900 mt-1 block truncate">
                        {m.spo2}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[11px] font-medium text-slate-500 block truncate">
                        Nhịp tim
                      </span>
                      <span className="font-bold tabular-nums text-sm sm:text-base text-slate-900 mt-1 block truncate">
                        {m.heartRate.split(' ')[0]}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[11px] font-medium text-slate-500 block truncate">
                        Glucose
                      </span>
                      <span className="font-bold tabular-nums text-sm sm:text-base text-slate-900 mt-1 block truncate">
                        {m.glucose.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Hàng 3: Nút mở hồ sơ chi tiết */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end text-xs">
                    <span className="font-semibold text-[#2E37A4] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 shrink-0">
                      <span>Xem hồ sơ chi tiết</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 5. LƯỚI BẤT ĐỐI XỨNG: LỊCH UỐNG THUỐC (2/3) + BÁC SĨ GIA ĐÌNH & QUYỀN LỢI (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          {/* Cột trái (2/3): Lịch uống thuốc hôm nay */}
          <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/70 shadow-xs p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-base sm:text-lg text-slate-900">
                  Lịch Uống Thuốc Hôm Nay Của Cả Gia Đình
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Nhắc nhở và kiểm tra nhanh việc dùng thuốc của từng thành viên trong ngày
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-semibold tabular-nums bg-slate-100 text-slate-800 self-start sm:self-auto shrink-0">
                Tiến độ: {medPercent}% ({takenMedicines}/{totalMedicines})
              </span>
            </div>

            <div className="space-y-3">
              {familyMedicines.map((item) => {
                const isTaken = item.status === 'taken';
                const originalMedId = item.id.replace(`${item.memberId}-`, '');

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isTaken ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-[#2E37A4]'
                          }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isTaken ? 'check' : 'medication'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-slate-900 truncate">
                          {item.medName}
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          <span className="font-medium text-slate-700">{item.memberName}</span> ({item.relation}) · {item.time} · {item.dosage}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleMedStatus(item.memberId, originalMedId)}
                      className={`min-h-9 px-4 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer outline-hidden whitespace-nowrap ${isTaken
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80'
                        : 'bg-white hover:bg-slate-100 text-[#2E37A4] border border-slate-300'
                        }`}
                    >
                      {isTaken ? 'Đã uống' : 'Bấm đã uống'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Cột phải (1/3): Bác sĩ gia đình phụ trách & Hạn mức khám */}
          <aside className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold text-base text-slate-900">
                Bác Sĩ Gia Đình
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Trực tuyến</span>
              </span>
            </div>

            {activeContract?.doctorName ? (
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#2E37A4] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                  {activeContract.doctorName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {activeContract.doctorTitle ? `${activeContract.doctorTitle} ` : 'BSCKI. '}
                    {activeContract.doctorName}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {activeContract.doctorSpecialty || 'Chuyên khoa Y học Gia đình & Nội khoa'} · {activeContract.facilityName || 'Bệnh viện liên kết'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 space-y-1">
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-700">schedule</span>
                  <span>Đang chờ chỉ định bác sĩ</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {activeContract ? 'Cơ sở y tế đang phân bổ bác sĩ gia đình chuyên trách cho hộ.' : 'Chưa có hợp đồng. Đăng ký gói để kết nối bác sĩ.'}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">Khám bác sĩ tại nhà</span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    Còn {activeContract?.remainingHomeVisits ?? 3}/{activeContract?.totalHomeVisits ?? 4} lượt
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2E37A4] rounded-full transition-all"
                    style={{
                      width: `${Math.round(
                        ((activeContract?.remainingHomeVisits ?? 3) / (activeContract?.totalHomeVisits || 4)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">Tư vấn Video 24/7</span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    Còn {activeContract?.remainingTelehealth ?? 10}/{activeContract?.totalTelehealth ?? 12} lượt
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{
                      width: `${Math.round(
                        ((activeContract?.remainingTelehealth ?? 10) / (activeContract?.totalTelehealth || 12)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-slate-600">Lịch khám kế tiếp</span>
                <span className="font-semibold tabular-nums text-[#2E37A4]">
                  {upcomingVisitsCount > 0 ? '09:30 · 27/10' : 'Chưa có lịch hẹn'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500">
                Hợp đồng #{activeContract?.contractNumber || 'FMD-2026-HN-001'}
              </span>
              <Link
                href="/family/subscription"
                className="font-semibold text-[#2E37A4] hover:text-[#222982] hover:underline outline-hidden"
              >
                Xem quyền lợi {activeContract?.packageName || 'gói VIP'}
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {/* Accessible Toast */}
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
        </div>
      )}
    </div>
  );
}
