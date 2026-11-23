'use client';

import React, { useState } from 'react';
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
import {
  extractErrorMessage,
  patientsApi,
  type AllergenType,
  type AllergySeverity,
  type PatientAllergyDto,
} from '@/lib/api';

const ALLERGEN_TYPE_META: Record<
  AllergenType,
  { label: string; icon: string; hint: string; suggestions: string[] }
> = {
  DRUG: {
    label: 'Thuốc',
    icon: 'medication',
    hint: 'Kháng sinh, giảm đau, thuốc gây tê...',
    suggestions: ['Penicillin', 'Aspirin', 'Paracetamol', 'Ibuprofen'],
  },
  FOOD: {
    label: 'Thực phẩm',
    icon: 'restaurant',
    hint: 'Hải sản, đậu phộng, sữa, trứng...',
    suggestions: ['Hải sản', 'Đậu phộng', 'Sữa bò', 'Trứng gà'],
  },
  ENVIRONMENTAL: {
    label: 'Môi trường',
    icon: 'eco',
    hint: 'Phấn hoa, bụi mịn, lông thú, thời tiết...',
    suggestions: ['Phấn hoa', 'Bụi mịn', 'Lông thú cưng', 'Nấm mốc'],
  },
};

const ALLERGEN_TYPE_LABELS: Record<AllergenType, string> = {
  DRUG: 'Thuốc',
  FOOD: 'Thực phẩm',
  ENVIRONMENTAL: 'Môi trường',
};

const ALLERGY_SEVERITY_META: Record<
  AllergySeverity,
  { label: string; description: string; badgeClass: string }
