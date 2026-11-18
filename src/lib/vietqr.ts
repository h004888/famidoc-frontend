export interface VietQRBankItem {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
}

export type VietQrTemplate = 'compact2' | 'compact' | 'qr_only' | 'print' | 'loax';

export interface BuildVietQrQuickLinkParams {
  bankId?: string | null;
  accountNumber?: string | null;
  amount?: number | null;
  addInfo?: string | null;
  accountName?: string | null;
  template?: VietQrTemplate;
}

export const FALLBACK_VIETQR_BANKS: VietQRBankItem[] = [
  {
    id: 43,
    name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
    code: 'VCB',
    bin: '970436',
    shortName: 'Vietcombank',
    logo: 'https://api.vietqr.io/img/VCB.png',
    transferSupported: 1,
    lookupSupported: 1,
  },
  {
    id: 17,
    name: 'Ngân hàng TMCP Công thương Việt Nam',
    code: 'ICB',
    bin: '970415',
    shortName: 'VietinBank',
    logo: 'https://api.vietqr.io/img/ICB.png',
    transferSupported: 1,
    lookupSupported: 1,
  },
  {
    id: 4,
    name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
    code: 'BIDV',
    bin: '970418',
    shortName: 'BIDV',
    logo: 'https://api.vietqr.io/img/BIDV.png',
    transferSupported: 1,
    lookupSupported: 1,
  },
  {
    id: 42,
    name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam',
    code: 'VBA',
    bin: '970405',
    shortName: 'Agribank',
    logo: 'https://api.vietqr.io/img/VBA.png',
    transferSupported: 1,
    lookupSupported: 1,
  },
  {
    id: 38,
    name: 'Ngân hàng TMCP Kỹ thương Việt Nam',
    code: 'TCB',
    bin: '970407',
    shortName: 'Techcombank',
    logo: 'https://api.vietqr.io/img/TCB.png',
    transferSupported: 1,
    lookupSupported: 1,
  },
  {
    id: 21,
    name: 'Ngân hàng TMCP Quân đội',
    code: 'MB',
    bin: '970422',
    shortName: 'MBBank',
    logo: 'https://api.vietqr.io/img/MB.png',
    transferSupported: 1,
    lookupSupported: 1,
  },
  {
    id: 2,
    name: 'Ngân hàng TMCP Á Châu',
    code: 'ACB',
    bin: '970416',
    shortName: 'ACB',
    logo: 'https://api.vietqr.io/img/ACB.png',
    transferSupported: 1,
    lookupSupported: 1,
  },
  {
    id: 47,
    name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
    code: 'VPB',
    bin: '970432',
    shortName: 'VPBank',
    logo: 'https://api.vietqr.io/img/VPB.png',
    transferSupported: 1,
    lookupSupported: 1,
  },
  {
    id: 39,
    name: 'Ngân hàng TMCP Tiên Phong',
    code: 'TPB',
    bin: '970423',
    shortName: 'TPBank',
    logo: 'https://api.vietqr.io/img/TPB.png',
    transferSupported: 1,
    lookupSupported: 1,
  },
  {
    id: 36,
    name: 'Ngân hàng TMCP Sài Gòn Thương Tín',
    code: 'STB',
    bin: '970403',
    shortName: 'Sacombank',
    logo: 'https://api.vietqr.io/img/STB.png',
    transferSupported: 1,
    lookupSupported: 1,
  },
  {
    id: 12,
    name: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh',
    code: 'HDB',
    bin: '970437',
    shortName: 'HDBank',
    logo: 'https://api.vietqr.io/img/HDB.png',
    transferSupported: 1,
    lookupSupported: 1,
  },
  {
    id: 45,
    name: 'Ngân hàng TMCP Quốc tế Việt Nam',
    code: 'VIB',
    bin: '970441',
    shortName: 'VIB',
    logo: 'https://api.vietqr.io/img/VIB.png',
    transferSupported: 1,
    lookupSupported: 1,
  },
  {
    id: 35,
    name: 'Ngân hàng TMCP Sài Gòn - Hà Nội',
    code: 'SHB',
    bin: '970443',
    shortName: 'SHB',
    logo: 'https://api.vietqr.io/img/SHB.png',
    transferSupported: 1,
    lookupSupported: 1,
  },
  {
    id: 22,
    name: 'Ngân hàng TMCP Hàng Hải Việt Nam',
    code: 'MSB',
    bin: '970426',
    shortName: 'MSB',
    logo: 'https://api.vietqr.io/img/MSB.png',
    transferSupported: 1,
    lookupSupported: 1,
  },
  {
    id: 26,
    name: 'Ngân hàng TMCP Phương Đông',
    code: 'OCB',
    bin: '970448',
    shortName: 'OCB',
    logo: 'https://api.vietqr.io/img/OCB.png',
    transferSupported: 1,
    lookupSupported: 1,
  },
];

