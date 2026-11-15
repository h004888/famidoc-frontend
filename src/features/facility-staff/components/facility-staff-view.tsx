'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared';
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
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DoctorStaff {
  id: string;
  name: string;
  title: string;
  department: string;
  cchnNumber: string;
  issueDate: string;
  panelCap: number;
  maxCap: number;
  rating: number;
  totalEncounters: number;
  status: 'active' | 'on_leave' | 'pending_approval';
}

const INITIAL_STAFF: DoctorStaff[] = [
  {
    id: 'DOC-7901',
    name: 'BS.CKII Trần Thanh Mai',
    title: 'Bác sĩ Gia đình & Nội Tim mạch',
    department: 'Khoa Y học Gia đình',
    cchnNumber: '004128/HCM-CCHN',
    issueDate: '15/06/2014',
    panelCap: 45,
    maxCap: 50,
    rating: 4.9,
    totalEncounters: 382,
    status: 'active',
  },
  {
    id: 'DOC-7902',
    name: 'ThS.BS Nguyễn Hữu Đạt',
    title: 'Bác sĩ Nội Tổng quát & Lão khoa',
    department: 'Khoa Nội Tổng quát',
    cchnNumber: '008921/HCM-CCHN',
    issueDate: '20/11/2016',
    panelCap: 48,
    maxCap: 50,
    rating: 4.8,
    totalEncounters: 412,
    status: 'active',
  },
  {
    id: 'DOC-7903',
    name: 'BS.CKI Lê Thị Kim Oanh',
    title: 'Bác sĩ Nhi khoa Gia đình',
    department: 'Khoa Nhi',
    cchnNumber: '012450/HCM-CCHN',
    issueDate: '05/03/2018',
    panelCap: 38,
    maxCap: 50,
    rating: 4.95,
    totalEncounters: 295,
    status: 'active',
  },
  {
    id: 'DOC-7904',
    name: 'BS. Hoàng Gia Bảo',
    title: 'Bác sĩ Đa khoa Phụ trách Khám tại nhà',
    department: 'Khoa Cấp cứu & Y tế Gia đình',
    cchnNumber: '019882/HCM-CCHN',
    issueDate: '12/09/2021',
    panelCap: 22,
    maxCap: 40,
    rating: 4.7,
    totalEncounters: 164,
    status: 'on_leave',
  },
  {
    id: 'DOC-7905',
    name: 'ThS.BS Vũ Đình Trọng',
    title: 'Bác sĩ Chuyên khoa Nội tiết - Đái tháo đường',
    department: 'Khoa Nội tiết',
    cchnNumber: '006733/HCM-CCHN',
    issueDate: '02/08/2015',
    panelCap: 0,
    maxCap: 50,
    rating: 5.0,
    totalEncounters: 0,
    status: 'pending_approval',
  },
];

