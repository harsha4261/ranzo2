export const LEGAL_URLS = {
  terms: 'https://ranzo.in/terms',
  privacy: 'https://ranzo.in/privacy',
} as const;

export type LegalDoc = keyof typeof LEGAL_URLS;
