'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MOCK_EHR } from '@/features/family-members';

export interface MemberHealthData {
  id: string;
  name: string;
  relation: string;
  age: number;
  avatar: string;
  bhyt: string;
  bloodType: string;
  allergies: string;
  chronicCondition: string;
  status: 'good' | 'warning';
  statusText: string;
  bp: string;
  bpStatus: string;
  spo2: string;
  heartRate: string;
  glucose: string;
  glucoseStatus: string;
  lastUpdated: string;
  medicines: {
    id: string;
    name: string;
    dosage: string;
    time: string;
    status: 'taken' | 'pending';
  }[];
  upcomingVisit?: {
    doctor: string;
    specialty: string;
    hospital: string;
    time: string;
    date: string;
    mode: 'home' | 'telehealth';
    note: string;
  };
}

export const INITIAL_FAMILY_MEMBERS_DATA: Record<string, MemberHealthData> = {
  'mem-01': {
    id: 'mem-01',
    name: 'Nguyễn Văn Phúc',
    relation: 'Ông nội (Chủ hộ)',
    age: 78,
    avatar: '👨‍🦳',
    bhyt: 'HT2790129381102',
    bloodType: 'O+',
    allergies: 'Dị ứng Penicillin, Hải sản vỏ cứng',
    chronicCondition: 'Tăng huyết áp • Đái tháo đường Typ 2',
    status: 'warning',
    statusText: 'Huyết áp cần chú ý nhẹ',
    bp: '135/85',
    bpStatus: 'Hơi cao • Cần uống thuốc đều',
    spo2: '98%',
    heartRate: '76 lần/phút',
    glucose: '6.8 mmol/L',
    glucoseStatus: 'Ổn định sau ăn',
    lastUpdated: '07:30 Sáng hôm nay',
    medicines: [
      {
        id: 'med-1',
        name: 'Amlodipine 5mg (Hạ huyết áp)',
        dosage: '1 viên nén • Uống sau ăn sáng',
        time: '08:00 Sáng mỗi ngày',
        status: 'taken',
      },
      {
        id: 'med-2',
        name: 'Metformin 500mg (Đường huyết)',
        dosage: '1 viên • Uống ngay sau bữa tối',
        time: '19:00 Tối mỗi ngày',
        status: 'pending',
      },
    ],
    upcomingVisit: {
      doctor: 'PGS.TS Nguyễn Trọng Nghĩa',
      specialty: 'Bác sĩ Gia đình & Tim mạch',
      hospital: 'BV Đại học Y Dược TP.HCM',
      date: 'Thứ Hai, 27/10/2026',
      time: '09:30 Sáng',
      mode: 'home',
      note: 'Khám định kỳ tại nhà: đo điện tim ECG và lấy máu xét nghiệm đường huyết.',
    },
  },
  'mem-02': {
    id: 'mem-02',
    name: 'Trần Thị Mai',
    relation: 'Vợ (Mẹ)',
    age: 42,
    avatar: '👩',
    bhyt: 'GD4790883719204',
    bloodType: 'A+',
    allergies: 'Không có tiền sử dị ứng',
    chronicCondition: 'Theo dõi sức khỏe định kỳ',
    status: 'good',
    statusText: 'Sức khỏe rất tốt',
    bp: '115/75',
    bpStatus: 'Huyết áp lý tưởng',
    spo2: '99%',
    heartRate: '72 lần/phút',
    glucose: '5.2 mmol/L',
    glucoseStatus: 'Bình thường',
    lastUpdated: '07:00 Sáng hôm nay',
    medicines: [
      {
        id: 'med-3',
        name: 'Canxi & Vitamin D3 hữu cơ',
        dosage: '1 viên nang mềm • Uống cùng nhiều nước',
        time: '08:30 Sau bữa sáng',
        status: 'taken',
      },
    ],
    upcomingVisit: {
      doctor: 'ThS.BS Võ Thị Phương Thảo',
      specialty: 'Tư vấn Sản Phụ Khoa',
      hospital: 'BV Từ Dũ',
      date: 'Thứ Bảy, 08/11/2026',
      time: '14:00 Chiều',
      mode: 'telehealth',
      note: 'Tư vấn trực tuyến qua video Telehealth định kỳ 6 tháng.',
    },
  },
  'mem-03': {
    id: 'mem-03',
    name: 'Nguyễn Minh Quân',
    relation: 'Con trai',
    age: 12,
    avatar: '👦',
    bhyt: 'TE1792014992811',
    bloodType: 'O+',
    allergies: 'Viêm mũi dị ứng khi thời tiết lạnh',
    chronicCondition: 'Theo dõi hô hấp & dinh dưỡng trẻ em',
    status: 'good',
    statusText: 'Khỏe mạnh, năng động',
    bp: '105/65',
    bpStatus: 'Chuẩn lứa tuổi',
    spo2: '100%',
    heartRate: '82 lần/phút',
    glucose: '4.8 mmol/L',
    glucoseStatus: 'Bình thường',
    lastUpdated: '06:45 Sáng hôm nay',
    medicines: [
      {
        id: 'med-4',
        name: 'Xịt mũi thảo dược FamiCare',
        dosage: 'Xịt mỗi bên mũi 1 nhát',
        time: 'Buổi sáng & tối khi trời lạnh',
        status: 'taken',
      },
    ],
    upcomingVisit: {
      doctor: 'BS.CKII Trần Mai Phương',
      specialty: 'Chuyên gia Nhi & Dinh dưỡng',
      hospital: 'BV Nhi Đồng 1',
      date: 'Thứ Tư, 29/10/2026',
      time: '19:30 Tối',
      mode: 'telehealth',
      note: 'Tư vấn phác đồ dinh dưỡng và dị ứng hô hấp trẻ nhỏ.',
    },
  },
};

export interface DailyVitalRecord {
  id: string;
  memberId: string;
  date: string;
  time: string;
  period: 'morning' | 'noon' | 'evening';
  bpSystolic: number;
  bpDiastolic: number;
  heartRate: number;
  spo2: number;
  glucose: number;
  source: 'iot' | 'doctor' | 'manual';
  sourceLabel: string;
  note: string;
}

