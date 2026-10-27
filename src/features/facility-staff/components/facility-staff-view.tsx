'use client';

import React, { useState } from 'react';
import { FacilityNav } from '@/components/layout';

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
  const [successMessage, setSuccessMessage] = useState('');

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
    setSuccessMessage(`Đã phê duyệt và kích hoạt quyền hành nghề cho bác sĩ ${docId}`);
    setTimeout(() => setSuccessMessage(''), 3000);
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
    setSuccessMessage(`Đã tiếp nhận hồ sơ bác sĩ ${newDoc.name}. Đang chờ thẩm định.`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      <FacilityNav />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Quản lý Đội ngũ Bác sĩ Trực thuộc
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Phân công phụ trách hộ gia đình, kiểm soát giới hạn tiếp nhận (Panel Cap) và thẩm định CCHN y tế
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Tiếp nhận Hồ sơ Bác sĩ mới</span>
          </button>
        </div>

        {/* Feedback Message */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên bác sĩ, số chứng chỉ CCHN, chuyên khoa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Tất cả chuyên khoa</option>
              <option value="Khoa Y học Gia đình">Khoa Y học Gia đình</option>
              <option value="Khoa Nội Tổng quát">Khoa Nội Tổng quát</option>
              <option value="Khoa Nhi">Khoa Nhi</option>
              <option value="Khoa Nội tiết">Khoa Nội tiết</option>
              <option value="Khoa Cấp cứu & Y tế Gia đình">Khoa Cấp cứu & Y tế Gia đình</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'on_leave' | 'pending_approval')}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang trực chiến</option>
              <option value="on_leave">Nghỉ phép</option>
              <option value="pending_approval">Chờ thẩm duyệt CCHN</option>
            </select>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Bác sĩ & Chức danh</th>
                  <th className="py-3.5 px-4">Chứng chỉ CCHN</th>
                  <th className="py-3.5 px-4">Khoa phòng</th>
                  <th className="py-3.5 px-4 text-center">Panel Cap (Hộ/Max)</th>
                  <th className="py-3.5 px-4 text-center">Đánh giá SLA</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Không tìm thấy bác sĩ nào phù hợp với điều kiện lọc.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((doc) => {
                    const capPercent = Math.round((doc.panelCap / doc.maxCap) * 100);
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{doc.name}</div>
                          <div className="text-[11px] text-slate-500">{doc.title}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs text-slate-700 font-semibold">
                            {doc.cchnNumber}
                          </div>
                          <div className="text-[11px] text-slate-400">Cấp ngày: {doc.issueDate}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {doc.department}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-semibold text-slate-800">
                            {doc.panelCap} / {doc.maxCap} hộ
                          </div>
                          <div className="w-24 mx-auto bg-slate-100 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full ${
                                capPercent > 90
                                  ? 'bg-rose-500'
                                  : capPercent > 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${capPercent}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1 font-bold text-amber-600">
                            <span className="material-symbols-outlined text-[15px] fill-current">star</span>
                            <span>{doc.rating}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{doc.totalEncounters} lượt khám</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {doc.status === 'active' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Đang trực chiến
                            </span>
                          )}
                          {doc.status === 'on_leave' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Nghỉ phép
                            </span>
                          )}
                          {doc.status === 'pending_approval' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Chờ thẩm định CCHN
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {doc.status === 'pending_approval' ? (
                            <button
                              onClick={() => handleApprove(doc.id)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                            >
                              Phê duyệt
                            </button>
                          ) : (
                            <button
                              onClick={() => alert(`Điều chỉnh phân công cho bác sĩ ${doc.name}`)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Điều chỉnh
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Tiếp nhận bác sĩ mới */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-bold text-slate-900 text-base">Tiếp nhận Hồ sơ Bác sĩ vào Cơ sở</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateDoctor} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên Bác sĩ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: ThS.BS Phan Văn Minh"
                    value={newDoctorName}
                    onChange={(e) => setNewDoctorName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số Chứng chỉ Hành nghề (CCHN) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 028812/HCM-CCHN"
                    value={newDoctorCchn}
                    onChange={(e) => setNewDoctorCchn(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Khoa phòng phân công
                  </label>
                  <select
                    value={newDoctorDept}
                    onChange={(e) => setNewDoctorDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Khoa Y học Gia đình">Khoa Y học Gia đình</option>
                    <option value="Khoa Nội Tổng quát">Khoa Nội Tổng quát</option>
                    <option value="Khoa Nhi">Khoa Nhi</option>
                    <option value="Khoa Cấp cứu & Y tế Gia đình">Khoa Cấp cứu & Y tế Gia đình</option>
                    <option value="Khoa Nội tiết">Khoa Nội tiết</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Quy định thẩm định CCHN:</p>
                  <p className="mt-1">
                    Bác sĩ được kích hoạt sau khi Bệnh viện và Cổng Y tế FamiDoc xác thực CCHN khớp với cơ sở dữ liệu Cục Quản lý Khám chữa bệnh (Bộ Y Tế).
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs"
                  >
                    Lưu &amp; Gửi thẩm duyệt
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

