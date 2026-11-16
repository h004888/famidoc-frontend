'use server';

import { serverClient } from '@/lib/http/server-client';
import { ApiError } from '@/lib/http/errors';
import {
  consultationLeadSchema,
  ConsultationLeadSchemaInput,
} from '../schemas/landing.schema';

export interface SubmitConsultationLeadResult {
  success: boolean;
  ticketId?: string;
  message?: string;
  status?: number;
  errors?: Record<string, string[] | undefined>;
}

interface RawConsultationResponse {
  ticketId?: string;
  status?: string;
  message?: string;
  data?: {
    ticketId?: string;
    status?: string;
    message?: string;
  };
}

export async function submitConsultationLeadAction(
  input: ConsultationLeadSchemaInput
): Promise<SubmitConsultationLeadResult> {
  const normalized = {
    ...input,
    preferredPackageId: input.preferredPackageId || undefined,
  };

  const validated = consultationLeadSchema.safeParse(normalized);
  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    const res = await serverClient.post<RawConsultationResponse>(
      '/api/v1/public/consultation-requests',
      validated.data
    );

    const ticketId = res.data?.data?.ticketId ?? res.data?.ticketId;
    const message = res.data?.data?.message ?? res.data?.message;

    return {
      success: true,
      ticketId,
      message,
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
