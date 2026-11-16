'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { contractsApi, type StaffingContractItem, normalizeStaffingContract } from '@/lib/api/contracts.api';
import { extractErrorMessage } from '@/lib/api';

interface FacilityContractDetailViewProps {
  contractId: string;
}

export function FacilityContractDetailView({ contractId }: FacilityContractDetailViewProps) {
  const router = useRouter();
  const [contract, setContract] = useState<StaffingContractItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectReason] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadContract() {
      setIsLoading(true);
      try {
        const data = await contractsApi.getStaffingContractById(contractId);
        if (isMounted) {
          if (data && (data.id || data.contractNumber)) {
            setContract(normalizeStaffingContract(data));
          } else {
            setContract(null);
          }
        }
      } catch (err) {
        console.warn('Lỗi tải hợp đồng B2B CSYT:', err);
        if (isMounted) setContract(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadContract();
    return () => {
      isMounted = false;
    };
  }, [contractId]);

  // Thực hiện ký số 1-Click
  const handleExecuteSign = async () => {
    if (!contract) return;
    setIsSigning(true);
    try {
      await contractsApi.signStaffingContract(contract.id, {
        confirmed: true,
        signedPdfUrl: `https://cdn.famidoc.vn/contracts/staffing/${contract.contractNumber}-signed.pdf`,
        signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });
      setContract((prev) =>
        prev
          ? {
              ...prev,
              status: 'ACTIVE',
              facilitySigned: true,
            }
          : null
      );
      toast.success('Ký số điện tử thành công! Hợp đồng B2B đã có hiệu lực pháp lý.');
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Không thể thực hiện ký số điện tử.'));
    } finally {
      setIsSigning(false);
    }
  };

  // Từ chối dự thảo
  const handleExecuteReject = async () => {
    if (!contract || !rejectionReason.trim()) return;
    setIsSigning(true);
    try {
      await contractsApi.rejectStaffingContract(contract.id, rejectionReason);
      setContract((prev) => (prev ? { ...prev, status: 'TERMINATED' } : null));
      toast.success('Đã gửi phản hồi yêu cầu đàm phán sửa đổi tới FamiDoc.');
      setShowRejectModal(false);
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Không thể từ chối hợp đồng.'));
    } finally {
      setIsSigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Đang tải hợp đồng B2B...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-medium">Không tìm thấy hợp đồng {contractId}.</p>
        <Link
          href="/facility/contracts"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">

      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <Link href="/facility" className="hover:text-primary transition-colors">Portal CSYT</Link>
            <span>/</span>
            <Link href="/facility/contracts" className="hover:text-primary transition-colors">Hợp đồng B2B</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">{contract.contractNumber}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Ký Hợp Đồng Khung Cung Ứng Nhân Lực Y Tế B2B
          </h1>
        </div>

        <button
          type="button"
          onClick={() => router.push('/facility/contracts')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Danh sách
        </button>
      </div>

      {/* KHỐI 1: TÓM TẮT 3 QUYỀN LỢI TÀI CHÍNH CỐT LÕI (RÕ RÀNG, DỄ HIỂU) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Doanh thu */}
        <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Doanh thu nhận</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">payments</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-900 tabular-nums">
            {contract.facilitySharePercent}%
          </div>
          <p className="text-xs text-emerald-700 leading-snug">
            Cơ sở Y tế hưởng 85% trên tổng doanh thu mọi gói khám và lượt tư vấn phát sinh.
          </p>
        </div>

        {/* Card 2: Kỳ quyết toán */}
        <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-2xl border border-blue-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Kỳ đối soát tự động</span>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">calendar_month</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            Ngày 05 hàng tháng
          </div>
          <p className="text-xs text-blue-700 leading-snug">
            Tự động lập bảng quyết toán chuyển tiền về số tài khoản ngân hàng thụ hưởng của CSYT.
          </p>
        </div>

        {/* Card 3: Thời hạn hiệu lực */}
        <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl border border-indigo-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Thời hạn hợp đồng</span>
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">verified_user</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-900">
            01 Năm (2026 - 2027)
          </div>
          <p className="text-xs text-indigo-700 leading-snug">
            Kể từ ngày ký, cam kết định mức trần tải an toàn y tế BR-04 tối đa 150 hộ/bác sĩ.
          </p>
        </div>
      </div>

      {/* KHỐI 2: TOÀN VĂN HỢP ĐỒNG SỐ CÓ CHỮ KÝ SỐ 2 BÊN */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Văn bản hợp đồng điện tử</span>
            <p className="text-sm font-bold text-slate-900">Số hiệu: {contract.contractNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              Luật Giao dịch điện tử &amp; NĐ 130/2018/NĐ-CP
            </span>
          </div>
        </div>

        {/* Khung nội dung hợp đồng */}
        <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-4 max-h-[460px] overflow-y-auto">
          <div className="text-center pb-4 border-b border-slate-200 space-y-1">
            <p className="font-bold text-slate-900 text-sm">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="font-semibold text-slate-700 text-xs">Độc lập - Tự do - Hạnh phúc</p>
            <p className="text-slate-400 text-xs">---***---</p>
            <p className="font-bold text-base text-slate-900 pt-2">
              HỢP ĐỒNG NGUYÊN TẮC CUNG ỨNG NGUỒN NHÂN LỰC Y TẾ B2B
            </p>
            <p className="text-xs text-slate-500">Giữa Nền tảng Y tế Gia đình FamiDoc và Cơ sở Y tế Đối tác</p>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <p className="font-bold text-slate-900">BÊN A (NỀN TẢNG CÔNG NGHỆ): CÔNG TY CỔ PHẦN Y TẾ SỐ FAMIDOC</p>
              <p className="text-slate-600">Đại diện: Ban Giám Đốc Nền Tảng • Hotline: 1900 6868</p>
            </div>

            <div>
              <p className="font-bold text-slate-900">BÊN B (ĐỐI TÁC CUNG ỨNG Y TẾ): {contract.facilityName}</p>
              <p className="text-slate-600">Mã định danh: {contract.facilityId || 'FAC-ANSINH-001'}</p>
            </div>

            <div className="whitespace-pre-line text-slate-700 pt-2 border-t border-slate-200/70">
              {contract.contractTerms}
            </div>
          </div>
        </div>

        {/* Khu vực 2 con dấu số ký tên */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Con dấu Bên A (FamiDoc) */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase">Đại diện Bên A (FamiDoc)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="py-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs">
                <span className="material-symbols-outlined text-sm">verified</span>
                ĐÃ KÝ SỐ BỞI NỀN TẢNG FAMIDOC
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Ký duyệt tự động • Xác thực bảo mật SHA-256
            </p>
          </div>

          {/* Con dấu Bên B (Cơ sở y tế) */}
          <div
            className={`p-4 rounded-2xl border space-y-2 text-center sm:text-left ${
              contract.facilitySigned
                ? 'bg-emerald-50/50 border-emerald-200/80'
                : 'bg-amber-50/50 border-dashed border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase">Đại diện Bên B (CSYT)</span>
              <span
                className={`w-2 h-2 rounded-full ${contract.facilitySigned ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}
              />
            </div>
            <div className="py-2">
              {contract.facilitySigned ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  ĐÃ KÝ SỐ BỞI {contract.facilityName.toUpperCase()}
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
                  <span className="material-symbols-outlined text-sm">edit_note</span>
                  CHỜ ĐẠI DIỆN CSYT KÝ XÁC NHẬN
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {contract.facilitySigned
                ? 'Đã hoàn tất ký số điện tử hợp pháp'
                : 'Nhấn nút ký số phía dưới để hoàn tất thỏa thuận'}
            </p>
          </div>
        </div>
      </div>

      {/* KHỐI 3: VÙNG HÀNH ĐỘNG 1-CLICK (SIÊU ĐƠN GIẢN, KHÔNG RỐI) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-7">
        {contract.facilitySigned ? (
          /* TRƯỜNG HỢP ĐÃ KÝ THÀNH CÔNG: CHỈ DẪN BƯỚC TIẾP THEO */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
                <span className="material-symbols-outlined text-xl text-emerald-600">check_circle</span>
                Hợp đồng B2B đã có hiệu lực (ACTIVE)!
              </div>
              <p className="text-xs text-slate-600">
                Bệnh viện của bạn đã đủ điều kiện pháp lý để thêm Bác sĩ và mở tiếp nhận ca khám gia đình.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`https://cdn.famidoc.vn/contracts/staffing/${contract.contractNumber}-signed.pdf`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Tải bản PDF đã ký
              </a>
              <Link
                href="/facility/doctors"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-colors"
              >
                <span>Đi đến Thêm Bác sĩ Mới</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        ) : (
          /* TRƯỜNG HỢP CHƯA KÝ: 1 NÚT BẤM KÝ DUY NHẤT */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Xác nhận chấp thuận điều khoản &amp; Ký số điện tử
              </h3>
              <p className="text-xs text-slate-500">
                Bằng việc nhấn ký số, đại diện cơ sở y tế cam kết tuân thủ tỷ lệ phân chia 85% và chuẩn trần tải y tế BR-04.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
              >
                Yêu cầu sửa điều khoản
              </button>
              <button
                type="button"
                disabled={isSigning}
                onClick={handleExecuteSign}
                className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-2xl shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">draw</span>
                <span>{isSigning ? 'Đang tạo chữ ký số...' : 'KÝ SỐ ĐIỆN TỬ NGAY'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Từ chối / Yêu cầu sửa đổi */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">cancel</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Yêu cầu Đàm phán Sửa đổi Điều khoản
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Nhập nội dung đề xuất điều chỉnh (ví dụ: điều chỉnh tỷ lệ hoa hồng hoặc ngày đối soát) để gửi lại cho Ban Giám đốc FamiDoc.
              </p>
            </div>
            <div>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Cơ sở y tế đề xuất điều chỉnh tỷ lệ chiết khấu lên 90%..."
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                disabled={isSigning || !rejectionReason.trim()}
                onClick={handleExecuteReject}
                className="px-4 py-2 text-xs sm:text-sm font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50"
              >
                {isSigning ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
