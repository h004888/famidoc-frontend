'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  FileEdit,
  GraduationCap,
  Layers,
  Plus,
  PlusCircle,
  Search,
  Send,
  Trash2,
  Users,
  Video,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog, EmptyState, PageHeader } from '@/components/shared';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  AUDIENCE_LABELS,
  FORMAT_LABELS,
  INITIAL_TRAINING_COURSES,
  STATUS_LABELS,
  TRAINING_STORAGE_KEY,
  type TrainingCourse,
  type TrainingFormat,
  type TrainingModuleItem,
  type TrainingStatus,
  type TrainingTargetAudience,
} from '../types';

interface TrainingFormState {
  code: string;
  title: string;
  category: string;
  audience: TrainingTargetAudience;
  format: TrainingFormat;
  status: TrainingStatus;
  instructor: string;
  cmeCredits: number;
  description: string;
  resourceUrl: string;
  isMandatory: boolean;
  modules: TrainingModuleItem[];
}

function createEmptyForm(): TrainingFormState {
  return {
    code: '',
    title: '',
    category: 'Lâm sàng & Hồ sơ EMR',
    audience: 'DOCTOR',
    format: 'ONLINE_VIDEO',
    status: 'PUBLISHED',
    instructor: '',
    cmeCredits: 2,
    description: '',
    resourceUrl: '',
    isMandatory: false,
    modules: [
      { id: 'mod-1', title: 'Bài 1: Tổng quan quy trình & Tiêu chuẩn thực hành', durationMinutes: 25 },
    ],
  };
}

