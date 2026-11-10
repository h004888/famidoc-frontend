'use client';

import React from 'react';
import { formatCurrencyVND, cn } from '@/lib/utils';
import type { FourPartyContract, DigitalSignature } from '../schemas/contract.schema';

export interface ContractDocumentSheetProps {
  contract: FourPartyContract;
  className?: string;
}

function formatMedicalDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

interface SignatureBoxProps {
  testId: string;
  partyTitle: string;
  roleDescription: string;
  signature?: DigitalSignature;
}

function SignatureBox({ testId, partyTitle, roleDescription, signature }: SignatureBoxProps) {
  const isSigned = Boolean(signature?.sha256Hash);

  return (
    <div
      data-testid={testId}
      className={cn(
        'rounded-lg p-4 flex flex-col justify-between transition-colors min-h-[160px]',
        isSigned
          ? 'border border-slate-300 bg-slate-50/60'
          : 'border-2 border-dashed border-slate-300 bg-slate-50/20 text-slate-500',
      )}
    >
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-600 font-semibold mb-1">
          {partyTitle}
        </p>
        <p className="text-xs text-slate-500 mb-3">{roleDescription}</p>

        {isSigned && signature ? (
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>Đã ký số điện tử</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-1">{signature.signedBy}</p>
            <p className="text-xs text-slate-600 tabular-nums">
              Thời gian: {formatMedicalDate(signature.signedAt)}
            </p>
          </div>
        ) : (
          <div className="py-4 text-center">
            <span className="text-xs font-medium text-slate-500">Chờ ký số</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Chưa hoàn tất ký điện tử</p>
          </div>
        )}
      </div>

      {isSigned && signature && (
        <div className="mt-3 pt-2 border-t border-slate-200">
          <p className="text-[10px] uppercase text-slate-600 font-medium tracking-wide">
            Mã băm SHA-256
          </p>
          <p className="text-[11px] text-slate-600 break-all tabular-nums leading-tight">
            {signature.sha256Hash}
          </p>
        </div>
      )}
    </div>
  );
}

