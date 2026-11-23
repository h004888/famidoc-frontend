import { httpClient } from './http-client';
import { unwrapApiEnvelope } from './envelope';

export interface UserProfileDto {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  avatarUrl?: string | null;
}

export interface UpdateUserProfilePayload {
  fullName?: string;
  avatarUrl?: string;
}

export const usersApi = {
  getProfile: async (): Promise<UserProfileDto> => {
    const res = await httpClient.get<unknown>('/api/v1/users/profile', undefined, {
      cache: 'no-store',
    });
    return unwrapApiEnvelope<UserProfileDto>(res);
  },

  updateProfile: async (payload: UpdateUserProfilePayload): Promise<UserProfileDto> => {
    const res = await httpClient.patch<unknown>('/api/v1/users/profile', payload);
    return unwrapApiEnvelope<UserProfileDto>(res);
  },
};
