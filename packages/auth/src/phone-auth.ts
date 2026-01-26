import crypto from "crypto";

// ============================================================================
// PHONE AUTHENTICATION CORE LOGIC
// ============================================================================

export interface PhoneAuthConfig {
    twilioAccountSid: string;
    twilioAuthToken: string;
    twilioPhoneNumber: string;
    otpLength?: number;
    otpExpiryMinutes?: number;
    maxAttempts?: number;
    isDevelopment?: boolean;
}

export interface SendOTPResult {
    success: boolean;
    message: string;
    expiresAt?: Date;
    messageId?: string;
}

export interface VerifyOTPResult {
    success: boolean;
    message: string;
    isNewUser?: boolean;
}

export interface OTPData {
    phone: string;
    code: string;
    hashedCode: string;
    expiresAt: Date;
    attempts: number;
    maxAttempts: number;
}

// ============================================================================
// OTP UTILITIES
// ============================================================================

/**
 * Generate a random OTP code
 */
export function generateOTP(length: number = 6): string {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
}

/**
 * Hash OTP for secure storage
 */
export function hashOTP(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
}

/**
 * Verify OTP against hashed value
 */
export function verifyOTPHash(otp: string, hashedOTP: string): boolean {
    const hashedInput = hashOTP(otp);
    return crypto.timingSafeEqual(
        Buffer.from(hashedInput),
        Buffer.from(hashedOTP)
    );
}

/**
 * Validate Nepal phone number format
 * Valid formats: 98XXXXXXXX, 97XXXXXXXX (10 digits)
 */
export function validateNepalPhone(phone: string): {
    isValid: boolean;
    normalized: string;
    error?: string;
} {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, "");

    // Handle various formats
    if (cleaned.startsWith("977")) {
        cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith("+977")) {
        cleaned = cleaned.substring(4);
    }

    // Check length
    if (cleaned.length !== 10) {
        return {
            isValid: false,
            normalized: "",
            error: "Phone number must be 10 digits",
        };
    }

    // Check valid prefixes (Nepal mobile)
    const validPrefixes = ["97", "98"];
    const prefix = cleaned.substring(0, 2);

    if (!validPrefixes.includes(prefix)) {
        return {
            isValid: false,
            normalized: "",
            error: "Invalid Nepal mobile number prefix",
        };
    }

    return {
        isValid: true,
        normalized: `+977${cleaned}`,
    };
}

/**
 * Format phone for display
 */
export function formatPhoneDisplay(phone: string): string {
    const validation = validateNepalPhone(phone);
    if (!validation.isValid) return phone;

    const cleaned = validation.normalized.replace("+977", "");
    return `+977 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
}

// ============================================================================
// TWILIO SMS SERVICE
// ============================================================================

export class TwilioSMSService {
    private accountSid: string;
    private authToken: string;
    private fromNumber: string;
    private isDevelopment: boolean;

    constructor(config: PhoneAuthConfig) {
        this.accountSid = config.twilioAccountSid;
        this.authToken = config.twilioAuthToken;
        this.fromNumber = config.twilioPhoneNumber;
        this.isDevelopment = config.isDevelopment ?? false;
    }

    async sendSMS(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
        // In development, just log the message
        if (this.isDevelopment) {
            console.log(`[DEV SMS] To: ${to}, Message: ${message}`);
            return { success: true, messageId: "dev-" + Date.now() };
        }

        try {
            const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: "Basic " + Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64"),
                },
                body: new URLSearchParams({
                    To: to,
                    From: this.fromNumber,
                    Body: message,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json() as { message?: string };
                console.error("Twilio error:", errorData);
                return { success: false, error: errorData.message || "Failed to send SMS" };
            }

            const result = await response.json() as { sid: string };
            return { 
                success: true, 
                messageId: result.sid 
            };
        } catch (error) {
            console.error("SMS sending error:", error);
            return { success: false, error: "Failed to send SMS" };
        }
    }

    async sendOTP(phone: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const message = `Your PrepSathi verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;
        return this.sendSMS(phone, message);
    }
}

// ============================================================================
// PHONE AUTH SERVICE (Core Logic)
// ============================================================================

export interface PhoneAuthStorageAdapter {
    saveOTP(data: OTPData): Promise<void>;
    getOTP(phone: string): Promise<OTPData | null>;
    deleteOTP(phone: string): Promise<void>;
    incrementAttempts(phone: string): Promise<number>;
    checkUserExists(phone: string): Promise<boolean>;
}

