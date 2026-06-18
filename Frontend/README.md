# Ranzo Mobile App

Expo / React Native app for home services (customer ↔ technician) and job portal (seeker ↔ employer). Screens use internal IDs such as **M-C01** (customer), **M-T05** (technician), **M-E04** (employer), **M-S06** (seeker), **M-00x** (shared auth/bootstrap).

**Languages:** English, Hindi, Telugu (`app/language.tsx`, `core/i18n/`).

**Demo mode:** Enabled in `__DEV__` or when `EXPO_PUBLIC_DEMO_MODE=1`. Many flows use in-app mock APIs.

---

## Development

| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server (LAN) |
| `npm run start:tunnel` | Expo with tunnel (for devices off LAN) |
| `npm run android` / `ios` | Open on device/emulator |
| `npm run typecheck` | TypeScript check |

---

## Navigation overview

```
Language (M-002) → Login/Register (M-003) → OTP (M-004) → Role select (M-005)
    ├─ WORK → Customer or Technician onboarding → role tabs
    └─ JOB  → Seeker or Employer onboarding → role tabs
```

---

## Shared / bootstrap screens

### M-002 — Language selection
**Route:** `app/language.tsx`

| Field / control | Type | Information collected |
|-----------------|------|------------------------|
| Language | Choice (tap) | `en` \| `hi` \| `te` — persisted and applied app-wide |

No text inputs. After selection: first launch → login; if already signed in → go back.

---

### M-003 — Login
**Route:** `app/auth/login.tsx`

| Field | Type | Information collected |
|-------|------|------------------------|
| Mobile number | Text (+91 prefix) | 10-digit Indian mobile; validated before OTP |
| Terms agreement | Checkbox | User must agree to continue |

**Actions:** Request OTP → navigates to M-004 with `flow=login`.

**Displayed:** Welcome title, phone validation hints, link to register.

---

### M-004 — OTP verification
**Route:** `app/auth/otp.tsx`

| Field | Type | Information collected |
|-------|------|------------------------|
| OTP | 6-digit code | Verifies phone for login or register |

**Displayed:** Masked phone, resend cooldown (30s), demo hint in dev.

**Flows:** `login` — completes session; `register` — creates account then M-005.

---

### Register (no separate M-ID)
**Route:** `app/auth/register.tsx`

| Field | Type | Information collected |
|-------|------|------------------------|
| Full name | Text | Display name for account |
| Mobile number | Text (+91) | 10-digit Indian mobile |
| Password | Secure text | Strength rules via checklist |
| Confirm password | Secure text | Must match password |

Role is **not** chosen here; user picks role on M-005 after OTP.

---

### M-005 — Role selection
**Routes:**  
- `app/onboarding/select-role/index.tsx` — main fork  
- `app/onboarding/select-role/work.tsx` — Customer or Technician  
- `app/onboarding/select-role/job.tsx` — Seeker or Employer  

| Screen | Fields | Information |
|--------|--------|-------------|
| Main | None (cards) | **WORK** (services) vs **JOB** (job portal) |
| WORK | None (cards) | **Customer** or **Technician** |
| JOB | None (cards) | **Seeker** or **Employer** |

---

### M-X01 — Profile (per role)
**Routes:**  
- Customer: `app/(customer)/(tabs)/profile.tsx`  
- Technician: `app/(technician)/(tabs)/profile.tsx`  
- Seeker: `app/(seeker)/(tabs)/profile.tsx`  
- Employer: `app/(employer)/(tabs)/profile.tsx`  

**Displayed:** Name, phone, role-specific summary, links to settings/language/logout.  
**Forms:** None on tab itself; edit flows live in onboarding wizards.

---

### M-X02 — Notification settings
**Route:** `app/settings/notifications.tsx`

| Field | Type | Information |
|-------|------|-------------|
| Push notifications | Toggle | Master push on/off |
| SMS notifications | Toggle | SMS on/off |
| In-app notifications | Toggle | In-app on/off |

**Displayed:** Quiet hours note, daily cap (read-only demo value).

---

### M-X04 — Privacy
**Route:** `app/settings/privacy.tsx`  
**Displayed:** Privacy policy content. **No form.**

