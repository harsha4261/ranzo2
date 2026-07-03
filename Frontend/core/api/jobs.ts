import { apiFetch } from '@/core/api/client';
import { apiV1Path } from '@/core/config/api';

// ─── Types ──────────────────────────────────────────────────────────────────
// Mirrors backend/app/schemas/job.py and backend/app/models/job.py exactly.

export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | string;
export type SalaryPeriod = 'month' | 'day' | 'hour' | string;

export type Job = {
  id: string;
  employer_id: string;
  title: string;
  sector: string;
  sub_sector?: string | null;
  employment_type: EmploymentType;
  vacancies: number;
  description: string;
  required_skills: string[];
  experience_min: number;
  experience_max: number;
  education?: string | null;
  job_address: string;
  latitude?: number | null;
  longitude?: number | null;
  salary_min: number;
  salary_max: number;
  salary_period: SalaryPeriod;
  working_hours?: string | null;
  benefits: string[];
  status: JobStatus;
  moderation_status: ModerationStatus;
  moderation_note?: string | null;
  created_at: string;
  updated_at: string;
};

export type JobCreate = {
  title: string;
  sector: string;
  sub_sector?: string | null;
  employment_type: EmploymentType;
  vacancies?: number;
  description: string;
  required_skills?: string[];
  experience_min?: number;
  experience_max?: number;
  education?: string | null;
  job_address: string;
  latitude?: number | null;
  longitude?: number | null;
  salary_min: number;
  salary_max: number;
  salary_period?: SalaryPeriod;
  working_hours?: string | null;
  benefits?: string[];
  /** false → saved as DRAFT, true → PUBLISHED (goes to PENDING moderation). */
  publish?: boolean;
};

export type JobUpdate = Partial<Omit<JobCreate, 'publish'>> & {
  /** DRAFT, PUBLISHED, CLOSED — moderation_status is admin-only and not settable here. */
  status?: JobStatus;
};

export type JobListResponse = {
  items: Job[];
  total: number;
};

export type JobApplicationStatus = 'SUBMITTED' | 'SHORTLISTED' | 'REJECTED' | 'INTERVIEW_SCHEDULED' | 'HIRED';

export type JobApplication = {
  id: string;
  job_id: string;
  seeker_id: string;
  employer_id: string;
  cover_message?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  status: JobApplicationStatus;
  created_at: string;
  updated_at: string;
};

export type JobApplicationCreate = {
  cover_message?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
};

export type JobApplicationListResponse = {
  items: JobApplication[];
  total: number;
};

export type WalkInDrive = {
  id: string;
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

export type WalkInDriveCreate = {
  drive_date: string;
  time_slots?: string[];
  address: string;
  capacity_per_slot: number;
  instructions?: string | null;
};

export type WalkInDriveListResponse = {
  items: WalkInDrive[];
  total: number;
};

// ─── Query helpers ──────────────────────────────────────────────────────────

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const pairs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return pairs.length ? `?${pairs.join('&')}` : '';
}

// ─── Jobs (employer-facing create/manage, public browse) ──────────────────

export async function createJob(payload: JobCreate): Promise<Job> {
  return apiFetch<Job>(apiV1Path('/jobs'), {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export type ListJobsParams = {
  sector?: string;
  q?: string;
  employment_type?: string;
  salary_min?: number;
  skip?: number;
  limit?: number;
};

/** Public browse/search — only returns PUBLISHED + APPROVED jobs. */
export async function listJobs(params: ListJobsParams = {}): Promise<JobListResponse> {
  return apiFetch<JobListResponse>(apiV1Path(`/jobs${buildQuery(params)}`), {
    method: 'GET',
    auth: true,
  });
}

export type ListMyJobsParams = { skip?: number; limit?: number };

/** Employer's own jobs, any status/moderation state. */
export async function listMyJobs(params: ListMyJobsParams = {}): Promise<JobListResponse> {
  return apiFetch<JobListResponse>(apiV1Path(`/jobs/mine${buildQuery(params)}`), {
    method: 'GET',
    auth: true,
  });
}

export async function getJob(jobId: string): Promise<Job> {
  return apiFetch<Job>(apiV1Path(`/jobs/${jobId}`), {
    method: 'GET',
    auth: true,
  });
}

export async function updateJob(jobId: string, payload: JobUpdate): Promise<Job> {
  return apiFetch<Job>(apiV1Path(`/jobs/${jobId}`), {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify(payload),
  });
}

// ─── Applications ───────────────────────────────────────────────────────────

export async function applyToJob(jobId: string, payload: JobApplicationCreate): Promise<JobApplication> {
  return apiFetch<JobApplication>(apiV1Path(`/jobs/${jobId}/apply`), {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export type ListApplicantsParams = { skip?: number; limit?: number };

/** Employer-only: applicants for one of their jobs. */
export async function listApplicants(jobId: string, params: ListApplicantsParams = {}): Promise<JobApplicationListResponse> {
  return apiFetch<JobApplicationListResponse>(apiV1Path(`/jobs/${jobId}/applicants${buildQuery(params)}`), {
    method: 'GET',
    auth: true,
  });
}

export type ListMyApplicationsParams = { skip?: number; limit?: number };

/** Seeker-only: their own applications across all jobs. */
export async function listMyApplications(params: ListMyApplicationsParams = {}): Promise<JobApplicationListResponse> {
  return apiFetch<JobApplicationListResponse>(apiV1Path(`/jobs/seeker/applications${buildQuery(params)}`), {
    method: 'GET',
    auth: true,
  });
}

export async function getApplication(applicationId: string): Promise<JobApplication> {
  return apiFetch<JobApplication>(apiV1Path(`/jobs/applications/${applicationId}`), {
    method: 'GET',
    auth: true,
  });
}

/** Employer-only: SHORTLISTED, REJECTED, INTERVIEW_SCHEDULED, or HIRED. */
export async function updateApplicationStatus(
  applicationId: string,
  status: Exclude<JobApplicationStatus, 'SUBMITTED'>
): Promise<JobApplication> {
  return apiFetch<JobApplication>(apiV1Path(`/jobs/applications/${applicationId}`), {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify({ status }),
  });
}

// ─── Walk-in drives ─────────────────────────────────────────────────────────

export async function createWalkInDrive(jobId: string, payload: WalkInDriveCreate): Promise<WalkInDrive> {
  return apiFetch<WalkInDrive>(apiV1Path(`/jobs/${jobId}/walk-ins`), {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function listWalkInDrives(jobId: string): Promise<WalkInDriveListResponse> {
  return apiFetch<WalkInDriveListResponse>(apiV1Path(`/jobs/${jobId}/walk-ins`), {
    method: 'GET',
    auth: true,
  });
}

export async function getWalkInDrive(driveId: string): Promise<WalkInDrive> {
  return apiFetch<WalkInDrive>(apiV1Path(`/jobs/walk-ins/${driveId}`), {
    method: 'GET',
    auth: true,
  });
}

export async function checkInToWalkInDrive(driveId: string, slot: string): Promise<{ msg: string; checked_in_count: number }> {
  return apiFetch<{ msg: string; checked_in_count: number }>(apiV1Path(`/jobs/walk-ins/${driveId}/check-in`), {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ slot }),
  });
}
