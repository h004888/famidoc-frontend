'use client';

import React, { useEffect, useRef, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  extractErrorMessage,
  filesApi,
  patientsApi,
  type PatientDocumentDto,
  type PatientDocumentType,
} from '@/lib/api';

const DOCUMENT_TYPE_LABELS: Record<PatientDocumentType, string> = {
  LAB_RESULT: 'Kết quả Xét nghiệm',
  IMAGING_XRAY_CT: 'Chẩn đoán hình ảnh (X-Quang / CT / MRI)',
  DISCHARGE_SUMMARY: 'Giấy ra viện / Tóm tắt bệnh án',
};

const ACCEPTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export interface LocalPreviewDocument {
  id: string;
  documentName: string;
  documentType: PatientDocumentType;
  recordedDate: string;
  fileSizeKb: number;
  previewUrl: string;
  isImage: boolean;
}

function isSafeDocumentUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) return !trimmed.startsWith('//');
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function formatDateDisplay(raw?: string | null): string {
  if (!raw) return 'Chưa cập nhật';
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  const dd = String(parsed.getDate()).padStart(2, '0');
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const yyyy = parsed.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function getTodayIsoDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').trim().slice(0, 200);
}

export interface MemberDocumentUploadSectionProps {
  memberId: string;
  memberName: string;
  documents: PatientDocumentDto[];
  onDocumentAdded: (doc: PatientDocumentDto) => void;
}

/**
 * Medical document gallery and dual-mode (local file/image dropzone or URL) uploader.
 */
