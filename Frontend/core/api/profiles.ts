import { apiFetch } from '@/core/api/client';
import { apiV1Path } from '@/core/config/api';

export type UserRole = 'customer' | 'technician' | 'seeker' | 'employer';

export type CustomerProfile = {
  id: string;
  user_id: string;
  location: string | null;
  latitude?: number;
  longitude?: number;
  is_completed: boolean;
};

export type TechnicianProfile = {
  id: string;
  user_id: string;
  skills: string[];
  location?: string;
  latitude?: number;
  longitude?: number;
  online_status: boolean;
  is_completed: boolean;
};

export type SeekerProfile = {
  id: string;
  user_id: string;
  category: string | null;
  role: string | null;
  location: string | null;
  latitude?: number;
  longitude?: number;
  is_completed: boolean;
};

export type EmployerProfile = {
  id: string;
  user_id: string;
  company: string | null;
  location: string | null;
  latitude?: number;
  longitude?: number;
  is_completed: boolean;
};

export type ProfileResponse = CustomerProfile | TechnicianProfile | SeekerProfile | EmployerProfile;

export async function getProfileMe(role: UserRole): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>(apiV1Path(`/profiles/me?role=${role}`), {
    method: 'GET',
    auth: true,
  });
}

export async function updateProfileMe(role: UserRole, body: Record<string, any>): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>(apiV1Path(`/profiles/me?role=${role}`), {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(body),
  });
}
