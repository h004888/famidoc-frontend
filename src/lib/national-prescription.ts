/**
 * Mô đun mô phỏng và chuẩn hóa dữ liệu đơn thuốc điện tử theo chuẩn liên thông
 * Hệ thống Thông tin Quốc gia về Quản lý Kê đơn thuốc và Bán thuốc theo đơn
 * (Cổng Đơn thuốc Quốc gia - donthuocquocgia.vn - Cục Quản lý Khám, chữa bệnh, Bộ Y tế).
 * Tham chiếu mẫu đơn ngoại trú: Thông tư 26/2025/TT-BYT. Đây là dữ liệu mô phỏng, chưa gửi lên hệ thống quốc gia.
 *
 * Lưu ý tích hợp: Mã liên thông CSYT (ma_cskcb), mã định danh bác sĩ (ma_lien_thong_bac_si),
 * số CCHN và chữ ký số sẽ được điền thật ở bước tích hợp chứng thư số & liên thông CSYT.
 */

export type NationalEncounterType = 'HOME_VISIT' | 'TELEHEALTH';

export interface NationalDrugItem {
  stt: number;
  ma_thuoc?: string; // Mã thuốc / mã hoạt chất theo danh mục Bộ Y tế
  biet_duoc: string; // Tên thuốc / biệt dược
  ten_thuoc: string; // Hoạt chất chính
  ham_luong?: string; // Hàm lượng / nồng độ (ví dụ 500mg, 5mg)
  don_vi_tinh: string; // Đơn vị tính (Viên, Gói, Lọ, Chai...)
  so_luong: number; // Tổng số lượng
  cach_dung: string; // Hướng dẫn sử dụng (liều mỗi lần, đường dùng, tần suất)
  duong_dung?: string; // Đường dùng (Uống, Tiêm, Bôi...)
  so_ngay_dung?: number; // Số ngày dùng thuốc
}

export interface NationalDiagnosisItem {
  ma_benh: string; // Mã bệnh ICD-10 (ví dụ I10, E11, J00)
  ten_benh: string; // Tên diễn giải chẩn đoán
}

export interface NationalPrescriptionPayload {
  loai_don_thuoc: 'c' | 'n' | 'h' | 'y'; // 'c': đơn thuốc tân dược thông thường
  ma_don_thuoc: string; // Chuẩn 14 ký tự xxxxxyyyyyyy-z (5 ký tự mã CSYT + 7 ký tự định danh + -c)
  ho_ten_benh_nhan: string;
  ma_dinh_danh_cong_dan?: string; // Số định danh cá nhân 12 chữ số
  so_giay_to_tuy_than?: string; // CMT/CCCD hoặc hộ chiếu (nếu có)
  ma_the_bhyt?: string; // Mã số thẻ BHYT (nếu có)
  dan_toc?: string;
  ngay_sinh_benh_nhan: string; // DD/MM/YYYY
  gioi_tinh: '1' | '2' | '3'; // 1: Nam, 2: Nữ, 3: Khác
  can_nang?: number; // Cân nặng (kg)
  so_thang_tuoi?: number;
  dia_chi?: string;
  dien_thoai?: string;
  ho_ten_nguoi_giam_ho?: string; // Bố, mẹ hoặc người đưa trẻ đến khám
  hinh_thuc_dieu_tri: 'NGOAI_TRU' | 'NOI_TRU';
  hinh_thuc_kham: '1' | '2'; // 1: Khám tại nhà / trực tiếp, 2: Khám từ xa (Telehealth)
  ma_cskcb: string; // 5 ký tự mã CSYT do Bộ Y tế cấp (chờ tích hợp)
  ten_cskcb: string; // Tên CSYT
  dia_chi_cskcb?: string;
  bac_si_ke_don: {
    ho_ten: string;
    so_cchn: string; // Chờ tích hợp
    ma_lien_thong_bac_si: string; // Chờ tích hợp
    chu_ky_so: string; // Chờ tích hợp ký số
  };
  chan_doan: NationalDiagnosisItem[];
  ket_luan?: string;
  luu_y?: string;
  thong_tin_don_thuoc: NationalDrugItem[];
  so_ngay_dung: number;
  hen_tai_kham_sau_ngay?: number;
  loi_dan?: string;
  ngay_ke_don: string; // ISO 8601
  trang_thai_don_thuoc: 'ISSUED' | 'DISPENSED' | 'EXPIRED' | 'CANCELLED';
  thoi_han_don_thuoc: string | null; // Tối đa 05 ngày kể từ ngày kê đơn (TT 26/2025/TT-BYT); null nếu đơn đã thu hồi/thay thế
}

