'use server';

import { serverClient } from '@/lib/http/server-client';
import { ApiError } from '@/lib/http/errors';
import {
  consultationLeadSchema,
  ConsultationLeadSchemaInput,
} from '../schemas/landing.schema';

export interface SubmitConsultationLeadResult {
  success: boolean;
  leadId?: string;
  message?: string;
  errors?: Record<string, string[]>;
  status?: number;
}

export async function submitConsultationLeadAction(
  input: ConsultationLeadSchemaInput
): Promise<SubmitConsultationLeadResult> {
  const validated = consultationLeadSchema.safeParse(input);
  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    const res = await serverClient.post<{ success: boolean; leadId: string }>(
      '/api/v1/leads/consultation',
      validated.data
    );

    return {
      success: true,
      leadId: res.data.leadId,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 400) {
        return {
          success: false,
          message: error.message || 'Thông tin đăng ký không hợp lệ',
          status: 400,
        };
      }
      return {
        success: false,
        message: 'Hệ thống đang bảo trì, vui lòng gọi Hotline 1900 8821',
        status: error.status,
      };
    }

    return {
      success: false,
      message: 'Hệ thống đang bảo trì, vui lòng gọi Hotline 1900 8821',
    };
  }
}
