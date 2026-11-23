'use client';

import Link from 'next/link';
import type { PatientAllergyDto } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import * as MP from '../utils/member-profile.util';

/* ═══════════════════════════════════════════════════
   Pathology + Allergies — combined smart card
   ═══════════════════════════════════════════════════ */

export function MemberPathologySidebar({ memberId, chronicDiseases, allergies }: {
  memberId: string;
  chronicDiseases: string;
  allergies: readonly PatientAllergyDto[];
}) {
  const severeNames = MP.severeAllergenNames(allergies);
  const hasSevereAllergy = severeNames.length > 0;

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/80 to-transparent">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-indigo-600" aria-hidden="true">medical_information</span>
            Bệnh lý &amp; Dị ứng
          </span>
          <Button asChild variant="ghost" size="sm" className="h-8 px-3 text-xs text-slate-500 hover:text-primary transition-colors">
            <Link href="#pathology-tab">Chỉnh sửa →</Link>
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5 pt-2">
        {/* Chronic conditions */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Bệnh nền mạn tính
          </span>
          {chronicDiseases ? (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-sm text-slate-800 leading-relaxed">{chronicDiseases}</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <span className="material-symbols-outlined text-[20px] text-slate-300 shrink-0" aria-hidden="true">not_listed_location</span>
              <p className="text-sm text-slate-500">Chưa ghi nhận bệnh nền mạn tính</p>
            </div>
          )}
        </div>

        <Separator className="bg-slate-100" />

        {/* Allergies */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Tiền sử dị ứng ({allergies.length})
          </span>
          {allergies.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <span className="material-symbols-outlined text-[20px] text-emerald-400 shrink-0" aria-hidden="true">check_circle</span>
              <p className="text-sm text-slate-500">Không ghi nhận dị ứng</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Severe allergy alert */}
              {hasSevereAllergy && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-3 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px] text-rose-600 shrink-0" aria-hidden="true">warning_amber</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-rose-700">Cảnh báo dị ứng nặng</p>
                    <p className="text-xs text-rose-600 mt-0.5">
                      Các tác nhân: <span className="font-semibold">{severeNames.join(', ')}</span>
                    </p>
                  </div>
                </div>
              )}
              {/* All allergy badges */}
              <div className="flex flex-wrap gap-2">
                {allergies.map(a => (
                  <Badge
                    key={a.id || a.allergenName}
                    variant="outline"
                    className={`text-sm font-medium ${MP.severityBadgeClass(a.severity)}`}
                  >
                    {a.allergenName}
                    {a.severity === 'LIFE_THREATENING_ANAPHYLAXIS' && <span className="ml-1 opacity-60">🔴</span>}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════
   Documents — modern compact card
   ═══════════════════════════════════════════════════ */

interface DocItem { id?: string; documentName: string; documentType: string; recordedDate?: string | null; fileSizeKb?: number }

function DocumentIcon({ type }: { type: string }) {
  const meta = MP.documentTypeMeta(type);
  const colorMap: Record<string, string> = {
    PRESCRIPTION: '#059669', LAB_RESULT: '#2563eb', IMAGING_XRAY_CT: '#7c3aed',
    DISCHARGE_SUMMARY: '#d97706', OTHER: '#64748b',
  };
  const bgColors: Record<string, string> = {
    PRESCRIPTION: 'bg-emerald-50', LAB_RESULT: 'bg-blue-50', IMAGING_XRAY_CT: 'bg-purple-50',
    DISCHARGE_SUMMARY: 'bg-amber-50', OTHER: 'bg-slate-50',
  };

  return (
    <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${bgColors[type] || bgColors.OTHER}`}>
      <span className="material-symbols-outlined text-[18px]" aria-hidden="true" style={{ color: colorMap[type] || '#64748b' }}>
        {meta.icon}
      </span>
    </div>
  );
}

export function MemberDocumentsSidebar({ memberId, documents }: {
  memberId: string;
  documents: readonly DocItem[];
}) {
  if (documents.length === 0) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/80 to-transparent">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-blue-600" aria-hidden="true">folder_open</span>
            Tài liệu &amp; Đơn thuốc
          </CardTitle>
        </CardHeader>
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <span className="material-symbols-outlined text-[40px] text-slate-200" aria-hidden="true">cloud_upload</span>
            <p className="text-base font-semibold text-slate-600">Chưa có tài liệu</p>
            <p className="text-sm text-slate-400 max-w-[240px]">
              Tải lên đơn thuốc, kết quả xét nghiệm hoặc giấy ra viện
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/80 to-transparent">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-blue-600" aria-hidden="true">folder_open</span>
            Tài liệu &amp; Đơn thuốc
            <Badge variant="secondary" className="text-xs font-semibold bg-slate-100 text-slate-600">
              {documents.length}
            </Badge>
          </span>
          <Button asChild variant="ghost" size="sm" className="h-8 px-3 text-xs text-slate-500 hover:text-primary transition-colors">
            <Link href={`/family/members/${memberId}?tab=documents`}>Xem tất cả →</Link>
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-0">
        {documents.slice(0, 4).map(doc => {
          const meta = MP.documentTypeMeta(doc.documentType);
          return (
            <Link
              key={doc.id || doc.documentName}
              href={`/family/members/${memberId}?doc=${encodeURIComponent(doc.id || '')}`}
              className="group flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
            >
              <DocumentIcon type={doc.documentType} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-primary transition-colors">
                  {doc.documentName}
                </p>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  {meta.label} • {MP.formatDateDisplay(doc.recordedDate)}{doc.fileSizeKb != null ? ` • ${MP.formatFileSize(doc.fileSizeKb)}` : ''}
                </p>
              </div>
              <span className="material-symbols-outlined text-[18px] text-slate-300 group-hover:text-primary transition-colors shrink-0" aria-hidden="true">
                open_in_new
              </span>
            </Link>
          );
        })}
        {documents.length > 4 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <Button asChild variant="ghost" size="sm" className="w-full text-sm text-slate-500 hover:text-primary">
              <Link href={`/family/members/${memberId}?tab=documents`}>
                Xem tất cả {documents.length} tài liệu →
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
