'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  patientsApi,
  type PatientDocumentDto,
  type PatientDocumentType,
} from '@/lib/api';

const DOCUMENT_TYPE_META: Record<
  PatientDocumentType,
  { label: string; badgeClass: string; icon: string }
> = {
  PRESCRIPTION: {
    label: 'Đơn thuốc',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: 'medication',
  },
  LAB_RESULT: {
    label: 'Xét nghiệm',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: 'biotech',
  },
  IMAGING_XRAY_CT: {
    label: 'Chẩn đoán hình ảnh',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    icon: 'radiology',
  },
  DISCHARGE_SUMMARY: {
    label: 'Giấy ra viện',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: 'description',
  },
  OTHER: {
    label: 'Khác',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: 'folder_open',
  },
};

const DOCUMENT_TYPE_ORDER: PatientDocumentType[] = [
  'PRESCRIPTION',
  'LAB_RESULT',
  'IMAGING_XRAY_CT',
  'DISCHARGE_SUMMARY',
  'OTHER',
];

const ACCEPTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);
const ACCEPTED_EXTENSIONS_REGEX = /\.(jpe?g|png|pdf)$/i;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function isSafeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isImageDocument(doc: PatientDocumentDto): boolean {
  if (doc.mimeType?.startsWith('image/')) return true;
  return /\.(png|jpe?g|webp)(\?|$)/i.test(doc.fileUrl);
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

function formatFileSize(kb?: number): string {
  if (!kb || kb <= 0) return 'Tệp y tế';
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

export interface MemberDocumentUploadSectionProps {
  memberId: string;
  memberName: string;
  documents: PatientDocumentDto[];
  onDocumentAdded: (doc: PatientDocumentDto) => void;
  onDocumentDeleted?: (documentId: string) => void;
}

/**
 * Medical documents & prescriptions gallery with real S3 upload, category filters, lightbox, and delete.
 */
export function MemberDocumentUploadSection({
  memberId,
  memberName,
  documents,
  onDocumentAdded,
  onDocumentDeleted,
}: MemberDocumentUploadSectionProps) {
  const createdBlobUrlsRef = useRef<string[]>([]);

  const [activeCategory, setActiveCategory] = useState<'ALL' | PatientDocumentType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<PatientDocumentType>('PRESCRIPTION');
  const [docDate, setDocDate] = useState(getTodayIsoDate());
  const [docNotes, setDocNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lightboxDoc, setLightboxDoc] = useState<{
    doc: PatientDocumentDto;
    imageUrl: string;
  } | null>(null);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);

  const [deletingDoc, setDeletingDoc] = useState<PatientDocumentDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const urls = createdBlobUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const countsByType = useMemo(() => {
    const counts: Record<PatientDocumentType, number> = {
      PRESCRIPTION: 0,
      LAB_RESULT: 0,
      IMAGING_XRAY_CT: 0,
      DISCHARGE_SUMMARY: 0,
      OTHER: 0,
    };
    for (const doc of documents) {
      if (doc.documentType in counts) {
        counts[doc.documentType] += 1;
      } else {
        counts.OTHER += 1;
      }
    }
    return counts;
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return documents.filter((doc) => {
      if (activeCategory !== 'ALL' && doc.documentType !== activeCategory) {
        return false;
      }
      if (!normalizedQuery) return true;
      const inName = doc.documentName.toLowerCase().includes(normalizedQuery);
      const inNotes = (doc.notes || '').toLowerCase().includes(normalizedQuery);
      return inName || inNotes;
    });
  }, [documents, activeCategory, searchQuery]);

  const resetModal = () => {
    setSelectedFile(null);
    setDocName('');
    setDocType('PRESCRIPTION');
    setDocDate(getTodayIsoDate());
    setDocNotes('');
    setIsDragging(false);
  };

  const handleChooseFile = (file: File | undefined) => {
    if (!file) return;
    const validType =
      ACCEPTED_MIME_TYPES.has(file.type) || ACCEPTED_EXTENSIONS_REGEX.test(file.name);
    if (!validType) {
      toast.error('Chỉ hỗ trợ ảnh JPG, PNG hoặc tệp PDF.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('Dung lượng tệp tối đa là 10 MB.');
      return;
    }
    setSelectedFile(file);
    if (!docName.trim()) {
      setDocName(stripExtension(file.name));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Vui lòng chọn ảnh hoặc tệp PDF cần tải lên.');
      return;
    }
    const cleanName = docName.trim();
    if (!cleanName) {
      toast.error('Vui lòng nhập tên tài liệu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await patientsApi.uploadMemberDocument(memberId, {
        file: selectedFile,
        documentName: cleanName,
        documentType: docType,
        recordedDate: docDate || getTodayIsoDate(),
        notes: docNotes.trim() || undefined,
      });
      onDocumentAdded(saved);
      toast.success('Đã tải lên và lưu tài liệu y tế thành công.');
      setShowUploadModal(false);
      resetModal();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể tải lên tài liệu y tế.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolveDocumentUrl = async (doc: PatientDocumentDto): Promise<string | null> => {
    if (isSafeExternalUrl(doc.fileUrl)) {
      return doc.fileUrl;
    }
    if (!doc.id) return null;
    const blob = await patientsApi.fetchMemberDocumentBlob(memberId, doc.id);
    const blobUrl = URL.createObjectURL(blob);
    createdBlobUrlsRef.current.push(blobUrl);
    return blobUrl;
  };

  const handleOpenDocument = async (doc: PatientDocumentDto) => {
    const docKey = doc.id || doc.fileUrl;
    setLoadingDocId(docKey);
    try {
      if (isImageDocument(doc)) {
        const imgUrl = doc.previewUrl && isSafeExternalUrl(doc.previewUrl)
          ? doc.previewUrl
          : await resolveDocumentUrl(doc);
        if (!imgUrl) {
          toast.error('Không tìm thấy tệp ảnh tài liệu.');
          return;
        }
        setLightboxDoc({ doc, imageUrl: imgUrl });
        return;
      }

      const fileUrl = await resolveDocumentUrl(doc);
      if (!fileUrl) {
        toast.error('Không tìm thấy đường dẫn tài liệu.');
        return;
      }
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể mở tệp tài liệu.'));
    } finally {
      setLoadingDocId(null);
    }
  };

  const handleDownloadDocument = async (doc: PatientDocumentDto) => {
    const docKey = doc.id || doc.fileUrl;
    setLoadingDocId(docKey);
    try {
      const url = await resolveDocumentUrl(doc);
      if (!url) {
        toast.error('Không tìm thấy tệp để tải xuống.');
        return;
      }
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = doc.documentName || 'tai-lieu-y-te';
      anchor.rel = 'noopener noreferrer';
      anchor.target = '_blank';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể tải xuống tài liệu.'));
    } finally {
      setLoadingDocId(null);
    }
  };

  const confirmDeleteDocument = async () => {
    if (!deletingDoc?.id) return;
    setIsDeleting(true);
    try {
      await patientsApi.deleteMemberDocument(memberId, deletingDoc.id);
      onDocumentDeleted?.(deletingDoc.id);
      toast.success('Đã xóa tài liệu y tế.');
      setDeletingDoc(null);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể xóa tài liệu y tế.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-[#2E37A4]">
              folder_shared
            </span>
            <span>Hồ sơ bệnh án, Đơn thuốc &amp; Tài liệu y tế ({documents.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lưu trữ ảnh đơn thuốc, phiếu xét nghiệm, kết quả chẩn đoán hình ảnh và giấy ra viện cho{' '}
            {memberName}.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            resetModal();
            setShowUploadModal(true);
          }}
          className="bg-[#2E37A4] hover:bg-[#222982] text-white shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          <span>Tải tài liệu lên</span>
        </Button>
      </div>

      {/* Category Tabs + Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Lọc loại tài liệu y tế">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'ALL'}
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
              activeCategory === 'ALL'
                ? 'bg-[#2E37A4] border-[#2E37A4] text-white'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Tất cả ({documents.length})
          </button>
          {DOCUMENT_TYPE_ORDER.map((typeKey) => {
            const meta = DOCUMENT_TYPE_META[typeKey];
            const active = activeCategory === typeKey;
            return (
              <button
                key={typeKey}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategory(typeKey)}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#2E37A4] border-[#2E37A4] text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {meta.label} ({countsByType[typeKey]})
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            search
          </span>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc ghi chú..."
            aria-label="Tìm kiếm tài liệu y tế"
            className="pl-9 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Document Gallery */}
      {filteredDocuments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center space-y-2">
          <span className="material-symbols-outlined text-[30px] text-slate-400">
            clinical_notes
          </span>
          <p className="text-sm font-semibold text-slate-800">
            {documents.length === 0
              ? 'Chưa có tài liệu y tế hay đơn thuốc nào được tải lên'
              : 'Không tìm thấy tài liệu phù hợp bộ lọc'}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {documents.length === 0
              ? 'Bạn có thể chụp ảnh đơn thuốc giấy, phiếu xét nghiệm hoặc chọn tệp PDF từ máy để lưu trữ lâu dài tại đây.'
              : 'Thử chọn tab Tất cả hoặc xóa từ khóa tìm kiếm để xem các tài liệu khác.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocuments.map((doc) => {
            const meta = DOCUMENT_TYPE_META[doc.documentType] ?? DOCUMENT_TYPE_META.OTHER;
            const isImg = isImageDocument(doc);
            const docKey = doc.id || doc.fileUrl;
            const isBusy = loadingDocId === docKey;

            return (
              <article
                key={docKey}
                className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 flex flex-col justify-between gap-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {isImg && doc.previewUrl && isSafeExternalUrl(doc.previewUrl) ? (
                    <button
                      type="button"
                      onClick={() => void handleOpenDocument(doc)}
                      className="size-16 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 cursor-pointer"
                      title={`Xem ảnh ${doc.documentName}`}
                    >
                      <img
                        src={doc.previewUrl}
                        alt={doc.documentName}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ) : (
                    <div
                      className={`size-12 rounded-xl border flex items-center justify-center shrink-0 ${meta.badgeClass}`}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {isImg ? 'image' : meta.icon}
                      </span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="outline" className={`text-[11px] font-semibold ${meta.badgeClass}`}>
                        {meta.label}
                      </Badge>
                      <span className="text-[11px] text-slate-500 tabular-nums">
                        {formatDateDisplay(doc.recordedDate)}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                      {doc.documentName}
                    </h3>

                    {doc.notes && (
                      <p className="text-xs text-slate-600 line-clamp-2">{doc.notes}</p>
                    )}

                    <p className="text-[11px] text-slate-500 tabular-nums">
                      {isImg ? 'Hình ảnh' : 'Tệp PDF'} • {formatFileSize(doc.fileSizeKb)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/70">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => void handleOpenDocument(doc)}
                    className="h-8 text-xs"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {isImg ? 'zoom_in' : 'visibility'}
                    </span>
                    <span>{isBusy ? 'Đang mở...' : isImg ? 'Xem ảnh' : 'Xem tệp'}</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => void handleDownloadDocument(doc)}
                    className="h-8 text-xs"
                  >
                    <span className="material-symbols-outlined text-[15px]">download</span>
                    <span>Tải về</span>
                  </Button>

                  {doc.id && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletingDoc(doc)}
                      aria-label={`Xóa tài liệu ${doc.documentName}`}
                      className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                      <span>Xóa</span>
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Upload File/Image Modal */}
      <Dialog
        open={showUploadModal}
        onOpenChange={(open) => {
          setShowUploadModal(open);
          if (!open) resetModal();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tải lên tài liệu y tế &amp; đơn thuốc</DialogTitle>
            <DialogDescription>
              Lưu trữ ảnh chụp (JPG/PNG) hoặc tệp PDF (tối đa 10 MB) trực tiếp vào hồ sơ y bạ của{' '}
              {memberName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* Drag & Drop File Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleChooseFile(e.dataTransfer.files?.[0]);
              }}
              className={`rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
                isDragging
                  ? 'border-[#2E37A4] bg-indigo-50/50'
                  : 'border-slate-300 bg-slate-50/60'
              }`}
            >
              <Label
                htmlFor="member-doc-file-input"
                className="cursor-pointer flex flex-col items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[28px] text-[#2E37A4]">
                  cloud_upload
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Chọn hoặc kéo thả ảnh / tệp PDF vào đây'}
                </span>
                <span className="text-[11px] text-slate-500">
                  Hỗ trợ PNG, JPG/JPEG, PDF • Tối đa 10 MB
                </span>
              </Label>
              <input
                id="member-doc-file-input"
                type="file"
                accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
                onChange={(e) => handleChooseFile(e.target.files?.[0])}
                className="sr-only"
              />
            </div>

            {/* Category Quick Chips */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Phân loại tài liệu</Label>
              <div className="flex flex-wrap gap-1.5">
                {DOCUMENT_TYPE_ORDER.map((typeKey) => {
                  const meta = DOCUMENT_TYPE_META[typeKey];
                  const selected = docType === typeKey;
                  return (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => setDocType(typeKey)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                        selected
                          ? 'bg-[#2E37A4] border-[#2E37A4] text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">{meta.icon}</span>
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="member-doc-name">Tên tài liệu</Label>
                <Input
                  id="member-doc-name"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="VD: Đơn thuốc tim mạch tháng 11"
                  maxLength={200}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="member-doc-date">Ngày ghi nhận / Ngày khám</Label>
                <Input
                  id="member-doc-date"
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="member-doc-notes">Ghi chú (nơi khám / bác sĩ)</Label>
              <Input
                id="member-doc-notes"
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
                placeholder="VD: BV ĐHYD - BS. Hùng kê toa 30 ngày"
                maxLength={1000}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUploadModal(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#2E37A4] hover:bg-[#222982] text-white"
              >
                {isSubmitting ? 'Đang tải lên...' : 'Lưu vào y bạ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox Modal */}
      <Dialog
        open={Boolean(lightboxDoc)}
        onOpenChange={(open) => {
          if (!open) setLightboxDoc(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{lightboxDoc?.doc.documentName}</DialogTitle>
            <DialogDescription>
              {lightboxDoc
                ? `${
                    (
                      DOCUMENT_TYPE_META[lightboxDoc.doc.documentType] ??
                      DOCUMENT_TYPE_META.OTHER
                    ).label
                  } • Ngày ${formatDateDisplay(lightboxDoc.doc.recordedDate)}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {lightboxDoc && (
            <div className="space-y-3">
              <div className="max-h-[65vh] overflow-auto rounded-xl border border-slate-200 bg-slate-950/5 flex items-center justify-center p-2">
                <img
                  src={lightboxDoc.imageUrl}
                  alt={lightboxDoc.doc.documentName}
                  className="max-h-[60vh] w-auto object-contain rounded-lg"
                />
              </div>
              {lightboxDoc.doc.notes && (
                <p className="text-xs text-slate-600">{lightboxDoc.doc.notes}</p>
              )}
            </div>
          )}
          <DialogFooter>
            {lightboxDoc && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDownloadDocument(lightboxDoc.doc)}
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Tải ảnh gốc</span>
              </Button>
            )}
            <Button type="button" onClick={() => setLightboxDoc(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingDoc)}
        onOpenChange={(open) => {
          if (!open) setDeletingDoc(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa tài liệu</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa tài liệu &ldquo;{deletingDoc?.documentName}&rdquo; khỏi hồ sơ y
              bạ của {memberName}? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingDoc(null)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void confirmDeleteDocument()}
              disabled={isDeleting}
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa tài liệu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
