'use client';

import React, { useState, useEffect } from 'react';
import { doctorsApi, type CreateFacilityDoctorPayload } from '@/lib/api/doctors.api';

export interface DoctorStaff {
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
  onboardingStatus?: 'PENDING_SUBMISSION' | 'PENDING_FACILITY_REVIEW' | 'FACILITY_VERIFIED' | 'ACTIVE' | 'REJECTED';
  email?: string;
  phone?: string;
  experienceYears?: number;
  academicTitle?: string;
}

export function FacilityStaffView() {
  const [staffList, setStaffList] = useState<DoctorStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Thêm Bác sĩ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorEmail, setNewDoctorEmail] = useState('');
  const [newDoctorPhone, setNewDoctorPhone] = useState('');
  const [newDoctorExp, setNewDoctorExp] = useState('5');
  const [newDoctorDept, setNewDoctorDept] = useState('Khoa Y học Gia đình');
  const [newDoctorTitle, setNewDoctorTitle] = useState('BS.CKI');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal Thông báo cấp tài khoản thành công
  const [createdDoctorInfo, setCreatedDoctorInfo] = useState<{
    name: string;
    email: string;
    defaultPassword: string;
    specialty: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tải danh sách bác sĩ trực tiếp từ Backend API
  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const docs = await doctorsApi.getFacilityDoctors();
      if (Array.isArray(docs)) {
        const mapped: DoctorStaff[] = docs.map((d: any, idx: number) => {
          const cred = Array.isArray(d.credentials) && d.credentials.length > 0 ? d.credentials[0] : null;
          const cchnNumber = cred?.certificateNumber || d.cchnNumber || (d.onboardingStatus === 'PENDING_SUBMISSION' && !cred ? 'Chờ BS nộp CCHN' : 'Chưa có');
          const issueDate = cred?.issueDate ? new Date(cred.issueDate).toLocaleDateString('vi-VN') : d.cchnIssueDate || 'Chưa có';
          return {
            id: d.id || `DOC-00${idx + 1}`,
            name: d.doctorName || d.fullName || 'Bác sĩ',
            title: d.specialty ? `Bác sĩ ${d.specialty}` : 'Bác sĩ Gia đình',
            department: d.specialty || 'Khoa Y học Gia đình',
            cchnNumber,
            issueDate,
            panelCap: d.activePanelCount ?? 0,
            maxCap: d.maxPanelCapacity ?? 30,
            rating: d.ratingAvg ?? 5.0,
            totalEncounters: d.totalReviews ?? 0,
            status: d.onboardingStatus === 'ACTIVE' ? 'active' : 'pending_approval',
            onboardingStatus: d.onboardingStatus || 'PENDING_SUBMISSION',
            email: d.email,
            phone: d.phone,
          };
        });
        setStaffList(mapped);
      } else {
        setStaffList([]);
      }
    } catch (err) {
      console.warn('Lỗi khi tải danh sách Bác sĩ từ Backend:', err);
      setStaffList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Dọn sạch mọi dữ liệu ảo cũ trong LocalStorage của trình duyệt
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('famidoc_facility_doctors');
      } catch {
        // Ignore
      }
    }
    fetchDoctors();
  }, []);

  const filteredStaff = staffList.filter((doc) => {
    const matchesDept = filterDepartment === 'all' || doc.department === filterDepartment;
    const matchesStatus =
      filterStatus === 'all' ||
      doc.status === filterStatus ||
      doc.onboardingStatus === filterStatus;
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.cchnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.email && doc.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.phone && doc.phone.includes(searchQuery));
    return matchesDept && matchesStatus && matchesSearch;
  });

  // Thẩm định Cấp 1 hồ sơ CCHN của Bác sĩ (Flow 2.1 - Giai đoạn 5)
  const handleApprove = async (docId: string) => {
    try {
      await doctorsApi.facilityApproveCredentials(docId, {
        approved: true,
        verificationNotes: 'Cơ sở y tế đã thẩm định và phê duyệt Cấp 1 hồ sơ chuyên môn',
      });
      setToastMessage(`Đã duyệt Cấp 1 cho Bác sĩ ${docId}. Hồ sơ đã chuyển sang Admin để đối soát CSDL Quốc gia.`);
      setTimeout(() => setToastMessage(null), 5000);
      await fetchDoctors();
    } catch (err: any) {
      console.warn('Lỗi thẩm định Cấp 1:', err);
      const msg = err?.message || 'Không thể thẩm định Cấp 1 trên máy chủ.';
      setToastMessage(`[Lỗi] ${msg}`);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  // Khởi tạo Bác sĩ mới trực thuộc (Flow 2.1 - Giai đoạn 4)
  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorName || !newDoctorEmail || !newDoctorPhone) return;

    setIsSubmitting(true);
    setCreateError(null);

    const payload: CreateFacilityDoctorPayload = {
      doctorName: newDoctorName.trim(),
      email: newDoctorEmail.trim(),
      phone: newDoctorPhone.trim(),
      specialty: newDoctorDept,
      experienceYears: Number(newDoctorExp) || 3,
      academicTitle: newDoctorTitle,
    };

    try {
      const res: any = await doctorsApi.createFacilityDoctor(payload);
      const createdId = res?.data?.id || res?.id || 'doc-new';

      const newDoc: DoctorStaff = {
        id: createdId,
        name: newDoctorName.trim(),
        title: `${newDoctorTitle} • ${newDoctorDept}`,
        department: newDoctorDept,
        cchnNumber: 'Chờ BS nộp CCHN',
        issueDate: 'Chưa nộp',
        panelCap: 0,
        maxCap: 30,
        rating: 5.0,
        totalEncounters: 0,
        status: 'pending_approval',
        onboardingStatus: 'PENDING_SUBMISSION',
        email: newDoctorEmail.trim(),
        phone: newDoctorPhone.trim(),
        experienceYears: Number(newDoctorExp) || 3,
        academicTitle: newDoctorTitle,
      };

      // Cập nhật ngay lập tức bác sĩ vừa tạo lên bảng giao diện
      setStaffList((prev) => [newDoc, ...prev]);

      // Đồng bộ ngầm với backend
      fetchDoctors().catch(() => { });

      // Đóng form tạo, mở modal thông báo cấp tài khoản thành công
      setIsModalOpen(false);
      setCreatedDoctorInfo({
        name: newDoctorName.trim(),
        email: newDoctorEmail.trim(),
        defaultPassword: 'FamiDoc@Doctor2026',
        specialty: newDoctorDept,
      });

      // Reset input fields
      setNewDoctorName('');
      setNewDoctorEmail('');
      setNewDoctorPhone('');
      setNewDoctorExp('5');
      setToastMessage(`Khởi tạo Bác sĩ thành công trên Database (ID: ${createdId})`);
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      console.warn('Lỗi khi gọi API khởi tạo Bác sĩ:', err?.message || err);
      const errorMsg =
        err?.message ||
        err?.response?.data?.message ||
        'Không thể khởi tạo Bác sĩ trên máy chủ. Vui lòng kiểm tra trạng thái kích hoạt CSYT và Hợp đồng B2B.';
      setCreateError(errorMsg);
      setToastMessage(`[Lỗi] ${errorMsg}`);
      setTimeout(() => setToastMessage(null), 6000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDemo = () => {
    fetchDoctors();
    setToastMessage('Đã đồng bộ lại danh sách bác sĩ từ cơ sở dữ liệu Backend.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
              <span className="material-symbols-outlined text-[17px]">badge</span>
              <span>Cơ sở y tế • Nhân sự trực thuộc (Flow 2.1)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Quản lý Đội ngũ Bác sĩ Trực thuộc
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Khởi tạo tài khoản Bác sĩ trực thuộc, theo dõi tiến trình nộp CCHN và thẩm định Cấp 1 nội bộ.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetDemo}
              className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="Đặt lại danh sách mẫu"
            >
              <span className="material-symbols-outlined text-[16px] text-slate-500">restart_alt</span>
              <span>Reset Mẫu</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Thêm Bác Sĩ Mới</span>
            </button>
          </div>
        </div>

        {/* Toast Message */}
        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
              <span>{toastMessage}</span>
            </div>
            <button type="button" onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
              ✕
            </button>
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
              placeholder="Tìm theo tên bác sĩ, email, số CCHN, chuyên khoa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ACTIVE">Đã kích hoạt (ACTIVE)</option>
              <option value="PENDING_SUBMISSION">Chờ BS nộp CCHN</option>
              <option value="PENDING_FACILITY_REVIEW">Chờ CSYT thẩm định Cấp 1</option>
              <option value="FACILITY_VERIFIED">Đã duyệt Cấp 1 (Chờ Admin)</option>
            </select>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Bác sĩ &amp; Chức danh</th>
                  <th className="py-3.5 px-4">Liên hệ &amp; Email</th>
                  <th className="py-3.5 px-4">Chứng chỉ CCHN</th>
                  <th className="py-3.5 px-4">Khoa phòng</th>
                  <th className="py-3.5 px-4 text-center">Panel Cap</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái Onboarding</th>
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
                    const capPercent = doc.maxCap > 0 ? Math.round((doc.panelCap / doc.maxCap) * 100) : 0;
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{doc.name}</div>
                          <div className="text-[11px] text-slate-500">{doc.title}</div>
                          <div className="text-[10px] text-slate-400 tracking-wide mt-0.5">ID: {doc.id}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-slate-800 font-medium">{doc.email || '—'}</div>
                          <div className="text-[11px] text-slate-500">{doc.phone || '—'}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="tabular-nums text-xs text-slate-700 font-semibold">
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
                          <div className="w-20 mx-auto bg-slate-100 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full ${capPercent > 90
                                ? 'bg-rose-500'
                                : capPercent > 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                                }`}
                              style={{ width: `${capPercent}%` }}
                            ></div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {doc.onboardingStatus === 'ACTIVE' || doc.status === 'active' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Đang hoạt động
                            </span>
                          ) : doc.onboardingStatus === 'FACILITY_VERIFIED' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              ● Đã duyệt Cấp 1 (Chờ Admin)
                            </span>
                          ) : (doc.onboardingStatus === 'PENDING_FACILITY_REVIEW' || (doc.onboardingStatus === 'PENDING_SUBMISSION' && doc.cchnNumber && doc.cchnNumber !== 'Chờ BS nộp CCHN' && doc.cchnNumber !== 'Chưa có')) ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              ● Chờ CSYT duyệt Cấp 1
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Chờ BS nộp CCHN
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {(doc.onboardingStatus === 'PENDING_FACILITY_REVIEW' || (doc.onboardingStatus === 'PENDING_SUBMISSION' && doc.cchnNumber && doc.cchnNumber !== 'Chờ BS nộp CCHN' && doc.cchnNumber !== 'Chưa có')) ? (
                            <button
                              type="button"
                              onClick={() => handleApprove(doc.id)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                            >
                              Duyệt Cấp 1
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setToastMessage(`Hồ sơ Bác sĩ ${doc.name} (ID: ${doc.id}) - Trạng thái: ${doc.onboardingStatus || 'ACTIVE'}`);
                                setTimeout(() => setToastMessage(null), 4000);
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Chi tiết
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

        {/* Modal: Thêm Bác sĩ Mới (Flow 2.1 - API 14) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Khởi tạo Tài khoản Bác sĩ Trực thuộc</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Flow 2.1 • Cấp tài khoản mặc định để bác sĩ đăng nhập nộp CCHN</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateDoctor} className="space-y-3.5">
                {createError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
                    <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0">error</span>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-rose-800">Lỗi từ máy chủ Backend:</p>
                      <p className="leading-relaxed">{createError}</p>
                    </div>
                  </div>
                )}
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email đăng nhập <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="minh.phan@ansinhhospital.vn"
                      value={newDoctorEmail}
                      onChange={(e) => setNewDoctorEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số điện thoại <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0988123456"
                      value={newDoctorPhone}
                      onChange={(e) => setNewDoctorPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Học vị / Học hàm
                    </label>
                    <select
                      value={newDoctorTitle}
                      onChange={(e) => setNewDoctorTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
                    >
                      <option value="BS">Bác sĩ (BS)</option>
                      <option value="ThS.BS">Thạc sĩ Bác sĩ (ThS.BS)</option>
                      <option value="BS.CKI">Bác sĩ Chuyên khoa 1 (BS.CKI)</option>
                      <option value="BS.CKII">Bác sĩ Chuyên khoa 2 (BS.CKII)</option>
                      <option value="TS.BS">Tiến sĩ Bác sĩ (TS.BS)</option>
                      <option value="PGS.TS.BS">Phó Giáo sư (PGS.TS.BS)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số năm kinh nghiệm
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={newDoctorExp}
                      onChange={(e) => setNewDoctorExp(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm tabular-nums focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Khoa phòng chuyên môn
                  </label>
                  <select
                    value={newDoctorDept}
                    onChange={(e) => setNewDoctorDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
                  >
                    <option value="Khoa Y học Gia đình">Khoa Y học Gia đình</option>
                    <option value="Khoa Nội Tổng quát">Khoa Nội Tổng quát</option>
                    <option value="Khoa Nhi">Khoa Nhi</option>
                    <option value="Khoa Cấp cứu & Y tế Gia đình">Khoa Cấp cứu & Y tế Gia đình</option>
                    <option value="Khoa Nội tiết">Khoa Nội tiết</option>
                  </select>
                </div>

                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-blue-700">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    <span>Quy trình kích hoạt nhân sự (Flow 2.1):</span>
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Hệ thống tự động cấp mật khẩu khởi tạo: <strong className="tracking-wide">FamiDoc@Doctor2026</strong>. Bác sĩ sẽ đăng nhập lần đầu để đổi mật khẩu và nộp Chứng chỉ hành nghề (CCHN) để được CSYT duyệt Cấp 1.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? 'Đang tạo...' : 'Khởi tạo Bác sĩ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Thông Báo Cấp Tài Khoản Bác Sĩ Thành Công */}
        {createdDoctorInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold">
                ✓
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">Khởi Tạo Bác Sĩ Thành Công!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Thông tin đăng nhập ban đầu đã được thiết lập cho <strong>{createdDoctorInfo.name}</strong>.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Email đăng nhập:</span>
                  <span className="font-semibold text-slate-900 tracking-wide">{createdDoctorInfo.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Mật khẩu khởi tạo:</span>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded tracking-wide">
                    {createdDoctorInfo.defaultPassword}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Chuyên khoa:</span>
                  <span className="font-semibold text-slate-800">{createdDoctorInfo.specialty}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Trạng thái:</span>
                  <span className="font-bold text-amber-700">PENDING_SUBMISSION (Chờ nộp CCHN)</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Bác sĩ cần đăng nhập vào Portal Bác sĩ, thực hiện đổi mật khẩu bắt buộc và tải lên hồ sơ CCHN để CSYT thẩm định Cấp 1.
              </p>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCreatedDoctorInfo(null)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-colors cursor-pointer"
                >
                  Đã hiểu &amp; Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
