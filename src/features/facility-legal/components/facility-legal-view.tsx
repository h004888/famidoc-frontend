'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { facilitiesApi, type AdminFacilityItem } from '@/lib/api/facilities.api';

export function FacilityLegalView() {
  const [loading, setLoading] = useState(true);
  const [facility, setFacility] = useState<AdminFacilityItem | null>(null);

  // Form states
  const [facilityName, setFacilityName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [address, setAddress] = useState('');
  const [hotline, setHotline] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [licenseIssuer, setLicenseIssuer] = useState('');
  const [licenseDate, setLicenseDate] = useState('');
  const [legalDocumentsUrl, setLegalDocumentsUrl] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    let isMounted = true;
    facilitiesApi
      .getMyFacilityProfile()
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setFacility(data);
          setFacilityName(data.facilityName || '');
          setLicenseNumber(data.operatingLicense || '');
          setTaxCode(data.taxCode || '');
          setAddress(data.address || '');
          setBankName(data.bankName || '');
          setBankAccountNumber(data.bankAccount || '');
          setBankAccountHolder(data.bankAccountHolder || '');
          if (data.licenseIssuer) setLicenseIssuer(data.licenseIssuer);
          if (data.licenseDate) {
            try {
              setLicenseDate(new Date(data.licenseDate).toISOString().slice(0, 10));
            } catch {
              setLicenseDate(data.licenseDate);
            }
          }
          if (data.phone) setHotline(data.phone);
          if (data.licenseFiles && data.licenseFiles.length > 0) setUploadedFiles(data.licenseFiles);
        }
      })
      .catch((err) => {
        console.warn('Lỗi khi tải hồ sơ cơ sở y tế:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const names: string[] = [];
      for (let i = 0; i < files.length; i++) {
        names.push(files[i].name);
      }
      setUploadedFiles((prev) => [...prev, ...names]);
      setToastMessage({ text: `Đã đính kèm ${names.length} tệp tài liệu thành công.`, isError: false });
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!licenseNumber.trim()) {
      newErrors.licenseNumber = 'Vui lòng nhập số Giấy phép hoạt động (GPHĐ) do Bộ/Sở Y Tế cấp';
    }
    const cleanTax = taxCode.trim();
    if (!cleanTax) {
      newErrors.taxCode = 'Vui lòng nhập Mã số thuế doanh nghiệp';
    } else if (cleanTax.length < 10) {
      newErrors.taxCode = 'Mã số thuế phải có tối thiểu 10 ký tự số';
    }
    if (!hotline.trim()) {
      newErrors.hotline = 'Vui lòng nhập số đường dây nóng cấp cứu / tiếp nhận y tế';
    }
    if (!bankName.trim()) {
      newErrors.bankName = 'Vui lòng chọn hoặc nhập tên Ngân hàng thụ hưởng';
    }
    if (!bankAccountNumber.trim()) {
      newErrors.bankAccountNumber = 'Vui lòng nhập số tài khoản ngân hàng phục vụ quyết toán';
    }
    if (!bankAccountHolder.trim()) {
      newErrors.bankAccountHolder = 'Vui lòng nhập tên chủ tài khoản (in hoa không dấu)';
    }
    if (uploadedFiles.length === 0) {
      newErrors.files = 'Vui lòng tải lên tối thiểu 1 tệp scan Giấy phép hoạt động hoặc ĐKKD';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const submittedData = {
      facilityName: facilityName.trim(),
      licenseNumber: licenseNumber.trim(),
      taxCode: cleanTax,
      hotline: hotline.trim(),
      bankName: bankName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      bankAccountHolder: bankAccountHolder.trim().toUpperCase(),
      address: address.trim(),
      licenseIssuer: licenseIssuer.trim(),
      licenseDate: licenseDate || undefined,
      legalDocumentsUrl,
    };

    try {
      await facilitiesApi.updateLegalProfile(submittedData);
      const existing = facility;
      const updatedFacility: AdminFacilityItem = {
        id: existing?.id || 'fac-me',
        facilityName: submittedData.facilityName || existing?.facilityName || 'Cơ sở Y tế Đối tác',
        representativeName: existing?.representativeName || 'Đại diện cơ sở y tế',
        email: existing?.email || '',
        createdAt: existing?.createdAt || new Date().toISOString(),
        phone: submittedData.hotline,
        address: submittedData.address,
        onboardingStatus: 'LEGAL_SUBMITTED',
        status: 'PENDING',
        taxCode: submittedData.taxCode,
        operatingLicense: submittedData.licenseNumber,
        licenseIssuer:
          submittedData.licenseIssuer ||
          (submittedData.licenseNumber.includes('SYT')
            ? 'Sở Y Tế địa phương'
            : 'Bộ Y Tế - Cục Quản lý Khám chữa bệnh'),
        licenseDate: submittedData.licenseDate,
        bankName: submittedData.bankName,
        bankAccount: submittedData.bankAccountNumber,
        bankAccountHolder: submittedData.bankAccountHolder,
        licenseFiles: uploadedFiles,
      };

      setFacility(updatedFacility);
      setToastMessage({
        text: 'Nộp hồ sơ pháp lý chuyên sâu thành công! Hồ sơ đã được cập nhật sang trạng thái "LEGAL_SUBMITTED" và chuyển tới Quản Trị Viên để thẩm định CSDL Quốc gia.',
        isError: false,
      });
    } catch (err: any) {
      console.warn('Lỗi nộp hồ sơ pháp lý CSYT:', err);
      const errorMsg =
        err?.message ||
        'Không thể nộp hồ sơ pháp lý lên máy chủ. Vui lòng kiểm tra lại thông tin và thử lại.';
      setToastMessage({ text: `[Lỗi] ${errorMsg}`, isError: true });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  const isVerifiedActive = facility?.onboardingStatus === 'ACTIVE' || facility?.status === 'ACTIVE';
  const isWaitingReview = facility?.onboardingStatus === 'LEGAL_SUBMITTED';
  const isRejected = facility?.onboardingStatus === 'REJECTED';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <div className="w-9 h-9 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-xs font-medium text-slate-500 mt-3">Đang tải hồ sơ pháp lý cơ sở y tế...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <main className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between shadow-md transition-all ${
              toastMessage.isError
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">
                {toastMessage.isError ? 'error' : 'check_circle'}
              </span>
              <span>{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-xs opacity-70 hover:opacity-100 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Breadcrumb & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/facility" className="hover:text-blue-600 transition-colors">
              Cơ sở Y tế
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Hồ sơ Pháp lý &amp; Thẩm định Cấp 2</span>
          </div>

          <Link
            href="/facility"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Về Tổng quan</span>
          </Link>
        </div>

        {/* Header Title Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Hồ Sơ Pháp Lý &amp; Giấy Phép Hoạt Động (GPHĐ)
              </h1>
              {isVerifiedActive ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Đã duyệt Cấp 2 · ACTIVE
                </span>
              ) : isWaitingReview ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Đã nộp hồ sơ · Chờ Admin đối soát CSDL Quốc gia
                </span>
              ) : isRejected ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Cần bổ sung / Từ chối
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Chờ nộp hồ sơ pháp lý (Duyệt Lần 2)
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Cơ sở Y tế: <span className="font-semibold text-slate-800">{facility?.facilityName}</span> • Mã định danh: <span className="tracking-wide text-slate-700 font-semibold">{facility?.id}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="px-3.5 py-2 rounded-xl bg-blue-50/80 border border-blue-200/60 text-blue-900 text-xs">
              <span className="block font-semibold">Quy chuẩn Thẩm định</span>
              <span className="text-slate-600">Nghị định 96/2023/NĐ-CP &amp; CSDL Bộ Y Tế</span>
            </div>
          </div>
        </div>

        {/* Warning / Status Banners */}
        {isRejected && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-900 space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <span className="material-symbols-outlined text-base">warning</span>
              <span>Yêu cầu bổ sung hồ sơ từ Quản trị viên Nền tảng:</span>
            </div>
            <p className="pl-6 text-slate-700">
              Hồ sơ giấy phép hoạt động hoặc mã số thuế chưa khớp với đăng ký kinh doanh. Vui lòng cập nhật lại thông tin chính xác và đính kèm file scan rõ nét để Admin hậu kiểm lại.
            </p>
          </div>
        )}

        {isVerifiedActive && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-900 flex items-center gap-3">
            <span className="material-symbols-outlined text-xl text-emerald-600">verified</span>
            <div>
              <p className="font-bold text-emerald-800">Cơ sở y tế đã hoàn tất hậu kiểm pháp lý và được kích hoạt đối tác ACTIVE!</p>
              <p className="text-emerald-700 text-xs">Đơn vị đã đủ điều kiện ký kết hợp đồng cung ứng nhân lực y tế B2B và điều phối bác sĩ gia đình.</p>
            </div>
          </div>
        )}

        {/* Form chính */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nhóm 1: Thông tin pháp lý hành nghề & Giấy phép */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-lg">policy</span>
                  <span>1. Giấy Phép Hoạt Động Khám Bệnh, Chữa Bệnh (GPHĐ) &amp; Thuế</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thông tin theo đúng Giấy phép do Bộ Y Tế hoặc Sở Y Tế cấp có thẩm quyền
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Tên Pháp Nhân Cơ Sở Y Tế <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={isVerifiedActive}
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="Ví dụ: Bệnh viện Đa khoa Quốc tế FamiCare"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Số Giấy Phép Hoạt Động (GPHĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={isVerifiedActive}
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                    errors.licenseNumber ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                  placeholder="Ví dụ: 08921/BYT-GPHĐ hoặc 01293/SYT-GPHĐ"
                />
                {errors.licenseNumber && <p className="text-xs text-rose-600 font-medium">{errors.licenseNumber}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Cơ Quan Cấp Phép GPHĐ
                </label>
                <input
                  type="text"
                  disabled={isVerifiedActive}
                  value={licenseIssuer}
                  onChange={(e) => setLicenseIssuer(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="Ví dụ: Bộ Y Tế - Cục Quản lý Khám chữa bệnh"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Ngày Cấp Phép GPHĐ
                </label>
                <input
                  type="date"
                  disabled={isVerifiedActive}
                  value={licenseDate}
                  onChange={(e) => setLicenseDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Mã Số Thuế Doanh Nghiệp (MST) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={isVerifiedActive}
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                    errors.taxCode ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                  placeholder="Ví dụ: 0315892019 (10 hoặc 13 chữ số)"
                />
                {errors.taxCode && <p className="text-xs text-rose-600 font-medium">{errors.taxCode}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Đường Dây Nóng / Hotline Y Tế (24/7) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={isVerifiedActive}
                  value={hotline}
                  onChange={(e) => setHotline(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                    errors.hotline ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                  placeholder="Ví dụ: 1900 8821 hoặc 028 3822 9999"
                />
                {errors.hotline && <p className="text-xs text-rose-600 font-medium">{errors.hotline}</p>}
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Địa Chỉ Trụ Sở Khám Chữa Bệnh Chính Thức (Theo Giấy Phép)
                </label>
                <input
                  type="text"
                  disabled={isVerifiedActive}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                />
              </div>
            </div>
          </div>

          {/* Nhóm 2: Tài khoản Ngân hàng Quyết toán B2B */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-lg">account_balance</span>
                <span>2. Tài Khoản Ngân Hàng Thụ Hưởng Quyết Toán Doanh Thu B2B</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tài khoản chính thức của Bệnh viện / Phòng khám nhận giải ngân chi trả dịch vụ khám bệnh định kỳ
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Tên Ngân Hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={isVerifiedActive}
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                    errors.bankName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                  placeholder="Ví dụ: Vietcombank, BIDV, Techcombank..."
                />
                {errors.bankName && <p className="text-xs text-rose-600 font-medium">{errors.bankName}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Số Tài Khoản Thụ Hưởng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={isVerifiedActive}
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 tracking-wide focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                    errors.bankAccountNumber ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                  placeholder="Ví dụ: 0071000889922"
                />
                {errors.bankAccountNumber && <p className="text-xs text-rose-600 font-medium">{errors.bankAccountNumber}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Tên Chủ Tài Khoản (In hoa không dấu) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={isVerifiedActive}
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value.toUpperCase())}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                    errors.bankAccountHolder ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                  placeholder="Ví dụ: CTCP BENH VIEN QUOC TE FAMICARE"
                />
                {errors.bankAccountHolder && <p className="text-xs text-rose-600 font-medium">{errors.bankAccountHolder}</p>}
              </div>
            </div>
          </div>

          {/* Nhóm 3: Tài liệu đính kèm (File Scan PDF/Ảnh GPHĐ) */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-lg">upload_file</span>
                <span>3. Tệp Đính Kèm Hồ Sơ Pháp Lý (Bản Scan PDF / Ảnh)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bao gồm Giấy phép hoạt động KCB, Giấy chứng nhận ĐKKD và Quyết định phê duyệt người phụ trách chuyên môn
              </p>
            </div>

            {!isVerifiedActive && (
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 text-center bg-slate-50/60 transition-colors">
                <input
                  type="file"
                  id="legalDocInput"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="legalDocInput" className="cursor-pointer space-y-2 block">
                  <span className="material-symbols-outlined text-3xl text-blue-600">cloud_upload</span>
                  <div className="text-xs sm:text-sm font-semibold text-slate-800">
                    Nhấn vào đây để tải lên tệp tài liệu PDF hoặc hình ảnh scan
                  </div>
                  <p className="text-xs text-slate-400">Định dạng hỗ trợ: PDF, PNG, JPG (Dung lượng tối đa 15MB/tệp)</p>
                </label>
              </div>
            )}
            {errors.files && <p className="text-xs text-rose-600 font-medium">{errors.files}</p>}

            {/* Danh sách tệp đã đính kèm */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">Tệp hồ sơ hiện có:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {uploadedFiles.map((fname, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="material-symbols-outlined text-red-500 text-base">picture_as_pdf</span>
                      <span className="font-medium text-slate-800 truncate">{fname}</span>
                    </div>
                    {!isVerifiedActive && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Xóa tệp"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          {!isVerifiedActive && (
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <Link
                href="/facility"
                className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-center"
              >
                Hủy bỏ
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Đang gửi hồ sơ...</span>
                  </>
                ) : (
                  <>
                    <span>Gửi Hồ Sơ Pháp Lý Thẩm Định Cấp 2</span>
                    <span className="material-symbols-outlined text-sm">send</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