export class PhoneAuthService {
    private smsService: TwilioSMSService;
    private storage: PhoneAuthStorageAdapter;
    private otpLength: number;
    private otpExpiryMinutes: number;
    private maxAttempts: number;
    private isDevelopment: boolean;

    constructor(
        config: PhoneAuthConfig,
        storage: PhoneAuthStorageAdapter
    ) {
        this.smsService = new TwilioSMSService(config);
        this.storage = storage;
        this.otpLength = config.otpLength ?? 6;
        this.otpExpiryMinutes = config.otpExpiryMinutes ?? 5;
        this.maxAttempts = config.maxAttempts ?? 3;
        this.isDevelopment = config.isDevelopment ?? false;
    }

    /**
     * Send OTP to phone number
     */
    async sendOTP(phone: string): Promise<SendOTPResult> {
        // Validate phone number
        const validation = validateNepalPhone(phone);
        if (!validation.isValid) {
            return {
                success: false,
                message: validation.error || "Invalid phone number",
            };
        }

        const normalizedPhone = validation.normalized;

        // Check for existing unexpired OTP (rate limiting)
        const existingOTP = await this.storage.getOTP(normalizedPhone);
        if (existingOTP && existingOTP.expiresAt > new Date()) {
            const remainingSeconds = Math.ceil(
                (existingOTP.expiresAt.getTime() - Date.now()) / 1000
            );
            
            // Allow resend only after 30 seconds
            if (remainingSeconds > (this.otpExpiryMinutes * 60 - 30)) {
                return {
                    success: false,
                    message: `Please wait ${30 - (this.otpExpiryMinutes * 60 - remainingSeconds)} seconds before requesting a new code`,
                };
            }
        }

        // Generate OTP
        const otp = generateOTP(this.otpLength);
        const hashedOTP = hashOTP(otp);
        const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);

        // Store OTP
        await this.storage.saveOTP({
            phone: normalizedPhone,
            code: otp, // Only stored in dev mode for testing
            hashedCode: hashedOTP,
            expiresAt,
            attempts: 0,
            maxAttempts: this.maxAttempts,
        });

        // Send SMS
        const smsResult = await this.smsService.sendOTP(normalizedPhone, otp);

        if (!smsResult.success) {
            return {
                success: false,
                message: smsResult.error || "Failed to send OTP",
            };
        }

        // Log OTP in development
        if (this.isDevelopment) {
            console.log(`[DEV] OTP for ${normalizedPhone}: ${otp}`);
        }

        return {
            success: true,
            message: "OTP sent successfully",
            expiresAt,
            messageId: smsResult.messageId,
        };
    }

    /**
     * Verify OTP
     */
    async verifyOTP(phone: string, code: string): Promise<VerifyOTPResult> {
        // Validate phone
        const validation = validateNepalPhone(phone);
        if (!validation.isValid) {
            return {
                success: false,
                message: validation.error || "Invalid phone number",
            };
        }

        const normalizedPhone = validation.normalized;

        // Get stored OTP
        const storedOTP = await this.storage.getOTP(normalizedPhone);

        if (!storedOTP) {
            return {
                success: false,
                message: "No OTP found. Please request a new code.",
            };
        }

        // Check expiry
        if (storedOTP.expiresAt < new Date()) {
            await this.storage.deleteOTP(normalizedPhone);
            return {
                success: false,
                message: "OTP has expired. Please request a new code.",
            };
        }

        // Check attempts
        if (storedOTP.attempts >= storedOTP.maxAttempts) {
            await this.storage.deleteOTP(normalizedPhone);
            return {
                success: false,
                message: "Too many failed attempts. Please request a new code.",
            };
        }

        // Verify OTP
        const isValid = verifyOTPHash(code, storedOTP.hashedCode);

        if (!isValid) {
            await this.storage.incrementAttempts(normalizedPhone);
            const remainingAttempts = storedOTP.maxAttempts - storedOTP.attempts - 1;
            return {
                success: false,
                message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
            };
        }

        // OTP is valid - clean up
        await this.storage.deleteOTP(normalizedPhone);

        // Check if user exists
        const userExists = await this.storage.checkUserExists(normalizedPhone);

        return {
            success: true,
            message: "OTP verified successfully",
            isNewUser: !userExists,
        };
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    generateOTP,
    hashOTP,
    verifyOTPHash,
    validateNepalPhone,
    formatPhoneDisplay,
    TwilioSMSService,
    PhoneAuthService,
};