---

### M-X05 — Help & support
**Route:** `app/settings/help.tsx`  
**Displayed:** FAQ / contact info. **No form.**

---

### M-X06 — About
**Route:** `app/settings/about.tsx`  
**Displayed:** App version, company info. **No form.**

---

## Customer module (M-C01 – M-C08)

### M-C01 — Profile wizard
**Route:** `app/onboarding/customer/profile.tsx`

| Field | Type | Information collected |
|-------|------|------------------------|
| Photo | Camera / gallery | Profile image URI (local) |
| Full name | Text * | Min 2 characters |
| Email | Text | Optional contact email |
| City | Autocomplete text * | City from suggestions list |

---

### M-C02 — Saved addresses
**Route:** `app/onboarding/customer/addresses.tsx`

**List displayed:** Label, line 1, city, pincode, default flag per address.

**Add / edit address modal:**

| Field | Type | Information collected |
|-------|------|------------------------|
| Label | Text | e.g. Home, Office |
| Address line | Text * | Street / building |
| City | Text * | City name |
| Pincode | Text | 6-digit pincode |

Requires ≥1 address to continue to home tabs.

---

### M-C03 — Customer home
**Route:** `app/(customer)/(tabs)/index.tsx`

**Displayed:** Greeting, service category grid (7 categories from catalog), quick actions.  
**Forms:** None — tap category → M-C04.

---

### M-C04 — Subcategory selection
**Route:** `app/(customer)/services/[categoryId].tsx`

**Displayed:** Category name, list of subcategories with price range and duration.  
**Forms:** None — tap subcategory → M-C05 with `categoryId` + `subcategoryId`.

---

### M-C05 — Booking composer
**Route:** `app/(customer)/book.tsx`

| Field | Type | Information collected |
|-------|------|------------------------|
| When | Chips | `now` or `schedule` |
| Scheduled date/time | DateTime picker | ISO timestamp (if scheduled) |
| Service address | Selection | One saved address (`addressId`) |
| Special instructions | Multiline text | Gate code, parking, etc. |

**Displayed:** Subcategory name, category, estimated price breakdown (min–max range, total estimate).

**Action:** Book now → creates booking → M-C06.

---

### M-C06 — Booking status (searching)
**Route:** `app/(customer)/booking/[id].tsx`

**Displayed:** Booking ID, status animation, technician card when assigned, retry on failure.  
**Forms:** None — polls until technician accepts, then auto-navigates to M-C07.

---

### M-C07 — Live tracking
**Route:** `app/(customer)/booking/[id]/tracking.tsx`

**Displayed:** Technician name/photo/rating, ETA, map placeholder, phase steps (en route → arrived → in progress → complete), call/chat actions.  
**Forms:** None — read-only progress synced from technician M-T06.

---

### M-C08 — Service completion
**Route:** `app/(customer)/booking/[id]/complete.tsx`

**Displayed:** Bill summary (line items, materials, labour, total), technician name.

| Field | Type | When | Information collected |
|-------|------|------|------------------------|
| Approve / Dispute | Buttons | First | Approve work or open dispute |
| Dispute reason | Multiline text | Dispute modal | Reason for dispute |
| Star rating | 1–5 stars | After approve | Overall rating |
| Rating tags | Multi-select chips | After approve | e.g. punctual, professional, skilled |
| Written review | Text | After approve | Optional review text |

---

### Customer tabs (no separate M-ID)

| Tab | Route | Content |
|-----|-------|---------|
| Bookings | `app/(customer)/(tabs)/bookings.tsx` | Past/upcoming bookings list |
| Profile | `app/(customer)/(tabs)/profile.tsx` | Account menu → settings, language |

---

## Technician module (M-T01 – M-T08)

### M-T01 — Personal info
**Route:** `app/onboarding/technician/step-1.tsx`

| Field | Type | Information collected |
|-------|------|------------------------|
| Photo | Gallery | Profile image URI |
| Full name | Text * | Legal / display name |
| Date of birth | Date picker * | ISO date (YYYY-MM-DD) |
| Gender | Chips | male \| female \| other |
| Location | Text + GPS button | Service base location string |

---