export function ContractDocumentSheet({ contract, className }: ContractDocumentSheetProps) {
  const { signatures } = contract;

  return (
    <article
      className={cn(
        'bg-white text-slate-900 border border-slate-300 shadow-sm rounded-xl p-6 sm:p-10 max-w-4xl mx-auto font-sans leading-relaxed',
        className,
      )}
    >
      {/* Official Legal Header */}
      <header className="text-center pb-6 border-b border-slate-200 space-y-1.5">
        <p className="text-xs uppercase font-semibold tracking-wider text-slate-700">
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
        </p>
        <p className="text-xs text-slate-600">Độc lập - Tự do - Hạnh phúc</p>
        <div className="w-24 h-px bg-slate-300 mx-auto my-2" />
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight pt-2">
          HỢP ĐỒNG DỊCH VỤ CHĂM SÓC SỨC KHỎE BAN ĐẦU
        </h1>
        <p className="text-xs text-slate-500 italic">
          (Mô hình Bác sĩ Gia đình Phối hợp 4 bên theo chuẩn Bộ Y tế)
        </p>
        <p className="text-xs text-slate-600 tabular-nums pt-1">
          Mã số hợp đồng: <span className="font-semibold text-slate-900">{contract.contractNumber}</span> • Ngày lập: {formatMedicalDate(contract.createdAt)}
        </p>
      </header>

      {/* Contract Participants */}
      <section className="py-6 border-b border-slate-200 space-y-4">
        <h2 className="text-xs uppercase font-bold tracking-wider text-slate-800">
          CÁC BÊN THAM GIA HỢP ĐỒNG
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/40">
            <h3 className="font-semibold text-slate-900 mb-1">Bên A: Đại diện Hộ gia đình</h3>
            <p className="text-slate-700">Đại diện: <span className="font-medium text-slate-900">{contract.familyRepresentativeName}</span></p>
            <p className="text-slate-600">SĐT: <span className="tabular-nums">{contract.familyRepresentativePhone}</span></p>
            {contract.familyRepresentativeEmail && (
              <p className="text-slate-600">Email: {contract.familyRepresentativeEmail}</p>
            )}
            {contract.familyAddress && (
              <p className="text-slate-600">Địa chỉ: {contract.familyAddress}</p>
            )}
            <p className="text-slate-600">Số lượng thành viên bảo trợ: <span className="font-medium tabular-nums text-slate-900">{contract.membersCount ?? contract.members?.length ?? 1} người</span></p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/40">
            <h3 className="font-semibold text-slate-900 mb-1">Bên B: Nền tảng Famidoc</h3>
            <p className="text-slate-700">Đơn vị: Công ty Cổ phần Công nghệ Y tế Famidoc</p>
            <p className="text-slate-600">Vai trò: Điều phối công nghệ, bảo mật hồ sơ & thanh toán ký gửi</p>
            <p className="text-slate-600">Cổng hỗ trợ: hotro@famidoc.vn • Hotline: 1900-8822</p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/40">
            <h3 className="font-semibold text-slate-900 mb-1">Bên C: Cơ sở Y tế</h3>
            <p className="text-slate-700">Đơn vị: <span className="font-medium text-slate-900">{contract.facilityName ?? 'Chờ chỉ định CSYT'}</span></p>
            {contract.facilityAddress && (
              <p className="text-slate-600">Địa chỉ: {contract.facilityAddress}</p>
            )}
            <p className="text-slate-600">Trách nhiệm: Đảm bảo pháp lý chuyên môn & phương tiện cấp cứu</p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/40">
            <h3 className="font-semibold text-slate-900 mb-1">Bên D: Bác sĩ Gia đình</h3>
            <p className="text-slate-700">Bác sĩ: <span className="font-medium text-slate-900">{contract.doctorName ?? 'Chờ phân công bác sĩ'}</span></p>
            <p className="text-slate-600">Chức danh: {contract.doctorTitle ?? 'Bác sĩ Gia đình Chuyên trách'}</p>
            <p className="text-slate-600">Nhiệm vụ: Trực tiếp theo dõi, thăm khám định kỳ & tư vấn 24/7</p>
          </div>
        </div>
      </section>

      {/* Contract Terms & Legal Scope */}
      <section className="py-6 border-b border-slate-200 space-y-4 text-xs">
        <h2 className="text-xs uppercase font-bold tracking-wider text-slate-800">
          NỘI DUNG VÀ ĐIỀU KHOẢN PHÁP LÝ
        </h2>

        <div className="space-y-3 text-slate-700">
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">
              Điều 1: Đối tượng và phạm vi dịch vụ
            </h3>
            <p>
              Bên A đồng ý ủy quyền và đăng ký dịch vụ theo gói chăm sóc sức khỏe ban đầu:{' '}
              <span className="font-semibold text-slate-900">{contract.packageName}</span>, với mức phí niêm yết là{' '}
              <span className="font-semibold tabular-nums text-slate-900">{formatCurrencyVND(contract.packagePrice)}</span> cho thời hạn{' '}
              <span className="font-medium tabular-nums">{contract.durationMonths ?? 12} tháng</span>.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-1">
              Điều 2: Trách nhiệm và quyền hạn
            </h3>
            <p>
              Bên C và Bên D có trách nhiệm bảo đảm chất lượng thăm khám, theo dõi hồ sơ bệnh án định kỳ theo đúng Luật Khám bệnh, chữa bệnh số 15/2023/QH15 và các quy chuẩn y tế hiện hành. Bên B đảm bảo hạ tầng kết nối liên tục, giám sát định biên không quá 30 hộ/bác sĩ.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-1">
              Điều 3: Tính toàn vẹn và giá trị pháp lý
            </h3>
            <p>
              Hợp đồng này được khởi tạo và ký kết dưới hình thức chứng thư số điện tử theo Luật Giao dịch điện tử 2023, có giá trị pháp lý tương đương văn bản giấy truyền thống. Mỗi bên xác nhận nội dung bằng chữ ký số có lưu mã băm bảo mật SHA-256 dưới đây.
            </p>
          </div>
        </div>
      </section>

      {/* Digital Signatures Grid */}
      <section className="pt-6 space-y-4">
        <h2 className="text-xs uppercase font-bold tracking-wider text-slate-800">
          XÁC NHẬN CHỮ KÝ ĐIỆN TỬ 4 BÊN
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SignatureBox
            testId="signature-box-family"
            partyTitle="Bên A"
            roleDescription="Đại diện Hộ gia đình"
            signature={signatures?.family}
          />
          <SignatureBox
            testId="signature-box-platform"
            partyTitle="Bên B"
            roleDescription="Nền tảng Famidoc"
            signature={signatures?.platform}
          />
          <SignatureBox
            testId="signature-box-facility"
            partyTitle="Bên C"
            roleDescription="Cơ sở Y tế phối hợp"
            signature={signatures?.facility}
          />
          <SignatureBox
            testId="signature-box-doctor"
            partyTitle="Bên D"
            roleDescription="Bác sĩ Gia đình phụ trách"
            signature={signatures?.doctor}
          />
        </div>
      </section>
    </article>
  );
}
