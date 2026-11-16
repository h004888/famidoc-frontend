'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Handshake,
  Search,
  X,
} from 'lucide-react';
import { contractsApi, extractErrorMessage } from '@/lib/api';
import { facilitiesApi, type AdminFacilityItem } from '@/lib/api/facilities.api';
import { toast } from 'sonner';
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
import { cn } from '@/lib/utils';

export interface CreateB2BContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateB2BContractDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateB2BContractDialogProps) {
  const [facilitiesList, setFacilitiesList] = useState<AdminFacilityItem[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [facilitySearchText, setFacilitySearchText] = useState('');
  const [isFacilityPickerOpen, setIsFacilityPickerOpen] = useState(false);
  const [facilityFilterTab, setFacilityFilterTab] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const [newFacilityShare, setNewFacilityShare] = useState(85);
  const [validFromDate, setValidFromDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [validToDate, setValidToDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  const facilityPickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        facilityPickerRef.current &&
        !facilityPickerRef.current.contains(event.target as Node)
      ) {
        setIsFacilityPickerOpen(false);
      }
    }
    if (isFacilityPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFacilityPickerOpen]);

  useEffect(() => {
    if (open && facilitiesList.length === 0) {
      setIsLoadingFacilities(true);
      facilitiesApi
        .getAdminFacilities({ limit: 100 })
        .then((res) => {
          if (res && Array.isArray(res.data)) {
            setFacilitiesList(res.data);
            const firstActive = res.data.find(
              (f) => f.onboardingStatus === 'ACTIVE' || f.status === 'ACTIVE'
            );
            if (firstActive) {
              setSelectedFacilityId(firstActive.id);
            } else if (res.data.length > 0) {
              setSelectedFacilityId(res.data[0].id);
            }
          }
        })
        .catch((err) => {
          console.warn('Lỗi tải danh sách cơ sở y tế:', err);
        })
        .finally(() => {
          setIsLoadingFacilities(false);
        });
    }
  }, [open, facilitiesList.length]);

  const activeFacilitiesCount = useMemo(
    () =>
      facilitiesList.filter((f) => f.onboardingStatus === 'ACTIVE' || f.status === 'ACTIVE')
        .length,
    [facilitiesList]
  );
  const pendingFacilitiesCount = facilitiesList.length - activeFacilitiesCount;

  const filteredFacilities = useMemo(() => {
    return facilitiesList.filter((fac) => {
      const isActive = fac.onboardingStatus === 'ACTIVE' || fac.status === 'ACTIVE';
      if (facilityFilterTab === 'ACTIVE' && !isActive) return false;
      if (facilityFilterTab === 'PENDING' && isActive) return false;

      if (!facilitySearchText.trim()) return true;
      const query = facilitySearchText.toLowerCase();
      return (
        fac.facilityName.toLowerCase().includes(query) ||
        fac.representativeName.toLowerCase().includes(query) ||
        (fac.address && fac.address.toLowerCase().includes(query)) ||
        (fac.phone && fac.phone.includes(query)) ||
        (fac.email && fac.email.toLowerCase().includes(query))
      );
    });
  }, [facilitiesList, facilityFilterTab, facilitySearchText]);

  const selectedFacility = facilitiesList.find((f) => f.id === selectedFacilityId);
  const isSelectedActive =
    selectedFacility?.onboardingStatus === 'ACTIVE' || selectedFacility?.status === 'ACTIVE';

  const dateRangeError =
    validFromDate && validToDate && validToDate <= validFromDate
      ? 'Ngày kết thúc hiệu lực phải sau ngày bắt đầu.'
      : null;

  const shareError =
    newFacilityShare < 50 || newFacilityShare > 95 || Number.isNaN(newFacilityShare)
      ? 'Tỷ lệ chia sẻ cho CSYT phải nằm trong khoảng 50% đến 95%.'
      : null;

  const handleComboboxKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const isFilterOrClearBtn =
      target?.dataset?.pickerControl === 'true';

