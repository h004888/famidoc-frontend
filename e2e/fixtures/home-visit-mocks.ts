import type { Page } from '@playwright/test';
import { COOKIE_KEYS, DEFAULT_USERS } from '../../src/lib/auth-storage';
import type { LoginRole } from '../../src/features/auth/schemas/auth.schema';

export interface MockHomeVisitState {
  encounter: any;
  notifications: any[];
  draftSaves: any[];
  confirmCalls: any[];
  completeCalls: any[];
  attendanceCalls: any[];
  confirmArrivalCalls: number;
  markReadCalls: string[];
}

export async function seedAuthSession(page: Page, role: LoginRole) {
  const user = DEFAULT_USERS[role];
  const token = 'e2e-mock-access-token';
  const serializedUser = JSON.stringify(user);

  await page.context().addCookies([
    { name: COOKIE_KEYS.ROLE, value: role, domain: '127.0.0.1', path: '/' },
    { name: COOKIE_KEYS.TOKEN, value: token, domain: '127.0.0.1', path: '/' },
    {
      name: COOKIE_KEYS.USER,
      value: encodeURIComponent(serializedUser),
      domain: '127.0.0.1',
      path: '/',
    },
  ]);

  await page.addInitScript(
    ({ keys, roleValue, tokenValue, userJson }) => {
      window.localStorage.setItem(keys.ROLE, roleValue);
      window.localStorage.setItem(keys.TOKEN, tokenValue);
      window.localStorage.setItem(keys.USER, userJson);
    },
    {
      keys: COOKIE_KEYS,
      roleValue: role,
      tokenValue: token,
      userJson: serializedUser,
    },
  );
}

export function createBaseHomeVisitEncounter(overrides: Record<string, any> = {}) {
  const todayIso = new Date().toISOString().slice(0, 10);
  return {
    id: 'enc-e2e-1',
    contractId: 'con-e2e-1',
    doctorId: 'doc-1',
    encounterType: 'HOME_VISIT',
    category: 'PERIODIC_ROUTINE',
    visitScope: 'FAMILY',
    scheduledDate: todayIso,
    scheduledTime: '08:30:00',
    slotWindow: 'MORNING',
    encounterStatus: 'CONFIRMED',
    familyConfirmedArrivalAt: `${todayIso}T01:35:00.000Z`,
    doctorCompletedAt: null,
    recordOverdueAt: null,
    lateCompletionReason: null,
    participants: [
      {
        id: 'part-1',
        patientId: 'pat-1',
        attendanceStatus: 'PLANNED',
        absenceReason: null,
        patient: {
          id: 'pat-1',
          fullName: 'Nguyễn Văn An',
          allergies: ['Penicillin'],
          chronicDiseases: ['Tăng huyết áp'],
        },
      },
      {
        id: 'part-2',
        patientId: 'pat-2',
        attendanceStatus: 'PLANNED',
        absenceReason: null,
        patient: {
          id: 'pat-2',
          fullName: 'Trần Thị Bình',
          allergies: [],
          chronicDiseases: [],
        },
      },
    ],
    clinicalEmrs: [],
    contract: {
      id: 'con-e2e-1',
      contractNumber: 'HD-2026-001',
      familyRepresentativeName: 'Nguyễn Văn An',
      familyRepresentativePhone: '0912345678',
      familyUnit: {
        id: 'fam-1',
        familyName: 'Gia đình Nguyễn Văn An',
        homeAddress: '123 Nguyễn Trãi, Q.5, TP.HCM',
        representativeUser: {
          id: 'FAM-88219',
          fullName: 'Nguyễn Văn An',
          phone: '0912345678',
        },
      },
      members: [
        {
          id: 'cm-1',
          patientId: 'pat-1',
          patient: {
            id: 'pat-1',
            fullName: 'Nguyễn Văn An',
            allergies: ['Penicillin'],
            chronicDiseases: ['Tăng huyết áp'],
          },
        },
        {
          id: 'cm-2',
          patientId: 'pat-2',
          patient: {
            id: 'pat-2',
            fullName: 'Trần Thị Bình',
            allergies: [],
            chronicDiseases: [],
          },
        },
      ],
    },
    doctor: {
      id: 'doc-1',
      doctorName: 'BS.CKII Trần Thanh Mai',
      user: { name: 'BS.CKII Trần Thanh Mai', phone: '0988123789' },
      facility: { id: 'fac-1', facilityName: 'BV Đại Học Y Dược TP.HCM' },
    },
    ...overrides,
  };
}

