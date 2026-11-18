'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { PageHeader, ResponsiveDataList } from '@/components/shared';
import { AdminPageNavigation } from '@/components/shared/admin-page-navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { adminApi, type AdminAuditLog, type AdminUser, type AdminUserRole } from '@/lib/api/admin.api';
import { useAdminQuery } from '@/hooks/use-admin-query';

const roleLabels: Record<AdminUserRole, string> = {
  ADMIN: 'Quản trị viên',
  HEALTHCARE_FACILITY: 'Cơ sở y tế',
  DOCTOR: 'Bác sĩ',
  FAMILY_REP: 'Đại diện hộ gia đình',
};

const roleBadgeClasses: Record<AdminUserRole, string> = {
  ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  HEALTHCARE_FACILITY: 'bg-blue-50 text-blue-700 border-blue-200/80',
  DOCTOR: 'bg-teal-50 text-teal-700 border-teal-200/80',
  FAMILY_REP: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
};

const roleAvatarBgs: Record<AdminUserRole, string> = {
  ADMIN: 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-xs',
  HEALTHCARE_FACILITY: 'bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-xs',
  DOCTOR: 'bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-xs',
  FAMILY_REP: 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-xs',
};

const statusLabels: Record<AdminUser['status'], string> = {
  ACTIVE: 'Hoạt động',
  PENDING: 'Chờ kích hoạt',
  SUSPENDED: 'Đã tạm khóa',
  LOCKED: 'Bị khóa',
};

const statusBadgeClasses: Record<AdminUser['status'], string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  PENDING: 'bg-sky-50 text-sky-700 border-sky-200/80',
  SUSPENDED: 'bg-amber-50 text-amber-700 border-amber-200/80',
  LOCKED: 'bg-rose-50 text-rose-700 border-rose-200/80',
};

const actionMeta: Record<string, { label: string; badgeClass: string; icon: string }> = {
  USER_SUSPENDED: {
    label: 'Tạm khóa tài khoản',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    icon: 'lock',
  },
  USER_ACTIVATED: {
    label: 'Khôi phục tài khoản',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    icon: 'lock_open',
  },
  FACILITY_INVITE_RESENT: {
    label: 'Gửi lại lời mời CSYT',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
    icon: 'forward_to_inbox',
  },
  FACILITY_VERIFIED: {
    label: 'Thẩm định Cơ sở y tế',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200/80',
    icon: 'verified',
  },
  DOCTOR_VERIFIED: {
    label: 'Thẩm định Bác sĩ',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200/80',
    icon: 'verified_user',
  },
  ROLE_ASSIGNED: {
    label: 'Cập nhật phân quyền',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    icon: 'badge',
  },
  SETTLEMENT_REVIEWED: {
    label: 'Duyệt đối soát doanh thu',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
    icon: 'payments',
  },
};

const resourceLabels: Record<string, string> = {
  users: 'Tài khoản người dùng',
  HealthcareFacility: 'Cơ sở y tế',
  Doctor: 'Bác sĩ CCHN',
  Contract: 'Hợp đồng dịch vụ',
  Settlement: 'Quyết toán đối soát',
};

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'medium',
});

const USERS_PER_PAGE = 10;
const AUDIT_LOGS_PER_PAGE = 10;

export function AdminUsersView() {
  const [tab, setTab] = useState<'users' | 'audit'>('users');

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header chính */}
      <PageHeader
        title="Quản lý tài khoản và phân quyền"
        description="Tra cứu vai trò, phân quyền truy cập và giám sát nhật ký hoạt động hệ thống theo chuẩn HIPAA & Bộ Y Tế."
      />

      {/* 4 Thẻ chỉ số tổng quan phong cách Clinical Prestige */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phân quyền RBAC</span>
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center material-symbols-outlined text-[18px]">
              admin_panel_settings
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">4</span>
            <span className="text-xs text-slate-500">nhóm vai trò cốt lõi</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Admin · CSYT · Bác sĩ · Gia đình</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chính sách Truy cập</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center material-symbols-outlined text-[18px]">
              check_circle
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 tabular-nums">Active</span>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Bảo vệ 24/7
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Tự động khóa khi có rủi ro bảo mật</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhật ký Kiểm toán</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#0046c0] flex items-center justify-center material-symbols-outlined text-[18px]">
              verified_user
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">HIPAA</span>
            <span className="text-xs text-slate-500">Bất biến &amp; Toàn vẹn</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Lưu vết mọi hành động thời gian thực</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">An ninh Mạng</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center material-symbols-outlined text-[18px]">
              fingerprint
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">IP Trace</span>
            <span className="text-xs text-slate-500">Định danh tác tử</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Ghi vết địa chỉ IP &amp; thiết bị truy cập</p>
        </div>
      </div>

      {/* Tabs Chuyển đổi Tài khoản / Nhật ký */}
      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)} className="space-y-4">
        <TabsList className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60 inline-flex">
          <TabsTrigger
            value="users"
            className="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all data-[state=active]:bg-white data-[state=active]:text-[#0046c0] data-[state=active]:shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span>Tài khoản người dùng</span>
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all data-[state=active]:bg-white data-[state=active]:text-[#0046c0] data-[state=active]:shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            <span>Nhật ký hoạt động</span>
          </TabsTrigger>
        </TabsList>

        {tab === 'users' ? <UserList /> : <AuditList />}
      </Tabs>
    </div>
  );
}