### M-T02 — Aadhaar verification
**Route:** `app/onboarding/technician/step-2.tsx`

| Field | Type | Information collected |
|-------|------|------------------------|
| Aadhaar number | Text (12 digits) | Identity number; verify API |
| DigiLocker | Button | Opens `digilocker.tsx` for OAuth-style auth |

Must verify before continue.

---

### M-T03 — Services & rates
**Route:** `app/onboarding/technician/step-3.tsx`

| Field | Type | Information collected |
|-------|------|------------------------|
| Services offered | Multi-select chips | Subcategories from service catalog |
| Hourly rate (₹) | Text per service | Rate per selected subcategory |
| Experience (years) | Text per service | Years of experience |
| Working hours start | Text | e.g. 09:00 |
| Working hours end | Text | e.g. 18:00 |
| Working days | Multi-select chips | Mon–Sun |
| Service radius | Slider | km radius for job matching |

---

### M-T04 — Payout account
**Route:** `app/onboarding/technician/payouts.tsx`

| Field | Type | Information collected |
|-------|------|------------------------|
| Account holder name | Text * | Bank account name |
| Account number | Text * | Min 8 digits |
| IFSC | Text * | 11-character IFSC |

Razorpay verification (demo) before entering technician home.

---

### M-T05 — Technician home
**Route:** `app/(technician)/(tabs)/index.tsx`

| Field | Type | Information |
|-------|------|-------------|
| Online / Offline | Toggle | Availability for dispatch |

**Displayed:** Incoming customer offer (accept/decline), active job card, earnings snippet.  
**Forms:** Only online toggle; accept/decline are actions.

---

### M-T06 — Active service detail
**Route:** `app/(technician)/service/[id].tsx`

**Displayed:** Customer name, address, service type, step progress.

| Field | Type | Step | Information |
|-------|------|------|---------------|
| Materials used | Text | Materials step | Parts / materials description |
| Before / after photos | Camera | Photo steps | Captured locally (demo) |

**Workflow steps:** Arrived → Started work → Photo before → Materials → Photo after → Mark complete. Syncs customer tracking (M-C07).

---

### M-T07 — Wallet
**Route:** `app/(technician)/(tabs)/wallet.tsx`

**Displayed:** Balance, transaction list, payout status. **No input form.**

---

### M-T08 — Job history
**Routes:**  
- `app/(technician)/(tabs)/jobs.tsx` (tab)  
- `app/(technician)/job-history.tsx` (detail list)

**Displayed:** Completed jobs with date, service, earnings. **No form.**

---

## Employer module (M-E01 – M-E15)

### M-E01 — Company info
**Route:** `app/onboarding/employer/step-1.tsx`

| Field | Type | Information collected |
|-------|------|------------------------|
| Company logo | Image picker | Logo URI |
| Company name | Text * | Min 2 characters |
| Industry | Single chip | From `INDUSTRIES` list |
| Sub-industry | Text | Free text |
| Company size | Single chip | From `COMPANY_SIZES` list |
| Company description | Multiline | About the company |

---

### M-E02 — Verification
**Route:** `app/onboarding/employer/step-2.tsx`

| Field | Type | Information collected |
|-------|------|------------------------|
| GSTIN | Text (15 chars) * | Validated format; verify API |
| PAN | Text | Optional, 10 chars |
| MSME | Text | Optional registration |

Continue requires GST verified or pending review.

---

### M-E03 — Address & contact
**Route:** `app/onboarding/employer/step-3.tsx`

| Field | Type | Information collected |
|-------|------|------------------------|
| Office address | Places autocomplete * | Full address string |
| Hiring contact name | Text * | Recruiter name |
| Email | Text * | Valid email |
| Phone | Text (+91) | Contact mobile |

---

### M-E04 — Employer dashboard
**Route:** `app/(employer)/(tabs)/index.tsx`

**Displayed:** Active jobs count, applicants summary, post job CTA, subscription hint. **No form.**

---

### M-E05 – M-E08 — Post a job (4-step wizard)

#### M-E05 — Basics
**Route:** `app/(employer)/post-job/step-1.tsx`

