'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { encountersApi, type EncounterItem } from '@/lib/api';
import { reviewsApi } from '@/lib/api/reviews.api';

export interface FamilyVisitConfirmModalProps {
  open: boolean;
  mode: 'ARRIVED' | 'NO_SHOW';
  encounter: EncounterItem | null;
  onClose: () => void;
  onCompleted: (result: { action: 'ARRIVED' | 'NO_SHOW'; reviewed?: boolean }) => void;
}

const NO_SHOW_OPTIONS = [
  'Đã quá giờ hẹn, bác sĩ không đến',
  'Bác sĩ gọi báo bận sát giờ',
  'Lý do khác',
] as const;

const RATING_LABELS: Record<number, string> = {
  1: '1/5 - Chưa hài lòng',
  2: '2/5 - Tạm được',
  3: '3/5 - Bình thường',
  4: '4/5 - Hài lòng',
  5: '5/5 - Rất hài lòng',
};

export function FamilyVisitConfirmModal({
  open,
  mode,
  encounter,
  onClose,
  onCompleted,
}: FamilyVisitConfirmModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [noShowOption, setNoShowOption] = useState<string>(NO_SHOW_OPTIONS[0]);
  const [noShowDetail, setNoShowDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!encounter) return null;

  const handleConfirmArrived = async (withReview: boolean) => {
    setSubmitting(true);
    setError('');
    try {
      await encountersApi.confirmArrival(encounter.id);
      if (withReview && encounter.doctorId) {
        await reviewsApi.submitDoctorReview({
          doctorId: encounter.doctorId,
          rating,
          comment: comment.trim(),
        });
      }
      onCompleted({ action: 'ARRIVED', reviewed: withReview });
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Không thể gửi xác nhận. Vui lòng thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitNoShow = async () => {
    setSubmitting(true);
    setError('');
    const detail = noShowDetail.trim();
    const description = detail ? `${noShowOption} — ${detail}` : noShowOption;
    try {
      await reviewsApi.submitComplaint({
        contractId: encounter.contractId,
        encounterId: encounter.id,
        category: 'DOCTOR_ABSENT',
        description,
      });
      onCompleted({ action: 'NO_SHOW' });
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Không thể gửi báo cáo sự cố. Vui lòng thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !submitting && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {mode === 'ARRIVED' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Xác nhận &amp; Đánh giá ca khám
              </DialogTitle>
              <DialogDescription>
                Bước 1/2: Xác nhận (✓ Xong) • Bước 2/2: Đánh giá buổi khám
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-sm text-emerald-900">
                Hệ thống sẽ ghi nhận bác sĩ CÓ ĐẾN khám. Hồ sơ &amp; đơn thuốc sẽ hiện ngay sau khi
                bác sĩ hoàn tất ghi chép.
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-900">
                  Gia đình thấy buổi khám thế nào?
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      type="button"
                      size="sm"
                      variant={rating >= star ? 'default' : 'outline'}
                      aria-label={`${star} sao`}
                      aria-pressed={rating === star}
                      disabled={submitting}
                      onClick={() => setRating(star)}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  ))}
                  <span className="ml-1 text-sm font-medium text-slate-700">
                    {RATING_LABELS[rating]}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="family-review-comment">Lời nhắn thêm (không bắt buộc)</Label>
                <Textarea
                  id="family-review-comment"
                  rows={3}
                  disabled={submitting}
                  placeholder="Bác sĩ khám kỹ, hướng dẫn uống thuốc dễ hiểu..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => handleConfirmArrived(false)}
                >
                  Để sau, đóng lại
                </Button>
                <Button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleConfirmArrived(true)}
                >
                  Gửi đánh giá
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Báo sự cố: Bác sĩ không đến khám
              </DialogTitle>
              <DialogDescription>
                Thông tin sẽ chuyển ngay tới bộ phận Vận hành để kiểm tra với cả hai bên.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Lưu ý: Ca khám sẽ tạm khóa để Vận hành liên hệ xác minh với cả hai bên và không hiện
                mục đánh giá sao thông thường.
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-slate-900">
                  Chọn tình huống đúng nhất:
                </legend>
                {NO_SHOW_OPTIONS.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 p-2.5 text-sm hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      name="no-show-option"
                      value={option}
                      checked={noShowOption === option}
                      disabled={submitting}
                      onChange={() => setNoShowOption(option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </fieldset>

              <div className="space-y-1.5">
                <Label htmlFor="family-noshow-detail">Ghi thêm chi tiết (nếu có)</Label>
                <Textarea
                  id="family-noshow-detail"
                  rows={3}
                  disabled={submitting}
                  placeholder="Ví dụ: Gia đình đợi đến 15:00 không thấy bác sĩ..."
                  value={noShowDetail}
                  onChange={(e) => setNoShowDetail(e.target.value)}
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button type="button" variant="outline" disabled={submitting} onClick={onClose}>
                  Quay lại
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={submitting}
                  onClick={handleSubmitNoShow}
                >
                  Gửi báo cáo sự cố
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
