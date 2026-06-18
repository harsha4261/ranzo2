import type { Experience, Skill } from '@/data/models';
import { EXPERIENCE_OPTIONS } from '@/data/models';

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function yearsToExperience(years: unknown): Experience | null {
  const n = typeof years === 'number' ? years : Number(years);
  if (!Number.isFinite(n)) return null;
  if (n <= 1) return '0–1 yr';
  if (n <= 3) return '1–3 yrs';
  return '3+ yrs';
}

export function workerFormDefaults(
  profile: Record<string, unknown> | null | undefined,
  fallback?: {
    name?: string;
    skills?: Skill[];
    experience?: Experience;
    lat?: number;
    lng?: number;
    address?: string;
  }
) {
  const p = profile ?? {};
  const name =
    str(p.full_name) ||
    str(p.name) ||
    fallback?.name ||
    '';
  const rawSkills = p.services_offered ?? p.skills;
  const skills = (
    Array.isArray(rawSkills)
      ? rawSkills.filter((s): s is string => typeof s === 'string')
      : fallback?.skills ?? []
  ) as Skill[];

  const experience =
    (typeof p.experience_label === 'string' &&
    EXPERIENCE_OPTIONS.includes(p.experience_label as Experience)
      ? (p.experience_label as Experience)
      : null) ??
    yearsToExperience(p.experience_years ?? p.experience) ??
    fallback?.experience ??
    null;

  const lat =
    typeof p.latitude === 'number' ? p.latitude : fallback?.lat;
  const lng =
    typeof p.longitude === 'number' ? p.longitude : fallback?.lng;
  const address = str(p.address) || fallback?.address || '';
  const city = str(p.city);

  return { name, skills, experience, lat, lng, address, city };
}

export function employerFormDefaults(
  profile: Record<string, unknown> | null | undefined,
  fallback?: { name?: string }
) {
  const p = profile ?? {};
  return {
    fullName: str(p.full_name) || str(p.name) || fallback?.name || '',
    email: str(p.email),
    companyName: str(p.company_name) || fallback?.name || '',
    industry: str(p.industry),
    city: str(p.city),
    address: str(p.address),
    contactName: str(p.hiring_contact_name),
    contactPhone: str(p.hiring_contact_phone),
  };
}
