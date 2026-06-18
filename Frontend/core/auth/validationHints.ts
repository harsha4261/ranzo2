import { t } from '@/core/i18n';
import { digitsOnlyPhone, isValidIndianMobile } from '@/core/utils/phone';
import { getPasswordChecks } from '@/core/utils/password';
import type { ValidationCheckItem } from '@/core/widgets/ValidationChecklist';

export function phoneValidationItems(phone: string): ValidationCheckItem[] {
  const digits = digitsOnlyPhone(phone);
  return [
    {
      id: 'len',
      label: t('auth.phoneRuleLength'),
      met: digits.length === 10,
    },
    {
      id: 'start',
      label: t('auth.phoneRuleStart'),
      met: digits.length === 0 || /^[6-9]/.test(digits),
    },
  ];
}

export function passwordValidationItems(password: string): ValidationCheckItem[] {
  const c = getPasswordChecks(password);
  return [
    { id: 'len', label: t('auth.pwdRuleLength'), met: c.minLength },
    { id: 'upper', label: t('auth.pwdRuleUpper'), met: c.hasUpper },
    { id: 'lower', label: t('auth.pwdRuleLower'), met: c.hasLower },
    { id: 'digit', label: t('auth.pwdRuleDigit'), met: c.hasDigit },
  ];
}

export function confirmPasswordItem(
  password: string,
  confirm: string
): ValidationCheckItem {
  return {
    id: 'match',
    label: t('auth.pwdRuleMatch'),
    met: confirm.length > 0 && password === confirm,
  };
}

export function isRegisterFormValid(
  name: string,
  phone: string,
  password: string,
  confirmPassword: string
): boolean {
  const pwd = getPasswordChecks(password);
  return (
    name.trim().length >= 2 &&
    isValidIndianMobile(phone) &&
    pwd.minLength &&
    pwd.hasUpper &&
    pwd.hasLower &&
    pwd.hasDigit &&
    password === confirmPassword &&
    confirmPassword.length > 0
  );
}
