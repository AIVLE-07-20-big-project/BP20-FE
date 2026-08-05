export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 72;

export interface PasswordPolicyResult {
  length: boolean;
  characterGroups: boolean;
  noWhitespace: boolean;
  noTripleRepeat: boolean;
  valid: boolean;
}

export function evaluatePassword(password: string): PasswordPolicyResult {
  const groups = [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const length = password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
  const characterGroups = groups >= 3;
  const noWhitespace = !/\s/.test(password);
  const noTripleRepeat = !/(.)\1\1/.test(password);

  return {
    length,
    characterGroups,
    noWhitespace,
    noTripleRepeat,
    valid: length && characterGroups && noWhitespace && noTripleRepeat,
  };
}
