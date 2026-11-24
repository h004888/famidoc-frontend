'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EncounterItem, encountersApi } from '@/lib/api/encounters.api';
import {
  TelehealthChatPanel,
  TelehealthVideoStage,
  useLivekitTelehealthRoom,
} from '@/features/telehealth-shared';

export function DoctorTelemedicineView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const encounterIdParam = searchParams.get('encounterId');

  const [encounter, setEncounter] = useState<EncounterItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        let selected: EncounterItem | null = null;
        const res = await encountersApi.getDoctorTimetable({
          encounterType: 'TELEHEALTH',
        });
        const list: EncounterItem[] = Array.isArray(res) ? res : ((res as any).data ?? (res as any).items ?? []);
        if (encounterIdParam) {
          selected = list.find((e) => e.id === encounterIdParam) ?? null;
        } else {
          selected =
            list.find((e) => e.encounterStatus === 'IN_PROGRESS') ??
            list.find((e) => e.encounterStatus === 'CONFIRMED') ??
            null;
        }
        if (!cancelled) setEncounter(selected);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Không thể tải thông tin ca khám.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [encounterIdParam]);

  const activeEncounterId = encounter?.id ?? null;
  const isJoinable =
    encounter?.encounterType === 'TELEHEALTH' &&
    (encounter?.encounterStatus === 'CONFIRMED' || encounter?.encounterStatus === 'IN_PROGRESS');

  const roomState = useLivekitTelehealthRoom({
    encounterId: activeEncounterId,
    enabled: Boolean(activeEncounterId && isJoinable && hasJoined),
  });

  const handleEndCall = async () => {
    setEndConfirmOpen(true);
  };

  const handleConfirmDefinitiveEnd = async () => {
    setEndConfirmOpen(false);
    await roomState.endCall().catch(() => null);
    router.push(`/doctor/encounters/${encounter?.id ?? ''}/wrap-up`);
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Đang tải phòng khám bác sĩ...</div>
    );
  }

  if (loadError || !encounter) {
    return (
      <Card className="mx-auto mt-8 max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <VideoOff className="h-5 w-5 text-muted-foreground" />
            Chưa có ca khám Telehealth khả dụng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>{loadError ?? 'Hiện không có ca khám trực tuyến nào đang chờ hoặc đang diễn ra.'}</p>
          <Button asChild>
            <Link href="/doctor/encounters">
              <Calendar className="mr-2 h-4 w-4" />
              Quay lại danh sách ca khám
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const patientName = encounter.patient?.fullName ?? 'Đại diện gia đình';

  return (
    <div className="grid grid-cols-1 gap-6 p-4 lg:grid-cols-12 lg:p-6">
      <div className="space-y-4 lg:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Phòng Khám Bác Sĩ (Telehealth)</h1>
            <p className="text-xs text-muted-foreground">
              Bệnh nhân: {patientName} • Mã ca: {encounter.id}
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => void handleEndCall()}>
            Kết Thúc Ca Khám
          </Button>
        </div>

        {!hasJoined ? (
          <Card className="p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold">Phòng chờ Bác sĩ (Pre-Join)</h2>
              <p className="text-xs text-muted-foreground">
                Bệnh nhân: {patientName} · Kiểm tra Micro &amp; Camera trước khi bắt đầu buổi tư vấn.
              </p>
            </div>
            <Button type="button" onClick={() => setHasJoined(true)}>
              Tham gia phòng ngay
            </Button>
          </Card>
        ) : (
          <TelehealthVideoStage
            roomState={roomState}
            remoteLabel={patientName}
            allowScreenShare
            endCallLabel="Kết Thúc Ca Khám"
            onEndCall={() => void handleEndCall()}
          />
        )}

        {endConfirmOpen && (
          <Card className="p-4 border-rose-200 bg-rose-50/70 space-y-3">
            <p className="text-xs font-bold text-slate-900">
              Bạn muốn xử lý phiên Video này như thế nào?
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEndConfirmOpen(false);
                  setHasJoined(false);
                }}
              >
                Tạm rời phòng (Giữ phòng mở)
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => void handleConfirmDefinitiveEnd()}
              >
                Kết thúc hẳn &amp; Ghi hồ sơ
              </Button>
            </div>
          </Card>
        )}
      </div>

      <div className="h-[620px] lg:col-span-4">
        <TelehealthChatPanel
          encounterId={encounter.id}
          currentRole="DOCTOR"
          messages={roomState.messages}
          isFallbackChat={roomState.isFallbackChat}
          onSendMessage={roomState.sendMessage}
          onUploadAttachment={roomState.uploadAttachment}
        />
      </div>
    </div>
  );
}
