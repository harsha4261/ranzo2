export type Role = 'worker' | 'employer';

export type AppMode = 'job-portal' | 'home-services';

/** Platform API v1 roles (`/api/v1/auth`). */
export type PlatformRole = 'seeker' | 'employer' | 'customer' | 'technician';

/** Legacy session-token roles (deprecated). */
export type BackendRole =
  | 'seeker'
  | 'employer'
  | 'requester'
  | 'service-provider';

export type Skill =
  | 'Electrician'
  | 'Plumber'
  | 'AC Technician'
  | 'Carpenter'
  | 'Painter'
  | 'Driver'
  | 'Mason'
  | 'Helper';

export const ALL_SKILLS: Skill[] = [
  'Electrician',
  'Plumber',
  'AC Technician',
  'Carpenter',
  'Painter',
  'Driver',
  'Mason',
  'Helper',
];

export type Experience = '0–1 yr' | '1–3 yrs' | '3+ yrs';
export const EXPERIENCE_OPTIONS: Experience[] = ['0–1 yr', '1–3 yrs', '3+ yrs'];

export type DurationOption = '1 hr' | '2 hrs' | 'Half day' | 'Full day';
export const DURATION_OPTIONS: DurationOption[] = [
  '1 hr',
  '2 hrs',
  'Half day',
  'Full day',
];

export type User = {
  id: string;
  phone: string;
  role: Role;
  name: string;
  rating?: number;
  jobsCompleted?: number;
  createdAt?: string;
  isDetailsFilled?: boolean;
};

export type WorkerProfile = User & {
  role: 'worker';
  skills?: Skill[];
  experience?: Experience;
  lat?: number;
  lng?: number;
  address?: string;
  online?: boolean;
};

export type EmployerProfile = User & {
  role: 'employer';
  defaultLocation?: { lat: number; lng: number; address: string };
};

export type JobStatusServer =
  | 'pending'
  | 'matching'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'expired';

export type Job = {
  id: string;
  type: Skill;
  employerId: string;
  employerName: string;
  employerPhone: string;
  workerId?: string;
  workerName?: string;
  workerPhone?: string;
  lat: number;
  lng: number;
  area: string;
  address: string;
  distanceKm: number;
  pay: number;
  duration: DurationOption;
  durationLabel: string;
  notes?: string;
  status: JobStatusServer;
  createdAt: number;
  expiresAt?: number;
  scheduledStart?: number;
};

export type WorkerCandidate = {
  id: string;
  name: string;
  phone: string;
  rating: number;
  jobsCompleted: number;
  distanceKm: number;
  skills: Skill[];
  experienceLabel: string;
};

export const SKILL_PAY_RANGE: Record<Skill, [number, number]> = {
  Electrician: [400, 800],
  Plumber: [350, 700],
  'AC Technician': [500, 1000],
  Carpenter: [400, 900],
  Painter: [350, 700],
  Driver: [500, 1200],
  Mason: [400, 900],
  Helper: [200, 500],
};