export const INITIAL_DAILY_VITALS: Record<string, DailyVitalRecord[]> = {
  'mem-02': [
    {
      id: 'vit-201',
      memberId: 'mem-02',
      date: '10/11/2026',
      time: '07:00',
      period: 'morning',
      bpSystolic: 115,
      bpDiastolic: 75,
      heartRate: 72,
      spo2: 99,
      glucose: 5.2,
      source: 'iot',
      sourceLabel: 'Máy đo Omron Bluetooth',
      note: 'Số đo sáng sớm trước ăn, huyết áp lý tưởng',
    },
    {
      id: 'vit-202',
      memberId: 'mem-02',
      date: '09/11/2026',
      time: '19:30',
      period: 'evening',
      bpSystolic: 118,
      bpDiastolic: 76,
      heartRate: 74,
      spo2: 99,
      glucose: 5.8,
      source: 'iot',
      sourceLabel: 'Máy đo Omron Bluetooth',
      note: 'Đo sau ăn tối 1 giờ, thể trạng rất tốt',
    },
    {
      id: 'vit-203',
      memberId: 'mem-02',
      date: '08/11/2026',
      time: '07:15',
      period: 'morning',
      bpSystolic: 114,
      bpDiastolic: 74,
      heartRate: 70,
      spo2: 99,
      glucose: 5.1,
      source: 'iot',
      sourceLabel: 'Máy đo Omron Bluetooth',
      note: 'Sau khi đi bộ thể dục sáng, chỉ số rất đều',
    },
    {
      id: 'vit-204',
      memberId: 'mem-02',
      date: '07/11/2026',
      time: '07:00',
      period: 'morning',
      bpSystolic: 116,
      bpDiastolic: 75,
      heartRate: 73,
      spo2: 98,
      glucose: 5.3,
      source: 'manual',
      sourceLabel: 'Nhập tay tại nhà',
      note: 'Đo định kỳ buổi sáng',
    },
    {
      id: 'vit-205',
      memberId: 'mem-02',
      date: '06/11/2026',
      time: '19:00',
      period: 'evening',
      bpSystolic: 115,
      bpDiastolic: 75,
      heartRate: 72,
      spo2: 99,
      glucose: 5.5,
      source: 'iot',
      sourceLabel: 'Máy đo Omron Bluetooth',
      note: 'Sinh hiệu bình thường, không mệt mỏi',
    },
    {
      id: 'vit-206',
      memberId: 'mem-02',
      date: '05/11/2026',
      time: '14:00',
      period: 'noon',
      bpSystolic: 115,
      bpDiastolic: 75,
      heartRate: 72,
      spo2: 99,
      glucose: 5.4,
      source: 'doctor',
      sourceLabel: 'Bác sĩ gia đình đo tại nhà',
      note: 'PGS.TS Nghĩa kiểm tra sinh hiệu định kỳ',
    },
  ],
  'mem-01': [
    {
      id: 'vit-101',
      memberId: 'mem-01',
      date: '10/11/2026',
      time: '07:30',
      period: 'morning',
      bpSystolic: 135,
      bpDiastolic: 85,
      heartRate: 76,
      spo2: 98,
      glucose: 6.8,
      source: 'iot',
      sourceLabel: 'Máy đo Omron Bluetooth',
      note: 'Đã uống 1 viên Amlodipine sau ăn',
    },
    {
      id: 'vit-102',
      memberId: 'mem-01',
      date: '09/11/2026',
      time: '19:00',
      period: 'evening',
      bpSystolic: 132,
      bpDiastolic: 84,
      heartRate: 75,
      spo2: 98,
      glucose: 7.1,
      source: 'iot',
      sourceLabel: 'Máy đo Omron Bluetooth',
      note: 'Đường huyết sau ăn tối có kiểm soát tốt',
    },
    {
      id: 'vit-103',
      memberId: 'mem-01',
      date: '08/11/2026',
      time: '07:00',
      period: 'morning',
      bpSystolic: 138,
      bpDiastolic: 86,
      heartRate: 78,
      spo2: 97,
      glucose: 6.9,
      source: 'manual',
      sourceLabel: 'Nhập tay tại nhà',
      note: 'Hơi mỏi gối, huyết áp tăng nhẹ buổi sáng',
    },
    {
      id: 'vit-104',
      memberId: 'mem-01',
      date: '07/11/2026',
      time: '07:30',
      period: 'morning',
      bpSystolic: 134,
      bpDiastolic: 84,
      heartRate: 75,
      spo2: 98,
      glucose: 6.7,
      source: 'iot',
      sourceLabel: 'Máy đo Omron Bluetooth',
      note: 'Sau tập dưỡng sinh 20 phút',
    },
  ],
  'mem-03': [
    {
      id: 'vit-301',
      memberId: 'mem-03',
      date: '10/11/2026',
      time: '06:45',
      period: 'morning',
      bpSystolic: 105,
      bpDiastolic: 65,
      heartRate: 82,
      spo2: 100,
      glucose: 4.8,
      source: 'iot',
      sourceLabel: 'Thiết bị đo gia đình',
      note: 'Bé khỏe mạnh, chuẩn bị đi học',
    },
    {
      id: 'vit-302',
      memberId: 'mem-03',
      date: '08/11/2026',
      time: '07:00',
      period: 'morning',
      bpSystolic: 104,
      bpDiastolic: 64,
      heartRate: 80,
      spo2: 100,
      glucose: 4.9,
      source: 'manual',
      sourceLabel: 'Nhập tay tại nhà',
      note: 'Mũi bé thông thoáng, không ngạt',
    },
  ],
};

export interface ExternalMedicalDoc {
  id: string;
  memberId: string;
  title: string;
  docType: 'xray' | 'ct_mri' | 'discharge' | 'lab_external' | 'other';
  docTypeLabel: string;
  hospitalSource: string;
  recordDate: string;
  fileName: string;
  fileSize: string;
  doctorNotes?: string;
  status: 'reviewed' | 'pending_review';
}

export const INITIAL_EXTERNAL_DOCS: Record<string, ExternalMedicalDoc[]> = {
  'mem-01': [
    {
      id: 'ext-01',
      memberId: 'mem-01',
      title: 'Phim chụp X-quang khớp gối thẳng & nghiêng',
      docType: 'xray',
      docTypeLabel: 'Phim X-quang',
      hospitalSource: 'BV Chấn thương Chỉnh hình TP.HCM',
      recordDate: '15/09/2026',
      fileName: 'xray_khop_goi_nguyen_van_phuc.pdf',
      fileSize: '4.2 MB',
      doctorNotes: 'PGS.TS Nghĩa đã xem: Thoái hóa khớp gối độ 2, duy trì bài tập dưỡng sinh và bổ sung canxi.',
      status: 'reviewed',
    },
    {
      id: 'ext-02',
      memberId: 'mem-01',
      title: 'Giấy ra viện & Tóm tắt BA Tim mạch Can thiệp',
      docType: 'discharge',
      docTypeLabel: 'Giấy ra viện',
      hospitalSource: 'BV Chợ Rẫy TP.HCM',
      recordDate: '20/07/2025',
      fileName: 'giay_ra_vien_khoa_tim_mach_cr.pdf',
      fileSize: '1.8 MB',
      doctorNotes: 'Đã tích hợp tiền sử can thiệp mạch vành vào phác đồ theo dõi dài hạn.',
      status: 'reviewed',
    },
    {
      id: 'ext-03',
      memberId: 'mem-01',
      title: 'Bảng xét nghiệm chỉ số mỡ máu & HbA1c 3 tháng',
      docType: 'lab_external',
      docTypeLabel: 'Xét nghiệm máu ngoài',
      hospitalSource: 'Trung tâm Xét nghiệm Medlatec',
      recordDate: '01/11/2026',
      fileName: 'kq_xet_nghiem_medlatec_01112026.pdf',
      fileSize: '820 KB',
      status: 'pending_review',
    },
  ],
  'mem-02': [
    {
      id: 'ext-201',
      memberId: 'mem-02',
      title: 'Kết quả siêu âm tuyến giáp & ổ bụng tổng quát',
      docType: 'other',
      docTypeLabel: 'Siêu âm tổng quát',
      hospitalSource: 'BV Đại học Y Dược TP.HCM',
      recordDate: '12/08/2026',
      fileName: 'sieu_am_tong_quat_tran_thi_mai.pdf',
      fileSize: '2.4 MB',
      doctorNotes: 'Các tạng trong ổ bụng bình thường, không ghi nhận bất thường cấu trúc.',
      status: 'reviewed',
    },
  ],
  'mem-03': [
    {
      id: 'ext-301',
      memberId: 'mem-03',
      title: 'Sổ tiêm chủng mở rộng & vắc-xin 5 trong 1',
      docType: 'other',
      docTypeLabel: 'Sổ tiêm chủng',
      hospitalSource: 'Trung tâm Tiêm chủng VNVC',
      recordDate: '10/05/2026',
      fileName: 'so_tiem_chung_vnvc_an_nhi.pdf',
      fileSize: '3.1 MB',
      doctorNotes: 'Lịch tiêm phòng đầy đủ theo lứa tuổi.',
      status: 'reviewed',
    },
  ],
};

