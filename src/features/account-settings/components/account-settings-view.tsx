'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { profileSettingsSchema, changePasswordSchema } from '../schemas/settings.schema';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export function AccountSettingsView() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'insurance'>('profile');
  const [profileData, setProfileData] = useState({
    fullName: 'Nguyễn Văn An',
    phone: '0912345678',
    email: 'an.nguyen@famidoc.vn',
    birthDate: '1985-05-15',
    gender: 'MALE',
    address: 'Số 123 Phố Huế, Q. Hai Bà Trưng, Hà Nội',
    insuranceCardNumber: 'GD4010123456789',
    bloodType: 'O+',
    allergies: 'Dị ứng phấn hoa, Penicillin',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showCfmPwd, setShowCfmPwd] = useState(false);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = profileSettingsSchema.safeParse(profileData);
    if (!result.success) {
      setProfileError(result.error.issues[0]?.message || 'Dữ liệu hồ sơ chưa hợp lệ.');
      return;
    }
    setProfileError(null);
    toast.success('Thông tin hồ sơ cá nhân đã được cập nhật thành công!');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = changePasswordSchema.safeParse(passwordData);
    if (!result.success) {
      setPasswordError(result.error.issues[0]?.message || 'Dữ liệu mật khẩu chưa hợp lệ.');
      return;
    }
    setPasswordError(null);
    toast.success('Mật khẩu bảo mật đã được thay đổi thành công!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] font-sans text-slate-900 antialiased">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {/* Header Profile Banner */}
        <Card className="rounded-2xl border-slate-200/80 bg-white py-6 shadow-xs">
          <CardContent className="flex flex-col items-start justify-between gap-4 px-6 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 shadow-xs">
                <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">
                  NA
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{profileData.fullName}</h2>
                  <Badge
                    variant="outline"
                    className="gap-1 rounded-full border-[#b7eb8f] bg-[#f6ffed] px-2.5 py-0.5 text-xs font-semibold text-[#03864b]"
                  >
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    Đã Định Danh BYT
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Đại diện Hộ gia đình FamiDoc • Mã hồ sơ:{' '}
                  <span className="font-bold text-primary tabular-nums">FMD-88219</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Trạng thái BHYT:</span>
              <Badge variant="secondary" className="rounded-lg bg-accent px-2.5 py-1 text-xs font-bold text-primary">
                Hiệu lực đến 12/2027
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Main Settings Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Sidebar Nav */}
          <div className="space-y-2 md:col-span-4">
            <Card className="rounded-2xl border-slate-200/80 bg-white p-2 shadow-xs">
              <CardContent className="space-y-1 p-0">
                <Button
                  type="button"
                  variant={activeTab === 'profile' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('profile')}
                  className={`h-11 w-full cursor-pointer justify-start gap-3 rounded-xl px-4 text-xs font-semibold ${
                    activeTab === 'profile' ? 'shadow-xs' : 'text-slate-600 hover:bg-accent hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  <span>Thông tin cá nhân &amp; Y tế</span>
                </Button>

                <Button
                  type="button"
                  variant={activeTab === 'security' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('security')}
                  className={`h-11 w-full cursor-pointer justify-start gap-3 rounded-xl px-4 text-xs font-semibold ${
                    activeTab === 'security' ? 'shadow-xs' : 'text-slate-600 hover:bg-accent hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">security</span>
                  <span>Bảo mật &amp; Mật khẩu</span>
                </Button>

                <Button
                  type="button"
                  variant={activeTab === 'insurance' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('insurance')}
                  className={`h-11 w-full cursor-pointer justify-start gap-3 rounded-xl px-4 text-xs font-semibold ${
                    activeTab === 'insurance' ? 'shadow-xs' : 'text-slate-600 hover:bg-accent hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">health_and_safety</span>
                  <span>Bảo hiểm Y tế &amp; Ký quỹ</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Content Pane */}
          <Card className="rounded-2xl border-slate-200/80 bg-white p-6 shadow-xs md:col-span-8">
            <CardContent className="p-0">
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Hồ sơ Hành chính &amp; Chỉ số Y khoa
                    </h3>
                    <Separator className="mt-2" />
                  </div>

                  {profileError && (
                    <Alert variant="destructive" className="rounded-xl border-rose-200 bg-rose-50 text-rose-700">
                      <AlertDescription className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                        <span>{profileError}</span>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="settings-fullname" className="text-xs font-semibold text-slate-800">
                        Họ và tên
                      </Label>
                      <Input
                        id="settings-fullname"
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                        className="rounded-lg bg-slate-50/70 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="settings-phone" className="text-xs font-semibold text-slate-800">
                        Số điện thoại
                      </Label>
                      <Input
                        id="settings-phone"
                        type="text"
                        disabled
                        value={profileData.phone}
                        className="rounded-lg bg-slate-100 text-sm text-slate-500 tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="settings-birthdate" className="text-xs font-semibold text-slate-800">
                        Ngày sinh
                      </Label>
                      <Input
                        id="settings-birthdate"
                        type="date"
                        value={profileData.birthDate}
                        onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                        className="rounded-lg bg-slate-50/70 text-sm tabular-nums"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="settings-bloodtype" className="text-xs font-semibold text-slate-800">
                        Nhóm máu
                      </Label>
                      <Select
                        value={profileData.bloodType}
                        onValueChange={(value) => setProfileData({ ...profileData, bloodType: value })}
                      >
                        <SelectTrigger id="settings-bloodtype" className="w-full rounded-lg bg-slate-50/70 text-sm">
                          <SelectValue placeholder="Chọn nhóm máu" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="settings-address" className="text-xs font-semibold text-slate-800">
                      Địa chỉ thường trú
                    </Label>
                    <Input
                      id="settings-address"
                      type="text"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      className="rounded-lg bg-slate-50/70 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="settings-allergies" className="text-xs font-semibold text-slate-800">
                      Tiền sử dị ứng thuốc &amp; thực phẩm
                    </Label>
                    <Input
                      id="settings-allergies"
                      type="text"
                      value={profileData.allergies}
                      onChange={(e) => setProfileData({ ...profileData, allergies: e.target.value })}
                      placeholder="Ví dụ: Dị ứng kháng sinh Penicillin, dị ứng hải sản"
                      className="rounded-lg bg-slate-50/70 text-sm"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" className="cursor-pointer rounded-lg px-6 text-xs font-semibold shadow-xs">
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>Lưu thay đổi hồ sơ</span>
                    </Button>
                  </div>
                </form>
              )}

              {activeTab === 'security' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Đổi Mật khẩu &amp; Bảo mật Tài khoản
                    </h3>
                    <Separator className="mt-2" />
                  </div>

                  {passwordError && (
                    <Alert variant="destructive" className="rounded-xl border-rose-200 bg-rose-50 text-rose-700">
                      <AlertDescription className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                        <span>{passwordError}</span>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="settings-curpwd" className="text-xs font-semibold text-slate-800">
                      Mật khẩu hiện tại
                    </Label>
                    <div className="relative">
                      <Input
                        id="settings-curpwd"
                        type={showCurrentPwd ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        className="rounded-lg bg-slate-50/70 pr-10 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        aria-label={showCurrentPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showCurrentPwd ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="settings-newpwd" className="text-xs font-semibold text-slate-800">
                        Mật khẩu mới
                      </Label>
                      <div className="relative">
                        <Input
                          id="settings-newpwd"
                          type={showNewPwd ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                          }
                          className="rounded-lg bg-slate-50/70 pr-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPwd(!showNewPwd)}
                          className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          aria-label={showNewPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showNewPwd ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="settings-cfmpwd" className="text-xs font-semibold text-slate-800">
                        Nhập lại mật khẩu mới
                      </Label>
                      <div className="relative">
                        <Input
                          id="settings-cfmpwd"
                          type={showCfmPwd ? 'text' : 'password'}
                          value={passwordData.confirmNewPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmNewPassword: e.target.value,
                            })
                          }
                          className="rounded-lg bg-slate-50/70 pr-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCfmPwd(!showCfmPwd)}
                          className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          aria-label={showCfmPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showCfmPwd ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" className="cursor-pointer rounded-lg px-6 text-xs font-semibold shadow-xs">
                      <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                      <span>Cập nhật mật khẩu</span>
                    </Button>
                  </div>
                </form>
              )}

              {activeTab === 'insurance' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Bảo hiểm Y tế &amp; Ký quỹ
                    </h3>
                    <Separator className="mt-2" />
                  </div>
                  <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Mã thẻ BHYT Điện tử:</span>
                      <span className="text-sm font-bold text-primary tabular-nums">
                        {profileData.insuranceCardNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">
                        Bệnh viện Đăng ký KCB Ban đầu:
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        BV Đại học Y Dược TP.HCM (Mã 79-021)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">
                        Tài khoản Ký quỹ Escrow Y tế:
                      </span>
                      <span className="text-xs font-bold text-[#03864b]">
                        Đang hoạt động (Được bảo chứng 100%)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
