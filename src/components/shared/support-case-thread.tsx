'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Info,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Send,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  getSupportCaseStatusLabel,
  isOpenSupportCaseStatus,
  isValidSupportAttachmentFile,
  SUPPORT_CASE_STATUS_STYLES,
  SUPPORT_CASE_TYPE_LABELS,
  supportAttachmentFileName,
  supportCasesApi,
  type SupportCaseDetail,
} from '@/lib/api/support-cases.api';
import { extractErrorMessage } from '@/lib/api/error-handler';
import { cn } from '@/lib/utils';

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? dateTimeFormatter.format(parsed)
    : value;
}

type AdminNextStatus = 'IN_REVIEW' | 'NEED_MORE_INFO' | 'RESOLVED' | 'CLOSED';

export interface SupportCaseThreadProps {
  caseDetail: SupportCaseDetail;
  viewerRole: 'FAMILY_REP' | 'ADMIN';
  onUpdated: (updated: SupportCaseDetail) => void;
  onRefresh?: () => Promise<void> | void;
  refreshing?: boolean;
  hideHeader?: boolean;
}

export function SupportCaseThread({
  caseDetail,
  viewerRole,
  onUpdated,
  onRefresh,
  refreshing = false,
  hideHeader = false,
}: SupportCaseThreadProps) {
  const [replyBody, setReplyBody] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [replyError, setReplyError] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  // Admin status panel state
  const defaultTargetStatus: AdminNextStatus =
    caseDetail.status === 'RESOLVED' ? 'CLOSED' : 'IN_REVIEW';
  const [targetStatus, setTargetStatus] =
    useState<AdminNextStatus>(defaultTargetStatus);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [statusReplyMessage, setStatusReplyMessage] = useState('');
  const [statusError, setStatusError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const isOpen = isOpenSupportCaseStatus(caseDetail.status);
  const isClosed = caseDetail.status === 'CLOSED';
  const isResolved = caseDetail.status === 'RESOLVED';

  const handleOpenAttachment = async (key: string) => {
    if (downloadingKey) return;
    setDownloadingKey(key);
    try {
      const blob = await supportCasesApi.downloadAttachmentBlob(
        caseDetail.id,
        key,
      );
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (cause) {
      toast.error(
        extractErrorMessage(cause, 'Không thể mở tệp đính kèm. Vui lòng thử lại.'),
      );
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendingReply) return;
    setReplyError('');

    const trimmed = replyBody.trim();
    if (trimmed.length < 2 || trimmed.length > 2000) {
      setReplyError('Nội dung trao đổi phải có từ 2 đến 2.000 ký tự.');
      return;
    }

    setSendingReply(true);
    try {
      const uploads = await Promise.all(
        replyFiles.map((file) => supportCasesApi.uploadAttachment(file)),
      );
      const attachmentKeys = uploads.map((upload) => upload.attachmentKey);
      const updated = await supportCasesApi.postMessage(caseDetail.id, {
        body: trimmed,
        ...(attachmentKeys.length ? { attachmentKeys } : {}),
      });
      setReplyBody('');
      setReplyFiles([]);
      onUpdated(updated);
      toast.success('Đã gửi phản hồi trong hồ sơ hỗ trợ.');
    } catch (cause) {
      setReplyError(
        extractErrorMessage(
          cause,
          'Không gửi được phản hồi. Vui lòng thử lại.',
        ),
      );
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updatingStatus) return;
    setStatusError('');

    const trimmedSummary = resolutionSummary.trim();
    const trimmedReply = statusReplyMessage.trim();

    if (targetStatus === 'RESOLVED' && trimmedSummary.length < 10) {
      setStatusError(
        'Vui lòng nhập kết luận xử lý (tối thiểu 10 ký tự) khi chốt kết quả hồ sơ.',
      );
      return;
    }
    if (targetStatus === 'NEED_MORE_INFO' && trimmedReply.length < 2) {
      setStatusError('Vui lòng ghi rõ thông tin gia đình cần bổ sung.');
      return;
    }
    if (trimmedReply && trimmedReply.length < 2) {
      setStatusError('Lời nhắn phản hồi phải từ 2 ký tự trở lên.');
      return;
    }

    setUpdatingStatus(true);
    try {
      const updated = await supportCasesApi.updateStatus(caseDetail.id, {
        status: targetStatus,
        ...(targetStatus === 'RESOLVED'
          ? { resolutionSummary: trimmedSummary }
          : {}),
        ...(trimmedReply ? { replyMessage: trimmedReply } : {}),
      });
      setResolutionSummary('');
      setStatusReplyMessage('');
      if (updated.status === 'RESOLVED') {
        setTargetStatus('CLOSED');
      }
      onUpdated(updated);
      toast.success(
        `Đã cập nhật trạng thái hồ sơ sang "${getSupportCaseStatusLabel(updated.status, updated.caseType)}".`,
      );
    } catch (cause) {
      setStatusError(
        extractErrorMessage(
          cause,
          'Không cập nhật được trạng thái hồ sơ. Vui lòng thử lại.',
        ),
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const fileInputId = `support-reply-file-${caseDetail.id}`;

  return (
    <div className="space-y-4 text-xs sm:text-sm" data-testid="support-case-thread">
      {/* Header hồ sơ */}
      {!hideHeader && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="font-bold text-slate-900 tabular-nums wrap-anywhere">
              {caseDetail.caseCode}
            </span>
            <Badge
              variant="outline"
              className="border-indigo-200 bg-indigo-50 text-indigo-800 text-[11px] font-semibold"
            >
              {SUPPORT_CASE_TYPE_LABELS[caseDetail.caseType]}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'text-[11px] font-semibold',
                SUPPORT_CASE_STATUS_STYLES[caseDetail.status],
              )}
            >
              {getSupportCaseStatusLabel(caseDetail.status, caseDetail.caseType)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 tabular-nums">
            <span>Cập nhật: {formatDateTime(caseDetail.updatedAt)}</span>
            {onRefresh && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={refreshing}
                onClick={() => void onRefresh()}
                className="h-7 px-2 text-[11px]"
              >
                <RefreshCw
                  className={cn('size-3 mr-1', refreshing && 'animate-spin')}
                  aria-hidden="true"
                />
                Làm mới
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Cảnh báo nghiệp vụ theo loại/trạng thái */}
      {viewerRole === 'FAMILY_REP' &&
        caseDetail.caseType === 'PAYMENT_ISSUE' &&
        isOpen && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-amber-700"
              aria-hidden="true"
            />
            <p className="leading-relaxed">
              <strong>Lưu ý quan trọng:</strong> Yêu cầu báo lỗi chuyển khoản đang
              được Admin đối soát với giao dịch SePay. Nếu tài khoản ngân hàng đã bị
              trừ tiền, quý gia đình <strong>không nên chuyển khoản lại</strong>{' '}
              trước khi nhận phản hồi từ Ban quản trị.
            </p>
          </div>
        )}

      {viewerRole === 'FAMILY_REP' &&
        caseDetail.status === 'NEED_MORE_INFO' && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xl border border-orange-300 bg-orange-50 p-3 text-xs text-orange-950"
          >
            <Info
              className="mt-0.5 size-4 shrink-0 text-orange-600"
              aria-hidden="true"
            />
            <p className="leading-relaxed">
              <strong>Ban quản trị cần bổ sung thông tin:</strong> Vui lòng xem
              tin nhắn yêu cầu của Admin. Bạn có thể gửi một lượt kèm tối đa 5 tệp
              biên lai hoặc bằng chứng.
            </p>
          </div>
        )}

      {caseDetail.resolutionSummary && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-emerald-950">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2
                className="size-4 text-emerald-700 shrink-0"
                aria-hidden="true"
              />
              <span>Kết luận xử lý từ Ban quản trị FamiDoc</span>
            </span>
            {caseDetail.resolvedAt && (
              <span className="font-normal text-[11px] text-emerald-800 tabular-nums">
                {formatDateTime(caseDetail.resolvedAt)}
              </span>
            )}
          </div>
          <p className="whitespace-pre-wrap break-words rounded-lg border border-emerald-100 bg-white/90 p-2.5 text-xs sm:text-sm text-slate-800 leading-relaxed">
            {caseDetail.resolutionSummary}
          </p>
        </div>
      )}

      {/* Lịch sử trao đổi theo mốc thời gian */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <MessageSquare className="size-3.5 text-primary" aria-hidden="true" />
          <span>Lịch sử trao đổi trong hồ sơ ({caseDetail.messages.length})</span>
        </div>

        <div className="space-y-2.5">
          {caseDetail.messages.map((msg) => {
            const isAdminMsg = msg.senderRole === 'ADMIN';
            return (
              <div
                key={msg.id}
                className={cn(
                  'rounded-2xl border p-3 sm:p-3.5 space-y-2',
                  isAdminMsg
                    ? 'border-blue-200 bg-blue-50/60'
                    : 'border-slate-200 bg-white',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                    {isAdminMsg && (
                      <ShieldCheck
                        className="size-3.5 text-primary shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span>
                      {isAdminMsg
                        ? `Ban quản trị FamiDoc (${msg.senderName})`
                        : `Gia đình (${msg.senderName})`}
                    </span>
                  </span>
                  <time
                    dateTime={msg.createdAt}
                    className="text-slate-500 tabular-nums"
                  >
                    {formatDateTime(msg.createdAt)}
                  </time>
                </div>

                <p className="whitespace-pre-wrap break-words text-xs sm:text-sm text-slate-800 leading-relaxed">
                  {msg.body}
                </p>

                {msg.attachmentKeys.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {msg.attachmentKeys.map((key) => (
                      <button
                        key={key}
                        type="button"
                        disabled={downloadingKey === key}
                        onClick={() => void handleOpenAttachment(key)}
                        className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-primary/40 hover:bg-blue-50 hover:text-primary cursor-pointer"
                      >
                        <Paperclip
                          className="size-3 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span className="truncate max-w-44">
                          {supportAttachmentFileName(key)}
                        </span>
                        <Download className="size-3 shrink-0" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Khung gửi tin nhắn bổ sung / phản hồi */}
      {isOpen ? (
        viewerRole === 'FAMILY_REP' && !caseDetail.familyCanReply ? (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700"
          >
            <Info className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
            <p className="leading-relaxed">
              Bạn đã hết lượt gửi và đang chờ Ban quản trị FamiDoc
              phản hồi. Khung trả lời sẽ tự mở lại ngay khi Admin trả lời hoặc chuyển
              trạng thái sang <strong>Cần bổ sung thông tin</strong>.
            </p>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={handleSendReply}
            className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5"
          >
            <Label
              htmlFor={`support-reply-${caseDetail.id}`}
              className="text-xs font-semibold text-slate-800"
            >
              {viewerRole === 'ADMIN'
                ? 'Gửi phản hồi tới gia đình trong hồ sơ'
                : caseDetail.status === 'NEED_MORE_INFO'
                  ? 'Bổ sung thông tin / chứng từ theo yêu cầu Admin'
                  : 'Gửi thêm thông tin bổ sung trong hồ sơ'}
            </Label>

            <Textarea
              id={`support-reply-${caseDetail.id}`}
              rows={3}
              maxLength={2000}
              disabled={sendingReply}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder={
                viewerRole === 'ADMIN'
                  ? 'Nhập nội dung trao đổi, yêu cầu cung cấp biên lai hoặc giải thích cho gia đình...'
                  : 'Nhập thêm thông tin làm rõ hoặc mô tả biên lai đính kèm...'
              }
              className="rounded-xl bg-white text-xs sm:text-sm"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <input
                  id={fileInputId}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  disabled={sendingReply}
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.currentTarget.files ?? []);
                    e.currentTarget.value = '';
                    setReplyError('');
                    if (replyFiles.length + files.length > 5) {
                      setReplyError('Chỉ được đính kèm tối đa 5 tệp mỗi lượt.');
                      return;
                    }
                    if (files.some((file) => !isValidSupportAttachmentFile(file))) {
                      setReplyError('Chỉ chấp nhận tệp đính kèm định dạng PDF, PNG hoặc JPEG.');
                      return;
                    }
                    if (files.some((file) => file.size === 0 || file.size > 5 * 1024 * 1024)) {
                      setReplyError('Mỗi tệp phải có dung lượng từ 1 byte đến 5 MB.');
                      return;
                    }
                    setReplyFiles([...replyFiles, ...files]);
                  }}
                />
                <label
                  htmlFor={fileInputId}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Upload className="size-3.5" aria-hidden="true" />
                  <span>Đính kèm ảnh/PDF</span>
                </label>
                {replyFiles.map((file, index) => (
                  <span key={file.name + ':' + index} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800 max-w-48">
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      aria-label={'Xóa tệp ' + file.name}
                      onClick={() => setReplyFiles(replyFiles.filter((_, position) => position !== index))}
                      className="text-blue-700 hover:text-blue-950 cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={sendingReply}
                className="rounded-xl bg-primary text-white hover:bg-primary/90 cursor-pointer"
              >
                <Send className="size-3.5 mr-1.5" aria-hidden="true" />
                {sendingReply
                  ? 'Đang gửi…'
                  : caseDetail.status === 'NEED_MORE_INFO' &&
                      viewerRole === 'FAMILY_REP'
                    ? 'Gửi bổ sung thông tin'
                    : 'Gửi phản hồi'}
              </Button>
            </div>

            {replyError && (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"
              >
                {replyError}
              </p>
            )}
          </form>
        )
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          {isClosed
            ? 'Hồ sơ hỗ trợ đã được đóng và lưu trữ.'
            : 'Hồ sơ hỗ trợ đã có kết quả xử lý cuối cùng.'}
        </div>
      )}

      {/* Bảng điều khiển chuyển trạng thái dành riêng cho Admin */}
      {viewerRole === 'ADMIN' && !isClosed && (
        <form
          noValidate
          onSubmit={handleUpdateStatus}
          className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3.5 sm:p-4"
        >
          <div className="text-xs font-bold text-indigo-950">
            Cập nhật trạng thái xử lý hồ sơ (Admin)
          </div>

          <div className="flex flex-wrap gap-2">
            {(!isResolved
              ? ([
                  {
                    value: 'IN_REVIEW',
                    label:
                      caseDetail.caseType === 'PAYMENT_ISSUE'
                        ? 'Đang đối soát'
                        : 'Đang xem xét lại',
                  },
                  { value: 'NEED_MORE_INFO', label: 'Cần bổ sung thông tin' },
                  { value: 'RESOLVED', label: 'Chốt kết quả' },
                  { value: 'CLOSED', label: 'Đóng hồ sơ' },
                ] as const)
              : ([{ value: 'CLOSED', label: 'Đóng hồ sơ' }] as const)
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setTargetStatus(option.value);
                  setStatusError('');
                }}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                  targetStatus === option.value
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {targetStatus === 'RESOLVED' && (
            <div className="space-y-1.5">
              <Label
                htmlFor={`support-resolution-${caseDetail.id}`}
                className="text-xs font-semibold text-slate-800"
              >
                Kết luận xử lý chính thức <span className="text-rose-600">*</span>
              </Label>
              <Textarea
                id={`support-resolution-${caseDetail.id}`}
                rows={3}
                disabled={updatingStatus}
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
                placeholder="Ghi rõ kết quả đối soát / kết luận xem xét lại (tối thiểu 10 ký tự). Nội dung này sẽ hiển thị nổi bật cho gia đình và lưu cố định."
                className="rounded-xl bg-white text-xs sm:text-sm"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor={`support-status-note-${caseDetail.id}`}
              className="text-xs font-semibold text-slate-800"
            >
              {targetStatus === 'NEED_MORE_INFO'
                ? 'Nội dung cần gia đình bổ sung (bắt buộc)'
                : 'Lời nhắn gửi kèm cho gia đình (tùy chọn)'}
            </Label>
            <Textarea
              id={`support-status-note-${caseDetail.id}`}
              rows={2}
              disabled={updatingStatus}
              aria-required={targetStatus === 'NEED_MORE_INFO'}
              value={statusReplyMessage}
              onChange={(e) => setStatusReplyMessage(e.target.value)}
              placeholder={
                targetStatus === 'NEED_MORE_INFO'
                  ? 'Ví dụ: Vui lòng gửi ảnh chụp màn hình biên lai chuyển khoản có mã tham chiếu ngân hàng...'
                  : 'Lời nhắn bổ sung xuất hiện trong luồng trao đổi...'
              }
              className="rounded-xl bg-white text-xs sm:text-sm"
            />
          </div>

          {statusError && (
            <p
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"
            >
              {statusError}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={updatingStatus}
              className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
            >
              {updatingStatus ? 'Đang lưu…' : 'Cập nhật trạng thái'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
