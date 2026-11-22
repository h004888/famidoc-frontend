'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileCheck2,
  Gavel,
  HelpCircle,
  Info,
  MessageSquarePlus,
  Paperclip,
  RefreshCw,
  RotateCcw,
  Scale,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { SupportCaseThread } from '@/components/shared/support-case-thread';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  contractsApi,
  getSupportCaseStatusLabel,
  isOpenSupportCaseStatus,
  isValidSupportAttachmentFile,
  readExistingSupportCaseId,
  reviewsApi,
  SUPPORT_CASE_STATUS_STYLES,
  SUPPORT_CASE_TYPE_LABELS,
  supportCasesApi,
  type ComplaintItem,
  type ComplaintStatus,
  type FourPartyContract,
  type SupportCaseDetail,
  type SupportCaseSummary,
} from '@/lib/api';
import { extractErrorMessage } from '@/lib/api/error-handler';
import {
  COMPLAINT_OUTCOME_DESCRIPTIONS,
  COMPLAINT_STATUS_LABELS,
  FAMILY_COMPLAINT_CATEGORIES,
  getComplaintCategoryLabel,
  type ComplaintCategory,
} from '@/lib/complaint-labels';
import { cn } from '@/lib/utils';

export interface DoctorEncounterReview {
  id: string;
  encounterDate: string;
  encounterType: 'home_visit' | 'telehealth';
  doctorName: string;
  doctorAvatar: string;
  hospital: string;
  memberTreated: string;
  status: 'reviewed' | 'pending';
  overallRating?: number;
  expertiseRating?: number;
  mannerRating?: number;
  punctualityRating?: number;
  reviewComment?: string;
  reviewedAt?: string;
}

const INITIAL_ENCOUNTERS: DoctorEncounterReview[] = [
  {
    id: 'enc-01',
    encounterDate: '24/10/2026',
    encounterType: 'home_visit',
    doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
    doctorAvatar:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
    hospital: 'BV Đại học Y Dược TP.HCM',
    memberTreated: 'Nguyễn Văn Phúc (Ông nội)',
    status: 'pending',
  },
  {
    id: 'enc-02',
    encounterDate: '18/10/2026',
    encounterType: 'telehealth',
    doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
    doctorAvatar:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
    hospital: 'BV Đại học Y Dược TP.HCM',
    memberTreated: 'Bé Nguyễn Minh An (Con trai)',
    status: 'reviewed',
    overallRating: 5,
    expertiseRating: 5,
    mannerRating: 5,
    punctualityRating: 5,
    reviewComment:
      'Bác sĩ giải thích rất kỹ về liều lượng siro hạ sốt và hướng dẫn rửa mũi cho bé rất tận tình.',
    reviewedAt: '18/10/2026 15:45',
  },
  {
    id: 'enc-03',
    encounterDate: '10/10/2026',
    encounterType: 'home_visit',
    doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
    doctorAvatar:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
    hospital: 'BV Đại học Y Dược TP.HCM',
    memberTreated: 'Trần Thu Hà (Vợ)',
    status: 'reviewed',
    overallRating: 5,
    expertiseRating: 5,
    mannerRating: 5,
    punctualityRating: 5,
    reviewComment:
      'Đo điện tim và lấy mẫu xét nghiệm tại nhà nhanh chóng, nhẹ nhàng, bác sĩ lịch sự và đúng giờ.',
    reviewedAt: '10/10/2026 11:20',
  },
];

const STATUS_STYLES: Record<ComplaintStatus, string> = {
  SUBMITTED: 'border-amber-300 bg-amber-50 text-amber-900',
  INVESTIGATING: 'border-blue-300 bg-blue-50 text-blue-900',
  RESOLVED: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  CLOSED: 'border-slate-300 bg-slate-100 text-slate-700',
};

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});

function formatComplaintDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? dateFormat.format(parsed) : value;
}

function isAllowedEvidenceFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    mime === 'application/pdf' ||
    mime === 'image/png' ||
    mime === 'image/jpeg' ||
    mime === 'image/jpg' ||
    name.endsWith('.pdf') ||
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg')
  );
}

function evidenceFileNameFromKey(key: string): string {
  const parts = key.split('/');
  return parts[parts.length - 1] || key;
}

const APPEAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function isWithinAppealWindow(resolvedAt?: string | null): boolean {
  if (!resolvedAt) return true;
  const parsed = Date.parse(resolvedAt);
  if (!Number.isFinite(parsed)) return true;
  return Date.now() - parsed <= APPEAL_WINDOW_MS;
}

