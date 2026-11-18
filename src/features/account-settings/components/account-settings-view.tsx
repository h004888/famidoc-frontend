'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { z } from 'zod';
import { authApi } from '@/lib/api/auth.api';
import { extractErrorMessage } from '@/lib/api';
import { useAuth } from '@/features/auth/context/auth-context';
import { profileSettingsSchema, changePasswordSchema } from '../schemas/settings.schema';
import type { LoginRole } from '@/features/auth/schemas/auth.schema';
import { getCurrentBrowserHost, getSubdomainPortal } from '@/lib/portal-routing';
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

const nonFamilyProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(70, 'Họ và tên tối đa 70 ký tự'),
  email: z.string().email('Email không đúng định dạng').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
});

const ROLE_SETTINGS_META: Record<
  LoginRole,
  {
    badgeLabel: string;
    badgeIcon: string;
    subtitle: string;
    profileHref?: string;
    profileLinkLabel?: string;
  }
> = {
  ADMIN: {
    badgeLabel: 'Quản trị viên Hệ thống',
    badgeIcon: 'shield_person',
    subtitle: 'Phân Hệ Quản Trị Viên FamiDoc',
    profileHref: '/admin/users',
    profileLinkLabel: 'Quản lý Tài khoản & RBAC',
  },
  FACILITY: {
    badgeLabel: 'Quản trị Cơ sở Y tế',
    badgeIcon: 'local_hospital',
    subtitle: 'Phân Hệ Cơ Sở Y Tế Đối tác B2B',
    profileHref: '/facility/legal-profile',
    profileLinkLabel: 'Hồ sơ Pháp lý & GPHĐ',
  },
  DOCTOR: {
    badgeLabel: 'Bác sĩ Gia đình CCHN',
    badgeIcon: 'stethoscope',
    subtitle: 'Phân Hệ Bác Sĩ Gia Đình',
    profileHref: '/doctor/profile',
    profileLinkLabel: 'Hồ sơ Chuyên môn Bác sĩ',
  },
  FAMILY: {
    badgeLabel: 'Đã Định Danh BYT',
    badgeIcon: 'verified',
    subtitle: 'Đại diện Hộ gia đình FamiDoc',
  },
  PATIENT: {
    badgeLabel: 'Đã Định Danh BYT',
    badgeIcon: 'verified',
    subtitle: 'Thành viên Hộ gia đình FamiDoc',
  },
};

const passwordErrors = new Map([
  ['Current password is not correct', 'Mật khẩu hiện tại không đúng.'],
  ['New password cannot be the same as current password', 'Mật khẩu mới phải khác mật khẩu hiện tại.'],
  ['New password must be between 8 and 64 characters', 'Mật khẩu mới phải từ 8 đến 64 ký tự.'],
]);