    if (!isFacilityPickerOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsFacilityPickerOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsFacilityPickerOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        filteredFacilities.length === 0 ? 0 : (prev + 1) % filteredFacilities.length
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        filteredFacilities.length === 0
          ? 0
          : (prev - 1 + filteredFacilities.length) % filteredFacilities.length
      );
    } else if (
      e.key === 'Enter' &&
      !isFilterOrClearBtn &&
      filteredFacilities[highlightedIndex]
    ) {
      e.preventDefault();
      setSelectedFacilityId(filteredFacilities[highlightedIndex].id);
      setIsFacilityPickerOpen(false);
      triggerRef.current?.focus();
    }
  };

  const handleCreateB2BDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dateRangeError || shareError) return;
    if (!selectedFacilityId || !selectedFacility) {
      toast.error('Vui lòng chọn một Cơ sở y tế đối tác từ danh sách.');
      return;
    }

    setIsCreatingDraft(true);
    try {
      await contractsApi.createStaffingContract({
        facilityId: selectedFacilityId,
        platformCommissionRate: 100 - newFacilityShare,
        facilityRevenueRate: newFacilityShare,
        startDate: validFromDate,
        endDate: validToDate,
      });
      toast.success(
        `Đã khởi tạo dự thảo hợp đồng B2B với "${selectedFacility.facilityName}" thành công!`
      );
      onOpenChange(false);
      onCreated();
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Không thể tạo hợp đồng B2B trên máy chủ.'));
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const activeOptionId =
    isFacilityPickerOpen && filteredFacilities[highlightedIndex]
      ? `b2b-facility-option-${filteredFacilities[highlightedIndex].id}`
      : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setIsFacilityPickerOpen(false);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="max-w-lg rounded-2xl p-6 overflow-visible"
        onEscapeKeyDown={(event) => {
          if (isFacilityPickerOpen) {
            event.preventDefault();
            setIsFacilityPickerOpen(false);
            triggerRef.current?.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Handshake className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>Thiết Lập Dự Thảo Hợp Đồng B2B</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Khởi tạo hợp đồng khung cung ứng nhân lực y tế giữa nền tảng FamiDoc và Cơ sở y tế đối tác.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateB2BDraft} className="space-y-4 pt-2">
          {/* Facility Combobox */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label htmlFor="b2b-facility-combobox" className="text-xs font-semibold text-slate-700">
                Cơ sở y tế đối tác <span className="text-rose-500">*</span>
              </Label>
              {!isLoadingFacilities && facilitiesList.length > 0 && (
                <span className="text-[11px] font-medium text-slate-500 tabular-nums">
                  Tổng {facilitiesList.length} cơ sở y tế
                </span>
              )}
            </div>

            {isLoadingFacilities ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                <span>Đang nạp danh sách cơ sở y tế...</span>
              </div>
            ) : facilitiesList.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Chưa có cơ sở y tế nào trên hệ thống.{' '}
                <Link href="/admin/facilities" className="font-bold underline">
                  Thêm hoặc duyệt CSYT ngay
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div ref={facilityPickerRef} className="relative" onKeyDown={handleComboboxKeyDown}>
                  <button
                    id="b2b-facility-combobox"
                    ref={triggerRef}
                    type="button"
                    role="combobox"
                    aria-expanded={isFacilityPickerOpen}
                    aria-controls="b2b-facility-listbox"
                    aria-haspopup="listbox"
                    aria-activedescendant={activeOptionId}
                    onClick={() => setIsFacilityPickerOpen((prev) => !prev)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-xl border bg-white p-2.5 text-left shadow-xs transition-all hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer',
                      isFacilityPickerOpen ? 'border-primary ring-2 ring-primary/20' : 'border-slate-300'
                    )}
                  >
                    {selectedFacility ? (
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-bold text-slate-900">
                            {selectedFacility.facilityName}
                          </span>
                          <span
                            className={cn(
                              'rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                              isSelectedActive
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-amber-200 bg-amber-50 text-amber-700'
                            )}
                          >
                            {isSelectedActive ? 'Đủ ĐK ký HĐ' : 'Chờ duyệt'}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          Đại diện: <strong>{selectedFacility.representativeName}</strong> ·{' '}
                          {selectedFacility.phone}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 py-1 text-xs text-slate-400">
                        <Building2 className="h-4 w-4" aria-hidden="true" />
                        <span>Chọn một Cơ sở y tế đối tác từ danh sách</span>
                      </div>
                    )}

                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200',
                        isFacilityPickerOpen && 'rotate-180 text-primary'
                      )}
                    />
                  </button>

                  {isFacilityPickerOpen && (
                    <div
                      id="b2b-facility-listbox"
                      role="listbox"
                      aria-label="Danh sách cơ sở y tế đối tác"
                      className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
                    >
                      <div className="space-y-2 border-b border-slate-100 bg-slate-50/90 p-2.5">
                        <div className="relative">
                          <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400"
                          />
                          <input
                            type="text"
                            aria-label="Tìm kiếm cơ sở y tế"
                            value={facilitySearchText}
                            onChange={(e) => {
                              setFacilitySearchText(e.target.value);
                              setHighlightedIndex(0);
                            }}
                            placeholder="Tìm theo tên, người đại diện, SĐT..."
                            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-7 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                            autoFocus
                          />
                          {facilitySearchText && (
                            <button
                              type="button"
                              data-picker-control="true"
                              aria-label="Xóa từ khóa tìm cơ sở y tế"
                              onClick={() => setFacilitySearchText('')}
                              className="absolute right-2 top-1.5 rounded p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px]">
                          {(
                            [
                              ['ALL', `Tất cả (${facilitiesList.length})`],
                              ['ACTIVE', `Đủ ĐK (${activeFacilitiesCount})`],
                              ['PENDING', `Chờ duyệt (${pendingFacilitiesCount})`],
                            ] as const
                          ).map(([tabKey, tabLabel]) => (
                            <button
                              key={tabKey}
                              type="button"
                              data-picker-control="true"
                              aria-pressed={facilityFilterTab === tabKey}
                              onClick={() => {
                                setFacilityFilterTab(tabKey);
                                setHighlightedIndex(0);
                              }}
                              className={cn(
                                'rounded-md px-2 py-0.5 font-semibold transition-colors cursor-pointer',
                                facilityFilterTab === tabKey
                                  ? 'bg-slate-900 text-white'
                                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                              )}
                            >
                              {tabLabel}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="max-h-52 divide-y divide-slate-100 overflow-y-auto p-1.5">
                        {filteredFacilities.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            Không tìm thấy cơ sở y tế nào phù hợp.
                          </div>
                        ) : (
                          filteredFacilities.map((fac, idx) => {
                            const isSelected = fac.id === selectedFacilityId;
                            const isHighlighted = idx === highlightedIndex;
                            const isFacActive =
                              fac.onboardingStatus === 'ACTIVE' || fac.status === 'ACTIVE';

                            return (
                              <button
                                key={fac.id}
                                id={`b2b-facility-option-${fac.id}`}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setSelectedFacilityId(fac.id);
                                  setIsFacilityPickerOpen(false);
                                  triggerRef.current?.focus();
                                }}
                                className={cn(
                                  'flex w-full items-start justify-between gap-2.5 rounded-lg p-2.5 text-left transition-colors cursor-pointer',
                                  isSelected
                                    ? 'bg-primary/10 text-slate-900'
                                    : isHighlighted
                                      ? 'bg-slate-100 text-slate-900'
                                      : 'hover:bg-slate-50 text-slate-700'
                                )}
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-slate-900">
                                    {fac.facilityName}
                                  </p>
                                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                    Đại diện: <strong>{fac.representativeName}</strong> · {fac.phone}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                  <span
                                    className={cn(
                                      'rounded border px-1.5 py-0.5 text-[10px] font-bold',
                                      isFacActive
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : 'border-amber-200 bg-amber-50 text-amber-700'
                                    )}
                                  >
                                    {isFacActive ? 'ACTIVE' : 'Chờ duyệt'}
                                  </span>
                                  {isSelected && (
                                    <CheckCircle2
                                      className="h-4 w-4 text-primary"
                                      aria-hidden="true"
                                    />
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedFacility && (
                  <div
                    className={cn(
                      'rounded-xl border p-3 text-xs',
                      isSelectedActive
                        ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
                        : 'border-amber-200 bg-amber-50/70 text-amber-900'
                    )}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{selectedFacility.facilityName}</span>
                      <span className="rounded-full border bg-white px-2 py-0.5 text-[10px] uppercase">
                        {isSelectedActive ? 'Đủ điều kiện pháp lý' : selectedFacility.onboardingStatus}
                      </span>
                    </div>
                    {!isSelectedActive && (
                      <div className="mt-2 flex items-start gap-1.5 border-t border-amber-200/80 pt-1.5 text-[11px]">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          CSYT chưa hoàn tất thẩm định pháp lý. Kiểm tra tại{' '}
                          <Link
                            href={`/admin/facilities/${selectedFacility.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-0.5 font-bold underline"
                          >
                            Trang thẩm định CSYT
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </Link>
                          .
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Revenue Share Slider + Input */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label htmlFor="b2b-facility-share" className="text-xs font-semibold text-slate-700">
                Tỷ lệ chia sẻ doanh thu CSYT (%) <span className="text-rose-500">*</span>
              </Label>
              <span className="text-xs font-bold text-primary tabular-nums">
                {newFacilityShare}% CSYT / {100 - newFacilityShare}% FamiDoc
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                aria-label="Thanh trượt tỷ lệ chia sẻ doanh thu CSYT"
                min={50}
                max={95}
                value={Number.isNaN(newFacilityShare) ? 85 : newFacilityShare}
                onChange={(e) => setNewFacilityShare(Number(e.target.value))}
                className="h-2 flex-1 cursor-pointer accent-primary"
              />
              <Input
                id="b2b-facility-share"
                type="number"
                min={50}
                max={95}
                aria-invalid={Boolean(shareError)}
                aria-describedby={shareError ? 'b2b-share-error' : undefined}
                value={newFacilityShare}
                onChange={(e) => setNewFacilityShare(Number(e.target.value))}
                className="w-20 text-center text-xs font-bold tabular-nums"
              />
            </div>
            {shareError && (
              <p id="b2b-share-error" role="alert" className="mt-1 text-[11px] font-medium text-rose-600">
                {shareError}
              </p>
            )}
          </div>

          {/* Validity Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="b2b-valid-from" className="mb-1 block text-xs font-semibold text-slate-700">
                Ngày bắt đầu hiệu lực
              </Label>
              <Input
                id="b2b-valid-from"
                type="date"
                value={validFromDate}
                onChange={(e) => setValidFromDate(e.target.value)}
                className="text-xs tabular-nums"
              />
            </div>
            <div>
              <Label htmlFor="b2b-valid-to" className="mb-1 block text-xs font-semibold text-slate-700">
                Ngày kết thúc hiệu lực
              </Label>
              <Input
                id="b2b-valid-to"
                type="date"
                value={validToDate}
                aria-invalid={Boolean(dateRangeError)}
                aria-describedby={dateRangeError ? 'b2b-date-error' : undefined}
                onChange={(e) => setValidToDate(e.target.value)}
                className="text-xs tabular-nums"
              />
            </div>
          </div>
          {dateRangeError && (
            <p id="b2b-date-error" role="alert" className="-mt-2 text-[11px] font-medium text-rose-600">
              {dateRangeError}
            </p>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs cursor-pointer"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isCreatingDraft || !selectedFacilityId || Boolean(dateRangeError || shareError)}
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              {isCreatingDraft ? 'Đang tạo...' : 'Lưu & Gửi Dự Thảo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
