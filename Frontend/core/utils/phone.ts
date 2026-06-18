/** Indian mobile: leading 6–9, then 9 more digits. */
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export function digitsOnlyPhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

export function formatIndianMobile(digits: string): string {
  const d = digitsOnlyPhone(digits);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)} ${d.slice(5)}`;
}

export function isValidIndianMobile(digits: string): boolean {
  return INDIAN_MOBILE_REGEX.test(digitsOnlyPhone(digits));
}
