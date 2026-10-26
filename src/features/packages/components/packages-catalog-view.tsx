'use client';

import React, { useState } from 'react';
import { PackageCard } from './package-card';
import { PackageItem } from '../schemas/package.schema';

const defaultPackages: PackageItem[] = [
  {
    id: 'pkg-basic',
    name: 'Chăm Sóc Cơ Bản',
    price: 499000,
    period: 'tháng',
    tier: 'Tiêu chuẩn',
    badgeColor: 'green',
    isPopular: false,
    features: [
      '2 lần khám tận nhà / năm',
      'Tư vấn Telehealth không giới hạn',
      'Hồ sơ sức khỏe số E-Health',
    ],
  },
  {
    id: 'pkg-family',
    name: 'Gia Đình Toàn Diện',
    price: 1290000,
    period: 'tháng',
    tier: 'Toàn diện',
    badgeColor: 'amber',
    isPopular: true,
    features: [
      'Bác sĩ riêng chỉ định thăm khám',
      '6 lượt khám tận nhà / năm',
      'Xét nghiệm máu & sinh hóa cơ bản',
      'Hỗ trợ điều phối xe cứu thương',
    ],
  },
  {
    id: 'pkg-elderly',
    name: 'Chăm Sóc Người Cao Tuổi',
    price: 1850000,
    period: 'tháng',
    tier: 'Chuyên sâu',
    badgeColor: 'blue',
    isPopular: false,
    features: [
      'Theo dõi huyết áp, đường huyết từ xa',
      'Điều dưỡng hỗ trợ tiêm truyền tại nhà',
      'Kê đơn và giao thuốc tận cửa',
    ],
  },
  {
    id: 'pkg-vip',
    name: 'Gia Đình Hoàng Gia',
    price: 3900000,
    period: 'tháng',
    tier: 'VIP Platinum',
    badgeColor: 'red',
    isPopular: false,
    features: [
      'Khám tại nhà định kỳ hàng tháng',
      'Hội chẩn cùng chuyên gia đầu ngành',
      'Đặc quyền cấp cứu trực thăng liên kết',
    ],
  },
];

export function PackagesCatalogView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');

  const filtered = defaultPackages.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTier = selectedTier === 'ALL' || p.tier === selectedTier;
    return matchSearch && matchTier;
  });

  const handleResetFilter = () => {
    setSearchTerm('');
    setSelectedTier('ALL');
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="px-3 py-1 rounded-full bg-surface-container text-primary font-semibold text-xs">
          Hệ sinh thái Bác sĩ Gia đình FamiDoc
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface">
          Danh Mục Gói Dịch Vụ Chăm Sóc Sức Khỏe
        </h1>
        <p className="text-sm md:text-base text-on-surface-variant">
          Minh bạch quyền lợi y khoa, được bảo chứng 100% bằng cơ chế ký quỹ Escrow và giám sát chuẩn mực bởi Bộ Y Tế.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên gói chăm sóc..."
            className="w-full pl-10 pr-3 py-2 text-xs bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'Tiêu chuẩn', 'Toàn diện', 'Chuyên sâu', 'VIP Platinum'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTier(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedTier === t
                  ? 'bg-primary-container text-white shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
              }`}
            >
              {t === 'ALL' ? 'Tất cả các gói' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid or Empty State (M-05) */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      ) : (
        <div
          role="status"
          className="p-12 rounded-2xl bg-surface-container-lowest border border-outline-variant text-center space-y-4 max-w-lg mx-auto shadow-sm"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-surface-container flex items-center justify-center text-outline">
            <span className="material-symbols-outlined text-3xl">search_off</span>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-on-surface">Không tìm thấy gói khám phù hợp</h3>
            <p className="text-xs text-on-surface-variant">
              Không có gói dịch vụ nào khớp với từ khóa &ldquo;{searchTerm}&rdquo;. Bạn vui lòng thử tìm kiếm bằng từ khóa khác hoặc xóa bộ lọc.
            </p>
          </div>
          <button
            onClick={handleResetFilter}
            className="px-5 py-2.5 bg-primary-container hover:bg-primary text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Assurance Seal */}
      <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm">
          <span className="material-symbols-outlined text-[20px]">verified_user</span>
          Cam kết Minh bạch Chi phí Y tế &amp; Ký quỹ Escrow Ngân hàng
        </div>
        <p className="text-xs text-on-surface-variant max-w-2xl mx-auto">
          Toàn bộ chi phí đăng ký được giữ trong tài khoản Escrow trung gian và chỉ giải ngân cho Bác sĩ khi buổi khám hoàn tất với chữ ký số xác nhận của gia đình bạn.
        </p>
      </div>
    </div>
  );
}
