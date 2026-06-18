import { apiFetch } from '@/core/api/client';
import { apiV1Path } from '@/core/config/api';

export type Booking = {
  id: string;
  customer_id: string;
  technician_id: string | null;
  category: string;
  location: string;
  latitude: number;
  longitude: number;
  status: string; // searching, pending_selection, in_progress, completed, cancelled
  accepted_technicians: string[];
  booking_datetime: string;
};

export type BookingCreate = {
  category: string;
  location: string;
  latitude: number;
  longitude: number;
};

export async function createBooking(payload: BookingCreate): Promise<Booking> {
  return apiFetch<Booking>(apiV1Path('/bookings/'), {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function getActiveBookings(role: 'customer' | 'technician'): Promise<Booking[]> {
  return apiFetch<Booking[]>(apiV1Path(`/bookings/active?role=${role}`), {
    method: 'GET',
    auth: true,
  });
}

export async function getHistoryBookings(role: 'customer' | 'technician'): Promise<Booking[]> {
  return apiFetch<Booking[]>(apiV1Path(`/bookings/history?role=${role}`), {
    method: 'GET',
    auth: true,
  });
}

export async function acceptBooking(bookingId: string): Promise<{ msg: string }> {
  return apiFetch<{ msg: string }>(apiV1Path(`/bookings/${bookingId}/accept`), {
    method: 'POST',
    auth: true,
  });
}

export async function confirmTechnician(bookingId: string, technicianId: string): Promise<{ msg: string }> {
  return apiFetch<{ msg: string }>(apiV1Path(`/bookings/${bookingId}/confirm?technician_id=${technicianId}`), {
    method: 'POST',
    auth: true,
  });
}
