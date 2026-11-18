'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  doctorsApi,
  extractErrorMessage,
  type DoctorCredentialDto,
  type DoctorProfileDto,
} from '@/lib/api';
import { REQUIRED_CREDENTIAL_DEFS } from '@/components/shared';
import { Button } from '@/components/ui/button';

type CredentialType = DoctorCredentialDto['credentialType'];

interface CredentialFormItem {
  id?: string;
  certificateNumber: string;
  issuingAuthority: string;
  issueDate: string;
  file: File | null;
  existingFileUrl?: string;
  facilityVerified?: boolean;
  platformApproved?: boolean;
}

const createEmptyCredentialsForm = (): Record<CredentialType, CredentialFormItem> => ({
  PRACTICE_LICENSE_CCHN: {
    certificateNumber: '',
    issuingAuthority: '',
    issueDate: '',
    file: null,
  },
  DEGREE: {
    certificateNumber: '',
    issuingAuthority: '',
    issueDate: '',
    file: null,
  },
  FAMILY_MEDICINE_CERT: {
    certificateNumber: '',
    issuingAuthority: '',
    issueDate: '',
    file: null,
  },
});

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function DoctorVerificationView() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DoctorProfileDto | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<string>('PENDING_SUBMISSION');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  // Editable professional profile fields
  const [formAcademicTitle, setFormAcademicTitle] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('Khoa Y học Gia đình');
  const [formExperienceYears, setFormExperienceYears] = useState('0');
  const [formBio, setFormBio] = useState('');

  // All 3 required credential entries
  const [credentialsForm, setCredentialsForm] = useState<Record<CredentialType, CredentialFormItem>>(
    createEmptyCredentialsForm,
  );

  const hydrateFromProfile = (data: DoctorProfileDto | null) => {
    if (!data) return;
    setProfile(data);
    if (data.onboardingStatus) {
      setOnboardingStatus(data.onboardingStatus);
    }
    setRejectionReason(data.rejectionReason || null);
    const hospitalName = data.facility?.facilityName || data.facilityName;
    if (hospitalName) {
      setSelectedHospital(hospitalName);
    }
    setFormAcademicTitle(data.academicTitle || '');
    setFormSpecialty(data.specialty || 'Khoa Y học Gia đình');
    setFormExperienceYears(String(data.experienceYears ?? 0));
    setFormBio(data.bio || '');

    const nextForm = createEmptyCredentialsForm();
    if (Array.isArray(data.credentials)) {
      for (const cred of data.credentials) {
        if (!cred || !nextForm[cred.credentialType]) continue;
        nextForm[cred.credentialType] = {
          id: cred.id,
          certificateNumber: cred.certificateNumber || '',
          issuingAuthority: cred.issuingAuthority || '',
          issueDate: cred.issueDate ? new Date(cred.issueDate).toISOString().split('T')[0] : '',
          file: null,
          existingFileUrl: cred.fileUrl || undefined,
          facilityVerified: cred.facilityVerified,
          platformApproved: cred.platformApproved,
        };
      }
    }
    setCredentialsForm(nextForm);
  };

  useEffect(() => {
    let isMounted = true;
    doctorsApi
      .getDoctorMe()
      .then((res: any) => {
        if (!isMounted) return;
        const data: DoctorProfileDto | null =
          res &&
          typeof res === 'object' &&
          'data' in res &&
          res.data &&
          typeof res.data === 'object' &&
          !Array.isArray(res.data)
            ? (res.data as DoctorProfileDto)
            : (res as DoctorProfileDto);
        hydrateFromProfile(data);
      })
      .catch((err) => {
        console.warn('Doctor profile fetch fallback:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const updateCredentialField = (
    type: CredentialType,
    patch: Partial<CredentialFormItem>,
  ) => {
    setCredentialsForm((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        ...patch,
      },
    }));
  };

  const handleFileChange = (type: CredentialType, file: File | null, label: string) => {
    if (!file) {
      updateCredentialField(type, { file: null });
      return;
    }
    const lower = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
    if (!hasValidExt) {
      toast.error(`${label}: Chỉ chấp nhận định dạng PDF, PNG hoặc JPG/JPEG.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`${label}: File "${file.name}" vượt quá giới hạn 10MB.`);
      return;
    }
    updateCredentialField(type, { file });
    toast.success(`Đã chọn tệp "${file.name}" cho ${label}.`);
  };

  const handlePreviewExistingFile = async (type: CredentialType) => {
    const entry = credentialsForm[type];
    const targetKey = entry.id || type;
    setOpeningId(targetKey);
    try {
      if (entry.id) {
        const blobUrl = await doctorsApi.fetchCredentialFileBlobUrl('me', entry.id);
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      } else if (entry.existingFileUrl && entry.existingFileUrl.startsWith('http')) {
        window.open(entry.existingFileUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Không tìm thấy tệp chứng chỉ hợp lệ để mở.');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Không thể tải tệp chứng chỉ từ máy chủ.'));
    } finally {
      setOpeningId(null);
    }
  };

  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formSpecialty.trim()) {
      toast.error('Vui lòng nhập Chuyên khoa hành nghề.');
      return;
    }

    const expNum = Number(formExperienceYears);
    if (Number.isNaN(expNum) || expNum < 0 || expNum > 60) {
      toast.error('Số năm kinh nghiệm phải nằm trong khoảng 0 - 60 năm.');
      return;
    }

    const today = new Date();
    for (const def of REQUIRED_CREDENTIAL_DEFS) {
      const item = credentialsForm[def.type];
      if (!item.certificateNumber.trim()) {
        toast.error(`Vui lòng nhập Số hiệu cho ${def.shortLabel}.`);
        return;
      }
      if (!item.issuingAuthority.trim()) {
        toast.error(`Vui lòng nhập Cơ quan cấp cho ${def.shortLabel}.`);
        return;
      }
      if (!item.issueDate.trim()) {
        toast.error(`Vui lòng chọn Ngày cấp cho ${def.shortLabel}.`);
        return;
      }
      const parsedDate = new Date(item.issueDate);
      if (Number.isNaN(parsedDate.getTime()) || parsedDate > today) {
        toast.error(`Ngày cấp của ${def.shortLabel} không hợp lệ hoặc nằm trong tương lai.`);
        return;
      }
      if (!item.file && !item.existingFileUrl) {
        toast.error(`Vui lòng tải lên tệp scan (PDF/PNG/JPG) cho ${def.shortLabel}.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const credentialsPayload = REQUIRED_CREDENTIAL_DEFS.map((def) => {
        const item = credentialsForm[def.type];
        return {
          credentialType: def.type,
          certificateNumber: item.certificateNumber.trim(),
          issueDate: item.issueDate.trim(),
          issuingAuthority: item.issuingAuthority.trim(),
        };
      });

      const res: any = await doctorsApi.submitMyCredentials({
        academicTitle: formAcademicTitle.trim() || undefined,
        specialty: formSpecialty.trim(),
        experienceYears: expNum,
        bio: formBio.trim() || undefined,
        credentials: credentialsPayload,
        cchnFile: credentialsForm.PRACTICE_LICENSE_CCHN.file,
        degreeFile: credentialsForm.DEGREE.file,
        familyMedicineFile: credentialsForm.FAMILY_MEDICINE_CERT.file,
      });

      if (
        res &&
        typeof res === 'object' &&
        ('id' in res || 'credentials' in res || 'onboardingStatus' in res)
      ) {
        hydrateFromProfile(res as DoctorProfileDto);
      } else {
        setOnboardingStatus('PENDING_FACILITY_REVIEW');
        setRejectionReason(null);
      }

      toast.success(
        'Đã nộp đủ 3 chứng chỉ & hồ sơ cá nhân! Hồ sơ đang chờ Cơ sở y tế thẩm định Cấp 1.',
      );
    } catch (err: any) {
      console.warn('Lỗi khi nộp hồ sơ chuyên môn:', err?.message || err);
      toast.error(extractErrorMessage(err, 'Có lỗi khi nộp hồ sơ chuyên môn lên máy chủ.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <div className="w-9 h-9 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-xs font-medium text-slate-500 mt-3">
          Đang tải hồ sơ y khoa &amp; chứng chỉ hành nghề...
        </span>
      </div>
    );
  }

  const cchnNumber = credentialsForm.PRACTICE_LICENSE_CCHN.certificateNumber;
  const uploadedCount = REQUIRED_CREDENTIAL_DEFS.filter((def) => {
    const entry = credentialsForm[def.type];
    return Boolean(entry.file || entry.existingFileUrl);
  }).length;
  const isSubmitted =
    onboardingStatus === 'PENDING_FACILITY_REVIEW' ||
    onboardingStatus === 'FACILITY_VERIFIED' ||
    onboardingStatus === 'ACTIVE';
  const isLevel1Approved =
    onboardingStatus === 'FACILITY_VERIFIED' || onboardingStatus === 'ACTIVE';
  const isLevel2Approved = onboardingStatus === 'ACTIVE';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <main className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/doctor" className="hover:text-blue-600 transition-colors">
              Portal Bác sĩ
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">
              Hồ Sơ Chuyên Môn &amp; Xác Thực CCHN
            </span>
          </div>

          <Link
            href="/doctor"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Về Bảng Lâm sàng</span>
          </Link>
        </div>

        {/* Header Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Hồ Sơ Y Khoa &amp; Xác Thực Chứng Chỉ Hành Nghề (CCHN)
              </h1>
              {isLevel2Approved ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Đã duyệt 2 cấp · Hoạt động hợp pháp
                </span>
              ) : isLevel1Approved ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  CSYT đã duyệt Cấp 1 · Chờ Admin FamiDoc
                </span>
              ) : onboardingStatus === 'PENDING_FACILITY_REVIEW' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Đã nộp hồ sơ · Chờ CSYT thẩm định Cấp 1
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Chờ nộp hồ sơ (3 chứng chỉ)
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Bác sĩ:{' '}
              <span className="font-semibold text-slate-800">
                {profile?.doctorName || 'Bác sĩ Gia đình'}
              </span>{' '}
              {selectedHospital ? (
                <>
                  • Trực thuộc:{' '}
                  <span className="font-semibold text-blue-700">{selectedHospital}</span>
                </>
              ) : null}{' '}
              • Định mức Panel:{' '}
              <span className="font-semibold text-slate-800 tabular-nums">
                {profile?.activePanelCount ?? 0} / {profile?.maxPanelCapacity ?? 30} hộ gia đình
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="px-3.5 py-2 rounded-xl bg-blue-50/80 border border-blue-200/60 text-blue-900 text-xs">
              <span className="block font-semibold">Thẩm định 2 Cấp</span>
              <span className="text-slate-600">CSYT (Cấp 1) → Admin FamiDoc (Cấp 2)</span>
            </div>
          </div>
        </div>

        {/* Status / Rejection Banners */}
        {rejectionReason && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-900 space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <span className="material-symbols-outlined text-base">error</span>
              <span>Hồ sơ cần bổ sung / chỉnh sửa theo yêu cầu thẩm định:</span>
            </div>
            <p className="pl-6 text-rose-900 font-medium">{rejectionReason}</p>
            <p className="pl-6 text-xs text-rose-700">
              Vui lòng chỉnh sửa thông tin bên dưới hoặc tải lại bản scan rõ nét rồi gửi lại thẩm định.
            </p>
          </div>
        )}

        {onboardingStatus === 'PENDING_FACILITY_REVIEW' && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs sm:text-sm text-indigo-900 flex items-start gap-3">
            <span className="material-symbols-outlined text-xl text-indigo-600 shrink-0 mt-0.5">
              hourglass_top
            </span>
            <div className="space-y-1">
              <p className="font-bold text-indigo-950">
                Hồ sơ chuyên môn đã nộp đủ và đang chờ Hội đồng chuyên môn CSYT duyệt Cấp 1
              </p>
              <p className="text-indigo-800 text-xs leading-relaxed">
                Sau khi {selectedHospital || 'Cơ sở Y tế'} xác thực Cấp 1, hồ sơ sẽ tự động chuyển lên Quản trị viên FamiDoc hậu kiểm Cấp 2 để kích hoạt hành nghề.
              </p>
            </div>
          </div>
        )}

        {onboardingStatus === 'FACILITY_VERIFIED' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs sm:text-sm text-blue-900 flex items-start gap-3">
            <span className="material-symbols-outlined text-xl text-blue-600 shrink-0 mt-0.5">
              verified
            </span>
            <div className="space-y-1">
              <p className="font-bold text-blue-950">
                CSYT đã duyệt Cấp 1! Hồ sơ đang chờ Quản trị viên FamiDoc thẩm định Cấp 2
              </p>
              <p className="text-blue-800 text-xs leading-relaxed">
                Ngay khi Admin phê duyệt Cấp 2, bạn và Cơ sở Y tế sẽ cùng nhận được thông báo kích hoạt quyền tiếp nhận hộ gia đình.
              </p>
            </div>
          </div>
        )}

        {isLevel2Approved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-900 flex items-center gap-3">
            <span className="material-symbols-outlined text-xl text-emerald-600">verified</span>
            <div>
              <p className="font-bold text-emerald-800">
                Bác sĩ đã hoàn tất cả 2 cấp thẩm định và chính thức hoạt động (ACTIVE)!
              </p>
              <p className="text-emerald-700 text-xs">
                Hồ sơ đã được khóa để đảm bảo tính pháp lý; bạn có thể nhận tối đa{' '}
                {profile?.maxPanelCapacity ?? 30} hộ gia đình.
              </p>
            </div>
          </div>
        )}

        {/* Progress 3 Steps */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`p-4 rounded-xl border space-y-1.5 ${
                isSubmitted ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                className={`flex items-center gap-2 font-bold text-xs ${
                  isSubmitted ? 'text-emerald-800' : 'text-slate-700'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isSubmitted ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {isSubmitted ? '✓' : '1'}
                </span>
                <span>Bước 1: Nộp hồ sơ &amp; 3 chứng chỉ</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-snug">
                {uploadedCount >= 3 ? (
                  <>
                    Đã chuẩn bị <strong>{uploadedCount}/3</strong> tài liệu chuyên môn bắt buộc.
                  </>
                ) : (
                  'Điền đầy đủ hồ sơ cá nhân và tải lên đủ 3 tài liệu bắt buộc bên dưới.'
                )}
              </p>
              <div className="text-[10px] text-slate-500">
                {cchnNumber ? `Số CCHN: ${cchnNumber}` : 'Chưa có số CCHN'}
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border space-y-1.5 ${
                isLevel1Approved
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : onboardingStatus === 'PENDING_FACILITY_REVIEW'
                    ? 'bg-amber-50/60 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                className={`flex items-center gap-2 font-bold text-xs ${
                  isLevel1Approved
                    ? 'text-emerald-800'
                    : onboardingStatus === 'PENDING_FACILITY_REVIEW'
                      ? 'text-amber-800'
                      : 'text-slate-600'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isLevel1Approved
                      ? 'bg-emerald-600 text-white'
                      : onboardingStatus === 'PENDING_FACILITY_REVIEW'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {isLevel1Approved ? '✓' : '2'}
                </span>
                <span>Cấp 1: CSYT thẩm định</span>
              </div>
              <p className="text-[11px] leading-snug text-slate-700">
                {isLevel1Approved
                  ? `${selectedHospital || 'Cơ sở Y tế'} đã xác nhận hồ sơ nhân sự.`
                  : onboardingStatus === 'PENDING_FACILITY_REVIEW'
                    ? `Đang chờ ${selectedHospital || 'Cơ sở Y tế'} duyệt Cấp 1.`
                    : 'Mở sau khi bác sĩ nộp đủ hồ sơ.'}
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border space-y-1.5 ${
                isLevel2Approved
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                className={`flex items-center gap-2 font-bold text-xs ${
                  isLevel2Approved ? 'text-emerald-800' : 'text-slate-600'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isLevel2Approved ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {isLevel2Approved ? '✓' : '3'}
                </span>
                <span>Cấp 2: Admin FamiDoc phê duyệt</span>
              </div>
              <p className="text-[11px] leading-snug text-slate-700">
                {isLevel2Approved
                  ? `Đã kích hoạt với định mức ${profile?.maxPanelCapacity ?? 30} hộ gia đình.`
                  : 'Hậu kiểm CSDL Quốc gia sau khi CSYT hoàn tất duyệt Cấp 1.'}
              </p>
            </div>
          </div>
        </div>

        {/* Full-Page Submission Form (đồng bộ phong cách với FacilityLegalView) */}
        <form onSubmit={handleSubmitCredentials} className="space-y-6">
          {/* Section 1: Thông tin hồ sơ cá nhân bác sĩ */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-lg">badge</span>
                <span>1. Thông tin Hồ sơ Cá nhân Bác sĩ</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bổ sung học hàm/học vị, chuyên khoa, số năm kinh nghiệm và tiểu sử công tác để hoàn thiện hồ sơ hành nghề
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="doctor-academic-title"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Học hàm / Học vị
                </label>
                <select
                  id="doctor-academic-title"
                  disabled={isLevel2Approved}
                  value={formAcademicTitle}
                  onChange={(e) => setFormAcademicTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Chọn học vị</option>
                  <option value="BS">Bác sĩ (BS)</option>
                  <option value="ThS.BS">Thạc sĩ Bác sĩ (ThS.BS)</option>
                  <option value="BS.CKI">BS.CKI</option>
                  <option value="BS.CKII">BS.CKII</option>
                  <option value="TS.BS">TS.BS</option>
                  <option value="PGS.TS.BS">PGS.TS.BS</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="doctor-specialty"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Chuyên khoa hành nghề <span className="text-rose-500">*</span>
                </label>
                <input
                  id="doctor-specialty"
                  type="text"
                  required
                  disabled={isLevel2Approved}
                  value={formSpecialty}
                  onChange={(e) => setFormSpecialty(e.target.value)}
                  placeholder="Khoa Y học Gia đình"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="doctor-experience-years"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Số năm kinh nghiệm <span className="text-rose-500">*</span>
                </label>
                <input
                  id="doctor-experience-years"
                  type="number"
                  min={0}
                  max={60}
                  required
                  disabled={isLevel2Approved}
                  value={formExperienceYears}
                  onChange={(e) => setFormExperienceYears(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="doctor-bio"
                className="block text-xs font-semibold text-slate-700"
              >
                Tiểu sử &amp; định hướng chuyên môn
              </label>
              <textarea
                id="doctor-bio"
                rows={3}
                disabled={isLevel2Approved}
                value={formBio}
                onChange={(e) => setFormBio(e.target.value)}
                placeholder="Giới thiệu quá trình công tác, kinh nghiệm khám chữa bệnh gia đình..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Section 2: Bộ 3 chứng chỉ & văn bằng bắt buộc */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-lg">
                    verified_user
                  </span>
                  <span>2. Bộ 3 Chứng chỉ &amp; Văn bằng Bắt buộc (PDF, PNG, JPG ≤ 10MB)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tải lên bản scan rõ nét kèm số hiệu, nơi cấp và ngày cấp cho cả 3 loại giấy tờ theo quy chuẩn
                </p>
              </div>
              <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full tabular-nums">
                Đã có tệp: {uploadedCount}/3
              </span>
            </div>

            <div className="space-y-4">
              {REQUIRED_CREDENTIAL_DEFS.map((def) => {
                const entry = credentialsForm[def.type];
                const hasAnyFile = Boolean(entry.file || entry.existingFileUrl);
                const targetKey = entry.id || def.type;
                return (
                  <div
                    key={def.type}
                    className={`rounded-xl border p-4 sm:p-5 space-y-4 ${
                      hasAnyFile ? 'border-slate-200 bg-slate-50/40' : 'border-amber-200 bg-amber-50/30'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200/70 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{def.label}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{def.description}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {entry.platformApproved ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                            Admin đã duyệt
                          </span>
                        ) : entry.facilityVerified ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-semibold">
                            CSYT đã xác thực
                          </span>
                        ) : null}

                        {entry.file ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                            Đã chọn file mới
                          </span>
                        ) : entry.existingFileUrl ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                            Đã lưu trên hệ thống
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">
                            Chưa tải tệp
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label
                          htmlFor={`cert-number-${def.type}`}
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Số hiệu / Số quyết định <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id={`cert-number-${def.type}`}
                          aria-label={`Số hiệu ${def.shortLabel}`}
                          type="text"
                          required
                          disabled={isLevel2Approved}
                          value={entry.certificateNumber}
                          onChange={(e) =>
                            updateCredentialField(def.type, {
                              certificateNumber: e.target.value,
                            })
                          }
                          placeholder={`Nhập số hiệu ${def.shortLabel}`}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor={`cert-issuer-${def.type}`}
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Cơ quan / Nơi cấp <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id={`cert-issuer-${def.type}`}
                          aria-label={`Nơi cấp ${def.shortLabel}`}
                          type="text"
                          required
                          disabled={isLevel2Approved}
                          value={entry.issuingAuthority}
                          onChange={(e) =>
                            updateCredentialField(def.type, {
                              issuingAuthority: e.target.value,
                            })
                          }
                          placeholder={`Nhập nơi cấp ${def.shortLabel}`}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor={`cert-date-${def.type}`}
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Ngày cấp <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id={`cert-date-${def.type}`}
                          aria-label={`Ngày cấp ${def.shortLabel}`}
                          type="date"
                          required
                          disabled={isLevel2Approved}
                          value={entry.issueDate}
                          onChange={(e) =>
                            updateCredentialField(def.type, { issueDate: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="flex-1 space-y-1">
                        <label
                          htmlFor={`cert-file-${def.type}`}
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Tệp scan {def.shortLabel} (PDF, PNG, JPG){' '}
                          {!entry.existingFileUrl && <span className="text-rose-500">*</span>}
                        </label>
                        <input
                          id={`cert-file-${def.type}`}
                          aria-label={`Tệp scan ${def.shortLabel}`}
                          type="file"
                          disabled={isLevel2Approved}
                          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                          onChange={(e) =>
                            handleFileChange(
                              def.type,
                              e.target.files?.[0] || null,
                              def.shortLabel,
                            )
                          }
                          className="w-full p-2.5 rounded-xl border border-dashed border-slate-300 bg-white text-xs cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                        {entry.file && (
                          <p className="text-xs text-blue-700 font-medium">
                            Tệp mới: {entry.file.name} (
                            {Math.max(1, Math.round(entry.file.size / 1024))} KB)
                          </p>
                        )}
                      </div>

                      {(entry.id || entry.existingFileUrl) && (
                        <button
                          type="button"
                          disabled={openingId === targetKey}
                          onClick={() => void handlePreviewExistingFile(def.type)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-primary hover:bg-slate-50 shrink-0 cursor-pointer disabled:opacity-50 self-start sm:self-end"
                        >
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                          <span>
                            {openingId === targetKey ? 'Đang mở...' : 'Xem bản scan đã nộp'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Footer */}
          {!isLevel2Approved && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-600 space-y-0.5">
                <p className="font-semibold text-slate-900">
                  Xác nhận nộp hồ sơ thẩm định 2 cấp
                </p>
                <p>
                  Hồ sơ sẽ gửi trực tiếp tới {selectedHospital || 'Cơ sở Y tế'} để duyệt Cấp 1, sau đó chuyển Admin FamiDoc duyệt Cấp 2.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl px-6 py-2.5 text-xs sm:text-sm font-bold shadow-sm cursor-pointer shrink-0"
              >
                {isSubmitting
                  ? 'Đang tải lên & nộp hồ sơ...'
                  : isSubmitted
                    ? 'Cập nhật & Gửi lại Thẩm định'
                    : 'Gửi Thẩm Định'}
              </Button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
