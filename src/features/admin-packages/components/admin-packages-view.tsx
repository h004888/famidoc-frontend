'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CarePackageAdmin {
  id: string;
  name: string;
  badge: string;
  targetAudience: string;
  status: 'active' | 'draft' | 'archived';
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
}

const INITIAL_PACKAGES: CarePackageAdmin[] = [
  {
    id: 'PKG-STANDARD',
    name: 'Gói Chăm sóc Gia đình Tiêu chuẩn',
    badge: 'Phổ thông',
    targetAudience: 'Hộ gia đình từ 3-4 thành viên có trẻ nhỏ',
    status: 'active',
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
  },
  {
    id: 'PKG-PREMIUM-GOLD',
    name: 'Gói Chăm sóc Gia đình Toàn diện VIP',
    badge: 'Cao cấp',
    targetAudience: 'Hộ gia đình nhiều thế hệ, ưu tiên tiếp cận Bác sĩ Trưởng khoa',
    status: 'active',
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
  },
  {
    id: 'PKG-CHRONIC-SENIOR',
    name: 'Gói Quản lý Bệnh Mạn tính & Lão khoa',
    badge: 'Chuyên sâu',
    targetAudience: 'Người cao tuổi mắc Tăng huyết áp, Đái tháo đường, Tim mạch',
    status: 'active',
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
  },
  {
    id: 'PKG-MATERNAL',
    name: 'Gói Mẹ bầu & Bé sơ sinh 1.000 ngày đầu đời',
    badge: 'Mới ra mắt',
    targetAudience: 'Phụ nữ mang thai tuần 12 đến khi bé tròn 2 tuổi',
    status: 'draft',
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
  },
];

