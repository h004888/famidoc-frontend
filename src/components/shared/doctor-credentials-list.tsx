'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { doctorsApi, extractErrorMessage, type DoctorCredentialDto } from '@/lib/api';

export const REQUIRED_CREDENTIAL_DEFS: Array<{
  type: DoctorCredentialDto['credentialType'];
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    type: 'PRACTICE_LICENSE_CCHN',
    label: '1. Chứng chỉ / Giấy phép hành nghề KBCB (CCHN/GPHN)',
    shortLabel: 'Chứng chỉ / Giấy phép hành nghề (CCHN/GPHN)',
    description: 'Chứng chỉ hoặc Giấy phép hành nghề KBCB hợp lệ do Bộ Y tế hoặc Sở Y tế cấp.',
  },
  {
    type: 'DEGREE',
    label: '2. Bằng tốt nghiệp / Bằng chuyên môn Y khoa',
    shortLabel: 'Bằng chuyên môn',
    description: 'Bằng Bác sĩ đa khoa, Thạc sĩ, Chuyên khoa I/II hoặc Tiến sĩ Y khoa.',
  },
  {
    type: 'FAMILY_MEDICINE_CERT',
    label: '3. Chứng chỉ / Chứng nhận Y học gia đình',
    shortLabel: 'Chứng chỉ Y học gia đình',
    description: 'Chứng chỉ định hướng/chuyên khoa hoặc đào tạo liên tục về Y học gia đình.',
  },
];

interface DoctorCredentialsListProps {
  doctorId: string;
  credentials?: DoctorCredentialDto[];
}

export function DoctorCredentialsList({ doctorId, credentials = [] }: DoctorCredentialsListProps) {
  const [openingId, setOpeningId] = useState<string | null>(null);

  const handleOpenFile = async (cred: DoctorCredentialDto) => {
    const targetKey = cred.id || cred.credentialType;
    setOpeningId(targetKey);
    try {
      if (cred.id) {
        const blobUrl = await doctorsApi.fetchCredentialFileBlobUrl(doctorId, cred.id);
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      } else if (cred.fileUrl && cred.fileUrl.startsWith('http')) {
        window.open(cred.fileUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Không tìm thấy tệp chứng chỉ hợp lệ để mở.');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Không thể tải tệp chứng chỉ từ máy chủ.'));
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="space-y-4">
      {REQUIRED_CREDENTIAL_DEFS.map((def) => {
        const cred = credentials.find((c) => c.credentialType === def.type);
        return (
          <div
            key={def.type}
            className={`rounded-xl border p-4 space-y-3 ${
              cred ? 'bg-white border-slate-200' : 'bg-amber-50/50 border-amber-200'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">{def.label}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{def.description}</p>
              </div>
              {cred ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] tabular-nums bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded font-semibold border border-blue-200">
                    {cred.certificateNumber}
                  </span>
                  {cred.platformApproved ? (
                    <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                      Admin đã duyệt
                    </span>
                  ) : cred.facilityVerified ? (
                    <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold border border-indigo-200">
                      CSYT đã xác thực
                    </span>
                  ) : null}
                </div>
              ) : (
                <span className="text-[11px] bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded font-semibold">
                  Chưa nộp
                </span>
              )}
            </div>

            {cred ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Số hiệu / Số quyết định</span>
                    <strong className="text-slate-900 tabular-nums">{cred.certificateNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Cơ quan cấp</span>
                    <strong className="text-slate-900">{cred.issuingAuthority}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Ngày cấp</span>
                    <strong className="text-slate-900 tabular-nums">
                      {cred.issueDate ? new Date(cred.issueDate).toLocaleDateString('vi-VN') : '—'}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-base text-rose-500 shrink-0">
                      picture_as_pdf
                    </span>
                    <span className="text-slate-700 font-medium truncate">
                      {cred.fileUrl ? cred.fileUrl.split('/').pop() : `${def.type}.pdf`}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={openingId === (cred.id || cred.credentialType)}
                    onClick={() => handleOpenFile(cred)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-primary font-semibold hover:bg-slate-100 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                    {openingId === (cred.id || cred.credentialType) ? 'Đang mở...' : 'Xem bản scan'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-800">Bác sĩ chưa tải lên loại chứng chỉ bắt buộc này.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
