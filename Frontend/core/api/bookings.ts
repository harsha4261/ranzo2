import { apiFetch } from '@/core/api/client';
import { apiV1Path } from '@/core/config/api';

export type AddressDetails = {
  house_flat: string;
  landmark: string;
  city: string;
  zip_code: string;
};

export type Location = {
  latitude: number;
  longitude: number;
};

export type TimelineResponse = {
  booked_at: string;
  accepted_at?: string;
  in_transit_at?: string;
  started_at?: string;
  completed_at?: string;
};

export type VerificationResponse = {
  start_otp: string;
  end_otp: string;
};

export type Booking = {
  id: string;
  customer_id: string;
  technician_id: string | null;
  status: 'CREATED' | 'BROADCASTING' | 'TECH_ACCEPTED' | 'CUSTOMER_CONFIRMED' | 'IN_TRANSIT' | 'IN_PROGRESS' | 'PENDING_RATING' | 'COMPLETED' | 'CANCELLED_BY_CUSTOMER' | 'CANCELLED_BY_TECH' | 'EXPIRED' | 'DISPUTED';
  category: string;
  location: Location;
  address_details: AddressDetails;
  problem_description: string;
  images: string[];
  urgency_level: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  verification?: VerificationResponse;
  timeline: TimelineResponse;
  created_at: string;
  updated_at: string;
};

export type BookingCreate = {
  category: string;
  location: Location;
  address_details: AddressDetails;
  problem_description: string;
  images?: string[];
  urgency_level?: string;
};

export async function createBooking(payload: BookingCreate): Promise<Booking> {
  return apiFetch<Booking>(apiV1Path('/bookings/'), {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function acceptBooking(bookingId: string): Promise<{ msg: string; booking: Booking }> {
  return apiFetch<{ msg: string; booking: Booking }>(apiV1Path(`/bookings/${bookingId}/accept`), {
    method: 'POST',
    auth: true,
  });
}

export async function confirmTechnician(bookingId: string, technicianId?: string): Promise<{ msg: string }> {
  return apiFetch<{ msg: string }>(apiV1Path(`/bookings/${bookingId}/confirm`), {
    method: 'POST',
    auth: true,
  });
}

export async function getActiveBookings(role: 'customer' | 'technician'): Promise<Booking[]> {
  return apiFetch<Booking[]>(apiV1Path(`/bookings/active?role=${role}`), {
    method: 'GET',
    auth: true,
  });
}

export async function getBookingHistory(role: 'customer' | 'technician'): Promise<Booking[]> {
  return apiFetch<Booking[]>(apiV1Path(`/bookings/history?role=${role}`), {
    method: 'GET',
    auth: true,
  });
}

export async function startJourney(bookingId: string): Promise<{ msg: string }> {
  return apiFetch<{ msg: string }>(apiV1Path(`/bookings/${bookingId}/transit`), {
    method: 'POST',
    auth: true,
  });
}

export async function startJob(bookingId: string, otp: string): Promise<{ msg: string }> {
  return apiFetch<{ msg: string }>(apiV1Path(`/bookings/${bookingId}/start`), {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ status: 'IN_PROGRESS', otp }),
  });
}

export async function completeJob(bookingId: string, otp: string): Promise<{ msg: string }> {
  return apiFetch<{ msg: string }>(apiV1Path(`/bookings/${bookingId}/complete`), {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ status: 'COMPLETED', otp }),
  });
}

export async function cancelBooking(bookingId: string, role: 'customer' | 'technician'): Promise<{ msg: string }> {
  return apiFetch<{ msg: string }>(apiV1Path(`/bookings/${bookingId}/cancel?role=${role}`), {
    method: 'POST',
    auth: true,
  });
}
