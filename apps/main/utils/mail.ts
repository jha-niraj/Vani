import { Resend } from "resend";

type EmailType = "WELCOME" | "VERIFY_OTP";

interface SendEmailProps {
    name?: string;
    email: string;
    emailType: EmailType;
    otp?: string;
}

// Lazy initialization to avoid "Missing API key" error during build
let resendInstance: Resend | null = null;

function getResend(): Resend {
    if (!resendInstance) {
        if (!process.env.RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY environment variable is not set");
        }
        resendInstance = new Resend(process.env.RESEND_API_KEY);
    }
    return resendInstance;
}

const welcomeEmailTemplate = (name: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Vani</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; color: #1a1a2e; background-color: #f0f0f5;
        }
        .container {
            max-width: 560px; margin: 24px auto; background: #ffffff;
            border-radius: 16px; overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }
        .header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
            padding: 48px 32px; text-align: center; color: white;
        }
        .logo { font-size: 32px; font-weight: 700; letter-spacing: -1px; }
        .tagline { font-size: 14px; opacity: 0.85; margin-top: 6px; letter-spacing: 0.5px; }
        .content { padding: 40px 32px; }
        .greeting { font-size: 22px; font-weight: 600; color: #1a1a2e; margin-bottom: 16px; }
        .message { font-size: 15px; color: #64748b; line-height: 1.7; margin-bottom: 28px; }
        .features {
            background: #f8f7ff; padding: 24px; margin: 24px 0; border-radius: 12px;
            border: 1px solid #e8e5ff;
        }
        .features h3 { font-size: 14px; font-weight: 600; color: #6366f1; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
        .feature { display: flex; align-items: center; margin-bottom: 12px; font-size: 14px; color: #374151; }
        .feature-dot { width: 6px; height: 6px; border-radius: 50%; background: #6366f1; margin-right: 12px; flex-shrink: 0; }
        .cta-btn {
            display: inline-block;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white; padding: 14px 32px; text-decoration: none;
            border-radius: 10px; font-weight: 600; font-size: 15px;
        }
        .footer {
            padding: 24px 32px; text-align: center; color: #94a3b8;
            font-size: 13px; border-top: 1px solid #f1f5f9;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎙️ Vani</div>
            <div class="tagline">Voice-First Workspace</div>
        </div>
        <div class="content">
            <div class="greeting">Welcome, ${name}! 🎉</div>
            <div class="message">
                You're now part of Vani — a workspace that turns your voice into structured notes, summaries, and actionable tasks. No more typing, just speak and let AI do the rest.
            </div>
            <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL}/home" class="cta-btn">Open Your Workspace</a>
            </div>
            <div class="features">
                <h3>What you can do</h3>
                <div class="feature"><div class="feature-dot"></div><span>Record voice notes in any Indian language</span></div>
                <div class="feature"><div class="feature-dot"></div><span>Get instant transcription powered by Sarvam AI</span></div>
                <div class="feature"><div class="feature-dot"></div><span>Auto-extract tasks and to-dos from recordings</span></div>
                <div class="feature"><div class="feature-dot"></div><span>Ask AI questions about your past recordings</span></div>
            </div>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Vani · Built by Shunya Tech</p>
        </div>
    </div>
</body>
</html>
`;

const verifyOTPTemplate = (name: string, otp: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Vani Login Code</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; color: #1a1a2e; background-color: #f0f0f5;
        }
        .container {
            max-width: 560px; margin: 24px auto; background: #ffffff;
            border-radius: 16px; overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }
        .header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
            padding: 40px 32px; text-align: center; color: white;
        }
        .logo { font-size: 28px; font-weight: 700; letter-spacing: -1px; }
        .tagline { font-size: 14px; opacity: 0.85; margin-top: 4px; }
        .content { padding: 40px 32px; }
        .title { font-size: 22px; font-weight: 600; color: #1a1a2e; margin-bottom: 12px; text-align: center; }
        .message { font-size: 15px; color: #64748b; line-height: 1.7; text-align: center; margin-bottom: 24px; }
        .otp-box {
            background: linear-gradient(135deg, #f8f7ff 0%, #f0eeff 100%);
            border: 2px dashed #6366f1; border-radius: 16px;
            padding: 32px; text-align: center; margin: 28px 0;
        }
        .otp-code {
            font-size: 40px; font-weight: 700; color: #6366f1;
            letter-spacing: 10px; font-family: 'Courier New', monospace;
        }
        .otp-label { font-size: 13px; color: #94a3b8; margin-top: 8px; font-weight: 500; }
        .warning {
            background: #fffbeb; border-left: 3px solid #f59e0b;
            padding: 14px 16px; margin: 20px 0; border-radius: 0 8px 8px 0;
        }
        .warning p { font-size: 13px; color: #92400e; }
        .footer {
            padding: 24px 32px; text-align: center; color: #94a3b8;
            font-size: 13px; border-top: 1px solid #f1f5f9;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎙️ Vani</div>
            <div class="tagline">Secure Login</div>
        </div>
        <div class="content">
            <div class="title">Your Login Code</div>
            <p class="message">
                Hello ${name || "there"}! Use the code below to sign in to your Vani workspace.
            </p>
            <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <div class="otp-label">6-digit verification code</div>
            </div>
            <div class="warning">
                <p><strong>Heads up:</strong> This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.</p>
            </div>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Vani · Built by Shunya Tech</p>
        </div>
    </div>
</body>
</html>
`;

interface EmailOptions {
    from: string;
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async ({ name, email, emailType, otp }: SendEmailProps) => {
    const fromEmail = process.env.AUTH_FROM_EMAIL || "Vani <noreply@coderzai.xyz>";

    try {
        let emailOptions: EmailOptions;

        switch (emailType) {
            case "WELCOME":
                emailOptions = {
                    from: fromEmail,
                    to: email,
                    subject: "Welcome to Vani 🎙️",
                    html: welcomeEmailTemplate(name || "there"),
                };
                break;

            case "VERIFY_OTP":
                if (!otp) throw new Error("OTP is required for VERIFY_OTP email.");
                emailOptions = {
                    from: fromEmail,
                    to: email,
                    subject: `${otp} — Your Vani login code`,
                    html: verifyOTPTemplate(name || "there", otp),
                };
                break;

            default:
                throw new Error(`Unknown email type: ${emailType}`);
        }

        const result = await getResend().emails.send(emailOptions);
        console.log("✓ Email sent:", emailType, email);
        return result;
    } catch (error: unknown) {
        console.error("✗ Email send failed:", error);
        throw error;
    }
};