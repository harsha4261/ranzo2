const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const TOKEN_COOKIE = 'ranzo_admin_token';
const TOKEN_STORAGE_KEY = 'ranzo_admin_token';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function adminLogin(username: string, password: string) {
  const res = await fetch(`${API}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: username, password }),
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json() as Promise<{ access_token: string }>;
}

export async function fetchDashboard(token: string) {
  const res = await fetch(`${API}/admin/dashboard`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Dashboard failed');
  return res.json() as Promise<{
    job_portal: Record<string, number>;
    home_services: Record<string, number>;
  }>;
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

export type Booking = {
  id: string;
  customer_id: string;
  technician_id?: string | null;
  status: string;
  category: string;
  location: { latitude: number; longitude: number };
  address_details: { house_flat: string; landmark: string; city: string; zip_code: string };
  problem_description: string;
  images: string[];
  urgency_level: string;
  timeline: {
    booked_at: string;
    accepted_at?: string | null;
    in_transit_at?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
  };
  created_at: string;
  updated_at: string;
};

export async function fetchServiceBookings(
  token: string,
  params?: { status?: string; category?: string; skip?: number; limit?: number }
) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.category) qs.set('category', params.category);
  if (params?.skip != null) qs.set('skip', String(params.skip));
  if (params?.limit != null) qs.set('limit', String(params.limit));
  const suffix = qs.toString() ? `?${qs}` : '';
  const res = await fetch(`${API}/admin/service-bookings${suffix}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Service bookings failed');
  return res.json() as Promise<{ items: Booking[]; total: number }>;
}

export type AdminTechnician = {
  user_id: string;
  name?: string | null;
  phone_number?: string | null;
  business_name?: string | null;
  verified: boolean;
  aadhaar_verified: boolean;
  online_status: string;
};

// Note: the backend does not support filtering this list server-side —
// it always returns every technician. Callers should filter client-side.
export async function fetchTechnicians(token: string) {
  const res = await fetch(`${API}/admin/technicians`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Technicians failed');
  return res.json() as Promise<{ items: AdminTechnician[]; total: number }>;
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

export type WalkInDrive = {
  _id: string;
  employer_id: string;
  job_id: string;
  drive_date: string;
  time_slots: string[];
  address: string;
  capacity_per_slot: number;
  instructions?: string | null;
  checked_in_count: number;
  created_at: string;
};

// Note: the backend does not support a status filter (walk-in drives don't
// even have a status field) — it only supports skip/limit pagination.
export async function fetchWalkInDrives(token: string, params?: { skip?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.skip != null) qs.set('skip', String(params.skip));
  if (params?.limit != null) qs.set('limit', String(params.limit));
  const suffix = qs.toString() ? `?${qs}` : '';
  const res = await fetch(`${API}/admin/walk-in-drives${suffix}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Walk-in drives failed');
  return res.json() as Promise<{ items: WalkInDrive[]; total: number }>;
}

export type Analytics = {
  total_users: number;
  total_technicians: number;
  total_bookings: number;
  bookings_by_status: Record<string, number>;
  total_revenue: number;
  total_jobs: number;
  total_applications: number;
  technicians_online: number;
};

export async function fetchAnalytics(token: string) {
  const res = await fetch(`${API}/admin/analytics`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Analytics failed');
  return res.json() as Promise<Analytics>;
}

export type Dispute = {
  _id: string;
  customer_id: string;
  technician_id: string;
  booking_id: string;
  customer_rating?: number | null;
  technician_rating?: number | null;
  customer_review?: string | null;
  technician_review?: string | null;
  dispute_raised: boolean;
  dispute_reason?: string | null;
  dispute_status?: string | null;
  created_at: string;
};

export async function fetchDisputes(token: string, disputeStatus?: string) {
  const qs = disputeStatus ? `?dispute_status=${encodeURIComponent(disputeStatus)}` : '';
  const res = await fetch(`${API}/admin/disputes${qs}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Disputes failed');
  return res.json() as Promise<{ items: Dispute[]; total: number }>;
}

export async function resolveDispute(
  token: string,
  bookingId: string,
  body: { action: 'RESOLVE' | 'REFUND_TECH_FEE'; note?: string }
) {
  const res = await fetch(`${API}/admin/disputes/${bookingId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Resolve failed');
  return res.json() as Promise<{ message: string }>;
}

export type AppConfig = {
  _id: string;
  maintenance_mode: boolean;
  escrow_hold_amount: number;
  support_phone?: string | null;
};

export async function fetchConfig(token: string) {
  const res = await fetch(`${API}/admin/config`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Config failed');
  return res.json() as Promise<AppConfig>;
}

export async function patchConfig(
  token: string,
  body: Partial<Pick<AppConfig, 'maintenance_mode' | 'escrow_hold_amount' | 'support_phone'>>
) {
  const res = await fetch(`${API}/admin/config`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Config patch failed');
  return res.json() as Promise<AppConfig>;
}

export type AuditLogEntry = {
  _id: string;
  admin_id: string;
  action: string;
  target: string;
  details?: Record<string, unknown> | null;
  created_at: string;
};

export async function fetchAuditLog(token: string, params?: { skip?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.skip != null) qs.set('skip', String(params.skip));
  if (params?.limit != null) qs.set('limit', String(params.limit));
  const suffix = qs.toString() ? `?${qs}` : '';
  const res = await fetch(`${API}/admin/audit-log${suffix}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Audit failed');
  return res.json() as Promise<{ items: AuditLogEntry[]; total: number }>;
}

export type ApplicationLogEntry = {
  id: string;
  job_id: string;
  job_title?: string | null;
  seeker_id: string;
  seeker_name?: string | null;
  employer_id: string;
  status?: string | null;
  created_at: string;
};

// Note: the backend only supports skip/limit for this endpoint — there is no
// server-side category/level/user_id/request_id/search filtering.
export async function fetchApplicationLogs(token: string, params?: { skip?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.skip != null) qs.set('skip', String(params.skip));
  if (params?.limit != null) qs.set('limit', String(params.limit));
  const suffix = qs.toString() ? `?${qs}` : '';
  const res = await fetch(`${API}/admin/application-logs${suffix}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Application logs failed');
  return res.json() as Promise<{ items: ApplicationLogEntry[]; total: number }>;
}

export type ModerationJob = {
  _id: string;
  employer_id: string;
  title: string;
  sector: string;
  sub_sector?: string | null;
  employment_type: string;
  vacancies: number;
  description: string;
  required_skills: string[];
  experience_min: number;
  experience_max: number;
  education?: string | null;
  job_address: string;
  salary_min: number;
  salary_max: number;
  salary_period: string;
  working_hours?: string | null;
  benefits: string[];
  status: string;
  moderation_status: string;
  moderation_note?: string | null;
  created_at: string;
  updated_at: string;
};

// Always returns jobs with moderation_status == PENDING — there is no filter param.
export async function fetchJobsModeration(token: string, params?: { skip?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.skip != null) qs.set('skip', String(params.skip));
  if (params?.limit != null) qs.set('limit', String(params.limit));
  const suffix = qs.toString() ? `?${qs}` : '';
  const res = await fetch(`${API}/admin/jobs/moderation${suffix}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Jobs failed');
  return res.json() as Promise<{ items: ModerationJob[]; total: number }>;
}

export async function moderateJob(
  token: string,
  jobId: string,
  body: { decision: 'APPROVED' | 'REJECTED'; note?: string }
) {
  const res = await fetch(`${API}/admin/jobs/${jobId}/moderation`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Moderate failed');
  return res.json() as Promise<ModerationJob>;
}

export type WalletTransaction = {
  _id: string;
  technician_id: string;
  type: string;
  amount: number;
  running_balance: number;
  description?: string | null;
  related_booking_id?: string | null;
  created_at: string;
};

export type WalletOverviewItem = {
  technician_id: string;
  balance: number;
  status?: string | null;
  last_recharge_date?: string | null;
  last_transaction?: WalletTransaction | null;
};

// This is a wallet-balance overview, not a payout-approval workflow — there
// is no real payout system; technicians pay the platform a lead fee out of
// this wallet, they aren't paid out through it.
export async function fetchPayouts(token: string, params?: { skip?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.skip != null) qs.set('skip', String(params.skip));
  if (params?.limit != null) qs.set('limit', String(params.limit));
  const suffix = qs.toString() ? `?${qs}` : '';
  const res = await fetch(`${API}/admin/payouts${suffix}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Payouts failed');
  return res.json() as Promise<{ items: WalletOverviewItem[]; total: number }>;
}

// Manual wallet credit/debit — the interim way an admin tops up (or
// corrects) a technician's wallet since Razorpay isn't live yet.
export async function adjustWallet(
  token: string,
  technicianId: string,
  body: { amount: number; reason: string }
) {
  const res = await fetch(`${API}/admin/wallet/${technicianId}/adjust`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Wallet adjustment failed');
  return res.json() as Promise<{ message: string; wallet: Record<string, unknown> }>;
}

export type VerificationTechnician = {
  id: string;
  user_id: string;
  name_as_per_adhar?: string | null;
  adhar_number?: string | null;
  adhar_image_url?: string | null;
  photo_url?: string | null;
  village_city?: string | null;
  pin_code?: string | null;
  district?: string | null;
  state?: string | null;
  location?: string | null;
  online_status: boolean;
  is_completed: boolean;
  is_approved: boolean;
};

// This is a KYC review queue (technicians with an Aadhaar number on file who
// aren't approved yet). There's no dedicated verify/reject endpoint — act on
// these via approveTechnician / rejectTechnician using user_id.
export async function fetchVerifications(token: string) {
  const res = await fetch(`${API}/admin/verifications`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Verifications failed');
  return res.json() as Promise<{ items: VerificationTechnician[]; total: number }>;
}

export async function fetchLegal(slug: string) {
  const res = await fetch(`${API}/legal/${slug}`);
  if (!res.ok) throw new Error('Legal failed');
  return res.json();
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// The cookie is the source of truth (middleware.ts reads it to gate access
// to protected pages); sessionStorage is kept only as a fallback.
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return readCookie(TOKEN_COOKIE) ?? sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}
