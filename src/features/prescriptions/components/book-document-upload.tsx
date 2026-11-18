import { useState, type FormEvent } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { medicalBooksApi } from '@/lib/api/medical-books.api';
import type { PatientDocumentType } from '@/lib/api/patients.api';
import { prescriptionErrorMessage } from '@/lib/api/prescriptions.api';

export function BookDocumentUpload({
  familyId,
  patientId,
  onUploaded,
  setPending,
}: {
  familyId: string;
  patientId: string;
  onUploaded: () => void;
  setPending: (value: boolean) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const file = fields.get('file');
    const documentName = String(fields.get('documentName') ?? '').trim();
    setSaved(false);
    if (
      !documentName ||
      !(file instanceof File) ||
      file.size === 0 ||
      file.size > 10 * 1024 * 1024
    ) {
      setError(
        'Nhập tên tài liệu và chọn tệp PDF, PNG hoặc JPEG dung lượng tối đa 10 MB.',
      );
      return;
    }
    setError('');
    setSubmitting(true);
    setPending(true);
    try {
      await medicalBooksApi.uploadDocument(familyId, patientId, {
        documentName,
        documentType: fields.get('documentType') as PatientDocumentType,
        recordedDate: String(fields.get('recordedDate')),
        file,
      });
      form.reset();
      setSaved(true);
      onUploaded();
    } catch (failure) {
      setError(
        prescriptionErrorMessage(
          failure,
          'Chưa tải được tài liệu. Vui lòng thử lại.',
        ),
      );
    } finally {
      setSubmitting(false);
      setPending(false);
    }
  }

  return (
    <details className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-teal-950">
        Tải tài liệu cho thành viên này
      </summary>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <fieldset
          disabled={submitting}
          className="grid min-w-0 gap-3 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor="book-document-name">Tên tài liệu</Label>
            <Input
              id="book-document-name"
              name="documentName"
              required
              maxLength={200}
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="book-document-type">Loại tài liệu</Label>
            <select
              id="book-document-type"
              name="documentType"
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="LAB_RESULT">Kết quả xét nghiệm</option>
              <option value="IMAGING_XRAY_CT">Chẩn đoán hình ảnh</option>
              <option value="DISCHARGE_SUMMARY">Giấy ra viện</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="book-document-date">Ngày ghi nhận</Label>
            <Input
              id="book-document-date"
              name="recordedDate"
              type="date"
              required
              className="bg-white"
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="book-document-file">Tệp PDF, PNG hoặc JPEG</Label>
            <Input
              id="book-document-file"
              name="file"
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              required
              className="bg-white"
            />
          </div>
        </fieldset>
        {saved && (
          <p role="status" className="text-sm text-teal-900">
            Đã thêm tài liệu vào sổ khám.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        )}
        <Button
          type="submit"
          disabled={submitting}
          className="bg-teal-700 hover:bg-teal-800"
        >
          <Upload size={16} aria-hidden="true" />{' '}
          {submitting ? 'Đang tải…' : 'Tải lên'}
        </Button>
      </form>
    </details>
  );
}
