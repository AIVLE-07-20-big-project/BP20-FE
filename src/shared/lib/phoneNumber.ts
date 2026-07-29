const NON_DIGIT_PATTERN = /\D/g;

export function normalizePhoneNumber(value: string | null | undefined) {
  return (value ?? "").replace(NON_DIGIT_PATTERN, "").slice(0, 11);
}

export function formatPhoneNumber(value: string | null | undefined) {
  const digits = normalizePhoneNumber(value);
  if (!digits) return "";

  if (digits.startsWith("02")) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    }
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function isValidPhoneNumber(value: string | null | undefined) {
  const digits = normalizePhoneNumber(value);
  if (!digits) return true;

  return /^(?:02\d{7,8}|0(?:1[016789]|3[1-3]|4[1-4]|5[1-5]|6[1-4]|70)\d{7,8})$/.test(digits);
}
