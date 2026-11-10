import { z } from 'zod';
import { CONTRACT_STATUSES } from '../types/contract-fsm';

export const MAX_HOUSEHOLDS_PER_DOCTOR = 30;

export const digitalSignatureSchema = z.object({
  signedBy: z.string().min(1, 'Họ tên người ký không được để trống'),
  signerRole: z.enum(['FAMILY', 'PLATFORM', 'FACILITY', 'DOCTOR']),
  signedAt: z.string().min(1, 'Thời gian ký không được để trống'),
  sha256Hash: z
    .string()
    .min(16, 'Mã băm chữ ký SHA-256 không hợp lệ'),
  certificateId: z.string().optional(),
  ipAddress: z.string().optional(),
});

export type DigitalSignature = z.infer<typeof digitalSignatureSchema>;

export const doctorAssignmentSchema = z.object({
  doctorId: z.string().min(1, 'Mã bác sĩ không được để trống'),
  doctorName: z.string().min(1, 'Tên bác sĩ không được để trống'),
  facilityId: z.string().min(1, 'Mã cơ sở y tế không được để trống'),
  contractId: z.string().min(1, 'Mã hợp đồng không được để trống'),
  currentAssignedHouseholds: z
    .number()
    .int('Số lượng hộ phụ trách phải là số nguyên')
    .min(0, 'Số lượng hộ phụ trách không thể âm')
    .refine((val) => val < MAX_HOUSEHOLDS_PER_DOCTOR, {
      message: `Định biên bác sĩ gia đình không được vượt quá tối đa ${MAX_HOUSEHOLDS_PER_DOCTOR} hộ. Bác sĩ đã đạt hoặc vượt ngưỡng cho phép.`,
    }),
});

export type DoctorAssignment = z.infer<typeof doctorAssignmentSchema>;

export const contractMemberSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tên thành viên không được để trống'),
  age: z.number().int().min(0),
  relation: z.string().min(1, 'Mối quan hệ không được để trống'),
  chronic: z.string().optional(),
  allergies: z.string().optional(),
});

export type ContractMember = z.infer<typeof contractMemberSchema>;

export const contractSchema = z.object({
  id: z.string().min(1, 'Mã định danh hợp đồng không được để trống'),
  contractNumber: z.string().min(1, 'Mã số hợp đồng không được để trống'),
  status: z.enum(CONTRACT_STATUSES),
  packageId: z.string().min(1, 'Mã gói dịch vụ không được để trống'),
  packageName: z.string().min(1, 'Tên gói dịch vụ không được để trống'),
  packagePrice: z.number().nonnegative('Giá gói dịch vụ không được âm'),
  durationMonths: z.number().int().positive().optional().default(12),
  familyId: z.string().min(1, 'Mã gia đình không được để trống'),
  familyRepresentativeName: z.string().min(1, 'Tên đại diện gia đình không được để trống'),
  familyRepresentativePhone: z.string().min(1, 'Số điện thoại không được để trống'),
  familyRepresentativeEmail: z.string().email('Email không đúng định dạng').optional().or(z.literal('')),
  familyAddress: z.string().optional(),
  membersCount: z.number().int().positive().optional(),
  members: z.array(contractMemberSchema).optional(),
  facilityId: z.string().optional(),
  facilityName: z.string().optional(),
  facilityAddress: z.string().optional(),
  doctorId: z.string().optional(),
  doctorName: z.string().optional(),
  doctorTitle: z.string().optional(),
  createdAt: z.string().min(1, 'Ngày tạo hợp đồng không được để trống'),
  updatedAt: z.string().optional(),
  activatedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  signatures: z
    .object({
      family: digitalSignatureSchema.optional(),
      platform: digitalSignatureSchema.optional(),
      facility: digitalSignatureSchema.optional(),
      doctor: digitalSignatureSchema.optional(),
    })
    .optional()
    .default({}),
});

export type FourPartyContract = z.infer<typeof contractSchema>;