function stripVietnameseDiacritics(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function normalizeLookupText(input: string): string {
  return stripVietnameseDiacritics(input)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function isValidVietQrAccountNumber(accountNumber?: string | null): boolean {
  const trimmed = accountNumber?.trim() ?? '';
  return /^[A-Za-z0-9]{1,19}$/.test(trimmed) && !/^0+$/.test(trimmed);
}

export function normalizeVietQrAccountHolder(raw?: string | null): string {
  if (!raw) return '';
  return stripVietnameseDiacritics(raw)
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasNonAsciiCharacters(raw?: string | null): boolean {
  if (!raw) return false;
  return /[^\x00-\x7F]/.test(raw);
}

/**
 * Chuẩn hóa nội dung chuyển khoản theo quy ước VietQR Quick Link:
 * tối đa 50 ký tự, không chứa ký tự đặc biệt.
 */
export function sanitizeVietQrAddInfo(raw?: string | null): string {
  if (!raw) return '';
  return stripVietnameseDiacritics(raw)
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50)
    .trim();
}

/**
 * Tạo chuỗi tên ngân hàng hiển thị ngắn gọn nhưng đủ pháp nhân, đảm bảo <= 100 ký tự để khớp DB VarChar(100).
 */
export function formatFacilityBankName(
  bank: Pick<VietQRBankItem, 'shortName' | 'name' | 'code'>,
): string {
  const shortName = bank.shortName.trim() || bank.code.trim();
  const fullName = bank.name.trim();
  if (!fullName || fullName.toLowerCase() === shortName.toLowerCase()) {
    return shortName.slice(0, 100);
  }
  const combined = `${shortName} - ${fullName}`;
  return combined.length <= 100 ? combined : shortName.slice(0, 100);
}

export function resolveBankByInput(
  banks: VietQRBankItem[],
  input: {
    bankBin?: string | null;
    bankCode?: string | null;
    bankName?: string | null;
  },
): VietQRBankItem | undefined {
  const catalog = banks.length > 0 ? banks : FALLBACK_VIETQR_BANKS;
  const bin = input.bankBin?.trim();
  if (bin) {
    const byBin = catalog.find((item) => item.bin === bin);
    if (byBin) return byBin;
  }

  const code = input.bankCode?.trim().toUpperCase();
  if (code) {
    const byCode = catalog.find((item) => item.code.toUpperCase() === code);
    if (byCode) return byCode;
  }

  const rawName = input.bankName?.trim();
  if (!rawName) return undefined;

  const normalizedInput = normalizeLookupText(rawName);
  if (!normalizedInput) return undefined;

  const exactMatch = catalog.find((item) => {
    const candidates = [
      item.code,
      item.shortName,
      item.name,
      `${item.shortName} - ${item.name}`,
    ];
    return candidates.some((c) => normalizeLookupText(c) === normalizedInput);
  });
  if (exactMatch) return exactMatch;

  return catalog.find((item) => {
    const normCode = normalizeLookupText(item.code);
    const normShort = normalizeLookupText(item.shortName);
    const normFull = normalizeLookupText(item.name);
    return (
      (normShort.length >= 2 && normalizedInput.includes(normShort)) ||
      (normCode.length >= 2 && normalizedInput === `${normCode}bank`) ||
      (normFull.length >= 6 && normalizedInput.includes(normFull))
    );
  });
}

export function resolveVietQrBankId(
  banks: VietQRBankItem[],
  input: {
    bankBin?: string | null;
    bankCode?: string | null;
    bankName?: string | null;
  },
): string | null {
  const bin = input.bankBin?.trim();
  if (bin && /^[0-9]{4,20}$/.test(bin)) {
    return bin;
  }

  const matched = resolveBankByInput(banks, input);
  if (matched?.bin) {
    return matched.bin;
  }

  const code = input.bankCode?.trim();
  if (code && /^[A-Za-z0-9]{2,20}$/.test(code)) {
    return code;
  }

  const rawName = input.bankName?.trim();
  if (rawName && /^[A-Za-z0-9]{2,20}$/.test(rawName)) {
    return rawName;
  }

  return null;
}

/**
 * Xây dựng URL ảnh VietQR động chuẩn Quick Link SVG-first:
 * https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.svg?...
 */
export function buildVietQrQuickLinkUrl({
  bankId,
  accountNumber,
  amount,
  addInfo,
  accountName,
  template = 'compact2',
}: BuildVietQrQuickLinkParams): string | null {
  const cleanBankId = bankId?.trim() ?? '';
  const cleanAccount = accountNumber?.trim() ?? '';

  if (!/^[A-Za-z0-9]{2,20}$/.test(cleanBankId)) return null;
  if (!isValidVietQrAccountNumber(cleanAccount)) return null;

  if (amount !== undefined && amount !== null) {
    if (
      !Number.isInteger(amount) ||
      amount <= 0 ||
      String(amount).length > 13
    ) {
      return null;
    }
  }

  const baseUrl = `https://img.vietqr.io/image/${encodeURIComponent(cleanBankId)}-${encodeURIComponent(cleanAccount)}-${template}.svg`;
  const params = new URLSearchParams();

  if (amount !== undefined && amount !== null) {
    params.set('amount', String(amount));
  }

  const cleanInfo = sanitizeVietQrAddInfo(addInfo);
  if (cleanInfo) {
    params.set('addInfo', cleanInfo);
  }

  const cleanAccountName = accountName?.trim().replace(/\s+/g, ' ') ?? '';
  if (cleanAccountName) {
    params.set('accountName', cleanAccountName);
  }

  const query = params.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
}