export interface NationalPrescriptionSyncResult {
  success: boolean;
  isSimulation: boolean;
  ma_don_thuoc_quoc_gia: string;
  ma_tra_cuu: string;
  qr_code_url: string;
  thoi_gian_tiep_nhan: string;
  trang_thai_dong_bo:
    'READY_FOR_PORTAL_INTEGRATION' | 'SYNCED_NATIONAL_PORTAL' | 'PENDING';
  co_so_kcb: string;
  bac_si_ke_don: string;
  raw_payload: NationalPrescriptionPayload;
}

const CODE_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

/**
 * Tạo chuỗi ký tự ổn định (deterministic) từ seed để mã mô phỏng không đổi mỗi lần render.
 */
function deterministicSegment(seed: string, length: number): string {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let out = '';
  let state = hash >>> 0;
  for (let i = 0; i < length; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    out += CODE_ALPHABET[state % CODE_ALPHABET.length];
  }
  return out;
}

/**
 * Sinh mã đơn thuốc chuẩn cấu trúc 14 ký tự theo Quyết định 808/QĐ-BYT:
 * xxxxxyyyyyyy-z (5 ký tự mã CSYT + 7 ký tự định danh đơn + -c).
 */
export function generateNationalPrescriptionCode(
  maCskcb = '00000',
  loaiDon = 'c',
  seed?: string,
): string {
  const cleanCskcb = maCskcb
    .replace(/[^a-z0-9]/gi, '')
    .padEnd(5, '0')
    .slice(0, 5)
    .toLowerCase();
  const body = seed
    ? deterministicSegment(seed, 7)
    : Array.from(
        { length: 7 },
        () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)],
      ).join('');
  return `${cleanCskcb}${body}-${loaiDon}`;
}

/**
 * Định dạng ngày sinh sang DD/MM/YYYY theo chuẩn Bộ Y tế.
 */
