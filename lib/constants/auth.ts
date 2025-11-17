/**
 * Authentication error codes
 */
export const AuthError = {
  CONFIGURATION: 'Configuration',
  ACCESS_DENIED: 'AccessDenied',
} as const;

export type AuthErrorCode = typeof AuthError[keyof typeof AuthError];
