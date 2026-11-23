'use client';

import { useCallback, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  QrCode,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAdminQuery } from '@/hooks/use-admin-query';
import { contractsApi, type FourPartyContract } from '@/lib/api/contracts.api';
import { extractErrorMessage } from '@/lib/api/error-handler';
import { paymentsApi, type PaymentRequest } from '@/lib/api/payments.api';
import { ApiConnectionError } from '@/lib/http/errors';
import {
  ADDENDUM_TYPE_LABELS,
  describeBlockingReasons,
  hasEmbeddedPaymentCode,
  readBlockingReasonsFromError,
} from '@/lib/payment-blocking-reasons';
import { formatCurrencyVND } from '@/lib/utils';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TRANSFER_DESCRIPTION_REGEX = /^[A-Z0-9][A-Z0-9 ]*$/;

function getMissingContractSigners(contract: FourPartyContract): string[] {
  const sigs = contract.signatures ?? {};
  const missing: string[] = [];
  if (!sigs.family) missing.push('Gia đình');
  if (!sigs.platform) missing.push('Nền tảng');
  if (!sigs.facility) missing.push('Cơ sở y tế');
  if (!sigs.doctor) missing.push('Bác sĩ');
  return missing;
}

export function AdminPaymentRequestView() {
  const [contractId, setContractId] = useState('');
  const [manualContract, setManualContract] = useState(false);
  const [lookedUpContract, setLookedUpContract] = useState<FourPartyContract | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [retryLookup, setRetryLookup] = useState(false);
  const [addendumId, setAddendumId] = useState('');
  const [manualAddendum, setManualAddendum] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [issued, setIssued] = useState<PaymentRequest | null>(null);
  const [error, setError] = useState('');
  const [blockingReasons, setBlockingReasons] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [retryIssue, setRetryIssue] = useState(false);

  const contracts = useAdminQuery(
    useCallback(() => contractsApi.getMedicalContracts({ all: true }), []),
  );
  // Chỉ giữ các hợp đồng thực sự có khoản chờ thu (chờ thanh toán hoặc đang hiệu lực nhưng có phụ lục chờ thu).
  const selectable =
    contracts.data?.filter((contract) => {
      if (contract.status === 'PENDING_PAYMENT') return true;
      if (contract.status === 'ACTIVE') {
        return (contract.addenda ?? []).some(
          (item) => item.status === 'PENDING_PAYMENT' && !item.hasPaidInvoice,
        );
      }
      return false;
    }) ?? [];
  const pendingMainContracts = selectable.filter(
    (contract) => contract.status === 'PENDING_PAYMENT',
  );
  const activeWithPendingAddenda = selectable.filter(
    (contract) => contract.status === 'ACTIVE',
  );
  const normalizedContractId = contractId.trim().toLowerCase();
  const normalizedAddendumId = addendumId.trim().toLowerCase();
  const listedContract = selectable.find((contract) => contract.id === normalizedContractId);
  const useManualContract =
    manualContract ||
    selectable.length === 0 ||
    (contractId !== '' && !listedContract);
  const selected = useManualContract ? lookedUpContract : listedContract;

  const pendingAddenda =
    selected?.status === 'ACTIVE'
      ? (selected.addenda ?? []).filter(
          (item) => item.status === 'PENDING_PAYMENT' && !item.hasPaidInvoice,
        )
      : [];
  const selectedAddendum = selected?.addenda?.find(
    (item) => item.id === normalizedAddendumId,
  );
  const useManualAddendum = manualAddendum || pendingAddenda.length === 0;
  const checkMainContract =
    selected?.status === 'PENDING_PAYMENT' && !selected.hasPaidContractInvoice;
  const checkAddendum =
    selected?.status === 'ACTIVE' && UUID_V4_REGEX.test(normalizedAddendumId);
  const checkContractId = checkMainContract || checkAddendum ? normalizedContractId : '';
  const checkAddendumId =
    selected?.status === 'ACTIVE' ? normalizedAddendumId : undefined;
  const eligibility = useAdminQuery(
    useCallback(async () => {
      if (!checkContractId) return null;
      return paymentsApi.getAdminPaymentEligibility(checkContractId, checkAddendumId);
    }, [checkContractId, checkAddendumId]),
  );

  function clearResult() {
    setError('');
    setBlockingReasons([]);
    setIssued(null);
    setRetryIssue(false);
  }

  function handleSelectContract(nextId: string) {
    setContractId(nextId);
    setLookedUpContract(null);
    setLookupError('');
    setRetryLookup(false);
    clearResult();
    fillContract(selectable.find((item) => item.id === nextId));
  }

  function fillContract(next?: FourPartyContract) {
    setManualAddendum(false);
    if (next?.status !== 'ACTIVE' && next?.status !== 'PENDING_PAYMENT') {
      setAddendumId('');
      setAmount('');
      return;
    }

    if (next.status === 'PENDING_PAYMENT') {
      setAddendumId('');
      setAmount(next.packagePrice > 0 ? String(Math.round(next.packagePrice)) : '');
      return;
    }

    const nextPendingAddenda = (next.addenda ?? []).filter(
      (item) => item.status === 'PENDING_PAYMENT' && !item.hasPaidInvoice,
    );
    if (nextPendingAddenda.length === 1) {
      const only = nextPendingAddenda[0];
      setAddendumId(only.id);
      setAmount(
        only.additionalAmount > 0 ? String(Math.round(only.additionalAmount)) : '',
      );
    } else {
      setAddendumId('');
      setAmount('');
    }
  }

  async function lookupContract() {
    if (lookingUp || busy) return;
    clearResult();
    setLookupError('');
    setRetryLookup(false);
    if (!UUID_V4_REGEX.test(normalizedContractId)) {
      setLookupError('Vui lòng nhập ID hợp đồng đúng định dạng UUID.');
      return;
    }
    setLookingUp(true);
    setLookedUpContract(null);
    fillContract();
    try {
      const contract = await contractsApi.getMedicalContractById(normalizedContractId);
      setLookedUpContract(contract);
      fillContract(contract);
      eligibility.refresh();
    } catch (cause) {
      if (cause instanceof ApiConnectionError) {
        setRetryLookup(true);
      } else {
        const detail = extractErrorMessage(cause, 'Vui lòng thử lại.');
        setLookupError(`Chưa tra cứu được hợp đồng. ${detail}`);
      }
    } finally {
      setLookingUp(false);
    }
  }

  function handleSelectAddendum(nextAddendumId: string) {
    clearResult();
    setAddendumId(nextAddendumId);
    const found = pendingAddenda.find(
      (item) => item.id === nextAddendumId.trim().toLowerCase(),
    );
    setAmount(
      found && found.additionalAmount > 0
        ? String(Math.round(found.additionalAmount))
        : '',
    );
  }

  const localWarnings: string[] = [];
  if (selected) {
    if (selected.status === 'PENDING_PAYMENT') {
      if (selected.hasPaidContractInvoice) {
        localWarnings.push('Hợp đồng này đã thanh toán (PAID), không thể cấp thêm mã.');
      }
    } else if (selected.status === 'ACTIVE') {
      if (pendingAddenda.length === 0) {
        localWarnings.push('Chưa có phụ lục chờ thanh toán. Nhập ID phụ lục để tiếp tục.');
      }
    } else {
      localWarnings.push('Hợp đồng hiện không ở trạng thái cho phép tạo mã thu tiền.');
    }
  }

  async function issue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || lookingUp) return;
    clearResult();

    const trimmedContractId = normalizedContractId;
    if (!trimmedContractId) {
      setError('Vui lòng chọn hoặc nhập ID hợp đồng cần thu.');
      return;
    }
    if (!UUID_V4_REGEX.test(trimmedContractId)) {
      setError(
        'ID hợp đồng chưa đúng định dạng UUID (ví dụ: 3fa85f64-5717-4562-b3fc-2c963f66afa6).',
      );
      return;
    }

    if (!selected) {
      if (!lookupError && !retryLookup) {
        setError('Vui lòng tra cứu hợp đồng trước khi tạo mã.');
      }
      return;
    }
    if (selected.status !== 'ACTIVE' && selected.status !== 'PENDING_PAYMENT') {
      setError('Hợp đồng hiện không ở trạng thái cho phép tạo mã thu tiền.');
      return;
    }
    const trimmedAddendumId = normalizedAddendumId;
    if (selected?.status === 'ACTIVE' && !trimmedAddendumId) {
      setError(
        'Hợp đồng đang hiệu lực chỉ tạo được mã thu tiền cho phụ lục. Vui lòng chọn hoặc nhập ID phụ lục chờ thanh toán.',
      );
      return;
    }
    if (trimmedAddendumId && !UUID_V4_REGEX.test(trimmedAddendumId)) {
      setError('ID phụ lục chưa đúng định dạng UUID hợp lệ.');
      return;
    }

    if (selected?.status === 'PENDING_PAYMENT' && selected.hasPaidContractInvoice) {
      setError(
        'Hợp đồng này đã được ghi nhận thanh toán, không thể tạo mã thu tiền mới.',
      );
      return;
    }
    if (selectedAddendum?.hasPaidInvoice) {
      setError(
        'Phụ lục hợp đồng này đã được ghi nhận thanh toán, không thể tạo mã thu tiền mới.',
      );
      return;
    }

    if (!amount.trim()) {
      setError('Vui lòng nhập số tiền cần thu (VNĐ).');
      return;
    }
    const parsedAmount = Number(amount);
    if (
      !Number.isInteger(parsedAmount) ||
      parsedAmount < 1 ||
      parsedAmount > 9999999999
    ) {
      setError(
        'Số tiền cần thu phải là số nguyên từ 1 đến 9.999.999.999 VNĐ.',
      );
      return;
    }

    const normalizedDescription = description
      .trim()
      .replace(/\s+/g, ' ')
      .toUpperCase();
    if (!normalizedDescription) {
      setError('Vui lòng nhập nội dung chuyển khoản.');
      return;
    }
    if (normalizedDescription.length > 85) {
      setError('Nội dung chuyển khoản không được vượt quá 85 ký tự.');
      return;
    }
    if (!TRANSFER_DESCRIPTION_REGEX.test(normalizedDescription)) {
      setError(
        'Nội dung chuyển khoản chỉ được dùng chữ cái không dấu (A-Z), số (0-9) và dấu cách.',
      );
      return;
    }
    if (hasEmbeddedPaymentCode(normalizedDescription)) {
      setError(
        'Nội dung không được chứa mã FD của hóa đơn. Hệ thống tự thêm mã mới.',
      );
      return;
    }

    const trimmedReason = reason.trim();
    if (trimmedReason.length < 5 || trimmedReason.length > 500) {
      setError('Lý do tạo hoặc đổi mã phải từ 5 đến 500 ký tự.');
      return;
    }

    if (checkContractId && !eligibility.data?.eligible) {
      if (eligibility.error) return;
      setError(
        eligibility.data?.message ??
          'Đang kiểm tra điều kiện tạo mã. Vui lòng thử lại sau khi có kết quả.',
      );
      setBlockingReasons(
        describeBlockingReasons(eligibility.data?.blockingReasons ?? []),
      );
      return;
    }

    setBusy(true);
    try {
      setIssued(
        await paymentsApi.createAdminPaymentRequest({
          contractId: trimmedContractId,
          addendumId: trimmedAddendumId || undefined,
          amountVnd: parsedAmount,
          transferDescription: normalizedDescription,
          reason: trimmedReason,
        }),
      );
    } catch (cause) {
      if (cause instanceof ApiConnectionError) {
        setRetryIssue(true);
        return;
      }
      setError(extractErrorMessage(cause, 'Không thể cấp mã thu tiền.'));
      setBlockingReasons(
        describeBlockingReasons(readBlockingReasonsFromError(cause)),
      );
      eligibility.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function copyMemo(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Đã sao chép nội dung chuyển khoản.');
    } catch {
      toast.error(
        'Không sao chép được. Hãy chọn và sao chép nội dung hiển thị.',
      );
    }
  }

  const parsedPreviewAmount =
    amount.trim() && Number.isFinite(Number(amount)) && Number(amount) > 0
      ? Number(amount)
      : null;
  const previewDescription = description.trim().replace(/\s+/g, ' ').toUpperCase();

  return (
    <section className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-12">
      {/* Cột trái: Form tối giản, nhìn phát biết nhập ngay */}
      <Card className="min-w-0 overflow-hidden rounded-2xl border-slate-200 py-0 shadow-2xs lg:col-span-7">
        <CardContent className="min-w-0 p-5 sm:p-6">
          <form noValidate className="min-w-0 space-y-5" onSubmit={issue}>
            {/* 1. Chọn hợp đồng / tra cứu UUID */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-slate-900">Tạo mã thu tiền</h2>
                {selectable.length > 0 && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    disabled={busy || lookingUp}
                    onClick={() => {
                      if (useManualContract) {
                        handleSelectContract(listedContract?.id ?? '');
                      } else {
                        setLookedUpContract(listedContract ?? null);
                      }
                      setManualContract(!useManualContract);
                    }}
                  >
                    {useManualContract ? 'Chọn từ danh sách' : 'Nhập ID hợp đồng'}
                  </Button>
                )}
              </div>

              {useManualContract ? (
                <div className="space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <Label className="grid min-w-0 flex-1 gap-1.5 text-xs font-semibold text-slate-700">
                      ID hợp đồng
                      <Input
                        required
                        disabled={busy || lookingUp}
                        value={contractId}
                        onChange={(event) => {
                          setManualContract(true);
                          setContractId(event.target.value);
                          setLookedUpContract(null);
                          setLookupError('');
                          setRetryLookup(false);
                          fillContract();
                          clearResult();
                        }}
                        placeholder="Nhập UUID hợp đồng..."
                        className="h-10 bg-white text-sm font-normal"
                      />
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 shrink-0"
                      onClick={() => void lookupContract()}
                      disabled={busy || lookingUp || !normalizedContractId}
                    >
                      <Search aria-hidden="true" className="mr-1.5 size-4" />
                      {lookingUp
                        ? 'Đang tra cứu…'
                        : retryLookup
                          ? 'Thử tra cứu lại'
                          : 'Tra cứu hợp đồng'}
                    </Button>
                  </div>
                  {lookupError && (
                    <p
                      role="alert"
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                    >
                      {lookupError}
                    </p>
                  )}
                </div>
              ) : (
                <Label className="grid min-w-0 gap-1.5 text-xs font-semibold text-slate-700">
                  Hợp đồng cần thu
                  <select
                    className="h-10 w-full min-w-0 max-w-full truncate rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900"
                    value={contractId}
                    onChange={(event) => handleSelectContract(event.target.value)}
                    disabled={busy}
                    required
                  >
                    <option value="">Chọn hợp đồng cần thu</option>
                    {pendingMainContracts.length > 0 && (
                      <optgroup label="Hợp đồng chờ thanh toán">
                        {pendingMainContracts.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.contractNumber} · {item.familyRepresentativeName}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {activeWithPendingAddenda.length > 0 && (
                      <optgroup label="Phụ lục chờ thu">
                        {activeWithPendingAddenda.map((item) => {
                          const pendingCount = (item.addenda ?? []).filter(
                            (a) =>
                              a.status === 'PENDING_PAYMENT' && !a.hasPaidInvoice,
                          ).length;
                          return (
                            <option key={item.id} value={item.id}>
                              {item.contractNumber} · {item.familyRepresentativeName} (
                              {pendingCount} phụ lục)
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                  </select>
                </Label>
              )}

              {/* Tóm tắt gọn 1 khối khi đã chọn hợp đồng */}
              {selected && (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900">
                      {selected.contractNumber} · {selected.familyRepresentativeName}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        selected.status === 'ACTIVE'
                          ? 'border-blue-200 bg-blue-50 text-blue-800'
                          : selected.status === 'PENDING_PAYMENT'
                            ? 'border-amber-200 bg-amber-50 text-amber-800'
                            : 'border-slate-200 bg-slate-100 text-slate-700'
                      }
                    >
                      {selected.status === 'ACTIVE'
                        ? 'Thu phụ lục'
                        : selected.status === 'PENDING_PAYMENT'
                          ? 'Chờ thanh toán'
                          : 'Không thể thu'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 tabular-nums">
                    <span>{selected.packageName}</span>
                    <span>Giá gốc: {formatCurrencyVND(selected.packagePrice)}</span>
                    <span>
                      BS: {selected.assignedDoctorName || selected.doctorName || 'Chưa phân công'}
                    </span>
                    <span>Chữ ký: {4 - getMissingContractSigners(selected).length}/4</span>
                  </div>
                  {selectedAddendum && (
                    <p className="text-blue-900 tabular-nums">
                      Phụ lục: <strong>{selectedAddendum.addendumNumber}</strong> (
                      {ADDENDUM_TYPE_LABELS[selectedAddendum.addendumType] ??
                        selectedAddendum.addendumType}
                      ) · {formatCurrencyVND(selectedAddendum.additionalAmount)}
                    </p>
                  )}
                  {localWarnings.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                      {localWarnings.map((warning) => (
                        <p key={warning}>{warning}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Phụ lục cho hợp đồng ACTIVE */}
              {selected?.status === 'ACTIVE' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      {!useManualAddendum ? 'Phụ lục cần thu *' : 'ID phụ lục *'}
                    </span>
                    {pendingAddenda.length > 0 && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        disabled={busy}
                        onClick={() => {
                          if (
                            manualAddendum &&
                            !pendingAddenda.some(
                              (item) => item.id === normalizedAddendumId,
                            )
                          ) {
                            handleSelectAddendum('');
                          }
                          setManualAddendum(!manualAddendum);
                        }}
                      >
                        {manualAddendum ? 'Chọn từ danh sách' : 'Nhập ID phụ lục'}
                      </Button>
                    )}
                  </div>

                  {!useManualAddendum ? (
                    <select
                      aria-label="Phụ lục cần thu *"
                      className="h-10 w-full min-w-0 max-w-full truncate rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                      value={addendumId}
                      onChange={(event) => handleSelectAddendum(event.target.value)}
                      disabled={busy}
                      required
                    >
                      <option value="">Chọn phụ lục chờ thanh toán</option>
                      {pendingAddenda.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.addendumNumber} · {formatCurrencyVND(item.additionalAmount)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      aria-label="ID phụ lục * (bắt buộc với hợp đồng đang hiệu lực)"
                      required
                      disabled={busy}
                      value={addendumId}
                      onChange={(event) => handleSelectAddendum(event.target.value)}
                      placeholder="Nhập UUID phụ lục..."
                      className="h-10 bg-white text-sm"
                    />
                  )}
                </div>
              )}

              {/* Trạng thái đủ điều kiện (1 dòng gọn) */}
              {checkContractId && (
                <div
                  className={`rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm ${
                    eligibility.data?.eligible
                      ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                      : eligibility.error
                        ? 'border-red-200 bg-red-50/70 text-red-900'
                        : eligibility.data?.eligible === false
                          ? 'border-amber-200 bg-amber-50/70 text-amber-950'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                  aria-live="polite"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-medium">
                      {eligibility.data?.eligible && (
                        <>
                          <CheckCircle2 aria-hidden="true" className="size-4 text-emerald-700" />
                          <span>Đủ điều kiện tạo mã cho khoản này.</span>
                        </>
                      )}
                      {eligibility.loading && <span>Đang kiểm tra điều kiện…</span>}
                      {eligibility.error &&
                        !(eligibility.cause instanceof ApiConnectionError) && (
                          <span className="text-red-700">
                            Chưa kiểm tra được điều kiện tạo mã. {eligibility.error}
                          </span>
                        )}
                      {eligibility.data && !eligibility.data.eligible && (
                        <>
                          <AlertTriangle aria-hidden="true" className="size-4 text-amber-700" />
                          <span>{eligibility.data.message}</span>
                        </>
                      )}
                    </div>

                    {!eligibility.loading &&
                      (eligibility.error || eligibility.data?.eligible === false) && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={eligibility.refresh}
                          disabled={busy}
                          className="h-auto p-0 text-xs"
                        >
                          Kiểm tra lại
                        </Button>
                      )}
                  </div>

                  {eligibility.data &&
                    !eligibility.data.eligible &&
                    eligibility.data.blockingReasons.length > 0 && (
                      <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs text-amber-900">
                        {describeBlockingReasons(eligibility.data.blockingReasons).map(
                          (message) => (
                            <li key={message}>{message}</li>
                          ),
                        )}
                      </ul>
                    )}
                </div>
              )}
            </div>

            {/* 2. Số tiền & Nội dung chuyển khoản */}
            <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
              <Label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                Số tiền cần thu (VNĐ)
                <Input
                  type="number"
                  required
                  min={1}
                  max={9999999999}
                  step={1}
                  disabled={busy}
                  value={amount}
                  onChange={(event) => {
                    setIssued(null);
                    setRetryIssue(false);
                    setAmount(event.target.value);
                  }}
                  placeholder="1500000"
                  className="h-10 bg-white text-sm font-normal tabular-nums"
                />
              </Label>

              <Label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                Nội dung chuyển khoản
                <Input
                  required
                  maxLength={85}
                  disabled={busy}
                  value={description}
                  onChange={(event) => {
                    setIssued(null);
                    setRetryIssue(false);
                    setDescription(event.target.value);
                  }}
                  placeholder="THANH TOAN HOP DONG"
                  className="h-10 bg-white text-sm font-normal"
                />
              </Label>
            </div>

            {/* 3. Lý do */}
            <Label className="grid gap-1.5 text-xs font-semibold text-slate-700">
              Lý do tạo hoặc đổi mã
              <Textarea
                required
                rows={2}
                minLength={5}
                maxLength={500}
                disabled={busy}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Nhập lý do cấp mới hoặc điều chỉnh mã..."
                className="bg-white text-sm font-normal"
              />
            </Label>

            {error && (
              <div
                role="alert"
                className="space-y-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-destructive"
              >
                <p className="flex items-center gap-1.5 font-semibold">
                  <ShieldAlert aria-hidden="true" className="size-4 shrink-0" />
                  <span>{error}</span>
                </p>
                {blockingReasons.length > 0 && (
                  <ul className="list-disc space-y-0.5 pl-5 text-xs text-red-900">
                    {blockingReasons.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={busy || lookingUp}
                className="h-10 w-full px-6 sm:w-auto"
              >
                <QrCode aria-hidden="true" className="mr-1.5 size-4" />
                {busy
                  ? 'Đang tạo mã…'
                  : retryIssue
                    ? 'Thử tạo mã lại'
                    : 'Tạo mã thu tiền'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Cột phải: Khung QR sạch thoáng — Chưa tạo (ô QR giữ chỗ) -> Đã tạo (ảnh QR thật) */}
      <div className="min-w-0 lg:sticky lg:top-4 lg:col-span-5">
        {issued ? (
          <Card
            aria-label="Mã thu tiền đã tạo"
            className="min-w-0 overflow-hidden rounded-2xl border-primary/30 py-0 shadow-xs"
          >
            <div className="flex items-center justify-between gap-2 border-b border-primary/15 bg-primary/5 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 aria-hidden="true" className="size-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900 tabular-nums">
                  {issued.paymentCode}
                </h3>
              </div>
              <Badge
                variant="outline"
                className={
                  issued.environment === 'LIVE'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }
              >
                {issued.environment === 'LIVE' ? 'Tiền thật' : 'Dữ liệu thử'}
              </Badge>
            </div>

            <CardContent className="space-y-4 p-5">
              {issued.qrUrl && (
                <div className="flex justify-center">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                    <img
                      src={issued.qrUrl}
                      alt={`Mã VietQR ${issued.paymentCode}`}
                      className="size-48 object-contain"
                    />
                  </div>
                </div>
              )}

              <p className="text-center text-2xl font-bold text-primary tabular-nums">
                {formatCurrencyVND(issued.amountVnd)}
              </p>

              <dl className="divide-y divide-slate-100 text-sm">
                <div className="flex items-center justify-between gap-4 py-2">
                  <dt className="shrink-0 text-slate-500">Tài khoản nhận</dt>
                  <dd className="text-right font-semibold text-slate-900 tabular-nums">
                    {issued.expectedGateway} · {issued.expectedAccountNumber}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-2">
                  <dt className="shrink-0 text-slate-500">Nội dung CK</dt>
                  <dd className="break-words text-right font-semibold text-slate-900 tabular-nums">
                    {issued.transferContent ?? issued.paymentCode}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-2">
                  <dt className="shrink-0 text-slate-500">Hiệu lực đến</dt>
                  <dd className="text-right font-medium text-slate-800 tabular-nums">
                    {new Date(issued.expiresAt).toLocaleString('vi-VN', {
                      timeZone: 'Asia/Ho_Chi_Minh',
                    })}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    void copyMemo(issued.transferContent ?? issued.paymentCode)
                  }
                >
                  <Copy aria-hidden="true" className="mr-1.5 size-3.5" />
                  Sao chép nội dung
                </Button>
                {issued.qrUrl && (
                  <Button asChild className="flex-1">
                    <a href={issued.qrUrl} target="_blank" rel="noreferrer">
                      <ExternalLink aria-hidden="true" className="mr-1.5 size-3.5" />
                      Mở mã QR thu tiền
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="min-w-0 overflow-hidden rounded-2xl border-slate-200 py-0 shadow-2xs">
            <CardContent className="space-y-5 p-6">
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 py-8 text-slate-400">
                <QrCode aria-hidden="true" className="size-16 stroke-[1.5]" />
                <span className="mt-2 text-xs font-medium text-slate-500">
                  Mã VietQR
                </span>
              </div>

              <dl className="divide-y divide-slate-100 text-sm">
                <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0">
                  <dt className="shrink-0 text-slate-500">Hợp đồng</dt>
                  <dd className="truncate text-right font-medium text-slate-900 tabular-nums">
                    {selected ? selected.contractNumber : '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="shrink-0 text-slate-500">Số tiền</dt>
                  <dd className="text-right font-bold text-primary tabular-nums">
                    {parsedPreviewAmount ? formatCurrencyVND(parsedPreviewAmount) : '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-2.5 last:pb-0">
                  <dt className="shrink-0 text-slate-500">Nội dung CK</dt>
                  <dd className="truncate text-right font-medium text-slate-800">
                    {previewDescription || '—'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
