import { describe, expect, it } from 'vitest';
import { findAllergyConflicts } from '../drug-allergy-check';

describe('findAllergyConflicts (Task 16)', () => {
  it('phát hiện xung đột khi dị ứng DRUG trùng tên thuốc hoặc hoạt chất (không phân biệt hoa thường/dấu)', () => {
    const conflicts = findAllergyConflicts(
      [
        { medicationName: 'Amoxicillin 500mg', activeIngredient: 'amoxicilin' },
        { medicationName: 'Paracetamol 500mg', activeIngredient: 'Paracetamol' },
      ],
      [{ allergenType: 'DRUG', allergenName: 'Amoxicilin', severity: 'SEVERE' }],
    );

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      drugIndex: 0,
      allergenName: 'Amoxicilin',
      severity: 'SEVERE',
    });
  });

  it('không báo xung đột khi thuốc không trùng dị ứng', () => {
    const conflicts = findAllergyConflicts(
      [{ medicationName: 'Paracetamol 500mg', activeIngredient: 'Paracetamol' }],
      [{ allergenType: 'DRUG', allergenName: 'Penicillin', severity: 'MILD' }],
    );
    expect(conflicts).toHaveLength(0);
  });
});
