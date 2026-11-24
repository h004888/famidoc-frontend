'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { contractsApi, type MedicalContractDetailDto } from '@/lib/api/contracts.api';

export interface BookingStatusStepProps {
  contractId?: string;
  pollingIntervalMs?: number;
}

export function BookingStatusStep({
  contractId,
  pollingIntervalMs = 10_000,
}: BookingStatusStepProps) {
  const router = useRouter();
  const [contract, setContract] = useState<MedicalContractDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(contractId));
  const [error, setError] = useState<string | null>(null);

  // AF-4.3 Refund form state
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [refundStatus, setRefundStatus] = useState<{
    refundCode: string;
    amountVnd: number;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    status: string;
  } | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadContract = useCallback(async () => {
    if (!contractId) return;
    try {
      const detail = await contractsApi.getMedicalContractDetail(contractId);
      setContract(detail);
      setError(null);
      if (
        detail.contractStatus === 'APPROVAL_REJECTED' ||
        detail.contractStatus === 'APPROVAL_EXPIRED'
      ) {
        contractsApi
          .getRefundRequest(contractId)
          .then((rf) => setRefundStatus(rf))
          .catch(() => undefined);
      }
    } catch {
      setError('Không thể tải trạng thái hợp đồng. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    void loadContract();
    if (!contractId) return;
    const timer = setInterval(() => void loadContract(), pollingIntervalMs);
    return () => clearInterval(timer);
  }, [contractId, loadContract, pollingIntervalMs]);

  if (!contractId) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-white p-6 text-center space-y-3">
        <h1 className="text-base font-bold text-slate-900">
          Chưa có mã hợp đồng để theo dõi
        </h1>
        <Link
          href="/booking"
          className="inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white"
        >
          Về trang đặt gói
        </Link>
      </section>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        Đang tải tiến trình phê duyệt hợp đồng...
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
        <p className="text-sm font-medium text-rose-800">{error ?? 'Không tìm thấy hợp đồng'}</p>
        <button
          type="button"
          onClick={() => void loadContract()}
          className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-rose-800 border border-rose-300"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const status = contract.contractStatus;
  const isActivated = status === 'ACTIVE';
  const isException = status === 'APPROVAL_REJECTED' || status === 'APPROVAL_EXPIRED';
  const isPlatformRetry = Boolean(
    (contract as unknown as { platformSignRetryPending?: boolean }).platformSignRetryPending
  );

  // 4B: Kích hoạt thành công
  if (isActivated) {
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 space-y-3">
          <h1 className="text-lg font-bold text-emerald-950">
            Gói chăm sóc {contract.servicePackage?.packageName} đã chính thức có hiệu lực
          </h1>
          <p className="text-sm text-emerald-900">
            Hợp đồng #{contract.contractNumber} đã hoàn tất chữ ký điện tử 4 bên.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <Link
              href="/family/members"
              className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800"
            >
              Kê khai hồ sơ thành viên ngay (1/{contract.memberCount ?? 1} suất)
            </Link>
            <Link
              href="/family"
              className="rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
            >
              Vào Bảng điều khiển Gia đình
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // 4C: Ngoại lệ Từ chối / Quá hạn 24h
  if (isException) {
    const handleRefundSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmittingAction(true);
      setActionError(null);
      try {
        const res = await contractsApi.createRefundRequest(contract.id, {
          bankName,
          accountNumber,
          accountHolder,
        });
        setRefundStatus(res);
        setShowRefundForm(false);
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : 'Không thể gửi yêu cầu hoàn tiền.'
        );
      } finally {
        setIsSubmittingAction(false);
      }
    };

    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 space-y-2">
          <h1 className="text-base font-bold text-amber-950">
            Hồ sơ chưa thể kích hoạt với bác sĩ đã chọn
          </h1>
          <p className="text-xs text-amber-900">
            Mã HĐ: #{contract.contractNumber} •{' '}
            {status === 'APPROVAL_EXPIRED'
              ? 'Hồ sơ đã quá thời hạn phản hồi 24 giờ từ Cơ sở y tế / Bác sĩ.'
              : (contract as unknown as { rejectionReason?: string }).rejectionReason ||
                'Bác sĩ hoặc Cơ sở y tế chưa thể tiếp nhận hồ sơ lúc này.'}
          </p>
          <p className="text-xs font-semibold text-amber-950">
            Số tiền {Number(contract.totalAmount ?? 0).toLocaleString('vi-VN')}đ của bạn đang được bảo toàn 100%.
          </p>
        </div>

        {refundStatus ? (
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 space-y-2">
            <h2 className="text-sm font-bold text-emerald-900">
              Đã tiếp nhận yêu cầu hoàn tiền #{refundStatus.refundCode}
            </h2>
            <p className="text-xs text-slate-600">
              Số tiền: {Number(refundStatus.amountVnd).toLocaleString('vi-VN')}đ • Về TK:{' '}
              {refundStatus.bankName} — {refundStatus.accountNumber} ({refundStatus.accountHolder})
            </p>
            <p className="text-xs text-slate-500">
              Trạng thái: {refundStatus.status} (Dự kiến hoàn tất trong 1–3 ngày làm việc).
            </p>
          </div>
        ) : showRefundForm ? (
          <form
            onSubmit={handleRefundSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3"
          >
            <h2 className="text-sm font-bold text-slate-900">
              Yêu cầu hoàn tiền 100% — Hợp đồng #{contract.contractNumber}
            </h2>
            {actionError && <p className="text-xs text-rose-700">{actionError}</p>}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                required
                placeholder="Ngân hàng thụ hưởng (VD: Vietcombank)"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
              <input
                required
                placeholder="Số tài khoản"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
              <input
                required
                placeholder="Tên chủ tài khoản (Không dấu)"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowRefundForm(false)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={isSubmittingAction}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {isSubmittingAction ? 'Đang gửi...' : 'Xác nhận gửi hoàn tiền'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-primary/30 bg-white p-5 space-y-3">
              <p className="text-xs font-bold uppercase text-primary">
                Phương án 1 (Khuyên dùng)
              </p>
              <h2 className="text-sm font-bold text-slate-900">
                Chọn bác sĩ thay thế cùng chuyên khoa
              </h2>
              <p className="text-xs text-slate-600">
                Giữ nguyên gói &amp; tự động chuyển khoản tiền tạm giữ sang hợp đồng mới (không đóng thêm).
              </p>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/doctors?packageId=${encodeURIComponent(
                      contract.servicePackage?.id ?? ''
                    )}&replaceContractId=${encodeURIComponent(contract.id)}`
                  )
                }
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary/90"
              >
                Chọn bác sĩ thay thế ngay
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <p className="text-xs font-bold uppercase text-slate-500">Phương án 2</p>
              <h2 className="text-sm font-bold text-slate-900">Yêu cầu hoàn tiền 100%</h2>
              <p className="text-xs text-slate-600">
                Hoàn đủ {Number(contract.totalAmount ?? 0).toLocaleString('vi-VN')}đ về tài khoản ngân hàng chỉ định trong 1–3 ngày làm việc.
              </p>
              <button
                type="button"
                onClick={() => setShowRefundForm(true)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Gửi yêu cầu hoàn tiền
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

  // 4A: Chờ phê duyệt 4 bên (SLA 24h) + EF-4.3 Retry Bên D
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 space-y-1.5">
        <h1 className="text-base font-bold text-blue-950">
          {isPlatformRetry
            ? 'Đang hoàn tất chữ ký xác nhận cuối cùng từ nền tảng FamiDoc'
            : 'Thanh toán thành công — Hồ sơ đang chờ phê duyệt'}
        </h1>
        <p className="text-xs text-blue-900">
          Mã HĐ: #{contract.contractNumber} • Đã tạm giữ:{' '}
          {Number(contract.totalAmount ?? 0).toLocaleString('vi-VN')}đ • Phản hồi tối đa trong 24 giờ
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Tiến trình hợp đồng 4 bên</h2>
          <button
            type="button"
            onClick={() => void loadContract()}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Làm mới
          </button>
        </div>
        <ul className="space-y-2 text-xs text-slate-700">
          <li>✓ Bên A — Đại diện hộ gia đình: Đã ký</li>
          <li>✓ Thanh toán VietQR (Tạm giữ phí kích hoạt): Đã nhận</li>
          <li>• Bên B — {contract.facility?.facilityName ?? 'Cơ sở y tế'}: Đang chờ thẩm định &amp; ký</li>
          <li>• Bên C — {contract.doctor?.doctorName ?? 'Bác sĩ phụ trách'}: Đang chờ tiếp nhận &amp; ký</li>
          <li>
            {isPlatformRetry
              ? '! Bên D — FamiDoc: Đang thử ký lại tự động...'
              : '• Bên D — FamiDoc: Tự động ký sau Bên B & C'}
          </li>
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
        <p className="text-xs font-bold text-slate-900">Bạn có thể rời khỏi trang này</p>
        <p className="text-xs text-slate-600">
          Hệ thống sẽ gửi thông báo qua Email &amp; SMS ngay khi gói được kích hoạt. Hỗ trợ: hotro@famidoc.vn
        </p>
        <Link
          href="/family"
          className="inline-flex rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Về trang quản lý hộ gia đình
        </Link>
      </div>
    </section>
  );
}
