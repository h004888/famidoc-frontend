'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  useContractWorkflow,
  updateContractStep,
  resetContractWorkflow,
} from '@/lib/contract-workflow-storage';
import { contractsApi, type StaffingContractItem } from '@/lib/api/contracts.api';

interface LegalContract {
  id: string;
  title: string;
  type: 'b2b_hospital' | 'four_parties' | 'appendix';
  partnerName: string;
  effectiveDate: string;
  expiryDate: string;
  revenueShareRate: string;
  status: 'active' | 'pending_signature' | 'expiring_soon' | 'terminated';
  signedBy: string;
  rawB2b?: StaffingContractItem;
}

const STATIC_CONTRACTS: LegalContract[] = [];

export function AdminContractsView() {
  const workflow = useContractWorkflow();
  const [filterType, setFilterType] = useState<'all' | 'b2b_hospital' | 'four_parties' | 'appendix'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContract, setSelectedContract] = useState<LegalContract | null>(null);
  const [notification, setNotification] = useState('');
  const [isSigningAdmin, setIsSigningAdmin] = useState(false);

  // B2B Staffing Contracts state (Flow 2.1)
  const [b2bContracts, setB2bContracts] = useState<LegalContract[]>([]);
  const [showCreateB2BModal, setShowCreateB2BModal] = useState(false);
  const [newFacilityName, setNewFacilityName] = useState('');
  const [newContractCode, setNewContractCode] = useState('');
  const [newFacilityShare, setNewFacilityShare] = useState(85);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  // Load staffing contracts directly from Backend API
  const loadB2b = async () => {
    try {
      const res = await contractsApi.getStaffingContracts();
      if (res && Array.isArray(res.data)) {
        const mapped: LegalContract[] = res.data.map((item) => ({
          id: item.contractNumber,
          title: `Hợp đồng Cung ứng Nhân lực B2B (${item.contractNumber})`,
          type: 'b2b_hospital' as const,
          partnerName: item.facilityName,
          effectiveDate: new Date(item.validFrom).toLocaleDateString('vi-VN'),
          expiryDate: new Date(item.validTo).toLocaleDateString('vi-VN'),
          revenueShareRate: `${item.facilitySharePercent}% CSYT / ${item.platformSharePercent}% Platform`,
          status:
            item.status === 'ACTIVE'
              ? 'active'
              : item.status === 'TERMINATED'
              ? 'terminated'
              : 'pending_signature',
          signedBy:
            item.status === 'ACTIVE'
              ? 'Đã ký số: Admin FamiDoc SmartCA & CSYT'
              : item.facilitySigned
              ? 'CSYT đã ký (Chờ Admin duyệt)'
              : 'Chờ CSYT & Admin ký số',
          rawB2b: item,
        }));
        setB2bContracts(mapped);
      } else {
        setB2bContracts([]);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách hợp đồng B2B tại Admin:', err);
      setB2bContracts([]);
    }
  };

  useEffect(() => {
    loadB2b();
  }, []);

  const handleCreateB2BDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingDraft(true);

    try {
      await contractsApi.createStaffingContract({
        platformCommissionRate: 100 - newFacilityShare,
        facilityRevenueRate: newFacilityShare,
      });
      await loadB2b();
      setNotification(`Đã khởi tạo dự thảo hợp đồng B2B thành công trên Database!`);
      setShowCreateB2BModal(false);
    } catch (err: any) {
      console.warn('Lỗi tạo dự thảo hợp đồng B2B:', err);
      setNotification(`[Lỗi] ${err?.message || 'Không thể tạo hợp đồng trên máy chủ.'}`);
    } finally {
      setIsCreatingDraft(false);
      setTimeout(() => setNotification(''), 4500);
    }
  };

  const fourPartyItem: LegalContract = {
    id: workflow?.contractCode || 'CTR-4P-2026-88219',
    title: `Hợp đồng Điện tử Cung cấp Dịch vụ Y tế Gia đình 4 Bên (${workflow?.packageName || 'Gói Toàn Diện VIP'})`,
    type: 'four_parties',
    partnerName: `Hộ ${workflow?.familyHeadName || 'Nguyễn Văn An'} (${workflow?.familyId || 'FAM-88219'})`,
    effectiveDate: '10/11/2026',
    expiryDate: '10/11/2027',
    revenueShareRate: '85% BV ĐHYD / 15% Nền tảng (CFG-05)',
    status: workflow?.step === 'ACTIVE'
      ? 'active'
      : workflow?.adminSigned
      ? 'active'
      : 'pending_signature',
    signedBy: workflow?.adminSigned
      ? `Đã ký số: Hộ ${workflow.familyHeadName}, Admin FamiDoc SmartCA`
      : 'Chờ Quản trị viên FamiDoc ký số (Bên B)',
  };

  const allContracts: LegalContract[] = [fourPartyItem, ...b2bContracts, ...STATIC_CONTRACTS];

  const filteredContracts = allContracts.filter((c) => {
    const matchesType = filterType === 'all' || c.type === filterType;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.partnerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleApproveSignature = async (contractId: string) => {
    if (contractId === fourPartyItem.id) {
      setIsSigningAdmin(true);
      setTimeout(() => {
        updateContractStep('PENDING_FACILITY_SIGN', {
          adminSigned: true,
          adminSignedAt: new Date().toLocaleString('vi-VN'),
          adminSignerName: 'Ban Quản Trị Hệ Thống (FamiDoc Admin SmartCA)',
          adminCertSerial: 'FMD-CA-2026-889102',
        });
        setIsSigningAdmin(false);
        setSelectedContract(null);
        setNotification(
          `Đã ký số điện tử Nền tảng thành công! Hợp đồng ${contractId} đã được chuyển tới Bệnh viện ĐHYD (Màn hình SCR-22).`
        );
        setTimeout(() => setNotification(''), 4000);
      }, 1200);
      return;
    }

    if (selectedContract?.rawB2b) {
      setIsSigningAdmin(true);
      try {
        await contractsApi.signStaffingContract(selectedContract.rawB2b.id, {
          signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          signedPdfUrl: `https://cdn.famidoc.vn/contracts/staffing/${selectedContract.rawB2b.contractNumber}-signed.pdf`,
        });
        setNotification(`Đã ký số phê duyệt hợp đồng B2B ${contractId} thành công! Hợp đồng chính thức ACTIVE.`);
        await loadB2b();
      } catch (err: any) {
        console.warn('Lỗi admin ký hợp đồng B2B:', err);
        setNotification(err?.message || 'Không thể ký duyệt hợp đồng B2B trên máy chủ.');
      } finally {
        setIsSigningAdmin(false);
        setSelectedContract(null);
        setTimeout(() => setNotification(''), 4000);
      }
      return;
    }

    setNotification(`Đã xác thực và ký duyệt phụ lục ${contractId}`);
    setSelectedContract(null);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleResetDemo = () => {
    resetContractWorkflow();
    setNotification('Đã reset dữ liệu hợp đồng về trạng thái mẫu!');
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0052cc] uppercase tracking-wider">
              <span className="material-symbols-outlined text-[17px]">gavel</span>
              <span>Ban Quản Trị Hệ Thống • Phê Duyệt Pháp Lý &amp; HĐ 4 Bên</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Quản lý Hợp đồng &amp; Pháp lý Nền tảng
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Phê duyệt hợp đồng 4 bên theo chu trình sequential signing, phân bổ doanh thu 85/15 và quản trị văn bản pháp lý B2B
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowCreateB2BModal(true)}
              className="px-4 py-1.5 bg-[#0052cc] hover:bg-[#003da6] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Thiết Lập Dự Thảo HĐ B2B</span>
            </button>
            <button
              type="button"
              onClick={handleResetDemo}
              className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px] text-slate-500">restart_alt</span>
              <span>Reset Demo</span>
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px] text-amber-400">verified</span>
              <span>Tổng cộng: {allContracts.length} văn bản pháp lý</span>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {notification && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xs">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
            <span>{notification}</span>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên đối tác, mã hợp đồng, tiêu đề văn bản..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0052cc]/20"
            />
          </div>

          <div className="flex items-center gap-2">
            {(['all', 'b2b_hospital', 'four_parties', 'appendix'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  filterType === t
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t === 'all' && 'Tất cả'}
                {t === 'b2b_hospital' && 'HĐ Đối tác B2B'}
                {t === 'four_parties' && 'HĐ 4 Bên Gia đình'}
                {t === 'appendix' && 'Phụ lục HĐ'}
              </button>
            ))}
          </div>
        </div>

        {/* Contracts Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Mã &amp; Tiêu đề Hợp đồng</th>
                  <th className="py-3.5 px-4">Đối tác / Cơ sở y tế</th>
                  <th className="py-3.5 px-4">Thời hạn hiệu lực</th>
                  <th className="py-3.5 px-4">Tỷ lệ phân bổ B2B</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContracts.map((c) => {
                  const isFourParty = c.type === 'four_parties';
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isFourParty ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 leading-snug flex items-center gap-1.5">
                          {isFourParty && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-[#0052cc] text-[10px] font-bold">
                              4-Party
                            </span>
                          )}
                          <span>{c.title}</span>
                        </div>
                        <div className="tabular-nums text-[11px] text-slate-400 mt-0.5">{c.id}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {c.partnerName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>
                          {c.effectiveDate} - {c.expiryDate}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#0052cc]">
                        {c.revenueShareRate}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {c.status === 'active' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Đang hiệu lực
                          </span>
                        )}
                        {c.status === 'pending_signature' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            Chờ Admin ký số
                          </span>
                        )}
                        {c.status === 'expiring_soon' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Sắp hết hạn (&lt;30 ngày)
                          </span>
                        )}
                        {c.status === 'terminated' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                            Đã thanh lý
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isFourParty && (
                            <Link
                              href={`/admin/contracts/${c.id}/review`}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors"
                            >
                              Thẩm định 4 Bên
                            </Link>
                          )}
                          <button
                            onClick={() => setSelectedContract(c)}
                            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                              c.status === 'pending_signature'
                                ? 'bg-[#0052cc] hover:bg-[#003da6] text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {c.status === 'pending_signature' ? 'Xem & Ký Duyệt' : 'Chi tiết'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Chi tiết điều khoản pháp lý & Phê duyệt ký số */}
        {selectedContract && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0052cc] text-[22px]">
                    description
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">Hồ sơ Pháp lý Điện tử 4 Bên</h3>
                </div>
                <button
                  onClick={() => setSelectedContract(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{selectedContract.title}</div>
                  <div className="tabular-nums text-slate-500">Mã văn bản: {selectedContract.id}</div>
                  <div className="text-slate-700">
                    Bên thụ hưởng: <strong>{selectedContract.partnerName}</strong>
                  </div>
                  <div className="text-slate-700">
                    Tỷ lệ chia sẻ doanh thu: <strong>{selectedContract.revenueShareRate}</strong>
                  </div>
                </div>

                {/* Nếu là HĐ 4 Bên, hiển thị tiến trình ký 4 bên */}
                {selectedContract.type === 'four_parties' && workflow && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                    <div className="font-bold text-[#0052cc] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">draw</span>
                      <span>Quy trình Ký Tuần Tự (Sequential 4-Party Signing):</span>
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span>1. Đại diện Gia đình ({workflow.familyHeadName}):</span>
                        <span className="text-emerald-700 font-bold">Đã ký OTP ✓</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>2. Nền tảng FamiDoc (Admin):</span>
                        <span className={workflow.adminSigned ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                          {workflow.adminSigned ? 'Đã ký số SmartCA ✓' : 'Đang chờ ký (Bạn)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>3. Cơ sở Y tế (BV ĐHYD):</span>
                        <span className={workflow.facilitySigned ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                          {workflow.facilitySigned ? 'Đã phân công BS & Ký ✓' : 'Chờ chuyển tiếp (SCR-22)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>4. Bác sĩ Phụ trách:</span>
                        <span className={workflow.doctorSigned ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                          {workflow.doctorSigned ? 'Đã ký cam kết ✓' : 'Chờ xác nhận (SCR-16)'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border border-slate-200 p-3 rounded-xl space-y-2">
                  <div className="font-bold text-slate-800">Trạng thái Ký số Chứng thư:</div>
                  <p className="text-slate-600">{selectedContract.signedBy}</p>
                  <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[11px]">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>Chuẩn chữ ký số SHA-256 RSA (Bộ TT&amp;TT &amp; Viettel-CA HSM)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setNotification(`Đang tải file PDF hợp đồng ${selectedContract.id}...`);
                    setTimeout(() => setNotification(''), 3000);
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Tải bản PDF</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedContract(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Đóng
                  </button>
                  {selectedContract.type === 'four_parties' && (
                    <Link
                      href={`/admin/contracts/${selectedContract.id}/review`}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold"
                    >
                      Thẩm định &amp; Ký 4 bên
                    </Link>
                  )}
                  {selectedContract.status === 'pending_signature' && selectedContract.type !== 'four_parties' && (
                    <button
                      type="button"
                      disabled={isSigningAdmin}
                      onClick={() => handleApproveSignature(selectedContract.id)}
                      className="px-4 py-1.5 bg-[#0052cc] hover:bg-[#003da6] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {isSigningAdmin ? (
                        <>
                          <span className="material-symbols-outlined text-[14px] animate-spin">
                            progress_activity
                          </span>
                          <span>Đang ký SmartCA...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[14px]">draw</span>
                          <span>Ký Số Duyệt (Bên B)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* MODAL: THIẾT LẬP DỰ THẢO HỢP ĐỒNG B2B (POST /api/v1/contracts/staffing) */}
        {showCreateB2BModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0052cc] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[20px]">handshake</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Thiết Lập Dự Thảo HĐ B2B</h3>
                    <p className="text-xs text-slate-500">Flow 2.1 - Hợp tác cung ứng nhân lực y tế</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateB2BModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateB2BDraft} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Cơ Sở Y Tế Đối Tác <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newFacilityName}
                    onChange={(e) => {
                      setNewFacilityName(e.target.value);
                      if (e.target.value.includes('An Sinh')) {
                        setNewContractCode('STAFF-2026-ANSINH-002');
                      } else if (e.target.value.includes('FamiCare')) {
                        setNewContractCode('STAFF-2026-FAMICARE-002');
                      } else {
                        setNewContractCode(`STAFF-2026-B2B-${Math.floor(100 + Math.random() * 900)}`);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0052cc]/20"
                  >
                    <option value="Bệnh viện Đa khoa An Sinh">Bệnh viện Đa khoa An Sinh (contact@ansinhhospital.vn)</option>
                    <option value="Trung tâm Y tế Kỹ thuật cao An Sinh Hub">Trung tâm Y tế Kỹ thuật cao An Sinh Hub</option>
                    <option value="Bệnh viện Đa khoa Quốc tế FamiCare">Bệnh viện Đa khoa Quốc tế FamiCare</option>
                    <option value="Phòng khám Đa khoa Quốc tế Trustcare Hub">Phòng khám Đa khoa Quốc tế Trustcare Hub</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mã Định Danh Hợp Đồng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newContractCode}
                    onChange={(e) => setNewContractCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 tracking-wide focus:outline-hidden focus:ring-2 focus:ring-[#0052cc]/20"
                    placeholder="Ví dụ: STAFF-2026-ANSINH-002"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-blue-900">Tỷ lệ CSYT hưởng (%)</label>
                    <input
                      type="number"
                      min="50"
                      max="95"
                      value={newFacilityShare}
                      onChange={(e) => setNewFacilityShare(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-xs sm:text-sm font-bold text-blue-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600">Phí Nền tảng FamiDoc</label>
                    <div className="px-3 py-2 text-xs sm:text-sm font-bold text-slate-700 bg-white/70 rounded-lg border border-blue-200">
                      {100 - newFacilityShare}% Platform
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  💡 <strong>Quy trình ký 2 bên:</strong> Khi Admin bấm <em>"Tạo Dự Thảo &amp; Ký Số Platform"</em>, hợp đồng sẽ được đóng dấu số Admin SmartCA và gửi thẳng sang cổng Portal của Cơ sở y tế ở trạng thái <code>DRAFT</code> để đại diện CSYT thẩm định và ký số hoàn tất.
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateB2BModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingDraft}
                    className="px-5 py-2 bg-[#0052cc] hover:bg-[#003da6] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {isCreatingDraft ? (
                      <span>Đang tạo dự thảo...</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">draw</span>
                        <span>Tạo Dự Thảo &amp; Ký Số Platform</span>
                      </>
                    )}
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
