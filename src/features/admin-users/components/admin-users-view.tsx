'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog, PageHeader } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

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
  const [confirmSuspendUser, setConfirmSuspendUser] = useState<SystemUser | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const filteredUsers = users.filter((u) => {
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery);
    return matchesRole && matchesSearch;
  });

  const handleActionClick = (u: SystemUser) => {
    if (u.status === 'suspended') {
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, status: 'active' } : item))
      );
      toast.success(`Đã khôi phục hoạt động cho tài khoản ${u.name} (${u.id})`);
    } else {
      setConfirmSuspendUser(u);
      setSuspendReason('');
    }
  };

  const handleConfirmSuspend = () => {
    if (!confirmSuspendUser) return;
    setUsers((prev) =>
      prev.map((item) => (item.id === confirmSuspendUser.id ? { ...item, status: 'suspended' } : item))
    );
    toast.success(
      `Đã khóa quyền truy cập tài khoản ${confirmSuspendUser.name}. Lý do: ${
        suspendReason.trim() || 'Theo quyết định an ninh hệ thống'
      }`
    );
    setConfirmSuspendUser(null);
    setSuspendReason('');
  };

  return (
    <div className="min-h-full bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <PageHeader
          title="Quản trị Tài khoản, Phân quyền RBAC & Audit Logs"
          description="Kiểm soát quyền truy cập dữ liệu y tế nhạy cảm và nhật ký truy vết an ninh tuân thủ HIPAA"
          actions={
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'users' | 'audit_logs')}>
              <TabsList className="rounded-xl bg-slate-200/70 p-1">
                <TabsTrigger value="users" className="rounded-lg px-4 text-xs sm:text-sm font-semibold data-[state=active]:text-primary">
                  Danh sách Người dùng ({users.length})
                </TabsTrigger>
                <TabsTrigger value="audit_logs" className="rounded-lg px-4 text-xs sm:text-sm font-semibold data-[state=active]:text-primary">
                  Audit Logs Bảo mật ({auditLogs.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
        />

        {/* TAB 1: USERS & RBAC */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <Card className="rounded-2xl border-slate-200 py-4 shadow-xs">
              <CardContent className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 px-4">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    search
                  </span>
                  <Input
                    type="text"
                    placeholder="Tìm theo họ tên, email, số điện thoại..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 bg-slate-50 rounded-xl text-xs sm:text-sm"
                  />
                </div>

                <select
                  aria-label="Lọc theo vai trò"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="h-9 px-3 bg-slate-50 border border-input rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="super_admin">Quản trị viên Cấp cao</option>
                  <option value="facility_admin">Quản lý Bệnh viện B2B</option>
                  <option value="doctor">Bác sĩ Gia đình</option>
                  <option value="family_head">Đại diện Hộ gia đình</option>
                </select>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-xs overflow-hidden py-0 gap-0">
              <div className="hidden md:block">
              <Table className="text-xs sm:text-sm">
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold tracking-wider hover:bg-slate-50">
                    <TableHead className="py-3.5 px-4 text-slate-600">Người dùng</TableHead>
                    <TableHead className="py-3.5 px-4 text-slate-600">Liên hệ</TableHead>
                    <TableHead className="py-3.5 px-4 text-slate-600">Vai trò RBAC</TableHead>
                    <TableHead className="py-3.5 px-4 text-center text-slate-600">Bảo mật 2FA</TableHead>
                    <TableHead className="py-3.5 px-4 text-center text-slate-600">Trạng thái</TableHead>
                    <TableHead className="py-3.5 px-4 text-right text-slate-600">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id} className="hover:bg-slate-50/70">
                      <TableCell className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="tabular-nums text-[11px] text-slate-400">{u.id}</div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <div className="text-slate-800">{u.email}</div>
                        <div className="text-[11px] text-slate-400 tabular-nums">{u.phone}</div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        {u.role === 'super_admin' && (
                          <Badge className="rounded-full text-[11px] font-bold bg-slate-900 text-white">
                            Super Admin
                          </Badge>
                        )}
                        {u.role === 'facility_admin' && (
                          <Badge variant="secondary" className="rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                            Quản lý BV B2B
                          </Badge>
                        )}
                        {u.role === 'doctor' && (
                          <Badge variant="secondary" className="rounded-full text-[11px] font-bold bg-accent text-primary">
                            Bác sĩ CCHN
                          </Badge>
                        )}
                        {u.role === 'family_head' && (
                          <Badge variant="secondary" className="rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            Chủ hộ gia đình
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center">
                        {u.mfaEnabled ? (
                          <span className="text-emerald-600 font-semibold flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">verified_user</span>
                            <span>Bật</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Chưa kích hoạt</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center">
                        {u.status === 'active' && (
                          <Badge variant="outline" className="rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                            Hoạt động
                          </Badge>
                        )}
                        {u.status === 'suspended' && (
                          <Badge variant="outline" className="rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border-rose-200">
                            Đã khóa
                          </Badge>
                        )}
                        {u.status === 'pending_2fa' && (
                          <Badge variant="outline" className="rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border-amber-200">
                            Chờ KYC
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-right">
                        <Button
                          type="button"
                          size="xs"
                          variant={u.status === 'suspended' ? 'default' : 'secondary'}
                          onClick={() => handleActionClick(u)}
                          className={`rounded-lg text-xs font-semibold cursor-pointer ${
                            u.status === 'suspended'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'hover:bg-rose-50 hover:text-rose-600'
                          }`}
                        >
                          {u.status === 'suspended' ? 'Mở khóa' : 'Khóa truy cập'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="space-y-2.5 p-4 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400 tabular-nums">{u.id}</div>
                      </div>
                      {u.status === 'active' ? (
                        <Badge variant="outline" className="rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">Hoạt động</Badge>
                      ) : u.status === 'suspended' ? (
                        <Badge variant="outline" className="rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border-rose-200">Đã khóa</Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border-amber-200">Chờ KYC</Badge>
                      )}
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5 space-y-1 text-slate-600">
                      <div className="truncate">{u.email}</div>
                      <div className="tabular-nums text-[11px] text-slate-500">{u.phone} • 2FA: {u.mfaEnabled ? 'Bật' : 'Chưa kích hoạt'}</div>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <Badge variant="secondary" className="rounded-full text-[11px] font-semibold">{u.role}</Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant={u.status === 'suspended' ? 'default' : 'secondary'}
                        onClick={() => handleActionClick(u)}
                        className="rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        {u.status === 'suspended' ? 'Mở khóa' : 'Khóa truy cập'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: AUDIT LOGS */}
        {activeTab === 'audit_logs' && (
          <Card className="rounded-2xl border-slate-200 p-5 shadow-xs space-y-4">
            <CardContent className="p-0 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Bảng Nhật ký Truy vết An ninh (Immutable Audit Logs)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Lưu trữ toàn bộ thao tác tác động lên EMR bệnh án và luồng giải ngân Escrow</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info('Đang chuẩn bị file CSV Audit Logs có chữ ký số xác thực...')}
                  className="rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Xuất file Audit Kiểm toán</span>
                </Button>
              </div>

              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-200 hover:bg-slate-50">
                    <TableHead className="py-3 px-3 text-slate-500">Thời gian (UTC+7)</TableHead>
                    <TableHead className="py-3 px-3 text-slate-500">Người thực hiện</TableHead>
                    <TableHead className="py-3 px-3 text-slate-500">Hành động ghi vết</TableHead>
                    <TableHead className="py-3 px-3 text-slate-500">Đối tượng tác động</TableHead>
                    <TableHead className="py-3 px-3 text-slate-500">Địa chỉ IP</TableHead>
                    <TableHead className="py-3 px-3 text-center text-slate-500">Cấp độ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/70 tabular-nums">
                      <TableCell className="py-3 px-3 text-slate-500 font-sans">{log.timestamp}</TableCell>
                      <TableCell className="py-3 px-3 font-sans">
                        <span className="font-bold text-slate-800">{log.actorName}</span>
                        <span className="text-[10px] text-slate-400 block">{log.actorRole}</span>
                      </TableCell>
                      <TableCell className="py-3 px-3 font-bold text-primary">{log.action}</TableCell>
                      <TableCell className="py-3 px-3 text-slate-600 font-sans">{log.targetResource}</TableCell>
                      <TableCell className="py-3 px-3 text-slate-500">{log.ipAddress}</TableCell>
                      <TableCell className="py-3 px-3 text-center">
                        {log.severity === 'critical' ? (
                          <Badge className="rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 hover:bg-rose-100">
                            Nguy hiểm
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                            Thông tin
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* DIALOG XÁC NHẬN KHÓA TRUY CẬP TÀI KHOẢN */}
        <ConfirmDialog
          open={Boolean(confirmSuspendUser)}
          onOpenChange={(open) => !open && setConfirmSuspendUser(null)}
          title="Xác Nhận Khóa Quyền Truy Cập"
          description="Hành động này sẽ vô hiệu hóa phiên đăng nhập tức thời"
          headerIcon={<span className="material-symbols-outlined text-[24px] text-rose-600">gavel</span>}
          confirmLabel="Xác nhận Khóa tài khoản"
          cancelLabel="Hủy bỏ"
          variant="destructive"
          onConfirm={handleConfirmSuspend}
        >
          {confirmSuspendUser && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5 leading-relaxed">
                <p>
                  Bạn đang chuẩn bị khóa tài khoản của:{' '}
                  <strong>{confirmSuspendUser.name}</strong> ({confirmSuspendUser.email})
                </p>
                <p className="text-[11px] text-rose-700">
                  Người dùng này sẽ bị ngắt kết nối khỏi hệ thống và không thể truy cập hồ sơ bệnh án hoặc thực hiện giao dịch cho đến khi được Admin mở khóa.
                </p>
              </div>

              <div className="space-y-1 text-xs">
                <Label htmlFor="suspend-reason" className="font-bold text-slate-700">
                  Lý do khóa tài khoản (Ghi vào biên bản kiểm toán):
                </Label>
                <Textarea
                  id="suspend-reason"
                  rows={2}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Ví dụ: Nghi vấn lộ thông tin, khiếu nại vi phạm SLA chưa giải quyết..."
                  className="rounded-xl text-xs bg-slate-50 focus-visible:bg-white"
                />
              </div>
            </div>
          )}
        </ConfirmDialog>
      </div>
    </div>
  );
}

