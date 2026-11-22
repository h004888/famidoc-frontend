'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileCode2,
  FileText,
  Home,
  QrCode,
  ShieldCheck,
  Stethoscope,
  User,
  Video,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { NationalPrescriptionSyncResult } from '@/lib/national-prescription';
import type { FamilyPrescription } from '@/lib/api/prescriptions.api';
import { PrescriptionValidityNotice } from './prescription-validity-notice';

interface NationalPrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  syncResult: NationalPrescriptionSyncResult | null;
  prescriptionStatus: FamilyPrescription['status'];
}

export function NationalPrescriptionDialog({
  open,
  onOpenChange,
  syncResult,
  prescriptionStatus,
}: NationalPrescriptionDialogProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'JSON'>('OVERVIEW');

  if (!open || !syncResult) return null;

  const { raw_payload } = syncResult;

  const copyToClipboard = (text: string, msg: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 sm:max-w-2xl sm:rounded-3xl [&>[data-slot=dialog-close]]:top-4 [&>[data-slot=dialog-close]]:right-4 [&>[data-slot=dialog-close]]:rounded-full [&>[data-slot=dialog-close]]:bg-white/15 [&>[data-slot=dialog-close]]:p-1.5 [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:opacity-90 [&>[data-slot=dialog-close]]:hover:bg-white/25">
        {/* Header Gradient Chuẩn Y Tế Quốc Gia */}
        <DialogHeader className="shrink-0 bg-gradient-to-r from-[#09253b] via-[#0b3359] to-[#0037c1] p-4 text-left text-white sm:p-6">
          <div className="flex flex-wrap items-center gap-2 pr-8 text-xs font-semibold text-teal-200">
            <ShieldCheck
              className="size-4 text-emerald-400"
              aria-hidden="true"
            />
            <span>
              HỆ THỐNG THÔNG TIN QUỐC GIA VỀ QUẢN LÝ KÊ ĐƠN THUỐC (BỘ Y TẾ)
            </span>
          </div>
          <DialogTitle className="mt-2 text-lg font-bold leading-snug text-white sm:text-xl">
            Mô Phỏng Đơn Thuốc Điện Tử Chuẩn QĐ 808/QĐ-BYT
          </DialogTitle>
          <DialogDescription className="text-xs text-blue-100/90 leading-relaxed">
            Mô phỏng dữ liệu đơn ngoại trú theo Thông tư 26/2025/TT-BYT. Mã tra
            cứu và JSON chỉ để xem trước, chưa được gửi hoặc xác nhận bởi hệ
            thống quốc gia. Mã CSYT, mã bác sĩ và chữ ký số sẽ được bổ sung sau.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Controls */}
        <div className="shrink-0 border-b border-slate-200 bg-slate-50/80 px-4 py-2 sm:px-6">
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              if (val === 'OVERVIEW' || val === 'JSON') setActiveTab(val);
            }}
            className="w-full"
          >
            <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl bg-slate-200/60 p-1">
              <TabsTrigger
                value="OVERVIEW"
                className="h-auto min-w-0 whitespace-normal rounded-lg px-2 py-1.5 text-center text-xs leading-snug font-semibold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-primary"
              >
                <FileText className="size-3.5 shrink-0" />
                <span>Chi tiết Đơn thuốc</span>
              </TabsTrigger>
              <TabsTrigger
                value="JSON"
                className="h-auto min-w-0 whitespace-normal rounded-lg px-2 py-1.5 text-center text-xs leading-snug font-semibold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-primary"
              >
                <FileCode2 className="size-3.5 shrink-0" />
                <span>JSON Payload Liên thông (QĐ 808)</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Body Container */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          <PrescriptionValidityNotice
            status={prescriptionStatus}
            validUntil={raw_payload.thoi_han_don_thuoc}
            className={
              prescriptionStatus === 'CANCELLED'
                ? 'rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-900'
                : 'rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-950'
            }
          />
          {activeTab === 'OVERVIEW' ? (
            <>
              {/* Thẻ Mã đơn thuốc Quốc gia 14 ký tự */}
              <div
                className={
                  prescriptionStatus === 'CANCELLED'
                    ? 'rounded-2xl border-2 border-rose-300/70 bg-gradient-to-br from-rose-50/70 via-white to-white p-4 space-y-2.5 shadow-2xs'
                    : prescriptionStatus === 'EXPIRED'
                      ? 'rounded-2xl border-2 border-amber-300/70 bg-gradient-to-br from-amber-50/70 via-white to-white p-4 space-y-2.5 shadow-2xs'
                      : 'rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white p-4 space-y-2.5 shadow-2xs'
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={
                      prescriptionStatus === 'CANCELLED'
                        ? 'text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5'
                        : prescriptionStatus === 'EXPIRED'
                          ? 'text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5'
                          : 'text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5'
                    }
                  >
                    {prescriptionStatus === 'CANCELLED' ? (
                      <>
                        <XCircle className="size-4 text-rose-600" />
                        BẢN LƯU ĐƠN THUỐC ĐÃ THU HỒI / THAY THẾ (KHÔNG CÒN HIỆU
                        LỰC)
                      </>
                    ) : prescriptionStatus === 'EXPIRED' ? (
                      <>
                        <AlertTriangle className="size-4 text-amber-600" />
                        BẢN MÔ PHỎNG ĐƠN THUỐC ĐÃ HẾT HẠN LĨNH THUỐC
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        BẢN MÔ PHỎNG CHUẨN CẤU TRÚC ĐƠN THUỐC QUỐC GIA (CHỜ KÝ
                        SỐ &amp; GỬI CỔNG)
                      </>
                    )}
                  </span>
                  <Badge className="bg-teal-700 hover:bg-teal-700 text-white tabular-nums text-[11px] px-2.5 py-0.5 rounded-full">
                    Mô phỏng QĐ 808/QĐ-BYT
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div>
                    <span className="text-xs text-slate-500 block">
                      Mã đơn thuốc định dạng 14 ký tự (mô phỏng):
                    </span>
                    <span className="text-xl sm:text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                      {syncResult.ma_don_thuoc_quoc_gia}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(
                          syncResult.ma_don_thuoc_quoc_gia,
                          'Đã sao chép Mã đơn thuốc quốc gia vào bộ nhớ tạm',
                        )
                      }
                      className="rounded-xl text-xs font-semibold gap-1.5 bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-50 shadow-2xs cursor-pointer"
                    >
                      <Copy className="size-3.5" />
                      <span>Sao chép mã</span>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">
                      Mã tra cứu bí mật:
                    </span>
                    <strong className="text-slate-800 tabular-nums">
                      {syncResult.ma_tra_cuu}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">
                      Hình thức khám:
                    </span>
                    <span className="font-semibold text-slate-800 inline-flex items-center gap-1">
                      {raw_payload.hinh_thuc_kham === '2' ? (
                        <>
                          <Video className="size-3 text-blue-600" />
                          <span>Khám Online (Telehealth)</span>
                        </>
                      ) : (
                        <>
                          <Home className="size-3 text-emerald-600" />
                          <span>Khám Tại Nhà (In-Home)</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-slate-500 block text-[11px]">
                      Trạng thái bản lưu:
                    </span>
                    <strong>
                      {prescriptionStatus === 'CANCELLED'
                        ? 'Đã thu hồi / thay thế'
                        : prescriptionStatus === 'EXPIRED'
                          ? 'Đã hết hạn lĩnh thuốc'
                          : 'Đang trong hạn lĩnh thuốc'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Thông tin Cơ sở Y tế & Bác sĩ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-1">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-primary" />
                    <span>Cơ sở KCB liên thông bảo trợ</span>
                  </div>
                  <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                    {raw_payload.ten_cskcb}
                  </div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    Mã liên thông CSYT (Bộ Y tế):{' '}
                    <strong>{raw_payload.ma_cskcb}</strong>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-1">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Stethoscope className="size-3.5 text-primary" />
                    <span>Bác sĩ phụ trách kê đơn</span>
                  </div>
                  <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                    {raw_payload.bac_si_ke_don.ho_ten}
                  </div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    Chứng chỉ hành nghề:{' '}
                    <strong className="text-primary">
                      {raw_payload.bac_si_ke_don.so_cchn}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Thông tin Bệnh nhân & Chẩn đoán */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-bold text-slate-700">
                  <span className="flex min-w-0 items-center gap-1.5 break-words">
                    <User className="size-3.5 shrink-0 text-primary" />
                    <span>Bệnh nhân: {raw_payload.ho_ten_benh_nhan}</span>
                  </span>
                  <span className="text-slate-500 font-normal">
                    Ngày sinh: {raw_payload.ngay_sinh_benh_nhan} (
                    {raw_payload.gioi_tinh === '1'
                      ? 'Nam'
                      : raw_payload.gioi_tinh === '2'
                        ? 'Nữ'
                        : 'Khác'}
                    )
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
                  {raw_payload.can_nang && (
                    <span>
                      Cân nặng:{' '}
                      <strong className="text-slate-800">
                        {raw_payload.can_nang} kg
                      </strong>
                    </span>
                  )}
                  {raw_payload.ma_the_bhyt && (
                    <span>
                      Mã BHYT:{' '}
                      <strong className="text-slate-800">
                        {raw_payload.ma_the_bhyt}
                      </strong>
                    </span>
                  )}
                  {raw_payload.ma_dinh_danh_cong_dan && (
                    <span>
                      Mã định danh:{' '}
                      <strong className="text-slate-800 tabular-nums">
                        {raw_payload.ma_dinh_danh_cong_dan}
                      </strong>
                    </span>
                  )}
                  {raw_payload.so_giay_to_tuy_than && (
                    <span>
                      CMT/CCCD/Hộ chiếu:{' '}
                      <strong className="text-slate-800">
                        {raw_payload.so_giay_to_tuy_than}
                      </strong>
                    </span>
                  )}
                  {raw_payload.dien_thoai && (
                    <span>
                      Điện thoại:{' '}
                      <strong className="text-slate-800">
                        {raw_payload.dien_thoai}
                      </strong>
                    </span>
                  )}
                  {raw_payload.dia_chi && (
                    <span className="sm:col-span-2">
                      Địa chỉ:{' '}
                      <strong className="text-slate-800">
                        {raw_payload.dia_chi}
                      </strong>
                    </span>
                  )}
                  {raw_payload.ho_ten_nguoi_giam_ho && (
                    <span className="sm:col-span-2">
                      Bố/mẹ hoặc người đưa trẻ đến khám:{' '}
                      <strong className="text-slate-800">
                        {raw_payload.ho_ten_nguoi_giam_ho}
                      </strong>
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-semibold text-slate-800">
                    Chẩn đoán (ICD-10):
                  </span>{' '}
                  <span className="tabular-nums font-bold text-primary">
                    [{raw_payload.chan_doan[0]?.ma_benh}]
                  </span>{' '}
                  {raw_payload.chan_doan[0]?.ten_benh}
                </div>
              </div>

              {/* Danh mục thuốc đã kê */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 space-y-2">
                <div className="text-xs font-bold text-slate-800">
                  Danh mục thuốc liên thông (
                  {raw_payload.thong_tin_don_thuoc.length} loại thuốc):
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {raw_payload.thong_tin_don_thuoc.map((d, idx) => (
                    <div
                      key={idx}
                      className="py-2 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 break-words">
                        <div className="font-bold text-slate-900">
                          {idx + 1}. {d.biet_duoc}{' '}
                          {d.ham_luong ? `(${d.ham_luong})` : ''}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          {d.cach_dung}
                        </div>
                        <div className="text-[10px] text-slate-400 tabular-nums mt-0.5">
                          Mã Bộ Y tế: {d.ma_thuoc} • Đường dùng: {d.duong_dung}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold tabular-nums text-slate-900">
                          {d.so_luong} {d.don_vi_tinh}
                        </span>
                        <div className="text-[11px] text-slate-500">
                          {d.so_ngay_dung} ngày
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {raw_payload.loi_dan && (
                  <div className="mt-2 p-2.5 rounded-xl bg-teal-50 border border-teal-100 text-xs text-teal-950">
                    <strong>Lời dặn của bác sĩ:</strong> {raw_payload.loi_dan}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Tab xem raw JSON Payload theo Quyết định 808/QĐ-BYT */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">
                  JSON mô phỏng để kiểm tra dữ liệu đơn thuốc
                </span>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(raw_payload, null, 2),
                      'Đã sao chép Payload JSON vào bộ nhớ tạm',
                    )
                  }
                  className="rounded-lg text-xs font-semibold gap-1"
                >
                  <Copy className="size-3" />
                  <span>Sao chép JSON</span>
                </Button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs tabular-nums overflow-x-auto max-h-[45vh] leading-relaxed select-all">
                {JSON.stringify(raw_payload, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 flex-row flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl bg-white text-xs font-semibold cursor-pointer"
          >
            Đóng cửa sổ
          </Button>

          {!syncResult.isSimulation && (
            <a
              href={syncResult.qr_code_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary/90"
            >
              <QrCode className="size-3.5" aria-hidden="true" />
              <span>Mở tra cứu trên donthuocquocgia.vn</span>
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
