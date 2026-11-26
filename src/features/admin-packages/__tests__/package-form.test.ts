import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/http/errors';
import {
  createPackageForm,
  getPackageApiFieldErrors,
  toPackageTerms,
  validatePackageForm,
} from '../package-form';

describe('package-form (rule mới)', () => {
  it('createPackageForm(null) khởi tạo durationMonths=1, homeVisits=1, videoConsultations=1, không có code hay videoQuotaPolicy', () => {
    const form = createPackageForm(null);
    expect(form.amounts.durationMonths).toBe('1');
    expect(form.amounts.homeVisits).toBe('1');
    expect(form.amounts.videoConsultations).toBe('1');
    expect(form).not.toHaveProperty('code');
    expect(form).not.toHaveProperty('videoQuotaPolicy');
  });

  it('validatePackageForm chấp nhận durationMonths tùy chỉnh > 0 và chặn <= 0 cho durationMonths, homeVisits, videoConsultations', () => {
    const base = createPackageForm(null);
    base.name = 'Gói Chăm Sóc Gia Đình Toàn Diện';
    base.description = 'Gói chăm sóc sức khỏe định kỳ tại nhà và tư vấn video.';
    base.amounts.durationMonths = '4';
    base.amounts.priceVnd = '2000000';
    base.amounts.homeVisits = '2';
    base.amounts.videoConsultations = '3';
    expect(validatePackageForm(base, null)).toEqual({});

    const invalid = createPackageForm(null);
    invalid.name = 'Gói Chăm Sóc Gia Đình Toàn Diện';
    invalid.description = 'Gói chăm sóc sức khỏe định kỳ tại nhà và tư vấn video.';
    invalid.amounts.durationMonths = '0';
    invalid.amounts.priceVnd = '2000000';
    invalid.amounts.homeVisits = '0';
    invalid.amounts.videoConsultations = '0';
    const errors = validatePackageForm(invalid, null);
    expect(errors.durationMonths).toBeDefined();
    expect(errors.homeVisits).toBeDefined();
    expect(errors.videoConsultations).toBeDefined();
  });

  it('toPackageTerms trả về payload không có facilityVisits, videoQuotaPolicy, quotaPeriod, code', () => {
    const form = createPackageForm(null);
    form.name = 'Gói Chăm Sóc Gia Đình Toàn Diện';
    form.description = 'Gói chăm sóc sức khỏe định kỳ tại nhà và tư vấn video.';
    form.amounts.durationMonths = '5';
    form.amounts.priceVnd = '1500000';
    form.amounts.homeVisits = '2';
    form.amounts.videoConsultations = '4';

    const payload = toPackageTerms(form, false);
    expect(payload).toEqual({
      name: 'Gói Chăm Sóc Gia Đình Toàn Diện',
      description: 'Gói chăm sóc sức khỏe định kỳ tại nhà và tư vấn video.',
      durationMonths: 5,
      homeVisitUnitPriceVnd: undefined,
      priceVnd: 1500000,
      includedMembers: 1,
      maxMembers: 1,
      additionalMemberMonthlyPriceVnd: 0,
      quotas: {
        homeVisits: 2,
        videoConsultations: 4,
      },
    });
    expect(payload.quotas).not.toHaveProperty('facilityVisits');
  });

  it('getPackageApiFieldErrors ánh xạ đúng error.invalidParams tiếng Việt sang từng field form', () => {
    const err = new ApiError('Dữ liệu đầu vào không hợp lệ.', 422, {
      success: false,
      code: 422,
      data: null,
      meta: null,
      error: {
        title: 'Unprocessable Content',
        errorCode: 'VALIDATION_FAILED',
        detail: 'Tên gói phải có ít nhất 10 ký tự.',
        invalidParams: [
          { field: 'name', issue: 'MIN_LENGTH', message: 'Tên gói phải có ít nhất 10 ký tự.' },
          { field: 'quotas.homeVisits', issue: 'MIN_VALUE', message: 'Số lượt khám tại nhà phải lớn hơn 0.' },
          { field: 'quotas.videoConsultations', issue: 'MIN_VALUE', message: 'Số lượt tư vấn video phải lớn hơn 0.' },
        ],
      },
    });

    expect(getPackageApiFieldErrors(err)).toEqual({
      name: 'Tên gói phải có ít nhất 10 ký tự.',
      homeVisits: 'Số lượt khám tại nhà phải lớn hơn 0.',
      videoConsultations: 'Số lượt tư vấn video phải lớn hơn 0.',
    });
  });
});
