import type { AdminCarePackageItem, PackageTerms } from '@/lib/api/admin-packages.api';
import { extractErrorMessage } from '@/lib/api/error-handler';
import { ApiError } from '@/lib/http/errors';

const maxPrice = 9_999_999_999;
const maxVisits = 100_000;
const integerFormat = new Intl.NumberFormat('vi-VN');

export const packageNumberFields = {
  durationMonths: { label: 'Thời hạn gói (tháng)', min: 1, max: 1200 },
  includedMembers: { label: 'Số thành viên mặc định', min: 1, max: 10 },
  maxMembers: { label: 'Số thành viên tối đa', min: 1, max: 10 },
  additionalMemberMonthlyPriceVnd: { label: 'Phụ phí mỗi người thêm / tháng (VND)', min: 0, max: maxPrice },
  homeVisitUnitPriceVnd: { label: 'Đơn giá lượt khám tại nhà (VND)', min: 1, max: maxPrice },
  homeVisits: { label: 'Lượt khám tại nhà', min: 1, max: maxVisits },
  videoConsultations: { label: 'Lượt tư vấn video', min: 1, max: maxVisits },
  priceVnd: { label: 'Giá gói trọn kỳ (VND)', min: 1, max: maxPrice },
};

export type PackageNumberField = keyof typeof packageNumberFields;
type PackageFormSettings = Pick<PackageTerms, 'name' | 'description'>;
export type PackageForm = PackageFormSettings & { amounts: Record<PackageNumberField, string> };
export type PackageField = keyof PackageFormSettings | PackageNumberField;
export type PackageFieldErrors = Partial<Record<PackageField, string>>;

export function createPackageForm(item: AdminCarePackageItem | null): PackageForm {
  return {
    name: item?.name ?? '',
    description: item?.description ?? '',
    amounts: {
      durationMonths: String(item?.durationMonths ?? 1),
      includedMembers: String(item?.includedMembers ?? 1),
      maxMembers: String(item?.maxMembers ?? 1),
      additionalMemberMonthlyPriceVnd: String(item?.additionalMemberMonthlyPriceVnd ?? 0),
      homeVisitUnitPriceVnd: item?.homeVisitUnitPriceVnd?.toString() ?? '',
      homeVisits: String(item?.quotas.homeVisits ?? 1),
      videoConsultations: String(item?.quotas.videoConsultations ?? 1),
      priceVnd: item?.priceVnd.toString() ?? '',
    },
  };
}

export function getPackagePrice(form: PackageForm, requiresUnitPrice: boolean): string {
  const { homeVisitUnitPriceVnd, homeVisits, priceVnd } = form.amounts;
  if (!homeVisitUnitPriceVnd) return requiresUnitPrice ? '' : priceVnd;
  if (getPackageNumberError('homeVisitUnitPriceVnd', homeVisitUnitPriceVnd) || getPackageNumberError('homeVisits', homeVisits)) return '';
  return String(Number(homeVisitUnitPriceVnd) * Number(homeVisits));
}

function getPackageNumberError(field: PackageNumberField, value: string): string | undefined {
  const { min, max } = packageNumberFields[field];
  if (!value) return 'Vui lòng nhập giá trị cho ô này.';
  if (!/^\d+$/.test(value)) return 'Chỉ nhập chữ số từ 0 đến 9.';
  const amount = Number(value);
  if (amount < min || amount > max) {
    if (field === 'durationMonths' && amount < 1) {
      return 'Thời hạn gói phải lớn hơn 0 tháng.';
    }
    if ((field === 'homeVisits' || field === 'videoConsultations') && amount < 1) {
      return `${packageNumberFields[field].label} phải lớn hơn 0.`;
    }
    return `Vui lòng nhập từ ${integerFormat.format(min)} đến ${integerFormat.format(max)}.`;
  }
}

const nameError = 'Tên gói phải có từ 5 đến 50 ký tự, trong đó có ít nhất một chữ cái.';
const descriptionError = 'Mô tả phải có từ 20 đến 2.000 ký tự, trong đó có ít nhất một chữ cái.';

