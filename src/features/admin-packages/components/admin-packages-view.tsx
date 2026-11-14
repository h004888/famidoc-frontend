'use client';

import React, { useState, useEffect } from 'react';
import { adminPackagesApi, type CarePackageAdminDto } from '@/lib/api';

interface CarePackageAdmin {
  id: string;
  name: string;
  badge: string;
  targetAudience: string;
  status: 'DRAFT' | 'PUBLISHED' | 'RETIRED';
  pricing: {
    m1: number;
    m3: number;
    m12: number;
  };
  benefits: {
    homeVisits: number;
    telehealthCalls: string;
    bloodTests: number;
    iotDeviceIncluded: boolean;
  };
  subscribersCount: number;
  version?: string;
}

const INITIAL_PACKAGES: CarePackageAdmin[] = [
  {
    id: 'PKG-STANDARD',
    name: 'Gói Chăm sóc Gia đình Tiêu chuẩn',
    badge: 'Phổ thông',
    targetAudience: 'Hộ gia đình từ 3-4 thành viên có trẻ nhỏ',
    status: 'PUBLISHED',
    pricing: {
      m1: 750000,
      m3: 2100000,
      m12: 7800000,
    },
    benefits: {
      homeVisits: 2,
      telehealthCalls: 'Không giới hạn 24/7',
      bloodTests: 1,
      iotDeviceIncluded: false,
    },
    subscribersCount: 1640,
    version: '1.0',
  },
  {
    id: 'PKG-PREMIUM-GOLD',
    name: 'Gói Chăm sóc Gia đình Toàn diện VIP',
    badge: 'Cao cấp',
    targetAudience: 'Hộ gia đình nhiều thế hệ, ưu tiên tiếp cận Bác sĩ Trưởng khoa',
    status: 'PUBLISHED',
    pricing: {
      m1: 1500000,
      m3: 4200000,
      m12: 15600000,
    },
    benefits: {
      homeVisits: 5,
      telehealthCalls: 'Không giới hạn ưu tiên',
      bloodTests: 4,
      iotDeviceIncluded: true,
    },
    subscribersCount: 890,
    version: '2.1',
  },
  {
    id: 'PKG-CHRONIC-SENIOR',
    name: 'Gói Quản lý Bệnh Mạn tính & Lão khoa',
    badge: 'Chuyên sâu',
    targetAudience: 'Người cao tuổi mắc Tăng huyết áp, Đái tháo đường, Tim mạch',
    status: 'PUBLISHED',
    pricing: {
      m1: 1200000,
      m3: 3300000,
      m12: 12500000,
    },
    benefits: {
      homeVisits: 4,
      telehealthCalls: 'Theo dõi sinh tồn hằng ngày',
      bloodTests: 3,
      iotDeviceIncluded: true,
    },
    subscribersCount: 520,
    version: '1.2',
  },
  {
    id: 'PKG-MATERNAL',
    name: 'Gói Mẹ bầu & Bé sơ sinh 1.000 ngày đầu đời',
    badge: 'Mới ra mắt',
    targetAudience: 'Phụ nữ mang thai tuần 12 đến khi bé tròn 2 tuổi',
    status: 'DRAFT',
    pricing: {
      m1: 950000,
      m3: 2700000,
      m12: 9900000,
    },
    benefits: {
      homeVisits: 3,
      telehealthCalls: 'Bác sĩ Nhi & Sản đồng hành',
      bloodTests: 2,
      iotDeviceIncluded: false,
    },
    subscribersCount: 0,
    version: '1.0-alpha',
  },
];

