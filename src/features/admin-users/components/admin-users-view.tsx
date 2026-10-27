'use client';

import React, { useState } from 'react';
import { AdminNav } from '@/components/layout';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'facility_admin' | 'doctor' | 'family_head';
  status: 'active' | 'suspended' | 'pending_2fa';
  lastLogin: string;
  mfaEnabled: boolean;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetResource: string;
  ipAddress: string;
  severity: 'info' | 'warning' | 'critical';
}

const INITIAL_USERS: SystemUser[] = [
  {
    id: 'USR-001',
    name: 'Nguyễn Văn An (Ban Giám Đốc)',
    email: 'admin.an@famidoc.pro',
    phone: '0901 888 999',
    role: 'super_admin',
    status: 'active',
    lastLogin: 'Vừa xong',
    mfaEnabled: true,
  },
  {
    id: 'USR-014',
    name: 'DS. Lê Minh Đức (Điều phối Dược BV Y Dược)',
    email: 'duc.lm@umc.edu.vn',
    phone: '0912 334 455',
    role: 'facility_admin',
    status: 'active',
    lastLogin: '15 phút trước',
    mfaEnabled: true,
  },
  {
    id: 'USR-082',
    name: 'BS.CKII Trần Thanh Mai',
    email: 'mai.tt@famidoc.pro',
    phone: '0988 123 789',
    role: 'doctor',
    status: 'active',
    lastLogin: '1 giờ trước',
    mfaEnabled: true,
  },
  {
    id: 'USR-104',
    name: 'Bà Trần Thị Lan (Đại diện Hộ FAM-88219)',
    email: 'lan.tran78@gmail.com',
    phone: '0903 445 667',
    role: 'family_head',
    status: 'active',
    lastLogin: 'Hôm nay 08:30',
    mfaEnabled: false,
  },
  {
    id: 'USR-209',
    name: 'Tài khoản Đăng ký Mới (Chờ KYC)',
    email: 'test.user@yahoo.com',
    phone: '0933 999 000',
    role: 'family_head',
    status: 'pending_2fa',
    lastLogin: 'Chưa đăng nhập',
    mfaEnabled: false,
  },
];

const INITIAL_LOGS: AuditLogEntry[] = [
  {
    id: 'LOG-88491',
    timestamp: '27/10/2026 21:50:12',
    actorName: 'Nguyễn Văn An',
    actorRole: 'Super Admin',
    action: 'CẬP_NHẬT_BIỂU_PHÍ_GÓI_DỊCH_VỤ',
    targetResource: 'PKG-STANDARD (Cập nhật giá 12 tháng)',
    ipAddress: '118.69.182.10',
    severity: 'info',
  },
  {
    id: 'LOG-88488',
    timestamp: '27/10/2026 21:30:45',
    actorName: 'BS. Hoàng Gia Bảo',
    actorRole: 'Family Doctor',
    action: 'KÝ_SỐ_PHIẾU_SOAP_EMR',
    targetResource: 'Bệnh án điện tử ENC-9901 (Cụ Nguyễn Văn Phúc)',
    ipAddress: '14.161.22.45',
    severity: 'info',
  },
  {
    id: 'LOG-88482',
    timestamp: '27/10/2026 20:15:02',
    actorName: 'Hệ thống Tự động (Escrow Worker)',
    actorRole: 'System Daemon',
    action: 'TẠM_GIỮ_QUỸ_ESCROW',
    targetResource: 'Giao dịch VietQR: 15.600.000 đ từ Hộ FAM-88219',
    ipAddress: '10.0.4.12 (Internal)',
    severity: 'info',
  },
  {
    id: 'LOG-88470',
    timestamp: '27/10/2026 19:04:18',
    actorName: 'Không xác định',
    actorRole: 'Anonymous',
    action: 'ĐĂNG_NHẬP_SAI_MẬT_KHẨU_LIÊN_TIẾP',
    targetResource: 'Tài khoản Bác sĩ: mai.tt@famidoc.pro (5 lần thất bại)',
    ipAddress: '185.220.101.5 (Proxy)',
    severity: 'critical',
  },
];