export function validatePackageForm(form: PackageForm, item: AdminCarePackageItem | null): PackageFieldErrors {
  const errors: PackageFieldErrors = {};
  const needsUnitPrice = item?.homeVisitUnitPriceVnd !== undefined;
  const name = form.name.trim();
  const description = form.description.trim();
  const nameLength = [...name].length;
  const descriptionLength = [...description].length;
  if (nameLength < 5 || nameLength > 50 || !/\p{L}/u.test(name)) errors.name = nameError;
  if (descriptionLength < 20 || descriptionLength > 2000 || !/\p{L}/u.test(description)) errors.description = descriptionError;

  const fields = Object.keys(packageNumberFields) as PackageNumberField[];
  for (const field of fields) {
    if (field === 'homeVisitUnitPriceVnd' && !needsUnitPrice && !form.amounts[field]) continue;
    const value = field === 'priceVnd' ? getPackagePrice(form, needsUnitPrice) : form.amounts[field];
    const error = getPackageNumberError(field, value);
    if (error) errors[field] = error;
  }

  const { includedMembers, maxMembers, additionalMemberMonthlyPriceVnd } = form.amounts;
  if (!errors.includedMembers && !errors.maxMembers && Number(maxMembers) < Number(includedMembers)) {
    errors.maxMembers = 'Số người tối đa phải từ số người trong giá trở lên.';
  }
  if (!errors.includedMembers && !errors.maxMembers && Number(includedMembers) === Number(maxMembers) && Number(additionalMemberMonthlyPriceVnd) > 0) {
    errors.additionalMemberMonthlyPriceVnd = 'Nhập phụ phí bằng 0 khi gói đã đủ số người tối đa.';
  }
  if (errors.homeVisitUnitPriceVnd || (homeVisitUnitPriceVndError(form) && errors.homeVisits)) {
    delete errors.priceVnd;
  }
  return errors;
}

function homeVisitUnitPriceVndError(form: PackageForm): boolean {
  return Boolean(form.amounts.homeVisitUnitPriceVnd);
}

export function toPackageTerms(
  form: PackageForm,
  requiresUnitPrice: boolean,
): Omit<PackageTerms, 'quotaPeriod' | 'videoQuotaPolicy'> {
  const { amounts } = form;
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    durationMonths: Number(amounts.durationMonths),
    homeVisitUnitPriceVnd: amounts.homeVisitUnitPriceVnd ? Number(amounts.homeVisitUnitPriceVnd) : undefined,
    priceVnd: Number(getPackagePrice(form, requiresUnitPrice)),
    includedMembers: Number(amounts.includedMembers),
    maxMembers: Number(amounts.maxMembers),
    additionalMemberMonthlyPriceVnd: Number(amounts.additionalMemberMonthlyPriceVnd),
    quotas: {
      homeVisits: Number(amounts.homeVisits),
      videoConsultations: Number(amounts.videoConsultations),
    },
  };
}

const formFieldKeys = new Set<PackageField>([
  'name',
  'description',
  'durationMonths',
  'includedMembers',
  'maxMembers',
  'additionalMemberMonthlyPriceVnd',
  'homeVisitUnitPriceVnd',
  'homeVisits',
  'videoConsultations',
  'priceVnd',
]);

export function getPackageApiFieldErrors(cause: unknown): PackageFieldErrors {
  if (!(cause instanceof ApiError)) return {};
  const payload = cause.details as
    | { error?: { invalidParams?: { field?: unknown; message?: unknown }[] } }
    | undefined;
  const params = payload?.error?.invalidParams;
  if (!Array.isArray(params) || params.length === 0) return {};

  const fieldErrors: PackageFieldErrors = {};
  for (const param of params) {
    const rawField = typeof param?.field === 'string' ? param.field : '';
    const mappedField = rawField.replace(/^quotas\./, '') as PackageField;
    if (!formFieldKeys.has(mappedField)) continue;
    const serverMessage = typeof param?.message === 'string' ? param.message.trim() : '';
    const message =
      serverMessage && /[\u00C0-\u01B0\u1EA0-\u1EF9]/u.test(serverMessage)
        ? serverMessage
        : translatePackageField(rawField) ?? 'Giá trị không hợp lệ.';
    if (!fieldErrors[mappedField]) {
      fieldErrors[mappedField] = message;
    }
  }
  return fieldErrors;
}

const apiMessages: Record<string, string> = {
  'package code exists; create a new version instead': 'Mã gói đã tồn tại. Vui lòng thử lại.',
  'package code and version already exist': 'Mã gói và phiên bản đã tồn tại.',
  'package version changed or a draft already exists': 'Phiên bản gói đã thay đổi hoặc mã gói đã tồn tại. Hãy làm mới danh mục rồi thử lại.',
  'care package not found': 'Không tìm thấy gói dịch vụ.',
  'cannot edit a deprecated package': 'Gói đã ngừng bán và không thể chỉnh sửa.',
  'provide at least one field to update': 'Vui lòng nhập ít nhất một thông tin cần cập nhật.',
  'maxmembers cannot be below includedmembers': 'Số người tối đa phải từ số người trong giá trở lên.',
  'additional-member fee must be zero when extra members are disabled': 'Nhập phụ phí bằng 0 khi gói đã đủ số người tối đa.',
  'a package must include at least one consultation or visit': 'Gói phải có ít nhất một lượt khám tại nhà và một lượt tư vấn video.',
  'only a draft can be published': 'Chỉ có thể xuất bản gói đang ở trạng thái bản nháp.',
  'only draft packages can be published': 'Chỉ có thể xuất bản gói đang ở trạng thái bản nháp.',
  'only the latest version can be published': 'Chỉ có thể xuất bản phiên bản mới nhất của gói.',
  'only an active package can be retired': 'Chỉ có thể ngừng bán gói đang bán.',
  'only active packages can be retired': 'Chỉ có thể ngừng bán gói đang bán.',
  'failed to fetch': 'Không kết nối được với máy chủ. Vui lòng thử lại.',
  'service unavailable': 'Máy chủ đang tạm gián đoạn. Vui lòng thử lại sau.',
};

