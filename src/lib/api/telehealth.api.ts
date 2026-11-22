import { unwrapApiEnvelope } from './envelope';
import { httpClient } from './http-client';

export type EncounterStatus =
  | 'PROPOSED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'RESCHEDULE_REQUESTED'
  | 'CANCELLED';

export type EncounterCategory = 'PERIODIC' | 'AD_HOC';

export interface TelehealthEncounterItem {
  id: string;
  contractId: string;
  patientId: string;
  doctorId: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  encounterType: 'TELEHEALTH' | 'HOME_VISIT';
  category: EncounterCategory;
  encounterStatus: EncounterStatus;
  telehealthRoomUrl?: string | null;
  chiefComplaint?: string | null;
  clinicalNotes?: string | null;
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    spO2?: number;
  } | null;
  rescheduledFromDate?: string | null;
  rescheduledFromTime?: string | null;
  rescheduleReason?: string | null;
  contract?: {
    contractNumber?: string;
    familyUnit?: {
      representativeUser?: {
        fullName?: string;
        phone?: string;
        email?: string;
      };
      homeAddress?: string;
    };
    servicePackage?: {
      name?: string;
      code?: string;
    };
    facility?: {
      facilityName?: string;
    };
  };
  patient?: {
    id: string;
    fullName: string;
    dateOfBirth?: string;
    gender?: string;
    relationship?: string;
  };
  doctor?: {
    id: string;
    licenseNumber?: string;
    specialty?: string;
    user?: {
      fullName?: string;
      phone?: string;
      avatarUrl?: string;
    };
    facility?: {
      facilityName?: string;
    };
  };
  createdAt?: string;
}

