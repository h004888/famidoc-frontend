'use client';

import React, { useState } from 'react';
import { AdminNav } from '@/components/layout';

interface LegalContract {
  id: string;
  title: string;
  type: 'b2b_hospital' | 'four_parties' | 'appendix';
  partnerName: string;
  effectiveDate: string;
  expiryDate: string;
  revenueShareRate: string;
  status: 'active' | 'pending_signature' | 'expiring_soon' | 'terminated';
  signedBy: string;
}

const INITIAL_CONTRACTS: LegalContract[] = [
  {
    id: 'CTR-B2B-2026-001',
    title: 'Hợp đồng Hợp tác Chiến lược & Cung ứng Nhân lực Y tế Bác sĩ Gia đình',
    type: 'b2b_hospital',
    partnerName: 'Bệnh viện Đại học Y Dược TP.HCM',
    effectiveDate: '01/01/2026',
    expiryDate: '31/12/2027',
    revenueShareRate: '70% Cơ sở / 30% Nền tảng',
    status: 'active',
    signedBy: 'GS.TS Nguyễn Văn H. (Giám đốc BV) & FamiDoc CEO',
  },
  {
    id: 'CTR-B2B-2026-002',
    title: 'Hợp đồng Liên kết Chuyển viện Cấp cứu & Khám Chuyên khoa Fast-Track',
    type: 'b2b_hospital',
    partnerName: 'Bệnh viện Chợ Rẫy TP.HCM',
    effectiveDate: '15/03/2026',
    expiryDate: '15/03/2027',
    revenueShareRate: '68% Cơ sở / 32% Nền tảng',
    status: 'active',
    signedBy: 'Ban Giám đốc Bệnh viện Chợ Rẫy',
  },
  {
    id: 'CTR-APPX-2026-009',
    title: 'Phụ lục số 03: Điều chỉnh Danh mục Bác sĩ CCHN & Cam kết SLA Phản ứng Khẩn cấp',
    type: 'appendix',
    partnerName: 'Bệnh viện Đại học Y Dược TP.HCM',
    effectiveDate: '01/10/2026',
    expiryDate: '31/12/2027',
    revenueShareRate: 'Theo HĐ gốc',
    status: 'pending_signature',
    signedBy: 'Chờ đại diện Bệnh viện ký số USB Token',
  },
  {
    id: 'CTR-4P-2026-88219',
    title: 'Hợp đồng Điện tử Cung cấp Dịch vụ Chăm sóc Sức khỏe Gia đình 4 Bên',
    type: 'four_parties',
    partnerName: 'Hộ FAM-88219 (Trần Thị Lan)',
    effectiveDate: '12/04/2026',
    expiryDate: '12/04/2027',
    revenueShareRate: 'Theo gói VIP Gold (15.6tr/năm)',
    status: 'active',
    signedBy: 'Đại diện Hộ, BS Phụ trách, BV Y Dược, FamiDoc',
  },
  {
    id: 'CTR-B2B-2025-014',
    title: 'Hợp đồng Hợp tác Dịch vụ Lấy mẫu Xét nghiệm Tận nhà',
    type: 'b2b_hospital',
    partnerName: 'Hệ thống Phòng khám Quốc tế CarePlus',
    effectiveDate: '01/11/2025',
    expiryDate: '01/11/2026',
    revenueShareRate: '65% Đối tác / 35% Nền tảng',
    status: 'expiring_soon',
    signedBy: 'Tổng Giám đốc CarePlus Vietnam',
  },
];

export function AdminContractsView() {
  const [contracts, setContracts] = useState<LegalContract[]>(INITIAL_CONTRACTS);
  const [filterType, setFilterType] = useState<'all' | 'b2b_hospital' | 'four_parties' | 'appendix'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContract, setSelectedContract] = useState<LegalContract | null>(null);
  const [notification, setNotification] = useState('');

  const filteredContracts = contracts.filter((c) => {
    const matchesType = filterType === 'all' || c.type === filterType;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.partnerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleApproveSignature = (contractId: string) => {
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? { ...c, status: 'active' as const, signedBy: 'Đã hoàn tất ký số SmartCA 2 bên' }
          : c
      )
    );
    setNotification(`Đã xác thực và ký duyệt phụ lục ${contractId}`);
    setSelectedContract(null);
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      <AdminNav />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Quản lý Hợp đồng &amp; Pháp lý Nền tảng
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Quản lý hợp đồng B2B cung cấp nhân lực bác sĩ, thỏa thuận tỷ lệ chia sẻ doanh thu và các phụ lục pháp lý
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px] text-amber-400">verified</span>
            <span>Tổng cộng: {contracts.length} văn bản pháp lý lưu ký</span>
          </div>
        </div>

        {/* Feedback Alert */}
        {notification && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
            <span>{notification}</span>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên đối tác, mã hợp đồng, tiêu đề văn bản..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            {(['all', 'b2b_hospital', 'four_parties', 'appendix'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === t
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t === 'all' && 'Tất cả'}
                {t === 'b2b_hospital' && 'HĐ Đối tác B2B'}
                {t === 'four_parties' && 'HĐ 4 Bên Gia đình'}
                {t === 'appendix' && 'Phụ lục HĐ'}
              </button>
            ))}
          </div>
        </div>

        {/* Contracts Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Mã &amp; Tiêu đề Hợp đồng</th>
                  <th className="py-3.5 px-4">Đối tác / Cơ sở y tế</th>
                  <th className="py-3.5 px-4">Thời hạn hiệu lực</th>
                  <th className="py-3.5 px-4">Tỷ lệ phân bổ B2B</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 leading-snug">{c.title}</div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">{c.id}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {c.partnerName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{c.effectiveDate} - {c.expiryDate}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-indigo-700">
                      {c.revenueShareRate}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {c.status === 'active' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đang hiệu lực
                        </span>
                      )}
                      {c.status === 'pending_signature' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Chờ ký số
                        </span>
                      )}
                      {c.status === 'expiring_soon' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Sắp hết hạn (&lt;30 ngày)
                        </span>
                      )}
                      {c.status === 'terminated' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                          Đã thanh lý
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedContract(c)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                      >
                        Chi tiết &amp; Ký
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Chi tiết điều khoản pháp lý & Phê duyệt ký số */}
        {selectedContract && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600 text-[22px]">description</span>
                  <h3 className="font-bold text-slate-900 text-base">Hồ sơ Pháp lý Điện tử</h3>
                </div>
                <button
                  onClick={() => setSelectedContract(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{selectedContract.title}</div>
                  <div className="font-mono text-slate-500">Mã văn bản: {selectedContract.id}</div>
                  <div className="text-slate-700">Đối tác: <strong>{selectedContract.partnerName}</strong></div>
                  <div className="text-slate-700">Tỷ lệ phân bổ: <strong>{selectedContract.revenueShareRate}</strong></div>
                </div>

                <div className="border border-slate-200 p-3 rounded-xl space-y-2">
                  <div className="font-bold text-slate-800">Trạng thái Ký số Chứng thư:</div>
                  <p className="text-slate-500">{selectedContract.signedBy}</p>
                  <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>Chuẩn chữ ký số SHA-256 RSA (Bộ Thông tin &amp; Truyền thông)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => alert(`Đang tải file PDF hợp đồng ${selectedContract.id}...`)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Tải bản PDF</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedContract(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Đóng
                  </button>
                  {selectedContract.status === 'pending_signature' && (
                    <button
                      type="button"
                      onClick={() => handleApproveSignature(selectedContract.id)}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      Ký số Duyệt ngay
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

