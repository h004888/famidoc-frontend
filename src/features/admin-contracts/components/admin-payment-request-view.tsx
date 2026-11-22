'use client';

import { useCallback, useState, type FormEvent } from 'react';
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
  // Dùng để nhắc trên giao diện. Backend sẽ kiểm tra lại chữ ký hợp lệ.
  const sigs = contract.signatures ?? {};
  const missing: string[] = [];
  if (!sigs.family) missing.push('Gia đình');
  if (!sigs.platform) missing.push('Nền tảng');
  if (!sigs.facility) missing.push('Cơ sở y tế');
  if (!sigs.doctor) missing.push('Bác sĩ');
  return missing;
}

function getMissingAddendumSigners(signedRoles?: string[]): string[] {
  const roles = new Set(signedRoles ?? []);
  const missing: string[] = [];
  if (!roles.has('FAMILY_REP')) missing.push('Gia đình');
  if (!roles.has('ADMIN')) missing.push('Nền tảng');
  if (!roles.has('HEALTHCARE_FACILITY')) missing.push('Cơ sở y tế');
  if (!roles.has('ASSIGNED_DOCTOR')) missing.push('Bác sĩ');
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
  const selectable =
    contracts.data?.filter((contract) =>
      ['PENDING_PAYMENT', 'ACTIVE'].includes(contract.status),
    ) ?? [];
  const normalizedContractId = contractId.trim().toLowerCase();
  const normalizedAddendumId = addendumId.trim().toLowerCase();
  const listedContract = selectable.find((contract) => contract.id === normalizedContractId);
  const useManualContract =
    manualContract ||
    selectable.length === 0 ||
    (contractId !== '' && !listedContract);
  const selected = useManualContract ? lookedUpContract : listedContract;

  // Chỉ cho chọn phụ lục đang chờ thu và chưa có hóa đơn đã thanh toán.
  const pendingAddenda =
    selected?.status === 'ACTIVE'
      ? (selected.addenda ?? []).filter(
          (item) => item.status === 'PENDING_PAYMENT' && !item.hasPaidInvoice,
        )
      : [];
  const selectedAddendum = selected?.addenda?.find(
    (item) => item.id === normalizedAddendumId,
  );
  const useManualAddendum =
    manualAddendum ||
    pendingAddenda.length === 0;
  const checkMainContract = selected?.status === 'PENDING_PAYMENT' && !selected.hasPaidContractInvoice;
  const checkAddendum = selected?.status === 'ACTIVE' && UUID_V4_REGEX.test(normalizedAddendumId);
  const checkContractId = checkMainContract || checkAddendum ? normalizedContractId : '';
  const checkAddendumId = selected?.status === 'ACTIVE' ? normalizedAddendumId : undefined;
  const eligibility = useAdminQuery(useCallback(async () => {
    if (!checkContractId) return null;
    return paymentsApi.getAdminPaymentEligibility(checkContractId, checkAddendumId);
  }, [checkContractId, checkAddendumId]));

  function clearResult() {
    setError('');
    setBlockingReasons([]);
    setIssued(null);
    setRetryIssue(false);
  }

  function handleSelectContract(nextId: string) {
    // Đổi hợp đồng thì bỏ mã thu tiền và phụ lục đã chọn trước đó.
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
      // Có đúng một phụ lục thì chọn sẵn, số tiền vẫn cho admin sửa.
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
      // Lấy chi tiết theo UUID, kể cả hợp đồng chưa xuất hiện trong danh sách.
      const contract = await contractsApi.getMedicalContractById(normalizedContractId);
      setLookedUpContract(contract);
      fillContract(contract);
      eligibility.refresh();
    } catch (cause) {
      // Lỗi kết nối chỉ đổi nhãn nút để người dùng thử lại.
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
    // Bỏ QR và số tiền cũ khi người dùng chuyển sang khoản khác.
    clearResult();
    setAddendumId(nextAddendumId);
    const found = pendingAddenda.find((item) => item.id === nextAddendumId.trim().toLowerCase());
    setAmount(found && found.additionalAmount > 0 ? String(Math.round(found.additionalAmount)) : '');
  }

  const localWarnings: string[] = [];
  if (selected) {
    if (selected.status === 'PENDING_PAYMENT') {
      if (selected.hasPaidContractInvoice) {
        localWarnings.push(
          'Hợp đồng này đã có hóa đơn thanh toán thành công (PAID), backend sẽ không cho cấp thêm mã mới.',
        );
      }
    } else if (selected.status === 'ACTIVE') {
      if (pendingAddenda.length === 0) {
        localWarnings.push(
          'Hợp đồng đang hiệu lực chưa có phụ lục nào ở trạng thái chờ thanh toán. Chỉ tạo được mã thu tiền khi có ID phụ lục chờ thanh toán.',
        );
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
      if (!lookupError && !retryLookup) setError('Vui lòng tra cứu hợp đồng trước khi tạo mã.');
      return;
    }
    if (selected.status !== 'ACTIVE' && selected.status !== 'PENDING_PAYMENT') {
      setError('Hợp đồng hiện không ở trạng thái cho phép tạo mã thu tiền.');
      return;
    }
    const trimmedAddendumId = normalizedAddendumId;
    // Hợp đồng đang dùng rồi thì chỉ thu thêm qua phụ lục.
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
      setError(eligibility.data?.message ?? 'Đang kiểm tra điều kiện tạo mã. Vui lòng thử lại sau khi có kết quả.');
      setBlockingReasons(describeBlockingReasons(eligibility.data?.blockingReasons ?? []));
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
      // Hiện từng lý do để admin biết cần bổ sung chữ ký hay thông tin nào.
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

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">
          Tạo mã thu tiền
        </h2>
        <p className="text-sm text-slate-600">
          Tạo hoặc điều chỉnh mã VietQR để hộ gia đình chuyển khoản thanh toán
          hợp đồng 4 bên đang chờ thanh toán hoặc phụ lục của hợp đồng đang hiệu
          lực.
        </p>
      </header>
      <div
        className={
          issued
            ? 'grid min-w-0 items-start gap-4 xl:grid-cols-2'
            : 'max-w-2xl'
        }
      >
        <Card className="min-w-0 border-slate-200 py-0">
          <CardContent className="min-w-0 p-4 sm:p-5">
            <form noValidate className="min-w-0 space-y-5" onSubmit={issue}>
              <fieldset className="min-w-0 space-y-3">
                <legend className="mb-3 font-semibold text-slate-900">
                  Khoản cần thu
                </legend>
                {useManualContract ? (
                  <Label className="grid min-w-0 gap-2">
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
                      placeholder="Ví dụ: 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                    />
                  </Label>
                ) : (
                  <Label className="grid min-w-0 gap-2">
                    Hợp đồng cần thu
                    <select
                      className="h-9 w-full min-w-0 max-w-full truncate rounded-md border border-input bg-background px-3 font-normal"
                      value={contractId}
                      onChange={(event) =>
                        handleSelectContract(event.target.value)
                      }
                      disabled={busy}
                      required
                    >
                      <option value="">Chọn hợp đồng khách hàng</option>
                      {selectable.map((item) => {
                        const pendingCount = (item.addenda ?? []).filter(
                          (a) =>
                            a.status === 'PENDING_PAYMENT' && !a.hasPaidInvoice,
                        ).length;
                        const statusLabel =
                          item.status === 'ACTIVE'
                            ? pendingCount > 0
                              ? `Đang hiệu lực (${pendingCount} phụ lục chờ thu)`
                              : 'Đang hiệu lực (chỉ thu phụ lục)'
                            : `Chờ thanh toán · ${formatCurrencyVND(item.packagePrice)}`;
                        return (
                          <option key={item.id} value={item.id}>
                            {item.contractNumber} ·{' '}
                            {item.familyRepresentativeName} · {statusLabel}
                          </option>
                        );
                      })}
                    </select>
                  </Label>
                )}

                {(useManualContract || selectable.length > 0) && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      {useManualContract && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void lookupContract()}
                          disabled={busy || lookingUp || !normalizedContractId}
                        >
                          {lookingUp ? 'Đang tra cứu…' : retryLookup ? 'Thử tra cứu lại' : 'Tra cứu hợp đồng'}
                        </Button>
                      )}

                      {selectable.length > 0 && (
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto px-0"
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
                          {useManualContract
                            ? 'Chọn từ danh sách'
                            : 'Nhập ID hợp đồng'}
                        </Button>
                      )}
                    </div>
                    {useManualContract && lookupError && (
                      <p role="alert" className="text-sm text-red-700">
                        {lookupError}
                      </p>
                    )}
                  </div>
                )}

                {selected && (
                  <div className="min-w-0 space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0 break-words font-semibold text-slate-900">
                        {selected.contractNumber} ·{' '}
                        {selected.familyRepresentativeName}
                      </span>
                      <Badge variant="outline">
                        {selected.status === 'ACTIVE'
                          ? 'Đang hiệu lực · Thu phụ lục'
                          : selected.status === 'PENDING_PAYMENT'
                            ? 'Chờ thanh toán · Hợp đồng chính'
                            : 'Chưa thể thu tiền'}
                      </Badge>
                    </div>
                    <div className="grid gap-1 sm:grid-cols-2">
                      <p className="min-w-0 break-words">
                        Gói dịch vụ:{' '}
                        <strong className="text-slate-900">
                          {selected.packageName}
                        </strong>
                      </p>
                      <p className="tabular-nums">
                        Giá gốc hợp đồng:{' '}
                        <strong className="text-slate-900">
                          {formatCurrencyVND(selected.packagePrice)}
                        </strong>
                      </p>
                      <p className="min-w-0 break-words">
                        Bác sĩ phụ trách:{' '}
                        <strong className="text-slate-900">
                          {selected.assignedDoctorName ||
                            selected.doctorName ||
                            'Chưa phân công'}
                        </strong>
                      </p>
                      <p className="tabular-nums">
                        Chữ ký đã ghi nhận:{' '}
                        <strong className="text-slate-900">
                          {4 - getMissingContractSigners(selected).length}/4 bên
                        </strong>
                      </p>
                    </div>
                    {selectedAddendum && (
                      <p className="break-words border-t border-slate-200 pt-2 tabular-nums">
                        Phụ lục đang chọn:{' '}
                        <strong className="text-slate-900">
                          {selectedAddendum.addendumNumber}
                        </strong>{' '}
                        (
                        {ADDENDUM_TYPE_LABELS[selectedAddendum.addendumType] ??
                          selectedAddendum.addendumType}
                        ) · Giá gốc phụ lục:{' '}
                        <strong className="text-slate-900">
                          {formatCurrencyVND(selectedAddendum.additionalAmount)}
                        </strong>
                      </p>
                    )}
                    {localWarnings.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-amber-900">
                        <p className="font-semibold">Lưu ý:</p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-4">
                          {localWarnings.map((warning) => (
                            <li key={warning}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {selected?.status === 'ACTIVE' && (
                  <div className="min-w-0 space-y-2">
                    {!useManualAddendum && selected?.status === 'ACTIVE' ? (
                      <Label className="grid min-w-0 gap-2">
                        Phụ lục cần thu *
                        <select
                          className="h-9 w-full min-w-0 max-w-full truncate rounded-md border border-input bg-background px-3 font-normal"
                          value={addendumId}
                          onChange={(event) =>
                            handleSelectAddendum(event.target.value)
                          }
                          disabled={busy}
                          required
                        >
                          <option value="">
                            Chọn phụ lục chờ thanh toán
                          </option>
                          {pendingAddenda.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.addendumNumber} ·{' '}
                              {ADDENDUM_TYPE_LABELS[item.addendumType] ??
                                item.addendumType}{' '}
                              · {formatCurrencyVND(item.additionalAmount)} (
                              {4 -
                                getMissingAddendumSigners(item.signedRoles)
                                  .length}
                              /4 chữ ký)
                            </option>
                          ))}
                        </select>
                      </Label>
                    ) : (
                      <Label className="grid min-w-0 gap-2">
                        {selected?.status === 'ACTIVE'
                          ? 'ID phụ lục * (bắt buộc với hợp đồng đang hiệu lực)'
                          : 'ID phụ lục (bắt buộc nếu hợp đồng đang hiệu lực)'}
                        <Input
                          required={selected?.status === 'ACTIVE'}
                          disabled={busy}
                          value={addendumId}
                          onChange={(event) => handleSelectAddendum(event.target.value)}
                          placeholder="Định dạng UUID (ví dụ: 3fa85f64-5717-4562-b3fc-2c963f66afa6)"
                        />
                      </Label>
                    )}

                    {selected?.status === 'ACTIVE' &&
                      pendingAddenda.length > 0 && (
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto px-0"
                          disabled={busy}
                          onClick={() => {
                            if (manualAddendum && !pendingAddenda.some((item) => item.id === normalizedAddendumId)) {
                              handleSelectAddendum('');
                            }
                            setManualAddendum(!manualAddendum);
                          }}
                        >
                          {manualAddendum
                            ? 'Chọn phụ lục từ danh sách'
                            : 'Nhập ID phụ lục thủ công'}
                        </Button>
                      )}
                  </div>
                )}
                {checkContractId && (
                  <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm" aria-live="polite">
                    <p className="font-semibold">Điều kiện tạo mã</p>
                    {eligibility.loading && <p>Đang kiểm tra điều kiện tạo mã…</p>}
                    {eligibility.error && !(eligibility.cause instanceof ApiConnectionError) && (
                      <p className="text-red-700">Chưa kiểm tra được điều kiện tạo mã. {eligibility.error}</p>
                    )}
                    {eligibility.data?.eligible && <p className="text-emerald-800">Đủ điều kiện tạo mã cho khoản này.</p>}
                    {eligibility.data && !eligibility.data.eligible && (
                      <>
                        <p className="text-amber-900">{eligibility.data.message}</p>
                        {eligibility.data.blockingReasons.length > 0 && (
                          <ul className="list-disc pl-5 text-amber-900">
                            {describeBlockingReasons(eligibility.data.blockingReasons).map((message) => <li key={message}>{message}</li>)}
                          </ul>
                        )}
                      </>
                    )}
                    {!eligibility.loading && (eligibility.error || eligibility.data?.eligible === false) && (
                      <Button type="button" variant="link" size="sm" onClick={eligibility.refresh} disabled={busy} className="h-auto px-0">Kiểm tra lại</Button>
                    )}
                  </div>
                )}
              </fieldset>

              <fieldset className="min-w-0 space-y-3">
                <legend className="mb-3 font-semibold text-slate-900">
                  Thông tin chuyển khoản
                </legend>
                <Label className="grid gap-2">
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
                  />
                </Label>
                <Label className="grid gap-2">
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
                    placeholder="VD: THANH TOAN HOP DONG GIA DINH"
                  />
                </Label>
                <p className="text-xs text-slate-600">
                  Dùng chữ không dấu (A-Z), số (0-9) và dấu cách (tối đa 85 ký
                  tự). Không nhập sẵn mã hóa đơn FD — hệ thống sẽ tự gắn mã mới
                  để đối soát SePay.
                </p>
                <Label className="grid gap-2">
                  Lý do tạo hoặc đổi mã
                  <Textarea
                    required
                    minLength={5}
                    maxLength={500}
                    disabled={busy}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </Label>
                <p className="text-[11px] text-slate-500 tabular-nums">
                  {reason.trim().length}/500 ký tự (tối thiểu 5 ký tự)
                </p>
              </fieldset>

              {error && (
                <div
                  role="alert"
                  className="space-y-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-destructive"
                >
                  <p className="font-medium">{error}</p>
                  {blockingReasons.length > 0 && (
                    <ul className="list-disc space-y-0.5 pl-4 text-xs text-red-900">
                      {blockingReasons.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="space-y-3 border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-600">
                  Nếu đổi số tiền hoặc nội dung, mã cũ sẽ tự đóng và người dùng
                  cần mở lại trang thanh toán để lấy mã mới.
                </p>
                <Button type="submit" disabled={busy || lookingUp} className="w-full sm:w-auto">
                  {busy ? 'Đang tạo mã…' : retryIssue ? 'Thử tạo mã lại' : 'Tạo mã thu tiền'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {issued && (
          <Card aria-label="Mã thu tiền đã tạo" className="min-w-0 border-slate-200">
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold tabular-nums">
                  {issued.paymentCode}
                </h3>
                <Badge variant="outline">
                  {issued.environment === 'LIVE' ? 'Tiền thật' : 'Dữ liệu thử'}
                </Badge>
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                {formatCurrencyVND(issued.amountVnd)}
              </p>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Tài khoản nhận</dt>
                  <dd className="tabular-nums">
                    {issued.expectedGateway} · {issued.expectedAccountNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    Nội dung chuyển khoản
                  </dt>
                  <dd className="break-words tabular-nums">
                    {issued.transferContent ?? issued.paymentCode}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Có hiệu lực đến</dt>
                  <dd className="tabular-nums">
                    {new Date(issued.expiresAt).toLocaleString('vi-VN', {
                      timeZone: 'Asia/Ho_Chi_Minh',
                    })}
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    void copyMemo(issued.transferContent ?? issued.paymentCode)
                  }
                >
                  Sao chép nội dung
                </Button>
                {issued.qrUrl && (
                  <Button asChild>
                    <a href={issued.qrUrl} target="_blank" rel="noreferrer">
                      Mở mã QR thu tiền
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
