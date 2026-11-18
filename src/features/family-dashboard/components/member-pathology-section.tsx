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

const ALLERGEN_TYPE_LABELS: Record<AllergenType, string> = {
  DRUG: 'Thuốc',
  FOOD: 'Thực phẩm',
  ENVIRONMENTAL: 'Môi trường',
};

const ALLERGY_SEVERITY_META: Record<
  AllergySeverity,
  { label: string; badgeClass: string }
> = {
  MILD: {
    label: 'Mức độ nhẹ',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  MODERATE: {
    label: 'Mức độ trung bình',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  LIFE_THREATENING_ANAPHYLAXIS: {
    label: 'Nguy kịch / Sốc phản vệ',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
};

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

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-100">
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

      {/* Add Allergy Modal */}
      <Dialog open={showAddAllergyModal} onOpenChange={setShowAddAllergyModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm tiền sử dị ứng</DialogTitle>
            <DialogDescription>
              Ghi nhận dị nguyên cho hồ sơ sức khỏe của {memberName}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAllergySubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ehr-allergy-name">Tên dị nguyên *</Label>
              <Input
                id="ehr-allergy-name"
                value={allergenName}
                onChange={(e) => setAllergenName(e.target.value)}
                placeholder="VD: Penicillin, Hải sản, Phấn hoa..."
                maxLength={150}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ehr-allergy-type">Nhóm dị nguyên *</Label>
                <select
                  id="ehr-allergy-type"
                  value={allergenType}
                  onChange={(e) => setAllergenType(e.target.value as AllergenType)}
                  className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E37A4]"
                >
                  <option value="DRUG">Thuốc</option>
                  <option value="FOOD">Thực phẩm</option>
                  <option value="ENVIRONMENTAL">Môi trường</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ehr-allergy-severity">Mức độ nghiêm trọng *</Label>
                <select
                  id="ehr-allergy-severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as AllergySeverity)}
                  className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E37A4]"
                >
                  <option value="MILD">Mức độ nhẹ</option>
                  <option value="MODERATE">Mức độ trung bình</option>
                  <option value="LIFE_THREATENING_ANAPHYLAXIS">Nguy kịch / Sốc phản vệ</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ehr-allergy-manifestation">Biểu hiện lâm sàng</Label>
              <Input
                id="ehr-allergy-manifestation"
                value={clinicalManifestation}
                onChange={(e) => setClinicalManifestation(e.target.value)}
                placeholder="VD: Nổi mề đay, khó thở, ngứa nhẹ..."
              />
            </div>

            <DialogFooter>
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
