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

function getDocumentExtension(doc: PatientDocumentDto): string {
  const mime = (doc.mimeType || '').toLowerCase();
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/webp') return 'webp';

  const urlMatch = doc.fileUrl.match(/\.(pdf|png|jpe?g|webp)(?:$|\?)/i);
  if (urlMatch) {
    const ext = urlMatch[1].toLowerCase();
    return ext === 'jpeg' ? 'jpg' : ext;
  }
  return isImageDocument(doc) ? 'jpg' : 'pdf';
}

function buildDownloadFilename(doc: PatientDocumentDto): string {
  const rawName = (doc.documentName || 'tai-lieu-y-te')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/[. ]+$/, '');
  const baseName = rawName || 'tai-lieu-y-te';
  if (/\.(pdf|png|jpe?g|webp)$/i.test(baseName)) {
    return baseName;
  }
  return `${baseName}.${getDocumentExtension(doc)}`;
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

interface PreviewDocumentState {
  doc: PatientDocumentDto;
  kind: 'image' | 'pdf';
  url: string | null;
  loading: boolean;
  error: string | null;
  usedFallback: boolean;
}

export function MemberDocumentUploadSection({
  memberId,
  memberName,
  documents,
  onDocumentAdded,
  onDocumentDeleted,
}: MemberDocumentUploadSectionProps) {
  const blobCacheRef = useRef<Map<string, string>>(new Map());
  const previewRequestIdRef = useRef(0);

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

  const [previewDoc, setPreviewDoc] = useState<PreviewDocumentState | null>(null);
  const [failedPreviewKeys, setFailedPreviewKeys] = useState<Record<string, boolean>>({});
  const [cachedImageUrls, setCachedImageUrls] = useState<Record<string, string>>({});
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);

  const [deletingDoc, setDeletingDoc] = useState<PatientDocumentDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [collapsedDocKeys, setCollapsedDocKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const cache = blobCacheRef.current;
    return () => {
      cache.forEach((url) => URL.revokeObjectURL(url));
      cache.clear();
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

  const toggleDocCollapsed = (docKey: string) => {
    setCollapsedDocKeys((prev) => ({
      ...prev,
      [docKey]: !prev[docKey],
    }));
  };

  const allFilteredCollapsed =
    filteredDocuments.length > 0 &&
    filteredDocuments.every((doc) => Boolean(collapsedDocKeys[doc.id || doc.fileUrl]));

  const toggleAllFilteredDocs = () => {
    const nextState = !allFilteredCollapsed;
    setCollapsedDocKeys((prev) => {
      const next = { ...prev };
      for (const doc of filteredDocuments) {
        next[doc.id || doc.fileUrl] = nextState;
      }
      return next;
    });
  };

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

  const resolveDocumentUrl = async (
    doc: PatientDocumentDto,
    forceRefresh = false,
  ): Promise<string | null> => {
    if (isSafeExternalUrl(doc.fileUrl)) {
      return doc.fileUrl;
    }
    if (!doc.id) return null;

    if (!forceRefresh) {
      const cached = blobCacheRef.current.get(doc.id);
      if (cached) {
        return cached;
      }
    } else {
      const staleUrl = blobCacheRef.current.get(doc.id);
      if (staleUrl) {
        URL.revokeObjectURL(staleUrl);
        blobCacheRef.current.delete(doc.id);
      }
    }

    const rawBlob = await patientsApi.fetchMemberDocumentBlob(memberId, doc.id);
    const isImg = isImageDocument(doc);
    const expectedMime =
      doc.mimeType || (isImg ? 'image/jpeg' : 'application/pdf');
    const typedBlob =
      !rawBlob.type || rawBlob.type === 'application/octet-stream'
        ? new Blob([rawBlob], { type: expectedMime })
        : rawBlob;
    const blobUrl = URL.createObjectURL(typedBlob);
    blobCacheRef.current.set(doc.id, blobUrl);
    if (isImg) {
      const docId = doc.id;
      setCachedImageUrls((prev) => ({ ...prev, [docId]: blobUrl }));
    }
    return blobUrl;
  };

  const loadBlobIntoPreview = async (
    doc: PatientDocumentDto,
    kind: 'image' | 'pdf',
    forceRefresh = false,
  ) => {
    const reqId = ++previewRequestIdRef.current;
    const docKey = doc.id || doc.fileUrl;
    setPreviewDoc({
      doc,
      kind,
      url: null,
      loading: true,
      error: null,
      usedFallback: true,
    });
    setLoadingDocId(docKey);

    try {
      const fileUrl = await resolveDocumentUrl(doc, forceRefresh);
      if (previewRequestIdRef.current !== reqId) return;

      if (!fileUrl) {
        const msg =
          kind === 'image'
            ? 'Không tìm thấy tệp ảnh tài liệu.'
            : 'Không tìm thấy đường dẫn tài liệu.';
        setPreviewDoc({
          doc,
          kind,
          url: null,
          loading: false,
          error: msg,
          usedFallback: true,
        });
        return;
      }

      setPreviewDoc({
        doc,
        kind,
        url: fileUrl,
        loading: false,
        error: null,
        usedFallback: true,
      });
    } catch (err) {
      if (previewRequestIdRef.current !== reqId) return;
      const msg = extractErrorMessage(err, 'Không thể tải tài liệu từ kho lưu trữ.');
      setPreviewDoc({
        doc,
        kind,
        url: null,
        loading: false,
        error: msg,
        usedFallback: true,
      });
      toast.error(msg);
    } finally {
      if (previewRequestIdRef.current === reqId) {
        setLoadingDocId(null);
      }
    }
  };

  const handleOpenDocument = async (doc: PatientDocumentDto) => {
    const isImg = isImageDocument(doc);

    if (!isImg && isSafeExternalUrl(doc.fileUrl)) {
      window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (isImg) {
      const docKey = doc.id || doc.fileUrl;
      const cachedUrl = doc.id ? blobCacheRef.current.get(doc.id) : undefined;
      if (cachedUrl) {
        previewRequestIdRef.current += 1;
        setPreviewDoc({
          doc,
          kind: 'image',
          url: cachedUrl,
          loading: false,
          error: null,
          usedFallback: false,
        });
        return;
      }

      if (doc.previewUrl && isSafeExternalUrl(doc.previewUrl) && !failedPreviewKeys[docKey]) {
        previewRequestIdRef.current += 1;
        setPreviewDoc({
          doc,
          kind: 'image',
          url: doc.previewUrl,
          loading: false,
          error: null,
          usedFallback: false,
        });
        return;
      }

      if (isSafeExternalUrl(doc.fileUrl)) {
        previewRequestIdRef.current += 1;
        setPreviewDoc({
          doc,
          kind: 'image',
          url: doc.fileUrl,
          loading: false,
          error: null,
          usedFallback: true,
        });
        return;
      }

      await loadBlobIntoPreview(doc, 'image');
      return;
    }

    await loadBlobIntoPreview(doc, 'pdf');
  };

  const handleLightboxImageError = async (current: PreviewDocumentState) => {
    const docKey = current.doc.id || current.doc.fileUrl;
    if (current.usedFallback || !current.doc.id) {
      setPreviewDoc((prev) =>
        prev && (prev.doc.id || prev.doc.fileUrl) === docKey
          ? {
              ...prev,
              url: null,
              loading: false,
              error: 'Không thể hiển thị ảnh tài liệu. Vui lòng thử lại.',
            }
          : prev,
      );
      return;
    }

    setFailedPreviewKeys((prev) => ({ ...prev, [docKey]: true }));
    await loadBlobIntoPreview(current.doc, 'image', true);
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
      anchor.download = buildDownloadFilename(doc);
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => anchor.remove(), 1_000);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể tải xuống tài liệu.'));
    } finally {
      setLoadingDocId(null);
    }
  };

  const confirmDeleteDocument = async () => {
    if (!deletingDoc?.id) return;
    const targetId = deletingDoc.id;
    setIsDeleting(true);
    try {
      await patientsApi.deleteMemberDocument(memberId, targetId);
      const cachedUrl = blobCacheRef.current.get(targetId);
      if (cachedUrl) {
        URL.revokeObjectURL(cachedUrl);
        blobCacheRef.current.delete(targetId);
      }
      setCachedImageUrls((prev) => {
        if (!(targetId in prev)) return prev;
        const next = { ...prev };
        delete next[targetId];
        return next;
      });
      onDocumentDeleted?.(targetId);
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
      {/* Notion-like Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-xl bg-[#2E37A4]/10 text-[#2E37A4] flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[20px]">folder_shared</span>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex flex-wrap items-center gap-2">
              <span>Hồ sơ bệnh án, Đơn thuốc &amp; Tài liệu y tế</span>
              <span className="inline-flex items-center justify-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 tabular-nums">
                {documents.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ghi chú y khoa, đơn thuốc, phiếu xét nghiệm và chẩn đoán hình ảnh cho {memberName}.
            </p>
          </div>
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

      {/* Filter Pills + Search + Collapse/Expand Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Lọc loại tài liệu y tế">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'ALL'}
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              activeCategory === 'ALL'
                ? 'bg-[#2E37A4] border-[#2E37A4] text-white'
                : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
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
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#2E37A4] border-[#2E37A4] text-white'
                    : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {meta.label} ({countsByType[typeKey]})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              search
            </span>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc ghi chú..."
              aria-label="Tìm kiếm tài liệu y tế"
              className="pl-9 h-9 bg-slate-50/70 focus:bg-white text-xs sm:text-sm"
            />
          </div>
          {filteredDocuments.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleAllFilteredDocs}
              className="h-9 px-2.5 text-xs text-slate-600 hover:text-slate-900 shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">
                {allFilteredCollapsed ? 'unfold_more' : 'unfold_less'}
              </span>
              <span className="hidden sm:inline">
                {allFilteredCollapsed ? 'Mở rộng' : 'Thu gọn'}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Note / Notion-Style Collapsible List */}
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
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
          {filteredDocuments.map((doc) => {
            const meta = DOCUMENT_TYPE_META[doc.documentType] ?? DOCUMENT_TYPE_META.OTHER;
            const isImg = isImageDocument(doc);
            const docKey = doc.id || doc.fileUrl;
            const isBusy = loadingDocId === docKey;
            const isCollapsed = Boolean(collapsedDocKeys[docKey]);

            const cachedUrl = doc.id ? cachedImageUrls[doc.id] : undefined;
            const proxyUrl =
              doc.previewUrl &&
              isSafeExternalUrl(doc.previewUrl) &&
              !failedPreviewKeys[docKey]
                ? doc.previewUrl
                : undefined;
            const thumbSrc = cachedUrl || proxyUrl;

            return (
              <article
                key={docKey}
                className="transition-colors hover:bg-slate-50/60"
              >
                {/* Compact Note Toggle Header Row */}
                <div className="px-3.5 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleDocCollapsed(docKey)}
                      aria-expanded={!isCollapsed}
                      aria-label={
                        isCollapsed
                          ? `Mở rộng nội dung ${doc.documentName}`
                          : `Thu gọn nội dung ${doc.documentName}`
                      }
                      className="size-6 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 cursor-pointer transition-colors"
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] transition-transform ${
                          isCollapsed ? '' : 'rotate-90'
                        }`}
                      >
                        chevron_right
                      </span>
                    </button>

                    <span
                      className={`size-7 rounded-lg border flex items-center justify-center shrink-0 ${meta.badgeClass}`}
                      aria-hidden="true"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isImg ? 'image' : meta.icon}
                      </span>
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleDocCollapsed(docKey)}
                          className="text-left text-sm font-semibold text-slate-900 hover:text-[#2E37A4] truncate max-w-full cursor-pointer"
                        >
                          {doc.documentName}
                        </button>
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-medium px-2 py-0 ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                        {formatDateDisplay(doc.recordedDate)} • {isImg ? 'Hình ảnh' : 'Tệp PDF'} •{' '}
                        {formatFileSize(doc.fileSizeKb)}
                      </p>
                    </div>
                  </div>

                  {/* Quick Inline Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 pl-8 sm:pl-0 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => void handleOpenDocument(doc)}
                      className="h-7 px-2.5 text-xs bg-white"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isImg ? 'zoom_in' : 'visibility'}
                      </span>
                      <span>{isBusy ? 'Đang mở...' : isImg ? 'Xem ảnh' : 'Xem tệp'}</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={isBusy}
                      onClick={() => void handleDownloadDocument(doc)}
                      className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                    >
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      <span>Tải về</span>
                    </Button>

                    {doc.id && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingDoc(doc)}
                        aria-label={`Xóa tài liệu ${doc.documentName}`}
                        className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        <span>Xóa</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Collapsible Notion-style Note Body */}
                {!isCollapsed && (
                  <div className="ml-6 sm:ml-7 mr-4 mb-3.5 pl-3.5 border-l-2 border-slate-200 space-y-2.5">
                    {doc.notes ? (
                      <p className="text-xs sm:text-[13px] leading-relaxed text-slate-700 whitespace-pre-line">
                        {doc.notes}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Chưa có ghi chú thêm cho tài liệu này.
                      </p>
                    )}

                    {isImg && thumbSrc && (
                      <button
                        type="button"
                        onClick={() => void handleOpenDocument(doc)}
                        className="inline-flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 p-1.5 pr-3 hover:border-[#2E37A4]/40 transition-colors cursor-pointer"
                        title={`Xem ảnh ${doc.documentName}`}
                      >
                        <img
                          src={thumbSrc}
                          alt={doc.documentName}
                          onError={() => {
                            if (proxyUrl && thumbSrc === proxyUrl) {
                              setFailedPreviewKeys((prev) => ({
                                ...prev,
                                [docKey]: true,
                              }));
                            }
                          }}
                          className="h-12 w-16 rounded object-cover border border-slate-200 bg-white"
                        />
                        <span className="text-xs font-medium text-slate-600">
                          Bấm để phóng to ảnh
                        </span>
                      </button>
                    )}
                  </div>
                )}
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

      {/* Image Lightbox & PDF Preview Modal */}
      <Dialog
        open={Boolean(previewDoc)}
        onOpenChange={(open) => {
          if (!open) {
            previewRequestIdRef.current += 1;
            setLoadingDocId(null);
            setPreviewDoc(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewDoc?.doc.documentName}</DialogTitle>
            <DialogDescription>
              {previewDoc
                ? `${
                    (
                      DOCUMENT_TYPE_META[previewDoc.doc.documentType] ??
                      DOCUMENT_TYPE_META.OTHER
                    ).label
                  } • Ngày ${formatDateDisplay(previewDoc.doc.recordedDate)}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {previewDoc && (
            <div className="space-y-3">
              {previewDoc.loading ? (
                <div
                  role="status"
                  aria-label="Đang tải tệp tài liệu"
                  className="h-[45vh] rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3 p-6 text-center"
                >
                  <div className="size-8 rounded-full border-2 border-[#2E37A4]/25 border-t-[#2E37A4] animate-spin" />
                  <p className="text-sm font-medium text-slate-700">
                    Đang tải dữ liệu tài liệu từ kho lưu trữ...
                  </p>
                </div>
              ) : previewDoc.error ? (
                <div
                  role="alert"
                  className="h-[40vh] rounded-xl border border-rose-200 bg-rose-50/70 flex flex-col items-center justify-center gap-3 p-6 text-center"
                >
                  <p className="text-sm font-semibold text-rose-800">{previewDoc.error}</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      void loadBlobIntoPreview(previewDoc.doc, previewDoc.kind, true)
                    }
                  >
                    Thử lại
                  </Button>
                </div>
              ) : previewDoc.url && previewDoc.kind === 'image' ? (
                <div className="max-h-[65vh] overflow-auto rounded-xl border border-slate-200 bg-slate-950/5 flex items-center justify-center p-2">
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.doc.documentName}
                    onError={() => void handleLightboxImageError(previewDoc)}
                    className="max-h-[60vh] w-auto object-contain rounded-lg"
                  />
                </div>
              ) : previewDoc.url ? (
                <div className="rounded-xl border border-slate-200 bg-slate-100 overflow-hidden">
                  <iframe
                    src={previewDoc.url}
                    title={previewDoc.doc.documentName}
                    className="w-full h-[65vh] bg-white"
                  />
                </div>
              ) : null}
              {previewDoc.doc.notes && (
                <p className="text-xs text-slate-600">{previewDoc.doc.notes}</p>
              )}
            </div>
          )}
          <DialogFooter>
            {previewDoc && previewDoc.kind === 'pdf' && previewDoc.url && (
              <Button type="button" variant="outline" asChild>
                <a href={previewDoc.url} target="_blank" rel="noopener noreferrer">
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  <span>Mở tab mới</span>
                </a>
              </Button>
            )}
            {previewDoc && (
              <Button
                type="button"
                variant="outline"
                disabled={previewDoc.loading}
                onClick={() => void handleDownloadDocument(previewDoc.doc)}
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>{previewDoc.kind === 'image' ? 'Tải ảnh gốc' : 'Tải PDF về'}</span>
              </Button>
            )}
            <Button
              type="button"
              onClick={() => {
                previewRequestIdRef.current += 1;
                setLoadingDocId(null);
                setPreviewDoc(null);
              }}
            >
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
