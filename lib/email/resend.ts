import crypto from 'crypto'
import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY

if (!resendApiKey) {
  throw new Error('RESEND_API_KEY is not defined in environment variables')
}

const resend = new Resend(resendApiKey)

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  'http://localhost:3000'

export const EMAIL_FROM =
  process.env.EMAIL_FROM || 'RadPreps <admin@radpreps.com>'

export const REPLY_TO_ADMIN = process.env.REPLY_TO_ADMIN || 'admin@radpreps.com'

export const REPLY_TO_MARKETING =
  process.env.REPLY_TO_MARKETING || 'marketing@radpreps.com'

export function createToken() {
  // CHANGED: one-time tokens are generated with secure random bytes.
  return crypto.randomBytes(32).toString('hex')
}

export function hashToken(token: string) {
  // CHANGED: only the hash is stored in the database.
  return crypto.createHash('sha256').update(token).digest('hex')
}

type EmailBaseArgs = {
  to: string
  subject: string
  html: string
  replyTo?: string
}

async function sendEmail({ to, subject, html, replyTo }: EmailBaseArgs) {
  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    replyTo,
  })
}

type SendVerifyEmailArgs = {
  to: string
  token: string
  fullName?: string
}

type SendResetPasswordEmailArgs = {
  to: string
  token: string
  fullName?: string
}

type SendMarketingEmailArgs = {
  to: string
  subject: string
  html: string
}

export async function sendVerifyEmail({
  to,
  token,
  fullName,
}: SendVerifyEmailArgs) {
  const link = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`

  return sendEmail({
    to,
    subject: 'Verify your email address',
    replyTo: REPLY_TO_ADMIN,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6">
        <h2>Verify your email</h2>
        <p>${fullName ? `Hi ${fullName},` : 'Hi,'}</p>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="${link}">${link}</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  })
  // CHANGED: verification emails now use a monitored Reply-To inbox for user help.
}

export async function sendResetPasswordEmail({
  to,
  token,
  fullName,
}: SendResetPasswordEmailArgs) {
  const link = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`

  return sendEmail({
    to,
    subject: 'Reset your password',
    replyTo: REPLY_TO_ADMIN,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6">
        <h2>Reset your password</h2>
        <p>${fullName ? `Hi ${fullName},` : 'Hi,'}</p>
        <p>We received a request to reset your password. Click the link below:</p>
        <p><a href="${link}">${link}</a></p>
        <p>This link expires soon. If you did not request this, ignore this email.</p>
      </div>
    `,
  })
  // CHANGED: password reset emails also use a monitored Reply-To inbox.
}

export async function sendMarketingEmail({
  to,
  subject,
  html,
}: SendMarketingEmailArgs) {
  return sendEmail({
    to,
    subject,
    html,
    replyTo: REPLY_TO_MARKETING,
  })
  // CHANGED: marketing emails use a separate Reply-To so campaign replies are separated from support.
}
