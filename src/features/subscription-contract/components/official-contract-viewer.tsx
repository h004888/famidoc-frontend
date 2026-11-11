'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ContractDocumentSheet,
  type FourPartyContract,
} from '@/features/four-party-contract';

export interface OfficialContractViewerProps {
  contract?: FourPartyContract;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
  onBack?: () => void;
}

const DEFAULT_OFFICIAL_CONTRACT: FourPartyContract = {
  id: 'contract-001',
  contractNumber: 'FMD-2026-REGR821',
  status: 'ACTIVE',
  packageId: 'pkg-family-gold',
  packageName: 'Gói Chăm Sóc Sức Khỏe Toàn Diện Gia Đình (12 Tháng)',
  packagePrice: 9600000,
  durationMonths: 12,
  familyId: 'fam-101',
  familyRepresentativeName: 'Nguyễn Văn An',
  familyRepresentativePhone: '0901234567',
  familyRepresentativeEmail: 'nguyenvanan@example.com',
  familyAddress: '123 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP.HCM',
  facilityId: 'fac-01',
  facilityName: 'Bệnh viện Đại học Y Dược TP.HCM',
  facilityAddress: '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM',
  doctorId: 'doc-01',
  doctorName: 'BS. CKII Lê Hoàng Nam',
  doctorTitle: 'Bác sĩ Gia đình Trưởng khoa',
  createdAt: '2026-11-01T09:00:00Z',
  activatedAt: '2026-11-01T10:15:00Z',
  signatures: {
    family: {
      signedBy: 'Nguyễn Văn An',
      signerRole: 'FAMILY',
      signedAt: '2026-11-01T09:15:00Z',
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
    platform: {
      signedBy: 'FamiDoc Platform TSA CA',
      signerRole: 'PLATFORM',
      signedAt: '2026-11-01T09:30:00Z',
      sha256Hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    },
    facility: {
      signedBy: 'Bệnh viện Đại học Y Dược TP.HCM - Đại diện TS.BS Trần Minh',
      signerRole: 'FACILITY',
      signedAt: '2026-11-01T09:45:00Z',
      sha256Hash: 'b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01a',
    },
    doctor: {
      signedBy: 'BS. CKII Lê Hoàng Nam',
      signerRole: 'DOCTOR',
      signedAt: '2026-11-01T10:00:00Z',
      sha256Hash: 'c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01ab2',
    },
  },
};

export function OfficialContractViewer({
  contract = DEFAULT_OFFICIAL_CONTRACT,
  onPrint,
  onDownloadPdf,
  onBack,
}: OfficialContractViewerProps) {
  const router = useRouter();
  const [zoomScale, setZoomScale] = useState(100);

  const verifyUrl = `https://verify.famidoc.vn/contract/${contract.contractNumber}`;
  const familyHash = contract.signatures?.family?.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(prev - 10, 70));
  };

  const handleZoomReset = () => {
    setZoomScale(100);
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownload = () => {
    if (onDownloadPdf) {
      onDownloadPdf();
    } else if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/family/subscription');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 pb-16 font-sans print:bg-white print:p-0">
      {/* Top sticky action toolbar (hidden on print) */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs print:hidden">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Left: Navigation and Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Quay lại"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div className="truncate">
              <h1 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                Bản sao Hợp đồng điện tử chính thức
              </h1>
              <p className="text-[11px] text-slate-500 truncate tabular-nums">
                Mã số: {contract.contractNumber} • Trạng thái: Đang hiệu lực
              </p>
            </div>
          </div>

          {/* Center: Zoom controls */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomScale <= 70}
              aria-label="Thu nhỏ"
              className="px-2 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">zoom_out</span>
              <span>Thu nhỏ</span>
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              aria-label="100%"
              className="px-2.5 py-1 rounded font-semibold text-slate-800 tabular-nums hover:bg-white/80 transition-colors cursor-pointer"
              title="Đặt lại mức thu phóng 100%"
            >
              {zoomScale}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomScale >= 150}
              aria-label="Phóng to"
              className="px-2 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">zoom_in</span>
              <span>Phóng to</span>
            </button>
          </div>

          {/* Right: Print & Download actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span className="hidden sm:inline">In văn bản</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-[#2E37A4] hover:bg-[#232B85] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Tải file PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main container */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6 print:p-0 print:max-w-none">
        {/* Verification banner (hidden on print or condensed) */}
        <div className="bg-white border border-slate-300 rounded-xl p-4 sm:p-5 shadow-2xs print:border-slate-400">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-emerald-700">
                  verified
                </span>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                  Mã chứng thực số & Tra cứu trực tuyến
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
                  Đã chứng thực 4 bên
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Văn bản đã hoàn tất 4 chữ ký số điện tử hợp pháp theo Luật Giao dịch Điện tử Việt Nam.
              </p>
            </div>

            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4 text-xs">
              <span className="text-slate-500 block text-[11px]">Đường dẫn xác thực:</span>
              <a
                href={verifyUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#2E37A4] font-semibold hover:underline break-all tabular-nums text-xs"
              >
                {verifyUrl}
              </a>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <div className="tabular-nums">
              <span className="font-medium text-slate-700">Mã băm SHA-256 gốc: </span>
              <span className="text-slate-600 break-all">{familyHash}</span>
            </div>
            <div className="shrink-0 tabular-nums text-slate-600">
              Thời gian lưu kho: <span className="font-semibold text-slate-900">12 Tháng</span>
            </div>
          </div>
        </div>

        {/* Contract sheet viewport with zoom support */}
        <div className="overflow-x-auto pb-4 print:overflow-visible">
          <div
            className="transition-transform duration-150 origin-top print:transform-none"
            style={{
              transform: `scale(${zoomScale / 100})`,
              transformOrigin: 'top center',
            }}
          >
            <ContractDocumentSheet contract={contract} className="print:shadow-none print:border-none print:p-0 print:max-w-none" />
          </div>
        </div>
      </main>
    </div>
  );
}
