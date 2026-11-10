'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  useContractWorkflow,
  updateContractStep,
  resetContractWorkflow,
  INITIAL_DOCTOR_CANDIDATES,
  DoctorCapacityOption,
} from '@/lib/contract-workflow-storage';

export function FacilityContractsView() {
  const contract = useContractWorkflow();
  const [doctors] = useState<DoctorCapacityOption[]>(INITIAL_DOCTOR_CANDIDATES);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('DOC-7901');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [capacityError, setCapacityError] = useState<string | null>(null);

  if (!contract) return null;

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  const handleSelectDoctor = (doc: DoctorCapacityOption) => {
    if (doc.activePanelCount >= doc.maxPanelCapacity) {
      setCapacityError(
        `Quy tắc BR-04 (Panel Cap Ceilings): Bác sĩ ${doc.name} đã chạm ngưỡng tối đa ${doc.maxPanelCapacity}/${doc.maxPanelCapacity} hộ gia đình. Không thể phân công thêm để đảm bảo an toàn chất lượng chuyên môn y tế!`
      );
      return;
    }
    setCapacityError(null);
    setSelectedDoctorId(doc.id);
  };

  const handleExecuteFacilitySign = () => {
    if (!selectedDoctor) return;
    if (selectedDoctor.activePanelCount >= selectedDoctor.maxPanelCapacity) {
      setCapacityError('Bác sĩ đã quá tải, vui lòng chọn bác sĩ khác!');
      return;
    }

    setSigning(true);
    setTimeout(() => {
      updateContractStep('PENDING_DOCTOR_SIGN', {
        facilitySigned: true,
        facilitySignedAt: new Date().toLocaleString('vi-VN'),
        facilitySignerName: 'GS.TS Nguyễn Văn H. (Phó Giám đốc BV ĐHYD)',
        assignedDoctorId: selectedDoctor.id,
        assignedDoctorName: selectedDoctor.name,
        assignedDoctorTitle: selectedDoctor.title,
      });
      setSigning(false);
      setShowAssignModal(false);
      setToastMessage(
        `Đã ký số Bệnh viện và phân công Bác sĩ ${selectedDoctor.name} phụ trách Hộ ${contract.familyId}!`
      );
    }, 1200);
  };

  const handleResetDemo = () => {
    resetContractWorkflow();
    setToastMessage('Đã reset dữ liệu luồng hợp đồng về trạng thái mẫu!');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-900 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-xs sm:text-sm animate-fade-in border border-slate-700"
        >
          <span className="material-symbols-outlined text-[20px] text-emerald-400">
            check_circle
          </span>
          <span className="font-semibold">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-3 text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Điều Phối SCR-22 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0052cc]">
            <span className="material-symbols-outlined text-[17px]">local_hospital</span>
            <span>Bệnh viện Đại học Y Dược TP.HCM • Màn hình SCR-22</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Điều Phối Hợp Đồng 4 Bên &amp; Phân Công Bác Sĩ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tiếp nhận hồ sơ hợp đồng y tế gia đình từ Admin, kiểm tra định mức tải (Panel Capacity BR-04) và ký số đại diện Cơ sở y tế (Bên C)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDemo}
            className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            title="Đặt lại trạng thái mẫu để test lại từ đầu"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">restart_alt</span>
            <span>Reset Demo</span>
          </button>
          <Link
            href="/facility/staff"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">group</span>
            <span>Danh bạ Nhân sự BS</span>
          </Link>
        </div>
      </div>

      {/* Tiến trình 4 Bên Real-time */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Tiến trình Ký số Hợp đồng 4 Bên ({contract.contractCode})
          </span>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              contract.step === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : contract.step === 'PENDING_FACILITY_SIGN'
                ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            {contract.statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Party A */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">1. Đại diện Gia đình</span>
              <span className="text-emerald-600 material-symbols-outlined text-[18px]">check_circle</span>
            </div>
            <div className="mt-2 text-xs font-bold text-slate-900">{contract.familyHeadName}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{contract.familySignedAt || 'Đã ký OTP'}</div>
          </div>

          {/* Party B */}
          <div className={`p-3.5 rounded-xl border ${contract.adminSigned ? 'border-emerald-200 bg-emerald-50/40' : 'border-amber-200 bg-amber-50/40'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">2. Nền tảng FamiDoc</span>
              <span className={`material-symbols-outlined text-[18px] ${contract.adminSigned ? 'text-emerald-600' : 'text-amber-600'}`}>
                {contract.adminSigned ? 'check_circle' : 'pending'}
              </span>
            </div>
            <div className="mt-2 text-xs font-bold text-slate-900">Ban Quản Trị Hệ Thống</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {contract.adminSigned ? `${contract.adminSignedAt} (SmartCA)` : 'Đang chờ ký'}
            </div>
          </div>

          {/* Party C */}
          <div className={`p-3.5 rounded-xl border ${contract.facilitySigned ? 'border-emerald-200 bg-emerald-50/40' : 'border-blue-300 bg-blue-50/50 ring-2 ring-blue-500/20'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0052cc]">3. Cơ sở Y tế (Bên C)</span>
              <span className={`material-symbols-outlined text-[18px] ${contract.facilitySigned ? 'text-emerald-600' : 'text-blue-600 animate-spin'}`}>
                {contract.facilitySigned ? 'check_circle' : 'progress_activity'}
              </span>
            </div>
            <div className="mt-2 text-xs font-bold text-slate-900">BV Đại học Y Dược</div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              {contract.facilitySigned ? `BS: ${contract.assignedDoctorName}` : 'Bạn đang duyệt bước này'}
            </div>
          </div>

          {/* Party D */}
          <div className={`p-3.5 rounded-xl border ${contract.doctorSigned ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50/70'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">4. Bác sĩ Phụ trách</span>
              <span className={`material-symbols-outlined text-[18px] ${contract.doctorSigned ? 'text-emerald-600' : 'text-slate-400'}`}>
                {contract.doctorSigned ? 'check_circle' : 'schedule'}
              </span>
            </div>
            <div className="mt-2 text-xs font-bold text-slate-900">
              {contract.assignedDoctorName || 'Chờ cơ sở phân công'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {contract.doctorSigned ? `${contract.doctorSignedAt}` : 'Chờ BS xác nhận'}
            </div>
          </div>
        </div>
      </div>

      {/* Thẻ Chi tiết Hợp đồng & Phân công */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái: Thông tin Hợp đồng & Hồ sơ Bệnh án ban đầu của Hộ */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Hồ Sơ Hộ Gia Đình</span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{contract.familyHeadName} ({contract.familyId})</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">location_on</span>
                  <span>{contract.familyAddress}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">phone</span>
                  <span className="tabular-nums font-semibold">{contract.familyPhone}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-500 block">Gói chăm sóc</span>
                <span className="text-sm font-bold text-[#0052cc] block mt-0.5">{contract.packageName}</span>
                <span className="text-xs font-bold text-slate-900 tabular-nums">{contract.packagePriceFormatted} / 12 tháng</span>
              </div>
            </div>

            {/* Danh sách 4 Thành viên & Tiền sử bệnh ban đầu */}
            <div className="mt-5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-slate-500">clinical_notes</span>
                <span>Tiền sử y tế ban đầu của các thành viên ({contract.members.length} người)</span>
              </h4>

              <div className="space-y-3">
                {contract.members.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-[#0052cc] text-xs font-bold flex items-center justify-center">
                          {m.name.charAt(0)}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{m.name}</span>
                        <span className="text-[11px] text-slate-500">
                          ({m.relation} • {new Date().getFullYear() - m.birthYear} tuổi • {m.gender})
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                        ID: {m.cccdOrBhyt}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-700 pl-8 space-y-1">
                      <p>
                        <strong className="text-slate-800">Bệnh sử ban đầu:</strong> {m.baselineMedicalHistory}
                      </p>
                      {m.allergies && m.allergies !== 'Không ghi nhận' && m.allergies !== 'Không' && (
                        <p className="text-[#ba1a1a] font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                          <span>Dị ứng: {m.allergies}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cột Phải: Phân Công Bác Sĩ & Ký Số Cơ Sở Y Tế (SCR-22) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Phân Công Bác Sĩ Phụ Trách</h3>
                <p className="text-xs text-slate-500">Theo chuẩn định mức tải BR-04 (Tối đa 30 hộ/BS)</p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#0052cc] text-[11px] font-bold border border-blue-200">
                BR-04 Rule
              </span>
            </div>

            {/* Thông báo lỗi nếu quá tải */}
            {capacityError && (
              <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-[#ba1a1a] text-xs">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                  <div>
                    <strong className="font-bold">Cảnh báo vi phạm giới hạn:</strong>
                    <p className="mt-0.5">{capacityError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Danh sách Bác sĩ để chọn */}
            <div className="space-y-3">
              {doctors.map((doc) => {
                const isSelected = selectedDoctorId === doc.id;
                const isFull = doc.activePanelCount >= doc.maxPanelCapacity;
                const percentage = Math.round((doc.activePanelCount / doc.maxPanelCapacity) * 100);

                return (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoctor(doc)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isFull
                        ? 'border-red-200 bg-red-50/40 opacity-75 cursor-not-allowed'
                        : isSelected
                        ? 'border-[#0052cc] bg-blue-50/60 ring-2 ring-[#0052cc]/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected ? 'bg-[#0052cc] text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {doc.name.split(' ').slice(-1)[0].charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{doc.name}</span>
                            {isSelected && (
                              <span className="material-symbols-outlined text-[15px] text-[#0052cc]">
                                check_circle
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{doc.title}</div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isFull
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : doc.activePanelCount >= 24
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isFull ? 'Quá tải (30/30)' : 'Khả dụng'}
                      </span>
                    </div>

                    {/* Thanh tải Panel Capacity */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-500">Định mức phụ trách:</span>
                        <span className="font-bold text-slate-800 tabular-nums">
                          {doc.activePanelCount} / {doc.maxPanelCapacity} hộ ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isFull ? 'bg-red-600' : doc.activePanelCount >= 24 ? 'bg-amber-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Nút Ký Số Cơ Sở Y Tế */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="material-symbols-outlined text-[16px] text-[#0052cc]">verified</span>
                  <span>Chứng thư số SmartCA Bệnh viện</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Ký số điện tử xác nhận Bệnh viện tiếp nhận dịch vụ và bảo lãnh chuyên môn theo Nghị định 13/2023/NĐ-CP &amp; Thông tư 04/2022/TT-BYT.
                </p>
              </div>

              {contract.facilitySigned ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
                    <span>Đã hoàn tất ký số đại diện Cơ sở y tế!</span>
                  </div>
                  <span className="text-[11px] text-emerald-700">{contract.facilitySignedAt}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAssignModal(true)}
                  disabled={!contract.adminSigned && contract.step !== 'PENDING_FACILITY_SIGN'}
                  className="w-full py-3 bg-[#0052cc] hover:bg-[#003da6] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#0052cc]/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">draw</span>
                  <span>Ký Số Đại Diện Bệnh Viện &amp; Chuyển Giao Bác Sĩ</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Xác Nhận Ký Số Bệnh Viện (SCR-22 Modal) */}
      {showAssignModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#0052cc]">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
                <h3 className="font-bold text-slate-900 text-base">Xác Nhận Ký Số &amp; Phân Công Bác Sĩ</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 text-xs text-slate-700 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <div className="text-slate-500">Hợp đồng điện tử:</div>
                <div className="font-bold text-slate-900 text-sm">{contract.contractCode}</div>
                <div className="text-slate-500">Hộ gia đình:</div>
                <div className="font-bold text-slate-900">{contract.familyHeadName} (4 thành viên)</div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
                <div className="text-[#0052cc] font-semibold">Bác sĩ được chỉ định phụ trách:</div>
                <div className="font-bold text-slate-900 text-sm">{selectedDoctor.name}</div>
                <div className="text-slate-600 text-[11px]">{selectedDoctor.specialty}</div>
                <div className="text-slate-600 text-[11px]">
                  Tải hiện tại: <strong className="tabular-nums font-bold text-slate-900">{selectedDoctor.activePanelCount} / 30 hộ</strong> (Sau khi gán: {selectedDoctor.activePanelCount + 1}/30)
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Khi bấm ký số, hệ thống sẽ gắn chứng thư số điện tử của <strong>Bệnh viện Đại học Y Dược TP.HCM</strong> và gửi thông báo trực tiếp đến Bác sĩ phụ trách tại màn hình <code>SCR-16</code>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleExecuteFacilitySign}
                disabled={signing}
                className="px-5 py-2.5 bg-[#0052cc] hover:bg-[#003da6] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {signing ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    <span>Đang ký số SmartCA...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">draw</span>
                    <span>Xác Nhận Ký Số (Bên C)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
