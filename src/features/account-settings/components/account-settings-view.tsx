'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { profileSettingsSchema, changePasswordSchema } from '../schemas/settings.schema';
import { useAuth } from '@/features/auth/context/auth-context';
import { AuthUser } from '@/lib/auth-storage';
import { authApi } from '@/lib/api/auth.api';
import { doctorsApi, DoctorProfileDto } from '@/lib/api/doctors.api';
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
  const { user, role, applySession } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'insurance'>('profile');

  const [profileData, setProfileData] = useState({
    fullName: user?.name || (role === 'DOCTOR' ? 'BS.CKII Trần Thanh Mai' : 'Nguyễn Văn An'),
    phone: user?.phone || (role === 'DOCTOR' ? '0988123789' : '0912345678'),
    email: user?.email || (role === 'DOCTOR' ? 'mai.tt@famidoc.pro' : 'an.nguyen@famidoc.vn'),
    birthDate: '1985-05-15',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    address:
      role === 'DOCTOR'
        ? '215 Hồng Bàng, Phường 11, Quận 5, TP.HCM'
        : 'Số 123 Phố Huế, Q. Hai Bà Trưng, Hà Nội',
    insuranceCardNumber: role === 'DOCTOR' ? 'BS7901012345678' : 'GD4010123456789',
    bloodType: 'O+',
    allergies: 'Không có tiền sử dị ứng đã ghi nhận',
  });

  const [doctorInfo, setDoctorInfo] = useState<DoctorProfileDto | null>(null);

  // Sync profile data when user changes in auth context
  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        fullName: user.name || prev.fullName,
        phone: user.phone || prev.phone,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  // Fetch real doctor info if logged in as DOCTOR
  useEffect(() => {
    if (role === 'DOCTOR') {
      doctorsApi
        .getDoctorMe()
        .then((doc) => {
          if (doc) {
            setDoctorInfo(doc);
            if (doc.doctorName) {
              setProfileData((prev) => ({
                ...prev,
                fullName: doc.doctorName,
              }));
            }
          }
        })
        .catch(() => {
          // Fallback gracefully
        });
    }
  }, [role]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
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
    setIsSavingProfile(true);

    try {
      if (user) {
        const initials =
          profileData.fullName
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map((w) => w[0])
            .slice(-2)
            .join('')
            .toUpperCase() || user.avatarText;

        const updatedUser: AuthUser = {
          ...user,
          name: profileData.fullName,
          phone: profileData.phone,
          email: profileData.email || user.email,
          avatarText: initials,
        };
        applySession(role, updatedUser);
      }
      toast.success('Thông tin hồ sơ cá nhân đã được cập nhật thành công!');
    } catch {
      toast.error('Có lỗi xảy ra khi lưu thông tin');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = changePasswordSchema.safeParse(passwordData);
    if (!result.success) {
      setPasswordError(result.error.issues[0]?.message || 'Dữ liệu mật khẩu chưa hợp lệ.');
      return;
    }
    setPasswordError(null);
    setIsChangingPassword(true);

    try {
      await authApi.changePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Mật khẩu bảo mật đã được thay đổi thành công!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.details?.message ||
        'Không thể cập nhật mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.';
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getInitials = (name?: string, fallback = 'FD') => {
    if (!name) return fallback;
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const avatarFallback = user?.avatarText || getInitials(profileData.fullName, 'NA');

  const getRoleHeaderInfo = () => {
    switch (role) {
      case 'DOCTOR':
        return {
          roleBadge: 'Bác sĩ Gia đình CCHN',
          verifyBadge: 'Đã Định Danh & Xác Thực BYT',
          subtitle: (
            <>
              {doctorInfo?.specialty || 'Nội Tim Mạch & Y học Gia đình'} •{' '}
              {doctorInfo?.facilityName || doctorInfo?.facility?.facilityName || 'BV Đại Học Y Dược TP.HCM'} • CCHN:{' '}
              <span className="font-bold text-primary tabular-nums">
                {doctorInfo?.credentials?.[0]?.certificateNumber || '004128/HCM'}
              </span>
            </>
          ),
          rightStatusLabel: 'Trạng thái CCHN:',
          rightStatusBadge: 'Hiệu lực Toàn quốc',
        };
      case 'FACILITY':
        return {
          roleBadge: 'Quản trị Cơ sở Y tế',
          verifyBadge: 'Đối tác Y tế Chính thức',
          subtitle: (
            <>
              Đơn vị Y tế Thành viên FamiDoc • Mã đơn vị:{' '}
              <span className="font-bold text-primary tabular-nums">{user?.id || 'FAC-79012'}</span>
            </>
          ),
          rightStatusLabel: 'Ký quỹ Y tế:',
          rightStatusBadge: 'Đang hoạt động',
        };
      case 'ADMIN':
        return {
          roleBadge: 'Quản trị viên Hệ thống',
          verifyBadge: 'Toàn quyền Quản trị',
          subtitle: <>Hệ sinh thái Quản trị Y tế Gia đình Toàn diện FamiDoc</>,
          rightStatusLabel: 'Bảo mật 2FA:',
          rightStatusBadge: 'Đang kích hoạt',
        };
      case 'PATIENT':
        return {
          roleBadge: 'Bệnh nhân Thành viên',
          verifyBadge: 'Đã Định Danh BYT',
          subtitle: (
            <>
              Thành viên Hộ gia đình FamiDoc • Mã hồ sơ:{' '}
              <span className="font-bold text-primary tabular-nums">{user?.id || 'PT-01'}</span>
            </>
          ),
          rightStatusLabel: 'Trạng thái BHYT:',
          rightStatusBadge: 'Hiệu lực đến 12/2027',
        };
      case 'FAMILY':
      default:
        return {
          roleBadge: 'Đại diện Hộ gia đình',
          verifyBadge: 'Đã Định Danh BYT',
          subtitle: (
            <>
              Đại diện Hộ gia đình FamiDoc • Mã hồ sơ:{' '}
              <span className="font-bold text-primary tabular-nums">{user?.id || 'FMD-88219'}</span>
            </>
          ),
          rightStatusLabel: 'Trạng thái BHYT:',
          rightStatusBadge: 'Hiệu lực đến 12/2027',
        };
    }
  };

  const headerInfo = getRoleHeaderInfo();

  return (
    <div className="min-h-screen bg-[#f5f6f8] font-sans text-slate-900 antialiased">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {/* Header Profile Banner */}
        <Card className="rounded-2xl border-slate-200/80 bg-white py-6 shadow-xs">
          <CardContent className="flex flex-col items-start justify-between gap-4 px-6 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 shadow-xs">
                <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">
                  {avatarFallback}
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
                    {headerInfo.verifyBadge}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{headerInfo.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{headerInfo.rightStatusLabel}</span>
              <Badge variant="secondary" className="rounded-lg bg-accent px-2.5 py-1 text-xs font-bold text-primary">
                {headerInfo.rightStatusBadge}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Doctor Quick Access Banner if role is DOCTOR */}
        {role === 'DOCTOR' && (
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
                    activeTab === 'profile' ? 'shadow-xs' : 'text-slate-600 hover:bg-accent hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  <span>
                    {role === 'DOCTOR' ? 'Thông tin Bác sĩ & Liên hệ' : 'Thông tin cá nhân & Y tế'}
                  </span>
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
                      {role === 'DOCTOR'
                        ? 'Hồ sơ Định danh & Thông tin Công tác Bác sĩ'
                        : 'Hồ sơ Hành chính & Chỉ số Y khoa'}
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
                        {role === 'DOCTOR' ? 'Họ và tên Bác sĩ' : 'Họ và tên'}
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
                      <Label htmlFor="settings-email" className="text-xs font-semibold text-slate-800">
                        Địa chỉ Email
                      </Label>
                      <Input
                        id="settings-email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="rounded-lg bg-slate-50/70 text-sm"
                      />
                    </div>

                    {role === 'DOCTOR' ? (
                      <div className="space-y-1">
                        <Label htmlFor="settings-specialty" className="text-xs font-semibold text-slate-800">
                          Chuyên khoa chính
                        </Label>
                        <Input
                          id="settings-specialty"
                          type="text"
                          disabled
                          value={doctorInfo?.specialty || 'Nội Tim Mạch & Y học Gia đình'}
                          className="rounded-lg bg-slate-100 text-sm text-slate-600"
                        />
                      </div>
                    ) : (
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
                    )}
                  </div>

                  {role === 'DOCTOR' ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="settings-facility" className="text-xs font-semibold text-slate-800">
                          Cơ sở Y tế công tác
                        </Label>
                        <Input
                          id="settings-facility"
                          type="text"
                          disabled
                          value={
                            doctorInfo?.facilityName ||
                            doctorInfo?.facility?.facilityName ||
                            'BV Đại Học Y Dược TP.HCM'
                          }
                          className="rounded-lg bg-slate-100 text-sm text-slate-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="settings-experience" className="text-xs font-semibold text-slate-800">
                          Kinh nghiệm chuyên khoa
                        </Label>
                        <Input
                          id="settings-experience"
                          type="text"
                          disabled
                          value={`${doctorInfo?.experienceYears || 15} năm kinh nghiệm`}
                          className="rounded-lg bg-slate-100 text-sm text-slate-600 tabular-nums"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                      <div className="space-y-1">
                        <Label htmlFor="settings-gender" className="text-xs font-semibold text-slate-800">
                          Giới tính
                        </Label>
                        <Select
                          value={profileData.gender}
                          onValueChange={(value: 'MALE' | 'FEMALE' | 'OTHER') =>
                            setProfileData({ ...profileData, gender: value })
                          }
                        >
                          <SelectTrigger id="settings-gender" className="w-full rounded-lg bg-slate-50/70 text-sm">
                            <SelectValue placeholder="Chọn giới tính" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MALE">Nam</SelectItem>
                            <SelectItem value="FEMALE">Nữ</SelectItem>
                            <SelectItem value="OTHER">Khác</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="settings-address" className="text-xs font-semibold text-slate-800">
                      {role === 'DOCTOR' ? 'Địa chỉ phòng khám / Cơ quan' : 'Địa chỉ thường trú'}
                    </Label>
                    <Input
                      id="settings-address"
                      type="text"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      className="rounded-lg bg-slate-50/70 text-sm"
                    />
                  </div>

                  {role !== 'DOCTOR' && (
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
                  )}

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={isSavingProfile}
                      className="cursor-pointer rounded-lg px-6 text-xs font-semibold shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>{isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi hồ sơ'}</span>
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
                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                      className="cursor-pointer rounded-lg px-6 text-xs font-semibold shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                      <span>{isChangingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
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
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Mã thẻ BHYT Điện tử:</span>
                      <span className="text-sm font-bold text-primary tabular-nums">
                        {profileData.insuranceCardNumber}
                      </span>
                    </div>

                    {role === 'DOCTOR' ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">
                            Số Chứng chỉ Hành nghề (CCHN):
                          </span>
                          <span className="text-xs font-bold text-slate-900 tabular-nums">
                            {doctorInfo?.credentials?.[0]?.certificateNumber || '004128/HCM'} (Đã định danh BYT)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">
                            Đơn vị KCB Tiếp nhận BHYT:
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {doctorInfo?.facilityName ||
                              doctorInfo?.facility?.facilityName ||
                              'BV Đại học Y Dược TP.HCM (Mã 79-021)'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">
                            Tài khoản Ký quỹ Escrow Y tế:
                          </span>
                          <span className="text-xs font-bold text-[#03864b]">
                            Đang hoạt động (Được bảo chứng 100% qua FamiDoc)
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
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
