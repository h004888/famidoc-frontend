'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Activity,
  AlertCircle,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  HeartPulse,
  Link as LinkIcon,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  User,
  Users,
  Video,
  VideoOff,
  X,
} from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/shared';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  telehealthApi,
  type TelehealthEncounterItem,
  type EncounterStatus,
} from '@/lib/api/telehealth.api';
import { cn } from '@/lib/utils';

type TelehealthFilterStatus = 'ALL' | EncounterStatus;

function formatDateTimeVN(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return 'Chưa định ngày';
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanDate.split('-');
  const dateFormatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : cleanDate;
  return timeStr ? `${timeStr} • ${dateFormatted}` : dateFormatted;
}

function StatusBadge({ status }: { status: EncounterStatus }) {
  switch (status) {
    case 'IN_PROGRESS':
      return (
        <Badge
          variant="outline"
          className="gap-1.5 rounded-full border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 shadow-xs"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
          </span>
          <span>Đang khám (LIVE)</span>
        </Badge>
      );
    case 'CONFIRMED':
      return (
        <Badge
          variant="outline"
          className="gap-1.5 rounded-full border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden="true" />
          <span>Đã xác nhận</span>
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge
          variant="outline"
          className="gap-1.5 rounded-full border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700"
        >
          <CheckCircle2 className="h-3 w-3 text-slate-500" aria-hidden="true" />
          <span>Đã hoàn thành</span>
        </Badge>
      );
    case 'RESCHEDULE_REQUESTED':
      return (
        <Badge
          variant="outline"
          className="gap-1.5 rounded-full border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 animate-pulse"
        >
          <Clock className="h-3 w-3 text-amber-600" aria-hidden="true" />
          <span>Yêu cầu dời lịch</span>
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge
          variant="outline"
          className="gap-1.5 rounded-full border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800"
        >
          <VideoOff className="h-3 w-3 text-rose-500" aria-hidden="true" />
          <span>Đã hủy</span>
        </Badge>
      );
    case 'PROPOSED':
    default:
      return (
        <Badge
          variant="outline"
          className="gap-1.5 rounded-full border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-800"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" aria-hidden="true" />
          <span>Đang đề xuất</span>
        </Badge>
      );
  }
}