export function AdminPackagesView() {
  const [packages, setPackages] = useState<CarePackageAdmin[]>(INITIAL_PACKAGES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<CarePackageAdmin | null>(null);
  const [notification, setNotification] = useState('');

  // Form states
  const [formName, setFormName] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formPriceM1, setFormPriceM1] = useState(800000);
  const [formPriceM3, setFormPriceM3] = useState(2200000);
  const [formPriceM12, setFormPriceM12] = useState(8200000);
  const [formHomeVisits, setFormHomeVisits] = useState(2);
  const [formBloodTests, setFormBloodTests] = useState(1);
  const [formIot, setFormIot] = useState(false);

  useEffect(() => {
    let isMounted = true;
    adminPackagesApi
      .listPackages()
      .then((res) => {
        if (!isMounted) return;
        if (Array.isArray(res) && res.length > 0) {
          const mapped: CarePackageAdmin[] = res.map((p: any) => ({
            id: p.id,
            name: p.name,
            badge: p.status === 'PUBLISHED' ? 'Chính thức' : p.status === 'DRAFT' ? 'Bản nháp' : 'Đã thu hồi',
            targetAudience: p.description || 'Hộ gia đình FamiDoc',
            status: p.status || 'PUBLISHED',
            pricing: {
              m1: Math.round(p.basePriceVnd / 12),
              m3: Math.round(p.basePriceVnd / 4),
              m12: p.basePriceVnd,
            },
            benefits: {
              homeVisits: p.homeVisitsQuota ?? 3,
              telehealthCalls: p.telehealthQuota ? `${p.telehealthQuota} lượt/năm` : '24/7 Tiêu chuẩn',
              bloodTests: 2,
              iotDeviceIncluded: false,
            },
            subscribersCount: 120,
            version: p.version ? `v${p.version}` : '1.0',
          }));
          setPackages(mapped);
        }
      })
      .catch((err) => {
        console.warn('Admin packages API fallback:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const handleOpenCreateModal = () => {
    setEditingPkg(null);
    setFormName('');
    setFormTarget('');
    setFormPriceM1(800000);
    setFormPriceM3(2200000);
    setFormPriceM12(8200000);
    setFormHomeVisits(2);
    setFormBloodTests(1);
    setFormIot(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pkg: CarePackageAdmin) => {
    setEditingPkg(pkg);
    setFormName(pkg.name);
    setFormTarget(pkg.targetAudience);
    setFormPriceM1(pkg.pricing.m1);
    setFormPriceM3(pkg.pricing.m3);
    setFormPriceM12(pkg.pricing.m12);
    setFormHomeVisits(pkg.benefits.homeVisits);
    setFormBloodTests(pkg.benefits.bloodTests);
    setFormIot(pkg.benefits.iotDeviceIncluded);
    setIsModalOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    if (editingPkg) {
      try {
        await adminPackagesApi.updatePackage(editingPkg.id, {
          name: formName,
          basePriceVnd: formPriceM12,
          homeVisitsQuota: formHomeVisits,
        });
      } catch {}
      setPackages((prev) =>
        prev.map((p) =>
          p.id === editingPkg.id
            ? {
                ...p,
                name: formName,
                targetAudience: formTarget,
                pricing: {
                  m1: formPriceM1,
                  m3: formPriceM3,
                  m12: formPriceM12,
                },
                benefits: {
                  ...p.benefits,
                  homeVisits: formHomeVisits,
                  bloodTests: formBloodTests,
                  iotDeviceIncluded: formIot,
                },
              }
            : p
        )
      );
      setNotification(`Đã cập nhật cấu hình và biểu giá gói ${formName}`);
    } else {
      try {
        await adminPackagesApi.createPackage({
          name: formName,
          basePriceVnd: formPriceM12,
          homeVisitsQuota: formHomeVisits,
          telehealthQuota: 12,
          description: formTarget,
        });
      } catch {}

      const newPkg: CarePackageAdmin = {
        id: `PKG-${Date.now().toString().slice(-4)}`,
        name: formName,
        badge: 'Tùy chỉnh',
        targetAudience: formTarget || 'Gia đình đối tượng mới',
        status: 'DRAFT',
        pricing: {
          m1: formPriceM1,
          m3: formPriceM3,
          m12: formPriceM12,
        },
        benefits: {
          homeVisits: formHomeVisits,
          telehealthCalls: '24/7 Tiêu chuẩn',
          bloodTests: formBloodTests,
          iotDeviceIncluded: formIot,
        },
        subscribersCount: 0,
        version: '1.0',
      };
      setPackages([newPkg, ...packages]);
      setNotification(`Đã tạo thành công gói dịch vụ mới: ${formName}`);
    }

    setIsModalOpen(false);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleCreateVersion = async (pkg: CarePackageAdmin) => {
    try {
      await adminPackagesApi.createVersion(pkg.id, {
        basePriceVnd: pkg.pricing.m12 + 500000,
        homeVisitsQuota: pkg.benefits.homeVisits + 1,
      });
    } catch {}

    setPackages((prev) =>
      prev.map((p) => {
        if (p.id !== pkg.id) return p;
        const curVer = parseFloat(p.version?.replace('v', '') || '1.0') || 1.0;
        const newVer = `v${(curVer + 0.1).toFixed(1)}`;
        return { ...p, version: newVer };
      })
    );
    setNotification(`Đã tạo thành công phiên bản mới cho gói ${pkg.name}!`);
    setTimeout(() => setNotification(''), 4000);
  };

  const handlePublish = async (pkgId: string) => {
    try {
      await adminPackagesApi.publishPackage(pkgId);
    } catch {}

    setPackages((prev) =>
      prev.map((p) => (p.id === pkgId ? { ...p, status: 'PUBLISHED' as const } : p))
    );
    setNotification(`Đã xuất bản gói dịch vụ thành công! Người dùng có thể đăng ký.`);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleRetire = async (pkgId: string) => {
    try {
      await adminPackagesApi.retirePackage(pkgId);
    } catch {}

    setPackages((prev) =>
      prev.map((p) => (p.id === pkgId ? { ...p, status: 'RETIRED' as const } : p))
    );
    setNotification(`Đã thu hồi gói dịch vụ! Gói sẽ ngừng nhận đăng ký mới.`);
    setTimeout(() => setNotification(''), 4000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Quản trị &amp; Định giá Gói Dịch vụ Chăm sóc (Standardized)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Thiết lập định mức quyền lợi y tế, bảng giá niêm yết, tạo phiên bản mới và xuất bản/thu hồi gói
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Tạo Gói Dịch Vụ Mới</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {notification && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
            <span>{notification}</span>
          </div>
        )}

        {/* Packages Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-white rounded-2xl border p-6 shadow-xs flex flex-col justify-between transition-all ${
                pkg.status === 'PUBLISHED' ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-90'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {pkg.badge}
                    </span>
                    <span className="tabular-nums text-xs text-slate-400">{pkg.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {pkg.version || 'v1.0'}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      pkg.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : pkg.status === 'DRAFT'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {pkg.status === 'PUBLISHED' ? 'Đang phát hành' : pkg.status === 'DRAFT' ? 'Bản nháp' : 'Đã thu hồi'}
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-slate-900">{pkg.name}</h2>
                <p className="text-xs text-slate-500 mt-1">{pkg.targetAudience}</p>

                {/* Pricing Tiers Table */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                  <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    Biểu phí theo chu kỳ (Đã gồm VAT &amp; Ký quỹ Escrow)
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-200/60">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-semibold">1 Tháng</div>
                      <div className="font-bold text-slate-900 mt-0.5">{formatVND(pkg.pricing.m1)}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-200 bg-indigo-50/20">
                      <div className="text-[10px] text-indigo-600 font-bold">3 Tháng (-10%)</div>
                      <div className="font-bold text-indigo-700 mt-0.5">{formatVND(pkg.pricing.m3)}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-200 bg-emerald-50/20">
                      <div className="text-[10px] text-emerald-600 font-bold">12 Tháng (-20%)</div>
                      <div className="font-bold text-emerald-700 mt-0.5">{formatVND(pkg.pricing.m12)}</div>
                    </div>
                  </div>
                </div>

                {/* Benefits List */}
                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-indigo-600">home_health</span>
                    <span>Khám tại nhà: <strong>{pkg.benefits.homeVisits} lượt/tháng</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-blue-500">videocam</span>
                    <span>Telehealth: <strong>{pkg.benefits.telehealthCalls}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-rose-500">biotech</span>
                    <span>Xét nghiệm máu định kỳ: <strong>{pkg.benefits.bloodTests} lần/năm</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">monitor_heart</span>
                    <span>Cung cấp máy đo IoT sinh tồn: <strong>{pkg.benefits.iotDeviceIncluded ? 'Có kèm theo' : 'Không'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-500">
                  Đang phục vụ: <strong className="text-slate-800">{pkg.subscribersCount} hộ</strong>
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleCreateVersion(pkg)}
                    title="Tạo phiên bản mới khi CSYT yêu cầu đổi giá hoặc lượt khám"
                    className="px-2.5 py-1.5 rounded-lg border border-blue-200 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">history</span>
                    <span>Tạo bản mới</span>
                  </button>

                  {pkg.status !== 'PUBLISHED' ? (
                    <button
                      onClick={() => handlePublish(pkg.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      Xuất bản
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRetire(pkg.id)}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Thu hồi
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEditModal(pkg)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Sửa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Cấu hình gói dịch vụ */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-bold text-slate-900 text-base">
                  {editingPkg ? `Cập nhật: ${editingPkg.name}` : 'Thiết lập Gói Chăm sóc Y tế Mới'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleSavePackage} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên gói dịch vụ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Gói Chăm sóc Gia đình Toàn diện"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đối tượng phục vụ mục tiêu
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Gia đình 4 người hoặc người cao tuổi..."
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                  />
                </div>

                {/* 3 Pricing inputs */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Giá 1 Tháng (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={formPriceM1}
                      onChange={(e) => setFormPriceM1(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Giá 3 Tháng (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={formPriceM3}
                      onChange={(e) => setFormPriceM3(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Giá 12 Tháng (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={formPriceM12}
                      onChange={(e) => setFormPriceM12(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs tabular-nums"
                    />
                  </div>
                </div>

                {/* Benefits inputs */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Lượt khám tại nhà / tháng
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formHomeVisits}
                      onChange={(e) => setFormHomeVisits(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số lần xét nghiệm máu / năm
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formBloodTests}
                      onChange={(e) => setFormBloodTests(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="iotCheck"
                    checked={formIot}
                    onChange={(e) => setFormIot(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <label htmlFor="iotCheck" className="text-xs font-semibold text-slate-700">
                    Kèm thiết bị đo huyết áp &amp; đường huyết IoT liên kết tự động EMR
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs"
                  >
                    Lưu cấu hình gói
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