export function AdminUsersView() {
  const [activeTab, setActiveTab] = useState<'users' | 'audit_logs'>('users');
  const [users, setUsers] = useState<SystemUser[]>(INITIAL_USERS);
  const [auditLogs] = useState<AuditLogEntry[]>(INITIAL_LOGS);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState('');

  const filteredUsers = users.filter((u) => {
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery);
    return matchesRole && matchesSearch;
  });

  const handleToggleSuspend = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const newStatus = u.status === 'suspended' ? 'active' : 'suspended';
        return { ...u, status: newStatus };
      })
    );
    setNotification(`Đã cập nhật trạng thái tài khoản ${userId}`);
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
              Quản trị Tài khoản, Phân quyền RBAC &amp; Audit Logs
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Kiểm soát quyền truy cập dữ liệu y tế nhạy cảm và nhật ký truy vết an ninh tuân thủ HIPAA
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'users'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Danh sách Người dùng ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('audit_logs')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'audit_logs'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Audit Logs Bảo mật ({auditLogs.length})
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {notification && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
            <span>{notification}</span>
          </div>
        )}

        {/* TAB 1: USERS & RBAC */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Tìm theo họ tên, email, số điện thoại..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="super_admin">Quản trị viên Cấp cao</option>
                <option value="facility_admin">Quản lý Bệnh viện B2B</option>
                <option value="doctor">Bác sĩ Gia đình</option>
                <option value="family_head">Đại diện Hộ gia đình</option>
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Người dùng</th>
                      <th className="py-3.5 px-4">Liên hệ</th>
                      <th className="py-3.5 px-4">Vai trò RBAC</th>
                      <th className="py-3.5 px-4 text-center">Bảo mật 2FA</th>
                      <th className="py-3.5 px-4 text-center">Trạng thái</th>
                      <th className="py-3.5 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="font-mono text-[11px] text-slate-400">{u.id}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800">{u.email}</div>
                          <div className="text-[11px] text-slate-400">{u.phone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {u.role === 'super_admin' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-900 text-white">
                              Super Admin
                            </span>
                          )}
                          {u.role === 'facility_admin' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                              Quản lý BV B2B
                            </span>
                          )}
                          {u.role === 'doctor' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
                              Bác sĩ CCHN
                            </span>
                          )}
                          {u.role === 'family_head' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              Chủ hộ gia đình
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {u.mfaEnabled ? (
                            <span className="text-emerald-600 font-semibold flex items-center justify-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">verified_user</span>
                              <span>Bật</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">Chưa kích hoạt</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {u.status === 'active' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Hoạt động
                            </span>
                          )}
                          {u.status === 'suspended' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Đã khóa
                            </span>
                          )}
                          {u.status === 'pending_2fa' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Chờ KYC
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleToggleSuspend(u.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              u.status === 'suspended'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700'
                            }`}
                          >
                            {u.status === 'suspended' ? 'Mở khóa' : 'Khóa truy cập'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT LOGS */}
        {activeTab === 'audit_logs' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Bảng Nhật ký Truy vết An ninh (Immutable Audit Logs)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Lưu trữ toàn bộ thao tác tác động lên EMR bệnh án và luồng giải ngân Escrow</p>
                </div>
                <button
                  onClick={() => alert('Đang xuất toàn bộ file Audit Logs định dạng .CSV có chữ ký số...')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Xuất file Audit Kiểm toán</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Thời gian (UTC+7)</th>
                      <th className="py-3 px-3">Người thực hiện</th>
                      <th className="py-3 px-3">Hành động ghi vết</th>
                      <th className="py-3 px-3">Đối tượng tác động</th>
                      <th className="py-3 px-3">Địa chỉ IP</th>
                      <th className="py-3 px-3 text-center">Cấp độ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 font-mono">
                        <td className="py-3 px-3 text-slate-500 font-sans">{log.timestamp}</td>
                        <td className="py-3 px-3 font-sans">
                          <span className="font-bold text-slate-800">{log.actorName}</span>
                          <span className="text-[10px] text-slate-400 block">{log.actorRole}</span>
                        </td>
                        <td className="py-3 px-3 font-bold text-indigo-700">{log.action}</td>
                        <td className="py-3 px-3 text-slate-600 font-sans">{log.targetResource}</td>
                        <td className="py-3 px-3 text-slate-500">{log.ipAddress}</td>
                        <td className="py-3 px-3 text-center">
                          {log.severity === 'critical' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                              Nguy hiểm
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                              Thông tin
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

