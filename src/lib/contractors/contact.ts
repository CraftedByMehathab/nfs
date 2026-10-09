export const NAME_MAX_LENGTH = 80;
export const EMAIL_MAX_LENGTH = 254;
export const PHONE_MAX_LENGTH = 40;

/** A loose check that catches typos, not a guarantee the address exists. */
export function looksLikeEmail(email: string): boolean {
  return email.length <= EMAIL_MAX_LENGTH && /^\S+@\S+\.\S+$/.test(email);
}
