'use client';

import React, { useState, useEffect } from 'react';
import { doctorsApi, type DoctorProfileDto } from '@/lib/api';

export function DoctorVerificationView() {
  const [profile, setProfile] = useState<DoctorProfileDto | null>(null);
  const [cchnNumber, setCchnNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [scopeOfPractice, setScopeOfPractice] = useState('Khám bệnh, chữa bệnh Nội khoa & Y học gia đình');
  const [selectedHospital, setSelectedHospital] = useState('');

  const [onboardingStatus, setOnboardingStatus] = useState<string>('PENDING_SUBMISSION');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states in modal
  const [formCchn, setFormCchn] = useState('');
  const [formScope, setFormScope] = useState('Khám bệnh, chữa bệnh Nội khoa & Y học gia đình');
  const [formIssuer, setFormIssuer] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formFiles, setFormFiles] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    doctorsApi
      .getDoctorMe()
      .then((res: any) => {
        if (!isMounted) return;
        const data: DoctorProfileDto | null =
          res && typeof res === 'object' && 'data' in res && res.data && typeof res.data === 'object' && !Array.isArray(res.data)
            ? (res.data as DoctorProfileDto)
            : (res as DoctorProfileDto);

        if (data) {
          setProfile(data);
          if (data.onboardingStatus) {
            setOnboardingStatus(data.onboardingStatus);
          }
          const hospitalName = data.facility?.facilityName || data.facilityName;
          if (hospitalName) {
            setSelectedHospital(hospitalName);
          }
          if (data.specialty) {
            const scopeText = `Khám bệnh, chữa bệnh chuyên khoa ${data.specialty}`;
            setScopeOfPractice(scopeText);
            setFormScope(scopeText);
          }
          if (data.credentials && data.credentials.length > 0) {
            const primary =
              data.credentials.find((c) => c.credentialType === 'PRACTICE_LICENSE_CCHN') ||
              data.credentials[0];

            if (primary.certificateNumber) {
              setCchnNumber(primary.certificateNumber);
              setFormCchn(primary.certificateNumber);
            }
            if (primary.issuingAuthority) {
              setIssuingAuthority(primary.issuingAuthority);
              setFormIssuer(primary.issuingAuthority);
            }
            if (primary.issueDate) {
              const dStr = new Date(primary.issueDate).toISOString().split('T')[0];
              setIssueDate(dStr);
              setFormDate(dStr);
            }

            const uploadedFiles = data.credentials
              .map((c) => c.fileUrl)
              .filter(Boolean);
            if (uploadedFiles.length > 0) {
              setFormFiles(uploadedFiles);
            }
          }
        }
      })
      .catch((err) => {
        console.warn('Doctor profile fetch fallback:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await doctorsApi.submitMyCredentials({
        cchnNumber: formCchn,
        scopeOfPractice: formScope,
        issuedBy: formIssuer,
        issuedDate: formDate,
        certificateFiles: formFiles,
      });

      if (res) {
        setProfile(res);
        if (res.onboardingStatus) {
          setOnboardingStatus(res.onboardingStatus);
        }
        if (res.credentials && res.credentials.length > 0) {
          const primary =
            res.credentials.find((c: any) => c.credentialType === 'PRACTICE_LICENSE_CCHN') ||
            res.credentials[0];
          setCchnNumber(primary.certificateNumber || formCchn);
          setIssuingAuthority(primary.issuingAuthority || formIssuer);
          if (primary.issueDate) {
            setIssueDate(new Date(primary.issueDate).toISOString().split('T')[0]);
          }
          const files = res.credentials.map((c: any) => c.fileUrl).filter(Boolean);
          if (files.length > 0) {
            setFormFiles(files);
          }
        } else {
          setCchnNumber(formCchn);
          setIssuingAuthority(formIssuer);
          setIssueDate(formDate);
        }
      } else {
        setCchnNumber(formCchn);
        setScopeOfPractice(formScope);
        setIssuingAuthority(formIssuer);
        setIssueDate(formDate);
        setOnboardingStatus('PENDING_SUBMISSION');
      }

      setToastMessage('Đã nộp hồ sơ CCHN lên hệ thống! Hồ sơ đang chờ Cơ sở y tế thẩm định Cấp 1.');
      setShowUpdateModal(false);
    } catch (err: any) {
      console.warn('Lỗi khi nộp CCHN:', err?.message || err);
      const errMsg = err?.message || 'Có lỗi khi nộp hồ sơ CCHN lên máy chủ';
      setToastMessage(`[Lỗi] ${errMsg}`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const isLevel1Approved =
    onboardingStatus === 'FACILITY_VERIFIED' ||
    onboardingStatus === 'FACILITY_APPROVED' ||
    onboardingStatus === 'ACTIVE';
  const isLevel2Approved = onboardingStatus === 'ACTIVE';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a]">
                Hồ Sơ Y Khoa &amp; Xác Thực Chứng Chỉ Hành Nghề (CCHN)
              </h1>
              {isLevel2Approved ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f6ffed] text-[#03864b] border border-[#b7eb8f]">
                  Đã duyệt 2 cấp · Hoạt động hợp pháp
                </span>
              ) : isLevel1Approved ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  CSYT đã duyệt Cấp 1 · Chờ Nền tảng
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                  Chờ CSYT thẩm định Cấp 1
                </span>
              )}
            </div>
            <p className="text-xs text-[#475569] mt-1">
              Quy trình thẩm định năng lực 2 cấp chuẩn Bộ Y Tế: Cơ sở y tế bệnh viện thẩm định (Cấp 1) &amp; Nền tảng FamiDoc phê duyệt chính thức (Cấp 2).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowUpdateModal(true)}
            className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            <span>Cập nhật / Nộp hồ sơ CCHN</span>
          </button>
        </div>

        {/* Verification Status Banner (2-Tier Pipeline chuẩn BYT) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Tiến trình thẩm định hồ sơ y khoa 2 cấp
              </span>
              <h3 className="text-base font-bold text-[#0f172a] mt-0.5">
                {isLevel2Approved
                  ? 'Hồ sơ đã được phê duyệt toàn diện & Cấp quyền Kê đơn điện tử HSM'
                  : isLevel1Approved
                  ? 'Cấp 1 hoàn tất: Đang chờ Nền tảng FamiDoc phê duyệt kích hoạt tiếp nhận bệnh nhân'
                  : 'Đang thẩm định hồ sơ: Chờ Hội đồng chuyên môn CSYT xác minh CCHN'}
              </h3>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto ${
                isLevel2Approved
                  ? 'bg-[#f6ffed] text-[#03864b] border border-[#b7eb8f]'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isLevel2Approved ? 'verified' : 'pending'}
              </span>
              {isLevel2Approved ? 'Hoạt động hợp pháp 100%' : 'Chờ hoàn tất duyệt'}
            </span>
          </div>

          {/* 3 Step Visual Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bước 1 */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                  {cchnNumber ? '✓' : '1'}
                </span>
                <span>Bước 1: Nộp CCHN &amp; Bằng cấp</span>
              </div>
              <p className="text-[11px] text-emerald-900 leading-snug">
                {cchnNumber ? (
                  <>Đã tiếp nhận số CCHN <strong>{cchnNumber}</strong> và hồ sơ chuyên khoa.</>
                ) : (
                  'Chưa nộp CCHN. Bấm nút phía trên để nộp hồ sơ thẩm định.'
                )}
              </p>
              <div className="text-[10px] text-slate-500 pt-1">
                {issueDate ? `Ngày cấp: ${issueDate}` : 'Chưa có thông tin ngày cấp'}
              </div>
            </div>

            {/* Bước 2: Cấp 1 */}
            <div
              className={`p-4 rounded-2xl border space-y-1.5 ${
                isLevel1Approved
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-amber-50/60 border-amber-200'
              }`}
            >
              <div
                className={`flex items-center gap-2 font-bold text-xs ${
                  isLevel1Approved ? 'text-emerald-800' : 'text-amber-800'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isLevel1Approved ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
                  {isLevel1Approved ? '✓' : '2'}
                </span>
                <span>Cấp 1: CSYT / Bệnh viện thẩm định</span>
              </div>
              <p className={`text-[11px] leading-snug ${isLevel1Approved ? 'text-emerald-900' : 'text-amber-900'}`}>
                {isLevel1Approved
                  ? `Hội đồng Y khoa ${selectedHospital} đã thẩm định & xác nhận hồ sơ chuyên môn.`
                  : `Đang chờ ${selectedHospital} đối chiếu CCHN trên cổng thông tin Bộ Y Tế.`}
              </p>
              <div className="text-[10px] text-slate-500 pt-1">
                {isLevel1Approved ? 'Trạng thái: FACILITY_APPROVED' : 'Trạng thái: PENDING_FACILITY'}
              </div>
            </div>

            {/* Bước 3: Cấp 2 */}
            <div
              className={`p-4 rounded-2xl border space-y-1.5 ${
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
                <span>Cấp 2: Nền tảng FamiDoc phê duyệt</span>
              </div>
              <p className={`text-[11px] leading-snug ${isLevel2Approved ? 'text-emerald-900' : 'text-slate-600'}`}>
                {isLevel2Approved
                  ? 'Đã cấp chứng thư số HSM Viettel-CA và quyền nhận tối đa 30 hộ gia đình.'
                  : 'Kích hoạt sau khi CSYT hoàn tất thẩm định Cấp 1.'}
              </p>
              <div className="text-[10px] text-slate-500 pt-1">
                {isLevel2Approved ? 'Trạng thái: ACTIVE' : 'Trạng thái: CHỜ DUYỆT'}
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin CCHN chi tiết */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                Thông Tin Giấy Phép Hành Nghề Khám Bệnh, Chữa Bệnh
              </h3>
              {profile?.doctorName && (
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {profile.academicTitle ? `${profile.academicTitle}. ` : ''}{profile.doctorName}
                </span>
              )}
            </div>

            {!cchnNumber && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0 mt-0.5">info</span>
                <div className="space-y-1">
                  <p className="font-semibold">Hồ sơ CCHN chưa được khởi tạo trên hệ thống.</p>
                  <p className="text-[11px] text-amber-800">
                    Bác sĩ vui lòng bấm nút ở góc trên để gửi chứng chỉ hành nghề và bằng cấp cho Hội đồng Y khoa CSYT thẩm định Cấp 1.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Bác sĩ phụ trách:</span>
                <strong className="text-slate-900">
                  {profile?.doctorName ? `${profile?.academicTitle ? profile.academicTitle + ' ' : ''}${profile.doctorName}` : 'Đang tải...'}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Số CCHN / Số giấy phép:</span>
                <strong className={cchnNumber ? 'text-slate-900 font-bold' : 'text-amber-700 italic'}>
                  {cchnNumber || 'Chưa nộp CCHN'}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Cơ quan cấp phép:</span>
                <strong className={issuingAuthority ? 'text-slate-900' : 'text-slate-400 italic'}>
                  {issuingAuthority || 'Chưa cập nhật'}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Ngày cấp chứng chỉ:</span>
                <strong className={issueDate ? 'text-slate-900' : 'text-slate-400 italic'}>
                  {issueDate || 'Chưa cập nhật'}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Phạm vi hoạt động chuyên môn:</span>
                <strong className="text-slate-900 text-right max-w-xs">{scopeOfPractice || 'Y học Gia đình'}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Cơ sở y tế liên kết:</span>
                <strong className="text-blue-700">{selectedHospital || 'Chưa liên kết'}</strong>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Tài Liệu &amp; Văn Bằng Đã Tải Lên ({formFiles.length})
            </h3>
            <div className="space-y-2 text-xs">
              {formFiles.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-slate-400">
                  Chưa có tài liệu đính kèm nào được tải lên.
                </div>
              ) : (
                formFiles.map((file, idx) => {
                  const displayName = file.includes('/') ? file.split('/').pop() : file;
                  return (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="material-symbols-outlined text-blue-600 text-[20px] shrink-0">description</span>
                        <div className="truncate">
                          <span className="font-bold text-[#0f172a] block truncate" title={file}>
                            {displayName}
                          </span>
                          <span className="text-[10px] text-slate-400">Bản sao công chứng y khoa</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f6ffed] text-[#03864b] border border-[#b7eb8f] shrink-0">
                        Đã ghi nhận
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Nộp / Cập nhật hồ sơ CCHN */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-[#0f172a]">
                Nộp Hồ Sơ Xác Thực Chứng Chỉ Hành Nghề (CCHN)
              </h3>
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCredentials} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#475569] mb-1">Số chứng chỉ hành nghề (CCHN) *</label>
                <input
                  type="text"
                  required
                  value={formCchn}
                  onChange={(e) => setFormCchn(e.target.value)}
                  placeholder="Ví dụ: 004128/BYT-CCHN"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#475569] mb-1">Cơ quan cấp phép *</label>
                <input
                  type="text"
                  required
                  value={formIssuer}
                  onChange={(e) => setFormIssuer(e.target.value)}
                  placeholder="Ví dụ: Cục Quản lý Khám chữa bệnh - Bộ Y Tế"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#475569] mb-1">Ngày cấp *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#475569] mb-1">Cơ sở y tế thẩm định</label>
                  <input
                    type="text"
                    disabled
                    value={selectedHospital}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#475569] mb-1">Phạm vi hoạt động chuyên môn *</label>
                <textarea
                  rows={2}
                  required
                  value={formScope}
                  onChange={(e) => setFormScope(e.target.value)}
                  placeholder="Ví dụ: Khám bệnh, chữa bệnh Nội khoa & Y học gia đình"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#475569] mb-1">Ảnh chụp 2 mặt CCHN &amp; Bằng cấp (JPG, PNG, PDF)</label>
                <input
                  type="file"
                  multiple
                  className="w-full p-2 rounded-lg border border-dashed border-slate-300 bg-slate-50"
                  onChange={(e) => {
                    if (e.target.files) {
                      const names = Array.from(e.target.files).map((f) => f.name);
                      setFormFiles(names);
                    }
                  }}
                />
                <p className="text-[10px] text-slate-400 mt-1">Hệ thống chấp nhận tối đa 5 file, dung lượng mỗi file dưới 10MB.</p>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg shadow-xs flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span>Đang nộp hồ sơ...</span>
                  ) : (
                    <span>Gửi Thẩm Định 2 Cấp</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accessible Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span className="font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
            aria-label="Đóng thông báo"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}