export function FamilyFeedbackView() {
  const requestedCaseId = useSearchParams()?.get('supportCaseId')?.trim();
  const [activeTab, setActiveTab] = useState<'reviews' | 'disputes'>('reviews');
  const [encounters, setEncounters] =
    useState<DoctorEncounterReview[]>(INITIAL_ENCOUNTERS);

  // Dữ liệu thật cho Hợp đồng & Khiếu nại của gia đình
  const [contracts, setContracts] = useState<FourPartyContract[]>([]);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [complaintsTotal, setComplaintsTotal] = useState(0);
  const [complaintsPage, setComplaintsPage] = useState(1);
  const [complaintsStatus, setComplaintsStatus] = useState<
    ComplaintStatus | ''
  >('');
  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [complaintsError, setComplaintsError] = useState('');

  // Hồ sơ xem xét lại / câu hỏi gắn theo khiếu nại
  const [complaintSupportCases, setComplaintSupportCases] = useState<
    SupportCaseSummary[]
  >([]);

  // Modal chi tiết khiếu nại & phán quyết Admin
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(
    null,
  );
  const [complaintDetail, setComplaintDetail] = useState<ComplaintItem | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Luồng Xem xét lại & Câu hỏi ngay trong modal chi tiết khiếu nại
  const [detailCases, setDetailCases] = useState<SupportCaseSummary[]>([]);
  const [activeCaseDetail, setActiveCaseDetail] =
    useState<SupportCaseDetail | null>(null);
  const [caseDetailLoading, setCaseDetailLoading] = useState(false);
  const [composerMode, setComposerMode] = useState<'APPEAL' | 'QUESTION' | null>(
    null,
  );
  const [composerMessage, setComposerMessage] = useState('');
  const [composerFile, setComposerFile] = useState<File | null>(null);
  const [composerError, setComposerError] = useState('');
  const [composerSubmitting, setComposerSubmitting] = useState(false);

  // Modal Review State
  const [selectedEncounterForReview, setSelectedEncounterForReview] =
    useState<DoctorEncounterReview | null>(null);
  const [ratingOverall, setRatingOverall] = useState<number>(5);
  const [ratingExpertise, setRatingExpertise] = useState<number>(5);
  const [ratingManner, setRatingManner] = useState<number>(5);
  const [ratingPunctuality, setRatingPunctuality] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');

  // Modal Gửi khiếu nại (khớp 100% SubmitIncidentComplaintDto)
  const [showCreateDisputeModal, setShowCreateDisputeModal] =
    useState<boolean>(false);
  const [disputeContractId, setDisputeContractId] = useState<string>('');
  const [disputeCategory, setDisputeCategory] =
    useState<ComplaintCategory>('DOCTOR_ABSENT');
  const [disputeDescription, setDisputeDescription] = useState<string>('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [disputeSubmitError, setDisputeSubmitError] = useState<string>('');
  const [disputeSubmitting, setDisputeSubmitting] = useState<boolean>(false);

  const complaintEligibleContracts = contracts.filter(
    (item) => Boolean(item.doctorId || item.assignedDoctorId),
  );

  const loadComplaintSupportCases = useCallback(async () => {
    try {
      const pageData = await supportCasesApi.list({
        type: 'COMPLAINT',
        limit: 50,
      });
      setComplaintSupportCases(pageData.items ?? []);
    } catch {
      // Không chặn hiển thị danh sách khiếu nại chính nếu phần hồ sơ bổ sung chưa tải được
    }
  }, []);

  const loadComplaints = useCallback(
    async (page: number, status: ComplaintStatus | '') => {
      setComplaintsLoading(true);
      setComplaintsError('');
      try {
        const [result] = await Promise.all([
          reviewsApi.listComplaints({
            page,
            limit: 20,
            status: status || undefined,
          }),
          loadComplaintSupportCases(),
        ]);
        setComplaints(result.items ?? []);
        setComplaintsTotal(result.total ?? 0);
      } catch (cause) {
        setComplaintsError(
          extractErrorMessage(
            cause,
            'Không thể tải danh sách khiếu nại của hộ gia đình.',
          ),
        );
      } finally {
        setComplaintsLoading(false);
      }
    },
    [loadComplaintSupportCases],
  );

  useEffect(() => {
    let active = true;
    contractsApi
      .getMedicalContracts({ all: true })
      .then((list) => {
        if (!active) return;
        setContracts(list);
        const preferred =
          list.find(
            (c) =>
              c.status === 'ACTIVE' && Boolean(c.doctorId || c.assignedDoctorId),
          ) ??
          list.find((c) => Boolean(c.doctorId || c.assignedDoctorId)) ??
          list[0];
        if (preferred) {
          setDisputeContractId((current) => current || preferred.id);
        }
      })
      .catch(() => {
        // Không chặn tải danh sách khiếu nại nếu chưa có hợp đồng
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void loadComplaints(complaintsPage, complaintsStatus);
  }, [complaintsPage, complaintsStatus, loadComplaints]);

  const loadSupportCaseDetail = useCallback(async (caseId: string) => {
    setCaseDetailLoading(true);
    try {
      const detail = await supportCasesApi.detail(caseId);
      setActiveCaseDetail(detail);
      return detail;
    } catch (cause) {
      toast.error(extractErrorMessage(cause, 'Không tải được trao đổi với Admin.'));
      return null;
    } finally {
      setCaseDetailLoading(false);
    }
  }, []);

  const openComplaintDetail = useCallback(async (
    complaintId: string,
    item: ComplaintItem | null = null,
    supportCase: SupportCaseDetail | null = null,
  ) => {
    setSelectedComplaintId(complaintId);
    setComplaintDetail(item);
    setDetailError('');
    setDetailLoading(true);
    setDetailCases([]);
    setActiveCaseDetail(supportCase);
    setComposerMode(null);
    setComposerMessage('');
    setComposerFile(null);
    setComposerError('');
    try {
      const [fresh, casesPage] = await Promise.all([
        reviewsApi.getComplaintById(complaintId),
        supportCasesApi
          .list({ complaintId, limit: 10 })
          .catch(() => ({ items: [] as SupportCaseSummary[] })),
      ]);
      setComplaintDetail(fresh);
      const foundCases = casesPage.items ?? [];
      setDetailCases(foundCases);
      if (!supportCase && foundCases[0]) {
        await loadSupportCaseDetail(foundCases[0].id);
      }
    } catch (cause) {
      setDetailError(
        extractErrorMessage(cause, 'Không tải được chi tiết khiếu nại.'),
      );
    } finally {
      setDetailLoading(false);
    }
  }, [loadSupportCaseDetail]);

  useEffect(() => {
    if (!requestedCaseId) return;
    let active = true;
    supportCasesApi.detail(requestedCaseId).then((detail) => {
      if (!active) return;
      if (detail.caseType === 'PAYMENT_ISSUE' || !detail.complaintId) {
        toast.error('Không tìm thấy hồ sơ hỗ trợ khiếu nại.');
        return;
      }
      void openComplaintDetail(detail.complaintId, null, detail);
    }).catch((cause) => {
      if (active) toast.error(extractErrorMessage(cause, 'Không mở được hồ sơ từ thông báo.'));
    });
    return () => { active = false; };
  }, [openComplaintDetail, requestedCaseId]);

  const handleSubmitComplaintSupportCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintDetail || !composerMode || composerSubmitting) return;
    setComposerError('');

    const trimmed = composerMessage.trim();
    if (trimmed.length < 10 || trimmed.length > 2000) {
      setComposerError('Nội dung gửi phải có độ dài từ 10 đến 2.000 ký tự.');
      return;
    }

    setComposerSubmitting(true);
    try {
      let attachmentKeys: string[] | undefined;
      if (composerFile) {
        const uploaded = await supportCasesApi.uploadAttachment(composerFile);
        attachmentKeys = [uploaded.attachmentKey];
      }

      const created = await supportCasesApi.createComplaintCase({
        complaintId: complaintDetail.id,
        mode: composerMode,
        message: trimmed,
        ...(attachmentKeys ? { attachmentKeys } : {}),
      });

      setComposerMode(null);
      setComposerMessage('');
      setComposerFile(null);
      setActiveCaseDetail(created);

      const refreshedPage = await supportCasesApi
        .list({ complaintId: complaintDetail.id, limit: 10 })
        .catch(() => null);
      if (refreshedPage?.items) {
        setDetailCases(refreshedPage.items);
      }
      await loadComplaintSupportCases();

      toast.success(
        composerMode === 'APPEAL'
          ? `Đã gửi yêu cầu xem xét lại (${created.caseCode}). Ban quản trị sẽ xem lại toàn bộ hồ sơ và phản hồi tại đây.`
          : `Đã gửi câu hỏi trong hồ sơ (${created.caseCode}).`,
      );
    } catch (cause) {
      const existingId = readExistingSupportCaseId(cause);
      if (existingId && await loadSupportCaseDetail(existingId)) {
        setComposerMode(null);
        setComposerMessage('');
        setComposerFile(null);
        const cases = await supportCasesApi.list({ complaintId: complaintDetail.id, limit: 10 })
          .catch(() => null);
        if (cases) setDetailCases(cases.items ?? []);
        await loadComplaintSupportCases();
        return;
      }
      setComposerError(
        extractErrorMessage(
          cause,
          'Không gửi được yêu cầu. Vui lòng kiểm tra lại và thử lại.',
        ),
      );
    } finally {
      setComposerSubmitting(false);
    }
  };

  const handleOpenReview = (enc: DoctorEncounterReview) => {
    setSelectedEncounterForReview(enc);
    setRatingOverall(enc.overallRating || 5);
    setRatingExpertise(enc.expertiseRating || 5);
    setRatingManner(enc.mannerRating || 5);
    setRatingPunctuality(enc.punctualityRating || 5);
    setReviewComment(enc.reviewComment || '');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounterForReview) return;

    try {
      await reviewsApi.submitDoctorReview({
        doctorId: selectedEncounterForReview.id,
        rating: ratingOverall,
        comment:
          reviewComment.trim() ||
          'Dịch vụ chu đáo, bác sĩ chuyên môn vững vàng.',
      });
    } catch {
      // Fallback
    }

    setEncounters((prev) =>
      prev.map((enc) =>
        enc.id === selectedEncounterForReview.id
          ? {
              ...enc,
              status: 'reviewed',
              overallRating: ratingOverall,
              expertiseRating: ratingExpertise,
              mannerRating: ratingManner,
              punctualityRating: ratingPunctuality,
              reviewComment:
                reviewComment.trim() ||
                'Dịch vụ chu đáo, bác sĩ chuyên môn vững vàng.',
              reviewedAt: new Date().toLocaleString('vi-VN'),
            }
          : enc,
      ),
    );

    setSelectedEncounterForReview(null);
    toast.success(
      'Cảm ơn quý gia đình! Đánh giá chất lượng bác sĩ đã được ghi nhận vào hồ sơ SLA.',
    );
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disputeSubmitting) return;
    setDisputeSubmitError('');

    if (!disputeContractId) {
      setDisputeSubmitError(
        'Vui lòng chọn hợp đồng dịch vụ y tế có bác sĩ phụ trách để gửi khiếu nại.',
      );
      return;
    }
    const trimmedDescription = disputeDescription.trim();
    if (trimmedDescription.length < 10 || trimmedDescription.length > 4000) {
      setDisputeSubmitError(
        'Mô tả chi tiết sự việc phải từ 10 đến 4000 ký tự.',
      );
      return;
    }

    setDisputeSubmitting(true);
    try {
      let evidenceKeys: string[] | undefined;
      if (evidenceFile) {
        const uploaded = await reviewsApi.uploadComplaintEvidence(evidenceFile);
        evidenceKeys = [uploaded.evidenceKey];
      }

      const created = await reviewsApi.submitComplaint({
        contractId: disputeContractId,
        category: disputeCategory,
        description: trimmedDescription,
        ...(evidenceKeys ? { evidenceKeys } : {}),
      });

      setShowCreateDisputeModal(false);
      setDisputeDescription('');
      setEvidenceFile(null);
      setActiveTab('disputes');
      setComplaintsStatus('');
      setComplaintsPage(1);
      await loadComplaints(1, '');
      toast.success(
        `Đã gửi khiếu nại ${created.complaintCode} đến Ban Quản Trị FamiDoc để tiếp nhận thụ lý.`,
      );
    } catch (cause) {
      setDisputeSubmitError(
        extractErrorMessage(
          cause,
          'Không gửi được khiếu nại. Vui lòng kiểm tra lại thông tin.',
        ),
      );
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(complaintsTotal / 20));

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <div className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. HEADER CHÍNH */}
        <header className="space-y-4">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link
              href="/family"
              className="hover:text-[#2E37A4] transition-colors"
            >
              Bảng Sức Khỏe Gia Đình
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">
              Đánh Giá &amp; Khiếu Nại
            </span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Tiếp nhận &amp; Theo dõi minh bạch 4 bước</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                Đánh Giá Bác Sĩ &amp; Trung Tâm Khiếu Nại Dịch Vụ
              </h1>

              <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                Đánh giá trải nghiệm sau mỗi ca khám, gửi phản ánh sự cố và theo
                dõi trực tiếp biên bản xác minh từ Cơ sở y tế cùng phán quyết
                chính thức của Ban quản trị FamiDoc.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDisputeSubmitError('');
                  setShowCreateDisputeModal(true);
                }}
                className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[19px]">
                  report_problem
                </span>
                <span>Gửi khiếu nại dịch vụ</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 px-1 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'border-[#2E37A4] text-[#2E37A4]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">
                hotel_class
              </span>
              <span>Đánh Giá Bác Sĩ Sau Ca Khám ({encounters.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('disputes')}
              className={`pb-3 px-1 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'disputes'
                  ? 'border-[#2E37A4] text-[#2E37A4]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">
                gavel
              </span>
              <span>
                Khiếu Nại &amp; Sự Cố Dịch Vụ ({complaintsTotal})
              </span>
            </button>
          </div>
        </header>

        {/* 2. TAB 1: ĐÁNH GIÁ BÁC SĨ SAU CA KHÁM */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                  <span className="material-symbols-outlined text-2xl">
                    star
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums text-slate-900">
                    4.9 / 5.0
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Điểm hài lòng trung bình toàn hộ
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2E37A4] flex items-center justify-center shrink-0 border border-blue-200">
                  <span className="material-symbols-outlined text-2xl">
                    medical_services
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums text-slate-900">
                    {encounters.filter((e) => e.status === 'reviewed').length} /{' '}
                    {encounters.length}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Lượt khám đã gửi phản hồi
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                  <span className="material-symbols-outlined text-2xl">
                    verified
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums text-slate-900">
                    100%
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Bác sĩ đạt tiêu chuẩn SLA y tế
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#2E37A4]">
                  clinical_notes
                </span>
                <span>Lịch Sử Ca Khám Của Hộ Gia Đình</span>
              </h2>

              <div className="space-y-3">
                {encounters.map((enc) => (
                  <div
                    key={enc.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <img
                        src={enc.doctorAvatar}
                        alt={enc.doctorName}
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm sm:text-base">
                            {enc.doctorName}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-600 font-medium">
                            {enc.hospital}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              enc.encounterType === 'home_visit'
                                ? 'bg-blue-50 text-[#2E37A4] border border-blue-200/80'
                                : 'bg-teal-50 text-teal-700 border border-teal-200/80'
                            }`}
                          >
                            {enc.encounterType === 'home_visit'
                              ? 'Khám tại nhà'
                              : 'Tư vấn Video'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-slate-400">
                              person
                            </span>
                            <span>
                              Thành viên: <strong>{enc.memberTreated}</strong>
                            </span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 tabular-nums">
                            <span className="material-symbols-outlined text-[15px] text-slate-400">
                              calendar_today
                            </span>
                            <span>Ngày khám: {enc.encounterDate}</span>
                          </span>
                        </div>

                        {enc.status === 'reviewed' && enc.reviewComment && (
                          <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 italic">
                            &quot;{enc.reviewComment}&quot;
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      {enc.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenReview(enc)}
                          className="px-4 py-2 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            rate_review
                          </span>
                          <span>Đánh giá ca khám</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`material-symbols-outlined text-[18px] ${
                                  star <= (enc.overallRating || 5)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-200'
                                }`}
                              >
                                star
                              </span>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenReview(enc)}
                            className="text-xs text-[#2E37A4] hover:underline font-semibold ml-2 cursor-pointer"
                          >
                            Xem / Sửa
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. TAB 2: TRUNG TÂM KHIẾU NẠI & THEO DÕI PHÁN QUYẾT (DỮ LIỆU THẬT) */}
        {activeTab === 'disputes' && (
          <div className="space-y-6">
            {/* Quy trình xử lý khiếu nại 4 bước khớp backend */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2E37A4]">
                <Scale className="size-4 shrink-0" aria-hidden="true" />
                <span>Quy trình tiếp nhận &amp; giải quyết khiếu nại (4 bước)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1">
                  <div className="font-bold text-slate-900">
                    1. Gửi phản ánh
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Gia đình chọn hợp đồng, danh mục sự cố, mô tả chi tiết và
                    đính kèm bằng chứng nếu có.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1">
                  <div className="font-bold text-slate-900">
                    2. Admin thụ lý
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Ban quản trị FamiDoc tiếp nhận hồ sơ và chuyển yêu cầu xác
                    minh đến Cơ sở y tế phụ trách.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1">
                  <div className="font-bold text-slate-900">
                    3. CSYT xác minh
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Cơ sở y tế kiểm tra hồ sơ khám, đối chiếu với bác sĩ và gửi
                    biên bản giải trình chuyên môn.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1">
                  <div className="font-bold text-slate-900">
                    4. Phán quyết &amp; Đóng hồ sơ
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Admin công bố kết luận xử lý (nhắc nhở, điều chỉnh dịch vụ,
                    bù buổi khám hoặc đổi bác sĩ).
                  </p>
                </div>
              </div>
            </div>

            {/* Thanh lọc trạng thái + Làm mới */}
            <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <label className="grid min-w-0 flex-1 gap-1.5 text-xs font-semibold text-slate-700 sm:flex-none">
                <span>Lọc theo trạng thái khiếu nại</span>
                <select
                  aria-label="Lọc trạng thái khiếu nại"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 sm:w-56"
                  value={complaintsStatus}
                  onChange={(event) => {
                    setComplaintsPage(1);
                    setComplaintsStatus(
                      event.target.value as ComplaintStatus | '',
                    );
                  }}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="SUBMITTED">Chờ thụ lý</option>
                  <option value="INVESTIGATING">Đang xác minh</option>
                  <option value="RESOLVED">Đã kết luận</option>
                  <option value="CLOSED">Đã đóng</option>
                </select>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={complaintsLoading}
                  onClick={() =>
                    void loadComplaints(complaintsPage, complaintsStatus)
                  }
                >
                  <RefreshCw
                    className={cn(
                      'mr-1.5 size-3.5',
                      complaintsLoading && 'animate-spin',
                    )}
                    aria-hidden="true"
                  />
                  Làm mới
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={() => {
                    setDisputeSubmitError('');
                    setShowCreateDisputeModal(true);
                  }}
                >
                  Gửi khiếu nại mới
                </Button>
              </div>
            </div>

            {complaintsError && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
              >
                {complaintsError}
              </div>
            )}

            {complaintsLoading ? (
              <div
                role="status"
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-sm text-slate-600"
              >
                <RefreshCw
                  className="size-4 animate-spin text-primary"
                  aria-hidden="true"
                />
                <span>Đang tải danh sách khiếu nại…</span>
              </div>
            ) : complaints.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/80 space-y-2">
                <span className="material-symbols-outlined text-4xl text-slate-300">
                  verified
                </span>
                <div className="text-sm font-semibold text-slate-800">
                  {complaintsStatus
                    ? 'Không có khiếu nại ở trạng thái đã chọn.'
                    : 'Gia đình chưa gửi khiếu nại nào.'}
                </div>
                <p className="text-xs text-slate-500">
                  Khi có sự cố về lịch khám, thái độ hoặc phụ phí, gia đình có
                  thể gửi phản ánh để Ban quản trị và Cơ sở y tế xác minh.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {complaints.map((ticket) => {
                  const outcomeInfo = ticket.resolutionOutcome
                    ? COMPLAINT_OUTCOME_DESCRIPTIONS[ticket.resolutionOutcome]
                    : null;
                  const attachments = Array.isArray(ticket.evidenceAttachments)
                    ? ticket.evidenceAttachments
                    : [];
                  const ticketCases = complaintSupportCases.filter(
                    (sc) => sc.complaintId === ticket.id,
                  );

                  return (
                    <article
                      key={ticket.id}
                      className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <span className="font-bold text-slate-900 text-sm tabular-nums wrap-anywhere">
                            {ticket.complaintCode}
                          </span>
                          <Badge
                            variant="outline"
                            className="border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold"
                          >
                            {getComplaintCategoryLabel(ticket.complaintCategory)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs font-semibold',
                              STATUS_STYLES[ticket.status],
                            )}
                          >
                            {COMPLAINT_STATUS_LABELS[ticket.status]}
                          </Badge>
                          {ticketCases.map((sc) => (
                            <Badge
                              key={sc.id}
                              variant="outline"
                              className={cn(
                                'text-xs font-semibold',
                                SUPPORT_CASE_STATUS_STYLES[sc.status],
                              )}
                            >
                              {sc.caseType === 'COMPLAINT_APPEAL'
                                ? 'Xem xét lại'
                                : 'Câu hỏi'}
                              :{' '}
                              {getSupportCaseStatusLabel(sc.status, sc.caseType)}
                            </Badge>
                          ))}
                        </div>
                        <span className="text-xs text-slate-500 tabular-nums">
                          Gửi lúc: {formatComplaintDate(ticket.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                        {ticket.description}
                      </p>

                      {attachments.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <Paperclip
                            className="size-3.5 text-primary shrink-0"
                            aria-hidden="true"
                          />
                          <span>Bằng chứng đính kèm:</span>
                          {attachments.map((key) => (
                            <span
                              key={key}
                              className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 break-all"
                            >
                              {evidenceFileNameFromKey(key)}
                            </span>
                          ))}
                        </div>
                      )}

                      {ticket.facilityResponse && (
                        <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200/80 text-xs space-y-1">
                          <div className="font-bold text-indigo-950 flex flex-wrap items-center justify-between gap-1">
                            <span className="inline-flex items-center gap-1.5">
                              <FileCheck2
                                className="size-3.5 text-indigo-600 shrink-0"
                                aria-hidden="true"
                              />
                              <span>
                                Xác minh từ{' '}
                                {ticket.contract?.facility?.facilityName ||
                                  'Cơ sở y tế'}
                              </span>
                            </span>
                            {ticket.facilityReviewedAt && (
                              <span className="text-[11px] font-normal text-indigo-700 tabular-nums">
                                {formatComplaintDate(ticket.facilityReviewedAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                            {ticket.facilityResponse}
                          </p>
                        </div>
                      )}

                      {ticket.resolutionNotes && (
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                          <div className="font-bold text-emerald-950 flex flex-wrap items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5">
                              <CheckCircle2
                                className="size-3.5 text-emerald-700 shrink-0"
                                aria-hidden="true"
                              />
                              <span>Phán quyết từ Ban quản trị FamiDoc</span>
                            </span>
                            {outcomeInfo && (
                              <Badge className="bg-emerald-600 text-white text-[11px]">
                                {outcomeInfo.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-emerald-900 leading-relaxed whitespace-pre-wrap break-words">
                            {ticket.resolutionNotes}
                          </p>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>
                            Hợp đồng:{' '}
                            <strong className="text-slate-900 tabular-nums">
                              {ticket.contract?.contractNumber ||
                                ticket.contractId}
                            </strong>
                          </span>
                          {ticket.contract?.doctor?.doctorName && (
                            <span>
                              Bác sĩ:{' '}
                              <strong className="text-slate-900">
                                {ticket.contract.doctor.doctorName}
                              </strong>
                            </span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void openComplaintDetail(ticket.id, ticket)}
                        >
                          Xem chi tiết &amp; kết quả
                        </Button>
                      </div>
                    </article>
                  );
                })}

                {totalPages > 1 && (
                  <div className="flex items-center justify-end gap-2 pt-2 text-xs">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={complaintsPage <= 1 || complaintsLoading}
                      onClick={() =>
                        setComplaintsPage((p) => Math.max(1, p - 1))
                      }
                    >
                      Trang trước
                    </Button>
                    <span className="tabular-nums text-slate-600">
                      Trang {complaintsPage} / {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        complaintsPage >= totalPages || complaintsLoading
                      }
                      onClick={() => setComplaintsPage((p) => p + 1)}
                    >
                      Trang sau
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: ĐÁNH GIÁ BÁC SĨ SAU CA KHÁM */}
      {selectedEncounterForReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-fade-in text-slate-900">
            <div className="p-5 bg-gradient-to-r from-[#2E37A4] to-[#3d47c2] text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-200 font-semibold uppercase">
                  Chất Lượng Chuyên Môn &amp; Y Đức
                </div>
                <h3 className="text-base sm:text-lg font-bold mt-0.5">
                  Đánh Giá Bác Sĩ: {selectedEncounterForReview.doctorName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEncounterForReview(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-5 text-xs">
              <div className="text-center space-y-2 pb-4 border-b border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">
                  Mức độ hài lòng chung của gia đình về ca khám:
                </label>
                <div className="flex items-center justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingOverall(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <span
                        className={`material-symbols-outlined text-3xl ${
                          star <= ratingOverall
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      >
                        star
                      </span>
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-amber-600 block">
                  {ratingOverall === 5
                    ? 'Rất hài lòng (5/5 sao)'
                    : ratingOverall === 4
                      ? 'Hài lòng (4/5 sao)'
                      : ratingOverall === 3
                        ? 'Bình thường (3/5 sao)'
                        : 'Chưa đạt kỳ vọng'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-700">
                    1. Chuyên môn chẩn đoán &amp; tư vấn:
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRatingExpertise(s)}
                        className="cursor-pointer"
                      >
                        <span
                          className={`material-symbols-outlined text-[18px] ${
                            s <= ratingExpertise
                              ? 'text-amber-400'
                              : 'text-slate-200'
                          }`}
                        >
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-700">
                    2. Thái độ tận tâm, lắng nghe:
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRatingManner(s)}
                        className="cursor-pointer"
                      >
                        <span
                          className={`material-symbols-outlined text-[18px] ${
                            s <= ratingManner
                              ? 'text-amber-400'
                              : 'text-slate-200'
                          }`}
                        >
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-700">
                    3. Đúng giờ &amp; tác phong chuẩn mực:
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRatingPunctuality(s)}
                        className="cursor-pointer"
                      >
                        <span
                          className={`material-symbols-outlined text-[18px] ${
                            s <= ratingPunctuality
                              ? 'text-amber-400'
                              : 'text-slate-200'
                          }`}
                        >
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nhận xét đóng góp ý kiến cho bác sĩ (tùy chọn):
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Ví dụ: Bác sĩ đến đúng giờ, khám kỹ và hướng dẫn bài tập phục hồi chức năng rất dễ hiểu..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-[#2E37A4] outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedEncounterForReview(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2E37A4] hover:bg-[#222982] text-white font-semibold shadow-xs cursor-pointer"
                >
                  Gửi đánh giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GỬI KHIẾU NẠI & BÁO CÁO SỰ CỐ (API THẬT) */}
      <Dialog
        open={showCreateDisputeModal}
        onOpenChange={(open) => {
          if (!disputeSubmitting) setShowCreateDisputeModal(open);
        }}
      >
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 sm:max-w-lg sm:rounded-3xl [&>[data-slot=dialog-close]]:top-4 [&>[data-slot=dialog-close]]:right-4 [&>[data-slot=dialog-close]]:rounded-full [&>[data-slot=dialog-close]]:bg-white/15 [&>[data-slot=dialog-close]]:p-1.5 [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:opacity-90 [&>[data-slot=dialog-close]]:hover:bg-white/25">
          <DialogHeader className="shrink-0 bg-gradient-to-r from-rose-700 to-rose-600 p-5 text-left text-white">
            <div className="pr-8 text-xs font-semibold text-rose-100">
              Bảo vệ quyền lợi hộ gia đình
            </div>
            <DialogTitle className="mt-0.5 text-base font-bold text-white sm:text-lg">
              Tạo Phiếu Khiếu Nại Dịch Vụ Y Tế
            </DialogTitle>
            <DialogDescription className="text-xs text-rose-100/90">
              Khiếu nại sẽ được Ban quản trị thụ lý, gửi Cơ sở y tế xác minh và
              công bố kết luận trực tiếp trên tài khoản của gia đình.
            </DialogDescription>
          </DialogHeader>

          <form
            noValidate
            onSubmit={handleCreateDispute}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <Label
                  htmlFor="dispute-contract"
                  className="text-xs font-semibold text-slate-800"
                >
                  Hợp đồng dịch vụ liên quan{' '}
                  <span className="text-rose-500">*</span>
                </Label>
                {complaintEligibleContracts.length > 0 ? (
                  <select
                    id="dispute-contract"
                    required
                    disabled={disputeSubmitting}
                    value={disputeContractId}
                    onChange={(e) => setDisputeContractId(e.target.value)}
                    className="h-10 w-full min-w-0 max-w-full truncate rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 sm:text-sm"
                  >
                    <option value="">Chọn hợp đồng của gia đình</option>
                    {complaintEligibleContracts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.contractNumber} · {item.packageName}
                        {item.assignedDoctorName || item.doctorName
                          ? ` · ${item.assignedDoctorName || item.doctorName}`
                          : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    Gia đình hiện chưa có hợp đồng nào đã được phân công bác sĩ
                    để gửi khiếu nại sự cố.
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="dispute-category"
                  className="text-xs font-semibold text-slate-800"
                >
                  Loại sự cố / khiếu nại{' '}
                  <span className="text-rose-500">*</span>
                </Label>
                <select
                  id="dispute-category"
                  disabled={disputeSubmitting}
                  value={disputeCategory}
                  onChange={(e) =>
                    setDisputeCategory(e.target.value as ComplaintCategory)
                  }
                  className="h-10 w-full min-w-0 max-w-full truncate rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 sm:text-sm"
                >
                  {FAMILY_COMPLAINT_CATEGORIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="dispute-description"
                  className="text-xs font-semibold text-slate-800"
                >
                  Mô tả chi tiết sự việc{' '}
                  <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="dispute-description"
                  rows={4}
                  required
                  minLength={10}
                  maxLength={4000}
                  disabled={disputeSubmitting}
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  placeholder="Vui lòng nêu rõ thời gian, nội dung sự việc và yêu cầu hỗ trợ để Ban quản trị và Cơ sở y tế xác minh nhanh chóng..."
                  className="rounded-xl border-slate-200 text-xs sm:text-sm"
                />
                <p className="flex justify-between text-[11px] text-slate-500 tabular-nums">
                  <span>Tối thiểu 10 ký tự</span>
                  <span>{disputeDescription.trim().length}/4000</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="dispute-evidence-upload"
                  className="text-xs font-semibold text-slate-800"
                >
                  Tệp bằng chứng đính kèm (tùy chọn, PDF/PNG/JPEG tối đa 5 MB)
                </Label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    id="dispute-evidence-upload"
                    accept=".pdf,.png,.jpg,.jpeg"
                    disabled={disputeSubmitting}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setDisputeSubmitError('');
                      if (file && !isAllowedEvidenceFile(file)) {
                        e.target.value = '';
                        setEvidenceFile(null);
                        setDisputeSubmitError(
                          'Chỉ chấp nhận tệp bằng chứng định dạng PDF, PNG hoặc JPEG.',
                        );
                        return;
                      }
                      if (
                        file &&
                        (file.size === 0 || file.size > 5 * 1024 * 1024)
                      ) {
                        e.target.value = '';
                        setEvidenceFile(null);
                        setDisputeSubmitError(
                          'Tệp bằng chứng phải có dung lượng từ 1 byte đến 5 MB.',
                        );
                        return;
                      }
                      setEvidenceFile(file);
                    }}
                  />
                  <label
                    htmlFor="dispute-evidence-upload"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
                  >
                    <Upload className="size-3.5" aria-hidden="true" />
                    <span>Chọn tệp bằng chứng</span>
                  </label>
                  <span className="max-w-56 truncate text-xs text-slate-500">
                    {evidenceFile ? evidenceFile.name : 'Chưa chọn tệp'}
                  </span>
                </div>
              </div>

              {disputeSubmitError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
                >
                  {disputeSubmitError}
                </div>
              )}
            </div>

            <DialogFooter className="shrink-0 flex-row flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
              <Button
                type="button"
                variant="outline"
                disabled={disputeSubmitting}
                onClick={() => setShowCreateDisputeModal(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={
                  disputeSubmitting || complaintEligibleContracts.length === 0
                }
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {disputeSubmitting ? 'Đang gửi khiếu nại…' : 'Gửi khiếu nại'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: XEM CHI TIẾT KHIẾU NẠI & PHÁN QUYẾT CỦA ADMIN */}
      <Dialog
        open={Boolean(selectedComplaintId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedComplaintId(null);
            setComplaintDetail(null);
            setDetailError('');
          }
        }}
      >
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 sm:max-w-2xl sm:rounded-3xl [&>[data-slot=dialog-close]]:top-4 [&>[data-slot=dialog-close]]:right-4 [&>[data-slot=dialog-close]]:rounded-full [&>[data-slot=dialog-close]]:bg-white/15 [&>[data-slot=dialog-close]]:p-1.5 [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:opacity-90 [&>[data-slot=dialog-close]]:hover:bg-white/25">
          <DialogHeader className="shrink-0 bg-gradient-to-r from-[#09253b] to-[#0037c1] p-4 text-left text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2 pr-8 text-xs text-blue-100">
              <span>Chi tiết hồ sơ khiếu nại</span>
              {complaintDetail && (
                <>
                  <span aria-hidden="true">•</span>
                  <span className="rounded bg-white/15 px-1.5 py-0.5 tabular-nums text-[11px] text-white">
                    {complaintDetail.complaintCode}
                  </span>
                </>
              )}
            </div>
            <DialogTitle className="mt-1 text-base font-bold text-white sm:text-xl">
              {getComplaintCategoryLabel(complaintDetail?.complaintCategory)}
            </DialogTitle>
            {complaintDetail && (
              <DialogDescription className="text-xs text-blue-100/90">
                Hợp đồng:{' '}
                {complaintDetail.contract?.contractNumber ||
                  complaintDetail.contractId}
                {complaintDetail.contract?.facility?.facilityName
                  ? ` • CSYT: ${complaintDetail.contract.facility.facilityName}`
                  : ''}
                {complaintDetail.contract?.doctor?.doctorName
                  ? ` • Bác sĩ: ${complaintDetail.contract.doctor.doctorName}`
                  : ''}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 text-xs sm:p-6 sm:text-sm">
            {detailLoading && (
              <div className="flex items-center justify-center gap-2 py-4 text-slate-500">
                <RefreshCw
                  className="size-4 animate-spin text-primary"
                  aria-hidden="true"
                />
                <span>Đang cập nhật thông tin mới nhất…</span>
              </div>
            )}
            {detailError && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800"
              >
                {detailError}
              </div>
            )}
            {complaintDetail && (
              <>
                {/* Tiến trình xử lý */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <div className="mb-2 text-[11px] font-bold uppercase text-slate-500">
                    Tiến trình xử lý
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-center text-xs sm:grid-cols-3">
                    <div
                      className={cn(
                        'rounded-xl border p-2',
                        complaintDetail.status === 'SUBMITTED'
                          ? 'border-amber-300 bg-amber-50 font-bold text-amber-900'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-800',
                      )}
                    >
                      <div className="text-[10px] text-slate-500">Bước 1</div>
                      <div>Chờ Admin thụ lý</div>
                    </div>
                    <div
                      className={cn(
                        'rounded-xl border p-2',
                        complaintDetail.status === 'INVESTIGATING'
                          ? 'border-blue-300 bg-blue-50 font-bold text-blue-900'
                          : complaintDetail.status === 'RESOLVED' ||
                              complaintDetail.status === 'CLOSED'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 bg-white text-slate-500',
                      )}
                    >
                      <div className="text-[10px] text-slate-500">Bước 2</div>
                      <div>CSYT xác minh</div>
                    </div>
                    <div
                      className={cn(
                        'rounded-xl border p-2',
                        complaintDetail.status === 'RESOLVED' ||
                          complaintDetail.status === 'CLOSED'
                          ? 'border-emerald-300 bg-emerald-50 font-bold text-emerald-900'
                          : 'border-slate-200 bg-white text-slate-500',
                      )}
                    >
                      <div className="text-[10px] text-slate-500">Bước 3</div>
                      <div>
                        {complaintDetail.status === 'CLOSED'
                          ? 'Đã kết luận & Đóng hồ sơ'
                          : 'Admin ra phán quyết'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nội dung gia đình đã gửi */}
                <section className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                    <h4 className="flex items-center gap-1.5 font-bold text-slate-900">
                      <AlertCircle
                        className="size-4 text-amber-600 shrink-0"
                        aria-hidden="true"
                      />
                      <span>Nội dung phản ánh của gia đình</span>
                    </h4>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs font-semibold',
                        STATUS_STYLES[complaintDetail.status],
                      )}
                    >
                      {COMPLAINT_STATUS_LABELS[complaintDetail.status]}
                    </Badge>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                    <p className="whitespace-pre-wrap break-words leading-relaxed text-slate-800">
                      {complaintDetail.description}
                    </p>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      Thời điểm gửi:{' '}
                      <strong>
                        {formatComplaintDate(complaintDetail.createdAt)}
                      </strong>
                    </p>
                  </div>
                </section>

                {/* Biên bản xác minh từ CSYT */}
                <section className="space-y-2">
                  <h4 className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5 font-bold text-slate-900">
                    <Building2
                      className="size-4 text-indigo-600 shrink-0"
                      aria-hidden="true"
                    />
                    <span>Xác minh chuyên môn từ Cơ sở y tế</span>
                  </h4>
                  {complaintDetail.facilityResponse ? (
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-3.5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-900">
                        <span className="font-semibold">
                          {complaintDetail.contract?.facility?.facilityName ||
                            'Cơ sở y tế phụ trách'}
                        </span>
                        {complaintDetail.facilityReviewedAt && (
                          <span className="tabular-nums text-[11px] text-indigo-700">
                            {formatComplaintDate(
                              complaintDetail.facilityReviewedAt,
                            )}
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap break-words rounded-xl border border-indigo-100 bg-white/90 p-3 text-slate-800">
                        {complaintDetail.facilityResponse}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900">
                      <Info
                        className="mt-0.5 size-4 shrink-0 text-blue-600"
                        aria-hidden="true"
                      />
                      <span>
                        {complaintDetail.status === 'SUBMITTED'
                          ? 'Hồ sơ đang chờ Ban quản trị FamiDoc thụ lý và chuyển sang Cơ sở y tế xác minh.'
                          : 'Ban quản trị đã yêu cầu Cơ sở y tế kiểm tra và gửi biên bản xác minh chuyên môn.'}
                      </span>
                    </div>
                  )}
                </section>

                {/* Phán quyết của Admin */}
                <section className="space-y-2">
                  <h4 className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5 font-bold text-slate-900">
                    <Gavel
                      className="size-4 text-emerald-600 shrink-0"
                      aria-hidden="true"
                    />
                    <span>Phán quyết &amp; Kết luận của Ban quản trị</span>
                  </h4>
                  {complaintDetail.resolutionNotes ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge className="bg-emerald-600 text-white text-xs font-bold">
                          {complaintDetail.resolutionOutcome
                            ? COMPLAINT_OUTCOME_DESCRIPTIONS[
                                complaintDetail.resolutionOutcome
                              ]?.label
                            : 'Kết luận chính thức'}
                        </Badge>
                        {complaintDetail.resolvedAt && (
                          <span className="text-[11px] text-emerald-800 tabular-nums">
                            {formatComplaintDate(complaintDetail.resolvedAt)}
                          </span>
                        )}
                      </div>
                      {complaintDetail.resolutionOutcome && (
                        <p className="text-xs italic text-emerald-900/90">
                          {
                            COMPLAINT_OUTCOME_DESCRIPTIONS[
                              complaintDetail.resolutionOutcome
                            ]?.desc
                          }
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words rounded-xl border border-emerald-100 bg-white/95 p-3 text-slate-800">
                        {complaintDetail.resolutionNotes}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
                      Chưa có phán quyết cuối cùng. Ban quản trị sẽ công bố kết
                      luận ngay sau khi Cơ sở y tế hoàn tất xác minh.
                    </div>
                  )}
                </section>

                {/* Yêu cầu xem xét lại & Gửi câu hỏi (chỉ hiện sau khi khiếu nại đã có kết quả / đóng) */}
                {(complaintDetail.status === 'RESOLVED' ||
                  complaintDetail.status === 'CLOSED') &&
                  (() => {
                    const hasAppeal = detailCases.some(
                      (c) => c.caseType === 'COMPLAINT_APPEAL',
                    );
                    const hasOpenQuestion = detailCases.some(
                      (c) =>
                        c.caseType === 'COMPLAINT_QUESTION' &&
                        isOpenSupportCaseStatus(c.status),
                    );
                    const canRequestAppeal =
                      complaintDetail.status === 'RESOLVED' &&
                      !hasAppeal &&
                      isWithinAppealWindow(complaintDetail.resolvedAt);
                    const canAskQuestion = !hasOpenQuestion;

                    return (
                      <section className="space-y-3 border-t border-slate-200 pt-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="flex items-center gap-1.5 font-bold text-slate-900">
                            <MessageSquarePlus
                              className="size-4 text-primary shrink-0"
                              aria-hidden="true"
                            />
                            <span>Xem xét lại &amp; Trao đổi với Ban quản trị</span>
                          </h4>
                          <div className="flex flex-wrap items-center gap-2">
                            {canRequestAppeal && (
                              <Button
                                type="button"
                                size="sm"
                                variant={
                                  composerMode === 'APPEAL'
                                    ? 'default'
                                    : 'outline'
                                }
                                className={cn(
                                  'rounded-xl text-xs font-semibold cursor-pointer',
                                  composerMode === 'APPEAL'
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100',
                                )}
                                onClick={() => {
                                  setComposerMode('APPEAL');
                                  setComposerError('');
                                }}
                              >
                                <RotateCcw
                                  className="size-3.5 mr-1.5"
                                  aria-hidden="true"
                                />
                                Yêu cầu xem xét lại
                              </Button>
                            )}
                            {canAskQuestion && (
                              <Button
                                type="button"
                                size="sm"
                                variant={
                                  composerMode === 'QUESTION'
                                    ? 'default'
                                    : 'outline'
                                }
                                className="rounded-xl text-xs font-semibold cursor-pointer"
                                onClick={() => {
                                  setComposerMode('QUESTION');
                                  setComposerError('');
                                }}
                              >
                                <HelpCircle
                                  className="size-3.5 mr-1.5"
                                  aria-hidden="true"
                                />
                                Gửi câu hỏi
                              </Button>
                            )}
                          </div>
                        </div>

                        {!canRequestAppeal &&
                          !hasAppeal &&
                          complaintDetail.status === 'RESOLVED' && (
                            <p className="text-xs text-slate-500">
                              Đã quá thời hạn 7 ngày kể từ khi có kết quả để gửi
                              yêu cầu xem xét lại. Gia đình vẫn có thể bấm{' '}
                              <strong>Gửi câu hỏi</strong> nếu cần Admin giải đáp
                              thêm.
                            </p>
                          )}

                        {/* Biểu mẫu tạo Yêu cầu xem xét lại / Câu hỏi */}
                        {composerMode && (
                          <form
                            noValidate
                            onSubmit={handleSubmitComplaintSupportCase}
                            className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3.5 sm:p-4"
                          >
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-indigo-950">
                                {composerMode === 'APPEAL'
                                  ? 'Yêu cầu xem xét lại kết quả khiếu nại'
                                  : 'Gửi câu hỏi trong hồ sơ khiếu nại'}
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                {composerMode === 'APPEAL'
                                  ? 'Hệ thống giữ nguyên phán quyết đã trả và đính kèm phản hồi mới vào cùng hồ sơ để Ban quản trị xem lại toàn bộ quá trình.'
                                  : 'Đặt câu hỏi làm rõ về quyết định mà không cần mở lại hồ sơ khiếu nại.'}
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <Label
                                htmlFor="complaint-support-message"
                                className="text-xs font-semibold text-slate-800"
                              >
                                {composerMode === 'APPEAL'
                                  ? 'Lý do chưa đồng ý với kết quả xử lý'
                                  : 'Câu hỏi gửi Ban quản trị'}{' '}
                                <span className="text-rose-500">*</span>
                              </Label>
                              <Textarea
                                id="complaint-support-message"
                                rows={3}
                                maxLength={2000}
                                disabled={composerSubmitting}
                                value={composerMessage}
                                onChange={(e) =>
                                  setComposerMessage(e.target.value)
                                }
                                placeholder={
                                  composerMode === 'APPEAL'
                                    ? 'Nêu rõ điểm bạn chưa đồng ý và thông tin/bằng chứng mới cần Admin xem lại (tối thiểu 10 ký tự)...'
                                    : 'Nhập câu hỏi cần làm rõ về kết luận khiếu nại (tối thiểu 10 ký tự)...'
                                }
                                className="rounded-xl bg-white text-xs sm:text-sm"
                              />
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2 min-w-0">
                                <input
                                  id="complaint-support-attachment"
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg"
                                  disabled={composerSubmitting}
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    setComposerError('');
                                    if (
                                      file &&
                                      !isValidSupportAttachmentFile(file)
                                    ) {
                                      e.target.value = '';
                                      setComposerFile(null);
                                      setComposerError(
                                        'Chỉ chấp nhận tệp bằng chứng định dạng PDF, PNG hoặc JPEG.',
                                      );
                                      return;
                                    }
                                    if (
                                      file &&
                                      (file.size === 0 ||
                                        file.size > 5 * 1024 * 1024)
                                    ) {
                                      e.target.value = '';
                                      setComposerFile(null);
                                      setComposerError(
                                        'Tệp đính kèm phải có dung lượng từ 1 byte đến 5 MB.',
                                      );
                                      return;
                                    }
                                    setComposerFile(file);
                                  }}
                                />
                                <label
                                  htmlFor="complaint-support-attachment"
                                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                >
                                  <Upload
                                    className="size-3.5"
                                    aria-hidden="true"
                                  />
                                  <span>Đính kèm bằng chứng bổ sung</span>
                                </label>
                                {composerFile && (
                                  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800 max-w-48">
                                    <span className="truncate">
                                      {composerFile.name}
                                    </span>
                                    <button
                                      type="button"
                                      aria-label="Xóa tệp đính kèm"
                                      onClick={() => setComposerFile(null)}
                                      className="text-blue-700 hover:text-blue-950 cursor-pointer"
                                    >
                                      <X className="size-3.5" />
                                    </button>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={composerSubmitting}
                                  onClick={() => {
                                    setComposerMode(null);
                                    setComposerError('');
                                  }}
                                >
                                  Hủy
                                </Button>
                                <Button
                                  type="submit"
                                  size="sm"
                                  disabled={composerSubmitting}
                                  className="bg-primary text-white hover:bg-primary/90"
                                >
                                  {composerSubmitting
                                    ? 'Đang gửi…'
                                    : composerMode === 'APPEAL'
                                      ? 'Gửi yêu cầu xem xét lại'
                                      : 'Gửi câu hỏi'}
                                </Button>
                              </div>
                            </div>

                            {composerError && (
                              <p
                                role="alert"
                                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"
                              >
                                {composerError}
                              </p>
                            )}
                          </form>
                        )}

                        {/* Chuyển tab giữa các hồ sơ hỗ trợ của cùng khiếu nại (nếu có cả Xem xét lại & Câu hỏi) */}
                        {detailCases.length > 1 && (
                          <div className="flex flex-wrap gap-2">
                            {detailCases.map((sc) => (
                              <button
                                key={sc.id}
                                type="button"
                                onClick={() => void loadSupportCaseDetail(sc.id)}
                                className={cn(
                                  'rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                                  activeCaseDetail?.id === sc.id
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                                )}
                              >
                                {SUPPORT_CASE_TYPE_LABELS[sc.caseType]} (
                                {getSupportCaseStatusLabel(sc.status, sc.caseType)})
                              </button>
                            ))}
                          </div>
                        )}

                        {caseDetailLoading && !activeCaseDetail && (
                          <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-500">
                            <RefreshCw
                              className="size-3.5 animate-spin text-primary"
                              aria-hidden="true"
                            />
                            <span>Đang tải luồng trao đổi với Ban quản trị…</span>
                          </div>
                        )}

                        {activeCaseDetail && (
                          <SupportCaseThread
                            caseDetail={activeCaseDetail}
                            viewerRole="FAMILY_REP"
                            onUpdated={(updated) => {
                              setActiveCaseDetail(updated);
                              void loadComplaintSupportCases();
                            }}
                            onRefresh={async () => {
                              await loadSupportCaseDetail(activeCaseDetail.id);
                            }}
                            refreshing={caseDetailLoading}
                          />
                        )}
                      </section>
                    );
                  })()}
              </>
            )}
          </div>

          <DialogFooter className="shrink-0 flex-row flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedComplaintId(null);
                setComplaintDetail(null);
              }}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
