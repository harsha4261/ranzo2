export type RegistrationDraft = {
  name: string;
  phone: string;
  password: string;
  verification_id: string;
};

let draft: RegistrationDraft | null = null;

export function setRegistrationDraft(value: RegistrationDraft) {
  draft = value;
}

export function getRegistrationDraft() {
  return draft;
}

export function updateRegistrationVerificationId(verificationId: string) {
  if (draft) {
    draft = { ...draft, verification_id: verificationId };
  }
}

export function clearRegistrationDraft() {
  draft = null;
}