function formatDateVi(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function resolveStatusBadgeClass(status: TrainingStatus): string {
  switch (status) {
    case 'PUBLISHED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'DRAFT':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'ARCHIVED':
      return 'border-slate-200 bg-slate-100 text-slate-600';
  }
}

export function AdminTrainingView() {
  const [courses, setCourses] = useState<TrainingCourse[]>(INITIAL_TRAINING_COURSES);
  const [activeTab, setActiveTab] = useState<'list' | 'publish'>('list');

  const [searchQuery, setSearchQuery] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<'ALL_FILTER' | TrainingTargetAudience>('ALL_FILTER');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TrainingStatus>('ALL');

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [form, setForm] = useState<TrainingFormState>(createEmptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [courseToDelete, setCourseToDelete] = useState<TrainingCourse | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TRAINING_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TrainingCourse[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCourses(parsed);
        }
      }
    } catch {
      // Bỏ qua nếu localStorage không khả dụng
    }
  }, []);

  const persistCourses = (next: TrainingCourse[]) => {
    setCourses(next);
    try {
      localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Bỏ qua lỗi quota
    }
  };

  const kpis = useMemo(() => {
    const published = courses.filter((c) => c.status === 'PUBLISHED').length;
    const draft = courses.filter((c) => c.status === 'DRAFT').length;
    const totalEnrolled = courses.reduce((sum, c) => sum + c.enrolledCount, 0);
    return {
      total: courses.length,
      published,
      draft,
      totalEnrolled,
    };
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return courses.filter((c) => {
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (audienceFilter !== 'ALL_FILTER' && c.audience !== audienceFilter) return false;
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      return true;
    });
  }, [courses, searchQuery, audienceFilter, statusFilter]);

  const totalFormMinutes = useMemo(
    () => form.modules.reduce((acc, m) => acc + (Number(m.durationMinutes) || 0), 0),
    [form.modules]
  );

  const handleOpenCreate = () => {
    setEditingCourseId(null);
    setForm(createEmptyForm());
    setFormErrors({});
    setActiveTab('publish');
  };

  const handleStartEdit = (course: TrainingCourse) => {
    setEditingCourseId(course.id);
    setForm({
      code: course.code,
      title: course.title,
      category: course.category,
      audience: course.audience,
      format: course.format,
      status: course.status,
      instructor: course.instructor,
      cmeCredits: course.cmeCredits,
      description: course.description,
      resourceUrl: course.resourceUrl || '',
      isMandatory: course.isMandatory,
      modules:
        course.modules.length > 0
          ? course.modules.map((m) => ({ ...m }))
          : [{ id: 'mod-default-1', title: 'Bài 1: Nội dung chính', durationMinutes: 30 }],
    });
    setFormErrors({});
    setActiveTab('publish');
  };

  const handleAddModule = () => {
    const nextIndex = form.modules.length + 1;
    setForm((prev) => ({
      ...prev,
      modules: [
        ...prev.modules,
        { id: `mod-${Date.now()}-${nextIndex}`, title: `Bài ${nextIndex}: `, durationMinutes: 20 },
      ],
    }));
  };

  const handleUpdateModule = (id: string, patch: Partial<TrainingModuleItem>) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  };

  const handleRemoveModule = (id: string) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m.id !== id),
    }));
  };

  const handleSubmitCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!form.title.trim()) errs.title = 'Vui lòng nhập tên khóa học đào tạo.';
    if (!form.code.trim()) errs.code = 'Vui lòng nhập mã khóa học (ví dụ: CME-FAM-201).';
    if (!form.instructor.trim()) errs.instructor = 'Vui lòng nhập tên giảng viên hoặc đơn vị chủ trì.';
    if (!form.description.trim()) errs.description = 'Vui lòng mô tả mục tiêu và nội dung khóa đào tạo.';

    const validModules = form.modules.filter((m) => m.title.trim().length > 0);
    if (validModules.length === 0) {
      errs.modules = 'Khóa học cần có ít nhất 1 bài giảng có tiêu đề.';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      toast.error('Vui lòng kiểm tra lại các trường thông tin bắt buộc.');
      return;
    }

    const nowIso = new Date().toISOString();

    if (editingCourseId) {
      const updated = courses.map((c) =>
        c.id === editingCourseId
          ? {
              ...c,
              code: form.code.trim().toUpperCase(),
              title: form.title.trim(),
              category: form.category.trim() || 'Đào tạo chuyên môn',
              audience: form.audience,
              format: form.format,
              status: form.status,
              instructor: form.instructor.trim(),
              cmeCredits: Math.max(0, Number(form.cmeCredits) || 0),
              description: form.description.trim(),
              resourceUrl: form.resourceUrl.trim() || undefined,
              isMandatory: form.isMandatory,
              modules: validModules.map((m) => ({
                ...m,
                title: m.title.trim(),
                durationMinutes: Math.max(1, Number(m.durationMinutes) || 15),
              })),
              updatedAt: nowIso,
            }
          : c
      );
      persistCourses(updated);
      toast.success(`Đã cập nhật khóa đào tạo "${form.title.trim()}".`);
    } else {
      const newCourse: TrainingCourse = {
        id: `TRN-${Date.now().toString().slice(-4)}`,
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        category: form.category.trim() || 'Đào tạo chuyên môn',
        audience: form.audience,
        format: form.format,
        status: form.status,
        instructor: form.instructor.trim(),
        cmeCredits: Math.max(0, Number(form.cmeCredits) || 0),
        description: form.description.trim(),
        resourceUrl: form.resourceUrl.trim() || undefined,
        isMandatory: form.isMandatory,
        enrolledCount: 0,
        completionRate: 0,
        modules: validModules.map((m) => ({
          ...m,
          title: m.title.trim(),
          durationMinutes: Math.max(1, Number(m.durationMinutes) || 15),
        })),
        updatedAt: nowIso,
      };
      persistCourses([newCourse, ...courses]);
      toast.success(
        form.status === 'PUBLISHED'
          ? `Đã đăng khóa đào tạo "${newCourse.title}" lên hệ thống!`
          : `Đã lưu bản nháp khóa đào tạo "${newCourse.title}".`
      );
    }

    setEditingCourseId(null);
    setForm(createEmptyForm());
    setFormErrors({});
    setActiveTab('list');
  };

  const handleTogglePublish = (course: TrainingCourse) => {
    const nextStatus: TrainingStatus = course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const next = courses.map((c) =>
      c.id === course.id ? { ...c, status: nextStatus, updatedAt: new Date().toISOString() } : c
    );
    persistCourses(next);
    toast.success(
      nextStatus === 'PUBLISHED'
        ? `Đã xuất bản khóa học "${course.title}".`
        : `Đã chuyển khóa học "${course.title}" về trạng thái Bản nháp.`
    );
  };

  const handleConfirmDelete = () => {
    if (!courseToDelete) return;
    const next = courses.filter((c) => c.id !== courseToDelete.id);
    persistCourses(next);
    toast.success(`Đã xóa khóa đào tạo "${courseToDelete.title}".`);
    setCourseToDelete(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        breadcrumbs={[
          { label: 'Quản trị hệ thống', href: '/admin' },
          { label: 'Đào tạo & Khóa học' },
        ]}
        title="Đăng & Quản lý Khóa học Đào tạo (Training)"
        description="Xây dựng chương trình đào tạo y khoa liên tục (CME), tập huấn quy trình 4 bên và xuất bản đến Bác sĩ CCHN & Cơ sở Y tế đối tác."
        actions={
          <Button type="button" size="sm" onClick={handleOpenCreate} className="rounded-xl gap-1.5 cursor-pointer">
            <PlusCircle className="size-4" aria-hidden="true" />
            <span>Đăng khóa học mới</span>
          </Button>
        }
      />

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/80 py-4 shadow-xs">
          <CardContent className="flex items-center justify-between px-5">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Tổng khóa đào tạo</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">{kpis.total}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="size-5" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 py-4 shadow-xs">
          <CardContent className="flex items-center justify-between px-5">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Đang mở đăng ký</p>
              <p className="text-2xl font-bold tabular-nums text-emerald-700">{kpis.published}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 py-4 shadow-xs">
          <CardContent className="flex items-center justify-between px-5">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Bản nháp chờ duyệt</p>
              <p className="text-2xl font-bold tabular-nums text-amber-700">{kpis.draft}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FileEdit className="size-5" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 py-4 shadow-xs">
          <CardContent className="flex items-center justify-between px-5">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Lượt học viên ghi danh</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">{kpis.totalEnrolled}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="size-5" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Workspace */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'publish')} className="space-y-4">
        <TabsList className="rounded-xl bg-muted p-1">
          <TabsTrigger value="list" className="rounded-lg text-xs font-semibold gap-1.5 cursor-pointer">
            <BookOpen className="size-3.5" aria-hidden="true" />
            <span>Danh sách khóa đào tạo ({courses.length})</span>
          </TabsTrigger>
          <TabsTrigger value="publish" className="rounded-lg text-xs font-semibold gap-1.5 cursor-pointer">
            <PlusCircle className="size-3.5" aria-hidden="true" />
            <span>{editingCourseId ? 'Cập nhật khóa đào tạo' : 'Đăng khóa đào tạo mới'}</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DANH SÁCH KHÓA ĐÀO TẠO */}
        <TabsContent value="list" className="space-y-4">
          <Card className="rounded-2xl border-border/80 py-4 shadow-xs">
            <CardContent className="space-y-3 px-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    type="text"
                    aria-label="Tìm kiếm khóa đào tạo"
                    placeholder="Tìm theo tên khóa học, mã CME, giảng viên, chuyên mục..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-xl bg-muted/40 pl-10 pr-9 text-xs sm:text-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      aria-label="Xóa từ khóa tìm kiếm"
                      onClick={() => setSearchQuery('')}
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Đối tượng:</span>
                  <Select
                    value={audienceFilter}
                    onValueChange={(val) =>
                      setAudienceFilter(val as 'ALL_FILTER' | TrainingTargetAudience)
                    }
                  >
                    <SelectTrigger className="w-[210px] rounded-xl text-xs font-medium">
                      <SelectValue placeholder="Tất cả đối tượng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL_FILTER">Tất cả đối tượng</SelectItem>
                      <SelectItem value="DOCTOR">Bác sĩ Gia đình (CCHN)</SelectItem>
                      <SelectItem value="FACILITY">Cơ sở Y tế Đối tác</SelectItem>
                      <SelectItem value="STAFF">Điều dưỡng &amp; Điều phối viên</SelectItem>
                      <SelectItem value="ALL">Toàn hệ thống FamiDoc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc theo trạng thái">
                {(['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as const).map((st) => {
                  const active = statusFilter === st;
                  return (
                    <Button
                      key={st}
                      type="button"
                      size="sm"
                      variant={active ? 'default' : 'secondary'}
                      onClick={() => setStatusFilter(st)}
                      className="rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      {st === 'ALL' ? 'Tất cả' : STATUS_LABELS[st]}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {filteredCourses.length === 0 ? (
            <EmptyState
              icon="school"
              title="Chưa tìm thấy khóa đào tạo phù hợp"
              description="Thử thay đổi từ khóa tìm kiếm hoặc bấm Đăng khóa học mới để tạo nội dung tập huấn."
              action={
                <Button type="button" size="sm" onClick={handleOpenCreate} className="rounded-xl cursor-pointer">
                  Đăng khóa học mới
                </Button>
              }
            />
          ) : (
            <>
              <Card className="hidden overflow-hidden rounded-2xl border-border/80 py-0 gap-0 shadow-xs md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 text-[11px] font-semibold uppercase tracking-wider">
                      <TableHead className="px-4 py-3">Khóa đào tạo</TableHead>
                      <TableHead className="px-4 py-3">Đối tượng &amp; Hình thức</TableHead>
                      <TableHead className="px-4 py-3 text-center">Nội dung &amp; CME</TableHead>
                      <TableHead className="px-4 py-3 text-center">Trạng thái</TableHead>
                      <TableHead className="px-4 py-3 text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map((course) => {
                      const totalMins = course.modules.reduce((s, m) => s + m.durationMinutes, 0);
                      return (
                        <TableRow key={course.id}>
                          <TableCell className="px-4 py-3.5 max-w-md">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="tabular-nums text-[11px] font-semibold text-primary">
                                {course.code}
                              </span>
                              {course.isMandatory && (
                                <Badge variant="outline" className="border-rose-200 bg-rose-50 text-[10px] text-rose-700">
                                  Bắt buộc
                                </Badge>
                              )}
                            </div>
                            <p className="mt-0.5 font-semibold text-foreground">{course.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground truncate">
                              {course.instructor} · Cập nhật {formatDateVi(course.updatedAt)}
                            </p>
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-xs">
                            <div className="font-medium text-foreground">{AUDIENCE_LABELS[course.audience]}</div>
                            <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Video className="size-3" aria-hidden="true" />
                              <span>{FORMAT_LABELS[course.format]}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-center text-xs tabular-nums">
                            <div className="font-semibold text-foreground">
                              {course.modules.length} bài · {totalMins} phút
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {course.cmeCredits > 0 ? `${course.cmeCredits} tín chỉ CME` : 'Không cấp CME'} ·{' '}
                              {course.enrolledCount} học viên
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-center">
                            <Badge
                              variant="outline"
                              className={cn('rounded-full text-[11px] font-semibold', resolveStatusBadgeClass(course.status))}
                            >
                              {STATUS_LABELS[course.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                type="button"
                                size="xs"
                                variant="secondary"
                                onClick={() => handleStartEdit(course)}
                                className="rounded-lg font-semibold cursor-pointer"
                              >
                                Sửa
                              </Button>
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                onClick={() => handleTogglePublish(course)}
                                className="rounded-lg font-semibold cursor-pointer"
                              >
                                {course.status === 'PUBLISHED' ? 'Chuyển nháp' : 'Xuất bản'}
                              </Button>
                              <Button
                                type="button"
                                size="icon-xs"
                                variant="ghost"
                                aria-label={`Xóa khóa học ${course.title}`}
                                onClick={() => setCourseToDelete(course)}
                                className="rounded-lg text-muted-foreground hover:text-destructive cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>

              {/* Mobile Cards */}
              <div className="space-y-3 md:hidden">
                {filteredCourses.map((course) => (
                  <Card key={course.id} className="rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="tabular-nums text-[11px] font-semibold text-primary">{course.code}</span>
                        <p className="font-semibold text-sm text-foreground">{course.title}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('rounded-full text-[10px] font-semibold shrink-0', resolveStatusBadgeClass(course.status))}
                      >
                        {STATUS_LABELS[course.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {AUDIENCE_LABELS[course.audience]} · {course.modules.length} bài giảng
                    </p>
                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => handleStartEdit(course)} className="flex-1 rounded-xl text-xs cursor-pointer">
                        Sửa
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => handleTogglePublish(course)} className="flex-1 rounded-xl text-xs cursor-pointer">
                        {course.status === 'PUBLISHED' ? 'Chuyển nháp' : 'Xuất bản'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* TAB 2: ĐĂNG / CẬP NHẬT KHÓA ĐÀO TẠO */}
        <TabsContent value="publish">
          <form onSubmit={handleSubmitCourse} className="grid grid-cols-1 gap-6 lg:grid-cols-12" noValidate>
            <Card className="rounded-2xl border-border/80 shadow-xs lg:col-span-8">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="text-base font-bold">
                  {editingCourseId ? 'Cập nhật nội dung Khóa đào tạo' : 'Thông tin Khóa đào tạo mới'}
                </CardTitle>
                <CardDescription className="text-xs">
                  Điền thông tin khóa học, đối tượng áp dụng và danh sách bài giảng trước khi xuất bản.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 pt-5">
                {Object.keys(formErrors).length > 0 && (
                  <Alert variant="destructive" className="py-2.5">
                    <AlertDescription className="text-xs font-medium">
                      Có trường thông tin chưa hợp lệ. Vui lòng kiểm tra các mục được đánh dấu bên dưới.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="training-title" className="text-xs font-semibold">
                      Tên khóa học đào tạo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="training-title"
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      aria-invalid={Boolean(formErrors.title)}
                      placeholder="VD: Chuẩn hóa Bệnh án SOAP & Kê đơn Ký số HSM"
                    />
                    {formErrors.title && (
                      <p role="alert" className="text-xs text-destructive">
                        {formErrors.title}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="training-code" className="text-xs font-semibold">
                      Mã khóa học <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="training-code"
                      value={form.code}
                      onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                      aria-invalid={Boolean(formErrors.code)}
                      placeholder="CME-FAM-201"
                      className="tabular-nums uppercase"
                    />
                    {formErrors.code && (
                      <p role="alert" className="text-xs text-destructive">
                        {formErrors.code}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="training-category" className="text-xs font-semibold">
                      Danh mục chuyên môn
                    </Label>
                    <Input
                      id="training-category"
                      value={form.category}
                      onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                      placeholder="VD: Lâm sàng & Hồ sơ EMR"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="training-instructor" className="text-xs font-semibold">
                      Giảng viên / Đơn vị chủ trì <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="training-instructor"
                      value={form.instructor}
                      onChange={(e) => setForm((p) => ({ ...p, instructor: e.target.value }))}
                      aria-invalid={Boolean(formErrors.instructor)}
                      placeholder="VD: PGS.TS.BS Nguyễn Minh Tuấn"
                    />
                    {formErrors.instructor && (
                      <p role="alert" className="text-xs text-destructive">
                        {formErrors.instructor}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">Đối tượng học</Label>
                    <Select
                      value={form.audience}
                      onValueChange={(v) => setForm((p) => ({ ...p, audience: v as TrainingTargetAudience }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOCTOR">Bác sĩ Gia đình (CCHN)</SelectItem>
                        <SelectItem value="FACILITY">Cơ sở Y tế Đối tác</SelectItem>
                        <SelectItem value="STAFF">Điều dưỡng &amp; Điều phối viên</SelectItem>
                        <SelectItem value="ALL">Toàn hệ thống FamiDoc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Hình thức</Label>
                    <Select
                      value={form.format}
                      onValueChange={(v) => setForm((p) => ({ ...p, format: v as TrainingFormat }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ONLINE_VIDEO">E-learning Video</SelectItem>
                        <SelectItem value="LIVE_WEBINAR">Live Webinar</SelectItem>
                        <SelectItem value="HYBRID">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="training-cme" className="text-xs font-semibold">
                      Tín chỉ CME
                    </Label>
                    <Input
                      id="training-cme"
                      type="number"
                      min={0}
                      max={48}
                      value={form.cmeCredits}
                      onChange={(e) => setForm((p) => ({ ...p, cmeCredits: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="training-description" className="text-xs font-semibold">
                    Mô tả mục tiêu &amp; Nội dung tổng quan <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="training-description"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    aria-invalid={Boolean(formErrors.description)}
                    placeholder="Tóm tắt kiến thức chuyên môn, chuẩn đầu ra và điều kiện cấp chứng nhận..."
                  />
                  {formErrors.description && (
                    <p role="alert" className="text-xs text-destructive">
                      {formErrors.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="training-resource" className="text-xs font-semibold">
                      URL Tài liệu / Video bài giảng
                    </Label>
                    <Input
                      id="training-resource"
                      value={form.resourceUrl}
                      onChange={(e) => setForm((p) => ({ ...p, resourceUrl: e.target.value }))}
                      placeholder="https://academy.famidoc.vn/courses/..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Trạng thái phát hành</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => setForm((p) => ({ ...p, status: v as TrainingStatus }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLISHED">Đăng ngay (Đang mở đăng ký)</SelectItem>
                        <SelectItem value="DRAFT">Lưu bản nháp (Draft)</SelectItem>
                        <SelectItem value="ARCHIVED">Lưu trữ (Archived)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Curriculum Modules Builder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Layers className="size-4 text-primary" aria-hidden="true" />
                        <span>Cấu trúc Bài giảng / Modules ({form.modules.length})</span>
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Tổng thời lượng dự kiến: <strong>{totalFormMinutes} phút</strong>
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddModule}
                      className="rounded-lg gap-1 text-xs cursor-pointer"
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                      <span>Thêm bài giảng</span>
                    </Button>
                  </div>

                  {formErrors.modules && (
                    <p role="alert" className="text-xs font-medium text-destructive">
                      {formErrors.modules}
                    </p>
                  )}

                  <div className="space-y-2.5">
                    {form.modules.map((mod, idx) => (
                      <div key={mod.id} className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/30 p-3 sm:flex-row sm:items-center">
                        <span className="text-xs font-semibold text-muted-foreground w-14 shrink-0">
                          Bài {idx + 1}
                        </span>
                        <Input
                          value={mod.title}
                          onChange={(e) => handleUpdateModule(mod.id, { title: e.target.value })}
                          placeholder="Nhập tiêu đề bài giảng..."
                          aria-label={`Tiêu đề bài giảng ${idx + 1}`}
                          className="flex-1 bg-background"
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          <Input
                            type="number"
                            min={1}
                            max={300}
                            value={mod.durationMinutes}
                            onChange={(e) =>
                              handleUpdateModule(mod.id, { durationMinutes: Number(e.target.value) })
                            }
                            aria-label={`Thời lượng bài ${idx + 1} (phút)`}
                            className="w-20 bg-background text-center tabular-nums"
                          />
                          <span className="text-xs text-muted-foreground">phút</span>
                          {form.modules.length > 1 && (
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`Xóa bài ${idx + 1}`}
                              onClick={() => handleRemoveModule(mod.id)}
                              className="text-muted-foreground hover:text-destructive cursor-pointer"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2 rounded-xl border border-border/70 bg-muted/30 p-3">
                  <Checkbox
                    id="training-mandatory"
                    checked={form.isMandatory}
                    onCheckedChange={(checked) => setForm((p) => ({ ...p, isMandatory: checked === true }))}
                  />
                  <Label htmlFor="training-mandatory" className="cursor-pointer text-xs font-medium leading-snug">
                    Bắt buộc đối tượng mục tiêu hoàn thành khóa học này trước khi kích hoạt phân hệ làm việc
                  </Label>
                </div>
              </CardContent>

              <CardFooter className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border/60 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingCourseId(null);
                    setForm(createEmptyForm());
                    setActiveTab('list');
                  }}
                  className="rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </Button>
                <Button type="submit" className="rounded-xl gap-1.5 cursor-pointer">
                  <Send className="size-4" aria-hidden="true" />
                  <span>{editingCourseId ? 'Lưu cập nhật khóa học' : 'Đăng khóa đào tạo'}</span>
                </Button>
              </CardFooter>
            </Card>

            {/* Cột phải: Xem trước thẻ khóa học (Live Preview) */}
            <div className="space-y-4 lg:col-span-4">
              <Card className="sticky top-24 rounded-2xl border-border/80 shadow-xs">
                <CardHeader className="border-b border-border/60 pb-3">
                  <CardTitle className="text-sm font-bold">Xem trước Hiển thị Khóa học</CardTitle>
                  <CardDescription className="text-xs">
                    Thẻ hiển thị tới {AUDIENCE_LABELS[form.audience]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline" className="tabular-nums text-[11px] font-semibold text-primary">
                      {form.code.trim().toUpperCase() || 'MÃ-KHÓA-HỌC'}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn('rounded-full text-[11px] font-semibold', resolveStatusBadgeClass(form.status))}
                    >
                      {STATUS_LABELS[form.status]}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-primary">{form.category || 'Chuyên mục đào tạo'}</p>
                    <h4 className="text-base font-bold leading-snug text-foreground">
                      {form.title.trim() || 'Tên khóa đào tạo sẽ hiển thị tại đây'}
                    </h4>
                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                      {form.description.trim() ||
                        'Mô tả nội dung khóa học và chuẩn đầu ra chuyên môn sẽ hiển thị cho học viên.'}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5">
                        <Video className="size-3.5 text-primary" />
                        <span>Hình thức</span>
                      </span>
                      <span className="font-medium text-foreground">{FORMAT_LABELS[form.format]}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5 text-primary" />
                        <span>Thời lượng</span>
                      </span>
                      <span className="font-medium text-foreground tabular-nums">
                        {form.modules.length} bài · {totalFormMinutes} phút
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5">
                        <Award className="size-3.5 text-primary" />
                        <span>Chứng nhận CME</span>
                      </span>
                      <span className="font-medium text-foreground tabular-nums">
                        {form.cmeCredits > 0 ? `${form.cmeCredits} tín chỉ` : 'Chứng nhận nội bộ'}
                      </span>
                    </div>
                  </div>

                  {form.isMandatory && (
                    <Badge variant="outline" className="w-full justify-center border-rose-200 bg-rose-50 py-1 text-[11px] text-rose-700">
                      Khóa học Bắt buộc hoàn thành
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={Boolean(courseToDelete)}
        onOpenChange={(open) => !open && setCourseToDelete(null)}
        variant="destructive"
        title="Xác nhận xóa khóa đào tạo?"
        description={
          courseToDelete
            ? `Khóa học "${courseToDelete.title}" (${courseToDelete.code}) sẽ bị xóa khỏi danh sách quản trị.`
            : undefined
        }
        confirmLabel="Xóa khóa học"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