export async function setupHomeVisitMocks(
  page: Page,
  initialEncounter = createBaseHomeVisitEncounter(),
  initialNotifications: any[] = [
    {
      id: 'notif-doc-1',
      title: 'Gia đình đã xác nhận bác sĩ có mặt',
      content: 'Gia đình Nguyễn Văn An đã xác nhận 1 chạm.',
      type: 'ENCOUNTER_ARRIVAL_CONFIRMED',
      referenceId: initialEncounter.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  ],
): Promise<MockHomeVisitState> {
  const state: MockHomeVisitState = {
    encounter: structuredClone(initialEncounter),
    notifications: structuredClone(initialNotifications),
    draftSaves: [],
    confirmCalls: [],
    completeCalls: [],
    attendanceCalls: [],
    confirmArrivalCalls: 0,
    markReadCalls: [],
  };

  await page.route('**/api/v1/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const pathname = url.pathname;
    const method = req.method();

    const fulfillJson = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data }),
      });

    if (pathname === '/api/v1/doctors/me') {
      return fulfillJson({
        id: 'doc-1',
        doctorName: 'BS.CKII Trần Thanh Mai',
        onboardingStatus: 'ACTIVE',
      });
    }

    if (pathname === '/api/v1/notifications' && method === 'GET') {
      const unreadCount = state.notifications.filter((n) => !n.isRead).length;
      return fulfillJson({
        items: state.notifications,
        total: state.notifications.length,
        unreadCount,
      });
    }

    if (pathname.startsWith('/api/v1/notifications/') && pathname.endsWith('/read')) {
      const id = pathname.split('/')[4];
      state.markReadCalls.push(id);
      state.notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      );
      return fulfillJson({ id, isRead: true });
    }

    if (pathname === '/api/v1/encounters/doctor/timetable') {
      return fulfillJson({
        data: [state.encounter],
        pagination: { page: 1, pageSize: 50, totalItems: 1, totalPages: 1 },
      });
    }

    if (pathname === '/api/v1/encounters/family/timetable') {
      return fulfillJson({
        data: [state.encounter],
        pagination: { page: 1, pageSize: 50, totalItems: 1, totalPages: 1 },
      });
    }

    if (pathname === '/api/v1/encounters/facility/schedule-board') {
      return fulfillJson({
        encounters: [state.encounter],
        pendingRescheduleRequests: [],
      });
    }

    if (pathname === '/api/v1/encounters/reschedule-requests/pending') {
      return fulfillJson([]);
    }

    if (pathname === `/api/v1/encounters/${state.encounter.id}` && method === 'GET') {
      return fulfillJson(state.encounter);
    }

    if (
      pathname.startsWith(`/api/v1/encounters/${state.encounter.id}/participants/`) &&
      pathname.endsWith('/attendance') &&
      method === 'PATCH'
    ) {
      const patientId = pathname.split('/')[5];
      const body = req.postDataJSON() as {
        attendanceStatus: 'PLANNED' | 'ABSENT';
        absenceReason?: string;
      };
      if (!['PLANNED', 'ABSENT'].includes(body.attendanceStatus)) {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Trạng thái tham gia phải là PLANNED hoặc ABSENT.' }),
        });
      }
      if (body.attendanceStatus === 'ABSENT' && (!body.absenceReason || body.absenceReason.trim().length < 3)) {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Vui lòng nhập lý do vắng (3–255 ký tự).' }),
        });
      }
      const absenceReason = body.attendanceStatus === 'ABSENT' ? body.absenceReason!.trim() : null;
      state.attendanceCalls.push({ patientId, ...body });
      state.encounter.participants = state.encounter.participants.map((p: any) =>
        p.patientId === patientId
          ? { ...p, attendanceStatus: body.attendanceStatus, absenceReason }
          : p,
      );
      return fulfillJson({
        encounterId: state.encounter.id,
        patientId,
        attendanceStatus: body.attendanceStatus,
        absenceReason,
      });
    }

    if (pathname === `/api/v1/encounters/${state.encounter.id}/confirm-arrival` && method === 'PATCH') {
      state.confirmArrivalCalls += 1;
      const nowIso = new Date().toISOString();
      state.encounter.familyConfirmedArrivalAt = nowIso;
      state.encounter.encounterStatus = state.encounter.doctorCompletedAt
        ? 'COMPLETED'
        : 'PENDING_RECORD';
      return fulfillJson(state.encounter);
    }

    if (pathname === `/api/v1/encounters/${state.encounter.id}/complete` && method === 'PATCH') {
      const body = (req.postDataJSON() ?? {}) as { lateCompletionReason?: string };
      state.completeCalls.push(body);
      state.encounter.doctorCompletedAt = new Date().toISOString();
      state.encounter.lateCompletionReason = body.lateCompletionReason ?? null;
      state.encounter.encounterStatus = state.encounter.familyConfirmedArrivalAt
        ? 'COMPLETED'
        : 'CONFIRMED';
      return fulfillJson(state.encounter);
    }

    if (pathname === `/api/v1/medical-books/visits/${state.encounter.id}` && method === 'GET') {
      const patientId = url.searchParams.get('patientId') ?? 'pat-1';
      const emr = state.encounter.clinicalEmrs.find((e: any) => e.patientId === patientId);
      if (!emr) {
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Chưa có hồ sơ' }),
        });
      }
      return fulfillJson({
        id: state.encounter.id,
        isFinalized: emr.isFinalized,
        exam: emr.exam ?? null,
      });
    }

    if (pathname === `/api/v1/medical-books/visits/${state.encounter.id}/draft` && method === 'PUT') {
      const body = req.postDataJSON() as { patientId: string; exam?: any };
      state.draftSaves.push(body);
      const existing = state.encounter.clinicalEmrs.find(
        (e: any) => e.patientId === body.patientId,
      );
      if (existing) {
        existing.exam = { ...existing.exam, ...body.exam };
      } else {
        state.encounter.clinicalEmrs.push({
          id: `emr-${body.patientId}`,
          patientId: body.patientId,
          isFinalized: false,
          exam: body.exam,
        });
      }
      return fulfillJson({
        encounterId: state.encounter.id,
        emrId: `emr-${body.patientId}`,
        isFinalized: false,
        savedAt: new Date().toISOString(),
      });
    }

    if (pathname === `/api/v1/medical-books/visits/${state.encounter.id}/confirm` && method === 'POST') {
      const body = req.postDataJSON() as { patientId: string; exam?: any };
      state.confirmCalls.push(body);
      const existing = state.encounter.clinicalEmrs.find(
        (e: any) => e.patientId === body.patientId,
      );
      if (existing) {
        existing.isFinalized = true;
        existing.exam = body.exam ?? existing.exam;
      } else {
        state.encounter.clinicalEmrs.push({
          id: `emr-${body.patientId}`,
          patientId: body.patientId,
          isFinalized: true,
          exam: body.exam,
        });
      }
      state.encounter.participants = state.encounter.participants.map((p: any) =>
        p.patientId === body.patientId ? { ...p, attendanceStatus: 'EXAMINED' } : p,
      );
      return fulfillJson({
        encounterId: state.encounter.id,
        finalizedAt: new Date().toISOString(),
      });
    }

    return fulfillJson({});
  });

  return state;
}
