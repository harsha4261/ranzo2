import { apiFetch } from '@/core/api/client';
import { apiV1Path } from '@/core/config/api';

export type UserSummaryResponse = {
  id: string;
  name: string;
  phone: string;
  registered_roles: string[];
  created_at: string;
};

export async function getUserMe(): Promise<UserSummaryResponse> {
  return apiFetch<UserSummaryResponse>(apiV1Path('/users/me'), {
    method: 'GET',
    auth: true,
  });
}