export interface TelehealthListResponse {
  data: TelehealthEncounterItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export const MOCK_TELEHEALTH_ENCOUNTERS: TelehealthEncounterItem[] = [
  {
    id: 'ENC-TLH-2026-001',
    contractId: 'CTR-4P-2026-88219',
    patientId: 'PAT-001',
    doctorId: 'DOC-001',
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: '15:30',
    durationMinutes: 45,
    encounterType: 'TELEHEALTH',
    category: 'PERIODIC',
    encounterStatus: 'IN_PROGRESS',
    telehealthRoomUrl: 'https://meet.famidoc.online/room/preclinic-telehealth-001',
    chiefComplaint: 'Tái khám huyết áp và điều chỉnh liều thuốc tiểu đường tháng thứ 3.',
    clinicalNotes: 'Bệnh nhân tỉnh táo, tiếp xúc tốt. Huyết áp đo tại nhà ổn định ở mức 130/80 mmHg. Đang theo dõi đường huyết sau ăn.',
    vitalSigns: {
      bloodPressure: '130/80 mmHg',
      heartRate: 76,
      temperature: 36.8,
      spO2: 98,
    },
    contract: {
      contractNumber: 'CTR-4P-2026-88219',
      familyUnit: {
        representativeUser: {
          fullName: 'Trần Thị Mai',
          phone: '0912345678',
          email: 'mai.tran@famigroup.vn',
        },
        homeAddress: 'P.1204 Tòa Park 2, Times City, Hai Bà Trưng, Hà Nội',
      },
      servicePackage: {
        name: 'Gói Chăm Sóc Sức Khỏe Gia Đình Toàn Diện Diamond',
        code: 'PKG-DIAMOND-01',
      },
      facility: {
        facilityName: 'Bệnh viện Đa khoa Quốc tế Bạch Mai',
      },
    },
    patient: {
      id: 'PAT-001',
      fullName: 'Trần Văn Hùng (Bố đẻ)',
      dateOfBirth: '1948-06-12',
      gender: 'MALE',
      relationship: 'Bố đẻ',
    },
    doctor: {
      id: 'DOC-001',
      licenseNumber: 'CCHN-001289/BYT',
      specialty: 'Y học Gia đình & Nội Lão khoa',
      user: {
        fullName: 'BS.CKII Nguyễn Hoàng Long',
        phone: '0908776655',
      },
      facility: {
        facilityName: 'Bệnh viện Đa khoa Quốc tế Bạch Mai',
      },
    },
  },
  {
    id: 'ENC-TLH-2026-002',
    contractId: 'CTR-4P-2026-90412',
    patientId: 'PAT-002',
    doctorId: 'DOC-002',
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: '16:15',
    durationMinutes: 30,
    encounterType: 'TELEHEALTH',
    category: 'AD_HOC',
    encounterStatus: 'CONFIRMED',
    telehealthRoomUrl: 'https://meet.famidoc.online/room/preclinic-telehealth-002',
    chiefComplaint: 'Bé 5 tuổi sốt nhẹ 38 độ C kèm sổ mũi trong 2 ngày nay, mẹ lo lắng muốn tư vấn xử trí tại nhà.',
    contract: {
      contractNumber: 'CTR-4P-2026-90412',
      familyUnit: {
        representativeUser: {
          fullName: 'Nguyễn Hoàng Anh',
          phone: '0988776655',
          email: 'hoanganh.ng@gmail.com',
        },
        homeAddress: 'Số 45 Ngõ 12 Đặng Thai Mai, Tây Hồ, Hà Nội',
      },
      servicePackage: {
        name: 'Gói Chăm Sóc Nhi Khoa & Gia Đình Tiêu Chuẩn',
        code: 'PKG-PEDIATRIC-02',
      },
      facility: {
        facilityName: 'Phòng khám Đa khoa Quốc tế Hồng Ngọc',
      },
    },
    patient: {
      id: 'PAT-002',
      fullName: 'Nguyễn Gia Bảo (Con trai)',
      dateOfBirth: '2021-04-10',
      gender: 'MALE',
      relationship: 'Con trai',
    },
    doctor: {
      id: 'DOC-002',
      licenseNumber: 'CCHN-004512/SYT-HN',
      specialty: 'Nhi khoa Tổng quát',
      user: {
        fullName: 'ThS.BS Lê Hồng Nhung',
        phone: '0934567890',
      },
      facility: {
        facilityName: 'Phòng khám Đa khoa Quốc tế Hồng Ngọc',
      },
    },
  },
  {
    id: 'ENC-TLH-2026-003',
    contractId: 'CTR-4P-2026-77810',
    patientId: 'PAT-003',
    doctorId: 'DOC-003',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    scheduledTime: '09:00',
    durationMinutes: 45,
    encounterType: 'TELEHEALTH',
    category: 'PERIODIC',
    encounterStatus: 'RESCHEDULE_REQUESTED',
    telehealthRoomUrl: 'https://meet.famidoc.online/room/preclinic-telehealth-003',
    chiefComplaint: 'Tư vấn chế độ dinh dưỡng và kết quả xét nghiệm sinh hóa máu định kỳ quý 4.',
    rescheduledFromDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    rescheduledFromTime: '08:00',
    rescheduleReason: 'Gia đình có lịch họp đột xuất vào 8h00 sáng, xin chuyển sang khung giờ 9h00 cùng ngày.',
    contract: {
      contractNumber: 'CTR-4P-2026-77810',
      familyUnit: {
        representativeUser: {
          fullName: 'Phạm Đức Minh',
          phone: '0977665544',
          email: 'ducminh.pham@vinacap.vn',
        },
        homeAddress: 'Biệt thự BT3-08 Ngoại Giao Đoàn, Bắc Từ Liêm, Hà Nội',
      },
      servicePackage: {
        name: 'Gói Chăm Sóc Sức Khỏe Gia Đình VIP Gold',
        code: 'PKG-VIP-GOLD',
      },
      facility: {
        facilityName: 'Bệnh viện Đa khoa Tâm Anh Hà Nội',
      },
    },
    patient: {
      id: 'PAT-003',
      fullName: 'Vũ Thị Hòa (Vợ)',
      dateOfBirth: '1985-09-20',
      gender: 'FEMALE',
      relationship: 'Vợ',
    },
    doctor: {
      id: 'DOC-003',
      licenseNumber: 'CCHN-009988/BYT',
      specialty: 'Dinh dưỡng Lâm sàng & Y học Dự phòng',
      user: {
        fullName: 'BS.CKI Vũ Quốc Tuấn',
        phone: '0912998877',
      },
      facility: {
        facilityName: 'Bệnh viện Đa khoa Tâm Anh Hà Nội',
      },
    },
  },
  {
    id: 'ENC-TLH-2026-004',
    contractId: 'CTR-4P-2026-66321',
    patientId: 'PAT-004',
    doctorId: 'DOC-001',
    scheduledDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    scheduledTime: '14:00',
    durationMinutes: 45,
    encounterType: 'TELEHEALTH',
    category: 'PERIODIC',
    encounterStatus: 'COMPLETED',
    telehealthRoomUrl: 'https://meet.famidoc.online/room/preclinic-telehealth-004',
    chiefComplaint: 'Khám kiểm tra hậu Covid-19 và tình trạng khó ngủ kéo dài.',
    clinicalNotes: 'Bệnh nhân có triệu chứng mất ngủ nhẹ do căng thẳng công việc. Tim phổi bình thường. Đã hướng dẫn vệ sinh giấc ngủ và kê đơn hỗ trợ thảo dược nhẹ.',
    vitalSigns: {
      bloodPressure: '120/75 mmHg',
      heartRate: 72,
      temperature: 36.6,
      spO2: 99,
    },
    contract: {
      contractNumber: 'CTR-4P-2026-66321',
      familyUnit: {
        representativeUser: {
          fullName: 'Đặng Thanh Thủy',
          phone: '0966554433',
          email: 'thuy.dang@gmail.com',
        },
        homeAddress: 'Căn hộ 1805 R4 Royal City, Thanh Xuân, Hà Nội',
      },
      servicePackage: {
        name: 'Gói Chăm Sóc Sức Khỏe Gia Đình Toàn Diện',
        code: 'PKG-FAMILY-01',
      },
      facility: {
        facilityName: 'Bệnh viện Đa khoa Quốc tế Bạch Mai',
      },
    },
    patient: {
      id: 'PAT-004',
      fullName: 'Đặng Thanh Thủy',
      dateOfBirth: '1990-11-05',
      gender: 'FEMALE',
      relationship: 'Chủ hộ',
    },
    doctor: {
      id: 'DOC-001',
      licenseNumber: 'CCHN-001289/BYT',
      specialty: 'Y học Gia đình & Nội Lão khoa',
      user: {
        fullName: 'BS.CKII Nguyễn Hoàng Long',
        phone: '0908776655',
      },
      facility: {
        facilityName: 'Bệnh viện Đa khoa Quốc tế Bạch Mai',
      },
    },
  },
  {
    id: 'ENC-TLH-2026-005',
    contractId: 'CTR-4P-2026-55219',
    patientId: 'PAT-005',
    doctorId: 'DOC-002',
    scheduledDate: new Date(Date.now() - 172800000).toISOString().slice(0, 10),
    scheduledTime: '10:30',
    durationMinutes: 30,
    encounterType: 'TELEHEALTH',
    category: 'AD_HOC',
    encounterStatus: 'CANCELLED',
    telehealthRoomUrl: 'https://meet.famidoc.online/room/preclinic-telehealth-005',
    chiefComplaint: 'Bệnh nhân xin hủy do đã đến khám trực tiếp tại phòng khám chuyên khoa.',
    contract: {
      contractNumber: 'CTR-4P-2026-55219',
      familyUnit: {
        representativeUser: {
          fullName: 'Lê Quang Huy',
          phone: '0903332211',
          email: 'quanghuy.le@yahoo.com',
        },
        homeAddress: 'Số 88 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội',
      },
      servicePackage: {
        name: 'Gói Chăm Sóc Nhi Khoa & Gia Đình Tiêu Chuẩn',
        code: 'PKG-PEDIATRIC-02',
      },
      facility: {
        facilityName: 'Phòng khám Đa khoa Quốc tế Hồng Ngọc',
      },
    },
    patient: {
      id: 'PAT-005',
      fullName: 'Lê Minh Khôi (Con trai)',
      dateOfBirth: '2019-08-15',
      gender: 'MALE',
      relationship: 'Con trai',
    },
    doctor: {
      id: 'DOC-002',
      licenseNumber: 'CCHN-004512/SYT-HN',
      specialty: 'Nhi khoa Tổng quát',
      user: {
        fullName: 'ThS.BS Lê Hồng Nhung',
        phone: '0934567890',
      },
      facility: {
        facilityName: 'Phòng khám Đa khoa Quốc tế Hồng Ngọc',
      },
    },
  },
];

export const telehealthApi = {
  getEncounters: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    category?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<TelehealthListResponse> => {
    try {
      const response = await httpClient.get<any>(
        '/api/v1/encounters/timetable/family',
        {
          encounterType: 'TELEHEALTH',
          page: params?.page ?? 1,
          pageSize: params?.pageSize ?? 20,
          status: params?.status && params.status !== 'ALL' ? params.status : undefined,
          category: params?.category && params.category !== 'ALL' ? params.category : undefined,
          fromDate: params?.fromDate,
          toDate: params?.toDate,
        },
        { cache: 'no-store' }
      );

      const unwrapped = unwrapApiEnvelope<any>(response);

      // Handle backend pagination structure
      if (unwrapped && Array.isArray(unwrapped.data)) {
        if (unwrapped.data.length > 0) {
          return {
            data: unwrapped.data,
            pagination: unwrapped.pagination ?? {
              page: params?.page ?? 1,
              pageSize: params?.pageSize ?? 20,
              totalItems: unwrapped.data.length,
              totalPages: 1,
            },
          };
        }
      }
    } catch (err) {
      // In development or when backend has empty DB, fallback to high-fidelity mock
      console.warn('Telehealth API call failed or returned empty; using fallback clinical dataset.', err);
    }

    // High fidelity fallback filter
    let list = [...MOCK_TELEHEALTH_ENCOUNTERS];
    if (params?.status && params.status !== 'ALL') {
      list = list.filter((item) => item.encounterStatus === params.status);
    }
    if (params?.category && params.category !== 'ALL') {
      list = list.filter((item) => item.category === params.category);
    }

    return {
      data: list,
      pagination: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        totalItems: list.length,
        totalPages: 1,
      },
    };
  },

