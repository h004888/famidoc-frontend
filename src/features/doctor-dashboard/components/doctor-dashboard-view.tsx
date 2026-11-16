'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { doctorsApi, contractsApi, type DoctorProfileDto, type MedicalContractListItem } from '@/lib/api';
import { KpiStatCard } from '@/components/dashboard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

type QueueStatus = 'pending' | 'in_progress' | 'signed';

interface DoctorQueuePatient {
  id: string;
  name: string;
  chiefComplaint: string;
  triage: string;
  triageBg: string;
  time: string;
  family: string;
  avatarText: string;
  status: QueueStatus;
  emr: string;
  icd10: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

const INITIAL_PATIENTS: DoctorQueuePatient[] = [
  {
    id: 'PT-01',
    name: 'Nguyễn Văn Phúc (78 tuổi)',
    chiefComplaint: 'Tăng huyết áp định kỳ & xét nghiệm HbA1c tại nhà',
    triage: 'Cấp độ 2 (Ưu tiên cao)',
    triageBg: 'bg-amber-50 text-amber-700 border-amber-200',
    time: '09:00 Sáng nay',
    family: 'Hộ FAM-88219',
    avatarText: 'VP',
    status: 'pending',
    emr: '#EMR-88219',
    icd10: '[I10]',
    subjective: 'Bệnh nhân thấy hoa mắt nhẹ vào buổi sáng, không đau ngực khó thở, ăn ngủ tạm ổn.',
    objective: 'HA: 135/85 mmHg, Nhịp tim: 76 bpm, SpO2: 98%, Phổi trong, không ran, phù chân (-).',
    assessment: 'Tăng huyết áp nguyên phát độ 1 (ICD-10: I10), Đái tháo đường type 2 (E11.9)',
    plan: 'Tiếp tục Amlodipine 5mg sáng 1 viên. Theo dõi huyết áp tại nhà 2 lần/ngày. Hẹn khám lại sau 1 tháng.',
  },
  {
    id: 'PT-02',
    name: 'Lê Thu Trang (34 tuổi)',
    chiefComplaint: 'Khám thai định kỳ tuần 28 & tư vấn dinh dưỡng Telehealth',
    triage: 'Cấp độ 3 (Tiêu chuẩn)',
    triageBg: 'bg-blue-50 text-blue-700 border-blue-200',
    time: '10:30 Sáng nay',
    family: 'Hộ FAM-44012',
    avatarText: 'TT',
    status: 'pending',
    emr: '#EMR-44012',
    icd10: '[Z34.8]',
    subjective: 'Thai 28 tuần, cử động thai tốt, thỉnh thoảng mỏi lưng nhẹ, không phù, không đau bụng.',
    objective: 'HA: 115/75 mmHg, Cân nặng: 58kg (+8kg từ đầu thai kỳ), Tim thai: 142 bpm, BCTC: 24cm.',
    assessment: 'Thai kỳ 28 tuần đơn thai phát triển bình thường (ICD-10: Z34.8)',
    plan: 'Bổ sung Canxi & Sắt hữu cơ. Hướng dẫn đếm cử động thai. Tái khám sau 2 tuần tại BV Từ Dũ.',
  },
  {
    id: 'PT-03',
    name: 'Hoàng Anh Dũng (52 tuổi)',
    chiefComplaint: 'Đau khớp gối cấp tính sau chấn thương vận động nhẹ',
    triage: 'Cấp độ 3 (Tiêu chuẩn)',
    triageBg: 'bg-blue-50 text-blue-700 border-blue-200',
    time: '14:00 Chiều nay',
    family: 'Hộ FAM-11983',
    avatarText: 'AD',
    status: 'pending',
    emr: '#EMR-11983',
    icd10: '[M25.56]',
    subjective: 'Đau gối phải sau khi chạy bộ 2 ngày trước, sưng nhẹ, hạn chế gập gối tối đa, không sốt.',
    objective: 'Khớp gối phải sưng nhẹ, không tràn dịch lớn, dấu hiệu ngăn kéo (-), ấn đau khe khớp trong.',
    assessment: 'Chấn thương căng cơ/dây chằng gối phải mức độ nhẹ (ICD-10: M25.56)',
    plan: 'Chườm lạnh 15 phút x 3 lần/ngày. Giảm vận động nặng. Paracetamol 500mg khi đau. Siêu âm kiểm tra nếu còn đau sau 3 ngày.',
  },
  {
    id: 'PT-04',
    name: 'Trần Thị Bích (66 tuổi)',
    chiefComplaint: 'Tái khám rối loạn lipid máu & điều chỉnh Statin buổi tối',
    triage: 'Cấp độ 3 (Tiêu chuẩn)',
    triageBg: 'bg-blue-50 text-blue-700 border-blue-200',
    time: '08:15 Sáng nay',
    family: 'Hộ FAM-29011',
    avatarText: 'TB',
    status: 'in_progress',
    emr: '#EMR-29011',
    icd10: '[E78.5]',
    subjective: 'Không đau cơ, ngủ ngon, ăn uống điều độ giảm mỡ bão hòa.',
    objective: 'HA: 125/80 mmHg, LDL-C: 2.6 mmol/L, men gan AST/ALT bình thường.',
    assessment: 'Rối loạn chuyển hóa lipid máu hỗn hợp đáp ứng tốt (ICD-10: E78.5)',
    plan: 'Duy trì Atorvastatin 10mg uống tối. Xét nghiệm lại sau 3 tháng.',
  },
  {
    id: 'PT-05',
    name: 'Phạm Minh Khôi (9 tuổi)',
    chiefComplaint: 'Viêm mũi dị ứng theo mùa — đã hoàn tất đơn điện tử',
    triage: 'Cấp độ 3 (Tiêu chuẩn)',
    triageBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    time: '07:45 Sáng nay',
    family: 'Hộ FAM-51029',
    avatarText: 'MK',
    status: 'signed',
    emr: '#EMR-51029',
    icd10: '[J30.4]',
    subjective: 'Nghẹt mũi nhẹ buổi sáng, không sốt, ăn chơi bình thường.',
    objective: 'Nhiệt độ: 36.7°C, họng sạch, phổi thông khí đều hai bên.',
    assessment: 'Viêm mũi dị ứng nhẹ (ICD-10: J30.4)',
    plan: 'Rửa mũi nước muối sinh lý 0.9% ngày 2 lần, tránh bụi mịn.',
  },
];

export function DoctorDashboardView() {
  const router = useRouter();
  const [patients, setPatients] = useState<DoctorQueuePatient[]>(INITIAL_PATIENTS);
  const [activeQueue, setActiveQueue] = useState<QueueStatus>('pending');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('PT-01');
  const [showSignModal, setShowSignModal] = useState<boolean>(false);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [queuePage, setQueuePage] = useState<number>(1);

  const [doctorProfile, setDoctorProfile] = useState<DoctorProfileDto | null>(null);
  const [contracts, setContracts] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    doctorsApi
      .getDoctorMe()
      .then((data) => {
        if (!isMounted) return;
        if (data && data.id) setDoctorProfile(data);
      })
      .catch(() => {});

    contractsApi
      .getMedicalContracts({ role: 'DOCTOR' })
      .then((items) => {
        if (!isMounted) return;
        if (Array.isArray(items)) setContracts(items);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPatients = patients.filter((p) => p.status === activeQueue);
  const QUEUE_PAGE_SIZE = 2;
  const totalQueuePages = Math.max(Math.ceil(filteredPatients.length / QUEUE_PAGE_SIZE), 1);
  const safeQueuePage = Math.min(queuePage, totalQueuePages);
  const paginatedPatients = filteredPatients.slice(
    (safeQueuePage - 1) * QUEUE_PAGE_SIZE,
    safeQueuePage * QUEUE_PAGE_SIZE
  );

  const currentPatient =
    filteredPatients.find((p) => p.id === selectedPatientId) ||
    filteredPatients[0] ||
    patients[0];

  const handleQueueTabChange = (value: string) => {
    const nextTab = value as QueueStatus;
    setActiveQueue(nextTab);
    setQueuePage(1);
    const firstInTab = patients.find((p) => p.status === nextTab);
    if (firstInTab) {
      setSelectedPatientId(firstInTab.id);
    }
  };

  const handleConfirmSignature = () => {
    setIsSigning(true);
    setTimeout(() => {
      setIsSigning(false);
      setShowSignModal(false);
      setPatients((prev) =>
        prev.map((p) => (p.id === currentPatient.id ? { ...p, status: 'signed' } : p))
      );
      toast.success(
        `Đã ký số HSM Viettel-CA và phát hành đơn thuốc điện tử cho bệnh nhân ${currentPatient.name}!`
      );
    }, 700);
  };

  const clinicalKpis = [
    {
      title: 'Ca khám trong ngày',
      value: '12 ca',
      sub: '6 tại nhà • 6 Telehealth',
      icon: 'calendar_month',
      iconBg: 'bg-primary/10 text-primary',
      badge: '+15%',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Hàng chờ lâm sàng',
      value: `${patients.filter((p) => p.status === 'pending').length} ca`,
      sub: 'Thời gian chờ TB 14 phút',
      icon: 'hourglass_top',
      iconBg: 'bg-amber-50 text-amber-600',
      badge: 'Đang trực',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      title: 'Chờ ký số Viettel-CA',
      value: '5 đơn',
      sub: 'Đơn điện tử cần ký trước 18h',
      icon: 'draw',
      iconBg: 'bg-rose-50 text-rose-600',
      badge: 'Khẩn cấp',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      title: 'Đánh giá chất lượng SLA',
      value: '4.95 / 5.0',
      sub: '420+ lượt phản hồi tích cực',
      icon: 'star',
      iconBg: 'bg-emerald-50 text-emerald-600',
      badge: 'Xuất sắc',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  return (
    <div className="min-h-full bg-[#f5f6f8] font-sans text-slate-900 antialiased">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Doctor Profile Banner */}
        <Card className="rounded-2xl border-slate-200/80 bg-white py-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <CardContent className="flex flex-col items-start justify-between gap-5 px-6 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0037c1] to-[#00D3C7] text-xl font-bold text-white shadow-md ring-4 ring-primary/10">
                  TN
                </div>
                <span
                  className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white"
                  title="Trạng thái: Đang trực tuyến"
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    PGS.TS Nguyễn Trọng Nghĩa
                  </h1>
                  <Badge
                    variant="outline"
                    className="gap-1 rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700"
                  >
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    CCHN: 004128/BYT
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Bác sĩ gia đình cao cấp • Trưởng khoa Nội Tổng quát •{' '}
                  <span className="font-semibold text-slate-700">BV Đại học Y Dược TP.HCM</span>
                </p>
              </div>
            </div>

            <div className="flex w-full items-center justify-between gap-4 border-t border-slate-100 pt-3 md:w-auto md:justify-end md:border-t-0 md:pt-0">
              <div className="text-left md:text-right">
                <span className="block text-[11px] font-medium text-slate-500">
                  Thu nhập Escrow khả dụng:
                </span>
                <span className="text-base font-bold text-primary tabular-nums">18.450.000 đ</span>
              </div>
              <Button asChild className="rounded-xl px-4 py-2.5 text-xs font-bold sm:text-sm">
                <Link href="/doctor/telemedicine">
                  <span className="material-symbols-outlined text-[18px]">videocam</span>
                  <span>Phòng khám WebRTC</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 4 KPI Clinical Highlights */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {clinicalKpis.map((kpi, idx) => (
            <KpiStatCard
              key={idx}
              title={kpi.title}
              value={kpi.value}
              badgeText={kpi.badge}
              badgeClassName={kpi.badgeBg}
              subtitle={kpi.sub}
              icon={kpi.icon}
              iconClassName={kpi.iconBg}
            />
          ))}
        </div>

        {/* Quick Portal Navigation Shortcuts */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link
            href="/doctor/timetable"
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[22px]">calendar_clock</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-slate-900 transition-colors group-hover:text-primary">
                Lịch Trực &amp; Panel Cap
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500 tabular-nums">112/150 Hộ gia đình (74%)</p>
            </div>
          </Link>

          <Link
            href="/doctor/encounters"
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[22px]">clinical_notes</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-slate-900 transition-colors group-hover:text-primary">
                Khám SOAP &amp; Kê Đơn
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">Ký số HSM Viettel-CA</p>
            </div>
          </Link>

          <Link
            href="/doctor/telemedicine"
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[22px]">videocam</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-slate-900 transition-colors group-hover:text-primary">
                Tư Vấn WebRTC 24/7
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">Mã hóa E2EE chuẩn y tế</p>
            </div>
          </Link>

          <Link
            href="/doctor/verification"
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-slate-900 transition-colors group-hover:text-primary">
                Xác Thực CCHN BYT
              </h3>
              <p className="mt-0.5 text-[11px] font-semibold text-emerald-600">CCHN-004128 Hợp lệ</p>
            </div>
          </Link>
        </div>

        {/* Main Workspace: Patient Queue & SOAP Note Form */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Queue List */}
          <Card className="gap-4 rounded-2xl border-slate-200/80 bg-white py-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] lg:col-span-5">
            <CardHeader className="space-y-3 border-b border-slate-100 px-5 pb-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <span className="material-symbols-outlined text-primary">queue</span>
                    <span>Hàng Đợi Khám Hôm Nay</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Danh sách bệnh nhân đăng ký theo giờ
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary tabular-nums"
                >
                  {filteredPatients.length} ca chờ
                </Badge>
              </div>

              <Tabs value={activeQueue} onValueChange={handleQueueTabChange}>
                <TabsList className="flex w-full overflow-x-auto rounded-xl bg-slate-100 p-1 sm:grid sm:grid-cols-3">
                  <TabsTrigger value="pending" className="rounded-lg text-xs font-semibold">
                    Chờ khám
                  </TabsTrigger>
                  <TabsTrigger value="in_progress" className="rounded-lg text-xs font-semibold">
                    Đang khám
                  </TabsTrigger>
                  <TabsTrigger value="signed" className="rounded-lg text-xs font-semibold">
                    Đã ký số
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <CardContent className="space-y-3 px-5">
              {paginatedPatients.map((p) => {
                const isSelected = p.id === currentPatient.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`cursor-pointer space-y-2.5 rounded-xl border p-4 shadow-2xs transition-all ${
                      isSelected
                        ? 'border-primary bg-white shadow-xs ring-2 ring-primary/20'
                        : 'border-slate-200/80 bg-slate-50/50 hover:border-primary/40 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                            {p.avatarText}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 sm:text-sm">{p.name}</h4>
                            {isSelected && (
                              <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                                Đang chọn
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-primary">{p.family}</span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${p.triageBg}`}
                      >
                        {p.triage}
                      </Badge>
                    </div>

                    <p className="line-clamp-2 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Lý do:</span> {p.chiefComplaint}
                    </p>

                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5 text-xs">
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 tabular-nums">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {p.time}
                      </span>
                      {/* BUTTON PHẢI GIỮ EXACT TEXT "Mở Phiếu khám" VÀ CLASS "py-2" ĐỂ PASS UT-CMP-15 */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/doctor/encounters?patientId=${p.id}`);
                        }}
                        className="flex min-h-[40px] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-2xs transition-colors hover:bg-primary/90"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit_document</span>
                        <span>Mở Phiếu khám</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {totalQueuePages > 1 && (
                <Pagination
                  currentPage={safeQueuePage}
                  totalPages={totalQueuePages}
                  onPageChange={setQueuePage}
                />
              )}
            </CardContent>
          </Card>

          {/* Right: Quick SOAP Note Pad */}
          <Card
            key={currentPatient.id}
            className="gap-4 rounded-2xl border-slate-200/80 bg-white py-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] lg:col-span-7"
          >
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-5 pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <span className="material-symbols-outlined text-primary">clinical_notes</span>
                  <span>Phiếu Khám Điện Tử Nhanh (SOAP)</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Bệnh nhân: <strong className="text-slate-900">{currentPatient.name}</strong> • Hồ sơ{' '}
                  <span className="tabular-nums">{currentPatient.emr}</span>
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="rounded-lg border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-primary tabular-nums"
              >
                ICD-10: {currentPatient.icd10}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-3.5 px-5">
              <div className="space-y-1">
                <Label htmlFor="soap-subjective" className="text-xs font-bold text-slate-800">
                  S - Subjective (Triệu chứng cơ năng &amp; Tiền sử)
                </Label>
                <Textarea
                  id="soap-subjective"
                  rows={2}
                  defaultValue={currentPatient.subjective}
                  className="rounded-xl border-slate-200 bg-slate-50 text-xs focus-visible:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="soap-objective" className="text-xs font-bold text-slate-800">
                  O - Objective (Khám thực thể &amp; Dấu hiệu sinh tồn)
                </Label>
                <Textarea
                  id="soap-objective"
                  rows={2}
                  defaultValue={currentPatient.objective}
                  className="rounded-xl border-slate-200 bg-slate-50 text-xs focus-visible:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="soap-assessment" className="text-xs font-bold text-slate-800">
                  A - Assessment (Chẩn đoán lâm sàng)
                </Label>
                <Input
                  id="soap-assessment"
                  type="text"
                  defaultValue={currentPatient.assessment}
                  className="rounded-xl border-slate-200 bg-slate-50 text-xs font-semibold text-primary focus-visible:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="soap-plan" className="text-xs font-bold text-slate-800">
                  P - Plan (Phác đồ &amp; Kê đơn điện tử)
                </Label>
                <Textarea
                  id="soap-plan"
                  rows={2}
                  defaultValue={currentPatient.plan}
                  className="rounded-xl border-slate-200 bg-slate-50 text-xs focus-visible:bg-white"
                />
              </div>

              <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-100 pt-2 sm:flex-row sm:items-center">
                <Link
                  href={`/doctor/encounters?patientId=${currentPatient.id}`}
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <span>Mở giao diện Kê đơn chuyên sâu</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      toast.success(`Đã lưu nháp hồ sơ SOAP cho bệnh nhân ${currentPatient.name}`)
                    }
                    className="flex-1 rounded-xl text-xs font-semibold sm:flex-none"
                  >
                    Lưu nháp
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowSignModal(true)}
                    className="flex-1 cursor-pointer rounded-xl text-xs font-bold sm:flex-none"
                  >
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>Ký số HSM &amp; Hoàn tất</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Accessible shadcn Dialog xác thực ký số Viettel-CA */}
      <Dialog open={showSignModal} onOpenChange={setShowSignModal}>
        <DialogContent className="rounded-3xl border-slate-200 sm:max-w-md">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <span className="material-symbols-outlined text-[24px] text-primary">verified_user</span>
              <span>Xác Thực Ký Số Viettel-CA Cloud HSM</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Kiểm tra thông tin hồ sơ trước khi phát hành đơn thuốc điện tử ký số
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Bệnh nhân tiếp nhận:</span>
              <strong className="text-slate-900">{currentPatient.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mã bệnh án điện tử:</span>
              <span className="font-bold text-primary tabular-nums">{currentPatient.emr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bác sĩ ký số:</span>
              <strong className="text-slate-900">PGS.TS Nguyễn Trọng Nghĩa</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Chứng thư CCHN:</span>
              <span className="font-semibold text-emerald-700 tabular-nums">
                004128/BYT (Viettel-CA Level 2)
              </span>
            </div>
            <div className="border-t border-blue-200/60 pt-2 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-800">Chẩn đoán: </span>
              {currentPatient.assessment}
            </div>
          </div>

          <p className="text-xs italic text-slate-500">
            Đơn thuốc điện tử sau khi ký số sẽ được tự động đồng bộ lên Hệ thống Đơn thuốc Quốc gia (Bộ Y tế) và gửi đến ứng dụng của người nhà.
          </p>

          <DialogFooter className="flex-row gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSignModal(false)}
              disabled={isSigning}
              className="flex-1 rounded-xl text-xs font-semibold text-slate-600"
            >
              Hủy / Xem lại
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSignature}
              disabled={isSigning}
              className="flex-1 rounded-xl text-xs font-bold"
            >
              {isSigning ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Đang ký số HSM...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Xác nhận Ký số</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}