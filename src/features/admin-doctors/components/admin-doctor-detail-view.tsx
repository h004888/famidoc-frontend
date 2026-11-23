'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { doctorsApi, type DoctorProfileDto } from '@/lib/api/doctors.api';
import { extractErrorMessage } from '@/lib/api';
import { DashboardPageShell, DoctorCredentialsList } from '@/components/shared';

interface AdminDoctorDetailViewProps {
  doctorId: string;
}

export function AdminDoctorDetailView({ doctorId }: AdminDoctorDetailViewProps) {
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Modal Từ chối
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
        console.warn('Lỗi tải chi tiết bác sĩ:', err);
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

  // Admin Phê duyệt Platform (Tầng 2)
  const handlePlatformApprove = async () => {
    if (!doctor) return;
    setIsActionLoading(true);
    try {
      const updated = await doctorsApi.platformApproveCredentials(doctor.id, {
        approved: true,
      });
      setDoctor(updated);
      toast.success(
        `Đã ghi nhận phê duyệt CCHN. Bác sĩ ${doctor.doctorName} đã được kích hoạt ACTIVE trên toàn nền tảng.`
      );
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Không thể phê duyệt Platform.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Admin Từ chối
  const handleReject = async () => {
    if (!doctor || !rejectReason.trim()) return;
    setIsActionLoading(true);
    try {
      const updated = await doctorsApi.platformApproveCredentials(doctor.id, {
        approved: false,
        rejectionReason: rejectReason.trim(),
      });
      setDoctor(updated);
      toast.success('Đã gửi thông báo từ chối hồ sơ chuyên môn tới CSYT và Bác sĩ.');
      setRejectReason('');
      setShowRejectModal(false);
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Không thể từ chối hồ sơ.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Đang tải hồ sơ Bác sĩ...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-medium">Không tìm thấy thông tin bác sĩ {doctorId}.</p>
        <Link
          href="/admin/doctors"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const isFacilityReviewComplete =
    doctor.onboardingStatus === 'FACILITY_VERIFIED' || doctor.onboardingStatus === 'ACTIVE';

  return (
    <DashboardPageShell containerClassName="pb-16">

      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/admin" className="hover:text-primary transition-colors">Quản trị hệ thống</Link>
            <span>/</span>
            <Link href="/admin/doctors" className="hover:text-primary transition-colors">Bác sĩ</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">{doctor.id}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {doctor.doctorName}
            </h1>
            {doctor.onboardingStatus === 'FACILITY_VERIFIED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Chờ duyệt Tầng 2 (Platform Approve)
              </span>
            )}
            {doctor.onboardingStatus === 'PENDING_FACILITY_REVIEW' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                Chờ CSYT duyệt Cấp 1
              </span>
            )}
            {doctor.onboardingStatus === 'PENDING_SUBMISSION' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                Chờ Bác sĩ nộp đủ hồ sơ
              </span>
            )}
            {doctor.onboardingStatus === 'ACTIVE' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Đã kích hoạt hành nghề (ACTIVE)
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push('/admin/doctors')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm self-start"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Danh sách Bác sĩ
        </button>
      </div>

      {/* Verification Notice Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">verified</span>
              Thẩm định CCHN Tầng 2 (Dual-Tier Verification - Flow 2.1)
            </p>
            <p className="text-sm text-slate-200">
              {doctor.onboardingStatus === 'FACILITY_VERIFIED'
                ? 'Hồ sơ đã được Cơ sở Y tế sơ duyệt Cấp 1. Admin FamiDoc đối chiếu 3 chứng chỉ và phê duyệt kích hoạt.'
                : doctor.onboardingStatus === 'ACTIVE'
                ? 'Bác sĩ đã hoàn tất thẩm định 2 tầng và đang hoạt động khám chữa bệnh gia đình.'
                : doctor.onboardingStatus === 'PENDING_FACILITY_REVIEW'
                ? 'Bác sĩ đã nộp đủ 3 chứng chỉ và đang chờ Cơ sở Y tế thẩm định Cấp 1.'
                : 'Bác sĩ đang ở trạng thái chờ nộp / bổ sung hồ sơ chuyên môn.'}
            </p>
          </div>

          {doctor.onboardingStatus === 'FACILITY_VERIFIED' && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs sm:text-sm font-medium transition-colors"
              >
                Từ chối CCHN
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handlePlatformApprove}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">verified_user</span>
                Phê duyệt Platform
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Doctor Profile & Facility Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Thông tin Bác sĩ
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block">Học hàm / Học vị</label>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{doctor.academicTitle || 'Bác sĩ'}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block">Chuyên khoa đăng ký</label>
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
                  Đang phụ trách {doctor.activePanelCount || 0} / Tối đa {doctor.maxPanelCapacity || 30} Hộ gia đình
                </p>
              </div>
            </div>
          </div>

          {doctor.rejectionReason && (
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1">
              <p className="font-bold text-rose-800">Lý do từ chối / yêu cầu bổ sung gần nhất</p>
              <p className="leading-relaxed">{doctor.rejectionReason}</p>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Cơ sở Y tế công tác
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block">Tên cơ sở y tế</label>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {doctor.facilityName || doctor.facility?.facilityName || 'Cơ sở Y tế Đối tác'}
                </p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block">Mã CSYT trực thuộc</label>
                <p className="text-xs tabular-nums font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded inline-block mt-0.5">
                  {doctor.facilityId}
                </p>
              </div>
              <div>
                <Link
                  href={`/admin/facilities/${doctor.facilityId}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline mt-1"
                >
                  Xem chi tiết hồ sơ CSYT này
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Credentials & Documents */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                Bộ 3 Chứng chỉ Hành nghề &amp; Văn bằng Bắt buộc
              </h3>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-semibold">
                {(doctor.credentials || []).length} / 3 loại
              </span>
            </div>

            <DoctorCredentialsList doctorId={doctor.id} credentials={doctor.credentials} />
          </div>

          {/* Dual-Tier Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
              Tiến trình thẩm định Dual-Tier (Flow 2.1)
            </h3>
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold ${
                    isFacilityReviewComplete
                      ? 'bg-emerald-100 text-emerald-700'
                      : doctor.onboardingStatus === 'PENDING_FACILITY_REVIEW'
                        ? 'bg-amber-100 text-amber-700 animate-pulse'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isFacilityReviewComplete ? '✓' : '1'}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Tầng 1: Thẩm định nội bộ Cơ sở Y tế (FACILITY_VERIFIED)</p>
                  <p className="text-slate-500 mt-0.5">
                    {isFacilityReviewComplete
                      ? 'Đại diện CSYT đã đối chiếu văn bằng gốc, xác nhận bác sĩ trực thuộc và đề xuất kích hoạt lên FamiDoc.'
                      : doctor.onboardingStatus === 'PENDING_FACILITY_REVIEW'
                        ? 'Bác sĩ đã nộp đủ 3 chứng chỉ, đang chờ Cơ sở Y tế thẩm định Cấp 1.'
                        : 'Chờ bác sĩ nộp đủ 3 chứng chỉ để Cơ sở Y tế thẩm định Cấp 1.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold ${
                    doctor.onboardingStatus === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-700'
                      : doctor.onboardingStatus === 'FACILITY_VERIFIED'
                        ? 'bg-amber-100 text-amber-700 animate-pulse'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {doctor.onboardingStatus === 'ACTIVE' ? '✓' : '2'}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    Tầng 2: Hậu kiểm CSDL Quốc gia FamiDoc (Platform Approval)
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    {doctor.onboardingStatus === 'ACTIVE'
                      ? 'Admin đã hoàn tất tra cứu CSDL Quốc gia và phê duyệt chính thức.'
                      : doctor.onboardingStatus === 'FACILITY_VERIFIED'
                        ? 'Đang chờ Admin phê duyệt để cấp quyền mở lịch tư vấn và tiếp nhận bệnh nhân.'
                        : 'Mở sau khi Cơ sở Y tế hoàn tất duyệt Cấp 1.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Từ chối */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">cancel</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Từ chối CCHN Bác sĩ
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Nhập lý do cụ thể để CSYT và Bác sĩ nắm được và tải lại chứng chỉ hợp lệ.
              </p>
            </div>
            <div>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Số CCHN không khớp với họ tên trên Cổng dịch vụ công..."
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
                {isActionLoading ? 'Đang gửi...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
