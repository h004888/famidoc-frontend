'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { doctorsApi, type DoctorProfileDto } from '@/lib/api/doctors.api';
import { extractErrorMessage } from '@/lib/api';
import { DoctorCredentialsList } from '@/components/shared';

interface FacilityDoctorDetailViewProps {
  doctorId: string;
}

export function FacilityDoctorDetailView({ doctorId }: FacilityDoctorDetailViewProps) {
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Modal Yêu cầu bổ sung
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadDoctor() {
      setIsLoading(true);
      try {
        const data = await doctorsApi.getDoctorById(doctorId);
        if (isMounted) {
          if (data && (data.doctorName || data.id)) {
            setDoctor(data);
          } else {
            setDoctor(null);
          }
        }
      } catch (err) {
        console.warn('Lỗi tải thông tin bác sĩ CSYT:', err);
        if (isMounted) setDoctor(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadDoctor();
    return () => {
      isMounted = false;
    };
  }, [doctorId]);

  // Duyệt Cấp 1 (CSYT sơ duyệt)
  const handleFacilityApprove = async () => {
    if (!doctor) return;
    setIsActionLoading(true);
    try {
      await doctorsApi.facilityApproveCredentials(doctor.id, {
        approved: true,
        verificationNotes: 'Cơ sở Y tế đã kiểm tra tính xác thực của CCHN và hồ sơ nhân sự y tế.',
      });
      setDoctor((prev) =>
        prev
          ? {
              ...prev,
              onboardingStatus: 'FACILITY_VERIFIED',
              credentials: prev.credentials?.map((c) => ({ ...c, facilityVerified: true })),
            }
          : null
      );
      toast.success(
        `Đã hoàn tất duyệt Tầng 1! Hồ sơ của BS. ${doctor.doctorName} đã được chuyển lên Quản trị viên FamiDoc thẩm định Tầng 2.`
      );
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Không thể duyệt cấp 1 cho bác sĩ.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Yêu cầu sửa đổi hồ sơ chuyên môn
  const handleReject = async () => {
    if (!doctor || !rejectReason.trim()) return;
    setIsActionLoading(true);
    try {
      await doctorsApi.facilityApproveCredentials(doctor.id, {
        approved: false,
        rejectionReason: rejectReason.trim(),
      });
      setDoctor((prev) =>
        prev
          ? {
              ...prev,
              onboardingStatus: 'PENDING_SUBMISSION',
              rejectionReason: rejectReason.trim(),
            }
          : null
      );
      toast.success('Đã gửi thông báo yêu cầu cập nhật lại hồ sơ tới bác sĩ.');
      setRejectReason('');
      setShowRejectModal(false);
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Không thể gửi yêu cầu chỉnh sửa.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Đang tải hồ sơ bác sĩ trực thuộc...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-medium">Không tìm thấy thông tin bác sĩ {doctorId}.</p>
        <Link
          href="/facility/doctors"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const isReadyForFacilityReview = doctor.onboardingStatus === 'PENDING_FACILITY_REVIEW';

  return (
    <div className="space-y-6 pb-16">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/facility" className="hover:text-primary transition-colors">Portal Cơ sở Y tế</Link>
            <span>/</span>
            <Link href="/facility/doctors" className="hover:text-primary transition-colors">Bác sĩ</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">{doctor.id}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {doctor.doctorName}
            </h1>
            {doctor.onboardingStatus === 'ACTIVE' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Đang hoạt động khám chữa bệnh
              </span>
            ) : doctor.onboardingStatus === 'FACILITY_VERIFIED' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                CSYT đã duyệt Cấp 1 • Chờ FamiDoc duyệt Cấp 2
              </span>
            ) : isReadyForFacilityReview ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Chờ CSYT thẩm định Cấp 1
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Chờ Bác sĩ nộp đủ hồ sơ
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push('/facility/doctors')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm self-start"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Danh sách Bác sĩ
        </button>
      </div>

      {/* Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">verified</span>
              Thẩm định Hồ sơ Chuyên môn Tầng 1 (Facility Level - Flow 2.1)
            </p>
            <p className="text-sm text-slate-200">
              {doctor.onboardingStatus === 'FACILITY_VERIFIED'
                ? 'Cơ sở Y tế đã duyệt sơ bộ thành công. Hồ sơ đang nằm ở hàng đợi thẩm định của Quản trị viên FamiDoc.'
                : doctor.onboardingStatus === 'ACTIVE'
                ? 'Bác sĩ đã hoàn tất cả 2 cấp thẩm định và sẵn sàng nhận phân công hợp đồng gia đình.'
                : isReadyForFacilityReview
                ? 'Vui lòng kiểm tra đủ 3 loại chứng chỉ và nhấn Duyệt Cấp 1 để chuyển tiếp lên FamiDoc.'
                : 'Bác sĩ chưa hoàn tất nộp hồ sơ chuyên môn (đang ở trạng thái chờ nộp).'}
            </p>
          </div>

          {isReadyForFacilityReview && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs sm:text-sm font-medium transition-colors"
              >
                Yêu cầu bổ sung
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleFacilityApprove}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Duyệt Cấp 1 (Chuyển tiếp lên FamiDoc)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile & Credentials Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Thông tin Bác sĩ
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block">Chức danh / Học vị</label>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{doctor.academicTitle || 'BS. CKI'}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block">Khoa phòng &amp; Chuyên khoa</label>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{doctor.specialty}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block">Kinh nghiệm lâm sàng</label>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{doctor.experienceYears ?? 0} năm</p>
              </div>
              {doctor.bio && (
                <div>
                  <label className="text-xs text-slate-500 block">Giới thiệu chuyên môn</label>
                  <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{doctor.bio}</p>
                </div>
              )}
              <div>
                <label className="text-xs text-slate-500 block">Định mức dung lượng Panel (BR-04)</label>
                <p className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded inline-block mt-1">
                  {doctor.activePanelCount || 0} / {doctor.maxPanelCapacity || 30} Hộ gia đình
                </p>
              </div>
            </div>
          </div>

          {doctor.rejectionReason && (
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1">
              <p className="font-bold text-rose-800">Lý do yêu cầu bổ sung / từ chối gần nhất</p>
              <p className="leading-relaxed">{doctor.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Right Column: Credentials */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                Bộ 3 Chứng chỉ &amp; Văn bằng Bắt buộc của Bác sĩ
              </h3>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-semibold">
                {(doctor.credentials || []).length} / 3 loại
              </span>
            </div>

            <DoctorCredentialsList doctorId={doctor.id} credentials={doctor.credentials} />
          </div>
        </div>
      </div>

      {/* Modal Yêu cầu bổ sung */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">cancel</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Yêu cầu Bác sĩ bổ sung / sửa đổi CCHN
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Nhập nội dung cần chỉnh sửa để bác sĩ nhận được thông báo trong Portal của mình.
              </p>
            </div>
            <div>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Ảnh chụp CCHN bị mờ phần số quyết định và ngày cấp, vui lòng scan lại..."
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isActionLoading || !rejectReason.trim()}
                onClick={handleReject}
                className="px-4 py-2 text-xs sm:text-sm font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50"
              >
                {isActionLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
