import { z } from 'zod';

export const soapNoteSchema = z.object({
  patientId: z.string().min(1, 'Mã bệnh nhân bắt buộc'),
  subjective: z.string().min(5, 'Triệu chứng cơ năng bắt buộc'),
  objective: z.string().min(5, 'Khám thực thể và dấu sinh tồn bắt buộc'),
  assessment: z.string().min(3, 'Chẩn đoán xác định / phân biệt bắt buộc'),
  plan: z.string().min(5, 'Kế hoạch điều trị & đơn thuốc bắt buộc'),
  icd10Codes: z.array(z.string()).default([]),
});
export type SoapNoteInput = z.infer<typeof soapNoteSchema>;
