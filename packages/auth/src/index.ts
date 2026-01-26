// Export auth configuration and helpers
export { authOptions, auth, getServerSession } from './auth';

// Export types from next-auth.d.ts
export type { AuthOptions, Account, Profile } from './next-auth';

// Re-export next-auth for convenience
export { default as NextAuth } from 'next-auth';

// Server-side helpers - re-export from next-auth
export { getServerSession as getSession } from 'next-auth/next';

// =========================================================
// PHONE AUTHENTICATION (For Mobile & Web)
// =========================================================
export {
    generateOTP,
    hashOTP,
    verifyOTPHash,
    validateNepalPhone,
    formatPhoneDisplay,
    TwilioSMSService,
    PhoneAuthService,
    type PhoneAuthConfig,
    type SendOTPResult,
    type VerifyOTPResult,
    type OTPData,
    type PhoneAuthStorageAdapter,
} from './phone-auth';