| Field | Type | Information collected |
|-------|------|------------------------|
| Job title | Text * | Min 3 characters; AI suggestions from past posts |
| Sector | Text * | Industry sector |
| Sub-sector | Text | Narrower sector |
| Employment type | Chip | Full-time, Part-time, Contract, etc. |
| Vacancies | Number | Headcount |

#### M-E06 — Description
**Route:** `app/(employer)/post-job/step-2.tsx`

| Field | Type | Information collected |
|-------|------|------------------------|
| Description | Multiline | Role responsibilities |
| Required skills | Multi-select chips | Up to 8 skills |
| Experience range | Dual slider | Min–max years |
| Education | Button group | Minimum education level |

#### M-E07 — Location & compensation
**Route:** `app/(employer)/post-job/step-3.tsx`

| Field | Type | Information collected |
|-------|------|------------------------|
| Job address | Places autocomplete | Work location |
| Salary min / max | Text (₹) | Compensation range |
| Period | Text | month \| day \| hour |
| Working hours | Text | e.g. 9 AM – 6 PM |
| Benefits | Multi-select chips | PF, health insurance, etc. |

#### M-E08 — Review & publish
**Route:** `app/(employer)/post-job/step-4.tsx`

**Displayed:** Summary of all prior steps.  
**Forms:** Publish / save draft actions only.

---

### M-E09 — My jobs
**Route:** `app/(employer)/(tabs)/jobs.tsx`

**Displayed:** Job cards (title, status, applicants count). Actions: view, edit, close. **No create form** (uses post-job wizard).

---

### M-E10 — Applicants list
**Route:** `app/(employer)/(tabs)/applicants.tsx`

**Displayed:** Applicants per job with status filters. **No form.**

---

### M-E11 — Applicant detail
**Route:** `app/(employer)/applicant/[id].tsx`

**Displayed:** Seeker profile, skills, experience, application status.  
**Actions:** Shortlist, reject, schedule interview (buttons). **No text form** on main view.

---

### M-E12 — Walk-in drives
**Routes:**  
- `app/(employer)/(tabs)/walk-ins.tsx` — list  
- `app/(employer)/walk-in/new.tsx` — composer  

**Walk-in composer form:**

| Field | Type | Information collected |
|-------|------|------------------------|
| Linked job | Chip | Active job ID |
| Drive date | Date picker | Walk-in date |
| Time slots | Text (comma-separated) | e.g. `9–10 AM, 10–11 AM` |
| Address | Places autocomplete | Venue (defaults to job location) |
| Capacity per slot | Number | Max candidates per slot |
| Special instructions | Multiline | Directions for candidates |

Creates drive + demo QR code.

---

### M-E14 — Walk-in live dashboard
**Route:** `app/(employer)/walk-in/live.tsx`

**Displayed:** Check-in counts, slot occupancy, QR. **No input form.**

---

### M-E15 — Subscription
**Route:** `app/(employer)/subscription.tsx`

| Field | Type | Information |
|-------|------|-------------|
| Plan upgrade | Button | free \| standard \| premium |
| Update payment | Button | Demo card update |

**Displayed:** Current tier, plan features, billing history.

---

## Seeker module (M-S01 – M-S12)

Seeker onboarding is a **4-step wizard** under `app/onboarding/seeker/`.

### Step 1 — Basic info (`step-1.tsx`)

| Field | Type | Information collected |
|-------|------|------------------------|
| Photo | Camera / gallery | Profile image |
| Full name | Text * | Min 2 characters |
| Date of birth | Date picker * | Must be 18+ |
| Gender | Chips | male, female, other, prefer_not_to_say |
| Email | Text | Optional |
| Current city | Autocomplete * | City from list |

---

### Step 2 — Skills (`step-2.tsx`)

| Field | Type | Information collected |
|-------|------|------------------------|
| Skill search | Text | Filter skill catalog |
| Selected skills | List | Up to 10 skills |
| Level per skill | Chips | beginner \| intermediate \| expert |

---

### Step 3 — Experience & education (`step-3.tsx`)

**Work experience modal:**

| Field | Type | Information |
|-------|------|-------------|
| Company | Text | Employer name |
| Role | Text | Job title |
| Start date | Text | Start (YYYY-MM or free text) |
| End date | Text | End or empty if current |
| Description | Text | Optional responsibilities |

