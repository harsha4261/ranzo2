/** Holds `verification_id` between login OTP request and verify (existing users). */
let verificationId: string | null = null;
let phone: string | null = null;

export function setOtpLoginDraft(nextPhone: string, nextVerificationId: string) {
  phone = nextPhone;
  verificationId = nextVerificationId;
}

export function getOtpLoginDraft() {
  if (!phone || !verificationId) return null;
  return { phone, verification_id: verificationId };
}

export function clearOtpLoginDraft() {
  phone = null;
  verificationId = null;
}