export function AccountSettingsView() {
  const { user, role, isAuthenticated, applySession, clearMustChangePassword, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'insurance'>('profile');

  useEffect(() => {
    setMounted(true);
  }, []);

  const hostPortalRole = mounted ? getSubdomainPortal(getCurrentBrowserHost()) : null;
  const effectiveRole: LoginRole = isAuthenticated ? role : hostPortalRole || role || 'FAMILY';
  const isFamilyAccount = effectiveRole === 'FAMILY' || effectiveRole === 'PATIENT';
  const roleMeta = ROLE_SETTINGS_META[effectiveRole] || ROLE_SETTINGS_META.FAMILY;

  const [profileData, setProfileData] = useState({
    fullName: '',
    phone: '',
    email: '',
    birthDate: '1985-05-15',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    address: 'Số 123 Phố Huế, Q. Hai Bà Trưng, Hà Nội',
    insuranceCardNumber: 'GD4010123456789',
    bloodType: 'O+',
    allergies: 'Không có tiền sử dị ứng đã ghi nhận',
  });

  useEffect(() => {
    if (!user) return;
    setProfileData((prev) => ({
      ...prev,
      fullName: user.name || prev.fullName,
      phone: user.phone || prev.phone,
      email: user.email || prev.email,
    }));
  }, [user]);

  useEffect(() => {
    if (!isFamilyAccount && activeTab === 'insurance') {
      setActiveTab('profile');
    }
  }, [isFamilyAccount, activeTab]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showCfmPwd, setShowCfmPwd] = useState(false);

  const displayName = profileData.fullName || user?.name || roleMeta.subtitle;
  const avatarText =
    user?.avatarText ||
    displayName
      .trim()
      .slice(0, 2)
      .toUpperCase() ||
    'FD';

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = isFamilyAccount
      ? profileSettingsSchema.safeParse(profileData)
      : nonFamilyProfileSchema.safeParse(profileData);

    if (!validation.success) {
      setProfileError(validation.error.issues[0]?.message || 'Dữ liệu hồ sơ chưa hợp lệ.');
      return;
    }

    setProfileError(null);
    if (user) {
      applySession(effectiveRole, {
        ...user,
        name: profileData.fullName.trim(),
        email: profileData.email.trim() || user.email,
        phone: profileData.phone.trim() || user.phone,
        avatarText: profileData.fullName.trim().slice(0, 2).toUpperCase() || user.avatarText,
      });
    }
    toast.success('Thông tin tài khoản đã được cập nhật thành công!');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpdatingPassword) return;
    const result = changePasswordSchema.safeParse(passwordData);
    if (!result.success) {
      setPasswordError(result.error.issues[0]?.message || 'Dữ liệu mật khẩu chưa hợp lệ.');
      return;
    }

    setPasswordError(null);
    setIsUpdatingPassword(true);
    try {
      await authApi.changePassword({
        oldPassword: result.data.currentPassword,
        newPassword: result.data.newPassword,
      });
    } catch (err: unknown) {
      const message = extractErrorMessage(
        err,
        'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.',
      );
      setPasswordError(passwordErrors.get(message) ?? message);
      return;
    } finally {
      setIsUpdatingPassword(false);
    }
    toast.success('Mật khẩu bảo mật đã được thay đổi thành công!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    if (effectiveRole === 'ADMIN') {
      logout();
    } else {
      clearMustChangePassword?.();
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] font-sans text-slate-900 antialiased">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {/* Header Profile Banner */}
        <Card className="rounded-2xl border-slate-200/80 bg-white py-6 shadow-xs">
          <CardContent className="flex flex-col items-start justify-between gap-4 px-6 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 shadow-xs">
                <AvatarFallback
                  className="bg-primary text-2xl font-bold text-primary-foreground"
                  suppressHydrationWarning
                >
                  {avatarText}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900" suppressHydrationWarning>
                    {displayName}
                  </h2>
                  <Badge
                    variant="outline"
                    className={
                      isFamilyAccount
                        ? 'gap-1 rounded-full border-[#b7eb8f] bg-[#f6ffed] px-2.5 py-0.5 text-xs font-semibold text-[#03864b]'
                        : 'gap-1 rounded-full border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-primary'
                    }
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {roleMeta.badgeIcon}
                    </span>
                    {roleMeta.badgeLabel}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-500" suppressHydrationWarning>
                  {roleMeta.subtitle}
                  {(user?.email || profileData.email) && ` • ${user?.email || profileData.email}`}
                  {isFamilyAccount && user?.id && (
                    <>
                      {' '}
                      • Mã hồ sơ:{' '}
                      <span className="font-bold text-primary tabular-nums">{user.id}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {isFamilyAccount ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Trạng thái BHYT:</span>
                <Badge
                  variant="secondary"
                  className="rounded-lg bg-accent px-2.5 py-1 text-xs font-bold text-primary"
                >
                  Hiệu lực đến 12/2027
                </Badge>
              </div>
            ) : (
              roleMeta.profileHref &&
              roleMeta.profileLinkLabel && (
                <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
                  <Link href={roleMeta.profileHref}>
                    <span className="material-symbols-outlined text-[16px]">
                      {roleMeta.badgeIcon}
                    </span>
                    <span>{roleMeta.profileLinkLabel}</span>
                  </Link>
                </Button>
              )
            )}
          </CardContent>
        </Card>

        {/* Doctor Quick Access Banner if role is DOCTOR */}
        {effectiveRole === 'DOCTOR' && (
          <div className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined rounded-xl bg-sky-100 p-2 text-sky-700">
                medical_information
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Hồ sơ Hành nghề &amp; Chứng chỉ Bác sĩ Gia đình
                </h4>
                <p className="text-xs text-slate-600">
                  Cập nhật danh mục kỹ thuật, chứng chỉ CCHN hoặc thiết lập lịch khám chuyên môn.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/doctor/profile">
                <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-lg border-sky-200 bg-white text-xs font-semibold text-sky-800 hover:bg-sky-50">
                  <span className="material-symbols-outlined text-[14px]">badge</span>
                  Hồ sơ chuyên môn
                </Button>
              </Link>
              <Link href="/doctor/verification">
                <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-lg border-sky-200 bg-white text-xs font-semibold text-sky-800 hover:bg-sky-50">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Chứng chỉ CCHN
                </Button>
              </Link>
              <Link href="/doctor/timetable">
                <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-lg border-sky-200 bg-white text-xs font-semibold text-sky-800 hover:bg-sky-50">
                  <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                  Lịch làm việc
                </Button>
              </Link>
            </div>
          </div>
        )}

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
                    activeTab === 'profile'
                      ? 'shadow-xs'
                      : 'text-slate-600 hover:bg-accent hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  <span>
                    {isFamilyAccount ? 'Thông tin cá nhân & Y tế' : 'Thông tin tài khoản'}
                  </span>
                </Button>

                <Button
                  type="button"
                  variant={activeTab === 'security' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('security')}
                  className={`h-11 w-full cursor-pointer justify-start gap-3 rounded-xl px-4 text-xs font-semibold ${
                    activeTab === 'security'
                      ? 'shadow-xs'
                      : 'text-slate-600 hover:bg-accent hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">security</span>
                  <span>Bảo mật &amp; Mật khẩu</span>
                </Button>

                {isFamilyAccount && (
                  <Button
                    type="button"
                    variant={activeTab === 'insurance' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('insurance')}
                    className={`h-11 w-full cursor-pointer justify-start gap-3 rounded-xl px-4 text-xs font-semibold ${
                      activeTab === 'insurance'
                        ? 'shadow-xs'
                        : 'text-slate-600 hover:bg-accent hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">health_and_safety</span>
                    <span>Bảo hiểm Y tế &amp; Ký quỹ</span>
                  </Button>
                )}
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
                      {isFamilyAccount
                        ? 'Hồ sơ Hành chính & Chỉ số Y khoa'
                        : 'Thông tin Định danh Tài khoản'}
                    </h3>
                    <Separator className="mt-2" />
                  </div>

                  {profileError && (
                    <Alert
                      variant="destructive"
                      className="rounded-xl border-rose-200 bg-rose-50 text-rose-700"
                    >
                      <AlertDescription className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                        <span>{profileError}</span>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label
                        htmlFor="settings-fullname"
                        className="text-xs font-semibold text-slate-800"
                      >
                        Họ và tên
                      </Label>
                      <Input
                        id="settings-fullname"
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) =>
                          setProfileData({ ...profileData, fullName: e.target.value })
                        }
                        className="rounded-lg bg-slate-50/70 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="settings-phone"
                        className="text-xs font-semibold text-slate-800"
                      >
                        Số điện thoại
                      </Label>
                      <Input
                        id="settings-phone"
                        type="text"
                        disabled={isFamilyAccount}
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({ ...profileData, phone: e.target.value })
                        }
                        className={
                          isFamilyAccount
                            ? 'rounded-lg bg-slate-100 text-sm text-slate-500 tabular-nums'
                            : 'rounded-lg bg-slate-50/70 text-sm tabular-nums'
                        }
                      />
                    </div>
                  </div>

                  {!isFamilyAccount && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label
                          htmlFor="settings-email"
                          className="text-xs font-semibold text-slate-800"
                        >
                          Email đăng nhập
                        </Label>
                        <Input
                          id="settings-email"
                          type="email"
                          disabled
                          value={profileData.email}
                          className="rounded-lg bg-slate-100 text-sm text-slate-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label
                          htmlFor="settings-role"
                          className="text-xs font-semibold text-slate-800"
                        >
                          Vai trò hệ thống
                        </Label>
                        <Input
                          id="settings-role"
                          type="text"
                          disabled
                          value={roleMeta.badgeLabel}
                          className="rounded-lg bg-slate-100 text-sm text-slate-600 font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {isFamilyAccount && (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label
                            htmlFor="settings-birthdate"
                            className="text-xs font-semibold text-slate-800"
                          >
                            Ngày sinh
                          </Label>
                          <Input
                            id="settings-birthdate"
                            type="date"
                            value={profileData.birthDate}
                            onChange={(e) =>
                              setProfileData({ ...profileData, birthDate: e.target.value })
                            }
                            className="rounded-lg bg-slate-50/70 text-sm tabular-nums"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label
                            htmlFor="settings-bloodtype"
                            className="text-xs font-semibold text-slate-800"
                          >
                            Nhóm máu
                          </Label>
                          <Select
                            value={profileData.bloodType}
                            onValueChange={(value) =>
                              setProfileData({ ...profileData, bloodType: value })
                            }
                          >
                            <SelectTrigger
                              id="settings-bloodtype"
                              className="w-full rounded-lg bg-slate-50/70 text-sm"
                            >
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
                        <Label
                          htmlFor="settings-address"
                          className="text-xs font-semibold text-slate-800"
                        >
                          Địa chỉ thường trú
                        </Label>
                        <Input
                          id="settings-address"
                          type="text"
                          value={profileData.address}
                          onChange={(e) =>
                            setProfileData({ ...profileData, address: e.target.value })
                          }
                          className="rounded-lg bg-slate-50/70 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label
                          htmlFor="settings-allergies"
                          className="text-xs font-semibold text-slate-800"
                        >
                          Tiền sử dị ứng thuốc &amp; thực phẩm
                        </Label>
                        <Input
                          id="settings-allergies"
                          type="text"
                          value={profileData.allergies}
                          onChange={(e) =>
                            setProfileData({ ...profileData, allergies: e.target.value })
                          }
                          placeholder="Ví dụ: Dị ứng kháng sinh Penicillin, dị ứng hải sản"
                          className="rounded-lg bg-slate-50/70 text-sm"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      className="cursor-pointer rounded-lg px-6 text-xs font-semibold shadow-xs"
                    >
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
                    {effectiveRole === 'ADMIN' && (
                      <p className="mt-2 text-sm text-slate-600">
                        Mật khẩu mới có hiệu lực ngay sau khi lưu. Bạn sẽ đăng nhập lại bằng mật khẩu mới.
                      </p>
                    )}
                    <Separator className="mt-2" />
                  </div>

                  {passwordError && (
                    <Alert
                      variant="destructive"
                      className="rounded-xl border-rose-200 bg-rose-50 text-rose-700"
                    >
                      <AlertDescription className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                        <span>{passwordError}</span>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-1">
                    <Label
                      htmlFor="settings-curpwd"
                      className="text-xs font-semibold text-slate-800"
                    >
                      Mật khẩu hiện tại
                    </Label>
                    <div className="relative">
                      <Input
                        id="settings-curpwd"
                        type={showCurrentPwd ? 'text' : 'password'}
                        autoComplete="current-password"
                        disabled={isUpdatingPassword}
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
                      <Label
                        htmlFor="settings-newpwd"
                        className="text-xs font-semibold text-slate-800"
                      >
                        Mật khẩu mới
                      </Label>
                      <div className="relative">
                        <Input
                          id="settings-newpwd"
                          type={showNewPwd ? 'text' : 'password'}
                          autoComplete="new-password"
                          disabled={isUpdatingPassword}
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
                      <Label
                        htmlFor="settings-cfmpwd"
                        className="text-xs font-semibold text-slate-800"
                      >
                        Nhập lại mật khẩu mới
                      </Label>
                      <div className="relative">
                        <Input
                          id="settings-cfmpwd"
                          type={showCfmPwd ? 'text' : 'password'}
                          autoComplete="new-password"
                          disabled={isUpdatingPassword}
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
                    <Button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="cursor-pointer rounded-lg px-6 text-xs font-semibold shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                      <span>{isUpdatingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
                    </Button>
                  </div>
                </form>
              )}

              {isFamilyAccount && activeTab === 'insurance' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Bảo hiểm Y tế &amp; Ký quỹ
                    </h3>
                    <Separator className="mt-2" />
                  </div>
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">
                        Mã thẻ BHYT Điện tử:
                      </span>
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
