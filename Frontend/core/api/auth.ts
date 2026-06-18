import { apiFetch } from '@/core/api/client';
import { apiV1Path } from '@/core/config/api';

export type OtpPurpose = 'register' | 'login' | 'forgot_password';

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type CheckPhoneResponse = {
  exists: boolean;
  message: string;
};

export type MessageResponse = {
  message: string;
};

export async function checkPhone(phone: string): Promise<CheckPhoneResponse> {
  return apiFetch<CheckPhoneResponse>(apiV1Path('/auth/check-phone'), {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ phone }),
  });
}

export async function sendOtp(phone: string, purpose: OtpPurpose): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(apiV1Path('/auth/send-otp'), {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ phone, purpose }),
  });
}

export async function verifyOtp(phone: string, code: string, purpose: OtpPurpose): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(apiV1Path('/auth/verify-otp'), {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ phone, code, purpose }),
  });
}

export async function register(name: string, phone: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>(apiV1Path('/auth/register'), {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ name, phone, password }),
  });
}

export async function login(phone: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>(apiV1Path('/auth/login'), {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ phone, password }),
  });
}

export async function loginOtp(phone: string, code: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>(apiV1Path('/auth/login-otp'), {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ phone, code }),
  });
}

export async function resetPassword(phone: string, newPassword: string): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(apiV1Path('/auth/reset-password'), {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ phone, new_password: newPassword }),
  });
}

export async function logout(): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(apiV1Path('/auth/logout'), {
    method: 'POST',
    auth: true,
  });
}
