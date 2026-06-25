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
  name_as_per_adhar?: string;
  adhar_number?: string;
  adhar_image_url?: string;
  photo_url?: string;
  village_city?: string;
  pin_code?: string;
  district?: string;
  state?: string;
  preferred_distance?: number;
  terms_agreed?: boolean;
  skills: string[];
  location?: string;
  latitude?: number;
  longitude?: number;
  online_status: boolean;
  is_completed: boolean;
  is_approved: boolean;
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

import { useAuthStore } from '@/data/store';

export async function uploadFile(uri: string, filename: string, mimeType: string): Promise<{ url: string }> {
  const token = useAuthStore.getState().token;
  const formData = new FormData();
  
  // @ts-ignore - React Native FormData accepts an object with uri, name, type
  formData.append('file', {
    uri,
    name: filename,
    type: mimeType,
  });

  const { apiUrl } = require('@/core/config/api');
  const response = await fetch(apiUrl(apiV1Path('/upload')), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Do not set Content-Type, fetch will automatically set it to multipart/form-data with boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Upload failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}
