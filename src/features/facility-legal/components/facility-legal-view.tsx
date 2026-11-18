'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { facilitiesApi, type AdminFacilityItem } from '@/lib/api/facilities.api';
import { extractErrorMessage } from '@/lib/api';
import { getTodayInVietnamYmd, isValidPastOrTodayVietnamDate } from '@/lib/date-vn';
import { useVietQrBanks } from '@/hooks/use-vietqr-banks';
import {
  buildVietQrQuickLinkUrl,
  formatFacilityBankName,
  hasNonAsciiCharacters,
  isValidVietQrAccountNumber,
  normalizeVietQrAccountHolder,
  resolveBankByInput,
  resolveVietQrBankId,
} from '@/lib/vietqr';
import { BankSelectorCombobox, VietQrPreviewCard } from '@/components/shared';

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
  const [bankBin, setBankBin] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const { banks, isLoading: isLoadingBanks } = useVietQrBanks();
  const [licenseIssuer, setLicenseIssuer] = useState('');
  const [licenseDate, setLicenseDate] = useState('');
  const [operatingLicenseFile, setOperatingLicenseFile] = useState<File | null>(null);
  const [businessLicenseFile, setBusinessLicenseFile] = useState<File | null>(null);
  const [hasExistingOperatingDoc, setHasExistingOperatingDoc] = useState(false);
  const [hasExistingBusinessDoc, setHasExistingBusinessDoc] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          setAddress(data.address && data.address !== 'Chưa cập nhật địa chỉ' ? data.address : '');
          setBankName(data.bankName || '');
          setBankBin(data.bankBin || '');
          setBankCode(data.bankCode || '');
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
          setHasExistingOperatingDoc(Boolean(data.hasOperatingLicense ?? data.hasLegalDocument));
          setHasExistingBusinessDoc(Boolean(data.hasBusinessLicense));
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

  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
  const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

  const handleSelectLegalFile = (
    docType: 'operating' | 'business',
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const lower = file.name.toLowerCase();
    if (!ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      toast.error('Chỉ chấp nhận định dạng PDF, PNG hoặc JPG/JPEG.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`Tệp "${file.name}" vượt quá giới hạn tối đa 10MB.`);
      return;
    }

    if (docType === 'operating') {
      setOperatingLicenseFile(file);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.operatingLicenseFile;
        return next;
      });
    } else {
      setBusinessLicenseFile(file);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.businessLicenseFile;
        return next;
      });
    }
    toast.success(`Đã chọn tệp "${file.name}" (${Math.round(file.size / 1024)} KB).`);
  };

  const handleRemoveFile = (docType: 'operating' | 'business') => {
    if (docType === 'operating') {
      setOperatingLicenseFile(null);
      setHasExistingOperatingDoc(false);
    } else {
      setBusinessLicenseFile(null);
      setHasExistingBusinessDoc(false);
    }
  };

  const handlePreviewExistingDoc = async (docType: 'operating' | 'business') => {
    if (!facility?.id) return;
    try {
      const url = await facilitiesApi.fetchLegalDocumentBlobUrl(facility.id, docType);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Không thể tải tài liệu pháp lý hiện có.'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const cleanFacilityName = facilityName.trim();
    if (cleanFacilityName.length > 255) {
      newErrors.facilityName = 'Tên pháp nhân cơ sở y tế tối đa 255 ký tự';
    }
    const cleanLicenseNumber = licenseNumber.trim();
    if (!cleanLicenseNumber) {
      newErrors.licenseNumber = 'Vui lòng nhập số Giấy phép hoạt động (GPHĐ) do Bộ/Sở Y Tế cấp';
    } else if (cleanLicenseNumber.length < 3 || cleanLicenseNumber.length > 50) {
      newErrors.licenseNumber = 'Số giấy phép hoạt động phải từ 3 đến 50 ký tự';
    }
    const cleanLicenseIssuer = licenseIssuer.trim();
    if (!cleanLicenseIssuer) {
      newErrors.licenseIssuer = 'Vui lòng nhập Cơ quan cấp Giấy phép hoạt động';
    } else if (cleanLicenseIssuer.length > 255) {
      newErrors.licenseIssuer = 'Cơ quan cấp giấy phép tối đa 255 ký tự';
    }
    const cleanLicenseDate = licenseDate.trim();
    if (!cleanLicenseDate) {
      newErrors.licenseDate = 'Vui lòng chọn Ngày cấp Giấy phép hoạt động';
    } else if (!isValidPastOrTodayVietnamDate(cleanLicenseDate)) {
      newErrors.licenseDate = 'Ngày cấp giấy phép không hợp lệ hoặc nằm trong tương lai';
    }
    const cleanTax = taxCode.trim();
    if (!cleanTax) {
      newErrors.taxCode = 'Vui lòng nhập Mã số thuế doanh nghiệp';
    } else if (cleanTax.length < 10 || cleanTax.length > 20) {
      newErrors.taxCode = 'Mã số thuế phải từ 10 đến 20 ký tự';
    }
    const cleanHotline = hotline.trim();
    if (!cleanHotline) {
      newErrors.hotline = 'Vui lòng nhập số đường dây nóng cấp cứu / tiếp nhận y tế';
    } else if (cleanHotline.length > 15) {
      newErrors.hotline = 'Hotline tối đa 15 ký tự';
    }
    const cleanAddress = address.trim();
    if (!cleanAddress || cleanAddress.length < 5) {
      newErrors.address = 'Vui lòng nhập đầy đủ Địa chỉ trụ sở theo Giấy phép';
    } else if (cleanAddress.length > 500) {
      newErrors.address = 'Địa chỉ trụ sở tối đa 500 ký tự';
    }
    const cleanBankName = bankName.trim();
    if (!cleanBankName) {
      newErrors.bankName = 'Vui lòng chọn Ngân hàng thụ hưởng từ danh sách VietQR';
    } else if (cleanBankName.length > 100) {
      newErrors.bankName = 'Tên ngân hàng tối đa 100 ký tự';
    }
    const cleanBankAccount = bankAccountNumber.replace(/\s+/g, '').trim();
    if (!cleanBankAccount) {
      newErrors.bankAccountNumber = 'Vui lòng nhập số tài khoản ngân hàng phục vụ quyết toán';
    } else if (!isValidVietQrAccountNumber(cleanBankAccount)) {
      newErrors.bankAccountNumber =
        'Số tài khoản ngân hàng chỉ gồm chữ hoặc số (tối đa 19 ký tự) và không chỉ gồm số 0';
    }
    const cleanHolder = normalizeVietQrAccountHolder(bankAccountHolder);
    if (!cleanHolder) {
      newErrors.bankAccountHolder = 'Vui lòng nhập tên chủ tài khoản (in hoa không dấu)';
    } else if (cleanHolder.length > 100) {
      newErrors.bankAccountHolder = 'Tên chủ tài khoản tối đa 100 ký tự';
    }
    if (!operatingLicenseFile && !hasExistingOperatingDoc) {
      newErrors.operatingLicenseFile =
        'Vui lòng tải lên bản scan (PDF, PNG hoặc JPEG) Giấy phép hoạt động KBCB';
    }
    if (!businessLicenseFile && !hasExistingBusinessDoc) {
      newErrors.businessLicenseFile =
        'Vui lòng tải lên bản scan (PDF, PNG hoặc JPEG) Giấy chứng nhận Đăng ký doanh nghiệp';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const resolvedBank = resolveBankByInput(banks, {
      bankBin,
      bankCode,
      bankName: cleanBankName,
    });
    const resolvedBin = bankBin.trim() || resolvedBank?.bin || '';
    const resolvedCode = bankCode.trim() || resolvedBank?.code || '';

    const submittedData = {
      facilityName: cleanFacilityName,
      licenseNumber: cleanLicenseNumber,
      taxCode: cleanTax,
      hotline: cleanHotline,
      bankName: cleanBankName,
      ...(resolvedBin ? { bankBin: resolvedBin } : {}),
      ...(resolvedCode ? { bankCode: resolvedCode } : {}),
      bankAccountNumber: cleanBankAccount,
      bankAccountHolder: cleanHolder,
      address: cleanAddress,
      licenseIssuer: cleanLicenseIssuer,
      licenseDate: cleanLicenseDate,
      operatingLicenseFile,
      businessLicenseFile,
    };

    try {
      const updatedRes = await facilitiesApi.updateLegalProfile(submittedData);
      const existing = facility;
      const hasNormalizedFacility =
        Boolean(updatedRes) &&
        typeof updatedRes === 'object' &&
        'onboardingStatus' in updatedRes &&
        Boolean(updatedRes.id);

      const updatedFacility: AdminFacilityItem = hasNormalizedFacility
        ? {
            ...existing,
            ...updatedRes,
          }
        : {
            id: existing?.id || updatedRes?.id || 'fac-me',
            facilityName: submittedData.facilityName || existing?.facilityName || 'Cơ sở Y tế Đối tác',
            representativeName: existing?.representativeName || 'Đại diện cơ sở y tế',
            email: existing?.email || '',
            createdAt: existing?.createdAt || new Date().toISOString(),
            phone: submittedData.hotline,
            address: submittedData.address,
            onboardingStatus: 'LEGAL_SUBMITTED',
            status: 'PENDING',
            legalRejectionReason: null,
            hasLegalDocument: true,
            hasOperatingLicense: true,
            hasBusinessLicense: true,
            taxCode: submittedData.taxCode,
            operatingLicense: submittedData.licenseNumber,
            licenseIssuer: submittedData.licenseIssuer,
            licenseDate: submittedData.licenseDate,
            bankName: submittedData.bankName,
            bankBin: submittedData.bankBin,
            bankCode: submittedData.bankCode,
            bankAccount: submittedData.bankAccountNumber,
            bankAccountHolder: submittedData.bankAccountHolder,
          };

      setFacility(updatedFacility);
      setBankAccountNumber(cleanBankAccount);
      setBankAccountHolder(cleanHolder);
      setHasExistingOperatingDoc(Boolean(updatedFacility.hasOperatingLicense ?? true));
      setHasExistingBusinessDoc(Boolean(updatedFacility.hasBusinessLicense ?? true));
      setOperatingLicenseFile(null);
      setBusinessLicenseFile(null);
      toast.success(
        'Nộp hồ sơ pháp lý chuyên sâu thành công! Hồ sơ đã được chuyển tới Quản Trị Viên để thẩm định.'
      );
    } catch (err: any) {
      console.warn('Lỗi nộp hồ sơ pháp lý CSYT:', err);
      toast.error(extractErrorMessage(err, 'Không thể nộp hồ sơ pháp lý lên máy chủ.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVerifiedActive = facility?.onboardingStatus === 'ACTIVE' || facility?.status === 'ACTIVE';
  const isWaitingReview = facility?.onboardingStatus === 'LEGAL_SUBMITTED';
  const isRejected = facility?.onboardingStatus === 'REJECTED';

  const selectedBank = useMemo(
    () =>
      resolveBankByInput(banks, {
        bankBin,
        bankCode,
        bankName,
      }) ?? null,
    [banks, bankBin, bankCode, bankName],
  );

  const previewBankId = useMemo(
    () =>
      resolveVietQrBankId(banks, {
        bankBin: selectedBank?.bin || bankBin,
        bankCode: selectedBank?.code || bankCode,
        bankName,
      }),
    [banks, selectedBank, bankBin, bankCode, bankName],
  );

  const [debouncedQrInput, setDebouncedQrInput] = useState({
    bankId: previewBankId,
    accountNumber: bankAccountNumber,
    accountHolder: bankAccountHolder,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQrInput({
        bankId: previewBankId,
        accountNumber: bankAccountNumber,
        accountHolder: bankAccountHolder,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [previewBankId, bankAccountNumber, bankAccountHolder]);

  const previewQrUrl = useMemo(
    () =>
      buildVietQrQuickLinkUrl({
        bankId: debouncedQrInput.bankId,
        accountNumber: debouncedQrInput.accountNumber,
        accountName: debouncedQrInput.accountHolder,
        template: 'compact2',
      }),
    [debouncedQrInput],
  );

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
        {isWaitingReview && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs sm:text-sm text-indigo-900 flex items-start gap-3 shadow-2xs">
            <span className="material-symbols-outlined text-xl text-indigo-600 shrink-0 mt-0.5">hourglass_top</span>
            <div className="space-y-1">
              <p className="font-bold text-indigo-950">
                Hồ sơ pháp lý đã nộp thành công và đang chờ Quản trị viên đối soát CSDL Quốc gia
              </p>
              <p className="text-indigo-800 text-xs leading-relaxed">
                Hệ thống đang tiến hành hậu kiểm thông tin Giấy phép hoạt động và Người đại diện pháp luật theo Nghị định 96/2023/NĐ-CP. Thời gian thẩm định tiêu chuẩn: 24 - 48 giờ làm việc. Bạn sẽ nhận được thông báo kích hoạt ngay khi hồ sơ được duyệt.
              </p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-900 space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <span className="material-symbols-outlined text-base">warning</span>
              <span>Hồ sơ pháp lý bị từ chối / Yêu cầu bổ sung từ Quản trị viên:</span>
            </div>
            <p className="pl-6 text-rose-900 font-medium">
              {facility?.legalRejectionReason ||
                'Hồ sơ giấy phép hoạt động hoặc mã số thuế chưa khớp với đăng ký kinh doanh. Vui lòng cập nhật lại thông tin chính xác và đính kèm file scan rõ nét để Admin thẩm định lại.'}
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
                  Cơ Quan Cấp Phép GPHĐ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={isVerifiedActive}
                  value={licenseIssuer}
                  onChange={(e) => setLicenseIssuer(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                    errors.licenseIssuer ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                  placeholder="Ví dụ: Bộ Y Tế - Cục Quản lý Khám chữa bệnh"
                />
                {errors.licenseIssuer && <p className="text-xs text-rose-600 font-medium">{errors.licenseIssuer}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Ngày Cấp Phép GPHĐ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  max={getTodayInVietnamYmd()}
                  disabled={isVerifiedActive}
                  value={licenseDate}
                  onChange={(e) => setLicenseDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                    errors.licenseDate ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                {errors.licenseDate && <p className="text-xs text-rose-600 font-medium">{errors.licenseDate}</p>}
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
                  Địa Chỉ Trụ Sở Khám Chữa Bệnh Chính Thức (Theo Giấy Phép) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={isVerifiedActive}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                    errors.address ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                />
                {errors.address && <p className="text-xs text-rose-600 font-medium">{errors.address}</p>}
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
                  Ngân Hàng (Chuẩn VietQR) <span className="text-rose-500">*</span>
                </label>
                <BankSelectorCombobox
                  banks={banks}
                  selectedBank={selectedBank}
                  fallbackBankName={bankName}
                  loading={isLoadingBanks}
                  disabled={isVerifiedActive}
                  hasError={Boolean(errors.bankName)}
                  onSelect={(bank) => {
                    setBankName(formatFacilityBankName(bank));
                    setBankBin(bank.bin);
                    setBankCode(bank.code);
                    setErrors((prev) => {
                      if (!prev.bankName) return prev;
                      const next = { ...prev };
                      delete next.bankName;
                      return next;
                    });
                  }}
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
                  onChange={(e) =>
                    setBankAccountNumber(e.target.value.replace(/\s+/g, '').slice(0, 19))
                  }
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
                  onBlur={() => setBankAccountHolder((prev) => normalizeVietQrAccountHolder(prev))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                    errors.bankAccountHolder ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                  placeholder="Ví dụ: CTCP BENH VIEN QUOC TE FAMICARE"
                />
                {hasNonAsciiCharacters(bankAccountHolder) && (
                  <p className="text-[11px] text-amber-700">
                    Tên chủ tài khoản nên viết IN HOA KHÔNG DẤU để đồng bộ với VietQR (sẽ tự chuẩn hóa khi nộp).
                  </p>
                )}
                {errors.bankAccountHolder && <p className="text-xs text-rose-600 font-medium">{errors.bankAccountHolder}</p>}
              </div>
            </div>

            {selectedBank && (selectedBank.transferSupported === 0 || selectedBank.lookupSupported === 0) && (
              <div
                role="alert"
                className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900"
              >
                Cảnh báo VietQR: Ngân hàng <strong>{selectedBank.shortName}</strong> hiện hạn chế tính năng chuyển khoản nhanh hoặc tra cứu qua VietQR. Vui lòng kiểm tra kỹ số tài khoản thụ hưởng trước khi nộp.
              </div>
            )}

            <VietQrPreviewCard
              qrUrl={previewQrUrl}
              title="Xem trước mã VietQR động (Quick Link SVG)"
              subtitle="Mã QR được tạo tự động theo chuẩn NAPAS / VietQR. Bạn có thể dùng app ngân hàng quét thử để kiểm tra chính xác người nhận trước khi nộp hồ sơ."
              bankLabel={selectedBank ? `${selectedBank.shortName} (${selectedBank.name})` : bankName}
              bankBin={selectedBank?.bin || bankBin || null}
              bankCode={selectedBank?.code || bankCode || null}
              accountNumber={bankAccountNumber}
              accountHolder={bankAccountHolder}
            />
          </div>

          {/* Nhóm 3: Tài liệu đính kèm (2 tệp riêng: GPHĐ KBCB & ĐKKD) */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-lg">upload_file</span>
                <span>3. Tệp Đính Kèm Hồ Sơ Pháp Lý (2 Tài Liệu Bắt Buộc)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tải lên riêng từng bản scan rõ nét (PDF, PNG hoặc JPG/JPEG, dung lượng tối đa 10MB/tệp)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Slot 1: Giấy phép hoạt động KBCB */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      1. Giấy phép hoạt động KBCB (GPHĐ) <span className="text-rose-500">*</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Bản scan GPHĐ do Bộ Y tế hoặc Sở Y tế cấp còn hiệu lực.
                    </p>
                  </div>
                  {(operatingLicenseFile || hasExistingOperatingDoc) && (
                    <span className="shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      Đã đính kèm
                    </span>
                  )}
                </div>

                {!isVerifiedActive && (
                  <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 text-center bg-white transition-colors">
                    <input
                      type="file"
                      id="operatingLicenseInput"
                      data-testid="operating-license-input"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleSelectLegalFile('operating', e)}
                      className="hidden"
                    />
                    <label htmlFor="operatingLicenseInput" className="cursor-pointer space-y-1.5 block">
                      <span className="material-symbols-outlined text-2xl text-blue-600">cloud_upload</span>
                      <div className="text-xs font-semibold text-slate-800">
                        Chọn tệp scan GPHĐ KBCB
                      </div>
                      <p className="text-[11px] text-slate-400">PDF, PNG, JPG · Tối đa 10MB</p>
                    </label>
                  </div>
                )}

                {errors.operatingLicenseFile && (
                  <p className="text-xs text-rose-600 font-medium">{errors.operatingLicenseFile}</p>
                )}

                {(operatingLicenseFile || hasExistingOperatingDoc) && (
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-white border border-slate-200 rounded-xl text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="material-symbols-outlined text-red-500 text-base">picture_as_pdf</span>
                      <span className="font-medium text-slate-800 truncate">
                        {operatingLicenseFile
                          ? operatingLicenseFile.name
                          : 'Giấy phép hoạt động KBCB đã lưu trên hệ thống'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasExistingOperatingDoc && !operatingLicenseFile && facility?.id && (
                        <button
                          type="button"
                          onClick={() => handlePreviewExistingDoc('operating')}
                          className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                        >
                          Xem lại
                        </button>
                      )}
                      {!isVerifiedActive && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFile('operating')}
                          className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors"
                          title="Xóa tệp GPHĐ"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Slot 2: Giấy chứng nhận Đăng ký doanh nghiệp */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      2. Giấy chứng nhận Đăng ký doanh nghiệp (ĐKKD) <span className="text-rose-500">*</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Bản scan Giấy chứng nhận ĐKKD / Mã số thuế khớp pháp nhân ký B2B.
                    </p>
                  </div>
                  {(businessLicenseFile || hasExistingBusinessDoc) && (
                    <span className="shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      Đã đính kèm
                    </span>
                  )}
                </div>

                {!isVerifiedActive && (
                  <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 text-center bg-white transition-colors">
                    <input
                      type="file"
                      id="businessLicenseInput"
                      data-testid="business-license-input"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleSelectLegalFile('business', e)}
                      className="hidden"
                    />
                    <label htmlFor="businessLicenseInput" className="cursor-pointer space-y-1.5 block">
                      <span className="material-symbols-outlined text-2xl text-blue-600">cloud_upload</span>
                      <div className="text-xs font-semibold text-slate-800">
                        Chọn tệp scan Giấy ĐKKD
                      </div>
                      <p className="text-[11px] text-slate-400">PDF, PNG, JPG · Tối đa 10MB</p>
                    </label>
                  </div>
                )}

                {errors.businessLicenseFile && (
                  <p className="text-xs text-rose-600 font-medium">{errors.businessLicenseFile}</p>
                )}

                {(businessLicenseFile || hasExistingBusinessDoc) && (
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-white border border-slate-200 rounded-xl text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="material-symbols-outlined text-red-500 text-base">picture_as_pdf</span>
                      <span className="font-medium text-slate-800 truncate">
                        {businessLicenseFile
                          ? businessLicenseFile.name
                          : 'Giấy chứng nhận ĐKKD đã lưu trên hệ thống'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasExistingBusinessDoc && !businessLicenseFile && facility?.id && (
                        <button
                          type="button"
                          onClick={() => handlePreviewExistingDoc('business')}
                          className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                        >
                          Xem lại
                        </button>
                      )}
                      {!isVerifiedActive && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFile('business')}
                          className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors"
                          title="Xóa tệp ĐKKD"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                )}
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
                    <span>Gửi Hồ Sơ Pháp Lý Thẩm Định</span>
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
