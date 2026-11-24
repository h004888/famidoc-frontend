'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, Calendar, Stethoscope, User, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EncounterItem, encountersApi } from '@/lib/api/encounters.api';
import { patientsApi } from '@/lib/api/patients.api';
import {
  TelehealthChatPanel,
  TelehealthVideoStage,
  useLivekitTelehealthRoom,
} from '@/features/telehealth-shared';

export function FamilyTelemedicineView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const encounterIdParam = searchParams.get('encounterId');

  const [encounter, setEncounter] = useState<EncounterItem | null>(null);
  const [vitals, setVitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        let selected: EncounterItem | null = null;
        const res = await encountersApi.getFamilyTimetable({
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

        if (cancelled) return;
        setEncounter(selected);

        const patientId = selected?.patientId ?? selected?.patient?.id;
        if (patientId) {
          const vitalRes = await patientsApi.getMemberVitalSigns(patientId, 30).catch(() => []);
          if (!cancelled) {
            setVitals(Array.isArray(vitalRes) ? vitalRes : []);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Không thể tải thông tin buổi khám.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [encounterIdParam, reloadNonce]);

  const activeEncounterId = encounter?.id ?? null;
  const isJoinable =
    encounter?.encounterType === 'TELEHEALTH' &&
    (encounter?.encounterStatus === 'CONFIRMED' || encounter?.encounterStatus === 'IN_PROGRESS');

  const roomState = useLivekitTelehealthRoom({
    encounterId: activeEncounterId,
    enabled: Boolean(activeEncounterId && isJoinable && hasJoined),
  });

  const primaryPatientId = encounter?.patientId ?? encounter?.patient?.id;
  const doctorName =
    encounter?.doctor?.doctorName ?? encounter?.doctor?.user?.name ?? 'Bác sĩ phụ trách';
  const latestVital = useMemo(() => vitals[0] ?? null, [vitals]);

  const handleEndCall = async () => {
    setHasJoined(false);
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Đang tải phòng khám trực tuyến...</div>
    );
  }

  if (loadError) {
    return (
      <Card className="mx-auto mt-8 max-w-lg border-rose-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-rose-700">
            <VideoOff className="h-5 w-5" />
            Không thể tải phòng khám trực tuyến
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p role="alert">{loadError}</p>
          <Button type="button" variant="outline" onClick={() => setReloadNonce((n) => n + 1)}>
            Thử tải lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!encounter) {
    return (
      <Card className="mx-auto mt-8 max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <VideoOff className="h-5 w-5 text-muted-foreground" />
            Chưa có buổi khám Telehealth khả dụng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Hiện tại gia đình chưa có buổi khám trực tuyến nào đang diễn ra hoặc đã xác nhận.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/family/appointments">
                <Calendar className="mr-2 h-4 w-4" />
                Đặt lịch tư vấn Video
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 p-4 lg:grid-cols-12 lg:p-6">
      <div className="space-y-4 lg:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Phòng Khám Telehealth</h1>
            <p className="text-xs text-muted-foreground">
              Mã buổi khám: {encounter.id} • {encounter.scheduledDate} {encounter.scheduledTime}
            </p>
          </div>
          {primaryPatientId && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/family/members/${primaryPatientId}`}>
                <User className="mr-1.5 h-4 w-4" />
                Hồ sơ thành viên
              </Link>
            </Button>
          )}
        </div>

        {!hasJoined ? (
          <Card className="p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold">Phòng chờ Tư vấn Video (Pre-Join)</h2>
              <p className="text-xs text-muted-foreground">
                Bác sĩ: {doctorName} · Kiểm tra Micro &amp; Camera trước khi tham gia. Nếu bạn
                rời phòng giữa chừng, phòng vẫn mở để quay lại.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => setHasJoined(true)}>
                Tham gia phòng ngay
              </Button>
              <Button asChild variant="outline">
                <Link href="/family/appointments">Quay lại Lịch hẹn</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <TelehealthVideoStage
            roomState={roomState}
            remoteLabel={doctorName}
            endCallLabel="Rời phòng"
            onEndCall={() => void handleEndCall()}
          />
        )}
      </div>

      <div className="lg:col-span-4">
        <Tabs defaultValue="chat" className="flex h-[620px] flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat">Chat y tế</TabsTrigger>
            <TabsTrigger value="vitals">Sinh hiệu</TabsTrigger>
            <TabsTrigger value="doctor">Bác sĩ</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-3 flex-1 overflow-hidden">
            <TelehealthChatPanel
              encounterId={encounter.id}
              currentRole="FAMILY_REP"
              messages={roomState.messages}
              isFallbackChat={roomState.isFallbackChat}
              onSendMessage={roomState.sendMessage}
              onUploadAttachment={roomState.uploadAttachment}
            />
          </TabsContent>

          <TabsContent value="vitals" className="mt-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-primary" />
                  Chỉ số sinh hiệu gần nhất
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {latestVital ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Huyết áp:</span>
                      <span className="font-medium tabular-nums">
                        {latestVital.systolicBp ?? '--'}/{latestVital.diastolicBp ?? '--'} mmHg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nhịp tim:</span>
                      <span className="font-medium tabular-nums">{latestVital.heartRate ?? '--'} bpm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SpO2:</span>
                      <span className="font-medium tabular-nums">{latestVital.spo2 ?? '--'} %</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nhiệt độ:</span>
                      <span className="font-medium">{latestVital.temperature ?? '--'} °C</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Chưa có dữ liệu sinh hiệu nào được ghi nhận cho thành viên này.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="doctor" className="mt-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  Thông tin bác sĩ phụ trách
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Họ tên:</span>
                  <span className="font-medium">{doctorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chuyên khoa:</span>
                  <span className="font-medium">Bác sĩ gia đình</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cơ sở y tế:</span>
                  <span className="font-medium">
                    {encounter.doctor?.facility?.facilityName ?? 'Hệ thống FamiDoc'}
                  </span>
                </div>
                {primaryPatientId && (
                  <div className="pt-2">
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/family/members/${primaryPatientId}`}>
                        Xem hồ sơ bệnh nhân
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
