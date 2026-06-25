const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function adminLogin(username: string, password: string) {
  const res = await fetch(`${API}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json() as Promise<{ access_token: string }>;
}

export async function fetchDashboard(token: string) {
  const res = await fetch(`${API}/admin/dashboard`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Dashboard failed');
  return res.json();
}

export type AdminUser = {
  id: string;
  name?: string;
  phone_number?: string;
  role?: string;
  created_at?: string;
  is_details_filled?: boolean;
  is_suspended?: boolean;
  suspended_at?: string;
  suspend_reason?: string;
};

export async function fetchUsers(
  token: string,
  app: string,
  params?: { q?: string; role?: string; suspended?: boolean }
) {
  const qs = new URLSearchParams({ app });
  if (params?.q) qs.set('q', params.q);
  if (params?.role) qs.set('role', params.role);
  if (params?.suspended != null) qs.set('suspended', String(params.suspended));
  const res = await fetch(`${API}/admin/users?${qs}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Users failed');
  return res.json() as Promise<{ items: AdminUser[]; total: number }>;
}

export async function suspendUser(
  token: string,
  userId: string,
  body: { suspended: boolean; reason?: string },
  app = 'home-services'
) {
  const res = await fetch(`${API}/admin/users/${userId}/suspend?app=${app}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Suspend failed');
  return res.json();
}

export async function fetchServiceBookings(token: string, status?: string) {
  const qs = status ? `?status_filter=${status}` : '';
  const res = await fetch(`${API}/admin/service-bookings${qs}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Service bookings failed');
  return res.json();
}

export async function fetchTechnicians(token: string, onlineStatus?: string) {
  const qs = onlineStatus ? `?online_status=${onlineStatus}` : '';
  const res = await fetch(`${API}/admin/technicians${qs}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Technicians failed');
  return res.json();
}

export async function approveTechnician(token: string, userId: string) {
  const res = await fetch(`${API}/admin/technicians/${userId}/approve`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Approve technician failed');
  return res.json();
}

export async function rejectTechnician(token: string, userId: string) {
  const res = await fetch(`${API}/admin/technicians/${userId}/reject`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Reject technician failed');
  return res.json();
}

export async function fetchWalkInDrives(token: string, status?: string) {
  const qs = status ? `?status_filter=${status}` : '';
  const res = await fetch(`${API}/admin/walk-in-drives${qs}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Walk-in drives failed');
  return res.json();
}

export async function fetchAnalytics(token: string) {
  const res = await fetch(`${API}/admin/analytics`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Analytics failed');
  return res.json();
}

export async function fetchDisputes(token: string, status?: string) {
  const qs = status ? `?status=${status}` : '';
  const res = await fetch(`${API}/admin/disputes${qs}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Disputes failed');
  return res.json();
}

export async function resolveDispute(
  token: string,
  id: string,
  body: { status: string; resolution_notes?: string }
) {
  const res = await fetch(`${API}/admin/disputes/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Resolve failed');
  return res.json();
}

export async function fetchConfig(token: string) {
  const res = await fetch(`${API}/admin/config`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Config failed');
  return res.json();
}

export async function patchConfig(token: string, body: Record<string, unknown>) {
  const res = await fetch(`${API}/admin/config`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Config patch failed');
  return res.json();
}

export async function fetchAuditLog(token: string) {
  const res = await fetch(`${API}/admin/audit-log`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Audit failed');
  return res.json();
}

export type ApplicationLogEntry = {
  id: string;
  timestamp: string;
  level: string;
  category: string;
  action: string;
  message: string;
  request_id?: string;
  user_id?: string;
  app?: string;
  path?: string;
  method?: string;
  status_code?: number;
  duration_ms?: number;
  metadata?: Record<string, unknown>;
};

export async function fetchApplicationLogs(
  token: string,
  params?: {
    limit?: number;
    skip?: number;
    category?: string;
    user_id?: string;
    level?: string;
    request_id?: string;
    q?: string;
  }
) {
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set('limit', String(params.limit));
  if (params?.skip != null) qs.set('skip', String(params.skip));
  if (params?.category) qs.set('category', params.category);
  if (params?.user_id) qs.set('user_id', params.user_id);
  if (params?.level) qs.set('level', params.level);
  if (params?.request_id) qs.set('request_id', params.request_id);
  if (params?.q) qs.set('q', params.q);
  const suffix = qs.toString() ? `?${qs}` : '';
  const res = await fetch(`${API}/admin/application-logs${suffix}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Application logs failed');
  return res.json() as Promise<{ items: ApplicationLogEntry[]; total: number }>;
}

export async function fetchJobsModeration(token: string) {
  const res = await fetch(`${API}/admin/jobs/moderation`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Jobs failed');
  return res.json();
}

export async function moderateJob(
  token: string,
  jobId: string,
  body: { status: string; moderation_note?: string }
) {
  const res = await fetch(`${API}/admin/jobs/${jobId}/moderation`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Moderate failed');
  return res.json();
}

export async function fetchPayouts(token: string) {
  const res = await fetch(`${API}/admin/payouts`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Payouts failed');
  return res.json();
}

export async function fetchVerifications(token: string, app: string) {
  const res = await fetch(`${API}/admin/verifications?app=${app}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Verifications failed');
  return res.json();
}

export async function fetchLegal(slug: string) {
  const res = await fetch(`${API}/legal/${slug}`);
  if (!res.ok) throw new Error('Legal failed');
  return res.json();
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('ranzo_admin_token');
}
