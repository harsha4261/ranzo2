import { apiFetch } from '@/core/api/client';
import { apiV1Path } from '@/core/config/api';

export type Review = {
  id: string;
  customer_id: string;
  technician_id: string;
  booking_id: string;
  customer_rating?: number | null;
  technician_rating?: number | null;
  customer_review?: string | null;
  technician_review?: string | null;
  created_at: string;
};

export type ReviewCreate = {
  booking_id: string;
  rating: number;
  review?: string | null;
};

export async function createReview(role: 'customer' | 'technician', payload: ReviewCreate): Promise<Review> {
  return apiFetch<Review>(apiV1Path(`/reviews/?role=${role}`), {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function getReview(bookingId: string): Promise<Review> {
  return apiFetch<Review>(apiV1Path(`/reviews/${bookingId}`), {
    method: 'GET',
    auth: true,
  });
}