function UserList() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<AdminUserRole | ''>('');
  const [search, setSearch] = useState('');
  const [q, setQuery] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { data, error, loading, refresh } = useAdminQuery(
    useCallback(
      () => adminApi.users({ page, limit: USERS_PER_PAGE, role: role || undefined, q: q || undefined }),
      [page, role, q],
    ),
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || busy || reason.trim().length < 5) return;
    setBusy(true);
    setSubmitError('');
    try {
      const nextStatus = selected.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      await adminApi.changeUserStatus(selected.id, nextStatus, reason.trim());
      toast.success(
        nextStatus === 'SUSPENDED'
          ? `Đã tạm khóa tài khoản ${selected.fullName}.`
          : `Đã khôi phục tài khoản ${selected.fullName}.`,
      );
      setSelected(null);
      refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không lưu được trạng thái tài khoản.');
    } finally {
      setBusy(false);
    }
  }

  function userAction(user: AdminUser) {
    if (user.role === 'ADMIN' || (user.status !== 'ACTIVE' && !user.canRestore)) return null;
    const isSuspending = user.status === 'ACTIVE';
    return (
      <Button
        size="sm"
        variant={isSuspending ? 'outline' : 'default'}
        className={`rounded-xl text-xs font-semibold h-8 px-3 transition-all ${
          isSuspending
            ? 'text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-200'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
        }`}
        onClick={() => {
          setSelected(user);
          setReason('');
          setSubmitError('');
        }}
      >
        <span className="material-symbols-outlined text-[15px] mr-1.5" aria-hidden="true">
          {isSuspending ? 'lock' : 'lock_open'}
        </span>
        {isSuspending ? 'Tạm khóa' : 'Khôi phục'}
      </Button>
    );
  }

  return (
    <section className="space-y-4">
      {/* Thanh Tìm kiếm & Lọc Vai trò Người dùng */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <form
          className="flex flex-wrap items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setQuery(search.trim());
          }}
        >
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
              search
            </span>
            <Input
              aria-label="Tìm tài khoản"
              placeholder="Tìm theo họ tên, email hoặc số điện thoại..."
              maxLength={150}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9 h-10 rounded-xl border-slate-200 focus-visible:ring-[#0046c0]/20"
            />
          </div>

          <div className="w-52">
            <select
              aria-label="Lọc theo vai trò"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#0046c0]/20 cursor-pointer"
              value={role}
              onChange={(event) => {
                setRole(event.target.value as typeof role);
                setPage(1);
              }}
            >
              <option value="">Tất cả vai trò</option>
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            variant="default"
            className="h-10 px-5 rounded-xl bg-[#0046c0] hover:bg-[#0037c1] text-white font-semibold shadow-xs"
          >
            Tìm kiếm
          </Button>

          {(search || role) && (
            <Button
              type="button"
              variant="ghost"
              className="h-10 px-3 rounded-xl text-slate-600 hover:text-slate-900"
              onClick={() => {
                setSearch('');
                setQuery('');
                setRole('');
                setPage(1);
              }}
            >
              Đặt lại
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            className="h-10 px-3.5 rounded-xl ml-auto border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
            onClick={refresh}
          >
            <span className="material-symbols-outlined text-[18px] mr-1.5 text-slate-500">refresh</span>
            Làm mới
          </Button>
        </form>

        {/* Quick Filter Chips 1 chạm */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Lọc nhanh:</span>
          <button
            type="button"
            onClick={() => { setRole(''); setPage(1); }}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              role === ''
                ? 'bg-blue-50 text-[#0046c0] border-blue-200 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tất cả
          </button>
          {Object.entries(roleLabels).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => { setRole(key as AdminUserRole); setPage(1); }}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                role === key
                  ? 'bg-blue-50 text-[#0046c0] border-blue-200 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Thông tin số lượng hiển thị */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Hiển thị tối đa <strong className="text-slate-700 tabular-nums">10 tài khoản</strong> mỗi trang
        </span>
        {data && (
          <span>
            Tổng số: <strong className="text-slate-700 tabular-nums">{data.total}</strong> tài khoản
          </span>
        )}
      </div>

      {error ? (
        <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {error}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <ResponsiveDataList
            items={data?.items ?? []}
            isLoading={loading}
            keyExtractor={(item) => item.id}
            emptyTitle="Không có tài khoản phù hợp"
            renderDesktopTable={() => (
              <Table>
                <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                  <TableRow className="border-b border-slate-200/80 hover:bg-transparent">
                    <TableHead className="w-[38%] text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3.5">
                      Tài khoản người dùng
                    </TableHead>
                    <TableHead className="w-[22%] text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3.5">
                      Vai trò hệ thống
                    </TableHead>
                    <TableHead className="w-[20%] text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3.5">
                      Trạng thái truy cập
                    </TableHead>
                    <TableHead className="w-[20%] text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 pr-6 py-3.5">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.map((user) => {
                    const initials = user.fullName
                      ? user.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(-2)
                          .join('')
                          .toUpperCase()
                      : 'FD';
                    return (
                      <TableRow key={user.id} className="hover:bg-blue-50/25 transition-colors border-b border-slate-100 last:border-b-0">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                roleAvatarBgs[user.role] || 'bg-slate-600 text-white'
                              }`}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 text-sm truncate">{user.fullName}</p>
                              <p className="text-xs text-slate-500 truncate tabular-nums">
                                {user.email} · {user.phone}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                              roleBadgeClasses[user.role] || 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {roleLabels[user.role] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                              statusBadgeClasses[user.status] || 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            <span
                              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                                user.status === 'ACTIVE'
                                  ? 'bg-emerald-500'
                                  : user.status === 'SUSPENDED'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            {statusLabels[user.status] || user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 py-3">{userAction(user)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            renderMobileCard={(user) => {
              const initials = user.fullName
                ? user.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(-2)
                    .join('')
                    .toUpperCase()
                : 'FD';
              return (
                <div className="space-y-3 p-4 text-sm border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        roleAvatarBgs[user.role] || 'bg-slate-600 text-white'
                      }`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{user.fullName}</p>
                      <p className="text-xs text-slate-500 break-all tabular-nums">{user.email}</p>
                      <p className="text-xs text-slate-500 tabular-nums">{user.phone}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge
                      variant="outline"
                      className={`rounded-full px-2 py-0.5 text-xs border ${
                        roleBadgeClasses[user.role] || ''
                      }`}
                    >
                      {roleLabels[user.role]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`rounded-full px-2 py-0.5 text-xs border ${
                        statusBadgeClasses[user.status] || ''
                      }`}
                    >
                      {statusLabels[user.status]}
                    </Badge>
                  </div>

                  <div className="pt-2">{userAction(user)}</div>
                </div>
              );
            }}
          />
        </div>
      )}

      {data && (
        <AdminPageNavigation
          page={page}
          total={data.total}
          limit={USERS_PER_PAGE}
          onPage={setPage}
        />
      )}

      {/* Modal Tạm khóa / Khôi phục */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl border-slate-200">
          <form className="space-y-4" onSubmit={submit}>
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-900">
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center material-symbols-outlined text-[18px] ${
                    selected?.status === 'ACTIVE'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {selected?.status === 'ACTIVE' ? 'lock' : 'lock_open'}
                </span>
                {selected?.status === 'ACTIVE' ? 'Tạm khóa quyền truy cập' : 'Khôi phục quyền truy cập'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-500">
                Tài khoản: <strong className="text-slate-800">{selected?.fullName}</strong> ({selected?.email})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="admin-account-reason" className="text-xs font-semibold text-slate-700">
                Lý do thực hiện <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="admin-account-reason"
                required
                minLength={5}
                maxLength={500}
                placeholder="Nhập lý do thay đổi trạng thái (tối thiểu 5 ký tự) để ghi vào nhật ký an ninh..."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={busy}
                rows={3}
                className="rounded-xl resize-none text-sm border-slate-200 focus-visible:ring-[#0046c0]/20"
              />
              <p className="text-[11px] text-slate-400">
                Lý do này sẽ được ghi vết bất biến vào Nhật ký hoạt động theo quy định kiểm toán.
              </p>
            </div>

            {submitError && (
              <p role="alert" className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                {submitError}
              </p>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelected(null)}
                disabled={busy}
                className="rounded-xl"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={busy || reason.trim().length < 5}
                className={`rounded-xl font-semibold shadow-xs ${
                  selected?.status === 'ACTIVE'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {busy ? 'Đang xử lý…' : 'Xác nhận thay đổi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function AuditList() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [q, setQuery] = useState('');
  const [detailEntry, setDetailEntry] = useState<AdminAuditLog | null>(null);

  const { data, error, loading, refresh } = useAdminQuery(
    useCallback(
      () =>
        adminApi.auditLogs({
          page,
          limit: AUDIT_LOGS_PER_PAGE,
          action: actionFilter || undefined,
          q: q || undefined,
        }),
      [page, actionFilter, q],
    ),
  );

  return (
    <section className="space-y-4">
      {/* Banner Giới thiệu Chuẩn An ninh & Kiểm toán */}
      <div className="flex items-start gap-3.5 rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white p-4 text-xs sm:text-sm shadow-xs">
        <div className="w-9 h-9 rounded-xl bg-[#0046c0] text-white flex items-center justify-center shrink-0 shadow-xs">
          <span className="material-symbols-outlined text-[20px]">security</span>
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-slate-900 text-sm">Nhật ký kiểm toán an ninh bất biến (Immutable Audit Trail)</p>
          <p className="text-slate-600 leading-relaxed text-xs">
            Toàn bộ thao tác phân quyền, thay đổi trạng thái tài khoản, thẩm định cơ sở y tế và đối soát tài chính
            đều được mã hóa và lưu vết thời gian thực kèm định danh IP tác tử, tuân thủ tiêu chuẩn an toàn bảo mật dữ liệu y tế (HIPAA &amp; Bộ Y Tế).
          </p>
        </div>
      </div>

      {/* Bộ lọc & Tìm kiếm Nhật ký */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <form
          className="flex flex-wrap items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setQuery(search.trim());
          }}
        >
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
              search
            </span>
            <Input
              aria-label="Tìm nhật ký"
              placeholder="Tìm theo người thực hiện, hành động, IP, tài nguyên..."
              maxLength={150}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9 h-10 rounded-xl border-slate-200 focus-visible:ring-[#0046c0]/20"
            />
          </div>

          <div className="w-56">
            <select
              aria-label="Lọc theo loại hành động"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#0046c0]/20 cursor-pointer"
              value={actionFilter}
              onChange={(event) => {
                setActionFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả loại hành động</option>
              <option value="USER_SUSPENDED">Tạm khóa tài khoản</option>
              <option value="USER_ACTIVATED">Khôi phục tài khoản</option>
              <option value="FACILITY_INVITE_RESENT">Gửi lại lời mời CSYT</option>
              <option value="FACILITY_VERIFIED">Thẩm định Cơ sở y tế</option>
              <option value="DOCTOR_VERIFIED">Thẩm định Bác sĩ</option>
              <option value="ROLE_ASSIGNED">Cập nhật phân quyền</option>
              <option value="SETTLEMENT_REVIEWED">Duyệt đối soát doanh thu</option>
            </select>
          </div>

          <Button
            type="submit"
            variant="default"
            className="h-10 px-5 rounded-xl bg-[#0046c0] hover:bg-[#0037c1] text-white font-semibold shadow-xs"
          >
            Tìm kiếm
          </Button>

          {(search || actionFilter) && (
            <Button
              type="button"
              variant="ghost"
              className="h-10 px-3 rounded-xl text-slate-600 hover:text-slate-900"
              onClick={() => {
                setSearch('');
                setQuery('');
                setActionFilter('');
                setPage(1);
              }}
            >
              Đặt lại
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            className="h-10 px-3.5 rounded-xl ml-auto border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
            onClick={refresh}
          >
            <span className="material-symbols-outlined text-[18px] mr-1.5 text-slate-500">refresh</span>
            Làm mới nhật ký
          </Button>
        </form>

        {/* Quick Filter Chips cho Nhật ký */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Bộ lọc nhanh:</span>
          <button
            type="button"
            onClick={() => { setActionFilter(''); setPage(1); }}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              actionFilter === ''
                ? 'bg-blue-50 text-[#0046c0] border-blue-200 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => { setActionFilter('USER_SUSPENDED'); setPage(1); }}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              actionFilter === 'USER_SUSPENDED'
                ? 'bg-amber-50 text-amber-700 border-amber-200 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tạm khóa
          </button>
          <button
            type="button"
            onClick={() => { setActionFilter('USER_ACTIVATED'); setPage(1); }}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              actionFilter === 'USER_ACTIVATED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Khôi phục
          </button>
          <button
            type="button"
            onClick={() => { setActionFilter('FACILITY_INVITE_RESENT'); setPage(1); }}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              actionFilter === 'FACILITY_INVITE_RESENT'
                ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Mời CSYT
          </button>
          <button
            type="button"
            onClick={() => { setActionFilter('DOCTOR_VERIFIED'); setPage(1); }}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              actionFilter === 'DOCTOR_VERIFIED'
                ? 'bg-teal-50 text-teal-700 border-teal-200 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Thẩm định Bác sĩ
          </button>
        </div>
      </div>

      {/* Thông tin số lượng hiển thị */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Hiển thị tối đa <strong className="text-slate-700 tabular-nums">10 sự kiện</strong> mỗi trang
        </span>
        {data && (
          <span>
            Tổng số: <strong className="text-slate-700 tabular-nums">{data.total}</strong> bản ghi nhật ký
          </span>
        )}
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Bảng Nhật ký hoạt động */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <ResponsiveDataList
          items={data?.items ?? []}
          isLoading={loading}
          keyExtractor={(item) => item.id}
          emptyTitle="Chưa có bản ghi nhật ký nào phù hợp"
          renderDesktopTable={() => (
            <Table>
              <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                <TableRow className="border-b border-slate-200/80 hover:bg-transparent">
                  <TableHead className="w-[17%] text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3.5">
                    Thời gian
                  </TableHead>
                  <TableHead className="w-[20%] text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3.5">
                    Người thực hiện
                  </TableHead>
                  <TableHead className="w-[20%] text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3.5">
                    Hành động
                  </TableHead>
                  <TableHead className="w-[18%] text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3.5">
                    Tài nguyên
                  </TableHead>
                  <TableHead className="w-[12%] text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3.5">
                    Địa chỉ IP
                  </TableHead>
                  <TableHead className="w-[13%] text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 pr-6 py-3.5">
                    Chi tiết
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((entry) => {
                  const meta = actionMeta[entry.action] || {
                    label: entry.action,
                    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
                    icon: 'tune',
                  };
                  const dateStr = entry.timestamp
                    ? dateTimeFormatter.format(new Date(entry.timestamp))
                    : 'N/A';
                  return (
                    <TableRow key={entry.id} className="hover:bg-blue-50/25 transition-colors border-b border-slate-100 last:border-b-0">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 tabular-nums">
                          <span className="material-symbols-outlined text-[15px] text-slate-400">schedule</span>
                          <span>{dateStr}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                            {entry.actorUser?.fullName ? entry.actorUser.fullName.charAt(0) : 'S'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-xs truncate">
                              {entry.actorUser?.fullName ?? 'Hệ thống tự động'}
                            </p>
                            {entry.actorUser?.role && (
                              <p className="text-[10px] text-slate-500">
                                {roleLabels[entry.actorUser.role] || entry.actorUser.role}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="space-y-0.5">
                          <Badge
                            variant="outline"
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium border inline-flex items-center gap-1.5 ${meta.badgeClass}`}
                          >
                            <span className="material-symbols-outlined text-[13px]">{meta.icon}</span>
                            <span>{meta.label}</span>
                          </Badge>
                          <p className="text-[10px] text-slate-400 tabular-nums block pl-1">{entry.action}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="text-xs">
                          <p className="font-medium text-slate-800">
                            {resourceLabels[entry.resourceName] || entry.resourceName}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[150px] tabular-nums" title={entry.resourceId}>
                            {entry.resourceId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-xs text-slate-600 tabular-nums inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">wifi</span>
                          {entry.clientIp}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2.5 text-xs text-[#0046c0] hover:text-[#0037c1] hover:bg-blue-50 font-semibold rounded-lg"
                          onClick={() => setDetailEntry(entry)}
                        >
                          <span className="material-symbols-outlined text-[16px] mr-1">visibility</span>
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          renderMobileCard={(entry) => {
            const meta = actionMeta[entry.action] || {
              label: entry.action,
              badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
              icon: 'tune',
            };
            const dateStr = entry.timestamp
              ? dateTimeFormatter.format(new Date(entry.timestamp))
              : 'N/A';
            return (
              <div className="space-y-2.5 p-4 text-sm border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="tabular-nums flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-slate-400">schedule</span>
                    {dateStr}
                  </span>
                  <span className="tabular-nums flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-slate-400">wifi</span>
                    {entry.clientIp}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium border inline-flex items-center gap-1 ${meta.badgeClass}`}
                  >
                    <span className="material-symbols-outlined text-[13px]">{meta.icon}</span>
                    <span>{meta.label}</span>
                  </Badge>
                  <span className="text-xs text-slate-700 font-semibold">
                    {entry.actorUser?.fullName ?? 'Hệ thống'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Tác động: <strong className="text-slate-700">{resourceLabels[entry.resourceName] || entry.resourceName}</strong> · ID: <span className="tabular-nums">{entry.resourceId}</span>
                </p>
                {entry.details?.reason && (
                  <p className="text-xs text-slate-700 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/70">
                    Lý do: {entry.details.reason}
                  </p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs mt-1 rounded-xl border-slate-200 font-semibold"
                  onClick={() => setDetailEntry(entry)}
                >
                  Xem chi tiết nhật ký
                </Button>
              </div>
            );
          }}
        />
      </div>

      {data && (
        <AdminPageNavigation
          page={page}
          total={data.total}
          limit={AUDIT_LOGS_PER_PAGE}
          onPage={setPage}
        />
      )}

      {/* Modal Chi tiết bản ghi Nhật ký hoạt động */}
      <Dialog open={detailEntry !== null} onOpenChange={(open) => { if (!open) setDetailEntry(null); }}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-900">
              <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#0046c0] flex items-center justify-center material-symbols-outlined text-[18px]">
                verified_user
              </span>
              Chi tiết bản ghi nhật ký hoạt động
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Mã kiểm toán #{detailEntry?.id} · Ghi nhận lúc {detailEntry?.timestamp ? dateTimeFormatter.format(new Date(detailEntry.timestamp)) : ''}
            </DialogDescription>
          </DialogHeader>

          {detailEntry && (
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-slate-500 text-[11px] font-medium block">Người thực hiện</span>
                  <span className="font-semibold text-slate-900">
                    {detailEntry.actorUser?.fullName ?? 'Hệ thống tự động'}
                  </span>
                  {detailEntry.actorUser?.role && (
                    <span className="text-[11px] text-slate-500 block">
                      ({roleLabels[detailEntry.actorUser.role] || detailEntry.actorUser.role})
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] font-medium block">Địa chỉ IP truy cập</span>
                  <span className="font-semibold text-slate-900 tabular-nums flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[14px] text-slate-400">wifi</span>
                    {detailEntry.clientIp}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] font-medium block">Hành động thực hiện</span>
                  <span className="font-semibold text-slate-900">
                    {actionMeta[detailEntry.action]?.label || detailEntry.action}
                  </span>
                  <span className="text-[10px] text-slate-400 block tabular-nums">
                    {detailEntry.action}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] font-medium block">Tài nguyên tác động</span>
                  <span className="font-semibold text-slate-900">
                    {resourceLabels[detailEntry.resourceName] || detailEntry.resourceName}
                  </span>
                  <span className="text-[10px] text-slate-400 block tabular-nums truncate max-w-[180px]" title={detailEntry.resourceId}>
                    {detailEntry.resourceId}
                  </span>
                </div>
              </div>

              {detailEntry.details?.reason && (
                <div className="space-y-1.5 p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/70">
                  <span className="text-amber-800 text-[11px] font-bold block flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">info</span>
                    Lý do ghi nhận kiểm toán:
                  </span>
                  <p className="text-slate-800 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                    {detailEntry.details.reason}
                  </p>
                </div>
              )}

              {detailEntry.details && Object.keys(detailEntry.details).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-slate-500 text-[11px] font-semibold block">Dữ liệu chi tiết (Audit Metadata):</span>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs overflow-x-auto max-h-48 tabular-nums border border-slate-800">
                    {JSON.stringify(detailEntry.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              variant="default"
              onClick={() => setDetailEntry(null)}
              className="rounded-xl px-5 bg-[#0046c0] hover:bg-[#0037c1] text-white font-semibold"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
