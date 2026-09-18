import { config } from '../config/index.js';

export interface SendVerificationEmailParams {
  to: string;
  name?: string;
  token: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Builds a professional HTML email matching FocusTube's dark/indigo aesthetic.
 */
function buildVerificationEmailHtml(params: {
  name?: string;
  verificationUrl: string;
}): string {
  const { name, verificationUrl } = params;
  const greeting = name ? `Hello ${name},` : 'Hello,';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your FocusTube email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060913; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #060913; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #0B101E; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <div style="display: inline-block;">
                <span style="font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                  Focus<span style="color: #818cf8;">Tube</span>
                </span>
              </div>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #94a3b8;">Distraction-Free Learning</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #ffffff;">
                Verify your email address
              </h1>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #cbd5e1;">
                ${greeting}
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #cbd5e1;">
                Welcome to FocusTube! Please verify your email address to activate your account and start your focused learning journey.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 36px; border-radius: 10px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); text-align: center;">
                      Verify Email
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiration Notice -->
              <div style="background-color: #070B14; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; padding: 14px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                  ⏱ <strong>Note:</strong> This verification link will expire in <strong>30 minutes</strong>.
                </p>
              </div>

              <!-- Fallback Link -->
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
                If the button above does not work, copy and paste this URL into your browser:
              </p>
              <p style="margin: 0 0 24px 0; font-size: 12px; word-break: break-all; color: #818cf8;">
                <a href="${verificationUrl}" style="color: #818cf8; text-decoration: underline;">${verificationUrl}</a>
              </p>

              <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.06); margin: 24px 0;">

              <!-- Safe Ignore Notice -->
              <p style="margin: 0 0 16px 0; font-size: 12px; line-height: 18px; color: #64748b;">
                If you did not create an account on FocusTube, you can safely ignore this email.
              </p>

              <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                Regards,<br>
                <strong style="color: #cbd5e1;">FocusTube Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #070B14; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.06);">
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                &copy; ${new Date().getFullYear()} FocusTube. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Builds plain text alternative for email clients that do not support HTML.
 */
function buildVerificationEmailText(params: {
  name?: string;
  verificationUrl: string;
}): string {
  const { name, verificationUrl } = params;
  const greeting = name ? `Hello ${name},` : 'Hello,';

  return `
${greeting}

Welcome to FocusTube!

Please verify your email address by clicking the link below:
${verificationUrl}

This verification link will expire after 30 minutes.

If you did not create an account on FocusTube, you can safely ignore this email.

Regards,
FocusTube Team
  `.trim();
}

/**
 * Sends a verification email using the Resend REST API.
 */