export function getMemberInitials(name: string): string {
  return name
    .split(' ')
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function FamilyMemberCareView({ memberId }: { memberId: string }) {
  const [membersData, setMembersData] = useState<Record<string, MemberHealthData>>(
    INITIAL_FAMILY_MEMBERS_DATA
  );
  const currentMember = membersData[memberId] || membersData['mem-01'];
  const activeId = currentMember.id;

  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [dailyVitals, setDailyVitals] = useState<Record<string, DailyVitalRecord[]>>(
    INITIAL_DAILY_VITALS
  );
  const [vitalsPeriodFilter, setVitalsPeriodFilter] = useState<'all' | 'morning' | 'noon' | 'evening'>('all');
  const [editingVitalRecord, setEditingVitalRecord] = useState<DailyVitalRecord | null>(null);
  const [deletingVitalRecord, setDeletingVitalRecord] = useState<DailyVitalRecord | null>(null);

  // Form State for Adding / Editing Vital Record
  const [vFormDate, setVFormDate] = useState('10/11/2026');
  const [vFormTime, setVFormTime] = useState('07:00');
  const [vFormPeriod, setVFormPeriod] = useState<'morning' | 'noon' | 'evening'>('morning');
  const [vFormSys, setVFormSys] = useState('115');
  const [vFormDia, setVFormDia] = useState('75');
  const [vFormHeartRate, setVFormHeartRate] = useState('72');
  const [vFormSpo2, setVFormSpo2] = useState('99');
  const [vFormGlucose, setVFormGlucose] = useState('5.2');
  const [vFormSource, setVFormSource] = useState<'iot' | 'doctor' | 'manual'>('manual');
  const [vFormNote, setVFormNote] = useState('');

  const [vitalsToast, setVitalsToast] = useState<string | null>(null);
  const [showHomeVisitGuide, setShowHomeVisitGuide] = useState(false);
  const [showPrescriptionQrModal, setShowPrescriptionQrModal] = useState<string | null>(null);
  const [deliveryToast, setDeliveryToast] = useState<string | null>(null);
  const [ehrFilter, setEhrFilter] = useState<'all' | 'home_visit' | 'telehealth' | 'lab_result'>('all');
  const [expandedEhrId, setExpandedEhrId] = useState<string | null>('ehr-01');

  // External Documents State
  const [externalDocs, setExternalDocs] = useState<Record<string, ExternalMedicalDoc[]>>(
    INITIAL_EXTERNAL_DOCS
  );
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<ExternalMedicalDoc['docType']>('xray');
  const [docHospital, setDocHospital] = useState('BV Chợ Rẫy TP.HCM');
  const [docDate, setDocDate] = useState('11/11/2026');
  const [docNote, setDocNote] = useState('');
  const [docFileName, setDocFileName] = useState('');
  const [externalDocToast, setExternalDocToast] = useState<string | null>(null);

  const memberDocsList = externalDocs[activeId] || [];

  const handleUploadDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    const typeLabels: Record<ExternalMedicalDoc['docType'], string> = {
      xray: 'Phim X-quang',
      ct_mri: 'Phim CT / MRI',
      discharge: 'Giấy xuất viện',
      lab_external: 'Xét nghiệm máu ngoài',
      other: 'Tài liệu khác',
    };

    const newDoc: ExternalMedicalDoc = {
      id: `ext-${Date.now()}`,
      memberId: activeId,
      title: docTitle.trim(),
      docType,
      docTypeLabel: typeLabels[docType],
      hospitalSource: docHospital.trim() || 'Cơ sở y tế tuyến ngoài',
      recordDate: docDate || '11/11/2026',
      fileName: docFileName.trim() || `${docType}_${Date.now()}.pdf`,
      fileSize: '2.5 MB',
      doctorNotes: docNote.trim() ? `Gia đình ghi chú: ${docNote.trim()}` : undefined,
      status: 'pending_review',
    };

    setExternalDocs((prev) => ({
      ...prev,
      [activeId]: [newDoc, ...(prev[activeId] || [])],
    }));

    setShowUploadDocModal(false);
    setDocTitle('');
    setDocNote('');
    setDocFileName('');
    setExternalDocToast(`Đã tải lên thành công tệp "${newDoc.title}". Bác sĩ phụ trách hộ sẽ nhận được thông báo để đối soát.`);
    setTimeout(() => setExternalDocToast(null), 4000);
  };

  const handleDeleteDoc = (docId: string, docName: string) => {
    setExternalDocs((prev) => ({
      ...prev,
      [activeId]: (prev[activeId] || []).filter((d) => d.id !== docId),
    }));
    setExternalDocToast(`Đã xóa tài liệu "${docName}".`);
    setTimeout(() => setExternalDocToast(null), 3000);
  };

  const memberVitalsList = dailyVitals[activeId] || [];
  const filteredDailyVitals = memberVitalsList.filter((item) => {
    if (vitalsPeriodFilter === 'all') return true;
    return item.period === vitalsPeriodFilter;
  });

  const handleOpenAddVitalModal = () => {
    setEditingVitalRecord(null);
    setVFormDate('10/11/2026');
    setVFormTime('07:00');
    setVFormPeriod('morning');
    setVFormSys('115');
    setVFormDia('75');
    setVFormHeartRate('72');
    setVFormSpo2('99');
    setVFormGlucose('5.2');
    setVFormSource('manual');
    setVFormNote('');
    setShowVitalsModal(true);
  };

  const handleOpenEditVitalModal = (rec: DailyVitalRecord) => {
    setEditingVitalRecord(rec);
    setVFormDate(rec.date);
    setVFormTime(rec.time);
    setVFormPeriod(rec.period);
    setVFormSys(String(rec.bpSystolic));
    setVFormDia(String(rec.bpDiastolic));
    setVFormHeartRate(String(rec.heartRate));
    setVFormSpo2(String(rec.spo2));
    setVFormGlucose(String(rec.glucose));
    setVFormSource(rec.source);
    setVFormNote(rec.note || '');
    setShowVitalsModal(true);
  };

  const handleSaveDailyVital = (e: React.FormEvent) => {
    e.preventDefault();
    const sys = Number(vFormSys) || 120;
    const dia = Number(vFormDia) || 80;
    const glu = Number(vFormGlucose) || 5.2;
    const hr = Number(vFormHeartRate) || 72;
    const sp = Number(vFormSpo2) || 99;
    const isBpHigh = sys >= 135 || dia >= 85;
    const isGluHigh = glu >= 7.0;

    const sourceLabel =
      vFormSource === 'iot'
        ? 'Máy đo Omron Bluetooth'
        : vFormSource === 'doctor'
        ? 'Bác sĩ gia đình đo tại nhà'
        : 'Nhập tay tại nhà';

    if (editingVitalRecord) {
      // Sửa bản ghi
      setDailyVitals((prev) => {
        const list = prev[activeId] || [];
        return {
          ...prev,
          [activeId]: list.map((item) =>
            item.id === editingVitalRecord.id
              ? {
                  ...item,
                  date: vFormDate,
                  time: vFormTime,
                  period: vFormPeriod,
                  bpSystolic: sys,
                  bpDiastolic: dia,
                  heartRate: hr,
                  spo2: sp,
                  glucose: glu,
                  source: vFormSource,
                  sourceLabel,
                  note: vFormNote.trim() || 'Số đo định kỳ',
                }
              : item
          ),
        };
      });
      setVitalsToast(`Đã cập nhật số đo sinh hiệu ngày ${vFormDate} của ${currentMember.name}!`);
    } else {
      // Thêm mới bản ghi
      const newRec: DailyVitalRecord = {
        id: `vit-${Date.now()}`,
        memberId: activeId,
        date: vFormDate,
        time: vFormTime,
        period: vFormPeriod,
        bpSystolic: sys,
        bpDiastolic: dia,
        heartRate: hr,
        spo2: sp,
        glucose: glu,
        source: vFormSource,
        sourceLabel,
        note: vFormNote.trim() || 'Ghi nhận số đo mới',
      };
      setDailyVitals((prev) => ({
        ...prev,
        [activeId]: [newRec, ...(prev[activeId] || [])],
      }));
      setVitalsToast(`Đã thêm số đo ngày ${vFormDate} vào nhật ký sinh hiệu!`);
    }

    // Cập nhật snapshot hiện tại
    setMembersData((prev) => {
      const updated = { ...prev };
      const member = { ...updated[activeId] };
      member.bp = `${sys}/${dia}`;
      member.bpStatus = isBpHigh ? 'Hơi cao • Cần uống thuốc đều' : 'Huyết áp lý tưởng';
      member.glucose = `${glu} mmol/L`;
      member.glucoseStatus = isGluHigh ? 'Cao nhẹ • Cần theo dõi' : 'Bình thường';
      member.heartRate = `${hr} lần/phút`;
      member.spo2 = `${sp}%`;
      member.status = isBpHigh || isGluHigh ? 'warning' : 'good';
      member.statusText =
        isBpHigh || isGluHigh
          ? 'Chỉ số sinh hiệu cần chú ý theo dõi'
          : 'Các chỉ số sinh hiệu ổn định';
      member.lastUpdated = `${vFormTime} · Hôm nay`;
      updated[activeId] = member;
      return updated;
    });

    setShowVitalsModal(false);
    setTimeout(() => setVitalsToast(null), 4000);
  };

  const handleDeleteDailyVital = () => {
    if (!deletingVitalRecord) return;
    setDailyVitals((prev) => ({
      ...prev,
      [activeId]: (prev[activeId] || []).filter((item) => item.id !== deletingVitalRecord.id),
    }));
    setVitalsToast(`Đã xóa số đo ngày ${deletingVitalRecord.date} khỏi nhật ký.`);
    setDeletingVitalRecord(null);
    setTimeout(() => setVitalsToast(null), 3000);
  };

  const ehrList = MOCK_EHR[activeId] || [];
  const filteredEhr = ehrList.filter((item) => {
    if (ehrFilter === 'all') return true;
    return item.type === ehrFilter;
  });

  const toggleMedicineStatus = (medId: string) => {
    setMembersData((prev) => {
      const updated = { ...prev };
      const member = { ...updated[activeId] };
      member.medicines = member.medicines.map((m) =>
        m.id === medId
          ? { ...m, status: m.status === 'taken' ? 'pending' : 'taken' }
          : m
      );
      updated[activeId] = member;
      return updated;
    });
  };


  const initials = getMemberInitials(currentMember.name);
  const takenCount = currentMember.medicines.filter((m) => m.status === 'taken').length;
  const isWarning = currentMember.status === 'warning';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. THANH ĐIỀU HƯỚNG & CHUYỂN ĐỔI THÀNH VIÊN NHANH (THOÁNG ĐÃNG, KHÔNG KHUNG HỘP NẶNG NỀ) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <nav aria-label="Điều hướng trang" className="flex items-center gap-2 flex-wrap">
            <Link
              href="/family"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#2E37A4] bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Bảng Sức khỏe Gia đình</span>
            </Link>

            <Link
              href="/family/members"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-[#2E37A4] px-3 py-2 rounded-xl hover:bg-slate-100/70 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              <span>Sổ Quản lý thành viên &amp; BHYT</span>
            </Link>
          </nav>

          {/* Quick Family Switcher */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
            {Object.values(membersData).map((m) => {
              const isCurrent = m.id === activeId;
              const hasWarn = m.status === 'warning';
              return (
                <Link
                  key={m.id}
                  href={`/family/members/${m.id}`}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                    isCurrent
                      ? 'bg-[#2E37A4] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      hasWarn
                        ? 'bg-amber-400'
                        : isCurrent
                        ? 'bg-emerald-300'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span>{m.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Toast thông báo cập nhật số đo */}
        {vitalsToast && (
          <aside
            role="status"
            aria-live="polite"
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium flex items-center justify-between shadow-xs animate-fade-in"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-emerald-600">
                check_circle
              </span>
              <span>{vitalsToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setVitalsToast(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </aside>
        )}

        {/* 2. PROFILE BANNER THÀNH VIÊN — THIẾT KẾ THOÁNG MẮT, PHÂN TẦNG RÕ RÀNG */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/70 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#2E37A4] to-[#2563eb] text-white font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-sm shrink-0">
                {currentMember.avatar || initials}
              </div>

              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-[#2E37A4] bg-blue-50/80 border border-blue-200/70">
                    {currentMember.relation} · <span className="tabular-nums font-bold">{currentMember.age}</span> tuổi
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tabular-nums bg-slate-100 text-slate-700 border border-slate-200/80">
                    Nhóm máu {currentMember.bloodType}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      isWarning
                        ? 'bg-amber-50 text-amber-800 border-amber-200/90'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isWarning ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                      }`}
                    />
                    <span>{currentMember.statusText}</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Chăm Sóc Hằng Ngày: {currentMember.name}
                </h1>

                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Theo dõi sinh hiệu, nhắc lịch uống thuốc và lịch khám bác sĩ gia đình · Cập nhật: {currentMember.lastUpdated}
                </p>
              </div>
            </div>

            {/* Cụm nút hành động chính */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium shadow-xs hover:border-slate-300 transition-all cursor-pointer whitespace-nowrap outline-hidden"
              >
                <span className="material-symbols-outlined text-[19px] text-[#2E37A4]">print</span>
                <span>In hồ sơ bệnh án</span>
              </button>
            </div>
          </div>

          {/* Dải thông tin lâm sàng trọng tâm (Bệnh nền, Dị ứng, BHYT) */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-[#2E37A4] shrink-0">
                medical_information
              </span>
              <div className="min-w-0">
                <span className="text-slate-500 block text-[11px]">Bệnh lý theo dõi</span>
                <strong className="text-slate-900 font-semibold truncate block mt-0.5">
                  {currentMember.chronicCondition}
                </strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70 flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-amber-700 shrink-0">
                warning
              </span>
              <div className="min-w-0">
                <span className="text-amber-800 block text-[11px] font-medium">Tiền sử dị ứng</span>
                <strong className="text-amber-950 font-semibold truncate block mt-0.5">
                  {currentMember.allergies}
                </strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-emerald-600 shrink-0">
                badge
              </span>
              <div className="min-w-0">
                <span className="text-slate-500 block text-[11px]">Thẻ BHYT đăng ký</span>
                <strong className="text-slate-900 font-bold tabular-nums truncate block mt-0.5">
                  {currentMember.bhyt}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* 3. KHỐI 4 CHỈ SỐ SỨC KHỎE HÔM NAY — DỄ HIỂU, GẦN GŨI */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Chỉ Số Sức Khỏe Hôm Nay
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Các số đo huyết áp, nhịp tim, đường huyết &amp; oxy máu của {currentMember.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Huyết Áp */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[19px]">vital_signs</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700">Huyết áp</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">mmHg</span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${
                      isWarning ? 'text-amber-800' : 'text-slate-900'
                    }`}
                  >
                    {currentMember.bp}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">SYS/DIA</span>
                </div>
                <div className="mt-2.5">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 border ${
                      isWarning
                        ? 'text-amber-800 bg-amber-50 border-amber-200/90'
                        : 'text-emerald-800 bg-emerald-50 border-emerald-200/90'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span>{currentMember.bpStatus}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Oxy máu SpO2 */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[19px]">air</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700">Oxy máu (SpO2)</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">%</span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 tracking-tight">
                    {currentMember.spo2}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">SpO2</span>
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Bão hòa oxy tốt (≥ 95%)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Nhịp Tim */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 border border-pink-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[19px]">favorite</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700">Nhịp tim</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">BPM</span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 tracking-tight">
                    {currentMember.heartRate.split(' ')[0]}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">nhịp/phút</span>
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Nhịp xoang đều ổn định</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Đường Huyết */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-indigo-50 text-[#2E37A4] border border-indigo-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[19px]">water_drop</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700">Đường huyết</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">mmol/L</span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 tracking-tight">
                    {currentMember.glucose.split(' ')[0]}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">mmol/L</span>
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{currentMember.glucoseStatus}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BẢNG QUẢN LÝ CÁC CHỈ SỐ SINH HIỆU MỖI NGÀY */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden mt-6">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#2E37A4]">history</span>
                  <span>Nhật Ký Quản Lý Chỉ Số Mỗi Ngày ({filteredDailyVitals.length} số đo)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lịch sử theo dõi huyết áp, nhịp tim, SpO2 &amp; đường huyết của {currentMember.name}
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Lọc buổi đo */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
                  <button
                    type="button"
                    onClick={() => setVitalsPeriodFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      vitalsPeriodFilter === 'all'
                        ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Tất cả ({memberVitalsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setVitalsPeriodFilter('morning')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      vitalsPeriodFilter === 'morning'
                        ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Sáng
                  </button>
                  <button
                    type="button"
                    onClick={() => setVitalsPeriodFilter('noon')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      vitalsPeriodFilter === 'noon'
                        ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Trưa
                  </button>
                  <button
                    type="button"
                    onClick={() => setVitalsPeriodFilter('evening')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      vitalsPeriodFilter === 'evening'
                        ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Tối
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddVitalModal}
                  className="px-3.5 py-2 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs font-semibold shadow-2xs transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[17px]">add</span>
                  <span>Ghi số đo mới</span>
                </button>
              </div>
            </div>

            {/* Bảng danh sách chỉ số */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Huyết áp (mmHg)</th>
                    <th className="py-3 px-4">Nhịp tim</th>
                    <th className="py-3 px-4">SpO2</th>
                    <th className="py-3 px-4">Đường huyết</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDailyVitals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Chưa có số đo nào cho mốc thời gian này.
                      </td>
                    </tr>
                  ) : (
                    filteredDailyVitals.map((rec) => {
                      const isHighBp = rec.bpSystolic >= 135 || rec.bpDiastolic >= 85;
                      const periodLabel =
                        rec.period === 'morning'
                          ? 'Sáng'
                          : rec.period === 'noon'
                          ? 'Trưa'
                          : 'Tối';
                      const periodColor =
                        rec.period === 'morning'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : rec.period === 'noon'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200';

                      return (
                        <tr
                          key={rec.id}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-900 tabular-nums">
                              {rec.date}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className="tabular-nums text-slate-500">{rec.time}</span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${periodColor}`}
                              >
                                {periodLabel}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-bold tabular-nums text-slate-900 text-sm">
                              {rec.bpSystolic}/{rec.bpDiastolic}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">mmHg</span>
                            <div className="mt-1">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  isHighBp
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                {isHighBp ? 'Hơi cao' : 'Lý tưởng'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-bold tabular-nums text-slate-900">
                              {rec.heartRate}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">BPM</span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-bold tabular-nums text-slate-900">
                              {rec.spo2}%
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-bold tabular-nums text-slate-900">
                              {rec.glucose}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">mmol/L</span>
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditVitalModal(rec)}
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                                title="Sửa số đo"
                                aria-label="Sửa số đo"
                              >
                                <span className="material-symbols-outlined text-[15px]">edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingVitalRecord(rec)}
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                                title="Xóa số đo"
                                aria-label="Xóa số đo"
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 4. LƯỚI 2 CỘT: LỊCH HẸN KHÁM SẮP TỚI & LỊCH DÙNG THUỐC HÔM NAY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          {/* Cột 1: Lịch Hẹn Khám Sắp Tới */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between gap-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2E37A4] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">event_available</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-slate-900">
                      Lịch Hẹn Khám Sắp Tới
                    </h2>
                    <p className="text-xs text-slate-500">
                      Lịch trình thăm khám của {currentMember.name}
                    </p>
                  </div>
                </div>

                <Link
                  href="/family/appointments"
                  className="text-xs font-semibold text-[#2E37A4] hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Quản lý lịch hẹn</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </Link>
              </div>

              {currentMember.upcomingVisit ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[22px] text-[#2E37A4]">
                        {currentMember.upcomingVisit.mode === 'home' ? 'home_health' : 'videocam'}
                      </span>
                      <div>
                        <div className="text-[11px] font-bold text-[#2E37A4] uppercase tracking-wider">
                          {currentMember.upcomingVisit.mode === 'home'
                            ? 'Khám bác sĩ tại nhà'
                            : 'Tư vấn Telehealth Video'}
                        </div>
                        <div className="font-bold tabular-nums text-sm sm:text-base text-slate-900 mt-0.5">
                          {currentMember.upcomingVisit.time} · {currentMember.upcomingVisit.date}
                        </div>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      <span>Đã xác nhận</span>
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#2E37A4] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <span className="material-symbols-outlined text-[19px]">stethoscope</span>
                    </div>
                    <div className="space-y-1 text-xs min-w-0">
                      <div className="font-bold text-slate-900 text-sm">
                        {currentMember.upcomingVisit.doctor}
                      </div>
                      <div className="text-slate-600 font-medium">
                        {currentMember.upcomingVisit.specialty} ·{' '}
                        <span className="text-slate-900 font-semibold">
                          {currentMember.upcomingVisit.hospital}
                        </span>
                      </div>
                      <div className="text-slate-600 pt-2 border-t border-slate-200/60 leading-relaxed">
                        <strong className="text-slate-800">Nội dung khám: </strong>
                        <span>{currentMember.upcomingVisit.note}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-slate-50/70 border border-dashed border-slate-300 text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    Chưa có lịch hẹn nào sắp tới cho {currentMember.name}.
                  </p>
                  <Link
                    href="/family/appointments"
                    className="inline-block px-4 py-2 bg-[#2E37A4] text-white text-xs font-semibold rounded-xl"
                  >
                    Đặt lịch khám mới
                  </Link>
                </div>
              )}
            </div>

            {currentMember.upcomingVisit && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <Link
                  href="/family/appointments"
                  className="py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold text-center text-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[17px]">edit_calendar</span>
                  <span>Đổi ngày giờ</span>
                </Link>
                {currentMember.upcomingVisit.mode === 'home' ? (
                  <button
                    type="button"
                    onClick={() => setShowHomeVisitGuide(true)}
                    className="py-2.5 px-4 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-semibold text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[17px]">fact_check</span>
                    <span>Hướng dẫn đón BS</span>
                  </button>
                ) : (
                  <Link
                    href="/family/appointments"
                    className="py-2.5 px-4 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-semibold text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[17px]">videocam</span>
                    <span>Vào phòng Video</span>
                  </Link>
                )}
              </div>
            )}
          </section>

          {/* Cột 2: Lịch Dùng Thuốc Hôm Nay */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between gap-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">medication</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-slate-900">
                      Lịch Dùng Thuốc Hôm Nay
                    </h2>
                    <p className="text-xs text-slate-500">
                      Đơn thuốc điều trị đang áp dụng cho {currentMember.name}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-semibold tabular-nums bg-slate-100 text-slate-700 shrink-0">
                  Đã dùng {takenCount}/{currentMember.medicines.length}
                </span>
              </div>

              <div className="space-y-3">
                {currentMember.medicines.map((med) => {
                  const isTaken = med.status === 'taken';
                  return (
                    <div
                      key={med.id}
                      className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                        isTaken
                          ? 'bg-emerald-50/50 border-emerald-200/90'
                          : 'bg-slate-50/70 border-slate-200/70 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isTaken
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-white border border-slate-200 text-[#2E37A4]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isTaken ? 'check' : 'medication'}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-slate-900 truncate">
                            {med.name}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">{med.dosage}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px] text-slate-400">
                              schedule
                            </span>
                            <span>{med.time}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        aria-pressed={isTaken}
                        onClick={() => toggleMedicineStatus(med.id)}
                        className={`min-h-9 px-4 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer whitespace-nowrap outline-hidden ${
                          isTaken
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90'
                            : 'bg-white hover:bg-slate-100 text-[#2E37A4] border border-slate-300 shadow-2xs'
                        }`}
                      >
                        {isTaken ? 'Đã uống' : 'Bấm đã uống'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">
                  verified
                </span>
                <span>Đơn thuốc điện tử ký số bởi Bác sĩ gia đình</span>
              </span>
              <span className="font-medium text-slate-600">
                Hiệu lực theo hồ sơ khám
              </span>
            </div>
          </section>
        </div>

        {/* 5. LỊCH SỬ KHÁM BỆNH & BỆNH ÁN ĐIỆN TỬ (EHR) — THIẾT KẾ PHẲNG, TINH TẾ */}
        <section className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
          {/* Header + Bộ lọc trên 1 thanh thoáng đãng */}
          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2E37A4] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">history_edu</span>
              </div>
              <div>
                <h2 className="font-bold text-base sm:text-lg text-slate-900">
                  Lịch Sử Khám Bệnh &amp; Xét Nghiệm ({filteredEhr.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dòng thời gian bệnh án điện tử EHR đồng bộ chuẩn Bộ Y Tế
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl self-start sm:self-auto overflow-x-auto">
              {([
                { id: 'all', label: 'Tất cả' },
                { id: 'home_visit', label: 'Khám tại nhà' },
                { id: 'telehealth', label: 'Telehealth' },
                { id: 'lab_result', label: 'Xét nghiệm' },
              ] as const).map((f) => {
                const isActive = ehrFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setEhrFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Danh sách các lần khám */}
          {filteredEhr.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-slate-300">folder_off</span>
              <p className="text-xs text-slate-500">Chưa có hồ sơ khám bệnh nào trong danh mục này.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredEhr.map((entry) => {
                const isExpanded = expandedEhrId === entry.id;
                return (
                  <div key={entry.id} className="p-5 sm:p-6 transition-colors hover:bg-slate-50/50">
                    <div
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                      onClick={() => setExpandedEhrId(isExpanded ? null : entry.id)}
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#2E37A4] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px]">
                            {entry.type === 'home_visit'
                              ? 'home_health'
                              : entry.type === 'telehealth'
                              ? 'videocam'
                              : 'biotech'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm sm:text-base text-slate-900 truncate">
                              {entry.diagnosis}
                            </span>
                            <span className="text-xs font-bold tabular-nums text-slate-500">
                              (ICD-10: {entry.icd10})
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            <span className="font-semibold text-slate-700">{entry.doctorName}</span> · {entry.hospital} · <span className="tabular-nums">{entry.date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2E37A4] border border-blue-200/70">
                          {entry.typeLabel}
                        </span>
                        <span className="material-symbols-outlined text-slate-400 text-[20px]">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                    </div>

                    {/* Chi tiết đợt khám (Khi mở rộng) */}
                    {isExpanded && (
                      <div className="mt-5 pt-5 border-t border-slate-100 space-y-4 text-xs leading-relaxed animate-fade-in">
                        {/* Ghi chú bác sĩ */}
                        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1">
                          <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
                            Lời dặn &amp; Ghi chú lâm sàng của Bác sĩ:
                          </span>
                          <p className="text-slate-800 text-sm leading-relaxed">{entry.doctorNotes}</p>
                        </div>

                        {/* Chỉ số sinh hiệu lúc khám */}
                        {entry.vitalSigns && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-blue-50/40 border border-blue-200/60">
                            <div>
                              <span className="text-slate-500 block text-[11px]">Huyết áp lúc khám:</span>
                              <strong className="font-bold tabular-nums text-sm text-slate-900">
                                {entry.vitalSigns.bp} mmHg
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[11px]">Nhịp tim:</span>
                              <strong className="font-bold tabular-nums text-sm text-slate-900">
                                {entry.vitalSigns.heartRate}
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[11px]">SpO2:</span>
                              <strong className="font-bold tabular-nums text-sm text-slate-900">
                                {entry.vitalSigns.spo2}
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[11px]">Cân nặng:</span>
                              <strong className="font-bold tabular-nums text-sm text-slate-900">
                                {entry.vitalSigns.weight}
                              </strong>
                            </div>
                          </div>
                        )}

                        {/* Đơn thuốc điều trị */}
                        {entry.prescriptions && entry.prescriptions.length > 0 && (
                          <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
                                Toa thuốc điều trị chỉ định (Mã đơn quốc gia: <span className="text-[#2E37A4] font-bold tabular-nums">RX-2026-0088219</span>):
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                  <span className="material-symbols-outlined text-[13px]">verified</span>
                                  Đã ký số Viettel-CA
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setShowPrescriptionQrModal(entry.id)}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-[#2E37A4] hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                                  title="Xem mã QR để mang ra quầy thuốc mua"
                                >
                                  <span className="material-symbols-outlined text-[15px]">qr_code_2</span>
                                  <span>Mã QR Đơn Thuốc</span>
                                </button>
                              </div>
                            </div>
                            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white p-3 space-y-2">
                              {entry.prescriptions.map((rx, rIdx) => (
                                <div
                                  key={rIdx}
                                  className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                                >
                                  <strong className="text-slate-900 font-semibold">{rx.name}</strong>
                                  <span className="text-slate-600">
                                    Liều: <strong className="text-slate-800">{rx.dosage}</strong> · {rx.frequency} ({rx.duration})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 6. TÀI LIỆU Y TẾ NGOÀI BỆNH VIỆN (EXTERNAL MEDICAL RECORDS UPLOAD) */}
        <section className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#2E37A4] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">folder_shared</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base sm:text-lg text-slate-900">
                    Tài Liệu Y Tế Tuyến Ngoài &amp; Phim Chụp ({memberDocsList.length})
                  </h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                    Bác sĩ gia đình đối soát
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tải lên kết quả xét nghiệm, phim X-quang/CT/MRI, giấy ra viện từ các viện ngoài (Chợ Rẫy, Bạch Mai...) để bác sĩ theo dõi liên tục.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setDocTitle('');
                setDocType('xray');
                setDocHospital('BV Chợ Rẫy TP.HCM');
                setDocDate('11/11/2026');
                setDocNote('');
                setDocFileName('');
                setShowUploadDocModal(true);
              }}
              className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
              <span>Tải Lên Hồ Sơ Mới</span>
            </button>
          </div>

          {/* Body: Danh sách tài liệu */}
          <div className="p-6">
            {memberDocsList.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                  <span className="material-symbols-outlined text-[28px]">description</span>
                </div>
                <p className="font-bold text-slate-700 text-sm">Chưa có tài liệu tuyến ngoài nào</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Bạn có thể tải lên các kết quả xét nghiệm, phim chụp từ bệnh viện tuyến tỉnh/trung ương để Bác sĩ gia đình nắm rõ lịch sử bệnh.
                </p>
                <button
                  type="button"
                  onClick={() => setShowUploadDocModal(true)}
                  className="mt-4 px-4 py-2 bg-white hover:bg-slate-50 text-[#2E37A4] border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">upload</span>
                  <span>Tải lên ngay</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {memberDocsList.map((doc) => {
                  const isReviewed = doc.status === 'reviewed';
                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-[#2E37A4]/40 hover:shadow-xs transition-all flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              doc.docType === 'xray' || doc.docType === 'ct_mri'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : doc.docType === 'discharge'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[12px]">
                              {doc.docType === 'xray' || doc.docType === 'ct_mri'
                                ? 'radiology'
                                : doc.docType === 'discharge'
                                ? 'assignment_turned_in'
                                : 'lab_research'}
                            </span>
                            <span>{doc.docTypeLabel}</span>
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isReviewed
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[12px]">
                              {isReviewed ? 'verified' : 'hourglass_empty'}
                            </span>
                            <span>{isReviewed ? 'Đã thẩm định' : 'Chờ bác sĩ xem'}</span>
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                            {doc.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <span className="material-symbols-outlined text-[14px] text-slate-400">
                              local_hospital
                            </span>
                            <span className="truncate">{doc.hospitalSource}</span>
                          </div>
                        </div>

                        {doc.doctorNotes && (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 leading-relaxed">
                            <span className="font-semibold text-[#2E37A4] block">Ý kiến Bác sĩ gia đình:</span>
                            {doc.doctorNotes}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="tabular-nums font-medium">{doc.recordDate}</span>
                          <span className="tabular-nums text-slate-400">{doc.fileSize}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setExternalDocToast(`Đang mở xem tệp tài liệu: ${doc.fileName}`);
                              setTimeout(() => setExternalDocToast(null), 3000);
                            }}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-blue-50/80 hover:bg-blue-100 text-[#2E37A4] text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">visibility</span>
                            <span>Xem tệp</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(doc.id, doc.title)}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            title="Xóa tệp"
                            aria-label="Xóa tệp"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* MODAL 1: HƯỚNG DẪN ĐÓN BÁC SĨ TẠI NHÀ */}
      {showHomeVisitGuide && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5 text-[#2E37A4]">
                <span className="material-symbols-outlined text-[24px]">home_health</span>
                <h3 className="font-bold text-base text-slate-900">
                  Hướng Dẫn Đón Bác Sĩ Tại Nhà
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHomeVisitGuide(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/70 text-slate-800 space-y-1">
                <div><strong>Bác sĩ phụ trách:</strong> PGS.TS Nguyễn Trọng Nghĩa</div>
                <div>
                  <strong>Thời gian dự kiến:</strong> {currentMember.upcomingVisit?.time} ·{' '}
                  {currentMember.upcomingVisit?.date}
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800 text-sm">Gia đình vui lòng chuẩn bị trước:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li>Căn cước công dân và thẻ BHYT của người bệnh ({currentMember.name}).</li>
                  <li>Các toa thuốc đang uống hoặc kết quả khám trong 3 tháng gần nhất.</li>
                  <li>Không ăn sáng nếu có chỉ định lấy máu xét nghiệm đường huyết/mỡ máu.</li>
                  <li>Chuẩn bị khu vực khám thoáng mát, đủ ánh sáng và một ly nước ấm.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowHomeVisitGuide(false)}
                className="w-full py-3 rounded-xl bg-[#2E37A4] hover:bg-[#222982] text-white font-semibold text-xs sm:text-sm cursor-pointer shadow-xs transition-colors"
              >
                Đã hiểu &amp; Đóng hướng dẫn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GHI / SỬA SỐ ĐO SINH HIỆU HẰNG NGÀY */}
      {showVitalsModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 my-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2E37A4] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">vital_signs</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingVitalRecord ? 'Chỉnh Sửa Số Đo Sinh Hiệu' : 'Ghi Nhận Số Đo Sinh Hiệu Mới'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hồ sơ: {currentMember.name} ({currentMember.relation})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowVitalsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDailyVital} className="space-y-4 text-xs">
              {/* Ngày, Giờ & Khung giờ đo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày đo</label>
                  <input
                    type="text"
                    required
                    placeholder="10/11/2026"
                    value={vFormDate}
                    onChange={(e) => setVFormDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-medium tabular-nums text-xs sm:text-sm bg-white focus:border-[#2E37A4] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giờ đo</label>
                  <input
                    type="text"
                    required
                    placeholder="07:00"
                    value={vFormTime}
                    onChange={(e) => setVFormTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-medium tabular-nums text-xs sm:text-sm bg-white focus:border-[#2E37A4] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khung giờ</label>
                  <select
                    value={vFormPeriod}
                    onChange={(e) =>
                      setVFormPeriod(e.target.value as 'morning' | 'noon' | 'evening')
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-xs sm:text-sm bg-white focus:border-[#2E37A4] outline-hidden"
                  >
                    <option value="morning">Sáng sớm</option>
                    <option value="noon">Buổi trưa</option>
                    <option value="evening">Buổi tối</option>
                  </select>
                </div>
              </div>

              {/* Huyết áp & Nhịp tim */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Huyết áp Tâm thu (SYS)
                    </label>
                    <input
                      type="number"
                      required
                      min={60}
                      max={250}
                      placeholder="120"
                      value={vFormSys}
                      onChange={(e) => setVFormSys(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold tabular-nums text-sm bg-white focus:border-[#2E37A4] outline-hidden"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">mmHg (Chuẩn: &lt; 130)</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Huyết áp Tâm trương (DIA)
                    </label>
                    <input
                      type="number"
                      required
                      min={40}
                      max={150}
                      placeholder="80"
                      value={vFormDia}
                      onChange={(e) => setVFormDia(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold tabular-nums text-sm bg-white focus:border-[#2E37A4] outline-hidden"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">mmHg (Chuẩn: &lt; 85)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nhịp tim (BPM)</label>
                    <input
                      type="number"
                      required
                      min={40}
                      max={200}
                      placeholder="72"
                      value={vFormHeartRate}
                      onChange={(e) => setVFormHeartRate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold tabular-nums text-sm bg-white focus:border-[#2E37A4] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">SpO2 (%)</label>
                    <input
                      type="number"
                      required
                      min={80}
                      max={100}
                      placeholder="99"
                      value={vFormSpo2}
                      onChange={(e) => setVFormSpo2(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold tabular-nums text-sm bg-white focus:border-[#2E37A4] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Đường huyết (mmol/L)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      min={1}
                      max={30}
                      placeholder="5.2"
                      value={vFormGlucose}
                      onChange={(e) => setVFormGlucose(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold tabular-nums text-sm bg-white focus:border-[#2E37A4] outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú (tùy chọn)</label>
                <input
                  type="text"
                  placeholder="VD: Sau tập thể dục, trước ăn sáng..."
                  value={vFormNote}
                  onChange={(e) => setVFormNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:border-[#2E37A4] outline-hidden"
                />
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2E37A4] hover:bg-[#222982] text-white font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  {editingVitalRecord ? 'Cập nhật số đo' : 'Lưu vào nhật ký'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA SỐ ĐO */}
      {deletingVitalRecord && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 my-auto">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">delete</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Xóa số đo sinh hiệu</h3>
                <p className="text-xs text-slate-500">
                  {deletingVitalRecord.date} · {deletingVitalRecord.time}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa số đo huyết áp{' '}
              <strong className="text-slate-900">
                {deletingVitalRecord.bpSystolic}/{deletingVitalRecord.bpDiastolic} mmHg
              </strong>{' '}
              khỏi lịch sử theo dõi của {currentMember.name}?
            </p>

            <div className="flex gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingVitalRecord(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteDailyVital}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MÃ QR ĐƠN THUỐC QUỐC GIA (THÔNG TƯ 04/2022/TT-BYT) */}
      {showPrescriptionQrModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#2E37A4] border border-indigo-200 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">qr_code_2</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Đơn Thuốc Điện Tử Quốc Gia
                  </h3>
                  <p className="text-xs text-slate-500">Mã liên thông: <span className="font-bold tabular-nums text-[#2E37A4]">RX-2026-0088219</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrescriptionQrModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* QR Code Container */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-center space-y-3">
              <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl border-2 border-[#2E37A4]/20 shadow-xs flex flex-col items-center justify-center">
                {/* Visual SVG QR Representation */}
                <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                  <rect width="100" height="100" fill="white" />
                  <path
                    d="M10 10h28v28h-28z M16 16v16h16v-16z M62 10h28v28h-28z M68 16v16h16v-16z M10 62h28v28h-28z M16 68v16h16v-16z"
                    fill="#2E37A4"
                  />
                  <rect x="22" y="22" width="4" height="4" fill="#2E37A4" />
                  <rect x="74" y="22" width="4" height="4" fill="#2E37A4" />
                  <rect x="22" y="74" width="4" height="4" fill="#2E37A4" />
                  <rect x="44" y="10" width="8" height="8" fill="#2E37A4" />
                  <rect x="44" y="24" width="8" height="8" fill="#2E37A4" />
                  <rect x="44" y="38" width="8" height="8" fill="#2E37A4" />
                  <rect x="10" y="44" width="8" height="8" fill="#2E37A4" />
                  <rect x="24" y="44" width="8" height="8" fill="#2E37A4" />
                  <rect x="62" y="44" width="12" height="6" fill="#2E37A4" />
                  <rect x="80" y="44" width="10" height="6" fill="#2E37A4" />
                  <rect x="44" y="62" width="8" height="8" fill="#2E37A4" />
                  <rect x="44" y="76" width="8" height="8" fill="#2E37A4" />
                  <rect x="62" y="62" width="8" height="8" fill="#2E37A4" />
                  <rect x="76" y="62" width="14" height="8" fill="#2E37A4" />
                  <rect x="62" y="76" width="14" height="8" fill="#2E37A4" />
                  <rect x="82" y="86" width="8" height="4" fill="#2E37A4" />
                </svg>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Cổng Đơn Thuốc Quốc Gia (Bộ Y Tế)
                </span>
                <p className="text-xs text-slate-600 leading-snug">
                  Quét mã QR tại bất kỳ quầy thuốc GPP trên toàn quốc (Long Châu, An Khang, Pharmacity...) để mua đúng thuốc theo phác đồ bác sĩ.
                </p>
              </div>
            </div>

            {/* Verification Metadata */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Bác sĩ ký số:</span>
                <span className="font-semibold text-slate-800">PGS.TS Nguyễn Trọng Nghĩa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chứng thư số:</span>
                <span className="font-bold text-emerald-700">Viettel-CA (SHA-256)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời hạn mua thuốc:</span>
                <span className="font-bold tabular-nums text-slate-800">30 ngày kể từ ngày ký</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeliveryToast('Đã gửi yêu cầu cấp phát & giao thuốc tận nhà (2h) tới nhà thuốc liên kết GPP!');
                  setShowPrescriptionQrModal(null);
                  setTimeout(() => setDeliveryToast(null), 5000);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#2E37A4] hover:bg-indigo-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                <span>Yêu Cầu Giao Thuốc Tận Nhà</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPrescriptionQrModal(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Realtime Delivery Toast */}
      {deliveryToast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold shadow-lg animate-in slide-in-from-bottom-3 flex items-center gap-2.5"
        >
          <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
          <span>{deliveryToast}</span>
        </div>
      )}

      {/* External Document Toast */}
      {externalDocToast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-[#2E37A4] text-xs sm:text-sm font-bold shadow-lg animate-in slide-in-from-bottom-3 flex items-center gap-2.5 max-w-md"
        >
          <span className="material-symbols-outlined text-[20px] text-[#2E37A4]">info</span>
          <span>{externalDocToast}</span>
        </div>
      )}

      {/* MODAL 4: TẢI LÊN TÀI LIỆU Y TẾ TUYẾN NGOÀI */}
      {showUploadDocModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 my-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2E37A4] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Tải Lên Hồ Sơ &amp; Phim Chụp Tuyến Ngoài
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thành viên: {currentMember.name} ({currentMember.relation})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowUploadDocModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadDocSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên tài liệu / Kết quả khám <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phim chụp MRI cột sống, Bảng kết quả XN máu..."
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold text-xs sm:text-sm bg-white focus:border-[#2E37A4] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Loại tài liệu
                  </label>
                  <select
                    value={docType}
                    onChange={(e) =>
                      setDocType(e.target.value as ExternalMedicalDoc['docType'])
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-xs sm:text-sm bg-white focus:border-[#2E37A4] outline-hidden"
                  >
                    <option value="xray">Phim X-quang</option>
                    <option value="ct_mri">Phim chụp CT / MRI</option>
                    <option value="discharge">Giấy xuất viện / Tóm tắt BA</option>
                    <option value="lab_external">Xét nghiệm máu ngoài</option>
                    <option value="other">Tài liệu khác</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ngày khám / chụp
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="11/11/2026"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-medium tabular-nums text-xs sm:text-sm bg-white focus:border-[#2E37A4] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bệnh viện / Cơ sở thực hiện
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: BV Chợ Rẫy, BV Bạch Mai, Medlatec..."
                  value={docHospital}
                  onChange={(e) => setDocHospital(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-xs sm:text-sm bg-white focus:border-[#2E37A4] outline-hidden"
                />
              </div>

              {/* Upload file box */}
              <div className="p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2E37A4] flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[20px]">attach_file</span>
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-slate-800">
                    {docFileName ? docFileName : 'Chọn hoặc kéo thả tệp PDF, JPG, DICOM'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Dung lượng tối đa 25MB / tệp</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDocFileName(
                      `${docType}_${currentMember.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  {docFileName ? 'Đổi tệp khác' : 'Chọn tệp mẫu'}
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú cho Bác sĩ gia đình (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: Bác sĩ ngoài dặn uống thuốc 1 tuần rồi tái khám..."
                  value={docNote}
                  onChange={(e) => setDocNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:border-[#2E37A4] outline-hidden"
                />
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadDocModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2E37A4] hover:bg-[#222982] text-white font-semibold cursor-pointer shadow-xs transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Lưu &amp; Gửi Bác sĩ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
