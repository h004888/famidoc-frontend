'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  doctorsApi,
  type BulkDoctorNormalizedRowDto,
  type BulkImportDoctorsPreviewResponse,
  type ConfirmBulkImportDoctorsResponse,
} from '@/lib/api/doctors.api';
import { extractErrorMessage } from '@/lib/api';

interface FacilityDoctorExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void | Promise<void>;
}

type ModalStep = 'upload' | 'preview' | 'result';
type PreviewTab = 'valid' | 'existing' | 'invalid';

export function FacilityDoctorExcelImportModal({
  isOpen,
  onClose,
  onImported,
}: FacilityDoctorExcelImportModalProps) {
  const [step, setStep] = useState<ModalStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [previewData, setPreviewData] =
    useState<BulkImportDoctorsPreviewResponse | null>(null);
  const [activeTab, setActiveTab] = useState<PreviewTab>('valid');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [confirmResult, setConfirmResult] =
    useState<ConfirmBulkImportDoctorsResponse | null>(null);

  const resetModalState = () => {
    setStep('upload');
    setSelectedFile(null);
    setErrorMsg(null);
    setPreviewData(null);
    setActiveTab('valid');
    setSelectedRows([]);
    setConfirmResult(null);
  };

  const handleClose = () => {
    if (isPreviewing || isConfirming) return;
    resetModalState();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const blob = await doctorsApi.downloadDoctorImportTemplate();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'mau-import-bac-si-famidoc.xlsx';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success('Đã tải file Excel mẫu thành công.');
    } catch (err) {
      toast.error(
        extractErrorMessage(err, 'Không thể tải file Excel mẫu. Vui lòng thử lại.')
      );
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setErrorMsg(null);
    setSelectedFile(file);
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Vui lòng chọn file Excel (.xlsx) trước khi kiểm tra.');
      return;
    }

    setIsPreviewing(true);
    setErrorMsg(null);
    try {
      const preview = await doctorsApi.previewDoctorsExcelImport(selectedFile);
      setPreviewData(preview);
      const maxBatch = preview.summary.maxConfirmBatch || 30;
      const defaultSelected = preview.validRows
        .slice(0, maxBatch)
        .map((r) => r.rowNumber);
      setSelectedRows(defaultSelected);

      if (preview.validRows.length > 0) {
        setActiveTab('valid');
      } else if (preview.invalidRows.length > 0) {
        setActiveTab('invalid');
      } else {
        setActiveTab('existing');
      }

      setStep('preview');
    } catch (err) {
      const msg = extractErrorMessage(
        err,
        'Không thể đọc và kiểm tra file Excel. Vui lòng kiểm tra lại định dạng tệp.'
      );
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsPreviewing(false);
    }
  };

  const maxConfirmBatch = previewData?.summary.maxConfirmBatch ?? 30;
  const selectedRowSet = useMemo(() => new Set(selectedRows), [selectedRows]);

  const toggleRowSelection = (rowNumber: number) => {
    if (selectedRowSet.has(rowNumber)) {
      setSelectedRows((prev) => prev.filter((n) => n !== rowNumber));
      return;
    }
    if (selectedRows.length >= maxConfirmBatch) {
      toast.warning(
        `Mỗi lượt xác nhận chỉ được chọn tối đa ${maxConfirmBatch} bác sĩ mới.`
      );
      return;
    }
    setSelectedRows((prev) => [...prev, rowNumber]);
  };

  const handleSelectFirstBatch = () => {
    if (!previewData) return;
    setSelectedRows(
      previewData.validRows.slice(0, maxConfirmBatch).map((r) => r.rowNumber)
    );
  };

  const handleClearSelection = () => {
    setSelectedRows([]);
  };

  const selectedValidDoctors: BulkDoctorNormalizedRowDto[] = useMemo(() => {
    if (!previewData) return [];
    return previewData.validRows.filter((r) => selectedRowSet.has(r.rowNumber));
  }, [previewData, selectedRowSet]);

  const handleConfirmImport = async () => {
    if (selectedValidDoctors.length === 0) return;

    setIsConfirming(true);
    setErrorMsg(null);
    try {
      const result = await doctorsApi.confirmDoctorsBulkImport(
        selectedValidDoctors.map((row) => ({
          rowNumber: row.rowNumber,
          doctorName: row.doctorName,
          email: row.email,
          phone: row.phone,
          specialty: row.specialty,
          ...(row.academicTitle ? { academicTitle: row.academicTitle } : {}),
          experienceYears: row.experienceYears,
          ...(row.bio ? { bio: row.bio } : {}),
        }))
      );
      setConfirmResult(result);
      setStep('result');
      if (result.summary.createdCount > 0) {
        if (result.summary.mailFailedCount > 0) {
          toast.warning(
            `Đã tạo ${result.summary.createdCount} tài khoản bác sĩ, nhưng có ${result.summary.mailFailedCount} tài khoản gửi email thất bại.`
          );
        } else {
          toast.success(
            `Đã khởi tạo thành công ${result.summary.createdCount} tài khoản bác sĩ.`
          );
        }
        await onImported();
      } else {
        toast.warning('Không có tài khoản bác sĩ mới nào được khởi tạo.');
      }
    } catch (err) {
      const msg = extractErrorMessage(
        err,
        'Không thể xác nhận import hàng loạt. Vui lòng thử lại.'
      );
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="excel-import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3
              id="excel-import-modal-title"
              className="font-bold text-slate-900 text-base sm:text-lg"
            >
              Import danh sách Bác sĩ từ Excel
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hỗ trợ đọc tối đa 100 dòng/tệp • Tự động bỏ qua bác sĩ đã có tại CSYT • Tạo tối đa 30 bác sĩ mới/lượt
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng hộp thoại import Excel"
            className="text-slate-400 hover:text-slate-600 font-bold p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2"
            >
              <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0">
                error
              </span>
              <p className="leading-relaxed font-medium">{errorMsg}</p>
            </div>
          )}

          {step === 'upload' && (
            <form onSubmit={handlePreview} className="space-y-4">
              <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-semibold text-slate-900">
                    Bước 1: Tải file Excel mẫu chuẩn của FamiDoc
                  </p>
                  <p className="text-xs text-slate-600">
                    File mẫu có sẵn cột SĐT định dạng Text, gợi ý Chuyên khoa/Học vị và sheet hướng dẫn chi tiết.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDownloadTemplate()}
                  disabled={isDownloadingTemplate}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    download
                  </span>
                  <span>
                    {isDownloadingTemplate
                      ? 'Đang tải...'
                      : 'Tải file mẫu (.xlsx)'}
                  </span>
                </button>
              </div>

              <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 space-y-3">
                <label
                  htmlFor="doctor-excel-file-input"
                  className="block text-xs sm:text-sm font-semibold text-slate-800"
                >
                  Bước 2: Chọn file danh sách bác sĩ (.xlsx, tối đa 2MB)
                </label>
                <input
                  id="doctor-excel-file-input"
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-xs text-slate-600">
                    Đã chọn: <strong className="text-slate-900">{selectedFile.name}</strong> (
                    {(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isPreviewing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    fact_check
                  </span>
                  <span>
                    {isPreviewing
                      ? 'Đang kiểm tra dữ liệu...'
                      : 'Kiểm tra & Xem trước'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {step === 'preview' && previewData && (
            <div className="space-y-4">
              {/* Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <p className="text-[11px] text-slate-500 font-medium">
                    Tổng dòng đọc
                  </p>
                  <p className="text-lg font-bold text-slate-900 tabular-nums">
                    {previewData.summary.totalReadRows}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Mới & Hợp lệ
                  </p>
                  <p className="text-lg font-bold text-emerald-800 tabular-nums">
                    {previewData.summary.validCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-sky-200 bg-sky-50">
                  <p className="text-[11px] text-sky-700 font-medium">
                    Đã có tại CSYT (Bỏ qua)
                  </p>
                  <p className="text-lg font-bold text-sky-800 tabular-nums">
                    {previewData.summary.existingSkippedCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50">
                  <p className="text-[11px] text-rose-700 font-medium">
                    Lỗi / Xung đột
                  </p>
                  <p className="text-lg font-bold text-rose-800 tabular-nums">
                    {previewData.summary.invalidCount}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('valid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    activeTab === 'valid'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Mới hợp lệ ({previewData.validRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('existing')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    activeTab === 'existing'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Đã có tại CSYT ({previewData.existingRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('invalid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    activeTab === 'invalid'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Lỗi cần sửa ({previewData.invalidRows.length})
                </button>
              </div>

              {activeTab === 'valid' && (
                <div className="space-y-3">
                  {previewData.validRows.length > maxConfirmBatch && (
                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs">
                      File có <strong>{previewData.validRows.length}</strong> bác sĩ mới hợp lệ. Mỗi lượt xác nhận tạo tối đa{' '}
                      <strong>{maxConfirmBatch}</strong> bác sĩ — hệ thống đã chọn sẵn {maxConfirmBatch} bác sĩ đầu tiên.
                    </div>
                  )}

                  {previewData.validRows.length > 0 ? (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-slate-600">
                          Đang chọn <strong>{selectedRows.length}</strong> / tối đa {maxConfirmBatch} bác sĩ mới
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSelectFirstBatch}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
                          >
                            Chọn {Math.min(maxConfirmBatch, previewData.validRows.length)} dòng đầu
                          </button>
                          <button
                            type="button"
                            onClick={handleClearSelection}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium cursor-pointer"
                          >
                            Bỏ chọn tất cả
                          </button>
                        </div>
                      </div>

                      <div className="border border-slate-200 rounded-2xl overflow-x-auto max-h-64 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-slate-50/90 text-slate-700 font-semibold sticky top-0">
                            <tr>
                              <th className="px-3 py-2.5 text-left border-b border-r border-slate-200 w-10">Chọn</th>
                              <th className="px-3 py-2.5 text-left border-b border-r border-slate-200">Dòng</th>
                              <th className="px-3 py-2.5 text-left border-b border-r border-slate-200">Họ và tên</th>
                              <th className="px-3 py-2.5 text-left border-b border-r border-slate-200">Email</th>
                              <th className="px-3 py-2.5 text-left border-b border-r border-slate-200">Số điện thoại</th>
                              <th className="px-3 py-2.5 text-left border-b border-r border-slate-200">Chuyên khoa</th>
                              <th className="px-3 py-2.5 text-left border-b border-slate-200">Học vị / KN</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {previewData.validRows.map((row) => (
                              <tr key={row.rowNumber} className="hover:bg-slate-50/80">
                                <td className="px-3 py-2.5 text-left border-r border-slate-200">
                                  <input
                                    type="checkbox"
                                    aria-label={`Chọn dòng ${row.rowNumber} - ${row.doctorName}`}
                                    checked={selectedRowSet.has(row.rowNumber)}
                                    onChange={() => toggleRowSelection(row.rowNumber)}
                                    className="rounded border-slate-300 cursor-pointer"
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-left border-r border-slate-200 tabular-nums text-slate-500">#{row.rowNumber}</td>
                                <td className="px-3 py-2.5 text-left border-r border-slate-200 font-semibold text-slate-900">{row.doctorName}</td>
                                <td className="px-3 py-2.5 text-left border-r border-slate-200 text-slate-700">{row.email}</td>
                                <td className="px-3 py-2.5 text-left border-r border-slate-200 tabular-nums text-slate-700">{row.phone}</td>
                                <td className="px-3 py-2.5 text-left border-r border-slate-200 text-slate-700">{row.specialty}</td>
                                <td className="px-3 py-2.5 text-left text-slate-600">
                                  {row.academicTitle ? `${row.academicTitle} • ` : ''}
                                  {row.experienceYears} năm
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      Không có dòng bác sĩ mới hợp lệ nào trong file này.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'existing' && (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl border border-sky-200 bg-sky-50 text-sky-900 text-xs">
                    Các bác sĩ dưới đây đã có tài khoản trực thuộc cơ sở y tế của bạn (trùng cả Email và SĐT), hệ thống sẽ tự động bỏ qua an toàn.
                  </div>
                  {previewData.existingRows.length > 0 ? (
                    <div className="border border-slate-200 rounded-2xl overflow-x-auto max-h-64 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50/90 text-slate-700 font-semibold sticky top-0">
                          <tr>
                            <th className="px-3 py-2.5 text-left border-b border-r border-slate-200">Dòng</th>
                            <th className="px-3 py-2.5 text-left border-b border-r border-slate-200">Họ tên</th>
                            <th className="px-3 py-2.5 text-left border-b border-r border-slate-200">Email</th>
                            <th className="px-3 py-2.5 text-left border-b border-r border-slate-200">Số điện thoại</th>
                            <th className="px-3 py-2.5 text-left border-b border-slate-200">Trạng thái hiện hữu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {previewData.existingRows.map((row) => (
                            <tr key={row.rowNumber}>
                              <td className="px-3 py-2.5 text-left border-r border-slate-200 tabular-nums text-slate-500">#{row.rowNumber}</td>
                              <td className="px-3 py-2.5 text-left border-r border-slate-200 font-medium text-slate-900">{row.existingDoctorName}</td>
                              <td className="px-3 py-2.5 text-left border-r border-slate-200 text-slate-700">{row.email}</td>
                              <td className="px-3 py-2.5 text-left border-r border-slate-200 tabular-nums text-slate-700">{row.phone}</td>
                              <td className="px-3 py-2.5 text-left text-sky-700 font-medium">
                                Đã tồn tại ({row.existingOnboardingStatus}) • Bỏ qua
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      Không có dòng bác sĩ nào trùng với nhân sự sẵn có của CSYT.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'invalid' && (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 text-xs">
                    Các dòng dưới đây có dữ liệu không hợp lệ hoặc xung đột tài khoản. Bạn có thể bỏ qua để import các dòng hợp lệ, hoặc sửa file rồi kiểm tra lại.
                  </div>
                  {previewData.invalidRows.length > 0 ? (
                    <div className="border border-slate-200 rounded-2xl overflow-x-auto max-h-64 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50/90 text-slate-700 font-semibold sticky top-0">
                          <tr>
                            <th className="px-3 py-2.5 text-left border-b border-r border-slate-200">Dòng</th>
                            <th className="px-3 py-2.5 text-left border-b border-r border-slate-200">Dữ liệu đọc được</th>
                            <th className="px-3 py-2.5 text-left border-b border-slate-200">Nguyên nhân lỗi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {previewData.invalidRows.map((row) => (
                            <tr key={row.rowNumber} className="bg-rose-50/30">
                              <td className="px-3 py-2.5 text-left border-r border-slate-200 tabular-nums font-semibold text-rose-700">
                                #{row.rowNumber}
                              </td>
                              <td className="px-3 py-2.5 text-left border-r border-slate-200 text-slate-700">
                                <div className="font-medium text-slate-900">
                                  {row.raw.doctorName || '(Trống tên)'}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {row.raw.email || '(Trống email)'} • {row.raw.phone || '(Trống SĐT)'}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-left text-rose-700">
                                <ul className="list-disc pl-4 space-y-0.5">
                                  {row.errors.map((errText, idx) => (
                                    <li key={idx}>{errText}</li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      Không có dòng nào bị lỗi.
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setStep('upload');
                  }}
                  disabled={isConfirming}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Chọn file khác
                </button>
                <button
                  type="button"
                  disabled={selectedValidDoctors.length === 0 || isConfirming}
                  onClick={() => void handleConfirmImport()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    group_add
                  </span>
                  <span>
                    {isConfirming
                      ? 'Đang khởi tạo tài khoản...'
                      : `Xác nhận tạo ${selectedValidDoctors.length} bác sĩ`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {step === 'result' && confirmResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <p className="text-[11px] text-slate-500 font-medium">Đã chọn tạo</p>
                  <p className="text-lg font-bold text-slate-900 tabular-nums">
                    {confirmResult.summary.requestedCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                  <p className="text-[11px] text-emerald-700 font-medium">Tạo thành công</p>
                  <p className="text-lg font-bold text-emerald-800 tabular-nums">
                    {confirmResult.summary.createdCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-sky-200 bg-sky-50">
                  <p className="text-[11px] text-sky-700 font-medium">Đã gửi email</p>
                  <p className="text-lg font-bold text-sky-800 tabular-nums">
                    {confirmResult.summary.mailSentCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50">
                  <p className="text-[11px] text-rose-700 font-medium">Thất bại</p>
                  <p className="text-lg font-bold text-rose-800 tabular-nums">
                    {confirmResult.summary.failedCount}
                  </p>
                </div>
              </div>

              {confirmResult.summary.mailFailedCount > 0 && (
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs">
                  Có <strong>{confirmResult.summary.mailFailedCount}</strong> tài khoản đã tạo thành công nhưng gửi email thông tin đăng nhập thất bại. Vui lòng kiểm tra cấu hình gửi mail hoặc thông báo bác sĩ dùng chức năng quên mật khẩu để kích hoạt.
                </div>
              )}

              {confirmResult.createdDoctors.length > 0 && (
                <div className="border border-slate-200 rounded-2xl overflow-x-auto max-h-56 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50/90 text-slate-700 font-semibold sticky top-0">
                      <tr>
                        <th className="px-3 py-2.5 text-left border-b border-r border-slate-200">Bác sĩ</th>
                        <th className="px-3 py-2.5 text-left border-b border-r border-slate-200">Email</th>
                        <th className="px-3 py-2.5 text-left border-b border-slate-200">Gửi email mời</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {confirmResult.createdDoctors.map((item) => (
                        <tr key={item.doctor.id}>
                          <td className="px-3 py-2.5 text-left border-r border-slate-200 font-semibold text-slate-900">
                            {item.doctor.doctorName}
                          </td>
                          <td className="px-3 py-2.5 text-left border-r border-slate-200 text-slate-700">{item.doctor.email || '—'}</td>
                          <td className="px-3 py-2.5 text-left">
                            {item.mailSent ? (
                              <span className="text-emerald-700 font-semibold">Đã gửi</span>
                            ) : (
                              <span className="text-amber-700 font-semibold">
                                {item.mailWarning || 'Gửi mail lỗi'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {confirmResult.failedRows.length > 0 && (
                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 text-xs space-y-1">
                  <p className="font-semibold">Các dòng không thể tạo lúc xác nhận:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {confirmResult.failedRows.map((row, idx) => (
                      <li key={idx}>
                        Dòng #{row.rowNumber ?? '?'} ({row.doctorName} - {row.email}): {row.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
