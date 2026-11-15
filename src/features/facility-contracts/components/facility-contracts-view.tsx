'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  useContractWorkflow,
  updateContractStep,
  resetContractWorkflow,
  INITIAL_DOCTOR_CANDIDATES,
  DoctorCapacityOption,
} from '@/lib/contract-workflow-storage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Progress } from '@/components/ui/progress';

export function FacilityContractsView() {
  const contract = useContractWorkflow();
  const [doctors] = useState<DoctorCapacityOption[]>(INITIAL_DOCTOR_CANDIDATES);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('DOC-7901');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [signing, setSigning] = useState(false);
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
      toast.success(
        `Đã ký số Bệnh viện và phân công Bác sĩ ${selectedDoctor.name} phụ trách Hộ ${contract.familyId}!`
      );
    }, 1200);
  };

  const handleResetDemo = () => {
    resetContractWorkflow();
    toast.info('Đã reset dữ liệu luồng hợp đồng về trạng thái mẫu!');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-900 font-sans">
      {/* Header Điều Phối SCR-22 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDemo}
            className="rounded-xl bg-white text-xs font-semibold cursor-pointer"
            title="Đặt lại trạng thái mẫu để test lại từ đầu"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">restart_alt</span>
            <span>Reset Demo</span>
          </Button>
          <Button asChild variant="secondary" size="sm" className="rounded-xl text-xs font-semibold">
            <Link href="/facility/staff">
              <span className="material-symbols-outlined text-[16px]">group</span>
              <span>Danh bạ Nhân sự BS</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Tiến trình 4 Bên Real-time */}
      <Card className="border-slate-200 rounded-2xl py-5 shadow-2xs">
        <CardContent className="px-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide tabular-nums">
              Tiến trình Ký số Hợp đồng 4 Bên ({contract.contractCode})
            </span>
            <Badge
              variant="outline"
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                contract.step === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : contract.step === 'PENDING_FACILITY_SIGN'
                  ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                  : 'bg-blue-50 text-primary border-blue-200'
              }`}
            >
              {contract.statusLabel}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">1. Đại diện Gia đình</span>
                <span className="text-emerald-600 material-symbols-outlined text-[18px]">check_circle</span>
              </div>
              <div className="mt-2 text-xs font-bold text-slate-900">{contract.familyHeadName}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">{contract.familySignedAt || 'Đã ký OTP'}</div>
            </div>

            <div className={`p-3.5 rounded-xl border ${contract.adminSigned ? 'border-emerald-200 bg-emerald-50/40' : 'border-amber-200 bg-amber-50/40'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">2. Nền tảng FamiDoc</span>
                <span className={`material-symbols-outlined text-[18px] ${contract.adminSigned ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {contract.adminSigned ? 'check_circle' : 'pending'}
                </span>
              </div>
              <div className="mt-2 text-xs font-bold text-slate-900">Ban Quản Trị Hệ Thống</div>
              <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                {contract.adminSigned ? `${contract.adminSignedAt} (SmartCA)` : 'Đang chờ ký'}
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border ${contract.facilitySigned ? 'border-emerald-200 bg-emerald-50/40' : 'border-primary/40 bg-accent/50 ring-2 ring-primary/15'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary">3. Cơ sở Y tế (Bên C)</span>
                <span className={`material-symbols-outlined text-[18px] ${contract.facilitySigned ? 'text-emerald-600' : 'text-primary animate-spin'}`}>
                  {contract.facilitySigned ? 'check_circle' : 'progress_activity'}
                </span>
              </div>
              <div className="mt-2 text-xs font-bold text-slate-900">BV Đại học Y Dược</div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                {contract.facilitySigned ? `BS: ${contract.assignedDoctorName}` : 'Bạn đang duyệt bước này'}
              </div>
            </div>

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
              <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                {contract.doctorSigned ? `${contract.doctorSignedAt}` : 'Chờ BS xác nhận'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thẻ Chi tiết Hợp đồng & Phân công */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-200 rounded-2xl py-6 shadow-2xs">
            <CardContent className="px-6">
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
                  <span className="text-sm font-bold text-primary block mt-0.5">{contract.packageName}</span>
                  <span className="text-xs font-bold text-slate-900 tabular-nums">{contract.packagePriceFormatted} / 12 tháng</span>
                </div>
              </div>

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
                          <span className="w-6 h-6 rounded-full bg-accent text-primary text-xs font-bold flex items-center justify-center">
                            {m.name.charAt(0)}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{m.name}</span>
                          <span className="text-[11px] text-slate-500 tabular-nums">
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
            </CardContent>
          </Card>
        </div>

        {/* Cột Phải: Phân Công Bác Sĩ & Ký Số Cơ Sở Y Tế */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200 rounded-2xl py-6 shadow-2xs">
            <CardContent className="px-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Phân Công Bác Sĩ Phụ Trách</h3>
                  <p className="text-xs text-slate-500">Theo chuẩn định mức tải BR-04 (Tối đa 30 hộ/BS)</p>
                </div>
                <Badge variant="outline" className="px-2.5 py-1 rounded-md bg-accent text-primary text-[11px] font-bold border-primary/20">
                  BR-04 Rule
                </Badge>
              </div>

              {capacityError && (
                <Alert variant="destructive" className="mb-4 rounded-xl bg-red-50 border-red-200 text-[#ba1a1a]">
                  <AlertTitle className="text-xs font-bold">Cảnh báo vi phạm giới hạn:</AlertTitle>
                  <AlertDescription className="text-xs text-[#ba1a1a]">{capacityError}</AlertDescription>
                </Alert>
              )}

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
                          ? 'border-primary bg-accent/50 ring-2 ring-primary/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                              isSelected ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {doc.name.split(' ').slice(-1)[0].charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{doc.name}</span>
                              {isSelected && (
                                <span className="material-symbols-outlined text-[15px] text-primary">
                                  check_circle
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">{doc.title}</div>
                          </div>
                        </div>

                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-bold rounded-full ${
                            isFull
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : doc.activePanelCount >= 24
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isFull ? 'Quá tải (30/30)' : 'Khả dụng'}
                        </Badge>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-500">Định mức phụ trách:</span>
                          <span className="font-bold text-slate-800 tabular-nums">
                            {doc.activePanelCount} / {doc.maxPanelCapacity} hộ ({percentage}%)
                          </span>
                        </div>
                        <Progress
                          value={percentage}
                          className={`h-1.5 bg-slate-200 ${
                            isFull
                              ? '[&_[data-slot=progress-indicator]]:bg-red-600'
                              : doc.activePanelCount >= 24
                              ? '[&_[data-slot=progress-indicator]]:bg-amber-500'
                              : '[&_[data-slot=progress-indicator]]:bg-emerald-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                    <span>Chứng thư số SmartCA Bệnh viện</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ký số điện tử xác nhận Bệnh viện tiếp nhận dịch vụ và bảo lãnh chuyên môn theo Nghị định 13/2023/NĐ-CP &amp; Thông tư 04/2022/TT-BYT.
                  </p>
                </div>

                {contract.facilitySigned ? (
                  <Alert className="rounded-xl bg-emerald-50 border-emerald-200 text-emerald-800 py-3">
                    <AlertDescription className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
                        <span>Đã hoàn tất ký số đại diện Cơ sở y tế!</span>
                      </div>
                      <span className="text-[11px] text-emerald-700 tabular-nums">{contract.facilitySignedAt}</span>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setShowAssignModal(true)}
                    disabled={!contract.adminSigned && contract.step !== 'PENDING_FACILITY_SIGN'}
                    className="w-full h-11 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-primary/20 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">draw</span>
                    <span>Ký Số Đại Diện Bệnh Viện &amp; Chuyển Giao Bác Sĩ</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Xác Nhận Ký Số Bệnh Viện */}
      <Dialog open={showAssignModal && Boolean(selectedDoctor)} onOpenChange={setShowAssignModal}>
        <DialogContent className="rounded-2xl border-slate-200 sm:max-w-lg">
          {selectedDoctor && (
            <>
              <DialogHeader className="border-b border-slate-100 pb-3">
                <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <span className="material-symbols-outlined text-[20px] text-primary">verified_user</span>
                  <span>Xác Nhận Ký Số &amp; Phân Công Bác Sĩ</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Kiểm tra lại thông tin bác sĩ phụ trách trước khi ký số đại diện Cơ sở Y tế
                </DialogDescription>
              </DialogHeader>

              <div className="py-2 text-xs text-slate-700 space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                  <div className="text-slate-500">Hợp đồng điện tử:</div>
                  <div className="font-bold text-slate-900 text-sm tabular-nums">{contract.contractCode}</div>
                  <div className="text-slate-500">Hộ gia đình:</div>
                  <div className="font-bold text-slate-900">{contract.familyHeadName} (4 thành viên)</div>
                </div>

                <div className="p-3 bg-accent/60 border border-primary/20 rounded-xl space-y-1.5">
                  <div className="text-primary font-semibold">Bác sĩ được chỉ định phụ trách:</div>
                  <div className="font-bold text-slate-900 text-sm">{selectedDoctor.name}</div>
                  <div className="text-slate-600 text-[11px]">{selectedDoctor.specialty}</div>
                  <div className="text-slate-600 text-[11px]">
                    Tải hiện tại: <strong className="tabular-nums font-bold text-slate-900">{selectedDoctor.activePanelCount} / 30 hộ</strong> (Sau khi gán: {selectedDoctor.activePanelCount + 1}/30)
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Khi bấm ký số, hệ thống sẽ gắn chứng thư số điện tử của <strong>Bệnh viện Đại học Y Dược TP.HCM</strong> và gửi thông báo trực tiếp đến Bác sĩ phụ trách tại màn hình <span className="font-semibold text-primary">SCR-16</span>.
                </p>
              </div>

              <DialogFooter className="border-t border-slate-100 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAssignModal(false)}
                  className="rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </Button>

                <Button
                  type="button"
                  onClick={handleExecuteFacilitySign}
                  disabled={signing}
                  className="rounded-xl text-xs font-bold shadow-md cursor-pointer"
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
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