  getEncounterDetail: async (id: string): Promise<TelehealthEncounterItem> => {
    try {
      const res = await httpClient.get<any>(`/api/v1/encounters/${id}`);
      return unwrapApiEnvelope<TelehealthEncounterItem>(res);
    } catch {
      const found = MOCK_TELEHEALTH_ENCOUNTERS.find((e) => e.id === id);
      if (found) return found;
      throw new Error('Không tìm thấy thông tin ca khám');
    }
  },

  issueSessionToken: async (encounterId: string): Promise<TelehealthTokenResponse> => {
    const res = await httpClient.post<any>(`/api/v1/telehealth/sessions/${encounterId}/token`, {});
    return unwrapApiEnvelope<TelehealthTokenResponse>(res);
  },

  reportTelemetry: async (
    encounterId: string,
    payload: { networkQualityScore?: NetworkQualityScore; isFallbackChat?: boolean },
  ): Promise<TelehealthSessionDto> => {
    const res = await httpClient.post<any>(
      `/api/v1/telehealth/sessions/${encounterId}/telemetry`,
      payload,
    );
    return unwrapApiEnvelope<TelehealthSessionDto>(res);
  },

  endSession: async (encounterId: string): Promise<TelehealthSessionDto> => {
    const res = await httpClient.post<any>(`/api/v1/telehealth/sessions/${encounterId}/end`, {});
    return unwrapApiEnvelope<TelehealthSessionDto>(res);
  },