const apiFieldMessages: Record<string, string> = {
  name: nameError,
  description: descriptionError,
  quotas: 'Vui lòng kiểm tra hạn mức khám và tư vấn.',
};

function translatePackageField(path: string): string | undefined {
  const field = path.replace(/^quotas\./, '');
  if (Object.hasOwn(packageNumberFields, field)) {
    const { label, min, max } = packageNumberFields[field as PackageNumberField];
    return `${label} phải là số nguyên từ ${integerFormat.format(min)} đến ${integerFormat.format(max)}.`;
  }
  return Object.hasOwn(apiFieldMessages, path) ? apiFieldMessages[path] : undefined;
}

export function getPackageApiError(cause: unknown, fallback: string): string {
  const status = cause instanceof ApiError ? cause.status : undefined;
  const payload = cause instanceof ApiError
    ? cause.details as {
        error?: {
          detail?: unknown;
          invalidParams?: { field?: unknown; message?: unknown }[];
          conditions?: { message?: unknown }[];
        };
      } | undefined
    : undefined;
  const params = payload?.error?.invalidParams;
  if (Array.isArray(params) && params.length) {
    const messages = params.map((param) => {
      const serverMsg = typeof param?.message === 'string' ? param.message.trim() : '';
      if (serverMsg && /[\u00C0-\u01B0\u1EA0-\u1EF9]/u.test(serverMsg)) {
        return serverMsg;
      }
      const field = typeof param?.field === 'string' ? param.field : '';
      return translatePackageField(field) ?? 'Vui lòng kiểm tra dữ liệu gói đã nhập.';
    });
    return [...new Set(messages)].join(' ');
  }
  const conditions = payload?.error?.conditions;
  if (Array.isArray(conditions) && conditions.length) {
    const messages = conditions
      .map((item) => (typeof item?.message === 'string' ? item.message.trim() : ''))
      .filter(Boolean);
    if (messages.length) return [...new Set(messages)].join(' ');
  }

  const detailMsg = typeof payload?.error?.detail === 'string' ? payload.error.detail.trim() : '';
  if (detailMsg && /[\u00C0-\u01B0\u1EA0-\u1EF9]/u.test(detailMsg)) {
    return detailMsg;
  }

  const rawMessage =
    cause instanceof Error && cause.message.trim() ? cause.message.trim() : '';
  const knownRawMessage = rawMessage
    ? apiMessages[rawMessage.toLowerCase()]
    : undefined;
  if (typeof knownRawMessage === 'string') return knownRawMessage;
  const rawField = /^(?:property )?([\w.]+) (?:must|should)\b/.exec(
    rawMessage,
  )?.[1];
  if (rawField) return translatePackageField(rawField) ?? fallback;

  const message = extractErrorMessage(cause, fallback);
  const knownMessage = apiMessages[message.toLowerCase()];
  if (typeof knownMessage === 'string') return knownMessage;
  const field = /^(?:property )?([\w.]+) (?:must|should)\b/.exec(message)?.[1];
  if (field) return translatePackageField(field) ?? fallback;
  if (/[\u00C0-\u01B0\u1EA0-\u1EF9]/u.test(message)) return message;
  switch (status) {
    case 400:
    case 422: return 'Dữ liệu gói chưa hợp lệ. Vui lòng kiểm tra các trường đã nhập.';
    case 401: return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    case 403: return 'Bạn không có quyền thực hiện thao tác này.';
    case 404: return 'Không tìm thấy gói dịch vụ.';
    case 409: return 'Dữ liệu gói đã thay đổi hoặc bị trùng. Hãy làm mới danh mục rồi thử lại.';
    case 429: return 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.';
    case 502:
    case 503:
    case 504: return 'Máy chủ đang tạm gián đoạn. Vui lòng thử lại sau.';
    default: return fallback;
  }
}
