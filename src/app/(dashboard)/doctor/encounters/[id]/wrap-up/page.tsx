'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { encountersApi, type EncounterItem } from '@/lib/api';

export default function DoctorEncounterWrapUpPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [encounter, setEncounter] = useState<EncounterItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [soapNote, setSoapNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await encountersApi.getEncounterDetail(id);
        if (!cancelled) {
          setEncounter(data);
          const initialIds = (data.participants ?? []).map((p) => p.patientId).filter(Boolean);
          if (initialIds.length === 1) {
            setSelectedPatientIds(initialIds);
          }
        }
      } catch {
        if (!cancelled) setEncounter(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const members =
    encounter?.participants && encounter.participants.length > 0
      ? encounter.participants.map((p) => ({
          id: p.patientId,
          fullName: p.patient?.fullName ?? 'Thành viên gia đình',
        }))
      : (encounter?.contract?.members ?? [])
          .filter((m) => m.patientId)
          .map((m) => ({
            id: m.patientId as string,
            fullName: m.patient?.fullName ?? 'Thành viên gia đình',
          }));

  const toggleMember = (patientId: string) => {
    setSelectedPatientIds((prev) =>
      prev.includes(patientId) ? prev.filter((p) => p !== patientId) : [...prev, patientId],
    );
  };

  const handleComplete = async () => {
    if (selectedPatientIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 thành viên thực tế đã được tư vấn.');
      return;
    }
    setSubmitting(true);
    try {
      await encountersApi.finalizeEncounter(id, {
        plan: soapNote.trim() || 'Tư vấn theo dõi tại nhà — Không kê đơn',
      });
      toast.success('Đã hoàn tất hồ sơ buổi Tư vấn Video.');
      router.push('/doctor/encounters');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể hoàn tất hồ sơ.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-xs text-slate-500">Đang tải thông tin buổi khám...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] py-6 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-2xl mx-auto p-6 space-y-5">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900">
            Hoàn tất buổi Tư vấn Video · Gán hồ sơ bệnh án
          </h1>
          <p className="text-xs text-slate-500">
            Mã buổi khám: {id} · Chọn đích danh thành viên thực tế đã được tư vấn để lưu Sổ khám.
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700">
            1. Thành viên thực tế được tư vấn (*Bắt buộc ≥ 1 người):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {members.map((m) => {
              const checked = selectedPatientIds.includes(m.id);
              return (
                <label
                  key={m.id}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-medium cursor-pointer ${
                    checked ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMember(m.id)}
                  />
                  <span>{m.fullName}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              2. Ghi nhận chuyên môn (SOAP) & Dặn dò:
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-[11px] h-7"
              onClick={() => setSoapNote('Tư vấn theo dõi tại nhà — Không kê đơn')}
            >
              Mẫu nhanh: Không kê đơn
            </Button>
          </div>
          <Textarea
            rows={4}
            value={soapNote}
            onChange={(e) => setSoapNote(e.target.value)}
            placeholder="Nhập đánh giá lâm sàng và hướng dẫn theo dõi cho thành viên đã chọn..."
            className="text-xs"
          />
        </div>

        <div className="flex flex-wrap justify-between gap-2 pt-2 border-t border-slate-100">
          <Button asChild variant="outline" size="sm">
            <Link href="/doctor/encounters">Lưu nháp (làm sau)</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={submitting || selectedPatientIds.length === 0}
            onClick={() => void handleComplete()}
          >
            {submitting ? 'Đang lưu...' : '✓ Hoàn tất & Lưu Sổ khám bệnh'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
