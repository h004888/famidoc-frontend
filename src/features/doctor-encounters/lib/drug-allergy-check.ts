function normalizeVi(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export interface AllergyInput {
  allergenType?: string;
  allergenName?: string;
  allergen?: string;
  severity?: string;
}

export interface AllergyConflict {
  drugIndex: number;
  allergenName: string;
  severity: string;
}

export function findAllergyConflicts(
  drugs: Array<{ medicationName: string; activeIngredient?: string }>,
  allergies: Array<string | AllergyInput>,
): AllergyConflict[] {
  const normalizedAllergies = allergies
    .map((item) => {
      if (typeof item === 'string') {
        return { allergenType: 'DRUG', allergenName: item, severity: 'UNKNOWN' };
      }
      return {
        allergenType: item.allergenType ?? 'DRUG',
        allergenName: item.allergenName ?? item.allergen ?? '',
        severity: item.severity ?? 'UNKNOWN',
      };
    })
    .filter((a) => a.allergenName.trim().length > 0);

  const conflicts: AllergyConflict[] = [];
  drugs.forEach((drug, drugIndex) => {
    const med = normalizeVi(drug.medicationName || '');
    const ing = normalizeVi(drug.activeIngredient || '');
    if (!med && !ing) return;

    for (const allergy of normalizedAllergies) {
      const alg = normalizeVi(allergy.allergenName);
      if (!alg) continue;
      const matchesName =
        (med && (med.includes(alg) || alg.includes(med))) ||
        (ing && (ing.includes(alg) || alg.includes(ing)));
      if (matchesName && (allergy.allergenType === 'DRUG' || matchesName)) {
        conflicts.push({
          drugIndex,
          allergenName: allergy.allergenName,
          severity: allergy.severity,
        });
      }
    }
  });
  return conflicts;
}