export function AdminPackagesView() {
  const [packages, setPackages] = useState<CarePackageAdmin[]>(INITIAL_PACKAGES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<CarePackageAdmin | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formPriceM1, setFormPriceM1] = useState(800000);
  const [formPriceM3, setFormPriceM3] = useState(2200000);
  const [formPriceM12, setFormPriceM12] = useState(8200000);
  const [formHomeVisits, setFormHomeVisits] = useState(2);
  const [formBloodTests, setFormBloodTests] = useState(1);
  const [formIot, setFormIot] = useState(false);

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

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    if (editingPkg) {
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
      toast.success(`Đã cập nhật cấu hình và biểu giá gói ${formName}`);
    } else {
      const newPkg: CarePackageAdmin = {
        id: `PKG-${Date.now().toString().slice(-4)}`,
        name: formName,
        badge: 'Tùy chỉnh',
        targetAudience: formTarget || 'Gia đình đối tượng mới',
        status: 'draft',
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
      };
      setPackages([newPkg, ...packages]);
      toast.success(`Đã tạo thành công gói dịch vụ mới: ${formName}`);
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (pkgId: string) => {
    setPackages((prev) =>
      prev.map((p) => {
        if (p.id !== pkgId) return p;
        const newStatus = p.status === 'active' ? 'draft' : 'active';
        return { ...p, status: newStatus };
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <PageHeader
          title="Quản trị & Định giá Gói Dịch vụ Chăm sóc"
          description="Thiết lập định mức quyền lợi y tế, bảng giá theo chu kỳ 1 - 3 - 12 tháng và kích hoạt hiển thị gói"
          actions={
            <Button onClick={handleOpenCreateModal} className="rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Tạo Gói Dịch Vụ Mới</span>
            </Button>
          }
        />

        {/* Packages Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`rounded-2xl py-6 shadow-xs transition-all ${
                pkg.status === 'active' ? 'border-slate-200 bg-white' : 'border-dashed border-slate-300 bg-white opacity-90'
              }`}
            >
              <CardContent className="flex h-full flex-col justify-between px-6">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full text-[11px] font-bold bg-accent text-primary border-primary/20">
                        {pkg.badge}
                      </Badge>
                      <span className="tabular-nums text-xs text-slate-400">{pkg.id}</span>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold rounded-full ${
                        pkg.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {pkg.status === 'active' ? 'Đang mở bán' : 'Bản nháp / Tạm dừng'}
                    </Badge>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-slate-900">{pkg.name}</h2>
                  <p className="text-xs text-slate-500 mt-1">{pkg.targetAudience}</p>

                  {/* Pricing Tiers */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                    <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                      Biểu phí theo chu kỳ (Đã gồm VAT &amp; Ký quỹ Escrow)
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-200/60">
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-semibold">1 Tháng</div>
                        <div className="font-bold text-slate-900 mt-0.5 tabular-nums">{formatVND(pkg.pricing.m1)}</div>
                      </div>
                      <div className="bg-accent/40 p-2 rounded-lg border border-primary/20">
                        <div className="text-[10px] text-primary font-bold">3 Tháng (-10%)</div>
                        <div className="font-bold text-primary mt-0.5 tabular-nums">{formatVND(pkg.pricing.m3)}</div>
                      </div>
                      <div className="bg-emerald-50/40 p-2 rounded-lg border border-emerald-200">
                        <div className="text-[10px] text-emerald-600 font-bold">12 Tháng (-20%)</div>
                        <div className="font-bold text-emerald-700 mt-0.5 tabular-nums">{formatVND(pkg.pricing.m12)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Benefits List */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary">home_health</span>
                      <span>Khám tại nhà: <strong className="tabular-nums">{pkg.benefits.homeVisits} lượt/tháng</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-blue-500">videocam</span>
                      <span>Telehealth: <strong>{pkg.benefits.telehealthCalls}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-rose-500">biotech</span>
                      <span>Xét nghiệm máu định kỳ: <strong className="tabular-nums">{pkg.benefits.bloodTests} lần/năm</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">monitor_heart</span>
                      <span>Cung cấp máy đo IoT sinh tồn: <strong>{pkg.benefits.iotDeviceIncluded ? 'Có kèm theo' : 'Không'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Đang phục vụ: <strong className="text-slate-800 tabular-nums">{pkg.subscribersCount} hộ</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => handleToggleStatus(pkg.id)}
                      className="rounded-lg text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      {pkg.status === 'active' ? 'Tạm ẩn' : 'Kích hoạt'}
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      onClick={() => handleOpenEditModal(pkg)}
                      className="rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Chỉnh sửa
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dialog: Cấu hình gói dịch vụ */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="rounded-2xl border-slate-200 sm:max-w-xl">
            <DialogHeader className="border-b border-slate-100 pb-3">
              <DialogTitle className="font-bold text-slate-900 text-base">
                {editingPkg ? `Cập nhật: ${editingPkg.name}` : 'Thiết lập Gói Chăm sóc Y tế Mới'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Điều chỉnh biểu giá chu kỳ và định mức quyền lợi lâm sàng
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSavePackage} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="pkg-name" className="text-xs font-semibold text-slate-700">
                  Tên gói dịch vụ <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="pkg-name"
                  type="text"
                  required
                  placeholder="VD: Gói Chăm sóc Gia đình Toàn diện"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="pkg-target" className="text-xs font-semibold text-slate-700">
                  Đối tượng phục vụ mục tiêu
                </Label>
                <Input
                  id="pkg-target"
                  type="text"
                  placeholder="VD: Gia đình 4 người hoặc người cao tuổi..."
                  value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                  className="rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="pkg-m1" className="text-xs font-semibold text-slate-700">
                    Giá 1 Tháng (VNĐ)
                  </Label>
                  <Input
                    id="pkg-m1"
                    type="number"
                    value={formPriceM1}
                    onChange={(e) => setFormPriceM1(Number(e.target.value))}
                    className="rounded-xl text-xs tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pkg-m3" className="text-xs font-semibold text-slate-700">
                    Giá 3 Tháng (VNĐ)
                  </Label>
                  <Input
                    id="pkg-m3"
                    type="number"
                    value={formPriceM3}
                    onChange={(e) => setFormPriceM3(Number(e.target.value))}
                    className="rounded-xl text-xs tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pkg-m12" className="text-xs font-semibold text-slate-700">
                    Giá 12 Tháng (VNĐ)
                  </Label>
                  <Input
                    id="pkg-m12"
                    type="number"
                    value={formPriceM12}
                    onChange={(e) => setFormPriceM12(Number(e.target.value))}
                    className="rounded-xl text-xs tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="pkg-visits" className="text-xs font-semibold text-slate-700">
                    Lượt khám tại nhà / tháng
                  </Label>
                  <Input
                    id="pkg-visits"
                    type="number"
                    min={0}
                    value={formHomeVisits}
                    onChange={(e) => setFormHomeVisits(Number(e.target.value))}
                    className="rounded-xl text-xs tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pkg-tests" className="text-xs font-semibold text-slate-700">
                    Số lần xét nghiệm máu / năm
                  </Label>
                  <Input
                    id="pkg-tests"
                    type="number"
                    min={0}
                    value={formBloodTests}
                    onChange={(e) => setFormBloodTests(Number(e.target.value))}
                    className="rounded-xl text-xs tabular-nums"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="iotCheck"
                  checked={formIot}
                  onCheckedChange={(checked) => setFormIot(Boolean(checked))}
                />
                <Label htmlFor="iotCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Kèm thiết bị đo huyết áp &amp; đường huyết IoT liên kết tự động EMR
                </Label>
              </div>

              <DialogFooter className="border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  Lưu cấu hình gói
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