**Education modal:**

| Field | Type | Information |
|-------|------|-------------|
| Degree | Text | Qualification |
| Institution | Text | School / college |
| Year | Text | Graduation year |
| Score | Text | GPA / percentage |

---

### Step 4 — Preferences (`step-4.tsx`)

| Field | Type | Information collected |
|-------|------|------------------------|
| Languages spoken | Multi chips + proficiency | Language + basic/intermediate/fluent |
| Salary min / max | Text (₹) | Expected range |
| Salary period | Chips | month \| day \| hour |
| Availability | Single chip | immediate, within 15/30 days, 60+ days |
| Open to relocate | Toggle | Boolean |

**Preview:** `app/onboarding/seeker/preview.tsx` — read-only summary before finishing.

---

### M-S06 — Seeker home
**Route:** `app/(seeker)/(tabs)/index.tsx`

**Displayed:** Recommended jobs, categories, recent activity. **No form.**

---

### M-S07 — Search
**Route:** `app/(seeker)/(tabs)/search.tsx`

| Field | Type | Information |
|-------|------|-------------|
| Search query | Text | Filters job list |
| Filters | Chips / toggles | Location, type, etc. (UI filters) |

---

### M-S08 — Job detail
**Route:** `app/(seeker)/job/[id].tsx`

**Displayed:** Title, company, salary, skills, description, apply CTA. **No form** on detail page.

---

### M-S09 — Apply confirmation
**Route:** `app/(seeker)/job/[id]/apply.tsx`

| Field | Type | Information collected |
|-------|------|------------------------|
| Cover message | Multiline | Optional, max 500 chars |
| Salary min / max | Text (₹) | Optional override of profile expectation |

---

### M-S10 — Saved jobs
**Route:** `app/(seeker)/(tabs)/saved.tsx`

**Displayed:** Bookmarked jobs. **No form.**

---

### M-S11 — My applications
**Route:** `app/(seeker)/applications/index.tsx`

**Displayed:** Application status list. **No form.**

---

### M-S12 — Application detail
**Route:** `app/(seeker)/applications/[id].tsx`

**Displayed:** Status timeline, employer notes. **No form.**

---

## End-to-end flows (demo)

### Customer books a technician
1. Technician: M-T05 → go **Online**
2. Customer: M-C03 → category → M-C04 → M-C05 → book
3. M-C06 polls → technician **Accept** on M-T05
4. M-C07 tracking ← M-T06 step updates
5. Technician completes M-T06 → M-C08 approve + rate

### Seeker applies to employer job
1. Employer: M-E05–E08 publish job
2. Seeker: M-S06 / M-S07 → M-S08 → M-S09 apply
3. Employer: M-E10 → M-E11 review applicant

---

## Service catalog (customer)

Defined in `features/customer/mock/catalog.ts`:

| Category | Example subcategories |
|----------|----------------------|
| Appliance | AC repair, washing machine, refrigerator |
| Electrical | Wiring, fan, switchboard |
| Plumbing | Tap, toilet, geyser |
| Cleaning | Deep clean, bathroom, kitchen |
| Carpentry | Door, furniture, modular kitchen |
| Painting | Interior, exterior, touch-up |
| Pest control | Cockroach, termite, general |

Each subcategory has `priceMin`, `priceMax`, and estimated duration shown on M-C04–M-C05.

---

## File map (main routes)

| Area | Path prefix |
|------|-------------|
| Auth | `app/auth/` |
| Onboarding | `app/onboarding/` |
| Customer | `app/(customer)/` |
| Technician | `app/(technician)/` |
| Employer | `app/(employer)/` |
| Seeker | `app/(seeker)/` |
| Settings | `app/settings/` |
| i18n | `core/i18n/locales/{en,hi,te}.ts` |
| APIs | `core/api/` |
| Demo portal state | (Removed) |

---

## Legacy routes

Older **worker** and **employer** job flows under `app/(worker)/` and some `app/(employer)/dashboard.tsx` paths may still exist for demos. Primary product flows use the role-prefixed tab layouts above.
