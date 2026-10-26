'use client';

import React, { useState } from 'react';
import { profileSettingsSchema, changePasswordSchema } from '../schemas/settings.schema';

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

  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = profileSettingsSchema.safeParse(profileData);
    if (!result.success) {
      alert(result.error.issues[0]?.message);
      return;
    }
    setSavedMessage('Thông tin hồ sơ cá nhân đã được cập nhật thành công!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = changePasswordSchema.safeParse(passwordData);
    if (!result.success) {
      alert(result.error.issues[0]?.message);
      return;
    }
    setSavedMessage('Mật khẩu bảo mật đã được thay đổi thành công!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    setTimeout(() => setSavedMessage(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header Profile Banner */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            NA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-on-surface">{profileData.fullName}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f6ffed] border border-[#b7eb8f] text-[#03864b] flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Đã Định Danh BYT
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Đại diện Hộ gia đình FamiDoc • Mã hồ sơ: <span className="font-mono text-primary font-bold">FMD-88219</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant">Trạng thái BHYT:</span>
          <span className="text-xs font-bold text-primary bg-surface-container px-2.5 py-1 rounded-lg">
            Hiệu lực đến 12/2027
          </span>
        </div>
      </div>

      {savedMessage && (
        <div role="status" className="p-4 rounded-xl bg-[#f6ffed] border border-[#b7eb8f] text-[#03864b] text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          {savedMessage}
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar Nav */}
        <div className="md:col-span-4 space-y-2">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-2 shadow-sm space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-primary-container text-white shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span>Thông tin cá nhân &amp; Y tế</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'security'
                  ? 'bg-primary-container text-white shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">security</span>
              <span>Bảo mật &amp; Mật khẩu</span>
            </button>

            <button
              onClick={() => setActiveTab('insurance')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'insurance'
                  ? 'bg-primary-container text-white shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">health_and_safety</span>
              <span>Bảo hiểm Y tế &amp; Ký quỹ</span>
            </button>
          </div>
        </div>

        {/* Content Pane */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <h3 className="text-base font-bold text-on-surface border-b border-outline-variant pb-2">
                Hồ sơ Hành chính &amp; Chỉ số Y khoa
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="settings-fullname" className="block text-xs font-semibold text-on-surface mb-1">Họ và tên</label>
                  <input
                    id="settings-fullname"
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface-container-low focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="settings-phone" className="block text-xs font-semibold text-on-surface mb-1">Số điện thoại</label>
                  <input
                    id="settings-phone"
                    type="text"
                    disabled
                    value={profileData.phone}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface-container text-outline cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="settings-birthdate" className="block text-xs font-semibold text-on-surface mb-1">Ngày sinh</label>
                  <input
                    id="settings-birthdate"
                    type="date"
                    value={profileData.birthDate}
                    onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface-container-low focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="settings-bloodtype" className="block text-xs font-semibold text-on-surface mb-1">Nhóm máu</label>
                  <select
                    id="settings-bloodtype"
                    value={profileData.bloodType}
                    onChange={(e) => setProfileData({ ...profileData, bloodType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface-container-low focus:outline-none focus:border-primary"
                  >
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                    <option value="O+">O+</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="settings-address" className="block text-xs font-semibold text-on-surface mb-1">Địa chỉ thường trú</label>
                <input
                  id="settings-address"
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface-container-low focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="settings-allergies" className="block text-xs font-semibold text-on-surface mb-1">Tiền sử dị ứng thuốc &amp; thực phẩm</label>
                <input
                  id="settings-allergies"
                  type="text"
                  value={profileData.allergies}
                  onChange={(e) => setProfileData({ ...profileData, allergies: e.target.value })}
                  placeholder="Ví dụ: Dị ứng kháng sinh Penicillin, dị ứng hải sản"
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface-container-low focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary-container hover:bg-primary text-white rounded-lg font-semibold text-xs shadow-sm transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  Lưu thay đổi hồ sơ
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <h3 className="text-base font-bold text-on-surface border-b border-outline-variant pb-2">
                Đổi Mật khẩu &amp; Bảo mật Tài khoản
              </h3>

              <div>
                <label htmlFor="settings-curpwd" className="block text-xs font-semibold text-on-surface mb-1">Mật khẩu hiện tại</label>
                <input
                  id="settings-curpwd"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface-container-low focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="settings-newpwd" className="block text-xs font-semibold text-on-surface mb-1">Mật khẩu mới</label>
                  <input
                    id="settings-newpwd"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface-container-low focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor="settings-cfmpwd" className="block text-xs font-semibold text-on-surface mb-1">Nhập lại mật khẩu mới</label>
                  <input
                    id="settings-cfmpwd"
                    type="password"
                    value={passwordData.confirmNewPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface-container-low focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary-container hover:bg-primary text-white rounded-lg font-semibold text-xs shadow-sm transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                  Cập nhật mật khẩu
                </button>
              </div>
            </form>
          )}

          {activeTab === 'insurance' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-on-surface border-b border-outline-variant pb-2">
                Bảo hiểm Y tế &amp; Ký quỹ
              </h3>
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-on-surface-variant">Mã thẻ BHYT Điện tử:</span>
                  <span className="font-mono text-sm font-bold text-primary">{profileData.insuranceCardNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-on-surface-variant">Bệnh viện Đăng ký KCB Ban đầu:</span>
                  <span className="text-xs font-bold text-on-surface">BV Đại học Y Dược TP.HCM (Mã 79-021)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-on-surface-variant">Tài khoản Ký quỹ Escrow Y tế:</span>
                  <span className="text-xs font-bold text-[#03864b]">Đang hoạt động (Được bảo chứng 100%)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