export function formatBirthDateVN(dateStr?: string): string {
  if (!dateStr) return 'Chưa có thông tin';
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Tính ngày hết hạn đơn thuốc (tối đa 05 ngày kể từ ngày kê đơn theo TT 26/2025/TT-BYT).
 */
export function computePrescriptionExpiryDate(prescribedAt?: string): string {
  const base = prescribedAt ? new Date(prescribedAt) : new Date();
  const safeBase = Number.isFinite(base.getTime()) ? base : new Date();
  const validUntil = new Date(safeBase.getTime() + 5 * 24 * 60 * 60 * 1000);
  return validUntil.toISOString().slice(0, 10);
}

/**
 * Đóng gói Payload JSON đơn thuốc điện tử chuẩn Quyết định 808/QĐ-BYT
 * từ dữ liệu thật bác sĩ đã kê và lưu trong hệ thống.
 */
export function buildNationalPrescriptionPayload(params: {
  prescriptionSeed?: string;
  prescriptionStatus?: 'ISSUED' | 'DISPENSED' | 'EXPIRED' | 'CANCELLED';
  prescribedAt?: string;
  validUntil?: string;
  encounterType: NationalEncounterType;
  patientName: string;
  patientDob?: string;
  patientGender?: string;
  weightKg?: number;
  ageMonths?: number;
  citizenId?: string;
  identityDocument?: string;
  insuranceNumber?: string;
  ethnicity?: string;
  patientAddress?: string;
  patientPhone?: string;
  caregiverName?: string;
  conclusion?: string;
  precautions?: string;
  treatmentMode?: 'INPATIENT' | 'OUTPATIENT';
  followUpDays?: number;
  doctorName: string;
  doctorCchn?: string;
  doctorPortalId?: string;
  facilityName?: string;
  facilityAddress?: string;
  facilityCode?: string;
  icd10Code?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  instructions?: string;
  drugs: Array<{
    medicationCode?: string;
    activeIngredient?: string;
    medicationName: string;
    strength?: string;
    administrationRoute?: string;
    dosage?: string;
    frequency?: string;
    quantity: number;
    unit: string;
    durationDays: number;
  }>;
}): {
  payload: NationalPrescriptionPayload;
  syncResult: NationalPrescriptionSyncResult;
} {
  const facilityCode = params.facilityCode?.trim() || '00000';
  const facilityName =
    params.facilityName?.trim() || 'Chờ tích hợp tên CSYT liên thông';
  const seed =
    params.prescriptionSeed ||
    `${params.patientName}-${params.prescribedAt || 'rx'}`;
  const maDonThuoc = generateNationalPrescriptionCode(facilityCode, 'c', seed);
  const baseDate = params.prescribedAt
    ? new Date(params.prescribedAt)
    : new Date();
  const safeDate = Number.isFinite(baseDate.getTime()) ? baseDate : new Date();
  const expiryDate =
    params.validUntil?.slice(0, 10) ||
    computePrescriptionExpiryDate(safeDate.toISOString());

  const maxDuration = params.drugs.reduce(
    (max, d) => Math.max(max, Number(d.durationDays) || 1),
    1,
  );

  const genderCode: '1' | '2' | '3' =
    params.patientGender === 'FEMALE'
      ? '2'
      : params.patientGender === 'MALE'
        ? '1'
        : '3';

  const payload: NationalPrescriptionPayload = {
    loai_don_thuoc: 'c',
    ma_don_thuoc: maDonThuoc,
    ho_ten_benh_nhan: (params.patientName || 'BỆNH NHÂN').toUpperCase(),
    ...(params.citizenId ? { ma_dinh_danh_cong_dan: params.citizenId } : {}),
    ...(params.identityDocument
      ? { so_giay_to_tuy_than: params.identityDocument }
      : {}),
    ...(params.insuranceNumber ? { ma_the_bhyt: params.insuranceNumber } : {}),
    ...(params.ethnicity ? { dan_toc: params.ethnicity } : {}),
    ngay_sinh_benh_nhan: formatBirthDateVN(params.patientDob),
    gioi_tinh: genderCode,
    ...(params.weightKg ? { can_nang: params.weightKg } : {}),
    ...(params.ageMonths !== undefined && params.ageMonths < 72
      ? { so_thang_tuoi: params.ageMonths }
      : {}),
    ...(params.patientAddress ? { dia_chi: params.patientAddress } : {}),
    ...(params.patientPhone ? { dien_thoai: params.patientPhone } : {}),
    ...(params.caregiverName
      ? { ho_ten_nguoi_giam_ho: params.caregiverName }
      : {}),
    hinh_thuc_dieu_tri:
      params.treatmentMode === 'INPATIENT' ? 'NOI_TRU' : 'NGOAI_TRU',
    hinh_thuc_kham: params.encounterType === 'TELEHEALTH' ? '2' : '1',
    ma_cskcb: params.facilityCode?.trim() || 'CHUA_TICH_HOP',
    ten_cskcb: facilityName,
    ...(params.facilityAddress
      ? { dia_chi_cskcb: params.facilityAddress }
      : {}),
    bac_si_ke_don: {
      ho_ten: params.doctorName,
      so_cchn: params.doctorCchn?.trim() || 'CHUA_TICH_HOP',
      ma_lien_thong_bac_si: params.doctorPortalId?.trim() || 'CHUA_TICH_HOP',
      chu_ky_so: 'CHUA_KY_SO',
    },
    chan_doan: [
      {
        ma_benh: params.icd10Code?.trim() || 'CHUA_CO',
        ten_benh: params.diagnosis?.trim() || 'Chưa ghi nhận chẩn đoán',
      },
    ],
    ...(params.conclusion ? { ket_luan: params.conclusion } : {}),
    ...(params.precautions ? { luu_y: params.precautions } : {}),
    thong_tin_don_thuoc: params.drugs.map((d, index) => ({
      stt: index + 1,
      ...(d.medicationCode ? { ma_thuoc: d.medicationCode } : {}),
      biet_duoc: d.medicationName,
      ten_thuoc: d.activeIngredient?.trim() || d.medicationName,
      ham_luong: d.strength || undefined,
      don_vi_tinh: d.unit,
      so_luong: Number(d.quantity) || 1,
      cach_dung: [d.dosage, d.administrationRoute, d.frequency]
        .filter(Boolean)
        .join(' · '),
      duong_dung: d.administrationRoute || undefined,
      so_ngay_dung: Number(d.durationDays) || 1,
    })),
    so_ngay_dung: maxDuration,
    ...(params.followUpDays
      ? { hen_tai_kham_sau_ngay: params.followUpDays }
      : {}),
    ...(params.instructions ? { loi_dan: params.instructions } : {}),
    ngay_ke_don: safeDate.toISOString(),
    trang_thai_don_thuoc: params.prescriptionStatus ?? 'ISSUED',
    thoi_han_don_thuoc:
      params.prescriptionStatus === 'CANCELLED' ? null : expiryDate,
  };

  const pinCode = `PIN-${deterministicSegment(`pin-${seed}`, 6).toUpperCase()}`;

  const syncResult: NationalPrescriptionSyncResult = {
    success: true,
    isSimulation: true,
    ma_don_thuoc_quoc_gia: maDonThuoc,
    ma_tra_cuu: pinCode,
    qr_code_url: `https://donthuocquocgia.vn/tra-cuu/${maDonThuoc}`,
    thoi_gian_tiep_nhan: safeDate.toISOString(),
    trang_thai_dong_bo: 'READY_FOR_PORTAL_INTEGRATION',
    co_so_kcb: `${facilityName} (${params.facilityCode?.trim() ? `Mã: ${params.facilityCode}` : 'Mã CSYT chờ tích hợp'})`,
    bac_si_ke_don: `${params.doctorName} (${params.doctorCchn?.trim() ? `CCHN: ${params.doctorCchn}` : 'Mã bác sĩ & ký số chờ tích hợp'})`,
    raw_payload: payload,
  };

  return { payload, syncResult };
}