export function FacilityStaffView() {
  const [staffList, setStaffList] = useState<DoctorStaff[]>(INITIAL_STAFF);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'on_leave' | 'pending_approval'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorCchn, setNewDoctorCchn] = useState('');
  const [newDoctorDept, setNewDoctorDept] = useState('Khoa Y học Gia đình');

  const filteredStaff = staffList.filter((doc) => {
    const matchesDept = filterDepartment === 'all' || doc.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.cchnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesStatus && matchesSearch;
  });

  const handleApprove = (docId: string) => {
    setStaffList((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, status: 'active' as const } : doc))
    );
    toast.success(`Đã phê duyệt và kích hoạt quyền hành nghề cho bác sĩ ${docId}`);
  };

  const handleCreateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorName || !newDoctorCchn) return;

    const newDoc: DoctorStaff = {
      id: `DOC-${Math.floor(7900 + Math.random() * 100)}`,
      name: newDoctorName,
      title: `Bác sĩ ${newDoctorDept}`,
      department: newDoctorDept,
      cchnNumber: newDoctorCchn,
      issueDate: '27/10/2026',
      panelCap: 0,
      maxCap: 50,
      rating: 5.0,
      totalEncounters: 0,
      status: 'pending_approval',
    };

    setStaffList([newDoc, ...staffList]);
    setIsModalOpen(false);
    setNewDoctorName('');
    setNewDoctorCchn('');
    toast.success(`Đã tiếp nhận hồ sơ bác sĩ ${newDoc.name}. Đang chờ thẩm định.`);
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <PageHeader
          title="Quản lý Đội ngũ Bác sĩ Trực thuộc"
          description="Phân công phụ trách hộ gia đình, kiểm soát giới hạn tiếp nhận (Panel Cap) và thẩm định CCHN y tế"
          actions={
            <Button
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Tiếp nhận Hồ sơ Bác sĩ mới</span>
            </Button>
          }
        />

        {/* Filter Toolbar */}
        <Card className="bg-white py-4 rounded-2xl border-slate-200 shadow-xs">
          <CardContent className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between px-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <Input
                type="text"
                placeholder="Tìm theo tên bác sĩ, số chứng chỉ CCHN, chuyên khoa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 bg-slate-50 rounded-xl text-xs sm:text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Lọc theo chuyên khoa"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="h-9 px-3 bg-slate-50 border border-input rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">Tất cả chuyên khoa</option>
                <option value="Khoa Y học Gia đình">Khoa Y học Gia đình</option>
                <option value="Khoa Nội Tổng quát">Khoa Nội Tổng quát</option>
                <option value="Khoa Nhi">Khoa Nhi</option>
                <option value="Khoa Nội tiết">Khoa Nội tiết</option>
                <option value="Khoa Cấp cứu & Y tế Gia đình">Khoa Cấp cứu &amp; Y tế Gia đình</option>
              </select>

              <select
                aria-label="Lọc theo trạng thái"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'on_leave' | 'pending_approval')}
                className="h-9 px-3 bg-slate-50 border border-input rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang trực chiến</option>
                <option value="on_leave">Nghỉ phép</option>
                <option value="pending_approval">Chờ thẩm duyệt CCHN</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Staff Table */}
        <Card className="bg-white rounded-2xl border-slate-200 shadow-xs overflow-hidden py-0 gap-0">
          <Table className="text-xs sm:text-sm">
            <TableHeader>
              <TableRow className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider hover:bg-slate-50/80">
                <TableHead className="py-3.5 px-4 text-slate-600">Bác sĩ &amp; Chức danh</TableHead>
                <TableHead className="py-3.5 px-4 text-slate-600">Chứng chỉ CCHN</TableHead>
                <TableHead className="py-3.5 px-4 text-slate-600">Khoa phòng</TableHead>
                <TableHead className="py-3.5 px-4 text-center text-slate-600">Panel Cap (Hộ/Max)</TableHead>
                <TableHead className="py-3.5 px-4 text-center text-slate-600">Đánh giá SLA</TableHead>
                <TableHead className="py-3.5 px-4 text-center text-slate-600">Trạng thái</TableHead>
                <TableHead className="py-3.5 px-4 text-right text-slate-600">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy bác sĩ nào phù hợp với điều kiện lọc.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((doc) => {
                  const capPercent = Math.round((doc.panelCap / doc.maxCap) * 100);
                  return (
                    <TableRow key={doc.id} className="hover:bg-slate-50/70">
                      <TableCell className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{doc.name}</div>
                        <div className="text-[11px] text-slate-500">{doc.title}</div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <div className="tabular-nums text-xs text-slate-700 font-semibold">
                          {doc.cchnNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 tabular-nums">Cấp ngày: {doc.issueDate}</div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-slate-600 font-medium">
                        {doc.department}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center">
                        <div className="font-semibold text-slate-800 tabular-nums">
                          {doc.panelCap} / {doc.maxCap} hộ
                        </div>
                        <Progress
                          value={capPercent}
                          className={`w-24 mx-auto bg-slate-100 h-1.5 mt-1 ${
                            capPercent > 90
                              ? '[&_[data-slot=progress-indicator]]:bg-rose-500'
                              : capPercent > 70
                              ? '[&_[data-slot=progress-indicator]]:bg-amber-500'
                              : '[&_[data-slot=progress-indicator]]:bg-emerald-500'
                          }`}
                        />
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 font-bold text-amber-600 tabular-nums">
                          <span className="material-symbols-outlined text-[15px] fill-current">star</span>
                          <span>{doc.rating}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 tabular-nums">{doc.totalEncounters} lượt khám</div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center">
                        {doc.status === 'active' && (
                          <Badge variant="outline" className="rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                            Đang trực chiến
                          </Badge>
                        )}
                        {doc.status === 'on_leave' && (
                          <Badge variant="secondary" className="rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Nghỉ phép
                          </Badge>
                        )}
                        {doc.status === 'pending_approval' && (
                          <Badge variant="outline" className="rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border-amber-200">
                            Chờ thẩm định CCHN
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-right">
                        {doc.status === 'pending_approval' ? (
                          <Button
                            type="button"
                            size="xs"
                            onClick={() => handleApprove(doc.id)}
                            className="rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Phê duyệt
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="xs"
                            variant="secondary"
                            onClick={() =>
                              toast.info(`Đang mở giao diện điều chỉnh chỉ tiêu phân công hộ cho bác sĩ ${doc.name}`)
                            }
                            className="rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Điều chỉnh
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Dialog: Tiếp nhận bác sĩ mới */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="rounded-2xl border-slate-200 sm:max-w-lg">
            <DialogHeader className="border-b border-slate-100 pb-3">
              <DialogTitle className="font-bold text-slate-900 text-base">
                Tiếp nhận Hồ sơ Bác sĩ vào Cơ sở
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Nhập thông tin Chứng chỉ Hành nghề để gửi thẩm định liên thông Bộ Y Tế
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="staff-doc-name" className="text-xs font-semibold text-slate-700">
                  Họ và tên Bác sĩ <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="staff-doc-name"
                  type="text"
                  required
                  placeholder="VD: ThS.BS Phan Văn Minh"
                  value={newDoctorName}
                  onChange={(e) => setNewDoctorName(e.target.value)}
                  className="rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="staff-doc-cchn" className="text-xs font-semibold text-slate-700">
                  Số Chứng chỉ Hành nghề (CCHN) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="staff-doc-cchn"
                  type="text"
                  required
                  placeholder="VD: 028812/HCM-CCHN"
                  value={newDoctorCchn}
                  onChange={(e) => setNewDoctorCchn(e.target.value)}
                  className="rounded-xl text-xs sm:text-sm tabular-nums"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="staff-doc-dept" className="text-xs font-semibold text-slate-700">
                  Khoa phòng phân công
                </Label>
                <select
                  id="staff-doc-dept"
                  value={newDoctorDept}
                  onChange={(e) => setNewDoctorDept(e.target.value)}
                  className="h-9 w-full px-3 border border-input rounded-xl text-xs sm:text-sm bg-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Khoa Y học Gia đình">Khoa Y học Gia đình</option>
                  <option value="Khoa Nội Tổng quát">Khoa Nội Tổng quát</option>
                  <option value="Khoa Nhi">Khoa Nhi</option>
                  <option value="Khoa Cấp cứu & Y tế Gia đình">Khoa Cấp cứu &amp; Y tế Gia đình</option>
                  <option value="Khoa Nội tiết">Khoa Nội tiết</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Quy định thẩm định CCHN:</p>
                <p className="mt-1">
                  Bác sĩ được kích hoạt sau khi Bệnh viện và Cổng Y tế FamiDoc xác thực CCHN khớp với cơ sở dữ liệu Cục Quản lý Khám chữa bệnh (Bộ Y Tế).
                </p>
              </div>

              <DialogFooter className="border-t border-slate-100 pt-3">
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
                  Lưu &amp; Gửi thẩm duyệt
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

