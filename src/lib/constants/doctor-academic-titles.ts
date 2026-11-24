export interface DoctorAcademicTitleOption {
  value: string;
  label: string;
  desc: string;
}

export const DOCTOR_ACADEMIC_TITLE_OPTIONS: DoctorAcademicTitleOption[] = [
  {
    value: 'BS',
    label: 'Bác sĩ (BS)',
    desc: 'Bác sĩ đa khoa có chứng chỉ hành nghề',
  },
  {
    value: 'BSNT',
    label: 'Bác sĩ Nội trú (BSNT)',
    desc: 'Đào tạo nội trú chuyên sâu tại bệnh viện lớn',
  },
  {
    value: 'ThS.BS',
    label: 'Thạc sĩ Bác sĩ (ThS.BS)',
    desc: 'Trình độ Thạc sĩ Y học',
  },
  {
    value: 'BS.CKI',
    label: 'Bác sĩ Chuyên khoa I (BS.CKI)',
    desc: 'Chuyên khoa cấp I thực hành lâm sàng',
  },
  {
    value: 'BS.CKII',
    label: 'Bác sĩ Chuyên khoa II (BS.CKII)',
    desc: 'Chuyên khoa cấp II chuyên sâu',
  },
  {
    value: 'TS.BS',
    label: 'Tiến sĩ Bác sĩ (TS.BS)',
    desc: 'Học vị Tiến sĩ Y học',
  },
  {
    value: 'PGS.TS.BS',
    label: 'Phó Giáo sư · Tiến sĩ (PGS.TS.BS)',
    desc: 'Học hàm Phó Giáo sư',
  },
  {
    value: 'GS.TS.BS',
    label: 'Giáo sư · Tiến sĩ (GS.TS.BS)',
    desc: 'Học hàm Giáo sư',
  },
];