export function MemberDocumentUploadSection({
  memberId,
  memberName,
  documents,
  onDocumentAdded,
}: MemberDocumentUploadSectionProps) {
  const [localPreviewDocs, setLocalPreviewDocs] = useState<LocalPreviewDocument[]>([]);
  const localPreviewUrlsRef = useRef<string[]>([]);

  const [showDocModal, setShowDocModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<PatientDocumentType>('LAB_RESULT');
  const [docRecordedDate, setDocRecordedDate] = useState<string>(getTodayIsoDate);
  const [docFileUrl, setDocFileUrl] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreviewUrl, setSelectedFilePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);

  useEffect(() => {
    const urlsRef = localPreviewUrlsRef;
    return () => {
      for (const u of urlsRef.current) {
        URL.revokeObjectURL(u);
      }
    };
  }, []);

  const clearSelectedFile = () => {
    if (selectedFilePreviewUrl) {
      URL.revokeObjectURL(selectedFilePreviewUrl);
    }
    setSelectedFile(null);
    setSelectedFilePreviewUrl(null);
  };

  const resetModalState = () => {
    clearSelectedFile();
    setDocName('');
    setDocType('LAB_RESULT');
    setDocRecordedDate(getTodayIsoDate());
    setDocFileUrl('');
    setUploadMode('file');
  };

  const handleOpenDocument = (doc: PatientDocumentDto) => {
    if (!isSafeDocumentUrl(doc.fileUrl)) {
      toast.error('Đường dẫn tài liệu không hợp lệ hoặc không an toàn.');
      return;
    }
    window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenLocalPreview = (preview: LocalPreviewDocument) => {
    window.open(preview.previewUrl, '_blank', 'noopener,noreferrer');
  };

  const handleRemoveLocalPreview = (id: string) => {
    setLocalPreviewDocs((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        localPreviewUrlsRef.current = localPreviewUrlsRef.current.filter(
          (u) => u !== target.previewUrl
        );
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleFileChosen = (file: File | null | undefined) => {
    if (!file) return;
    if (!ACCEPTED_MIME_TYPES.has(file.type)) {
      toast.error('Chỉ hỗ trợ ảnh (JPG, PNG, WebP) hoặc tệp PDF.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('Dung lượng tệp tối đa 10 MB.');
      return;
    }

    clearSelectedFile();
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setSelectedFilePreviewUrl(URL.createObjectURL(file));
    }
    if (!docName.trim()) {
      setDocName(stripExtension(file.name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = docName.trim();
    if (!trimmedName) {
      toast.error('Vui lòng nhập tên tài liệu hoặc ảnh bệnh lý.');
      return;
    }
    if (trimmedName.length > 200) {
      toast.error('Tên tài liệu tối đa 200 ký tự.');
      return;
    }
    if (!docRecordedDate) {
      toast.error('Vui lòng chọn ngày ghi nhận kết quả.');
      return;
    }

    if (uploadMode === 'file') {
      if (!selectedFile) {
        toast.error('Vui lòng chọn tệp PDF hoặc hình ảnh từ máy.');
        return;
      }

      setIsSubmittingDoc(true);
      try {
        const sizeKb = Math.max(1, Math.round(selectedFile.size / 1024));
        const uploadResult = await filesApi.uploadFileWithMeta(
          selectedFile,
          'patient-documents'
        );

        if (!uploadResult.isLocalFallback && uploadResult.url.length <= 255) {
          const savedDoc = await patientsApi.addMemberDocument(memberId, {
            documentName: trimmedName,
            documentType: docType,
            recordedDate: docRecordedDate,
            fileUrl: uploadResult.url,
            fileSizeKb: sizeKb,
          });
          onDocumentAdded(savedDoc);
          setShowDocModal(false);
          resetModalState();
          toast.success(`Đã tải lên và lưu tài liệu "${savedDoc.documentName}".`);
          return;
        }

        // Option A: When backend upload endpoint isn't live yet, keep session preview only (never save blob: URL to DB)
        const previewItem: LocalPreviewDocument = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          documentName: trimmedName,
          documentType: docType,
          recordedDate: docRecordedDate,
          fileSizeKb: sizeKb,
          previewUrl: uploadResult.url,
          isImage: selectedFile.type.startsWith('image/'),
        };
        localPreviewUrlsRef.current.push(uploadResult.url);
        setLocalPreviewDocs((prev) => [previewItem, ...prev]);
        setShowDocModal(false);
        resetModalState();
        toast.success(
          `Đã thêm "${previewItem.documentName}" (Chỉ xem trước cục bộ, chưa đồng bộ máy chủ).`
        );
      } catch (err) {
        toast.error(extractErrorMessage(err, 'Không thể xử lý tệp tải lên.'));
      } finally {
        setIsSubmittingDoc(false);
      }
      return;
    }

    const trimmedUrl = docFileUrl.trim();
    if (!isSafeDocumentUrl(trimmedUrl)) {
      toast.error('Vui lòng nhập đường dẫn tài liệu hợp lệ (https://... hoặc http://...).');
      return;
    }
    if (trimmedUrl.length > 255) {
      toast.error('Đường dẫn tài liệu tối đa 255 ký tự.');
      return;
    }

    setIsSubmittingDoc(true);
    try {
      const savedDoc = await patientsApi.addMemberDocument(memberId, {
        documentName: trimmedName,
        documentType: docType,
        recordedDate: docRecordedDate,
        fileUrl: trimmedUrl,
        fileSizeKb: 0,
      });
      onDocumentAdded(savedDoc);
      setShowDocModal(false);
      resetModalState();
      toast.success(`Đã lưu tài liệu "${savedDoc.documentName}" vào hồ sơ y bạ.`);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể lưu tài liệu y tế. Vui lòng thử lại.'));
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  const totalCount = documents.length + localPreviewDocs.length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-[#2E37A4]">
              folder_shared
            </span>
            <span>Hồ sơ, File &amp; Ảnh bệnh lý ({totalCount})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tải lên ảnh đơn thuốc, phim chụp X-Quang/CT hoặc phiếu xét nghiệm cho {memberName}.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowDocModal(true)}
          className="bg-[#2E37A4] hover:bg-[#222982] text-white"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          <span>Tải lên file / ảnh</span>
        </Button>
      </div>

      {totalCount === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center space-y-2">
          <span className="material-symbols-outlined text-[28px] text-slate-400">
            description
          </span>
          <p className="text-sm font-medium text-slate-700">
            Chưa có tài liệu hay ảnh bệnh lý nào được lưu trữ
          </p>
          <p className="text-xs text-slate-500">
            Nhấn &ldquo;Tải lên file / ảnh&rdquo; để chọn ảnh chụp/PDF từ thiết bị hoặc gắn đường
            dẫn kết quả xét nghiệm cho bác sĩ gia đình tham khảo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {localPreviewDocs.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-[11px] hover:bg-amber-100">
                    Chỉ xem trước cục bộ (chưa đồng bộ máy chủ)
                  </Badge>
                  <span className="text-[11px] text-slate-500 shrink-0">
                    {formatDateDisplay(item.recordedDate)}
                  </span>
                </div>

                {item.isImage && (
                  <div className="overflow-hidden rounded-lg border border-amber-200/70 bg-white h-32">
                    <img
                      src={item.previewUrl}
                      alt={item.documentName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div>
                  <Badge variant="outline" className="text-[10px] bg-white mb-1">
                    {DOCUMENT_TYPE_LABELS[item.documentType] || item.documentType}
                  </Badge>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                    {item.documentName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dung lượng: {item.fileSizeKb} KB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenLocalPreview(item)}
                  className="flex-1"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>Xem trước</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveLocalPreview(item.id)}
                  className="text-slate-600"
                >
                  Gỡ xem trước
                </Button>
              </div>
            </article>
          ))}

          {documents.map((doc, idx) => (
            <article
              key={doc.id || `${doc.documentName}-${idx}`}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-[11px] bg-white">
                    {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                  </Badge>
                  <span className="text-[11px] text-slate-500 shrink-0">
                    {formatDateDisplay(doc.recordedDate)}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                  {doc.documentName}
                </h3>
                {typeof doc.fileSizeKb === 'number' && doc.fileSizeKb > 0 && (
                  <p className="text-xs text-slate-500">Dung lượng: {doc.fileSizeKb} KB</p>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenDocument(doc)}
                className="w-full"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                <span>Xem tài liệu</span>
              </Button>
            </article>
          ))}
        </div>
      )}

      {/* Dual-Mode File/Image or URL Upload Dialog */}
      <Dialog
        open={showDocModal}
        onOpenChange={(open) => {
          setShowDocModal(open);
          if (!open && !isSubmittingDoc) {
            resetModalState();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tải lên file, ảnh hoặc liên kết bệnh lý</DialogTitle>
            <DialogDescription>
              Lưu hồ sơ xét nghiệm, đơn thuốc, hoặc ảnh chụp phim cho {memberName}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                uploadMode === 'file'
                  ? 'bg-white text-[#2E37A4] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chọn file / ảnh từ máy
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('url')}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                uploadMode === 'url'
                  ? 'bg-white text-[#2E37A4] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nhập đường dẫn URL
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {uploadMode === 'file' ? (
              <div className="space-y-2">
                <Label htmlFor="ehr-doc-file">Chọn tệp PDF hoặc ảnh (JPG, PNG, WebP) *</Label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFileChosen(e.dataTransfer.files?.[0]);
                  }}
                  className={`rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
                    isDragging
                      ? 'border-[#2E37A4] bg-indigo-50/50'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <Input
                    id="ehr-doc-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => handleFileChosen(e.target.files?.[0])}
                    className="cursor-pointer bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-2">
                    Kéo thả hoặc chọn ảnh/PDF tối đa 10 MB.
                  </p>
                </div>

                {selectedFile && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-3">
                    {selectedFilePreviewUrl ? (
                      <img
                        src={selectedFilePreviewUrl}
                        alt={selectedFile.name}
                        className="size-14 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="size-14 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[24px]">
                          picture_as_pdf
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {Math.max(1, Math.round(selectedFile.size / 1024))} KB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="ehr-doc-url">Đường dẫn tài liệu (URL) *</Label>
                <Input
                  id="ehr-doc-url"
                  type="url"
                  value={docFileUrl}
                  onChange={(e) => setDocFileUrl(e.target.value)}
                  placeholder="https://example.com/ket-qua-xet-nghiem.pdf"
                  maxLength={255}
                  required={uploadMode === 'url'}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ehr-doc-name">Tên tài liệu *</Label>
              <Input
                id="ehr-doc-name"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="VD: Kết quả xét nghiệm máu tổng quát"
                maxLength={200}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ehr-doc-type">Loại tài liệu *</Label>
                <select
                  id="ehr-doc-type"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as PatientDocumentType)}
                  className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E37A4]"
                >
                  <option value="LAB_RESULT">Kết quả Xét nghiệm</option>
                  <option value="IMAGING_XRAY_CT">Chẩn đoán hình ảnh (X-Quang/CT)</option>
                  <option value="DISCHARGE_SUMMARY">Giấy ra viện / Tóm tắt bệnh án</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ehr-doc-date">Ngày ghi nhận *</Label>
                <Input
                  id="ehr-doc-date"
                  type="date"
                  value={docRecordedDate}
                  onChange={(e) => setDocRecordedDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDocModal(false)}
                disabled={isSubmittingDoc}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingDoc}
                className="bg-[#2E37A4] hover:bg-[#222982] text-white"
              >
                {isSubmittingDoc
                  ? 'Đang xử lý...'
                  : uploadMode === 'file'
                    ? 'Tải lên & Lưu'
                    : 'Lưu tài liệu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