  listMessages: async (encounterId: string, after?: string): Promise<TelehealthMessageDto[]> => {
    const query = after ? `?after=${encodeURIComponent(after)}` : '';
    const res = await httpClient.get<any>(`/api/v1/telehealth/sessions/${encounterId}/messages${query}`);
    return unwrapApiEnvelope<TelehealthMessageDto[]>(res);
  },

  sendMessage: async (encounterId: string, content: string): Promise<TelehealthMessageDto> => {
    const res = await httpClient.post<any>(`/api/v1/telehealth/sessions/${encounterId}/messages`, {
      content,
    });
    return unwrapApiEnvelope<TelehealthMessageDto>(res);
  },

  uploadAttachment: async (
    encounterId: string,
    file: File,
    caption?: string,
  ): Promise<TelehealthMessageDto> => {
    const formData = new FormData();
    formData.append('file', file);
    if (caption?.trim()) {
      formData.append('caption', caption.trim());
    }
    const res = await httpClient.post<any>(
      `/api/v1/telehealth/sessions/${encounterId}/messages/attachment`,
      formData,
    );
    return unwrapApiEnvelope<TelehealthMessageDto>(res);
  },

  fetchAttachmentBlob: async (encounterId: string, messageId: string): Promise<Blob> => {
    const res = await httpClient.get<Blob>(
      `/api/v1/telehealth/sessions/${encounterId}/messages/${messageId}/attachment`,
      { responseType: 'blob' } as any,
    );
    return res as unknown as Blob;
  },
};

export type NetworkQualityScore = 'EXCELLENT' | 'GOOD' | 'POOR' | 'LOST';

export interface TelehealthSessionDto {
  id: string;
  encounterId: string;
  roomSid: string;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number;
  networkQualityScore: NetworkQualityScore | null;
  isFallbackChat: boolean;
}

export interface TelehealthTokenResponse {
  token: string;
  url: string;
  roomName: string;
  participantIdentity: string;
  session: TelehealthSessionDto;
}

export interface TelehealthMessageDto {
  id: string;
  sessionId: string;
  senderUserId: string;
  senderRole: 'FAMILY_REP' | 'DOCTOR' | string;
  senderName: string;
  content: string | null;
  attachmentKey: string | null;
  attachmentName: string | null;
  attachmentMimeType: string | null;
  attachmentSizeBytes: number | null;
  createdAt: string;
}