> = {
  MILD: {
    label: 'Mức độ nhẹ',
    description: 'Ngứa nhẹ, mẩn đỏ khu trú, hắt hơi.',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  MODERATE: {
    label: 'Mức độ trung bình',
    description: 'Nổi mề đay lan rộng, sưng môi/mắt nhẹ.',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  LIFE_THREATENING_ANAPHYLAXIS: {
    label: 'Nguy kịch / Sốc phản vệ',
    description: 'Khó thở, phù thanh quản, tụt huyết áp — cảnh báo đỏ trên hồ sơ.',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
};

const COMMON_MANIFESTATIONS = [
  'Nổi mề đay',
  'Ngứa da',
  'Sưng môi / mắt',
  'Khó thở',
  'Buồn nôn / đau bụng',
  'Choáng / tụt huyết áp',
];

export interface MemberPathologySectionProps {
  memberId: string;
  memberName: string;
  chronicDiseases?: string | null;
  allergies: PatientAllergyDto[];
  onChronicUpdated: (chronicDiseases: string | null) => void;
  onAllergyAdded: (allergy: PatientAllergyDto) => void;
  onAllergyDeleted: (allergyId: string) => void;
}

/**
 * Self-managed Level-1 pathology block for chronic conditions and structured allergies.
 */
export function MemberPathologySection({
  memberId,
  memberName,
  chronicDiseases,
  allergies,
  onChronicUpdated,
  onAllergyAdded,
  onAllergyDeleted,
}: MemberPathologySectionProps) {
  const [isEditingChronic, setIsEditingChronic] = useState(false);
  const [chronicDraft, setChronicDraft] = useState(chronicDiseases ?? '');
  const [isSavingChronic, setIsSavingChronic] = useState(false);

  const [showAddAllergyModal, setShowAddAllergyModal] = useState(false);
  const [allergenType, setAllergenType] = useState<AllergenType>('DRUG');
  const [allergenName, setAllergenName] = useState('');
  const [severity, setSeverity] = useState<AllergySeverity>('MILD');
  const [clinicalManifestation, setClinicalManifestation] = useState('');
  const [isSubmittingAllergy, setIsSubmittingAllergy] = useState(false);

  const [deletingAllergy, setDeletingAllergy] = useState<PatientAllergyDto | null>(null);
  const [isDeletingAllergy, setIsDeletingAllergy] = useState(false);

  const handleOpenChronicEdit = () => {
    setChronicDraft(chronicDiseases ?? '');
    setIsEditingChronic(true);
  };

  const handleSaveChronic = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingChronic(true);
    try {
      const normalized = chronicDraft.trim();
      const updated = await patientsApi.updateFamilyMember(memberId, {
        chronicDiseases: normalized,
      });
      onChronicUpdated(updated.chronicDiseases ?? (normalized || null));
      setIsEditingChronic(false);
      toast.success('Đã cập nhật thông tin bệnh lý nền.');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể cập nhật bệnh lý nền.'));
    } finally {
      setIsSavingChronic(false);
    }
  };

  const handleAddAllergySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = allergenName.trim();
    if (!trimmedName) {
      toast.error('Vui lòng nhập tên dị nguyên.');
      return;
    }

    setIsSubmittingAllergy(true);
    try {
      const created = await patientsApi.addMemberAllergy(memberId, {
        allergenType,
        allergenName: trimmedName,
        severity,
        clinicalManifestation: clinicalManifestation.trim() || undefined,
      });
      onAllergyAdded(created);
      setShowAddAllergyModal(false);
      setAllergenType('DRUG');
      setAllergenName('');
      setSeverity('MILD');
      setClinicalManifestation('');
      toast.success(`Đã thêm dị ứng "${created.allergenName}".`);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể thêm thông tin dị ứng.'));
    } finally {
      setIsSubmittingAllergy(false);
    }
  };

  const handleConfirmDeleteAllergy = async () => {
    if (!deletingAllergy?.id) return;
    setIsDeletingAllergy(true);
    try {
      await patientsApi.deleteMemberAllergy(memberId, deletingAllergy.id);
      onAllergyDeleted(deletingAllergy.id);
      toast.success(`Đã xóa dị ứng "${deletingAllergy.allergenName}".`);
      setDeletingAllergy(null);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể xóa thông tin dị ứng.'));
    } finally {
      setIsDeletingAllergy(false);
    }
  };

  const severeAllergies = allergies.filter(
    (a) => a.severity === 'LIFE_THREATENING_ANAPHYLAXIS'
  );

  const toggleManifestationChip = (symptom: string) => {
    const parts = clinicalManifestation
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const exists = parts.some((p) => p.toLowerCase() === symptom.toLowerCase());
    const next = exists
      ? parts.filter((p) => p.toLowerCase() !== symptom.toLowerCase())
      : [...parts, symptom];
    setClinicalManifestation(next.join(', '));
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#2E37A4]" aria-hidden="true">
              medical_information
            </span>
            <span>Bệnh lý &amp; Dị ứng</span>
          </h2>
          <span className="text-xs text-slate-500">
            Thông tin quan trọng hỗ trợ bác sĩ trước khi thăm khám &amp; kê đơn
          </span>
        </div>

        {severeAllergies.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-rose-600 shrink-0" aria-hidden="true">
              warning_amber
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-rose-700">Cảnh báo dị ứng nặng</p>
              <p className="text-xs text-rose-600 mt-0.5">
                Các tác nhân:{' '}
                <span className="font-semibold">
                  {severeAllergies.map((a) => a.allergenName).join(', ')}
                </span>
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chronic Conditions */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="material-symbols-outlined text-[17px] text-[#2E37A4]">
                medical_information
              </span>
              <span>Bệnh lý nền &amp; Theo dõi mạn tính</span>
            </div>
            {!isEditingChronic && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenChronicEdit}
                className="h-7 px-2.5 text-xs"
              >
                Chỉnh sửa bệnh nền
              </Button>
            )}
          </div>

          {isEditingChronic ? (
            <form onSubmit={handleSaveChronic} className="space-y-2.5">
              <Label htmlFor="ehr-chronic-input" className="sr-only">
                Bệnh lý nền và theo dõi mạn tính
              </Label>
              <textarea
                id="ehr-chronic-input"
                rows={3}
                maxLength={1000}
                value={chronicDraft}
                onChange={(e) => setChronicDraft(e.target.value)}
                placeholder="VD: Tăng huyết áp độ 1, Viêm mũi dị ứng thời tiết..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E37A4]"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingChronic(false)}
                  disabled={isSavingChronic}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingChronic}
                  className="bg-[#2E37A4] hover:bg-[#222982] text-white"
                >
                  {isSavingChronic ? 'Đang lưu...' : 'Lưu bệnh lý'}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm font-medium text-slate-800">
              {chronicDiseases?.trim() || 'Chưa ghi nhận bệnh nền mạn tính.'}
            </p>
          )}
        </div>

        {/* Structured Allergies */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="material-symbols-outlined text-[17px] text-rose-600">
                warning
              </span>
              <span>Tiền sử dị ứng ({allergies.length})</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddAllergyModal(true)}
              className="h-7 px-2.5 text-xs"
            >
              + Thêm dị ứng
            </Button>
          </div>

          {allergies.length === 0 ? (
            <p className="text-sm text-slate-600">Chưa ghi nhận tiền sử dị ứng.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allergies.map((allergy, idx) => {
                const sevMeta =
                  ALLERGY_SEVERITY_META[allergy.severity] ||
                  ALLERGY_SEVERITY_META.MILD;
                return (
                  <div
                    key={allergy.id || `${allergy.allergenName}-${idx}`}
                    className={`rounded-xl border px-3 py-2 text-xs space-y-0.5 flex items-start gap-2 ${sevMeta.badgeClass}`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5 font-semibold">
                        <span>{allergy.allergenName}</span>
                        <span>•</span>
                        <span>
                          {ALLERGEN_TYPE_LABELS[allergy.allergenType] || allergy.allergenType}
                        </span>
                        <span>•</span>
                        <span>{sevMeta.label}</span>
                      </div>
                      {allergy.clinicalManifestation && (
                        <p className="text-[11px] opacity-90">
                          Biểu hiện: {allergy.clinicalManifestation}
                        </p>
                      )}
                    </div>
                    {allergy.id && (
                      <button
                        type="button"
                        aria-label={`Xóa dị ứng ${allergy.allergenName}`}
                        onClick={() => setDeletingAllergy(allergy)}
                        className="shrink-0 rounded-md p-0.5 hover:bg-black/10 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">close</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Add Allergy Modal */}
      <Dialog open={showAddAllergyModal} onOpenChange={setShowAddAllergyModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 bg-white shrink-0">
            <DialogTitle className="text-lg font-bold text-slate-900">
              Thêm tiền sử dị ứng
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Ghi nhận dị nguyên và mức độ phản ứng cho hồ sơ sức khỏe của{' '}
              <span className="font-semibold text-slate-700">{memberName}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddAllergySubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Group 1: Thông tin dị nguyên */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#2E37A4]">
                    vaccines
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">Thông tin dị nguyên</h3>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">
                    Nhóm dị nguyên *
                  </Label>
                  <div
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
                    role="radiogroup"
                    aria-label="Nhóm dị nguyên"
                  >
                    {(Object.keys(ALLERGEN_TYPE_META) as AllergenType[]).map((typeKey) => {
                      const meta = ALLERGEN_TYPE_META[typeKey];
                      const selected = allergenType === typeKey;
                      return (
                        <button
                          key={typeKey}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setAllergenType(typeKey)}
                          className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                            selected
                              ? 'border-[#2E37A4] bg-[#2E37A4]/5 ring-1 ring-[#2E37A4]'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`material-symbols-outlined text-[18px] ${
                                selected ? 'text-[#2E37A4]' : 'text-slate-500'
                              }`}
                            >
                              {meta.icon}
                            </span>
                            <span
                              className={`text-xs font-bold ${
                                selected ? 'text-[#2E37A4]' : 'text-slate-800'
                              }`}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500 leading-snug">
                            {meta.hint}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ehr-allergy-name" className="text-xs font-semibold text-slate-700">
                    Tên dị nguyên *
                  </Label>
                  <Input
                    id="ehr-allergy-name"
                    value={allergenName}
                    onChange={(e) => setAllergenName(e.target.value)}
                    placeholder={`VD: ${ALLERGEN_TYPE_META[allergenType].suggestions.slice(0, 2).join(', ')}...`}
                    maxLength={150}
                    required
                    className="bg-white"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">Gợi ý nhanh:</span>
                    {ALLERGEN_TYPE_META[allergenType].suggestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setAllergenName(item)}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-600 hover:border-[#2E37A4] hover:text-[#2E37A4] transition-colors cursor-pointer"
                      >
                        + {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Group 2: Mức độ & Biểu hiện lâm sàng */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-rose-600">
                    warning
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Mức độ &amp; Biểu hiện lâm sàng
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">
                    Mức độ nghiêm trọng *
                  </Label>
                  <div
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
                    role="radiogroup"
                    aria-label="Mức độ nghiêm trọng"
                  >
                    {(Object.keys(ALLERGY_SEVERITY_META) as AllergySeverity[]).map((sevKey) => {
                      const meta = ALLERGY_SEVERITY_META[sevKey];
                      const selected = severity === sevKey;
                      const isSevere = sevKey === 'LIFE_THREATENING_ANAPHYLAXIS';
                      return (
                        <button
                          key={sevKey}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setSeverity(sevKey)}
                          className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                            selected
                              ? isSevere
                                ? 'border-rose-600 bg-rose-50 ring-1 ring-rose-600'
                                : 'border-[#2E37A4] bg-[#2E37A4]/5 ring-1 ring-[#2E37A4]'
                              : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                          }`}
                        >
                          <span
                            className={`block text-xs font-bold ${
                              selected
                                ? isSevere
                                  ? 'text-rose-700'
                                  : 'text-[#2E37A4]'
                                : 'text-slate-800'
                            }`}
                          >
                            {meta.label}
                          </span>
                          <p className="mt-1 text-[11px] text-slate-500 leading-snug">
                            {meta.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="ehr-allergy-manifestation"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Biểu hiện lâm sàng (không bắt buộc)
                  </Label>
                  <textarea
                    id="ehr-allergy-manifestation"
                    rows={2}
                    value={clinicalManifestation}
                    onChange={(e) => setClinicalManifestation(e.target.value)}
                    placeholder="VD: Nổi mề đay, sưng môi, khó thở sau khi tiếp xúc..."
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {COMMON_MANIFESTATIONS.map((symptom) => {
                      const active = clinicalManifestation
                        .toLowerCase()
                        .includes(symptom.toLowerCase());
                      return (
                        <button
                          key={symptom}
                          type="button"
                          onClick={() => toggleManifestationChip(symptom)}
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                            active
                              ? 'border-[#2E37A4] bg-[#2E37A4] text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {symptom}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddAllergyModal(false)}
                disabled={isSubmittingAllergy}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingAllergy}
                className="bg-[#2E37A4] hover:bg-[#222982] text-white"
              >
                {isSubmittingAllergy ? 'Đang lưu...' : 'Lưu dị ứng'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Allergy Modal */}
      <Dialog
        open={Boolean(deletingAllergy)}
        onOpenChange={(open) => {
          if (!open && !isDeletingAllergy) setDeletingAllergy(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa dị ứng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa ghi nhận dị ứng &ldquo;{deletingAllergy?.allergenName}&rdquo;
              của {memberName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingAllergy(null)}
              disabled={isDeletingAllergy}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDeleteAllergy}
              disabled={isDeletingAllergy}
            >
              {isDeletingAllergy ? 'Đang xóa...' : 'Xóa dị ứng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
