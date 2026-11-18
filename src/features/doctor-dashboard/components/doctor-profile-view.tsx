'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { doctorsApi, type DoctorProfileDto } from '@/lib/api/doctors.api';
import { DashboardPageShell, DoctorCredentialsList } from '@/components/shared';

export function DoctorProfileView() {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<DoctorProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDoctor() {
      setIsLoading(true);
      try {
        const data = await doctorsApi.getDoctorMe();
        if (isMounted) {
          setDoctor(data && data.doctorName ? data : null);
        }
      } catch (err) {
        console.warn('Lỗi tải thông tin bác sĩ:', err);
        if (isMounted) setDoctor(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadDoctor();
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Đang tải hồ sơ bác sĩ...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-medium">Không thể nạp hồ sơ bác sĩ hiện tại.</p>
      </div>
    );
  }

  return (
    <DashboardPageShell containerClassName="pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <Link href="/doctor" className="hover:text-primary transition-colors">Portal Bác sĩ</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Hồ sơ Chuyên môn</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Hồ sơ Bác sĩ &amp; Trạng thái Hành nghề (Flow 2.1)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý thông tin định danh y tế, chứng chỉ hành nghề CCHN và định mức dung lượng phụ trách hộ gia đình.
          </p>
        </div>

        <Link
          href="/doctor/verification"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-colors self-start"
        >
          <span className="material-symbols-outlined text-sm">verified_user</span>
          Cập nhật CCHN Y tế
        </Link>
      </div>

      {/* Status Notice */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">medical_information</span>
              Trạng thái Cấp phép Hành nghề Nền tảng
            </p>
            <p className="text-sm text-slate-200">
              {doctor.onboardingStatus === 'ACTIVE'
                ? 'Hồ sơ đã được Cơ sở Y tế và FamiDoc thẩm định 2 tầng thành công. Bác sĩ đủ điều kiện tiếp nhận khám chữa bệnh gia đình.'
                : doctor.onboardingStatus === 'FACILITY_VERIFIED'
                ? 'Cơ sở Y tế đã duyệt sơ bộ Tầng 1. Đang chờ Quản trị viên FamiDoc hậu kiểm CSDL Quốc gia để kích hoạt.'
                : 'Chưa hoàn tất thẩm định. Vui lòng nộp đầy đủ ảnh 2 mặt Chứng chỉ hành nghề (CCHN) để được cấp phép.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {doctor.onboardingStatus === 'ACTIVE' ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                ĐÃ KÍCH HOẠT (ACTIVE)
              </span>
            ) : doctor.onboardingStatus === 'FACILITY_VERIFIED' ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                CHỜ ADMIN DUYỆT CẤP 2
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                CHƯA NỘP ĐỦ CCHN
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Thông tin Cá nhân
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block">Họ và tên Bác sĩ</label>
                <p className="text-base font-bold text-slate-900 mt-0.5">{doctor.doctorName}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block">Học hàm / Học vị</label>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{doctor.academicTitle || 'BS. CKI'}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block">Chuyên khoa</label>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{doctor.specialty}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 block">Số năm kinh nghiệm</label>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{doctor.experienceYears} năm</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Cơ sở Y tế Liên kết
            </h3>
            <div className="space-y-2">
              <label className="text-xs text-slate-500 block">Đơn vị công tác</label>
              <p className="text-sm font-bold text-slate-900">
                {doctor.facilityName || doctor.facility?.facilityName || 'Chưa liên kết cơ sở y tế'}
              </p>
              <p className="text-xs text-slate-500">
                Mã CSYT: <span className="tabular-nums">{doctor.facilityId || 'N/A'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Credentials & Capacity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Credentials Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                Bộ 3 Chứng chỉ &amp; Văn bằng Hành nghề Y
              </h3>
              <Link
                href="/doctor/verification"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Cập nhật hồ sơ
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            </div>

            <DoctorCredentialsList doctorId="me" credentials={doctor.credentials} />
          </div>

          {/* Panel Capacity (BR-04) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
              Định mức Tải Hộ Gia đình (Panel Capacity Ceiling - BR-04)
            </h3>
            <p className="text-xs text-slate-500">
              Theo quy chuẩn an toàn y tế FamiDoc, mỗi bác sĩ gia đình chỉ được phụ trách tối đa {doctor.maxPanelCapacity || 30} hộ gia đình cùng lúc nhằm đảm bảo chất lượng theo dõi sức khỏe liên tục.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700">
                  Số hộ đang phụ trách: {doctor.activePanelCount ?? 0} hộ
                </span>
                <span className="text-primary font-bold">
                  {Math.round(((doctor.activePanelCount ?? 0) / (doctor.maxPanelCapacity || 30)) * 100)}% dung lượng
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(((doctor.activePanelCount ?? 0) / (doctor.maxPanelCapacity || 30)) * 100)
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0 hộ</span>
                <span>Tối đa: {doctor.maxPanelCapacity || 30} hộ gia đình</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardPageShell>
  );
}