export function AdminTelehealthView() {
  const [encounters, setEncounters] = useState<TelehealthEncounterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<TelehealthFilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PERIODIC' | 'AD_HOC'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected encounter for detail modal
  const [selectedEncounter, setSelectedEncounter] = useState<TelehealthEncounterItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchEncounters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await telehealthApi.getEncounters();
      setEncounters(res.data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách lịch khám trực tuyến.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEncounters();
  }, [fetchEncounters]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = encounters.length;
    const inProgress = encounters.filter((e) => e.encounterStatus === 'IN_PROGRESS').length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCount = encounters.filter((e) => {
      const itemDate = e.scheduledDate?.includes('T') ? e.scheduledDate.split('T')[0] : e.scheduledDate;
      return itemDate === todayStr && (e.encounterStatus === 'CONFIRMED' || e.encounterStatus === 'IN_PROGRESS');
    }).length;
    const rescheduleRequests = encounters.filter((e) => e.encounterStatus === 'RESCHEDULE_REQUESTED').length;

    return { total, inProgress, todayCount, rescheduleRequests };
  }, [encounters]);

  // Filtered encounters
  const filteredEncounters = useMemo(() => {
    return encounters.filter((item) => {
      // Status filter
      if (statusFilter !== 'ALL' && item.encounterStatus !== statusFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const docName = item.doctor?.user?.fullName?.toLowerCase() || '';
        const docSpec = item.doctor?.specialty?.toLowerCase() || '';
        const facName = item.contract?.facility?.facilityName?.toLowerCase() || '';
        const famRep = item.contract?.familyUnit?.representativeUser?.fullName?.toLowerCase() || '';
        const patName = item.patient?.fullName?.toLowerCase() || '';
        const code = item.id.toLowerCase();
        const contractNo = item.contract?.contractNumber?.toLowerCase() || '';

        return (
          docName.includes(q) ||
          docSpec.includes(q) ||
          facName.includes(q) ||
          famRep.includes(q) ||
          patName.includes(q) ||
          code.includes(q) ||
          contractNo.includes(q)
        );
      }
      return true;
    });
  }, [encounters, statusFilter, categoryFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEncounters.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedEncounters = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return filteredEncounters.slice(start, start + itemsPerPage);
  }, [filteredEncounters, safePage, itemsPerPage]);

  const handleOpenDetail = (item: TelehealthEncounterItem) => {
    setSelectedEncounter(item);
    setIsDetailOpen(true);
  };

  const handleCopyMeetingLink = (url?: string | null) => {
    if (!url) {
      toast.error('Chưa có liên kết phòng khám');
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => toast.success('Đã sao chép liên kết phòng khám WebRTC vào clipboard'),
        () => toast.error('Không thể sao chép liên kết vào bộ nhớ tạm')
      );
    } else {
      toast.info(`Liên kết phòng: ${url}`);
    }
  };

  const statusFilterTabs: Array<{ key: TelehealthFilterStatus; label: string; count: number }> = [
    { key: 'ALL', label: 'Tất cả ca khám', count: encounters.length },
    {
      key: 'IN_PROGRESS',
      label: 'Đang diễn ra (LIVE)',
      count: encounters.filter((e) => e.encounterStatus === 'IN_PROGRESS').length,
    },
    {
      key: 'CONFIRMED',
      label: 'Đã xác nhận',
      count: encounters.filter((e) => e.encounterStatus === 'CONFIRMED').length,
    },
    {
      key: 'RESCHEDULE_REQUESTED',
      label: 'Yêu cầu dời lịch',
      count: encounters.filter((e) => e.encounterStatus === 'RESCHEDULE_REQUESTED').length,
    },
    {
      key: 'COMPLETED',
      label: 'Đã hoàn thành',
      count: encounters.filter((e) => e.encounterStatus === 'COMPLETED').length,
    },
    {
      key: 'CANCELLED',
      label: 'Đã hủy',
      count: encounters.filter((e) => e.encounterStatus === 'CANCELLED').length,
    },
  ];

  return (
    <div className="min-h-full bg-[#f8fafc] font-sans text-slate-900 antialiased">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Quản trị hệ thống', href: '/admin' },
            { label: 'Lịch khám trực tuyến' },
          ]}
          title="Giám sát Lịch khám Trực tuyến"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchEncounters}
                disabled={isLoading}
                className="cursor-pointer rounded-xl bg-white text-xs font-semibold shadow-xs"
              >
                <RefreshCw
                  className={cn('h-3.5 w-3.5 text-slate-500', isLoading && 'animate-spin')}
                  aria-hidden="true"
                />
                <span>Làm mới dữ liệu</span>
              </Button>
            </div>
          }
        />

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {/* Card 1: Tổng số ca */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter('ALL');
              setCurrentPage(1);
            }}
            className={cn(
              'group flex flex-col justify-between rounded-2xl border bg-white p-4.5 text-left shadow-xs transition-all cursor-pointer outline-hidden hover:border-blue-300 hover:shadow-md',
              statusFilter === 'ALL'
                ? 'border-primary/60 ring-2 ring-primary/15 bg-gradient-to-br from-white to-blue-50/40'
                : 'border-slate-200/90'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary transition-transform group-hover:scale-105">
                <Video className="h-5 w-5" aria-hidden="true" />
              </span>
              <Badge variant="outline" className="rounded-full bg-blue-50/80 px-2 py-0.5 text-[11px] font-bold text-primary">
                Telehealth HD
              </Badge>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {stats.total}
              </span>
              <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Xem tất cả →
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Tổng số ca khám trực tuyến hệ thống</p>
          </button>

          {/* Card 2: Đang diễn ra LIVE */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter('IN_PROGRESS');
              setCurrentPage(1);
            }}
            className={cn(
              'group flex flex-col justify-between rounded-2xl border bg-white p-4.5 text-left shadow-xs transition-all cursor-pointer outline-hidden hover:border-emerald-300 hover:shadow-md',
              statusFilter === 'IN_PROGRESS'
                ? 'border-emerald-500 ring-2 ring-emerald-500/15 bg-gradient-to-br from-white to-emerald-50/40'
                : 'border-slate-200/90'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-105">
                <Activity className="h-5 w-5 animate-pulse" aria-hidden="true" />
              </span>
              <Badge variant="outline" className="rounded-full border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                WebRTC Live Room
              </Badge>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">
                {stats.inProgress}
              </span>
              <span className="text-xs font-medium text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100">
                Giám sát ngay →
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Ca khám đang kết nối trực tuyến</p>
          </button>

          {/* Card 3: Sắp diễn ra hôm nay */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter('CONFIRMED');
              setCurrentPage(1);
            }}
            className={cn(
              'group flex flex-col justify-between rounded-2xl border bg-white p-4.5 text-left shadow-xs transition-all cursor-pointer outline-hidden hover:border-indigo-300 hover:shadow-md',
              statusFilter === 'CONFIRMED'
                ? 'border-indigo-500 ring-2 ring-indigo-500/15 bg-gradient-to-br from-white to-indigo-50/40'
                : 'border-slate-200/90'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-105">
                <CalendarClock className="h-5 w-5" aria-hidden="true" />
              </span>
              <Badge variant="outline" className="rounded-full border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                Hôm nay
              </Badge>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-indigo-900 tabular-nums">
                {stats.todayCount}
              </span>
              <span className="text-xs font-medium text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
                Xem lịch →
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Ca khám trực tuyến lịch hẹn hôm nay</p>
          </button>

          {/* Card 4: Yêu cầu dời lịch */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter('RESCHEDULE_REQUESTED');
              setCurrentPage(1);
            }}
            className={cn(
              'group flex flex-col justify-between rounded-2xl border bg-white p-4.5 text-left shadow-xs transition-all cursor-pointer outline-hidden hover:border-amber-300 hover:shadow-md',
              statusFilter === 'RESCHEDULE_REQUESTED'
                ? 'border-amber-500 ring-2 ring-amber-500/15 bg-gradient-to-br from-white to-amber-50/40'
                : 'border-slate-200/90'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-105">
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <Badge variant="outline" className="rounded-full border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                Cần phản hồi
              </Badge>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-amber-800 tabular-nums">
                {stats.rescheduleRequests}
              </span>
              <span className="text-xs font-medium text-amber-600 opacity-0 transition-opacity group-hover:opacity-100">
                Xử lý →
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Gia đình đề xuất khung giờ mới</p>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <Card className="rounded-2xl border-slate-200/90 py-3.5 shadow-xs">
          <CardContent className="flex flex-col gap-3 px-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {statusFilterTabs.map((tab) => {
                const active = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setStatusFilter(tab.key);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      'inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40',
                      active
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                        active ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-80 shrink-0">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Tìm kiếm lịch khám trực tuyến"
                placeholder="Tìm tên bác sĩ, CSYT, gia đình, mã ca..."
                className="h-9 rounded-xl bg-slate-50/70 pl-9 pr-8 text-xs focus-visible:bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  aria-label="Xóa tìm kiếm"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="rounded-2xl border-rose-200 bg-rose-50 text-rose-900">
            <AlertDescription className="flex items-center justify-between text-xs sm:text-sm">
              <span>{error}</span>
              <Button
                type="button"
                size="xs"
                variant="destructive"
                onClick={fetchEncounters}
                className="rounded-lg text-xs font-semibold"
              >
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Content Table / Cards */}
        {isLoading ? (
          <Card className="rounded-2xl border-slate-200/90 shadow-xs">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
              <div className="h-7 w-7 animate-spin rounded-full border-3 border-primary/20 border-t-primary" />
              <span className="text-xs sm:text-sm font-medium">Đang tải dữ liệu ca khám trực tuyến...</span>
            </CardContent>
          </Card>
        ) : paginatedEncounters.length === 0 ? (
          <EmptyState
            icon="videocam"
            title="Không tìm thấy lịch khám online phù hợp"
            description={
              searchQuery || statusFilter !== 'ALL'
                ? 'Không có ca khám nào khớp với bộ lọc hoặc từ khóa tìm kiếm.'
                : 'Chưa có lịch khám trực tuyến nào trong hệ thống.'
            }
            action={
              (searchQuery || statusFilter !== 'ALL') && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setCurrentPage(1);
                  }}
                  className="rounded-xl text-xs font-semibold"
                >
                  Xóa bộ lọc
                </Button>
              )
            }
          />
        ) : (
          <Card className="overflow-hidden rounded-2xl border-slate-200/90 py-0 gap-0 shadow-xs">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table className="text-xs sm:text-sm">
                <TableHeader>
                  <TableRow className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold tracking-wider text-slate-600 uppercase hover:bg-slate-50/90">
                    <TableHead className="px-4 py-3.5 text-slate-600">Thời gian &amp; Phân loại</TableHead>
                    <TableHead className="px-4 py-3.5 text-slate-600">Bác sĩ phụ trách &amp; CSYT</TableHead>
                    <TableHead className="px-4 py-3.5 text-slate-600">Hộ gia đình &amp; Bệnh nhân</TableHead>
                    <TableHead className="px-4 py-3.5 text-slate-600">Trạng thái ca khám</TableHead>
                    <TableHead className="px-4 py-3.5 text-slate-600">Phòng WebRTC</TableHead>
                    <TableHead className="px-4 py-3.5 text-right text-slate-600">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedEncounters.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Cột 1: Thời gian */}
                      <TableCell className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm tabular-nums">
                          {formatDateTimeVN(item.scheduledDate, item.scheduledTime)}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                          <Badge
                            variant="secondary"
                            className={cn(
                              'px-1.5 py-0 text-[10px] font-semibold',
                              item.category === 'PERIODIC'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-purple-50 text-purple-700'
                            )}
                          >
                            {item.category === 'PERIODIC' ? 'Định kỳ theo gói' : 'Khám đột xuất'}
                          </Badge>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 tabular-nums">{item.durationMinutes} phút</span>
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400 tabular-nums">
                          Mã: {item.id}
                        </div>
                      </TableCell>

                      {/* Cột 2: Bác sĩ */}
                      <TableCell className="max-w-[260px] px-4 py-3.5 whitespace-normal">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                          {item.doctor?.user?.fullName || 'Chưa phân công'}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">
                          {item.doctor?.specialty || 'Bác sĩ gia đình'}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500 truncate" title={item.contract?.facility?.facilityName}>
                          {item.contract?.facility?.facilityName || 'Cơ sở Y tế'}
                        </div>
                      </TableCell>

                      {/* Cột 3: Gia đình & Bệnh nhân */}
                      <TableCell className="max-w-[260px] px-4 py-3.5 whitespace-normal">
                        <div className="font-semibold text-slate-800 text-xs sm:text-sm truncate">
                          Bệnh nhân: <span className="text-primary font-bold">{item.patient?.fullName || 'Bệnh nhân'}</span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500 truncate">
                          Đại diện hộ: {item.contract?.familyUnit?.representativeUser?.fullName || 'Chủ hộ'}
                          {item.contract?.familyUnit?.representativeUser?.phone && (
                            <span className="tabular-nums"> ({item.contract.familyUnit.representativeUser.phone})</span>
                          )}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400 tabular-nums truncate">
                          HĐ: {item.contract?.contractNumber || item.contractId}
                        </div>
                      </TableCell>

                      {/* Cột 4: Trạng thái */}
                      <TableCell className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={item.encounterStatus} />
                      </TableCell>

                      {/* Cột 5: Kênh WebRTC */}
                      <TableCell className="px-4 py-3.5 whitespace-nowrap">
                        {item.telehealthRoomUrl ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={item.telehealthRoomUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/80 px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-blue-100"
                            >
                              <Video className="h-3 w-3 shrink-0" aria-hidden="true" />
                              <span>Vào phòng</span>
                              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopyMeetingLink(item.telehealthRoomUrl)}
                              title="Sao chép liên kết"
                              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                            >
                              <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa tạo phòng</span>
                        )}
                      </TableCell>

                      {/* Cột 6: Thao tác */}
                      <TableCell className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Button
                          type="button"
                          size="xs"
                          variant="secondary"
                          onClick={() => handleOpenDetail(item)}
                          className="h-8 cursor-pointer rounded-lg border border-blue-200/80 bg-blue-50 px-3 text-xs font-semibold text-primary hover:bg-blue-100"
                        >
                          Xem chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View Cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {paginatedEncounters.map((item) => (
                <div key={item.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-sm tabular-nums">
                        {formatDateTimeVN(item.scheduledDate, item.scheduledTime)}
                      </div>
                      <div className="text-xs text-slate-500 tabular-nums mt-0.5">Mã: {item.id}</div>
                    </div>
                    <StatusBadge status={item.encounterStatus} />
                  </div>

                  <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-700">Bác sĩ:</span>{' '}
                      <span className="font-bold text-slate-900">{item.doctor?.user?.fullName || 'Chưa phân công'}</span>{' '}
                      ({item.doctor?.specialty || 'Y học gia đình'})
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Bệnh nhân:</span>{' '}
                      <span className="font-bold text-primary">{item.patient?.fullName || 'Người bệnh'}</span> (Đại diện:{' '}
                      {item.contract?.familyUnit?.representativeUser?.fullName || 'Chủ hộ'})
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">CSYT:</span>{' '}
                      {item.contract?.facility?.facilityName || 'Cơ sở Y tế'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {item.telehealthRoomUrl ? (
                      <a
                        href={item.telehealthRoomUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-primary"
                      >
                        <Video className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Phòng WebRTC</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Chưa mở phòng</span>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenDetail(item)}
                      className="h-8 rounded-lg px-3 text-xs font-semibold"
                    >
                      Chi tiết
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3.5 sm:flex-row">
                <div className="text-xs text-slate-500 tabular-nums">
                  Hiển thị {(safePage - 1) * itemsPerPage + 1} –{' '}
                  {Math.min(safePage * itemsPerPage, filteredEncounters.length)} trên tổng số{' '}
                  {filteredEncounters.length} cuộc hẹn khám
                </div>
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            )}
          </Card>
        )}

        {/* Modal Xem chi tiết cuộc hẹn khám Online */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-h-[90vh] gap-0 overflow-hidden rounded-3xl border-slate-200 p-0 sm:max-w-2xl [&>[data-slot=dialog-close]]:top-4 [&>[data-slot=dialog-close]]:right-4 [&>[data-slot=dialog-close]]:rounded-full [&>[data-slot=dialog-close]]:bg-white/15 [&>[data-slot=dialog-close]]:p-1.5 [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:opacity-90 [&>[data-slot=dialog-close]]:hover:bg-white/25">
            {selectedEncounter && (
              <>
                <DialogHeader className="bg-gradient-to-r from-[#09253b] to-[#0037c1] p-5 text-left text-white sm:p-6">
                  <div className="flex flex-wrap items-center gap-2 pr-8 text-xs font-medium text-blue-100">
                    <span>Hồ Sơ Ca Khám Trực Tuyến</span>
                    <span aria-hidden="true">•</span>
                    <span className="rounded bg-white/15 px-1.5 py-0.5 tabular-nums text-[11px] text-white">
                      {selectedEncounter.id}
                    </span>
                  </div>
                  <DialogTitle className="mt-1 text-lg font-bold leading-snug text-white sm:text-xl">
                    Lịch Khám Online: {selectedEncounter.patient?.fullName || 'Bệnh nhân'}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-blue-100/90">
                    {formatDateTimeVN(selectedEncounter.scheduledDate, selectedEncounter.scheduledTime)} •{' '}
                    {selectedEncounter.category === 'PERIODIC' ? 'Khám định kỳ theo gói' : 'Khám đột xuất'} ({selectedEncounter.durationMinutes} phút)
                  </DialogDescription>
                </DialogHeader>

                <div className="max-h-[60vh] space-y-5 overflow-y-auto p-4 text-xs sm:p-6 sm:text-sm">
                  {/* Trạng thái & Link phòng khám */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-slate-500">Trạng thái buổi khám:</div>
                      <StatusBadge status={selectedEncounter.encounterStatus} />
                    </div>

                    {selectedEncounter.telehealthRoomUrl && (
                      <div className="flex items-center gap-2">
                        <a
                          href={selectedEncounter.telehealthRoomUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary/90"
                        >
                          <Video className="h-4 w-4" aria-hidden="true" />
                          <span>Tham gia phòng WebRTC</span>
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyMeetingLink(selectedEncounter.telehealthRoomUrl)}
                          className="rounded-xl text-xs font-semibold"
                        >
                          Sao chép link
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Cảnh báo dời lịch nếu có */}
                  {selectedEncounter.encounterStatus === 'RESCHEDULE_REQUESTED' && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                        <Clock className="h-4 w-4 text-amber-600" aria-hidden="true" />
                        <span>Đề xuất đổi lịch từ phía gia đình</span>
                      </div>
                      <p className="text-xs text-amber-800">
                        <strong>Lý do:</strong> {selectedEncounter.rescheduleReason || 'Gia đình bận công việc đột xuất.'}
                      </p>
                      {selectedEncounter.rescheduledFromDate && (
                        <p className="text-xs text-amber-800 tabular-nums">
                          <strong>Lịch cũ:</strong> {formatDateTimeVN(selectedEncounter.rescheduledFromDate, selectedEncounter.rescheduledFromTime || undefined)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Thông tin Bác sĩ & Cơ sở Y tế */}
                  <section className="space-y-3">
                    <h3 className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
                      <Stethoscope className="h-4 w-4 text-primary" aria-hidden="true" />
                      <span>Bác sĩ phụ trách &amp; Đơn vị bảo trợ chuyên môn</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 sm:grid-cols-2">
                      <div>
                        <span className="block text-xs text-slate-500">Họ và tên bác sĩ:</span>
                        <span className="font-bold text-slate-900">
                          {selectedEncounter.doctor?.user?.fullName || 'Chưa phân công'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">Số CCHN:</span>
                        <span className="font-semibold text-primary tabular-nums">
                          {selectedEncounter.doctor?.licenseNumber || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">Chuyên khoa:</span>
                        <span className="font-medium text-slate-800">
                          {selectedEncounter.doctor?.specialty || 'Y học gia đình'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">Cơ sở y tế trực thuộc:</span>
                        <span className="font-medium text-slate-800">
                          {selectedEncounter.contract?.facility?.facilityName || 'CSYT FamiDoc'}
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Thông tin Gia đình & Bệnh nhân */}
                  <section className="space-y-3">
                    <h3 className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
                      <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                      <span>Hộ gia đình &amp; Bệnh nhân thăm khám</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 sm:grid-cols-2">
                      <div>
                        <span className="block text-xs text-slate-500">Bệnh nhân:</span>
                        <span className="font-bold text-primary">
                          {selectedEncounter.patient?.fullName || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">Quan hệ với chủ hộ:</span>
                        <span className="font-medium text-slate-800">
                          {selectedEncounter.patient?.relationship || 'Thành viên hộ'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">Đại diện hộ gia đình:</span>
                        <span className="font-semibold text-slate-900">
                          {selectedEncounter.contract?.familyUnit?.representativeUser?.fullName || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">Số điện thoại liên hệ:</span>
                        <span className="font-semibold text-slate-900 tabular-nums">
                          {selectedEncounter.contract?.familyUnit?.representativeUser?.phone || '—'}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="block text-xs text-slate-500">Địa chỉ hộ gia đình:</span>
                        <span className="text-slate-800">
                          {selectedEncounter.contract?.familyUnit?.homeAddress || 'Chưa cập nhật'}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="block text-xs text-slate-500">Gói dịch vụ &amp; Mã hợp đồng:</span>
                        <span className="font-semibold text-slate-900">
                          {selectedEncounter.contract?.servicePackage?.name || 'Gói Bác sĩ gia đình'}
                        </span>{' '}
                        <span className="text-slate-500 tabular-nums">
                          ({selectedEncounter.contract?.contractNumber || selectedEncounter.contractId})
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Lý do khám & Triệu chứng */}
                  <section className="space-y-3">
                    <h3 className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
                      <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                      <span>Triệu chứng ban đầu &amp; Ghi chú lâm sàng</span>
                    </h3>
                    <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                      <div>
                        <span className="block text-xs font-semibold text-slate-600 mb-1">
                          Triệu chứng ban đầu (Lý do khám):
                        </span>
                        <p className="text-slate-800 leading-relaxed">
                          {selectedEncounter.chiefComplaint || 'Theo dõi và tái khám định kỳ theo lộ trình gói chăm sóc.'}
                        </p>
                      </div>

                      {selectedEncounter.clinicalNotes && (
                        <div className="pt-2 border-t border-slate-200/70">
                          <span className="block text-xs font-semibold text-slate-600 mb-1">
                            Kết luận &amp; Dặn dò của bác sĩ:
                          </span>
                          <p className="text-slate-800 leading-relaxed">{selectedEncounter.clinicalNotes}</p>
                        </div>
                      )}

                      {selectedEncounter.vitalSigns && (
                        <div className="pt-2 border-t border-slate-200/70">
                          <span className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                            <HeartPulse className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
                            <span>Chỉ số sinh tồn ghi nhận:</span>
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className="rounded-lg bg-white p-2 border border-slate-200/80">
                              <span className="text-slate-500 block text-[10px]">Huyết áp:</span>
                              <span className="font-bold tabular-nums text-slate-900">
                                {selectedEncounter.vitalSigns.bloodPressure || '—'}
                              </span>
                            </div>
                            <div className="rounded-lg bg-white p-2 border border-slate-200/80">
                              <span className="text-slate-500 block text-[10px]">Nhịp tim:</span>
                              <span className="font-bold tabular-nums text-slate-900">
                                {selectedEncounter.vitalSigns.heartRate ? `${selectedEncounter.vitalSigns.heartRate} bpm` : '—'}
                              </span>
                            </div>
                            <div className="rounded-lg bg-white p-2 border border-slate-200/80">
                              <span className="text-slate-500 block text-[10px]">Nhiệt độ:</span>
                              <span className="font-bold tabular-nums text-slate-900">
                                {selectedEncounter.vitalSigns.temperature ? `${selectedEncounter.vitalSigns.temperature} °C` : '—'}
                              </span>
                            </div>
                            <div className="rounded-lg bg-white p-2 border border-slate-200/80">
                              <span className="text-slate-500 block text-[10px]">SpO2:</span>
                              <span className="font-bold tabular-nums text-slate-900">
                                {selectedEncounter.vitalSigns.spO2 ? `${selectedEncounter.vitalSigns.spO2}%` : '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                <DialogFooter className="flex-row items-center justify-between border-t border-slate-200/80 bg-slate-50 px-4 py-3.5 sm:px-6">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDetailOpen(false)}
                    className="rounded-xl bg-white text-xs font-semibold"
                  >
                    Đóng cửa sổ
                  </Button>

                  {selectedEncounter.telehealthRoomUrl && (
                    <a
                      href={selectedEncounter.telehealthRoomUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary/90"
                    >
                      <Video className="h-4 w-4" aria-hidden="true" />
                      <span>Mở phòng WebRTC</span>
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