export const sendVerificationEmail = async (
  params: SendVerificationEmailParams
): Promise<SendEmailResult> => {
  const { to, name, token } = params;
  const baseUrl = config.frontendUrl.replace(/\/$/, '');
  const verificationUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;

  // If Resend API Key is not configured (e.g. initial setup / test), log cleanly and return simulated success
  if (!config.resend.apiKey) {
    console.warn(
      `[Resend Notice] RESEND_API_KEY is not configured in environment. Verification email was not sent via network.`
    );
    console.log(
      `[Resend Simulated Email] Target: ${to} | Verification Link: ${verificationUrl}`
    );
    return {
      success: true,
      simulated: true,
    };
  }

  const html = buildVerificationEmailHtml({ name, verificationUrl });
  const text = buildVerificationEmailText({ name, verificationUrl });

  try {
    const fromAddress = `${config.resend.fromName} <${config.resend.fromEmail}>`;

    console.log(`[Resend Request] Verification email request sent to Resend for: ${to}`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resend.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject: 'Verify your FocusTube email',
        html,
        text,
      }),
    });

    const data = (await response.json()) as { id?: string; message?: string; name?: string; statusCode?: number };

    if (!response.ok) {
      const errorMsg = data?.message || `Resend API returned status ${response.status}`;
      console.error('[Resend Error Details]', {
        status: response.status,
        name: data?.name,
        message: errorMsg,
        recipient: to,
      });

      if (errorMsg.includes('testing emails to your own email address')) {
        console.warn(
          `[Resend Notice] Sender 'onboarding@resend.dev' is a sandbox domain that can only send to your Resend account owner's email address. To send to any student/user email, verify a domain in Resend (resend.com/domains).`
        );
      }

      return {
        success: false,
        error: errorMsg,
      };
    }

    console.log(`[Resend Success] Resend message ID: ${data.id}`);
    return {
      success: true,
      id: data.id,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown network error';
    console.error('[Resend Exception] Failed to send email:', errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
};

export interface SendPasswordResetEmailParams {
  to: string;
  name?: string;
  token: string;
}

/**
 * Builds a professional HTML password reset email matching FocusTube's dark/indigo aesthetic.
 */
function buildPasswordResetEmailHtml(params: {
  name?: string;
  resetUrl: string;
}): string {
  const { name, resetUrl } = params;
  const greeting = name ? `Hello ${name},` : 'Hello,';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your FocusTube password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060913; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #060913; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #0B101E; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <div style="display: inline-block;">
                <span style="font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                  Focus<span style="color: #818cf8;">Tube</span>
                </span>
              </div>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #94a3b8;">Distraction-Free Learning</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #ffffff;">
                Reset your password
              </h1>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #cbd5e1;">
                ${greeting}
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #cbd5e1;">
                We received a request to reset your password for your FocusTube account. Click the button below to choose a new password.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 36px; border-radius: 10px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); text-align: center;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiration Notice -->
              <div style="background-color: #070B14; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; padding: 14px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                  ⏱ <strong>Note:</strong> This password reset link will expire in <strong>30 minutes</strong>.
                </p>
              </div>

              <!-- Fallback Link -->
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
                If the button above does not work, copy and paste this URL into your browser:
              </p>
              <p style="margin: 0 0 24px 0; font-size: 12px; word-break: break-all; color: #818cf8;">
                <a href="${resetUrl}" style="color: #818cf8; text-decoration: underline;">${resetUrl}</a>
              </p>

              <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.06); margin: 24px 0;">

              <!-- Safe Ignore Notice -->
              <p style="margin: 0 0 16px 0; font-size: 12px; line-height: 18px; color: #64748b;">
                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>

              <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                Regards,<br>
                <strong style="color: #cbd5e1;">FocusTube Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #070B14; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.06);">
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                &copy; ${new Date().getFullYear()} FocusTube. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Builds plain text alternative for password reset.
 */
function buildPasswordResetEmailText(params: {
  name?: string;
  resetUrl: string;
}): string {
  const { name, resetUrl } = params;
  const greeting = name ? `Hello ${name},` : 'Hello,';

  return `
${greeting}

We received a request to reset your password for your FocusTube account.

Please click the link below to set a new password:
${resetUrl}

This password reset link will expire after 30 minutes.

If you did not request this, you can safely ignore this email. Your password will not change.

Regards,
FocusTube Team
  `.trim();
}

/**
 * Sends a password reset email using the Resend REST API.
 */
export const sendPasswordResetEmail = async (
  params: SendPasswordResetEmailParams
): Promise<SendEmailResult> => {
  const { to, name, token } = params;
  const baseUrl = config.frontendUrl.replace(/\/$/, '');
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

  // If Resend API Key is not configured (e.g. initial setup / test), log cleanly and return simulated success
  if (!config.resend.apiKey) {
    console.warn(
      `[Resend Notice] RESEND_API_KEY is not configured in environment. Password reset email was not sent via network.`
    );
    console.log(
      `[Resend Simulated Reset Email] Target: ${to} | Reset Link: ${resetUrl}`
    );
    return {
      success: true,
      simulated: true,
    };
  }

  const html = buildPasswordResetEmailHtml({ name, resetUrl });
  const text = buildPasswordResetEmailText({ name, resetUrl });

  try {
    const fromAddress = `${config.resend.fromName} <${config.resend.fromEmail}>`;

    console.log(`[Resend Request] Password reset email request sent to Resend for: ${to}`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resend.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject: 'Reset your FocusTube password',
        html,
        text,
      }),
    });

    const data = (await response.json()) as { id?: string; message?: string; name?: string; statusCode?: number };

    if (!response.ok) {
      const errorMsg = data?.message || `Resend API returned status ${response.status}`;
      console.error('[Resend Error Details]', {
        status: response.status,
        name: data?.name,
        message: errorMsg,
        recipient: to,
      });

      if (errorMsg.includes('testing emails to your own email address')) {
        console.warn(
          `[Resend Notice] Sender 'onboarding@resend.dev' is a sandbox domain that can only send to your Resend account owner's email address. To send to any student/user email, verify a domain in Resend (resend.com/domains).`
        );
      }

      return {
        success: false,
        error: errorMsg,
      };
    }

    console.log(`[Resend Success] Resend message ID: ${data.id}`);
    return {
      success: true,
      id: data.id,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown network error';
    console.error('[Resend Exception] Failed to send password reset email:', errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
};


